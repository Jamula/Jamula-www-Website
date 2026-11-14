using System.Reflection;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Hosting.Server.Features;

var assembly = Assembly.GetExecutingAssembly();
var section = assembly.GetName().Name!.ToLowerInvariant();
var version = assembly.GetCustomAttribute<AssemblyInformationalVersionAttribute>()!
    .InformationalVersion.Split('+')[0];
var builder = WebApplication.CreateSlimBuilder(Array.Empty<string>());
builder.Logging.ClearProviders();
builder.WebHost.UseUrls("http://127.0.0.1:0");
await using var app = builder.Build();
var requests = 0;
app.MapGet("/{**path}", (HttpContext context) => Results.Json(new
{
    section,
    version,
    processId = Environment.ProcessId,
    requestNumber = Interlocked.Increment(ref requests),
    path = context.Request.Path.Value,
    query = context.Request.QueryString.Value,
}));
await app.StartAsync();
var address = app.Services.GetRequiredService<IServer>()
    .Features.Get<IServerAddressesFeature>()!.Addresses.Single();
Console.WriteLine($"READY:{address}");
await app.WaitForShutdownAsync();
