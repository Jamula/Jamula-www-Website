using System.Diagnostics;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Runtime.CompilerServices;

// ── Self-tests (offline; no network or third-party packages) ──────────────────

static class SelfTests
{
    private const string HomeHtml =
        "<html><head><title>AI Strategy, Custom Software &amp; Cloud Consulting — Jamula</title>"
        + "<link rel=\"canonical\" href=\"https://jamula.net/\"></head>"
        + "<body><p>AI strategy.</p></body></html>";
    private const string NotFoundHtml =
        "<html><head><title>Page not found — Jamula</title></head>"
        + "<body><h1>Page not found</h1></body></html>";

    public static async Task<int> RunAsync()
    {
        int failures = 0;

        void Assert(string name, bool condition)
        {
            if (condition)
                Console.WriteLine($"PASS: {name}");
            else
            {
                Console.Error.WriteLine($"FAIL: {name}");
                failures++;
            }
        }

        var monitorAssembly = typeof(Monitor).Assembly;
        Assert("AssemblyMetadata_GrantsInternalsOnlyToMonitorTests",
            monitorAssembly.GetCustomAttributes(typeof(InternalsVisibleToAttribute), false)
                .Cast<InternalsVisibleToAttribute>()
                .Select(attribute => attribute.AssemblyName)
                .SequenceEqual(new[] { typeof(SelfTests).Assembly.GetName().Name })
            && typeof(SelfTests).Assembly.GetName().Name == "JamulaMonitor.Tests"
            && !typeof(Monitor).IsPublic);

        RunCanonicalParserTests(Assert);
        await RunDnsTestsAsync(Assert);
        await RunHttpCancellationTestsAsync(Assert);
        await RunCliTestsAsync(Assert);

        var successfulRun = await RunWebScenarioAsync(DefaultResponse, Config.ApprovedHosts);
        Assert("AllApprovedHosts_CheckContentCanonicalUpgradeAnd404",
            successfulRun.ExitCode == 0
            && Config.ApprovedHosts.All(host => HasAllRequestTypes(successfulRun.Requests, host))
            && successfulRun.Output.Contains("All approved hostname checks passed.", StringComparison.Ordinal));

        var failedHostRun = await RunWebScenarioAsync(
            (request, host) => host == "jamula.net"
                && request.Scheme == Uri.UriSchemeHttps
                && request.AbsolutePath == "/"
                    ? throw new HttpRequestException("certificate chain validation failed")
                    : DefaultResponse(request, host),
            Config.ApprovedHosts);
        Assert("AllApprovedHosts_ContinuesAfterOneHostFails",
            failedHostRun.ExitCode == 3
            && Config.ApprovedHosts.All(host => HasAllRequestTypes(failedHostRun.Requests, host))
            && failedHostRun.Output.Contains("jamula.net: HTTPS:", StringComparison.Ordinal)
            && Config.ApprovedHosts.Skip(1).All(host =>
                failedHostRun.Output.Contains($"HTTPS OK: https://{host}/", StringComparison.Ordinal)));

        var multipleFailuresRun = await RunWebScenarioAsync(
            (request, host) => host == "jamula.net"
                && request.Scheme == Uri.UriSchemeHttps
                && request.AbsolutePath == "/"
                    ? HtmlResponse(HttpStatusCode.ServiceUnavailable, HomeHtml)
                    : host == "www.jamula.net"
                        && request.Scheme == Uri.UriSchemeHttps
                        && request.AbsolutePath == "/"
                            ? throw new HttpRequestException("second-host fixture failure")
                            : DefaultResponse(request, host),
            Config.ApprovedHosts);
        Assert("AllApprovedHosts_RetainsFirstFailureAndContinues",
            multipleFailuresRun.ExitCode == 4
            && Config.ApprovedHosts.All(host => HasAllRequestTypes(multipleFailuresRun.Requests, host))
            && multipleFailuresRun.Output.Contains("jamula.net: HTTPS:", StringComparison.Ordinal)
            && multipleFailuresRun.Output.Contains("www.jamula.net: HTTPS:", StringComparison.Ordinal)
            && Config.ApprovedHosts.Skip(2).All(host =>
                multipleFailuresRun.Output.Contains($"HTTPS OK: https://{host}/", StringComparison.Ordinal)));

        await AssertScenarioAsync(
            "HttpsCertificateFailure_IsReportedForHostname",
            (request, _) => request.Scheme == Uri.UriSchemeHttps && request.AbsolutePath == "/"
                ? throw new HttpRequestException("certificate chain validation failed")
                : DefaultResponse(request, _),
            3,
            "jamula.net: HTTPS: request");

        await AssertScenarioAsync(
            "HttpsTimeout_IsReportedForHostname",
            (request, _) => request.Scheme == Uri.UriSchemeHttps && request.AbsolutePath == "/"
                ? throw new TaskCanceledException("fixture timeout")
                : DefaultResponse(request, _),
            3,
            "HTTPS: request to https://jamula.net/ timed out");

        await AssertScenarioAsync(
            "HttpsNonSuccessStatus_IsRejected",
            (request, _) => request.Scheme == Uri.UriSchemeHttps && request.AbsolutePath == "/"
                ? HtmlResponse(HttpStatusCode.ServiceUnavailable, HomeHtml)
                : DefaultResponse(request, _),
            4,
            "jamula.net: HTTPS:");

        await AssertScenarioAsync(
            "MalformedCanonicalHref_IsRejected",
            (request, _) => request.Scheme == Uri.UriSchemeHttps && request.AbsolutePath == "/"
                ? HtmlResponse(HttpStatusCode.OK, HomeHtml.Replace(
                    "href=\"https://jamula.net/\"", "href=\"\"", StringComparison.Ordinal))
                : DefaultResponse(request, _),
            6,
            "canonical link has an absent or empty href");

        await AssertScenarioAsync(
            "StaleHomeTitle_IsRejected",
            (request, _) => request.Scheme == Uri.UriSchemeHttps && request.AbsolutePath == "/"
                ? HtmlResponse(HttpStatusCode.OK, HomeHtml.Replace(
                    "AI Strategy, Custom Software &amp; Cloud Consulting — Jamula",
                    "Home — Jamula", StringComparison.Ordinal))
                : DefaultResponse(request, _),
            9,
            "jamula.net: page content:");

        await AssertScenarioAsync(
            "MissingHomeTitle_IsRejected",
            (request, _) => request.Scheme == Uri.UriSchemeHttps && request.AbsolutePath == "/"
                ? HtmlResponse(HttpStatusCode.OK, HomeHtml.Replace(
                    "<title>AI Strategy, Custom Software &amp; Cloud Consulting — Jamula</title>",
                    "", StringComparison.Ordinal))
                : DefaultResponse(request, _),
            9,
            "jamula.net: page content:");

        await AssertScenarioAsync(
            "UnexpectedHomeContent_IsRejected",
            (request, _) => request.Scheme == Uri.UriSchemeHttps && request.AbsolutePath == "/"
                ? HtmlResponse(HttpStatusCode.OK, HomeHtml.Replace("AI strategy.", "Other content.", StringComparison.Ordinal))
                : DefaultResponse(request, _),
            9,
            "jamula.net: page content:");

        await AssertScenarioAsync(
            "IncorrectCanonical_IsRejected",
            (request, _) => request.Scheme == Uri.UriSchemeHttps && request.AbsolutePath == "/"
                ? HtmlResponse(HttpStatusCode.OK,
                    HomeHtml.Replace(Config.ExpectedCanonical, "https://www.jamula.net/", StringComparison.Ordinal))
                : DefaultResponse(request, _),
            7,
            "jamula.net: canonical URL:");

        await AssertScenarioAsync(
            "AbsentCanonical_IsRejected",
            (request, _) => request.Scheme == Uri.UriSchemeHttps && request.AbsolutePath == "/"
                ? HtmlResponse(HttpStatusCode.OK,
                    HomeHtml.Replace("<link rel=\"canonical\" href=\"https://jamula.net/\">", "", StringComparison.Ordinal))
                : DefaultResponse(request, _),
            5,
            "jamula.net: canonical URL:");

        await AssertScenarioAsync(
            "AbsentHttpUpgrade_IsRejected",
            (request, _) => request.Scheme == Uri.UriSchemeHttp
                ? HtmlResponse(HttpStatusCode.OK, HomeHtml)
                : DefaultResponse(request, _),
            8,
            "jamula.net: HTTP-to-HTTPS upgrade:");

        await AssertScenarioAsync(
            "WrongHostHttpUpgrade_IsRejected",
            (request, _) => request.Scheme == Uri.UriSchemeHttp
                ? RedirectResponse(new Uri(
                    $"https://www.jamula.net{Config.UpgradePath}?{Config.UpgradeQuery}"))
                : DefaultResponse(request, _),
            8,
            "jamula.net: HTTP-to-HTTPS upgrade:");

        await AssertScenarioAsync(
            "HttpUpgradePathLoss_IsRejected",
            (request, _) => request.Scheme == Uri.UriSchemeHttp
                ? RedirectResponse(new Uri(
                    $"https://jamula.net/?{Config.UpgradeQuery}"))
                : DefaultResponse(request, _),
            8,
            "same path and query");

        await AssertScenarioAsync(
            "HttpUpgradeQueryLoss_IsRejected",
            (request, _) => request.Scheme == Uri.UriSchemeHttp
                ? RedirectResponse(new Uri($"https://jamula.net{Config.UpgradePath}"))
                : DefaultResponse(request, _),
            8,
            "same path and query");

        await AssertScenarioAsync(
            "NonRedirectHttpStatus_IsRejected",
            (request, _) => request.Scheme == Uri.UriSchemeHttp
                ? RedirectResponse(
                    new Uri($"https://jamula.net{Config.UpgradePath}?{Config.UpgradeQuery}"),
                    HttpStatusCode.NotModified)
                : DefaultResponse(request, _),
            8,
            "expected HTTPS on the same hostname");

        await AssertScenarioAsync(
            "HttpUpgradeWrongScheme_IsRejected",
            (request, _) => request.Scheme == Uri.UriSchemeHttp
                ? RedirectResponse(new Uri(
                    $"http://jamula.net{Config.UpgradePath}?{Config.UpgradeQuery}"))
                : DefaultResponse(request, _),
            8,
            "expected HTTPS on the same hostname");

        await AssertScenarioAsync(
            "HttpUpgradeMissingLocation_IsRejected",
            (request, _) => request.Scheme == Uri.UriSchemeHttp
                ? new HttpResponseMessage(HttpStatusCode.MovedPermanently)
                : DefaultResponse(request, _),
            8,
            "Location '(absent)'");

        await AssertScenarioAsync(
            "HttpUpgradeWrongPort_IsRejected",
            (request, _) => request.Scheme == Uri.UriSchemeHttp
                ? RedirectResponse(new Uri(
                    $"https://jamula.net:444{Config.UpgradePath}?{Config.UpgradeQuery}"))
                : DefaultResponse(request, _),
            8,
            "expected HTTPS on the same hostname");

        foreach (var statusCode in new[]
        {
            HttpStatusCode.Found,
            HttpStatusCode.SeeOther,
            HttpStatusCode.TemporaryRedirect,
            HttpStatusCode.PermanentRedirect
        })
        {
            await AssertScenarioAsync(
                $"HttpUpgrade_{statusCode}_IsAccepted",
                (request, host) => request.Scheme == Uri.UriSchemeHttp
                    ? RedirectResponse(new Uri(
                        $"https://{host}{Config.UpgradePath}?{Config.UpgradeQuery}"), statusCode)
                    : DefaultResponse(request, host),
                0,
                "HTTP upgrade OK:");
        }

        await AssertScenarioAsync(
            "HttpUpgradeTimeout_IsReported",
            (request, _) => request.Scheme == Uri.UriSchemeHttp
                ? throw new TaskCanceledException("fixture timeout")
                : DefaultResponse(request, _),
            8,
            "request to http://jamula.net/__jamula_monitor_path_check__?jamula-monitor=1 timed out");

        await AssertScenarioAsync(
            "HttpUpgradeRequestFailure_IsReported",
            (request, _) => request.Scheme == Uri.UriSchemeHttp
                ? throw new HttpRequestException("fixture connection failure")
                : DefaultResponse(request, _),
            8,
            "request to http://jamula.net/__jamula_monitor_path_check__?jamula-monitor=1 failed");

        await AssertScenarioAsync(
            "Missing404Status_IsRejected",
            (request, _) => request.AbsolutePath == Config.NotFoundPath
                ? HtmlResponse(HttpStatusCode.OK, HomeHtml)
                : DefaultResponse(request, _),
            10,
            "jamula.net: 404 experience:");

        await AssertScenarioAsync(
            "HomepageFallbackOn404_IsRejected",
            (request, _) => request.AbsolutePath == Config.NotFoundPath
                ? HtmlResponse(HttpStatusCode.NotFound, HomeHtml)
                : DefaultResponse(request, _),
            10,
            "Page not found");

        await AssertScenarioAsync(
            "NotFoundTimeout_IsReported",
            (request, _) => request.AbsolutePath == Config.NotFoundPath
                ? throw new TaskCanceledException("fixture timeout")
                : DefaultResponse(request, _),
            10,
            "404 experience: request to https://jamula.net/__jamula_monitor_not_found__ timed out");

        await AssertScenarioAsync(
            "NotFoundRequestFailure_IsReported",
            (request, _) => request.AbsolutePath == Config.NotFoundPath
                ? throw new HttpRequestException("fixture connection failure")
                : DefaultResponse(request, _),
            10,
            "404 experience: request to https://jamula.net/__jamula_monitor_not_found__ failed");

        Console.WriteLine(failures == 0
            ? "\nAll monitor self-tests passed."
            : $"\n{failures} monitor self-test(s) FAILED.");
        return failures == 0 ? 0 : 1;

        async Task AssertScenarioAsync(
            string name,
            Func<Uri, string, HttpResponseMessage> responseFactory,
            int expectedExitCode,
            string expectedDiagnostic)
        {
            var scenario = await RunWebScenarioAsync(responseFactory, ["jamula.net"]);
            Assert(name,
                scenario.ExitCode == expectedExitCode
                && scenario.Output.Contains(expectedDiagnostic, StringComparison.Ordinal));
        }
    }

