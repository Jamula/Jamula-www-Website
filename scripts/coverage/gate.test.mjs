import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { evaluateCoverage, formatReport } from "./gate.mjs";

const repositoryRoot = fileURLToPath(new URL("../../", import.meta.url));

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

function sourceReport(filename, sources) {
  return classReport(filename, [1], [[1, 1]]).replace(
    "<packages>",
    `<sources>${sources.map((source) => `<source>${source}</source>`).join("")}</sources><packages>`,
  );
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
const metadataPath = "scripts/monitor/InternalsVisibleTo.cs";
const metadataContent =
  'using System.Runtime.CompilerServices;\n[assembly: InternalsVisibleTo("JamulaMonitor.Tests")]\n';
const metadataEntry = {
  path: metadataPath,
  kind: "monitor-friend-assembly",
  reason: "Literal assembly metadata; no executable lines.",
};
function metadataFixture(entries = [metadataEntry]) {
  return inventory([
    {
      ...component("monitor", ["scripts/monitor/Program.cs"], ["monitor.xml"]),
      validatedMetadata: entries,
    },
  ]);
}
const monitorReports = () =>
  new Map([
    ["monitor.xml", classReport("scripts/monitor/Program.cs", [1], [[1, 1]])],
  ]);

test("CoverageGate_ValidatesExactMonitorMetadataWithoutInventingCounts", () => {
  for (const content of [
    metadataContent,
    metadataContent.replaceAll("\n", "\r\n"),
    ` \t${metadataContent}\t`,
  ]) {
    const input = metadataFixture();
    const result = evaluateCoverage(
      input,
      monitorReports(),
      repositoryRoot,
      new Map([[metadataPath, content]]),
    );
    const baseline = evaluateCoverage(
      inventory([
        component("monitor", ["scripts/monitor/Program.cs"], ["monitor.xml"]),
      ]),
      monitorReports(),
    );
    assert.equal(result.passed, true);
    assert.deepEqual(result.aggregate, baseline.aggregate);
    assert.deepEqual(
      result.components[0].sources,
      baseline.components[0].sources,
    );
    assert.deepEqual(result.components[0].validatedMetadata, [
      { ...metadataEntry, validated: true },
    ]);
    assert.match(
      formatReport(result).lines.join("\n"),
      /InternalsVisibleTo\.cs.*no coverage counts/,
    );
  }
});

test("CoverageGate_RejectsMissingExecutableAndUnsupportedMetadataContent", () => {
  for (const content of [
    undefined,
    "",
    " ",
    metadataContent + "Console.WriteLine(1);\n",
    metadataContent + "class Hidden { static int Run() => 1; }\n",
    metadataContent + "namespace Hidden {}\n",
    metadataContent + "#if DEBUG\nConsole.WriteLine(1);\n#endif\n",
    metadataContent + "// Unsupported comment\n",
    metadataContent +
      '[assembly: System.Reflection.AssemblyVersion("1.0.0.0")]\n',
    metadataContent + '[assembly: InternalsVisibleTo("Other.Tests")]\n',
    metadataContent.replace('"JamulaMonitor.Tests"', "GetFriendName()"),
    metadataContent.replace("JamulaMonitor.Tests", "Other.Tests"),
    metadataContent.replace(
      "using System.Runtime.CompilerServices;",
      "using InternalsVisibleTo = CustomAttribute;",
    ),
    metadataContent.replace("[assembly:", "[module:"),
    metadataContent + "\0",
  ]) {
    const result = evaluateCoverage(
      metadataFixture(),
      monitorReports(),
      repositoryRoot,
      new Map([[metadataPath, content]]),
    );
    assert.equal(result.passed, false, String(content));
    assert.deepEqual(result.components[0].validatedMetadata, []);
    assert.match(
      result.errors.join("\n"),
      /metadata content is missing or unsupported/,
    );
  }
});

test("CoverageGate_RejectsMissingMonitorMetadataClassification", () => {
  const result = evaluateCoverage(
    metadataFixture([]),
    monitorReports(),
    repositoryRoot,
    new Map([[metadataPath, metadataContent]]),
  );
  assert.equal(result.passed, false);
  assert.match(
    result.errors.join("\n"),
    /monitor: missing metadata classification: scripts\/monitor\/InternalsVisibleTo\.cs/,
  );
});

test("CoverageGate_RejectsUnsupportedAndDuplicateMetadataClassifications", () => {
  for (const entry of [
    { ...metadataEntry, path: "scripts/monitor/Program.cs" },
    { ...metadataEntry, kind: "arbitrary-csharp" },
    { ...metadataEntry, reason: "" },
    null,
  ]) {
    const result = evaluateCoverage(
      metadataFixture([entry]),
      monitorReports(),
      repositoryRoot,
      new Map([[metadataPath, metadataContent]]),
    );
    assert.equal(result.passed, false);
    assert.match(
      result.errors.join("\n"),
      /unsupported metadata classification/,
    );
  }
  for (const placement of [
    "duplicate",
    "measured",
    "unmeasured",
    "excluded",
    "other-component",
    "normalized-measured",
    "normalized-unmeasured",
    "normalized-excluded",
  ]) {
    const input = metadataFixture();
    if (placement === "duplicate")
      input.components[0].validatedMetadata.push(metadataEntry);
    if (placement === "measured")
      input.components[0].sources.push(metadataPath);
    if (placement === "unmeasured")
      input.components[0].unmeasured.push({
        path: metadataPath,
        reason: "blocker",
      });
    if (placement === "excluded")
      input.excludedSources.push({ path: metadataPath, reason: "not allowed" });
    if (placement === "normalized-measured")
      input.components[0].sources.push(
        "scripts/monitor/./InternalsVisibleTo.cs",
      );
    if (placement === "normalized-unmeasured")
      input.components[0].unmeasured.push({
        path: "scripts/monitor/./InternalsVisibleTo.cs",
        reason: "blocker",
      });
    if (placement === "normalized-excluded")
      input.excludedSources.push({
        path: "scripts/monitor/./InternalsVisibleTo.cs",
        reason: "not allowed",
      });
    if (placement === "other-component") input.components[0].id = "other";
    const result = evaluateCoverage(
      input,
      monitorReports(),
      repositoryRoot,
      new Map([[metadataPath, metadataContent]]),
    );
    assert.equal(result.passed, false, placement);
    assert.match(
      result.errors.join("\n"),
      /metadata.*(?:assigned more than once|classification)/,
    );
  }
  const input = metadataFixture();
  input.components[0].validatedMetadata = {};
  assert.throws(
    () => evaluateCoverage(input, monitorReports()),
    /invalid component/,
  );
});

test("CoverageGate_MetadataDoesNotMaskMeasurementsBlockersOrThresholds", () => {
  for (const failure of [
    "missing-report",
    "threshold",
    "unmeasured",
    "metadata-measured",
  ]) {
    const input = metadataFixture();
    const reports = monitorReports();
    if (failure === "missing-report") reports.clear();
    if (failure === "threshold")
      reports.set(
        "monitor.xml",
        classReport("scripts/monitor/Program.cs", [0], [[0, 1]]),
      );
    if (failure === "unmeasured")
      input.components[0].unmeasured.push({
        path: "other.cs",
        reason: "still blocking",
      });
    if (failure === "metadata-measured")
      reports.set(
        "monitor.xml",
        reports
          .get("monitor.xml")
          .replace(
            "</classes>",
            '<class filename="' +
              metadataPath +
              '"><lines><line hits="1"/></lines></class></classes>',
          ),
      );
    const result = evaluateCoverage(
      input,
      reports,
      repositoryRoot,
      new Map([[metadataPath, metadataContent]]),
    );
    assert.equal(result.passed, false, failure);
    assert.deepEqual(result.components[0].validatedMetadata, [
      { ...metadataEntry, validated: true },
    ]);
    assert.match(
      result.errors.join("\n"),
      /missing report|requires >=90%|unmeasured source|unclassified report source/,
    );
  }
});

test("CoverageGate_RejectsSimilarlyNamedOutsideSourceRoots", () => {
  for (const sourceRoot of [
    "C:\\other\\www",
    "C:\\repo\\other\\www",
    "C:\\repository\\www",
    "D:\\repo\\www",
  ]) {
    const xml = classReport("astro.config.ts", [1], [[1, 1]])
      .replace("<packages>", `<sources><source>${sourceRoot}</source></sources><packages>`);
    const result = evaluateCoverage(
      inventory([component("config", ["www/astro.config.ts"], ["config.xml"])]),
      new Map([["config.xml", xml]]),
      "C:\\repo",
    );
    assert.equal(result.passed, false, sourceRoot);
    assert.deepEqual(result.components[0].sources, [], sourceRoot);
    assert.ok(result.errors.some((error) => error.includes("missing source measurement: www/astro.config.ts")), sourceRoot);
  }
});

test("CoverageGate_ResolvesLegitimatePathsAgainstExplicitRepositoryRoot", () => {
  for (const [root, filename, sources] of [
    ["/checkout/repo", "www/astro.config.ts", []],
    ["/checkout/repo", "astro.config.ts", ["www"]],
    ["/checkout/repo", "./astro.config.ts", ["/checkout/repo/www"]],
    ["/checkout/repo", "astro.config.ts", ["www", "./www/"]],
    ["/checkout/repo", "../www/astro.config.ts", ["www"]],
    ["/checkout/repo", "/checkout/repo/www/astro.config.ts", ["/unrelated"]],
    ["/checkout/repo space", "astro.config.ts", ["file:///checkout/repo%20space/www"]],
    ["/checkout/repo space", "file:///checkout/repo%20space/www/astro.config.ts", []],
    ["C:\\checkout\\repo", "www\\astro.config.ts", []],
    ["C:\\checkout\\repo", "astro.config.ts", ["www"]],
    ["C:\\checkout\\repo", "astro.config.ts", ["C:/CHECKOUT/REPO/www"]],
    ["C:\\checkout\\repo", "C:\\checkout\\repo\\www\\astro.config.ts", []],
    ["C:\\checkout\\repo", "file:///C:/checkout/repo/www/astro.config.ts", []],
    ["C:\\checkout\\repo", "astro.config.ts", ["file://localhost/C:/checkout/repo/www"]],
    ["\\\\server\\share\\repo", "astro.config.ts", ["\\\\server\\share\\repo\\www"]],
    ["\\\\server\\share\\repo", "file://server/share/repo/www/astro.config.ts", []],
  ]) {
    const result = evaluateCoverage(
      inventory([component("config", ["www/astro.config.ts"], ["config.xml"])]),
      new Map([["config.xml", sourceReport(filename, sources)]]),
      root,
    );
    assert.equal(result.passed, true, JSON.stringify({ root, filename, sources, errors: result.errors }));
    assert.deepEqual(
      result.components[0].sources.map((source) => [source.path, source.linesCovered, source.linesValid, source.branchesCovered, source.branchesValid]),
      [["www/astro.config.ts", 2, 2, 1, 1]],
    );
  }
});

test("CoverageGate_RejectsAmbiguousEscapingAndUnsupportedPaths", () => {
  for (const [root, filename, sources] of [
    ["/checkout/repo", "astro.config.ts", ["www", "other/www"]],
    ["/checkout/repo", "astro.config.ts", ["www", "/other/www"]],
    ["/checkout/repo", "www/astro.config.ts", ["other"]],
    ["/checkout/repo", "www/astro.config.ts", ["../other"]],
    ["/checkout/repo", "../other/www/astro.config.ts", []],
    ["/checkout/repo", "/other/www/astro.config.ts", ["www"]],
    ["/checkout/repo", "/checkout/repository/www/astro.config.ts", []],
    ["/checkout/repo", "/checkout/repo/www/../../../../www/astro.config.ts", []],
    ["/checkout/repo", "astro.config.ts", ["C:\\checkout\\repo\\www"]],
    ["/checkout/repo", "WWW/astro.config.ts", []],
    ["C:\\checkout\\repo", "/checkout/repo/www/astro.config.ts", []],
    ["C:\\checkout\\repo", "C: www/astro.config.ts", []],
    ["C:\\checkout\\repo", "https://example.test/www/astro.config.ts", []],
    ["C:\\checkout\\repo", "file:///C:/checkout/repo/www/astro.config.ts?query", []],
    ["C:\\checkout\\repo", "file:///C:/checkout/repo/www/astro.config.ts#fragment", []],
    ["C:\\checkout\\repo", "file:///C:/checkout/repo/www/%ZZ", []],
    ["C:\\checkout\\repo", "file://[invalid", []],
    ["\\\\server\\share\\repo", "\\\\other\\share\\repo\\www\\astro.config.ts", []],
  ]) {
    const result = evaluateCoverage(
      inventory([component("config", ["www/astro.config.ts"], ["config.xml"])]),
      new Map([["config.xml", sourceReport(filename, sources)]]),
      root,
    );
    assert.equal(result.passed, false, JSON.stringify({ root, filename, sources }));
    assert.deepEqual(result.components[0].sources, []);
    assert.ok(result.errors.some((error) => error.includes("missing source measurement: www/astro.config.ts")));
    assert.ok(result.errors.some((error) => error.includes("config.xml") || error.includes("unclassified report source")));
  }
  assert.throws(
    () => evaluateCoverage(inventory([]), new Map(), "relative/repo"),
    /Repository root must be an absolute path/,
  );
});

test("CoverageGate_DoesNotUseOutsidePathsAsExplicitExclusions", () => {
  const report = classReport("src/app.cs", [1], [[1, 1]]).replace(
    "</classes>",
    '<class filename="/other/tests/app.test.cs"><lines><line hits="1"/></lines></class></classes>',
  );
  const result = evaluateCoverage(
    inventory(
      [component("app", ["src/app.cs"], ["app.xml"])],
      [{ path: "tests/app.test.cs", reason: "Test-only source." }],
    ),
    new Map([["app.xml", report]]),
    "/checkout/repo",
  );
  assert.equal(result.passed, false);
  assert.match(result.errors.join("\n"), /outside repository root/);
});

test("CoverageGate_RejectsCanonicalSourceAliasesWithoutDoubleCounting", () => {
  for (const alias of ["www/./astro.config.ts", "WWW/ASTRO.CONFIG.TS"]) {
    const result = evaluateCoverage(
      inventory([component("config", ["www/astro.config.ts", alias], ["config.xml"])]),
      new Map([["config.xml", sourceReport("www/astro.config.ts", [])]]),
      "C:\\repo",
    );
    assert.equal(result.passed, false);
    assert.match(result.errors.join("\n"), /source is assigned more than once/);
    assert.equal(result.components[0].sources.length, 1);
    assert.equal(result.aggregate.linesValid, 2);
    assert.equal(result.aggregate.branchesValid, 1);
  }
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
      classReport("C:/repo/src/b.js", Array(99).fill(1).concat(0), [[99, 100]]),
    ],
  ]);

  const result = evaluateCoverage(input, reports, "C:\\repo");
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

