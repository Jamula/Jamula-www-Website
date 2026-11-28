import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { spawnSync } from "node:child_process";
import vm from "node:vm";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  selectPreview,
  writePreviewEvent,
  previewEnvironment,
  runPreviewGate,
  runPreviewRecheck,
} from "./swa-preview.mjs";
import {
  assertConfiguredCsp,
  assertDeploymentConfig,
  assertLiveSecurityHeaders,
} from "./verify-swa-csp.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const staticWebAppConfig = path.join(
  __dirname,
  "../../www/public/staticwebapp.config.json",
);

function fixture() {
  const repo = { owner: "Jamula", repo: "Jamula-www-Website" };
  const repository = { full_name: `${repo.owner}/${repo.repo}` };
  const archiveBytes = Buffer.from("zip-archive-bytes");
  const digest = `sha256:${crypto.createHash("sha256").update(archiveBytes).digest("hex")}`;
  const run = {
    id: 123,
    workflow_id: 456,
    event: "pull_request",
    conclusion: "success",
    head_sha: "a".repeat(40),
    head_branch: "dependabot/site",
    head_repository: repository,
    pull_requests: [{ number: 74 }],
  };
  const pr = {
    number: 74,
    state: "open",
    head: { sha: run.head_sha, ref: run.head_branch, repo: repository },
    base: { ref: "main", sha: "b".repeat(40), repo: repository },
  };
  const files = [{ filename: "www/package-lock.json" }];
  const artifacts = [
    {
      id: 789,
      name: `swa-site-${run.head_sha}`,
      expired: false,
      digest,
      size_in_bytes: archiveBytes.length,
      workflow_run: { id: run.id, head_sha: run.head_sha },
    },
  ];
  const github = {
    rest: {
      actions: {
        getWorkflow: async () => ({
          data: {
            id: 456,
            path: ".github/workflows/azure-static-web-apps.yml",
          },
        }),
        getWorkflowRun: async () => ({ data: run }),
        downloadArtifact: async () => ({ data: archiveBytes }),
        listWorkflowRunArtifacts: "artifacts",
      },
      pulls: { get: async () => ({ data: pr }), listFiles: "files" },
      repos: { listPullRequestsAssociatedWithCommit: "prs" },
    },
    paginate: async (method) =>
      ({ artifacts, files, prs: [{ number: pr.number }] })[method],
  };
  return { github, repo, repository, run, pr, artifacts, files, archiveBytes };
}

test("selects exactly the current SHA-bound artifact", async () => {
  const f = fixture();
  const result = await selectPreview(f.github, f.repo, f.run);
  assert.equal(result.action, "upload");
  assert.equal(result.artifact.id, 789);
  assert.equal(result.sha, f.pr.head.sha);
});

test("Dependabot run with an empty PR list is resolved through the commit API", async () => {
  const f = fixture();
  f.run.pull_requests = [];
  assert.equal((await selectPreview(f.github, f.repo, f.run)).action, "upload");
});

for (const [name, mutate] of [
  [
    "push event",
    (f) => {
      f.run.event = "push";
    },
  ],
  [
    "failed build",
    (f) => {
      f.run.conclusion = "failure";
    },
  ],
  [
    "fork build",
    (f) => {
      f.run.head_repository = { full_name: "fork/site" };
    },
  ],
  [
    "stale head",
    (f) => {
      f.pr.head.sha = "c".repeat(40);
    },
  ],
  [
    "changed target",
    (f) => {
      f.pr.base.ref = "other";
    },
  ],
  [
    "changed repository",
    (f) => {
      f.pr.head.repo = { full_name: "fork/site" };
    },
  ],
]) {
  test(`does not deploy ${name}`, async () => {
    const f = fixture();
    mutate(f);
    assert.equal((await selectPreview(f.github, f.repo, f.run)).action, "skip");
  });
}

test("closes the preview for a closed PR without requiring an artifact", async () => {
  const f = fixture();
  f.pr.state = "closed";
  f.artifacts.length = 0;
  assert.equal((await selectPreview(f.github, f.repo, f.run)).action, "close");
});

test("closes the preview when deployable changes have been removed", async () => {
  const f = fixture();
  f.files.length = 0;
  f.artifacts.length = 0;
  assert.equal((await selectPreview(f.github, f.repo, f.run)).action, "close");
});

test("rejects multiple current PRs, invalid PR numbers and unexpected states", async () => {
  const multiple = fixture();
  multiple.run.pull_requests = [{ number: 74 }, { number: 75 }];
  await assert.rejects(
    selectPreview(multiple.github, multiple.repo, multiple.run),
    /multiple current PRs/,
  );

  const invalidNumber = fixture();
  invalidNumber.pr.number = 0;
  await assert.rejects(
    selectPreview(invalidNumber.github, invalidNumber.repo, invalidNumber.run),
    /invalid PR number/,
  );

  const unexpectedState = fixture();
  unexpectedState.pr.state = "merged";
  await assert.rejects(
    selectPreview(
      unexpectedState.github,
      unexpectedState.repo,
      unexpectedState.run,
    ),
    /unexpected PR state/,
  );
});

test("refuses a possibly truncated PR file list at 3000 entries", async () => {
  const f = fixture();
  f.files.splice(
    0,
    f.files.length,
    ...Array.from({ length: 3000 }, (_, index) => ({
      filename: `docs/file-${index}.md`,
    })),
  );
  await assert.rejects(
    selectPreview(f.github, f.repo, f.run),
    /file list may be truncated/,
  );

  f.files.length = 2999;
  f.files[2998] = { filename: "www/index.html" };
  assert.equal((await selectPreview(f.github, f.repo, f.run)).action, "upload");
});

