# ADR-004: Privacy, Security, Reliability, and AI Control Baseline

**Status:** Proposed
**Date:** 2026-08-25
**Approval:** Pending Cyrus approval of this exact artifact SHA; no production readiness is claimed

## Context

Jamula's phases introduce public analytics, leads, customer identity, connector grants, customer files, AI evidence, payments, and optional public AI. Vendor defaults and policy prose alone cannot establish privacy, tenant isolation, recoverability, accessibility, reliability, or responsible-AI readiness.

## Options

1. Depend on vendor defaults and respond to incidents case by case.
2. Apply one undifferentiated control set to every phase and data class.
3. Use phase- and classification-specific controls with executable gates, quarantined recovery, named owners, funded coverage, and independent dispositions.
4. Defer every data-bearing phase.

## Proposed decision

Adopt option 3 as the proposed control baseline. It does not authorize a platform, vendor, phase, or production release. Any missing test, owner, evidence packet, funded coverage, or professional disposition leaves the affected capability blocked.

## Privacy and security baseline

- Maintain data inventory, purpose, lawful-basis/consent position, minimization, classification, region, processor/subprocessor, retention, rights, deletion, and legal-hold records.
- Use dedicated identity subjects and immutable tenant keys; enforce deny-by-default authorization at service and data layers; test two-tenant zero-leak conditions.
- Keep secrets and refresh tokens encrypted and server-only; constrain short-lived browser access tokens as specified in [ADR-003](adr-003-customer-platform-phases.md).
- Make protected `main` the sole production source; bind release, evidence, rollback, and configuration to immutable artifact/SHA provenance.
- Keep security, privacy, rights, payment, AI, and audit evidence tamper-evident and access-controlled.

The [data inventory](../privacy/data-inventory.md), [data lifecycle](../privacy/data-lifecycle.md), [customer-platform architecture](../architecture/customer-platform.md), [threat model](../security/threat-model.md), and [control test matrix](../security/control-test-matrix.md) remain controlling child artifacts.

## Backup and restore authority

Use only the [authoritative classification-specific backup schedule](../security/backup-recovery.md#authoritative-classification-specific-backup-schedule):

- C2 personal/customer backup copies have a maximum 35-day lifetime.
- C3 has no routine backup by default; an approved exception is treated as C2.
- Personal-data C4 backup copies have a maximum 35-day lifetime; authoritative records follow their separately approved schedule.

A restore is never immediately serving. It enters quarantine and is re-evaluated against current tombstones, withdrawals, revocations, tenant/ACL state, classification, retention expiry, and legal holds. Only passing rows re-enter service; suppressed, expired, or ambiguous rows remain quarantined or are purged. Restore exercises must prove this behavior and record current policy/version evidence.

## Reliability, performance, and coverage

Dax's [performance gate](../experience/accessibility-seo-performance.md#6-performance-gate) is the sole normative performance budget. It includes <=900 KiB encoded aggregate for public content routes and <=1,500 KiB for interactive/authenticated shells; category limits and field outcomes remain authoritative there. No competing budget is established in this ADR.

The [incident plan](../security/incident-detection-response.md) controls staffing and coverage:

- Phase 1: 14 cumulative control hours/month.
- Phase 2: 24.
- Phase 3: 40 plus separately funded, currently unpriced 24x7 coverage.
- Phase 4: 52 plus Phase 3 coverage and payment escalation.
- Phase 5: 62 when Phase 4 is live; otherwise at least Phase 3 coverage, without inferring another cumulative total.

If staffing, on-call, escalation, restore, rights, or communication capacity is unavailable, the affected phase remains absent or degrades through its approved fail-closed mode.

## AI evidence

Phase 3 read-only customer AI requires immutable, versioned, non-waivable evaluation cards covering release artifact, corpus/retrieval, model/prompt/moderation, tenant isolation, citations, privacy, safety, accessibility, cost, operator review, defects, counterevidence, and shutdown. The [quality strategy](../security/quality-strategy.md) also requires compensated participation by at least eight representative customers, including at least four disabled participants. Internal staff, synthetic personas, or model-generated feedback cannot replace that participation.

Phase 5 remains separate and absent unless every P5-AI-01 through P5-AI-12 gate in the [phase gates](../roadmap/phase-gates.md#phase-5-optional-public-ai-hard-evidence-gates) passes. Those gates cover public-only isolation; rights/provenance and removal; transparency and data use; intended/prohibited uses; harm and fairness evaluation; representative participation; accessible appeal, correction, human support, and shutdown; privacy-preserving evaluation; controlled changes; operational monitoring; and independent dispositions.

## Consequences and tradeoffs

### Positive

- Aligns retention and recovery with data class instead of convenience.
- Prevents deletion, withdrawal, or revocation from being silently undone by restore.
- Makes staffing and AI participation release inputs rather than deferred operational debt.
- Keeps performance, accessibility, privacy, security, and RAI authorities explicit.

### Negative

- Requires engineering, privacy, accessibility, security, operations, and participant budget.
- Quarantined restore and evidence-card pipelines add complexity and recovery time.
- Capabilities may remain unavailable when evidence or professional review is incomplete.

## Reversibility, portability, and exit

Controls must be provider-neutral where possible: export inventory, classifications, consent/suppression, identity/tenant relationships, ACL/grant state, tombstones, audit lineage, incident evidence, AI cards, and rights requests in documented usable formats. Vendor replacement must preserve denial, retention, quarantine, deletion, and evidence semantics before cutover.

## Data export

Exports must include schema/version, timestamps, tenant and subject keys, classification, purposes, consent/suppression, retention/expiry, deletion/tombstone state, legal holds, ACL/grants, provenance, and integrity evidence. Access to exports is least-privileged, encrypted, logged, verified, and destroyed on schedule.

## Cost

Control labor, independent testing, accessibility participation, professional review, storage, logging, monitoring, backup, incident exercises, and 24x7 coverage are explicit cost inputs. Public-site TCO and later-phase reserves remain separate in the [cost model](../cost/cost-model.md).

## Professional gates

Counsel, privacy/security specialists, CPA, broker/insurance, acquirer/QSA, accessibility, Miles, Seven, Rai, Dax, Sarek, Fact Checker, and Cyrus dispositions apply exactly where assigned by the phase gates. A risk acceptance cannot replace a non-waivable gate.

## Confidence and dissent

**Confidence:** Medium in the proposed authority chain; low on operational effectiveness until future implementation tests and exercises pass.

Reasonable dissent: the baseline is expensive for an early business. The safe response is to keep later capabilities absent, not to claim controls without staffing or evidence.

## Reconsideration triggers

- A data class, purpose, jurisdiction, processor, threat model, AI boundary, or payment scope changes.
- Restore testing reveals tombstone, ACL, tenant, classification, expiry, or legal-hold errors.
- Dax changes the normative performance budget.
- Required staffing, coverage, participant recruitment, or professional review cannot be funded.
- A Critical/High defect, cross-tenant disclosure, rights failure, or AI gate failure occurs.
