// Jamula hostname uptime and apex A-record drift monitor.
//
// Usage:
//   JamulaMonitor              — run live DNS + HTTPS checks
//   JamulaMonitor --self-test  — run offline monitor self-tests
//
// Exit codes:
//   0  All checks passed
//   1  DNS: no IPv4 A record resolved for apex host
//   2  DNS: A record mismatch — IP drift detected
//   3  HTTPS: request failed or timed out
//   4  HTTPS: non-200 status code
//   5  Canonical: no <link rel="canonical"> tag in response HTML
//   6  Canonical: tag found but href attribute is absent or empty
//   7  Canonical: href value does not match expected canonical URL
//   8  HTTP-to-HTTPS: redirect is missing or violates the same-host policy
//   9  Content: expected successful-page content is absent
//  10  Not found: expected HTTP 404 experience is absent

using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Text.RegularExpressions;

// ── Entry point ───────────────────────────────────────────────────────────────

if (args.Length > 0 && args[0] == "--self-test")
    return await SelfTests.RunAsync();

using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(110));
try
{
    return await Monitor.RunAsync(cts.Token);
}
catch (OperationCanceledException)
{
    Console.Error.WriteLine("::error::Monitor timed out (110-second global budget exceeded).");
    return 3;
}

// ── Configuration ─────────────────────────────────────────────────────────────

static class Config
{
    public const string ApexHost = "jamula.net";
    public const string ApprovedIp = "48.192.33.154"; // approved Azure Static Web Apps inbound IP
    public const string ExpectedCanonical = "https://jamula.net/";
    public const string ExpectedHomeTitle = "AI Strategy, Custom Software & Cloud Consulting — Jamula";
    public const string ExpectedHomeContent = "AI strategy.";
    public const string ExpectedNotFoundContent = "Page not found";
    public const string UpgradePath = "/__jamula_monitor_path_check__";
    public const string UpgradeQuery = "jamula-monitor=1";
    public const string NotFoundPath = "/__jamula_monitor_not_found__";
    public static readonly string[] ApprovedHosts =
    [
        "jamula.net",
        "www.jamula.net",
        "jamula.com",
        "www.jamula.com"
    ];
}

// ── Result types ──────────────────────────────────────────────────────────────

enum CanonicalResult
{
    Ok,
    Absent,       // no <link rel="canonical"> tag found
    MalformedHref // tag found but href attribute missing or empty
}

// ── Canonical extraction (pure, network-free, testable) ───────────────────────

static class CanonicalParser
{
    private static readonly Regex LinkTag =
        new(@"<link\b[^>]*/?>", RegexOptions.IgnoreCase | RegexOptions.Singleline);

    private static readonly Regex RelCanonical =
        new(@"(?<![a-zA-Z0-9\-])rel\s*=\s*([""'])canonical\1", RegexOptions.IgnoreCase);

    private static readonly Regex HrefAttr =
        new(@"(?<![a-zA-Z0-9\-])href\s*=\s*([""'])([^""']*)\1", RegexOptions.IgnoreCase);

    public static (CanonicalResult Result, string? Href) Extract(string html)
    {
        var canonicalTag = LinkTag.Matches(html)
            .Cast<Match>()
            .FirstOrDefault(m => RelCanonical.IsMatch(m.Value));

        if (canonicalTag is null)
            return (CanonicalResult.Absent, null);

        var hrefMatch = HrefAttr.Match(canonicalTag.Value);
        if (!hrefMatch.Success || string.IsNullOrEmpty(hrefMatch.Groups[2].Value))
            return (CanonicalResult.MalformedHref, null);

        return (CanonicalResult.Ok, hrefMatch.Groups[2].Value);
    }
}

// ── Monitor ───────────────────────────────────────────────────────────────────

static class Monitor
{
    private static readonly Regex HtmlTitle =
        new(@"<title\b[^>]*>(.*?)</title\s*>", RegexOptions.IgnoreCase | RegexOptions.Singleline);