test("recognizes deployable renames and the trusted build workflow as site changes", async () => {
  const renamed = fixture();
  renamed.files[0] = {
    filename: "docs/moved-file.md",
    previous_filename: "www/old-file.md",
  };
  assert.equal(
    (await selectPreview(renamed.github, renamed.repo, renamed.run)).action,
    "upload",
  );

  const workflowChange = fixture();
  workflowChange.files[0] = {
    filename: ".github/workflows/azure-static-web-apps.yml",
  };
  assert.equal(
    (
      await selectPreview(
        workflowChange.github,
        workflowChange.repo,
        workflowChange.run,
      )
    ).action,
    "upload",
  );
});

for (const [name, mutate] of [
  [
    "wrong workflow",
    (f) => {
      f.run.workflow_id = 999;
    },
  ],
  [
    "missing artifact",
    (f) => {
      f.artifacts.length = 0;
    },
  ],
  [
    "expired artifact",
    (f) => {
      f.artifacts[0].expired = true;
    },
  ],
  [
    "missing digest",
    (f) => {
      delete f.artifacts[0].digest;
    },
  ],
  [
    "wrong run",
    (f) => {
      f.artifacts[0].workflow_run.id = 999;
    },
  ],
  [
    "wrong artifact SHA",
    (f) => {
      f.artifacts[0].workflow_run.head_sha = "c".repeat(40);
    },
  ],
  [
    "zero artifact id",
    (f) => {
      f.artifacts[0].id = 0;
    },
  ],
  [
    "unsafe artifact id",
    (f) => {
      f.artifacts[0].id = Number.MAX_SAFE_INTEGER + 1;
    },
  ],
  [
    "malformed artifact digest",
    (f) => {
      f.artifacts[0].digest = "sha256:xyz";
    },
  ],
  [
    "zero artifact size",
    (f) => {
      f.artifacts[0].size_in_bytes = 0;
    },
  ],
  [
    "oversized artifact",
    (f) => {
      f.artifacts[0].size_in_bytes = 100 * 1024 * 1024 + 1;
    },
  ],
  [
    "missing workflow binding",
    (f) => {
      delete f.artifacts[0].workflow_run;
    },
  ],
  [
    "duplicate artifact",
    (f) => {
      f.artifacts.push({ ...f.artifacts[0], id: 790 });
    },
  ],
]) {
  test(`rejects ${name}`, async () => {
    const f = fixture();
    mutate(f);
    await assert.rejects(selectPreview(f.github, f.repo, f.run));
  });
}

test("accepts an artifact exactly at the documented size limit", async () => {
  const f = fixture();
  f.artifacts[0].size_in_bytes = 100 * 1024 * 1024;
  assert.equal((await selectPreview(f.github, f.repo, f.run)).action, "upload");
});

test("deployment event always identifies the selected PR, not main", async () => {
  const f = fixture();
  const selection = await selectPreview(f.github, f.repo, f.run);
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "swa-preview-"));
  try {
    const destination = path.join(directory, "event.json");
    writePreviewEvent(selection, f.run.head_repository, destination);
    const event = JSON.parse(fs.readFileSync(destination, "utf8"));
    assert.equal(event.action, "synchronize");
    assert.equal(event.number, 74);
    assert.equal(event.pull_request.head.sha, f.run.head_sha);
    selection.action = "close";
    writePreviewEvent(selection, f.run.head_repository, destination);
    assert.equal(JSON.parse(fs.readFileSync(destination)).action, "closed");
  } finally {
    fs.rmSync(path.join(directory, "event.json"), { force: true });
    fs.rmdirSync(directory);
  }
});

test("deployment event rejects unselected actions", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "swa-preview-"));
  try {
    assert.throws(
      () =>
        writePreviewEvent(
          { action: "skip", pr: { number: 74 } },
          { full_name: "Jamula/Jamula-www-Website" },
          path.join(directory, "event.json"),
        ),
      /Only a selected PR/,
    );
    assert.equal(fs.existsSync(path.join(directory, "event.json")), false);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("runPreviewGate handles upload, close, skip, size limit, and digest verification", async (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "swa-gate-"));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const eventDestination = path.join(directory, "event.json");
  const archiveDestination = path.join(directory, "site.zip");

  const makeHarness = (f) => {
    const outputs = {};
    const summaries = [];
    const core = {
      setOutput: (name, value) => {
        outputs[name] = value;
      },
      summary: {
        addRaw: (text) => ({
          write: async () => {
            summaries.push(text);
          },
        }),
      },
    };
    const context = {
      repo: f.repo,
      payload: { workflow_run: { id: f.run.id }, repository: f.repository },
    };
    return { outputs, summaries, core, context };
  };

  const uploadFixture = fixture();
  const uploadHarness = makeHarness(uploadFixture);
  await runPreviewGate({
    github: uploadFixture.github,
    context: uploadHarness.context,
    core: uploadHarness.core,
    eventDestination,
    archiveDestination,
  });
  assert.equal(uploadHarness.outputs.action, "upload");
  assert.equal(uploadHarness.outputs.number, 74);
  assert.equal(uploadHarness.outputs.sha, uploadFixture.run.head_sha);
  assert.equal(uploadHarness.outputs.digest, uploadFixture.artifacts[0].digest);
  assert.deepEqual(
    fs.readFileSync(archiveDestination),
    uploadFixture.archiveBytes,
  );

  const closeFixture = fixture();
  closeFixture.pr.state = "closed";
  const closeHarness = makeHarness(closeFixture);
  await runPreviewGate({
    github: closeFixture.github,
    context: closeHarness.context,
    core: closeHarness.core,
    eventDestination,
    archiveDestination: path.join(directory, "unused.zip"),
  });
  assert.equal(closeHarness.outputs.action, "close");

  const skipFixture = fixture();
  skipFixture.run.event = "push";
  const skipHarness = makeHarness(skipFixture);
  await runPreviewGate({
    github: skipFixture.github,
    context: skipHarness.context,
    core: skipHarness.core,
    eventDestination,
    archiveDestination,
  });
  assert.equal(skipHarness.outputs.action, "skip");
  assert.equal(skipHarness.summaries.length, 1);

  const mismatchFixture = fixture();
  mismatchFixture.github.rest.actions.downloadArtifact = async () => ({
    data: Buffer.from("tampered"),
  });
  const mismatchHarness = makeHarness(mismatchFixture);
  await assert.rejects(
    runPreviewGate({
      github: mismatchFixture.github,
      context: mismatchHarness.context,
      core: mismatchHarness.core,
      eventDestination,
      archiveDestination,
    }),
    /digest does not match/,
  );

  const hugeFixture = fixture();
  hugeFixture.github.rest.actions.downloadArtifact = async () => ({
    data: Buffer.alloc(100 * 1024 * 1024 + 1),
  });
  const hugeHarness = makeHarness(hugeFixture);
  await assert.rejects(
    runPreviewGate({
      github: hugeFixture.github,
      context: hugeHarness.context,
      core: hugeHarness.core,
      eventDestination,
      archiveDestination,
    }),
    /exceeds the size limit/,
  );
});

