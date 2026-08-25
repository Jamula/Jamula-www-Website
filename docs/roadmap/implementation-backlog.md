# Draft Implementation Backlog

**Status:** Docs-only proposal; do not create implementation issues or begin production work before Cyrus approves the recommendation and ownership matrix.

| Order | Draft epic | Proposed owner / reviewers | Depends on | Acceptance summary |
|---:|---|---|---|---|
| 1 | Close platform evidence and quotes | Geordi / Picard, Miles, Fact Checker | Decision framework approval | Current terms/quotes; synthetic host portability and WordPress restore; teardown; recommendation rerun |
| 2 | Content model and accessible design system | Dax / Uhura, Miles | ADR-001 proposal | Stable routes/schema, responsive components, WCAG manual matrix, transfer budgets, no-script baseline |
| 3 | Editorial, rights and claims workflow | Uhura / Dax, Sarek, Rai, Fact Checker | Professional/public wording decisions | Approval hashes, asset ledger, expiry, correction/takedown, channel controls; no claim bypass |
| 4 | Domain, DNS, mail and main-only delivery | Geordi / Miles, Fact Checker | Host selection | Both-domain TLS/redirect, DNSSEC/CAA, mail authentication, immutable artifact/provenance, rollback |
| 5 | Phase 1 contact, consent and observability | Geordi / Seven, Dax, Miles | 2-4 | Minimized form, anti-abuse/idempotency, reliable mail, GPC/consent, redacted telemetry, SLO/runbook |
| 6 | Phase 1 security/recovery release gate | Miles / all domain owners | 2-5 | SEC Phase 1 suite, clean-room restore, incident tabletop, accessibility/performance journeys |
| 7 | CRM and scheduling adapters | Seven / Geordi, Miles, Sarek, Dax | Phase 1 GA, vendor approval | CRM export/delete/suppression, Bookings/Teams flow, accessible fallback, reconciliation |
| 8 | Customer identity and tenant foundation | Seven / Miles, Sarek | Phase 2 controls | Entra spike, immutable tenant context, RBAC/step-up, two-tenant denial tests, audit/offboarding |
| 9 | OneDrive connector spike/implementation | Seven / Miles, Sarek, Rai, Fact Checker | 8 + approved tenant/registration | Inherit complete blocked packet tests; least scope, ACL/revocation/deletion, teardown |
| 10 | Google Drive connector spike/implementation | Seven / same | 8 + approved project/verification | `drive.file` proof, no mutation, changes/ACL/deletion, terms/quota, teardown |
| 11 | Box connector spike/implementation | Seven / same | 8 + approved enterprise/app | Per-item/downscope decision, rotating token, webhook/reconciliation, terms/quota, teardown |
| 12 | Read-only customer retrieval and AI | Seven / Miles, Rai, Sarek, Geordi | 8 and passing connector(s) | Tenant index/cache, ACL at retrieval, isolated parser, citations/no-answer, no actions/egress, kill switch |
| 13 | Phase 3 preview and GA verification | Miles / Seven, Dax, Fact Checker | 9-12 | Preview discloses subset; GA only after all three; cross-tenant, restore, SLO and accessibility evidence |
| 14 | Hosted billing facade | Seven / Geordi, Miles, Sarek | Professional/payment vendor approvals | Hosted redirect, tenant/amount step-up, webhooks, reconciliation, no PAN/CVC, export/exit |
| 15 | Phase 4 verification | Miles / Seven, Sarek, professionals | 14 | Full payment failure/tenant/accessibility/recovery suite; CPA/counsel/QSA/broker evidence |
| 16 | Public AI evaluation (optional and separate) | Seven / Rai, Dax, Sarek, Miles, Fact Checker; Cyrus gate | Phase 3 approved production evidence; protocol frozen before evaluation execution | P5-AI-01 through P5-AI-12; public-only rights-cleared corpus; disclosure/intended-use/harm/participation/accessibility evidence; no customer/private corpus, actions or arbitrary egress; unanimous explicit dispositions |

Each future issue must identify phase/journeys/control IDs, synthetic fixtures, exact versions, positive/negative/failure tests, evidence digest, cost, accessibility/security/privacy impact, rollback, teardown and blocked/professional gates.

## Epic 16: optional public-AI evidence work

Epic 16 does not authorize implementation or make public AI part of the committed roadmap. It starts only after Cyrus accepts the prerequisite Phase 3 production evidence. It must be decomposed into independently reviewable future issues that implement every hard gate in [`phase-gates.md`](phase-gates.md#phase-5-optional-public-ai-hard-evidence-gates):

1. **P5-AI-01 and P5-AI-11 — public-only boundary and shutdown:** independently test separate source/index/cache/credentials/telemetry/network controls, customer/private canaries, absence of actions/tools/arbitrary egress, budgets and narrow/global kill switches.
2. **P5-AI-02 — corpus manifest, rights and removal:** produce the versioned item-level provenance/rights/use manifest, approval trail, dispute/expiry handling, correction/removal SLO and derivative purge evidence. No unapproved item enters evaluation or release.
3. **P5-AI-03 and P5-AI-04 — use and transparency specification:** define intended users/tasks, supported locales, prohibited high-impact/professional/emergency uses, age handling, limitations, data-use/retention disclosure and accessible human alternatives.
4. **P5-AI-05 and P5-AI-06 — harm taxonomy and frozen evaluation:** obtain Rai approval for the taxonomy/red-team plan and predeclare release-candidate datasets, samples, rubric, raters, statistical method and grounded-quality, harmful-output, refusal, citation, locale/language and accessibility thresholds before execution.
5. **P5-AI-07 — participatory and accessible evaluation:** recruit and compensate representative intended/affected participants including disabled users; use accessible consent, participation and withdrawal; resolve findings without inferring sensitive traits.
6. **P5-AI-08 — contestability and correction:** implement and test accessible feedback, source challenge, appeal, escalation, correction/removal, status and human-support workflows that remain available when AI is shut down.
7. **P5-AI-09 — privacy-preserving evidence:** minimize and consent evaluation data, restrict access/retention, prevent small-cell/re-identification disclosure, test deletion/withdrawal and record only evidence needed for the gate.
8. **P5-AI-10 — change control and operations:** re-evaluate on every material model/provider/prompt/corpus/retrieval/moderation/disclosure/locale/telemetry/boundary change; monitor harm, canaries, citations, accessibility and spend; rehearse incident response and shutdown.
9. **P5-AI-12 — independent go/no-go packet:** bind evidence and limitations to the exact artifact/SHA. Rai, Dax, Sarek, Miles, Fact Checker and Cyrus must each record `approve`; any other or missing disposition blocks the optional phase. Sarek-identified counsel/professional review remains additional.

No Epic 16 item may weaken Phase 1-4 security, privacy, connector, accessibility, recovery or payment gates. Missing evidence is `blocked/deferred`, not a passing spike, and the required fallback is to omit public AI entirely.
