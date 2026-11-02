const $ = id => document.getElementById(id);
const number = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
const date = value => new Date(value).toISOString().replace("T", " ").replace(".000Z", " UTC");
const labels = {
  aiInputTokens: "AI input tokens", aiOutputTokens: "AI output tokens",
  aiCacheReadTokens: "AI cache-read tokens", aiCacheWriteTokens: "AI cache-write tokens",
  actionsElapsedMinutes: "Actions elapsed job minutes (not billing)",
  actionsBillableMinutes: "Actions billable runner minutes",
  aiUsd: "AI spend (USD)", actionsUsd: "Actions spend (USD)",
  hostingUsd: "Hosting spend (USD)", domainUsd: "Domain spend (USD)"
};
let snapshot;
$("month").value = new Date().toISOString().slice(0, 7);

function text(id, value) { $(id).textContent = value; }
function list(kind) {
  const pulls = kind === "pr";
  const summary = pulls ? snapshot.pulls : snapshot.issues;
  const filter = $(pulls ? "pr-filter" : "issue-filter").value;
  const element = $(pulls ? "pr-list" : "issue-list");
  element.replaceChildren();
  text(pulls ? "pr-context" : "issue-context", filter === "active"
    ? `Current backlog at ${date(snapshot.observedAt)}. Oldest first.`
    : `${snapshot.month} UTC closures, latest state. Newest first.`);
  const items = summary[filter];
  if (!items?.length) {
    const row = document.createElement("li");
    row.textContent = items ? "No matching work." : "Unknown: source unavailable. See source health below.";
    element.append(row);
    return;
  }
  for (const item of items) {
    const row = document.createElement("li");
    const link = document.createElement("a");
    // Never trust stored/imported URLs or render repository strings as HTML.
    if (Number.isSafeInteger(item.number) && item.number > 0) {
      link.href = `https://github.com/Jamula/Jamula-www-Website/${pulls ? "pull" : "issues"}/${item.number}`;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }
    link.textContent = `#${item.number} ${item.title}`;
    row.append(link);
    const detail = document.createElement("small");
    detail.textContent = filter === "active"
      ? `${Math.max(0, Math.floor((new Date(snapshot.observedAt) - new Date(item.createdAt)) / 86400000))} days open${item.draft ? " / draft" : ""}`
      : `${date((pulls && item.mergedAt) || item.closedAt)} / ${pulls ? item.mergedAt ? "merged" : "not merged" : item.reason || "reason unavailable"}`;
    row.append(detail);
    element.append(row);
  }
}

function render(data) {
  snapshot = data;
  $("dashboard").hidden = false;
  text("coverage", `${data.coverage}. Delivery window: ${date(data.periodStart)} to ${date(data.periodEnd)} (end exclusive).`);
  for (const [id, items] of [["active-prs", data.pulls.active], ["merged-prs", data.pulls.completed],
    ["active-issues", data.issues.active], ["completed-issues", data.issues.completed]]) {
    text(id, items ? number.format(items.length) : "Unknown");
  }
  text("lead-time", `Median PR open-to-merge: ${data.pulls.medianMergeHours === null ? "Unknown" : `${number.format(data.pulls.medianMergeHours)} hours`} (n=${data.pulls.mergeSampleSize}). Elapsed-time proxy, not coding time.`);
  list("pr");
  list("issue");
  const measures = new Map(data.costs.measurements.map(m => [m.key, m]));
  const value = key => {
    const m = measures.get(key);
    return m ? `${number.format(m.value)} (${m.basis})` : "Unknown";
  };
  text("cost-health", `${data.costs.status}: ${data.costs.detail}`);
  text("ai-tokens", `${value("aiInputTokens")} / ${value("aiOutputTokens")}`);
  text("actions-minutes", value("actionsBillableMinutes"));
  text("spend", `${value("aiUsd")} / ${value("actionsUsd")}`);
  $("cost-rows").replaceChildren();
  for (const [key, label] of Object.entries(labels)) {
    const m = measures.get(key);
    const row = document.createElement("tr");
    for (const content of [label, value(key), m
      ? `${m.source} / scope: ${m.scope} / ${date(m.coveredFrom)} to ${date(m.coveredThrough)} (end exclusive); recorded ${date(m.asOf)}${m.pricingSource ? ` / pricing: ${m.pricingSource}, ${m.pricingDate}` : ""}`
      : "No repository-attributed evidence imported."]) {
      const cell = document.createElement("td");
      cell.textContent = content;
      row.append(cell);
    }
    $("cost-rows").append(row);
  }
  $("sources").replaceChildren();
  for (const [name, source] of [["Pull requests", data.pullsSource], ["Issues", data.issuesSource]]) {
    const row = document.createElement("li");
    row.textContent = `${name}: ${source.status}. ${source.detail}`;
    $("sources").append(row);
  }
}

async function load(refresh) {
  $("refresh").disabled = true;
  $("month").disabled = true;
  $("dashboard").hidden = true;
  $("status").dataset.error = "false";
  text("status", refresh ? "Reading GitHub pages and saving a new snapshot..." : "Loading saved snapshot...");
  try {
    const response = await fetch(`/api/${refresh ? "refresh" : "snapshot"}?month=${encodeURIComponent($("month").value)}`,
      refresh ? { method: "POST", headers: { "X-MBR-Refresh": "1" } } : {});
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `Request failed (${response.status}). Retry Refresh data.`);
    render(data);
    const partial = data.pullsSource.status !== "ok" || data.issuesSource.status !== "ok" || data.costs.status === "invalid";
    $("status").dataset.error = String(partial);
    text("status", `${partial ? "Partial data" : "Snapshot loaded"} / observed ${date(data.observedAt)} / collection began ${date(data.refreshStartedAt)}. Refresh for latest data.`);
  } catch (error) {
    $("status").dataset.error = "true";
    text("status", error instanceof Error ? error.message : "Dashboard read failed. Retry Refresh data.");
  } finally {
    $("refresh").disabled = false;
    $("month").disabled = false;
  }
}
$("controls").addEventListener("submit", event => { event.preventDefault(); void load(true); });
$("month").addEventListener("change", () => void load(false));
$("pr-filter").addEventListener("change", () => snapshot && list("pr"));
$("issue-filter").addEventListener("change", () => snapshot && list("issue"));
void load(false);
