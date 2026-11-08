# Side-quest operations review

Use this monthly review with the existing [repository MBR](../../scripts/mbr/README.md).
The MBR remains the executive view for repository delivery, current workload, and
cost evidence. This review adds a focused evidence discussion, not a second
dashboard or a claim that unmeasured signals are healthy.

## Owners and workflow

Seven coordinates the review and prior actions. Spock presents engineering and
AI-operation evidence. Data checks evidence quality, privacy, access, and
retention. Uhura maintains this runbook. Run the review manually once per month;
do not create a scheduled automation for it.

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
| Test quality | Line and branch coverage separately for every deployable and overall, plus test count, duration, parallelism, retries, and observed flakiness from the same CI evidence. The target is at least 90% for both line and branch coverage at each level. Identify the exact commit and report covered/total counts; calculate overall coverage from summed counts, not an average of percentages. Missing per-deployable or overall evidence is unknown, not a pass. |
| AI operations | Repository-attributed usage and input/output/cache tokens separately; latency with its statistic and sample size; attributed cost and basis; quality evaluation results; safety outcomes; and tool success/failure outcomes. Use only already-approved, repository-scoped sources. |
| Security and authorization | Explicit allow/deny outcomes for protected routes, APIs, and MCP tools, with counts and denominators by action/section where an approved source supports them; relevant authentication/policy failures, incidents, and tested stop-control results. Do not include identities, tokens, prompts, or private content. No observed denial events is not evidence that denial controls work; absent telemetry or tests is unknown. |
| Limits and controls | Observed quota/limit use, shutdown or stop-control evidence, and privacy/retention evidence relevant to the reviewed systems. A lack of observed traffic does not prove a shutdown control works. |
| Releases and debt | Release/deployment incidents in the window and current tracked technical-debt issues, with links to their GitHub records. Distinguish current issue state from historical state. |
| Python tooling debt | Progress on the five-script retirement and replacement tracked in [#110](https://github.com/Jamula/Jamula-www-Website/issues/110): remaining scripts and workflow/documentation callers, replacement-test coverage of success and failure/security behavior, and accepted completion criteria. Use the issue and exact-revision validation as evidence; do not infer completion from closed work or a passing unrelated suite. |

No other numeric regression or alert threshold is introduced by this review.
Use thresholds only when an approved, measured baseline supports them; label
estimates and provisional comparisons explicitly.

## Data handling and follow-through

Use existing access only. Seven coordinates; Spock supplies metric evidence;
Data reviews data quality and privacy; Uhura needs only process changes and
sanitized outcomes. Give restricted source evidence only to review participants
who already have source authorization. The local MBR dashboard is not an
authenticated multi-user service, so do not expose its local snapshot to other
OS users or attach it to a public issue or report. Keep restricted evidence in
its authorized source and link to it only for people who already have access.
GitHub issue threads may be visible to the repository audience; put only
non-sensitive summaries and evidence links that are safe for that audience
there.

Do not copy raw prompts, private posts, financial content, personal identity,
or row-level user data into the review, repository, or general GitHub issues.
Do not broaden collection or access to fill a gap. Follow each source's approved
retention and deletion rules; if those rules or an approved source are unclear,
retain no additional export and report the metric as unknown.

Persist accepted durable decisions through the configured `squad_state`
governed bridge, not GitHub issue threads: use `memory.write`
(`squad_state-memory-write`) with the appropriate governed decision class and
required approval, or `decide` (`squad_state-squad_decide`) for the team decision
inbox and its review process. An inbox submission is pending review, not proof
of acceptance. Verify the bridge's successful result and retain the returned
record identifier or reference before claiming persistence. Keep restricted
evidence in its authorized source; persist only appropriately sanitized
decision context, rationale, approval status, and safe evidence references.

If the configured bridge is missing, unavailable, or rejects the write, do not
fake persistence or bypass it: report the decision as **pending persistence**
in the review handoff and halt Squad state mutation until the governed bridge
is available and the write succeeds. Do not edit raw `.squad` state files,
including decision inbox or memory files, or use manual Git/file operations as
a persistence fallback.

Use GitHub issues only as the actionable data-gap and follow-up work ledger,
reusing existing issues where possible. Each follow-up needs one accountable
owner, acceptance criteria, non-sensitive evidence links, and a link or
reference to its governed decision record when one exists. An issue does not
replace the governed record or turn a pending decision into an accepted one.
Do not create a parallel markdown report or copy source datasets. This runbook
defines the process only and does not itself authorize telemetry, product
changes, issue creation, or decision approval.

## Initial dry run

The inherited draft reports an MBR collector run for `2026-11` on 2026-11-08
UTC. It says the snapshot covered `[2026-11-01T00:00:00Z,
2026-12-01T00:00:00Z)` and was observed at `2026-11-08T22:48:46Z`:

These details are reported in the inherited runbook draft and were not
independently verified for this revision: the local snapshot was not inspected
and the source requests were not rerun. Treat the date, window, observation time,
and source-health statements below as unverified reports, not accepted
measurements or proof that the review process completed.

| Evidence | Dry-run result |
| --- | --- |
| GitHub pull-request and issue sources | The draft reports complete-page source health. This has not been independently verified. These sources can show delivery activity and current backlog, not feature outcomes. |
| Repository-filtered Actions billing | The draft reports the source available for this repository and month. This has not been independently verified; no monetary or minute value is asserted here. |
| Website experience and accessibility | No route/device Core Web Vitals or accessibility assessment is evidenced in the reported snapshot. Both are unknown, not zero or conformant. |
| Tests, AI, security, and controls | No coverage/test-execution evidence, AI quality/safety/tool outcomes, explicit authorization-denial signals, quota/stop-control test, or privacy/retention evidence is shown by the reported snapshot. These remain unknown. |
| Feature outcomes and Python tooling debt | No adoption/outcome evidence or independently verified #110 retirement progress is provided by the reported snapshot. Delivery activity alone does not establish either. |
| Releases and prior review actions | Release/deployment incidents and prior action follow-through were not evaluated in the reported dry run; Seven checks the GitHub issue ledger when facilitating the monthly review. |

The draft labels this a source-availability dry run, not a completed operations
review or baseline; the dry-run execution and source evidence remain
unverified. The local snapshot, if present, stays in the MBR's ignored `.local`
storage; do not commit or publish it. If a later run cannot produce an exact
comparable window or an authorized source, retain the gap as unknown rather
than filling it with an estimate.
