import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const source = new URL("../../.squad/templates/skills/distributed-mesh/sync-mesh.sh", import.meta.url);
const auditedHash = "c8b8a75d4311686f6814bd18cafca04224cf705e713abed2f62c1478b280fe01";
const bash = process.platform === "win32" ? "C:\\Program Files\\Git\\bin\\bash.exe" : "/bin/bash";

const commands = {
  jq: `case "$1|$2|$3" in
  '-r|.squads | keys[]|mesh.json') printf '%s\\n' alpha beta ;;
  '-r|.squads."alpha".zone|mesh.json') echo local ;;
  '-r|.squads."beta".zone|mesh.json') echo remote-trusted ;;
  '-r|.squads | to_entries[] | select(.value.zone == "remote-trusted") | .key|mesh.json') echo team-one ;;
  '-r|.squads | to_entries[] | select(.value.zone == "remote-opaque") | .key|mesh.json') echo team-two ;;
  '-r|.squads."team-one".source|mesh.json') echo fixture-repo ;;
  '-r|.squads."team-one".ref // "main"|mesh.json') echo stable ;;
  '-r|.squads."team-one".sync_to|mesh.json') echo work/cache/trusted ;;
  '-r|.squads."team-two".source|mesh.json') echo fixture-contract ;;
  '-r|.squads."team-two".sync_to|mesh.json') echo work/cache/opaque ;;
  '-r|.squads."team-two".auth // ""|mesh.json') echo "\${FAKE_AUTH:-none}" ;;
  *) echo "unexpected jq query: $*" >&2; exit 97 ;;
esac`,
  git: `printf 'git' >> commands.log; printf ' <%s>' "$@" >> commands.log; echo >> commands.log
case "$*" in
  '-C work/cache/trusted pull --rebase --quiet'|'clone --quiet --depth 1 --branch stable fixture-repo work/cache/trusted')
    [ "\${FAKE_GIT_FAIL:-0}" = 0 ] ;;
  *) echo "unexpected git invocation" >&2; exit 97 ;;
esac`,
  curl: `IFS= read -r stdin_header
! IFS= read -r _
printf 'curl' >> commands.log; printf ' <%s>' "$@" >> commands.log
if [ -n "$stdin_header" ]; then printf ' stdin:<%s>' "$stdin_header" >> commands.log; fi
echo >> commands.log
case "$*|$stdin_header" in
  '--silent --fail --url fixture-contract -o work/cache/opaque/SUMMARY.md|') ;;
  '--silent --fail --header @- --url fixture-contract -o work/cache/opaque/SUMMARY.md|Authorization: Bearer test-token') ;;
  *) echo "unexpected curl invocation" >&2; exit 97 ;;
esac
[ "\${FAKE_CURL_FAIL:-0}" = 0 ] || exit 22
printf 'published contract\\n' > work/cache/opaque/SUMMARY.md`,
  mkdir: `case "$*" in
  '-p alpha'|'-p beta'|'-p work/cache'|'-p work/cache/opaque') exec /usr/bin/mkdir "$@" ;;
  *) echo "unexpected mkdir invocation" >&2; exit 97 ;;
esac`,
  dirname: `[ "$*" = work/cache/trusted ] || exit 97
echo work/cache`,
  tr: `[ "$*" = '[:lower:]- [:upper:]_' ] || exit 97
read -r value
[ "$value" = team-two ] || exit 97
echo TEAM_TWO`,
  printenv: `[ "$#" = 1 ] || exit 97
[ "$1" = TEAM_TWO_TOKEN ] || exit 97
if [ "\${TEAM_TWO_TOKEN+set}" = set ]; then
  printf '%s\\n' "$TEAM_TWO_TOKEN"
else
  exit 1
fi`,
  date: `[ "$#" = 0 ] || exit 97
echo fixture-date`,
};

