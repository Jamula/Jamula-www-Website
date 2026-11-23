# Side-quests quality and measurement baseline

**Inventory evidence date:** 2026-11-08
**Status:** Baseline inventory; no side-quest component has passed release gates
**Related work:** #109, #115, #116, #117, #118, and #120

This document records what can be measured in the current repository and what
remains unknown. Missing data is **not measured**, not zero, and not a pass.
The approved minimum is at least 90% line **and** branch coverage for every
first-party deployable and across the aggregate, in addition to behavior-focused
success, error, privacy, security, accessibility, and recovery tests.

The date above is the inventory evidence date. Coverage percentages and test
counts below are inherited historical results, not recollected for PR #124;
they do not validate the current revision. Current-revision claims require a
new collection.

## Current component inventory

| Component                                                                                                                                                                                            | Current role                                                                                                                                                                                                                                                                                     | Existing validation                                                                                                                                                                                                       | Coverage state                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `www/` Astro site                                                                                                                                                                                    | Existing public static website                                                                                                                                                                                                                                                                   | `npm run check`; `npm run build`; `node scripts/test_built_site.mjs`; coverage-gated behavior tests from `www/`                                                                                                           | First-party browser-executable JavaScript inventory: `public/analytics-consent.js` (the only `www/public` JS/MJS/CJS file; its historical browser report measured 275/275 lines (100.00%) and 99/103 branches (96.12%), gated at 90%). Separately, the inventory maps `astro.config.ts` to `astro-config/cobertura-coverage.xml`; that report is not included in the analytics counts. Seven `.astro` components/pages/layouts and `scripts/measure-local-performance.mjs` remain unmeasured. `BaseLayout.astro` emits JSON-LD data, not executable JS. Test/support executables `scripts/test_built_site.mjs` and the three files under `tests/` are not shipped. The browser runtime report does not cover Astro templates, generated route HTML/CSS, or other deployables. Thus these measured modules do not establish >=90% coverage for the website deployable. |
| `.github/scripts/` and `.github/workflows/`                                                                                                                                                          | Repository deployment, validation, and maintenance automation                                                                                                                                                                                                                                    | `node --test .github/scripts/*.test.cjs`                                                                                                                                                                                  | The current inventory maps five maintained `.cjs` sources. Historical c8 evidence measured four modules: 405/405 lines (100.00%) and 158/162 branches (97.53%); it does not establish coverage for all five currently mapped sources. All nine tracked workflow files are explicitly inventoried as unmeasured because YAML control flow and embedded shell/JavaScript are not represented in those reports.                                                                                                                                                                                                                                                                                                                    |
| `scripts/monitor/` .NET 10                                                                                                                                                                           | Existing CI-only, read-only four-host uptime monitor                                                                                                                                                                                                                                             | `dotnet build JamulaMonitor.csproj --configuration Release --nologo`; `dotnet run --project JamulaMonitor.csproj --configuration Release --no-build -- --self-test`                                                       | Temporary `dotnet-coverage` measurement: 304/363 lines (83.75%) and 166/194 branches (85.57%) for the application assembly including its CLI/self-test paths; below 90%. No CI coverage gate. It is not a public-site deployable.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `scripts/mbr/` .NET 10 plus browser JavaScript                                                                                                                                                       | Local-only monthly business review tool; not deployed to production                                                                                                                                                                                                                              | `dotnet run --project scripts\mbr\tests\JamulaMbr.Tests.csproj --configuration Release`; `node --test scripts\mbr\tests\ui.test.mjs` from the repo root                                                                   | The .NET application measured 176/300 lines (58.67%) and 240/278 branches (86.33%); the browser dashboard measured 163/163 lines (100.00%) and 121/123 branches (98.37%). Combined component coverage is 339/463 lines (73.22%) and 361/401 branches (90.02%); line coverage is below 90%. Test-runner code is excluded from product coverage. No CI coverage gate.                                                                                                                                                                                                                                                                                                                                                   |
| Five first-party Python preview/governance scripts (retired): `test_preview_artifact.py`, `test_preview_site.py`, `validate_governance.py`, `validate_preview_artifact.py`, `verify_preview_site.py` | CI-only governance and isolated preview validation; replaced with dependency-free .NET 10 utility `scripts/validation/` (`Program.cs`, `GovernanceValidator.cs`, `PreviewArtifactValidator.cs`, `PreviewSiteVerifier.cs`) and executable offline checks in `scripts/validation.tests/Program.cs` | `dotnet run --project scripts/validation.tests/JamulaValidation.Tests.csproj --configuration Release`; `dotnet run --project scripts/validation/JamulaValidation.csproj --configuration Release -- validate-governance .` | Migration removes all five Python scripts and updates workflow/documentation callers. The unchanged, locked test runner reports 56 deterministic offline checks; governance validation passed. The utility measured 339/375 lines (90.40%) and 263/294 branches (89.46%), below the branch threshold. No CI coverage gate. Track migration acceptance and its 56-check baseline in [#110](https://github.com/Jamula/Jamula-www-Website/issues/110).                                                                                                                                                                                                                                                                   |
| `scripts/coverage/`                                                                                                                                                                                  | Local first-party coverage inventory and fail-closed evaluator                                                                                                                                                                                                                                   | `node --test scripts/coverage/gate.test.mjs`                                                                                                                                                                              | The evaluator measured 370/372 lines (99.46%) and 117/121 branches (96.69%). It is measurement tooling, not a deployable.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `.squad/templates/`                                                                                                                                                                                  | First-party Node, PowerShell, and shell maintenance-script templates                                                                                                                                                                                                                             | Offline behavior tests and a coverage collector for `ralph-triage.js`                                                                                                                                                                                 | `ralph-triage.js` is measured. Four maintenance scripts and eleven runnable workflow templates remain inventoried as unmeasured; they are not excluded as vendor code.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Side-quest sections, identity/content APIs, AI, MCP, telemetry                                                                                                                                       | Not implemented                                                                                                                                                                                                                                                                                  | No production source, deployed endpoint, approved inference entitlement, or live behavior suite exists                                                                                                                    | **Not applicable / blocked**, not 0% and not passing. See [feasibility assessment](../architecture/side-quests-feasibility.md).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

## Historical measurement and test evidence

The inherited reports used c8 9.1.0 and the temporary `dotnet-coverage` 18.12.0
collector. The Cobertura parser counts class-level lines only; method-level
copies in .NET reports are not counted a second time. Test-runner assemblies
and files remain explicitly excluded.

- Website behavior: `node --test www/tests/*.test.mjs` passed **61 tests**;
  `www/public/analytics-consent.js` measured 275/275 lines and 99/103 branches
  (100.00%/96.12%). This covers only the browser module.
- GitHub automation: `node --test .github/scripts/*.test.cjs` passed **64
  tests**; four `.cjs` modules measured 405/405 lines and 158/162 branches
  (100.00%/97.53%).
- Monitor: `dotnet run --project scripts/monitor/JamulaMonitor.csproj
--configuration Release -- --self-test` passed **20 self-tests**; application
  coverage was 304/363 lines and 166/194 branches (83.75%/85.57%).
- MBR: `dotnet run --project scripts/mbr/tests/JamulaMbr.Tests.csproj
--configuration Release` passed **130 offline fixture checks** and
  `node --test scripts/mbr/tests/ui.test.mjs` passed **28 tests**. Application
  and UI combined measured 339/463 lines and 361/401 branches
  (73.22%/90.02%).
- Validation utility: the unchanged, locked
  `dotnet run --project scripts/validation.tests/JamulaValidation.Tests.csproj
--configuration Release` passed **56 deterministic offline checks**.
  Application coverage was 339/375 lines and 263/294 branches
  (90.40%/89.46%). Do not substitute the 79-check report from a separate
  revision or include edits to the locked #110 test runner.
- Coverage gate: `node --test scripts/coverage/gate.test.mjs` passed **10
  tests**. The aggregate gate intentionally exits nonzero while any source is
  unmeasured or any component is below threshold.

The historical measured-source subtotal was 2,032/2,253 lines (90.19%) and
1,164/1,275 branches (91.29%). Its collection date and source revision were not
recorded; the evidence date above dates the inventory, not this metric
collection. This subtotal is historical and is not current-revision evidence.
It is not the first-party aggregate: seven
website `.astro` templates, `www/scripts/measure-local-performance.mjs`, all
nine inventoried GitHub workflow files, four Squad maintenance scripts, and
eleven runnable Squad workflow templates remain unmeasured. `www/astro.config.ts`
and `.squad/templates/ralph-triage.js` have separate reports in the inventory.
The gate exited 1 as intended; monitor, MBR, and validation components also
remain below at least one 90% threshold.

## Coverage gate implementation

The local [first-party coverage inventory and gate](../../scripts/coverage/README.md)
now combines Cobertura counts and rejects malformed reports, missing source
measurements, unmeasured sources, and below-threshold components. It currently
exits 1 rather than passing: seven Astro templates and the local performance
diagnostic, workflow logic (including 11 runnable Squad workflow templates),
and four maintenance scripts remain unmeasured, while some measured components
are below threshold. Its printed aggregate is a measured subtotal, not overall
first-party coverage. This is local measurement infrastructure, not an
initiative-wide CI gate.

Coverage thresholds are not currently enforced for every project or
initiative-wide. The current website CI now enforces a 90% line and branch
threshold for its shipped `public/analytics-consent.js` browser module, using:

```sh
node --experimental-test-coverage --test \
  --test-coverage-include=public/analytics-consent.js \
  --test-coverage-lines=90 --test-coverage-branches=90 \
  tests/*.test.mjs
```

The gate runs after the existing website build in
`.github/workflows/required-pr-validation.yml`. This parent retains the #104
release semantics; the separate #105 release-version/versionless build matrix
is not integrated here. It does not claim coverage for Astro build-time
templates or other deployables. The temporary
.NET collection command shape used for the baseline was:

```powershell
dotnet-coverage collect --output <scratch-report.xml> --output-format cobertura `
  dotnet run --project scripts\monitor\JamulaMonitor.csproj --configuration Release --no-build -- --self-test
```

The local utility reports are diagnostic and are not a CI gate. Before a
side-quest component can be released:

1. Identify each independently deployable and its first-party executable
   source files; report each component separately and the aggregate.
2. Use a runner that emits both line and branch coverage and fails CI below 90%
   for either metric. Keep generated/vendor exclusions narrow and documented;
   never exclude handwritten authorization, validation, exception, MCP tool,
   deployment, or telemetry code merely to pass a threshold.
3. Keep test behavior evidence alongside coverage. A coverage percentage does
   not prove tenant isolation, denial behavior, exact human confirmation,
   no-content telemetry, private cache boundaries, or safe partial recovery.
4. Make the coverage runner deterministic on the pinned CI runtime and retain
   machine-readable output for the exact artifact/revision.
5. Run component suites in parallel only when test state and external effects
   are isolated; aggregate their per-component reports without losing failures.

The website's Node.js 26 test-runner gate is verified for the shipped
`public/analytics-consent.js` module only. Astro build-time template source is
not represented in that runtime coverage report; no first-party source coverage
measurement for those templates has been established. The .NET monitor,
MBR, and migrated validation utility have diagnostic or functional test results
but no repository CI line/branch gate. A complete per-deployable and
initiative-wide aggregate has not been established, so the approved 90% line
and branch requirement is **not met or demonstrated** for the website as a
whole or overall. Keep #109 open until every applicable first-party deployable
and the aggregate have measured reports and enforced thresholds. No coverage
percentage is inferred from test count.

## Behavior matrix for new components

Tests for future behavior must use synthetic data and exercise direct
server/API/tool invocation, not only UI presentation. The implementation is
blocked until the required identity and hosting boundaries are established.

| Area                                            | Required success and denial/failure evidence                                                                                                                                                                                                                                                                                                                                |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tenant authentication and section authorization | Valid authorized Jamula tenant user; explicitly invited B2B guest with separately granted role; uninvited or unassigned user; wrong tenant/issuer/audience; expired or revoked identity; missing or unavailable policy; role revocation during request; direct API, asset, search, and tool invocation. Every ambiguous/unavailable policy fails closed.                    |
| Private Finance/Tech content                    | Draft isolation; reviewer access; publish only after authorized confirmation of exact version; stale revision; wrong user/role/section; duplicate/replayed confirmation; public snapshot only after explicit publish; unpublish removes origin/search/cache references; stale media/index denied.                                                                           |
| Admin content actions                           | Draft/edit/review/publish/unpublish only; AI suggestion requires human confirmation; confirmation bound to actor, target, action, and exact content revision; concurrent edit and idempotent retry; unsupported admin, finance, deployment, or identity-management action denied.                                                                                           |
| Public and private assistant                    | Public corpus includes only rights-approved published content; private retrieval rechecks current role and section; cross-user/section canaries return no data; prompt injection cannot change authorization, corpus, or tools; provider outage, refusal, quota exhaustion, malformed output, timeout, and kill switch return explicit safe outcomes.                       |
| MCP clients and tools                           | Direct external client request and direct tool call; invalid/missing identity; wrong audience/scope; tool-level authorization denial; duplicate/replayed mutation; stale confirmation; malformed JSON-RPC/transport; timeout and unavailable policy/audit. No tool trusts model annotations as authorization.                                                               |
| Telemetry and privacy                           | Allowed outcome events are typed and correlated without raw prompts, retrieved passages, private content, financial details, access tokens, or direct identities; consent withdrawal stops optional public analytics; telemetry storage failure is visible and blocks privileged operations where audit is required; retention/deletion and quota kill switch are verified. |
| Release and recovery                            | Only affected component builds/deploys by default; shared-contract change validates consumers; full-release manifest pins compatible versions; concurrent release lock; partial success is visible; health failure stops progression; recovery restores a compatible set without exposing private data.                                                                     |

Use table-driven tests only for true sibling cases that assert the same
invariant. Keep isolated state, inject clocks and providers, avoid timing sleeps,
and prefer deterministic fakes for provider failure. A fake remains test
evidence, not a live-service claim.

## Performance and field measurement

The existing normative web-experience targets are maintained in
[`accessibility-seo-performance.md`](../experience/accessibility-seo-performance.md):

- Field Core Web Vitals must be good at p75 per critical route class, separately
  for mobile and desktop: LCP <=2.5 seconds, INP <=200 milliseconds, and
  CLS <=0.1.
- Cold-cache initial transfer budgets are <=900 KiB for public content and
  <=1,500 KiB for an interactive/authenticated shell.
- Lab measurements are diagnostic and do not substitute for field evidence.

No route/device p75 field sample, sample size, measurement window, or lab
hardware/network profile for these side-quest routes is recorded. The three
new private routes and chatbot/MCP interactions do not exist yet, so their
performance is **not measured**. Do not fabricate a baseline or claim
regression/no-regression. Measure the same route, device, cache, and consent
conditions before and after each future change; label low-volume field samples
provisional. Coordinate public Search Console evidence with #94 and optional
consent-gated analytics with #95 rather than duplicating either work.

The historical browser observations below did not establish browser-wide
external egress isolation or capture all network traffic. Page-level request
observations and proxy/DNS arguments do not prove that no external traffic
occurred. Before any separately authorized rerun, independently enforce
browser-wide external egress isolation. The browser-test acknowledgment does
not create or verify isolation; the diagnostic CLI does not enforce it.

### Local public-site lab observation — 2026-11-13

This is diagnostic evidence for the existing static site at source revision
`e0a777b`, not the unimplemented side quests and not a production or field
result. On Windows 11 Enterprise Insider Preview 10.0.28020, Snapdragon X
X1E80100 (12 logical processors), 33,888,956,416 bytes RAM, Node 26.12.1 and
Microsoft Edge **158.0.4370.16 beta** (DevTools protocol 1.3), the following
commands document a historical Edge run from `www/`; they are not current
validation or authorization to rerun. Before any separately authorized rerun,
independently enforce browser-wide external egress isolation. Proxy/DNS flags,
page-level interception, prior zero observed page requests, and the
acknowledgement variable do not create or verify that isolation; the diagnostic
CLI does not enforce it.

```powershell
$env:ASTRO_TELEMETRY_DISABLED='1'
npm run build                         # passed: 16 files checked; 3 static pages
node scripts\measure-local-performance.mjs  # passed: 30 samples
```

The dependency-free harness serves `dist/` on IPv4 loopback, uses a headless
Edge process and a fresh isolated browser context per sample with cache
disabled and service workers bypassed. It intercepts page requests and blocks
non-loopback URLs; the browser is also configured with a loopback-only failing
proxy for non-local destinations and blocked DNS. No external page requests
were observed through the browser/CDP page-request observations. These do not
establish all network activity: no independently verified OS egress isolation
or packet capture was available, so actual network traffic is unknown. No
analytics choice was made: fresh consent state is off.
Each sample observes through three seconds after `load`, with no interaction,
CPU or network throttling. Viewports are 1365×768 CSS px at DPR 1 (desktop)
and 390×844 at DPR 2.6 with mobile emulation. These are viewport classes on
the **same desktop CPU**, not measurements on representative mobile hardware
or networks. The harness observes browser LCP/FCP, navigation TTFB, and
layout-shift entries (maximum session-window CLS); it emits individual JSON
samples. `/404.html` is served directly with HTTP 200, so it does not exercise
hosting's actual missing-URL/404 response.

Five sequential cold-context samples per cell; table shows median [minimum,
maximum], milliseconds except CLS. The range is observed run-to-run variation,
not a confidence interval; five correlated local runs cannot characterize a
population or a percentile reliably. The local server has no compression or
real network latency; CDP request interception adds overhead.

| Route | Viewport | LCP ms | FCP ms | TTFB ms | CLS |
|---|---|---:|---:|---:|---:|
| `/` | desktop | 120 [112, 132] | 120 [112, 132] | 9.6 [6.2, 11.8] | 0 [0, 0] |
| `/privacy/` | desktop | 104 [84, 112] | 104 [84, 112] | 9.3 [6.1, 10.2] | 0 [0, 0] |
| `/404.html` | desktop | 88 [88, 96] | 80 [64, 88] | 8.2 [5.1, 11.0] | 0.194 [0, 0.194] |
| `/` | mobile viewport | 112 [108, 144] | 112 [108, 144] | 8.8 [6.7, 13.8] | 0 [0, 0] |
| `/privacy/` | mobile viewport | 92 [72, 124] | 92 [72, 124] | 10.1 [8.8, 11.5] | 0 [0, 0] |
| `/404.html` | mobile viewport | 84 [76, 92] | 84 [60, 92] | 9.6 [7.6, 16.0] | 0 [0, 0] |

The desktop 404 shift was 0.1937304482 in three of five samples; affected
nodes reported by the browser included the header, error content, footer and
analytics controls. An earlier independent five-sample run of the same
configuration observed it once. The cause is **not established**; the
observation warrants a trace and controlled before/after investigation, not a
speculative CSS or consent change. The harness's transfer-size sums were
43,964, 29,490 and 25,910 bytes for home, privacy and 404 respectively in
every sample. Those browser Resource Timing estimates include per-resource
header estimates and the favicon, and are not an encoded production transfer
budget assessment.

### Bounded-cleanup recheck — 2026-11-13

The local lab runner's lifecycle and inventory changes were rechecked in a
working tree based on rejected artifact commit `c0bb036`. Actual network
traffic during the historical browser run is unknown, as described above.

The Edge commands in this historical recheck are not current validation or
authorization to rerun. Before any separately authorized rerun, independently
enforce browser-wide external egress isolation; acknowledgement, proxy/DNS
flags, and prior zero observed page requests do not create or verify it.

```powershell
npm --prefix www run build
# passed: 18 files checked, 0 errors, 0 warnings, 0 hints; 3 static pages built
node --test www\tests\*.test.mjs
# passed: 68 tests, 0 failures, 0 skipped
node --test scripts\coverage\gate.test.mjs
# passed: 29 tests, 0 failures, 0 skipped
node --test www\tests\measure-local-performance.test.mjs
# passed: 5 tests, 0 failures, 0 skipped
Push-Location www
node scripts\measure-local-performance.mjs
Pop-Location
# passed: 30 samples (5 for each of 6 route/viewport cells); 0 non-loopback page requests observed
```

The harness still uses the same Edge/CDP collection, routes, desktop and
mobile-emulated viewports, cache/service-worker settings, five cold contexts
per cell, three-second post-load observation and LCP/FCP/TTFB/CLS extraction
described above. Browser shutdown now waits at most five seconds for the
specific child process; server shutdown has a five-second deadline and
destroys only that measurement server's connections if its close is not
confirmed. Cleanup failures are surfaced, the operational error remains first
in any combined failure, and a profile is retained unless browser exit is
confirmed. This recheck validates the harness execution, not field performance
or a coverage percentage. The diagnostic remains unmeasured; its offline
lifecycle tests do not provide a source coverage report. See the
[coverage inventory](../../scripts/coverage/README.md).
The website and overall coverage gates remain blocked by other unmeasured sources.

### Desktop 404 scrollbar regression — 2026-11-15

The root `scrollbar-gutter: stable` rule is exercised by an opt-in browser test
that runs `npm run build` itself before reading `dist/`; it cannot silently use
stale built output. On Node 26.12.1 and Edge 158.0.4370.21, the desktop scenario
verified that the 404 starts without vertical overflow and consent
initialization introduces it. The no-gutter negative control observed the
classic scrollbar transition (0 to 15 CSS px), header movement from x=90.5px
to x=83px, and CLS 0.1937304482. With the stable gutter, the same transition
left the header, error content, footer, and analytics container at x=83px;
observed CLS was 0.0017893855. The mobile-emulated scenario also kept all
checked landmarks fixed, with no layout-shift entries.

The same browser run checked the exposed banner, navigation, main and footer
landmarks, the 404 heading and home link, the named consent region, first-Tab
skip-link behavior, and empty consent storage with no external scripts. It is
a semantic smoke check, not a WCAG audit. Before navigation, the test verifies
the browser's failing loopback proxy and blocked-DNS arguments; it then proves
CDP interception by failing a synthetic `.invalid` request. The broader
30-sample local harness recorded zero non-loopback page requests in all six
route/device cells. These page-level observations do not establish whether
the browser contacted a Jamula host, monitor collector, or other destination:
without independently verified OS egress isolation or packet capture, actual
network traffic remains unknown.

The global root rule was also measured against the current home, privacy, and
404 layouts in five cold contexts per desktop and mobile-emulated cell. Maximum
observed CLS was zero in every cell except desktop `/404.html`, whose maximum
was 0.0017893855. This is a local Edge result, not production or field evidence.
The CSS is progressive enhancement; browsers that ignore the declaration keep
their prior behavior. Other browser engines and scrollbar modes were not
tested. This browser test does not add line/branch coverage: the local
performance harness and Astro template sources remain marked unmeasured in
`scripts/coverage/inventory.json`, and the coverage gates remain blocked.

These are historical reproduction commands, not current validation or
authorization to rerun. Before any separately authorized rerun, independently
enforce browser-wide external egress isolation. The browser-test acknowledgement
does not create or verify isolation, and the diagnostic CLI does not enforce it.

Historical commands from the repository root (not authorization to rerun):

```powershell
node --test www\tests\404-layout.browser.mjs
# passed: 1 test; includes a fresh site build, loopback-only browser checks,
# and a no-gutter negative control
Push-Location www
node scripts\measure-local-performance.mjs
Pop-Location
# passed: 30 samples across 6 route/device cells; 0 non-loopback page requests
```

INP was not measured: an idle synthetic visit without representative
interactions cannot produce field INP. Total Blocking Time and long tasks were
not measured. LCP can change after the three-second observation and CLS here
does not cover the full visit. No accessibility, production-speed, budget-gate
or p75 claim follows. Field p75 LCP/INP/CLS remains provisional without
sufficient consented real-user evidence. Independent review should examine the
harness, the 404 shift and its fix before any performance conclusion or merge;
repeat on representative throttled hardware/network conditions and actual
hosting when separately authorized.

## Telemetry feasibility and privacy boundary

The existing public-site analytics implementation (`www/public/analytics-consent.js`)
is optional and consent-gated. It emits only page-view and contact-intent
events, uses fixed safe page values, omits query/referrer content, supports
withdrawal and Global Privacy Control, and attaches release metadata when
available. Its tests cover those privacy and failure behaviors. It is not a
private operational telemetry system.

The existing local MBR can review GitHub repository work and accepts
repository-attributed AI usage only as an explicit evidence-backed import. Its
documentation correctly treats absent AI usage and cost as **unknown**, not
zero. No inference provider, model token source, feature-outcome feed, private
operational telemetry store, or AI dashboard is wired into the site.

Future telemetry must keep two boundaries separate:

- **Optional public analytics:** consent-gated, purpose-limited public-site
  interactions only; honor withdrawal/GPC and the existing #95 work.
- **Restricted operational/security telemetry:** access-controlled and
  privacy-minimized service health, authorization decisions, content workflow
  outcomes, aggregate AI/MCP usage, latency, errors, quota/kill-switch events,
  and deployment health. Never collect prompts, retrieved excerpts, private
  posts, finance content, tokens, or general marketing identity.

Do not implement either boundary on a new paid service. Until a compliant
storage and processing entitlement, retention schedule, access model, and
failure behavior are verified, new private/AI telemetry remains an architecture
requirement rather than live instrumentation. Missing telemetry is surfaced as
unknown/unavailable, not success or zero.

## Parallel test strategy

- Run independent unit/component suites concurrently only when their test
  directories, temporary files, ports, fake clocks, and output reports are
  isolated. Prefer process-level parallelism for the existing MBR and website
  suites.
- Run static build/route/contract suites after unit tests against the exact
  immutable build output.
- Do not parallelize deployment, release-manifest writes, live provider
  mutations, shared database fixtures, or production/preview environments.
- External identity, AI, analytics, and MCP provider integrations require
  explicitly approved isolated test tenants/resources; ordinary CI uses
  deterministic fakes and validates all error paths.
- Record test count, duration, parallel speedup, and flake rate before setting
  numeric duration or regression budgets. Do not use sleeps or weaken
  assertions for speed.
