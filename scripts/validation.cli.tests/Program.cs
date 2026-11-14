using System.Diagnostics;
using System.IO.Compression;

var tests = new (string Name, Func<Task> Run)[]
{
    ("Cli_InvalidArguments_ReturnUsage", InvalidArgumentsReturnUsage),
    ("Cli_GovernanceDefaultRoot_UsesWorkingDirectory", GovernanceDefaultRootUsesWorkingDirectory),
    ("Cli_GovernanceExplicitRoot_UsesArgument", GovernanceExplicitRootUsesArgument),
    ("Cli_ArtifactValidArchive_ExtractsAndSucceeds", ArtifactValidArchiveExtractsAndSucceeds),
    ("Cli_ArtifactMissingArchive_ReturnsError", ArtifactMissingArchiveReturnsError),
    ("Cli_VerifySiteInvalidUrl_ReturnsError", VerifySiteInvalidUrlReturnsError),
    ("Cli_VerifySiteDefaultConfig_UsesDefaultPath", VerifySiteDefaultConfigUsesDefaultPath),
    ("Cli_VerifySiteExplicitConfig_UsesArgument", VerifySiteExplicitConfigUsesArgument)
};

await Task.WhenAll(tests.Select(async test =>
{
    try
    {
        await test.Run();
        Console.WriteLine($"PASS: {test.Name}");
    }
    catch (Exception error)
    {
        Console.Error.WriteLine($"FAIL: {test.Name}: {error}");
        throw;
    }
}));
Console.WriteLine($"{tests.Length} deterministic offline CLI checks passed.");

static async Task InvalidArgumentsReturnUsage()
{
    using var fixture = new Fixture();
    string[][] cases =
    [
        [], ["unknown"], ["validate-governance", "root", "extra"],
        ["validate-artifact"], ["validate-artifact", "one", "two"],
        ["validate-artifact", "one", "two", "three", "extra"],
        ["verify-site"], ["verify-site", "one", "two", "extra"]
    ];
    foreach (var args in cases)
    {
        var result = await RunCli(fixture.Root, args);
        Equal(2, result.ExitCode);
        Equal("", result.Output);
        Equal("Usage: validate-governance [ROOT] | validate-artifact ARCHIVE DESTINATION TRUSTED_CONFIG | verify-site HTTPS_PREVIEW_URL [CONFIG]", result.Error.TrimEnd());
    }
}

static async Task GovernanceDefaultRootUsesWorkingDirectory()
{
    using var fixture = new Fixture();
    File.WriteAllText(Path.Combine(fixture.Root, "LICENSE"), "");
    var result = await RunCli(fixture.Root, "validate-governance");
    AssertGovernanceMissingFiles(result, "Required governance files are missing: LICENSE_SCOPE.md");
}

static async Task GovernanceExplicitRootUsesArgument()
{
    using var fixture = new Fixture();
    var target = Path.Combine(fixture.Root, "target");
    Directory.CreateDirectory(target);
    File.WriteAllText(Path.Combine(target, "LICENSE"), "");
    var result = await RunCli(fixture.Root, "validate-governance", target);
    AssertGovernanceMissingFiles(result, "Required governance files are missing: LICENSE_SCOPE.md");
}

static void AssertGovernanceMissingFiles(CliResult result, string expected)
{
    Equal(1, result.ExitCode);
    Equal("", result.Output);
    Contains(expected, result.Error);
}

static async Task ArtifactValidArchiveExtractsAndSucceeds()
{
    using var fixture = new Fixture();
    var config = Path.Combine(fixture.Root, "trusted.json");
    var archive = Path.Combine(fixture.Root, "preview.zip");
    var destination = Path.Combine(fixture.Root, "output");
    File.WriteAllText(config, "{\"globalHeaders\":{\"X-Test\":\"value\"}}");
    using (var zip = ZipFile.Open(archive, ZipArchiveMode.Create))
    {
        foreach (var (name, content) in new[]
        {
            ("index.html", "<title>Jamula</title>"),
            ("404.html", "Page not found"),
            ("robots.txt", "User-agent: *\nDisallow: /"),
            ("staticwebapp.config.json", "{\"globalHeaders\":{\"X-Test\":\"value\"}}"),
            ("assets/site.js", "console.log('preview');")
        })
        {
            using var writer = new StreamWriter(zip.CreateEntry(name).Open());
            writer.Write(content);
        }
    }

    var result = await RunCli(fixture.Root, "validate-artifact", archive, destination, config);
    Equal(0, result.ExitCode);
    Equal("Preview artifact paths, size, static files, and trusted configuration verified.", result.Output.TrimEnd());
    Equal("", result.Error);
    Equal("<title>Jamula</title>", File.ReadAllText(Path.Combine(destination, "index.html")));
    Equal("console.log('preview');", File.ReadAllText(Path.Combine(destination, "assets", "site.js")));
}

