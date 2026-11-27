using System.Diagnostics;
using System.Diagnostics.Metrics;

namespace JamulaMcp;

/// <summary>
/// Content-suppressed OpenTelemetry instrumentation using .NET 11 BCL System.Diagnostics primitives.
/// Never records raw queries, user prompts, model completions, or private identities in tags.
/// </summary>
public sealed class McpTelemetry : IDisposable
{
    public const string InstrumentationName = "Jamula.Mcp";
    public const string InstrumentationVersion = "1.0.0";

    private readonly ActivitySource _activitySource = new(InstrumentationName, InstrumentationVersion);
    private readonly Meter _meter = new(InstrumentationName, InstrumentationVersion);
    private readonly Counter<long> _invocations;
    private readonly Histogram<double> _durationMs;
    private readonly Counter<long> _tokenUsage;

    public McpTelemetry()
    {
        _invocations = _meter.CreateCounter<long>(
            "jamula.mcp.tool.invocations",
            unit: "{invocation}",
            description: "Count of MCP tool and advisor invocations by static tool name and outcome.");
        _durationMs = _meter.CreateHistogram<double>(
            "jamula.mcp.tool.duration",
            unit: "ms",
            description: "Execution latency of MCP tool and advisor invocations.");
        _tokenUsage = _meter.CreateCounter<long>(
            "gen_ai.client.token.usage",
            unit: "{token}",
            description: "Content-free input and output token counts from optional IChatClient calls.");
    }

    public T ExecuteTool<T>(string toolName, Func<T> operation, Func<T, string>? classifyOutcome = null)
    {
        var start = Stopwatch.GetTimestamp();
        using var activity = _activitySource.StartActivity($"mcp.tool.{toolName}", ActivityKind.Internal);
        activity?.SetTag("mcp.tool.name", toolName);
        try
        {
            var result = operation();
            var outcome = classifyOutcome?.Invoke(result) ?? "ok";
            RecordCompletion(activity, toolName, outcome, start);
            return result;
        }
        catch
        {
            activity?.SetStatus(ActivityStatusCode.Error);
            RecordCompletion(activity, toolName, "denied", start);
            throw;
        }
    }

    public async Task<T> ExecuteAsync<T>(string operationName, Func<Task<T>> operation, Func<T, string>? classifyOutcome = null)
    {
        var start = Stopwatch.GetTimestamp();
        using var activity = _activitySource.StartActivity($"mcp.advisor.{operationName}", ActivityKind.Internal);
        activity?.SetTag("mcp.tool.name", operationName);
        try
        {
            var result = await operation().ConfigureAwait(false);
            var outcome = classifyOutcome?.Invoke(result) ?? "ok";
            RecordCompletion(activity, operationName, outcome, start);
            return result;
        }
        catch
        {
            activity?.SetStatus(ActivityStatusCode.Error);
            RecordCompletion(activity, operationName, "denied", start);
            throw;
        }
    }

    public void RecordTokens(long? inputTokens, long? outputTokens)
    {
        if (inputTokens is > 0)
        {
            _tokenUsage.Add(inputTokens.Value, new KeyValuePair<string, object?>("gen_ai.token.type", "input"));
        }

        if (outputTokens is > 0)
        {
            _tokenUsage.Add(outputTokens.Value, new KeyValuePair<string, object?>("gen_ai.token.type", "output"));
        }
    }

    private void RecordCompletion(Activity? activity, string toolName, string outcome, long startTimestamp)
    {
        var elapsedMs = Stopwatch.GetElapsedTime(startTimestamp).TotalMilliseconds;
        activity?.SetTag("mcp.outcome", outcome);
        var tags = new TagList
        {
            { "mcp.tool.name", toolName },
            { "mcp.outcome", outcome }
        };
        _invocations.Add(1, tags);
        _durationMs.Record(elapsedMs, tags);
    }

    public void Dispose()
    {
        _activitySource.Dispose();
        _meter.Dispose();
    }
}
