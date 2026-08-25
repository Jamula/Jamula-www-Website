# Independent Adversarial Review — Findings and Remediation Register

**Source review:** Independent rubber-duck adversarial review supplied to the
Cycle 2 integration process

**Original verdict:** **REJECT**

**Findings:** F-01 through F-09

**Assigned adversarial re-reviewers:** Fact Checker and Ralph

**Ledger revision owner:** Fact Checker

**Status:** The original Reject and every intermediate Revise section are
preserved below as review history. The appended final independent verification
reports **0 unresolved content findings / 0 new findings** and a content verdict
of **CLEAR** after this N-11 ledger reconciliation. Canonical Git identifiers,
Cyrus approval, professional gates, blocked/deferred evidence, and future
implementation tests remain pending.

## Provenance and limits

Fact Checker did **not** perform or retroactively adopt authorship of the source
rubber-duck review. This file preserves its findings and maps them to the
independently revised artifacts. It is a remediation register, not a recreated
transcript, approval, source quote, test result, professional opinion, or claim
that the reviewer re-reviewed the changes.

No raw vendor quote, live platform test, connector test, accessibility audit,
restore exercise, professional review, issue closure, commit, or PR is fabricated
here. At this first-pass register point, the original Reject remained in force
pending independent re-review. The later second-pass verdict is appended below;
it does not grant approval.

## Independent revision ownership

| Original scope | Independent revision owner | Lockout/result |
|---|---|---|
| Picard synthesis and ADRs | Geordi La Forge | Picard did not revise the rejected synthesis |
| Geordi platform/cost artifacts | Jean-Luc Picard | Geordi did not revise the rejected platform/cost cycle |
| Geordi-derived workload inputs | Seven of Nine | Independent correction captured as `RWL-2026-08-25.2` |
| Miles security/quality | Seven of Nine | Miles did not revise the rejected quality/security cycle |
| Seven customer/privacy | Miles O'Brien | Seven did not revise the rejected customer/privacy cycle |
| Picard roadmap | Miles O'Brien | Picard did not revise the rejected roadmap cycle |
| Uhura editorial/content | Jadzia Dax | Uhura did not revise the rejected editorial cycle |
| Uhura founder artifacts | Sarek | Uhura did not revise the rejected founder cycle |
| Picard integration ledgers | Fact Checker | Picard is locked out; Fact Checker cannot approve this revision |

Legal-draft deferral does not assert that an AI reviewer supplied legal text. No
independent child-legal rewrite owner is inferred: qualified counsel must later
draft or approve any exact legal-page language.

## First-pass finding and remediation register

The statuses in this section are the preserved first-pass remediation snapshot.
They are superseded only where the attributed second-pass section says so.

### F-01 — Post-hoc scoring

- **Original finding summary:** Platform scores were presented after an exploratory
  rubric/workload process that Cyrus had not preregistered or approved, allowing
  the record to look decision-grade after the fact.
- **Assigned remediation:** Geordi independently revised Picard synthesis/ADRs;
  Picard independently revised Geordi platform/cost artifacts.
- **Remediation artifacts:** `docs/research/platform-options.md` withdraws every
  prior score/rank; `docs/architecture/decision-framework.md` requires a frozen
  preregistration packet; `docs/architecture/recommendation.md` recommends only a
  new evidence cycle; ADR-001 and ADR-005 preserve that posture.
- **Working-tree status:** **Remediated pending re-review.** Every exact option is
  unscored; no platform result is approval-eligible.
- **Residual decision:** Cyrus must first approve the exact workload, fixtures,
  gates, rubric, deductions, threshold, risk ceiling, protocol, spending limit and
  artifact identifiers. A later result requires a separate approval.

### F-02 — Unnamed option bypassing hard gates

- **Original finding summary:** An unnamed “custom static + portable host” composite
  could bypass plan-specific commercial, routing, recovery, accessibility,
  operations and exit gates.
- **Assigned remediation:** Geordi revised the Picard framework/recommendation;
  Picard revised the Geordi platform/portability artifacts.
