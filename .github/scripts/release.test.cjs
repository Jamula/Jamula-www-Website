const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { nextVersion, metadata, verifyMetadata } = require("./release.cjs");

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

test("first release uses baseline irrespective of selected bump", () => {
  for (const bump of ["patch", "minor", "major"])
    assert.equal(nextVersion([], [], bump, sha), "0.1.0");
});

test("increments highest release numerically, not API order", () => {
  const tags = [tag("0.2.9"), tag("0.10.2"), tag("0.1.0")];
  const releases = ["0.2.9", "0.10.2", "0.1.0"].map(release);
  assert.equal(nextVersion(tags, releases, "patch", sha), "0.10.3");
  assert.equal(nextVersion(tags, releases, "minor", sha), "0.11.0");
  assert.equal(nextVersion(tags, releases, "major", sha), "1.0.0");
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
    [[tag("9007199254740991.0.0")], [release("9007199254740991.0.0")]],
  ]) {
    assert.throws(() => nextVersion(tags, releases, "major", sha));
  }
  assert.throws(() => nextVersion([], [], "other", sha));
  assert.throws(() => nextVersion([], [], "patch", "bad"));
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

test("release wiring preserves isolation, serialization and publication ordering", () => {
  const workflow = fs.readFileSync(
    path.join(__dirname, "../workflows/azure-static-web-apps.yml"),
    "utf8",
  );
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
        body.indexOf("Deploy prebuilt site"),
    );
    assert.ok(
      body.indexOf("Deploy prebuilt site") < body.indexOf("release.cjs verify"),
    );
  }
});

test("publication fails before writing on stale identity, main or history", () => {
  const workflow = fs.readFileSync(
    path.join(__dirname, "../workflows/azure-static-web-apps.yml"),
    "utf8",
  );
  const publish = workflow.split("\n  publish:")[1];
  const script = publish
    .match(/        run: \|\n([\s\S]*)/)[1]
    .replace(/^          /gm, "");
  for (const [scenario, overrides, expected] of [
    ["success", {}, [true, true]],
    ["stale site", { TEST_VERSION: "0.0.9" }, [false, false]],
    ["stale main", { TEST_MAIN: oldSha }, [false, false]],
    ["changed history", { TEST_HISTORY: "1" }, [false, false]],
    ["release creation failure", { TEST_FAILURE: "1" }, [true, false]],
  ]) {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "release-test-"));
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
              if [[ -n "\${TEST_HISTORY:-}" ]]; then printf '[[{"name":"v0.1.0","commit":{"sha":"%s"}}]]' "$TEST_MAIN_HISTORY"; else printf '[[]]'; fi ;;
            *releases?per_page=100*)
              if [[ -n "\${TEST_HISTORY:-}" ]]; then printf '[[{"tag_name":"v0.1.0","draft":false,"prerelease":false}]]'; else printf '[[]]'; fi ;;
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
          TEST_MAIN_HISTORY: oldSha,
          RELEASE_VERSION: "0.1.0",
          RELEASE_ATTEMPT: "1",
          GITHUB_RUN_ID: "1",
          GITHUB_REPOSITORY: "test/repo",
          GITHUB_STEP_SUMMARY: "summary.txt",
          NET_URL: "https://net.example",
          COM_URL: "https://com.example",
          BUMP: "patch",
        },
      });
      assert.ifError(result.error);
      assert.equal(result.status === 0, scenario === "success", result.stderr);
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