test("CoverageGate_AttributesRelativeAstroConfigUsingCoberturaSourceRoot", async () => {
  const manifest = JSON.parse(await readFile(new URL("./inventory.json", import.meta.url), "utf8"));
  const website = manifest.components.find((item) => item.id === "website-browser");
  assert.ok(website.sources.includes("www/astro.config.ts"));
  assert.ok(!website.unmeasured.some((item) => item.path === "www/astro.config.ts"));
  const configReport = classReport("astro.config.ts", [1, 0], [[1, 2]])
    .replace("<packages>", `<sources><source>${repositoryRoot}www</source></sources><packages>`);
  const reports = new Map([
    ["website/cobertura-coverage.xml", classReport("www/public/analytics-consent.js", [1], [[1, 1]])],
    ["astro-config/cobertura-coverage.xml", configReport],
  ]);
  const result = evaluateCoverage(inventory([website]), reports);
  const config = result.components[0].sources.find((item) => item.path === "www/astro.config.ts");
  assert.deepEqual(
    [config.linesCovered, config.linesValid, config.branchesCovered, config.branchesValid],
    [2, 3, 1, 2],
  );
  assert.equal(result.components[0].passed, false);
  assert.equal(result.components[0].unmeasured.filter((item) => item.path.endsWith(".astro")).length, 7);
  assert.ok(!result.errors.some((error) => error.includes("unclassified report source")));

  reports.set("astro-config/cobertura-coverage.xml", configReport.replace(`${repositoryRoot}www`, `${repositoryRoot}other/www`));
  const wrongRoot = evaluateCoverage(inventory([website]), reports);
  assert.ok(wrongRoot.errors.some((error) => error.includes("missing source measurement: www/astro.config.ts")));
  assert.ok(wrongRoot.errors.some((error) => error.includes("unclassified report source: astro.config.ts")));
});

