# First-party coverage inventory and gate

`inventory.json` is the current first-party executable inventory for the
website's browser code and maintained repository automation/tools. The gate
matches every inventoried source to exactly one Cobertura report entry, rejects
missing, duplicate, malformed, or unclassified measurements, and calculates
line/branch rates from covered and valid counts rather than averaging rounded
percentages. It fails if any component or the weighted aggregate of measured
sources is below 90% in either metric. The printed aggregate is measured
sources only; known unmeasured sources are reported as blockers, not silently
omitted from an otherwise green result.

## Collecting reports

From the repository root in PowerShell, create isolated report directories:

```powershell
$reports = Join-Path (Get-Location) "coverage-reports"
New-Item -ItemType Directory -Force `
  "$reports\website", "$reports\automation", "$reports\mbr-ui", "$reports\coverage-gate" | Out-Null
```

Install website dependencies with `npm ci --prefix www` if needed. The gate
uses the pinned `saxes` XML parser from that installation. Install the pinned
.NET collector only if it is not already available:

```powershell
dotnet tool install --global dotnet-coverage --version 18.12.0
```

Collect the website browser report from the repository root so its source path
matches the repository-relative inventory. Collect GitHub automation and MBR
browser reports using the repository-pinned c8 dependency:

```powershell
& .\www\node_modules\.bin\c8.cmd --reporter=cobertura --reports-dir="$reports\website" `
  --include="www/public/analytics-consent.js" --exclude="www/tests/*.test.mjs" `
  node --test www/tests/*.test.mjs
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
```

Collect the .NET application reports from their offline test runners. Test-runner
source is explicitly excluded in `inventory.json`; application source remains
in the Cobertura report and is matched by its repository-relative path.

```powershell
dotnet-coverage collect --output "$reports\monitor.cobertura.xml" --output-format cobertura `
  dotnet run --project scripts\monitor\JamulaMonitor.csproj --configuration Release -- --self-test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

dotnet-coverage collect --output "$reports\mbr-dotnet.cobertura.xml" --output-format cobertura `
  dotnet run --project scripts\mbr\tests\JamulaMbr.Tests.csproj --configuration Release
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

dotnet-coverage collect --output "$reports\validation.cobertura.xml" --output-format cobertura `
  dotnet run --project scripts\validation.tests\JamulaValidation.Tests.csproj --configuration Release
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

node scripts\coverage\gate.mjs $reports "$reports\summary.json"
```

The final command currently exits **1**: missing measurements and
below-threshold components remain blockers. The printed aggregate is only the
measured subtotal and is not overall first-party coverage. Remove the local
`coverage-reports` directory after use.

For the 2026-11-08 local run on the #104 parent with these changes, the
measured subtotal was 1,899/2,134 lines (88.99%) and 1,136/1,249 branches
(90.95%). The gate failed, including for unmeasured sources. These counts are
diagnostic for that run, not a full-coverage claim; rerun for each revision.

On CI, use the same commands with the pinned Node/npm/.NET versions from the
existing workflows, and retain every report plus `summary.json` as artifacts for
the exact source revision. Do not treat a failed collector, empty report, or
console-only runner summary as a successful gate.

## Current blockers

- `scripts/monitor/InternalsVisibleTo.cs` is production assembly metadata with
  no executable lines for Cobertura to measure. It is inventoried as
  unmeasured and therefore blocks the gate, rather than being excluded.
- The website has seven `.astro` templates with build-time logic and an
  executable `www/astro.config.ts`. Existing runtime coverage reports only
  `www/public/analytics-consent.js`; build and generated-site tests do not
  provide line/branch coverage for the templates or build configuration.
- Workflow YAML contains inline shell/JavaScript and workflow control logic not
  represented by the `.github/scripts/*.cjs` Cobertura report. All tracked
  workflows are named in the inventory.
- `scripts/monitor/Program.cs`, the MBR application, and the migrated
  validation utility have measured line/branch values below the approved
  threshold; external DNS/GitHub/server paths remain in their denominators.
- `.squad/templates/` contains first-party Node, PowerShell, shell, and 11
  runnable workflow templates. They are named as an unmeasured component
  instead of being treated as third-party or silently omitted.
- The migrated validation utility is measured separately from its offline test
  runner. Its current test file is locked to the existing #110 review and is
  not modified by this coverage work.

The inventory and gate are measurement infrastructure, not proof that #109 is
accepted. Resolve every unmeasured path and threshold failure before claiming a
per-deployable or full first-party aggregate 90% pass. No production topology
or new paid service is introduced here.
