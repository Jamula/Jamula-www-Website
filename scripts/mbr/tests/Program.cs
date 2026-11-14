using System.Text.Json;
using JamulaMbr;

if (FakeGhEntrypoint.IsFixtureProcess)
{
    Environment.ExitCode = await FakeGhEntrypoint.RunAsync(args);
    return;
}

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
Check(ReviewMonth.Parse("2000-01").Start.Year == 2000 &&
    ReviewMonth.Parse("9998-12").End == DateTimeOffset.Parse("9999-01-01T00:00:00Z"),
    "ReviewMonth_MinimumAndMaximumYears_AreAccepted");
Expect<ArgumentException>(() => ReviewMonth.Parse("1999-12"), "ReviewMonth_BelowMinimumYear_IsRejected");
var leap = ReviewMonth.Parse("2024-02");
Check((leap.End - leap.Start).TotalDays == 29 &&
    leap.Contains(leap.End.AddTicks(-1), leap.End) &&
    !leap.Contains(leap.End, leap.End), "ReviewMonth_LeapDayAndExclusiveEnd_ArePreserved");
Check(month.Contains(now, now) && !month.Contains(null, now) &&
    !month.Contains(now.AddTicks(1), now), "ReviewMonth_ObservationBoundaryAndNull_AreFiltered");

void Expect<TException>(Action action, string name) where TException : Exception
{
    try { action(); }
    catch (TException) { Check(true, name); return; }
    throw new InvalidOperationException("FAIL: " + name + ": expected " + typeof(TException).Name);
}

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
var emptyPageVisits = new List<int>();
Check((await GitHub.ReadPagesAsync(page =>
{
    emptyPageVisits.Add(page);
    return Task.FromResult("[]");
})).Count == 0 && emptyPageVisits.SequenceEqual([1]), "Pagination_EmptyFirstPage_IsMeasuredZero");
var fullPageVisits = new List<int>();
var fullPageRows = await GitHub.ReadPagesAsync(page =>
{
    fullPageVisits.Add(page);
    return Task.FromResult(page == 1 ? JsonSerializer.Serialize(Enumerable.Range(1, 100)) : "[]");
});
Check(fullPageVisits.SequenceEqual([1, 2]) && fullPageRows.Count == 100 &&
    fullPageRows[0].GetInt32() == 1 && fullPageRows[^1].GetInt32() == 100,
    "Pagination_ExactFullPage_RequiresEmptyTerminalPageAndRetainsClonedValues");
int cappedVisits = 0;
try
{
    await GitHub.ReadPagesAsync(page =>
    {
        cappedVisits++;
        return Task.FromResult(JsonSerializer.Serialize(Enumerable.Range(0, 100)));
    });
    throw new Exception("Accepted incomplete capped response.");
}
catch (InvalidOperationException error)
{
    Check(cappedVisits == 200 && error.Message.Contains("completeness cannot be established", StringComparison.Ordinal),
        "Pagination_SafetyLimit_RejectsIncompleteTwoHundredPages");
}
try
{
    await GitHub.ReadPagesAsync(page => Task.FromResult(page == 1
        ? JsonSerializer.Serialize(Enumerable.Range(0, 100)) : "{broken"));
    throw new Exception("Accepted malformed later page.");
}
catch (JsonException) { Check(true, "Pagination_MalformedLaterPage_DoesNotReturnPartialRows"); }

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
    Item(5, "open", "completed", month.Start)
], "ok", ""), month, now, false);
Check(issues.Active?.Count == 2 && issues.Completed?.Single().Number == 2 &&
    issues.OtherClosed?.Count == 2, "completed versus not-planned, missing reason and reopened");
Check(issues.Active?.Any(x => x.Number == 5) == true &&
    issues.Completed?.Any(x => x.Number == 5) == false &&
    issues.OtherClosed?.Any(x => x.Number == 5) == false,
    "Metrics_ReopenedCompletedIssue_RemainsActiveAndNotCompleted");
