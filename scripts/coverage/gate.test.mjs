import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { evaluateCoverage, formatReport } from "./gate.mjs";

function classReport(filename, lineCounts, branchCounts = []) {
  const lines = [
    ...lineCounts.map(
      (hits) => `<line number="1" hits="${hits}" branch="false"/>`,
    ),
    ...branchCounts.map(
      ([covered, valid]) =>
        `<line number="2" hits="1" branch="true" condition-coverage="0% (${covered}/${valid})"/>`,
    ),
  ].join("");
  return `<coverage><packages><package><classes><class name="fixture" filename="${filename}"><lines>${lines}</lines></class></classes></package></packages></coverage>`;
}

function inventory(components, excludedSources = []) {
  return {
    schemaVersion: 1,
    thresholdPercent: 90,
    components,
    excludedSources,
  };
}

const component = (id, sources, reports, unmeasured = []) => ({
  id,
  sources,
  reports,
  unmeasured,
});

test("CoverageGate_WeightsMeasuredCountsAcrossPassingComponents", () => {
  const input = inventory([
    component("small", ["src/a.js"], ["small.xml"]),
    component("large", ["src/b.js"], ["large.xml"]),
  ]);
  const reports = new Map([
    [
      "small.xml",
      classReport("C:\\repo\\src\\a.js", Array(9).fill(1).concat(0), [[9, 10]]),
    ],
    [
      "large.xml",
      classReport("/repo/src/b.js", Array(99).fill(1).concat(0), [[99, 100]]),
    ],
  ]);

  const result = evaluateCoverage(input, reports);
  assert.equal(result.passed, true);
  assert.equal(result.aggregate.linePercent, 98.21);
  assert.equal(result.aggregate.branchPercent, 98.18);
  assert.deepEqual(
    result.components.map((item) => item.passed),
    [true, true],
  );
});

test("CoverageGate_UsesClassLinesWithoutDoubleCountingMethodLines", () => {
  const report = [
    '<coverage><class filename="scripts/app.cs">',
    "<methods><method><lines>",
    '<line number="1" hits="0" branch="false"/>',
    '<line number="2" hits="1" branch="true" condition-coverage="50% (1/2)"/>',
    "</lines></method></methods><lines>",
    '<line number="1" hits="1" branch="false"/>',
    '<line number="2" hits="1" branch="true" condition-coverage="100% (2/2)"/>',
    "</lines></class></coverage>",
  ].join("");
  const result = evaluateCoverage(
    inventory([component("app", ["scripts/app.cs"], ["app.xml"])]),
    new Map([["app.xml", report]]),
  );

  assert.equal(result.components[0].linesCovered, 2);
  assert.equal(result.components[0].linesValid, 2);
  assert.equal(result.components[0].branchesCovered, 2);
  assert.equal(result.components[0].branchesValid, 2);
});

test("CoverageGate_FailsWhenEitherComponentMetricIsBelowThreshold", () => {
  const result = evaluateCoverage(
    inventory([component("app", ["src/app.cs"], ["app.xml"])]),
    new Map([
      ["app.xml", classReport("src/app.cs", Array(10).fill(1), [[8, 10]])],
    ]),
  );
  assert.equal(result.passed, false);
  assert.equal(result.components[0].passed, false);
  assert.equal(result.components[0].linePercent, 100);
  assert.equal(result.components[0].branchPercent, 80);
  assert.match(result.errors.join("\n"), /app: component requires/);
});

test("CoverageGate_DoesNotRoundUpSubthresholdCounts", () => {
  const result = evaluateCoverage(
    inventory([component("app", ["src/app.cs"], ["app.xml"])]),
    new Map([["app.xml", classReport("src/app.cs", [1], [[89999, 100000]])]]),
  );
  assert.equal(result.components[0].branchPercent, 90);
  assert.equal(result.components[0].passed, false);
  assert.equal(result.passed, false);
});

test("CoverageGate_FailsClosedForMissingReportAndSourceMeasurement", () => {
  const result = evaluateCoverage(
    inventory([component("app", ["src/expected.cs"], ["missing.xml"])]),
    new Map(),
  );
  assert.equal(result.components[0].linePercent, null);
  assert.equal(result.components[0].branchPercent, null);
  assert.ok(result.errors.some((error) => error.includes("missing report")));
  assert.ok(
    result.errors.some((error) => error.includes("missing source measurement")),
  );
  assert.ok(
    result.errors.some((error) => error.includes("aggregate requires")),
  );
});

