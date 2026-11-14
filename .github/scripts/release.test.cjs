const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { selectRelease, metadata, verifyMetadata } = require("./release.cjs");
const { execute } = require("./production-deployment.cjs");

const sha = "a".repeat(40);
const oldSha = "b".repeat(40);
const tag = (version, revision = oldSha) => ({
  name: `v${version}`,
  commit: { sha: revision },
});
const release = (version) => ({
  tag_name: `v${version}`,
  draft: false,
  prerelease: false,
});

test("required PR validation builds and tests explicit release and versionless modes", () => {
  const workflow = fs
    .readFileSync(
      path.join(__dirname, "../workflows/required-pr-validation.yml"),
      "utf8",
    )
    .replace(/\r\n/g, "\n");
  assert.match(workflow, /^    name: required-pr-validation$/m);
  const steps = workflow.split("\n      - name: ");
  const names = [
    "Build static website",
    "Test generated website contracts",
    "Test website behavior regressions",
    "Build versionless preview website",
    "Test versionless preview contracts",
    "Test versionless preview behavior regressions",
  ];
  const commands = [
    "npm exec -- astro build",
    "node scripts/test_built_site.mjs",
    "node --test tests/*.test.mjs",
  ];
  let previousIndex = -1;
  for (const [index, name] of names.entries()) {
    const matches = steps.filter((step) => step.startsWith(`${name}\n`));
    assert.equal(matches.length, 1, `${name} must run exactly once`);
    const step = matches[0];
    const stepIndex = steps.indexOf(step);
    assert.ok(
      stepIndex > previousIndex,
      `${name} must follow the previous mode step`,
    );
    previousIndex = stepIndex;
    assert.match(
      step,
      /^        if: steps\.changes\.outputs\.website == 'true'$/m,
    );
    assert.match(step, /^        env:$/m);
    if (index === 2) {
      assert.match(step, /^        run: >-\n          node --experimental-test-coverage --test\n          --test-coverage-include=public\/analytics-consent\.js\n          --test-coverage-lines=90 --test-coverage-branches=90\n          tests\/\*\.test\.mjs$/m);
    } else {
      assert.ok(step.includes(`\n        run: ${commands[index % 3]}\n`));
    }
    const version = index < 3 ? "0.1.0" : "";
    assert.ok(
      step.includes(`\n          PUBLIC_RELEASE_VERSION: "${version}"\n`),
    );
    if (index < 3) {
      assert.doesNotMatch(step, /EXPECT_NO_RELEASE/);
    } else if (index > 3) {
      assert.match(step, /^          EXPECT_NO_RELEASE: "1"$/m);
    }
  }
});

test("first material release establishes baseline; fix requires history", () => {
  assert.equal(selectRelease([], [], "material", sha).version, "0.1.0");
  assert.throws(() => selectRelease([], [], "fix", sha), /No release exists/);
});

test("required PR validation preserves build contracts and measured behavior coverage", () => {
  const workflow = fs
    .readFileSync(
      path.join(__dirname, "../workflows/required-pr-validation.yml"),
      "utf8",
    )
    .replace(/\r\n/g, "\n");
  assert.match(workflow, /^    name: required-pr-validation$/m);
  const steps = workflow.split("\n      - name: ");
  const names = [
    "Build static website",
    "Test generated website contracts",
    "Test website behavior regressions",
  ];
  const commands = [
    "npm exec -- astro build",
    "node scripts/test_built_site.mjs",
    null,
  ];
  let previousIndex = -1;
  for (const [index, name] of names.entries()) {
    const matches = steps.filter((step) => step.startsWith(`${name}\n`));
    assert.equal(matches.length, 1, `${name} must run exactly once`);
    const step = matches[0];
    const stepIndex = steps.indexOf(step);
    assert.ok(
      stepIndex > previousIndex,
      `${name} must follow the previous mode step`,
    );
    previousIndex = stepIndex;
    assert.match(
      step,
      /^        if: steps\.changes\.outputs\.website == 'true'$/m,
    );
    if (index % 3 === 2) {
      assert.match(
        step,
        /^        run: >-\n          node --experimental-test-coverage --test\n          --test-coverage-include=public\/analytics-consent\.js\n          --test-coverage-lines=90 --test-coverage-branches=90\n          tests\/\*\.test\.mjs$/m,
      );
    } else {
      assert.ok(step.includes(`\n        run: ${commands[index % 3]}\n`));
    }
    assert.doesNotMatch(step, /EXPECT_NO_RELEASE/);
  }
});