- **Remediation artifacts:** `docs/architecture/decision-framework.md` and
  `docs/architecture/platform-portability.md` define `STATIC-AZ-01`,
  `STATIC-NL-01`, `STATIC-CF-01`, `STATIC-VC-01`, and `MWP-PORT-01`; every fixture
  must freeze exact product/version/region/plan/add-ons/quote and clear all hard
  gates before scoring.
- **Working-tree status:** **Remediated pending re-review.** None of the fixtures
  has frozen terms, passed gates, run, or received a score.
- **Residual decision:** Obtain exact commercial and technical evidence, approve
  the symmetric protocol, run it, preserve raw observations, and block any fixture
  with missing evidence.

### F-03 — Workload and TCO mismatch

- **Original finding summary:** Public-platform and customer-platform tables used
  incompatible customer, user, storage, connector and AI quantities, while broad
  reserves appeared beside precise TCO outputs.
- **Assigned remediation:** Seven created the independent workload correction;
  Picard revised cost/platform artifacts; Miles revised customer/privacy artifacts;
  Geordi revised synthesis.
- **Remediation artifacts:** `docs/cost/reference-workloads.md` version
  `RWL-2026-08-25.2` is the sole proposed numerical dictionary;
  `docs/cost/cost-model.md` limits platform TCO to Phase 1 and separates Phase 2-5
  reserves; customer research cites the same R0/L1/A1/G1 dimensions.
- **Working-tree status:** **Remediated pending re-review.** RWL .2 and labor-rate
  sensitivities remain proposed; missing rates are blocked rather than `$0`.
- **Residual decision:** Cyrus approves the exact workload/version and labor rate;
  dated quotes replace allowances; Phase 2-5 costs remain separately calculated.

### F-04 — Control-labor mismatch

- **Original finding summary:** Cost labor bands conflicted with the security
  operating model and did not price P3+ 24x7 coverage.
- **Assigned remediation:** Seven independently reconciled the reference workload;
  Picard revised Geordi's cost model using Miles's existing authoritative incident
  coverage table.
- **Remediation artifacts:** `docs/cost/reference-workloads.md` and
  `docs/cost/cost-model.md` use cumulative active-control floors of P1 14, P2 24,
  P3 40, P4 52, and P5 62 hours/month when P4 is live. P3+ 24x7 coverage is
  additional and explicitly unpriced.
- **Working-tree status:** **Remediated pending re-review.** No staffing plan,
  rota, compensation model, SOC/MSP quote, or incident-remediation allowance is
  claimed.
- **Residual decision:** Cyrus funds a feasible coverage model; obtain staffing or
  managed-service quotes and validate cadence/ownership before launch.

### F-05 — Asymmetric WordPress test

- **Original finding summary:** Static portability and managed WordPress were not
  held to identical work, evidence, recovery, performance, security, labor and exit
  tests.
- **Assigned remediation:** Picard revised Geordi's portability plan; Geordi
  revised Picard's framework and ADRs.
- **Remediation artifacts:** The framework and portability contract apply the same
  content corpus, redirect map, accessibility/performance gates, provenance,
  security, backup/recovery, export, clean-environment rebuild, migration, operator
  time, cost and exit tests to all four static fixtures and `MWP-PORT-01`.
- **Working-tree status:** **Remediated pending re-review.** The managed host/plan,
  WordPress/theme/plugin versions and support/backup contract are not yet named, so
  the fixture is blocked and unscored.
- **Residual decision:** Freeze identical evidence windows and stop rules; run no
  arm until its exact commercial terms and hard gates are available.

### F-06 — Backup/privacy contradiction

- **Original finding summary:** Security proposed long weekly/monthly backups while
  privacy promised ordinary personal/customer backup expiry within 35 days.
- **Assigned remediation:** Seven revised Miles's backup/security artifacts; Miles
  revised Seven's privacy artifacts.
- **Remediation artifacts:** `docs/security/backup-recovery.md` now owns one
  classification-specific schedule. `docs/privacy/data-inventory.md` and
  `docs/privacy/data-lifecycle.md` point to it: C2 personal/customer/tenant and
  exceptional C3 recovery points have a 35-day maximum; long-lived C0/C1 points
  exclude personal/customer data/secrets; authoritative records and C5 legal holds
  are separated from product backups; restore replays tombstones before service.
