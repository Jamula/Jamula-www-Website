using System.Text.RegularExpressions;

namespace JamulaMcp;

public sealed record CorpusEntry(
    string Id,
    string Title,
    string CanonicalUrl,
    string PublishedDate,
    string Summary,
    string Body);

public sealed record CorpusMatch(
    string Id,
    string Title,
    string CanonicalUrl,
    string Excerpt,
    int Score);

public sealed class PublicCorpus
{
    public const int MaxFileBytes = 256 * 1024;
    public const int MaxQueryLength = 256;
    public const int MaxExcerptLength = 280;

    private static readonly Regex SafeSlug = new(@"^[a-z0-9-]+$", RegexOptions.Compiled);
    private static readonly Regex WordTokenizer = new(@"[a-z0-9]{2,}", RegexOptions.Compiled);

    private static readonly CorpusEntry BaselineOverview = new(
        Id: "overview",
        Title: "Jamula — AI Strategy, Custom Software & Cloud Consulting",
        CanonicalUrl: "https://jamula.net/",
        PublishedDate: "2026-11-02",
        Summary: "Jamula, Inc. works across AI strategy, custom software, and cloud consulting in a single engagement.",
        Body: "Organizations exploring AI often receive advice that stops before it reaches their systems. "
            + "Jamula works across AI strategy, custom software, and cloud infrastructure in a single engagement, "
            + "so what we recommend is also what we build and run. Founded by Cyrus Jamula. "
            + "Direct inquiry: spam@jamula.net.");

    public IReadOnlyList<CorpusEntry> Entries { get; }

    public PublicCorpus(IEnumerable<CorpusEntry> entries)
    {
        ArgumentNullException.ThrowIfNull(entries);
        Entries = entries.ToArray();
    }

    public static PublicCorpus LoadFromDirectory(string techDirectoryPath)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(techDirectoryPath);
        var fullPath = Path.GetFullPath(techDirectoryPath);
        var dirInfo = new DirectoryInfo(fullPath);
        if (!dirInfo.Exists)
        {
            throw new DirectoryNotFoundException($"Public tech corpus directory not found: '{fullPath}'.");
        }

        if (dirInfo.LinkTarget is not null || dirInfo.Attributes.HasFlag(FileAttributes.ReparsePoint))
        {
            throw new InvalidDataException("Public tech corpus directory must not be a symlink or reparse point.");
        }

        var loaded = new List<CorpusEntry> { BaselineOverview };
        foreach (var file in dirInfo.EnumerateFiles("*.md", SearchOption.TopDirectoryOnly).OrderBy(f => f.Name, StringComparer.Ordinal))
        {
            if (file.LinkTarget is not null || file.Attributes.HasFlag(FileAttributes.ReparsePoint))
            {
                throw new InvalidDataException($"Corpus entry '{file.Name}' must not be a symlink or reparse point.");
            }

            if (file.Length <= 0 || file.Length > MaxFileBytes)
            {
                throw new InvalidDataException($"Corpus entry '{file.Name}' has an invalid byte length ({file.Length}).");
            }

            var slug = Path.GetFileNameWithoutExtension(file.Name);
            if (!SafeSlug.IsMatch(slug))
            {
                throw new InvalidDataException($"Corpus entry '{file.Name}' has an unsafe slug.");
            }

            loaded.Add(ParseMarkdownFile(slug, File.ReadAllText(file.FullName)));
        }

