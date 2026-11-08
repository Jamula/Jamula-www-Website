# Side-quests quality and measurement baseline

**Evidence date:** 2026-11-08
**Status:** Baseline inventory; no side-quest component has passed release gates
**Related work:** #109, #115, #116, #117, #118, and #120

This document records what can be measured in the current repository and what
remains unknown. Missing data is **not measured**, not zero, and not a pass.
The approved minimum is at least 90% line **and** branch coverage for every
first-party deployable and across the aggregate, in addition to behavior-focused
success, error, privacy, security, accessibility, and recovery tests.

## Current component inventory

| Component | Current role | Existing validation | Coverage state |
|---|---|---|---|
| `www/` Astro site | Existing public static website | `npm run check`; `npm run build`; `node scripts/test_built_site.mjs`; coverage-gated behavior tests from `www/` | First-party browser-executable JavaScript inventory: `public/analytics-consent.js` (the only `www/public` JS/MJS/CJS file; 100.00% line / 96.12% branch, gated at 90%). `src/components/AnalyticsConsent.astro` loads it; other `.astro` components/pages/layouts render at build time. `BaseLayout.astro` emits JSON-LD data, not executable JS. Test/support executables `scripts/test_built_site.mjs` and `tests/analytics-consent.test.mjs` are not shipped. The Node runtime report does not cover Astro build-time template code, generated route HTML/CSS, or other deployables. Thus this measured module is not proof of >=90% coverage for the website deployable. |
| `scripts/monitor/` .NET 10 | Existing CI-only, read-only four-host uptime monitor | `dotnet build JamulaMonitor.csproj --configuration Release --nologo`; `dotnet run --project JamulaMonitor.csproj --configuration Release --no-build -- --self-test` | Temporary `dotnet-coverage` measurement: 83.75% line / 85.57% branch for the application assembly including its CLI/self-test paths; below 90%. No CI coverage gate. It is not a public-site deployable. |
| `scripts/mbr/` .NET 10 plus browser JavaScript | Local-only monthly business review tool; not deployed to production | `dotnet run --project scripts\mbr\tests\JamulaMbr.Tests.csproj --configuration Release`; `node --test scripts\mbr\tests\ui.test.mjs` from the repo root | Temporary `dotnet-coverage` measurement of the MBR application assembly: 58.00% line / 79.50% branch; below 90%. The test-runner assembly is not included in the app result. No CI coverage gate. |
| Five first-party Python preview/governance scripts (retired): `test_preview_artifact.py`, `test_preview_site.py`, `validate_governance.py`, `validate_preview_artifact.py`, `verify_preview_site.py` | CI-only governance and isolated preview validation; replaced with dependency-free .NET 10 utility `scripts/validation/` (`Program.cs`, `GovernanceValidator.cs`, `PreviewArtifactValidator.cs`, `PreviewSiteVerifier.cs`) and executable offline checks in `scripts/validation.tests/Program.cs` | `dotnet run --project scripts/validation.tests/JamulaValidation.Tests.csproj --configuration Release`; `dotnet run --project scripts/validation/JamulaValidation.csproj --configuration Release -- validate-governance .` | Migration removes all five Python scripts and updates workflow/documentation callers. Replacement suite reports 56 deterministic offline checks; governance validation passed. This is validation evidence, not coverage: the utility has no line/branch report or 90% CI gate. Track debt and acceptance evidence in [#110](https://github.com/Jamula/Jamula-www-Website/issues/110). |
| Side-quest sections, identity/content APIs, AI, MCP, telemetry | Not implemented | No production source, deployed endpoint, approved inference entitlement, or live behavior suite exists | **Not applicable / blocked**, not 0% and not passing. See [feasibility assessment](../architecture/side-quests-feasibility.md). |

Existing measured local test results captured before side-quest work:

- The Astro website passed `npm run check` (14 Astro files, 0
  errors/warnings/hints), `npm run build` (3 static pages),
  `node scripts/test_built_site.mjs` (**55 tests, 0 failures, 1,891 ms**),
  and `node --test tests/*.test.mjs` (**61 tests, 0 failures, 206 ms**).
- Restricting Node's built-in coverage report to the existing executable
  `public/analytics-consent.js` yielded **100.00% line, 96.12% branch, and
  95.24% function coverage** across the 61 website behavior tests. This is
  module-level evidence only; it is not overall Astro deployable coverage and
  does not measure HTML/CSS or unimported scripts.
- The monitor passed its Release .NET 10 build (0 warnings/errors) and all 20
  named self-tests. With the temporary `dotnet-coverage` 18.12.0 collector,
  this test run measured 304/363 lines and 166/194 branches (83.75%/85.57%).
- The MBR .NET fixture runner reported **67 offline fixture checks passed**.
- Its application assembly measured 58.00% line / 79.50% branch coverage;
  the MBR browser suite reported **28 tests passed, 0 failed**.
- The existing preview/governance Python suite reported **16 tests passed**,
  and governance validation passed. These exact Python commands are retired
  when #110 is complete.
- Initial website validation required `npm ci` because `www/node_modules` was
  absent. Installation added the locked 280 packages and reported zero
  vulnerabilities; the results above are from the subsequent successful run.

## Coverage gate implementation

Coverage thresholds are not currently enforced for every project or
initiative-wide. The current website CI now enforces a 90% line and branch
threshold for its shipped `public/analytics-consent.js` browser module, using:

```sh
node --experimental-test-coverage --test \
  --test-coverage-include=public/analytics-consent.js \
  --test-coverage-lines=90 --test-coverage-branches=90 \
  tests/*.test.mjs
```

The same gate runs for the release-version and versionless preview build
variants in `.github/workflows/required-pr-validation.yml`. It does not claim
coverage for Astro build-time templates or other deployables. The temporary
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

| Area | Required success and denial/failure evidence |
|---|---|
| Tenant authentication and section authorization | Valid authorized Jamula tenant user; explicitly invited B2B guest with separately granted role; uninvited or unassigned user; wrong tenant/issuer/audience; expired or revoked identity; missing or unavailable policy; role revocation during request; direct API, asset, search, and tool invocation. Every ambiguous/unavailable policy fails closed. |
| Private Finance/Tech content | Draft isolation; reviewer access; publish only after authorized confirmation of exact version; stale revision; wrong user/role/section; duplicate/replayed confirmation; public snapshot only after explicit publish; unpublish removes origin/search/cache references; stale media/index denied. |
| Admin content actions | Draft/edit/review/publish/unpublish only; AI suggestion requires human confirmation; confirmation bound to actor, target, action, and exact content revision; concurrent edit and idempotent retry; unsupported admin, finance, deployment, or identity-management action denied. |
| Public and private assistant | Public corpus includes only rights-approved published content; private retrieval rechecks current role and section; cross-user/section canaries return no data; prompt injection cannot change authorization, corpus, or tools; provider outage, refusal, quota exhaustion, malformed output, timeout, and kill switch return explicit safe outcomes. |
| MCP clients and tools | Direct external client request and direct tool call; invalid/missing identity; wrong audience/scope; tool-level authorization denial; duplicate/replayed mutation; stale confirmation; malformed JSON-RPC/transport; timeout and unavailable policy/audit. No tool trusts model annotations as authorization. |
| Telemetry and privacy | Allowed outcome events are typed and correlated without raw prompts, retrieved passages, private content, financial details, access tokens, or direct identities; consent withdrawal stops optional public analytics; telemetry storage failure is visible and blocks privileged operations where audit is required; retention/deletion and quota kill switch are verified. |
| Release and recovery | Only affected component builds/deploys by default; shared-contract change validates consumers; full-release manifest pins compatible versions; concurrent release lock; partial success is visible; health failure stops progression; recovery restores a compatible set without exposing private data. |

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
