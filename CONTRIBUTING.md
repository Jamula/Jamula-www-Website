# Contributing

## Work tracking

- Start with a GitHub issue that defines scope, owner, acceptance criteria, dependencies, and required reviews.
- Use an isolated pull-request branch or worktree based on protected `main`.
- `main` is the only persistent production source. Pull-request previews are
  isolated and are never promoted to production.

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
- For changes under `www/`, run `npm ci`, `npm run check`, and `npm run build`
  from `www/`; CI also checks formatting on changed website files.
- Pass the required review and workflow checks for the files changed.
- Top-level delivery PRs require Cyrus's approval of the exact head SHA before merge automation is enabled.