    private static async Task RunDnsTestsAsync(Action<string, bool> assert)
    {
        var requests = new List<Uri>();
        bool resolverCalled = false;
        var successfulRun = await CaptureMonitorRunAsync(() => Monitor.RunAsync(
                CancellationToken.None,
                async (host, addressFamily, _) =>
                {
                    await Task.Yield();
                    resolverCalled = host == Config.ApexHost
                        && addressFamily == AddressFamily.InterNetwork;
                    return new[]
                    {
                        IPAddress.Parse(Config.ApprovedIp),
                        IPAddress.Parse(Config.ApprovedIp)
                    };
                },
                () => new ScenarioHttpMessageHandler(request =>
                {
                    Uri uri = request.RequestUri!;
                    requests.Add(uri);
                    return DefaultResponse(uri, uri.Host);
                })));
        assert("Monitor_DnsApprovedAddressRunsOfflineHostChecks",
            successfulRun.ExitCode == 0
            && !successfulRun.WasCanceled
            && resolverCalled
            && Config.ApprovedHosts.All(host => HasAllRequestTypes(requests, host)));

        ScenarioHttpMessageHandler? ownedHandler = null;
        int ownedHandlerRun = await Monitor.RunAsync(
            CancellationToken.None,
            (_, _, _) => Task.FromResult(new[] { IPAddress.Parse(Config.ApprovedIp) }),
            () => ownedHandler = new ScenarioHttpMessageHandler(request =>
            {
                Uri uri = request.RequestUri!;
                return DefaultResponse(uri, uri.Host);
            }));
        assert("Monitor_HttpClientDisposesHandlerExactlyOnce",
            ownedHandlerRun == 0 && ownedHandler?.DisposeCount == 1);

        bool socketFailureCreatedHandler = false;
        int socketFailure = await Monitor.RunAsync(
            CancellationToken.None,
            (_, _, _) => Task.FromException<IPAddress[]>(
                new SocketException((int)SocketError.HostNotFound)),
            () =>
            {
                socketFailureCreatedHandler = true;
                return CreateUnusedHandler();
            });
        assert("Monitor_DnsSocketExceptionReturnsFailureBeforeHttp",
            socketFailure == 1 && !socketFailureCreatedHandler);

        bool emptyResponseCreatedHandler = false;
        int emptyResponse = await Monitor.RunAsync(
            CancellationToken.None,
            (_, _, _) => Task.FromResult(Array.Empty<IPAddress>()),
            () =>
            {
                emptyResponseCreatedHandler = true;
                return CreateUnusedHandler();
            });
        assert("Monitor_DnsEmptyResponseReturnsFailureBeforeHttp",
            emptyResponse == 1 && !emptyResponseCreatedHandler);

        bool ipv6OnlyHandlerCreated = false;
        int ipv6OnlyResponse = await Monitor.RunAsync(
            CancellationToken.None,
            (_, _, _) => Task.FromResult(new[] { IPAddress.IPv6Loopback }),
            () =>
            {
                ipv6OnlyHandlerCreated = true;
                return CreateUnusedHandler();
            });
        assert("Monitor_DnsIpv6OnlyResponseReturnsFailureBeforeHttp",
            ipv6OnlyResponse == 1 && !ipv6OnlyHandlerCreated);

        bool driftCreatedHandler = false;
        int drift = await Monitor.RunAsync(
            CancellationToken.None,
            (_, _, _) => Task.FromResult(new[] { IPAddress.Parse("203.0.113.8") }),
            () =>
            {
                driftCreatedHandler = true;
                return CreateUnusedHandler();
            });
        assert("Monitor_DnsDriftReturnsFailureBeforeHttp",
            drift == 2 && !driftCreatedHandler);

        bool multipleAddressHandlerCreated = false;
        int multipleAddressDrift = await Monitor.RunAsync(
            CancellationToken.None,
            (_, _, _) => Task.FromResult(new[]
            {
                IPAddress.Parse(Config.ApprovedIp),
                IPAddress.Parse("203.0.113.8")
            }),
            () =>
            {
                multipleAddressHandlerCreated = true;
                return CreateUnusedHandler();
            });
        assert("Monitor_DnsMultipleDistinctAddressesAreDrift",
            multipleAddressDrift == 2 && !multipleAddressHandlerCreated);

        using var canceledCts = new CancellationTokenSource();
        canceledCts.Cancel();
        bool canceledHandlerCreated = false;
        var canceledRun = await CaptureMonitorRunAsync(() => Monitor.RunAsync(
                canceledCts.Token,
                (_, _, ct) => Task.FromCanceled<IPAddress[]>(ct),
                () =>
                {
                    canceledHandlerCreated = true;
                    return CreateUnusedHandler();
                }));
        assert("Monitor_DnsCancellationPropagatesBeforeHttp",
            canceledRun.WasCanceled && canceledCts.IsCancellationRequested && !canceledHandlerCreated);

        bool unexpectedCancellationHandlerCreated = false;
        var unexpectedCancellationRun = await CaptureMonitorRunAsync(() => Monitor.RunAsync(
                CancellationToken.None,
                (_, _, _) => Task.FromException<IPAddress[]>(
                    new OperationCanceledException("unexpected resolver cancellation")),
                () =>
                {
                    unexpectedCancellationHandlerCreated = true;
                    return CreateUnusedHandler();
                }));
        assert("Monitor_UnrequestedDnsCancellationPropagates",
            unexpectedCancellationRun.WasCanceled
            && unexpectedCancellationRun.ExitCode is null
            && !unexpectedCancellationHandlerCreated);

        bool unexpectedFailureCreatedHandler = false;
        var resolverFailure = new InvalidOperationException("unexpected resolver failure");
        Exception? observedFailure = null;
        try
        {
            await Monitor.RunAsync(
                CancellationToken.None,
                (_, _, _) => Task.FromException<IPAddress[]>(resolverFailure),
                () =>
                {
                    unexpectedFailureCreatedHandler = true;
                    return CreateUnusedHandler();
                });
        }
        catch (InvalidOperationException ex)
        {
            observedFailure = ex;
        }
        assert("Monitor_UnexpectedDnsFailurePropagatesBeforeHttp",
            ReferenceEquals(observedFailure, resolverFailure) && !unexpectedFailureCreatedHandler);
    }

