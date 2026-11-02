using System.Text.Json;
using JamulaMbr;

var tests = 0;
void Check(bool condition, string name)
{
    if (!condition) throw new InvalidOperationException("FAIL: " + name);
    tests++;
    Console.WriteLine("PASS: " + name);
}
var month = ReviewMonth.Parse("2026-11");
var now = DateTimeOffset.Parse("2026-11-02T03:00:00Z");
Check(month.Start == DateTimeOffset.Parse("2026-11-01T00:00:00Z") &&
    month.End == DateTimeOffset.Parse("2026-12-01T00:00:00Z"), "UTC month boundaries");
foreach (var value in new[] { "../2026-11", "2026-13", "2026-1", "2026-11&repo=x", "9999-12", "" })
{
    try { ReviewMonth.Parse(value); throw new InvalidOperationException("Accepted bad month."); }
    catch (ArgumentException) { Check(true, "reject month " + value); }
}
Check(month.Contains(month.Start, now) && !month.Contains(month.End, now) &&
    !month.Contains(now.AddSeconds(1), now) && !month.Contains(month.Start.AddTicks(-1), now), "half-open UTC filtering");
Check(month.Contains(DateTimeOffset.Parse("2026-10-31T18:00:00-07:00"), now), "Pacific timestamp converted to UTC month");

var visited = new List<int>();
var pages = await GitHub.ReadPagesAsync(page =>
{
    visited.Add(page);
    return Task.FromResult(JsonSerializer.Serialize(Enumerable.Range(0, page <= 2 ? 100 : 1)));
});
Check(pages.Count == 201 && visited.SequenceEqual([1, 2, 3]), "pagination visits every page");
try
{
    await GitHub.ReadPagesAsync(page => page == 1
        ? Task.FromResult(JsonSerializer.Serialize(Enumerable.Range(0, 100)))
        : throw new IOException("fixture permission denied"));
    throw new InvalidOperationException("Accepted partial pagination.");
}
catch (IOException) { Check(true, "later-page access failure is not a partial success"); }
try
{
    await GitHub.ReadPagesAsync(_ => Task.FromResult("{}"));
    throw new InvalidOperationException("Accepted malformed response.");
}
catch (JsonException) { Check(true, "non-array API response rejected"); }

WorkItem Item(int n, string state, string? reason = null, DateTimeOffset? closed = null, DateTimeOffset? merged = null) =>
    new(n, "<img src=x onerror=alert(1)> & \"fixture\"", "javascript:alert(1)", state, reason,
        month.Start.AddDays(-1), closed, merged, false);
var source = new SourceResult([
    Item(1, "open"),
    Item(2, "closed", closed: month.Start.AddHours(2), merged: month.Start.AddHours(2)),
    Item(3, "closed", closed: month.Start.AddHours(4)),
    Item(4, "closed", closed: month.Start.AddSeconds(-1), merged: month.Start.AddSeconds(-1)),
    Item(5, "closed", closed: month.End, merged: month.End)
], "ok", "fixture");
var pulls = Metrics.Summarize(source, month, now, true);
Check(pulls.Active?.Single().Number == 1 && pulls.Completed?.Single().Number == 2 &&
    pulls.OtherClosed?.Single().Number == 3, "merged versus closed-unmerged; current backlog");
Check(pulls.MedianMergeHours == 26 && pulls.MergeSampleSize == 1, "open-to-merge median and sample size");
var issues = Metrics.Summarize(new([
    Item(1, "open"), Item(2, "closed", "completed", month.Start),
    Item(3, "closed", "not_planned", month.Start), Item(4, "closed", null, month.Start),
    Item(5, "open", "reopened", month.Start)
], "ok", ""), month, now, false);
Check(issues.Active?.Count == 2 && issues.Completed?.Single().Number == 2 &&
    issues.OtherClosed?.Count == 2, "completed versus not-planned, missing reason and reopened");
