# Contributing

## Work tracking and toolchain

- Start with a GitHub issue in the appropriate milestone (`M01`–`M05`) using the `[Mxx.yy]` sub-milestone title prefix that defines scope, owner, acceptance criteria, dependencies, and required reviews.
- Use an isolated pull-request branch or worktree based on protected `main`.
- Assign one integration owner and one writer to each PR branch (they may be the same person). Contributors work in isolation and hand off changes; only the owning session writes the delivery branch.
- `main` is the only persistent production source. Pull-request previews are isolated and are never promoted to production.
- Prefer currently supported `.NET` (`.NET 11.0` / `net11.0` pinned in root [`global.json`](global.json), inheriting `<Nullable>enable</Nullable>`, `<ImplicitUsings>enable</ImplicitUsings>`, and `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>` from [`Directory.Build.props`](Directory.Build.props), indexed in [`Jamula.slnx`](Jamula.slnx), with minimal/zero unnecessary third-party NuGet dependencies) and `Node.js` (`26.13.0` / npm `12.2.1` in CI) using ES modules (`.mjs`) or TypeScript (`.ts`). All legacy `.py` and `.cjs` scripts have been retired; do not introduce Python or CommonJS scripts, and keep workflow YAML thin by placing verification, retry, and configuration logic in tested, coverage-inventoried modules.
- Every first-party executable component and the overall aggregate target at least `95%` line and `90%` branch coverage (`scripts/coverage/inventory.json`), and unmeasured sources remain tracked in [`scripts/coverage/README.md`](scripts/coverage/README.md); prioritize deterministic offline happy-path and failure-path tests.

## Website validation

From the repository root, install dependencies, check formatting, run `astro check` + static build, and run the generated-output and website regression suites:

```sh
npm --prefix www ci
npm --prefix www run format:check
npm --prefix www run build
node www/scripts/test_built_site.mjs
node --test "www/tests/*.test.mjs"
```

The generated-site checks cover metadata, canonical routes, internal links and fragments, sitemap/robots output, semantic landmarks, documented light/dark color-token contrast pairs, and the approved homepage Organization data. They are regression checks, not a complete WCAG conformance evaluation.