var missing = Metrics.Summarize(new(null, "unavailable", ""), month, now, true);
Check(missing.Active is null && missing.Completed is null && missing.MedianMergeHours is null, "missing access remains unknown");
var empty = Metrics.Summarize(new([], "ok", ""), month, now, true);
Check(empty.Active?.Count == 0 && empty.MedianMergeHours is null, "true zero versus no merge sample");
WorkItem Merged(int number, int hours) => Item(number, "closed",
    closed: month.Start.AddMinutes(number), merged: month.Start.AddMinutes(number)) with
    { CreatedAt = month.Start.AddMinutes(number).AddHours(-hours) };
var even = Metrics.Summarize(new([Merged(1, 2), Merged(2, 10), Merged(3, 4), Merged(4, 6)], "ok", ""), month, now, true);
Check(even.MedianMergeHours == 5 && even.MergeSampleSize == 4 &&
    even.Completed!.Select(x => x.Number).SequenceEqual([4, 3, 2, 1]),
    "Metrics_EvenMedian_UsesSortedMiddlePairAndCompletionOrder");
var odd = Metrics.Summarize(new([Merged(1, 2), Merged(2, 10), Merged(3, 4)], "ok", ""), month, now, true);
Check(odd.MedianMergeHours == 4 && odd.MergeSampleSize == 3, "Metrics_OddMedian_UsesSortedMiddleValue");
var orderedBacklog = Metrics.Summarize(new([
    Item(1, "open") with { CreatedAt = month.Start.AddHours(2), Draft = true },
    Item(2, "open") with { CreatedAt = month.Start },
    Item(3, "closed", "not_planned", month.Start.AddHours(1)),
    Item(4, "closed", "not_planned", month.Start.AddHours(2))
], "ok", ""), month, now, false);
Check(orderedBacklog.Active!.Select(x => x.Number).SequenceEqual([2, 1]) &&
    orderedBacklog.OtherClosed!.Select(x => x.Number).SequenceEqual([4, 3]) &&
    orderedBacklog.MedianMergeHours is null && orderedBacklog.MergeSampleSize == 0,
    "Metrics_BacklogAndOtherClosureOrdering_PreserveDraftAndNoIssueMergeSample");
