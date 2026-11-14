import { spawnSync } from "node:child_process";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const c8Path = fileURLToPath(new URL("../node_modules/c8/bin/c8.js", import.meta.url));
const reportDirectory = await mkdtemp(path.join(tmpdir(), "jamula-astro-config-coverage-"));
const result = spawnSync(
  process.execPath,
  [
    c8Path,
    "--all",
    "--include=astro.config.ts",
    "--extension=.ts",
    "--reporter=json-summary",
    "--reporter=cobertura",
    "--reports-dir",
    reportDirectory,
    "--check-coverage",
    "--lines=90",
    "--branches=90",
    "--per-file",
    process.execPath,
    "--experimental-strip-types",
    "--test",
    "tests/astro-config.test.mjs",
  ],
  { cwd: projectRoot, stdio: "inherit" }
);

if (result.error) {
  throw result.error;
}
if (result.status !== 0) {
  process.exitCode = result.status ?? 1;
} else {
  const summaryPath = path.join(reportDirectory, "coverage-summary.json");
  const summary = JSON.parse(await readFile(summaryPath, "utf8"));
  const sourcePath = path.resolve(projectRoot, "astro.config.ts");
  const sourceCoverage = summary[sourcePath];
  if (!sourceCoverage || sourceCoverage.lines.total === 0 || sourceCoverage.branches.total === 0) {
    throw new Error(`Coverage report did not measure ${sourcePath}`);
  }
  console.log(
    `astro.config.ts: ${sourceCoverage.lines.covered}/${sourceCoverage.lines.total} lines ` +
      `(${sourceCoverage.lines.pct}%), ${sourceCoverage.branches.covered}/` +
      `${sourceCoverage.branches.total} branches (${sourceCoverage.branches.pct}%).`
  );
  console.log(`Coverage reports: ${reportDirectory}`);
  console.log("Astro component, layout, and page templates are not included in this measurement.");
}
