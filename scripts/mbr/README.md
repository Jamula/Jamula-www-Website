# Repository monthly business review

A small, reusable, read-only dashboard for `Jamula/Jamula-www-Website`. Runs on
.NET 10 LTS with vanilla HTML/CSS/JavaScript and no third-party packages, analytics,
external fonts, cloud resources, deployment changes or paid services.

This is a **local web dashboard opened in the Copilot Browser canvas**, not a
registered project canvas extension. Extension scaffold/reload tooling was not
available during implementation; no undocumented SDK or hand-written extension
skeleton is used. Code is repository-shared; generated data stays local.

## Run and refresh

Requires a supported .NET 10 SDK and GitHub CLI (`gh`) already authenticated to
github.com. The API only reads this repository's pull requests and issues.
Public repository metadata can be read with ordinary CLI authentication; private
access needs repository visibility, **Issues: read** and **Pull requests: read**
for fine-grained credentials (classic credentials need the corresponding repo
scope). Do not broaden permissions just for this dashboard. No billing permission
is requested.

From the repository root in PowerShell:

```powershell
Set-Location scripts\mbr
dotnet run -- --snapshot 2026-11
dotnet run
```

The first command reads GitHub and saves a real initial snapshot. It prints
repository-only JSON and exits nonzero on source failure/invalid cost input.
The server prints its OS-assigned `http://127.0.0.1:<port>` URL. Open it in the
Copilot Browser canvas or an ordinary browser. It listens only on IPv4 loopback,
ignores external URL bindings, and stops with Ctrl+C. Keep that process running
while reviewing. There is no background service installation.

The executive page defaults to the current **UTC** calendar month (November 2026
at initial delivery), displayed simply as "November 2026" and "Month to date".
Select **Refresh** to fetch every page and replace its snapshot. A missing snapshot presents
a refresh prompt, not invented metrics. Source failure shows Unknown for that
entire source; other successful sources remain usable. Snapshots and imports
live in `scripts\mbr\.local\` when launched as above; do not commit or publish them.
For a published executable or launch from another working directory, `.local`
is beside the executable unless the working directory contains `wwwroot`.
An interrupted refresh leaves the previous snapshot intact; retry refresh.

## Executive view and audit access

The page answers four business questions: what activity was delivered, what work
is open, what cost is known, and what needs management attention. A short business
readout leads; merged pull requests and completed issues remain **activity**, not
features shipped, customer outcomes, revenue or proof of deployment. There is no
invented overall health score, target, trend or approval/blocker state.

The owner requested a CEO/CTO briefing rather than an engineering tracker.
Accordingly, month inputs, filters, item links/lists, timestamps, median merge
time, cost evidence tables and source-definition panels are absent from this
view. One Refresh button remains. Saved, stale (at least 24 hours old), partial
and failed-refresh states stay visible in plain language. Failed refreshes keep
the previous review with a warning instead of silently presenting it as current.

When open issue #86 is present, the readout highlights the unresolved homepage
inquiry path and proposes confirming the owner-approved destination and wording
before publication. This is a curated interpretation of that issue's scope,
not an inference that approval is absent or that revenue was lost. On
2026-11-02 UTC, issue #86 was open and a read of `https://jamula.net` showed
only in-page navigation, not a contact destination. The dashboard does not
continuously inspect the live site; it only retains this focus while #86 is
open in its issue observation. It does not declare commercial readiness if the
issue disappears. Attention is limited to three evidence-supported items:
the contact-path work when open, data/cost gaps, and unmeasured business impact.
No customer or revenue analytics are collected.

Exact source health, period bounds, observation times, item URLs, detailed cost
provenance and median merge time remain in `.local\snapshot-YYYY-MM.json` and the
read-only `/api/snapshot?month=YYYY-MM` endpoint. Use
`dotnet run -- --snapshot YYYY-MM` for another month's audited data; there is no
historical-month navigation on the executive page.

Only fixed endpoints are exposed. A same-origin POST with `X-MBR-Refresh: 1`
refreshes; GET only reads local data. Month input never becomes a shell command.
The CLI is spawned with argument arrays, no shell. Host/origin checks, no CORS,
CSP and text-only rendering protect the loopback interface. This is not a
multi-user/authenticated server: processes or people sharing your OS account can
read your local repository observations.

## KPI definitions and boundaries

| KPI | Definition |
| --- | --- |
| Active PRs | Currently open at refresh, including drafts. |
| Merged PRs | `merged_at` in the selected UTC month, through observation time. |
| Closed, not merged | Snapshot-only list using `closed_at`; not counted as delivered PRs. |
| Active issues | Currently open issues; REST issue records with `pull_request` are excluded. |
| Completed issues | Closed with latest `state_reason=completed`, `closed_at` in the month. |
| Other issue closures | `not_planned` or unavailable/other state reason; never assumed completed. |
| Median PR open-to-merge | Median elapsed hours from creation to merge, with sample size; not coding time. |

