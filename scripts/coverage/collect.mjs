import { spawnSync } from "node:child_process";
import { copyFile, mkdir, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../../", import.meta.url));
const c8Bin = path.join(
  repositoryRoot,
  "www",
  "node_modules",
  "c8",
  "bin",
  "c8.js",
);

function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repositoryRoot,
    stdio: "inherit",
    encoding: "utf8",
    ...options,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(
      `Command failed (${result.status}): ${command} ${args.join(" ")}`,
    );
  }
  return result;
}

function runCaptured(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repositoryRoot,
    encoding: "utf8",
    ...options,
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(
      `Command failed (${result.status}): ${command} ${args.join(" ")}`,
    );
  }
  return result;
}

async function listFilesMatching(dir, suffix) {
  const entries = await readdir(dir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(suffix))
    .map((entry) =>
      path
        .relative(repositoryRoot, path.join(dir, entry.name))
        .replaceAll("\\", "/"),
    )
    .sort();
}

async function ensureBuiltSite() {
  try {
    const indexStat = await stat(
      path.join(repositoryRoot, "www", "dist", "index.html"),
    );
    if (indexStat.isFile()) return;
  } catch {
    // Build fresh static output when dist/index.html is absent.
  }
  const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
  runCommand(npmCmd, ["--prefix", "www", "run", "build"], {
    env: {
      ...process.env,
      PUBLIC_RELEASE_VERSION: process.env.PUBLIC_RELEASE_VERSION ?? "0.1.0",
    },
    shell: process.platform === "win32",
  });
}

async function runValidationSuitesOnly() {
  runCommand("dotnet", [
    "run",
    "--project",
    "scripts/validation.tests/JamulaValidation.Tests.csproj",
    "--configuration",
    "Release",
  ]);
  runCommand("dotnet", [
    "run",
    "--project",
    "scripts/validation.cli.tests/JamulaValidation.Cli.Tests.csproj",
    "--configuration",
    "Release",
  ]);
}

