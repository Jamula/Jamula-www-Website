# Work Routing

Seven owns coordination and routing, not implementation or project artifacts. Route each work item
to one accountable specialist; bring in a reviewer or on-demand support role only when a concrete
quality or risk gate requires it.

## Routing Table

| Work Type | Route To | Examples |
|-----------|----------|----------|
| Architecture and technical design | Spock | system boundaries, technical options, ADRs, security/privacy design |
| Implementation and engineering | Spock | website changes, bug fixes, tests, build and deployment changes |
| Independent code review | Data | code and configuration review, test evidence, security/privacy risks |
| Documentation and evidence | Uhura | repository docs, user-facing content drafts, operational guidance, evidence links |
| Issue triage and delivery coordination | Seven | clarify outcome, split work, assign owner, resolve blockers, track approval gates |

Spock does not approve their own work. Data is the independent code reviewer. Public claims remain
subject to the specific evidence, professional-review, and Cyrus approval gates in `PRODUCT.md`
and the applicable `docs/` policies.

## Issue Routing

| Label | Action | Who |
|-------|--------|-----|
| `squad` | Triage: analyze the issue and assign it to Seven for coordination or directly to the best-fit specialist | Seven |
| `squad:seven` | Coordinate the issue, then hand the work to an accountable specialist; Seven does not implement it | Seven |
| `squad:{name}` | Own the assigned specialist work and meet its acceptance criteria | Named specialist |

### How Issue Assignment Works

1. When a GitHub issue gets the `squad` label, Seven triages it, clarifies the desired outcome, and assigns the next action to one specialist.
2. Issues labeled `squad:seven` are coordination work only. Seven must hand implementation to Spock, review to Data, or documentation to Uhura.
3. When a specialist `squad:{name}` label is applied, that specialist owns the issue work. Keep Data independent from the implementation author.
4. Reassign work by removing the current specialist label and adding the correct one; preserve Seven's coordination role without making her the artifact owner.
5. The `squad` label is the inbox for untriaged issues awaiting Seven's coordination.

## Rules

1. **Move quickly with one clear owner.** Define the smallest useful deliverable, acceptance criteria, and next gate; avoid speculative work and unnecessary handoffs.
2. **Coordinate, do not produce.** Seven may clarify, prioritize, route, track, and request decisions, but does not write or modify project artifacts.
3. **Parallelize only when it reduces elapsed time.** Work must be independent, bounded, and have clear outputs; do not duplicate effort or spawn agents preemptively.
4. **Keep review independent.** Data reviews Spock's implementation; no author may approve their own work. Route material security/privacy risks to Data and use on-demand support for additional bounded safeguards when warranted.
5. **Use support roles on demand.** Scribe runs only when accepted durable decisions need merging; Rai and Fact Checker run only for relevant gates; Ralph runs only when Cyrus requests monitoring.
6. **Cost is a hard gate.** Prefer zero marginal cost. Stop and obtain Cyrus's explicit approval before any new incremental spend, including metered AI/model usage, APIs, cloud resources, paid tiers, or subscriptions. Use already-approved entitlements with cost-aware defaults.
7. **Respect repository delivery constraints.** Protect customer privacy and security, accessibility, truthful claims, professional review, exact-head Cyrus approval, and `main` as the sole production source.
8. **Escalate uncertainty early.** Present evidence, tradeoffs, cost, risk, and the smallest decision needed; do not invent facts or silently expand scope.
