const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { test } = require("node:test");
const { spawnSync } = require("node:child_process");
const vm = require("node:vm");
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
  assert.match(productionWorkflow, /^on:\n  workflow_dispatch:\n  push:/m);
  assert.match(productionWorkflow, /DEPLOYMENT_SHA:.*\|\| github\.sha/);
  assert.match(productionWorkflow, /group: >-\n[\s\S]*?\|\| 'production'/);
});

for (const event of ["push", "workflow_dispatch"]) {
  test(`${event} production jobs require main and a selected artifact`, () => {
    assert.equal(jobEnabled("prepare", event, "refs/heads/main"), true);
    for (const ref of ["refs/heads/feature", "refs/tags/main"]) {
      assert.equal(jobEnabled("prepare", event, ref), false);
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
          .match(/        run: \|\n([\s\S]*)/)[1]
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
        assert.equal(result.status, 0, result.stderr);
        assert.equal(
          fs.readFileSync(path.join(directory, "output.txt"), "utf8").trim(),
          `should_deploy=${expected}`,
        );
      } finally {
        fs.rmSync(path.join(directory, "output.txt"), { force: true });
        fs.rmdirSync(directory);
      }
    });
  }
}

for (const event of ["push", "workflow_dispatch"]) {
  test(`${event} gate fails closed when latest main cannot be read`, () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "swa-production-"));
    try {
      const script = productionJobs.prepare
        .match(/        run: \|\n([\s\S]*)/)[1]
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
  for (const event of ["pull_request", "workflow_run", "schedule"]) {
    for (const name of ["deploy", "deploy-com"]) {
      assert.equal(jobEnabled(name, event, "refs/heads/main"), false);
    }
  }
  assert.equal(jobEnabled("prepare", "workflow_run", "refs/heads/main"), false);
  for (const name of ["prepare", "build"]) {
    assert.doesNotMatch(productionJobs[name], /secrets\.|environment:/);
  }
});
