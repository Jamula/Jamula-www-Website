"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const workflowPath = path.resolve(
  __dirname,
  "../../.github/workflows/squad-triage.yml",
);
const workflow = fs.readFileSync(workflowPath, "utf8").replace(/\r\n/g, "\n");
const marker = "          script: |\n";
const markerIndex = workflow.indexOf(marker);
assert.notEqual(markerIndex, -1, "workflow script block not found");
assert.equal(
  workflow.indexOf(marker, markerIndex + marker.length),
  -1,
  "ambiguous workflow script blocks",
);
const block = workflow.slice(markerIndex + marker.length).split("\n");
assert.ok(
  block.every((line) => line === "" || line.startsWith("            ")),
  "unexpected content after script block",
);
const script = block.map((line) => line.slice(12)).join("\n");
const lineOffset =
  workflow.slice(0, markerIndex + marker.length).split("\n").length - 1;
const executeScript = new vm.Script(
  `(async (require, context, core, github) => {\n${script}\n})`,
  {
    filename: workflowPath,
    lineOffset: lineOffset - 1,
  },
).runInThisContext();

const team = [
  "## Members",
  "| Name | Role |",
  "| --- | --- |",
  "| Seven | Lead |",
  "| Spock | Architect |",
  "| Data | Reviewer |",
  "| Scribe | Bot |",
  "## Other",
  "| Wrong | Lead |",
].join("\n");
const routing = [
  "| Work Type | Route To | Examples |",
  "| --- | --- | --- |",
  "| API engineering | **[Spock](agent)** | API outage; backend/api |",
  "| Review | Data | audit |",
].join("\n");

async function runTriage({
  teamContent = team,
  routingContent = routing,
  issue = {},
  failOn,
} = {}) {
  const calls = [];
  const info = [];
  const warnings = [];
  const files = new Map();
  if (teamContent !== null) files.set(".squad/team.md", teamContent);
  if (routingContent !== null) files.set(".squad/routing.md", routingContent);
  const fakeFs = {
    existsSync: (file) => files.has(file),
    readFileSync: (file, encoding) => {
      assert.equal(encoding, "utf8");
      assert.ok(files.has(file), `unexpected file: ${file}`);
      return files.get(file);
    },
  };
  const api = (operation) => async (args) => {
    calls.push({ operation, args });
    if (operation === failOn) throw new Error(`fake ${operation} failure`);
  };
  const github = {
    rest: {
      issues: {
        addLabels: api("addLabels"),
        createComment: api("createComment"),
      },
      actions: { createWorkflowDispatch: api("createWorkflowDispatch") },
    },
  };
  const context = {
    repo: { owner: "fixture-owner", repo: "fixture-repo" },
    payload: {
      issue: {
        number: 42,
        title: "unmatched issue",
        body: null,
        labels: [],
        ...issue,
      },
      repository: { default_branch: "fixture-default" },
    },
  };
  const core = {
    info: (message) => info.push(message),
    warning: (message) => warnings.push(message),
  };
  await executeScript(
    (name) => {
      assert.equal(name, "fs", "unexpected dependency");
      return fakeFs;
    },
    context,
    core,
    github,
  );
  return { calls, info, warnings };
}

function assertAssignment(result, label, assignee, reason) {
  const base = {
    owner: "fixture-owner",
    repo: "fixture-repo",
    issue_number: 42,
  };
  assert.deepEqual(result.calls.slice(0, 2), [
    { operation: "addLabels", args: { ...base, labels: [label] } },
    {
      operation: "addLabels",
      args: { ...base, labels: ["go:needs-research"] },
    },
  ]);
  assert.equal(result.calls[2].operation, "createComment");
  assert.deepEqual(
    { ...result.calls[2].args, body: undefined },
    { ...base, body: undefined },
  );
  assert.ok(result.calls[2].args.body.includes(`**Assigned to:** ${assignee}`));
  assert.ok(result.calls[2].args.body.includes(reason));
}

test("missing roster warns without GitHub calls", async () => {
  const result = await runTriage({ teamContent: null });
  assert.deepEqual(result.calls, []);
  assert.match(result.warnings[0], /No \.squad\/team\.md found/);
});

test("existing member label skips triage without calls", async () => {
  const result = await runTriage({
    issue: { labels: [{ name: "squad:spock" }] },
  });
  assert.deepEqual(result.calls, []);
  assert.match(result.info[0], /already has a squad member label/);
});

test("missing lead and architect warns without mutating issue", async () => {
  const result = await runTriage({
    teamContent: "## Members\n| Name | Role |\n| Data | Reviewer |\n",
  });
  assert.deepEqual(result.calls, []);
  assert.match(result.warnings[0], /No Lead role found/);
});

