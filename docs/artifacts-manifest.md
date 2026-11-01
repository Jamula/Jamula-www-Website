# Artifact Manifest

**Ledger status:** Lifecycle evidence reconciliation. Reviewed incorporation
commit `d02a2448a5438fb0e895c4c46166fe39c79ccb86` is recorded in [draft PR
#10](https://github.com/Jamula/Jamula-www-Website/pull/10), which targets
`main` from branch `u/cyrusjamula/3-website-platform-evaluation`. Issues
[#4](https://github.com/Jamula/Jamula-www-Website/issues/4)
through [#9](https://github.com/Jamula/Jamula-www-Website/issues/9) each
received a comment naming that commit and PR, then were explicitly closed as
completed on 2026-08-25. [Issue
#3](https://github.com/Jamula/Jamula-www-Website/issues/3) remains open while
PR #10 is draft.

**C2 status:** `C2` means all six child workstreams #4-#9 are incorporated and
their review corrections are present in the working tree. Fact Checker's
terminal FCR-018 verdict is **CLEAR: 0 unresolved content findings / 0
unresolved ledger findings / 0 new findings**. The independent adversarial
FCR-018 recheck is also **CLEAR: 0 unresolved content findings / 0 unresolved
ledger findings / 0 new findings**. FCR-018 and the remaining N-11
owner-provenance defect are resolved; prior Reject/Revise dispositions remain
historical. Responsible AI reviewer's Green remains limited to its fingerprinted working-tree
revision; material changes to those files reopen affected findings. Canonical
Git blob OIDs for these changed ledger artifacts, the exact final PR-head SHA,
Cyrus approval, and professional gates remain pending. PR #10 is intentionally
stacked on unmerged draft PR #2
(`cyrusjamula-jamula-website-platform-evaluation`) but targets `main`; its diff
will narrow after PR #2 merges. Issue #1 and PR #2 were not part of the child
closure action. No PR was merged and no production deployment occurred. `C2`
does not mean accepted, implemented, deployed, or approved.

Durable child mapping is unchanged: **#4 Content lead content; #5 Experience lead experience; #6
Identity/data engineer customer platform; #7 Quality/reliability engineer security/quality; #8 Platform engineer platform/cost; #9
Legal researcher legal.** A revision owner is recorded only where an independent lockout or
cross-owner correction applies. Multiple revision owners are chronological,
left to right; the explicitly marked latest owner is the active correction
owner, while every earlier owner remains historical provenance. The original
author did not self-revise a locked artifact. No ownership entry implies review
approval.

| Artifact | Original author | Independent revision owner | Reviewers / approver | Issue and dependency | Current status | Index |
|---|---|---|---|---|---|---|
| `docs/README.md` | Product lead (integration) | Fact Checker (Cycle 2); Work monitor (N-01/N-04); Legal researcher (N-11 ledger, then lifecycle evidence) | all owners; Cyrus | Refs #3 and #4-#9 | Incorporation commit, draft PR and child closure recorded; exact final head and approvals pending | [Integration](README.md#integration-and-governance) |
| `docs/artifacts-manifest.md` | Product lead (integration) | Fact Checker (Cycle 2); Work monitor (N-01/N-04); Legal researcher (N-11, FCR-018 owner-provenance ledger, then lifecycle evidence) | all owners; Cyrus | Refs #3 and #4-#9 | FCR-018 and N-11 resolved; lifecycle evidence recorded; complete 60/60 docs inventory | [Integration](README.md#integration-and-governance) |
| `docs/planning/evaluation-plan.md` | Coordinator; approved by Cyrus | — | all owners | #3 baseline | PR 1 baseline; historical approval is not approval of this evaluation work package | [Governance](README.md#core-governance) |
| `docs/planning/work-ownership.md` | Product lead (integration) | Fact Checker (Cycle 2); Work monitor (N-01/N-04); Legal researcher (N-11, FCR-018 owner-provenance ledger, then lifecycle evidence) | all owners; Cyrus | Refs #3 and #4-#9 issue bodies | Lockouts preserved; child closures and remaining parent/approval sequence recorded | [Integration](README.md#integration-and-governance) |
| `docs/company/operating-principles.md` | Cyrus / initial project governance | — | Cyrus | pre-existing governance | Provisional; exact-version approval pending | [Governance](README.md#core-governance) |
| `docs/company/public-values-draft.md` | Cyrus / initial project governance | — | Fact Checker, Responsible AI reviewer, Legal researcher; Cyrus | public-claims gate | Provisional; not approved for publication | [Governance](README.md#core-governance) |
| `docs/content/content-strategy.md` | Content lead | Experience lead | Legal researcher, Responsible AI reviewer, Fact Checker; Cyrus | #4; #3 | C2; no publishing approval | [Content](README.md#child-research) |
| `docs/content/multimedia-social-plan.md` | Content lead | Experience lead | Legal researcher, Responsible AI reviewer, Fact Checker; Cyrus | #4; content strategy | C2; no publishing approval | [Content](README.md#child-research) |
| `docs/content/editorial-workflow.md` | Content lead | Experience lead (RAI-02 lockout) | Responsible AI reviewer, Legal researcher, Fact Checker; Cyrus | #4; reviewer protocol | C2; Responsible AI reviewer Green for fingerprinted revision | [Content](README.md#child-research) |
| `docs/content/founder-profile-draft.md` | Content lead | Legal researcher (RAI-01 lockout) | Responsible AI reviewer, Fact Checker; Cyrus | #4; founder approval | C2; intentionally contains no publishable founder copy | [Content](README.md#child-research) |
| `docs/content/homepage-copy-draft.md` | Content lead | — | Fact Checker, Legal researcher, Responsible AI reviewer, Experience lead; Cyrus | #43; parent #39; review fixes #46 | Draft; review-condition fixes applied (#46); no section approved for publication; all candidate wording review-gated; Fact Checker/Legal researcher/Responsible AI reviewer/Cyrus focused exact-SHA rechecks required before merge | [Content](README.md#child-research) |
| `docs/content/founder-source-register.md` | Content lead; integrated by Product lead | Legal researcher (RAI-01 lockout) | Responsible AI reviewer, Fact Checker; Cyrus | #4; founder approval; updated #43 | C2 + #43 boundary and source lead recorded; no founder facts approved | [Registers](README.md#shared-registers) |
| `docs/content/public-claims-register.md` | Content lead; integrated by Product lead | Experience lead | Legal researcher, Responsible AI reviewer, Fact Checker; Cyrus | #4; claim evidence; updated #43; wording corrections #46 | C2 + #43 homepage candidates added; #46 wording corrections applied; no public claim approved | [Registers](README.md#shared-registers) |
| `docs/experience/experience-requirements.md` | Experience lead | — | Content lead, Quality/reliability engineer, Fact Checker; Cyrus | #5; #3 | C2; future requirements only | [Experience](README.md#child-research) |
| `docs/experience/accessibility-seo-performance.md` | Experience lead | — | Content lead, Quality/reliability engineer, Fact Checker; Cyrus | #5; experience requirements | C2; sole proposed performance budget; no audit/conformance claim | [Experience](README.md#child-research) |
| `docs/experience/acceptance-journeys.md` | Experience lead | — | Content lead, Quality/reliability engineer, Fact Checker; Cyrus | #5; experience gates | C2; every result remains not tested | [Experience](README.md#child-research) |
| `docs/research/customer-platform-options.md` | Identity/data engineer | Quality/reliability engineer → Legal researcher → Content lead → **Platform engineer (latest)**; Identity/data engineer and all prior correction owners are locked out from Platform engineer's rejected-revision correction | Platform engineer, Legal researcher, Responsible AI reviewer, Fact Checker; Cyrus | #6; #3, RWL .3 | C2; unselected shortlist / blocked evidence retained; correction provenance only, not approval | [Customer platform](README.md#child-research) |
| `docs/research/customer-platform-source-register.md` | Identity/data engineer | Quality/reliability engineer | Fact Checker, domain reviewers; Cyrus | #6; customer options | C2; source statuses remain claim-specific | [Customer platform](README.md#child-research) |
| `docs/privacy/data-inventory.md` | Identity/data engineer | Quality/reliability engineer | Legal researcher, Responsible AI reviewer, Fact Checker; Cyrus/professionals | #6; customer options, backup schedule | C2; professional decisions pending | [Customer platform](README.md#child-research) |
| `docs/privacy/data-lifecycle.md` | Identity/data engineer | Quality/reliability engineer | Legal researcher, Responsible AI reviewer, Fact Checker; Cyrus/professionals | #6; data inventory, backup schedule | C2; future tests / professional decisions pending | [Customer platform](README.md#child-research) |
| `docs/architecture/customer-platform.md` | Identity/data engineer | Quality/reliability engineer → **Experience lead (latest; N-09 vendor-neutral revision)** | Platform engineer, Legal researcher, Responsible AI reviewer, Fact Checker; Cyrus | #6; options + privacy | C2; proposed, not deployed or approved | [Customer platform](README.md#child-research) |
| `docs/spikes/connectors/README.md` | Identity/data engineer | Quality/reliability engineer | Legal researcher, Responsible AI reviewer, Fact Checker; Cyrus | #6; customer architecture | C2; no mechanism spike run | [Connector packets](README.md#child-research) |
| `docs/spikes/connectors/onedrive.md` | Identity/data engineer | Quality/reliability engineer | Legal researcher, Responsible AI reviewer, Fact Checker; Cyrus | #6; approved future tenant/app | C2; blocked/deferred, not tested | [Connector packets](README.md#child-research) |
| `docs/spikes/connectors/google-drive.md` | Identity/data engineer | Quality/reliability engineer | Legal researcher, Responsible AI reviewer, Fact Checker; Cyrus | #6; approved future project/app | C2; blocked/deferred, not tested | [Connector packets](README.md#child-research) |
| `docs/spikes/connectors/box.md` | Identity/data engineer | Quality/reliability engineer | Legal researcher, Responsible AI reviewer, Fact Checker; Cyrus | #6; approved future enterprise/app | C2; blocked/deferred, not tested | [Connector packets](README.md#child-research) |
| `docs/payments/phase-4-evaluation.md` | Identity/data engineer | Quality/reliability engineer → **Platform engineer (latest)**; Identity/data engineer, Quality/reliability engineer, Legal researcher and Content lead remain preserved as prior locked-out authors for Platform engineer's rejected-revision correction | Platform engineer, Legal researcher, Responsible AI reviewer, Fact Checker; Cyrus/professionals | #6; customer architecture | C2; no processor/payment selected, tested or approved | [Payments](README.md#child-research) |
| `docs/security/threat-model.md` | Quality/reliability engineer | Identity/data engineer | Platform engineer, Experience lead, Fact Checker; Cyrus | #7; child inputs | C2; proposed baseline only | [Security](README.md#child-research) |
| `docs/security/control-test-matrix.md` | Quality/reliability engineer | Identity/data engineer | Platform engineer, Experience lead, Fact Checker; Cyrus | #7; threat model | C2; future tests only | [Security](README.md#child-research) |
| `docs/security/incident-detection-response.md` | Quality/reliability engineer | Identity/data engineer | Platform engineer, Experience lead, Fact Checker; Cyrus | #7; threat model | C2; no operating capability proven | [Security](README.md#child-research) |
| `docs/security/backup-recovery.md` | Quality/reliability engineer | Identity/data engineer | Platform engineer, Legal researcher, Fact Checker; Cyrus | #7; privacy schedule | C2; no backup/restore proven | [Security](README.md#child-research) |
| `docs/security/supply-chain.md` | Quality/reliability engineer | Identity/data engineer | Platform engineer, Fact Checker; Cyrus | #7; main-only model | C2; no SLSA/SBOM/provenance claim | [Security](README.md#child-research) |
| `docs/security/quality-strategy.md` | Quality/reliability engineer | Identity/data engineer (RAI-04 lockout) | Experience lead, Platform engineer, Responsible AI reviewer, Fact Checker; Cyrus | #7; all phase requirements | C2; Responsible AI reviewer Green for fingerprinted revision; future tests pending | [Security](README.md#child-research) |
| `docs/research/platform-options.md` | Platform engineer | Product lead | Quality/reliability engineer, Fact Checker; Cyrus | #8; #3, RWL .3 | C2; all exact combinations unscored | [Platform](README.md#child-research) |
| `docs/research/platform-source-register.md` | Platform engineer | Product lead | Quality/reliability engineer, Fact Checker; Cyrus | #8; platform options | C2; blocked quotes/terms retained | [Platform](README.md#child-research) |
| `docs/cost/cost-model.md` | Platform engineer | Product lead | Quality/reliability engineer, Fact Checker; Cyrus | #8; RWL .3 + sources | C2; planning arithmetic only, no TCO score | [Platform](README.md#child-research) |
| `docs/cost/reference-workloads.md` | Platform engineer workload inputs | Identity/data engineer (independent correction/file author) | Quality/reliability engineer, Fact Checker; Cyrus | #8; FCR-002/F-03/F-04 | C2; `RWL-2026-08-25.3` proposed, not approved | [Platform](README.md#child-research) |
| `docs/architecture/platform-portability.md` | Platform engineer | Product lead | Quality/reliability engineer, Fact Checker; Cyrus | #8; platform + cost + RWL .3 | C2; symmetric fixture plan, no spike run | [Platform](README.md#child-research) |
| `docs/legal/jurisdiction-matrix.md` | Legal researcher | — | Fact Checker, Responsible AI reviewer, professionals; Cyrus | #9; market facts | C2; issue spotting / professional decisions pending | [Legal](README.md#child-research) |
| `docs/legal/compliance-checklist.md` | Legal researcher | — | Fact Checker, Responsible AI reviewer, professionals; Cyrus | #9; jurisdiction matrix | C2; claim-specific source statuses | [Legal](README.md#child-research) |
| `docs/legal/legal-pages-requirements.md` | Legal researcher | — | Fact Checker, Responsible AI reviewer, professionals; Cyrus | #9; jurisdiction matrix | C2; F-09 deferral recorded; no publishable legal copy | [Legal](README.md#child-research) |
| `docs/legal/content-ip-review.md` | Legal researcher | — | Fact Checker, Responsible AI reviewer, professionals; Cyrus | #9; rights/license inventory | C2; no clearance opinion | [Legal](README.md#child-research) |
| `docs/legal/phase-review-gates.md` | Legal researcher | — | Fact Checker, Responsible AI reviewer, professionals; Cyrus | #9; legal artifacts | C2; all named professional gates pending | [Legal](README.md#child-research) |
| `docs/legal/license-inventory.md` | Cyrus / initial project governance | — | Legal researcher, Fact Checker, qualified IP counsel; Cyrus | #9 / repository baseline | Initial inventory; professional review pending | [Registers](README.md#shared-registers) |
| `docs/legal/professional-review-register.md` | Legal researcher; integrated by Product lead | — | Fact Checker, qualified professionals; Cyrus | #9; phase legal gates | C2; every professional disposition pending | [Registers](README.md#shared-registers) |
| `docs/requirements/business-product-requirements.md` | Product lead | Platform engineer (N-08 token custody) → **Experience lead (latest; FCR-016 scheduling neutrality)**; Platform engineer is locked out from Experience lead's rejected-revision correction | all workstream owners, Fact Checker; Cyrus | #3; #4-#9 | C2 synthesis; no implementation authorization or approval | [Synthesis](README.md#pr-2-synthesis) |
| `docs/architecture/decision-framework.md` | Product lead | Platform engineer (FCR lockout) | Quality/reliability engineer, Fact Checker; Cyrus | #3; #5/#7/#8 + RWL .3 | C2 synthesis; proposed unapproved method, all options unscored | [Synthesis](README.md#pr-2-synthesis) |
| `docs/architecture/recommendation.md` | Product lead | Platform engineer (FCR lockout) | all owners, Fact Checker; Cyrus | #3; framework + #4-#9 | C2 synthesis; neutral evidence cycle, no selection | [Synthesis](README.md#pr-2-synthesis) |
| `docs/decisions/README.md` | Product lead (integration) | Fact Checker | relevant owners, Fact Checker, professionals; Cyrus | #3; recommendation | C2 integration ledger; no ADR accepted | [Decisions](README.md#proposed-adrs) |
| `docs/decisions/adr-001-rendering-and-content.md` | Product lead | Platform engineer | Experience lead, Content lead, Quality/reliability engineer, Fact Checker; Cyrus | #3; recommendation + #4/#5/#8 | C2 synthesis; proposed, no rendering selection | [Decisions](README.md#proposed-adrs) |
| `docs/decisions/adr-002-hosting-dns-email-cicd.md` | Product lead | Platform engineer | Quality/reliability engineer, Fact Checker; Cyrus | #3; #7/#8 | C2 synthesis; proposed, no host/vendor selection | [Decisions](README.md#proposed-adrs) |
| `docs/decisions/adr-003-customer-platform-phases.md` | Product lead | Platform engineer | Identity/data engineer, Quality/reliability engineer, Legal researcher, Responsible AI reviewer, Fact Checker; Cyrus | #3; #6/#7/#9 | C2 synthesis; proposed, no vendor selection | [Decisions](README.md#proposed-adrs) |
| `docs/decisions/adr-004-privacy-security-reliability.md` | Product lead | Platform engineer | Identity/data engineer, Quality/reliability engineer, Legal researcher, Responsible AI reviewer, Fact Checker, professionals; Cyrus | #3; #6/#7/#9 | C2 synthesis; proposed, professional gates pending | [Decisions](README.md#proposed-adrs) |
| `docs/decisions/adr-005-cost-portability-and-lock-in.md` | Product lead | Platform engineer (prior synthesis correction) → **Identity/data engineer (latest; N-10/FCR-017 exit symmetry)** | Quality/reliability engineer, Fact Checker; Cyrus | #3; #8 + RWL .3 | C2 synthesis; proposed method, no score, selection or approval | [Decisions](README.md#proposed-adrs) |
| `docs/decisions/adr-006-repository-content-and-legal-gates.md` | Product lead | Platform engineer | Content lead, Legal researcher, Responsible AI reviewer, Fact Checker, professionals; Cyrus | #3; #4/#9 | C2 synthesis; proposed, no legal/public approval | [Decisions](README.md#proposed-adrs) |
| `docs/decisions/approvals.md` | Coordinator/Decision recorder; integrated by Product lead | Fact Checker (Cycle 2); Work monitor (N-01/N-04); Legal researcher (N-11 final ledger, then lifecycle evidence) | Fact Checker, professionals; Cyrus | Refs #3 and #4-#9; committed identifiers | Reviewed incorporation commit and PR #10 recorded; exact final-head approval pending | [Registers](README.md#shared-registers) |
| `docs/roadmap/phase-gates.md` | Product lead | Quality/reliability engineer (RAI-03 lockout) | all owners, Responsible AI reviewer, Fact Checker; Cyrus | #3; ADRs + legal gates | C2; Responsible AI reviewer Green for fingerprinted revision; no phase authorized | [Roadmap](README.md#pr-2-synthesis) |
| `docs/roadmap/implementation-backlog.md` | Product lead | Quality/reliability engineer (RAI-03 lockout) | all owners, Responsible AI reviewer, Fact Checker; Cyrus | #3; phase gates | C2; docs-only, no implementation issue authorized | [Roadmap](README.md#pr-2-synthesis) |
| `docs/roadmap/ownership-matrix.md` | Product lead | Quality/reliability engineer | all owners, Fact Checker; Cyrus | #3; backlog | C2; proposed, no assignment authorized | [Roadmap](README.md#pr-2-synthesis) |
| `docs/reviews/fact-check-report.md` | Fact Checker | — | Cyrus / assigned re-reviewers | Refs #3 and #4-#9; evaluation work package | Original/intermediate **REVISE** history preserved; terminal FCR-018 verdict **CLEAR**: 0 unresolved content / 0 unresolved ledger / 0 new findings | [Reviews](README.md#independent-reviews) |
| `docs/reviews/rai-review.md` | Responsible AI reviewer | — | Cyrus / Responsible AI reviewer | #3; evaluation work package | Original **REJECT** preserved; re-review **GREEN**, 4 resolved / 0 unresolved, fingerprinted working tree; canonical identifiers pending | [Reviews](README.md#independent-reviews) |
| `docs/reviews/adversarial-review.md` | Independent rubber-duck review (not Fact Checker) | Fact Checker (Cycle 2 register); Work monitor (second-pass status ledger); Legal researcher (N-11 ledger) | independent adversarial reviewer; Cyrus | Refs #3 and #4-#9; F/N/R register | Original **Reject** and intermediate **Revise** history preserved; independent FCR-018 recheck **CLEAR**: 0 unresolved content / 0 unresolved ledger / 0 new findings | [Reviews](README.md#independent-reviews) |

## Coverage rule

All **61/61** Markdown artifacts currently under `docs/` are listed above and
linked from `docs/README.md`. There are no intentionally unindexed documentation artifacts.
Re-run coverage and local-link validation after any file is added, renamed, or
removed.

## Remaining integration sequence

The reviewed incorporation commit, draft PR #10, child comments, and explicit
#4-#9 closures are complete. Validate these ledger-only edits, commit and push
them, then verify PR #10's exact head plus its draft and `main` base state. That
next ledger-only commit becomes the candidate final head only after validation
and push; resolve the four changed ledgers' canonical blob OIDs from it and
record/report its exact full SHA externally for Cyrus. Keep #3 open. Do not
merge or deploy. Every decision and named professional gate remains pending,
and Cyrus must approve that exact full SHA.
