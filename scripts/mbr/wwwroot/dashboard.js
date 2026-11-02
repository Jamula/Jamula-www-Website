const $ = id => document.getElementById(id);
const number = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const month = new Date().toISOString().slice(0, 7);
const monthStart = new Date(`${month}-01T00:00:00Z`);
let snapshot;
let refreshFailed = false;

function text(id, value) { $(id).textContent = value; }
text("month-title", new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" }).format(monthStart));

function render(data) {
  snapshot = data;
  $("dashboard").hidden = false;
  text("coverage", "Month to date / repository activity");
  for (const [id, items] of [["merged-prs", data.pulls.completed], ["completed-issues", data.issues.completed],
    ["active-prs", data.pulls.active], ["active-issues", data.issues.active]]) {
    text(id, items ? number.format(items.length) : "Unknown");
  }

  // This business priority is explicitly scoped to the open, owner-authored contact-path issue.
  const contactPathOpen = data.issues.active?.some(item => item.number === 86) ?? false;
  const issuesKnown = data.issuesSource.status === "ok";
  text("readout-title", !issuesKnown ? "Business priorities need current evidence."
    : contactPathOpen ? "The homepage inquiry path is still open work."
    : "Repository activity is recorded. Business impact is not measured.");
  text("readout", !issuesKnown ? "Issue data is unavailable; this review cannot confirm the commercial priority."
    : contactPathOpen ? "Proposed focus: confirm the owner-approved contact destination and wording, then publish the inquiry path."
    : "Merges and closed issues show activity, not customer outcomes or revenue.");

  const measures = new Map(data.costs.measurements.map(m => [m.key, m]));
  const value = (key, money = false) => {
    const m = measures.get(key);
    if (!m) return "Not tracked";
    const period = new Date(m.coveredFrom) > new Date(data.periodStart) ||
      new Date(m.coveredThrough) < new Date(data.observedAt) ? "partial period" : "month to date";
    return `${money ? usd.format(m.value) : number.format(m.value)} (${m.basis}, ${period})`;
  };
  const tokenKeys = ["aiInputTokens", "aiOutputTokens", "aiCacheReadTokens", "aiCacheWriteTokens"];
  const tokenLabels = ["input", "output", "cache read", "cache write"];
  const recordedTokens = tokenKeys.filter(key => measures.has(key));
  text("ai-tokens", recordedTokens.length
    ? tokenKeys.map((key, index) => `${tokenLabels[index]}: ${value(key)}`).join("; ") : "Not tracked");
  text("actions-minutes", value("actionsBillableMinutes"));
  const moneyKeys = ["aiUsd", "actionsUsd", "hostingUsd", "domainUsd"];
  const moneyLabels = ["AI", "Actions", "Hosting", "Domain"];
  const hasMoney = moneyKeys.some(key => measures.has(key));
  text("spend-summary", hasMoney ? "Partial spend recorded; total unverified." : "Spend not measured.");
  $("recorded-spend").hidden = !hasMoney;
  text("recorded-spend", moneyKeys.flatMap((key, index) => measures.has(key)
    ? [`${moneyLabels[index]}: ${value(key, true)}`] : []).join("; "));

  const attention = [];
  if (contactPathOpen) attention.push(["Commercial readiness",
    "Confirm the approved contact path, then publish it."]);
  if (data.pullsSource.status !== "ok" || !issuesKnown) attention.push(["Review coverage",
    "Restore repository data and refresh before assessing progress."]);
  if (data.costs.status === "invalid") attention.push(["Cost control",
    "Correct the cost import; spend cannot be verified."]);
  else if (!measures.has("aiUsd") || !measures.has("actionsUsd")) attention.push(["Cost control",
    "Record AI and Actions costs before confirming zero incremental spend."]);
  else attention.push(["Cost control",
    "Reconcile recorded spend and coverage before confirming the full cost."]);
  if (attention.length < 3) attention.push(["Business impact",
    "Customer inquiries and revenue impact are not measured in this review."]);
  $("attention").replaceChildren();
  for (const [heading, action] of attention.slice(0, 3)) {
    const item = document.createElement("li");
    const label = document.createElement("strong");
    label.textContent = heading;
    const detail = document.createElement("p");
    detail.textContent = action;
    item.append(label, detail);
    $("attention").append(item);
  }
}

function showStatus(refreshed) {
  const partial = snapshot.pullsSource.status !== "ok" || snapshot.issuesSource.status !== "ok" ||
    snapshot.costs.status === "invalid";
  const stale = Date.now() - new Date(snapshot.observedAt).getTime() >= 86400000;
  $("status").dataset.error = String(partial || stale || refreshFailed);
  text("status", refreshFailed ? "Refresh failed. Showing the saved review; retry Refresh."
    : partial ? stale ? "Partial saved review, at least a day old. Refresh to retry."
      : "Partial review. Some data is unavailable."
    : stale ? "Saved review is at least a day old. Refresh for current data."
    : refreshed ? "Review updated." : "Saved review. Refresh for latest.");
}

async function load(refresh) {
  $("refresh").disabled = true;
  text("status", refresh ? "Updating review..." : "Loading review...");
  $("status").dataset.error = "false";
  try {
    const response = await fetch(`/api/${refresh ? "refresh" : "snapshot"}?month=${encodeURIComponent(month)}`,
      refresh ? { method: "POST", headers: { "X-MBR-Refresh": "1" } } : {});
    if (!response.ok) throw new Error("Review request failed.");
    const data = await response.json();
    render(data);
    refreshFailed = false;
    showStatus(refresh);
  } catch {
    refreshFailed = true;
    if (snapshot) showStatus(false);
    else {
      $("dashboard").hidden = true;
      $("status").dataset.error = "true";
      text("status", "Review unavailable. Select Refresh to retry.");
    }
  } finally {
    $("refresh").disabled = false;
  }
}
$("refresh").addEventListener("click", () => void load(true));
void load(false);
