"use strict";

const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const path = require("node:path");
const { test } = require("node:test");
const {
  parseModuleOwnership,
  parseRoster,
  parseRoutingRules,
  resolveGithubApiBase,
  triageIssue,
} = require("../../.squad/templates/ralph-triage.js");

const roster = [
  { name: "Lead", role: "Lead", label: "squad:lead" },
  { name: "Spock", role: "Architect", label: "squad:spock" },
  { name: "Data", role: "Reviewer", label: "squad:data" },
];
const team =
  "## Members\n| Name | Role |\n| --- | --- |\n| Lead | Lead |\n| Spock | Architect |\n| Data | Reviewer |\n";
const routing =
  "## Routing Table\n| Work Type | Route To | Examples |\n| --- | --- | --- |\n| Review | Data | audit |\n";

function runCli(scenario = {}, args = [], token = "fixture-token") {
  const env = {
    ...process.env,
    TRIAGE_FIXTURE: JSON.stringify(scenario),
    GITHUB_TOKEN: token,
  };
  delete env.GITHUB_API_URL;
  delete env.GITHUB_SERVER_URL;
  return spawnSync(
    process.execPath,
    [
      "--require",
      path.join(__dirname, "ralph-triage-fixture.cjs"),
      path.join(__dirname, "../../.squad/templates/ralph-triage.js"),
      ...args,
    ],
    { encoding: "utf8", env },
  );
}

test("routing tables parse aliases, links, delimiters and invalid rows", () => {
  const md =
    "## Work Type -> Agent\r\n| Type | Primary Agent | Example |\r\n| :-- | --: | -- |\r\n| `Bug` | [Data](x) | `fix`; repair, |\r\n| | Data | ignored |\r\n## Other\r\n| bad | bad | bad |";
  assert.deepEqual(parseRoutingRules(md), [
    { workType: "Bug", agentName: "Data", keywords: ["fix", "repair"] },
  ]);
  assert.deepEqual(
    parseRoutingRules("## Routing Table\n| Type | Other |\n| Bug | Data |"),
    [],
  );
  assert.deepEqual(parseRoutingRules("no table"), []);
});

test("roster and module tables normalize entries and reject incomplete rows", () => {
  assert.deepEqual(
    parseRoster(
      "## Team Roster\n| Name | Role |\n| --- | --- |\n| `Spock` | Architect |\n| Ralph | Bot |\n| Scribe | Bot |\n| Missing | |\n",
    ),
    [roster[1]],
  );
  assert.deepEqual(parseRoster("## Members\n| Name | Title |\n| A | B |"), []);
  assert.deepEqual(parseRoster(""), []);
  const md =
    "## Module Ownership\n| Path | Primary | Secondary |\n| --- | --- | --- |\n| `SRC\\Api` | Spock | — |\n| docs | Data | Lead |\n| | Data | Lead |\n| tests | | Lead |";
  assert.deepEqual(parseModuleOwnership(md), [
    { modulePath: "src/api", primary: "Spock", secondary: null },
    { modulePath: "docs", primary: "Data", secondary: "Lead" },
  ]);
  assert.deepEqual(
    parseModuleOwnership("## Module Ownership\n| Path | Owner |\n| a | b |"),
    [],
  );
  assert.deepEqual(parseModuleOwnership(""), []);
});

test("module matching chooses longest path and primary or secondary owner before rules", () => {
  const modules = [
    { modulePath: "src", primary: "Data", secondary: null },
    { modulePath: "src/api", primary: " **Spock** ✨ ", secondary: "Data" },
  ];
  const rules = [{ workType: "audit", agentName: "Data", keywords: [] }];
  const result = triageIssue(
    { title: "audit `SRC\\API`" },
    rules,
    modules,
    roster,
  );
  assert.equal(result.agent.name, "Spock");
  assert.equal(result.source, "module-ownership");
  assert.equal(result.confidence, "high");
  assert.match(result.reason, /primary owner/);
  modules[1].primary = "Unknown";
  const secondary = triageIssue({ title: "src/api" }, rules, modules, roster);
  assert.equal(secondary.agent.name, "Data");
  assert.equal(secondary.confidence, "medium");
  assert.match(secondary.reason, /secondary owner/);
});

test("routing scores phrases and resolves same-owner ties but falls back on conflicting ties", () => {
  const rules = [
    { workType: "engineering", agentName: "Unknown", keywords: ["api outage"] },
    {
      workType: "Backend/API engineer",
      agentName: "[Data](url)",
      keywords: ["api outage", "api"],
    },
    { workType: "incident", agentName: "Data", keywords: ["api outage"] },
  ];
  const result = triageIssue({ title: "API outage" }, rules, [], roster);
  assert.equal(result.agent.name, "Data");
  assert.equal(result.confidence, "high");
  assert.match(result.reason, /api outage/);
  const tied = [
    ...rules,
    { workType: "incident", agentName: "Spock", keywords: ["api outage"] },
  ];
  assert.equal(
    triageIssue({ title: "API outage" }, tied, [], roster).source,
    "lead-fallback",
  );
  assert.equal(
    triageIssue({ title: "apiary" }, rules, [], roster).source,
    "lead-fallback",
  );
  const medium = triageIssue(
    { title: "repair" },
    [{ workType: "work", agentName: "Data", keywords: ["repair"] }],
    [],
    roster,
  );
  assert.equal(medium.confidence, "medium");
});

