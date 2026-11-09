using System.Diagnostics;
using System.Net;
using System.Reflection;
using System.Text.Json;
using JamulaMbr;

internal static class FakeGhEntrypoint
{
    private const string ModeVariable = "JAMULA_MBR_TEST_GH_MODE";
    private const string RootVariable = "JAMULA_MBR_TEST_GH_ROOT";

    public static bool IsFixtureProcess =>
        string.Equals(Path.GetFileName(Environment.ProcessPath), "gh.exe", StringComparison.OrdinalIgnoreCase);

    public static async Task<int> RunAsync(string[] args)
    {
        var root = Environment.GetEnvironmentVariable(RootVariable)
            ?? throw new InvalidOperationException("The fake provider root was not configured.");
        var mode = Environment.GetEnvironmentVariable(ModeVariable) ?? "success";
        var endpoint = args.LastOrDefault() ?? "";

        if (mode == "gate")
        {
            await File.WriteAllTextAsync(Path.Combine(root, "gh-started"), endpoint);
            while (!File.Exists(Path.Combine(root, "gh-release")))
                await Task.Delay(10);
        }

        if (mode == "failure")
        {
            Console.Error.WriteLine("private fixture provider detail");
            return 1;
        }

        if (mode == "malformed")
        {
            Console.WriteLine("{malformed");
            return 0;
        }

        if (mode == "delay")
        {
            await Task.Delay(Timeout.InfiniteTimeSpan);
            return 0;
        }

        if (!endpoint.Contains("/billing/usage/summary?", StringComparison.Ordinal))
        {
            Console.WriteLine("[]");
            return 0;
        }

        var year = QueryValue(endpoint, "year");
        var month = QueryValue(endpoint, "month");
        Console.WriteLine($$"""
            {"organization":"Jamula","repository":"{{GitHub.Repo}}","product":"Actions",
            "timePeriod":{"year":{{year}},"month":{{month}}},"usageItems":[
            {"product":"Actions","unitType":"minutes","grossQuantity":3,"netQuantity":2,"netAmount":0.01}]}
            """);
        return 0;
    }

    private static string QueryValue(string endpoint, string key)
    {
        var marker = key + "=";
        var start = endpoint.IndexOf(marker, StringComparison.Ordinal);
        if (start < 0) throw new InvalidOperationException($"Missing {key} query parameter.");
        start += marker.Length;
        var end = endpoint.IndexOf('&', start);
        return end < 0 ? endpoint[start..] : endpoint[start..end];
    }
}

internal static class MbrIntegrationTests
{
    private const string ModeVariable = "JAMULA_MBR_TEST_GH_MODE";
    private const string RootVariable = "JAMULA_MBR_TEST_GH_ROOT";

    public static async Task RunAsync(Action<bool, string> check)
    {
        var root = Path.Combine(Path.GetTempPath(), "jamula-mbr-integration-" + Guid.NewGuid().ToString("N"));
        var fixtureBin = Path.Combine(root, "fake-bin");
        Directory.CreateDirectory(fixtureBin);
        var originalPath = Environment.GetEnvironmentVariable("PATH") ?? "";
        var originalMode = Environment.GetEnvironmentVariable(ModeVariable);
        var originalRoot = Environment.GetEnvironmentVariable(RootVariable);
        var appAssembly = typeof(GitHub).Assembly.Location;

        try
        {
            CopyFixtureRuntime(fixtureBin);
            Environment.SetEnvironmentVariable("PATH", fixtureBin + Path.PathSeparator + originalPath);
            Environment.SetEnvironmentVariable(RootVariable, root);

            await VerifyGitHubCollectionAsync(check, root, originalPath);
            await VerifyLocalWebHostAsync(check, root, appAssembly);
            await VerifyCommandModesAsync(check, root, appAssembly);
        }
        finally
        {
            Environment.SetEnvironmentVariable("PATH", originalPath);
            Environment.SetEnvironmentVariable(ModeVariable, originalMode);
            Environment.SetEnvironmentVariable(RootVariable, originalRoot);
            if (Directory.Exists(root)) Directory.Delete(root, recursive: true);
        }
    }

