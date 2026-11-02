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

string Billing() => """
{"organization":"Jamula","repository":"Jamula/Jamula-www-Website","product":"Actions",
"timePeriod":{"year":2026,"month":11},"usageItems":[
{"product":"Actions","unitType":"minutes","grossQuantity":798,"netQuantity":0,"netAmount":0},
{"product":"Actions","unitType":"minutes","grossQuantity":2,"netQuantity":1,"netAmount":0.006},
{"product":"Actions","unitType":"gigabyte-hours","grossQuantity":0.5,"netQuantity":0,"netAmount":0}]}
""";
var billing = Costs.ReadActions(Billing(), month, now);
Check(billing.Single(m => m.Key == "actionsRunnerMinutes").Value == 800 &&
    billing.Single(m => m.Key == "actionsBillableMinutes").Value == 1 &&
    billing.Single(m => m.Key == "actionsUsd").Value == 0.006m,
    "Actions sums runner SKUs and separates gross minutes, discounted minutes and net dollars");
Check(billing.All(m => m.Scope == GitHub.Repo && m.AsOf == now && m.CoveredFrom == month.Start &&
    m.CoveredThrough == now && m.Basis == "actual" && m.Source.Contains("repository-filtered")),
    "Actions preserves repository source and month-to-date coverage");
var october = ReviewMonth.Parse("2026-10");
Check(Costs.ReadActions(Billing().Replace("\"month\":11", "\"month\":10"), october, now)
    .All(m => m.CoveredThrough == october.End), "Actions historical coverage stops at month end");
foreach (var (bad, label) in new[]
{
    (Billing().Replace(GitHub.Repo, "other/repo"), "wrong repository"),
    (Billing().Replace("\"organization\":\"Jamula\"", "\"organization\":\"other\""), "wrong organization"),
    (Billing().Replace("\"month\":11", "\"month\":10"), "wrong period"),
    (Billing().Replace("\"year\":2026", "\"year\":2025"), "wrong year"),
    (Billing().Replace("\"month\":11", "\"month\":11,\"day\":1"), "daily instead of monthly"),
    (Billing().Replace("\"product\":\"Actions\"", "\"product\":\"Copilot\""), "wrong product"),
    (Billing().Replace("\"minutes\"", "\"credits\""), "unknown units"),
    (Billing().Replace("\"netAmount\":0.006", "\"netAmount\":-1"), "negative amount"),
    (Billing().Replace("\"netAmount\":0.006", "\"unexpected\":0.006"), "missing amount"),
    (Billing().Replace("\"netQuantity\":1", "\"netQuantity\":3"), "net exceeds gross"),
    (Billing().Replace("\"grossQuantity\":2", "\"grossQuantity\":-2"), "negative usage"),
    (Billing().Replace("\"grossQuantity\":2", "\"grossQuantity\":\"two\""), "malformed usage"),
    ("""{"organization":"Jamula","repository":"Jamula/Jamula-www-Website","product":"Actions","timePeriod":{"year":2026,"month":11},"usageItems":[]}""", "no usage evidence")
})
{
    try { Costs.ReadActions(bad, month, now); throw new Exception("Accepted unverified billing."); }
    catch (Exception ex) when (ex is JsonException or InvalidOperationException)
    { Check(true, "Actions rejects " + label); }
}
var storageOnly = Costs.ReadActions("""
{"organization":"Jamula","repository":"Jamula/Jamula-www-Website","product":"Actions",
"timePeriod":{"year":2026,"month":11},"usageItems":[
{"product":"Actions","unitType":"gigabyte-hours","grossQuantity":1,"netQuantity":1,"netAmount":0.001}]}
""", month, now);
Check(storageOnly.Count == 1 && storageOnly[0].Key == "actionsUsd", "storage-only report never invents zero runner minutes");
var emptyCosts = new CostResult("unknown", "Fixture", []);
var automatic = await Costs.CollectAsync(emptyCosts, month, now, read: endpoint =>
{
    Check(endpoint.Contains("repository=Jamula%2FJamula-www-Website&product=actions") &&
        endpoint.Contains("year=2026&month=11"), "Actions request is fixed-repository filtered before fetching");
    return Task.FromResult(Billing());
});
Check(automatic.ActionsStatus == "ok" && automatic.Status == "collected" &&
    automatic.Measurements.Count == 3, "Actions successful collection exposes real measurements");
var denied = await Costs.CollectAsync(emptyCosts, month, now, read: _ => throw new IOException("private account detail"));
Check(denied.ActionsStatus == "unavailable" && denied.Measurements.Count == 0 &&
    !denied.ActionsDetail!.Contains("private account detail"), "Actions access failure stays unknown and sanitizes errors");
var malformedBilling = await Costs.CollectAsync(emptyCosts, month, now, read: _ => Task.FromResult("{}"));
Check(malformedBilling.ActionsStatus == "unavailable" && malformedBilling.Measurements.Count == 0,
    "Actions malformed billing cannot produce success-shaped zero");
var futureCosts = await Costs.CollectAsync(emptyCosts, ReviewMonth.Parse("2026-12"), now,
    read: _ => throw new Exception("Future billing should not be queried."));
