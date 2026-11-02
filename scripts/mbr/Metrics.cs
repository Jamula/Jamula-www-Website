using System.Globalization;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace JamulaMbr;

/// <summary>A UTC calendar month with an exclusive upper bound.</summary>
public sealed record ReviewMonth(string Value, DateTimeOffset Start, DateTimeOffset End)
{
    /// <summary>Parses an exact YYYY-MM value, rejecting invalid or ambiguous inputs.</summary>
    public static ReviewMonth Parse(string value)
    {
        if (!Regex.IsMatch(value, @"^\d{4}-(0[1-9]|1[0-2])$", RegexOptions.CultureInvariant) ||
            !DateTimeOffset.TryParseExact(value + "-01", "yyyy-MM-dd", CultureInfo.InvariantCulture,
                DateTimeStyles.AssumeUniversal, out var start) || start.Year is < 2000 or > 9998)
            throw new ArgumentException("Month must be YYYY-MM, between 2000-01 and 9998-12.");
        return new(start.ToString("yyyy-MM", CultureInfo.InvariantCulture), start, start.AddMonths(1));
    }

    /// <summary>Tests a timestamp against the UTC half-open month and observation time.</summary>
    public bool Contains(DateTimeOffset? instant, DateTimeOffset observedAt) =>
        instant is { } time && time >= Start && time < End && time <= observedAt;
}

/// <summary>A minimal repository work item; bodies and account identities are not retained.</summary>
public sealed record WorkItem(int Number, string Title, string Url, string State,
    string? Reason, DateTimeOffset CreatedAt, DateTimeOffset? ClosedAt,
    DateTimeOffset? MergedAt, bool Draft);

/// <summary>Source health is explicit: a missing list is unknown, never an empty success.</summary>
public sealed record SourceResult(List<WorkItem>? Items, string Status, string Detail);

/// <summary>Selected month's delivery and observation-time backlog.</summary>
public sealed record WorkSummary(List<WorkItem>? Active, List<WorkItem>? Completed,
    List<WorkItem>? OtherClosed, double? MedianMergeHours, int MergeSampleSize);

/// <summary>Pure aggregation, shared by the collector and fixture tests.</summary>
public static class Metrics
{
    /// <summary>Separates merged/completed work from other closure reasons.</summary>
    public static WorkSummary Summarize(SourceResult source, ReviewMonth month,
        DateTimeOffset now, bool pullRequests)
    {
        if (source.Items is null) return new(null, null, null, null, 0);
        var active = source.Items.Where(x => x.State == "open").OrderBy(x => x.CreatedAt).ToList();
        var closed = source.Items.Where(x => month.Contains(pullRequests ? x.MergedAt : x.ClosedAt, now));
        var completed = closed.Where(x => pullRequests
            ? x.MergedAt is not null : x.State == "closed" && x.Reason == "completed")
            .OrderByDescending(x => pullRequests ? x.MergedAt : x.ClosedAt).ToList();
        var other = source.Items.Where(x => x.State == "closed" && month.Contains(x.ClosedAt, now) &&
            (pullRequests ? x.MergedAt is null : x.Reason != "completed"))
            .OrderByDescending(x => x.ClosedAt).ToList();
        var hours = pullRequests ? completed.Select(x => (x.MergedAt!.Value - x.CreatedAt).TotalHours)
            .Order().ToArray() : [];
        double? median = hours.Length == 0 ? null : hours.Length % 2 == 1
            ? hours[hours.Length / 2] : (hours[hours.Length / 2 - 1] + hours[hours.Length / 2]) / 2;
        return new(active, completed, other, median, hours.Length);
    }

    /// <summary>Retains only safe, necessary fields from the GitHub REST response.</summary>
    public static List<WorkItem> ReadItems(IEnumerable<JsonElement> rows, bool pullRequests)
    {
        return rows.Where(x => pullRequests || !x.TryGetProperty("pull_request", out _))
            .Select(x => new WorkItem(x.GetProperty("number").GetInt32(),
                x.GetProperty("title").GetString() ?? "",
                $"https://github.com/{GitHub.Repo}/{(pullRequests ? "pull" : "issues")}/{x.GetProperty("number").GetInt32()}",
                x.GetProperty("state").GetString() ?? "",
                x.TryGetProperty("state_reason", out var reason) ? reason.GetString() : null,
                x.GetProperty("created_at").GetDateTimeOffset(), Date(x, "closed_at"),
                Date(x, "merged_at"), x.TryGetProperty("draft", out var draft) && draft.GetBoolean()))
            .DistinctBy(x => x.Number).ToList();
    }

    private static DateTimeOffset? Date(JsonElement row, string name) =>
        row.TryGetProperty(name, out var value) && value.ValueKind != JsonValueKind.Null
            ? value.GetDateTimeOffset() : null;
}
