"use strict";

const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const { mkdtempSync, readFileSync, rmSync } = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { test } = require("node:test");

const template = path.resolve(__dirname, "../../.squad/templates/scripts/notes/write-note.ps1");
const fixture = path.join(__dirname, "write-note-fixture.ps1");
const step = (kind, exitCode = 0, output = "") => ({ kind, exitCode, output });
const initialFetch = step("fetch");
const missingNote = step("notes-show", 1, "no note found");

function runNote(overrides = {}) {
  const directory = mkdtempSync(path.join(os.tmpdir(), "write-note-test-"));
  const scenario = {
    agent: "DaTA",
    type: "decision",
    content: '{"decision":"Use \\"quoted\\" text","details":{"count":2}}',
    commit: "abcdef123456",
    remote: "test-remote",
    flags: ["Quiet"],
    steps: [],
    ...overrides,
  };
  try {
    const result = spawnSync(
      "pwsh",
      ["-NoLogo", "-NoProfile", "-NonInteractive", "-File", fixture, "-Template", template, "-FixtureDirectory", directory],
      {
        encoding: "utf8",
        timeout: 15000,
        env: {
          ...process.env,
          WRITE_NOTE_SCENARIO: Buffer.from(JSON.stringify(scenario)).toString("base64"),
        },
      },
    );
    if (result.error) throw result.error;
    let events = [];
    try {
      events = readFileSync(path.join(directory, "events.jsonl"), "utf8")
        .trim().split(/\r?\n/).map((line) => JSON.parse(line));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    return { result, events, scenario, directory };
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

function verifyNote(event, operation, directory) {
  assert.deepEqual(event.args.slice(0, 5), [
    "-C", directory, "notes", "--ref=squad/data", operation,
  ]);
  assert.equal(event.args[5], "-m");
  assert.equal(event.args[7], "abcdef123456");
  assert.equal(event.args.length, 8);
  const note = JSON.parse(event.args[6]);
  assert.equal(note.agent, "Data");
  assert.equal(note.type, "decision");
  assert.equal(note.decision, 'Use "quoted" text');
  assert.deepEqual(note.details, { count: 2 });
  assert.match(note.timestamp, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  return note;
}

test("WriteNote_InvalidJsonAndType_StopBeforeGit", () => {
  for (const overrides of [{ content: "{invalid" }, { type: "not-a-type" }]) {
    const { result, events } = runNote(overrides);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /valid JSON|ValidateSet/i);
    assert.deepEqual(events, []);
  }
});

test("WriteNote_MissingNote_AddsFlagsAndDoesNotPush", () => {
  const { result, events, directory } = runNote({
    flags: ["Quiet", "Promote", "Archive", "NoPush"],
    steps: [initialFetch, missingNote, step("notes-add")],
  });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(events.map((event) => event.kind), ["fetch", "notes-show", "notes-add"]);
  assert.deepEqual(events[0].args, ["-C", directory, "fetch", "test-remote", "refs/notes/*:refs/notes/*"]);
  assert.deepEqual(events[1].args, ["-C", directory, "notes", "--ref=squad/data", "show", "abcdef123456"]);
  const note = verifyNote(events[2], "add", directory);
  assert.equal(note.promote_to_permanent, true);
  assert.equal(note.archive_on_close, true);
});

test("WriteNote_ExistingNote_AppendsAndPushesNamespace", () => {
  const { result, events, directory } = runNote({
    steps: [initialFetch, step("notes-show", 0, "existing note"), step("notes-append"), step("push")],
  });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(events.map((event) => event.kind), ["fetch", "notes-show", "notes-append", "push"]);
  const note = verifyNote(events[2], "append", directory);
  assert.equal(Object.hasOwn(note, "promote_to_permanent"), false);
  assert.equal(Object.hasOwn(note, "archive_on_close"), false);
  assert.deepEqual(events[3].args, [
    "-C", directory, "push", "test-remote", "refs/notes/squad/data:refs/notes/squad/data",
  ]);
});

test("WriteNote_PushConflict_FetchesReappendsAndRetries", () => {
  const { result, events, directory } = runNote({
    steps: [initialFetch, missingNote, step("notes-add"), step("push", 1, "rejected"),
      step("fetch"), step("notes-append"), step("push")],
  });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(events.map((event) => event.kind), [
    "fetch", "notes-show", "notes-add", "push", "fetch", "notes-append", "sleep", "push",
  ]);
  assert.deepEqual(events[4].args, [
    "-C", directory, "fetch", "test-remote", "refs/notes/squad/data:refs/notes/squad/data",
  ]);
  verifyNote(events[5], "append", directory);
  assert.equal(events[5].args[6], events[2].args[6]);
  assert.equal(events[6].seconds, 1);
  assert.deepEqual(events[7].args, events[3].args);
});

test("WriteNote_WriteFailure_ReportsErrorWithoutPush", () => {
  const { result, events } = runNote({
    steps: [initialFetch, missingNote, step("notes-add", 1, "write failed")],
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Failed to write note to refs\/notes\/squad\/data on abcdef123456/);
  assert.deepEqual(events.map((event) => event.kind), ["fetch", "notes-show", "notes-add"]);
});

test("WriteNote_NonConflictPushFailure_FailsAfterFiveAttempts", () => {
  const { result, events, directory } = runNote({
    steps: [initialFetch, missingNote, step("notes-add"),
      ...Array.from({ length: 5 }, () => step("push", 1, "permission denied"))],
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Failed to push notes to test-remote after 5 attempts/);
  assert.match(result.stderr, /refs\/notes\/squad\/data/);
  assert.match(result.stderr, /permission denied/);
  assert.deepEqual(events.map((event) => event.kind), [
    "fetch", "notes-show", "notes-add", "push", "push", "push", "push", "push",
  ]);
  for (const event of events.slice(3)) {
    assert.deepEqual(event.args, ["-C", directory, "push", "test-remote", "refs/notes/squad/data:refs/notes/squad/data"]);
  }
});

test("WriteNote_ConflictPushFailure_FailsAfterFiveAttempts", () => {
  const { result, events, directory } = runNote({
    steps: [initialFetch, missingNote, step("notes-add"),
      ...Array.from({ length: 5 }, () => [
        step("push", 1, "rejected"), step("fetch"), step("notes-append"),
      ]).flat()],
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Failed to push notes to test-remote after 5 attempts/);
  assert.match(result.stderr, /refs\/notes\/squad\/data/);
  assert.match(result.stderr, /rejected/);
  assert.deepEqual(events.map((event) => event.kind), [
    "fetch", "notes-show", "notes-add",
    ...Array.from({ length: 5 }, () => ["push", "fetch", "notes-append", "sleep"]).flat(),
  ]);
  const originalNote = events[2].args[6];
  for (let i = 0; i < 5; i++) {
    const [push, fetch, append, sleep] = events.slice(3 + 4 * i, 7 + 4 * i);
    assert.deepEqual(push.args, ["-C", directory, "push", "test-remote", "refs/notes/squad/data:refs/notes/squad/data"]);
    assert.deepEqual(fetch.args, ["-C", directory, "fetch", "test-remote", "refs/notes/squad/data:refs/notes/squad/data"]);
    verifyNote(append, "append", directory);
    assert.equal(append.args[6], originalNote);
    assert.equal(sleep.seconds, 2 ** i);
  }
});

test("WriteNote_FinalPushAttemptSucceeds_ExitsSuccessfully", () => {
  const { result, events } = runNote({
    steps: [initialFetch, missingNote, step("notes-add"),
      ...Array.from({ length: 4 }, () => step("push", 1, "permission denied")), step("push")],
  });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(events.map((event) => event.kind), [
    "fetch", "notes-show", "notes-add", "push", "push", "push", "push", "push",
  ]);
});

test("WriteNote_UnexpectedGitCommand_FailsClosed", () => {
  const { result, events } = runNote({ steps: [] });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Unexpected git command/);
  assert.deepEqual(events, []);
});
