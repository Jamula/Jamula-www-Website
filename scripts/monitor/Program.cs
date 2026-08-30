// Jamula apex uptime and A-record drift monitor.
//
// Usage:
//   JamulaMonitor              — run live DNS + HTTPS checks
//   JamulaMonitor --self-test  — run offline canonical-parser self-tests
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

using System.Net;
using System.Net.Sockets;
using System.Text.RegularExpressions;

// ── Entry point ───────────────────────────────────────────────────────────────

if (args.Length > 0 && args[0] == "--self-test")
    return SelfTests.Run();

using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(28));
try
{
    return await Monitor.RunAsync(cts.Token);
}
catch (OperationCanceledException)
{
    Console.Error.WriteLine("::error::Monitor timed out (28-second global budget exceeded).");
    return 3;
}

// ── Configuration ─────────────────────────────────────────────────────────────

static class Config
{
    public const string ApexHost = "jamula.net";
    public const string ApprovedIp = "48.192.33.154"; // approved Azure Static Web Apps inbound IP
    public const string ApexUrl = "https://jamula.net/";
    public const string ExpectedCanonical = "https://jamula.net/";
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
    // Matches any complete <link ...> or <link ... /> tag.
    private static readonly Regex LinkTag =
        new(@"<link\b[^>]*/?>", RegexOptions.IgnoreCase | RegexOptions.Singleline);

    // Checks whether a tag carries rel="canonical".  Negative lookbehind (?<![a-zA-Z0-9\-])
    // prevents matching hyphenated names such as data-rel (where \b would incorrectly match).
    private static readonly Regex RelCanonical =
        new(@"(?<![a-zA-Z0-9\-])rel\s*=\s*([""'])canonical\1", RegexOptions.IgnoreCase);

    // Extracts the href attribute value.  Same boundary guard as RelCanonical.
    private static readonly Regex HrefAttr =
        new(@"(?<![a-zA-Z0-9\-])href\s*=\s*([""'])([^""']*)\1", RegexOptions.IgnoreCase);

    /// <summary>
    /// Extracts the canonical URL from the first &lt;link rel="canonical"&gt; tag in
    /// <paramref name="html"/>.  Returns a discriminated result so callers can emit
    /// precise diagnostics for each failure mode.
    /// </summary>
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
    public static async Task<int> RunAsync(CancellationToken ct)
    {
        // ── DNS A-record check ─────────────────────────────────────────────
        IPAddress[] addresses;
        try
        {
            addresses = await Dns.GetHostAddressesAsync(
                Config.ApexHost, AddressFamily.InterNetwork, ct);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            throw; // propagates to the top-level handler → exit 3 with timeout diagnostic
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine(
                $"::error::DNS: resolution failed for {Config.ApexHost}: {ex.Message}");
            return 1;
        }

        // Collect all distinct IPv4 A records so that an unexpected address alongside
        // the approved one is not silently ignored (order-independent comparison).
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

        // ── HTTPS check ────────────────────────────────────────────────────
        HttpResponseMessage response;
        string html;
        try
        {
            // Redirects disabled: the acceptance criterion is that https://jamula.net/
            // itself returns HTTP 200, not that a redirect chain eventually reaches 200.
            using var handler = new HttpClientHandler
            {
                AllowAutoRedirect = false
            };
            using var client = new HttpClient(handler)
            {
                Timeout = TimeSpan.FromSeconds(20)
            };

            response = await client.GetAsync(Config.ApexUrl, ct);
            html = await response.Content.ReadAsStringAsync(ct);
        }
        catch (TaskCanceledException ex) when (!ct.IsCancellationRequested)
        {
            Console.Error.WriteLine(
                $"::error::HTTPS: request to {Config.ApexUrl} timed out: {ex.Message}");
            return 3;
        }
        catch (HttpRequestException ex)
        {
            Console.Error.WriteLine(
                $"::error::HTTPS: request to {Config.ApexUrl} failed: {ex.Message}");
            return 3;
        }

        int statusCode = (int)response.StatusCode;
        if (statusCode != 200)
        {
            Console.Error.WriteLine(
                $"::error::HTTPS: {Config.ApexUrl} returned HTTP {statusCode} "
                + $"{response.ReasonPhrase} — expected 200 (redirects not followed).");
            return 4;
        }

        Console.WriteLine($"HTTPS OK: {Config.ApexUrl} → HTTP {statusCode}");

        // ── Canonical check ────────────────────────────────────────────────
        var (result, href) = CanonicalParser.Extract(html);
        switch (result)
        {
            case CanonicalResult.Absent:
                Console.Error.WriteLine(
                    $"::error::Canonical: no <link rel=\"canonical\"> tag found in "
                    + $"{Config.ApexUrl} response HTML.");
                return 5;

            case CanonicalResult.MalformedHref:
                Console.Error.WriteLine(
                    $"::error::Canonical: <link rel=\"canonical\"> found but href attribute "
                    + $"is absent or empty in {Config.ApexUrl} response HTML.");
                return 6;

            default:
                if (href != Config.ExpectedCanonical)
                {
                    Console.Error.WriteLine(
                        $"::error::Canonical mismatch: got '{href}', "
                        + $"expected '{Config.ExpectedCanonical}'.");
                    return 7;
                }
                Console.WriteLine($"Canonical OK: {href}");
                break;
        }

        Console.WriteLine("All checks passed.");
        return 0;
    }
}

