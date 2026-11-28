# Copilot instructions

## Technology preferences

- Prefer a currently supported .NET LTS release for new tools, utilities, and systems.
- If .NET is not a practical fit, prefer Node.js and JavaScript.
- Avoid Python for new tooling when .NET or Node.js can meet the requirement; use Python only when an existing tool or a clear technical constraint makes it the better fit.
- Follow existing repository architecture and explicit project requirements when they call for a different technology.

## Autonomous delivery

- Work through in-scope, reversible implementation tasks without pausing for routine choices or workflow steps. Make a reasonable decision, validate it, and report the result.
- Assign one integration owner and one writer per PR branch (they may be the same person); contributors work on isolated branches and hand off changes. The owner carries the PR through conflict resolution, authorized publication, and exact remote-SHA verification. Only the owning session mutates its delivery branch; no concurrent writes.
- Owners may routinely sync/rebase and publish their own PR branches without per-step Cyrus approval. Before rewriting history, fetch and observe the exact remote tip and use `--force-with-lease=refs/heads/<branch>:<observed-sha>`; never force-update protected refs, another session's branch, or concurrent/unreviewed work. Stop for concrete missing authority/permission or an unresolved content decision.
- Prefer one focused PR; stack only real dependencies that improve review. Before integrating a dependent PR, verify its approved revision and expected parent. If its base or head changes, revalidate the child and obtain applicable review again; never integrate unapproved or rejected work into a parent.
- Ordinary comments and non-blocking follow-up are not formal rejections: the owner/original author handles those fixes. A formal rejection retains the existing strict lockout requiring a different revising author and independent re-review.
- Request Cyrus's exact-SHA approval only once a stable, published top-level delivery head has independent review, required checks, and mergeability ready. Any new commit invalidates that approval. Preserve all independent-review and repository protections.
- Escalate a blocker through one actionable, evidence-backed request for the needed decision or authority; avoid repeated status pings and continue independent work where possible. When Agent merge is available, use it for review, CI, and conflict work, and merge only after all required approvals and checks pass. If the app requires the user to enable auto-merge, explain that setting and do not work around it.

## Branching, releases, and secrets

- Protected `main` is the only persistent branch; merges to `main` never auto-deploy to production. Production deployments run only via owner-authorized manual `workflow_dispatch` on `refs/heads/main`, while pull-request previews stay isolated and secretless on PR jobs.
- Never read or commit `.env`, `.env.local`, `.env.production`, or any secret-bearing `.env.*` file; inspect `.env.example`, `.env.sample`, `.env.template`, or `docs/` schemas instead, and never write credentials, tokens, private keys, or personal data to tracked files.

## Memory, history, and decisions

- Use native GitHub Copilot Memory (`store_memory` / `vote_memory`) for durable user-scoped workflow preferences and repository-scoped conventions backed by exact `path:line` citations.
- Use Copilot session history (`session_store_sql`) to look up prior sessions, approaches, and linked PR/issue context across sessions.
- Record durable architectural and governance decisions in `docs/decisions/` (ADRs and `approvals.md`) and track work in milestoned GitHub Issues (`M01`–`M05`).