    private static async Task RunHttpCancellationTestsAsync(Action<string, bool> assert)
    {
        string[] expectedRequests =
        [
            "https://jamula.net/",
            "http://jamula.net/__jamula_monitor_path_check__?jamula-monitor=1",
            "https://jamula.net/__jamula_monitor_not_found__"
        ];
        foreach (var (name, canceledRequestIndex) in new[]
        {
            ("Monitor_HomeCancellationPropagatesAndDisposesHandler", 0),
            ("Monitor_UpgradeCancellationPropagatesAndDisposesHandler", 1),
            ("Monitor_NotFoundCancellationPropagatesAndDisposesHandler", 2)
        })
        {
            using var cts = new CancellationTokenSource();
            var requests = new List<Uri>();
            var requestStarted = new TaskCompletionSource(
                TaskCreationOptions.RunContinuationsAsynchronously);
            var pendingResponse = new TaskCompletionSource<HttpResponseMessage>(
                TaskCreationOptions.RunContinuationsAsynchronously);
            bool handlerObservedCancellation = false;
            bool completedWithinBudget = false;
            ScenarioHttpMessageHandler? handler = null;
            var run = CaptureMonitorRunAsync(() => Monitor.RunAsync(
                cts.Token,
                (_, _, _) => Task.FromResult(new[] { IPAddress.Parse(Config.ApprovedIp) }),
                () => handler = new ScenarioHttpMessageHandler(async (request, token) =>
                {
                    Uri uri = request.RequestUri!;
                    requests.Add(uri);
                    if (requests.Count == canceledRequestIndex + 1)
                    {
                        using var registration = token.Register(() =>
                        {
                            handlerObservedCancellation = true;
                            pendingResponse.TrySetCanceled(token);
                        });
                        requestStarted.SetResult();
                        return await pendingResponse.Task;
                    }
                    return DefaultResponse(uri, uri.Host);
                })));

            (int? ExitCode, bool WasCanceled) result = default;
            try
            {
                await requestStarted.Task.WaitAsync(TimeSpan.FromSeconds(2));
                cts.Cancel();
                result = await run.WaitAsync(TimeSpan.FromSeconds(2));
                completedWithinBudget = true;
            }
            catch (TimeoutException)
            {
                // The cleanup below drains a request whose token was not propagated.
            }
            finally
            {
                cts.Cancel();
                pendingResponse.TrySetCanceled();
                await run.WaitAsync(TimeSpan.FromSeconds(2));
            }

            assert(name,
                completedWithinBudget && handlerObservedCancellation
                && result.WasCanceled && result.ExitCode is null
                && cts.IsCancellationRequested
                && requests.Select(uri => uri.AbsoluteUri)
                    .SequenceEqual(expectedRequests.Take(canceledRequestIndex + 1))
                && handler?.DisposeCount == 1);
        }
    }

