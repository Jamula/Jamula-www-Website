# Platform Decision Framework

**Status:** Proposed method only; pending Cyrus approval of an exact artifact SHA; no platform, renderer, CMS, or host selected
**Evidence date:** 2026-08-25
**Scope:** Phase 1 public site platform, hosting, delivery, cost, portability, and exit evidence

## 1. Decision state

Cyrus did not preregister or approve the candidate rubric and shared workload before the exploratory platform assessment was scored. Those exploratory results are therefore non-decisional. Every exact platform, framework, host, and plan combination is **unscored**, and this framework does not select a platform.

The bounded proposal is to preregister and run a symmetric evidence cycle. Cyrus must approve the exact workload version, gates, weights, evidence deductions, minimum pass threshold, risk ceiling, fixtures, quotes, and decision rule before any comparative run. Post-run changes require a new version and a fresh run.

## 2. Controlling inputs

- Numerical dictionary: [`RWL-2026-08-25.3`](../cost/reference-workloads.md#reference-workload-dictionary).
- Public-site planning envelopes and arithmetic: [cost model](../cost/cost-model.md).
- Candidate gates, dimensions, and source status: [platform options](../research/platform-options.md).
- Portability mechanisms and the corrected `RWL-2026-08-25.3` common fixture: [platform portability](platform-portability.md).
- Delivery boundaries: [evaluation plan](../planning/evaluation-plan.md) and [phase gates](../roadmap/phase-gates.md).

## 3. Preregistration packet

Before evidence collection, freeze one exact-SHA packet containing:

1. `RWL-2026-08-25.3`, including traffic, content, availability, labor-rate, retention, and growth assumptions;
2. a closed retained-candidate register in which every exact platform/renderer/CMS/host combination has either a complete fixture or a proposed formal-exclusion record;
3. for every fixture, the exact product, renderer/CMS/core and version, host, region, plan, add-ons/plugins/theme, publication path, tax treatment, renewal terms, support terms, and quote timestamps;
4. one common 250-item corpus/manifest, journeys, hard gates, acceptance and recovery tests, evidence window, operator-time method, labor/TCO model, portability measures, and exit measures for every fixture;
5. hard-gate pass conditions for security/privacy, accessibility, DNS/TLS, protected-`main` production provenance, operability, backup/recovery, export/redeploy, sustainability evidence, and cost controls;
6. the proposed weighted rubric, evidence rules, minimum total, category floors, and risk ceiling;
7. evidence-class rules: `documented research`, `disposable mechanism spike`, `selection-blocking incomplete packet`, and `future implementation test`;
8. symmetric tasks, time boxes, operators, scripts, measurement method, stop conditions, and raw-evidence retention;
9. the rule for inconclusive, inaccessible, expired, contradictory, or vendor-only evidence; and
10. professional and named-reviewer gates that cannot be replaced by a numerical result.

Until Cyrus approves this packet, even a documented price or mechanism is input evidence, not a decision.

A formal exclusion must identify the exact candidate, the preregistered hard gate,
current evidence that directly proves failure, evidence date/scope, counterevidence,
and independent reviewer and Cyrus approvals in the exact packet. Inaccessible,
incomplete, dynamic, or unretrieved evidence is not proof of failure: it leaves the
candidate retained and blocks selection without a score or penalty.

## 4. Hard gates before any weighting

The exact pass language remains subject to preregistration. At minimum, a fixture must demonstrate:

- Jamula.net as canonical and an HTTPS Jamula.com redirect that preserves path and query;
- protected `main` as the only production source, with auditable artifact/SHA provenance and rollback;
- current TLS, DNS ownership/recovery, domain-email authentication, least privilege, secret separation, logging, alerts, and recovery controls;
- the applicable WCAG 2.2 AA journeys and Dax's sole normative [performance gate](../experience/accessibility-seo-performance.md#6-performance-gate);
- export of Jamula-owned content, media, metadata, redirects, configuration, analytics history, and operational records in usable formats;
- an independently buildable/redeployable exit artifact and documented DNS cutover/rollback;
- quote-backed first-year, renewal, overage, tax, labor, migration, verification, professional-review, and exit assumptions;
- alerts, caps where supported, tested application kill switches, and fail-closed behavior; and
- official, dated evidence for material vendor, sustainability, pricing, contract, and portability claims.

A proven failed hard gate blocks and may support formal exclusion through the
approved rule above. A missing or inaccessible hard-gate packet blocks the entire
selection cycle; it cannot silently exclude, rank, or penalize the candidate. A
disposable spike cannot establish production reliability, contractual entitlement,
operational readiness, or professional approval.

## 5. Symmetric evidence cycle

Run the same approved `RWL-2026-08-25.3` workload, frozen 250-item
corpus/manifest, journeys, hard gates, acceptance/security/accessibility/performance
tests, export and recovery exercises, evidence window, operator-time log,
labor/TCO model, portability measures, and exit measures against every retained
fixture. Reserved fixture families are:

| Retained category | Reserved fixture ID | Completion rule |
|---|---|---|
| Each retained custom/static framework + host combination | `CUSTOM-STATIC-<slug>-01` | One row per exact renderer/version, host, region, plan and add-on combination |
| Managed WordPress | `MWP-PORT-01` | Exact named host, region, plan, core/theme/plugins and support/backup contract |
| WordPress.com | `WPCOM-01` | Exact plan, region, core/theme/plugins/add-ons and publication/export paths |
| Self-hosted WordPress | `SWP-01` | Exact infrastructure/region, core/theme/plugins, operations and support model |
| Wix Studio | `WIX-STUDIO-01` | Exact plan, region, apps/add-ons, template and publication/export paths |
| Webflow | `WEBFLOW-01` | Exact Workspace + Site plans, region, apps/add-ons, template and publication/export paths |
| Squarespace | `SQUARESPACE-01` | Exact plan, region, extensions/add-ons, template and publication/export paths |
| Each other retained credible option | `OTHER-<slug>-01` | One separately named exact fixture per option; category placeholders cannot aggregate products |

These IDs reserve packet slots only; they do not assert exact details, eligibility,
priority, a completed run, or a shortlist. Earlier `STATIC-AZ-01`,
`STATIC-NL-01`, `STATIC-CF-01`, and `STATIC-VC-01` research identifiers likewise
remain incomplete placeholders unless converted into separately exact
custom/static combination rows under the approved rule.

Every retained candidate must have a completed exact fixture under this table or
an approved evidence-based hard-gate exclusion before selection. No fixture may
receive credit from absent evidence. An inaccessible dynamic price, entitlement,
DPA/region term, export path, cancellation term, or other material field blocks
selection rather than being estimated, penalized, or treated as exclusion.

## 6. Result rules

- Preserve raw observations separately from interpretation.
- Apply only preregistered gates and arithmetic.
- Treat official documentation as a claim source, not production proof.
- Record counterevidence, residual risk, sensitivity ranges, and operator labor.
- Keep public-site TCO separate from Phase 2-5 reserves.
- Do not assign a TCO result until comparable written quotes and the approved workload are frozen.
- If no fixture clears every gate, recommend no fixture and specify the next evidence action.
- Selection is prohibited until every retained candidate has completed the same
  approved cycle or has an approved formal exclusion based on a proven hard-gate
  failure. A partial candidate set cannot produce a provisional winner.

## 7. Required approvals

Cyrus must approve the preregistration SHA and, separately, any later decision SHA. Counsel, CPA, insurance/broker, accessibility, privacy/security, acquirer/QSA, Fact Checker, and Responsible AI dispositions remain mandatory where the [phase gates](../roadmap/phase-gates.md) assign them. No platform result can waive those gates.

**Confidence:** High that a new symmetric cycle is required; low on any platform outcome until quotes, mechanism tests, and approvals are resolved.
