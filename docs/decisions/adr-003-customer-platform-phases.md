# ADR-003: Customer Platform Phase Boundaries

**Status:** Proposed
**Date:** 2026-08-25
**Approval:** Pending Cyrus approval of this exact artifact SHA; no customer-platform vendor is selected

## Context

CRM, scheduling, customer identity, storage connectors, customer AI, payments, and optional public AI have different risk, evidence, staffing, contract, and professional-review needs. Combining them would weaken reversibility and make missing evidence difficult to isolate.

## Options

1. Deploy one suite across CRM, scheduling, identity, files, AI, and payments.
2. Build a custom customer platform in one release.
3. Keep the exact Phase 1-5 boundaries and make each later capability independently gated.
4. Defer all customer capabilities indefinitely.

## Proposed decision

Adopt option 3 as a proposed boundary model, subject to the [authoritative phase gates](../roadmap/phase-gates.md):

1. **Phase 1 — public:** public content, contact, canonical/redirect, consent, accessibility, security, monitoring, and recovery; no customer accounts.
2. **Phase 2 — CRM/scheduling:** exportable leads/history and suppression, with staff controls and tested outage/rollback behavior.
3. **Phase 3 preview/GA — customer portal:** dedicated identity and tenant keys, read-only customer files and AI; preview exposes only passing connector packets, while GA requires OneDrive, Google Drive, and Box.
4. **Phase 4 — hosted payments:** invoices, deposits/milestones, and recurring arrangements through hosted flows; no raw card handling.
5. **Phase 5 — optional public AI:** a separate public-only corpus, index/cache, telemetry, budget, and kill switch; no customer/private corpus, CRM/payment data, actions, or arbitrary egress.

The phase model does not authorize production or select a vendor.

## Vendor posture

### Phase 2

The CRM shortlist is unranked: HubSpot, Zoho CRM, and Dynamics 365 Sales. The scheduling shortlist is unranked: Microsoft Bookings/Teams, Zoom Scheduler, and a qualifying CRM-native scheduler.

HubSpot and Microsoft Bookings dynamic entitlement, price, contract, DPA/region, export/deletion, cancellation, and integration evidence remains blocked. No CRM or scheduling option is selected until an exact packet and symmetric export, deletion, outage, rollback, reconciliation, accessibility, and labor tests pass.

### Phase 3 connector custody

CRM identifiers must never become identity subjects or tenant keys.

Microsoft and Google browser picker contexts may receive narrowly scoped, short-lived access tokens. Refresh tokens remain encrypted and server-only. Browser access tokens require memory-only handling, strict CSP and origin/message validation, audience/scope/lifetime validation, cleanup after selection, and tests for teardown, replay, revocation, telemetry leakage, cancellation, and cross-tenant isolation. Box browser-token custody is unresolved.

The exact future tests and blocked packet states are authoritative in [connector common contracts](../spikes/connectors/README.md), [OneDrive](../spikes/connectors/onedrive.md), [Google Drive](../spikes/connectors/google-drive.md), and [Box](../spikes/connectors/box.md). All three providers remain blocked. Preview may hide a provider that has not passed; GA may not waive any provider.

Customer AI remains read-only, cited, tenant-scoped, non-actioning, and without arbitrary egress. The [quality strategy](../security/quality-strategy.md) requires versioned, non-waivable evaluation cards and compensated participation by at least eight representative customers, including at least four disabled participants.

### Phase 4

Stripe, Square, PayPal, and an accounting-hosted invoice flow remain unranked, documentation-only payment options. No processor selection or comparative conclusion is adopted. Exact price, contract, cancellation, export, payout, dispute, regional, accessibility, and liability evidence plus future implementation tests must precede a decision.

### Phase 5

Public AI remains optional and absent unless P5-AI-01 through P5-AI-12 pass. Required evidence covers public-only isolation; corpus rights/provenance and removal; transparency; intended and prohibited uses; harm/fairness and locale evaluation; representative and disabled-user participation; accessible appeal/correction and human support; evaluation privacy; change control; and rehearsed narrow/global shutdown. Rai and every named reviewer and professional gate remain mandatory.

## Consequences and tradeoffs

### Positive

- Limits data, contract, operational, and blast-radius growth by phase.
- Preserves provider-level preview reversibility without weakening the all-three Phase 3 GA gate.
- Prevents CRM, connector, payment, or public-AI choices from silently determining identity or tenant architecture.
- Makes missing professional review a visible block.

### Negative

- Creates more integrations, evidence packets, and operational handoffs.
- Phase 3 GA and Phases 4-5 may remain delayed or absent.
- Separate identity and tenant controls increase cost and specialist labor.

## Reversibility, portability, and exit

Each phase must remain independently disableable. CRM/scheduler records, suppression state, customer identity, tenant membership, file grants, AI citations/evaluations, invoices, payment reconciliation, consent, audit, and rights records need documented export, deletion, reconciliation, and migration procedures. Provider IDs are adapters, never durable Jamula identity/tenant keys.

## Data export

Before a vendor decision, run synthetic export/import and deletion tests that verify usable formats, relationships, timestamps, suppression/consent, attachments, audit lineage, and reconciliation. Contractual portability claims remain documented research until tested.

## Cost and coverage

Phase reserves are separate from public-site TCO. The cumulative control-labor floors are 24 hours/month at Phase 2, 40 at Phase 3, 52 at Phase 4, and 62 at Phase 5 when Phase 4 is live. Phase 3 requires separately funded, currently unpriced 24x7 coverage; Phase 4 inherits it plus payment escalation. See [incident detection and response](../security/incident-detection-response.md) and the [cost model](../cost/cost-model.md).

## Confidence and dissent

**Confidence:** Medium on the phase separation; low on vendor outcomes while dynamic evidence and mechanism tests remain blocked.

Reasonable dissent: a single suite may reduce integration labor. It also concentrates exit, contract, identity, and outage risk that has not been evidenced.

## Reconsideration triggers

- Exact vendor terms or test evidence closes a blocked packet.
- A connector cannot pass custody, revocation, tenant-isolation, deletion, or recovery gates.
- Phase staffing or funded coverage cannot be sustained.
- Counsel, CPA, acquirer/QSA, broker, accessibility, privacy/security, Fact Checker, Responsible AI, or Cyrus blocks a phase.
- Scope changes would merge public AI with customer/private data or add raw-card handling; either requires a new ADR rather than an exception.