async function collectAll(reportsDir) {
  await rm(reportsDir, { recursive: true, force: true });
  for (const subdir of [
    "website",
    "astro-config",
    "website-scripts",
    "automation",
    "mbr-ui",
    "coverage-gate",
  ]) {
    await mkdir(path.join(reportsDir, subdir), { recursive: true });
  }

  await ensureBuiltSite();

  const wwwTests = await listFilesMatching(
    path.join(repositoryRoot, "www", "tests"),
    ".test.mjs",
  );
  runCommand(process.execPath, [
    c8Bin,
    "--reporter=cobertura",
    `--reports-dir=${path.join(reportsDir, "website")}`,
    "--include=www/public/analytics-consent.js",
    "--exclude=www/tests/*.test.mjs",
    process.execPath,
    "--test",
    ...wwwTests,
  ]);

  const astroCollector = runCaptured(process.execPath, [
    path.join(
      repositoryRoot,
      "www",
      "scripts",
      "collect-astro-config-coverage.mjs",
    ),
  ]);
  const reportLines = astroCollector.stdout
    .split(/\r?\n/)
    .filter((line) => line.startsWith("Coverage reports: "));
  if (reportLines.length !== 1) {
    throw new Error(
      "Astro config coverage collector did not identify exactly one report directory.",
    );
  }
  const configReportDir = reportLines[0]
    .slice("Coverage reports: ".length)
    .trim();
  await copyFile(
    path.join(configReportDir, "cobertura-coverage.xml"),
    path.join(reportsDir, "astro-config", "cobertura-coverage.xml"),
  );
  await rm(configReportDir, { recursive: true, force: true });

  runCommand(process.execPath, [
    c8Bin,
    "--all",
    "--reporter=cobertura",
    `--reports-dir=${path.join(reportsDir, "website-scripts")}`,
    "--include=www/scripts/measure-local-performance.mjs",
    "--include=www/scripts/verify-wcag-cls.mjs",
    "--exclude=www/tests/**",
    process.execPath,
    "--test",
    "www/tests/measure-local-performance.test.mjs",
    "www/tests/verify-wcag-cls.test.mjs",
  ]);

  const automationTests = await listFilesMatching(
    path.join(repositoryRoot, ".github", "scripts"),
    ".test.mjs",
  );
  runCommand(process.execPath, [
    c8Bin,
    "--reporter=cobertura",
    `--reports-dir=${path.join(reportsDir, "automation")}`,
    "--include=.github/scripts/*.mjs",
    "--exclude=.github/scripts/*.test.mjs",
    process.execPath,
    "--test",
    ...automationTests,
  ]);

  runCommand(process.execPath, [
    c8Bin,
    "--reporter=cobertura",
    `--reports-dir=${path.join(reportsDir, "mbr-ui")}`,
    "--include=scripts/mbr/wwwroot/dashboard.js",
    "--exclude=scripts/mbr/tests/*.mjs",
    process.execPath,
    "--test",
    "scripts/mbr/tests/ui.test.mjs",
  ]);

  runCommand(process.execPath, [
    c8Bin,
    "--reporter=cobertura",
    `--reports-dir=${path.join(reportsDir, "coverage-gate")}`,
    "--include=scripts/coverage/gate.mjs",
    "--exclude=scripts/coverage/gate.test.mjs",
    process.execPath,
    "--test",
    "scripts/coverage/gate.test.mjs",
  ]);

  const dotnetCoverage = process.env.DOTNET_COVERAGE_BIN || "dotnet-coverage";

  runCommand(dotnetCoverage, [
    "collect",
    "--output",
    path.join(reportsDir, "monitor.cobertura.xml"),
    "--output-format",
    "cobertura",
    "dotnet",
    "run",
    "--project",
    "scripts/monitor/tests/JamulaMonitor.Tests.csproj",
    "--configuration",
    "Release",
  ]);

  runCommand(dotnetCoverage, [
    "collect",
    "--output",
    path.join(reportsDir, "mbr-dotnet.cobertura.xml"),
    "--output-format",
    "cobertura",
    "dotnet",
    "run",
    "--project",
    "scripts/mbr/tests/JamulaMbr.Tests.csproj",
    "--configuration",
    "Release",
  ]);

  runCommand(dotnetCoverage, [
    "collect",
    "--output",
    path.join(reportsDir, "validation.cobertura.xml"),
    "--output-format",
    "cobertura",
    process.execPath,
    fileURLToPath(import.meta.url),
    "--run-validation-suites",
  ]);

  runCommand(dotnetCoverage, [
    "collect",
    "--output",
    path.join(reportsDir, "mcp.cobertura.xml"),
    "--output-format",
    "cobertura",
    "dotnet",
    "run",
    "--project",
    "scripts/mcp/tests/JamulaMcp.Tests.csproj",
    "--configuration",
    "Release",
  ]);

  runCommand(dotnetCoverage, [
    "collect",
    "--output",
    path.join(reportsDir, "accelerator-authorization.cobertura.xml"),
    "--output-format",
    "cobertura",
    "dotnet",
    "run",
    "--project",
    "accelerator/Authorization.Tests/JamulaAccelerator.Authorization.Tests.csproj",
    "--configuration",
    "Release",
  ]);

  runCommand(dotnetCoverage, [
    "collect",
    "--output",
    path.join(reportsDir, "accelerator-telemetry.cobertura.xml"),
    "--output-format",
    "cobertura",
    "dotnet",
    "run",
    "--project",
    "accelerator/Telemetry.Tests/JamulaAccelerator.Telemetry.Tests.csproj",
    "--configuration",
    "Release",
  ]);
}

const args = process.argv.slice(2);
if (args.length === 1 && args[0] === "--run-validation-suites") {
  await runValidationSuitesOnly();
} else if (args.length === 1 && !args[0].startsWith("-")) {
  await collectAll(path.resolve(args[0]));
} else {
  console.error("Usage: node scripts/coverage/collect.mjs <reports-directory>");
  process.exitCode = 1;
}
