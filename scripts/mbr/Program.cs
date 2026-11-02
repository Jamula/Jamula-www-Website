using System.Net;
using System.Text.Json;
using JamulaMbr;

var root = AppContext.BaseDirectory;
// dotnet run uses the project directory; published output carries wwwroot beside the executable.
if (Directory.Exists(Path.Combine(Directory.GetCurrentDirectory(), "wwwroot")))
    root = Directory.GetCurrentDirectory();
var dataDirectory = Path.Combine(root, ".local");
Directory.CreateDirectory(dataDirectory);
var json = new JsonSerializerOptions(JsonSerializerDefaults.Web) { WriteIndented = true };
using var refreshGate = new SemaphoreSlim(1);

async Task<Snapshot> Refresh(string value, CancellationToken cancellationToken)
{
    var month = ReviewMonth.Parse(value);
    var started = DateTimeOffset.UtcNow;
    var pullsTask = GitHub.CollectAsync(true, cancellationToken);
    var issuesTask = GitHub.CollectAsync(false, cancellationToken);
    await Task.WhenAll(pullsTask, issuesTask);
    var now = DateTimeOffset.UtcNow;
    var costs = await Costs.ReadAsync(Path.Combine(dataDirectory, $"costs-{month.Value}.json"), month, now, cancellationToken);
    costs = await Costs.CollectAsync(costs, month, now, cancellationToken);
    var snapshot = new Snapshot(GitHub.Repo, month.Value, month.Start, month.End, started, now,
        month.Start > now ? "Future period; no delivery observations yet" :
        month.End > now ? "Month to date (UTC)" : "Past UTC month; latest state, not an archived month-end snapshot",
        pullsTask.Result, issuesTask.Result, Metrics.Summarize(pullsTask.Result, month, now, true),
        Metrics.Summarize(issuesTask.Result, month, now, false), costs);
    var path = Path.Combine(dataDirectory, $"snapshot-{month.Value}.json");
    var temporary = path + ".tmp";
    await File.WriteAllTextAsync(temporary, JsonSerializer.Serialize(snapshot, json), cancellationToken);
    File.Move(temporary, path, overwrite: true);
    return snapshot;
}

if (args.Length == 2 && args[0] == "--snapshot")
{
    var snapshot = await Refresh(args[1], CancellationToken.None);
    Console.WriteLine(JsonSerializer.Serialize(snapshot, json));
    return snapshot.PullsSource.Status == "ok" && snapshot.IssuesSource.Status == "ok" &&
        snapshot.Costs.Status != "invalid" ? 0 : 1;
}
if (args.Length != 0)
{
    Console.Error.WriteLine("Usage: dotnet run [-- --snapshot YYYY-MM]");
    return 2;
}

var builder = WebApplication.CreateSlimBuilder(new WebApplicationOptions
{
    Args = [], ContentRootPath = root, WebRootPath = Path.Combine(root, "wwwroot")
});
builder.WebHost.ConfigureKestrel(options => options.Listen(IPAddress.Loopback, 0));
var app = builder.Build();
app.Use(async (context, next) =>
{
    var request = context.Request;
    var expectedHost = $"127.0.0.1:{context.Connection.LocalPort}";
    if (request.Host.Value != expectedHost ||
        (request.Path.StartsWithSegments("/api") &&
        !RequestPolicy.Allows(request.Method, request.Headers.Origin.ToString(),
            request.Headers["Sec-Fetch-Site"].ToString(), request.Headers["X-MBR-Refresh"].ToString(), expectedHost)))
    {
        context.Response.StatusCode = 403;
        return;
    }
    context.Response.Headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; base-uri 'none'; form-action 'none'";
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["Cache-Control"] = "no-store";
    context.Response.Headers["Referrer-Policy"] = "no-referrer";
    try { await next(context); }
    catch (Exception ex) when (ex is IOException or UnauthorizedAccessException or JsonException)
    {
        app.Logger.LogError("MBR local storage operation failed ({ExceptionType}).", ex.GetType().Name);
        context.Response.StatusCode = 500;
        await context.Response.WriteAsJsonAsync(new { error = "Local snapshot read/write failed. Check .local permissions and disk space, then refresh." });
    }
});
app.UseStaticFiles();
app.MapGet("/", () => Results.File(Path.Combine(root, "wwwroot", "index.html"), "text/html"));
app.MapGet("/api/snapshot", async (HttpContext context) =>
{
    ReviewMonth month;
    try { month = ReviewMonth.Parse(context.Request.Query["month"].ToString()); }
    catch (ArgumentException) { return Results.BadRequest(new { error = "Use an exact YYYY-MM month." }); }
    var path = Path.Combine(dataDirectory, $"snapshot-{month.Value}.json");
    if (!File.Exists(path)) return Results.NotFound(new { error = "No snapshot for this month. Select Refresh data to read GitHub." });
    return Results.Text(await File.ReadAllTextAsync(path, context.RequestAborted), "application/json");
});
app.MapPost("/api/refresh", async (HttpContext context) =>
{
    var month = context.Request.Query["month"].ToString();
    try { ReviewMonth.Parse(month); }
    catch (ArgumentException) { return Results.BadRequest(new { error = "Use an exact YYYY-MM month." }); }
    if (!await refreshGate.WaitAsync(0, context.RequestAborted))
        return Results.Conflict(new { error = "A refresh is already running. Wait and retry." });
    try { return Results.Json(await Refresh(month, context.RequestAborted)); }
    finally { refreshGate.Release(); }
});
await app.RunAsync();
return 0;

/// <summary>A persisted, repository-only observation with explicit source health.</summary>
public sealed record Snapshot(string Repo, string Month, DateTimeOffset PeriodStart, DateTimeOffset PeriodEnd,
    DateTimeOffset RefreshStartedAt, DateTimeOffset ObservedAt, string Coverage,
    SourceResult PullsSource, SourceResult IssuesSource, WorkSummary Pulls, WorkSummary Issues, CostResult Costs);

/// <summary>Prevents cross-site requests to the authenticated loopback collector.</summary>
public static class RequestPolicy
{
    /// <summary>Requires same-origin browser requests and a non-simple refresh header.</summary>
    public static bool Allows(string method, string origin, string fetchSite, string refreshHeader, string host) =>
        (origin.Length == 0 || origin == $"http://{host}") &&
        fetchSite is not ("cross-site" or "same-site") &&
        (method != "POST" || (refreshHeader == "1" && origin == $"http://{host}"));
}
