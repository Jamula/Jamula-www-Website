# ADR-005: Cost, Portability, and Lock-In Controls

**Status:** Proposed
**Date:** 2026-08-25
**Approval:** Pending Cyrus approval of this exact artifact SHA; no platform or vendor is selected

## Context

Sticker price omits labor, migration, renewal, verification, professional review, tax, overages, operations, and exit work. Portability claims also vary from downloadable content to a genuinely reproducible service. The prior exploratory platform scoring used a rubric and workload that Cyrus had not preregistered; every exact platform/plan combination therefore remains unscored.

## Options

1. Select from advertised entry price.
2. Select from the existing exploratory comparison.
3. Preregister workload, gates, arithmetic, quotes, risk ceiling, and reproducible exit tests; keep public-site TCO separate from later-phase reserves.
4. Defer all expenditure and evidence work.

## Proposed decision

Adopt option 3 as the proposed method. Use [`RWL-2026-08-25.3`](../cost/reference-workloads.md#reference-workload-dictionary), the [cost model](../cost/cost-model.md), the [decision framework](../architecture/decision-framework.md), and the portability fixtures.

Do not award a TCO result until exact written quotes, regions, plans, add-ons, renewal/cancellation terms, taxes, overages, and the Cyrus-approved workload are frozen. Missing, incomplete, or inaccessible evidence remains selection-blocking and cannot supply an exclusion or penalty.

The [platform portability](../architecture/platform-portability.md) common fixture now uses `RWL-2026-08-25.3`.

## Public-site-only planning envelopes

These revised ranges are planning envelopes, not quotes, platform comparisons, or production observations:

| Scenario | Monthly | Year 1 | Three years |
|---|---:|---:|---:|
| Lean | $1,425-$3,338 | $27.1k-$95.1k | $64.1k-$199.2k |
| Azure-aligned | $1,450-$3,875 | $29.4k-$113.5k | $67.0k-$230.5k |
| Growth public site | $1,750-$12,700 | $39.0k-$267.4k | $85.0k-$604.2k |

The cost model's no-live-service/free research state is a documented mechanism and research envelope, not a monthly production scenario.

Each future quote packet must separately show implementation/migration, recurring vendor charges, maintenance and publishing labor, observability, backup/recovery, security/accessibility/privacy verification, professional review, registrar/DNS/email, renewal, tax, overage, contingency, and exit/migration labor.

## Later-phase reserves

Do not fold later-phase controls into public-site TCO or portray the following labor floors as vendor prices:

| Phase | Cumulative control labor floor | Coverage note |
|---|---:|---|
| 1 public | 14 h/month | Declared primary/backup operational ownership |
| 2 CRM/scheduling | 24 h/month | Phase 1 controls remain passing |
| 3 portal/connectors/customer AI | 40 h/month | Separately funded 24x7 coverage is required and currently unpriced |
| 4 hosted payments | 52 h/month | Inherits Phase 3 coverage plus payment escalation |
| 5 optional public AI | 62 h/month when Phase 4 is live | Otherwise at least Phase 3 coverage; no alternate cumulative total is inferred |

CRM, scheduling, connector, identity, AI, payment, legal, accessibility, security, privacy, participant, and professional-review reserves require separate current evidence. Phase 3-4 must not proceed while funded 24x7 coverage is unpriced or unavailable.

## Spend controls

For every paid fixture or future implementation:

- set alerts at preregistered forecast percentages and notify both primary and backup owners;
- use vendor caps only where the contract and service actually enforce them;
- set application quotas, rate limits, upload/file/AI limits, and per-tenant anomaly alerts;
- rehearse narrow and global kill switches, degraded modes, rollback, and notification;
- require explicit approval for plan upgrades, overage enablement, new regions, add-ons, or material renewal changes; and
- retain daily cost/usage telemetry and reconcile invoices to the approved workload.

Azure budgets are alerts and automation inputs, **not hard caps**. A budget alert alone does not prevent spend. Similar vendor alerts must not be described as caps unless tested and contractually supported.

## Portability and exit

The closed candidate register in the [decision framework](../architecture/decision-framework.md) controls scope. Apply identical checks to every retained exact fixture: each custom/static renderer + host combination (`CUSTOM-STATIC-<slug>-01`), managed WordPress (`MWP-PORT-01`), WordPress.com (`WPCOM-01`), self-hosted WordPress (`SWP-01`), Wix Studio (`WIX-STUDIO-01`), Webflow (`WEBFLOW-01`), Squarespace (`SQUARESPACE-01`), and each other approved candidate (`OTHER-<slug>-01`). These are reserved fixture families only; they do not assert that an exact product, version, plan, region, add-on set, quote, or completed run exists.

1. export Jamula-owned content, media, metadata, redirects, forms/leads where applicable, configuration, analytics history, audit/evidence, and billing/contract records;
2. verify completeness, integrity, usable formats, relationships, timestamps, and licenses;
3. rebuild or redeploy in an independent target from the retained artifact and documented dependencies;
4. rehearse DNS cutover and rollback while preserving Jamula.net and the Jamula.com HTTPS path/query redirect;
5. measure elapsed time, specialist/vendor assistance, downtime, fees, manual remediation, and residual proprietary dependencies; and
6. verify deletion, account closure, backup expiry, and retained legal/financial evidence.

Every retained candidate must receive those identical checks through an exact preregistered fixture or have an approved evidence-based formal exclusion in the preregistration packet for a proven hard-gate failure. An omitted candidate without that exclusion blocks selection. Incomplete, inaccessible, dynamic, expired, or unretrieved evidence is not proof of failure and cannot silently exclude, score, rank, or penalize a candidate.

Vendor documentation is research evidence. Only an approved synthetic fixture can establish the mechanism; production reliability still requires future implementation evidence. No fixture execution or platform selection is inferred by this ADR.

## Consequences and tradeoffs

### Positive

- Makes labor and exit cost visible.
- Prevents a low entry price or broad export claim from deciding the architecture.
- Preserves a no-selection result when gates, quotes, coverage, or professional reviews are incomplete.
- Supports spend shutdown without treating alerts as guarantees.

### Negative

- Requires procurement effort, mechanism tests, specialist labor, and recurring evidence renewal.
- Exact three-year outcomes remain uncertain because usage, tax, pricing, and staffing may change.
- A reproducible exit may cost more than a content-only export.

## Reversibility

The method is reversible and authorizes no live service or paid resource. A future vendor decision is reversible only when the tested exit packet, retained artifacts, credentials/ownership transfer, DNS rollback, deletion proof, and funded migration window remain current.

## Data export

Exit evidence must identify owner, format, API/tool version, encryption, integrity method, retention/destruction date, dependencies, import target, reconciliation result, and unresolved loss. Payment, accounting, legal-hold, privacy-rights, suppression, and audit records retain their separately approved obligations.

## Professional gates

CPA validates accounting/tax assumptions; counsel validates contract, privacy, rights, and cancellation/exit terms; broker/insurance and acquirer/QSA review assigned risks; accessibility, security/privacy, Fact Checker, Responsible AI, and Cyrus dispositions remain independent of cost.

## Confidence and dissent

**Confidence:** High that quotes and symmetric exit tests are required; low in the numerical outcome before those inputs and the workload SHA are approved.

Reasonable dissent: the evidence process itself adds cost and may exceed the value of an early public site. The reversible response is to narrow or defer scope, not to convert uncertain numbers into a vendor decision.

## Reconsideration triggers

- Cyrus approves or changes the workload, gate, arithmetic, or decision packet.
- Quote, renewal, tax, overage, sustainability, export, cancellation, or ownership terms materially change.
- Actual usage or labor leaves its preregistered range.
- A spend alert, cap, quota, kill switch, export, restore, or DNS rollback test fails.
- Required 24x7 coverage or professional review cannot be funded.
- A fixture fails a portability hard gate or cannot reproduce the service independently.
