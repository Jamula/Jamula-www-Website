# Jamula Website Documentation

## Status

This repository is in Squad bootstrap and platform-evaluation planning. No website platform has been selected and no production website code exists.

## Core documents

| Document | Status |
|---|---|
| `planning/evaluation-plan.md` | Approved execution plan |
| `artifacts-manifest.md` | Artifact ownership and approval index |
| `planning/work-ownership.md` | RACI, issue DAG, and path ownership |
| `decisions/approvals.md` | Version/SHA-bound approval records |
| `company/operating-principles.md` | Provisional pending exact wording approval |
| `company/public-values-draft.md` | Draft; not approved for publication |
| `legal/license-inventory.md` | Initial repository license/provenance map |
| `legal/professional-review-register.md` | Professional review gates |
| `content/public-claims-register.md` | Public claim evidence and expiry |
| `content/founder-source-register.md` | Founder-content provenance and approval |

## Operational exceptions

Files that must remain in standard locations are indexed here:

- Root: `LICENSE`, `LICENSE_SCOPE.md`, `TRADEMARKS.md`, `CONTRIBUTING.md`, `THIRD_PARTY_NOTICES.md`
- GitHub: `.github/`
- Squad: `.squad/`
- Squad state MCP: `.mcp.json`

## Branch and deployment model

`main` is the only persistent branch and the sole production CI/CD source. Pull requests validate changes and may use ephemeral previews. Short-lived issue/worktree branches are removed after incorporation.
