using System.Buffers.Binary;
using System.IO.Compression;
using System.Text.Json.Nodes;
using System.Text;

namespace JamulaValidation;

public static class PreviewArtifactValidator
{
    public const long MaxBytes = 100L * 1024 * 1024;
    public const int MaxFiles = 20_000;
    private const int MaxPathSegments = 100_000;
    private static readonly uint[] Crc32Table = BuildCrc32Table();

    public static void ExtractPreview(string archivePath, string destinationPath, string trustedConfigPath)
    {
        var destination = Path.GetFullPath(destinationPath);
        ValidateDestination(destination);

        var archiveInfo = new FileInfo(archivePath);
        if (archiveInfo.Length > MaxBytes)
        {
            throw new InvalidDataException("The compressed preview artifact exceeds the size limit.");
        }

        var expectedConfig = JsonNode.Parse(File.ReadAllText(trustedConfigPath));
        var archiveBytes = File.ReadAllBytes(archivePath);
        var encryptedEntries = ReadEncryptedEntryFlags(archiveBytes);
        using var file = new MemoryStream(archiveBytes, writable: false);
        using var bundle = new ZipArchive(file, ZipArchiveMode.Read);
        var entries = bundle.Entries;
        if (entries.Count == 0 || entries.Count > MaxFiles)
        {
            throw new InvalidDataException("The preview artifact has an invalid file count.");
        }
        if (encryptedEntries.Count != entries.Count || encryptedEntries.Any(metadata => metadata.IsEncrypted))
        {
            throw new InvalidDataException("Encrypted or non-regular artifact entries are not supported.");
        }

        long expandedSize = 0;
        foreach (var entry in entries)
        {
            expandedSize = checked(expandedSize + entry.Length);
        }

        if (expandedSize > MaxBytes)
        {
            throw new InvalidDataException("The expanded preview artifact exceeds the size limit.");
        }

        var seen = new HashSet<string>(StringComparer.Ordinal);
        var files = new List<(ZipArchiveEntry Entry, string RelativePath)>();
        var kinds = new Dictionary<string, bool>(StringComparer.Ordinal);
        var totalPathSegments = 0;
        foreach (var entry in entries)
        {
            var name = entry.FullName;
            var isDirectory = name.EndsWith("/", StringComparison.Ordinal);
            ValidateEntryPath(name, isDirectory, ref totalPathSegments);
            var relativePath = isDirectory ? name[..^1] : name;
            var collisionKey = CaseFold(relativePath);
            if (!seen.Add(collisionKey))
            {
                throw new InvalidDataException($"Unsafe or duplicated artifact path: '{name}'");
            }

            var mode = (uint)entry.ExternalAttributes >> 16;
            var kind = mode & 0xF000;
            if ((kind != 0 && kind != 0x8000 && kind != 0x4000) ||
                (kind == 0x4000 && !isDirectory) ||
                (kind == 0x8000 && isDirectory))
            {
                throw new InvalidDataException($"Encrypted or non-regular artifact entry: '{name}'");
            }

            kinds.Add(collisionKey, isDirectory);
            if (!isDirectory)
            {
                files.Add((entry, relativePath));
            }
        }

        ValidateTree(kinds);
        var required = new HashSet<string>(StringComparer.Ordinal)
        {
            "index.html", "404.html", "robots.txt", "staticwebapp.config.json"
        };
        var names = files.Select(file => file.RelativePath).ToHashSet(StringComparer.Ordinal);
        if (!required.IsSubsetOf(names))
        {
            throw new InvalidDataException("The preview artifact is missing required static files.");
        }

        // Opening and consuming every entry detects unsupported encryption and corrupt data before any writes.
        long validatedExpandedSize = 0;
        for (var entryIndex = 0; entryIndex < entries.Count; entryIndex++)
        {
            var entry = entries[entryIndex];
            using var input = entry.Open();
            var buffer = new byte[64 * 1024];
            long entrySize = 0;
            var entryCrc = uint.MaxValue;
            int read;
            while ((read = input.Read(buffer, 0, buffer.Length)) != 0)
            {
                entrySize = checked(entrySize + read);
                validatedExpandedSize = checked(validatedExpandedSize + read);
                entryCrc = UpdateCrc32(entryCrc, buffer, read);
                if (validatedExpandedSize > MaxBytes)
                {
                    throw new InvalidDataException("The expanded preview artifact exceeds the size limit.");
                }
            }

            if (entrySize != entry.Length || ~entryCrc != encryptedEntries[entryIndex].Crc32)
            {
                throw new InvalidDataException("The preview artifact contains an entry with invalid size or checksum.");
            }
        }

        var configEntry = files.Single(file => file.RelativePath == "staticwebapp.config.json").Entry;
        using (var configStream = configEntry.Open())
        {
            var document = JsonNode.Parse(configStream);
            if (!JsonNode.DeepEquals(document, expectedConfig))
            {
                throw new InvalidDataException("Preview configuration differs from the trusted default branch.");
            }
        }

        if (!Directory.Exists(destination))
        {
            Directory.CreateDirectory(destination);
        }

        foreach (var (entry, relativePath) in files)
        {
            var target = Path.GetFullPath(Path.Combine(destination, relativePath.Replace('/', Path.DirectorySeparatorChar)));
            var destinationPrefix = destination.EndsWith(Path.DirectorySeparatorChar)
                ? destination
                : destination + Path.DirectorySeparatorChar;
            if (!target.StartsWith(destinationPrefix, OperatingSystem.IsWindows() ? StringComparison.OrdinalIgnoreCase : StringComparison.Ordinal))
            {
                throw new InvalidDataException($"Unsafe or duplicated artifact path: '{relativePath}'");
            }

            Directory.CreateDirectory(Path.GetDirectoryName(target)!);
            using var input = entry.Open();
            using var output = new FileStream(target, FileMode.CreateNew, FileAccess.Write, FileShare.None);
            input.CopyTo(output);
        }
    }

