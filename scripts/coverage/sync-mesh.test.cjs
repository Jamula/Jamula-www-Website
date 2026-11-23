"use strict";

const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { test } = require("node:test");

const repoRoot = path.resolve(__dirname, "../..");
const templatePath = path.join(
  repoRoot,
  ".squad",
  "templates",
  "skills",
  "distributed-mesh",
  "sync-mesh.ps1",
);
const fixturePath = path.join(__dirname, "sync-mesh-fixture.ps1");
const inventoryPath = path.join(__dirname, "inventory.json");
const sourcePath = ".squad/templates/skills/distributed-mesh/sync-mesh.ps1";
const testSupportPaths = [
  "scripts/coverage/sync-mesh.test.cjs",
  "scripts/coverage/sync-mesh-fixture.ps1",
];

function assertSyncMeshRemainsUnmeasured(inventory) {
  const component = inventory.components.find(
    (candidate) => candidate.id === "squad-maintenance-templates",
  );
  assert.ok(component, "Squad maintenance coverage component must exist");
  assert.equal(
    component.sources.includes(sourcePath),
    false,
    `${sourcePath} must remain unmeasured`,
  );
  assert.equal(
    component.unmeasured.filter((entry) => entry.path === sourcePath).length,
    1,
    `${sourcePath} must have exactly one unmeasured blocker`,
  );
}

function createFixtureDirectory() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "sync-mesh-test-"));
}

function runSync(fixtureDirectory, scenario, extraEnv = {}) {
  const scenarioPath = path.join(fixtureDirectory, "scenario.json");
  const eventLogPath = path.join(fixtureDirectory, "events.jsonl");
  fs.writeFileSync(scenarioPath, JSON.stringify(scenario));

  const result = spawnSync(
    "pwsh",
    [
      "-NoLogo",
      "-NoProfile",
      "-NonInteractive",
      "-File",
      fixturePath,
      "-TemplatePath",
      templatePath,
      "-FixtureDirectory",
      fixtureDirectory,
      "-ScenarioPath",
      scenarioPath,
      "-EventLogPath",
      eventLogPath,
    ],
    {
      encoding: "utf8",
      timeout: 30000,
      windowsHide: true,
      env: { ...process.env, ...extraEnv },
    },
  );
  if (result.error) throw result.error;
  const events = fs.existsSync(eventLogPath)
    ? fs
        .readFileSync(eventLogPath, "utf8")
        .trim()
        .split(/\r?\n/)
        .filter(Boolean)
        .map((line) => JSON.parse(line))
    : [];
  return { events, result };
}

function assertSafeSuccessfulRun(run) {
  assert.equal(run.result.status, 0, run.result.stderr);
  assert.deepEqual(run.events[0], {
    kind: "guard",
    gitCommandType: "Function",
    webRequestCommandType: "Function",
  });
}

function assertOnlyGuardEvents(run) {
  assert.ok(run.events.length > 0, "source interception guard must be recorded");
  assert.ok(
    run.events.every((event) => event.kind === "guard"),
    "init must not invoke Git or web requests",
  );
}

function cleanup(fixtureDirectory) {
  fs.rmSync(fixtureDirectory, { recursive: true, force: true });
}

test("SyncMesh_CoverageInventory_KeepsSourceUnmeasured", () => {
  const inventory = JSON.parse(fs.readFileSync(inventoryPath, "utf8"));
  assertSyncMeshRemainsUnmeasured(inventory);
});

test("SyncMesh_CoverageInventory_RejectsMeasuredReclassification", () => {
  const inventory = JSON.parse(fs.readFileSync(inventoryPath, "utf8"));
  const component = inventory.components.find(
    (candidate) => candidate.id === "squad-maintenance-templates",
  );
  assert.ok(component, "Squad maintenance coverage component must exist");
  component.sources.push(sourcePath);
  component.unmeasured = component.unmeasured.filter(
    (entry) => entry.path !== sourcePath,
  );

  assert.throws(
    () => assertSyncMeshRemainsUnmeasured(inventory),
    /must remain unmeasured/,
  );
});

test("SyncMesh_CoverageInventory_ClassifiesFixtureAsTestSupport", () => {
  const inventory = JSON.parse(fs.readFileSync(inventoryPath, "utf8"));
  for (const testPath of testSupportPaths) {
    assert.equal(
      inventory.excludedSources.filter((entry) => entry.path === testPath).length,
      1,
      `${testPath} must be excluded as test-only support`,
    );
  }
});

