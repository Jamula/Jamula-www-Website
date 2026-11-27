using System.Diagnostics;
using System.Diagnostics.Metrics;
using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using JamulaMcp;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Hosting.Server.Features;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.DependencyInjection;

int passed = 0;

void Check(bool condition, string message)
{
    if (!condition)
    {
        throw new InvalidOperationException($"Check failed: {message}");
    }
}

async Task RunAsync(string name, Func<Task> test)
{
    await test();
    passed++;
    Console.WriteLine($"PASS: {name}");
}

void Run(string name, Action test)
{
    test();
    passed++;
    Console.WriteLine($"PASS: {name}");
}

void Throws<TException>(Action action, string expectedSubstring) where TException : Exception
{
    try
    {
        action();
    }
    catch (TException ex) when (ex.Message.Contains(expectedSubstring, StringComparison.OrdinalIgnoreCase))
    {
        return;
    }

    throw new InvalidOperationException($"Expected {typeof(TException).Name} containing '{expectedSubstring}'.");
}

async Task ThrowsAsync<TException>(Func<Task> action, string expectedSubstring) where TException : Exception
{
    try
    {
        await action();
    }
    catch (TException ex) when (ex.Message.Contains(expectedSubstring, StringComparison.OrdinalIgnoreCase))
    {
        return;
    }

    throw new InvalidOperationException($"Expected {typeof(TException).Name} containing '{expectedSubstring}'.");
}

var repoRoot = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..", ".."));
var realTechDir = Path.Combine(repoRoot, "www", "src", "content", "tech");

Run("PublicCorpus_LoadsRealRepositoryTechNotesAndOverview", () =>
{
    var corpus = PublicCorpus.LoadFromDirectory(realTechDir);
    Check(corpus.Entries.Count >= 2, "expected baseline overview plus published tech notes");
    var notes = corpus.ListTechNotes();
    Check(notes.Any(n => n.Id == "evidence-gated-static-delivery"), "expected published architecture note");
    var matches = corpus.Search("secretless preview CRC32 MCP", maxResults: 3);
    Check(matches.Count >= 1 && matches[0].CanonicalUrl.StartsWith("https://jamula.net/", StringComparison.Ordinal), "expected canonical match");
});

Run("PublicCorpus_RejectsInvalidDirectoriesMalformedFrontmatterAndUnsafeQueries", () =>
{
    Throws<ArgumentException>(() => PublicCorpus.LoadFromDirectory(" "), "techDirectoryPath");
    Throws<DirectoryNotFoundException>(() => PublicCorpus.LoadFromDirectory(Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString("N"))), "not found");

    var tempDir = Path.Combine(Path.GetTempPath(), "jamula-mcp-" + Guid.NewGuid().ToString("N"));
    Directory.CreateDirectory(tempDir);
    try
    {
        File.WriteAllText(Path.Combine(tempDir, "BAD_SLUG.md"), "---\ntitle: \"Bad\"\npublishedDate: \"2026-11-26\"\nsummary: \"Sum\"\n---\nBody");
        Throws<InvalidDataException>(() => PublicCorpus.LoadFromDirectory(tempDir), "unsafe slug");
        File.Delete(Path.Combine(tempDir, "BAD_SLUG.md"));

        File.WriteAllText(Path.Combine(tempDir, "no-frontmatter.md"), "plain markdown");
        Throws<InvalidDataException>(() => PublicCorpus.LoadFromDirectory(tempDir), "missing YAML frontmatter");
        File.Delete(Path.Combine(tempDir, "no-frontmatter.md"));

        File.WriteAllText(Path.Combine(tempDir, "unclosed.md"), "---\ntitle: \"Test\"\nBody");
        Throws<InvalidDataException>(() => PublicCorpus.LoadFromDirectory(tempDir), "unterminated");
        File.Delete(Path.Combine(tempDir, "unclosed.md"));

        File.WriteAllText(Path.Combine(tempDir, "bad-line.md"), "---\nmalformed-line\n---\nBody");
        Throws<InvalidDataException>(() => PublicCorpus.LoadFromDirectory(tempDir), "malformed frontmatter");
        File.Delete(Path.Combine(tempDir, "bad-line.md"));

        File.WriteAllText(Path.Combine(tempDir, "missing-fields.md"), "---\ntitle: \"Only title\"\n---\nBody");
        Throws<InvalidDataException>(() => PublicCorpus.LoadFromDirectory(tempDir), "missing required metadata");
        File.Delete(Path.Combine(tempDir, "missing-fields.md"));

        File.WriteAllBytes(Path.Combine(tempDir, "oversized.md"), new byte[PublicCorpus.MaxFileBytes + 1]);
        Throws<InvalidDataException>(() => PublicCorpus.LoadFromDirectory(tempDir), "invalid byte length");
        File.Delete(Path.Combine(tempDir, "oversized.md"));

        var longBody = string.Join(' ', Enumerable.Repeat("architecture", 80)) + " targetkeyword " + string.Join(' ', Enumerable.Repeat("verification", 80));
        File.WriteAllText(
            Path.Combine(tempDir, "long-note.md"),
            $"---\ntitle: \"Long Note\"\npublishedDate: \"2026-11-26\"\nsummary: \"Detailed note\"\n---\n{longBody}");
        var valid = PublicCorpus.LoadFromDirectory(tempDir);
        var excerptMatch = valid.Search("targetkeyword", 1);
        Check(excerptMatch.Count == 1 && excerptMatch[0].Excerpt.EndsWith("...", StringComparison.Ordinal), "expected truncated excerpt");
        Check(valid.Search("!", 1).Count == 0, "expected single-punctuation query to produce zero tokens");
        Throws<ArgumentException>(() => valid.Search("  "), "non-empty");
        Throws<ArgumentException>(() => valid.Search(new string('a', PublicCorpus.MaxQueryLength + 1)), "at most");
        Throws<ArgumentOutOfRangeException>(() => valid.Search("jamula", 0), "between 1 and 10");
        Throws<ArgumentOutOfRangeException>(() => valid.Search("jamula", 11), "between 1 and 10");
    }
    finally
    {
        Directory.Delete(tempDir, recursive: true);
    }
});