    private static async Task<(int? ExitCode, bool WasCanceled)> CaptureMonitorRunAsync(
        Func<Task<int>> runAsync)
    {
        try
        {
            return (await runAsync(), false);
        }
        catch (OperationCanceledException)
        {
            return (null, true);
        }
    }

    private static async Task RunCliTestsAsync(Action<string, bool> assert)
    {
        var unknownArgument = await RunMonitorCliAsync("--unknown");
        assert("Cli_UnknownArgumentReturnsUsageWithoutNetwork",
            unknownArgument.ExitCode == 64
            && unknownArgument.Output.Contains("Usage: JamulaMonitor [--self-test]", StringComparison.Ordinal)
            && !unknownArgument.Output.Contains("DNS:", StringComparison.Ordinal));

        var extraSelfTestArgument = await RunMonitorCliAsync("--self-test", "unexpected");
        assert("Cli_SelfTestRejectsUnexpectedArgumentsWithoutNetwork",
            extraSelfTestArgument.ExitCode == 64
            && extraSelfTestArgument.Output.Contains("Usage: JamulaMonitor [--self-test]", StringComparison.Ordinal)
            && !extraSelfTestArgument.Output.Contains("DNS:", StringComparison.Ordinal));
    }

    private static async Task<(int ExitCode, string Output)> RunMonitorCliAsync(params string[] args)
    {
        var startInfo = new ProcessStartInfo("dotnet")
        {
            RedirectStandardError = true,
            RedirectStandardOutput = true
        };
        startInfo.ArgumentList.Add(Path.Combine(AppContext.BaseDirectory, "JamulaMonitor.dll"));
        foreach (string argument in args)
            startInfo.ArgumentList.Add(argument);

        using Process process = Process.Start(startInfo)
            ?? throw new InvalidOperationException("Unable to start monitor CLI fixture.");
        Task<string> stdout = process.StandardOutput.ReadToEndAsync();
        Task<string> stderr = process.StandardError.ReadToEndAsync();
        await process.WaitForExitAsync();
        return (process.ExitCode, await stdout + await stderr);
    }