var missing = Metrics.Summarize(new(null, "unavailable", ""), month, now, true);
Check(missing.Active is null && missing.Completed is null && missing.MedianMergeHours is null, "missing access remains unknown");
var empty = Metrics.Summarize(new([], "ok", ""), month, now, true);
Check(empty.Active?.Count == 0 && empty.MedianMergeHours is null, "true zero versus no merge sample");
using (var document = JsonDocument.Parse("""
[
  {"number":1,"title":"<script>alert(1)</script>","state":"open","created_at":"2026-11-01T00:00:00Z","html_url":"javascript:alert(1)"},
  {"number":2,"pull_request":{}}
]
"""))
{
    var rows = Metrics.ReadItems(document.RootElement.EnumerateArray(), false);
    Check(rows.Count == 1 && rows[0].Url == "https://github.com/Jamula/Jamula-www-Website/issues/1" &&
        rows[0].Title == "<script>alert(1)</script>", "issues exclude PRs and never trust API links");
}
Check(RequestPolicy.Allows("GET", "", "none", "", "127.0.0.1:42") &&
    RequestPolicy.Allows("POST", "http://127.0.0.1:42", "same-origin", "1", "127.0.0.1:42"), "same-origin refresh allowed");
Check(!RequestPolicy.Allows("POST", "https://evil.example", "cross-site", "1", "127.0.0.1:42") &&
    !RequestPolicy.Allows("POST", "", "", "1", "127.0.0.1:42") &&
    !RequestPolicy.Allows("GET", "", "cross-site", "", "127.0.0.1:42") &&
    !RequestPolicy.Allows("POST", "http://127.0.0.1:42", "same-origin", "", "127.0.0.1:42"), "cross-site and simple refresh denied");

var directory = Path.Combine(Path.GetTempPath(), "jamula-mbr-tests-" + Guid.NewGuid());
Directory.CreateDirectory(directory);
try
{
    var path = Path.Combine(directory, "costs.json");
    var cost = await Costs.ReadAsync(path, month, now);
    Check(cost.Status == "unknown" && cost.Measurements.Count == 0, "missing costs unknown, not zero");
    var measurement = new CostMeasurement("aiInputTokens", 120, "actual", "Synthetic fixture",
        GitHub.Repo, now, month.Start, now);
    async Task<CostResult> Import(CostMeasurement value, string? repo = null)
    {
        await File.WriteAllTextAsync(path, JsonSerializer.Serialize(new CostImport(repo ?? GitHub.Repo, month.Value, [value])));
        return await Costs.ReadAsync(path, month, now);
    }
    Check((await Import(measurement)).Status == "imported", "valid scoped cost provenance");
    Check((await Import(measurement with { Value = 0 })).Measurements.Single().Value == 0, "documented zero preserved");
    Check((await Import(measurement, "other/repo")).Status == "invalid", "cross-repository import rejected");
    Check((await Import(measurement with { Value = -1 })).Status == "invalid", "negative usage rejected");
    Check((await Import(measurement with { Value = 1.5m })).Status == "invalid", "fractional tokens rejected");
    Check((await Import(measurement with { CoveredThrough = month.End })).Status == "invalid", "future coverage rejected");
    Check((await Import(measurement with { CoveredFrom = month.Start.AddDays(-1) })).Status == "invalid", "outside-month coverage rejected");
    Check((await Import(measurement with { Key = "aiUsd", Basis = "estimated" })).Status == "invalid", "unpriced estimate rejected");
    Check((await Import(measurement with { Key = "aiUsd", Basis = "estimated", PricingSource = "Synthetic price", PricingDate = "2026-11-01" })).Status == "imported", "dated estimate accepted");
    await File.WriteAllTextAsync(path, "{broken");
    Check((await Costs.ReadAsync(path, month, now)).Status == "invalid", "malformed cost file explicitly invalid");
}
finally
{
    File.Delete(Path.Combine(directory, "costs.json"));
    Directory.Delete(directory);
}
Console.WriteLine($"{tests} offline fixture checks passed.");
