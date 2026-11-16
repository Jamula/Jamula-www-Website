"use strict";

const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");

const templatePath = path.resolve(
  __dirname,
  "../../.squad/templates/scripts/notes/fetch.ps1",
);
const inventoryPath = path.resolve(__dirname, "inventory.json");
const fetchSourcePath = ".squad/templates/scripts/notes/fetch.ps1";

function assertFetchRemainsUnmeasured(inventory) {
  const component = inventory.components.find(
    (candidate) => candidate.id === "squad-maintenance-templates",
  );
  assert.ok(component, "Squad maintenance coverage component must exist");
  assert.ok(
    !component.sources.includes(fetchSourcePath),
    `${fetchSourcePath} must remain unmeasured`,
  );
  assert.equal(
    component.unmeasured.filter((entry) => entry.path === fetchSourcePath)
      .length,
    1,
    `${fetchSourcePath} must have exactly one unmeasured blocker`,
  );
}

test("notes-fetch stays unmeasured until valid line and branch attribution exists", () => {
  const inventory = JSON.parse(fs.readFileSync(inventoryPath, "utf8"));
  assertFetchRemainsUnmeasured(inventory);
});

test("rejects a mutation that marks notes-fetch as measured", () => {
  const inventory = JSON.parse(fs.readFileSync(inventoryPath, "utf8"));
  const component = inventory.components.find(
    (candidate) => candidate.id === "squad-maintenance-templates",
  );
  assert.ok(component, "Squad maintenance coverage component must exist");
  component.sources.push(fetchSourcePath);
  component.unmeasured = component.unmeasured.filter(
    (entry) => entry.path !== fetchSourcePath,
  );

  assert.throws(
    () => assertFetchRemainsUnmeasured(inventory),
    /must remain unmeasured/,
  );
});

function runFetch({
  scenario = {},
  remote = "origin",
  setup = false,
  merge = false,
  staleMerge = false,
} = {}) {
  const fixtureRoot = fs.mkdtempSync(
    path.join(__dirname, ".notes-fetch-"),
  );
  const repoPath = path.join(fixtureRoot, "repo");
  fs.mkdirSync(path.join(repoPath, ".git"), { recursive: true });

  if (staleMerge) {
    fs.writeFileSync(
      path.join(repoPath, ".git", "NOTES_MERGE_PARTIAL"),
      "fixture",
    );
  }

  const fixturePath = path.join(fixtureRoot, "scenario.json");
  const callLogPath = path.join(fixtureRoot, "git-calls.jsonl");
  const harnessPath = path.join(fixtureRoot, "harness.ps1");
  fs.writeFileSync(fixturePath, JSON.stringify(scenario));
  fs.writeFileSync(
    harnessPath,
    String.raw`param(
  [string]$TemplatePath,
  [string]$RepoPath,
  [string]$FixturePath,
  [string]$CallLogPath,
  [string]$Remote,
  [switch]$Setup,
  [switch]$Merge
)

$ErrorActionPreference = "Stop"
$scenario = Get-Content -LiteralPath $FixturePath -Raw | ConvertFrom-Json

function git {
  $gitArgs = [string[]]$args
  $callJson = ConvertTo-Json -InputObject $gitArgs -Compress
  [System.IO.File]::AppendAllText($CallLogPath, $callJson + [Environment]::NewLine)
  $global:LASTEXITCODE = 0

  if ($gitArgs[2] -eq "config" -and $gitArgs[3] -eq "--get-all") {
    foreach ($value in @($scenario.fetchConfig)) {
      if ($null -ne $value) { Write-Output ([string]$value) }
    }
    return
  }

  if ($gitArgs[2] -eq "config" -and $gitArgs[3] -eq "--add") { return }

  if ($gitArgs[2] -eq "fetch") {
    if ($scenario.fetchFails) {
      $global:LASTEXITCODE = 1
      Write-Output "fixture fetch denied"
    }
    return
  }

  if ($gitArgs[2] -eq "notes" -and $gitArgs -contains "--abort") { return }

  if ($gitArgs[2] -eq "for-each-ref") {
    if ($gitArgs[3] -eq "refs/notes/squad/") {
      foreach ($ref in @($scenario.namespaces)) {
        if ($null -ne $ref) { Write-Output ([string]$ref) }
      }
    } elseif (@($scenario.remoteRefs) -contains $gitArgs[3]) {
      Write-Output $gitArgs[3]
    }
    return
  }

  if ($gitArgs[2] -eq "notes" -and $gitArgs -contains "merge") {
    if (@($scenario.failedNamespaces) -contains $gitArgs[3].Substring(6)) {
      $global:LASTEXITCODE = 1
      Write-Output "fixture merge denied"
    }
    return
  }

  if ($gitArgs[2] -eq "notes" -and $gitArgs -contains "list") {
    Write-Output "fixture note"
    return
  }

  throw "Unexpected fake git invocation: $($gitArgs -join ' ')"
}

$scriptParameters = @{ RepoPath = $RepoPath; Remote = $Remote }
if ($Setup) { $scriptParameters.Setup = $true }
if ($Merge) { $scriptParameters.Merge = $true }
. $TemplatePath @scriptParameters
`,
  );

  const args = [
    "-NoLogo",
    "-NoProfile",
    "-NonInteractive",
    "-File",
    harnessPath,
    "-TemplatePath",
    templatePath,
    "-RepoPath",
    repoPath,
    "-FixturePath",
    fixturePath,
    "-CallLogPath",
    callLogPath,
    "-Remote",
    remote,
  ];
  if (setup) args.push("-Setup");
  if (merge) args.push("-Merge");

  const result = spawnSync("pwsh", args, { encoding: "utf8", windowsHide: true });
  const calls = fs.existsSync(callLogPath)
    ? fs
        .readFileSync(callLogPath, "utf8")
        .trim()
        .split(/\r?\n/)
        .filter(Boolean)
        .map((line) => JSON.parse(line))
    : [];

  return {
    calls,
    repoPath,
    result,
    cleanup: () => fs.rmSync(fixtureRoot, { recursive: true, force: true }),
  };
}