    private static async Task VerifyGitHubCollectionAsync(
        Action<bool, string> check, string root, string originalPath)
    {
        Environment.SetEnvironmentVariable(ModeVariable, "success");
        var collected = await GitHub.CollectAsync(true, CancellationToken.None);
        check(collected.Status == "ok" && collected.Items?.Count == 0,
            "GitHubCollect_FakeProviderReturnsKnownEmptySuccess");

        Environment.SetEnvironmentVariable(ModeVariable, "failure");
        var failed = await GitHub.CollectAsync(false, CancellationToken.None);
        check(failed.Status == "unavailable" && failed.Items is null &&
            !failed.Detail.Contains("private fixture provider detail", StringComparison.Ordinal),
            "GitHubCollect_ProcessFailureIsSanitizedAndUnknown");

        Environment.SetEnvironmentVariable(ModeVariable, "malformed");
        var malformed = await GitHub.CollectAsync(true, CancellationToken.None);
        check(malformed.Status == "unavailable" && malformed.Items is null,
            "GitHubCollect_MalformedProviderResponseIsUnknown");

        Environment.SetEnvironmentVariable(ModeVariable, "delay");
        using var cancellation = new CancellationTokenSource(TimeSpan.FromMilliseconds(150));
        var cancelled = false;
        try
        {
            await GitHub.CollectAsync(true, cancellation.Token);
        }
        catch (OperationCanceledException)
        {
            cancelled = true;
        }
        check(cancelled, "GitHubCollect_CallerCancellationPropagatesAndStopsProvider");

        Environment.SetEnvironmentVariable(ModeVariable, "success");
        Environment.SetEnvironmentVariable("PATH", "");
        var missingExecutable = await GitHub.CollectAsync(true, CancellationToken.None);
        check(missingExecutable.Status == "unavailable" && missingExecutable.Items is null,
            "GitHubCollect_MissingProviderExecutableRemainsUnknown");
        Environment.SetEnvironmentVariable("PATH", FixtureBinPath(root) + Path.PathSeparator + originalPath);
    }

    private static async Task VerifyLocalWebHostAsync(Action<bool, string> check, string root, string appAssembly)
    {
        var appRoot = Path.Combine(root, "web");
        CopyWebRoot(appRoot);
        Environment.SetEnvironmentVariable(ModeVariable, "gate");
        var startedMarker = Path.Combine(root, "gh-started");
        var releaseMarker = Path.Combine(root, "gh-release");
        using var app = await StartApplicationAsync(appAssembly, appRoot, root);
        using var client = new HttpClient { BaseAddress = app.Address, Timeout = TimeSpan.FromSeconds(15) };

        using var home = await client.GetAsync("/");
        var homeHtml = await home.Content.ReadAsStringAsync();
        check(home.StatusCode == HttpStatusCode.OK && homeHtml.Contains("<html", StringComparison.OrdinalIgnoreCase) &&
            home.Headers.Contains("Content-Security-Policy") &&
            home.Headers.GetValues("X-Content-Type-Options").Single() == "nosniff" &&
            home.Headers.CacheControl?.NoStore == true &&
            home.Headers.GetValues("Referrer-Policy").Single() == "no-referrer",
            "MbrHttp_RootServesStaticPageWithSecurityHeaders");

        using var script = await client.GetAsync("/dashboard.js");
        check(script.StatusCode == HttpStatusCode.OK &&
            script.Content.Headers.ContentType?.MediaType == "text/javascript",
            "MbrHttp_StaticDashboardAssetIsServed");

        using var wrongHostRequest = new HttpRequestMessage(HttpMethod.Get, "/");
        wrongHostRequest.Headers.Host = "untrusted.example";
        using var wrongHost = await client.SendAsync(wrongHostRequest);
        check(wrongHost.StatusCode == HttpStatusCode.Forbidden,
            "MbrHttp_UntrustedHostIsRejectedBeforeRouting");

        using var crossSiteRequest = new HttpRequestMessage(HttpMethod.Get, "/api/snapshot?month=2026-11");
        crossSiteRequest.Headers.TryAddWithoutValidation("Sec-Fetch-Site", "cross-site");
        using var crossSite = await client.SendAsync(crossSiteRequest);
        check(crossSite.StatusCode == HttpStatusCode.Forbidden,
            "MbrHttp_CrossSiteApiReadIsRejected");

        using var invalidRead = await client.GetAsync("/api/snapshot?month=2026-13");
        using var absentRead = await client.GetAsync("/api/snapshot?month=2026-11");
        check(invalidRead.StatusCode == HttpStatusCode.BadRequest &&
            absentRead.StatusCode == HttpStatusCode.NotFound,
            "MbrHttp_SnapshotRejectsInvalidMonthAndReportsMissingObservation");

        using var invalidRefresh = await client.SendAsync(RefreshRequest(app.Address, "2026-1"));
        check(invalidRefresh.StatusCode == HttpStatusCode.BadRequest,
            "MbrHttp_RefreshRejectsNonCanonicalMonth");

        var firstRefresh = client.SendAsync(RefreshRequest(app.Address, "2026-11"));
        await WaitForFileAsync(startedMarker, TimeSpan.FromSeconds(10));
        using var duplicateRefresh = await client.SendAsync(RefreshRequest(app.Address, "2026-11"));
        check(duplicateRefresh.StatusCode == HttpStatusCode.Conflict,
            "MbrHttp_ConcurrentRefreshIsRejectedWithoutStartingAnotherCollection");

        await File.WriteAllTextAsync(releaseMarker, "release");
        using var refreshed = await firstRefresh;
        var refreshJson = await refreshed.Content.ReadAsStringAsync();
        using var refreshDocument = JsonDocument.Parse(refreshJson);
        var refreshRoot = refreshDocument.RootElement;
        var pullsStatus = refreshRoot.GetProperty("pullsSource").GetProperty("status").GetString();
        var issuesStatus = refreshRoot.GetProperty("issuesSource").GetProperty("status").GetString();
        var actionsStatus = refreshRoot.GetProperty("costs").GetProperty("actionsStatus").GetString();
        check(refreshed.StatusCode == HttpStatusCode.OK &&
            pullsStatus == "ok" && issuesStatus == "ok" && actionsStatus == "ok",
            "MbrHttp_RefreshPersistsCompleteFixtureSnapshot");

        using var savedRead = await client.GetAsync("/api/snapshot?month=2026-11");
        var savedJson = await savedRead.Content.ReadAsStringAsync();
        check(savedRead.StatusCode == HttpStatusCode.OK &&
            JsonDocument.Parse(savedJson).RootElement.GetProperty("month").GetString() == "2026-11",
            "MbrHttp_SnapshotRouteReadsCompletedObservation");

        var snapshotPath = Path.Combine(appRoot, ".local", "snapshot-2026-11.json");
        using (var locked = new FileStream(snapshotPath, FileMode.Open, FileAccess.ReadWrite, FileShare.None))
        {
            using var storageFailure = await client.GetAsync("/api/snapshot?month=2026-11");
            var failureJson = await storageFailure.Content.ReadAsStringAsync();
            check(storageFailure.StatusCode == HttpStatusCode.InternalServerError &&
                failureJson.Contains("Local snapshot read/write failed", StringComparison.Ordinal) &&
                !failureJson.Contains(snapshotPath, StringComparison.Ordinal),
                "MbrHttp_LocalSnapshotReadFailureReturnsSanitizedServerError");
        }
    }

