# First-party coverage inventory and gate

`inventory.json` is the current first-party executable inventory for the
website's browser code and maintained repository automation/tools. Each
measured source is bound to exactly one named Cobertura report; the gate rejects
missing or invalid bindings, sources reported in a different file, duplicate,
malformed, or unclassified measurements, and calculates
line/branch rates from covered and valid counts rather than averaging rounded
percentages. It fails if any component or the weighted aggregate of measured
sources is below 90% in either metric. The printed aggregate is measured
sources only; known unmeasured sources are reported as blockers, not silently
omitted from an otherwise green result.

Tracked runnable sources in the local side-quest artifact spike are inventoried
as `sidequest-artifacts-local-runtime`. The PowerShell publisher is executable
authored code, not test-only; it has no compatible line/branch report and remains
an explicit unmeasured blocker. The section host and gateway are measured by the
offline process checks described below; linked `SectionHost.cs` attribution is
verified across Admin/Finance/Tech before counting one copy.
Only the offline checks runner and its child-process fixture are excluded as
test support. The spike measurement does not imply a passing component or overall
gate.

Source attribution is anchored to this gate's actual repository root, not the
report directory or a matching filename suffix. Without `<sources>`, relative
class filenames are repository-relative. With `<sources>`, relative filenames
are resolved against every declared root (itself absolute or repository-relative);
all roots must be inside the checkout and identify the same file. Absolute class
filenames identify the file directly. POSIX, Windows drive/UNC paths, and local
`file:` URLs are supported, but foreign checkout roots, escaping paths, ambiguous
roots, and unsupported URLs fail closed. Windows paths compare case-insensitively;
POSIX paths remain case-sensitive. Reports from another checkout must be collected
again in the checkout being evaluated; a similar trailing directory is not evidence
of source identity. Imported tests can supply an explicit absolute repository root
as the third argument to `evaluateCoverage`; its fourth argument is a `Map` of
validated metadata file contents. The CLI always uses its own checkout and loads
the metadata content from that checkout.

The monitor's `InternalsVisibleTo.cs` is explicitly inventoried under
`validatedMetadata`, not excluded or measured. On every gate invocation, the
CLI reads that file from its own repository root (not the reports directory or
current working directory). Its narrowly allowlisted classification accepts
only `using System.Runtime.CompilerServices;` followed by the literal assembly
attribute `[assembly: InternalsVisibleTo("JamulaMonitor.Tests")]`, with ASCII
spaces, tabs, and line endings around the declarations. Missing content, any
other path/kind/component, duplicate classifications, comments, directives,
additional attributes, declarations, expressions, or executable code fail
closed. A reported executable class for this path is still unclassified and
fails. Changes to the permitted syntax require explicit review of the guard;
this is intentionally not a general C# parser or a metadata exclusion glob.

The summary retains this source's path, kind, reason, and validation result
separately, with **no** invented line/branch counts and no effect on thresholds.
The gate tests mutate the content and classification to verify rejection.
`dotnet run --project scripts\monitor\tests\JamulaMonitor.Tests.csproj --configuration Release`
also compiles the friend's existing internal API calls and runs
`AssemblyMetadata_GrantsInternalsOnlyToMonitorTests`, checking the emitted
attribute names so exactly one friend—the actual test assembly—is granted
internal access, while `Monitor` remains non-public. Run both this command and
`node scripts\coverage\gate.test.mjs` when changing this classification.

The local Edge-based performance diagnostic at
`www/scripts/measure-local-performance.mjs` is a runnable first-party source,
not test support. It remains explicitly unmeasured in `website-browser`:
the fake CDP replies with canned values and does not execute the embedded
browser-side JavaScript or its instrumentation branches. c8 host-line counts
from those tests would not represent coverage of the diagnostic source. Its
offline lifecycle tests do not measure real Edge behavior.

## Collecting reports

From the repository root in PowerShell, create isolated report directories:

