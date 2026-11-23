# Work Routing

How to decide who handles what.

## Routing Table

| Work Type | Route To | Examples |
|-----------|----------|----------|

Preset installation adds concrete routes for the configured team. Add or edit rows
here only when their agent names also exist in the casting registry.

## Issue Routing

| Label | Action | Who |
|-------|--------|-----|
| `squad` | Triage: analyze issue, assign `squad:{member}` label | Lead |
| `squad:{name}` | Pick up issue and complete the work | Named member |

### How Issue Assignment Works

1. When a GitHub issue gets the `squad` label, the **Lead** triages it — analyzing content, assigning the right `squad:{member}` label, and commenting with triage notes.
2. When a `squad:{member}` label is applied, that member picks up the issue in their next session.
3. Members can reassign by removing their label and adding another member's label.
4. The `squad` label is the "inbox" — untriaged issues waiting for Lead review.

## Rules

1. **Eager by default** — spawn all agents who could usefully start work, including anticipatory downstream work.
2. **Scribe always runs** after substantial work, always as `mode: "background"`. Never blocks.
3. **Quick facts → coordinator answers directly.** Don't spawn an agent for "what port does the server run on?"
4. **When two agents could handle it**, pick the one whose domain is the primary concern.
5. **"Team, ..." → fan-out.** Spawn all relevant agents in parallel as `mode: "background"`.
6. **Anticipate downstream work.** If a feature is being built, spawn the tester to write test cases from requirements simultaneously.
7. **Issue-labeled work** — when a `squad:{member}` label is applied to an issue, route to that member. The Lead handles all `squad` (base label) triage.

## Work Type → Agent

| Work Type | Primary | Secondary |
|-----------|---------|----------|
| Coordination, handoffs, approval gates | Seven | — |
| Architecture and implementation | Spock | Data |
| Independent code review | Data | — |
| Documentation | Uhura | — |

## Project Guardrails

- This repository covers Jamula, Inc.'s canonical public website at Jamula.net and a phased customer experience for AI-native technology consulting and custom software; the delivery posture is Microsoft-preferred and multi-cloud capable.
- The current phase is platform evaluation. Requirements and architecture recommendations are proposed; no platform, vendor, implementation, deployment, or public claim is approved by those documents.
- `main` is the only persistent branch and sole production source. GitHub issues are the durable work ledger, and `docs/` is the project documentation source.
- Seven coordinates work and enforces handoffs and review gates; Seven does not implement code or author domain deliverables.
- Spock owns technical architecture and implementation. Prefer the latest supported .NET LTS for new tools and systems; use Node.js/JavaScript when .NET is not practical, and avoid Python when either is suitable.
- Data independently reviews Spock's code changes and must not author the same changes being reviewed. Changes are not complete until the review gate is satisfied.
- Uhura owns documentation work.
- Preserve quality, safety, security, and privacy. Get the user's approval before paid spending or consequential production actions.
- Work autonomously on reversible, in-scope tasks. Do not pause for routine implementation choices or ordinary workflow steps; make a reasonable decision, validate it, and report it.
- Proactively address PR feedback, failing tests and CI checks, and merge conflicts. Re-run the relevant checks after fixes, and continue until the work passes or a concrete blocker requires human authority or information.
- Prefer one focused PR. Use stacked PRs only for real dependencies that make review clearer. Before integrating a dependent PR, verify its approved revision and expected parent; if either its base or head changes, revalidate the child and obtain applicable review again. Never integrate unapproved or rejected work into a parent.
- Assign exactly one accountable integration owner and one writer to each PR branch; they may be the same person. The owner carries the PR through conflict resolution, authorized publication, and verification of the exact remote SHA. Contributors work on isolated branches/worktrees and hand off changes. Do not make concurrent writes to a delivery branch; only its owning session may mutate it.
- The owner may routinely sync/rebase and publish their own PR branch without asking Cyrus for each step. Before rewriting history, fetch and observe the exact current remote tip, then use `--force-with-lease=refs/heads/<branch>:<observed-sha>`. Never force-update `main` or another protected ref, another session's branch, or overwrite concurrent or unreviewed work. Stop for a concrete missing human authority/permission or unresolved content decision; ordinary rebases are not approval gates.
- Distinguish ordinary review comments and non-blocking follow-up from a formal reviewer rejection. Without a formal rejection, the owner/original author remains responsible for ordinary fixes. A formal rejection retains the existing strict lockout: a different author revises, followed by independent re-review.
- Request Cyrus's approval only when a stable, published top-level delivery head has independent review, required checks, and mergeability ready. Approval applies to that exact SHA; every new commit invalidates it and requires fresh approval. Keep independent review and all repository protections intact.
- Ask the user only for decisions that genuinely require them, including product or scope choices with materially different outcomes, paid spending, consequential production actions, public claims, or unresolved risks that cannot be safely mitigated.
- Preserve the required independent review and all repository branch-protection rules. Top-level PRs still require Cyrus to approve the exact head SHA before merge. Use Agent merge for review feedback, CI fixes, and conflict resolution when enabled; auto-merge only when the app/repository permits it and all required approvals and checks are satisfied. If an app setting requires the user, explain the exact action rather than retrying through another mechanism.
- Escalate a blocker with one actionable, evidence-backed request stating the decision or authority needed and the consequence; do not send repeated status pings. Continue independent work where possible.
