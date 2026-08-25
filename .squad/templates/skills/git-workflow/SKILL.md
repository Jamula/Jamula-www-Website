---
name: git-workflow
description: Jamula main-only issue, worktree, pull-request, and CI/CD workflow.
---

# Jamula Git Workflow

## Branch model

- `main` is the only persistent branch, authoritative integration branch, release branch, and production CI/CD source.
- Do not create or target a persistent `dev` branch.
- Work starts from current `origin/main` on a short-lived issue branch.
- Issue branches use `squad/{issue-number}-{kebab-case-slug}` when created by Squad.

## Required flow

1. Create or identify the GitHub issue.
2. Fetch `origin` and create an isolated worktree/branch from `origin/main` or the explicitly approved temporary integration branch.
3. Record issue scope, artifact ownership, dependencies, model/settings, and acceptance criteria.
4. Commit only issue-owned paths.
5. Push and open a PR to the approved base.
6. Use `Refs #...` for child PRs targeting a temporary integration branch. Close the child issue explicitly after incorporation.
7. Use `Closes #...` only for a PR targeting `main`.
8. Use Agent Merge only for authorized readiness work. Agent Merge never merges.
9. Keep top-level delivery PRs draft until Cyrus approves the exact head SHA. Any new commit invalidates approval.
10. Repository automation may merge after the recorded approval and required reviews/checks pass.
11. Archive the session and remove the worktree/branch after incorporation and recorded cleanup.

## CI/CD

- Pull requests run validation and may create ephemeral previews.
- Only a merge to protected `main` can deploy production.
- Use path filters so docs/Squad-only changes do not deploy the website.
- Record deployment SHA/artifact/configuration and preserve a tested rollback target.

## Safety

- Never rewrite a shared branch or a branch with an open PR.
- Preserve dirty work with a named stash SHA and content inventory; apply, verify, commit, push, then drop only the exact verified stash.
- Never use destructive reset/checkout to discard user work.
- Never commit secrets, personal data, machine-local paths, or unrelated files.