using (var document = JsonDocument.Parse("""
[
  {"number":7,"title":null,"state":null,"state_reason":"completed","created_at":"2026-10-31T18:00:00-07:00","closed_at":null,"merged_at":"2026-11-01T02:00:00Z","draft":true,"pull_request":{},"html_url":"javascript:alert(1)"},
  {"number":7,"title":"duplicate","state":"open","created_at":"2026-11-01T00:00:00Z","draft":false},
  {"number":8,"title":"second","state":"open","created_at":"2026-11-01T00:00:00Z"}
]
"""))
{
    var rows = Metrics.ReadItems(document.RootElement.EnumerateArray(), true);
    Check(rows.Count == 2 && rows[0].Number == 7 && rows[0].Title == "" && rows[0].State == "" &&
        rows[0].Reason == "completed" && rows[0].Draft && rows[0].ClosedAt is null &&
        rows[0].MergedAt == DateTimeOffset.Parse("2026-11-01T02:00:00Z") &&
        rows[0].CreatedAt == DateTimeOffset.Parse("2026-11-01T01:00:00Z") &&
        rows[0].Url == $"https://github.com/{GitHub.Repo}/pull/7" &&
        rows[1].Reason is null && rows[1].MergedAt is null && !rows[1].Draft,
        "ReadItems_Pulls_DeduplicateAndPreserveNullableMetadataWithTrustedUrls");
}
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
foreach (var method in new[] { "GET", "POST" })
{
    foreach (var site in new[] { "cross-site", "same-site" })
        Check(!RequestPolicy.Allows(method, "http://127.0.0.1:42", site, "1", "127.0.0.1:42"),
            $"RequestPolicy_{method}_{site.Replace("-", "")}_IsDenied");
    Check(!RequestPolicy.Allows(method, "http://127.0.0.1:43", "same-origin", "1", "127.0.0.1:42"),
        $"RequestPolicy_{method}_WrongPortOrigin_IsDenied");
}
Check(RequestPolicy.Allows("GET", "http://127.0.0.1:42", "", "", "127.0.0.1:42") &&
    !RequestPolicy.Allows("POST", "http://127.0.0.1:42", "same-origin", "true", "127.0.0.1:42"),
    "RequestPolicy_ExactRefreshHeaderRequiredButNotForGet");

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
    (Billing().Replace("\"product\":\"Actions\"", "\"product\":\"Copilot\""), "wrong report product"),
    (Billing().Replace("\"minutes\"", "\"credits\""), "unknown units"),
    (Billing().Replace("\"netAmount\":0.006", "\"netAmount\":-1"), "negative amount"),
    (Billing().Replace("\"netAmount\":0.006", "\"unexpected\":0.006"), "missing amount"),
    (Billing().Replace("\"netQuantity\":1", "\"netQuantity\":3"), "net exceeds gross"),
    (Billing().Replace("\"grossQuantity\":2", "\"grossQuantity\":-2"), "negative usage"),
    ("""{"organization":"Jamula","repository":"Jamula/Jamula-www-Website","product":"Actions","timePeriod":{"year":2026,"month":11},"usageItems":[]}""", "no usage evidence")
})
{
    try { Costs.ReadActions(bad, month, now); throw new Exception("Accepted unverified billing."); }
    catch (Exception ex) when (ex is JsonException or InvalidOperationException)
    { Check(true, "Actions rejects " + label); }
}
var wrongRowProduct = System.Text.Json.Nodes.JsonNode.Parse(Billing())!;
wrongRowProduct["usageItems"]![0]!["product"] = "Copilot";
Expect<JsonException>(() => Costs.ReadActions(wrongRowProduct.ToJsonString(), month, now),
    "Actions_RowWithWrongProduct_IsRejected");
var wrongQuantityType = System.Text.Json.Nodes.JsonNode.Parse(Billing())!;
wrongQuantityType["usageItems"]![0]!["grossQuantity"] = "798";
Expect<InvalidOperationException>(() => Costs.ReadActions(wrongQuantityType.ToJsonString(), month, now),
    "Actions_QuantityWithWrongType_IsRejected");
var storageOnly = Costs.ReadActions("""
{"organization":"Jamula","repository":"Jamula/Jamula-www-Website","product":"Actions",
"timePeriod":{"year":2026,"month":11},"usageItems":[
{"product":"Actions","unitType":"gigabyte-hours","grossQuantity":1,"netQuantity":1,"netAmount":0.001}]}
""", month, now);
Check(storageOnly.Count == 1 && storageOnly[0].Key == "actionsUsd", "storage-only report never invents zero runner minutes");
foreach (var field in new[] { "repository", "organization", "product", "timePeriod", "usageItems" })
{
    var root = System.Text.Json.Nodes.JsonNode.Parse(Billing())!.AsObject();
    root.Remove(field);
    Expect<JsonException>(() => Costs.ReadActions(root.ToJsonString(), month, now),
        $"Actions_Missing_{field}_IsRejected");
}
foreach (var (label, json) in new[]
{
    ("NonObjectRoot", "[]"),
    ("NonObjectPeriod", Billing().Replace("\"timePeriod\":{\"year\":2026,\"month\":11}", "\"timePeriod\":[]")),
    ("MissingYear", Billing().Replace("\"year\":2026,", "")),
    ("MissingMonth", Billing().Replace(",\"month\":11", ""))
})
{
    Expect<JsonException>(() => Costs.ReadActions(json, month, now), $"Actions_{label}_IsRejected");
}
var nonArrayUsage = System.Text.Json.Nodes.JsonNode.Parse(Billing())!;
nonArrayUsage["usageItems"] = new System.Text.Json.Nodes.JsonObject();
Expect<JsonException>(() => Costs.ReadActions(nonArrayUsage.ToJsonString(), month, now),
    "Actions_NonArrayUsage_IsRejected");
