using System.Net;
using System.Diagnostics;
using System.Net.Http.Json;
using System.Net.NetworkInformation;
using System.Security.Cryptography;
using System.Text.Json;

if (args is ["--cleanup-child"])
{
    await Task.Delay(TimeSpan.FromSeconds(60));
    return 0;
}

if (args.Length > 1 || (args.Length == 1 &&
    args[0] is not ("--collective" or "--coverage" or "--cleanup")))
{
    Console.Error.WriteLine("Use no arguments for independent checks, --collective, --coverage, or --cleanup.");
    return 2;
}
var root = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));
var coverage = args.Length == 1 && args[0] == "--coverage";
var fixture = new Fixture(root, coverage);
try
{
    await fixture.RunAsync(args.Length == 1 && args[0] == "--collective",
        args.Length == 1 && args[0] == "--cleanup");
    return 0;
}
catch (Exception error)
{
    // Test names are static metadata. Do not print request data, child output or environment.
    Console.Error.WriteLine($"FAIL: {fixture.CurrentCase} ({error.GetType().Name})");
    return 1;
}
finally { await fixture.DisposeAsync(); }

internal sealed class Fixture(string root, bool coverage) : IAsyncDisposable
{
    private static readonly string[] Sections = ["Admin", "Finance", "Tech"];
    private readonly string releases = Path.Combine(root, "artifacts", Guid.NewGuid().ToString("N"));
    private readonly List<Child> children = [];
    private readonly Dictionary<string, Child> hosts = [];
    private readonly Dictionary<string, string> routes = [];
    private readonly HttpClient client = new(new HttpClientHandler
    {
        AllowAutoRedirect = false, UseProxy = false,
    }) { Timeout = TimeSpan.FromSeconds(5) };
    private int passed;
    private string RoutingFile => Path.Combine(releases, "routes.json");
    public string CurrentCase { get; private set; } = "Setup";