test("CSP and deployment config verifiers validate staticwebapp.config.json and live headers", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "swa-csp-"));
  const configPath = path.join(directory, "config.json");
  const headersPath = path.join(directory, "headers.txt");
  fs.writeFileSync(headersPath, "HTTP/2 200\r\n");
  try {
    for (const config of [
      {},
      { globalHeaders: {} },
      { globalHeaders: { "Content-Security-Policy": "" } },
      { globalHeaders: { "Content-Security-Policy": null } },
    ]) {
      fs.writeFileSync(configPath, JSON.stringify(config));
      assert.throws(
        () => assertConfiguredCsp(configPath, headersPath),
        /configuration has no CSP/,
      );
      assert.throws(
        () => assertDeploymentConfig(configPath),
        /configuration has no CSP/,
      );
    }

    fs.writeFileSync(
      configPath,
      JSON.stringify({
        globalHeaders: { "Content-Security-Policy": "default-src 'self'" },
      }),
    );
    assert.throws(
      () => assertDeploymentConfig(configPath),
      /missing the 404 response override/,
    );

    fs.writeFileSync(
      configPath,
      JSON.stringify({
        responseOverrides: { 404: { statusCode: 404 } },
        globalHeaders: { "Content-Security-Policy": "default-src 'self'" },
      }),
    );
    assert.throws(
      () => assertDeploymentConfig(configPath),
      /missing the \.txt MIME mapping/,
    );

    const fullConfig = JSON.parse(fs.readFileSync(staticWebAppConfig, "utf8"));
    fs.writeFileSync(configPath, JSON.stringify(fullConfig));
    assert.deepEqual(assertDeploymentConfig(configPath), fullConfig);

    const validHeaders = Object.fromEntries(
      Object.entries(fullConfig.globalHeaders).map(([k, v]) => [
        k.toLowerCase(),
        v,
      ]),
    );
    validHeaders["strict-transport-security"] = "max-age=31536000";
    assert.doesNotThrow(() =>
      assertLiveSecurityHeaders(configPath, validHeaders),
    );
    assert.throws(
      () =>
        assertLiveSecurityHeaders(configPath, {
          ...validHeaders,
          "content-security-policy": "default-src 'self'",
        }),
      /does not match the built configuration/,
    );
    assert.throws(
      () =>
        assertLiveSecurityHeaders(configPath, {
          ...validHeaders,
          "x-frame-options": "SAMEORIGIN",
        }),
      /Unexpected X-Frame-Options header/,
    );
    assert.throws(
      () =>
        assertLiveSecurityHeaders(configPath, {
          ...validHeaders,
          "strict-transport-security": "   ",
        }),
      /Strict-Transport-Security was not enforced/,
    );
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("CSP verifier CLI checks deployment config, exact policy, and argument or file errors", () => {
  const config = JSON.parse(fs.readFileSync(staticWebAppConfig, "utf8"));
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "swa-csp-"));
  const configPath = path.join(directory, "config.json");
  const headersPath = path.join(directory, "headers.txt");
  fs.writeFileSync(configPath, JSON.stringify(config));
  const runVerifier = (...args) =>
    spawnSync(
      process.execPath,
      [path.join(__dirname, "verify-swa-csp.mjs"), ...args],
      { encoding: "utf8" },
    );
  try {
    const usage = runVerifier();
    assert.equal(usage.status, 1);
    assert.match(usage.stderr, /Usage: verify-swa-csp\.mjs/);

    const extraArgs = runVerifier(configPath, headersPath, "extra");
    assert.equal(extraArgs.status, 1);
    assert.match(extraArgs.stderr, /Usage: verify-swa-csp\.mjs/);

    const configOnly = runVerifier(configPath);
    assert.equal(configOnly.status, 0, configOnly.stderr);

    fs.writeFileSync(
      headersPath,
      `HTTP/2 200\r\nContent-Security-Policy: ${config.globalHeaders["Content-Security-Policy"]}\r\n`,
    );
    const valid = runVerifier(configPath, headersPath);
    assert.equal(valid.status, 0, valid.stderr);

    fs.writeFileSync(
      headersPath,
      "HTTP/2 200\r\nContent-Security-Policy: default-src 'self'\r\n",
    );
    const mismatch = runVerifier(configPath, headersPath);
    assert.equal(mismatch.status, 1);
    assert.match(mismatch.stderr, /does not match the built configuration/);

    fs.writeFileSync(configPath, "{");
    const malformed = runVerifier(configPath, headersPath);
    assert.equal(malformed.status, 1);
    assert.match(malformed.stderr, /JSON|Unexpected end/);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("selects a numbered non-production environment for upload and cleanup", async () => {
  for (const state of ["open", "closed"]) {
    const f = fixture();
    f.pr.state = state;
    const selection = await selectPreview(f.github, f.repo, f.run);
    assert.equal(
      previewEnvironment(selection, "Jamula/Jamula-www-Website"),
      "74",
    );
  }
  const f = fixture();
  f.files.length = 0;
  const selection = await selectPreview(f.github, f.repo, f.run);
  assert.equal(selection.action, "close");
  assert.equal(
    previewEnvironment(selection, "Jamula/Jamula-www-Website"),
    "74",
  );
});

test("rejects invalid or production-like target metadata before upload", () => {
  const mutations = [
    (selection) => {
      selection.action = "skip";
    },
    (selection) => {
      selection.pr.number = 0;
    },
    (selection) => {
      selection.pr.number = -1;
    },
    (selection) => {
      selection.pr.number = "74";
    },
    (selection) => {
      selection.pr.number = Number.MAX_SAFE_INTEGER + 1;
    },
    (selection) => {
      selection.sha = "invalid";
    },
    (selection) => {
      selection.sha += "\n";
      selection.pr.head.sha = selection.sha;
    },
    (selection) => {
      selection.pr.head.sha = "c".repeat(40);
    },
    (selection) => {
      selection.pr.head.repo.full_name = "fork/site";
    },
    (selection) => {
      selection.pr.base.repo.full_name = "fork/site";
    },
    (selection) => {
      selection.pr.base.ref = "other";
    },
    (selection) => {
      selection.pr.base.sha = "";
    },
    (selection) => {
      selection.pr.head.ref = "main";
    },
    (selection) => {
      selection.pr.head.ref = "";
    },
    (selection) => {
      selection.pr.state = "closed";
    },
  ];
  for (const mutate of mutations) {
    const f = fixture();
    const selection = structuredClone({
      action: "upload",
      pr: f.pr,
      sha: f.run.head_sha,
    });
    mutate(selection);
    assert.throws(
      () => previewEnvironment(selection, "Jamula/Jamula-www-Website"),
      /valid current same-repository PR/,
    );
  }
  const f = fixture();
  f.pr.number = Number.MAX_SAFE_INTEGER;
  assert.equal(
    previewEnvironment(
      { action: "upload", pr: f.pr, sha: f.run.head_sha },
      "Jamula/Jamula-www-Website",
    ),
    String(Number.MAX_SAFE_INTEGER),
  );
});

test("workflow routes both operations through the validated explicit environment input", () => {
  const workflow = fs
    .readFileSync(
      path.join(__dirname, "../workflows/azure-static-web-apps-preview.yml"),
      "utf8",
    )
    .replace(/\r\n/g, "\n");
  const deployment = workflow
    .split("      - name: Deploy or close selected PR preview")[1]
    .split("      - name: Verify isolated live preview")[0];
  assert.match(
    deployment,
    /Azure\/static-web-apps-deploy@4d27395796ac319302594769cfe812bd207490b1/,
  );
  assert.match(
    deployment,
    /deployment_environment: \$\{\{ steps\.current\.outputs\.environment \}\}/,
  );
  assert.match(deployment, /production_branch: main/);
  assert.match(deployment, /action: \$\{\{ steps\.gate\.outputs\.action \}\}/);
  assert.match(deployment, /if: steps\.current\.outputs\.deploy == 'true'/);
  assert.doesNotMatch(
    deployment,
    /GITHUB_(EVENT_NAME|EVENT_PATH|REF|HEAD_REF|BASE_REF|SHA):/,
  );
  assert.ok(
    workflow.indexOf("runPreviewGate({ github, context, core })") <
      workflow.indexOf("Extract only static files"),
  );
  assert.ok(
    workflow.indexOf("runPreviewRecheck({") <
      workflow.indexOf("Require trusted deployment token"),
  );
  assert.match(
    workflow,
    /if \[\[ "\$PREVIEW_ACTION" == "close" \]\]; then\n\s+cp \.preview\/event\.json "\$GITHUB_EVENT_PATH"/,
  );
  assert.match(workflow, /\$\{DEPLOYED_URL%\/\}" != "\$expected/);
});

test("last-minute PR recheck withholds deployment for every changed identity surface", async (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "swa-recheck-"));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const eventPath = path.join(directory, "event.json");

  const mutations = [
    null,
    (pr) => {
      pr.number += 1;
    },
    (pr) => {
      pr.head.sha = "c".repeat(40);
    },
    (pr) => {
      pr.head.ref = "changed";
    },
    (pr) => {
      pr.head.repo.full_name = "fork/site";
    },
    (pr) => {
      pr.base.repo.full_name = "fork/site";
    },
    (pr) => {
      pr.base.ref = "other";
    },
    (pr) => {
      pr.base.sha = "c".repeat(40);
    },
    (pr) => {
      pr.state = "closed";
    },
  ];
  for (const mutate of mutations) {
    const f = fixture();
    const saved = structuredClone({ number: f.pr.number, pull_request: f.pr });
    fs.writeFileSync(eventPath, JSON.stringify(saved));
    if (mutate) mutate(f.pr);
    const outputs = {};
    const context = { repo: f.repo, payload: {} };
    const core = {
      setOutput: (name, value) => {
        outputs[name] = value;
      },
      summary: { addRaw: () => ({ write: async () => {} }) },
    };
    await runPreviewRecheck({
      github: f.github,
      context,
      core,
      action: "upload",
      eventPath,
    });
    assert.equal(outputs.deploy, mutate === null);
    assert.equal(outputs.environment, mutate === null ? "74" : undefined);
  }
});

