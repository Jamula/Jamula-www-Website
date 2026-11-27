using System.Globalization;
using System.Net;
using JamulaMcp;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Hosting.Server.Features;

return await McpHost.RunMainAsync(args);

public static class McpHost
{
    public static async Task<int> RunMainAsync(
        string[] args,
        CancellationToken cancellationToken = default,
        TextWriter? output = null,
        Action<string>? onStarted = null)
    {
        var writer = output ?? Console.Out;
        if (args.Length == 2 && args[0] == "--verify-corpus")
        {
            var candidatePath = Directory.Exists(args[1])
                ? args[1]
                : Path.GetFullPath(Path.Join(Directory.GetCurrentDirectory(), "..", "..", args[1]));
            var corpus = PublicCorpus.LoadFromDirectory(candidatePath);
            writer.WriteLine($"Verified {corpus.Entries.Count} public corpus entries ({corpus.ListTechNotes().Count} tech notes).");
            return 0;
        }

        var port = 0;
        if (args.Length == 2 && args[0] == "--port" &&
            int.TryParse(args[1], NumberStyles.None, CultureInfo.InvariantCulture, out var parsedPort) &&
            parsedPort is >= 0 and <= 65535)
        {
            port = parsedPort;
        }
        else if (args.Length != 0)
        {
            Console.Error.WriteLine("Usage: dotnet run --project scripts/mcp/JamulaMcp.csproj [-- --port <0..65535> | --verify-corpus <tech-dir>]");
            return 2;
        }

        var defaultCorpusDir = ResolveDefaultCorpusDirectory(Directory.GetCurrentDirectory());
        await using var app = BuildLoopbackApp(defaultCorpusDir, port);
        await app.StartAsync(CancellationToken.None);
        var boundAddress = app.Services.GetRequiredService<IServer>()
            .Features.Get<IServerAddressesFeature>()!.Addresses.Single().TrimEnd('/');
        var endpoint = $"{boundAddress}/mcp";
        writer.WriteLine($"MCP endpoint listening on {endpoint}");
        onStarted?.Invoke(endpoint);
        await app.WaitForShutdownAsync(cancellationToken);
        return 0;
    }

    public static string ResolveDefaultCorpusDirectory(string workingDirectory)
    {
        var direct = Path.Join(workingDirectory, "www", "src", "content", "tech");
        if (Directory.Exists(direct))
        {
            return direct;
        }

        return Path.GetFullPath(Path.Join(workingDirectory, "..", "..", "www", "src", "content", "tech"));
    }

    public static WebApplication BuildLoopbackApp(string techCorpusDirectory, int port = 0)
    {
        var corpus = PublicCorpus.LoadFromDirectory(techCorpusDirectory);
        var builder = WebApplication.CreateSlimBuilder(new WebApplicationOptions { Args = [] });
        builder.Logging.ClearProviders();
        builder.WebHost.ConfigureKestrel(options => options.Listen(IPAddress.Loopback, port));

        builder.Services.AddSingleton(corpus);
        builder.Services.AddSingleton<McpTelemetry>();
        builder.Services.AddSingleton<JamulaMcpTools>();
        builder.Services
            .AddMcpServer(options =>
            {
                options.ServerInfo = new()
                {
                    Name = "jamula-public-mcp",
                    Version = "0.1.0"
                };
            })
            .WithHttpTransport()
            .WithTools<JamulaMcpTools>();

        var app = builder.Build();
        app.Use(async (context, next) =>
        {
            context.Response.Headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'";
            context.Response.Headers["X-Content-Type-Options"] = "nosniff";
            context.Response.Headers["Cache-Control"] = "no-store";
            context.Response.Headers["Referrer-Policy"] = "no-referrer";
            await next();
        });

        app.MapGet("/health/ready", (PublicCorpus loaded) =>
            Results.Json(new { status = "ready", entries = loaded.Entries.Count }));
        app.MapMcp("/mcp");
        return app;
    }
}