test("increments highest release numerically, not API order", () => {
  const tags = [tag("0.2.9"), tag("0.10.2"), tag("0.1.0")];
  const releases = ["0.2.9", "0.10.2", "0.1.0"].map(release);
  assert.equal(
    selectRelease(tags, releases, "material", sha).version,
    "0.10.3",
  );
  assert.equal(selectRelease(tags, releases, "fix", sha).version, "0.10.2");
  assert.equal(selectRelease(tags, releases, "fix", sha).releaseSha, oldSha);
  assert.equal(selectRelease(tags, releases, "fix", oldSha).releaseSha, oldSha);
});

test("fails closed on ambiguous or malformed release history", () => {
  for (const [tags, releases] of [
    [[tag("0.1.0")], []],
    [[], [release("0.1.0")]],
    [[tag("0.1.0")], [{ ...release("0.1.0"), draft: true }]],
    [[tag("0.1.0")], [{ ...release("0.1.0"), prerelease: true }]],
    [[tag("01.1.0")], []],
    [[tag("0.0.9")], [release("0.0.9")]],
    [[tag("0.1.0"), tag("0.1.0")], [release("0.1.0")]],
    [[tag("0.1.0", sha)], [release("0.1.0")]],
    [[tag("0.1.0", "bad")], [release("0.1.0")]],
    [[tag("0.1.9007199254740991")], [release("0.1.9007199254740991")]],
  ]) {
    assert.throws(() => selectRelease(tags, releases, "material", sha));
  }
  assert.throws(() => selectRelease([], [], "other", sha));
  assert.throws(() => selectRelease([], [], "material", "bad"));
});

test("selection detects changed release history including moved tags", () => {
  const before = selectRelease([tag("0.1.0")], [release("0.1.0")], "fix", sha);
  const moved = selectRelease(
    [tag("0.1.0", sha)],
    [release("0.1.0")],
    "fix",
    sha,
  );
  assert.notEqual(before.fingerprint, moved.fingerprint);
});

test("deployment records associate release and actual SHA with both app statuses", () => {
  for (const app of ["net", "com"])
    for (const change of ["material", "fix"]) {
      const calls = [];
      const env = {
        GITHUB_REPOSITORY: "test/repo",
        GITHUB_SERVER_URL: "https://github.com",
        DEPLOYMENT_SHA: sha,
        RELEASE_VERSION: "0.1.0",
        GITHUB_RUN_ID: "2",
        RELEASE_ATTEMPT: "1",
        CHANGE_TYPE: change,
        DEPLOYMENT_APP: app,
        GITHUB_OUTPUT: "out",
      };
      const request = (endpoint, body) => {
        calls.push({ endpoint, body });
        return "42";
      };
      let output = "";
      execute("start", [], env, request, (_, value) => {
        output += value;
      });
      execute(
        "status",
        ["42", "success", `https://${app}.example`],
        env,
        request,
      );
      execute("status", ["42", "failure", ""], env, request);
      assert.equal(output, "id=42\n");
      assert.equal(calls[0].endpoint, "repos/test/repo/deployments");
      assert.equal(calls[0].body.ref, sha);
      assert.equal(calls[0].body.environment, `production-${app}`);
      assert.deepEqual(calls[0].body.payload, {
        release_tag: "v0.1.0",
        release_url: "https://github.com/test/repo/releases/tag/v0.1.0",
        deployed_sha: sha,
        run_id: "2",
        build_attempt: "1",
        change_type: change,
      });
      assert.deepEqual(
        calls.slice(1).map(({ body }) => body.state),
        ["in_progress", "success", "failure"],
      );
      assert.equal(calls[2].body.environment_url, `https://${app}.example`);
      assert.deepEqual(calls.slice(2), [
        {
          endpoint: "repos/test/repo/deployments/42/statuses",
          body: {
            state: "success",
            log_url: "https://github.com/test/repo/actions/runs/2",
            auto_inactive: false,
            environment_url: `https://${app}.example`,
          },
        },
        {
          endpoint: "repos/test/repo/deployments/42/statuses",
          body: {
            state: "failure",
            log_url: "https://github.com/test/repo/actions/runs/2",
            auto_inactive: false,
          },
        },
      ]);
    }
});

