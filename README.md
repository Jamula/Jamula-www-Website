# Jamula Website

The public website for Jamula, Inc. is a static Astro site in [`www/`](www/).
The repository also contains documentation for future customer-platform work;
those proposals are not descriptions of features that have shipped.

## Current site

- Astro renders static output (`www/astro.config.ts`).
- The approved domain policy serves `jamula.net`, `www.jamula.net`,
  `jamula.com`, and `www.jamula.com` directly over HTTPS. `jamula.net` is
  canonical for indexing; HTTP upgrades to HTTPS on the same hostname. See
  [the deployment and domain record](docs/architecture/two-free-static-apps.md).
- The approved hosting configuration uses two Free Azure Static Web Apps.
  Website operation must not add paid operating services; existing domain
  renewals and CI allowances are separate. Free-tier quotas and lack of an SLA
  remain constraints, not guarantees of unlimited or uninterrupted service.
- Production is deployed only by an authorized manual, versioned release from
  `main`; merging does not deploy. Pull-request previews are isolated and are
  not promoted to production.
- The homepage currently has no contact form or other contact mechanism. Open
  website follow-ups are tracked in [#86](https://github.com/Jamula/Jamula-www-Website/issues/86),
  [#87](https://github.com/Jamula/Jamula-www-Website/issues/87),
  [#88](https://github.com/Jamula/Jamula-www-Website/issues/88), and
  [#89](https://github.com/Jamula/Jamula-www-Website/issues/89).

Repository workflow configuration documents the intended deployment boundary;
it does not by itself prove current DNS, TLS, secret, or live-preview state.

## Releasing

After authorization, run `gh workflow run azure-static-web-apps.yml --ref main`
and monitor the run through publication. The first release is `v0.1.0`;
subsequent releases increment the patch by default. Choose a different increment
with `-f bump=minor` or `-f bump=major`. Published GitHub releases and their
`v` tags are the release history; `www/package.json` remains the development
baseline, not the current release version. See the
[release runbook](docs/architecture/two-free-static-apps.md) for permissions,
verification, retries, and partial-deployment recovery.

## Local development

CI currently pins Node.js `26.13.0` and npm `12.2.1`. From the repository root:

```sh
cd www
npm ci
npm run dev
```

From `www/`, run static analysis and a production build:

```sh
npm run check
npm run build
```

`npm run build` runs the Astro check before generating `www/dist/`.

## Documentation and validation

- [`docs/README.md`](docs/README.md) is the documentation index and current
  status guide.
- [`CONTRIBUTING.md`](CONTRIBUTING.md) covers branch, validation, and review
  expectations.
- [`SECURITY.md`](SECURITY.md) explains the current vulnerability-reporting
  limitation.

For documentation/governance changes, run from the repository root:

```sh
dotnet run --project scripts/validation --configuration Release -- validate-governance .
node --test .github/scripts/swa-preview.test.cjs
node --test .github/scripts/release.test.cjs
dotnet run --project scripts/validation.tests/JamulaValidation.Tests.csproj --configuration Release
```