        return new PublicCorpus(loaded);
    }

    public IReadOnlyList<CorpusEntry> ListTechNotes() =>
        Entries.Where(entry => entry.Id != "overview")
            .OrderByDescending(entry => entry.PublishedDate, StringComparer.Ordinal)
            .ThenBy(entry => entry.Id, StringComparer.Ordinal)
            .ToArray();

    public IReadOnlyList<CorpusMatch> Search(string query, int maxResults = 5)
    {
        if (string.IsNullOrWhiteSpace(query) || query.Length > MaxQueryLength)
        {
            throw new ArgumentException($"Query must be non-empty and at most {MaxQueryLength} characters.", nameof(query));
        }

        if (maxResults is < 1 or > 10)
        {
            throw new ArgumentOutOfRangeException(nameof(maxResults), "maxResults must be between 1 and 10.");
        }

        var terms = Tokenize(query);
        if (terms.Count == 0)
        {
            return [];
        }

        var results = new List<CorpusMatch>();
        foreach (var entry in Entries)
        {
            var titleLower = entry.Title.ToLowerInvariant();
            var summaryLower = entry.Summary.ToLowerInvariant();
            var bodyLower = entry.Body.ToLowerInvariant();

            var score = 0;
            foreach (var term in terms)
            {
                if (titleLower.Contains(term, StringComparison.Ordinal)) score += 4;
                if (summaryLower.Contains(term, StringComparison.Ordinal)) score += 2;
                if (bodyLower.Contains(term, StringComparison.Ordinal)) score += 1;
            }

            if (score > 0)
            {
                results.Add(new CorpusMatch(
                    entry.Id,
                    entry.Title,
                    entry.CanonicalUrl,
                    BuildExcerpt(entry.Body, terms),
                    score));
            }
        }

        return results
            .OrderByDescending(match => match.Score)
            .ThenBy(match => match.Id, StringComparer.Ordinal)
            .Take(maxResults)
            .ToArray();
    }

    private static CorpusEntry ParseMarkdownFile(string slug, string raw)
    {
        var normalized = raw.Replace("\r\n", "\n", StringComparison.Ordinal);
        if (!normalized.StartsWith("---\n", StringComparison.Ordinal))
        {
            throw new InvalidDataException($"Corpus entry '{slug}' is missing YAML frontmatter.");
        }

        var closingIndex = normalized.IndexOf("\n---\n", 4, StringComparison.Ordinal);
        if (closingIndex < 0)
        {
            throw new InvalidDataException($"Corpus entry '{slug}' has unterminated YAML frontmatter.");
        }

        var frontmatter = normalized[4..closingIndex];
        var body = normalized[(closingIndex + 5)..].Trim();
        var fields = ParseFrontmatterFields(slug, frontmatter);

        if (!fields.TryGetValue("title", out var title) || string.IsNullOrWhiteSpace(title) ||
            !fields.TryGetValue("publishedDate", out var date) || !Regex.IsMatch(date, @"^\d{4}-\d{2}-\d{2}$") ||
            !fields.TryGetValue("summary", out var summary) || string.IsNullOrWhiteSpace(summary) ||
            string.IsNullOrWhiteSpace(body))
        {
            throw new InvalidDataException($"Corpus entry '{slug}' is missing required metadata or body content.");
        }

        return new CorpusEntry(
            Id: slug,
            Title: title,
            CanonicalUrl: $"https://jamula.net/tech/{slug}/",
            PublishedDate: date,
            Summary: summary,
            Body: body);
    }

    private static Dictionary<string, string> ParseFrontmatterFields(string slug, string frontmatter)
    {
        var fields = new Dictionary<string, string>(StringComparer.Ordinal);
        string? activeBlockKey = null;
        var activeBlockJoin = " ";
        var blockLines = new List<string>();

        void FlushBlock()
        {
            if (activeBlockKey is not null)
            {
                fields[activeBlockKey] = string.Join(activeBlockJoin, blockLines).Trim();
                activeBlockKey = null;
                blockLines.Clear();
            }
        }

        foreach (var rawLine in frontmatter.Split('\n'))
        {
            if (string.IsNullOrWhiteSpace(rawLine) || rawLine.TrimStart().StartsWith('#'))
            {
                continue;
            }

            if (activeBlockKey is not null && (rawLine.StartsWith("  ", StringComparison.Ordinal) || rawLine.StartsWith('\t')))
            {
                blockLines.Add(rawLine.Trim());
                continue;
            }

            FlushBlock();
            var colon = rawLine.IndexOf(':', StringComparison.Ordinal);
            if (colon <= 0)
            {
                throw new InvalidDataException($"Corpus entry '{slug}' contains malformed frontmatter line.");
            }

            var key = rawLine[..colon].Trim();
            var rawValue = rawLine[(colon + 1)..].Trim();
            if (rawValue is ">" or ">-" or "|" or "|-")
            {
                activeBlockKey = key;
                activeBlockJoin = rawValue.StartsWith('|') ? "\n" : " ";
                continue;
            }

            fields[key] = UnquoteYamlScalar(rawValue);
        }

        FlushBlock();
        return fields;
    }

    private static string UnquoteYamlScalar(string rawValue)
    {
        if (rawValue.Length >= 2 && rawValue[0] == '\'' && rawValue[^1] == '\'')
        {
            return rawValue[1..^1].Replace("''", "'", StringComparison.Ordinal);
        }

        if (rawValue.Length >= 2 && rawValue[0] == '"' && rawValue[^1] == '"')
        {
            return rawValue[1..^1].Replace("\\\"", "\"", StringComparison.Ordinal);
        }

        return rawValue;
    }

    private static HashSet<string> Tokenize(string text) =>
        WordTokenizer.Matches(text.ToLowerInvariant())
            .Select(m => m.Value)
            .ToHashSet(StringComparer.Ordinal);

    private static string BuildExcerpt(string body, HashSet<string> terms)
    {
        var clean = Regex.Replace(body, @"\s+", " ").Trim();
        if (clean.Length <= MaxExcerptLength)
        {
            return clean;
        }

        var lower = clean.ToLowerInvariant();
        var firstHit = terms
            .Select(term => lower.IndexOf(term, StringComparison.Ordinal))
            .Where(idx => idx >= 0)
            .DefaultIfEmpty(0)
            .Min();

        var start = Math.Max(0, Math.Min(firstHit, clean.Length - MaxExcerptLength));
        return clean.Substring(start, MaxExcerptLength).Trim() + "...";
    }
}