Check(futureCosts.ActionsStatus == "not-applicable", "Actions future month makes no billing request");
var importedCosts = new CostResult("imported", "Fixture", [
    new("aiInputTokens", 100, "actual", "Fixture", GitHub.Repo, now, month.Start, now),
    new("actionsUsd", 999, "actual", "Fixture", GitHub.Repo, now, month.Start, now)]);
var combined = await Costs.CollectAsync(importedCosts, month, now, read: _ => Task.FromResult(Billing()));
Check(combined.Measurements.Single(m => m.Key == "aiInputTokens").Value == 100 &&
    combined.Measurements.Single(m => m.Key == "actionsUsd").Value == 0.006m,
    "automatic billing supersedes matching imported keys without losing AI evidence");
var importedFallback = await Costs.CollectAsync(importedCosts, month, now, read: _ => throw new IOException());
Check(importedFallback.Measurements.SequenceEqual(importedCosts.Measurements) &&
    importedFallback.ActionsStatus == "unavailable", "billing failure preserves explicit imports with source warning");
var invalidImport = await Costs.CollectAsync(emptyCosts with { Status = "invalid" }, month, now,
    read: _ => Task.FromResult(Billing()));
Check(invalidImport.Status == "invalid" && invalidImport.ActionsStatus == "ok",
    "successful billing never hides invalid supplemental import");

var observed = new Snapshot(GitHub.Repo, month.Value, month.Start, month.End, now, now, "Fixture",
    new([], "ok", ""), new([], "ok", ""), empty, empty, automatic);
Check(observed.ExitCode == 0, "CLI complete automatic billing succeeds");
Check((observed with { Costs = denied }).ExitCode == 1, "CLI automatic billing failure returns nonzero");
Check((observed with { Costs = importedFallback }).ExitCode == 1,
    "CLI imported fallback does not conceal automatic source failure");
Check((observed with { Costs = futureCosts }).ExitCode == 0, "CLI future billing not-applicable succeeds");
Check((observed with { Costs = invalidImport }).ExitCode == 1, "CLI invalid cost import returns nonzero");
Check((observed with { PullsSource = new(null, "unavailable", "") }).ExitCode == 1 &&
    (observed with { IssuesSource = new(null, "unavailable", "") }).ExitCode == 1,
    "CLI work-item source failures return nonzero");

var directory = Path.Combine(Path.GetTempPath(), "jamula-mbr-tests-" + Guid.NewGuid());
Directory.CreateDirectory(directory);
try
{
    var snapshotPath = Path.Combine(directory, "snapshot.json");
    var options = new JsonSerializerOptions(JsonSerializerDefaults.Web);
    try
    {
        await Task.WhenAll(Enumerable.Range(0, 12).Select(index =>
            (observed with { Coverage = $"writer-{index}" }).SaveAsync(snapshotPath, options)));
        var saved = JsonSerializer.Deserialize<Snapshot>(await File.ReadAllTextAsync(snapshotPath), options)!;
        Check(saved.Month == month.Value && saved.Coverage.StartsWith("writer-", StringComparison.Ordinal) &&
            saved.Costs.Measurements.Count == 3 && !Directory.EnumerateFiles(directory, "*.tmp").Any(),
            "concurrent snapshot writers publish complete JSON without shared temp files");
        var previous = await File.ReadAllTextAsync(snapshotPath);
        using var cancelled = new CancellationTokenSource();
        cancelled.Cancel();
        try
        {
            await observed.SaveAsync(snapshotPath, options, cancelled.Token);
            throw new Exception("Cancelled write succeeded.");
        }
        catch (OperationCanceledException)
        {
            Check(await File.ReadAllTextAsync(snapshotPath) == previous &&
                !Directory.EnumerateFiles(directory, "*.tmp").Any(),
                "cancelled snapshot write preserves saved observation and cleans temp file");
        }
        var occupied = Path.Combine(directory, "occupied");
        Directory.CreateDirectory(occupied);
        try
        {
            try
            {
                await observed.SaveAsync(occupied, options);
                throw new Exception("Moved snapshot over directory.");
            }
            catch (Exception ex) when (ex is IOException or UnauthorizedAccessException)
            {
                Check(!Directory.EnumerateFiles(directory, "*.tmp").Any(),
                    "failed snapshot publication surfaces error and cleans temp file");
            }
        }
        finally
        {
            Directory.Delete(occupied);
            File.Delete(occupied + ".lock");
        }
    }
    finally
    {
        File.Delete(snapshotPath);
        File.Delete(snapshotPath + ".lock");
    }
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
    var omittedValue = System.Text.Json.Nodes.JsonNode.Parse(JsonSerializer.Serialize(
        new CostImport(GitHub.Repo, month.Value, [measurement with { Key = "aiUsd", Value = 0 }])))!;
    omittedValue["Measurements"]![0]!.AsObject().Remove("Value");
    await File.WriteAllTextAsync(path, omittedValue.ToJsonString());
    Check((await Costs.ReadAsync(path, month, now)).Status == "invalid", "omitted cost amount rejected instead of measured zero");
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