- **Working-tree status:** **Remediated pending re-review.** This is a proposed
  design and future test; no backup, deletion, legal hold or restore is proven.
- **Residual decision:** Qualified counsel/CPA approve record and hold schedules;
  vendors must meet deletion/expiry terms; implementation must pass quarantine,
  tombstone, authorization and clean-room restore tests.

### F-07 — Conflicting performance budgets

- **Original finding summary:** Experience and quality artifacts specified different
  aggregate/category budgets and units.
- **Assigned remediation:** Seven revised Miles's quality strategy; Dax's experience
  artifact remains the authority.
- **Remediation artifacts:** `docs/security/quality-strategy.md` names
  `docs/experience/accessibility-seo-performance.md` section 6 as the sole normative
  table, uses binary KiB/MiB, and mirrors the 900/1,500 KiB aggregates and category
  limits without establishing a second authority.
- **Working-tree status:** **Remediated pending re-review.** Budgets are future
  release tests; no deployed page or field Core Web Vitals result exists.
- **Residual decision:** Implement one generated/parsed source of thresholds and
  run lab, accessibility and field evidence against the exact release.

### F-08 — Approval/issue ledger reproducibility and closure

- **Original finding summary:** Working-tree status could imply issue completion,
  while raw filesystem SHA-256 did not provide portable approval identity across
  CRLF/LF checkouts.
- **Assigned remediation:** Fact Checker independently revised Picard's integration
  ledgers; Fact Checker cannot approve this work.
- **Remediation artifacts:** `docs/artifacts-manifest.md`,
  `docs/planning/work-ownership.md`, `docs/README.md`,
  `docs/decisions/approvals.md`, and `docs/decisions/README.md` now record issues
  #3-#9 as open, preserve original/revision ownership, and define canonical
  post-commit identity as per-artifact Git blob OIDs plus the full PR head commit
  SHA. The historical evaluation-plan SHA is labeled CRLF-based legacy evidence.
- **Working-tree status:** **Remediated pending re-review.** No commit, blob-OID
  record, issue closure/comment, or draft PR exists yet.
- **Residual decision:** Re-review, commit, capture identifiers, open draft PR 2,
  then comment on and explicitly close child issues; obtain Cyrus approval of the
  exact final head. Any material commit requires renewed identifiers/review.

### F-09 — Legal-draft deferral

- **Original finding summary:** Requirements could be mistaken for completed legal
  pages or AI-generated legal advice when actual markets, data flows, contracts and
  professional review were unresolved.
- **Assigned remediation:** The package records deferral rather than assigning an
  AI agent to produce legal text. Sarek remains the #9 issue-spotting owner;
  qualified professionals own future legal conclusions and copy.
- **Remediation artifacts:** `docs/legal/legal-pages-requirements.md` says no copy is
  publishable and defers exact drafting/approval to qualified counsel;
  `docs/legal/phase-review-gates.md`,
  `docs/legal/professional-review-register.md`, ADR-006, the recommendation and
  approval register retain professional and Cyrus gates.
- **Working-tree status:** **Remediated pending re-review.** No legal page,
  applicability opinion, tax/accounting decision, PCI scope, insurance decision or
  trademark clearance is approved.
- **Residual decision:** Cyrus commissions appropriately qualified professionals
  after facts/flows are fixed; exact text/opinions are tied to committed artifacts,
  conditions, expiry and re-review triggers.

## First-pass residual blockers and next actions

This is the historical action list at the first-pass register point. The
second-pass record below supplies the current review state.

1. Fact Checker and Ralph independently re-review F-01 through F-09 against the
   exact diff; this ledger cannot satisfy that assignment.
2. At that historical point, Rai had not re-reviewed RAI-01 through RAI-04 and
   the original Red/Reject remained active.
3. An eligible independent reviewer re-checks the unchanged Fact Checker report's
   findings against the remediated artifacts.
4. Cyrus approves neither `RWL-2026-08-25.2` nor the symmetric protocol by
   implication; both require explicit exact-identifier approval.