static async Task ArtifactMissingArchiveReturnsError()
{
    using var fixture = new Fixture();
    var archive = Path.Combine(fixture.Root, "missing.zip");
    var destination = Path.Combine(fixture.Root, "output");
    var result = await RunCli(fixture.Root, "validate-artifact", archive, destination, "unused.json");
    Equal(1, result.ExitCode);
    Equal("", result.Output);
    Contains("missing.zip", result.Error);
    Equal(false, Directory.Exists(destination));
}

static async Task VerifySiteInvalidUrlReturnsError()
{
    using var fixture = new Fixture();
    var result = await RunCli(fixture.Root, "verify-site", "https://example.invalid/");
    Equal(1, result.ExitCode);
    Equal("", result.Output);
    Contains("Only an isolated Jamula PR preview URL may be verified.", result.Error);
}

static async Task VerifySiteDefaultConfigUsesDefaultPath()
{
    using var fixture = new Fixture();
    var result = await RunCli(fixture.Root, "verify-site", "https://ashy-beach-033c7d01e-1.7.azurestaticapps.net/");
    Equal(1, result.ExitCode);
    Equal("", result.Output);
    Contains(Path.Combine(fixture.Root, "www", "public", "staticwebapp.config.json"), result.Error);
}

static async Task VerifySiteExplicitConfigUsesArgument()
{
    using var fixture = new Fixture();
    var config = Path.Combine(fixture.Root, "missing-explicit-config.json");
    var result = await RunCli(fixture.Root, "verify-site", "https://ashy-beach-033c7d01e-1.7.azurestaticapps.net/", config);
    Equal(1, result.ExitCode);
    Equal("", result.Output);
    Contains(config, result.Error);
}

static async Task<CliResult> RunCli(string workingDirectory, params string[] args)
{
    var start = new ProcessStartInfo
    {
        FileName = "dotnet",
        WorkingDirectory = workingDirectory,
        UseShellExecute = false,
        RedirectStandardOutput = true,
        RedirectStandardError = true
    };
    start.ArgumentList.Add("exec");
    start.ArgumentList.Add("--runtimeconfig");
    start.ArgumentList.Add(Path.ChangeExtension(typeof(Fixture).Assembly.Location, ".runtimeconfig.json"));
    start.ArgumentList.Add(typeof(JamulaValidation.Program).Assembly.Location);
    start.Environment["HTTP_PROXY"] = "http://127.0.0.1:9";
    start.Environment["HTTPS_PROXY"] = "http://127.0.0.1:9";
    start.Environment["NO_PROXY"] = "";
    start.Environment["ALL_PROXY"] = "http://127.0.0.1:9";
    foreach (var arg in args) start.ArgumentList.Add(arg);

    using var process = Process.Start(start) ?? throw new InvalidOperationException("Failed to start the validation CLI.");
    var output = process.StandardOutput.ReadToEndAsync();
    var error = process.StandardError.ReadToEndAsync();
    using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(15));
    try
    {
        await process.WaitForExitAsync(timeout.Token);
    }
    catch (OperationCanceledException)
    {
        process.Kill(entireProcessTree: true);
        await process.WaitForExitAsync();
        throw new TimeoutException("Validation CLI did not exit within 15 seconds.");
    }
    return new CliResult(process.ExitCode, await output, await error);
}

static void Equal<T>(T expected, T actual)
{
    if (!EqualityComparer<T>.Default.Equals(expected, actual))
        throw new InvalidOperationException($"Expected '{expected}', got '{actual}'.");
}

static void Contains(string expected, string actual)
{
    if (!actual.Contains(expected, StringComparison.Ordinal))
        throw new InvalidOperationException($"Expected '{actual}' to contain '{expected}'.");
}

sealed record CliResult(int ExitCode, string Output, string Error);

sealed class Fixture : IDisposable
{
    public string Root { get; } = Path.Combine(Path.GetTempPath(), "jamula-validation-cli-" + Guid.NewGuid().ToString("N"));
    public Fixture() => Directory.CreateDirectory(Root);
    public void Dispose() => Directory.Delete(Root, recursive: true);
}