foreach (var field in new[] { "product", "unitType", "grossQuantity", "netQuantity", "netAmount" })
{
    var root = System.Text.Json.Nodes.JsonNode.Parse(Billing())!;
    root["usageItems"]![0]!.AsObject().Remove(field);
    Expect<JsonException>(() => Costs.ReadActions(root.ToJsonString(), month, now),
        $"Actions_RowMissing_{field}_IsRejected");
}
var badRow = System.Text.Json.Nodes.JsonNode.Parse(Billing())!;
badRow["usageItems"]![0] = null;
Expect<JsonException>(() => Costs.ReadActions(badRow.ToJsonString(), month, now),
    "Actions_NullUsageRow_IsRejected");
var negativeNet = Billing().Replace("\"netQuantity\":1", "\"netQuantity\":-1");
Expect<JsonException>(() => Costs.ReadActions(negativeNet, month, now), "Actions_NegativeNetUsage_IsRejected");
var overflowRows = System.Text.Json.Nodes.JsonNode.Parse(Billing())!;
overflowRows["usageItems"]![0]!["netAmount"] = decimal.MaxValue;
overflowRows["usageItems"]![1]!["netAmount"] = decimal.MaxValue;
Expect<OverflowException>(() => Costs.ReadActions(overflowRows.ToJsonString(), month, now),
    "Actions_OverflowedChargeSum_IsRejected");
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
var atStart = await Costs.CollectAsync(emptyCosts, month, month.Start,
    read: _ => throw new Exception("Period at observation start must not query billing."));
Check(atStart.ActionsStatus == "not-applicable" && atStart.Measurements.Count == 0,
    "Actions_ObservationAtMonthStart_MakesNoRequest");
