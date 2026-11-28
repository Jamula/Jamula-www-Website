import assert from "node:assert/strict";
import { test } from "node:test";
import { escalate } from "./uptime-alert.mjs";

function fixture(issues = []) {
  const created = [];
  const listForRepo = () => {};
  const repo = { owner: "Jamula", repo: "Jamula-www-Website" };
  const github = {
    rest: {
      issues: {
        listForRepo,
        create: async (input) => {
          created.push(input);
          return { data: { number: 42, html_url: "https://example.test/42" } };
        },
      },
    },
    paginate: async (method, options) => {
      assert.equal(method, listForRepo);
      assert.deepEqual(options, { ...repo, state: "open", per_page: 100 });
      return issues;
    },
  };
  return { github, repo, created };
}

test("creates an actionable alert for a scheduled failure", async () => {
  const f = fixture();
  const result = await escalate(
    f.github,
    f.repo,
    "https://example.test/run/123",
  );
  assert.equal(result.number, 42);
  assert.equal(f.created.length, 1);
  assert.match(f.created[0].body, /https:\/\/example\.test\/run\/123/);
  assert.match(
    f.created[0].body,
    /close this issue only when the failure is resolved/,
  );
  assert.match(
    f.created[0].body,
    /Do not deploy without separate authorization/,
  );
});

test("reuses the existing bot alert and ignores lookalike issues and pull requests", async () => {
  const alert = {
    title: "Scheduled hostname monitor failure",
    body: "<!-- jamula-uptime-monitor-alert -->",
    user: { login: "github-actions[bot]" },
    html_url: "https://example.test/existing",
  };
  const f = fixture([
    { ...alert, user: { login: "someone-else" } },
    { ...alert, pull_request: {} },
    { ...alert, body: "unrelated" },
    alert,
  ]);
  assert.equal(
    await escalate(f.github, f.repo, "https://example.test/run"),
    alert,
  );
  assert.deepEqual(f.created, []);
});

test("creates a fresh alert when no authentic open alert exists", async () => {
  const f = fixture([{ title: "Other", user: null, body: null }]);
  await escalate(f.github, f.repo, "https://example.test/run");
  assert.equal(f.created.length, 1);
});

test("surfaces API failures instead of reporting successful escalation", async () => {
  const f = fixture();
  f.github.paginate = async () => {
    throw new Error("list failed");
  };
  await assert.rejects(
    escalate(f.github, f.repo, "https://example.test/run"),
    /list failed/,
  );
  f.github.paginate = async () => [];
  f.github.rest.issues.create = async () => {
    throw new Error("create failed");
  };
  await assert.rejects(
    escalate(f.github, f.repo, "https://example.test/run"),
    /create failed/,
  );
});