5. Vendor quotes, commercial terms, live mechanism tests, accessibility/field
   evidence, staffing/coverage, restore/deletion evidence and professional
   dispositions remain future evidence.
6. After re-review, commit and record every approval-scoped Git blob OID and the
   full PR head commit SHA.
7. Issues #4-#9 require committed-evidence comments and explicit closure; #3 and
   draft PR 2 remain pending the complete package and Cyrus exact-head approval.

## Second adversarial pass

This entire second-pass section is preserved historical review text. Its
then-current Revise status, counts, assignments, and remaining sequence are
superseded for the current working tree by the final independent verification
appended below.

**Reviewer:** Independent adversarial reviewer (read-only; not Fact Checker or
Ralph)

**Review date:** 2026-08-25

**Verdict:** **REVISE**

**Scope and attribution:** The reviewer re-read the complete current working
tree, the preserved F-01 through F-09 register, the Fact Checker report, the Rai
review, and the integration ledgers. The reviewer edited no file. This section
records that response; Ralph changed only the five status/sequence ledgers
authorized by Cyrus. The original Reject remains immutable review history.

The package is materially improved, but the adversarial gate is not cleared.
No platform, vendor, ADR, public claim, professional conclusion, implementation,
deployment, merge, or PR 2 approval follows from this pass.

### F-01 through F-09 disposition

| Finding | Second-pass status | Exact basis and remaining action |
|---|---|---|
| F-01 post-hoc scoring | **Partial / not cleared** | Scores/ranks are withdrawn and preregistration is required in `docs/research/platform-options.md:12-24` and `docs/architecture/decision-framework.md:9-32`, but `docs/research/platform-source-register.md:53` still says WordPress variants have conditional scores/ranges. Seven of Nine owns removal or explicit historical withdrawal of that text; independent re-review remains required. |
| F-02 unnamed-option hard-gate bypass | **Resolved** | `docs/architecture/decision-framework.md:23-64` and `docs/architecture/platform-portability.md:64-102` require exact fixture/plan/version/region/add-on/quote freezing and hard gates. Fixtures remain blocked and unscored; Cyrus preregistration and future execution remain pending. |
| F-03 workload/TCO mismatch | **Resolved for the original finding; subject to N-05** | `RWL-2026-08-25.2` is the sole proposed dictionary and `docs/cost/cost-model.md:99-161` separates public-site TCO from later reserves. Recomputed displayed arithmetic is correct. Dax owns N-05 follow-up. |
| F-04 control-labor mismatch | **Resolved as disclosure/launch block, not actual funding** | Labor floors align across incident, workload, and cost artifacts; P3+ 24x7 coverage remains additional, unpriced, and blocking. Cyrus, quotes, and future staffing evidence remain pending. |
| F-05 asymmetric WordPress test | **Not resolved** | `docs/architecture/platform-portability.md:48-62` freezes a shared 250-item corpus, but `:106` assigns `MWP-PORT-01` only 50. Dax owns N-02 follow-up: require the identical 250-item manifest and a manifest SHA/count equality pre-run check. |
| F-06 backup/privacy contradiction | **Resolved** | `docs/security/backup-recovery.md:64-88` controls the classification schedule; privacy artifacts point to it and retain the 35-day ceiling and tombstone-aware quarantine. Counsel/CPA and future test evidence remain pending. |
| F-07 conflicting performance budgets | **Resolved** | `docs/security/quality-strategy.md:126-136` names Dax's `docs/experience/accessibility-seo-performance.md:154-168` table as sole authority and matches it. Generated/parsing use and release evidence remain future work. |
| F-08 approval/issue reproducibility | **Partial at review; ledger findings now corrected pending re-review** | The post-commit Git blob-OID/full-PR-head method is correct and #3-#9 are open. N-01 and N-04 caused contradictory status/sequence ledgers; Ralph resolved them in the authorized five files. The correction itself still requires independent re-review. |
| F-09 legal-draft deferral | **Resolved by explicit deferral** | Legal-page requirements state no copy is publishable and qualified counsel must draft/approve exact text. Professional and Cyrus gates remain pending. |

