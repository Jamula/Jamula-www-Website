# PR 2 Work Ownership

“PR 2 work package” is the evaluation-plan phase name, not GitHub PR #2.

**Status:** All six child workstreams #4-#9 and their review corrections are
incorporated in reviewed commit
`d02a2448a5438fb0e895c4c46166fe39c79ccb86`. Fact Checker's terminal FCR-018
verdict is
**CLEAR: 0 unresolved content findings / 0 unresolved ledger findings / 0 new
findings**. The independent adversarial FCR-018 recheck is also **CLEAR: 0
unresolved content findings / 0 unresolved ledger findings / 0 new findings**.
FCR-018 and the remaining N-11 owner-provenance defect are resolved; prior
Reject/Revise dispositions remain historical. Rai re-review remains Green, 4
resolved / 0 unresolved, only for the fingerprinted working-tree revision;
material changes to those files reopen affected findings. Draft PR
[#10](https://github.com/Jamula/Jamula-www-Website/pull/10) targets `main` from
branch `u/cyrusjamula/3-website-platform-evaluation`.
Issues #4-#9 received incorporation comments naming that commit and PR, then
were explicitly closed as completed on 2026-08-25. Issue #3 remains open.
Ledger validation/commit/push, exact final-head and ledger blob identifiers,
Cyrus exact-head approval, and professional gates remain pending.

This ledger preserves issue-body ownership and reviewer lockouts. An original
author did not self-revise a rejected artifact.

## Current DAG and merge order

`#3 parent -> #4 content || #5 experience || #6 customer platform || #7
security/quality || #8 platform/cost || #9 legal -> initial Picard synthesis ->
independent Fact Checker/Rai/rubber-duck reviews -> locked independent revisions ->
Fact Checker integration-ledger remediation -> independent correction rechecks ->
N-11 ledger reconciliation -> FCR-018 owner-provenance remediation and independent
re-verification -> validation -> reviewed incorporation commit
d02a2448a5438fb0e895c4c46166fe39c79ccb86 -> open draft PR #10 to main ->
child incorporation comments naming that commit and PR -> explicit #4-#9
closure -> ledger-only lifecycle update/validation/commit/push -> verify exact PR
head and draft/base state -> canonical final-head identifiers -> Cyrus exact-head
approval`

The issue lifecycle recorded on 2026-08-25 is: #4, #5, #6, #7, #8, and #9 are
**CLOSED as completed** after their incorporation comments; #3 is **OPEN** while
PR #10 remains draft. Issue #1 and draft PR #2 were not part of this closure
action.

| Order | Issue and durable original owner | Exclusive scope from issue body | Required reviewers | Current state |
|---:|---|---|---|---|
| 1a | [#4 Nyota Uhura — content](https://github.com/Jamula/Jamula-www-Website/issues/4) | `docs/content/content-strategy.md`, `multimedia-social-plan.md`, `editorial-workflow.md`, `founder-profile-draft.md` | Dax, Sarek, Rai, Fact Checker | Closed completed 2026-08-25 after commit/PR incorporation comment; approval gates remain |
| 1b | [#5 Jadzia Dax — experience](https://github.com/Jamula/Jamula-www-Website/issues/5) | `docs/experience/*` | Uhura, Miles, Fact Checker | Closed completed 2026-08-25 after commit/PR incorporation comment; approval gates remain |
| 1c | [#6 Seven of Nine — customer platform](https://github.com/Jamula/Jamula-www-Website/issues/6) | customer research, privacy, architecture, connector packets, payments | Geordi, Miles, Sarek, Rai, Fact Checker | Closed completed 2026-08-25 after commit/PR incorporation comment; vendor/professional gates remain |
| 1d | [#7 Miles O'Brien — security/quality](https://github.com/Jamula/Jamula-www-Website/issues/7) | `docs/security/*` | Seven, Geordi, Dax, Fact Checker | Closed completed 2026-08-25 after commit/PR incorporation comment; approval gates remain |
| 1e | [#8 Geordi La Forge — platform/cost](https://github.com/Jamula/Jamula-www-Website/issues/8) | platform research/source register, cost, portability | Picard, Miles, Fact Checker | Closed completed 2026-08-25 after corrected-workload commit/PR incorporation comment; no selection approved |
| 1f | [#9 Sarek — legal](https://github.com/Jamula/Jamula-www-Website/issues/9) | jurisdiction, compliance, legal-page requirements, IP, phase/professional gates | Fact Checker, Rai, qualified professionals | Closed completed 2026-08-25 after commit/PR incorporation comment; legal-draft deferral and professional gates remain |
| 2 | [#3 Jean-Luc Picard — initial synthesis](https://github.com/Jamula/Jamula-www-Website/issues/3) | requirements, architecture synthesis, ADRs, roadmap, integration ledgers | all owners, Fact Checker, Rai, relevant professionals | Open while PR #10 is draft; ledger commit/push, exact-head identifiers, Cyrus approval and professional gates pending |

Issue #8's original body names four exclusive paths. The Cycle 2 correction added
`docs/cost/reference-workloads.md` as a review-remediation artifact under #8; it
does not change Geordi's durable child ownership or authorize a platform decision.

## Strict-lockout Cycle 2 outcomes

| Original author / scope | Locked or cross-owner artifacts | Independent revision owner | Review basis | Outcome now |
|---|---|---|---|---|
| Nyota Uhura / founder | founder profile and source register | **Sarek** | RAI-01 | Non-identifying placeholders incorporated; Rai Green for fingerprinted revision; canonical identifiers/Cyrus approval pending |
| Nyota Uhura / editorial and content | editorial workflow and related content/register consistency | **Jadzia Dax** | RAI-02 and content remediation | Strict rejection route incorporated; Rai Green for fingerprinted revision |
| Miles O'Brien / security and quality | `docs/security/*`, including rejected quality strategy | **Seven of Nine** | RAI-04, FCR-003/FCR-009, adversarial F-04/F-06/F-07 | Backup, labor, AI-evaluation and sole-budget corrections incorporated; RAI-04 Green; other review gates remain |
| Picard / roadmap | phase gates, implementation backlog, ownership matrix | **Miles O'Brien** | RAI-03 | Public-AI evidence gates incorporated; RAI-03 Green for fingerprinted revision; no phase authorized |
| Seven of Nine / customer and privacy | #6 research/privacy/architecture/connectors/payments | **Miles O'Brien** for prior #6 corrections; **Jadzia Dax** latest for `docs/architecture/customer-platform.md` N-09; **Geordi La Forge** latest for `docs/research/customer-platform-options.md` and `docs/payments/phase-4-evaluation.md` | FCR-003-FCR-006, N-09, FCR-016, N-03/N-07, R-01 and related adversarial findings | File-specific routing preserves Seven as original and Miles as prior correction history: Dax owns the latest customer-architecture correction; Geordi owns the latest customer-options/payment corrections; other #6 artifacts remain with their recorded owner; no vendor or payment approval |
| Geordi La Forge / platform and cost | #8 platform research/source, cost model, portability | **Jean-Luc Picard** | FCR-001/FCR-002/FCR-007, adversarial F-01-F-05 | Scores withdrawn, public-site TCO separated, symmetric fixtures defined; final targeted content verification clear |
| Picard / synthesis and ADRs | requirements, decision framework, recommendation, ADR-001 through ADR-006 | **Geordi La Forge** for prior synthesis correction, including N-08 token custody in requirements; **Jadzia Dax** latest for `docs/requirements/business-product-requirements.md` FCR-016 scheduling neutrality; **Seven of Nine** latest for `docs/decisions/adr-005-cost-portability-and-lock-in.md` N-10/FCR-017 exit symmetry | Fact Checker rejection, adversarial F-01-F-09, FCR-016 and N-10/FCR-017 | File-specific routing preserves Picard as original and Geordi as prior correction history: Dax owns the latest requirements correction; Seven owns the latest ADR-005 correction; Geordi remains the recorded owner for the other corrected synthesis/ADR artifacts; no selection or accepted ADR |
| Geordi workload inputs | controlling workload correction artifact | **Seven of Nine** | FCR-002, adversarial F-03/F-04 | `RWL-2026-08-25.3` incorporated as proposed common dictionary; Cyrus approval pending |
| Picard / shared integration ledgers | manifest, work ownership, docs index, approvals, decision index | **Fact Checker (Cycle 2), Ralph for N-01/N-04, then Sarek for N-11 and FCR-018 owner-provenance; Sarek lifecycle update limited to the four authorized ledgers (decision index unchanged)** | adversarial F-08, N-11, FCR-018, owner provenance and post-PR lifecycle evidence | N-11 history preserved; terminal Fact Checker and independent adversarial FCR-018 rechecks are CLEAR; file-specific sequences, latest owners and lifecycle evidence recorded without approval; Picard, Ralph and prior Fact Checker ledger authors did not perform this correction |

The F-09 legal-draft remedy is deferral to qualified counsel, not an assertion that
Sarek or any AI reviewer supplied legal text or professional approval.

## Review disposition ledger

| Review | Original verdict | Remediation state | What remains |
|---|---|---|---|
| `docs/reviews/fact-check-report.md` | **REVISE** — original 12 findings and intermediate FCR-018 finding | Original/intermediate Revise history preserved; terminal FCR-018 verdict **CLEAR: 0 unresolved content / 0 unresolved ledger / 0 new findings** | Committed identifiers and approval gates remain |
| `docs/reviews/rai-review.md` | **REJECT** — 4 findings | Rai re-review **GREEN**: 4 resolved / 0 unresolved for six fingerprinted files | Canonical Git blob-OID/PR-head binding and Cyrus approval; material change reopens affected finding |
| Independent rubber-duck adversarial review | **Reject** — F-01 through F-09 | Reject/Revise history preserved; independent FCR-018 recheck **CLEAR: 0 unresolved content / 0 unresolved ledger / 0 new findings**; FCR-018 and remaining N-11 owner-provenance defect resolved | Committed identifiers and approval gates remain |

## RACI after remediation

| Work | Responsible | Accountable | Consulted | Informed |
|---|---|---|---|---|
| Original child scope | Named issue owner | Cyrus | Named issue reviewers | Picard/Scribe |
| Locked revision | Independent revision owner above | Cyrus | Rejecting reviewer and required domain reviewers; never the locked author | Coordinator/Scribe |
| Workload dictionary correction | Seven | Cyrus | Miles, Geordi, Fact Checker | All owners |
| Integration ledgers | Sarek for N-11 and FCR-018 after Fact Checker and Ralph revisions | Cyrus | Scribe, all owners; prior rejected/stale-ledger authors do not revise or self-approve | Squad |
| Final independent source/claim re-review | Eligible Fact Checker delegate / named domain reviewers | Cyrus | Domain owner, excluding locked authors from their rejected revision | Squad |
| Responsible AI re-review | Rai | Cyrus | Dax, Sarek, Miles, Seven, Fact Checker | Squad |
| Professional conclusions | Qualified counsel/CPA/acquirer-QSA/broker/accessibility specialists | Cyrus | Sarek + affected owner | Squad |
| Reviewed incorporation commit, draft PR, then child comments/closure | Coordinator-designated integrator | Cyrus | Scribe, Fact Checker | Complete for d02a244 / PR #10 / #4-#9 on 2026-08-25; no approval implied |
| Ledger-only validation, commit/push and exact-head evidence | Coordinator-designated integrator | Cyrus | Sarek, Scribe, Fact Checker | All owners |
| Exact committed approval | Cyrus | Cyrus | Named reviewers/professionals | All owners |

## Reproducible approval and closure rules

1. **Canonical artifact identity after commit:** record each artifact's Git blob OID
   from the exact PR head (for example, `git rev-parse <PR-head>:docs/path.md`) and
   the full PR head commit SHA. Repository object format controls OID length; do
   not assume SHA-1.
2. A raw filesystem SHA-256 is not canonical because checkout line endings can
   differ. The historical evaluation-plan SHA in `approvals.md` was calculated
   from CRLF bytes and is retained only as a legacy record with that limitation.
3. Any material commit changes the PR head approval identifier. Changed artifacts
   receive new blob OIDs and require affected re-review.
4. Child issues close only after validation and commit, then opening the draft PR
   to `main`. Each incorporation comment must identify the actual commit, review
   state, residual gates, and draft PR. This occurred for #4-#9 using reviewed
   commit `d02a2448a5438fb0e895c4c46166fe39c79ccb86` and draft PR #10 before
   their explicit completed closures on 2026-08-25. Canonical blob OIDs for the
   changed lifecycle ledgers remain pending until their ledger commit exists.
5. A draft PR does not approve an ADR, platform, vendor, public claim, professional
   conclusion, implementation or deployment.
6. Keep #3 open while the PR is draft; use `Closes #3` in the draft PR body. Do
   not merge. Any later material ledger commit changes the head and requires
   renewed affected review and identifiers.

## Residual sequence

1. Validate these four ledger-only edits.
2. Commit and push the exact validated ledger tree. The new ledger-only commit
   then becomes the candidate final head; reviewed incorporation commit
   `d02a2448a5438fb0e895c4c46166fe39c79ccb86` is not the final PR head.
3. Verify PR #10's exact head, draft state, and `main` base. It is intentionally
   stacked on unmerged draft PR #2, so its diff will narrow after PR #2 merges.
4. Resolve the changed ledgers' canonical blob OIDs from the candidate head and
   record/report the exact full candidate-final-head SHA externally for Cyrus.
5. Keep #3 open and all proposed decisions and professional gates pending. Cyrus
   may approve only that exact full SHA; do not merge or deploy.