// ── Self-tests (offline, covers all CanonicalParser paths) ────────────────────

static class SelfTests
{
    public static int Run()
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

        // 1. Valid canonical — double quotes, standard attribute order
        {
            const string html = """
                <html><head>
                <link rel="canonical" href="https://jamula.net/">
                </head></html>
                """;
            var (r, h) = CanonicalParser.Extract(html);
            Assert("Valid canonical — result is Ok", r == CanonicalResult.Ok);
            Assert("Valid canonical — href matches expected", h == Config.ExpectedCanonical);
        }

        // 2. Absent canonical — no link tag at all
        {
            const string html = """
                <html><head><meta charset="utf-8"></head><body></body></html>
                """;
            var (r, _) = CanonicalParser.Extract(html);
            Assert("Absent canonical — result is Absent", r == CanonicalResult.Absent);
        }

        // 3. Malformed: rel="canonical" tag present but no href attribute
        {
            const string html = """
                <html><head><link rel="canonical"></head></html>
                """;
            var (r, _) = CanonicalParser.Extract(html);
            Assert("Malformed canonical (no href) — result is MalformedHref",
                r == CanonicalResult.MalformedHref);
        }

        // 4. Canonical mismatch — www prefix present (wrong value)
        {
            const string html = """
                <html><head>
                <link rel="canonical" href="https://www.jamula.net/">
                </head></html>
                """;
            var (r, h) = CanonicalParser.Extract(html);
            Assert("Mismatch canonical — result is Ok (href captured)", r == CanonicalResult.Ok);
            Assert("Mismatch canonical — href is NOT the expected value",
                h != Config.ExpectedCanonical);
            Assert("Mismatch canonical — href is the www variant",
                h == "https://www.jamula.net/");
        }

        // 5. Single-quoted attributes
        {
            const string html =
                "<html><head><link rel='canonical' href='https://jamula.net/'></head></html>";
            var (r, h) = CanonicalParser.Extract(html);
            Assert("Single-quoted canonical — result is Ok", r == CanonicalResult.Ok);
            Assert("Single-quoted canonical — href matches", h == Config.ExpectedCanonical);
        }

        // 6. Reversed attribute order (href before rel)
        {
            const string html = """
                <html><head>
                <link href="https://jamula.net/" rel="canonical">
                </head></html>
                """;
            var (r, h) = CanonicalParser.Extract(html);
            Assert("Reversed attributes — result is Ok", r == CanonicalResult.Ok);
            Assert("Reversed attributes — href matches", h == Config.ExpectedCanonical);
        }

        // 7. Hyphenated-attribute guard — data-rel / data-href must not match
        {
            const string html = """
                <html><head>
                <link data-rel="canonical" data-href="https://jamula.net/">
                </head></html>
                """;
            var (r, _) = CanonicalParser.Extract(html);
            Assert("Hyphenated-prefix guard — result is Absent", r == CanonicalResult.Absent);
        }

        Console.WriteLine(failures == 0
            ? "\nAll 7 self-tests passed."
            : $"\n{failures} self-test(s) FAILED.");

        return failures == 0 ? 0 : 1;
    }
}
