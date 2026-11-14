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

using System.Diagnostics;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Text.RegularExpressions;

// ── Entry point ───────────────────────────────────────────────────────────────

if (args.Length == 1 && args[0] == "--self-test")
    return await RunSelfTestsAsync();

if (args.Length > 0)
{
    Console.Error.WriteLine("Usage: JamulaMonitor [--self-test]");
    return 64;
}

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


static async Task<int> RunSelfTestsAsync()
{
    string projectPath = Path.GetFullPath(Path.Combine(
        AppContext.BaseDirectory, "..", "..", "..", "tests", "JamulaMonitor.Tests.csproj"));
    var startInfo = new ProcessStartInfo("dotnet")
    {
        WorkingDirectory = Path.GetDirectoryName(projectPath)!
    };
    startInfo.ArgumentList.Add("run");
    startInfo.ArgumentList.Add("--project");
    startInfo.ArgumentList.Add(projectPath);
    startInfo.ArgumentList.Add("--configuration");
    startInfo.ArgumentList.Add("Release");

    try
    {
        using Process? process = Process.Start(startInfo);
        if (process is null)
        {
            Console.Error.WriteLine("Unable to start monitor self-test runner.");
            return 1;
        }

        await process.WaitForExitAsync();
        return process.ExitCode;
    }
    catch (Exception ex) when (ex is InvalidOperationException or System.ComponentModel.Win32Exception)
    {
        Console.Error.WriteLine($"Unable to start monitor self-test runner: {ex.Message}");
        return 1;
    }
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

    public static Task<int> RunAsync(CancellationToken ct) =>
        RunAsync(ct, ResolveHostAddressesAsync, CreateProductionHandler);

    internal static async Task<int> RunAsync(
        CancellationToken ct,
        Func<string, AddressFamily, CancellationToken, Task<IPAddress[]>> resolveHostAddressesAsync,
        Func<HttpMessageHandler> createHandler)
    {
        IPAddress[] addresses;
        try
        {
            addresses = await resolveHostAddressesAsync(
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

        HttpMessageHandler handler = createHandler();
        HttpClient client;
        try
        {
            client = new HttpClient(handler)
            {
                Timeout = TimeSpan.FromSeconds(8)
            };
        }
        catch
        {
            handler.Dispose();
            throw;
        }

        using (client)
            return await CheckApprovedHostsAsync(client, Config.ApprovedHosts, Console.Out, ct);
    }

    private static Task<IPAddress[]> ResolveHostAddressesAsync(
        string host,
        AddressFamily addressFamily,
        CancellationToken ct) =>
        Dns.GetHostAddressesAsync(host, addressFamily, ct);

    private static HttpMessageHandler CreateProductionHandler() =>
        new HttpClientHandler
        {
            AllowAutoRedirect = false
        };

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
