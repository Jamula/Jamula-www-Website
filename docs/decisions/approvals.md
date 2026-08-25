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
is not portable artifact proof and must not approve PR 2.

## Pending approvals

No PR 2 proposal is accepted. No platform, vendor, ADR, public claim, founder
wording, legal text, professional conclusion, implementation, or deployment is
approved.

| Gate | Required approver | Canonical artifact blob OID / PR head | Outcome | Conditions / residual action | Recorded |
|---|---|---|---|---|---|
| Evaluation-plan historical baseline | Cyrus Jamula | Git blob OID and relevant committed head not yet recorded here; legacy CRLF SHA-256 above | Historical execution approval only; **not PR 2 approval** | Record canonical Git identifiers if the baseline must be cited in PR 2 | 2026-08-25 legacy record |
| Issue DAG, original ownership and Cycle 2 lockouts | Cyrus Jamula | `docs/planning/work-ownership.md` blob OID **pending** / PR head **pending** | Pending; N-11 final ledger reconciliation complete | Issues #3-#9 currently open; validate, commit, draft PR, child comments/closure and exact identifiers remain | - |
| Child artifact incorporation/remediation | Cyrus Jamula | per-artifact blob OIDs **pending** / PR head **pending** | All six child workstreams #4-#9 incorporated in working tree; approval pending | Commit/PR evidence and child comments/explicit closure pending; Rai Green remains limited to fingerprinted revision and material changes reopen affected findings | - |
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
| PR 2 exact head / draft readiness | Cyrus Jamula | PR head **pending** | Pending | Validate exact tree; commit; open draft PR with `Closes #3`; then child comments/explicit closure and ledger check; complete identifiers | - |
| PR 2 merge/deployment | Cyrus Jamula | Final approved PR head **pending** | Pending | Required checks and approvals; merge does not itself authorize production deployment | - |

## Recording procedure after commit

1. Freeze the reviewed working tree and commit it.
2. Record the full commit SHA intended as the draft PR head.
3. Resolve the Git blob OID for every approval-scoped artifact from
   that commit, not from mutable filesystem bytes.
4. Open the draft PR to `main` with `Closes #3`; do not merge it.
5. Post #4-#9 incorporation comments identifying the actual commit and PR, then
   explicitly close #4-#9 and check/update the ledger. Keep #3 open.
6. Record/reconfirm the canonical blob OIDs and full final PR-head SHA. If a
   material ledger update changes the head, repeat affected review and capture.
7. Keep the PR draft and every decision pending until Cyrus explicitly approves
   that exact head; never carry approval forward by filename or prose similarity.