await RunAsync("McpTelemetry_EmitsContentSuppressedSpansAndCountersWithoutQueryLeakage", async () =>
{
    var activities = new List<Activity>();
    var counters = new List<(string Instrument, long Value, KeyValuePair<string, object?>[] Tags)>();

    using var activityListener = new ActivityListener
    {
        ShouldListenTo = source => source.Name == McpTelemetry.InstrumentationName,
        Sample = (ref ActivityCreationOptions<ActivityContext> _) => ActivitySamplingResult.AllDataAndRecorded,
        ActivityStopped = activity => activities.Add(activity)
    };
    ActivitySource.AddActivityListener(activityListener);

    using var meterListener = new MeterListener
    {
        InstrumentPublished = (instrument, listener) =>
        {
            if (instrument.Meter.Name == McpTelemetry.InstrumentationName)
            {
                listener.EnableMeasurementEvents(instrument);
            }
        }
    };
    meterListener.SetMeasurementEventCallback<long>((instrument, measurement, tags, _) =>
        counters.Add((instrument.Name, measurement, tags.ToArray())));
    meterListener.Start();

    using var telemetry = new McpTelemetry();
    var corpus = PublicCorpus.LoadFromDirectory(realTechDir);
    var tools = new JamulaMcpTools(corpus, telemetry);

    const string sensitiveQuery = "secret-token-canary-987654 custom software";
    var overviewJson = tools.GetJamulaOverview();
    var listJson = tools.ListTechNotes();
    var searchJson = tools.SearchPublicCorpus(sensitiveQuery, 3);
    var emptyJson = tools.SearchPublicCorpus("zzzznonexistenttermzzzz", 3);
    Throws<ArgumentOutOfRangeException>(() => tools.SearchPublicCorpus("jamula", 99), "between 1 and 10");

    Check(overviewJson.Contains("AI Strategy", StringComparison.Ordinal), "overview must contain disciplines");
    Check(listJson.Contains("evidence-gated-static-delivery", StringComparison.Ordinal), "list must include note");
    Check(searchJson.Contains("\"matchCount\":", StringComparison.Ordinal), "search must return matchCount");
    Check(emptyJson.Contains("\"matchCount\":0", StringComparison.Ordinal), "empty search must report zero matches");

    var fakeClient = new FakeChatClient("Jamula integrates AI strategy, custom software, and cloud consulting.", 42, 18);
    var advisor = new GroundedAdvisor(corpus, fakeClient, telemetry);
    var answered = await advisor.AskAsync("How does Jamula combine AI strategy and custom software?");
    Check(answered.Answered && answered.Citations.Contains("https://jamula.net/"), "expected grounded citation");
    Check(fakeClient.CallCount == 1, "expected exactly one model invocation for grounded question");

    var ungrounded = await advisor.AskAsync("zzzznonexistenttermzzzz");
    Check(!ungrounded.Answered && fakeClient.CallCount == 1, "ungrounded query must short-circuit without calling IChatClient");

    var emptyModelAdvisor = new GroundedAdvisor(corpus, new FakeChatClient("   ", 0, 0), telemetry);
    var blankModelReply = await emptyModelAdvisor.AskAsync("custom software");
    Check(!blankModelReply.Answered, "blank model output must fail closed");

    await ThrowsAsync<ArgumentException>(() => advisor.AskAsync(" "), "non-empty");

    // Verify no activity tag or metric tag ever contains the raw query canary.
    foreach (var activity in activities)
    {
        foreach (var tag in activity.TagObjects)
        {
            Check(
                !Convert.ToString(tag.Value)!.Contains("secret-token-canary-987654", StringComparison.Ordinal),
                "telemetry activity leaked query content");
        }
    }

    foreach (var (_, _, tags) in counters)
    {
        foreach (var tag in tags)
        {
            Check(
                !Convert.ToString(tag.Value)!.Contains("secret-token-canary-987654", StringComparison.Ordinal),
                "telemetry metric leaked query content");
        }
    }

    Check(counters.Any(c => c.Instrument == "jamula.mcp.tool.invocations"), "expected tool invocation counter");
    Check(counters.Any(c => c.Instrument == "gen_ai.client.token.usage" && c.Value == 42), "expected input token counter");
    Check(counters.Any(c => c.Instrument == "gen_ai.client.token.usage" && c.Value == 18), "expected output token counter");
});

