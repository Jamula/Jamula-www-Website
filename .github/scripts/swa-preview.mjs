import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const BUILD_PATH = ".github/workflows/azure-static-web-apps.yml";
const SHA_PATTERN = /^[a-f0-9]{40}(?![\s\S])/;
const MAX_ARTIFACT_BYTES = 100 * 1024 * 1024;

export async function selectPreview(github, repo, run) {
  const repository = `${repo.owner}/${repo.repo}`;
  if (
    run.event !== "pull_request" ||
    run.conclusion !== "success" ||
    run.head_repository?.full_name !== repository ||
    !SHA_PATTERN.test(run.head_sha)
  ) {
    return {
      action: "skip",
      reason: "Not a successful same-repository PR run.",
    };
  }

  const { data: workflow } = await github.rest.actions.getWorkflow({
    ...repo,
    workflow_id: "azure-static-web-apps.yml",
  });
  if (run.workflow_id !== workflow.id || workflow.path !== BUILD_PATH) {
    throw new Error(
      "The build run does not belong to the trusted build workflow.",
    );
  }

  let candidates = run.pull_requests ?? [];
  if (candidates.length === 0) {
    candidates = await github.paginate(
      github.rest.repos.listPullRequestsAssociatedWithCommit,
      { ...repo, commit_sha: run.head_sha, per_page: 100 },
    );
  }
  const matching = [];
  for (const candidate of candidates) {
    const { data: pr } = await github.rest.pulls.get({
      ...repo,
      pull_number: candidate.number,
    });
    if (
      pr.head.repo?.full_name === repository &&
      pr.base.repo?.full_name === repository &&
      pr.base.ref === "main" &&
      pr.head.sha === run.head_sha &&
      pr.head.ref === run.head_branch
    ) {
      matching.push(pr);
    }
  }
  if (matching.length === 0) {
    return {
      action: "skip",
      reason: "The PR head, repository, or target has changed.",
    };
  }
  if (matching.length !== 1) {
    throw new Error("The build run is associated with multiple current PRs.");
  }
  const pr = matching[0];
  if (!Number.isSafeInteger(pr.number) || pr.number <= 0) {
    throw new Error("The API returned an invalid PR number.");
  }
  if (pr.state === "closed") {
    return { action: "close", pr, sha: run.head_sha };
  }
  if (pr.state !== "open") {
    throw new Error("The API returned an unexpected PR state.");
  }

  const files = await github.paginate(github.rest.pulls.listFiles, {
    ...repo,
    pull_number: pr.number,
    per_page: 100,
  });
  if (files.length >= 3000) {
    throw new Error(
      "The PR file list may be truncated; refusing preview selection.",
    );
  }
  if (
    !files.some(
      (file) =>
        file.filename.startsWith("www/") ||
        file.previous_filename?.startsWith("www/") ||
        file.filename === BUILD_PATH ||
        file.previous_filename === BUILD_PATH,
    )
  ) {
    return { action: "close", pr, sha: run.head_sha };
  }

  const artifacts = await github.paginate(
    github.rest.actions.listWorkflowRunArtifacts,
    {
      ...repo,
      run_id: run.id,
      per_page: 100,
    },
  );
  const site = artifacts.filter(
    (artifact) =>
      artifact.name === `swa-site-${run.head_sha}` && !artifact.expired,
  );
  if (
    site.length !== 1 ||
    !Number.isSafeInteger(site[0].id) ||
    site[0].id <= 0 ||
    !/^sha256:[a-f0-9]{64}$/.test(site[0].digest ?? "") ||
    site[0].size_in_bytes <= 0 ||
    site[0].size_in_bytes > MAX_ARTIFACT_BYTES ||
    site[0].workflow_run?.id !== run.id ||
    site[0].workflow_run?.head_sha !== run.head_sha
  ) {
    throw new Error(
      "A unique, current, SHA-bound deployment artifact is required.",
    );
  }
  return { action: "upload", pr, sha: run.head_sha, artifact: site[0] };
}