const productionWorkflow = fs
  .readFileSync(
    path.join(__dirname, "../workflows/azure-static-web-apps.yml"),
    "utf8",
  )
  .replace(/\r\n/g, "\n");
const productionJobs = Object.fromEntries(
  [
    ...productionWorkflow
      .split("\njobs:\n")[1]
      .matchAll(
        /^  ([a-z][a-z0-9-]*):\n([\s\S]*?)(?=^  [a-z][a-z0-9-]*:\n|(?![\s\S]))/gm,
      ),
  ].map((match) => [match[1], match[2]]),
);

test("trusted preview validator resolves the downloaded archive and deployment output", () => {
  const workflow = fs
    .readFileSync(
      path.join(__dirname, "../workflows/azure-static-web-apps-preview.yml"),
      "utf8",
    )
    .replace(/\r\n/g, "\n");
  assert.match(workflow, /global-json-file: trusted\/global\.json/);
  const step = workflow.match(
    /- name: Extract only static files and verify trusted configuration\n([\s\S]*?)(?=\n      - name:)/,
  )?.[1];
  assert.ok(step);
  const cwd = step.match(/^\s+working-directory: (.+)$/m)?.[1];
  const command = step.match(/^\s+run: (.+)$/m)?.[1];
  assert.equal(cwd, "trusted/scripts/validation");
  const args = command?.match(
    /^dotnet run --configuration Release -- validate-artifact "([^"]+)" "([^"]+)" "([^"]+)"$/,
  );
  assert.ok(args, "expected the trusted validator and its three quoted paths");
  const workspace = path.resolve(__dirname, "../..");
  const resolveArgument = (arg) =>
    path.resolve(
      workspace,
      cwd,
      arg.replace(/^\$GITHUB_WORKSPACE(?=\/|$)/, workspace),
    );
  const deployment = workflow.match(/^\s+app_location: (.+)$/m)?.[1];
  assert.equal(deployment, "www/dist");
  assert.equal(
    resolveArgument(args[1]),
    path.resolve(workspace, ".preview/site.zip"),
  );
  assert.equal(resolveArgument(args[2]), path.resolve(workspace, deployment));
  assert.equal(
    resolveArgument(args[3]),
    path.resolve(workspace, "trusted/www/public/staticwebapp.config.json"),
  );
  const verifyStep = workflow.match(
    /- name: Verify isolated live preview\n([\s\S]*)$/,
  )?.[1];
  assert.ok(verifyStep);
  assert.match(
    verifyStep,
    /node trusted\/\.github\/scripts\/verify-preview\.mjs "\$DEPLOYED_URL"/,
  );
  assert.doesNotMatch(verifyStep, /^\s+working-directory:/m);
});

