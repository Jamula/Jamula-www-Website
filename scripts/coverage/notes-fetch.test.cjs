"use strict";

const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
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
  sourcePath = templatePath,
  breakpoints = [],
  traceSource = false,
  redirectDebug = false,
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
  const breakpointPath = path.join(fixtureRoot, "breakpoints.json");
  const harnessPath = path.join(fixtureRoot, "harness.ps1");
  fs.writeFileSync(fixturePath, JSON.stringify(scenario));
  fs.writeFileSync(
    harnessPath,
    String.raw`param(
  [string]$TemplatePath,
  [string]$RepoPath,
  [string]$FixturePath,
  [string]$CallLogPath,
  [string]$BreakpointPath,
  [string]$BreakpointSpecs,
  [string]$Remote,
  [switch]$Setup,
  [switch]$Merge,
  [switch]$TraceSource,
  [switch]$RedirectDebug
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
$installedBreakpoints = @(
  foreach ($spec in @(ConvertFrom-Json -InputObject $BreakpointSpecs)) {
    Set-PSBreakpoint -Script $TemplatePath -Line $spec.line -Column $spec.column -Action {}
  }
)
if ($TraceSource) { Set-PSDebug -Trace 1 }
try {
  if ($RedirectDebug) {
    . $TemplatePath @scriptParameters 5>$null
  } else {
    . $TemplatePath @scriptParameters
  }
} finally {
  if ($TraceSource) { Set-PSDebug -Trace 0 }
}
$hits = @($installedBreakpoints | ForEach-Object {
  @{ line = $_.Line; column = $_.Column; hitCount = $_.HitCount }
})
[System.IO.File]::WriteAllText($BreakpointPath, (ConvertTo-Json -InputObject $hits -Compress))
`,
  );

  const args = [
    "-NoLogo",
    "-NoProfile",
    "-NonInteractive",
    "-File",
    harnessPath,
    "-TemplatePath",
    sourcePath,
    "-RepoPath",
    repoPath,
    "-FixturePath",
    fixturePath,
    "-CallLogPath",
    callLogPath,
    "-BreakpointPath",
    breakpointPath,
    "-BreakpointSpecs",
    JSON.stringify(breakpoints),
    "-Remote",
    remote,
  ];
  if (setup) args.push("-Setup");
  if (merge) args.push("-Merge");
  if (traceSource) args.push("-TraceSource");
  if (redirectDebug) args.push("-RedirectDebug");

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
    breakpointHits: fs.existsSync(breakpointPath)
      ? JSON.parse(fs.readFileSync(breakpointPath, "utf8"))
      : null,
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

test("a pipeline-output condition probe changes the missing-refspec behavior", () => {
  const fixtureRoot = fs.mkdtempSync(
    path.join(__dirname, ".notes-fetch-probe-"),
  );
  let baseline;
  let probed;
  try {
    const probePath = path.join(fixtureRoot, "fetch.ps1");
    const original = fs.readFileSync(templatePath, "utf8");
    const condition = "if ($existing) {";
    assert.equal(original.split(condition).length, 2);
    fs.writeFileSync(
      probePath,
      original.replace(
        condition,
        'if ($(Write-Output "__coverage_hit__"; $existing)) {',
      ),
    );
    baseline = runFetch({ setup: true });
    probed = runFetch({ setup: true, sourcePath: probePath });
    assertSuccessfulRun(baseline);
    assertSuccessfulRun(probed);
    const addsRefspec = (run) =>
      run.calls.some((call) => call[2] === "config" && call[3] === "--add");
    assert.equal(addsRefspec(baseline), true);
    assert.equal(addsRefspec(probed), false);
    assert.match(probed.result.stdout, /Notes refspec already configured\./);
  } finally {
    if (baseline) baseline.cleanup();
    if (probed) probed.cleanup();
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  }
});

