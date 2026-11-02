import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const script = await readFile(new URL("../wwwroot/dashboard.js", import.meta.url), "utf8");
const html = await readFile(new URL("../wwwroot/index.html", import.meta.url), "utf8");
const instant = "2026-11-02T03:00:00Z";
class Clock extends Date {
  constructor(...args) { super(...(args.length ? args : [instant])); }
  static now() { return new Date(instant).getTime(); }
}
class Element {
  children = [];
  dataset = {};
  textContent = "";
  events = {};
  hidden = false;
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
  addEventListener(name, callback) { this.events[name] = callback; }
  set innerHTML(_) { throw new Error("Untrusted HTML rendering forbidden"); }
}
const item = {
  number: 86, title: '<img src=x onerror=alert(1)> & "hostile title"',
  url: "javascript:alert(1)", createdAt: "2026-10-31T00:00:00Z",
  closedAt: "2026-11-01T00:00:00Z", mergedAt: null, reason: "not_planned"
};
const fixture = () => ({
  month: "2026-11", periodStart: "2026-11-01T00:00:00Z", periodEnd: "2026-12-01T00:00:00Z",
  refreshStartedAt: "2026-11-02T02:59:58Z", observedAt: instant, coverage: "Month to date (UTC)",
  pulls: { active: [item], completed: [{ number: 2 }, { number: 3 }], otherClosed: [item], medianMergeHours: 0.02, mergeSampleSize: 2 },
  issues: { active: [item, { number: 87 }, { number: 88 }], completed: [{ number: 4 }], otherClosed: [] },
  pullsSource: { status: "ok", detail: "fixture" }, issuesSource: { status: "ok", detail: "fixture" },
  costs: { status: "unknown", detail: "No cost import.", measurements: [] }
});
const flush = () => new Promise(resolve => setImmediate(resolve));
async function page(responses = [fixture()]) {
  const elements = new Map([...html.matchAll(/\bid="([^"]+)"/g)].map(([, id]) => [id, new Element()]));
  const get = id => {
    assert.ok(elements.has(id), `Element ${id} must exist in the actual page`);
    return elements.get(id);
  };
  get("dashboard").hidden = true;
  const requests = [];
  vm.runInNewContext(script, {
    document: { getElementById: get, createElement: () => new Element() },
    fetch: async (url, options) => {
      const response = responses[Math.min(requests.length, responses.length - 1)];
      requests.push({ url, options });
      if (response instanceof Error) throw response;
      return { ok: !response.error, status: response.error ? 404 : 200, json: async () => response };
    },
    Intl, Date: Clock, Number, Math, Map, Object, Error, encodeURIComponent
  });
  await flush();
  const attention = () => get("attention").children.map(row => row.children.map(x => x.textContent).join(": "));
  return { get, requests, attention, elements };
}
test("executive page has four business sections and no tracker controls or work-item links", () => {
  for (const heading of ["Delivery", "Open work", "Costs", "Needs attention"])
    assert.ok(html.includes(`>${heading}</h2>`), heading);
  assert.doesNotMatch(html, /<(?:select|input|form|details|table)\b/i);
  assert.doesNotMatch(html, /https:\/\/github\.com|pr-list|issue-list|lead-time|cost-rows|sources|UTC|timestamp/i);
  assert.equal((html.match(/<button\b/g) || []).length, 1);
  assert.ok(html.indexOf('id="readout-title"') < html.indexOf('id="delivery-title"'));
});
test("business readout leads with the open contact-path priority, not activity as outcomes", async () => {
  const { get, attention } = await page();
  assert.equal(get("month-title").textContent, "November 2026");
  assert.equal(get("readout-title").textContent, "The homepage inquiry path is still open work.");
  assert.equal(get("readout").textContent, "Proposed focus: confirm the owner-approved contact destination and wording, then publish the inquiry path.");
  assert.deepEqual(attention(), [
    "Commercial readiness: Confirm the approved contact path, then publish it.",
    "Cost control: Record AI and Actions costs before confirming zero incremental spend.",
    "Business impact: Customer inquiries and revenue impact are not measured in this review."
  ]);
});
test("delivery and current workload stay distinct with four accurate subordinate counts", async () => {
  const { get } = await page();
  assert.equal(get("merged-prs").textContent, "2");
  assert.equal(get("completed-issues").textContent, "1");
  assert.equal(get("active-prs").textContent, "1");
  assert.equal(get("active-issues").textContent, "3");
  assert.equal(get("coverage").textContent, "Month to date / repository activity");
});
test("absent contact issue does not assert commercial readiness or invent a blocker", async () => {
  const data = fixture();
  data.issues.active = [];
  const { get, attention } = await page([data]);
  assert.equal(get("readout-title").textContent, "Repository activity is recorded. Business impact is not measured.");
  assert.equal(get("readout").textContent, "Merges and closed issues show activity, not customer outcomes or revenue.");
  assert.equal(get("active-issues").textContent, "0");
  assert.equal(attention().length, 2);
  assert.doesNotMatch(attention().join(" "), /Commercial readiness|blocked|approval pending|lost revenue/i);
});
test("unavailable sources stay unknown and attention remains bounded with an explicit data action", async () => {
  const data = fixture();
  data.pulls = { active: null, completed: null };
  data.issues = { active: null, completed: null };
  data.pullsSource.status = "unavailable";
  data.issuesSource.status = "unavailable";
  const { get, attention } = await page([data]);
  assert.equal(get("active-prs").textContent, "Unknown");
  assert.equal(get("completed-issues").textContent, "Unknown");
  assert.equal(get("readout-title").textContent, "Business priorities need current evidence.");
  assert.equal(get("status").textContent, "Partial review. Some data is unavailable.");
  assert.equal(get("status").dataset.error, "true");
  assert.equal(attention().length, 3);
  assert.equal(attention()[0], "Review coverage: Restore repository data and refresh before assessing progress.");
});
test("missing costs never imply free operation or measured zero", async () => {
  const { get } = await page();
  assert.equal(get("spend-summary").textContent, "Spend not measured.");
  assert.equal(get("ai-tokens").textContent, "Not tracked");
  assert.equal(get("actions-minutes").textContent, "Not tracked");
  assert.equal(get("recorded-spend").hidden, true);
  assert.equal(get("recorded-spend").textContent, "");
});
test("imported usage preserves separate token categories, basis and partial coverage without fake totals", async () => {
  const data = fixture();
  const measurement = (key, value, basis = "actual", through = instant) => ({
    key, value, basis, source: "<script>bad</script>", scope: "Jamula/Jamula-www-Website",
    asOf: instant, coveredFrom: data.periodStart, coveredThrough: through
  });
  data.costs = { status: "imported", measurements: [
    measurement("aiInputTokens", 120), measurement("aiOutputTokens", 0),
    measurement("aiCacheReadTokens", 50), measurement("aiCacheWriteTokens", 20),
    measurement("actionsElapsedMinutes", 90), measurement("actionsBillableMinutes", 0),
    measurement("aiUsd", 1.5, "estimated", "2026-11-01T12:00:00Z"),
    measurement("actionsUsd", 0), measurement("domainUsd", 2)
  ] };
  const { get, attention } = await page([data]);
  assert.equal(get("ai-tokens").textContent, "input: 120 (actual, month to date); output: 0 (actual, month to date); cache read: 50 (actual, month to date); cache write: 20 (actual, month to date)");
  assert.equal(get("actions-minutes").textContent, "0 (actual, month to date)");
  assert.equal(get("spend-summary").textContent, "Partial spend recorded; total unverified.");
  assert.equal(get("recorded-spend").textContent, "AI: $1.50 (estimated, partial period); Actions: $0.00 (actual, month to date); Domain: $2.00 (actual, month to date)");
  assert.equal(get("recorded-spend").hidden, false);
  assert.ok(attention().includes("Cost control: Reconcile recorded spend and coverage before confirming the full cost."));
});
test("partial token evidence and elapsed-only minutes cannot masquerade as complete or billable usage", async () => {
  const data = fixture();
  data.costs = { status: "imported", measurements: [
    { key: "aiInputTokens", value: 5, basis: "estimated", coveredFrom: "2026-11-02T00:00:00Z", coveredThrough: instant },
    { key: "actionsElapsedMinutes", value: 90, basis: "actual", coveredFrom: data.periodStart, coveredThrough: instant }
  ] };
  const { get } = await page([data]);
  assert.equal(get("ai-tokens").textContent, "input: 5 (estimated, partial period); output: Not tracked; cache read: Not tracked; cache write: Not tracked");
  assert.equal(get("actions-minutes").textContent, "Not tracked");
});
test("invalid cost evidence surfaces a corrective action rather than hiding failure", async () => {
  const data = fixture();
  data.costs.status = "invalid";
  const { get, attention } = await page([data]);
  assert.equal(get("status").textContent, "Partial review. Some data is unavailable.");
  assert.ok(attention().includes("Cost control: Correct the cost import; spend cannot be verified."));
  assert.equal(attention().length, 3);
});
test("untrusted item titles and evidence never reach executive HTML or displayed text", async () => {
  const { elements } = await page();
  const collect = element => [element.textContent, ...element.children.flatMap(collect)];
  const displayed = [...elements.values()].flatMap(collect).join(" ");
  assert.doesNotMatch(displayed, /<img|onerror|javascript:|<script>|UTC|2026-11-02|0\.02 hours/);
});
test("refresh reads the current month with a protected POST and a concise success state", async () => {
  const { get, requests } = await page();
  assert.equal(requests[0].url, "/api/snapshot?month=2026-11");
  assert.equal(get("status").textContent, "Saved review. Refresh for latest.");
  get("refresh").events.click();
  assert.equal(get("refresh").disabled, true);
  assert.equal(get("status").textContent, "Updating review...");
  await flush();
  assert.equal(requests[1].url, "/api/refresh?month=2026-11");
  assert.equal(requests[1].options.method, "POST");
  assert.equal(requests[1].options.headers["X-MBR-Refresh"], "1");
  assert.equal(get("status").textContent, "Review updated.");
  assert.equal(get("refresh").disabled, false);
});
test("missing snapshot and network failure show a short actionable unavailable state", async () => {
  for (const response of [{ error: "Sensitive technical body must not display" }, new Error("network down")]) {
    const { get } = await page([response]);
    assert.equal(get("dashboard").hidden, true);
    assert.equal(get("status").textContent, "Review unavailable. Select Refresh to retry.");
    assert.equal(get("status").dataset.error, "true");
    assert.equal(get("refresh").disabled, false);
  }
});
test("failed refresh retains the last review with an explicit saved-data warning", async () => {
  const { get } = await page([fixture(), new Error("network down")]);
  get("refresh").events.click();
  await flush();
  assert.equal(get("dashboard").hidden, false);
  assert.equal(get("merged-prs").textContent, "2");
  assert.equal(get("status").textContent, "Refresh failed. Showing the saved review; retry Refresh.");
  assert.equal(get("status").dataset.error, "true");
});
test("saved review becomes stale exactly at the one-day boundary without displaying timestamps", async () => {
  for (const [observedAt, expected] of [
    ["2026-11-01T03:00:00.001Z", "Saved review. Refresh for latest."],
    ["2026-11-01T03:00:00Z", "Saved review is at least a day old. Refresh for current data."],
    ["2026-11-01T02:59:59.999Z", "Saved review is at least a day old. Refresh for current data."]
  ]) {
    const data = fixture();
    data.observedAt = observedAt;
    const { get } = await page([data]);
    assert.equal(get("status").textContent, expected);
  }
});
test("partial and stale saved data surface both limitations together", async () => {
  const data = fixture();
  data.observedAt = "2026-11-01T03:00:00Z";
  data.costs.status = "invalid";
  const { get } = await page([data]);
  assert.equal(get("status").textContent, "Partial saved review, at least a day old. Refresh to retry.");
  assert.equal(get("status").dataset.error, "true");
});
