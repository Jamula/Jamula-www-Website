# ADR-001: Rendering and Content Platform Evidence Cycle

**Status:** Proposed
**Date:** 2026-08-25
**Approval:** Pending Cyrus approval of this exact artifact SHA; no rendering, CMS, framework, host, or plan is selected

## Context

The Phase 1 public site needs accessible, performant, secure, observable, recoverable, portable publishing with Jamula.net canonical, an HTTPS path/query-preserving Jamula.com redirect, and protected `main` as the sole production source.

The prior assessment was exploratory. Cyrus did not preregister the rubric or shared workload before scoring, so every exact platform/framework/host/plan combination is unscored and no comparative result is decision-grade.

## Options retained

1. Custom-rendered, static, hybrid, or server-rendered framework + exact delivery-target combinations.
2. Wix Studio.
3. WordPress.com.
4. Managed WordPress.
5. Self-hosted WordPress.
6. Webflow.
7. Squarespace.
8. Other credible fixtures, such as Ghost or an Azure-managed CMS pattern, when specified to the same evidence standard.
9. Select no platform while running the complete symmetric evidence cycle.

## Proposed decision

Adopt option 9 only: preregister and run the complete symmetric cycle in the [decision framework](../architecture/decision-framework.md). The closed retained-candidate register must cover every custom/static framework combination, managed WordPress, WordPress.com, self-hosted WordPress, Wix Studio, Webflow, Squarespace, and each other retained credible option. Before selection, every retained candidate must either have an exact named/versioned/plan/region/add-on fixture or an approved evidence-based formal exclusion for a proven hard-gate failure.

Every fixture uses the same `RWL-2026-08-25.3` workload, frozen 250-item common corpus/manifest, journeys, hard gates, tests, evidence window, operator-time and labor/TCO method, portability measures, and exit measures. Reserved IDs such as `CUSTOM-STATIC-<slug>-01`, `MWP-PORT-01`, `WPCOM-01`, `SWP-01`, `WIX-STUDIO-01`, `WEBFLOW-01`, `SQUARESPACE-01`, and `OTHER-<slug>-01` are placeholders only; they do not assert exact details, priority, eligibility, or a completed run.

This proposal does not choose static rendering, WordPress, a turn-key builder, or
any host. Inaccessible, incomplete, dynamic, or unretrieved evidence leaves the
candidate retained and blocks selection without score, penalty, or silent
exclusion. Selection is prohibited until all retained candidates complete the
same cycle or receive an independently reviewed, Cyrus-approved formal exclusion
based on direct current evidence of a preregistered hard-gate failure.

The corrected [platform portability contract](../architecture/platform-portability.md) now references `RWL-2026-08-25.3` and the symmetric 250-item fixture. The cycle remains blocked on Cyrus's preregistration approval, exact plan evidence, spending authorization, and every hard gate; no equivalence or result is inferred before execution.

## Consequences and tradeoffs

### Positive

- Removes framework and vendor bias from the next decision.
- Tests identical content, redirects, acceptance journeys, operator labor, recovery, export, and exit behavior.
- Keeps official documentation, disposable spikes, selection-blocking incomplete packets, and future implementation tests distinct.
- Allows a no-selection outcome when no fixture clears every hard gate.

### Negative

- Delays implementation and consumes engineering, accessibility, security, editorial, and procurement time.
- Requires comparable quotes and may expose material price or contract uncertainty.
- A single managed-WordPress fixture cannot represent every WordPress host; conclusions apply only to the frozen fixture.
- Every retained option remains selection-blocking until tested symmetrically or formally excluded under the approved evidence rule.

## Reversibility, portability, and exit

The proposal is reversible because all fixtures are disposable and use synthetic/non-production content. No live service, credential, domain cutover, paid resource, or production data is authorized.

Every fixture must export Jamula-owned text, media, metadata, redirects, forms/leads where applicable, configuration, and operational evidence in usable formats; produce an independently buildable or redeployable exit artifact; document licenses and proprietary components; and rehearse DNS cutover, rollback, and archive verification. Failure is a hard stop, not a compensating cost tradeoff.

## Data export

Export tests must record completeness, format, referential integrity, media hashes, URL/metadata preservation, redirect fidelity, elapsed labor, vendor assistance, fees, and residual manual work. A vendor export claim is documented research until the fixture proves the approved mechanism.

## Cost

Use the [public-site cost model](../cost/cost-model.md) and `RWL-2026-08-25.3`. Include build/migration, recurring operations, renewals, taxes, overages, verification, professional review, and exit labor. Keep Phase 2-5 reserves separate. No fixture receives TCO credit before comparable written quotes are frozen.

## Professional and evidence gates

Accessibility, privacy/security, claims/counsel, CPA, broker/insurance, Fact Checker, and other [phase-gate](../roadmap/phase-gates.md) dispositions remain independent hard gates. Mechanism-spike output is not production proof.

## Confidence and dissent

**Confidence:** High that a fresh symmetric cycle is necessary; low on any rendering or CMS outcome.

Reasonable dissent: the evidence cycle delays a small public site and may cost more than an immediate reversible launch. The countervailing risk is that an immediate choice would encode unapproved assumptions and unknown exit costs.

## Reconsideration triggers

Reconsider when:

- Cyrus approves a preregistered packet and the symmetric cycle completes;
- an exact fixture fails a hard gate or cannot obtain required terms;
- authoritative pricing, export, ownership, security, sustainability, or availability terms materially change;
- the public-site scope or `RWL-2026-08-25.3` changes; or
- professional or named-reviewer disposition blocks a fixture.