function fixture(t, { spaceInPath = false } = {}) {
  const contents = readFileSync(source, "utf8").replace(/\r\n/g, "\n");
  assert.equal(createHash("sha256").update(contents).digest("hex"), auditedHash,
    "Shell source changed: audit all execution and fixture inputs before updating the hash");
  const root = mkdtempSync(path.join(os.tmpdir(), spaceInPath ? "mesh offline-" : "mesh-offline-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const bin = path.join(root, "bin");
  mkdirSync(bin);
  for (const [name, body] of Object.entries(commands)) {
    writeFileSync(path.join(bin, name), `#!/bin/bash\nset -eu\n${body}\n`, { mode: 0o755 });
  }
  writeFileSync(path.join(root, "sync-mesh.sh"), contents);
  writeFileSync(path.join(root, "mesh.json"), "{}\n");
  const shellBin = process.platform === "win32"
    ? `/${bin[0].toLowerCase()}${bin.slice(2).replaceAll("\\", "/")}`
    : bin;
  assert.match(shellBin, /^\/[a-zA-Z0-9_./~ -]+$/, "unsafe or unsupported temporary path");
  const run = (args = [], extra = {}) => {
    const env = {
      PATH: shellBin,
      HOME: root,
      ...(process.platform === "win32" ? { SYSTEMROOT: process.env.SYSTEMROOT, WINDIR: process.env.WINDIR } : {}),
      ...extra,
    };
    const preflight = `set -eu
PATH="$1"
export PATH
[ "$PATH" = "$1" ] || exit 95
for name in jq git curl mkdir dirname tr printenv date; do
  [ "$(command -v "$name")" = "$1/$name" ] || exit 96
done
shift
source ./sync-mesh.sh "$@"`;
    const result = spawnSync(bash, ["--noprofile", "--norc", "-c", preflight, "offline-test", shellBin, ...args], {
      cwd: root, env, encoding: "utf8", timeout: 30000, windowsHide: true,
    });
    assert.ifError(result.error);
    assert.notEqual(result.status, 95, "PATH isolation failed");
    assert.notEqual(result.status, 96, "fake-command interception failed");
    assert.doesNotMatch(result.stderr, /unexpected|command not found/);
    return result;
  };
  const read = (file) => readFileSync(path.join(root, file), "utf8");
  return { root, run, read };
}

test("MeshInit_MissingConfig_FailsWithoutCreatingState", (t) => {
  const f = fixture(t);
  const result = f.run(["--init", "missing.json"]);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /missing\.json not found/);
  assert.throws(() => f.read("README.md"), { code: "ENOENT" });
});

test("MeshInit_NewAndExistingState_CreatesThenPreservesFiles", (t) => {
  const f = fixture(t);
  const first = f.run(["--init"]);
  assert.equal(first.status, 0, first.stderr);
  assert.equal(f.read("alpha/SUMMARY.md"), "# alpha\n\n_No state published yet._\n");
  assert.match(f.read("README.md"), /- \*\*alpha\*\* \(Zone: local\)/);
  assert.match(f.read("README.md"), /- \*\*beta\*\* \(Zone: remote-trusted\)/);
  writeFileSync(path.join(f.root, "alpha", "SUMMARY.md"), "existing summary\n");
  writeFileSync(path.join(f.root, "README.md"), "existing readme\n");
  const second = f.run(["--init"]);
  assert.equal(second.status, 0, second.stderr);
  assert.equal(f.read("alpha/SUMMARY.md"), "existing summary\n");
  assert.equal(f.read("README.md"), "existing readme\n");
  assert.match(second.stdout, /alpha\/SUMMARY\.md exists \(skipped\)/);
});

test("MeshSync_TrustedCloneAndOpaqueFetch_UseFixtureCommands", (t) => {
  const f = fixture(t);
  const result = f.run();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(f.read("work/cache/opaque/SUMMARY.md"), "published contract\n");
  assert.equal(f.read("commands.log"),
    "git <clone> <--quiet> <--depth> <1> <--branch> <stable> <fixture-repo> <work/cache/trusted>\n" +
    "curl <--silent> <--fail> <--url> <fixture-contract> <-o> <work/cache/opaque/SUMMARY.md>\n");
  assert.match(result.stdout, /Mesh sync complete/);
});

test("MeshSync_PathWithSpaces_UsesFixtureCommandsOffline", (t) => {
  const f = fixture(t, { spaceInPath: true });
  assert.match(path.basename(f.root), /^mesh offline-/);
  const result = f.run();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(f.read("commands.log"),
    "git <clone> <--quiet> <--depth> <1> <--branch> <stable> <fixture-repo> <work/cache/trusted>\n" +
    "curl <--silent> <--fail> <--url> <fixture-contract> <-o> <work/cache/opaque/SUMMARY.md>\n");
  assert.equal(f.read("work/cache/opaque/SUMMARY.md"), "published contract\n");
});

test("MeshSync_TrustedPullAndBearerFetch_UseExistingCheckoutAndToken", (t) => {
  const f = fixture(t);
  mkdirSync(path.join(f.root, "work", "cache", "trusted", ".git"), { recursive: true });
  const result = f.run([], { FAKE_AUTH: "bearer", TEAM_TWO_TOKEN: "test-token" });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(f.read("commands.log"),
    "git <-C> <work/cache/trusted> <pull> <--rebase> <--quiet>\n" +
    "curl <--silent> <--fail> <--header> <@-> <--url> <fixture-contract> <-o> <work/cache/opaque/SUMMARY.md> stdin:<Authorization: Bearer test-token>\n");
  assert.equal(f.read("work/cache/opaque/SUMMARY.md"), "published contract\n");
});

test("MeshSync_CloneAndFetchFailure_WarnsAndWritesUnavailableSummary", (t) => {
  const f = fixture(t);
  const result = f.run([], { FAKE_GIT_FAIL: "1", FAKE_CURL_FAIL: "1" });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /team-one: clone failed \(unavailable\)/);
  assert.equal(f.read("commands.log"),
    "git <clone> <--quiet> <--depth> <1> <--branch> <stable> <fixture-repo> <work/cache/trusted>\n" +
    "curl <--silent> <--fail> <--url> <fixture-contract> <-o> <work/cache/opaque/SUMMARY.md>\n");
  assert.equal(f.read("work/cache/opaque/SUMMARY.md"), "# team-two — unavailable (fixture-date)\n");
});

test("MeshSync_PullFailureAndMissingBearerToken_UsesStaleAndNoHeader", (t) => {
  const f = fixture(t);
  mkdirSync(path.join(f.root, "work", "cache", "trusted", ".git"), { recursive: true });
  const result = f.run([], { FAKE_GIT_FAIL: "1", FAKE_AUTH: "bearer" });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /team-one: pull failed \(using stale\)/);
  assert.equal(f.read("commands.log"),
    "git <-C> <work/cache/trusted> <pull> <--rebase> <--quiet>\n" +
    "curl <--silent> <--fail> <--url> <fixture-contract> <-o> <work/cache/opaque/SUMMARY.md>\n");
  assert.equal(f.read("work/cache/opaque/SUMMARY.md"), "published contract\n");
});