    public async Task RunAsync(bool collective, bool cleanupOnly = false)
    {
        await Case("CleanupFailureDetailsAreRetained", async () =>
        {
            var first = new TimeoutException("first cleanup failure");
            var second = new IOException("second cleanup failure");
            var events = new List<string>();
            var reported = await CaptureFailureAsync(() => CleanupAsync(
                [new CleanupChild(() => { events.Add("first"); throw first; }),
                 new CleanupChild(() => { events.Add("second"); throw second; })],
                new CleanupResource(() => events.Add("client")), () => events.Add("directory")));
            RequireCleanupFailures(reported, first, second);
            Require(events.SequenceEqual(["first", "second", "client", "directory"]));
        });
        await Case("ReleaseDeletionFailureRetainsEarlierCleanupFailures", async () =>
        {
            var first = new TimeoutException("child cleanup failure");
            var deletion = new IOException("release deletion failure");
            var events = new List<string>();
            var reported = await CaptureFailureAsync(() => CleanupAsync(
                [new CleanupChild(() => { events.Add("failed child"); throw first; }),
                 new CleanupChild(() => events.Add("next child"))],
                new CleanupResource(() => events.Add("client")),
                () => { events.Add("directory"); throw deletion; }));
            RequireCleanupFailures(reported, first, deletion);
            Require(events.SequenceEqual(["failed child", "next child", "client", "directory"]));
            var deletionOnly = await CaptureFailureAsync(() => CleanupAsync(
                [], new CleanupResource(() => { }), () => throw deletion));
            RequireCleanupFailures(deletionOnly, deletion);
            await CleanupAsync([], new CleanupResource(() => { }), () => { });
        });
        await Case("TerminationFailureStillWaitsDrainsAndDisposes", async () =>
        {
            var kill = new InvalidOperationException("termination failure");
            var wait = new TimeoutException("exit timeout");
            var drain = new IOException("drain failure");
            var events = new List<string>();
            var reported = await CaptureFailureAsync(() => Child.CleanupProcessAsync(
                () => { events.Add("terminate"); throw kill; },
                () => { events.Add("wait"); return Task.FromException(wait); },
                () => { events.Add("drain"); return Task.FromException(drain); },
                () => events.Add("dispose")));
            RequireCleanupFailures(reported, kill, wait, drain);
            Require(events.SequenceEqual(["terminate", "wait", "drain", "dispose"]));
            var disposal = new IOException("disposal failure");
            reported = await CaptureFailureAsync(() => Child.CleanupProcessAsync(
                () => throw kill, () => Task.CompletedTask, () => Task.CompletedTask,
                () => throw disposal));
            RequireCleanupFailures(reported, kill, disposal);
        });
        await Case("StartupAndCleanupFailuresRetainOriginalIdentityAndOrder", async () =>
        {
            foreach (var original in new Exception[]
                { new TimeoutException("readiness timeout"), new InvalidOperationException("startup failure") })
            {
                var cleanup = new IOException("cleanup failure");
                var reported = await CaptureFailureAsync(() =>
                    Cleanup.AfterFailureAsync(original, () => Task.FromException(cleanup)));
                Require(reported is AggregateException aggregate &&
                    aggregate.InnerExceptions.Count == 2 &&
                    ReferenceEquals(aggregate.InnerExceptions[0], original) &&
                    ReferenceEquals(aggregate.InnerExceptions[1], cleanup));
                var drain = new TimeoutException("drain timeout");
                var disposed = false;
                reported = await CaptureFailureAsync(() => Cleanup.AfterFailureAsync(original,
                    () => Child.CleanupProcessAsync(() => throw cleanup,
                        () => Task.CompletedTask, () => Task.FromException(drain),
                        () => disposed = true)));
                Require(reported is AggregateException combined &&
                    combined.InnerExceptions.Count == 2 &&
                    ReferenceEquals(combined.InnerExceptions[0], original) && disposed);
                RequireCleanupFailures(((AggregateException)reported).InnerExceptions[1], cleanup, drain);
            }
        });
        await Case("SuccessfulStartupCleanupRethrowsOriginalException", async () =>
        {
            var original = new InvalidOperationException("started callback failure");
            var startedId = 0;
            var reported = await CaptureFailureAsync(() => Child.StartAsync("dotnet", root,
                [typeof(Fixture).Assembly.Location, "--cleanup-child"],
                true, started: id => { startedId = id; throw original; }));
            Require(ReferenceEquals(reported, original) && startedId > 0);
            try
            {
                using var process = Process.GetProcessById(startedId);
                Require(process.HasExited);
            }
            catch (ArgumentException) { }
        });
        if (cleanupOnly)
        {
            Require(passed == 5);
            Console.WriteLine($"{passed} cleanup checks passed; 0 skipped; 0 failed.");
            return;
        }
        if (collective)
        {
            await Case("CollectivePublishesAndDeploysExactAllSectionSet", async () =>
            {
                await PublishAsync(null, "1.0.0");
                await DeployAllAsync("1.0.0");
                Require(Directory.GetDirectories(releases).Length == 4);
                await AssertAllAsync("1.0.0");
                Require(children.Select(child => child.Id).Distinct().Count() == 4);
                Require(children.Select(child => child.Address!.Port).Distinct().Count() == 4);
            });
        }
        else
        {
            await Case("IndependentPublishesDoNotBuildOtherSections", async () =>
            {
                foreach (var section in Sections.Append("Gateway"))
                {
                    var before = Snapshot(releases);
                    await PublishAsync(section, "1.0.0");
                    Require(before.All(entry => Snapshot(releases)[entry.Key] == entry.Value));
                    var built = Directory.GetDirectories(releases)
                        .Select(Path.GetFileName).ToHashSet();
                    Require(built.Count == Array.IndexOf(
                        new[] { "Admin", "Finance", "Tech", "Gateway" }, section) + 1);
                    Require(built.Contains(section));
                }
            });
            await Case("IndependentArtifactsRunInDistinctProcessesAndPorts", async () =>
            {
                await DeployAllAsync("1.0.0");
                Require(children.Count == 4);
                Require(children.Select(child => child.Id).Distinct().Count() == 4);
                Require(children.All(child => child.Id != Environment.ProcessId && !child.Exited));
                Require(children.Select(child => child.Address!.Port).Distinct().Count() == 4);
                await AssertAllAsync("1.0.0");
            });
            await Case("AllSectionsPreserveNestedPathAndEncodedQuery", async () =>
            {
                foreach (var section in Sections)
                {
                    var path = $"/{section.ToLowerInvariant()}/nested/status";
                    const string query = "?probe=a%2Fb&repeat=1&repeat=2&empty=";
                    await AssertProbeAsync(Gateway, section, "1.0.0", path, query);
                    await AssertProbeAsync(Gateway, section, "1.0.0",
                        $"/{section.ToLowerInvariant()}", "");
                }
            });
            await Case("UnknownSectionDoesNotDispatchToAnyHost", async () =>
            {
                var counts = new Dictionary<string, int>();
                foreach (var section in Sections)
                    counts[section] = (await ProbeAsync(hosts[section].Address!,
                        $"/{section.ToLowerInvariant()}/status", "")).RequestNumber;
                await AssertStatusAsync("/unknown/status", HttpStatusCode.NotFound);
                await AssertStatusAsync("/Finance/status", HttpStatusCode.NotFound);
                foreach (var section in Sections)
                    Require((await ProbeAsync(hosts[section].Address!,
                        $"/{section.ToLowerInvariant()}/status", "")).RequestNumber == counts[section] + 1);
            });
            await Case("FinanceFailureIsBoundedAndOtherHostsRemainUnchanged", async () =>
            {
                await hosts["Finance"].StopAsync();
                Require(hosts["Finance"].Exited);
                await Task.WhenAll(
                    AssertStatusAsync("/finance/status", HttpStatusCode.BadGateway),
                    AssertProbeAsync(Gateway, "Admin", "1.0.0", "/admin/status", ""),
                    AssertProbeAsync(Gateway, "Tech", "1.0.0", "/tech/status", ""));
            });
            await Case("FinanceOnlyReleaseChangesBytesAndPreservesOtherArtifacts", async () =>
            {
                var before = Snapshot(releases);
                await PublishAsync("Finance", "2.0.0");
                var after = Snapshot(releases);
                Require(before.All(entry => after[entry.Key] == entry.Value));
                Require(Hash(Artifact("Finance", "1.0.0")) != Hash(Artifact("Finance", "2.0.0")));
                Require(!Directory.Exists(Path.Combine(releases, "Admin", "2.0.0")) &&
                    !Directory.Exists(Path.Combine(releases, "Tech", "2.0.0")) &&
                    !Directory.Exists(Path.Combine(releases, "Gateway", "2.0.0")));
            });
            await Case("FinanceReplacementServesNewArtifactWithoutRestartingOtherHosts", async () =>
            {
                var before = Snapshot(releases);
                var oldFinance = hosts["Finance"];
                var stableIds = new[] { hosts["Admin"].Id, hosts["Tech"].Id, hosts["Gateway"].Id };
                var replacement = await ActivateAsync("Finance", "2.0.0");
                Require(replacement.Id != oldFinance.Id && oldFinance.Exited);
                hosts["Finance"] = replacement;
                routes["finance"] = replacement.Address!.ToString();
                await WriteRoutesAsync();
                await AssertAllAsync("2.0.0");
                Require(stableIds.SequenceEqual(new[]
                    { hosts["Admin"].Id, hosts["Tech"].Id, hosts["Gateway"].Id }));
                Require(before.Where(entry => !entry.Key.EndsWith("routes.json", StringComparison.Ordinal))
                    .All(entry => Snapshot(releases)[entry.Key] == entry.Value));
            });
            await Case("OldFinanceArtifactRemainsRunnableAndIdentifiesOldVersion", async () =>
            {
                var old = await ActivateAsync("Finance", "1.0.0");
                await AssertProbeAsync(old.Address!, "Finance", "1.0.0", "/finance/status", "", old.Id);
                await AssertProbeAsync(Gateway, "Finance", "2.0.0", "/finance/status", "");
                await old.StopAsync();
            });
            await Case("MissingArtifactFailsBeforeProcessStart", async () =>
            {
                var count = children.Count;
                await ExpectFailureAsync(() => ActivateAsync("Finance", "9.0.0"));
                Require(children.Count == count);
                await AssertAllAsync("2.0.0");
            });
            await Case("ReleaseDirectoryReuseFailsWithoutChangingArtifactBytes", async () =>
            {
                var before = Snapshot(releases);
                await ExpectFailureAsync(() => PublishAsync("Finance", "2.0.0"));
                Require(before.OrderBy(entry => entry.Key).SequenceEqual(
                    Snapshot(releases).OrderBy(entry => entry.Key)));
            });
            await Case("InvalidReleaseSelectionFailsWithoutCreatingArtifacts", async () =>
            {
                var before = Snapshot(releases);
                await ExpectFailureAsync(() => PublishAsync("Unknown", "1.0.0"));
                Require(before.OrderBy(entry => entry.Key).SequenceEqual(
                    Snapshot(releases).OrderBy(entry => entry.Key)));
            });
            await Case("MalformedRoutingFileFailsClosedAndRecovers", async () =>
            {
                await File.WriteAllTextAsync(RoutingFile, "{");
                await AssertStatusAsync("/finance/status", HttpStatusCode.ServiceUnavailable);
                await WriteRoutesAsync();
                await AssertAllAsync("2.0.0");
            });
            await Case("MissingFinanceRouteIsIsolatedFromOtherSections", async () =>
            {
                var finance = routes["finance"];
                routes.Remove("finance");
                await WriteRoutesAsync();
                await AssertStatusAsync("/finance/status", HttpStatusCode.ServiceUnavailable);
                await AssertProbeAsync(Gateway, "Admin", "1.0.0", "/admin/status", "");
                await AssertProbeAsync(Gateway, "Tech", "1.0.0", "/tech/status", "");
                routes["finance"] = finance;
                await WriteRoutesAsync();
            });
            await Case("NonLoopbackUpstreamIsRejectedBeforeDispatch", async () =>
            {
                var finance = routes["finance"];
                routes["finance"] = "http://192.0.2.1:8080/";
                await WriteRoutesAsync();
                await AssertStatusAsync("/finance/status", HttpStatusCode.ServiceUnavailable);
                routes["finance"] = finance;
                await WriteRoutesAsync();
                await AssertAllAsync("2.0.0");
            });
            await Case("UnsupportedMethodIsRejectedWithoutUpstreamDispatch", async () =>
            {
                var before = await ProbeAsync(hosts["Finance"].Address!, "/finance/status", "");
                using var response = await client.PostAsync(new Uri(Gateway, "/finance/status"), null);
                Require(response.StatusCode == HttpStatusCode.MethodNotAllowed);
                var after = await ProbeAsync(hosts["Finance"].Address!, "/finance/status", "");
                Require(after.RequestNumber == before.RequestNumber + 1);
            });
            await Case("GatewayStartupFailureIsBoundedAndLeavesSectionsAvailable", async () =>
            {
                await ExpectFailureAsync(() => Child.StartAsync("dotnet", releases,
                    [Artifact("Gateway", "1.0.0"), Path.Combine(releases, "missing.json")], true,
                    instrumentForCoverage: coverage));
                await AssertAllAsync("2.0.0");
            });
            await Case("ReadinessTimeoutKillsOnlyTheOwnedChild", async () =>
            {
                var startedId = 0;
                var timedOut = false;
                try
                {
                    await using var unexpected = await Child.StartAsync("pwsh", releases,
                        ["-NoLogo", "-NoProfile", "-NonInteractive", "-Command", "Start-Sleep -Seconds 60"],
                        true, TimeSpan.FromMilliseconds(200), id => startedId = id);
                }
                catch (TimeoutException) { timedOut = true; }
                Require(timedOut && startedId > 0);
                var stopped = false;
                try
                {
                    using var process = Process.GetProcessById(startedId);
                    stopped = process.HasExited;
                }
                catch (ArgumentException) { stopped = true; }
                Require(stopped);
                await AssertAllAsync("2.0.0");
            });
            await Case("MissingCollectiveArtifactRejectsSetBeforeStartingAnyHost", async () =>
            {
                var count = children.Count;
                await ExpectFailureAsync(() => DeployAllAsync("9.0.0"));
                Require(children.Count == count);
                await AssertAllAsync("2.0.0");
            });
        }
        await Case("AllOwnedChildrenExitAndReleaseLoopbackPorts", async () =>
        {
            foreach (var child in children) await child.StopAsync();
            Require(children.All(child => child.Exited));
            var listeners = IPGlobalProperties.GetIPGlobalProperties().GetActiveTcpListeners();
            foreach (var port in children.Select(child => child.Address!.Port).Distinct())
            {
                Require(!listeners.Any(endpoint =>
                    endpoint.Port == port && endpoint.Address.Equals(IPAddress.Loopback)));
            }
        });
        Require(passed == (collective ? 7 : 24));
        Console.WriteLine($"{passed} local artifact checks passed; 0 skipped; 0 failed.");
    }