    private static void ValidateDestination(string destination)
    {
        var directory = new DirectoryInfo(destination);
        if (directory.LinkTarget is not null ||
            (directory.Exists && directory.Attributes.HasFlag(FileAttributes.ReparsePoint)))
        {
            throw new InvalidDataException("The extraction destination must be empty and not a symlink.");
        }

        if (File.Exists(destination))
        {
            throw new InvalidDataException("The extraction destination must be empty and not a symlink.");
        }

        if (directory.Exists && Directory.EnumerateFileSystemEntries(destination).Any())
        {
            throw new InvalidDataException("The extraction destination must be empty and not a symlink.");
        }
    }

    private static void ValidateEntryPath(string name, bool isDirectory, ref int totalPathSegments)
    {
        if (string.IsNullOrEmpty(name) || name.Contains('\\') || name.Contains(':') ||
            name.Any(character => character < 32) || name.StartsWith("/", StringComparison.Ordinal) ||
            name.Contains("//", StringComparison.Ordinal))
        {
            throw new InvalidDataException($"Unsafe or duplicated artifact path: '{name}'");
        }

        var path = isDirectory ? name[..^1] : name;
        if (path.Length == 0)
        {
            throw new InvalidDataException($"Unsafe or duplicated artifact path: '{name}'");
        }

        var segmentStart = 0;
        for (var index = 0; index <= path.Length; index++)
        {
            if (index < path.Length && path[index] != '/')
            {
                continue;
            }

            if (++totalPathSegments > MaxPathSegments)
            {
                throw new InvalidDataException("The preview artifact exceeds the path segment limit.");
            }

            var segmentLength = index - segmentStart;
            if ((segmentLength == 1 && path[segmentStart] == '.') ||
                (segmentLength == 2 && path[segmentStart] == '.' && path[segmentStart + 1] == '.'))
            {
                throw new InvalidDataException($"Unsafe or duplicated artifact path: '{name}'");
            }

            segmentStart = index + 1;
        }
    }

    private static void ValidateTree(IReadOnlyDictionary<string, bool> kinds)
    {
        var root = new PathNode();
        foreach (var (path, isDirectory) in kinds)
        {
            var current = root;
            var segmentStart = 0;
            while (true)
            {
                if (current.IsDirectory == false)
                {
                    throw new InvalidDataException($"Unsafe or duplicated artifact path: '{path}'");
                }

                var separator = path.IndexOf('/', segmentStart);
                var segmentEnd = separator < 0 ? path.Length : separator;
                var segment = path[segmentStart..segmentEnd];
                current.Children ??= new Dictionary<string, PathNode>(StringComparer.Ordinal);
                if (!current.Children.TryGetValue(segment, out var child))
                {
                    child = new PathNode();
                    current.Children.Add(segment, child);
                }

                current = child;
                if (separator < 0)
                {
                    break;
                }

                segmentStart = separator + 1;
            }

            if (!isDirectory && current.Children is { Count: > 0 })
            {
                throw new InvalidDataException($"Unsafe or duplicated artifact path: '{path}'");
            }

            current.IsDirectory = isDirectory;
        }
    }

    private static string CaseFold(string value) =>
        value.Normalize(NormalizationForm.FormKC).ToUpperInvariant()
            .Replace("ẞ", "SS", StringComparison.Ordinal)
            .Replace("ß", "SS", StringComparison.Ordinal)
            .Replace("ς", "Σ", StringComparison.Ordinal);