test("live CSP verifier accepts the policy from the Static Web Apps config", () => {
  const config = JSON.parse(fs.readFileSync(staticWebAppConfig, "utf8"));
  const headersDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "swa-csp-"));
  const headersPath = path.join(headersDirectory, "headers.txt");
  try {
    fs.writeFileSync(
      headersPath,
      `HTTP/2 200\r\nContent-Security-Policy: ${config.globalHeaders["Content-Security-Policy"]}\r\n`,
    );
    assert.doesNotThrow(() =>
      assertConfiguredCsp(staticWebAppConfig, headersPath),
    );
  } finally {
    fs.rmSync(headersDirectory, { recursive: true, force: true });
  }
});

test("live CSP verifier checks the final response after redirects", () => {
  const config = JSON.parse(fs.readFileSync(staticWebAppConfig, "utf8"));
  const headersDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "swa-csp-"));
  const headersPath = path.join(headersDirectory, "headers.txt");
  try {
    fs.writeFileSync(
      headersPath,
      `HTTP/2 301\r\nLocation: https://example.test/\r\nContent-Security-Policy: stale\r\n\r\nHTTP/2 200\r\nContent-Security-Policy: ${config.globalHeaders["Content-Security-Policy"]}\r\n`,
    );
    assert.doesNotThrow(() =>
      assertConfiguredCsp(staticWebAppConfig, headersPath),
    );
  } finally {
    fs.rmSync(headersDirectory, { recursive: true, force: true });
  }
});

test("live CSP verifier rejects the stale self-only policy", () => {
  const headersDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "swa-csp-"));
  const headersPath = path.join(headersDirectory, "headers.txt");
  try {
    fs.writeFileSync(
      headersPath,
      "HTTP/2 200\r\nContent-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; frame-ancestors 'none'\r\n",
    );
    assert.throws(
      () => assertConfiguredCsp(staticWebAppConfig, headersPath),
      /does not match the built configuration/,
    );
  } finally {
    fs.rmSync(headersDirectory, { recursive: true, force: true });
  }
});

