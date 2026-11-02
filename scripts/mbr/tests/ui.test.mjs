import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const script = await readFile(new URL("../wwwroot/dashboard.js", import.meta.url), "utf8");
class Element {
  children = [];
  dataset = {};
  value = "";
  textContent = "";
  events = {};
  hidden = false;
  append(child) { this.children.push(child); }
  replaceChildren(...children) { this.children = children; }
  addEventListener(name, callback) { this.events[name] = callback; }
  set innerHTML(_) { throw new Error("Untrusted HTML rendering forbidden"); }
}
const item = {
  number: 12, title: '<img src=x onerror=alert(1)> & "hostile title"',
  url: "javascript:alert(1)", createdAt: "2026-10-31T00:00:00Z",
  closedAt: "2026-11-01T00:00:00Z", mergedAt: null, reason: "not_planned"
};
const fixture = () => ({
  month: "2026-11", periodStart: "2026-11-01T00:00:00Z", periodEnd: "2026-12-01T00:00:00Z",
  refreshStartedAt: "2026-11-02T00:00:00Z", observedAt: "2026-11-02T00:00:01Z", coverage: "Month to date (UTC)",
  pulls: { active: [item], completed: [], otherClosed: [item], medianMergeHours: null, mergeSampleSize: 0 },
  issues: { active: [], completed: [], otherClosed: [item] },
  pullsSource: { status: "ok", detail: "fixture" }, issuesSource: { status: "ok", detail: "fixture" },
  costs: { status: "unknown", detail: "No cost import.", measurements: [] }
});
async function page(data, status = 200) {
  const elements = new Map();
  const get = id => {
    if (!elements.has(id)) elements.set(id, new Element());
    return elements.get(id);
  };
  get("pr-filter").value = "active";
  get("issue-filter").value = "active";
  const requests = [];
  vm.runInNewContext(script, {
    document: { getElementById: get, createElement: () => new Element() },
    fetch: async (url, options) => {
      requests.push({ url, options });
      return { ok: status < 400, status, json: async () => data };
    },
    Intl, Date, Number, Math, Map, Object, Error, encodeURIComponent
  });
  await new Promise(resolve => setImmediate(resolve));
  return { get, requests };
}
test("safe text/link rendering, true zero, unknown costs and date scope", async () => {
  const { get } = await page(fixture());
  const link = get("pr-list").children[0].children[0];
  assert.equal(link.textContent, '#12 <img src=x onerror=alert(1)> & "hostile title"');
  assert.equal(link.href, "https://github.com/Jamula/Jamula-www-Website/pull/12");
  assert.equal(link.rel, "noopener noreferrer");
  assert.equal(get("merged-prs").textContent, "0");
  assert.equal(get("ai-tokens").textContent, "Unknown / Unknown");
  assert.match(get("pr-context").textContent, /Current backlog/);
  assert.match(get("coverage").textContent, /end exclusive/);
  assert.equal(get("dashboard").hidden, false);
});
test("filters expose non-delivery closures and empty lists", async () => {
  const { get } = await page(fixture());
  get("issue-filter").value = "otherClosed";
  get("issue-filter").events.change();
  assert.match(get("issue-list").children[0].children[1].textContent, /not_planned/);
  get("pr-filter").value = "completed";
  get("pr-filter").events.change();
  assert.equal(get("pr-list").children[0].textContent, "No matching work.");
});
test("partial source data never renders missing counts as zero", async () => {
  const data = fixture();
  data.pulls = { active: null, completed: null, otherClosed: null, medianMergeHours: null, mergeSampleSize: 0 };
  data.pullsSource.status = "unavailable";
  const { get } = await page(data);
  assert.equal(get("active-prs").textContent, "Unknown");
  assert.match(get("status").textContent, /Partial data/);
  assert.match(get("pr-list").children[0].textContent, /source unavailable/);
});
test("missing snapshot shows actionable error and hides stale dashboard", async () => {
  const { get } = await page({ error: "No snapshot. Select Refresh data." }, 404);
  assert.equal(get("dashboard").hidden, true);
  assert.match(get("status").textContent, /Select Refresh data/);
  assert.equal(get("refresh").disabled, false);
  assert.equal(get("month").disabled, false);
});
test("refresh sends a non-simple same-origin POST; selection reads saved data", async () => {
  const { get, requests } = await page(fixture());
  get("controls").events.submit({ preventDefault() {} });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(requests[1].options.method, "POST");
  assert.equal(requests[1].options.headers["X-MBR-Refresh"], "1");
  get("month").value = "2026-10";
  get("month").events.change();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(requests[2].url, "/api/snapshot?month=2026-10");
  assert.deepEqual(Object.keys(requests[2].options), []);
});
test("cost provenance and untrusted evidence are text, with estimates explicit", async () => {
  const data = fixture();
  data.costs = { status: "imported", detail: "fixture", measurements: [{
    key: "aiInputTokens", value: 0, basis: "estimated", source: "<script>bad</script>",
    scope: "Jamula/Jamula-www-Website", asOf: data.observedAt,
    coveredFrom: data.periodStart, coveredThrough: data.observedAt
  }] };
  const { get } = await page(data);
  assert.equal(get("ai-tokens").textContent, "0 (estimated) / Unknown");
  assert.match(get("cost-rows").children[0].children[2].textContent, /<script>bad<\/script>/);
  assert.match(get("cost-rows").children[0].children[2].textContent, /scope: Jamula/);
});