```powershell
$reports = Join-Path (Get-Location) "coverage-reports"
New-Item -ItemType Directory -Force `
  "$reports\website", "$reports\astro-config", "$reports\automation", "$reports\mbr-ui", "$reports\coverage-gate", "$reports\ralph-triage", "$reports\sidequest-artifacts" | Out-Null
```

Install website dependencies with `npm ci --prefix www` if needed. The gate
uses the pinned `saxes` XML parser from that installation. Install the pinned
.NET collector only if it is not already available:

```powershell
dotnet tool install --global dotnet-coverage --version 18.12.0
```

Build the website first: several browser tests read files from `www/dist`.
Collect the website browser report from the repository root so its source path
matches the repository-relative inventory. Collect GitHub automation and MBR
browser reports using the repository-pinned c8 dependency:

```powershell
npm --prefix www run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

& .\www\node_modules\.bin\c8.cmd --reporter=cobertura --reports-dir="$reports\website" `
  --include="www/public/analytics-consent.js" --exclude="www/tests/*.test.mjs" `
  node --test www/tests/*.test.mjs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$collectorOutput = npm --prefix www run coverage:astro-config 2>&1
$collectorExit = $LASTEXITCODE
$collectorOutput | ForEach-Object { Write-Host $_ }
if ($collectorExit -ne 0) { exit $collectorExit }
$reportLine = @($collectorOutput | Where-Object { "$_" -match '^Coverage reports: ' })
if ($reportLine.Count -ne 1) { throw "Astro config collector did not identify exactly one report directory." }
$configReports = "$($reportLine[0])" -replace '^Coverage reports: ', ''
Copy-Item -LiteralPath (Join-Path $configReports "cobertura-coverage.xml") `
  -Destination "$reports\astro-config\cobertura-coverage.xml" -ErrorAction Stop

node --test www/tests/measure-local-performance.test.mjs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

& .\www\node_modules\.bin\c8.cmd --reporter=cobertura --reports-dir="$reports\automation" `
  --include=".github/scripts/*.cjs" --exclude=".github/scripts/*.test.cjs" `
  node --test .github/scripts/*.test.cjs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

& .\www\node_modules\.bin\c8.cmd --reporter=cobertura --reports-dir="$reports\mbr-ui" `
  --include="scripts/mbr/wwwroot/dashboard.js" --exclude="scripts/mbr/tests/*.mjs" `
  node --test scripts/mbr/tests/ui.test.mjs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

& .\www\node_modules\.bin\c8.cmd --reporter=cobertura --reports-dir="$reports\coverage-gate" `
  --include="scripts/coverage/gate.mjs" --exclude="scripts/coverage/gate.test.mjs" `
  node --test scripts/coverage/gate.test.mjs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

& .\www\node_modules\.bin\c8.cmd --all --include=".squad/templates/ralph-triage.js" `
  --exclude="" --reporter=text --reporter=cobertura --reporter=json-summary `
  --reports-dir="$reports\ralph-triage" --check-coverage --lines=90 --branches=90 --per-file `
  node --test scripts/coverage/ralph-triage.test.cjs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
```

The Ralph collector explicitly includes the hidden source and clears c8's
default exclusions. Run from the repository root: Cobertura records that
absolute root, which the gate checks against its own checkout. Its offline CLI
tests stub Git, HTTPS and output writes; no GitHub request or result file is
created. c8 reports V8 line and branch counts, not independent boolean
condition coverage. Other Squad templates remain unmeasured.

The notes-fetch PowerShell template has offline behavior tests:
`node --test scripts/coverage/notes-fetch.test.cjs`. The harness uses a fake Git
function and a disposable repository-shaped directory; it does not touch real
refs/remotes or make network requests. These tests do not collect source
coverage. Pester 3.4.0's standard `CodeCoverage` output supplies line hits, not
branch outcomes. PowerShell AST inspection identifies control-flow structure
but does not show which paths ran. Inserting hit markers or wrapping conditions
would execute transformed code; no method has been verified here to preserve
automatic variables, pipeline and scope behavior, exceptions, and the original
source mapping while accounting for every executable statement and decision
outcome. Boolean-term counts, AST-node counts, passing behavior tests, and line
hits are not source coverage or a line-and-branch report. The focused test also
rejects an inventory mutation that reclassifies this template as measured.
Keep it explicitly unmeasured until a semantics-preserving collector proves
complete attribution against the original source.
The same offline test demonstrates one concrete instrumentation hazard: adding
`Write-Output` to the `$existing` condition in a temporary copy makes a missing
refspec truthy, so the script skips the fake Git `config --add` call. The
uninstrumented source adds it. This rejects that particular probe, not every
possible instrumentation method; it does not measure source coverage or
establish a complete denominator. The test only runs with the fake Git fixture.
These behavior checks do not complete the #109 coverage gate.

The live `.github/workflows/squad-triage.yml` JavaScript block has deterministic
offline behavioral tests: `node --test scripts/coverage/squad-triage.test.cjs`.
The tests extract the block directly from the workflow and supply local
filesystem, GitHub API, and core fakes; they do not call GitHub. The VM filename
and line offset support diagnostics, not a coverage source map: V8 ranges refer
to the extracted and wrapped JavaScript, not the original YAML bytes. The
repository-pinned c8 excludes `.yml` by default; forcing `--extension .yml`
produces a misleading report attributing execution to YAML metadata and
misplacing JavaScript branches. Do not use that report as coverage evidence.
Node's experimental test-coverage report also cannot reliably map this VM
script back to the original YAML. Neither report measures the Actions event,
job condition, step execution, or external actions. The gate classifies whole
source paths, so treating the YAML as measured from the script alone would hide
those behaviors. It remains an unmeasured blocker; no counts are added to the
gate. V8 branch ranges are not independent boolean-condition coverage.

Run `node --test scripts\coverage\write-note.test.cjs` for offline PowerShell
note-writer behavior checks. A disposable fixture intercepts Git and sleeps;
these checks do not produce source-level line or branch coverage, so
`write-note.ps1` remains unmeasured and the gate remains blocked.

The Astro collector writes a fresh temporary directory on each run; the copy
above uses the directory printed by that successful run. Its Cobertura
`<sources>` root resolves the relative `astro.config.ts` filename to the
inventoried source. This measures the configuration only, not rendered HTML or
the seven Astro templates. The collector reports c8/V8 branch counts, which do
not establish independent coverage of every boolean condition.

The author reported an offline Astro 7.4.4 / c8 9.1.0 investigation in which
the compiler emitted inline source maps identifying the original `.astro`
files. That map alone was not sufficient for coverage attribution. With the
normal `vite.build.sourcemap: false` setting, c8 reported no covered lines or
branches for the seven templates. Enabling build sourcemaps in a temporary
config and using c8's `--exclude-after-remap` option reportedly produced
**1,110/1,110 lines (100%) and 3/3 branches (100%)** across the templates, but
Cobertura marked static HTML and CSS source lines as covered. Its only branch
entries reportedly mapped to `<BaseLayout>` invocations in `404.astro:9`,
`index.astro:24`, and `privacy.astro:9`, not to template conditional
expressions. These counts are author-reported and were not independently
verified during this integration; they are not executable-source coverage and
must not enter the inventory or 90% gate. Production source maps remain
disabled.

`CoverageGate_KeepsAllAstroTemplatesAsUnmeasuredBlockers` protects the exact
seven paths and confirms that complete browser and Astro-config reports cannot
make the website component pass while those templates lack validated
executable-source measurements. Keep the entries unmeasured until a
compiler-aware collector can distinguish executable template expressions and
their branches from emitted markup and styles.

The performance diagnostic tests above are correctness checks only, not a
coverage report. Their fake CDP server returns canned values; it does not
evaluate the embedded instrumentation or browser-side extraction code. The
diagnostic therefore remains an unmeasured blocker until its browser logic can
be measured independently or exercised by a collector that observes its actual
execution.

The seven unhit V8 branch ranges are: duplicate listen completion (line 14),
undefined `signalCode` (36), already-exited child at entry (45), exit between
listener setup and the second check (61), duplicate server-close completion
(74), path-containment rejection (303–306), and the CLI entry-point path
(460–465). Uncovered lines are 304–306 and 461–465. These counts include V8's
line/branch mapping, not independent boolean-condition coverage; the fake CDP
browser and loopback HTTP tests are not evidence of live Edge or field results.

Collect the .NET application reports from their offline test runners. Test-runner
source is explicitly excluded in `inventory.json`; application source remains
in the Cobertura report and is matched by its repository-relative path.

> **MONITOR COLLECTION PAUSED:** Do not run the monitor collector or probe live
> Jamula hosts pending an offline root-cause determination. Earlier DNS and
> HTTP(S) success messages do not establish that external requests were sent:
> `Monitor_HttpClientDisposesHandlerExactlyOnce` exercises injected DNS/HTTP
> fakes. The self-tests now capture fake-run output, and
> `Monitor_FakeSuccessOutputIsCapturedAndNotPrintedUnlabelled` guards against
> those success messages reaching the console. This does not establish whether
> the original collector sent requests. No original network trace is available,
> so actual network activity remains unknown. The missing
> `monitor.cobertura.xml` is an explicit coverage-gate blocker. The remaining
> collectors below do not produce complete per-deployable or aggregate coverage
> and must not be presented as a complete passing report.

```powershell
dotnet-coverage collect --output "$reports\mbr-dotnet.cobertura.xml" --output-format cobertura `
  dotnet run --project scripts\mbr\tests\JamulaMbr.Tests.csproj --configuration Release
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# The fixture publishes fresh artifacts and exercises the running child processes
# in one collector session. Its explicit coverage mode forwards only dotnet-coverage's
# profiler/session variables to the published .NET hosts; all other child environment
# isolation remains unchanged. Never reuse a previous report.
if (Test-Path -LiteralPath "$reports\sidequest-artifacts\cobertura-coverage.xml") {
  Remove-Item -LiteralPath "$reports\sidequest-artifacts\cobertura-coverage.xml" -Force -ErrorAction Stop
}
dotnet-coverage collect --output "$reports\sidequest-artifacts\cobertura-coverage.xml" --output-format cobertura `
  dotnet run --project scripts\spikes\sidequest-artifacts\Checks\Checks.csproj --configuration Release -- --coverage
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# Never leave a previous combined result available after a failed collection.
if (Test-Path -LiteralPath "$reports\validation.cobertura.xml") {
  Remove-Item -LiteralPath "$reports\validation.cobertura.xml" -Force -ErrorAction Stop
}
$validationRunners = @'
dotnet run --project scripts\validation.tests\JamulaValidation.Tests.csproj --configuration Release
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
dotnet run --project scripts\validation.cli.tests\JamulaValidation.Cli.Tests.csproj --configuration Release
exit $LASTEXITCODE
'@
dotnet-coverage collect --output "$reports\validation.cobertura.xml" --output-format cobertura `
  pwsh -NoProfile -Command $validationRunners
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

node scripts\coverage\gate.mjs $reports "$reports\summary.json"
```

The validation command requires PowerShell 7 (`pwsh`). Both offline runners and
their subprocesses run inside one collector session, combining execution into
the single inventoried `validation.cobertura.xml` without counting shared
assembly/class/line identities twice. Either runner or collector failing stops
the command sequence before the gate; a partial report is not valid evidence.
Do not merge separately exported Cobertura reports with `dotnet-coverage merge`
18.12.0: a local check reduced branch denominators from 160 to 138 for
`PreviewArtifactValidator.cs` and from 78 to 74 for `PreviewSiteVerifier.cs`.
Merging native `.coverage` inputs then exporting also lost the branch evidence.
The shared-session Cobertura export preserves the original denominators.
The CLI tests exercise offline dispatch/error paths, not successful live
verification; the remaining production paths stay in the denominator.

The side-quest spike report is collected from the actual published child
processes, not inferred from the `Checks` runner's own coverage. `--coverage`
passes only collector profiler/session variables to host children while
preserving the fixture's clean environment for all other settings. The report
must identify the current checkout's absolute source paths and the expected
`Admin`, `Finance`, `Tech`, and `Gateway` modules. `SectionHost.cs` is linked
into three assemblies; the gate requires identical class/line identities and
hit states for all three, then counts one verified copy. It also requires that
all three copies report no branches, so a future branch addition fails closed
instead of collapsing branch counts. Gateway is expected only in its single
`Gateway` module; its branch condition denominators are retained directly from
that module without report merging. This identity rule is specific to these
declared builds, not a general-purpose Cobertura merge.

Run the publisher's offline behavior checks separately from source coverage:

```powershell
dotnet run --project scripts\spikes\sidequest-artifacts\Checks\Checks.csproj --configuration Release -- --publisher
```

The fixture shadows `dotnet` with an in-process PowerShell function that records
arguments and returns controlled exit codes; it performs no builds or feed
access. It reports **9 publisher checks passed, 0 skipped, 0 failed** with
stable names documented in `scripts\spikes\sidequest-artifacts\README.md`.
These checks do not produce line or branch coverage. The available Pester 3.4
CodeCoverage feature counts executed PowerShell commands but has no branch
counts and no repository-pinned Cobertura exporter; `dotnet-coverage` measures
CLR code, not PowerShell source. The gate therefore retains `Publish-Local.ps1`
as an explicit unmeasured blocker and does not infer a coverage pass from the
behavior checks.

The fresh 2026-11-13 local collection ran
`dotnet-coverage collect --output artifacts\sidequest-coverage\sidequest-artifacts\cobertura-coverage.xml --output-format cobertura dotnet run --project scripts\spikes\sidequest-artifacts\Checks\Checks.csproj --configuration Release -- --coverage`
and passed **19 checks, 0 skipped, 0 failed**. The report resolved both source
paths to this checkout and measured:

| Source | Lines | Branches |
| --- | ---: | ---: |
| `SectionHost.cs` (verified once across Admin/Finance/Tech) | 32/32 (100%) | 0/0 (N/A; no branches) |
| `Gateway/Program.cs` (Gateway module only) | 61/62 (98.39%) | 38/40 (95.00%) |
| Measured runtime-source subtotal | 93/94 (98.94%) | 38/40 (95.00%) |

These are class/line identities from Cobertura, not unique physical line
numbers. The `SectionHost.cs` count is taken from one of three verified
identical module copies; its zero branch denominator is reported as N/A, never
as 100%. The PowerShell publisher remains unmeasured. Running the gate with
only this report produced the above spike subtotal and exited **1**, retaining
the publisher blocker and missing reports for every other component; no
overall coverage pass is established.

The author reported that a 2026-11-15 local collection used the same collector
with an isolated report directory and passed **24 checks, 0 skipped, 0 failed**.
That report was said to resolve both compiled source paths to this checkout and
measure 93/94 lines (98.94%) and 38/40 branches (95.00%); a gate run with only
that report was reported to exit **1**, with the publisher and other components
still blocking. These historical results were not independently reproduced
during this integration. The reported runtime-source counts exclude
`Publish-Local.ps1`; they are not publisher coverage or an overall 90% result.

The final command currently exits **1**: missing measurements and
below-threshold components remain blockers. The printed aggregate is only the
measured subtotal and is not overall first-party coverage. Remove the local
`coverage-reports` directory after use.

For the 2026-11-08 local run on the #104 parent with these changes, the
measured subtotal was 1,899/2,134 lines (88.99%) and 1,136/1,249 branches
(90.95%). The gate failed, including for unmeasured sources. These counts are
diagnostic for that run, not a full-coverage claim; rerun for each revision.

For the 2026-11-13 local run at `56a25e2`, all collectors succeeded but the
gate exited **1**. Counts below are covered/valid for inventoried production
sources; component results include unmeasured-source blockers. The metadata
guard was integrated afterward and does not change these measurement counts.

| Component | Lines | Branches | Gate result |
| --- | ---: | ---: | --- |
| Website browser and config | 301/301 | 102/106 | Fail: seven unmeasured templates |
| GitHub automation | 575/604 | 211/226 | Fail: nine unmeasured workflows |
| Monitor | 186/205 | 80/86 | Fail: assembly metadata was unclassified in this baseline |
| Monthly business review | 460/463 | 395/401 | Pass |
| Validation tool | 358/391 | 279/302 | Pass |
| Coverage gate | 427/429 | 175/180 | Pass |
| Squad maintenance templates | Unmeasured | Unmeasured | Fail |

The measured-only aggregate was 2,307/2,393 lines (96.41%) and
1,242/1,301 branches (95.47%); its measured threshold passed, but the overall
gate failed because sources remain unmeasured. These results apply to this run
and are not full first-party coverage.

On CI, use the same commands with the pinned Node/npm/.NET versions from the
existing workflows, and retain every report plus `summary.json` as artifacts for
the exact source revision. Do not treat a failed collector, empty report, or
console-only runner summary as a successful gate.

## Current blockers

- The website has seven `.astro` templates with build-time logic that remain
  unmeasured. Astro source-map V8 coverage can remap static markup and styles to
  covered lines while leaving the executable branch denominator incomplete;
  separate configuration and browser reports do not measure those templates.
  Build and generated-site tests are not source coverage.
- `scripts/monitor/InternalsVisibleTo.cs` has no executable lines for Cobertura
  to measure. The exact-content guard validates only the allowlisted friend
  assembly declaration; it contributes no invented coverage counts. Any other
  content or classification fails closed.
- The website also has an executable `www/astro.config.ts`. The runtime
  coverage report measures only `www/public/analytics-consent.js`; separate
  configuration coverage does not measure the templates.
- Workflow YAML contains inline shell/JavaScript and workflow control logic not
  represented by the `.github/scripts/*.cjs` Cobertura report. All tracked
  workflows are named in the inventory.
- In the 2026-11-13 run, the measured monitor, MBR, and validation component
  totals met the 90% line and branch thresholds. Some individual sources remain
  below 90%; external DNS/GitHub/server paths remain in their denominators.
- The side-quest local runtime report measures only the linked section host and
  gateway. The PowerShell publisher remains unmeasured and keeps that component
  and the overall gate blocked; `SectionHost.cs` has no branch points in any of
  its three compiled modules, so its branch result is explicitly N/A (`0/0`),
  not a fabricated 100%.
- `.squad/templates/` contains first-party Node, PowerShell, shell, and 11
  runnable workflow templates. Only `ralph-triage.js` is measured; all other
  executable templates remain unmeasured blockers.
- The migrated validation utility is measured separately from its offline test
  runner. Its current test file is locked to the existing #110 review and is
  not modified by this coverage work. Combining both runners measured
  374/391 lines (95.65%) and 279/302 branches (92.38%) locally, passing this
  component only. `Program.cs` still has 8/24 uncovered lines, and
  `PreviewSiteVerifier.cs` has 11/78 uncovered branches; the component result
  is not comprehensive behavior coverage or an overall first-party pass.

The inventory and gate are measurement infrastructure, not proof that #109 is
accepted. Resolve every unmeasured path and threshold failure before claiming a
per-deployable or full first-party aggregate 90% pass. No production topology
or new paid service is introduced here.