test("live CSP verifier rejects missing or duplicate CSP headers", () => {
  const config = JSON.parse(fs.readFileSync(staticWebAppConfig, "utf8"));
  const policy = config.globalHeaders["Content-Security-Policy"];
  const headersDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "swa-csp-"));
  const headersPath = path.join(headersDirectory, "headers.txt");
  try {
    for (const response of [
      "HTTP/2 200\r\nX-Frame-Options: DENY\r\n",
      `HTTP/2 200\r\nContent-Security-Policy: ${policy}\r\nContent-Security-Policy: ${policy}\r\n`,
    ]) {
      fs.writeFileSync(headersPath, response);
      assert.throws(
        () => assertConfiguredCsp(staticWebAppConfig, headersPath),
        /does not match the built configuration/,
      );
    }
  } finally {
    fs.rmSync(headersDirectory, { recursive: true, force: true });
  }
});

test("live CSP verifier never inherits CSP from an earlier response", () => {
  const config = JSON.parse(fs.readFileSync(staticWebAppConfig, "utf8"));
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "swa-csp-"));
  const headers = path.join(directory, "headers.txt");
  try {
    fs.writeFileSync(
      headers,
      `HTTP/2 301\r\nContent-Security-Policy: ${config.globalHeaders["Content-Security-Policy"]}\r\n\r\nHTTP/2 200\r\nX-Frame-Options: DENY\r\n`,
    );
    assert.throws(
      () => assertConfiguredCsp(staticWebAppConfig, headers),
      /does not match the built configuration/,
    );
    fs.writeFileSync(headers, "Content-Security-Policy: stale\r\n");
    assert.throws(
      () => assertConfiguredCsp(staticWebAppConfig, headers),
      /no HTTP header block/,
    );
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("live CSP verifier rejects missing, empty, and non-string configured policies", (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "swa-csp-config-"));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const configPath = path.join(directory, "config.json");
  for (const config of [
    {},
    { globalHeaders: {} },
    { globalHeaders: { "Content-Security-Policy": "" } },
    { globalHeaders: { "Content-Security-Policy": 42 } },
  ]) {
    fs.writeFileSync(configPath, JSON.stringify(config));
    assert.throws(
      () =>
        assertConfiguredCsp(configPath, path.join(directory, "unused-headers")),
      { message: "Built Static Web Apps configuration has no CSP." },
    );
  }
});

test("live CSP verifier propagates malformed configuration and file errors", (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "swa-csp-errors-"));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const configPath = path.join(directory, "config.json");
  const headersPath = path.join(directory, "missing-headers");
  assert.throws(() => assertConfiguredCsp(configPath, headersPath), {
    code: "ENOENT",
  });
  fs.writeFileSync(configPath, "{");
  assert.throws(
    () => assertConfiguredCsp(configPath, headersPath),
    SyntaxError,
  );
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      globalHeaders: { "Content-Security-Policy": "default-src 'self'" },
    }),
  );
  assert.throws(() => assertConfiguredCsp(configPath, headersPath), {
    code: "ENOENT",
  });
});

test("live CSP verifier handles header casing, whitespace, and malformed response blocks", (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "swa-csp-headers-"));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const configPath = path.join(directory, "config.json");
  const headersPath = path.join(directory, "headers.txt");
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      globalHeaders: { "Content-Security-Policy": "default-src 'self'" },
    }),
  );
  fs.writeFileSync(
    headersPath,
    "HTTP/2 200\ncontent-security-policy \t:  default-src 'self'  \n\nHTTP/2 nope\nContent-Security-Policy: stale\n",
  );
  assert.doesNotThrow(() => assertConfiguredCsp(configPath, headersPath));
  fs.writeFileSync(
    headersPath,
    "HTTP/2 nope\nContent-Security-Policy: default-src 'self'\n",
  );
  assert.throws(() => assertConfiguredCsp(configPath, headersPath), {
    message: "Live response has no HTTP header block.",
  });
});