export function writePreviewEvent(selection, repository, destination) {
  if (!["upload", "close"].includes(selection.action)) {
    throw new Error("Only a selected PR may produce a deployment event.");
  }
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(
    destination,
    JSON.stringify({
      action: selection.action === "close" ? "closed" : "synchronize",
      number: selection.pr.number,
      pull_request: selection.pr,
      repository,
    }),
  );
}

export function previewEnvironment(selection, repository) {
  const { pr, sha, action } = selection;
  if (
    !["upload", "close"].includes(action) ||
    !Number.isSafeInteger(pr?.number) ||
    pr.number <= 0 ||
    String(pr.number).length > 16 ||
    !SHA_PATTERN.test(sha ?? "") ||
    pr.head?.sha !== sha ||
    pr.head?.repo?.full_name !== repository ||
    pr.base?.repo?.full_name !== repository ||
    pr.base?.ref !== "main" ||
    !SHA_PATTERN.test(pr.base?.sha ?? "") ||
    !pr.head?.ref ||
    pr.head.ref === "main" ||
    !["open", "closed"].includes(pr.state) ||
    (action === "upload" && pr.state !== "open")
  ) {
    throw new Error(
      "A valid current same-repository PR is required for a non-production environment.",
    );
  }
  return String(pr.number);
}

export async function runPreviewGate({
  github,
  context,
  core,
  eventDestination = ".preview/event.json",
  archiveDestination = ".preview/site.zip",
}) {
  const { data: run } = await github.rest.actions.getWorkflowRun({
    ...context.repo,
    run_id: context.payload.workflow_run.id,
  });
  const selection = await selectPreview(github, context.repo, run);
  core.setOutput("action", selection.action);
  if (selection.action === "skip") {
    await core.summary.addRaw(selection.reason).write();
    return selection;
  }
  previewEnvironment(selection, `${context.repo.owner}/${context.repo.repo}`);
  writePreviewEvent(selection, context.payload.repository, eventDestination);
  core.setOutput("number", selection.pr.number);
  core.setOutput("sha", selection.sha);
  if (selection.action === "upload") {
    const archive = await github.rest.actions.downloadArtifact({
      ...context.repo,
      artifact_id: selection.artifact.id,
      archive_format: "zip",
    });
    const bytes = Buffer.from(archive.data);
    if (bytes.length > MAX_ARTIFACT_BYTES) {
      throw new Error("The artifact archive exceeds the size limit.");
    }
    const digest = `sha256:${crypto.createHash("sha256").update(bytes).digest("hex")}`;
    if (digest !== selection.artifact.digest) {
      throw new Error(
        "The artifact archive digest does not match GitHub metadata.",
      );
    }
    fs.mkdirSync(path.dirname(archiveDestination), { recursive: true });
    fs.writeFileSync(archiveDestination, bytes);
    core.setOutput("digest", digest);
  }
  return selection;
}

export async function runPreviewRecheck({
  github,
  context,
  core,
  action,
  eventPath = ".preview/event.json",
}) {
  const saved = JSON.parse(fs.readFileSync(eventPath, "utf8"));
  const { data: pr } = await github.rest.pulls.get({
    ...context.repo,
    pull_number: saved.number,
  });
  const current =
    pr.number === saved.number &&
    pr.number === saved.pull_request.number &&
    pr.head.sha === saved.pull_request.head.sha &&
    pr.head.repo?.full_name === saved.pull_request.head.repo.full_name &&
    pr.head.ref === saved.pull_request.head.ref &&
    pr.base.repo?.full_name === `${context.repo.owner}/${context.repo.repo}` &&
    pr.base.ref === "main" &&
    pr.base.sha === saved.pull_request.base.sha &&
    pr.state === saved.pull_request.state;
  core.setOutput("deploy", current);
  if (current) {
    core.setOutput(
      "environment",
      previewEnvironment(
        { action, pr, sha: saved.pull_request.head.sha },
        `${context.repo.owner}/${context.repo.repo}`,
      ),
    );
  } else {
    await core.summary
      .addRaw("Preview not changed: the PR changed after artifact selection.")
      .write();
  }
  return current;
}