await RunAsync("McpHost_ServesReadyEndpointSecurityHeadersAndStreamableHttpMcpTools", async () =>
{
    Check(await McpHost.RunMainAsync(["--verify-corpus", realTechDir]) == 0, "CLI verify-corpus must exit 0");
    Check(await McpHost.RunMainAsync(["--unknown"]) == 2, "CLI invalid args must exit 2");
    Check(Directory.Exists(McpHost.ResolveDefaultCorpusDirectory(repoRoot)), "ResolveDefaultCorpusDirectory from repo root");
    Check(Directory.Exists(McpHost.ResolveDefaultCorpusDirectory(Path.Combine(repoRoot, "scripts", "mcp"))), "ResolveDefaultCorpusDirectory from project dir");

    await using var app = McpHost.BuildLoopbackApp(realTechDir, port: 0);
    await app.StartAsync();
    try
    {
        var address = app.Services.GetRequiredService<IServer>()
            .Features.Get<IServerAddressesFeature>()!.Addresses.Single();
        using var http = new HttpClient { BaseAddress = new Uri(address) };

        using var health = await http.GetAsync("/health/ready");
        Check(health.StatusCode == HttpStatusCode.OK, "expected /health/ready 200");
        Check(health.Headers.TryGetValues("X-Content-Type-Options", out var nosniff) && nosniff.Contains("nosniff"), "expected nosniff header");
        Check(health.Headers.Contains("Content-Security-Policy"), "expected CSP header");

        using var initRequest = new HttpRequestMessage(HttpMethod.Post, "/mcp")
        {
            Content = new StringContent(
                """{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test-client","version":"1.0.0"}}}""",
                Encoding.UTF8,
                "application/json")
        };
        initRequest.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        initRequest.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("text/event-stream"));

        using var initResponse = await http.SendAsync(initRequest);
        Check(initResponse.StatusCode == HttpStatusCode.OK, $"expected MCP initialize 200, got {(int)initResponse.StatusCode}");
        var initBody = await initResponse.Content.ReadAsStringAsync();
        Check(initBody.Contains("jamula-public-mcp", StringComparison.Ordinal), "expected jamula-public-mcp server info");
    }
    finally
    {
        await app.StopAsync();
    }
});

Console.WriteLine($"{passed} deterministic offline MCP checks passed.");
return 0;

sealed class FakeChatClient(string replyText, int inputTokens, int outputTokens) : IChatClient
{
    public int CallCount { get; private set; }

    public ChatClientMetadata Metadata { get; } = new("fake-provider", null, "fake-model");

    public Task<ChatResponse> GetResponseAsync(
        IEnumerable<ChatMessage> messages,
        ChatOptions? options = null,
        CancellationToken cancellationToken = default)
    {
        CallCount++;
        var response = new ChatResponse(new ChatMessage(ChatRole.Assistant, replyText))
        {
            Usage = new UsageDetails
            {
                InputTokenCount = inputTokens,
                OutputTokenCount = outputTokens,
                TotalTokenCount = inputTokens + outputTokens
            }
        };
        return Task.FromResult(response);
    }

    public IAsyncEnumerable<ChatResponseUpdate> GetStreamingResponseAsync(
        IEnumerable<ChatMessage> messages,
        ChatOptions? options = null,
        CancellationToken cancellationToken = default) =>
        throw new NotSupportedException();

    public object? GetService(Type serviceType, object? serviceKey = null) => null;

    public void Dispose() { }
}
