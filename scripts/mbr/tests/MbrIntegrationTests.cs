using System.Diagnostics;
using System.Globalization;
using System.Net;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text.Json;
using JamulaMbr;
using Microsoft.Win32.SafeHandles;

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
            await File.WriteAllTextAsync(Path.Combine(root, $"gh-started-{Environment.ProcessId}"), endpoint);
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
            var marker = Path.Combine(root, "gh-delayed");
            await File.WriteAllTextAsync(marker + ".tmp", Environment.ProcessId.ToString(CultureInfo.InvariantCulture));
            File.Move(marker + ".tmp", marker);
            await Task.Delay(Timeout.InfiniteTimeSpan);
            return 0;
        }

        if (!endpoint.Contains("/billing/usage/summary?", StringComparison.Ordinal))
        {
            Console.WriteLine("[]");
            return 0;
        }

        await File.WriteAllTextAsync(Path.Combine(root, "billing-request"), endpoint);
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
        var apiMonth = FormatMonth(UtcMonthStart(DateTimeOffset.UtcNow).AddMonths(-1));

        await WithCleanupAsync(async () =>
        {
            CopyFixtureRuntime(fixtureBin);
            Environment.SetEnvironmentVariable("PATH", fixtureBin + Path.PathSeparator + originalPath);
            Environment.SetEnvironmentVariable(RootVariable, root);

            await VerifyGitHubCollectionAsync(check, root, originalPath);
            await VerifyLocalWebHostAsync(check, root, appAssembly, apiMonth);
            await VerifyWebFailureCleanupAsync(check, root, appAssembly, apiMonth);
            await VerifyWebTreeTerminationAsync(check, root, appAssembly, apiMonth);
            await VerifyCommandModesAsync(check, root, appAssembly);
            await VerifyCleanupFailuresAsync(check);
        }, () =>
        {
            Environment.SetEnvironmentVariable("PATH", originalPath);
            Environment.SetEnvironmentVariable(ModeVariable, originalMode);
            Environment.SetEnvironmentVariable(RootVariable, originalRoot);
            if (Directory.Exists(root)) Directory.Delete(root, recursive: true);
            return Task.CompletedTask;
        });
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
        using var cancellation = new CancellationTokenSource(TimeSpan.FromSeconds(10));
        var collection = GitHub.CollectAsync(true, cancellation.Token);
        await WithCleanupAsync(async () =>
        {
            var delayedMarker = Path.Combine(root, "gh-delayed");
            await WaitForFileAsync(delayedMarker, TimeSpan.FromSeconds(5));
            using var provider = Process.GetProcessById(int.Parse(await File.ReadAllTextAsync(delayedMarker), CultureInfo.InvariantCulture));
            _ = provider.SafeHandle;
            cancellation.Cancel();
            var cancelled = false;
            try { await collection; }
            catch (OperationCanceledException) { cancelled = true; }
            check(cancelled && provider.WaitForExit(0),
                "GitHubCollect_CallerCancellationPropagatesAndStopsProvider");
        }, async () =>
        {
            cancellation.Cancel();
            try { await collection; }
            catch (OperationCanceledException) when (cancellation.IsCancellationRequested) { }
        });

        Environment.SetEnvironmentVariable(ModeVariable, "success");
        Environment.SetEnvironmentVariable("PATH", "");
        var missingExecutable = await GitHub.CollectAsync(true, CancellationToken.None);
        check(missingExecutable.Status == "unavailable" && missingExecutable.Items is null,
            "GitHubCollect_MissingProviderExecutableRemainsUnknown");
        Environment.SetEnvironmentVariable("PATH", FixtureBinPath(root) + Path.PathSeparator + originalPath);
    }

    private static async Task VerifyLocalWebHostAsync(
        Action<bool, string> check, string root, string appAssembly, string month)
    {
        var appRoot = Path.Combine(root, "web");
        CopyWebRoot(appRoot);
        Environment.SetEnvironmentVariable(ModeVariable, "gate");
        var releaseMarker = Path.Combine(root, "gh-release");
        var app = await StartApplicationAsync(appAssembly, appRoot, root);
        using var client = new HttpClient { BaseAddress = app.Address, Timeout = TimeSpan.FromSeconds(15) };
        Task<HttpResponseMessage>? firstRefresh = null;

        await WithCleanupAsync(async () =>
        {
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

            using var crossSiteRequest = new HttpRequestMessage(HttpMethod.Get, $"/api/snapshot?month={month}");
            crossSiteRequest.Headers.TryAddWithoutValidation("Sec-Fetch-Site", "cross-site");
            using var crossSite = await client.SendAsync(crossSiteRequest);
            check(crossSite.StatusCode == HttpStatusCode.Forbidden,
                "MbrHttp_CrossSiteApiReadIsRejected");

            using var invalidRead = await client.GetAsync("/api/snapshot?month=2026-13");
            using var absentRead = await client.GetAsync($"/api/snapshot?month={month}");
            check(invalidRead.StatusCode == HttpStatusCode.BadRequest &&
                absentRead.StatusCode == HttpStatusCode.NotFound,
                "MbrHttp_SnapshotRejectsInvalidMonthAndReportsMissingObservation");

            using var invalidRefresh = await client.SendAsync(RefreshRequest(app.Address, "2026-1"));
            check(invalidRefresh.StatusCode == HttpStatusCode.BadRequest,
                "MbrHttp_RefreshRejectsNonCanonicalMonth");

            firstRefresh = client.SendAsync(RefreshRequest(app.Address, month));
            await WaitForProvidersAsync(root, TimeSpan.FromSeconds(10));
            using var duplicateRefresh = await client.SendAsync(RefreshRequest(app.Address, month));
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

            using var savedRead = await client.GetAsync($"/api/snapshot?month={month}");
            var savedJson = await savedRead.Content.ReadAsStringAsync();
            check(savedRead.StatusCode == HttpStatusCode.OK &&
                JsonDocument.Parse(savedJson).RootElement.GetProperty("month").GetString() == month,
                "MbrHttp_SnapshotRouteReadsCompletedObservation");

            var snapshotPath = Path.Combine(appRoot, ".local", $"snapshot-{month}.json");
            using (var locked = new FileStream(snapshotPath, FileMode.Open, FileAccess.ReadWrite, FileShare.None))
            {
                using var storageFailure = await client.GetAsync($"/api/snapshot?month={month}");
                var failureJson = await storageFailure.Content.ReadAsStringAsync();
                check(storageFailure.StatusCode == HttpStatusCode.InternalServerError &&
                    failureJson.Contains("Local snapshot read/write failed", StringComparison.Ordinal) &&
                    !failureJson.Contains(snapshotPath, StringComparison.Ordinal),
                    "MbrHttp_LocalSnapshotReadFailureReturnsSanitizedServerError");
            }
        }, async () =>
        {
            await WithCleanupAsync(async () =>
            {
                // Complete the owned request before terminating the host; the job also covers aborted requests.
                await File.WriteAllTextAsync(releaseMarker, "release");
                if (firstRefresh is not null) (await firstRefresh).Dispose();
            }, () =>
            {
                app.Dispose();
                return Task.CompletedTask;
            });
        });
    }

    private static async Task VerifyCommandModesAsync(Action<bool, string> check, string root, string appAssembly)
    {
        var appRoot = Path.Combine(root, "cli");
        CopyWebRoot(appRoot);
        Environment.SetEnvironmentVariable(ModeVariable, "success");

        var currentMonthStart = UtcMonthStart(DateTimeOffset.UtcNow);
        var pastMonth = FormatMonth(currentMonthStart.AddMonths(-1));
        var currentMonth = FormatMonth(currentMonthStart);
        var futureMonth = FormatMonth(currentMonthStart.AddMonths(2));

        var past = await RunCommandAsync(appAssembly, appRoot, root, "--snapshot", pastMonth);
        using var pastJson = JsonDocument.Parse(past.Output);
        check(past.ExitCode == 0 &&
            pastJson.RootElement.GetProperty("coverage").GetString()!.StartsWith("Past UTC month", StringComparison.Ordinal),
            "MbrCli_PastMonthSnapshotUsesHistoricalCoverageLabel");

        var current = await RunCommandAsync(appAssembly, appRoot, root, "--snapshot", currentMonth);
        using var currentJson = JsonDocument.Parse(current.Output);
        var observedAt = currentJson.RootElement.GetProperty("observedAt").GetDateTimeOffset();
        var currentCoverage = currentJson.RootElement.GetProperty("coverage").GetString();
        var expectedCurrentCoverage = currentMonthStart > observedAt
            ? "Future period; no delivery observations yet"
            : currentMonthStart.AddMonths(1) > observedAt
                ? "Month to date (UTC)"
                : "Past UTC month; latest state, not an archived month-end snapshot";
        check(current.ExitCode == 0 &&
            currentCoverage == expectedCurrentCoverage,
            "MbrCli_CurrentMonthSnapshotUsesUtcDateStableCoverageLabel");

        var billingRequestPath = Path.Combine(root, "billing-request");
        if (File.Exists(billingRequestPath)) File.Delete(billingRequestPath);
        var future = await RunCommandAsync(appAssembly, appRoot, root, "--snapshot", futureMonth);
        using var futureJson = JsonDocument.Parse(future.Output);
        check(future.ExitCode == 0 &&
            futureJson.RootElement.GetProperty("coverage").GetString() == "Future period; no delivery observations yet" &&
            futureJson.RootElement.GetProperty("costs").GetProperty("actionsStatus").GetString() == "not-applicable" &&
            !File.Exists(billingRequestPath),
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

    private static async Task WaitForProvidersAsync(string root, TimeSpan timeout)
    {
        using var cancellation = new CancellationTokenSource(timeout);
        while (Directory.GetFiles(root, "gh-started-*").Length < 2)
            await Task.Delay(10, cancellation.Token);
    }

    private static async Task WithCleanupAsync(Func<Task> body, Func<Task> cleanup)
    {
        Exception? failure = null;
        try { await body(); }
        catch (Exception ex)
        {
            failure = ex;
            throw;
        }
        finally
        {
            try { await cleanup(); }
            catch (Exception ex) when (failure is not null)
            {
                throw new AggregateException("MBR fixture failed and cleanup also failed.", failure, ex);
            }
        }
    }

    private static async Task VerifyCleanupFailuresAsync(Action<bool, string> check)
    {
        var original = new InvalidOperationException("original fixture failure");
        var cleanup = new IOException("fixture cleanup failure");
        AggregateException? observed = null;
        try
        {
            await WithCleanupAsync(() => Task.FromException(original), () => Task.FromException(cleanup));
        }
        catch (AggregateException ex) { observed = ex; }
        check(observed?.InnerExceptions.Count == 2 &&
            ReferenceEquals(observed.InnerExceptions[0], original) &&
            ReferenceEquals(observed.InnerExceptions[1], cleanup),
            "MbrFixture_CleanupFailurePreservesOriginalFailure");
    }

    private static async Task VerifyWebFailureCleanupAsync(
        Action<bool, string> check, string root, string appAssembly, string month)
    {
        var failureRoot = Path.Combine(root, "failed-web");
        Directory.CreateDirectory(failureRoot);
        var original = new InvalidOperationException("injected assertion failure while providers are gated");
        var providers = new List<Process>();
        Exception? observed = null;
        try
        {
            await VerifyLocalWebHostAsync((condition, name) =>
            {
                if (name != "MbrHttp_ConcurrentRefreshIsRejectedWithoutStartingAnotherCollection")
                {
                    if (!condition) throw new InvalidOperationException("Failure-cleanup setup failed: " + name);
                    return;
                }
                CaptureGatedProviders(failureRoot, providers);
                throw original;
            }, failureRoot, appAssembly, month);
        }
        catch (Exception ex) { observed = ex; }
        try
        {
            if (!ReferenceEquals(observed, original))
                throw new InvalidOperationException("Unexpected web-fixture failure during cleanup regression.", observed);
            check(ReferenceEquals(observed, original) && providers.Count == 2 &&
                providers.All(provider => provider.WaitForExit(0)) &&
                File.Exists(Path.Combine(failureRoot, "web", ".local", $"snapshot-{month}.json")),
                "MbrFixture_FailedWebAssertionSettlesRefreshAndExitsOwnedProviders");
        }
        finally
        {
            foreach (var provider in providers) provider.Dispose();
        }
    }

    private static async Task VerifyWebTreeTerminationAsync(
        Action<bool, string> check, string root, string appAssembly, string month)
    {
        var terminatedRoot = Path.Combine(root, "terminated-web");
        Directory.CreateDirectory(terminatedRoot);
        var appRoot = Path.Combine(terminatedRoot, "web");
        CopyWebRoot(appRoot);
        var app = await StartApplicationAsync(appAssembly, appRoot, terminatedRoot);
        using var client = new HttpClient { BaseAddress = app.Address, Timeout = TimeSpan.FromSeconds(15) };
        Task<HttpResponseMessage>? refresh = null;
        var providers = new List<Process>();
        try
        {
            await WithCleanupAsync(async () =>
            {
                refresh = client.SendAsync(RefreshRequest(app.Address, month));
                await WaitForProvidersAsync(terminatedRoot, TimeSpan.FromSeconds(10));
                CaptureGatedProviders(terminatedRoot, providers);
            }, () =>
            {
                app.Dispose();
                return Task.CompletedTask;
            });
            var disconnected = false;
            try { (await refresh!).Dispose(); }
            catch (HttpRequestException) { disconnected = true; }
            check(disconnected && providers.Count == 2 && providers.All(provider => provider.WaitForExit(0)) &&
                !File.Exists(Path.Combine(appRoot, ".local", $"snapshot-{month}.json")),
                "MbrFixture_ForcedHostTerminationWaitsForGatedProviderTree");
        }
        finally
        {
            foreach (var provider in providers) provider.Dispose();
        }
    }

    private static void CaptureGatedProviders(string root, List<Process> providers)
    {
        foreach (var marker in Directory.GetFiles(root, "gh-started-*"))
        {
            var provider = Process.GetProcessById(int.Parse(Path.GetFileName(marker)["gh-started-".Length..],
                CultureInfo.InvariantCulture));
            _ = provider.SafeHandle;
            providers.Add(provider);
        }
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

    private static DateTimeOffset UtcMonthStart(DateTimeOffset date) =>
        new(date.Year, date.Month, 1, 0, 0, 0, TimeSpan.Zero);

    private static string FormatMonth(DateTimeOffset month) =>
        month.ToString("yyyy-MM", CultureInfo.InvariantCulture);

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
        FixtureProcessJob? job = null;
        var startupTimeout = new CancellationTokenSource(TimeSpan.FromSeconds(15));
        try
        {
            // Attach before any HTTP request can start a provider; descendants inherit job membership.
            job = new FixtureProcessJob(process);
            while (await process.StandardOutput.ReadLineAsync(startupTimeout.Token) is { } line)
            {
                const string marker = "Now listening on: ";
                var index = line.IndexOf(marker, StringComparison.Ordinal);
                if (index >= 0 && Uri.TryCreate(line[(index + marker.Length)..].Trim(), UriKind.Absolute, out var address))
                    return new LocalApp(process, address, job);
                if (process.HasExited)
                    throw new InvalidOperationException("MBR web fixture exited before listening: " +
                        await process.StandardError.ReadToEndAsync());
            }
            throw new InvalidOperationException("MBR web fixture closed output before listening.");
        }
        catch (Exception failure)
        {
            await WithCleanupAsync(() => Task.FromException(failure), async () =>
            {
                if (job is not null) job.Dispose();
                else if (!process.HasExited) process.Kill(entireProcessTree: true);
                await process.WaitForExitAsync();
                process.Dispose();
            });
            throw;
        }
        finally
        {
            startupTimeout.Dispose();
        }
    }

    private sealed class LocalApp(Process process, Uri address, FixtureProcessJob job) : IDisposable
    {
        public Uri Address { get; } = address;

        public void Dispose()
        {
            job.Dispose();
            process.WaitForExit();
            process.Dispose();
        }
    }

    private sealed class FixtureProcessJob : IDisposable
    {
        private const int AssociateCompletionPortInformation = 7;
        private const uint ActiveProcessZero = 4;
        private readonly SafeFileHandle job;
        private readonly SafeFileHandle completionPort;

        public FixtureProcessJob(Process process)
        {
            job = CreateJobObjectW(IntPtr.Zero, null);
            if (job.IsInvalid) throw new System.ComponentModel.Win32Exception(Marshal.GetLastWin32Error());
            completionPort = CreateIoCompletionPort(new IntPtr(-1), IntPtr.Zero, UIntPtr.Zero, 1);
            try
            {
                if (completionPort.IsInvalid) throw new System.ComponentModel.Win32Exception(Marshal.GetLastWin32Error());
                var association = new CompletionPortAssociation { Port = completionPort.DangerousGetHandle() };
                if (!SetInformationJobObject(job, AssociateCompletionPortInformation, ref association,
                    (uint)Marshal.SizeOf<CompletionPortAssociation>()) ||
                    !AssignProcessToJobObject(job, process.SafeHandle))
                    throw new System.ComponentModel.Win32Exception(Marshal.GetLastWin32Error());
            }
            catch
            {
                completionPort.Dispose();
                job.Dispose();
                throw;
            }
        }

        public void Dispose()
        {
            try
            {
                if (!TerminateJobObject(job, 1))
                    throw new System.ComponentModel.Win32Exception(Marshal.GetLastWin32Error());
                var deadline = Stopwatch.StartNew();
                while (true)
                {
                    var remaining = Math.Max(0, 15000 - deadline.ElapsedMilliseconds);
                    if (!GetQueuedCompletionStatus(completionPort, out var message, out _, out _, (uint)remaining))
                        throw new System.ComponentModel.Win32Exception(Marshal.GetLastWin32Error());
                    // WaitForExit on the parent alone does not wait for terminated descendants.
                    if (message == ActiveProcessZero) break;
                }
            }
            finally
            {
                completionPort.Dispose();
                job.Dispose();
            }
        }

        [StructLayout(LayoutKind.Sequential)]
        private struct CompletionPortAssociation
        {
            public IntPtr Key;
            public IntPtr Port;
        }

        [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
        private static extern SafeFileHandle CreateJobObjectW(IntPtr attributes, string? name);

        [DllImport("kernel32.dll", SetLastError = true)]
        private static extern SafeFileHandle CreateIoCompletionPort(IntPtr file, IntPtr existingPort, UIntPtr key, uint threads);

        [DllImport("kernel32.dll", SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool SetInformationJobObject(SafeFileHandle job, int infoClass,
            ref CompletionPortAssociation information, uint size);

        [DllImport("kernel32.dll", SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool AssignProcessToJobObject(SafeFileHandle job, SafeProcessHandle process);

        [DllImport("kernel32.dll", SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool TerminateJobObject(SafeFileHandle job, uint exitCode);

        [DllImport("kernel32.dll", SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool GetQueuedCompletionStatus(SafeFileHandle port, out uint message,
            out UIntPtr key, out IntPtr overlapped, uint timeout);
    }
}
