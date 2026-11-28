# Side-quest operations review

Use this monthly review with the existing [repository MBR](../../scripts/mbr/README.md).
The MBR remains the executive view for repository delivery, current workload, and
cost evidence. This review adds a focused evidence discussion, not a second
dashboard or a claim that unmeasured signals are healthy.

## Owners and workflow

The review coordinator leads the review and prior-action check. Engineering
presents operational and AI-operation evidence. An independent reviewer checks
evidence quality, privacy, access, and retention. Documentation updates this
runbook when process rules change. Run the review manually once per month; do
not create a scheduled automation for it.

Start from the MBR snapshot for the selected `YYYY-MM` month. Record its exact
UTC start, exclusive end, and observation timestamp. Review prior GitHub issue
actions first. Use the same MBR window and source evidence for the operations
discussion; do not duplicate its top-line delivery, open-work, or cost reporting.

For a completed month, compare with the preceding full UTC month. For a
month-to-date review, compare only an equal-duration window from the beginning
of the preceding month when the source can support that exact window. If a
source cannot reconstruct the comparable window, mark the comparison
unavailable; do not compare month-to-date with a full month or infer history
from current backlog. Preserve the source's cohort and measurement definition,
and record sample size and known uncertainty.

## Evidence to review

For each applicable row, record the source link or local source reference,
scope, UTC window, observation time, sample size or denominator, and limitations.
Report a value only when the source supports it. Mark absent, inaccessible,
failed, stale, or unverifiable evidence as **unknown** or **unavailable**, never
as zero or a pass. If a category does not apply, state why rather than
substituting zero.