    public static async Task<int> RunAsync(CancellationToken ct)
    {
        IPAddress[] addresses;
        try
        {
            addresses = await Dns.GetHostAddressesAsync(
                Config.ApexHost, AddressFamily.InterNetwork, ct);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            throw;
        }
        catch (SocketException ex)
        {
            Console.Error.WriteLine(
                $"::error::DNS: resolution failed for {Config.ApexHost}: {ex.Message}");
            return 1;
        }

        var ipv4Addresses = addresses
            .Where(a => a.AddressFamily == AddressFamily.InterNetwork)
            .Select(a => a.ToString())
            .Distinct()
            .OrderBy(a => a)
            .ToList();

        if (ipv4Addresses.Count == 0)
        {
            Console.Error.WriteLine(
                $"::error::DNS: {Config.ApexHost} returned no IPv4 A record (empty response).");
            return 1;
        }

        if (ipv4Addresses.Count != 1 || ipv4Addresses[0] != Config.ApprovedIp)
        {
            Console.Error.WriteLine(
                $"::error::DNS drift: {Config.ApexHost} resolves to [{string.Join(", ", ipv4Addresses)}] — "
                + $"expected exactly [{Config.ApprovedIp}].");
            return 2;
        }

        Console.WriteLine($"DNS OK: {Config.ApexHost} → {ipv4Addresses[0]}");

        using var handler = new HttpClientHandler
        {
            AllowAutoRedirect = false
        };
        using var client = new HttpClient(handler)
        {
            Timeout = TimeSpan.FromSeconds(8)
        };

        return await CheckApprovedHostsAsync(client, Config.ApprovedHosts, Console.Out, ct);
    }

    public static async Task<int> CheckApprovedHostsAsync(
        HttpClient client,
        IReadOnlyList<string> hosts,
        TextWriter output,
        CancellationToken ct)
    {
        int firstFailure = 0;
        foreach (string host in hosts)
        {
            int hostResult = await CheckHostAsync(client, host, output, ct);
            if (firstFailure == 0 && hostResult != 0)
                firstFailure = hostResult;
        }

        if (firstFailure == 0)
            output.WriteLine("All approved hostname checks passed.");

        return firstFailure;
    }

    private static async Task<int> CheckHostAsync(
        HttpClient client,
        string host,
        TextWriter output,
        CancellationToken ct)
    {
        int firstFailure = 0;
        void Fail(int code, string invariant, string detail)
        {
            output.WriteLine($"::error::{host}: {invariant}: {detail}");
            if (firstFailure == 0)
                firstFailure = code;
        }

        string? homeHtml = null;
        Uri homeUri = new($"https://{host}/");
        try
        {
            using var response = await client.GetAsync(homeUri, ct);
            int statusCode = (int)response.StatusCode;
            if (statusCode != 200)
            {
                Fail(4, "HTTPS", $"{homeUri} returned HTTP {statusCode}; expected 200.");
            }
            else
            {
                homeHtml = await response.Content.ReadAsStringAsync(ct);
                output.WriteLine($"HTTPS OK: {homeUri} → HTTP 200");
            }
        }
        catch (TaskCanceledException ex) when (!ct.IsCancellationRequested)
        {
            Fail(3, "HTTPS", $"request to {homeUri} timed out: {ex.Message}");
        }
        catch (HttpRequestException ex)
        {
            Fail(3, "HTTPS", $"request to {homeUri} failed (including TLS validation): {ex.Message}");
        }

        if (homeHtml is not null)
        {
            Match titleMatch = HtmlTitle.Match(homeHtml);
            string title = titleMatch.Success
                ? WebUtility.HtmlDecode(titleMatch.Groups[1].Value.Trim())
                : string.Empty;
            if (title != Config.ExpectedHomeTitle
                || !homeHtml.Contains(Config.ExpectedHomeContent, StringComparison.Ordinal))
            {
                Fail(9, "page content",
                    $"expected title '{Config.ExpectedHomeTitle}' and content "
                    + $"'{Config.ExpectedHomeContent}'.");
            }
            else
            {
                output.WriteLine($"Page content OK: {host}");
            }

            var (canonicalResult, href) = CanonicalParser.Extract(homeHtml);
            switch (canonicalResult)
            {
                case CanonicalResult.Absent:
                    Fail(5, "canonical URL", "no <link rel=\"canonical\"> tag found.");
                    break;
                case CanonicalResult.MalformedHref:
                    Fail(6, "canonical URL", "the canonical link has an absent or empty href.");
                    break;
                default:
                    if (href != Config.ExpectedCanonical)
                    {
                        Fail(7, "canonical URL",
                            $"got '{href}', expected '{Config.ExpectedCanonical}'.");
                    }
                    else
                    {
                        output.WriteLine($"Canonical OK: {href}");
                    }
                    break;
            }
        }

        await CheckHttpUpgradeAsync(client, host, output, ct, Fail);
        await CheckNotFoundAsync(client, host, output, ct, Fail);
        return firstFailure;
    }