test("condition breakpoint hits alone do not identify the setup outcome", () => {
  const runs = [];
  try {
    const lines = fs.readFileSync(templatePath, "utf8").split(/\r?\n/);
    const conditionLines = lines
      .map((text, index) => ({ text, index }))
      .filter(({ text }) => /^\s*if \(\$existing\) \{$/.test(text));
    assert.equal(conditionLines.length, 1);
    const condition = conditionLines[0];
    const cases = [{}, { fetchConfig: ["+refs/notes/*:refs/notes/*"] }];
    for (const scenario of cases) {
      const baseline = runFetch({ setup: true, scenario });
      runs.push(baseline);
      const observed = runFetch({
        setup: true,
        scenario,
        breakpoints: [
          {
            line: condition.index + 1,
            column: condition.text.indexOf("$existing") + 1,
          },
        ],
      });
      runs.push(observed);
      assertSuccessfulRun(baseline);
      assertSuccessfulRun(observed);
      assert.equal(observed.result.stdout, baseline.result.stdout);
      assert.equal(observed.result.stderr, baseline.result.stderr);
      const withoutRepoPath = (run) =>
        run.calls.map((call) =>
          call.map((arg) => (arg === run.repoPath ? "<repo>" : arg)),
        );
      assert.deepEqual(withoutRepoPath(observed), withoutRepoPath(baseline));
    }
    assert.deepEqual(runs[1].breakpointHits, runs[3].breakpointHits);
    assert.equal(runs[1].breakpointHits[0].hitCount, 1);
    assert.match(runs[1].result.stdout, /Added notes refspec/);
    assert.match(runs[3].result.stdout, /Notes refspec already configured/);
  } finally {
    for (const run of runs) run.cleanup();
  }
});

test("a column breakpoint may fire on a short-circuited operand", () => {
  const fixtureRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "jamula-breakpoint-short-circuit-"),
  );
  try {
    const sourcePath = path.join(fixtureRoot, "short-circuit.ps1");
    const harnessPath = path.join(fixtureRoot, "harness.ps1");
    fs.writeFileSync(
      sourcePath,
      'param([bool]$Left)\nif ($Left -and (Test-Path "fixture")) { "true" } else { "false" }\n',
    );
    fs.writeFileSync(
      harnessPath,
      String.raw`param([string]$SourcePath)
$ErrorActionPreference = "Stop"
function Test-Path {
  $global:fakeCalls++
  return $false
}
$results = @(
  foreach ($left in @($false, $true)) {
    foreach ($instrumented in @($false, $true)) {
      $global:fakeCalls = 0
      $breakpoint = $null
      try {
        if ($instrumented) {
          $breakpoint = Set-PSBreakpoint -Script $SourcePath -Line 2 -Column 17 -Action {}
        }
        $output = & $SourcePath -Left $left
        [pscustomobject]@{
          left = $left
          instrumented = $instrumented
          output = $output
          operandCalls = $global:fakeCalls
          breakpointHits = if ($instrumented) { $breakpoint.HitCount } else { $null }
        }
      } finally {
        if ($null -ne $breakpoint) { Remove-PSBreakpoint -Breakpoint $breakpoint }
      }
    }
  }
)
ConvertTo-Json -InputObject $results -Compress
`,
    );
    const result = spawnSync(
      "pwsh",
      [
        "-NoLogo",
        "-NoProfile",
        "-NonInteractive",
        "-File",
        harnessPath,
        "-SourcePath",
        sourcePath,
      ],
      { encoding: "utf8", windowsHide: true },
    );
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(result.stdout), [
      {
        left: false, instrumented: false, output: "false",
        operandCalls: 0, breakpointHits: null,
      },
      {
        left: false, instrumented: true, output: "false",
        operandCalls: 0, breakpointHits: 1,
      },
      {
        left: true, instrumented: false, output: "false",
        operandCalls: 1, breakpointHits: null,
      },
      {
        left: true, instrumented: true, output: "false",
        operandCalls: 1, breakpointHits: 1,
      },
    ]);
  } finally {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  }
});

test("built-in source tracing changes output even with debug-stream redirection", () => {
  const runs = [];
  try {
    for (const options of [
      {},
      { traceSource: true },
      { traceSource: true, redirectDebug: true },
    ]) {
      const run = runFetch({ setup: true, ...options });
      runs.push(run);
      assertSuccessfulRun(run);
    }

    const callsWithoutRepoPath = (run) =>
      run.calls.map((call) =>
        call.map((arg) => (arg === run.repoPath ? "<repo>" : arg)),
      );
    for (const traced of runs.slice(1)) {
      assert.deepEqual(callsWithoutRepoPath(traced), callsWithoutRepoPath(runs[0]));
      assert.equal(traced.result.stderr, runs[0].result.stderr);
      assert.notEqual(traced.result.stdout, runs[0].result.stdout);
      assert.match(traced.result.stdout, /DEBUG:.*Resolve-Path/);
      assert.match(traced.result.stdout, /Added notes refspec/);
    }
  } finally {
    for (const run of runs) run.cleanup();
  }
});

test("source trace does not identify a short-circuited variable operand", () => {
  const fixtureRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "jamula-trace-short-circuit-"),
  );
  try {
    const sourcePath = path.join(fixtureRoot, "short-circuit.ps1");
    const harnessPath = path.join(fixtureRoot, "harness.ps1");
    fs.writeFileSync(
      sourcePath,
      'param([bool]$Left)\n$right = $false\nif ($Left -and $right) { "true" } else { "false" }\n',
    );
    fs.writeFileSync(
      harnessPath,
      String.raw`param([string]$SourcePath, [string]$LeftValue)
Set-PSDebug -Trace 1
try {
  & $SourcePath -Left ([bool]::Parse($LeftValue)) 5>$null
} finally {
  Set-PSDebug -Trace 0
}
`,
    );
    const traces = [];
    for (const left of ["false", "true"]) {
      const result = spawnSync(
        "pwsh",
        [
          "-NoLogo", "-NoProfile", "-NonInteractive", "-File", harnessPath,
          "-SourcePath", sourcePath, "-LeftValue", left,
        ],
        { encoding: "utf8", windowsHide: true },
      );
      assert.equal(result.status, 0, result.stderr);
      assert.match(result.stdout, /(?:^|\r?\n)false(?:\r?\n|$)/);
      const conditionTrace = result.stdout
        .split(/\r?\n/)
        .filter((line) => /DEBUG:.*if \(\$Left -and \$right\)/.test(line));
      assert.equal(conditionTrace.length, 1);
      traces.push(conditionTrace[0]);
    }
    assert.deepEqual(traces[0], traces[1]);
  } finally {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
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