    private static IReadOnlyList<ZipEntryMetadata> ReadEncryptedEntryFlags(byte[] bytes)
    {
        var endRecord = -1;
        var minimum = Math.Max(0, bytes.Length - 22 - ushort.MaxValue);
        for (var index = bytes.Length - 22; index >= minimum; index--)
        {
            if (BinaryPrimitives.ReadUInt32LittleEndian(bytes.AsSpan(index, 4)) == 0x06054b50 &&
                index + 22 + BinaryPrimitives.ReadUInt16LittleEndian(bytes.AsSpan(index + 20, 2)) == bytes.Length)
            {
                endRecord = index;
                break;
            }
        }

        if (endRecord < 0 ||
            BinaryPrimitives.ReadUInt16LittleEndian(bytes.AsSpan(endRecord + 4, 2)) != 0 ||
            BinaryPrimitives.ReadUInt16LittleEndian(bytes.AsSpan(endRecord + 6, 2)) != 0)
        {
            throw new InvalidDataException("The preview artifact has an invalid ZIP directory.");
        }

        var entriesOnDisk = BinaryPrimitives.ReadUInt16LittleEndian(bytes.AsSpan(endRecord + 8, 2));
        var entriesTotal = BinaryPrimitives.ReadUInt16LittleEndian(bytes.AsSpan(endRecord + 10, 2));
        var centralSize = BinaryPrimitives.ReadUInt32LittleEndian(bytes.AsSpan(endRecord + 12, 4));
        var centralOffset = BinaryPrimitives.ReadUInt32LittleEndian(bytes.AsSpan(endRecord + 16, 4));
        if (entriesOnDisk != entriesTotal || entriesTotal == ushort.MaxValue ||
            centralOffset == uint.MaxValue || centralSize == uint.MaxValue ||
            (ulong)centralOffset + centralSize > (ulong)endRecord)
        {
            throw new InvalidDataException("The preview artifact has an invalid ZIP directory.");
        }

        var metadata = new List<ZipEntryMetadata>(entriesTotal);
        var position = (int)centralOffset;
        var centralEnd = checked(position + (int)centralSize);
        for (var entryIndex = 0; entryIndex < entriesTotal; entryIndex++)
        {
            if (position + 46 > centralEnd ||
                BinaryPrimitives.ReadUInt32LittleEndian(bytes.AsSpan(position, 4)) != 0x02014b50)
            {
                throw new InvalidDataException("The preview artifact has an invalid ZIP directory.");
            }

            var generalPurposeFlags = BinaryPrimitives.ReadUInt16LittleEndian(bytes.AsSpan(position + 8, 2));
            var crc32 = BinaryPrimitives.ReadUInt32LittleEndian(bytes.AsSpan(position + 16, 4));
            metadata.Add(new ZipEntryMetadata((generalPurposeFlags & 1) != 0, crc32));
            var filenameLength = BinaryPrimitives.ReadUInt16LittleEndian(bytes.AsSpan(position + 28, 2));
            var extraLength = BinaryPrimitives.ReadUInt16LittleEndian(bytes.AsSpan(position + 30, 2));
            var commentLength = BinaryPrimitives.ReadUInt16LittleEndian(bytes.AsSpan(position + 32, 2));
            position = checked(position + 46 + filenameLength + extraLength + commentLength);
            if (position > centralEnd)
            {
                throw new InvalidDataException("The preview artifact has an invalid ZIP directory.");
            }
        }

        if (position != centralEnd)
        {
            throw new InvalidDataException("The preview artifact has an invalid ZIP directory.");
        }
        return metadata;
    }

    private static uint[] BuildCrc32Table()
    {
        var table = new uint[256];
        for (var index = 0; index < table.Length; index++)
        {
            var value = (uint)index;
            for (var bit = 0; bit < 8; bit++)
            {
                value = (value & 1) != 0 ? 0xEDB88320 ^ (value >> 1) : value >> 1;
            }
            table[index] = value;
        }
        return table;
    }

    private static uint UpdateCrc32(uint crc, byte[] buffer, int count)
    {
        for (var index = 0; index < count; index++)
        {
            crc = Crc32Table[(int)((crc ^ buffer[index]) & 0xFF)] ^ (crc >> 8);
        }
        return crc;
    }

    private sealed class PathNode
    {
        public Dictionary<string, PathNode>? Children { get; set; }
        public bool? IsDirectory { get; set; }
    }

    private readonly record struct ZipEntryMetadata(bool IsEncrypted, uint Crc32);
}