    private Uri Gateway => hosts["Gateway"].Address!;
    private string Artifact(string component, string version) =>
        Path.Combine(releases, component, version, $"{component}.dll");

    private async Task PublishAsync(string? component, string version)
    {
        Directory.CreateDirectory(releases);
        List<string> arguments = ["-NoLogo", "-NoProfile", "-NonInteractive", "-File",
            Path.Combine(root, "Publish-Local.ps1"), "-Version", version, "-OutputRoot", releases];
        if (component is null) arguments.Add("-All");
        else { arguments.Add("-Section"); arguments.Add(component); }
        await using var publish = await Child.StartAsync("pwsh", root, arguments, false);
    }

    private async Task<Child> ActivateAsync(string component, string version)
    {
        var artifact = Artifact(component, version);
        if (!File.Exists(artifact)) throw new InvalidOperationException("Missing local artifact.");
        var arguments = component == "Gateway" ? new[] { artifact, RoutingFile } : [artifact];
        var child = await Child.StartAsync("dotnet", Path.GetDirectoryName(artifact)!, arguments, true,
            instrumentForCoverage: coverage);
        children.Add(child);
        return child;
    }

    private async Task DeployAllAsync(string version)
    {
        // Ordered start, one pinned version per artifact; partial starts are owned by finally cleanup.
        foreach (var component in Sections.Append("Gateway"))
            if (!File.Exists(Artifact(component, version)))
                throw new InvalidOperationException("The collective artifact set is incomplete.");
        foreach (var section in Sections)
        {
            hosts[section] = await ActivateAsync(section, version);
            routes[section.ToLowerInvariant()] = hosts[section].Address!.ToString();
        }
        await WriteRoutesAsync();
        hosts["Gateway"] = await ActivateAsync("Gateway", version);
    }

