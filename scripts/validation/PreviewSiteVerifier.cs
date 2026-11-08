using System.Net;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace JamulaValidation;

public static class PreviewSiteVerifier
{
    private const int ReadinessAttempts = 18;
    private const int MaxBodyBytes = 5 * 1024 * 1024;
    private static readonly Regex AllowedHost = new(
        @"^ashy-beach-033c7d01e-[1-9][0-9]*\.7\.azurestaticapps\.net$",
        RegexOptions.CultureInvariant | RegexOptions.Compiled);

    public static HttpClient CreateHttpClient()
    {
        var handler = CreateHttpHandler();
        return new HttpClient(handler) { Timeout = TimeSpan.FromSeconds(20) };
    }

    public static SocketsHttpHandler CreateHttpHandler() => new() { AllowAutoRedirect = false };

    public static async Task VerifyAsync(
        string url,
        string trustedConfigPath,
        HttpClient client,
        TextWriter errorWriter,
        Func<TimeSpan, CancellationToken, Task>? delayAsync = null,
        CancellationToken cancellationToken = default)
    {
        var uri = ParseAllowedUrl(url);
        using var expected = JsonDocument.Parse(await File.ReadAllTextAsync(trustedConfigPath, cancellationToken));
        var baseUrl = uri.GetLeftPart(UriPartial.Authority);
        HttpResponseMessage? homeResponse = null;
        var home = string.Empty;
        for (var attempt = 0; attempt < ReadinessAttempts; attempt++)
        {
            try
            {
                homeResponse = await client.GetAsync(baseUrl + "/", HttpCompletionOption.ResponseHeadersRead, cancellationToken);
                homeResponse.EnsureSuccessStatusCode();
                home = await ReadBodyAsync(homeResponse.Content, cancellationToken);
                break;
            }
            catch (Exception error) when (error is HttpRequestException or TaskCanceledException)
            {
                errorWriter.WriteLine($"Preview readiness attempt {attempt + 1} failed: {error.Message}");
                homeResponse?.Dispose();
                homeResponse = null;
                if (attempt == ReadinessAttempts - 1)
                {
                    throw;
                }

                await (delayAsync ?? Task.Delay)(TimeSpan.FromSeconds(10), cancellationToken);
            }
        }

        if (homeResponse is null)
        {
            throw new HttpRequestException("The preview did not become ready.");
        }

        using (homeResponse)
        {
            if (!Regex.IsMatch(home, @"<title>[^<]*Jamula", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant))
            {
                throw new InvalidDataException("The preview home page has an unexpected title.");
            }

            foreach (var header in expected.RootElement.GetProperty("globalHeaders").EnumerateObject())
            {
                if (!homeResponse.Headers.TryGetValues(header.Name, out var values) ||
                    !string.Equals(string.Join(", ", values), header.Value.GetString(), StringComparison.Ordinal))
                {
                    throw new InvalidDataException($"The preview has an unexpected {header.Name} header.");
                }
            }

            if (!homeResponse.Headers.TryGetValues("Strict-Transport-Security", out var hsts) ||
                !hsts.Any(value => !string.IsNullOrWhiteSpace(value)))
            {
                throw new InvalidDataException("The preview does not enforce HSTS.");
            }

            if (!homeResponse.Headers.TryGetValues("X-Robots-Tag", out var robotsTag) ||
                !robotsTag.Any(value => value.Contains("none", StringComparison.OrdinalIgnoreCase)))
            {
                throw new InvalidDataException("The preview does not enforce X-Robots-Tag: none.");
            }
        }

        using (var robotsResponse = await client.GetAsync(baseUrl + "/robots.txt", HttpCompletionOption.ResponseHeadersRead, cancellationToken))
        {
            robotsResponse.EnsureSuccessStatusCode();
            if (!string.Equals(robotsResponse.Content.Headers.ContentType?.MediaType, "text/plain", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidDataException("The preview robots.txt MIME type is not text/plain.");
            }
        }

        using var missingResponse = await client.GetAsync(baseUrl + "/__jamula_missing_route__", HttpCompletionOption.ResponseHeadersRead, cancellationToken);
        var missingBody = await ReadBodyAsync(missingResponse.Content, cancellationToken);
        if (missingResponse.StatusCode != HttpStatusCode.NotFound ||
            !missingBody.Contains("Page not found", StringComparison.Ordinal))
        {
            if (missingResponse.StatusCode == HttpStatusCode.NotFound)
            {
                throw new InvalidDataException("The preview does not serve the expected 404 page.");
            }

            throw new InvalidDataException("The preview missing route did not return 404.");
        }
    }

    public static Uri ParseAllowedUrl(string url)
    {
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri) ||
            !string.Equals(uri.Scheme, Uri.UriSchemeHttps, StringComparison.Ordinal) ||
            !string.IsNullOrEmpty(uri.UserInfo) ||
            !uri.IsDefaultPort ||
            !AllowedHost.IsMatch(uri.Host) ||
            uri.AbsolutePath is not ("" or "/") ||
            !string.IsNullOrEmpty(uri.Query) ||
            !string.IsNullOrEmpty(uri.Fragment))
        {
            throw new ArgumentException("Only an isolated Jamula PR preview URL may be verified.");
        }

        // Reject non-default explicit ports even though Uri normalizes :443 to the default port.
        var authority = Regex.Match(url, @"^https://([^/?#]*)", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
        if (!authority.Success || !string.Equals(authority.Groups[1].Value, uri.Host, StringComparison.Ordinal))
        {
            throw new ArgumentException("Only an isolated Jamula PR preview URL may be verified.");
        }

        return uri;
    }

    private static async Task<string> ReadBodyAsync(HttpContent content, CancellationToken cancellationToken)
    {
        await using var stream = await content.ReadAsStreamAsync(cancellationToken);
        var buffer = new byte[MaxBodyBytes];
        var count = 0;
        while (count < buffer.Length)
        {
            var read = await stream.ReadAsync(buffer.AsMemory(count, buffer.Length - count), cancellationToken);
            if (read == 0)
            {
                break;
            }

            count += read;
        }

        return Encoding.UTF8.GetString(buffer, 0, count);
    }
}
