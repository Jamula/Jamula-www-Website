# Contributing

## Work tracking

- Start with a GitHub issue that defines scope, owner, acceptance criteria, dependencies, and required reviews.
- Use an isolated pull-request branch or worktree based on protected `main`.
- `main` is the only persistent production source. Pull-request previews are
  isolated and are never promoted to production.

## Website validation

From the repository root, build the Astro site and test the generated output:

```sh
cd www
npm ci
npm run build
cd ..
node www/scripts/test_built_site.mjs
node --test www/tests/*.test.mjs
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

Third-party and reserved-content paths in `LICENSE_SCOPE.md` require maintainer review. Contributions do not grant rights to Jamula or third-party trademarks.

## Security and privacy

- Never commit credentials, tokens, private keys, connection strings, personal data, or machine-local secrets.
- Use placeholders and documented configuration schemas.
- Follow [`SECURITY.md`](SECURITY.md) for vulnerability reporting. Do not put
  sensitive vulnerability details in a public issue.

## Pull requests

- Link the issue and summarize why the change is needed.
- Keep one author per artifact; use named reviewers for cross-domain concerns.
- For documentation/governance changes, run `python scripts/validate_governance.py`,
  `node --test .github/scripts/swa-preview.test.cjs`, and
  `python -m unittest discover -s scripts -p 'test_preview*.py'`.
- For live preview verification changes, also run
  `node --test .github/scripts/verify-preview.test.cjs`. The live verifier uses
  Node.js; the existing Python checks cover archive validation only.
- For changes under `www/`, run `npm ci`, `npm run check`, and `npm run build`
  from `www/`; CI also checks formatting on changed website files.
- Pass the required review and workflow checks for the files changed.
- Top-level delivery PRs require Cyrus's approval of the exact head SHA before merge automation is enabled.
