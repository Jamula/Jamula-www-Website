# Contributing

## Work tracking

- Start with a GitHub issue that defines scope, owner, acceptance criteria, dependencies, and required reviews.
- Use a short-lived issue branch from protected `main`.
- Production CI/CD is sourced only from `main`.

## Licensing

Unless explicitly marked otherwise, intentionally submitted Jamula-authored code and technical documentation are contributed under Apache License 2.0.

Do not submit:

- content you do not have permission to license;
- customer or employer-confidential material;
- trademarks, logos, copyrighted media, personal data, or generated content without provenance and approval;
- code copied from another project without preserving its license and attribution.

Third-party and reserved-content paths in `LICENSE_SCOPE.md` require maintainer review. Contributions do not grant rights to Jamula or third-party trademarks.

## Security and privacy

- Never commit credentials, tokens, private keys, connection strings, personal data, or machine-local secrets.
- Use placeholders and documented configuration schemas.
- Report vulnerabilities privately using the repository's security reporting process when available.

## Pull requests

- Link the issue and summarize why the change is needed.
- Keep one author per artifact; use named reviewers for cross-domain concerns.
- Pass required validation.
- Top-level delivery PRs require Cyrus's approval of the exact head SHA before merge automation is enabled.
