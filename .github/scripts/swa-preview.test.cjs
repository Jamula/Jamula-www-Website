const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { test } = require("node:test");
const { spawnSync } = require("node:child_process");
const vm = require("node:vm");
const { selectPreview, writePreviewEvent } = require("./swa-preview.cjs");
const { assertConfiguredCsp } = require("./verify-swa-csp.cjs");

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

const staticWebAppConfig = path.join(
  __dirname,
  "../../www/public/staticwebapp.config.json",
);

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
  const headersDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "swa-csp-"));
  const headersPath = path.join(headersDirectory, "headers.txt");
  try {
    for (const response of [
      "HTTP/2 200\r\nX-Frame-Options: DENY\r\n",
      "HTTP/2 200\r\nContent-Security-Policy: one\r\nContent-Security-Policy: two\r\n",
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

test("both production verifiers compare live CSP against the built config", () => {
  for (const name of ["deploy", "deploy-com"]) {
    assert.match(
      productionJobs[name],
      /node \.github\/scripts\/verify-swa-csp\.cjs \\\n\s+www\/dist\/staticwebapp\.config\.json "\$headers"/,
    );
    assert.doesNotMatch(
      productionJobs[name],
      /expect_header "Content-Security-Policy"/,
    );
  }
});

for (const name of ["deploy", "deploy-com"]) {
  test(`${name} wires exact verifier checkout before artifact download and runs in isolation`, () => {
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
        "Deploy prebuilt site",
        "Verify live site",
      ],
    );
    assert.match(
      steps[0].body,
      /uses: actions\/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1/,
    );
    assert.match(steps[0].body, /ref: \$\{\{ env\.DEPLOYMENT_SHA \}\}/);
    assert.match(steps[0].body, /persist-credentials: false/);
    assert.match(steps[0].body, /\.github\/scripts\/verify-swa-csp\.cjs/);
    assert.match(steps[0].body, /sparse-checkout-cone-mode: false/);
    assert.match(
      steps[2].body,
      /uses: actions\/download-artifact@9000827ccba6bdab643e8b6fd33ac0654aef8333/,
    );
    assert.match(
      steps[2].body,
      /name: swa-site-\$\{\{ env\.DEPLOYMENT_SHA \}\}/,
    );
    assert.match(steps[2].body, /path: www\/dist/);
    assert.match(steps[5].body, /app_location: www\/dist/);
    assert.match(steps[5].body, /skip_app_build: true/);
    assert.match(
      steps[5].body,
      new RegExp(
        `azure_static_web_apps_api_token: \\$\\{\\{ secrets\\.SWA_${name === "deploy" ? "NET" : "COM"}_DEPLOYMENT_TOKEN \\}\\}`,
      ),
    );

    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "swa-isolated-"));
    try {
      // Model the two source actions in a fresh runner, not the build workspace.
      const revision = spawnSync("git", ["rev-parse", "HEAD"], {
        cwd: __dirname,
        encoding: "utf8",
      });
      assert.equal(revision.status, 0, revision.stderr);
      const verifier = spawnSync(
        "git",
        [
          "show",
          `${revision.stdout.trim()}:.github/scripts/verify-swa-csp.cjs`,
        ],
        { cwd: __dirname, encoding: "utf8" },
      );
      assert.equal(verifier.status, 0, verifier.stderr);
      fs.mkdirSync(path.join(directory, ".github/scripts"), {
        recursive: true,
      });
      fs.writeFileSync(
        path.join(directory, ".github/scripts/verify-swa-csp.cjs"),
        verifier.stdout,
      );
      fs.copyFileSync(
        path.join(__dirname, "release.cjs"),
        path.join(directory, ".github/scripts/release.cjs"),
      );
      assert.equal(fs.existsSync(path.join(directory, "www/public")), false);
      fs.mkdirSync(path.join(directory, "www/dist"), { recursive: true });
      const config = JSON.parse(fs.readFileSync(staticWebAppConfig, "utf8"));
      config.globalHeaders["Content-Security-Policy"] += "; object-src 'none'";
      fs.writeFileSync(
        path.join(directory, "www/dist/staticwebapp.config.json"),
        JSON.stringify(config),
      );
      fs.writeFileSync(
        path.join(directory, "home-headers.txt"),
        "HTTP/2 200\r\n" +
          Object.entries(config.globalHeaders)
            .map(([header, value]) => `${header}: ${value}\r\n`)
            .join(""),
      );
      fs.writeFileSync(
        path.join(directory, "old-headers.txt"),
        "HTTP/2 200\r\nContent-Security-Policy: default-src 'self'\r\n",
      );
      const scripts = steps
        .filter((step) => /        run:/.test(step.body))
        .map((step) =>
          step.body
            .split(/        run: (?:\|\n)?/)[1]
            .replace(/^          /gm, ""),
        )
        .join("\n");
      const shellScript = `
          gh() { printf '%s\\n' "$DEPLOYMENT_SHA"; }
          curl() {
            local headers="" output="" url=""
            while [[ $# -gt 0 ]]; do
              case "$1" in
                --dump-header) headers="$2"; shift 2 ;;
                --output) output="$2"; shift 2 ;;
                --proto|--write-out) shift 2 ;;
                https://*) url="$1"; shift ;;
                *) shift ;;
              esac
            done
            case "$url" in
              */release.json?*) release_ready=true; printf '{"version":"%s","revision":"%s","run":"1","attempt":"1"}\\n' "\${TEST_VERSION:-0.1.0}" "$DEPLOYMENT_SHA" > "$output" ;;
              */robots.txt) printf 'HTTP/2 200\\r\\nContent-Type: text/plain\\r\\n' > "$headers" ;;
              */__jamula_missing_route__) printf 'Page not found' > "$output"; printf '404' ;;
              */)
                if [[ "\${release_ready:-false}" == true ]]; then
                  cp home-headers.txt "$headers"
                  if [[ "\${TEST_BROKEN_HEADERS:-false}" == true ]]; then
                    sed -i 's/X-Frame-Options: DENY/X-Frame-Options: SAMEORIGIN/' "$headers"
                  fi
                else
                  cp old-headers.txt "$headers"
                fi
                printf '<title>Jamula</title>' > "$output" ;;
              *) return 93 ;;
            esac
          }
          ${scripts}
          `;
      const result = spawnSync("bash", ["-c", shellScript], {
        cwd: directory,
        encoding: "utf8",
        env: {
          ...process.env,
          DEPLOYMENT_TOKEN: "disposable-test-token",
          DEPLOYMENT_SHA: revision.stdout.trim(),
          DEPLOYED_URL:
            name === "deploy"
              ? "https://ashy-beach-033c7d01e.7.azurestaticapps.net"
              : "https://red-cliff-0ee064a1e.2.azurestaticapps.net",
          RELEASE_VERSION: "0.1.0",
          RELEASE_ATTEMPT: "1",
          GITHUB_RUN_ID: "1",
          GITHUB_REPOSITORY: "test/repo",
          ARTIFACT_DIGEST: "disposable-artifact-digest",
          GITHUB_EVENT_NAME: "push",
          GITHUB_STEP_SUMMARY: "summary.txt",
        },
      });
      assert.ifError(result.error);
      assert.equal(result.status, 0, result.stderr);
      const summary = fs.readFileSync(
        path.join(directory, "summary.txt"),
        "utf8",
      );
      assert.match(summary, /Verified Azure deployment/);
      assert.ok(summary.includes(revision.stdout.trim()));
      assert.match(summary, /disposable-artifact-digest/);
      const broken = spawnSync("bash", ["-c", shellScript], {
        cwd: directory,
        encoding: "utf8",
        env: {
          ...process.env,
          DEPLOYMENT_TOKEN: "disposable-test-token",
          DEPLOYMENT_SHA: revision.stdout.trim(),
          DEPLOYED_URL:
            name === "deploy"
              ? "https://ashy-beach-033c7d01e.7.azurestaticapps.net"
              : "https://red-cliff-0ee064a1e.2.azurestaticapps.net",
          RELEASE_VERSION: "0.1.0",
          RELEASE_ATTEMPT: "1",
          GITHUB_RUN_ID: "1",
          GITHUB_REPOSITORY: "test/repo",
          GITHUB_EVENT_NAME: "workflow_dispatch",
          GITHUB_STEP_SUMMARY: "broken-summary.txt",
          TEST_BROKEN_HEADERS: "true",
        },
      });
      assert.ifError(broken.error);
      assert.notEqual(broken.status, 0);
      assert.match(broken.stdout, /Unexpected X-Frame-Options header/);
      assert.equal(
        fs.existsSync(path.join(directory, "broken-summary.txt")),
        false,
      );
      const stale = spawnSync(
        "bash",
        ["-c", `sleep() { :; }\n${shellScript}`],
        {
          cwd: directory,
          encoding: "utf8",
          env: {
            ...process.env,
            DEPLOYMENT_TOKEN: "disposable-test-token",
            DEPLOYMENT_SHA: revision.stdout.trim(),
            DEPLOYED_URL:
              name === "deploy"
                ? "https://ashy-beach-033c7d01e.7.azurestaticapps.net"
                : "https://red-cliff-0ee064a1e.2.azurestaticapps.net",
            RELEASE_VERSION: "0.1.0",
            RELEASE_ATTEMPT: "1",
            GITHUB_RUN_ID: "1",
            GITHUB_REPOSITORY: "test/repo",
            GITHUB_EVENT_NAME: "workflow_dispatch",
            GITHUB_STEP_SUMMARY: "summary.txt",
            TEST_VERSION: "0.0.9",
          },
        },
      );
      assert.ifError(stale.error);
      assert.notEqual(stale.status, 0);
      assert.match(stale.stdout, /Live release metadata did not match/);
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