    private static async Task CheckHttpUpgradeAsync(
        HttpClient client,
        string host,
        TextWriter output,
        CancellationToken ct,
        Action<int, string, string> fail)
    {
        var requestUri = new UriBuilder(Uri.UriSchemeHttp, host)
        {
            Path = Config.UpgradePath,
            Query = Config.UpgradeQuery
        }.Uri;

        try
        {
            using var response = await client.GetAsync(requestUri, ct);
            Uri? location = response.Headers.Location is null
                ? null
                : new Uri(requestUri, response.Headers.Location);
            bool validRedirect = IsRedirect(response.StatusCode)
                && location is not null
                && location.Scheme == Uri.UriSchemeHttps
                && string.Equals(location.Host, host, StringComparison.OrdinalIgnoreCase)
                && location.Port == 443
                && location.AbsolutePath == requestUri.AbsolutePath
                && location.Query == requestUri.Query;

            if (!validRedirect)
            {
                fail(8, "HTTP-to-HTTPS upgrade",
                    $"{requestUri} returned HTTP {(int)response.StatusCode} with "
                    + $"Location '{response.Headers.Location?.ToString() ?? "(absent)"}'; "
                    + "expected HTTPS on the same hostname with the same path and query.");
                return;
            }

            output.WriteLine($"HTTP upgrade OK: {requestUri} → {location}");
        }
        catch (TaskCanceledException ex) when (!ct.IsCancellationRequested)
        {
            fail(8, "HTTP-to-HTTPS upgrade", $"request to {requestUri} timed out: {ex.Message}");
        }
        catch (HttpRequestException ex)
        {
            fail(8, "HTTP-to-HTTPS upgrade", $"request to {requestUri} failed: {ex.Message}");
        }
    }

    private static async Task CheckNotFoundAsync(
        HttpClient client,
        string host,
        TextWriter output,
        CancellationToken ct,
        Action<int, string, string> fail)
    {
        Uri notFoundUri = new($"https://{host}{Config.NotFoundPath}");
        try
        {
            using var response = await client.GetAsync(notFoundUri, ct);
            string html = await response.Content.ReadAsStringAsync(ct);
            if ((int)response.StatusCode != 404
                || !html.Contains(Config.ExpectedNotFoundContent, StringComparison.Ordinal))
            {
                fail(10, "404 experience",
                    $"{notFoundUri} returned HTTP {(int)response.StatusCode}; expected HTTP 404 "
                    + $"with '{Config.ExpectedNotFoundContent}' content.");
                return;
            }

            output.WriteLine($"404 experience OK: {host}");
        }
        catch (TaskCanceledException ex) when (!ct.IsCancellationRequested)
        {
            fail(10, "404 experience", $"request to {notFoundUri} timed out: {ex.Message}");
        }
        catch (HttpRequestException ex)
        {
            fail(10, "404 experience", $"request to {notFoundUri} failed: {ex.Message}");
        }
    }

    private static bool IsRedirect(HttpStatusCode statusCode) =>
        statusCode is HttpStatusCode.MovedPermanently
            or HttpStatusCode.Found
            or HttpStatusCode.SeeOther
            or HttpStatusCode.TemporaryRedirect
            or HttpStatusCode.PermanentRedirect;
}

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

        RunCanonicalParserTests(Assert);

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

        await AssertScenarioAsync(
            "HttpsCertificateFailure_IsReportedForHostname",
            (request, _) => request.Scheme == Uri.UriSchemeHttps && request.AbsolutePath == "/"
                ? throw new HttpRequestException("certificate chain validation failed")
                : DefaultResponse(request, _),
            3,
            "jamula.net: HTTPS: request");

        await AssertScenarioAsync(
            "HttpsNonSuccessStatus_IsRejected",
            (request, _) => request.Scheme == Uri.UriSchemeHttps && request.AbsolutePath == "/"
                ? HtmlResponse(HttpStatusCode.ServiceUnavailable, HomeHtml)
                : DefaultResponse(request, _),
            4,
            "jamula.net: HTTPS:");

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

sealed class ScenarioHttpMessageHandler(Func<HttpRequestMessage, HttpResponseMessage> responseFactory)
    : HttpMessageHandler
{
    protected override Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request,
        CancellationToken cancellationToken) =>
        Task.FromResult(responseFactory(request));
}
