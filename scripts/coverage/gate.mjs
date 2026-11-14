import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(
  new URL("../../www/package.json", import.meta.url),
);
const { SaxesParser } = require("saxes");

const inventoryPath = fileURLToPath(
  new URL("./inventory.json", import.meta.url),
);
const repositoryRoot = fileURLToPath(new URL("../../", import.meta.url));
const COUNT_KEYS = [
  "linesCovered",
  "linesValid",
  "branchesCovered",
  "branchesValid",
];
const MONITOR_METADATA_PATH = "scripts/monitor/InternalsVisibleTo.cs";
const MONITOR_METADATA_KIND = "monitor-friend-assembly";
// Deliberately accept only this declaration, not general C# or attribute arguments.
const MONITOR_METADATA_PATTERN =
  /^[ \t\r\n]*using System\.Runtime\.CompilerServices;[ \t\r\n]*\[assembly:[ \t\r\n]*InternalsVisibleTo\("JamulaMonitor\.Tests"\)\][ \t\r\n]*(?![\s\S])/;

function parseCobertura(xml) {
  const classes = [];
  const sources = [];
  const stack = [];
  let currentClass;
  let currentSource;
  const parser = new SaxesParser();
  parser.on("opentag", (tag) => {
    const parent = stack.at(-1);
    if (stack.length === 0 && tag.name !== "coverage") {
      throw new Error("missing Cobertura coverage root.");
    }
    if (tag.name === "source" && parent === "sources") {
      currentSource = "";
    } else if (tag.name === "class") {
      if (currentClass) throw new Error("nested Cobertura classes.");
      if (!tag.attributes.filename) throw new Error("class has no filename.");
      currentClass = { filename: tag.attributes.filename, lines: [] };
    } else if (
      tag.name === "line" &&
      currentClass &&
      parent === "lines" &&
      stack.at(-2) === "class"
    ) {
      const line = tag.attributes;
      const hits = Number(line.hits);
      if (!/^\d+$/.test(line.hits ?? "") || !Number.isSafeInteger(hits)) {
        throw new Error("invalid line hit count.");
      }

      let branchCovered = 0;
      let branchValid = 0;
      if (line.branch?.toLowerCase() === "true") {
        const coverage = /\((\d+)\/(\d+)\)/.exec(
          line["condition-coverage"] ?? "",
        );
        if (!coverage) {
          throw new Error("branch line has no condition counts.");
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
          throw new Error("invalid branch condition counts.");
        }
      }
      currentClass.lines.push({
        covered: hits > 0,
        branchCovered,
        branchValid,
      });
    }
    stack.push(tag.name);
  });
  parser.on("text", (text) => {
    if (currentSource !== undefined) currentSource += text;
  });
  parser.on("closetag", (tag) => {
    if (tag.name === "source" && currentSource !== undefined) {
      if (currentSource.trim()) sources.push(currentSource.trim());
      currentSource = undefined;
    } else if (tag.name === "class") {
      if (currentClass.lines.length === 0) {
        throw new Error("class has no executable line entries.");
      }
      classes.push(currentClass);
      currentClass = undefined;
    }
    stack.pop();
  });
  try {
    parser.write(xml).close();
  } catch (error) {
    throw new Error(`invalid Cobertura XML: ${error.message}`);
  }
  if (classes.length === 0) {
    throw new Error("no Cobertura class measurements.");
  }
  return { classes, sources };
}

function sourcePath(value) {
  if (/^file:/i.test(value)) {
    const url = new URL(value);
    if (url.search || url.hash) throw new Error("file URL has a query or fragment.");
    const pathname = decodeURIComponent(url.pathname);
    value = url.hostname && url.hostname !== "localhost"
      ? `//${url.hostname}${pathname}`
      : pathname.replace(/^\/([A-Za-z]:\/)/, "$1");
  }
  value = value.replaceAll("\\", "/");
  const windows = /^[A-Za-z]:\//.test(value) || value.startsWith("//");
  const api = windows ? path.win32 : path.posix;
  if (!windows && value.includes(":")) {
    throw new Error(`unsupported or drive-relative source path: ${value}`);
  }
  const normalized = api.normalize(value).replaceAll("\\", "/");
  return {
    value: windows ? normalized.toLowerCase() : normalized,
    windows,
    absolute: api.isAbsolute(value),
  };
}

function resolveSource(value, root) {
  const parsed = sourcePath(value);
  if (parsed.absolute && parsed.windows !== root.windows) {
    throw new Error(`source path is on a different filesystem: ${value}`);
  }
  const api = root.windows ? path.win32 : path.posix;
  const resolved = sourcePath(api.resolve(root.value, parsed.value));
  const relative = api.relative(root.value, resolved.value).replaceAll("\\", "/");
  if (relative === ".." || relative.startsWith("../") || api.isAbsolute(relative)) {
    throw new Error(`source path is outside repository root: ${value}`);
  }
  return resolved;
}

function attributeClass(filename, sources, root) {
  const parsed = sourcePath(filename);
  // Absolute class filenames already identify their source; roots only qualify relative filenames.
  const candidates = parsed.absolute || sources.length === 0
    ? [resolveSource(filename, root).value]
    : sources.map((source) => {
      const sourceRoot = resolveSource(source, root);
      const api = root.windows ? path.win32 : path.posix;
      return resolveSource(api.resolve(sourceRoot.value, parsed.value), root).value;
    });
  if (new Set(candidates).size !== 1) {
    throw new Error(`ambiguous source roots for: ${filename}`);
  }
  return candidates[0];
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
      counts.linesCovered * 100 >= counts.linesValid * thresholdPercent &&
      counts.branchesCovered * 100 >= counts.branchesValid * thresholdPercent,
  };
}