The focused website tests also check consent-first analytics host selection,
storage/version/purpose validation, GPC, withdrawal, minimized event configuration
and consent markup. They intercept tag insertion rather than contacting Google;
account-side settings and release checks remain in
[`docs/privacy/data-lifecycle.md`](docs/privacy/data-lifecycle.md#public-website-analytics-implementation-and-activation-gate).

HTML checks use parse5's HTML5 parser rather than stripping markup with regular
expressions. Contrast checks use PostCSS to apply `:root` custom properties in
source order, including later overrides and `!important`, for unconditional
rules and exact light/dark color-scheme media queries. Nested queries must all
apply to the same theme; contradictory light/dark ancestors neither apply tokens
nor satisfy the required dark root. Other conditional or
nested `:root` rules fail explicitly; this is not a general computed-style or
CSS-cascade audit. Both parsers are development-only dependencies and add no
browser code or network requests to the website.

Styles are evaluated independently per page in inline/linked document order;
resource URLs resolve against the page URL and must exist on every approved
Jamula host. The robots check enforces the current minimal public-crawling
policy (`User-agent: *`, `Allow: /`, and the canonical sitemap index), rejecting
additional directives or crawler-specific groups rather than inferring their
effective behavior.

## Licensing

Unless explicitly marked otherwise, a contributor who intentionally submits code or technical documentation represents that they have authority to do so and agrees to license the contribution under Apache License 2.0.

External contributions may be discussed and reviewed, but they are not merged
until qualified counsel approves the inbound contribution policy (including
whether Jamula should use Apache section 5 alone, a DCO, a CLA, or additional
employer-authority representations).

Do not submit:

- content you do not have permission to license;
- customer or employer-confidential material;
- trademarks, logos, copyrighted media, personal data, or generated content without provenance and approval;
- code copied from another project without preserving its license and attribution;
- work owned by an employer, customer, or other party unless you have documented authority to contribute it.

Third-party and reserved-content paths in `LICENSE_SCOPE.md` require maintainer review; update `THIRD_PARTY_NOTICES.md` and `docs/legal/license-inventory.md` whenever third-party packages or vendored assets change. Contributions do not grant rights to Jamula or third-party trademarks. Public company, customer, compliance, accessibility, or performance claims require dated source verification and owner approval (`docs/decisions/approvals.md` and `docs/content/public-claims-register.md`).

Optional GitHub Sponsors support configured in `.github/FUNDING.yml` (`@cyrusjamula`) applies only to open-source stewardship of Apache-2.0 repository materials and never creates a commercial engagement, priority merge right, or SLA with Jamula, Inc.

## Security and privacy

- Never read or commit `.env`, `.env.local`, `.env.production`, or other secret-bearing `.env.*` files; use committed `.env.example` templates (when present) and documented configuration schemas only.
- Never commit credentials, tokens, private keys, connection strings, personal data, or machine-local secrets.
- Follow [`SECURITY.md`](SECURITY.md) and use GitHub Private Vulnerability Reporting for security issues. Do not put sensitive vulnerability details in a public issue or pull request.

## Pull requests

- Follow [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md): link the issue, summarize why the change is needed, complete the security/privacy/accessibility/licensing checklist, and record exact validation commands with pass/fail results.
- Keep one author per artifact; use named reviewers for cross-domain concerns.
- Prefer one focused PR; use a stack only for real dependencies that make review clearer. Before integrating a dependent PR, verify the approved revision and expected parent; if its base or head changes, revalidate the child and obtain applicable review again. Do not integrate unapproved or rejected work into a parent.
- The integration owner may routinely sync/rebase and publish their own PR branch. Before rewriting history, fetch and observe the exact remote tip and use `--force-with-lease=refs/heads/<branch>:<observed-sha>`; never overwrite concurrent/unreviewed work or force-update protected refs or another session's branch. Stop for concrete missing authority/permission or an unresolved content decision.
- Ordinary review comments and non-blocking follow-up are not formal rejections; the owner/original author handles their fixes. A formal rejection retains the existing strict lockout: a different author revises and independent re-review is required.
- For governance, workflow, and validation changes, run:
  - `dotnet build Jamula.slnx --configuration Release --nologo`
  - `dotnet run --project scripts/validation/JamulaValidation.csproj --configuration Release -- validate-governance .`
  - `dotnet run --project scripts/validation.tests/JamulaValidation.Tests.csproj --configuration Release`
  - `dotnet run --project scripts/validation.cli.tests/JamulaValidation.Cli.Tests.csproj --configuration Release`
  - `node --test .github/scripts/swa-preview.test.mjs .github/scripts/verify-preview.test.mjs .github/scripts/release.test.mjs .github/scripts/uptime-alert.test.mjs`
- When modifying tracked executable sources or `#109` coverage harnesses (`scripts/coverage/`), run `npm --prefix www ci` and `node --test "scripts/coverage/*.test.*"` (enforced on every PR by `Required PR Validation`), plus any component-specific collectors documented in [`scripts/coverage/README.md`](scripts/coverage/README.md).
- For monitor or MBR changes, also run:
  - `dotnet run --project scripts/monitor/JamulaMonitor.csproj --configuration Release -- --self-test`
  - `dotnet run --project scripts/mbr/tests/JamulaMbr.Tests.csproj --configuration Release`
  - `node --test scripts/mbr/tests/ui.test.mjs`
- For changes under `www/`, run `npm --prefix www ci`, `npm --prefix www run format:check`, `npm --prefix www run build`, `node www/scripts/test_built_site.mjs`, and `node --test "www/tests/*.test.mjs"`.
- Pass all required review and workflow checks (`Required PR Validation` and `Governance Validation`) for the files changed.
- Request Cyrus's approval only when a stable, published top-level delivery head has independent review, required checks, and mergeability ready. Approval is for the exact head SHA; every new commit invalidates it and requires fresh approval. Keep all required protections intact.
- Escalate a blocker with one actionable, evidence-backed request for the needed decision or authority, not repeated status pings; continue independent work where possible.
