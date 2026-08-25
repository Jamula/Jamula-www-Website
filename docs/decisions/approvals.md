# Approval Register

## Canonical identifier rule

After commit, an artifact approval must record:

1. the artifact's Git blob OID resolved from the exact PR head, for example
   `git rev-parse <full-PR-head-SHA>:docs/path.md`; and
2. the full PR head commit SHA.

Git's configured repository object format controls OID length. A changed artifact
has a new blob OID; any material commit creates a new PR head and invalidates an
approval tied to the prior head.

Raw filesystem SHA-256 is not canonical because Git checkout conversion can
produce CRLF or LF bytes for the same committed blob. The historical evaluation
plan value
`DCBAB8BC95E5DEEA46ADF3C0C2D869D3523F99CBEB4D1F60712768F1BD429748`
was calculated from a **CRLF byte representation**. The current LF checkout has a
different raw SHA-256. The CRLF value is retained only as a legacy audit note; it
is not portable artifact proof and must not approve this evaluation work package.

## Pending approvals

Reviewed incorporation commit
`d02a2448a5438fb0e895c4c46166fe39c79ccb86` and [draft PR
#10](https://github.com/Jamula/Jamula-www-Website/pull/10) are lifecycle
evidence, not approval. PR #10 targets `main` from branch
`u/cyrusjamula/3-website-platform-evaluation` and is intentionally stacked on
unmerged draft PR #2 (`cyrusjamula-jamula-website-platform-evaluation`); its
diff will narrow after PR #2 merges. Issue #1 and PR #2 were not part of the
#4-#9 closure action. No proposal is accepted. No platform, vendor, ADR, public
claim, founder wording, legal text, professional conclusion, implementation, or
deployment is approved.

| Gate | Required approver | Canonical artifact blob OID / PR head | Outcome | Conditions / residual action | Recorded |
|---|---|---|---|---|---|
| Evaluation-plan historical baseline | Cyrus Jamula | Git blob OID and relevant committed head not yet recorded here; legacy CRLF SHA-256 above | Historical execution approval only; **not evaluation work-package approval** | Record canonical Git identifiers if the baseline must be cited for this work package | 2026-08-25 legacy record |
| Issue DAG, original ownership and Cycle 2 lockouts | Cyrus Jamula | `docs/planning/work-ownership.md` blob OID **pending** / exact final PR head **pending** | Pending; lockouts and N-11 reconciliation preserved; lifecycle evidence recorded | #4-#9 closed completed after comments; #3 open while PR #10 is draft; validate/commit/push ledger and record exact identifiers | 2026-08-25 lifecycle update |
| Child artifact incorporation/remediation | Cyrus Jamula | reviewed incorporation commit `d02a2448a5438fb0e895c4c46166fe39c79ccb86`; per-artifact blob OIDs and exact final PR head **pending** | All six child workstreams incorporated; comments and explicit completed closures recorded; approval pending | Draft PR #10 is evidence only; Rai Green remains limited to fingerprinted revision and material changes reopen affected findings | 2026-08-25 |
| `RWL-2026-08-25.3` workload dictionary | Cyrus Jamula | `docs/cost/reference-workloads.md` blob OID **pending** / PR head **pending** | Proposed / pending | Approve exact version, quantities, labor basis and change control; professional/coverage quotes remain separate | - |
| Bounded symmetric evidence cycle / **no platform selected** | Cyrus Jamula | framework/recommendation/fixture blob OIDs **pending** / PR head **pending** | Proposed / pending; all options unscored | Freeze exact fixtures, plans, quotes, RWL .3, hard gates, deductions, threshold, risk ceiling and raw-evidence protocol before running | - |
| Platform/vendor selection | Cyrus Jamula | No decision artifact | **No selection / no approval** | Symmetric evidence cycle, required reviews, professional gates and separate later decision SHA | - |
| ADR-001 through ADR-006 | Cyrus Jamula | individual ADR blob OIDs **pending** / PR head **pending** | Proposed / pending; **none accepted** | Final independent/domain/professional reviews; no scoring result can waive a gate | - |
| Phase gates, roadmap and implementation ownership | Cyrus Jamula | roadmap blob OIDs **pending** / PR head **pending** | Proposed / pending; Rai Green for fingerprinted revision | No implementation issue/work authorized; canonical identifiers and Cyrus approval pending | - |
| Fact Checker remediation disposition | Eligible independent re-reviewer + Cyrus | changed-artifact blob OIDs **pending** / PR head **pending** | Original/intermediate Revise history preserved; terminal FCR-018 verdict **CLEAR: 0 unresolved content / 0 unresolved ledger / 0 new findings** | FCR-018 and remaining N-11 owner-provenance defect resolved; canonical identifiers/Cyrus approval remain pending | 2026-08-25 terminal FCR-018 verification |
| Responsible AI/content-safety disposition | Rai + Cyrus | fingerprinted working-tree SHA-256 values recorded in `rai-review.md`; canonical blob OIDs **pending** / PR head **pending** | Original Red preserved; remediation re-review **GREEN: 4 resolved / 0 unresolved** | Green applies only to fingerprinted files; material change reopens affected finding; Cyrus/professional approvals pending | 2026-08-25 re-review |
| Adversarial F/N/R disposition | Independent adversarial reviewer + Cyrus | remediation ledger and changed-artifact blob OIDs **pending** / PR head **pending** | Original Reject and intermediate Revise history preserved; independent FCR-018 recheck **CLEAR: 0 unresolved content / 0 unresolved ledger / 0 new findings** | FCR-018 and remaining N-11 owner-provenance defect resolved; canonical identifiers/Cyrus approval remain pending | 2026-08-25 independent FCR-018 recheck |
| Founder wording and public claims | Cyrus Jamula | exact approved content/register blob OIDs **pending** / PR head **pending** | Pending / no wording approved | Founder facts remain absent; Fact Checker, Sarek, Rai and applicable rights/professional review | - |
| Legal pages and professional gates | Named qualified professionals + Cyrus | approved text/opinion blob OIDs or controlled records **pending** / PR head **pending** | Pending professional review | Requirements are not legal drafts; AI/Squad cannot close counsel/CPA/acquirer-QSA/broker/accessibility gates | - |
| Draft PR #10 candidate final head | Cyrus Jamula | Reviewed incorporation commit `d02a2448a5438fb0e895c4c46166fe39c79ccb86`; exact final PR head **pending** | PR #10 open as draft to `main`; d02a244 is not the final head | Validate these ledger edits; commit/push; verify exact PR head plus draft/base state; resolve changed-ledger blob OIDs; report exact full SHA externally for Cyrus | 2026-08-25 lifecycle evidence |
| PR #10 merge/deployment | Cyrus Jamula | Final approved PR head **pending** | Pending; no PR merged and no production deployment occurred | Required checks, professional gates and Cyrus approval of exact full head; merge does not itself authorize production deployment | - |

## Lifecycle and identifier procedure

1. **Complete:** freeze the reviewed domain tree in commit
   `d02a2448a5438fb0e895c4c46166fe39c79ccb86`; open draft PR #10 to `main`;
   comment on #4-#9 with the commit and PR; explicitly close those children.
2. **Pending:** validate these ledger-only edits, then commit and push them. The
   next ledger-only commit becomes the candidate final head only after validation
   and push; do not label d02a244 as the final PR head.
3. **Pending:** verify PR #10's exact head, draft state, and `main` base.
4. **Pending:** resolve the four changed ledger artifacts' canonical Git blob
   OIDs from that exact head. Their OIDs cannot be recorded before the commit
   exists.
5. **Pending:** record/report the exact full candidate-final-head SHA externally
   for Cyrus. Keep #3 open and PR #10 draft; do not merge.
6. Keep every decision and professional gate pending until Cyrus explicitly
   approves that exact full SHA; never carry approval forward by filename or
   prose similarity.