for (const name of ["deploy", "deploy-com"]) {
  test(`${name} wires exact verifier sparse-checkout before artifact download and runs in isolation`, async () => {
    const steps = [
      ...productionJobs[name].matchAll(
        /^      - name: (.+)\n([\s\S]*?)(?=^      - name: |(?![\s\S]))/gm,
      ),
    ].map((match) => ({ name: match[1], body: match[2] }));
    assert.deepEqual(
      steps.map((step) => step.name),
      [
        "Check out exact verifier revision",
        name === "deploy"
          ? "Require production deployment token"
          : "Require companion deployment token",
        "Download verified deployment artifact",
        "Verify downloaded configuration",
        "Require current main revision",
        "Record production deployment",
        "Deploy prebuilt site",
        "Verify live site",
        "Record deployment result",
      ],
    );
    assert.match(
      steps[0].body,
      /uses: actions\/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1/,
    );
    assert.match(steps[0].body, /ref: \$\{\{ env\.DEPLOYMENT_SHA \}\}/);
    assert.match(steps[0].body, /persist-credentials: false/);
    assert.match(steps[0].body, /sparse-checkout-cone-mode: false/);

    const sparseFiles = steps[0].body
      .split("sparse-checkout: |\n")[1]
      .split("          sparse-checkout-cone-mode:")[0]
      .trim()
      .split("\n")
      .map((line) => line.trim());
    assert.deepEqual(sparseFiles, [
      ".github/scripts/verify-swa-csp.mjs",
      ".github/scripts/verify-preview.mjs",
      ".github/scripts/release.mjs",
      ".github/scripts/production-deployment.mjs",
    ]);

    assert.match(
      steps[2].body,
      /uses: actions\/download-artifact@9000827ccba6bdab643e8b6fd33ac0654aef8333/,
    );
    assert.match(
      steps[2].body,
      /name: swa-site-\$\{\{ env\.DEPLOYMENT_SHA \}\}/,
    );
    assert.match(steps[2].body, /path: www\/dist/);
    assert.match(steps[6].body, /app_location: www\/dist/);
    assert.match(steps[6].body, /skip_app_build: true/);
    assert.match(
      steps[6].body,
      new RegExp(
        `azure_static_web_apps_api_token: \\$\\{\\{ secrets\\.SWA_${name === "deploy" ? "NET" : "COM"}_DEPLOYMENT_TOKEN \\}\\}`,
      ),
    );
    assert.match(
      steps[7].body,
      /run: node \.github\/scripts\/production-deployment\.mjs verify/,
    );
    assert.match(
      steps[8].body,
      /run: node \.github\/scripts\/production-deployment\.mjs finish/,
    );

    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "swa-isolated-"));
    try {
      const workspaceRoot = path.resolve(__dirname, "../..");
      for (const relativeFile of sparseFiles) {
        const destination = path.join(directory, relativeFile);
        fs.mkdirSync(path.dirname(destination), { recursive: true });
        fs.copyFileSync(path.join(workspaceRoot, relativeFile), destination);
      }
      assert.equal(fs.existsSync(path.join(directory, "www/public")), false);
      fs.mkdirSync(path.join(directory, "www/dist"), { recursive: true });
      const config = JSON.parse(fs.readFileSync(staticWebAppConfig, "utf8"));
      config.globalHeaders["Content-Security-Policy"] += "; object-src 'none'";
      const builtConfigPath = path.join(
        directory,
        "www/dist/staticwebapp.config.json",
      );
      fs.writeFileSync(builtConfigPath, JSON.stringify(config));

      const configCheck = spawnSync(
        process.execPath,
        [
          ".github/scripts/verify-swa-csp.mjs",
          "www/dist/staticwebapp.config.json",
        ],
        { cwd: directory, encoding: "utf8" },
      );
      assert.equal(configCheck.status, 0, configCheck.stderr);

      const isolatedModule = await import(
        pathToFileURL(
          path.join(directory, ".github/scripts/production-deployment.mjs"),
        ).href
      );
      const appKey = name === "deploy" ? "net" : "com";
      const expectedUrl = isolatedModule.PRODUCTION_URLS[appKey];
      const sha = "a".repeat(40);
      const headers = Object.fromEntries(
        Object.entries(config.globalHeaders).map(([k, v]) => [
          k.toLowerCase(),
          v,
        ]),
      );
      headers["strict-transport-security"] = "max-age=31536000";
      const summaryPath = path.join(directory, "summary.txt");

      await isolatedModule.verifyProductionSite(
        {
          DEPLOYMENT_APP: appKey,
          DEPLOYED_URL: expectedUrl,
          RELEASE_VERSION: "0.1.0",
          DEPLOYMENT_SHA: sha,
          GITHUB_RUN_ID: "1",
          RELEASE_ATTEMPT: "1",
          ARTIFACT_DIGEST: "disposable-artifact-digest",
          GITHUB_STEP_SUMMARY: summaryPath,
        },
        {
          configPath: builtConfigPath,
          sleep: async () => {},
          request: async (url) => {
            if (url.includes("/release.json")) {
              return {
                status: 200,
                headers: {},
                body: Buffer.from(
                  JSON.stringify({
                    version: "0.1.0",
                    revision: sha,
                    run: "1",
                    attempt: "1",
                  }),
                ),
              };
            }
            if (url.endsWith("/robots.txt")) {
              return {
                status: 200,
                headers: { "content-type": "text/plain" },
                body: Buffer.alloc(0),
              };
            }
            if (url.endsWith("/__jamula_missing_route__")) {
              return {
                status: 404,
                headers: {},
                body: Buffer.from("Page not found"),
              };
            }
            return {
              status: 200,
              headers,
              body: Buffer.from("<title>Jamula</title>"),
            };
          },
        },
      );
      const summary = fs.readFileSync(summaryPath, "utf8");
      assert.match(summary, /Verified Azure deployment/);
      assert.ok(summary.includes(sha));
      assert.match(summary, /disposable-artifact-digest/);
    } finally {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  });
}

function jobEnabled(
  name,
  event,
  ref,
  shouldDeploy = "true",
  action = "synchronize",
  fork = false,
) {
  const expression = productionJobs[name].match(
    /^    if: >-\n((?:      .*\n)+)/m,
  );
  assert.ok(expression, `${name} must have an explicit event/ref guard`);
  return vm.runInNewContext(expression[1].trim(), {
    github: {
      event_name: event,
      ref,
      repository: "Jamula/Jamula-www-Website",
      event: {
        action,
        pull_request: {
          head: {
            repo: {
              full_name: fork ? "fork/site" : "Jamula/Jamula-www-Website",
            },
          },
        },
      },
    },
    needs: { prepare: { outputs: { should_deploy: shouldDeploy } } },
  });
}

