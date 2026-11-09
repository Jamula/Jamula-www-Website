import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const inventoryPath = fileURLToPath(
  new URL("./inventory.json", import.meta.url),
);
const COUNT_KEYS = [
  "linesCovered",
  "linesValid",
  "branchesCovered",
  "branchesValid",
];

function decodeXml(value) {
  return value
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
}

function parseAttributes(source) {
  const attributes = {};
  const expression =
    /([A-Za-z_:][A-Za-z0-9_:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  for (const match of source.matchAll(expression)) {
    attributes[match[1]] = decodeXml(match[2] ?? match[3] ?? "");
  }
  return attributes;
}

function parseCobertura(xml, reportPath) {
  if (!/<coverage(?:\s|>)/.test(xml)) {
    throw new Error(`${reportPath}: missing Cobertura coverage root.`);
  }

  const classes = [];
  for (const match of xml.matchAll(/<class\b([^>]*)>([\s\S]*?)<\/class\s*>/g)) {
    const attributes = parseAttributes(match[1]);
    if (!attributes.filename) {
      throw new Error(`${reportPath}: class has no filename.`);
    }

    const lines = [];
    const classBody = match[2].replace(/<methods\b[\s\S]*?<\/methods\s*>/g, "");
    for (const lineMatch of classBody.matchAll(/<line\b([^>]*)\/?>/g)) {
      const line = parseAttributes(lineMatch[1]);
      const hits = Number(line.hits);
      if (!Number.isSafeInteger(hits) || hits < 0) {
        throw new Error(`${reportPath}: invalid line hit count.`);
      }

      let branchCovered = 0;
      let branchValid = 0;
      if (line.branch?.toLowerCase() === "true") {
        const coverage = /\((\d+)\/(\d+)\)/.exec(
          line["condition-coverage"] ?? "",
        );
        if (!coverage) {
          throw new Error(
            `${reportPath}: branch line has no condition counts.`,
          );
        }
        branchCovered = Number(coverage[1]);
        branchValid = Number(coverage[2]);
        if (
          !Number.isSafeInteger(branchCovered) ||
          !Number.isSafeInteger(branchValid) ||
          branchCovered < 0 ||
          branchValid <= 0 ||
          branchCovered > branchValid
        ) {
          throw new Error(`${reportPath}: invalid branch condition counts.`);
        }
      }
      lines.push({ covered: hits > 0, branchCovered, branchValid });
    }
    if (lines.length === 0) {
      throw new Error(`${reportPath}: class has no executable line entries.`);
    }
    classes.push({ filename: attributes.filename, lines });
  }
  if (classes.length === 0) {
    throw new Error(`${reportPath}: no Cobertura class measurements.`);
  }
  return classes;
}

function normalizeSource(value) {
  return value
    .replace(/^file:\/+/i, "")
    .replaceAll("\\", "/")
    .replace(/^[A-Za-z]:/, "")
    .replace(/^\/+/, "")
    .replace(/\/+/g, "/");
}

function matchesPath(reportPath, expectedPath) {
  const report = normalizeSource(reportPath);
  const expected = normalizeSource(expectedPath);
  return report === expected || report.endsWith(`/${expected}`);
}

function emptyCounts() {
  return {
    linesCovered: 0,
    linesValid: 0,
    branchesCovered: 0,
    branchesValid: 0,
  };
}

function addClass(counts, measuredClass) {
  for (const line of measuredClass.lines) {
    counts.linesValid++;
    if (line.covered) counts.linesCovered++;
    counts.branchesCovered += line.branchCovered;
    counts.branchesValid += line.branchValid;
  }
}

function percentage(covered, valid) {
  return valid > 0 ? Number(((covered / valid) * 100).toFixed(2)) : null;
}

function summarize(counts, thresholdPercent) {
  const linePercent = percentage(counts.linesCovered, counts.linesValid);
  const branchPercent = percentage(
    counts.branchesCovered,
    counts.branchesValid,
  );
  return {
    ...counts,
    linePercent,
    branchPercent,
    passed:
      linePercent !== null &&
      branchPercent !== null &&
      linePercent >= thresholdPercent &&
      branchPercent >= thresholdPercent,
  };
}

export function evaluateCoverage(inventory, reports) {
  const errors = [];
  if (
    inventory?.schemaVersion !== 1 ||
    !Number.isFinite(inventory.thresholdPercent) ||
    inventory.thresholdPercent <= 0 ||
    !Array.isArray(inventory.components) ||
    !Array.isArray(inventory.excludedSources)
  ) {
    throw new Error("Coverage inventory has an unsupported or invalid schema.");
  }

  const seenComponents = new Set();
  const seenSources = new Set();
  const exclusions = inventory.excludedSources;
  const aggregateCounts = emptyCounts();
  const components = [];

  for (const component of inventory.components) {
    if (
      !component?.id ||
      seenComponents.has(component.id) ||
      !Array.isArray(component.sources) ||
      !Array.isArray(component.reports) ||
      !Array.isArray(component.unmeasured ?? [])
    ) {
      throw new Error("Coverage inventory contains an invalid component.");
    }
    seenComponents.add(component.id);

    const componentCounts = emptyCounts();
    const componentErrors = [];
    const measuredSources = [];
    const loadedReports = [];
    for (const reportPath of component.reports) {
      const xml = reports.get(reportPath);
      if (typeof xml !== "string" || xml.trim().length === 0) {
        componentErrors.push(`missing report: ${reportPath}`);
        continue;
      }
      try {
        loadedReports.push({
          path: reportPath,
          classes: parseCobertura(xml, reportPath),
        });
      } catch (error) {
        componentErrors.push(error.message);
      }
    }

    for (const source of component.sources) {
      if (seenSources.has(source)) {
        componentErrors.push(`source is assigned more than once: ${source}`);
        continue;
      }
      seenSources.add(source);

      const matches = [];
      for (const report of loadedReports) {
        const classes = report.classes.filter((item) =>
          matchesPath(item.filename, source),
        );
        if (classes.length > 0) matches.push({ report, classes });
      }
      if (matches.length === 0) {
        componentErrors.push(`missing source measurement: ${source}`);
        continue;
      }
      if (matches.length > 1) {
        componentErrors.push(`duplicate source measurement: ${source}`);
        continue;
      }

      const sourceCounts = emptyCounts();
      for (const measuredClass of matches[0].classes) {
        addClass(sourceCounts, measuredClass);
      }
      Object.assign(sourceCounts, {
        path: source,
        linePercent: percentage(
          sourceCounts.linesCovered,
          sourceCounts.linesValid,
        ),
        branchPercent: percentage(
          sourceCounts.branchesCovered,
          sourceCounts.branchesValid,
        ),
      });
      for (const key of COUNT_KEYS) {
        componentCounts[key] += sourceCounts[key];
      }
      measuredSources.push(sourceCounts);
    }

    for (const report of loadedReports) {
      for (const measuredClass of report.classes) {
        const source = component.sources.find((item) =>
          matchesPath(measuredClass.filename, item),
        );
        if (source) continue;
        const excluded = exclusions.find((item) =>
          matchesPath(measuredClass.filename, item.path),
        );
        if (!excluded) {
          componentErrors.push(
            `unclassified report source: ${measuredClass.filename}`,
          );
        }
      }
    }

    const unmeasured = component.unmeasured ?? [];
    for (const source of unmeasured) {
      componentErrors.push(
        `unmeasured source: ${source.path} (${source.reason})`,
      );
    }

    const summary = summarize(componentCounts, inventory.thresholdPercent);
    if (!summary.passed) {
      componentErrors.push(
        `component requires >=${inventory.thresholdPercent}% line and branch coverage.`,
      );
    }
    errors.push(
      ...componentErrors.map((message) => `${component.id}: ${message}`),
    );
    for (const key of COUNT_KEYS) {
      aggregateCounts[key] += componentCounts[key];
    }
    components.push({
      id: component.id,
      ...summary,
      sources: measuredSources,
      unmeasured,
      errors: componentErrors,
    });
  }

  const aggregate = summarize(aggregateCounts, inventory.thresholdPercent);
  if (!aggregate.passed) {
    errors.push(
      `aggregate requires >=${inventory.thresholdPercent}% line and branch coverage.`,
    );
  }
  return {
    thresholdPercent: inventory.thresholdPercent,
    passed: errors.length === 0,
    components,
    aggregate,
    errors,
  };
}

export function formatReport(report) {
  const lines = ["Component | Lines | Branches | Result"];
  for (const component of report.components) {
    const line =
      component.linePercent === null
        ? "unmeasured"
        : `${component.linePercent.toFixed(2)}%`;
    const branch =
      component.branchPercent === null
        ? "unmeasured"
        : `${component.branchPercent.toFixed(2)}%`;
    lines.push(
      `${component.id} | ${line} (${component.linesCovered}/${component.linesValid}) | ${branch} (${component.branchesCovered}/${component.branchesValid}) | ${component.passed ? "PASS" : "FAIL"}`,
    );
  }
  const aggregate = report.aggregate;
  lines.push(
    `aggregate (measured sources only) | ${aggregate.linePercent ?? "unmeasured"}% (${aggregate.linesCovered}/${aggregate.linesValid}) | ${aggregate.branchPercent ?? "unmeasured"}% (${aggregate.branchesCovered}/${aggregate.branchesValid}) | ${report.passed ? "PASS" : "FAIL"}`,
  );
  return {
    lines,
    errors: report.errors.map((error) => `::error::${error}`),
  };
}

function printReport(report) {
  const output = formatReport(report);
  for (const line of output.lines) console.log(line);
  for (const error of output.errors) console.error(error);
}

async function main(args) {
  if (args.length < 1 || args.length > 2) {
    throw new Error(
      "Usage: node scripts/coverage/gate.mjs <reports-directory> [summary.json]",
    );
  }
  const reportsDirectory = path.resolve(args[0]);
  const inventory = JSON.parse(await readFile(inventoryPath, "utf8"));
  const reportPaths = [
    ...new Set(inventory.components.flatMap((component) => component.reports)),
  ];
  const reports = new Map();
  for (const reportPath of reportPaths) {
    const fullPath = path.resolve(reportsDirectory, reportPath);
    if (!fullPath.startsWith(`${reportsDirectory}${path.sep}`)) {
      throw new Error(`Report path escapes its directory: ${reportPath}`);
    }
    try {
      reports.set(reportPath, await readFile(fullPath, "utf8"));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }

  const report = evaluateCoverage(inventory, reports);
  printReport(report);
  if (args[1]) {
    const outputPath = path.resolve(args[1]);
    await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  }
  if (!report.passed) process.exitCode = 1;
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(`::error::${error.message}`);
    process.exitCode = 1;
  });
}
