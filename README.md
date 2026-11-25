# Jamula Website

Source of truth for the public website of **Jamula, Inc.** ([`www/`](www/)), its
evidence-first architecture, privacy, legal, and product decision ledger
([`docs/`](docs/)), and internal `.NET 10` and Node.js governance and operational
tooling ([`scripts/`](scripts/)).

Documentation for future business-platform phases (CRM/scheduling, authenticated
customer portal, storage connectors, payments, and candidate side-quests) records
internal requirements, evaluations, and approval gates—not shipped features or
public commitments.

## Current repository state

- **Static public website (`www/`):** Astro (`output: "static"`,
  [`www/astro.config.ts`](www/astro.config.ts)) implementing the
  [Woven Plane design system](DESIGN.md). The current site renders the homepage
  capability narrative (`AI Strategy`, `Custom Software`, `Cloud Consulting`), an
  accessible `mailto:spam@jamula.net` inquiry link with plain-text fallback,
  `Organization` structured data, a dedicated [`/privacy/`](www/src/pages/privacy.astro)
  notice, and consent-gated GA4 measurement controls (no contact form or server
  backend is deployed).
- **Approved domain and hosting policy:** `jamula.net`, `www.jamula.net`,
  `jamula.com`, and `www.jamula.com` are served directly over HTTPS across two
  Free Azure Static Web Apps (`swa-jamula-web-prod` and `swa-jamula-com-prod`).
  `jamula.net` is canonical for indexing; HTTP upgrades to HTTPS on the same
  hostname. Website operation must not add paid operating services; free-tier
  quotas and lack of an SLA remain real constraints rather than availability
  guarantees. See [`docs/architecture/two-free-static-apps.md`](docs/architecture/two-free-static-apps.md).
- **Open Phase 1 & side-quest gates:** Remaining Phase 1 public-website readiness
  gates are tracked in [#94](https://github.com/Jamula/Jamula-www-Website/issues/94)
  (Search Console indexing/performance baseline) and
  [#95](https://github.com/Jamula/Jamula-www-Website/issues/95) (analytics vendor/DPA
  disposition and post-release four-origin verification). Exploratory zero-spend
  platform side-quests are tracked separately in
  [#108](https://github.com/Jamula/Jamula-www-Website/issues/108)–[#120](https://github.com/Jamula/Jamula-www-Website/issues/120).
- **Operational and governance tooling (`scripts/`):**
  - [`scripts/validation/`](scripts/validation/) — `.NET 10` repository governance,
    preview-archive, and preview-site validator (`JamulaValidation`).
  - [`scripts/monitor/`](scripts/monitor/) — zero-dependency `.NET 10` scheduled
    HTTPS, HSTS, canonical, and 404 drift monitor (`JamulaMonitor`).
  - [`scripts/mbr/`](scripts/mbr/) — local loopback `.NET 10` Monthly Business
    Review dashboard (`JamulaMbr`).
  - [`scripts/coverage/`](scripts/coverage/) — Cobertura inventory and `>=90%`
    line/branch coverage gate for measured first-party deployables.
  - [`scripts/spikes/`](scripts/spikes/) — local loopback mechanism spikes
    (`JamulaSideQuestSpikes`) for side-quest evaluation; never deployed to
    production.

Repository workflow configuration documents the intended deployment boundary; it
does not by itself prove live DNS, TLS, secret, or account-side configuration.

## Releasing

Production is deployed only by an authorized manual, versioned `workflow_dispatch`
run from protected `main`; merging a pull request never deploys to production, and
isolated pull-request previews are never promoted.

After owner authorization, dispatch `.github/workflows/azure-static-web-apps.yml`
with the required `change_type` classification:

```sh
# Material production change: creates baseline v0.1.0 (if no release exists yet)
# or increments the next patch tag vMAJOR.MINOR.(PATCH+1)
gh workflow run azure-static-web-apps.yml --ref main -f change_type=material

# Non-material operational/script fix: reuses the latest immutable published release tag
gh workflow run azure-static-web-apps.yml --ref main -f change_type=fix
```

Monitor the run through `swa-deployment` environment approval, `.net` and `.com`
deployments, live CSP/release verification, and GitHub Release publication.
Published GitHub Releases and their `vMAJOR.MINOR.PATCH` tags (stamped into
`/release.json`) are the authoritative release history; `www/package.json` remains
the local development baseline. See the
[release runbook](docs/architecture/two-free-static-apps.md) for permissions,
verification, retries, and partial-deployment recovery.

## Local development

CI pins `.NET 10.0` LTS (`dotnet-version: 10.0.x`), Node.js `26.13.0`, and npm
`12.2.1`. From the repository root:

```sh
npm --prefix www ci
npm --prefix www run dev
```

Run website formatting checks, `astro check` + production static build, generated-HTML/contrast checks, and unit tests:

```sh
npm --prefix www run format:check
npm --prefix www run build
node www/scripts/test_built_site.mjs
node --test www/tests/analytics-consent.test.mjs
```

## Governance, security, licensing, and sponsorship

- [`PRODUCT.md`](PRODUCT.md) and [`DESIGN.md`](DESIGN.md) define current product
  truth, non-fabricated evidence boundaries, and the Woven Plane visual system.
- [`docs/README.md`](docs/README.md) indexes the architecture, legal, privacy,
  security, experience, and roadmap records.
- [`CONTRIBUTING.md`](CONTRIBUTING.md) covers branch hygiene, coding/toolchain
  standards, required validation commands, and exact-SHA PR approval rules.
- [`SECURITY.md`](SECURITY.md) covers supported versions and private vulnerability
  reporting via GitHub Security Advisories.
- [`LICENSE`](LICENSE), [`LICENSE_SCOPE.md`](LICENSE_SCOPE.md),
  [`TRADEMARKS.md`](TRADEMARKS.md), and
  [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) define the Apache-2.0 license
  grant for Jamula-authored code/technical docs, reserved Jamula brand/editorial
  exclusions, and third-party MIT attributions.
- [`.github/FUNDING.yml`](.github/FUNDING.yml) configures optional GitHub Sponsors
  support (`@cyrusjamula`) for open-source stewardship of the Apache-2.0 tooling
  and engineering templates in this repository. Sponsorship is strictly optional
  and does not purchase commercial Jamula, Inc. consulting services, support SLAs,
  or rights in reserved brand/content materials.

For governance, workflow, and `.NET` validation checks from the repository root:

```sh
dotnet run --project scripts/validation/JamulaValidation.csproj --configuration Release -- validate-governance .
dotnet run --project scripts/validation.tests/JamulaValidation.Tests.csproj --configuration Release
dotnet run --project scripts/validation.cli.tests/JamulaValidation.Cli.Tests.csproj --configuration Release
node --test .github/scripts/swa-preview.test.cjs .github/scripts/verify-preview.test.cjs .github/scripts/release.test.cjs
```

For `#109` coverage-inventory checks (requires `npm --prefix www ci` first; see
[`scripts/coverage/README.md`](scripts/coverage/README.md)):

```sh
node --test scripts/coverage/gate.test.mjs
```