test("SyncMesh_InitCreatesScaffoldAndSecondRunPreservesExistingFiles", () => {
  const fixtureDirectory = createFixtureDirectory();
  try {
    const firstRun = runSync(fixtureDirectory, { init: true });
    assertSafeSuccessfulRun(firstRun);
    assertOnlyGuardEvents(firstRun);
    assert.equal(firstRun.events.length, 1);
    assert.match(firstRun.result.stdout, /Mesh state repository initialized/);

    const trustedSummary = path.join(
      fixtureDirectory,
      "trusted-squad",
      "SUMMARY.md",
    );
    const opaqueSummary = path.join(
      fixtureDirectory,
      "opaque-squad",
      "SUMMARY.md",
    );
    const readme = path.join(fixtureDirectory, "README.md");
    assert.match(fs.readFileSync(trustedSummary, "utf8"), /# trusted-squad/);
    assert.match(fs.readFileSync(opaqueSummary, "utf8"), /# opaque-squad/);
    assert.match(
      fs.readFileSync(readme, "utf8"),
      /\*\*opaque-squad\*\* \(Zone: remote-opaque\)/,
    );
    fs.writeFileSync(trustedSummary, "existing squad state\n");
    fs.writeFileSync(readme, "existing mesh documentation\n");

    const secondRun = runSync(fixtureDirectory, { init: true });
    assertSafeSuccessfulRun(secondRun);
    assertOnlyGuardEvents(secondRun);
    assert.equal(secondRun.events.length, 2);
    assert.match(secondRun.result.stdout, /trusted-squad\/SUMMARY\.md exists \(skipped\)/);
    assert.equal(fs.readFileSync(trustedSummary, "utf8"), "existing squad state\n");
    assert.equal(fs.readFileSync(readme, "utf8"), "existing mesh documentation\n");
  } finally {
    cleanup(fixtureDirectory);
  }
});

test("SyncMesh_RemoteTrustedPullSuccess_UsesExistingCheckout", () => {
  const fixtureDirectory = createFixtureDirectory();
  try {
    const run = runSync(fixtureDirectory, {
      trustedZone: "remote-trusted",
      trustedMode: "pull",
      opaqueZone: "local",
      gitExitCode: 0,
    });
    assertSafeSuccessfulRun(run);
    assert.deepEqual(run.events.slice(1), [
      {
        kind: "git",
        args: ["-C", "remotes/trusted", "pull", "--rebase", "--quiet"],
      },
    ]);
    assert.match(run.result.stdout, /Mesh sync complete/);
  } finally {
    cleanup(fixtureDirectory);
  }
});

test("SyncMesh_RemoteTrustedCloneFailure_ReportsUnavailable", () => {
  const fixtureDirectory = createFixtureDirectory();
  try {
    const run = runSync(fixtureDirectory, {
      trustedZone: "remote-trusted",
      trustedMode: "clone",
      opaqueZone: "local",
      gitExitCode: 1,
    });
    assertSafeSuccessfulRun(run);
    assert.deepEqual(run.events.slice(1), [
      {
        kind: "git",
        args: [
          "clone",
          "--quiet",
          "--depth",
          "1",
          "--branch",
          "main",
          "https://git.example.invalid/team/trusted.git",
          "remotes/trusted",
        ],
      },
    ]);
    assert.match(run.result.stdout, /trusted-squad: clone failed \(unavailable\)/);
    assert.match(run.result.stdout, /Mesh sync complete/);
  } finally {
    cleanup(fixtureDirectory);
  }
});

test("SyncMesh_RemoteOpaqueFetchSuccess_SendsBearerAndStoresContract", () => {
  const fixtureDirectory = createFixtureDirectory();
  try {
    const run = runSync(
      fixtureDirectory,
      {
        trustedZone: "local",
        opaqueAuth: "bearer",
        webFailure: false,
      },
      { OPAQUE_SQUAD_TOKEN: "fixture-token" },
    );
    assertSafeSuccessfulRun(run);
    assert.deepEqual(run.events.slice(1), [
      {
        kind: "web",
        uri: "https://partner.example.invalid/summary.md",
        outfile: "remotes/opaque/SUMMARY.md",
        useBasicParsing: true,
        headers: { Authorization: "Bearer fixture-token" },
      },
    ]);
    assert.equal(
      fs.readFileSync(
        path.join(fixtureDirectory, "remotes", "opaque", "SUMMARY.md"),
        "utf8",
      ).replace(/\r\n/g, "\n"),
      "published fixture contract\n",
    );
  } finally {
    cleanup(fixtureDirectory);
  }
});

test("SyncMesh_RemoteOpaqueFetchFailure_WritesUnavailableFallback", () => {
  const fixtureDirectory = createFixtureDirectory();
  try {
    const run = runSync(fixtureDirectory, {
      trustedZone: "local",
      webFailure: true,
    });
    assertSafeSuccessfulRun(run);
    assert.deepEqual(run.events.slice(1), [
      {
        kind: "web",
        uri: "https://partner.example.invalid/summary.md",
        outfile: "remotes/opaque/SUMMARY.md",
        useBasicParsing: true,
        headers: null,
      },
    ]);
    assert.match(
      fs.readFileSync(
        path.join(fixtureDirectory, "remotes", "opaque", "SUMMARY.md"),
        "utf8",
      ),
      /^# opaque-squad — unavailable \(.+\)/,
    );
  } finally {
    cleanup(fixtureDirectory);
  }
});