test("deployment record must exist before its in-progress status and output survives status failure", () => {
  const env = {
    GITHUB_REPOSITORY: "test/repo",
    GITHUB_SERVER_URL: "https://github.com",
    DEPLOYMENT_SHA: sha,
    RELEASE_VERSION: "0.1.0",
    GITHUB_RUN_ID: "1",
    RELEASE_ATTEMPT: "1",
    CHANGE_TYPE: "fix",
    DEPLOYMENT_APP: "net",
    GITHUB_OUTPUT: "out",
  };
  let output = "",
    count = 0;
  assert.throws(
    () =>
      execute(
        "start",
        [],
        env,
        () => {
          if (++count === 2) throw Error("status failed");
          return "42";
        },
        (_, value) => {
          output += value;
        },
      ),
    /status failed/,
  );
  assert.equal(output, "id=42\n");
  assert.throws(() => execute("status", ["42", "invalid", ""], env, () => {}));
});

test("deployment record rejects invalid identity and status before any side effects", () => {
  const env = {
    GITHUB_REPOSITORY: "test/repo",
    GITHUB_SERVER_URL: "https://github.com",
    DEPLOYMENT_SHA: sha,
    RELEASE_VERSION: "0.1.0",
    GITHUB_RUN_ID: "2",
    RELEASE_ATTEMPT: "1",
    CHANGE_TYPE: "fix",
    DEPLOYMENT_APP: "net",
    GITHUB_OUTPUT: "out",
  };
  const invalid = [
    ["DEPLOYMENT_SHA", "A".repeat(40)],
    ["DEPLOYMENT_SHA", "a".repeat(39)],
    ["RELEASE_VERSION", "01.1.0"],
    ["RELEASE_VERSION", "1.0.0-rc.1"],
    ["GITHUB_RUN_ID", "0"],
    ["GITHUB_RUN_ID", "01"],
    ["RELEASE_ATTEMPT", "0"],
    ["RELEASE_ATTEMPT", "01"],
    ["CHANGE_TYPE", "other"],
    ["DEPLOYMENT_APP", "org"],
  ];
  let effects = 0;
  const effect = () => {
    effects++;
  };
  for (const [key, value] of invalid) {
    assert.throws(
      () => execute("start", [], { ...env, [key]: value }, effect, effect),
      /Invalid production deployment identity/,
      key,
    );
  }
  for (const args of [
    ["0", "success"],
    ["01", "failure"],
    ["42", "pending"],
    [],
  ]) {
    assert.throws(
      () => execute("status", args, env, effect, effect),
      /Invalid deployment status/,
    );
  }
  assert.throws(
    () => execute("unknown", [], env, effect, effect),
    /Unknown deployment command/,
  );
  assert.equal(effects, 0);
});

test("deployment record stops on create, invalid ID, and output failures", () => {
  const env = {
    GITHUB_REPOSITORY: "test/repo",
    GITHUB_SERVER_URL: "https://github.com",
    DEPLOYMENT_SHA: sha,
    RELEASE_VERSION: "0.1.0",
    GITHUB_RUN_ID: "2",
    RELEASE_ATTEMPT: "1",
    CHANGE_TYPE: "material",
    DEPLOYMENT_APP: "com",
    GITHUB_OUTPUT: "out",
  };
  for (const [scenario, result, expected] of [
    ["create failure", new Error("create failed"), ["request"]],
    ["invalid ID", "0", ["request"]],
    ["output failure", "42", ["request", "append"]],
  ]) {
    const events = [];
    assert.throws(
      () =>
        execute(
          "start",
          [],
          env,
          () => {
            events.push("request");
            if (result instanceof Error) throw result;
            return result;
          },
          () => {
            events.push("append");
            throw new Error("output failed");
          },
        ),
      scenario === "invalid ID" ? /Invalid deployment ID/ : /failed/,
      scenario,
    );
    assert.deepEqual(events, expected, scenario);
  }
});

