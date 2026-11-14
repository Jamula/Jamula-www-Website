using System.Net;
using System.Net.Http.Json;
using System.Net.Sockets;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Hosting.Server.Features;
using Microsoft.AspNetCore.Http.Features;

const string Admin = "admin";
const string Finance = "finance";
const string Tech = "tech";

var backends = new Dictionary<string, BackendHost>(StringComparer.Ordinal)
{
    [Admin] = await BackendHost.StartAsync(Admin, "v1"),
    [Finance] = await BackendHost.StartAsync(Finance, "v1"),
    [Tech] = await BackendHost.StartAsync(Tech, "v1"),
};
await using var gateway = await GatewayHost.StartAsync(backends);

var tests = 0;
var client = new HttpClient(new HttpClientHandler
{
    AllowAutoRedirect = false,
    UseProxy = false,
});
try
{
    foreach (var section in new[] { Admin, Finance, Tech })
    {
        await AssertRouteAsync(section, "v1");
    }

    var financeAddress = backends[Finance].Address;
    await backends[Finance].DisposeAsync();
    backends[Finance] = await BackendHost.StartAsync(Finance, "v2", financeAddress);

    await AssertRouteAsync(Finance, "v2");
    await AssertRouteAsync(Admin, "v1");
    await AssertRouteAsync(Tech, "v1");
    await AssertEncodedPathAsync();
    await AssertDotSegmentPathAsync();
    await AssertUnsafeTargetAsync();
    using var missing = await client.GetAsync(new Uri(gateway.Address, "/unknown/status"));
    if (missing.StatusCode != HttpStatusCode.NotFound)
    {
        throw new InvalidOperationException("An unknown section must not be forwarded.");
    }

    tests++;
    Console.WriteLine("PASS: unknown section is rejected without upstream dispatch");

    Console.WriteLine($"{tests} local routing and replacement checks passed.");
}
finally
{
    client.Dispose();
    foreach (var backend in backends.Values)
    {
        await backend.DisposeAsync();
    }
}

async Task AssertRouteAsync(string section, string version)
{
    var requestedPath = $"/{section}/status?probe=sidequest";
    using var response = await client.GetAsync(new Uri(gateway.Address, requestedPath));
    response.EnsureSuccessStatusCode();
    var result = await response.Content.ReadFromJsonAsync<ProbeResponse>();
    var expectedRawTarget = requestedPath;
    if (result is null ||
        result.Section != section ||
        result.Version != version ||
        result.Path != requestedPath[..requestedPath.IndexOf('?')] ||
        result.Query != "?probe=sidequest" ||
        result.RawTarget != expectedRawTarget)
    {
        throw new InvalidOperationException(
            $"Expected {section}/{version} with the original path and query; received " +
            $"{result?.Section}/{result?.Version}, path={result?.Path}, " +
            $"query={result?.Query}, raw target={result?.RawTarget}.");
    }

    tests++;
    Console.WriteLine($"PASS: {section} routes to {version} and preserves path/query");
}

async Task AssertEncodedPathAsync()
{
    const string requestedTarget =
        "/finance/item%2Fpart%3Fmark%23hash?probe=one%3Ftwo%23three";
    var response = await SendRawGetAsync(gateway.Address, requestedTarget);
    if (response.StatusCode != (int)HttpStatusCode.OK ||
        response.Probe is not { } result ||
        result.Section != Finance ||
        result.Version != "v2" ||
        result.RawTarget != requestedTarget)
    {
        throw new InvalidOperationException(
            "Encoded slash, question-mark, and hash delimiters must remain in the forwarded request target.");
    }

    tests++;
    Console.WriteLine("PASS: raw HTTP preserves encoded path delimiters in the request target");
}

async Task AssertDotSegmentPathAsync()
{
    const string requestedTarget = "/finance/%2e%2e/admin/status?probe=dot-segment";
    var response = await SendRawGetAsync(gateway.Address, requestedTarget);
    if (response.StatusCode != (int)HttpStatusCode.OK ||
        response.Probe is not { } result ||
        result.Section != Finance ||
        result.Version != "v2" ||
        result.RawTarget != requestedTarget)
    {
        throw new InvalidOperationException(
            "Encoded dot segments must be forwarded byte-for-byte without changing section dispatch; " +
            $"received status={response.StatusCode}, section={response.Probe?.Section}, " +
            $"version={response.Probe?.Version}, raw target={response.Probe?.RawTarget}.");
    }

    tests++;
    Console.WriteLine("PASS: raw HTTP preserves encoded dot segments and finance dispatch");
}

