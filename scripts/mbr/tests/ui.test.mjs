import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const scriptPath = fileURLToPath(
  new URL("../wwwroot/dashboard.js", import.meta.url),
);
const script = await readFile(scriptPath, "utf8");
const html = await readFile(
  new URL("../wwwroot/index.html", import.meta.url),
  "utf8",
);
const instant = "2026-11-02T03:00:00Z";
class Element {
  children = [];
  dataset = {};
  textContent = "";
  events = {};
  hidden = false;
  append(...children) {
    this.children.push(...children);
  }
  replaceChildren(...children) {
    this.children = children;
  }
  addEventListener(name, callback) {
    this.events[name] = callback;
  }
  set innerHTML(_) {
    throw new Error("Untrusted HTML rendering forbidden");
  }
}
const item = {
  number: 86,
  title: '<img src=x onerror=alert(1)> & "hostile title"',
  url: "javascript:alert(1)",
  createdAt: "2026-10-31T00:00:00Z",
  closedAt: "2026-11-01T00:00:00Z",
  mergedAt: null,
  reason: "not_planned",
};
const fixture = () => ({
  month: "2026-11",
  periodStart: "2026-11-01T00:00:00Z",
  periodEnd: "2026-12-01T00:00:00Z",
  refreshStartedAt: "2026-11-02T02:59:58Z",
  observedAt: instant,
  coverage: "Month to date (UTC)",
  pulls: {
    active: [item],
    completed: [{ number: 2 }, { number: 3 }],
    otherClosed: [item],
    medianMergeHours: 0.02,
    mergeSampleSize: 2,
  },
  issues: {
    active: [item, { number: 87 }, { number: 88 }],
    completed: [{ number: 4 }],
    otherClosed: [],
  },
  pullsSource: { status: "ok", detail: "fixture" },
  issuesSource: { status: "ok", detail: "fixture" },
  costs: { status: "unknown", detail: "No cost import.", measurements: [] },
});
const flush = () => new Promise((resolve) => setImmediate(resolve));
async function page(
  responses = [fixture()],
  search = "",
  clock = { now: instant },
) {
  class Clock extends Date {
    constructor(...args) {
      super(...(args.length ? args : [clock.now]));
    }
    static now() {
      return new Date(clock.now).getTime();
    }
  }
  const elements = new Map(
    [...html.matchAll(/\bid="([^"]+)"/g)].map(([, id]) => [id, new Element()]),
  );
  const get = (id) => {
    assert.ok(elements.has(id), `Element ${id} must exist in the actual page`);
    return elements.get(id);
  };
  get("dashboard").hidden = true;
  const requests = [];
  const timers = new Map();
  const events = {};
  const document = {
    getElementById: get,
    createElement: () => new Element(),
    visibilityState: "visible",
    addEventListener: (name, callback) => {
      events[name] = callback;
    },
  };
  let nextTimer = 0;
  vm.runInNewContext(
    script,
    {
      document,
      setTimeout: (callback, delay) => {
        timers.set(++nextTimer, { callback, at: Clock.now() + delay });
        return nextTimer;
      },
      clearTimeout: (id) => timers.delete(id),
      fetch: async (url, options) => {
        const pending =
          responses[Math.min(requests.length, responses.length - 1)];
        requests.push({ url, options });
        const response = await pending;
        if (response instanceof Error) throw response;
        return {
          ok: !response.error,
          status: response.error ? 404 : 200,
          json: async () => response,
        };
      },
      Intl,
      Date: Clock,
      Number,
      Math,
      Map,
      Object,
      Error,
      encodeURIComponent,
      URLSearchParams,
      location: { search },
    },
    { filename: scriptPath },
  );
  await flush();
  const attention = () =>
    get("attention").children.map((row) =>
      row.children.map((x) => x.textContent).join(": "),
    );
  const runTimers = () => {
    for (const [id, timer] of [...timers])
      if (timer.at <= Clock.now()) {
        timers.delete(id);
        timer.callback();
      }
  };
  return {
    get,
    requests,
    attention,
    elements,
    runTimers,
    events,
    document,
    timers,
  };
}
test("executive page has four business sections and no tracker controls or work-item links", () => {
  for (const heading of ["Delivery", "Open work", "Costs", "Needs attention"])
    assert.ok(html.includes(`>${heading}</h2>`), heading);
  assert.doesNotMatch(html, /<(?:select|input|form|details|table)\b/i);
  assert.doesNotMatch(
    html,
    /https:\/\/github\.com|pr-list|issue-list|lead-time|cost-rows|sources|UTC|timestamp/i,
  );
  assert.equal((html.match(/<button\b/g) || []).length, 1);
  assert.ok(
    html.indexOf('id="readout-title"') < html.indexOf('id="delivery-title"'),
  );
});
test("business readout leads with the open contact-path priority, not activity as outcomes", async () => {
  const { get, attention } = await page();
  assert.equal(get("month-title").textContent, "November 2026");
  assert.equal(
    get("readout-title").textContent,
    "The homepage inquiry path is still open work.",
  );
  assert.equal(
    get("readout").textContent,
    "Proposed focus: confirm the owner-approved contact destination and wording, then publish the inquiry path.",
  );
  assert.deepEqual(attention(), [
    "Commercial readiness: Confirm the approved contact path, then publish it.",
    "Cost control: Connect AI and Actions usage before confirming zero incremental spend.",
    "Business impact: Customer inquiries and revenue impact are not measured in this review.",
  ]);
});
test("delivery and current workload stay distinct with four accurate subordinate counts", async () => {
  const { get } = await page();
  assert.equal(get("merged-prs").textContent, "2");
  assert.equal(get("completed-issues").textContent, "1");
  assert.equal(get("active-prs").textContent, "1");
  assert.equal(get("active-issues").textContent, "3");
  assert.equal(
    get("coverage").textContent,
    "Month to date / repository activity",
  );
});
test("absent contact issue does not assert commercial readiness or invent a blocker", async () => {
  const data = fixture();
  data.issues.active = [];
  const { get, attention } = await page([data]);
  assert.equal(
    get("readout-title").textContent,
    "Repository activity is recorded. Business impact is not measured.",
  );
  assert.equal(
    get("readout").textContent,
    "Merges and closed issues show activity, not customer outcomes or revenue.",
  );
  assert.equal(get("active-issues").textContent, "0");
  assert.equal(attention().length, 2);
  assert.doesNotMatch(
    attention().join(" "),
    /Commercial readiness|blocked|approval pending|lost revenue/i,
  );
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
  assert.equal(
    get("readout-title").textContent,
    "Business priorities need current evidence.",
  );
  assert.equal(
    get("status").textContent,
    "Partial review. Some data is unavailable.",
  );
  assert.equal(get("status").dataset.error, "true");
  assert.equal(attention().length, 3);
  assert.equal(
    attention()[0],
    "Review coverage: Restore repository data and refresh before assessing progress.",
  );
});
test("missing costs never imply free operation or measured zero", async () => {
  const { get } = await page();
  assert.equal(get("spend-summary").textContent, "Spend not measured.");
  assert.equal(get("ai-tokens").textContent, "No repository token source");
  assert.equal(
    get("actions-minutes").textContent,
    "Usage source not connected",
  );
  assert.equal(get("recorded-spend").hidden, true);
  assert.equal(get("recorded-spend").textContent, "");
});
test("imported usage preserves separate token categories, basis and partial coverage without fake totals", async () => {
  const data = fixture();
  const measurement = (key, value, basis = "actual", through = instant) => ({
    key,
    value,
    basis,
    source: "<script>bad</script>",
    scope: "Jamula/Jamula-www-Website",
    asOf: instant,
    coveredFrom: data.periodStart,
    coveredThrough: through,
  });
  data.costs = {
    status: "imported",
    measurements: [
      measurement("aiInputTokens", 120),
      measurement("aiOutputTokens", 0),
      measurement("aiCacheReadTokens", 50),
      measurement("aiCacheWriteTokens", 20),
      measurement("actionsElapsedMinutes", 90),
      measurement("actionsBillableMinutes", 0),
      measurement("aiUsd", 1.5, "estimated", "2026-11-01T12:00:00Z"),
      measurement("actionsUsd", 0),
      measurement("domainUsd", 2),
    ],
  };
  const { get, attention } = await page([data]);
  assert.equal(
    get("ai-tokens").textContent,
    "input: 120 (actual, month to date); output: 0 (actual, month to date); cache read: 50 (actual, month to date); cache write: 20 (actual, month to date)",
  );
  assert.equal(
    get("actions-minutes").textContent,
    "0 (actual, month to date) billable",
  );
  assert.equal(
    get("spend-summary").textContent,
    "Reported spend; total unverified.",
  );
  assert.equal(
    get("recorded-spend").textContent,
    "AI: $1.50 (estimated, partial period); Actions: $0.00 (actual, month to date); Domain: $2.00 (actual, month to date)",
  );
  assert.equal(get("recorded-spend").hidden, false);
  assert.ok(
    attention().includes(
      "Cost control: Reconcile recorded spend and coverage before confirming the full cost.",
    ),
  );
});
test("partial token evidence and elapsed-only minutes cannot masquerade as complete or billable usage", async () => {
  const data = fixture();
  data.costs = {
    status: "imported",
    measurements: [
      {
        key: "aiInputTokens",
        value: 5,
        basis: "estimated",
        coveredFrom: "2026-11-02T00:00:00Z",
        coveredThrough: instant,
      },
      {
        key: "actionsElapsedMinutes",
        value: 90,
        basis: "actual",
        coveredFrom: data.periodStart,
        coveredThrough: instant,
      },
    ],
  };
  const { get } = await page([data]);
  assert.equal(
    get("ai-tokens").textContent,
    "input: 5 (estimated, partial period); output: Not connected; cache read: Not connected; cache write: Not connected",
  );
  assert.equal(
    get("actions-minutes").textContent,
    "Usage source not connected",
  );
});
test("connected Actions billing shows used minutes, discounts and money without inventing AI usage", async () => {
  const data = fixture();
  data.costs = {
    status: "collected",
    actionsStatus: "ok",
    measurements: [
      {
        key: "actionsRunnerMinutes",
        value: 798,
        basis: "actual",
        coveredFrom: data.periodStart,
        coveredThrough: instant,
      },
      {
        key: "actionsBillableMinutes",
        value: 0,
        basis: "actual",
        coveredFrom: data.periodStart,
        coveredThrough: instant,
      },
      {
        key: "actionsUsd",
        value: 0,
        basis: "actual",
        coveredFrom: data.periodStart,
        coveredThrough: instant,
      },
    ],
  };
  const { get, attention } = await page([data]);
  assert.equal(
    get("actions-minutes").textContent,
    "798 (actual, month to date) used; 0 (actual, month to date) after discounts",
  );
  assert.equal(
    get("recorded-spend").textContent,
    "Actions: $0.00 (actual, month to date)",
  );
  assert.equal(get("ai-tokens").textContent, "No repository token source");
  assert.equal(
    get("spend-summary").textContent,
    "Reported spend; total unverified.",
  );
  assert.ok(
    attention().includes(
      "Cost control: Actions charges are reported. Connect repository AI usage to complete cost visibility.",
    ),
  );
});
test("mixed Actions rows retain each measure's basis and coverage", async () => {
  const data = fixture();
  data.costs = {
    status: "imported",
    measurements: [
      {
        key: "actionsRunnerMinutes",
        value: 798,
        basis: "actual",
        coveredFrom: data.periodStart,
        coveredThrough: instant,
      },
      {
        key: "actionsBillableMinutes",
        value: 0,
        basis: "estimated",
        coveredFrom: "2026-11-02T00:00:00Z",
        coveredThrough: instant,
      },
    ],
  };
  const { get } = await page([data]);
  assert.equal(
    get("actions-minutes").textContent,
    "798 (actual, month to date) used; 0 (estimated, partial period) after discounts",
  );
});
test("billing access failure is visible without inventing zero or concealing the partial source", async () => {
  const data = fixture();
  data.costs.actionsStatus = "unavailable";
  const { get } = await page([data]);
  assert.equal(
    get("actions-minutes").textContent,
    "Billing source unavailable",
  );
  assert.equal(
    get("status").textContent,
    "Partial review. Some data is unavailable.",
  );
  assert.equal(get("status").dataset.error, "true");
});
test("storage-only billing does not imply zero runner minutes or an unconnected source", async () => {
  const data = fixture();
  data.costs.actionsStatus = "ok";
  data.costs.measurements = [
    {
      key: "actionsUsd",
      value: 0.001,
      basis: "actual",
      coveredFrom: data.periodStart,
      coveredThrough: instant,
    },
  ];
  const { get } = await page([data]);
  assert.equal(get("actions-minutes").textContent, "No runner usage reported");
  assert.equal(
    get("recorded-spend").textContent,
    "Actions: < $0.01 (actual, month to date)",
  );
});
test("future billing has no observations rather than zero usage", async () => {
  const data = fixture();
  data.costs.actionsStatus = "not-applicable";
  const { get } = await page([data]);
  assert.equal(get("actions-minutes").textContent, "No observations yet");
});
test("nonzero sub-cent spend never displays as zero while documented zero stays zero", async () => {
  for (const [value, expected] of [
    [0, "$0.00"],
    [0.004, "< $0.01"],
    [0.009, "< $0.01"],
    [0.01, "$0.01"],
  ]) {
    const data = fixture();
    data.costs = {
      status: "imported",
      measurements: [
        {
          key: "aiUsd",
          value,
          basis: "actual",
          coveredFrom: data.periodStart,
          coveredThrough: instant,
        },
      ],
    };
    const { get } = await page([data]);
    assert.equal(
      get("recorded-spend").textContent,
      `AI: ${expected} (actual, month to date)`,
    );
    assert.equal(
      get("spend-summary").textContent,
      "Reported spend; total unverified.",
    );
  }
});
test("invalid cost evidence surfaces a corrective action rather than hiding failure", async () => {
  const data = fixture();
  data.costs.status = "invalid";
  const { get, attention } = await page([data]);
  assert.equal(
    get("status").textContent,
    "Partial review. Some data is unavailable.",
  );
  assert.ok(
    attention().includes(
      "Cost control: Correct the cost import; spend cannot be verified.",
    ),
  );
  assert.equal(attention().length, 3);
});
test("untrusted item titles and evidence never reach executive HTML or displayed text", async () => {
  const { elements } = await page();
  const collect = (element) => [
    element.textContent,
    ...element.children.flatMap(collect),
  ];
  const displayed = [...elements.values()].flatMap(collect).join(" ");
  assert.doesNotMatch(
    displayed,
    /<img|onerror|javascript:|<script>|UTC|2026-11-02|0\.02 hours/i,
  );
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
  for (const response of [
    { error: "Sensitive technical body must not display" },
    new Error("network down"),
  ]) {
    const { get } = await page([response]);
    assert.equal(get("dashboard").hidden, true);
    assert.equal(
      get("status").textContent,
      "Review unavailable. Select Refresh to retry.",
    );
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
  assert.equal(
    get("status").textContent,
    "Refresh failed. Showing the saved review; retry Refresh.",
  );
  assert.equal(get("status").dataset.error, "true");
});
test("saved review becomes stale exactly at the one-day boundary without displaying timestamps", async () => {
  for (const [observedAt, expected] of [
    ["2026-11-01T03:00:00.001Z", "Saved review. Refresh for latest."],
    [
      "2026-11-01T03:00:00Z",
      "Saved review is at least a day old. Refresh for current data.",
    ],
    [
      "2026-11-01T02:59:59.999Z",
      "Saved review is at least a day old. Refresh for current data.",
    ],
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
  assert.equal(
    get("status").textContent,
    "Partial saved review, at least a day old. Refresh to retry.",
  );
  assert.equal(get("status").dataset.error, "true");
});
test("an open review becomes stale at expiry without fetching or waiting for interaction", async () => {
  const clock = { now: instant };
  const { get, runTimers, requests, timers } = await page(
    [fixture()],
    "",
    clock,
  );
  clock.now = "2026-11-03T02:59:59.999Z";
  runTimers();
  assert.equal(get("status").textContent, "Saved review. Refresh for latest.");
  clock.now = "2026-11-03T03:00:00Z";
  runTimers();
  assert.equal(
    get("status").textContent,
    "Saved review is at least a day old. Refresh for current data.",
  );
  assert.equal(get("status").dataset.error, "true");
  assert.equal(requests.length, 1);
  assert.equal(timers.size, 0);
});
test("visibility rechecks stale data without overwriting an in-flight refresh", async () => {
  const clock = { now: instant };
  let finish;
  const pending = new Promise((resolve) => {
    finish = resolve;
  });
  const { get, events, runTimers, requests } = await page(
    [fixture(), pending],
    "",
    clock,
  );
  get("refresh").events.click();
  clock.now = "2026-11-03T03:00:00Z";
  events.visibilitychange();
  runTimers();
  assert.equal(get("status").textContent, "Updating review...");
  assert.equal(get("refresh").disabled, true);
  const updated = fixture();
  updated.observedAt = clock.now;
  finish(updated);
  await flush();
  assert.equal(get("status").textContent, "Review updated.");
  clock.now = "2026-11-04T03:00:00Z";
  events.visibilitychange();
  assert.equal(
    get("status").textContent,
    "Saved review is at least a day old. Refresh for current data.",
  );
  assert.equal(get("status").dataset.error, "true");
  assert.equal(requests.length, 2);
});
test("October review requests the selected month and separates full-month delivery from current priorities", async () => {
  const data = fixture();
  data.month = "2026-10";
  data.periodStart = "2026-10-01T00:00:00Z";
  data.periodEnd = "2026-11-01T00:00:00Z";
  data.costs = {
    status: "imported",
    measurements: [
      {
        key: "aiUsd",
        value: 2,
        basis: "actual",
        coveredFrom: data.periodStart,
        coveredThrough: data.periodEnd,
      },
    ],
  };
  const { get, requests } = await page([data], "?month=2026-10");
  assert.equal(get("month-title").textContent, "October 2026");
  assert.equal(requests[0].url, "/api/snapshot?month=2026-10");
  assert.equal(get("coverage").textContent, "Full month / repository activity");
  assert.equal(
    get("open-coverage").textContent,
    "Current workload, not month-end backlog",
  );
  assert.equal(
    get("readout-title").textContent,
    "Current priority: the homepage inquiry path remains open.",
  );
  assert.equal(get("attention-title").textContent, "Needs attention now");
  assert.equal(
    get("recorded-spend").textContent,
    "AI: $2.00 (actual, full month)",
  );
  get("refresh").events.click();
  await flush();
  assert.equal(requests[1].url, "/api/refresh?month=2026-10");
});
test("invalid month addresses are rejected visibly without fetching another month's data", async () => {
  for (const search of [
    "?month=2026-13",
    "?month=2026-1",
    "?month=../2026-10",
    "?month=",
    "?month=9999-12",
  ]) {
    const { get, requests } = await page([fixture()], search);
    assert.equal(requests.length, 0);
    assert.equal(get("dashboard").hidden, true);
    assert.equal(get("refresh").disabled, true);
    assert.equal(
      get("status").textContent,
      "Invalid review month. Use ?month=YYYY-MM in the page address.",
    );
  }
});
test("future months disclose absent observations and never label present backlog as a forecast", async () => {
  const data = fixture();
  data.month = "2026-12";
  data.periodStart = "2026-12-01T00:00:00Z";
  data.periodEnd = "2027-01-01T00:00:00Z";
  data.pulls.completed = [];
  data.issues.completed = [];
  const { get } = await page([data], "?month=2026-12");
  assert.equal(get("month-title").textContent, "December 2026");
  assert.equal(
    get("coverage").textContent,
    "Future month / no activity observations yet",
  );
  assert.equal(
    get("open-coverage").textContent,
    "Current workload, not a forecast",
  );
  assert.equal(get("attention-title").textContent, "Needs attention now");
  assert.equal(get("merged-prs").textContent, "0");
  assert.equal(
    get("readout-title").textContent,
    "Current priority: the homepage inquiry path remains open.",
  );
});
test("unselected month rolls over on refresh and changes the heading only after success", async () => {
  const clock = { now: "2026-11-30T23:59:59Z" };
  const november = fixture();
  november.observedAt = clock.now;
  const december = fixture();
  december.month = "2026-12";
  december.periodStart = "2026-12-01T00:00:00Z";
  december.periodEnd = "2027-01-01T00:00:00Z";
  december.observedAt = "2026-12-01T00:00:01Z";
  const { get, requests } = await page(
    [november, new Error("offline"), december],
    "",
    clock,
  );
  assert.equal(get("month-title").textContent, "November 2026");
  clock.now = december.observedAt;
  get("refresh").events.click();
  await flush();
  assert.equal(requests[1].url, "/api/refresh?month=2026-12");
  assert.equal(get("month-title").textContent, "November 2026");
  assert.equal(
    get("status").textContent,
    "Refresh failed. Showing the saved review; retry Refresh.",
  );
  get("refresh").events.click();
  await flush();
  assert.equal(requests[2].url, "/api/refresh?month=2026-12");
  assert.equal(get("month-title").textContent, "December 2026");
  assert.equal(
    get("coverage").textContent,
    "Month to date / repository activity",
  );
});
test("explicit October review remains pinned when the current UTC month changes", async () => {
  const october = fixture();
  october.month = "2026-10";
  october.periodStart = "2026-10-01T00:00:00Z";
  october.periodEnd = "2026-11-01T00:00:00Z";
  const clock = { now: "2026-11-30T23:59:59Z" };
  const { get, requests } = await page([october], "?month=2026-10", clock);
  clock.now = "2026-12-01T00:00:01Z";
  get("refresh").events.click();
  await flush();
  assert.equal(requests[1].url, "/api/refresh?month=2026-10");
  assert.equal(get("month-title").textContent, "October 2026");
  assert.equal(get("coverage").textContent, "Full month / repository activity");
});
