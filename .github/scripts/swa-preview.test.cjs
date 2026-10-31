const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { test } = require("node:test");
const { selectPreview, writePreviewEvent } = require("./swa-preview.cjs");

function fixture() {
  const repo = { owner: "Jamula", repo: "Jamula-www-Website" };
  const repository = { full_name: `${repo.owner}/${repo.repo}` };
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
    base: { ref: "main", repo: repository },
  };
  const files = [{ filename: "www/package-lock.json" }];
  const artifacts = [
    {
      id: 789,
      name: `swa-site-${run.head_sha}`,
      expired: false,
      digest: `sha256:${"b".repeat(64)}`,
      size_in_bytes: 1024,
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
        listWorkflowRunArtifacts: "artifacts",
      },
      pulls: { get: async () => ({ data: pr }), listFiles: "files" },
      repos: { listPullRequestsAssociatedWithCommit: "prs" },
    },
    paginate: async (method) =>
      ({ artifacts, files, prs: [{ number: pr.number }] })[method],
  };
  return { github, repo, run, pr, artifacts, files };
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