| Area | Evidence to bring |
| --- | --- |
| Website experience | Core Web Vitals by production route and the source's documented device cohorts; include samples and collection window. |
| Accessibility | WCAG 2.2 AA evidence for the reviewed routes, including automated checks and applicable keyboard, screen-reader, zoom/reflow, contrast, reduced-motion, form-error, authentication, and embedded-flow checks. State route/scope, method, date, findings, and limitations; an automated scan alone is not a conformance claim. |
| Feature outcomes | Feature-level adoption and outcome measures with their definitions and denominators. PRs and closed issues are delivery activity, not proof of adoption or customer outcome. |
| Test quality | Line and branch coverage separately for every first-party executable component and overall, plus test count, duration, parallelism, retries, and observed flakiness from the same CI evidence. The current [#109](https://github.com/Jamula/Jamula-www-Website/issues/109) title targets at least 95% line and 90% branch coverage at each level; its older body and checklist still say 90% for both and must be reconciled. The issue remains open, so a passed gate is not established. Identify the exact commit and report covered/total counts; calculate overall coverage from summed counts, not an average of percentages. Missing component or overall evidence is unknown, not a pass. |
| AI operations | Repository-attributed usage and input/output/cache tokens separately; latency with its statistic and sample size; attributed cost and basis; quality evaluation results; safety outcomes; and tool success/failure outcomes. Use only already-approved, repository-scoped sources. |
| Security and authorization | Explicit allow/deny outcomes for protected routes, APIs, and MCP tools, with counts and denominators by action/section where an approved source supports them; relevant authentication/policy failures, incidents, and tested stop-control results. Do not include identities, tokens, prompts, or private content. No observed denial events is not evidence that denial controls work; absent telemetry or tests is unknown. |
| Limits and controls | Observed quota/limit use, shutdown or stop-control evidence, and privacy/retention evidence relevant to the reviewed systems. A lack of observed traffic does not prove a shutdown control works. |
| Releases and debt | Release/deployment incidents in the window and current tracked technical-debt issues, with links to their GitHub records. Distinguish current issue state from historical state. |
| Python tooling debt | Progress on the five-script retirement and replacement tracked in [#110](https://github.com/Jamula/Jamula-www-Website/issues/110): remaining scripts and workflow/documentation callers, replacement-test coverage of success and failure/security behavior, and accepted completion criteria. Use the issue and exact-revision validation as evidence; do not infer completion from closed work or a passing unrelated suite. |

No other numeric regression or alert threshold is introduced by this review.
Use thresholds only when an approved, measured baseline supports them; label
estimates and provisional comparisons explicitly.

## Data handling and follow-through

Use existing access only. Give restricted source evidence only to review
participants who already have source authorization. The local MBR dashboard is
not an authenticated multi-user service, so do not expose its local snapshot to
other OS users or attach it to a public issue or report. Keep restricted
evidence in its authorized source and link to it only for people who already
have access. GitHub issue threads may be visible to the repository audience; put
only non-sensitive summaries and evidence links that are safe for that audience
there.

Do not copy raw prompts, private posts, financial content, personal identity,
or row-level user data into the review, repository, or general GitHub issues.
Do not broaden collection or access to fill a gap. Follow each source's approved
retention and deletion rules; if those rules or an approved source are unclear,
retain no additional export and report the metric as unknown.

Persist accepted durable architectural or governance decisions in tracked
`docs/decisions/` records (ADRs and `docs/decisions/approvals.md`) via reviewed
pull requests, and use native GitHub Copilot Memory (`store_memory` /
`vote_memory`) only for non-sensitive workflow conventions backed by exact
`path:line` citations. Keep restricted evidence in its authorized source;
persist only appropriately sanitized decision context, rationale, approval
status, and safe evidence references.

Use GitHub issues only as the actionable data-gap and follow-up work ledger,
reusing existing issues where possible. Each follow-up needs one accountable
owner, acceptance criteria, non-sensitive evidence links, and a link or
reference to its governed decision record when one exists. An issue does not
replace the governed record or turn a pending decision into an accepted one.
Do not create a parallel markdown report or copy source datasets. This runbook
defines the process only and does not itself authorize telemetry, product
changes, issue creation, or decision approval.

## M03 collector dry run (2026-11-28 UTC)

The read-only MBR collector was run for November 2026, with window
`[2026-11-01T00:00:00Z, 2026-12-01T00:00:00Z)` and observation time
`2026-11-28T03:45:40.894844Z`. This is a **month-to-date** observation, not a
completed month. The raw snapshot remains in restricted local session storage;
do not commit or publish it.

| Evidence | Sanitized observation and limitation |
| --- | --- |
| GitHub pull-request and issue sources | Collection returned 132 pull-request records and 65 issue records. These are source records, not necessarily monthly delivery, feature adoption, customer outcomes, or deployments. |
| Repository-filtered Actions billing | The source was available for this repository and month. No monetary, minute, or zero-cost claim is made here. |
| Comparison | No equal-duration preceding-month comparison was established; trend and regression are unknown. |
| Website, accessibility, outcomes, AI, security, and controls | Route/device experience, accessibility, adoption, AI usage/quality, denial outcomes, quota/stop controls, and privacy/retention evidence were not established by this collector run; unknown, not zero or passing. |
| Test quality | The collector does not establish exact-revision per-component and aggregate coverage, test duration, or flakiness. The open #109 baseline and its threshold wording require separate evidence and reconciliation. |
| Releases and follow-through | Incidents, prior-action follow-through, participant review, and accepted decisions were not established. A collector run alone does not complete the monthly review. |

The issue ledger on 2026-11-28 showed [#108](https://github.com/Jamula/Jamula-www-Website/issues/108),
[#115](https://github.com/Jamula/Jamula-www-Website/issues/115),
[#116](https://github.com/Jamula/Jamula-www-Website/issues/116),
[#119](https://github.com/Jamula/Jamula-www-Website/issues/119), and
[#120](https://github.com/Jamula/Jamula-www-Website/issues/120) open.
[#109](https://github.com/Jamula/Jamula-www-Website/issues/109) and replacement
content work [#182](https://github.com/Jamula/Jamula-www-Website/issues/182)
were also open. [#110](https://github.com/Jamula/Jamula-www-Website/issues/110)
was closed completed; #111-#114 and #117-#118 were closed not planned, not
completed. Their old dependency references do not establish that equivalent
release or security gates passed.

## Historical initial dry run

The prior runbook draft recorded a reported MBR collector run for `2026-11` on
2026-11-08. It gave the snapshot window as
`[2026-11-01T00:00:00Z, 2026-12-01T00:00:00Z)` and the observation time as
`2026-11-08T22:48:46Z`. The draft's source notes are retained here as a
historical report, not as independently verified measurements:

These details are reported in the inherited runbook draft and were not
independently verified for this revision: the local snapshot was not inspected
and the source requests were not rerun. Treat the date, window, observation time,
and source-health statements below as unverified reports, not accepted
measurements or proof that the review process completed.

| Evidence | Prior draft's reported result |
| --- | --- |
| GitHub pull-request and issue sources | Reported complete-page source health; not independently verified here. These sources show delivery activity and current backlog, not feature outcomes. |
| Repository-filtered Actions billing | Reported available for this repository and month; not independently verified here. No monetary or minute value is asserted. |
| Website experience and accessibility | No route/device Core Web Vitals or accessibility assessment was evidenced in the reported snapshot; unknown, not zero or conformant. |
| Tests, AI, security, and controls | No coverage/test-execution evidence, AI quality/safety/tool outcomes, explicit authorization-denial signals, quota/stop-control test, or privacy/retention evidence was shown; unknown. |
| Feature outcomes and Python tooling debt | No adoption/outcome evidence or independently verified #110 retirement progress was provided; delivery activity alone does not establish either. |
| Releases and prior review actions | Release/deployment incidents and prior action follow-through were not evaluated in the reported dry run. |

This worktree check was observed at `2026-11-15T22:42:06Z`. In this fresh
isolated worktree, the repository-local `scripts/mbr/.local` directory and
`snapshot-2026-11.json` were absent. This establishes only that no snapshot was
present at that path in this worktree at the time of this check; it does not
establish whether a snapshot existed in the original environment or invalidate
the prior reported observations. The MBR collector and source requests were
not run. No source-health result, measurement window, sample size, or
comparable-period evidence was independently verified in this worktree check;
all metrics remain unknown for this check, not zero, pass, baseline, or a
completed operations review.

The GitHub issue ledger was checked at the observation time: [#115](https://github.com/Jamula/Jamula-www-Website/issues/115)
remains open. Its required [#109](https://github.com/Jamula/Jamula-www-Website/issues/109)
coverage/performance baseline and [#111](https://github.com/Jamula/Jamula-www-Website/issues/111)
route/release contract are also open; [#108](https://github.com/Jamula/Jamula-www-Website/issues/108),
which blocks #111, remains open. The issue records do not establish complete
coverage or production telemetry. Do not treat delivery activity as measured
feature outcomes.

No private account data was refreshed or copied. Keep unverified evidence
unknown until an authorized run produces exact window and source references;
keep any resulting local snapshot in the MBR's ignored `.local` storage and do
not commit or publish it.