    private static async Task VerifyCommandModesAsync(Action<bool, string> check, string root, string appAssembly)
    {
        var appRoot = Path.Combine(root, "cli");
        CopyWebRoot(appRoot);
        Environment.SetEnvironmentVariable(ModeVariable, "success");

        var past = await RunCommandAsync(appAssembly, appRoot, root, "--snapshot", "2026-10");
        using var pastJson = JsonDocument.Parse(past.Output);
        check(past.ExitCode == 0 &&
            pastJson.RootElement.GetProperty("coverage").GetString()!.StartsWith("Past UTC month", StringComparison.Ordinal),
            "MbrCli_PastMonthSnapshotUsesHistoricalCoverageLabel");

        var current = await RunCommandAsync(appAssembly, appRoot, root, "--snapshot", "2026-11");
        using var currentJson = JsonDocument.Parse(current.Output);
        check(current.ExitCode == 0 &&
            currentJson.RootElement.GetProperty("coverage").GetString() == "Month to date (UTC)",
            "MbrCli_CurrentMonthSnapshotUsesMonthToDateCoverageLabel");

        var future = await RunCommandAsync(appAssembly, appRoot, root, "--snapshot", "2026-12");
        using var futureJson = JsonDocument.Parse(future.Output);
        check(future.ExitCode == 0 &&
            futureJson.RootElement.GetProperty("coverage").GetString() == "Future period; no delivery observations yet" &&
            futureJson.RootElement.GetProperty("costs").GetProperty("actionsStatus").GetString() == "not-applicable",
            "MbrCli_FutureMonthSkipsBillingAndUsesFutureCoverageLabel");

        var invalidArguments = await RunCommandAsync(appAssembly, appRoot, root, "--unexpected");
        check(invalidArguments.ExitCode == 2 &&
            invalidArguments.Error.Contains("Usage:", StringComparison.Ordinal),
            "MbrCli_UnexpectedArgumentsReturnUsageError");
    }