export function evaluateCoverage(
  inventory,
  reports,
  rootPath = repositoryRoot,
  sourceContents = new Map(),
) {
  const root = sourcePath(rootPath);
  if (!root.absolute) throw new Error("Repository root must be an absolute path.");
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
  if (!(sourceContents instanceof Map)) {
    throw new Error("Metadata source contents must be a Map.");
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
      !Array.isArray(component.validatedMetadata ?? []) ||
      !Array.isArray(component.unmeasured ?? [])
    ) {
      throw new Error("Coverage inventory contains an invalid component.");
    }
    seenComponents.add(component.id);

    const componentCounts = emptyCounts();
    const componentErrors = [];
    const measuredSources = [];
    const loadedReports = [];
    const validatedMetadata = [];
    if (
      component.id === "monitor" &&
      !(component.validatedMetadata ?? []).some(
        (metadata) => metadata?.path === MONITOR_METADATA_PATH,
      )
    ) {
      componentErrors.push(
        `missing metadata classification: ${MONITOR_METADATA_PATH}`,
      );
    }
    for (const metadata of component.validatedMetadata ?? []) {
      if (
        component.id !== "monitor" ||
        metadata?.path !== MONITOR_METADATA_PATH ||
        metadata.kind !== MONITOR_METADATA_KIND ||
        typeof metadata.reason !== "string" ||
        !metadata.reason.trim()
      ) {
        componentErrors.push("unsupported metadata classification.");
        continue;
      }
      const metadataIdentity = resolveSource(metadata.path, root).value;
      const expectedMetadataIdentity = resolveSource(
        MONITOR_METADATA_PATH,
        root,
      ).value;
      if (
        metadataIdentity !== expectedMetadataIdentity ||
        seenSources.has(metadataIdentity) ||
        inventory.components.some(
          (item) => {
            const assignedSources = Array.isArray(item.sources)
              ? item.sources
              : [];
            const unmeasuredSources = Array.isArray(item.unmeasured)
              ? item.unmeasured
              : [];
            return (
              assignedSources.some(
                (source) =>
                  resolveSource(source, root).value === metadataIdentity,
              ) ||
              unmeasuredSources.some(
                (source) =>
                  resolveSource(source.path, root).value === metadataIdentity,
              )
            );
          },
        ) ||
        exclusions.some(
          (source) =>
            resolveSource(source.path, root).value === metadataIdentity,
        )
      ) {
        componentErrors.push(
          `metadata source is assigned more than once: ${metadata.path}`,
        );
        continue;
      }
      seenSources.add(metadataIdentity);
      const content = sourceContents.get(MONITOR_METADATA_PATH);
      if (
        typeof content !== "string" ||
        !MONITOR_METADATA_PATTERN.test(content)
      ) {
        componentErrors.push(
          `metadata content is missing or unsupported: ${metadata.path}`,
        );
        continue;
      }
      validatedMetadata.push({ ...metadata, validated: true });
    }
    for (const reportPath of component.reports) {
      const xml = reports.get(reportPath);
      if (typeof xml !== "string" || xml.trim().length === 0) {
        componentErrors.push(`missing report: ${reportPath}`);
        continue;
      }
      try {
        const parsed = parseCobertura(xml);
        loadedReports.push({
          path: reportPath,
          classes: parsed.classes.map((item) => ({
            ...item,
            source: attributeClass(item.filename, parsed.sources, root),
          })),
        });
      } catch (error) {
        componentErrors.push(`${reportPath}: ${error.message}`);
      }
    }

    for (const source of component.sources) {
      const resolvedSource = resolveSource(source, root).value;
      if (seenSources.has(resolvedSource)) {
        componentErrors.push(`source is assigned more than once: ${source}`);
        continue;
      }
      seenSources.add(resolvedSource);

      const matches = [];
      for (const report of loadedReports) {
        const classes = report.classes.filter((item) =>
          item.source === resolvedSource,
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
          measuredClass.source === resolveSource(item, root).value,
        );
        if (source) continue;
        const excluded = exclusions.find((item) =>
          measuredClass.source === resolveSource(item.path, root).value,
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
      passed: summary.passed && componentErrors.length === 0,
      sources: measuredSources,
      validatedMetadata,
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
    for (const metadata of component.validatedMetadata ?? []) {
      lines.push(
        `${component.id} | validated non-executable metadata: ${metadata.path} (${metadata.kind}; no coverage counts)`,
      );
    }
  }
  const aggregate = report.aggregate;
  lines.push(
    `aggregate (measured sources only) | ${aggregate.linePercent === null ? "unmeasured" : `${aggregate.linePercent}%`} (${aggregate.linesCovered}/${aggregate.linesValid}) | ${aggregate.branchPercent === null ? "unmeasured" : `${aggregate.branchPercent}%`} (${aggregate.branchesCovered}/${aggregate.branchesValid}) | ${report.passed ? "PASS" : "FAIL"}`,
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

  const sourceContents = new Map();
  if (
    inventory.components.some(
      (component) => component.validatedMetadata?.length,
    )
  ) {
    sourceContents.set(
      MONITOR_METADATA_PATH,
      await readFile(
        new URL("../monitor/InternalsVisibleTo.cs", import.meta.url),
        "utf8",
      ),
    );
  }
  const report = evaluateCoverage(
    inventory,
    reports,
    repositoryRoot,
    sourceContents,
  );
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
