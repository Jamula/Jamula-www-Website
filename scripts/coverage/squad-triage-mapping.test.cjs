"use strict";

const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const { createRequire } = require("node:module");
const os = require("node:os");
const path = require("node:path");
const { test } = require("node:test");
const { fileURLToPath } = require("node:url");

const root = path.resolve(__dirname, "../..");
const workflowPath = path.join(root, ".github/workflows/squad-triage.yml");
const testPath = path.join(root, "scripts/coverage/squad-triage.test.cjs");
const requireWebsite = createRequire(path.join(root, "www/package.json"));
const v8toIstanbul = requireWebsite("v8-to-istanbul");

function extract(workflow) {
  const marker = "          script: |\n";
  const index = workflow.indexOf(marker);
  assert.notEqual(index, -1);
  assert.equal(workflow.indexOf(marker, index + marker.length), -1);
  const start = index + marker.length;
  const lines = workflow.slice(start).split("\n");
  assert.ok(
    lines.every((line) => line === "" || line.startsWith("            ")),
  );
  const script = lines.map((line) => line.slice(12)).join("\n");
  return {
    firstLine: workflow.slice(0, start).split("\n").length,
    script,
    source: `(async (require, context, core, github) => {\n${script}\n})`,
  };
}

function requireExactSource(workflow, source) {
  assert.equal(
    source,
    extract(workflow).source,
    "generated source differs from workflow",
  );
}

function collectCoverage(testName) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "jamula-triage-v8-"));
  try {
    const env = { ...process.env, NODE_V8_COVERAGE: directory };
    delete env.NODE_TEST_CONTEXT;
    const result = spawnSync(
      process.execPath,
      ["--test", "--test-name-pattern", `^${testName}$`, testPath],
      { cwd: root, env, encoding: "utf8" },
    );
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.match(result.stdout, /pass 1\b/);
    const scripts = fs.readdirSync(directory).flatMap((file) => {
      const report = JSON.parse(
        fs.readFileSync(path.join(directory, file), "utf8"),
      );
      return report.result.filter(
        (entry) =>
          entry.url.startsWith("file:") &&
          path.resolve(fileURLToPath(entry.url)) === workflowPath,
      );
    });
    assert.equal(
      scripts.length,
      1,
      "expected exactly one VM script coverage record",
    );
    return scripts[0];
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

test("script line mapping excludes YAML metadata and rejects synthetic source mismatches", () => {
  const workflow = fs.readFileSync(workflowPath, "utf8").replace(/\r\n/g, "\n");
  const { firstLine, script, source } = extract(workflow);
  const yamlLines = workflow.split("\n");
  const scriptLines = script.split("\n");
  for (let i = 0; i < scriptLines.length; i++) {
    assert.equal(yamlLines[firstLine - 1 + i].slice(12), scriptLines[i]);
  }
  assert.ok(firstLine > 1);
  assert.match(yamlLines[firstLine - 2], /script: \|/);
  requireExactSource(workflow, source);
  assert.throws(
    () =>
      requireExactSource(
        workflow,
        source.replace("const issue", "const Issue"),
      ),
    /generated source differs/,
  );
  assert.throws(
    () => requireExactSource(workflow, "\n" + source),
    /generated source differs/,
  );
  const harness = fs.readFileSync(testPath, "utf8");
  assert.ok(
    harness.includes(
      `\`(async (require, context, core, github) => {\\n\${script}\\n})\``,
    ),
  );
});

test("missing-roster negative control rejects false-positive converted line", async () => {
  const workflow = fs.readFileSync(workflowPath, "utf8").replace(/\r\n/g, "\n");
  const { firstLine, source } = extract(workflow);
  const coverage = collectCoverage("missing roster warns without GitHub calls");
  assert.equal(coverage.functions[0].ranges[0].endOffset, source.length);
  const converter = v8toIstanbul(workflowPath, 0, { source });
  await converter.load();
  converter.applyCoverage(coverage.functions);
  const converted = converter.toIstanbul()[workflowPath];
  const yamlLines = workflow.split("\n");
  const dispatchIf =
    yamlLines.findIndex(
      (line) => line.trim() === "if (isCopilot && autoAssign) {",
    ) + 1;
  const generatedLine = dispatchIf - firstLine + 2;
  const statement = Object.entries(converted.statementMap).find(
    ([, range]) => range.start.line === generatedLine,
  );
  assert.ok(statement, "expected converted statement for dispatch condition");
  const reportedHits = converted.s[statement[0]];
  assert.throws(
    () =>
      assert.equal(
        reportedHits,
        0,
        "dispatch condition was not reached on the missing-roster return path",
      ),
    /dispatch condition was not reached/,
  );
});

test("V8 range denominator changes when previously uncalled functions execute", () => {
  const early = collectCoverage("missing roster warns without GitHub calls");
  const routed = collectCoverage(
    "good-fit Copilot dispatches only when auto assignment is enabled",
  );
  const countRanges = (record) =>
    record.functions.reduce((count, fn) => count + fn.ranges.length, 0);
  assert.ok(countRanges(routed) > countRanges(early));
  const earlyLead = early.functions.find(
    (fn) => fn.functionName === "findLead",
  );
  const routedLead = routed.functions.find(
    (fn) => fn.functionName === "findLead",
  );
  assert.equal(earlyLead.ranges[0].count, 0);
  assert.ok(routedLead.ranges[0].count > 0);
  assert.ok(routedLead.ranges.length > earlyLead.ranges.length);
});