    private async Task WriteRoutesAsync()
    {
        var next = RoutingFile + ".next";
        await File.WriteAllTextAsync(next, JsonSerializer.Serialize(routes));
        File.Move(next, RoutingFile, overwrite: true);
    }

    private async Task AssertAllAsync(string financeVersion)
    {
        foreach (var section in Sections)
        {
            var version = section == "Finance" ? financeVersion : "1.0.0";
            await AssertProbeAsync(hosts[section].Address!, section, version,
                $"/{section.ToLowerInvariant()}/status", "?probe=local");
            await AssertProbeAsync(Gateway, section, version,
                $"/{section.ToLowerInvariant()}/status", "?probe=local");
        }
    }

    private async Task AssertProbeAsync(Uri address, string section, string version,
        string path, string query, int? expectedProcessId = null)
    {
        var probe = await ProbeAsync(address, path, query);
        Require(probe.Section == section.ToLowerInvariant() && probe.Version == version &&
            probe.Path == path && probe.Query == query &&
            probe.ProcessId == (expectedProcessId ?? hosts[section].Id));
    }

    private async Task<Probe> ProbeAsync(Uri address, string path, string query)
    {
        using var response = await client.GetAsync(new Uri(address, path + query));
        Require(response.StatusCode == HttpStatusCode.OK);
        return await response.Content.ReadFromJsonAsync<Probe>() ??
            throw new InvalidOperationException("Missing probe.");
    }