test("fallback prefers lead then architect and returns null when neither exists", () => {
  const modules = [
    { modulePath: "src", primary: "Missing", secondary: "Missing" },
  ];
  assert.equal(
    triageIssue({ title: "src" }, [], modules, roster).agent.name,
    "Lead",
  );
  assert.equal(
    triageIssue({ title: "nothing" }, [], [], roster.slice(1)).agent.name,
    "Spock",
  );
  assert.equal(
    triageIssue({ title: "nothing" }, [], [], roster.slice(2)),
    null,
  );
});

test("API base uses explicit URL then enterprise server then public default", () => {
  const oldApi = process.env.GITHUB_API_URL;
  const oldServer = process.env.GITHUB_SERVER_URL;
  try {
    process.env.GITHUB_API_URL = "https://api.example///";
    process.env.GITHUB_SERVER_URL = "https://server.example/";
    assert.equal(resolveGithubApiBase(), "https://api.example");
    delete process.env.GITHUB_API_URL;
    assert.equal(resolveGithubApiBase(), "https://server.example/api/v3");
    delete process.env.GITHUB_SERVER_URL;
    assert.equal(resolveGithubApiBase(), "https://api.github.com");
  } finally {
    if (oldApi === undefined) delete process.env.GITHUB_API_URL;
    else process.env.GITHUB_API_URL = oldApi;
    if (oldServer === undefined) delete process.env.GITHUB_SERVER_URL;
    else process.env.GITHUB_SERVER_URL = oldServer;
  }
});

test("CLI paginates and writes only untriaged issues through offline doubles", () => {
  const first = [
    { number: 1, title: "audit", labels: ["SQUAD"] },
    {
      number: 2,
      title: "audit",
      labels: [{ name: "squad" }, { name: "SQUAD:DATA" }],
    },
    { number: 3, title: "audit", labels: ["squad"], pull_request: {} },
    ...Array.from({ length: 97 }, (_, i) => ({
      number: i + 4,
      title: "none",
      labels: [null, {}, "other"],
    })),
  ];
  const result = runCli(
    {
      team,
      routing,
      remote: "git@github.example:org/repo.git",
      pages: [
        first,
        [{ number: 101, title: "other", labels: [{ name: "squad" }] }],
      ],
    },
    ["--squad-dir", "fixture", "--output", "fixture/results.json"],
  );
  assert.equal(result.status, 0, result.stderr);
  const requests = result.stdout
    .split("\n")
    .filter((line) => line.startsWith("FIXTURE_REQUEST "));
  assert.equal(requests.length, 2);
  const second = JSON.parse(requests[1].slice("FIXTURE_REQUEST ".length));
  assert.match(second.url, /repos\/org\/repo\/issues\?/);
  assert.match(second.url, /page=2/);
  assert.equal(second.method, "GET");
  const output = JSON.parse(
    result.stdout
      .split("\n")
      .find((line) => line.startsWith("FIXTURE_OUTPUT "))
      .slice("FIXTURE_OUTPUT ".length),
  );
  assert.deepEqual(
    JSON.parse(output.content).map(
      ({ issueNumber, assignTo, label, source }) => ({
        issueNumber,
        assignTo,
        label,
        source,
      }),
    ),
    [
      {
        issueNumber: 1,
        assignTo: "Data",
        label: "squad:data",
        source: "routing-rule",
      },
      {
        issueNumber: 101,
        assignTo: "Lead",
        label: "squad:lead",
        source: "lead-fallback",
      },
    ],
  );
});

test("CLI handles empty results, missing decision and non-array API payload", () => {
  const result = runCli({
    team: "## Members\n| Name | Role |\n| Data | Reviewer |",
    routing: "",
    pages: [[{ number: 1, title: "none", labels: ["squad"] }]],
  });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(
    JSON.parse(
      JSON.parse(
        result.stdout
          .split("\n")
          .find((line) => line.startsWith("FIXTURE_OUTPUT "))
          .slice(15),
      ).content,
    ),
    [],
  );
  const nonArray = runCli({ team, routing, pages: [{}] });
  assert.equal(nonArray.status, 0, nonArray.stderr);
  assert.match(nonArray.stdout, /FIXTURE_OUTPUT/);
});

test("CLI validates arguments and token without invoking GitHub", () => {
  for (const [args, token, message] of [
    [["--bad"], "fixture-token", "Unknown argument: --bad"],
    [["--squad-dir"], "fixture-token", "--squad-dir requires a value"],
    [["--output"], "fixture-token", "--output requires a value"],
    [[], "", "GITHUB_TOKEN is required"],
  ]) {
    const result = runCli({}, args, token);
    assert.equal(result.status, 1);
    assert.match(result.stderr, new RegExp(message));
    assert.doesNotMatch(result.stdout, /FIXTURE_REQUEST|FIXTURE_OUTPUT/);
  }
  const help = runCli({}, ["--help"], "");
  assert.equal(help.status, 0);
  assert.match(help.stdout, /Usage:/);
});

test("CLI reports invalid remotes and API transport, status and JSON errors", () => {
  for (const [scenario, message] of [
    [{ remote: "invalid" }, /Unable to parse owner\/repo/],
    [{ networkError: true }, /offline network failure/],
    [{ status: 403, rawBody: "denied" }, /GitHub API 403: denied/],
    [{ rawBody: "{" }, /Failed to parse GitHub response/],
  ]) {
    const result = runCli({ team, routing, ...scenario });
    assert.equal(result.status, 1);
    assert.match(result.stderr, message);
    assert.doesNotMatch(result.stdout, /FIXTURE_OUTPUT/);
  }
});
