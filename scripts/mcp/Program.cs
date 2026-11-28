using System.Globalization;
using System.Net;
using System.Text.Json;
using System.Text.Json.Nodes;
using JamulaMcp;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Hosting.Server.Features;
using ModelContextProtocol;
using ModelContextProtocol.Protocol;

return await McpHost.RunMainAsync(args);

public static class McpHost
{
    private const string FirstMetadataProtocolVersion = "2026-07-28";
    private const int MaxLegacyRequestBytes = 1024 * 1024;

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

            var request = context.Request;
            var expectedHost = string.Create(CultureInfo.InvariantCulture, $"127.0.0.1:{context.Connection.LocalPort}");
            if (!AllowsRequest(
                request.Host.Value,
                request.Headers.Origin.ToString(),
                request.Headers["Sec-Fetch-Site"].ToString(),
                expectedHost))
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                return;
            }

            var protocolVersion = request.Headers["MCP-Protocol-Version"].ToString();
            // ISO-dated legacy versions need inspection before the SDK selects legacy behavior.
            if (HttpMethods.IsPost(request.Method) &&
                request.Path.StartsWithSegments("/mcp") &&
                request.HasJsonContentType() &&
                string.CompareOrdinal(protocolVersion, FirstMetadataProtocolVersion) < 0)
            {
                await HandleLegacyMcpRequestAsync(context, next, protocolVersion);
                return;
            }

            await next();
        });

        app.MapGet("/health/ready", (PublicCorpus loaded) =>
            Results.Json(new { status = "ready", entries = loaded.Entries.Count }));
        app.MapMcp("/mcp");
        return app;
    }

    private static async Task HandleLegacyMcpRequestAsync(
        HttpContext context, Func<Task> next, string protocolVersion)
    {
        var request = context.Request;
        if (request.ContentLength > MaxLegacyRequestBytes)
        {
            context.Response.StatusCode = StatusCodes.Status413PayloadTooLarge;
            await context.Response.WriteAsync("Legacy or headerless MCP request exceeds the size limit.");
            return;
        }

        var originalBody = request.Body;
        await using var bufferedBody = new MemoryStream();
        var chunk = new byte[8192];
        int read;
        while ((read = await originalBody.ReadAsync(chunk, context.RequestAborted)) != 0)
        {
            if (bufferedBody.Length + read > MaxLegacyRequestBytes)
            {
                context.Response.StatusCode = StatusCodes.Status413PayloadTooLarge;
                await context.Response.WriteAsync("Legacy or headerless MCP request exceeds the size limit.");
                return;
            }
            bufferedBody.Write(chunk, 0, read);
        }

        bufferedBody.Position = 0;
        request.Body = bufferedBody;
        try
        {
            JsonRpcMessage? message = null;
            try
            {
                message = await request.ReadFromJsonAsync(
                    McpJsonUtilities.ProtocolOptions.GetTypeInfo<JsonRpcMessage>(),
                    context.RequestAborted);
            }
            catch (JsonException)
            {
                // Replay malformed input so the SDK returns its standard JSON-RPC error.
            }

            var parameters = message switch
            {
                JsonRpcRequest rpcRequest => rpcRequest.Params,
                JsonRpcNotification notification => notification.Params,
                _ => null
            };
            var metadata = (parameters as JsonObject)?["_meta"] as JsonObject;
            var declaresModernMetadata = metadata is not null &&
                (metadata.ContainsKey(MetaKeys.ProtocolVersion) ||
                 metadata.ContainsKey(MetaKeys.ClientInfo) ||
                 metadata.ContainsKey(MetaKeys.ClientCapabilities) ||
                 metadata.ContainsKey(MetaKeys.LogLevel) ||
                 metadata.ContainsKey(MetaKeys.SubscriptionId));
            var declaresModernHeaders = request.Headers.ContainsKey("Mcp-Method") ||
                request.Headers.ContainsKey("Mcp-Name") ||
                request.Headers.Keys.Any(key => key.StartsWith("Mcp-Param-", StringComparison.OrdinalIgnoreCase));
            var isDiscovery = message is JsonRpcRequest { Method: "server/discover" };
            var versionMismatch = protocolVersion.Length != 0 &&
                metadata?.ContainsKey(MetaKeys.ProtocolVersion) == true &&
                (metadata[MetaKeys.ProtocolVersion] is not JsonValue versionValue ||
                 !versionValue.TryGetValue<string>(out var metadataVersion) ||
                 !string.Equals(protocolVersion, metadataVersion, StringComparison.Ordinal));
            if ((protocolVersion.Length == 0 &&
                 (declaresModernMetadata || declaresModernHeaders || isDiscovery)) ||
                versionMismatch)
            {
                var error = new JsonRpcError
                {
                    Id = message is JsonRpcRequest rpcRequest ? rpcRequest.Id : default,
                    Error = new JsonRpcErrorDetail
                    {
                        Code = (int)McpErrorCode.HeaderMismatch,
                        Message = "The MCP-Protocol-Version header is missing or does not match request metadata."
                    }
                };
                context.Response.StatusCode = StatusCodes.Status400BadRequest;
                context.Response.ContentType = "application/json";
                await JsonSerializer.SerializeAsync(
                    context.Response.Body,
                    error,
                    McpJsonUtilities.ProtocolOptions.GetTypeInfo<JsonRpcError>(),
                    context.RequestAborted);
                return;
            }

            bufferedBody.Position = 0;
            await next();
        }
        finally
        {
            request.Body = originalBody;
        }
    }

    public static bool AllowsRequest(string? host, string origin, string fetchSite, string expectedHost) =>
        host == expectedHost &&
        (origin.Length == 0 || origin == $"http://{expectedHost}") &&
        fetchSite is "" or "same-origin" or "none";
}