test("deployment record GitHub adapter posts JSON and propagates command failures", () => {
  const script = `
    const calls = [], output = [];
    require("node:child_process").execFileSync = (command, args, options) => {
      calls.push({ command, args, options });
      if (calls.length === 3) throw new Error("gh failed");
      return calls.length === 1 ? " 42\\n" : "\\n";
    };
    const { execute } = require(process.argv[1]);
    const env = {
      GITHUB_REPOSITORY: "test/repo",
      GITHUB_SERVER_URL: "https://github.com",
      DEPLOYMENT_SHA: "a".repeat(40),
      RELEASE_VERSION: "0.1.0",
      GITHUB_RUN_ID: "2",
      RELEASE_ATTEMPT: "1",
      CHANGE_TYPE: "fix",
      DEPLOYMENT_APP: "net",
      GITHUB_OUTPUT: "out",
    };
    execute("start", [], env, undefined, (file, value) => output.push([file, value]));
    let error;
    try { execute("status", ["42", "failure"], env); } catch (e) { error = e.message; }
    process.stdout.write(JSON.stringify({ calls, output, error }));
  `;
  const result = spawnSync(
    process.execPath,
    ["-e", script, path.join(__dirname, "production-deployment.cjs")],
    { encoding: "utf8" },
  );
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
  const { calls, output, error } = JSON.parse(result.stdout);
  assert.deepEqual(output, [["out", "id=42\n"]]);
  assert.equal(calls.length, 3);
  assert.equal(calls[0].command, "gh");
  assert.deepEqual(calls[0].args, [
    "api",
    "--method",
    "POST",
    "repos/test/repo/deployments",
    "--input",
    "-",
    "--jq",
    ".id",
  ]);
  assert.deepEqual(JSON.parse(calls[0].options.input), {
    ref: sha,
    auto_merge: false,
    required_contexts: [],
    environment: "production-net",
    production_environment: true,
    description: "Jamula net deployment for v0.1.0",
    payload: {
      release_tag: "v0.1.0",
      release_url: "https://github.com/test/repo/releases/tag/v0.1.0",
      deployed_sha: sha,
      run_id: "2",
      build_attempt: "1",
      change_type: "fix",
    },
  });
  assert.deepEqual(calls[1].args, [
    "api",
    "--method",
    "POST",
    "repos/test/repo/deployments/42/statuses",
    "--input",
    "-",
  ]);
  assert.deepEqual(JSON.parse(calls[1].options.input), {
    state: "in_progress",
    log_url: "https://github.com/test/repo/actions/runs/2",
    auto_inactive: false,
  });
  assert.equal(calls[1].options.encoding, "utf8");
  assert.deepEqual(calls[1].options.stdio, ["pipe", "pipe", "inherit"]);
  assert.equal(error, "gh failed");
});

test("deployment record CLI rejects unknown commands without contacting GitHub", () => {
  const result = spawnSync(
    process.execPath,
    [path.join(__dirname, "production-deployment.cjs"), "unknown"],
    { encoding: "utf8" },
  );
  assert.ifError(result.error);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unknown deployment command/);
});

test("live metadata must match version, revision and build run attempt", () => {
  const expected = metadata("0.1.0", sha, "123", "2");
  verifyMetadata(JSON.parse(JSON.stringify(expected)), expected);
  for (const [key, value] of Object.entries({
    version: "0.1.1",
    revision: oldSha,
    run: "124",
    attempt: "1",
  })) {
    assert.throws(() =>
      verifyMetadata({ ...expected, [key]: value }, expected),
    );
  }
  assert.throws(() => metadata("v0.1.0", sha, "123", "2"));
  assert.throws(() => metadata("0.1.0", sha, "0", "2"));
  assert.throws(() => verifyMetadata(null, expected));
});