test("manual production trigger has no revision override inputs", () => {
  assert.match(productionWorkflow, /^on:\n  workflow_dispatch:\n    inputs:/m);
  assert.doesNotMatch(productionWorkflow, /^  push:/m);
  assert.match(productionWorkflow, /DEPLOYMENT_SHA:.*\|\| github\.sha/);
  assert.match(productionWorkflow, /group: >-\n[\s\S]*?\|\| 'production'/);
});

for (const event of ["workflow_dispatch"]) {
  test(`${event} production jobs require main and a selected artifact`, () => {
    assert.equal(jobEnabled("prepare", event, "refs/heads/main"), true);
    for (const ref of ["refs/heads/feature", "refs/tags/main"]) {
      assert.equal(jobEnabled("prepare", event, ref), true);
    }
    for (const name of ["deploy", "deploy-com"]) {
      assert.equal(jobEnabled(name, event, "refs/heads/main"), true);
      assert.equal(jobEnabled(name, event, "refs/heads/main", "false"), false);
      for (const ref of ["refs/heads/feature", "refs/tags/main"]) {
        assert.equal(jobEnabled(name, event, ref), false);
      }
      assert.match(productionJobs[name], /^    environment: swa-deployment$/m);
      assert.match(
        productionJobs[name],
        /name: swa-site-\$\{\{ env\.DEPLOYMENT_SHA \}\}/,
      );
    }
  });

  for (const [scenario, ref, latest, expected] of [
    ["current main", "refs/heads/main", "a".repeat(40), "true"],
    ["stale main", "refs/heads/main", "b".repeat(40), "false"],
    [
      "non-main with matching SHA",
      "refs/heads/feature",
      "a".repeat(40),
      "false",
    ],
    ["tag with matching SHA", "refs/tags/main", "a".repeat(40), "false"],
  ]) {
    test(`${event} gate selects ${scenario} as ${expected}`, () => {
      const directory = fs.mkdtempSync(
        path.join(os.tmpdir(), "swa-production-"),
      );
      try {
        const script = productionJobs.prepare
          .match(/        run: \|\n([\s\S]*?)(?=\n      - name:|\n  build:)/)[1]
          .replace(/^          /gm, "");
        const result = spawnSync(
          "bash",
          [
            "-c",
            `
          gh() {
            [[ "$*" == "api repos/Jamula/Jamula-www-Website/git/ref/heads/main --jq .object.sha" ]] || return 90
            printf '%s\\n' "$TEST_LATEST_MAIN"
          }
          git() { echo "Production must not use the PR diff gate" >&2; return 91; }
          ${script}
        `,
          ],
          {
            cwd: directory,
            encoding: "utf8",
            env: {
              ...process.env,
              GITHUB_EVENT_NAME: event,
              GITHUB_REF: ref,
              GITHUB_SHA: "a".repeat(40),
              GITHUB_REPOSITORY: "Jamula/Jamula-www-Website",
              GITHUB_OUTPUT: "output.txt",
              TEST_LATEST_MAIN: latest,
            },
          },
        );
        assert.ifError(result.error);
        if (expected === "true") {
          assert.equal(result.status, 0, result.stderr);
          assert.equal(
            fs.readFileSync(path.join(directory, "output.txt"), "utf8").trim(),
            "should_deploy=true",
          );
        } else {
          assert.notEqual(result.status, 0);
          assert.equal(
            fs.existsSync(path.join(directory, "output.txt")),
            false,
          );
        }
      } finally {
        fs.rmSync(path.join(directory, "output.txt"), { force: true });
        fs.rmdirSync(directory);
      }
    });
  }
}

for (const event of ["workflow_dispatch"]) {
  test(`${event} gate fails closed when latest main cannot be read`, () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "swa-production-"));
    try {
      const script = productionJobs.prepare
        .match(/        run: \|\n([\s\S]*?)(?=\n      - name:|\n  build:)/)[1]
        .replace(/^          /gm, "");
      const result = spawnSync(
        "bash",
        ["-c", `gh() { return 92; }\n${script}`],
        {
          cwd: directory,
          encoding: "utf8",
          env: {
            ...process.env,
            GITHUB_EVENT_NAME: event,
            GITHUB_REF: "refs/heads/main",
            GITHUB_REPOSITORY: "Jamula/Jamula-www-Website",
            GITHUB_OUTPUT: "output.txt",
          },
        },
      );
      assert.ifError(result.error);
      assert.equal(result.status, 92, result.stderr);
      assert.equal(fs.existsSync(path.join(directory, "output.txt")), false);
    } finally {
      fs.rmSync(path.join(directory, "output.txt"), { force: true });
      fs.rmdirSync(directory);
    }
  });
}

test("PR validation stays isolated and unrelated events cannot deploy production", () => {
  assert.equal(
    jobEnabled("prepare", "pull_request", "refs/pull/1/merge"),
    true,
  );
  assert.equal(
    jobEnabled(
      "prepare",
      "pull_request",
      "refs/pull/1/merge",
      "true",
      "closed",
    ),
    false,
  );
  assert.equal(
    jobEnabled(
      "prepare",
      "pull_request",
      "refs/pull/1/merge",
      "true",
      "synchronize",
      true,
    ),
    false,
  );
  for (const event of ["push", "pull_request", "workflow_run", "schedule"]) {
    for (const name of ["deploy", "deploy-com"]) {
      assert.equal(jobEnabled(name, event, "refs/heads/main"), false);
    }
  }
  assert.equal(jobEnabled("prepare", "workflow_run", "refs/heads/main"), false);
  for (const name of ["prepare", "build"]) {
    assert.doesNotMatch(productionJobs[name], /secrets\.|environment:/);
  }
});