    private static HttpRequestMessage RefreshRequest(Uri address, string month)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, $"/api/refresh?month={month}");
        request.Headers.TryAddWithoutValidation("Origin", address.GetLeftPart(UriPartial.Authority));
        request.Headers.TryAddWithoutValidation("Sec-Fetch-Site", "same-origin");
        request.Headers.TryAddWithoutValidation("X-MBR-Refresh", "1");
        return request;
    }

    private static async Task WaitForFileAsync(string path, TimeSpan timeout)
    {
        using var cancellation = new CancellationTokenSource(timeout);
        while (!File.Exists(path))
            await Task.Delay(10, cancellation.Token);
    }

    private static void CopyFixtureRuntime(string target)
    {
        var source = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location)!;
        foreach (var file in Directory.EnumerateFiles(source))
            File.Copy(file, Path.Combine(target, Path.GetFileName(file)), overwrite: true);
        File.Copy(
            Path.Combine(source, "JamulaMbr.Tests.exe"),
            Path.Combine(target, "gh.exe"),
            overwrite: true);
    }

    private static void CopyWebRoot(string appRoot)
    {
        var source = Path.Combine(AppContext.BaseDirectory, "wwwroot");
        var target = Path.Combine(appRoot, "wwwroot");
        Directory.CreateDirectory(target);
        foreach (var file in Directory.EnumerateFiles(source))
            File.Copy(file, Path.Combine(target, Path.GetFileName(file)), overwrite: true);
    }

    private static string FixtureBinPath(string root) => Path.Combine(root, "fake-bin");

    private static async Task<(int ExitCode, string Output, string Error)> RunCommandAsync(
        string appAssembly, string workingDirectory, string fixtureRoot, params string[] arguments)
    {
        var start = new ProcessStartInfo("dotnet")
        {
            WorkingDirectory = workingDirectory,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };
        start.ArgumentList.Add(appAssembly);
        foreach (var argument in arguments) start.ArgumentList.Add(argument);
        start.Environment[ModeVariable] = "success";
        start.Environment[RootVariable] = fixtureRoot;
        using var process = Process.Start(start) ?? throw new InvalidOperationException("Could not start MBR CLI fixture.");
        var output = process.StandardOutput.ReadToEndAsync();
        var error = process.StandardError.ReadToEndAsync();
        using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(15));
        await process.WaitForExitAsync(timeout.Token);
        return (process.ExitCode, await output, await error);
    }

    private static async Task<LocalApp> StartApplicationAsync(
        string appAssembly, string workingDirectory, string fixtureRoot)
    {
        var start = new ProcessStartInfo("dotnet")
        {
            WorkingDirectory = workingDirectory,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };
        start.ArgumentList.Add(appAssembly);
        start.Environment[ModeVariable] = "gate";
        start.Environment[RootVariable] = fixtureRoot;
        start.Environment["Logging__LogLevel__Default"] = "Information";
        var process = Process.Start(start) ?? throw new InvalidOperationException("Could not start MBR web fixture.");
        var startupTimeout = new CancellationTokenSource(TimeSpan.FromSeconds(15));
        try
        {
            while (await process.StandardOutput.ReadLineAsync(startupTimeout.Token) is { } line)
            {
                const string marker = "Now listening on: ";
                var index = line.IndexOf(marker, StringComparison.Ordinal);
                if (index >= 0 && Uri.TryCreate(line[(index + marker.Length)..].Trim(), UriKind.Absolute, out var address))
                    return new LocalApp(process, address);
                if (process.HasExited)
                    throw new InvalidOperationException("MBR web fixture exited before listening: " +
                        await process.StandardError.ReadToEndAsync());
            }
            throw new InvalidOperationException("MBR web fixture closed output before listening.");
        }
        catch
        {
            if (!process.HasExited) process.Kill(entireProcessTree: true);
            process.Dispose();
            throw;
        }
        finally
        {
            startupTimeout.Dispose();
        }
    }

    private sealed class LocalApp(Process process, Uri address) : IDisposable
    {
        public Uri Address { get; } = address;

        public void Dispose()
        {
            if (!process.HasExited)
            {
                process.Kill(entireProcessTree: true);
                process.WaitForExit();
            }
            process.Dispose();
        }
    }
}