test("CoverageGate_RejectsDuplicateAndUnclassifiedReportSources", () => {
  const duplicate = evaluateCoverage(
    inventory([component("app", ["src/app.cs"], ["first.xml", "second.xml"])]),
    new Map([
      ["first.xml", classReport("src/app.cs", [1], [[1, 1]])],
      ["second.xml", classReport("C:\\repo\\src\\app.cs", [1], [[1, 1]])],
    ]),
  );
  assert.ok(
    duplicate.errors.some((error) => error.includes("duplicate source")),
  );

  const unknown = evaluateCoverage(
    inventory([component("app", ["src/app.cs"], ["app.xml"])]),
    new Map([
      [
        "app.xml",
        classReport("src/app.cs", [1], [[1, 1]]).replace(
          "</classes>",
          '<class name="unknown" filename="src/hidden.cs"><lines><line number="1" hits="1" branch="false"/></lines></class></classes>',
        ),
      ],
    ]),
  );
  assert.ok(
    unknown.errors.some((error) =>
      error.includes("unclassified report source"),
    ),
  );
});

test("CoverageGate_KeepsTestOnlyExclusionsExplicitAndUnmeasuredCodeBlocking", () => {
  const result = evaluateCoverage(
    inventory(
      [
        component(
          "app",
          ["src/app.cs"],
          ["app.xml"],
          [{ path: "src/template.astro", reason: "No source map." }],
        ),
      ],
      [{ path: "tests/app.test.cs", reason: "Test-only source." }],
    ),
    new Map([
      [
        "app.xml",
        classReport("src/app.cs", [1], [[1, 1]]).replace(
          "</classes>",
          '<class name="test" filename="tests/app.test.cs"><lines><line number="1" hits="1" branch="false"/></lines></class></classes>',
        ),
      ],
    ]),
  );
  assert.equal(result.passed, false);
  assert.ok(result.errors.some((error) => error.includes("unmeasured source")));
  assert.equal(result.components[0].passed, false);
  assert.equal(result.components[0].sources[0].path, "src/app.cs");
});

test("CoverageGate_RejectsMalformedCoberturaAndBranchCounts", () => {
  for (const xml of [
    "<not-coverage/>",
    "<coverage></coverage>",
    '<coverage><class name="missing filename"><lines><line number="1" hits="1"/></lines></class></coverage>',
    "<coverage><class name='empty' filename='src/app.cs'></class></coverage>",
    '<coverage><class filename="src/app.cs"><lines><line hits="1" branch="true"/></lines></class></coverage>',
    '<coverage><class filename="src/app.cs"><lines><line hits="-1"/></lines></class></coverage>',
    '<coverage><class filename="src/app.cs"><lines><line hits="1" branch="true" condition-coverage="100% (2/1)"/></lines></class></coverage>',
    '<coverage><class filename="src/app.cs"><lines><line hits="1" branch="true" condition-coverage="100% (1/1)"</lines></class></coverage>',
    '<coverage><class filename="src/app.cs"><lines><line hits="1" branch="true" condition-coverage="100% (1/1)"/></lines></class>',
    '<coverage><class filename="src/app.cs"><lines><line hits="1" hits="2" branch="true" condition-coverage="100% (1/1)"/></lines></class></coverage>',
    '<coverage><class filename="src/app.cs"><lines><line hits="1" branch="true" condition-coverage="100% (1/1)" other="&bogus;"/></lines></class></coverage>',
    '<coverage><class filename="src/app.cs"><lines><line hits="1" branch="true" condition-coverage="100% (1/1)"/></class></lines></coverage>',
  ]) {
    const result = evaluateCoverage(
      inventory([component("app", ["src/app.cs"], ["app.xml"])]),
      new Map([["app.xml", xml]]),
    );
    assert.equal(result.passed, false, xml);
    assert.ok(
      result.errors.some((error) => error.includes("app.xml")),
      xml,
    );
  }
});

