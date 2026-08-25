# Jamula Website Documentation

## Status

All six child workstreams, [#4](https://github.com/Jamula/Jamula-www-Website/issues/4)
through [#9](https://github.com/Jamula/Jamula-www-Website/issues/9), and their
review corrections are incorporated in the working tree. Fact Checker's
terminal FCR-018 verdict is **CLEAR: 0 unresolved content findings / 0
unresolved ledger findings / 0 new findings**. The independent adversarial
FCR-018 recheck is also **CLEAR: 0 unresolved content findings / 0 unresolved
ledger findings / 0 new findings**. Prior Reject/Revise dispositions remain
preserved as historical review evidence; FCR-018 and the remaining N-11
owner-provenance defect are resolved.

Rai's remediation re-review remains **Green: 4 resolved / 0 unresolved** only
for the six fingerprinted working-tree artifacts. The original Red remains
preserved as review history. Canonical Git blob OIDs, the full PR-head SHA,
Cyrus approval, and all professional gates remain pending; a material change
to a fingerprinted file reopens its affected Rai finding.

Issues [#3](https://github.com/Jamula/Jamula-www-Website/issues/3) through
[#9](https://github.com/Jamula/Jamula-www-Website/issues/9) are open. No platform,
framework, host, CMS, CRM, scheduler, connector, payment processor, ADR, public
claim, founder wording, legal text, professional conclusion, implementation, or
deployment is accepted or approved.

## PR 2 synthesis

- [Business and product requirements](requirements/business-product-requirements.md)
- [Decision framework](architecture/decision-framework.md) — proposed method;
  every option remains unscored
- [Neutral evidence-cycle recommendation](architecture/recommendation.md) — no
  platform selected
- [Proposed ADR index](decisions/README.md)
- [Phase gates](roadmap/phase-gates.md)
- [Draft implementation backlog](roadmap/implementation-backlog.md)
- [Proposed ownership matrix](roadmap/ownership-matrix.md)

## Child research

The durable mapping remains [#4 Uhura
content](https://github.com/Jamula/Jamula-www-Website/issues/4), [#5 Dax
experience](https://github.com/Jamula/Jamula-www-Website/issues/5), [#6 Seven
customer platform](https://github.com/Jamula/Jamula-www-Website/issues/6), [#7
Miles security/quality](https://github.com/Jamula/Jamula-www-Website/issues/7),
[#8 Geordi platform/cost](https://github.com/Jamula/Jamula-www-Website/issues/8),
and [#9 Sarek
legal](https://github.com/Jamula/Jamula-www-Website/issues/9). Independent revision
ownership and lockouts are in [work ownership](planning/work-ownership.md).

| Domain | Documents |
|---|---|
| Content | [strategy](content/content-strategy.md), [editorial workflow](content/editorial-workflow.md), [multimedia/social](content/multimedia-social-plan.md), [founder placeholder](content/founder-profile-draft.md) |
| Experience | [requirements](experience/experience-requirements.md), [accessibility/SEO/performance](experience/accessibility-seo-performance.md), [acceptance journeys](experience/acceptance-journeys.md) |
| Customer platform | [options](research/customer-platform-options.md), [sources](research/customer-platform-source-register.md), [architecture](architecture/customer-platform.md), [data inventory](privacy/data-inventory.md), [lifecycle](privacy/data-lifecycle.md), [payments](payments/phase-4-evaluation.md) |
| Connector packets | [index](spikes/connectors/README.md), [OneDrive](spikes/connectors/onedrive.md), [Google Drive](spikes/connectors/google-drive.md), [Box](spikes/connectors/box.md) — all blocked/deferred; no live mechanism spike |
| Security/quality | [threat model](security/threat-model.md), [controls/tests](security/control-test-matrix.md), [incident response](security/incident-detection-response.md), [backup/recovery](security/backup-recovery.md), [supply chain](security/supply-chain.md), [quality](security/quality-strategy.md) |
| Platform/cost | [options](research/platform-options.md), [sources](research/platform-source-register.md), [cost model](cost/cost-model.md), [reference workload RWL-2026-08-25.3](cost/reference-workloads.md), [portability](architecture/platform-portability.md) |
| Legal | [jurisdictions](legal/jurisdiction-matrix.md), [checklist](legal/compliance-checklist.md), [legal-page requirements](legal/legal-pages-requirements.md), [content/IP](legal/content-ip-review.md), [phase gates](legal/phase-review-gates.md) |

## Proposed ADRs

- [ADR-001 — rendering and content](decisions/adr-001-rendering-and-content.md)
- [ADR-002 — hosting, DNS, email and CI/CD](decisions/adr-002-hosting-dns-email-cicd.md)
- [ADR-003 — customer-platform phases](decisions/adr-003-customer-platform-phases.md)
- [ADR-004 — privacy, security and reliability](decisions/adr-004-privacy-security-reliability.md)
- [ADR-005 — cost, portability and lock-in](decisions/adr-005-cost-portability-and-lock-in.md)
- [ADR-006 — repository, content and legal gates](decisions/adr-006-repository-content-and-legal-gates.md)

All ADRs are proposed. None is accepted.

## Independent reviews

- [Fact Checker report](reviews/fact-check-report.md) — original and intermediate
  **REVISE** history preserved; terminal FCR-018 verdict **CLEAR**, with **0
  unresolved content findings / 0 unresolved ledger findings / 0 new findings**
- [Responsible AI review](reviews/rai-review.md) — original **REJECT** verdict
  preserved; remediation re-review is **GREEN**, 4 resolved / 0 unresolved,
  for the fingerprinted working-tree revision
- [Adversarial rubber-duck findings/remediation register](reviews/adversarial-review.md)
  — original **Reject** and intermediate **Revise** history preserved;
  independent adversarial FCR-018 recheck **CLEAR**, with **0 unresolved content
  findings / 0 unresolved ledger findings / 0 new findings**

## Shared registers

- [Approval register](decisions/approvals.md)
- [Public claims](content/public-claims-register.md)
- [Founder-source placeholder](content/founder-source-register.md)
- [Professional review](legal/professional-review-register.md)
- [Repository license/provenance inventory](legal/license-inventory.md)

Every PR 2 approval and every professional disposition remains pending.

## Integration and governance

- [Documentation index (this file)](README.md)
- [Complete artifact manifest](artifacts-manifest.md)
- [PR 2 work ownership, lockouts, issue state and residual actions](planning/work-ownership.md)

The manifest covers every Markdown file under `docs/`; there are no intentionally
unindexed documentation artifacts. Coverage is **60/60**.

## Remaining incorporation sequence

1. Validate the exact working tree, then commit it.
2. Open a draft PR to `main` whose body uses `Closes #3`; do not merge it.
3. Post child incorporation comments on #4-#9 identifying the actual commit and
   draft PR, then explicitly close #4-#9.
4. Update/check the ledgers if anything material changed. Keep #3 open while the
   PR is draft; material changes reopen affected review and identifiers.
5. Record canonical Git blob OIDs and the full final PR-head SHA.
6. Keep every decision pending and do not merge. Cyrus must approve that exact
   final head; all named professional gates remain separate and pending.

## Core governance

- [Approved evaluation plan](planning/evaluation-plan.md) — historical plan
  approval only; its legacy filesystem hash is not portable PR 2 proof
- [Provisional operating principles](company/operating-principles.md)
- [Draft public values](company/public-values-draft.md)

## Approval identity

After commit, canonical approval identifiers are each artifact's Git blob OID at
the exact PR head plus the full PR head commit SHA. Raw filesystem SHA-256 values
can differ across CRLF/LF checkouts and are not canonical. See the [approval
register](decisions/approvals.md).

## Operational exceptions

Standard-location files remain indexed here: root `LICENSE`, `LICENSE_SCOPE.md`,
`TRADEMARKS.md`, `CONTRIBUTING.md`, `THIRD_PARTY_NOTICES.md`; `.github/`;
`.squad/`; `.mcp.json`.

## Branch and deployment model

`main` is the only persistent branch and sole production CI/CD source. A draft PR
validates work and may create isolated ephemeral previews; it authorizes no
production deployment. Jamula.net remains the proposed canonical domain and
Jamula.com the matching redirect, subject to future DNS/TLS tests.