async Task AssertUnsafeTargetAsync()
{
    var response = await SendRawGetAsync(gateway.Address, "//finance/status");
    if (response.StatusCode != (int)HttpStatusCode.BadRequest)
    {
        throw new InvalidOperationException("Network-path request targets must not be forwarded.");
    }

    tests++;
    Console.WriteLine("PASS: network-path request targets are rejected");
}

async Task<WireResponse> SendRawGetAsync(Uri address, string requestTarget)
{
    using var socket = new TcpClient();
    await socket.ConnectAsync(IPAddress.Parse(address.Host), address.Port);
    await using var stream = socket.GetStream();
    var request = Encoding.ASCII.GetBytes(
        $"GET {requestTarget} HTTP/1.1\r\nHost: {address.Authority}\r\nConnection: close\r\n\r\n");
    await stream.WriteAsync(request);
    await stream.FlushAsync();

    using var received = new MemoryStream();
    await stream.CopyToAsync(received);
    var responseBytes = received.ToArray();
    var headerEnd = FindHeaderEnd(responseBytes);
    if (headerEnd < 0)
    {
        throw new InvalidOperationException("The gateway returned an incomplete HTTP response.");
    }

    var headerText = Encoding.ASCII.GetString(responseBytes, 0, headerEnd);
    var statusLine = headerText[..headerText.IndexOf("\r\n", StringComparison.Ordinal)];
    var statusParts = statusLine.Split(' ', StringSplitOptions.RemoveEmptyEntries);
    if (statusParts.Length < 2 || !int.TryParse(statusParts[1], out var statusCode))
    {
        throw new InvalidOperationException($"Unexpected gateway status line: {statusLine}");
    }

    var bodyOffset = headerEnd + 4;
    var bodyLength = responseBytes.Length - bodyOffset;
    var body = responseBytes.AsSpan(bodyOffset, bodyLength).ToArray();
    if (headerText.Contains("Transfer-Encoding: chunked", StringComparison.OrdinalIgnoreCase))
    {
        body = DecodeChunkedBody(body);
    }

    var probe = statusCode == (int)HttpStatusCode.OK
        ? JsonSerializer.Deserialize<ProbeResponse>(body, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
        })
        : null;
    return new WireResponse(statusCode, probe);
}

int FindHeaderEnd(byte[] response)
{
    for (var index = 0; index <= response.Length - 4; index++)
    {
        if (response[index] == '\r' &&
            response[index + 1] == '\n' &&
            response[index + 2] == '\r' &&
            response[index + 3] == '\n')
        {
            return index;
        }
    }

    return -1;
}

byte[] DecodeChunkedBody(byte[] encodedBody)
{
    using var decoded = new MemoryStream();
    var bodyText = Encoding.ASCII.GetString(encodedBody);
    var offset = 0;
    while (true)
    {
        var lineEnd = bodyText.IndexOf("\r\n", offset, StringComparison.Ordinal);
        if (lineEnd < 0 ||
            !int.TryParse(
                bodyText[offset..lineEnd].Split(';')[0],
                System.Globalization.NumberStyles.HexNumber,
                provider: null,
                out var chunkLength))
        {
            throw new InvalidOperationException("The gateway returned an invalid chunked response.");
        }

        if (chunkLength == 0)
        {
            return decoded.ToArray();
        }

        offset = lineEnd + 2;
        var chunk = Encoding.ASCII.GetBytes(bodyText.Substring(offset, chunkLength));
        decoded.Write(chunk);
        offset += chunkLength + 2;
    }
}

internal sealed record WireResponse(int StatusCode, ProbeResponse? Probe);

internal sealed record ProbeResponse(
    string Section,
    string Version,
    string Path,
    string Query,
    string RawTarget);

internal sealed class BackendHost : IAsyncDisposable
{
    private readonly WebApplication _app;

    private BackendHost(WebApplication app, Uri address)
    {
        _app = app;
        Address = address;
    }

    public Uri Address { get; }