test("specific routing beats a weaker match and normalizes linked destination", async () => {
  const result = await runTriage({
    issue: { title: "API outage needs audit" },
  });
  assertAssignment(
    result,
    "squad:spock",
    "Spock (Architect)",
    'Matched routing rule "API engineering"',
  );
  assert.doesNotMatch(result.calls[2].args.body, /Scribe|Wrong/);
  assert.equal(result.calls.length, 3);
});

test("conflicting best routes fall back to lead rather than picking a winner", async () => {
  const tied = routing + "\n| Incident | Data | API outage |";
  const result = await runTriage({
    routingContent: tied,
    issue: { title: "API outage" },
  });
  assertAssignment(
    result,
    "squad:seven",
    "Seven (Lead)",
    "No specific domain match",
  );
});

test("missing routing uses architect fallback when no lead exists", async () => {
  const result = await runTriage({
    teamContent:
      "## Team Roster\n| Name | Role |\n| --- | --- |\n| Spock | Architect |\n",
    routingContent: null,
  });
  assertAssignment(
    result,
    "squad:spock",
    "Spock (Architect)",
    "No specific domain match",
  );
});

test("good-fit Copilot dispatches only when auto assignment is enabled", async () => {
  const result = await runTriage({
    teamContent: `${team}\n🤖 Coding Agent\n<!-- copilot-auto-assign: true -->`,
    issue: { title: "Add test coverage" },
  });
  assertAssignment(
    result,
    "squad:copilot",
    "@copilot (Coding Agent)",
    "Good fit for @copilot",
  );
  assert.deepEqual(result.calls[3], {
    operation: "createWorkflowDispatch",
    args: {
      owner: "fixture-owner",
      repo: "fixture-repo",
      workflow_id: "squad-issue-assign.yml",
      ref: "fixture-default",
      inputs: { issue_number: "42" },
    },
  });
  const disabled = await runTriage({
    teamContent: `${team}\n🤖 Coding Agent\n<!-- copilot-auto-assign: false -->`,
    issue: { title: "Add test coverage" },
  });
  assertAssignment(
    disabled,
    "squad:copilot",
    "@copilot (Coding Agent)",
    "Good fit for @copilot",
  );
  assert.equal(disabled.calls.length, 3);
});

test("needs-review Copilot route adds review note without dispatch when disabled", async () => {
  const result = await runTriage({
    teamContent: `${team}\n🤖 Coding Agent\n<!-- copilot-auto-assign: false -->`,
    issue: { title: "Refactoring needed" },
  });
  assertAssignment(
    result,
    "squad:copilot",
    "@copilot (Coding Agent)",
    "needs review",
  );
  assert.match(result.calls[2].args.body, /PR review recommended/);
  assert.equal(result.calls.length, 3);
});

test("not-suitable profile takes precedence over good-fit and routes to a member", async () => {
  const result = await runTriage({
    teamContent: `${team}\n🤖 Coding Agent`,
    issue: { title: "Security test coverage and audit" },
  });
  assertAssignment(
    result,
    "squad:data",
    "Data (Reviewer)",
    'Matched routing rule "Review"',
  );
  assert.match(result.calls[2].args.body, /Not suitable/);
});

test("custom capability profile overrides defaults and reports unmatched evaluation", async () => {
  const profile = `${team}\n🤖 Coding Agent\n🟢 Good fit: bespoke fix\n🟡 Needs review: custom migration\n🔴 Not suitable: sensitive\n`;
  const custom = await runTriage({
    teamContent: profile,
    issue: { title: "bespoke fix" },
  });
  assertAssignment(
    custom,
    "squad:copilot",
    "@copilot (Coding Agent)",
    "Good fit for @copilot",
  );
  const unmatched = await runTriage({
    teamContent: profile,
    issue: { title: "test coverage" },
  });
  assertAssignment(
    unmatched,
    "squad:seven",
    "Seven (Lead)",
    "No specific domain match",
  );
  assert.match(unmatched.calls[2].args.body, /No strong capability match/);
});

test("GitHub API failures propagate rather than being reported as success", async () => {
  await assert.rejects(
    runTriage({ failOn: "addLabels" }),
    /fake addLabels failure/,
  );
  await assert.rejects(
    runTriage({ failOn: "createComment" }),
    /fake createComment failure/,
  );
  await assert.rejects(
    runTriage({
      teamContent: `${team}\n🤖 Coding Agent\n<!-- copilot-auto-assign: true -->`,
      issue: { title: "test coverage" },
      failOn: "createWorkflowDispatch",
    }),
    /fake createWorkflowDispatch failure/,
  );
});

test("workflow remains an unmeasured blocker rather than a fully measured source", () => {
  const inventory = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "inventory.json"), "utf8"),
  );
  const component = inventory.components.find(
    (item) => item.id === "github-automation",
  );
  const source = ".github/workflows/squad-triage.yml";
  assert.ok(
    component.unmeasured.some((item) => item.path === source && item.reason),
  );
  assert.ok(!component.sources.includes(source));
  assert.ok(!inventory.excludedSources.some((item) => item.path === source));
});