test("CoverageGate_FailsClosedWhenAstroConfigReportIsMissing", async () => {
  const manifest = JSON.parse(await readFile(new URL("./inventory.json", import.meta.url), "utf8"));
  const website = manifest.components.find((item) => item.id === "website-browser");
  const result = evaluateCoverage(
    inventory([website]),
    new Map([["website/cobertura-coverage.xml", classReport("www/public/analytics-consent.js", [1], [[1, 1]])]]),
  );
  assert.equal(result.passed, false);
  assert.equal(result.components[0].passed, false);
  assert.ok(result.errors.some((error) => error.includes("missing report: astro-config/cobertura-coverage.xml")));
  assert.ok(result.errors.some((error) => error.includes("missing source measurement: www/astro.config.ts")));
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
      ["second.xml", classReport(`${repositoryRoot}src/app.cs`, [1], [[1, 1]])],
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
  const manifest = JSON.parse(
    await readFile(new URL("./inventory.json", import.meta.url), "utf8"),
  );
  const entries = [
    ...manifest.components.flatMap((item) => [
      ...item.sources,
      ...(item.validatedMetadata ?? []).map((source) => source.path),
      ...(item.unmeasured ?? []).map((source) => source.path),
    ]),
    ...manifest.excludedSources.map((item) => item.path),
  ];
  assert.equal(
    entries.length,
    new Set(entries).size,
    "inventory paths must be unique",
  );
  const git = spawnSync("git", ["ls-files", "--cached"], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(git.status, 0, git.stderr);
  const tracked = new Set(git.stdout.trim().split(/\r?\n/));
  const executable = [...tracked].filter(
    (file) =>
      /\.(?:cjs|mjs|js|cs|ts|astro|ps1|sh)$/.test(file) ||
      /^(?:\.github\/workflows|\.squad\/templates\/workflows)\/.*\.ya?ml$/.test(
        file,
      ),
  );
  assert.deepEqual(
    executable.filter((file) => !entries.includes(file)),
    [],
  );
  assert.deepEqual(
    entries.filter((file) => !tracked.has(file)),
    [],
  );

  assert.ok(
    manifest.excludedSources.some(
      (item) =>
        item.path === "scripts/mbr/tests/MbrIntegrationTests.cs" &&
        item.reason.trim(),
    ),
  );
});

test("CoverageGate_RepositoryMonitorMetadataUsesGuardedClassification", async () => {
  const manifest = JSON.parse(
    await readFile(new URL("./inventory.json", import.meta.url), "utf8"),
  );
  const monitor = manifest.components.find((item) => item.id === "monitor");
  assert.equal(monitor.validatedMetadata.length, 1);
  assert.equal(monitor.validatedMetadata[0].path, metadataPath);
  assert.equal(monitor.validatedMetadata[0].kind, metadataEntry.kind);
  assert.ok(monitor.validatedMetadata[0].reason.trim());
  assert.ok(
    !(monitor.unmeasured ?? []).some((item) => item.path === metadataPath),
  );
  assert.ok(
    !manifest.excludedSources.some((item) => item.path === metadataPath),
  );
  const metadata = await readFile(
    new URL("../monitor/InternalsVisibleTo.cs", import.meta.url),
    "utf8",
  );
  const result = evaluateCoverage(
    metadataFixture(monitor.validatedMetadata),
    monitorReports(),
    repositoryRoot,
    new Map([[metadataPath, metadata]]),
  );
  assert.equal(result.passed, true);
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

  const directory = await mkdtemp(
    path.join(repositoryRoot, ".coverage-gate-cli-"),
  );
  const summaryPath = path.join(directory, "summary.json");
  try {
    const result = spawnSync(
      process.execPath,
      [gatePath, directory, summaryPath],
      { encoding: "utf8", cwd: directory },
    );
    assert.equal(result.status, 1);
    assert.match(result.stdout, /Component \| Lines \| Branches \| Result/);
    assert.match(result.stderr, /missing report/);
    const summary = JSON.parse(await readFile(summaryPath, "utf8"));
    assert.equal(summary.passed, false);
    assert.ok(summary.components.every((item) => !item.passed));
    assert.equal(
      summary.components.find((item) => item.id === "monitor")
        .validatedMetadata[0].path,
      metadataPath,
    );
    assert.ok(!summary.errors.some((item) => item.includes(metadataPath)));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