    private static HttpMessageHandler CreateUnusedHandler() =>
        new ScenarioHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.OK));

    private static void RunCanonicalParserTests(Action<string, bool> assert)
    {
        var (validResult, validHref) = CanonicalParser.Extract(
            "<html><head><link rel=\"canonical\" href=\"https://jamula.net/\"></head></html>");
        assert("CanonicalParser_ExtractsValidCanonical",
            validResult == CanonicalResult.Ok && validHref == Config.ExpectedCanonical);

        var (absentResult, _) = CanonicalParser.Extract("<html><head></head></html>");
        assert("CanonicalParser_ReportsAbsentCanonical", absentResult == CanonicalResult.Absent);

        var (malformedResult, _) = CanonicalParser.Extract("<link rel=\"canonical\">");
        assert("CanonicalParser_ReportsMissingHref", malformedResult == CanonicalResult.MalformedHref);

        var (emptyHrefResult, _) = CanonicalParser.Extract("<link rel=\"canonical\" href=\"\">");
        assert("CanonicalParser_ReportsEmptyHref", emptyHrefResult == CanonicalResult.MalformedHref);

        var (quotedResult, quotedHref) = CanonicalParser.Extract(
            "<link href='https://jamula.net/' rel='canonical'>");
        assert("CanonicalParser_HandlesSingleQuotesAndReversedAttributes",
            quotedResult == CanonicalResult.Ok && quotedHref == Config.ExpectedCanonical);

        var (boundaryResult, _) = CanonicalParser.Extract(
            "<link data-rel=\"canonical\" data-href=\"https://jamula.net/\">");
        assert("CanonicalParser_IgnoresHyphenatedAttributePrefixes",
            boundaryResult == CanonicalResult.Absent);
    }

    private static async Task<(int ExitCode, string Output, List<Uri> Requests)> RunWebScenarioAsync(
        Func<Uri, string, HttpResponseMessage> responseFactory,
        IReadOnlyList<string> hosts)
    {
        var requests = new List<Uri>();
        using var handler = new ScenarioHttpMessageHandler((request) =>
        {
            Uri uri = request.RequestUri!;
            requests.Add(uri);
            return responseFactory(uri, uri.Host);
        });
        using var client = new HttpClient(handler)
        {
            Timeout = TimeSpan.FromSeconds(2)
        };
        using var output = new StringWriter();
        int exitCode = await Monitor.CheckApprovedHostsAsync(
            client, hosts, output, CancellationToken.None);
        return (exitCode, output.ToString(), requests);
    }

    private static bool HasAllRequestTypes(IReadOnlyList<Uri> requests, string host) =>
        requests.Any(uri =>
            uri.Host == host && uri.Scheme == Uri.UriSchemeHttps && uri.AbsolutePath == "/")
        && requests.Any(uri =>
            uri.Host == host && uri.Scheme == Uri.UriSchemeHttp
            && uri.AbsolutePath == Config.UpgradePath && uri.Query == $"?{Config.UpgradeQuery}")
        && requests.Any(uri =>
            uri.Host == host && uri.Scheme == Uri.UriSchemeHttps
            && uri.AbsolutePath == Config.NotFoundPath);

    private static HttpResponseMessage DefaultResponse(Uri request, string host)
    {
        if (request.Scheme == Uri.UriSchemeHttp)
        {
            return RedirectResponse(new Uri(
                $"https://{host}{Config.UpgradePath}?{Config.UpgradeQuery}"));
        }

        if (request.AbsolutePath == Config.NotFoundPath)
            return HtmlResponse(HttpStatusCode.NotFound, NotFoundHtml);

        return HtmlResponse(HttpStatusCode.OK, HomeHtml);
    }

    private static HttpResponseMessage HtmlResponse(HttpStatusCode statusCode, string html) =>
        new(statusCode)
        {
            Content = new StringContent(html, Encoding.UTF8, "text/html")
        };

    private static HttpResponseMessage RedirectResponse(
        Uri location,
        HttpStatusCode statusCode = HttpStatusCode.MovedPermanently)
    {
        var response = new HttpResponseMessage(statusCode);
        response.Headers.Location = location;
        return response;
    }
}

sealed class ScenarioHttpMessageHandler(
    Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>> responseFactory)
    : HttpMessageHandler
{
    public ScenarioHttpMessageHandler(Func<HttpRequestMessage, HttpResponseMessage> responseFactory)
        : this((request, _) => Task.FromResult(responseFactory(request)))
    {
    }

    public int DisposeCount { get; private set; }

    protected override Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request,
        CancellationToken cancellationToken) =>
        responseFactory(request, cancellationToken);

    protected override void Dispose(bool disposing)
    {
        if (disposing)
            DisposeCount++;

        base.Dispose(disposing);
    }
}
