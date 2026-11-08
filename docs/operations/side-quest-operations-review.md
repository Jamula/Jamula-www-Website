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
Report a value only when the source supports it. Mark absent, failed, stale, or
unverifiable evidence as **unknown** or **unavailable**, never as zero or a
pass.

| Area | Evidence to bring |
| --- | --- |
| Website experience | Core Web Vitals by production route and the source's documented device cohorts; include samples and collection window. |
| Feature outcomes | Feature-level adoption and outcome measures with their definitions and denominators. PRs and closed issues are delivery activity, not proof of adoption or customer outcome. |
| Test quality | Line and branch coverage separately for every deployable and overall, plus test count, duration, parallelism, retries, and observed flakiness from the same CI evidence. The target is at least 90% for both line and branch coverage at each level. Identify the exact commit and report covered/total counts; calculate overall coverage from summed counts, not an average of percentages. Missing per-deployable or overall evidence is unknown, not a pass. |
| AI operations | Repository-attributed usage and input/output/cache tokens separately; latency with its statistic and sample size; attributed cost and basis; quality evaluation results; safety outcomes; and tool success/failure outcomes. Use only already-approved, repository-scoped sources. |
| Limits and controls | Observed quota/limit use, shutdown or stop-control evidence, and privacy/retention evidence relevant to the reviewed systems. A lack of observed traffic does not prove a shutdown control works. |
| Releases and debt | Release/deployment incidents in the window and current tracked technical-debt issues, with links to their GitHub records. Distinguish current issue state from historical state. |

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

Route accepted work through existing GitHub issues where possible. Any new
follow-up issue must have one accountable owner, acceptance criteria, and links
to non-sensitive evidence. Record decisions and unresolved data gaps in the
relevant issue thread; do not create a parallel markdown report or copy source
datasets. This runbook defines the process only and does not itself authorize
telemetry, product changes, or issue creation.

## Initial dry run

The existing MBR collector was run for `2026-11` on 2026-11-08 UTC. Its snapshot
covered `[2026-11-01T00:00:00Z, 2026-12-01T00:00:00Z)` and was observed at
`2026-11-08T22:48:46Z`:

| Evidence | Dry-run result |
| --- | --- |
| GitHub pull-request and issue sources | Both reported complete-page source health. The MBR can provide delivery activity and current backlog; neither is a feature-outcome measure. |
| Repository-filtered Actions billing | The MBR reported the source available for this repository and month. No monetary or minute values are copied into this runbook. |
| Other review categories | The MBR snapshot did not provide route/device Core Web Vitals, feature outcomes, coverage, test execution details, AI quality/safety/tool outcomes, quota/shutdown, privacy/retention, or release-incident evidence. These remain unknown for this dry run, not zero. |
| Prior review actions | Not evaluated in this dry run; Seven checks the GitHub issue ledger when facilitating the monthly review. |

This is a source-availability dry run, not a completed operations review or a
baseline. The local snapshot stays in the MBR's ignored `.local` storage; do not
commit or publish it. If a later run cannot produce an exact comparable window
or an authorized source, retain the gap as unknown rather than filling it with
an estimate.