    private async Task AssertStatusAsync(string path, HttpStatusCode status)
    {
        using var response = await client.GetAsync(new Uri(Gateway, path));
        Require(response.StatusCode == status && (await response.Content.ReadAsByteArrayAsync()).Length == 0);
    }

    private async Task Case(string name, Func<Task> test)
    {
        CurrentCase = name;
        await test();
        passed++;
        Console.WriteLine($"PASS: {name}");
    }
    private static void Require(bool condition)
    {
        if (!condition) throw new InvalidOperationException("Local check failed.");
    }
    private static async Task<Exception> CaptureFailureAsync(Func<Task> action)
    {
        try { await action(); }
        catch (Exception error) { return error; }
        throw new InvalidOperationException("Expected cleanup failure.");
    }
    private static void RequireCleanupFailures(Exception reported, params Exception[] expected)
    {
        Require(reported is
            { Message: "Bounded child cleanup failed.", InnerException: AggregateException aggregate } &&
            aggregate.InnerExceptions.Count == expected.Length &&
            aggregate.InnerExceptions.Zip(expected).All(pair => ReferenceEquals(pair.First, pair.Second)));
    }
    private static async Task ExpectFailureAsync(Func<Task> action)
    {
        try { await action(); }
        catch (InvalidOperationException) { return; }
        throw new InvalidOperationException("Expected local failure.");
    }
    private static string Hash(string file) => Convert.ToHexString(SHA256.HashData(File.ReadAllBytes(file)));
    private static Dictionary<string, string> Snapshot(string directory) =>
        Directory.Exists(directory) ? Directory.GetFiles(directory, "*", SearchOption.AllDirectories)
            .ToDictionary(file => Path.GetRelativePath(directory, file), Hash) : [];

    public ValueTask DisposeAsync() => new(CleanupAsync(children, client, () =>
    {
        if (Directory.Exists(releases)) Directory.Delete(releases, recursive: true);
    }));

    internal static Task CleanupAsync(IEnumerable<IAsyncDisposable> children,
        IDisposable client, Action deleteReleases) => Cleanup.RunAsync(
        children.Select<IAsyncDisposable, Func<Task>>(child => () => child.DisposeAsync().AsTask())
            .Concat([
                () => { client.Dispose(); return Task.CompletedTask; },
                () => { deleteReleases(); return Task.CompletedTask; },
            ]));
}

internal sealed class CleanupChild(Action dispose) : IAsyncDisposable
{
    public ValueTask DisposeAsync() { dispose(); return ValueTask.CompletedTask; }
}

internal sealed class CleanupResource(Action dispose) : IDisposable
{
    public void Dispose() => dispose();
}

internal sealed record Probe(string Section, string Version, int ProcessId, int RequestNumber,
    string Path, string Query);