### New findings N-01 through N-06

The follow-up routing below is the owner assignment for this revision cycle.
It preserves reviewer evidence while applying Cyrus's requested routing.

| Finding | Second-pass evidence and impact | Follow-up owner | Current status |
|---|---|---|---|
| N-01 — stale Rai disposition ledgers | `docs/reviews/rai-review.md:124-200` records Green, 4 resolved / 0 unresolved, for six SHA-256-fingerprinted files, and the reviewer independently recomputed all six values. Five ledgers still called re-review pending, making the review state indeterminate. | **Ralph** | **Resolved by these ledger edits.** Rai Green is complete for the fingerprinted working-tree revision; canonical Git blob OIDs/full PR-head SHA, Cyrus approval, and professional gates remain pending. Material change reopens the affected RAI finding. |
| N-02 — asymmetric WordPress fixture | `docs/architecture/platform-portability.md:53` requires 250 content items while `:106` assigns `MWP-PORT-01` only 50, invalidating workload comparability. | **Jadzia Dax** | **Pending correction and independent re-review**; also keeps F-05 open. |
| N-03 — nominally unranked customer options remain ranked | `docs/research/customer-platform-options.md:12` says unranked, while `:61-62` retains fallback/upgrade ordering and `:17` calls Stripe the documentation-fit leader despite ADR-003's neutral rule. | **Sarek**, together with **FCR-004/FCR-008** follow-up | **Pending correction and independent re-review.** Remove unsupported ordering; separately repair the two unresolved FCR source/status findings. |
| N-04 — impossible child-closure sequence | The prior ledger required final child comments to identify a draft PR but ordered #4-#9 closure before opening that PR. | **Ralph** | **Resolved by these ledger edits.** Validate/commit first; open draft PR to `main` with `Closes #3`; post comments naming actual commit/PR; explicitly close #4-#9; check/update ledger; keep #3 open; no merge. |
| N-05 — A1 “same public volume” mismatch | `docs/cost/reference-workloads.md:20` says A1 uses L1 public volume, but `:51-52` doubles inquiries and retained logs. Future comparison could confound architecture with workload growth. | **Jadzia Dax** | **Pending correction before preregistration and independent re-review.** |
| N-06 — obsolete `.1` workload blocker | `docs/decisions/adr-001-rendering-and-content.md:31` says portability still uses `.1`, while `docs/architecture/platform-portability.md:50` already uses `.2`, falsely retaining a resolved blocker. | **Jadzia Dax** | **Pending correction before draft and independent re-review.** |

### Current gate and remaining sequence

Rai's original Red is preserved, and Rai's remediation re-review is Green,
4 resolved / 0 unresolved, only for the fingerprinted working-tree revision.
The Fact Checker verification remains **REVISE**, 10 resolved / 2 unresolved;
Sarek owns FCR-004/FCR-008. The second adversarial verdict remains **REVISE**:
N-01/N-04 are corrected but require re-review, while F-01, F-05,
N-02/N-03/N-05/N-06 and the two FCR findings remain open.

After those corrections and independent re-review: validate and commit; open a
draft PR to `main` using `Closes #3`; post #4-#9 incorporation comments naming
the actual commit and PR; explicitly close #4-#9; check/update the ledger while
keeping #3 open; then bind all approvals to the canonical Git blob OIDs and full
final PR-head SHA. Do not merge. Every PR 2 approval remains pending Cyrus's
approval of that exact final head and all named professional gates.

---

## Final independent adversarial verification — N-11 reconciliation

**Verification date:** 2026-08-25 Pacific
**Verification target:** Exact current uncommitted working tree and final
integration-ledger correction; no committed package identity is claimed
**Reviewer posture:** Independent, read-only content verification followed by
Sarek's authorized N-11 integration-ledger recording only
**Final content verdict:** **CLEAR**
**Unresolved content findings:** **0**
**New findings:** **0**

This section is append-only. It does not rewrite or erase the original Reject,
the second-pass Revise, or any intermediate finding evidence above.

### Read-only verification sequence

