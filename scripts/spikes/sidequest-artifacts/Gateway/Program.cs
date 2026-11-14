using System.Text.Json;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Hosting.Server.Features;

if (args.Length != 1 || !File.Exists(args[0]))
{
    Console.Error.WriteLine("A local routing file is required.");
    return 2;
}
var routingFile = Path.GetFullPath(args[0]);
var builder = WebApplication.CreateSlimBuilder(Array.Empty<string>());
builder.Logging.ClearProviders();
builder.WebHost.UseUrls("http://127.0.0.1:0");
await using var app = builder.Build();
using var upstream = new HttpClient(new HttpClientHandler
{
    AllowAutoRedirect = false,
    UseProxy = false,
}) { Timeout = TimeSpan.FromSeconds(2) };

app.Map("/{section}/{**path}", async (HttpContext context) =>
{
    var section = context.Request.RouteValues["section"]?.ToString();
    if (section is not ("admin" or "finance" or "tech"))
    {
        context.Response.StatusCode = 404;
        return;
    }
    if (!HttpMethods.IsGet(context.Request.Method))
    {
        context.Response.StatusCode = 405;
        return;
    }
    try
    {
        var routes = JsonSerializer.Deserialize<Dictionary<string, string>>(
            await File.ReadAllTextAsync(routingFile, context.RequestAborted));
        if (routes is null || !routes.TryGetValue(section, out var value) ||
            !Uri.TryCreate(value, UriKind.Absolute, out var address) ||
            address.Scheme != "http" || address.Host != "127.0.0.1" ||
            address.Port < 1 || address.AbsolutePath != "/" ||
            address.UserInfo.Length != 0 || address.Query.Length != 0 ||
            address.Fragment.Length != 0)
        {
            context.Response.StatusCode = 503;
            return;
        }
        // Concatenation retains the section path and cannot replace the validated host.
        var target = new Uri(address.GetLeftPart(UriPartial.Authority) +
            context.Request.Path + context.Request.QueryString);
        using var response = await upstream.GetAsync(target, context.RequestAborted);
        context.Response.StatusCode = (int)response.StatusCode;
        context.Response.ContentType = response.Content.Headers.ContentType?.ToString();
        await response.Content.CopyToAsync(context.Response.Body, context.RequestAborted);
    }
    catch (Exception error) when (error is HttpRequestException or TaskCanceledException)
    {
        if (!context.RequestAborted.IsCancellationRequested)
            context.Response.StatusCode = 502;
    }
    catch (Exception error) when (error is IOException or JsonException or UnauthorizedAccessException)
    {
        context.Response.StatusCode = 503;
    }
});
await app.StartAsync();
Console.WriteLine($"READY:{app.Services.GetRequiredService<IServer>().Features.Get<IServerAddressesFeature>()!.Addresses.Single()}");
await app.WaitForShutdownAsync();
return 0;
