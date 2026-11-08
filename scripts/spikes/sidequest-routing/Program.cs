using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Hosting.Server.Features;

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
var client = new HttpClient(new HttpClientHandler { AllowAutoRedirect = false });
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
    if (result is null ||
        result.Section != section ||
        result.Version != version ||
        result.Path != requestedPath[..requestedPath.IndexOf('?')] ||
        result.Query != "?probe=sidequest")
    {
        throw new InvalidOperationException(
            $"Expected {section}/{version} with the original path and query.");
    }

    tests++;
    Console.WriteLine($"PASS: {section} routes to {version} and preserves path/query");
}

internal sealed record ProbeResponse(string Section, string Version, string Path, string Query);

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
            context.Request.QueryString.Value ?? "")));
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
        var upstream = new HttpClient(new HttpClientHandler { AllowAutoRedirect = false });

        app.Map("/{section}/{**path}", async (HttpContext context) =>
        {
            var section = context.Request.RouteValues["section"]?.ToString();
            if (section is null || !backends.TryGetValue(section, out var backend))
            {
                context.Response.StatusCode = StatusCodes.Status404NotFound;
                return;
            }

            var target = new Uri(
                backend.Address,
                (context.Request.Path.Value ?? "/") + context.Request.QueryString);
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

    public async ValueTask DisposeAsync()
    {
        _upstream.Dispose();
        await _app.StopAsync();
        await _app.DisposeAsync();
    }
}
