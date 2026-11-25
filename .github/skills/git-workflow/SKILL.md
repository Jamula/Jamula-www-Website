---
name: "git-workflow"
description: "Jamula branching and delivery model: protected main-only workflow, isolated worktrees, secretless PR previews, and manual workflow_dispatch releases"
domain: "version-control"
confidence: "high"
source: "team-decision"
---

## Context

`Jamula/Jamula-www-Website` uses a **single persistent branch (`main`)** governed by [`CONTRIBUTING.md`](../../../CONTRIBUTING.md), [`docs/architecture/two-free-static-apps.md`](../../../docs/architecture/two-free-static-apps.md), and [`docs/architecture/platform-portability.md`](../../../docs/architecture/platform-portability.md).

There are **no** `dev`, `preview`, or `insiders` branches in this repository, and no npm package promotion pipeline.

| Surface | Source / Trigger | Production Impact |
|---------|------------------|-------------------|
| `main` | Only persistent branch; all PRs target `main` | Merging to `main` **never** auto-deploys to production |
| Production release | Manual, owner-authorized `workflow_dispatch` of `.github/workflows/azure-static-web-apps.yml` on `refs/heads/main` (`change_type=material` or `change_type=fix`), gated by `swa-deployment` | Deploys `jamula.net`, `www.jamula.net`, `jamula.com`, and `www.jamula.com` and publishes immutable `vMAJOR.MINOR.PATCH` GitHub Release |
| Pull-request preview | Secretless `prepare` + `build` jobs on PRs, followed by trusted `workflow_run` in `.github/workflows/azure-static-web-apps-preview.yml` | Ephemeral, isolated preview environment; **never** promoted by DNS or swapped into production |

## Branch Naming & Ownership

- **Squad / CLI issue branches:** `squad/{issue-number}-{kebab-case-slug}` (branched from `origin/main`).
- **Copilot App worktree sessions:** App-managed branches (such as `u/{owner}/{kebab-case-slug}`) branched from `origin/main`. Rename via the session `rename_branch` tool rather than raw `git branch -m`.
- **Single writer per PR branch:** Assign one integration owner and one writer to each delivery branch (they may be the same agent/session). Contributors work in isolated worktrees/branches and hand off changes; never perform concurrent writes to another session's branch.

## Workflow for Issue Work

1. **Start from a milestoned GitHub issue** (`M01 - Phase 1: Public website`, `M02 - Side-quests: Foundation`, `M03 - Side-quests: Features`, or `M04 - Side-quests: Operations & Release`) and branch from `origin/main`:
   ```bash
   git fetch origin main
   git checkout -b squad/{issue-number}-{slug} origin/main
   ```

2. **Make changes, validate locally, and stage intentionally:**
   ```bash
   # Website checks (when touching www/)
   npm --prefix www ci
   npm --prefix www run format:check
   npm --prefix www run build
   node www/scripts/test_built_site.mjs
   node --test www/tests/analytics-consent.test.mjs

   # Governance & .NET 10 validation checks (when touching docs, workflows, or scripts/)
   dotnet run --project scripts/validation/JamulaValidation.csproj --configuration Release -- validate-governance .
   dotnet run --project scripts/validation.tests/JamulaValidation.Tests.csproj --configuration Release
   git diff --check
   ```

3. **Commit with issue reference and required trailer:**
   ```bash
   git add -- path/to/intentionally-changed-file
   git diff --cached --stat
   git commit -m "feat: concise summary (#{issue-number})"
   ```

4. **Sync/rebase safely when updating your own PR branch:**
   Before rewriting branch history, fetch and observe the exact remote tip and push with an explicit lease—never force-update `main` or another session's branch:
   ```bash
   git fetch origin
   OBSERVED_SHA="$(git rev-parse origin/squad/{issue-number}-{slug})"
   git rebase origin/main
   git push --force-with-lease="refs/heads/squad/{issue-number}-{slug}:${OBSERVED_SHA}" origin "HEAD:squad/{issue-number}-{slug}"
   ```

5. **Open a pull request targeting `main`:**
   Follow [`.github/PULL_REQUEST_TEMPLATE.md`](../../../.github/PULL_REQUEST_TEMPLATE.md) in full (preserving all headings, checklists, and exact validation commands with pass/fail outcomes):
   ```bash
   gh pr create --base main --title "{description}" --body-file pr-body.md
   ```

6. **Review, exact-SHA approval, and cleanup:**
   - Ensure required checks (`Required PR Validation` and, when triggered by path filters, `Governance Validation`) and independent review pass.
   - Request Cyrus's approval only on the stable, published top-level PR head SHA. Any new commit invalidates prior SHA approval.
   - After merge to `main`, delete the short-lived branch and prune any completed worktree.

## Parallel Multi-Issue Work (Worktrees)

When coordinating multiple independent issues or sections simultaneously, give each agent an isolated `git worktree` off `origin/main` with explicit file-ownership boundaries so branches merge cleanly into `main`.

```bash
git fetch origin main
git worktree add ../jamula-94 -b squad/94-search-console-baseline origin/main
git worktree add ../jamula-95 -b squad/95-analytics-verification origin/main
```

Each agent operates strictly inside its own worktree root (`git rev-parse --show-toplevel`) and never edits files in the main checkout or a peer session's worktree.

### `.squad/` State in Worktrees (`two-layer` Backend)

This repository configures `stateBackend: "two-layer"` in `.squad/config.json`:
- Read and mutate mutable Squad state (`decisions.md`, agent `history.md`, audit trails, memory) via the `squad_state` MCP tools (`squad_state_read`, `squad_state_write`, `squad_state_append`, `memory-*`) rather than direct file edits to `.squad/decisions.md`, `.squad/decisions/inbox/**`, `.squad/agents/*/history.md`, `.squad/identity/**`, or `.squad/memory/**`.
- `.gitattributes` configures `merge=union` for append-only Squad logs/trails when tracked across branches.
- Never write secrets, `.env*` values, credentials, or personal email addresses into `.squad/` state or committed files (see [`.github/skills/secret-handling/SKILL.md`](../secret-handling/SKILL.md)).

### Worktree Cleanup After Merge

```bash
git worktree remove ../jamula-94
git worktree prune
git branch -d squad/94-search-console-baseline
git push origin --delete squad/94-search-console-baseline
```

## Stacked Pull Requests (Only When Genuinely Dependent)

Prefer one focused PR targeting `main`. Stack a child PR only when a real technical dependency makes review clearer:
- Verify the parent PR's approved revision before integrating or rebasing dependent work.
- If a parent's base or head changes, revalidate the child branch and obtain fresh applicable review.
- Never integrate unapproved or formally rejected work into a parent delivery branch.

## Anti-Patterns

- ❌ Creating or targeting `dev`, `preview`, or `insiders` branches (protected `main` is the only persistent branch)
- ❌ Expecting PR merges to auto-deploy production or promoting PR preview URLs via DNS
- ❌ Running `git push --force` without an exact observed-SHA `--force-with-lease`, or force-updating `main` / another session's branch
- ❌ Editing files in the main repository checkout or a peer agent's worktree
- ❌ Introducing Python scripts/workflows where `.NET 10` LTS or Node.js satisfies the requirement
- ❌ Treating a merged PR or prior-commit approval as valid after pushing a new commit SHA