test("release CLI selects history from paginated JSON files", () => {
  const directory = fs.mkdtempSync(path.join(process.cwd(), "release-cli-"));
  try {
    const tagsFile = path.join(directory, "tags.json");
    const releasesFile = path.join(directory, "releases.json");
    fs.writeFileSync(tagsFile, JSON.stringify([[tag("0.1.0")]]));
    fs.writeFileSync(releasesFile, JSON.stringify([[release("0.1.0")]]));
    const result = spawnSync(
      process.execPath,
      [
        path.join(__dirname, "release.cjs"),
        "select",
        tagsFile,
        releasesFile,
        "material",
        sha,
      ],
      { encoding: "utf8" },
    );
    assert.equal(result.status, 0, result.stderr);
    const selection = JSON.parse(result.stdout);
    assert.equal(selection.version, "0.1.1");
    assert.equal(selection.releaseSha, oldSha);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("release CLI writes and verifies exact deployment metadata", () => {
  const directory = fs.mkdtempSync(path.join(process.cwd(), "release-cli-"));
  const metadataFile = path.join(directory, "release.json");
  try {
    const command = (name) =>
      spawnSync(
        process.execPath,
        [
          path.join(__dirname, "release.cjs"),
          name,
          metadataFile,
          "0.1.0",
          sha,
          "123",
          "2",
        ],
        { encoding: "utf8" },
      );
    const written = command("write");
    assert.equal(written.status, 0, written.stderr);
    assert.deepEqual(JSON.parse(fs.readFileSync(metadataFile, "utf8")), {
      version: "0.1.0",
      revision: sha,
      run: "123",
      attempt: "2",
    });
    const verified = command("verify");
    assert.equal(verified.status, 0, verified.stderr);
    fs.writeFileSync(metadataFile, JSON.stringify({ version: "0.1.1" }));
    const stale = command("verify");
    assert.equal(stale.status, 1);
    assert.match(stale.stderr, /does not match this deployment/);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("release CLI rejects unknown commands and malformed history JSON", () => {
  const unknown = spawnSync(
    process.execPath,
    [path.join(__dirname, "release.cjs"), "unknown"],
    { encoding: "utf8" },
  );
  assert.equal(unknown.status, 1);
  assert.match(unknown.stderr, /Unknown release command/);

  const directory = fs.mkdtempSync(path.join(process.cwd(), "release-cli-"));
  try {
    const invalidFile = path.join(directory, "invalid.json");
    fs.writeFileSync(invalidFile, "{");
    const malformed = spawnSync(
      process.execPath,
      [
        path.join(__dirname, "release.cjs"),
        "select",
        invalidFile,
        invalidFile,
        "material",
        sha,
      ],
      { encoding: "utf8" },
    );
    assert.equal(malformed.status, 1);
    assert.match(malformed.stderr, /JSON|Unexpected end/);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("release wiring preserves isolation, serialization and publication ordering", () => {
  const workflow = fs
    .readFileSync(
      path.join(__dirname, "../workflows/azure-static-web-apps.yml"),
      "utf8",
    )
    .replace(/\r\n/g, "\n");
  const prepare = workflow.split("\n  prepare:")[1].split("\n  build:")[0];
  const publish = workflow.split("\n  publish:")[1];
  assert.doesNotMatch(workflow, /^  push:/m);
  assert.match(workflow, /cancel-in-progress:.*pull_request/);
  assert.match(workflow, /\|\| 'production'/);
  assert.match(prepare, /Non-main or stale release revision[\s\S]*exit 1/);
  assert.match(workflow, /name: swa-site-\$\{\{ env\.DEPLOYMENT_SHA \}\}/);
  assert.match(publish, /needs: \[prepare, build, deploy, deploy-com\]/);
  assert.match(publish, /contents: write/);
  assert.match(
    workflow.split("\n  publish:")[0],
    /permissions:\n  contents: read/,
  );
  assert.ok(
    publish.indexOf('for url in "$NET_URL" "$COM_URL"') <
      publish.indexOf("gh api --method POST"),
  );
  assert.ok(
    publish.indexOf("gh api --method POST") <
      publish.indexOf("gh release create"),
  );
  for (const name of ["deploy", "deploy-com"]) {
    const body = workflow.split(`\n  ${name}:`)[1].split(/\n  [\w-]+:/)[0];
    assert.match(body, /github\.event_name == 'workflow_dispatch'/);
    assert.match(body, /github\.ref == 'refs\/heads\/main'/);
    assert.match(body, /environment: swa-deployment/);
    assert.ok(
      body.indexOf("Require current main revision") <
        body.indexOf("Record production deployment"),
    );
    assert.ok(
      body.indexOf("Record production deployment") <
        body.indexOf("Deploy prebuilt site"),
    );
    assert.ok(
      body.indexOf("Deploy prebuilt site") < body.indexOf("release.cjs verify"),
    );
    assert.match(body, /deployments: write/);
    assert.match(body, /if: always\(\) && steps\.record\.outputs\.id != ''/);
    assert.match(body, /steps\.verify\.outcome/);
  }
});

test("publication fails before writing on stale identity, main or history", () => {
  const workflow = fs
    .readFileSync(
      path.join(__dirname, "../workflows/azure-static-web-apps.yml"),
      "utf8",
    )
    .replace(/\r\n/g, "\n");
  const publish = workflow.split("\n  publish:")[1];
  const script = publish
    .match(/        run: \|\n([\s\S]*)/)[1]
    .replace(/^          /gm, "");
  for (const [scenario, overrides, expected] of [
    ["success", {}, [true, true]],
    ["fix reuse", { CHANGE_TYPE: "fix", TEST_EXISTING: "1" }, [false, false]],
    ["fix moved tag", { CHANGE_TYPE: "fix", TEST_EXISTING: "1", TEST_MOVED: "1" }, [false, false]],
    ["stale site", { TEST_VERSION: "0.0.9" }, [false, false]],
    ["stale main", { TEST_MAIN: oldSha }, [false, false]],
    ["changed history", { TEST_HISTORY: "1" }, [false, false]],
    ["release creation failure", { TEST_FAILURE: "1" }, [true, false]],
  ]) {
    const directory = fs.mkdtempSync(path.join(process.cwd(), "release-test-"));
    try {
      fs.mkdirSync(path.join(directory, ".github/scripts"), {
        recursive: true,
      });
      fs.copyFileSync(
        path.join(__dirname, "release.cjs"),
        path.join(directory, ".github/scripts/release.cjs"),
      );
      const shell = `
        curl() {
          while [[ $# -gt 0 ]]; do
            if [[ "$1" == "--output" ]]; then file="$2"; shift 2; else shift; fi
          done
          printf '{"version":"%s","revision":"%s","run":"1","attempt":"1"}' "\${TEST_VERSION:-0.1.0}" "$DEPLOYMENT_SHA" > "$file"
        }
        gh() {
          case "$*" in
            *git/ref/heads/main*) printf '%s\\n' "\${TEST_MAIN:-$DEPLOYMENT_SHA}" ;;
            *tags?per_page=100*)
              if [[ -n "\${TEST_HISTORY:-}\${TEST_EXISTING:-}" ]]; then printf '[[{"name":"v0.1.0","commit":{"sha":"%s"}}]]' "$TEST_MAIN_HISTORY"; else printf '[[]]'; fi ;;
            *releases?per_page=100*)
              if [[ -n "\${TEST_HISTORY:-}\${TEST_EXISTING:-}" ]]; then printf '[[{"tag_name":"v0.1.0","draft":false,"prerelease":false}]]'; else printf '[[]]'; fi ;;
            *git/refs*) : > tag-created ;;
            release\\ create*) [[ -z "\${TEST_FAILURE:-}" ]] || return 1; : > release-created ;;
            *) return 99 ;;
          esac
        }
        ${script}
      `;
      const result = spawnSync("bash", ["-c", shell], {
        cwd: directory,
        encoding: "utf8",
        env: {
          ...process.env,
          ...overrides,
          DEPLOYMENT_SHA: sha,
          TEST_MAIN_HISTORY: overrides.TEST_MOVED ? sha : oldSha,
          RELEASE_VERSION: "0.1.0",
          RELEASE_ATTEMPT: "1",
          GITHUB_RUN_ID: "1",
          GITHUB_REPOSITORY: "test/repo",
          GITHUB_STEP_SUMMARY: "summary.txt",
          NET_URL: "https://net.example",
          COM_URL: "https://com.example",
          CHANGE_TYPE: overrides.CHANGE_TYPE || "material",
          RELEASE_SELECTION: JSON.stringify(
            selectRelease(
              overrides.TEST_EXISTING ? [tag("0.1.0")] : [],
              overrides.TEST_EXISTING ? [release("0.1.0")] : [],
              overrides.CHANGE_TYPE || "material",
              sha,
            ),
          ),
        },
      });
      assert.ifError(result.error);
      assert.equal(
        result.status === 0,
        ["success", "fix reuse"].includes(scenario),
        result.stderr,
      );
      assert.deepEqual(
        ["tag-created", "release-created"].map((file) =>
          fs.existsSync(path.join(directory, file)),
        ),
        expected,
        scenario,
      );
    } finally {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  }
});
