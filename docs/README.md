# Jamula Website Documentation

This index separates the current website from the historical platform-evaluation
package. The research, legal, cost, security, and roadmap materials below are
dated planning records, not evidence that a control, vendor, phase, professional
review, or public claim is current or approved. Check each artifact's status and
source date before relying on it.

## Current project state

- The repository contains a static Astro site under `www/`; local commands are
  in the root [README](../README.md).
- The current deployment workflow builds the website from the repository. The
  approved domain policy directly serves all four Jamula.net/.com apex and www
  hostnames over HTTPS; `jamula.net` is canonical for indexing, and HTTP upgrades
  on the same hostname. This is configuration and policy documentation, not
  proof of live DNS, TLS, secret, or end-to-end availability.
- The approved hosting configuration uses two Free Azure Static Web Apps. The
  site must incur zero incremental paid operating-service spend; existing domain
  renewals and CI allowances are separate. Free-tier quotas and absence of an
  SLA remain constraints, not guarantees.
- The homepage currently has no contact mechanism. The remaining homepage
  title, contact path, built-site accessibility/SEO/link/contrast regression
  checks, and four-host monitoring are tracked in open issues
  [#89](https://github.com/Jamula/Jamula-www-Website/issues/89),
  [#86](https://github.com/Jamula/Jamula-www-Website/issues/86),
  [#87](https://github.com/Jamula/Jamula-www-Website/issues/87), and
  [#88](https://github.com/Jamula/Jamula-www-Website/issues/88), respectively
  (state checked 2026-11-01; check GitHub for current status).
- Platform-evaluation PR [#10](https://github.com/Jamula/Jamula-www-Website/pull/10)
  and bootstrap PR [#2](https://github.com/Jamula/Jamula-www-Website/pull/2)
  are merged. Their historical drafts, review findings, and approval records
  remain part of the archive; they are not current open PRs or work instructions.
- A Blazor-based site with build-time HTML articles has been discussed as a
  future direction. Astro remains the current implementation; no Blazor
  migration or prototype is authorized by the proposal.

## Current implementation and operating guidance

<a id="integration-and-governance"></a>

- [Two Static Web Apps: domain and deployment boundary](architecture/two-free-static-apps.md)
- [Platform portability and exit contract](architecture/platform-portability.md) —
  research fixture only; not a current infrastructure inventory
- [Acceptance journeys](experience/acceptance-journeys.md) and
  [accessibility, SEO, and performance requirements](experience/accessibility-seo-performance.md) —
  proposed requirements and test plans, not proof of passing results
- [Security and quality strategy](security/quality-strategy.md) —
  proposed controls and future tests
- [Side-quest component release contract](architecture/side-quest-release-contract.md) —
  proposal-only artifact identity, independent releases, collective manifests, and recovery
- [Side-quest operations review](operations/side-quest-operations-review.md) —
  monthly evidence review using the existing MBR, with data-quality and privacy rules
- [Public claims register](content/public-claims-register.md) —
  owner/reviewer approval is required before publication
- [License and provenance inventory](legal/license-inventory.md) and
  [repository license scope](../LICENSE_SCOPE.md)

## Historical evaluation and planning documents

<a id="pr-2-synthesis"></a>
<a id="child-research"></a>
<a id="proposed-adrs"></a>

The evaluation work package was merged in August 2026. Its exact source dates
and proposal statuses remain in each document. The prior Jamula.com-to-Jamula.net
redirect assumption is superseded by the direct-serving policy in
[Two Static Web Apps](architecture/two-free-static-apps.md). Do not use the
historical redirect as a current requirement.

| Area | Documents |
|---|---|
| Planning and requirements | [Evaluation plan](planning/evaluation-plan.md), [business and product requirements](requirements/business-product-requirements.md), [work ownership](planning/work-ownership.md), [phase gates](roadmap/phase-gates.md), [implementation backlog](roadmap/implementation-backlog.md), [ownership matrix](roadmap/ownership-matrix.md) |
| Architecture and decisions | [Customer platform](architecture/customer-platform.md), [decision framework](architecture/decision-framework.md), [recommendation](architecture/recommendation.md), [decision index](decisions/README.md), [ADR-001](decisions/adr-001-rendering-and-content.md), [ADR-002](decisions/adr-002-hosting-dns-email-cicd.md), [ADR-003](decisions/adr-003-customer-platform-phases.md), [ADR-004](decisions/adr-004-privacy-security-reliability.md), [ADR-005](decisions/adr-005-cost-portability-and-lock-in.md), [ADR-006](decisions/adr-006-repository-content-and-legal-gates.md), [approval register](decisions/approvals.md) |
| Content and company | [Operating principles](company/operating-principles.md), [public values draft](company/public-values-draft.md), [content strategy](content/content-strategy.md), [editorial workflow](content/editorial-workflow.md), [multimedia and social plan](content/multimedia-social-plan.md), [founder profile draft](content/founder-profile-draft.md), [founder source register](content/founder-source-register.md), [homepage copy draft](content/homepage-copy-draft.md) |
| Experience | [Experience requirements](experience/experience-requirements.md), [acceptance journeys](experience/acceptance-journeys.md), [accessibility, SEO, and performance](experience/accessibility-seo-performance.md) |
| Customer platform and privacy | [Customer-platform options](research/customer-platform-options.md), [customer-platform source register](research/customer-platform-source-register.md), [data inventory](privacy/data-inventory.md), [data lifecycle](privacy/data-lifecycle.md), [connector index](spikes/connectors/README.md), [OneDrive](spikes/connectors/onedrive.md), [Google Drive](spikes/connectors/google-drive.md), [Box](spikes/connectors/box.md), [payments evaluation](payments/phase-4-evaluation.md) |
| Security and recovery | [Threat model](security/threat-model.md), [control/test matrix](security/control-test-matrix.md), [incident detection and response](security/incident-detection-response.md), [backup and recovery](security/backup-recovery.md), [supply chain](security/supply-chain.md), [quality strategy](security/quality-strategy.md) |
| Platform and cost research | [Platform options](research/platform-options.md), [platform source register](research/platform-source-register.md), [cost model](cost/cost-model.md), [reference workloads](cost/reference-workloads.md), [portability](architecture/platform-portability.md) |
| Legal issue spotting | [Jurisdiction matrix](legal/jurisdiction-matrix.md), [compliance checklist](legal/compliance-checklist.md), [legal-page requirements](legal/legal-pages-requirements.md), [content/IP review](legal/content-ip-review.md), [phase review gates](legal/phase-review-gates.md), [professional review register](legal/professional-review-register.md), [license inventory](legal/license-inventory.md) |
<a id="shared-registers"></a>
<a id="independent-reviews"></a>

| Review and provenance | [Artifact manifest](artifacts-manifest.md), [Fact Checker report](reviews/fact-check-report.md), [Responsible AI review](reviews/rai-review.md), [adversarial review](reviews/adversarial-review.md) |

## Freshness and approval limits

<a id="core-governance"></a>

Research and source registers have evidence cut-offs in August 2026. Vendor
prices, quotas, legal requirements, and public-source claims can change; those
records are not live quotes or current legal advice. Verify the primary source
again before relying on a time-sensitive claim. No source date, issue closure,
review verdict, or merged documentation PR by itself approves a public claim,
professional conclusion, migration, production action, or future product phase.

`artifacts-manifest.md`, `planning/work-ownership.md`, and
`decisions/approvals.md` retain the August evaluation package's authorship,
review, and lifecycle history. Their historical status fields are not a live
work ledger. GitHub issues are the current durable follow-up ledger.