1. The initial final pass found N-03, N-07 through N-11, and R-01.
2. The follow-up sequence verified N-03, N-07, N-08, N-09, N-10, and R-01
   resolved. Within that sequence, the decisive recheck specifically verified
   FCR-016 and N-10/FCR-017 resolved.
3. That decisive recheck found 0 new findings and 0 unresolved content findings.
   N-11 was the sole remaining inconsistency before this ledger correction.
4. This reconciliation updates only the authorized integration/status ledgers
   and resolves N-11. It performs no legal analysis and changes no domain
   evidence.

### Current disposition and limits

All six child workstreams #4-#9 are incorporated in the working tree. Fact
Checker final targeted verification and this final adversarial verification
each report 0 unresolved content findings and 0 new findings. The issue bodies
remain authoritative for durable ownership: #4 Uhura, #5 Dax, #6 Seven, #7
Miles, #8 Geordi, and #9 Sarek (Refs #3 and #4-#9).

Rai's Green remains valid only for the exact working-tree files fingerprinted
in `rai-review.md`. Canonical Git blob OIDs and the full PR-head SHA are not yet
recorded, and Cyrus has not approved an exact final head. Any material change to
a fingerprinted file reopens its affected Rai finding.

No platform or vendor is selected. `RWL-2026-08-25.3` and ADR-001 through
ADR-006 remain proposed and pending Cyrus approval of exact committed
identifiers. No commit, PR, issue comment/closure, professional approval,
mechanism test, registration, spend, production code, implementation, or
deployment is claimed. Blocked/deferred evidence and future implementation
tests remain pending.

### Remaining sequence

1. Validate the exact reconciled working tree.
2. Commit it.
3. Open a draft PR to `main` with `Closes #3`; do not merge.
4. Comment on #4-#9 with the actual commit and draft PR, then explicitly close
   #4-#9.
5. Update/check the ledgers if anything material changed; keep #3 open while the
   PR is draft.
6. Record final canonical Git blob OIDs and the full PR-head SHA.
7. Keep every decision pending. Cyrus must approve that exact final head, and
   all named professional gates remain separate and pending.

---

## FCR-018 independent recheck

**Verification date:** 2026-08-25 Pacific
**Reviewer posture:** Independent, read-only recheck
**Verdict:** **CLEAR**
**Unresolved content findings:** **0**
**Unresolved ledger findings:** **0**
**New findings:** **0**

This append-only terminal section preserves the original Reject and intermediate
Revise sections above as historical review evidence.

### Verified provenance and routing

- `docs/research/customer-platform-options.md`: Seven of Nine original; Miles
  O'Brien → Sarek → Nyota Uhura → **Geordi La Forge (latest)**.
- `docs/payments/phase-4-evaluation.md`: Seven of Nine original; Miles O'Brien
  prior → **Geordi La Forge (latest)**.
- `docs/requirements/business-product-requirements.md`: Jean-Luc Picard
  original; Geordi La Forge N-08 → **Jadzia Dax (latest, FCR-016)**.
- `docs/decisions/adr-005-cost-portability-and-lock-in.md`: Jean-Luc Picard
  original; Geordi La Forge prior → **Seven of Nine (latest, N-10/FCR-017)**.
- `docs/architecture/customer-platform.md`: Seven of Nine original; Miles
  O'Brien prior → **Jadzia Dax (latest, N-09)**.
- The consolidated routing in `docs/planning/work-ownership.md` agrees with
  these file-specific chronological sequences.

### Coverage and terminal disposition

- Filesystem coverage is **60 Markdown documents / 60 manifest entries / 60 of
  60 README-linked documents**.
- Local-link validation passes.
- FCR-018 and the remaining N-11 owner-provenance defect are resolved.
- There are **0 unresolved content findings, 0 unresolved ledger findings, and
  0 new findings**.
- The independent reviewer changed no files and made no GitHub or Squad-state
  changes.

No commit, PR, issue comment or closure, merge, professional disposition,
mechanism test, registration, spend, implementation, or deployment is claimed.
Rai's fingerprint scope, the no-selection posture, pending canonical Git
blob-OID/full PR-head identifiers, professional gates, and Cyrus's exact-head
approval requirement remain unchanged.