test("CoverageGate_InventoryClassifiesTrackedExecutableSources", async () => {
  const root = fileURLToPath(new URL("../../", import.meta.url));
  const manifest = JSON.parse(await readFile(new URL("./inventory.json", import.meta.url), "utf8"));
  const entries = [
    ...manifest.components.flatMap((item) => [
      ...item.sources,
      ...(item.unmeasured ?? []).map((source) => source.path),
    ]),
    ...manifest.excludedSources.map((item) => item.path),
  ];
  assert.equal(entries.length, new Set(entries).size, "inventory paths must be unique");
  const git = spawnSync("git", ["ls-files", "--cached"], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(git.status, 0, git.stderr);
  const tracked = new Set(git.stdout.trim().split(/\r?\n/));
  const executable = [...tracked].filter((file) =>
    /\.(?:cjs|mjs|js|cs|ts|astro|ps1|sh)$/.test(file) ||
    /^(?:\.github\/workflows|\.squad\/templates\/workflows)\/.*\.ya?ml$/.test(file),
  );
  assert.deepEqual(executable.filter((file) => !entries.includes(file)), []);
  assert.deepEqual(entries.filter((file) => !tracked.has(file)), []);
});

test("CoverageGate_RejectsInvalidInventoryAndRepeatedSourceAssignments", () => {
  assert.throws(
    () => evaluateCoverage({ schemaVersion: 2 }, new Map()),
    /unsupported or invalid schema/,
  );
  assert.throws(
    () =>
      evaluateCoverage(
        inventory([
          component("same", ["src/a.cs"], ["a.xml"]),
          component("same", ["src/b.cs"], ["b.xml"]),
        ]),
        new Map(),
      ),
    /invalid component/,
  );
  const duplicateSource = evaluateCoverage(
    inventory([
      component("first", ["src/a.cs"], ["a.xml"]),
      component("second", ["src/a.cs"], ["b.xml"]),
    ]),
    new Map(),
  );
  assert.ok(
    duplicateSource.errors.some((error) =>
      error.includes("source is assigned more than once"),
    ),
  );
});

test("CoverageGate_FormatsPassingAndUnmeasuredResults", () => {
  const formatted = formatReport({
    passed: true,
    components: [
      {
        id: "app",
        passed: true,
        linePercent: 100,
        linesCovered: 10,
        linesValid: 10,
        branchPercent: 90,
        branchesCovered: 9,
        branchesValid: 10,
      },
    ],
    aggregate: {
      linePercent: 100,
      linesCovered: 10,
      linesValid: 10,
      branchPercent: 90,
      branchesCovered: 9,
      branchesValid: 10,
    },
    errors: [],
  });
  assert.match(
    formatted.lines[1],
    /100\.00% \(10\/10\).*90\.00% \(9\/10\).*PASS/,
  );
  assert.match(formatted.lines[2], /aggregate.*PASS/);
  assert.deepEqual(formatted.errors, []);

  const missing = formatReport({
    passed: false,
    components: [
      {
        id: "unknown",
        passed: false,
        linePercent: null,
        linesCovered: 0,
        linesValid: 0,
        branchPercent: null,
        branchesCovered: 0,
        branchesValid: 0,
      },
    ],
    aggregate: {
      linePercent: null,
      linesCovered: 0,
      linesValid: 0,
      branchPercent: null,
      branchesCovered: 0,
      branchesValid: 0,
    },
    errors: ["unknown: missing report"],
  });
  assert.match(missing.lines[1], /unmeasured.*unmeasured.*FAIL/);
  assert.match(missing.lines[2], /aggregate.*FAIL/);
  assert.deepEqual(missing.errors, ["::error::unknown: missing report"]);
});

test("CoverageGate_CLIReportsUsageAndWritesFailClosedSummary", async () => {
  const gatePath = fileURLToPath(new URL("./gate.mjs", import.meta.url));
  const usage = spawnSync(process.execPath, [gatePath], {
    encoding: "utf8",
  });
  assert.equal(usage.status, 1);
  assert.match(usage.stderr, /Usage: node scripts\/coverage\/gate\.mjs/);

  const directory = await mkdtemp(path.join(os.tmpdir(), "coverage-gate-"));
  const summaryPath = path.join(directory, "summary.json");
  try {
    const result = spawnSync(
      process.execPath,
      [gatePath, directory, summaryPath],
      { encoding: "utf8" },
    );
    assert.equal(result.status, 1);
    assert.match(result.stdout, /Component \| Lines \| Branches \| Result/);
    assert.match(result.stderr, /missing report/);
    const summary = JSON.parse(await readFile(summaryPath, "utf8"));
    assert.equal(summary.passed, false);
    assert.ok(summary.components.every((item) => !item.passed));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