    public static async Task<BackendHost> StartAsync(string section, string version, Uri? address = null)
    {
        var builder = WebApplication.CreateBuilder();
        builder.WebHost.UseUrls(address?.ToString() ?? "http://127.0.0.1:0");
        var app = builder.Build();
        app.MapGet("/{**path}", (HttpContext context) => Results.Json(new ProbeResponse(
            section,
            version,
            context.Request.Path.Value ?? "/",
            context.Request.QueryString.Value ?? "",
            context.Features.Get<IHttpRequestFeature>()?.RawTarget
                ?? "")));
        await app.StartAsync();
        return new BackendHost(app, GetAddress(app));
    }

    public async ValueTask DisposeAsync()
    {
        await _app.StopAsync();
        await _app.DisposeAsync();
    }

    public static Uri GetAddress(WebApplication app)
    {
        var addresses = app.Services
            .GetRequiredService<IServer>()
            .Features.Get<IServerAddressesFeature>()?.Addresses;
        var address = addresses?.SingleOrDefault()
            ?? throw new InvalidOperationException("The local backend did not bind an address.");
        return new Uri(address);
    }
}

internal sealed class GatewayHost : IAsyncDisposable
{
    private readonly WebApplication _app;
    private readonly HttpClient _upstream;

    private GatewayHost(WebApplication app, Uri address, HttpClient upstream)
    {
        _app = app;
        Address = address;
        _upstream = upstream;
    }

    public Uri Address { get; }

    public static async Task<GatewayHost> StartAsync(IReadOnlyDictionary<string, BackendHost> backends)
    {
        var builder = WebApplication.CreateBuilder();
        builder.WebHost.UseUrls("http://127.0.0.1:0");
        var app = builder.Build();
        var upstream = new HttpClient(new HttpClientHandler
        {
            AllowAutoRedirect = false,
            UseProxy = false,
        });

        app.Run(async context =>
        {
            var rawTarget = context.Features
                .Get<IHttpRequestFeature>()?.RawTarget
                ?? throw new InvalidOperationException("The original request target is unavailable.");
            if (!IsSafeOriginFormTarget(rawTarget))
            {
                context.Response.StatusCode = StatusCodes.Status400BadRequest;
                return;
            }

            var pathEnd = rawTarget.IndexOf('?');
            var rawPath = pathEnd < 0 ? rawTarget : rawTarget[..pathEnd];
            var sectionEnd = rawPath.IndexOf('/', 1);
            var section = sectionEnd < 0 ? rawPath[1..] : rawPath[1..sectionEnd];
            if (!backends.TryGetValue(section, out var backend))
            {
                context.Response.StatusCode = StatusCodes.Status404NotFound;
                return;
            }

            var uriOptions = new UriCreationOptions
            {
                DangerousDisablePathAndQueryCanonicalization = true,
            };
            if (!Uri.TryCreate(
                    backend.Address.GetLeftPart(UriPartial.Authority) + rawTarget,
                    in uriOptions,
                    out var target))
            {
                context.Response.StatusCode = StatusCodes.Status400BadRequest;
                return;
            }
            using var request = new HttpRequestMessage(
                new HttpMethod(context.Request.Method),
                target);
            using var response = await upstream.SendAsync(request, context.RequestAborted);
            context.Response.StatusCode = (int)response.StatusCode;
            context.Response.ContentType = response.Content.Headers.ContentType?.ToString();
            await response.Content.CopyToAsync(context.Response.Body, context.RequestAborted);
        });

        await app.StartAsync();
        return new GatewayHost(app, BackendHost.GetAddress(app), upstream);
    }

    private static bool IsSafeOriginFormTarget(string rawTarget)
    {
        if (!rawTarget.StartsWith("/", StringComparison.Ordinal) ||
            rawTarget.StartsWith("//", StringComparison.Ordinal))
        {
            return false;
        }

        for (var index = 0; index < rawTarget.Length; index++)
        {
            var character = rawTarget[index];
            if (character < '!' ||
                character > '~' ||
                character is '\\' or '#')
            {
                return false;
            }

            if (character == '%' &&
                (index + 2 >= rawTarget.Length ||
                 !Uri.IsHexDigit(rawTarget[index + 1]) ||
                 !Uri.IsHexDigit(rawTarget[index + 2])))
            {
                return false;
            }

            if (character == '%')
            {
                index += 2;
            }
        }

        return true;
    }

    public async ValueTask DisposeAsync()
    {
        _upstream.Dispose();
        await _app.StopAsync();
        await _app.DisposeAsync();
    }
}
