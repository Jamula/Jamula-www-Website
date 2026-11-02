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
- Prefer fleet mode when supported and useful for the task; decompose into independently verifiable work with one accountable owner per outcome. Use isolated worktrees for parallel implementation. Use stacked PRs when work has real dependencies and the stack improves reviewability; otherwise keep a single focused PR.
- Ask the user only for decisions that genuinely require them, including product or scope choices with materially different outcomes, paid spending, consequential production actions, public claims, or unresolved risks that cannot be safely mitigated.
- Preserve the required independent review and all repository branch-protection rules. Top-level PRs still require Cyrus to approve the exact head SHA before merge. Use Agent merge for review feedback, CI fixes, and conflict resolution when enabled; auto-merge only when the app/repository permits it and all required approvals and checks are satisfied. If an app setting requires the user, explain the exact action rather than retrying through another mechanism.