function assertSuccessfulRun(run) {
  assert.equal(run.result.status, 0, run.result.stderr);
}

test("fetch uses the requested repository and remote on success", () => {
  const run = runFetch({ remote: "upstream" });
  try {
    assertSuccessfulRun(run);
    assert.deepEqual(run.calls[0], [
      "-C",
      run.repoPath,
      "fetch",
      "upstream",
      "refs/notes/*:refs/notes/*",
    ]);
    assert.match(run.result.stdout, /Notes fetched\./);
    assert.doesNotMatch(run.result.stdout, /Fetch warning:/);
  } finally {
    run.cleanup();
  }
});

test("setup adds the notes refspec when it is missing", () => {
  const run = runFetch({ remote: "upstream", setup: true });
  try {
    assertSuccessfulRun(run);
    assert.deepEqual(run.calls[0], [
      "-C",
      run.repoPath,
      "config",
      "--get-all",
      "remote.upstream.fetch",
    ]);
    assert.deepEqual(run.calls[1], [
      "-C",
      run.repoPath,
      "config",
      "--add",
      "remote.upstream.fetch",
      "refs/notes/*:refs/notes/*",
    ]);
    assert.match(run.result.stdout, /Added notes refspec/);
  } finally {
    run.cleanup();
  }
});

test("setup does not duplicate an existing notes refspec", () => {
  const run = runFetch({
    remote: "upstream",
    setup: true,
    scenario: { fetchConfig: ["+refs/notes/*:refs/notes/*"] },
  });
  try {
    assertSuccessfulRun(run);
    assert.deepEqual(run.calls[0], [
      "-C",
      run.repoPath,
      "config",
      "--get-all",
      "remote.upstream.fetch",
    ]);
    assert.equal(
      run.calls.some((call) => call[2] === "config" && call[3] === "--add"),
      false,
    );
    assert.match(run.result.stdout, /Notes refspec already configured\./);
  } finally {
    run.cleanup();
  }
});

test("fetch failure is reported as a warning without claiming success", () => {
  const run = runFetch({ scenario: { fetchFails: true } });
  try {
    assertSuccessfulRun(run);
    assert.match(run.result.stdout, /Fetch warning: fixture fetch denied/);
    assert.doesNotMatch(run.result.stdout, /Notes fetched\./);
  } finally {
    run.cleanup();
  }
});

test("merge aborts stale and failed merges, skips missing refs, and continues", () => {
  const run = runFetch({
    remote: "upstream",
    merge: true,
    staleMerge: true,
    scenario: {
      namespaces: [
        "refs/notes/squad/alpha",
        "refs/notes/squad/beta",
        "refs/notes/squad/gamma",
      ],
      remoteRefs: [
        "refs/notes/remotes/upstream/squad/alpha",
        "refs/notes/remotes/upstream/squad/gamma",
      ],
      failedNamespaces: ["squad/alpha"],
    },
  });
  try {
    assertSuccessfulRun(run);
    const mergeCalls = run.calls.filter(
      (call) =>
        call[2] === "notes" &&
        call.includes("merge") &&
        !call.includes("--abort"),
    );
    assert.deepEqual(
      mergeCalls.map((call) => call[3]),
      ["--ref=squad/alpha", "--ref=squad/gamma"],
    );
    assert.equal(
      run.calls.filter((call) => call.includes("--abort")).length,
      2,
    );
    assert.match(run.result.stdout, /Merge failed on squad\/alpha/);
    assert.doesNotMatch(run.result.stdout, /Merging notes: squad\/beta/);
    assert.match(run.result.stdout, /Merging notes: squad\/gamma/);
    assert.match(run.result.stdout, /Notes merge complete\./);
  } finally {
    run.cleanup();
  }
});