foreach (var (name, error) in new (string, Exception)[]
{
    ("Win32", new System.ComponentModel.Win32Exception("private account detail")),
    ("Overflow", new OverflowException("private account detail")),
    ("InvalidOperation", new InvalidOperationException("private account detail"))
})
{
    var failed = await Costs.CollectAsync(emptyCosts, month, now, read: _ => throw error);
    Check(failed.ActionsStatus == "unavailable" && failed.Measurements.Count == 0 &&
        !failed.ActionsDetail!.Contains("private account detail", StringComparison.Ordinal),
        $"Actions_{name}Failure_RemainsUnknownAndSanitized");
}
using (var cancellation = new CancellationTokenSource())
{
    cancellation.Cancel();
    try
    {
        await Costs.CollectAsync(emptyCosts, month, now,
            read: _ => throw new OperationCanceledException(cancellation.Token));
        throw new Exception("Cancellation was swallowed.");
    }
    catch (OperationCanceledException error)
    {
        Check(error.CancellationToken == cancellation.Token, "Actions_CallerCancellation_Propagates");
    }
}
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
        await using (var held = Snapshot.OpenRead(snapshotPath))
        {
            await (observed with { Coverage = "replacement" }).SaveAsync(snapshotPath, options);
            using var reader = new StreamReader(held);
            var oldSnapshot = JsonSerializer.Deserialize<Snapshot>(await reader.ReadToEndAsync(), options)!;
            var replacement = JsonSerializer.Deserialize<Snapshot>(await File.ReadAllTextAsync(snapshotPath), options)!;
            Check(oldSnapshot.Coverage == saved.Coverage && replacement.Coverage == "replacement",
                "open snapshot reader permits replacement and retains complete old observation");
        }
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
    var readableImport = await Import(measurement);
    Check(readableImport.Status == "imported" &&
        readableImport.Measurements.Single() == measurement,
        "CostImport_ValidFile_IsImportedWhenUnlocked");
    var originalError = Console.Error;
    using var capturedError = new StringWriter();
    CostResult lockedImport;
    try
    {
        Console.SetError(capturedError);
        await using (var lockedFile = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.None))
            lockedImport = await Costs.ReadAsync(path, month, now);
    }
    finally
    {
        Console.SetError(originalError);
    }
    Check(lockedImport.Status == "invalid" && lockedImport.Measurements.Count == 0 &&
        lockedImport.Detail == "Cost import is unreadable or invalid. Check the README schema and attribution; then refresh." &&
        capturedError.ToString().Trim() == "MBR: cost import rejected (IOException)." &&
        !capturedError.ToString().Contains(path, StringComparison.Ordinal) &&
        !capturedError.ToString().Contains(measurement.Source, StringComparison.Ordinal),
        "CostImport_LockedValidFile_IsInvalidAndSanitized");
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
    foreach (var (label, value) in new (string, CostMeasurement)[]
    {
        ("UnknownKey", measurement with { Key = "totalSpend" }),
        ("UnknownBasis", measurement with { Basis = "guessed" }),
        ("BlankSource", measurement with { Source = " \t " }),
        ("LongSource", measurement with { Source = new string('x', 501) }),
        ("WrongScope", measurement with { Scope = "other/repo" }),
        ("FutureObservation", measurement with { AsOf = now.AddTicks(1) }),
        ("ObservationBeforeCoverage", measurement with { AsOf = now.AddTicks(-1) }),
        ("EmptyCoverage", measurement with { CoveredThrough = month.Start }),
        ("ReversedCoverage", measurement with { CoveredFrom = now, CoveredThrough = month.Start }),
        ("MalformedPricingDate", measurement with { Key = "aiUsd", Basis = "estimated", PricingSource = "price", PricingDate = "yesterday" }),
        ("FuturePricingDate", measurement with { Key = "aiUsd", Basis = "estimated", PricingSource = "price", PricingDate = "2026-11-03" }),
        ("BlankPricingSource", measurement with { Key = "aiUsd", Basis = "estimated", PricingSource = " ", PricingDate = "2026-11-01" })
    })
    {
        var invalid = await Import(value);
        Check(invalid.Status == "invalid" && invalid.Measurements.Count == 0,
            $"CostImport_{label}_IsRejectedWithoutMeasurements");
    }
    var boundaryImport = await Import(measurement with { Source = new string('x', 500) });
    Check(boundaryImport.Status == "imported" && boundaryImport.Measurements.Single().Source.Length == 500 &&
        boundaryImport.Measurements.Single().AsOf == now && boundaryImport.Measurements.Single().CoveredThrough == now,
        "CostImport_ExactSourceAndObservationBoundaries_AreAccepted");
    foreach (var (label, content) in new[]
    {
        ("NullDocument", "null"),
        ("WrongMonth", JsonSerializer.Serialize(new CostImport(GitHub.Repo, "2026-10", [measurement]))),
        ("NullMeasurements", $$"""{"repo":"{{GitHub.Repo}}","month":"2026-11","measurements":null}"""),
        ("NullMeasurement", $$"""{"repo":"{{GitHub.Repo}}","month":"2026-11","measurements":[null]}"""),
        ("DuplicateKey", JsonSerializer.Serialize(new CostImport(GitHub.Repo, month.Value, [measurement, measurement]))),
        ("UnexpectedProperty", $$"""{"repo":"{{GitHub.Repo}}","month":"2026-11","measurements":[],"total":0}""")
    })
    {
        await File.WriteAllTextAsync(path, content);
        var invalid = await Costs.ReadAsync(path, month, now);
        Check(invalid.Status == "invalid" && invalid.Measurements.Count == 0,
            $"CostImport_{label}_IsRejectedWithoutMeasurements");
    }
    await File.WriteAllTextAsync(path, JsonSerializer.Serialize(new CostImport(GitHub.Repo, month.Value, [])));
    var noMeasurements = await Costs.ReadAsync(path, month, now);
    Check(noMeasurements.Status == "imported" && noMeasurements.Measurements.Count == 0,
        "CostImport_EmptyMeasurements_DoNotInventTotals");
    using (var cancellation = new CancellationTokenSource())
    {
        cancellation.Cancel();
        try
        {
            await Costs.ReadAsync(path, month, now, cancellation.Token);
            throw new Exception("Import cancellation was swallowed.");
        }
        catch (OperationCanceledException error)
        {
            Check(error.CancellationToken == cancellation.Token, "CostImport_CallerCancellation_Propagates");
        }
    }
    await File.WriteAllTextAsync(path, "{broken");
    Check((await Costs.ReadAsync(path, month, now)).Status == "invalid", "malformed cost file explicitly invalid");
}
finally
{
    File.Delete(Path.Combine(directory, "costs.json"));
    Directory.Delete(directory);
}

