# Contributing

## Work tracking and toolchain

- Start with a GitHub issue in the appropriate milestone (`Phase 1: Public website` or the `Side-quests` milestones) that defines scope, owner, acceptance criteria, dependencies, and required reviews.
- Use an isolated pull-request branch or worktree based on protected `main`.
- Assign one integration owner and one writer to each PR branch (they may be the same person). Contributors work in isolation and hand off changes; only the owning session writes the delivery branch.
- `main` is the only persistent production source. Pull-request previews are isolated and are never promoted to production.
- Prefer currently supported `.NET LTS` (`.NET 10.0` with `<Nullable>enable</Nullable>`, `<ImplicitUsings>enable</ImplicitUsings>`, `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>`, and minimal/zero unnecessary third-party NuGet dependencies) and `Node.js` (`26.13.0` / npm `12.2.1` in CI). Python repository utilities have been retired ([#110](https://github.com/Jamula/Jamula-www-Website/issues/110)); do not introduce new Python tooling.
- Maintain at least `90%` line and `90%` branch coverage per measured first-party deployable and overall (`scripts/coverage/inventory.json`), prioritizing deterministic offline happy-path and failure-path tests.

## Website validation

From the repository root, install dependencies, check formatting, run `astro check` + static build, and test the generated output and consent behavior:

```sh
npm --prefix www ci
npm --prefix www run format:check
npm --prefix www run build
node www/scripts/test_built_site.mjs
node --test www/tests/analytics-consent.test.mjs
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

Third-party and reserved-content paths in `LICENSE_SCOPE.md` require maintainer review; update `THIRD_PARTY_NOTICES.md` and `docs/legal/license-inventory.md` whenever third-party packages or vendored assets change. Contributions do not grant rights to Jamula or third-party trademarks. Public company, customer, compliance, accessibility, or performance claims require dated source verification and owner approval (`docs/decisions/approvals.md` and `docs/legal/public-claims-register.md`).

Optional GitHub Sponsors support configured in `.github/FUNDING.yml` (`@cyrusjamula`) applies only to open-source stewardship of Apache-2.0 repository materials and never creates a commercial engagement, priority merge right, or SLA with Jamula, Inc.

## Security and privacy

- Never read or commit `.env`, `.env.local`, `.env.production`, or other secret-bearing `.env.*` files; use `.env.example` placeholders and documented configuration schemas only.
- Never commit credentials, tokens, private keys, connection strings, personal data, or machine-local secrets.
- Follow [`SECURITY.md`](SECURITY.md) and use GitHub Private Vulnerability Reporting for security issues. Do not put sensitive vulnerability details in a public issue or pull request.

## Pull requests

- Follow [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md): link the issue, summarize why the change is needed, complete the security/privacy/accessibility/licensing checklist, and record exact validation commands with pass/fail results.
- Keep one author per artifact; use named reviewers for cross-domain concerns.
- Prefer one focused PR; use a stack only for real dependencies that make review clearer. Before integrating a dependent PR, verify the approved revision and expected parent; if its base or head changes, revalidate the child and obtain applicable review again. Do not integrate unapproved or rejected work into a parent.
- The integration owner may routinely sync/rebase and publish their own PR branch. Before rewriting history, fetch and observe the exact remote tip and use `--force-with-lease=refs/heads/<branch>:<observed-sha>`; never overwrite concurrent/unreviewed work or force-update protected refs or another session's branch. Stop for concrete missing authority/permission or an unresolved content decision.
- Ordinary review comments and non-blocking follow-up are not formal rejections; the owner/original author handles their fixes. A formal rejection retains the existing strict lockout: a different author revises and independent re-review is required.
- For governance, workflow, and validation changes, run:
  - `dotnet run --project scripts/validation/JamulaValidation.csproj --configuration Release -- validate-governance .`
  - `dotnet run --project scripts/validation.tests/JamulaValidation.Tests.csproj --configuration Release`
  - `dotnet run --project scripts/validation.cli.tests/JamulaValidation.Cli.Tests.csproj --configuration Release`
  - `node --test .github/scripts/swa-preview.test.cjs .github/scripts/verify-preview.test.cjs .github/scripts/release.test.cjs`
- When modifying tracked executable sources or `#109` coverage harnesses (`scripts/coverage/`), run `npm --prefix www ci` and the relevant offline tests documented in [`scripts/coverage/README.md`](scripts/coverage/README.md) (such as `node --test scripts/coverage/gate.test.mjs`).
- For monitor or MBR changes, also run:
  - `dotnet run --project scripts/monitor/JamulaMonitor.csproj --configuration Release -- --self-test`
  - `dotnet run --project scripts/mbr.tests/JamulaMbr.Tests.csproj --configuration Release`
  - `node --test scripts/mbr/tests/ui.test.mjs`
- For changes under `www/`, run `npm --prefix www ci`, `npm --prefix www run format:check`, `npm --prefix www run build`, `node www/scripts/test_built_site.mjs`, and `node --test www/tests/analytics-consent.test.mjs`.
- Pass all required review and workflow checks (`Required PR Validation` and `Repository Governance Validation`) for the files changed.
- Request Cyrus's approval only when a stable, published top-level delivery head has independent review, required checks, and mergeability ready. Approval is for the exact head SHA; every new commit invalidates it and requires fresh approval. Keep all required protections intact.
- Escalate a blocker with one actionable, evidence-backed request for the needed decision or authority, not repeated status pings; continue independent work where possible.
