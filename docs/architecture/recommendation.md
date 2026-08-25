# Architecture Recommendation

**Status:** Proposed / pending Cyrus exact-SHA approval
**Evidence date:** 2026-08-25
**Decision scope:** What to do next, not which platform to buy or build

## Recommendation

Do **not** select a platform, framework, host, CMS, CRM, scheduler, connector, or payment processor from the current exploratory record. Cyrus did not preregister the rubric and shared workload before exploratory scoring, so every exact platform/plan combination remains unscored.

Approve only the decision rule and bounded evidence cycle under the [decision framework](decision-framework.md). Before any selection, freeze a closed candidate register in which every retained custom/static framework combination, managed WordPress, WordPress.com, self-hosted WordPress, Wix Studio, Webflow, Squarespace, and each other retained credible option has either (a) an exact named/versioned/plan/region/add-on fixture or (b) an approved evidence-based formal exclusion for a proven hard-gate failure. Every fixture uses the same `RWL-2026-08-25.3` 250-item corpus, journeys, hard gates, tests, evidence window, labor/TCO method, portability measures, and exit measures. This is a recommendation to gather decision-grade evidence, not a platform recommendation.

Use the corrected `RWL-2026-08-25.3` common fixture in [platform portability](platform-portability.md).

## Invariants

- Jamula.net is canonical.
- Jamula.com redirects over HTTPS while preserving path and query.
- Protected `main` is the sole production source; each release retains artifact/SHA provenance, rollback, and evidence.
- Phase boundaries in the [phase gates](../roadmap/phase-gates.md) remain exact.
- No document, spike, vendor statement, or planning envelope is represented as production proof.

## Phase posture

### Phase 1 — public site

Keep custom/static frameworks, Wix Studio, WordPress.com, managed WordPress, self-hosted WordPress, Webflow, Squarespace, and credible alternatives in the candidate record without a selected platform. Reserved fixture IDs in the framework are placeholders only and assert neither exact product details nor a completed run. Require the same corpus, journeys, evidence window, DNS/TLS, email-authentication, accessibility, performance, main-only delivery, observability, recovery, sustainability-evidence, labor/TCO, export, migration, portability, and exit tests.

Inaccessible, incomplete, dynamic, or unretrieved evidence cannot silently exclude
or penalize a candidate. It blocks selection until completed, unless direct current
evidence proves a preregistered hard-gate failure and the exact formal exclusion is
independently reviewed and approved by Cyrus. Selection is prohibited while any
retained candidate lacks either a completed symmetric fixture or that approved
exclusion.

### Phase 2 — CRM and scheduling

Use non-ordered shortlists:

- CRM: HubSpot, Zoho CRM, and Dynamics 365 Sales.
- Scheduling: Microsoft Bookings/Teams, Zoom Scheduler, and a qualifying CRM-native scheduler.

Dynamic entitlement, price, contract, DPA/region, export/deletion, cancellation, and supported-integration evidence remains blocked for HubSpot and Microsoft Bookings. No CRM or scheduler is selected until those packets and the Phase 2 exit tests pass.

### Phase 3 — customer portal, connectors, and read-only customer AI

Dedicated identity and tenant keys must not depend on CRM identifiers. Preview may expose only providers with passing packets; GA still requires OneDrive, Google Drive, and Box.

Microsoft and Google browser picker contexts may receive narrowly scoped, short-lived access tokens only. Refresh tokens remain encrypted and server-only. Browser access-token handling requires memory-only custody, CSP/origin/message restrictions, audience/scope/lifetime validation, teardown, revocation, replay, telemetry-leak, and cross-tenant tests. Box browser-token custody is unresolved. The authoritative tests and current blocks are in [connector common contracts](../spikes/connectors/README.md) and the [OneDrive](../spikes/connectors/onedrive.md), [Google Drive](../spikes/connectors/google-drive.md), and [Box](../spikes/connectors/box.md) packets.

Versioned, non-waivable AI evaluation cards and compensated participation by at least eight representative customers, including at least four disabled participants, are required by the [quality strategy](../security/quality-strategy.md).

### Phase 4 — hosted payments

Stripe, Square, PayPal, and an accounting-hosted invoice flow remain non-ordered, documentation-only options. No processor selection or value acceptance occurs before hosted-flow, amount/tenant, signature/replay/idempotency, reconciliation, refund/dispute/cancellation, no-card-log, accessibility, recovery, contract, counsel, CPA, acquirer/QSA, and broker gates pass.

### Phase 5 — optional public AI

Keep Phase 5 absent unless every P5-AI-01 through P5-AI-12 gate passes. The system must use an approved public-only corpus; establish rights/provenance and removal; disclose limitations and data use; constrain intended/prohibited uses; pass harm, fairness, locale, privacy, accessibility, appeal/correction, change-control, and shutdown evidence; and obtain separate Rai, Dax, Sarek, Miles, Fact Checker, Cyrus, and required professional dispositions.

## Cost posture

The [cost model](../cost/cost-model.md) provides public-site-only planning envelopes, not quotes or vendor comparisons:

| Public-site scenario | Monthly | Year 1 | Three years |
|---|---:|---:|---:|
| Lean | $1,425-$3,338 | $27.1k-$95.1k | $64.1k-$199.2k |
| Azure-aligned | $1,450-$3,875 | $29.4k-$113.5k | $67.0k-$230.5k |
| Growth | $1,750-$12,700 | $39.0k-$267.4k | $85.0k-$604.2k |

Do not use these ranges to award TCO credit. Comparable written quotes, renewal and overage terms, tax treatment, migration/exit estimates, and the approved workload are still required.

Phase 2-5 reserves are separate. The current cumulative control-labor floors are 14 hours/month for Phase 1, 24 for Phase 2, 40 for Phase 3, 52 for Phase 4, and 62 for Phase 5 when Phase 4 is live. Phase 3 additionally needs separately funded 24x7 coverage that is currently unpriced; Phase 4 inherits that coverage plus payment escalation. If Phase 4 is not live, Phase 5 inherits at least Phase 3 coverage and no alternate cumulative labor total is inferred.

Apply spend alerts, vendor caps where actually supported, application quotas, and rehearsed kill switches. Azure budgets are alerts and automation inputs, **not hard spending caps**.

## Cross-cutting authorities

- Classification-specific backup limits and the tombstone-aware quarantined restore model: [backup and recovery](../security/backup-recovery.md#authoritative-classification-specific-backup-schedule).
- Sole normative transfer and execution budgets: [Dax's performance gate](../experience/accessibility-seo-performance.md#6-performance-gate), including a <=900 KiB public aggregate and <=1,500 KiB interactive/authenticated aggregate.
- Staffing and coverage: [incident detection and response](../security/incident-detection-response.md).
- Privacy and rights: [data inventory](../privacy/data-inventory.md) and [data lifecycle](../privacy/data-lifecycle.md).

## Decisions still required

1. **Cyrus:** approve the exact `RWL-2026-08-25.3` and evidence-cycle SHA; exact fixtures/plans; time and quote budget; and later any platform or vendor decision SHA.
2. **Professionals and named reviewers:** provide the phase-specific counsel, CPA, broker/insurance, accessibility, privacy/security, acquirer/QSA, Fact Checker, and Responsible AI dispositions.
3. **Operators:** obtain dynamic quotes/terms and run future implementation tests; blocked evidence must remain retained and selection-blocking rather than inferred as failure, scored, penalized, or silently excluded.

**Confidence:** High on the neutral next step and phase invariants; low on any vendor or platform outcome until the evidence cycle and approvals complete.