var reopenedCompleted = Metrics.Summarize(new([
    Item(71, "open", "completed", month.Start.AddHours(1)),
    Item(72, "closed", "completed", month.Start.AddHours(2)),
    Item(73, "closed", "completed", month.Start.AddHours(3))
], "ok", ""), month, now, false);
Check(reopenedCompleted.Active!.Select(x => x.Number).SequenceEqual([71]) &&
    reopenedCompleted.Completed!.Select(x => x.Number).SequenceEqual([73, 72]) &&
    reopenedCompleted.OtherClosed!.Count == 0,
    "Metrics_ReopenedCompletedIssue_IsActiveButNotDelivered");

var wrongRowProduct = System.Text.Json.Nodes.JsonNode.Parse(Billing())!;
wrongRowProduct["usageItems"]![1]!["product"] = "Copilot";
var unverifiedRow = await Costs.CollectAsync(emptyCosts, month, now,
    read: _ => Task.FromResult(wrongRowProduct.ToJsonString()));
Check(unverifiedRow.ActionsStatus == "unavailable" && unverifiedRow.Status == "unknown" &&
    unverifiedRow.Measurements.Count == 0,
    "Actions_WrongRowProduct_RejectsEntireBillingSummary");

var wrongQuantityType = System.Text.Json.Nodes.JsonNode.Parse(Billing())!;
wrongQuantityType["usageItems"]![1]!["netQuantity"] = "private fixture detail";
var invalidQuantity = await Costs.CollectAsync(emptyCosts, month, now,
    read: _ => Task.FromResult(wrongQuantityType.ToJsonString()));
Check(invalidQuantity.ActionsStatus == "unavailable" && invalidQuantity.Measurements.Count == 0 &&
    !invalidQuantity.ActionsDetail!.Contains("private fixture detail", StringComparison.Ordinal),
    "Actions_WrongQuantityType_IsUnavailableAndSanitized");

var lockedImportPath = Path.Combine(Path.GetTempPath(), "jamula-mbr-locked-" + Guid.NewGuid().ToString("N") + ".json");
try
{
    await File.WriteAllTextAsync(lockedImportPath, "{}");
    using var lockedImport = new FileStream(lockedImportPath, FileMode.Open, FileAccess.ReadWrite, FileShare.None);
    var unreadable = await Costs.ReadAsync(lockedImportPath, month, now);
    Check(unreadable.Status == "invalid" && unreadable.Measurements.Count == 0 &&
        !unreadable.Detail.Contains(lockedImportPath, StringComparison.Ordinal),
        "CostImport_UnreadableFile_IsInvalidAndSanitized");
}
finally
{
    File.Delete(lockedImportPath);
}
await MbrIntegrationTests.RunAsync(Check);
Console.WriteLine($"{tests} offline fixture checks passed.");