UTC windows are `[first day 00:00Z, next month first day 00:00Z)`. For example,
October 31 at 18:00 Pacific daylight time belongs to November in UTC. Current
months are month-to-date; future periods have no observations. The snapshot includes
the exact window, observation timestamp and collection start. Requests are live
and sequential within each source, not a transactional GitHub snapshot.

**Current backlog is never presented as historical month-end backlog.** Historical
delivery uses latest object state/timestamps, not an immutable event ledger.
Reopening/reclosing an issue or changing its reason can revise older results.
Snapshots overwrite the prior observation for that month; copy a local snapshot
outside the repo yourself if an immutable approved review is needed.

Each REST source is independently paginated in 100-record pages until a short
page; no GitHub search 1,000-result cap or CLI default list limit. Any page failure
discards that source, preventing partial counts. A 200-page safety ceiling reports
Unavailable rather than claiming completeness. Large repositories incur more
read calls. Review status, CI blocking and Actions job history are not queried.

## AI tokens, Actions minutes and money

Costs start **Unknown**, not zero. GitHub work-item APIs do not expose repository
AI tokens. This tool deliberately does not read user-wide Copilot session history,
organization billing or unrelated repositories. It does not interpret Copilot
usage multipliers as dollars or whole-session aggregates as monthly usage.

Use an optional, manually sourced `.local\costs-YYYY-MM.json`. Only attribute data
to this repo when your evidence supports that scope. Do not copy raw invoices,
credentials, personal account data or private session content into imports.
All monetary fields are **USD**; convert externally with evidence in `source`
before importing another currency. There is no implied currency conversion.

Schema example below is **synthetic documentation**, not measured operating data;
it is not loaded automatically:

```json
{
  "repo": "Jamula/Jamula-www-Website",
  "month": "2026-11",
  "measurements": [
    {
      "key": "aiInputTokens",
      "value": 120,
      "basis": "actual",
      "source": "Synthetic example: repository-attributed provider export",
      "scope": "Jamula/Jamula-www-Website",
      "asOf": "2026-11-02T00:00:00Z",
      "coveredFrom": "2026-11-01T00:00:00Z",
      "coveredThrough": "2026-11-02T00:00:00Z"
    }
  ]
}
```

Supported keys:

- `aiInputTokens`, `aiOutputTokens`, `aiCacheReadTokens`, `aiCacheWriteTokens`:
  separate nonnegative integer counts; do not double-count cache categories.
- `actionsElapsedMinutes`: summed elapsed **job** time, if independently sourced.
- `actionsBillableMinutes`: known billable runner usage, not workflow wall time.
- `aiUsd`, `actionsUsd`, `hostingUsd`, `domainUsd`: independently attributed amounts.

`basis` is `actual` or `estimated`. Every row needs a source, exact repository
scope, recorded timestamp and exclusive coverage end. Coverage must lie inside
the month and not extend beyond the observation or recorded timestamp.
For estimated USD rows, also supply `pricingSource` (provider URL/export reference
and calculation assumptions) and `pricingDate` (`YYYY-MM-DD`). State runner type,
rate, free allowances and retry/matrix handling in the evidence where relevant.
The importer validates structure/coverage, not the truth of user-supplied evidence.
Duplicate keys, negative values, unknown fields, wrong scope and invalid estimates
reject the entire import explicitly. Refresh after changing an import.

The snapshot retains actual/estimated basis, source, scope, coverage and recording
time. Imported values on the executive page label their basis and whether they
cover the month to date or only a partial period. AI input/output/cache categories
stay separate and Actions minutes mean billable runner minutes, not elapsed
workflow time. Missing usage is "Not tracked"; no recorded money is "Spend not
measured". Recorded money is labeled partial spend, never total spend.
Positive amounts below one cent display as `< $0.01`, not a rounded `$0.00`;
an explicitly recorded zero still displays as `$0.00`.
**Total repo spend always remains Unknown**
because these optional categories do not establish exhaustive cost coverage.
Free hosting configuration is not proof of a measured $0 bill. Actions elapsed
job minutes are not billable runner minutes: OS/runner multipliers, rounding,
retries, matrices, included allowances and billing terms may differ.

## Verify offline

From the repository root:

```powershell
dotnet run --project scripts\mbr\tests\JamulaMbr.Tests.csproj
node --test scripts\mbr\tests\ui.test.mjs
python scripts\validate_governance.py
```

The dependency-free .NET fixture runner covers page traversal and page failure,
UTC boundaries (including Pacific conversion), merged versus abandoned PRs,
completed versus not-planned issues, missing access, missing costs, scoped import
validation and origin controls. Node's built-in runner checks the executive
readout, truthful activity/usage summaries, bounded attention, plain month
heading, refresh and stale/error states without installing packages. It also
prevents engineering tracker controls/links from returning to the main page.
No fixtures write to GitHub or load live billing.

API definitions: [repository issues](https://docs.github.com/en/rest/issues/issues#list-repository-issues)
and [pull requests](https://docs.github.com/en/rest/pulls/pulls#list-pull-requests).
The collector pins REST `2022-11-28` and GitHub.com. A server-side error deliberately
omits raw CLI stderr and GitHub response bodies; check `gh auth status` locally
when diagnosing access, without sharing credential output.
