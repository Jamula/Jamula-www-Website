# Security Policy

## Supported versions and branches

Protected `main` is the only supported development and production delivery branch.
Production deployments to `jamula.net`, `www.jamula.net`, `jamula.com`, and
`www.jamula.com` are built from `main` via manual, versioned GitHub Releases
(`vMAJOR.MINOR.PATCH`, stamped into `/release.json` by
`.github/workflows/azure-static-web-apps.yml`).

| Surface / version | Security updates |
| --- | --- |
| `main` branch and latest deployed production release | Supported |
| Older GitHub release tags | Not patched in place (superseded by next release from `main`) |
| Pull-request preview branches and isolated preview environments | Ephemeral; not supported production releases |

When reporting an issue, include the affected commit SHA, workflow path, or
deployed hostname/URL (and `/release.json` version if live).

## Reporting a vulnerability

**Preferred channel — GitHub Private Vulnerability Reporting:**
Submit findings privately through GitHub Security Advisories for this repository:
<https://github.com/Jamula/Jamula-www-Website/security/advisories/new>

Do **not** open a public GitHub issue, pull request, or discussion containing
undisclosed vulnerability details, exploit payloads, credentials, or personal
data.

If GitHub Private Vulnerability Reporting is unavailable to you, send a minimal
non-sensitive notice requesting a coordination contact to `spam@jamula.net`
without attaching live secrets, credentials, or weaponized exploit code over
unencrypted email.

## Scope and good-faith testing boundaries

In-scope first-party surfaces include:

- Public website hosts (`jamula.net`, `www.jamula.net`, `jamula.com`,
  `www.jamula.com`) and isolated Azure Static Web Apps PR preview hosts;
- CI/CD workflows and release/preview scripts under `.github/workflows/` and
  `.github/scripts/`;
- Repository validation, monitoring, coverage, and local dashboard utilities under
  `scripts/`.

When researching or verifying an issue:

- Do not perform denial-of-service, automated volume/rate flooding, social
  engineering, phishing, or attacks against third-party providers (GitHub,
  Microsoft Azure, Google, or domain registrars/DNS operators);
- Do not access, modify, or exfiltrate data belonging to other users or tenants;
- Stop testing and report promptly once a reproducible proof of concept is
  established.

## Triage and disclosure expectations

Maintainers review private advisory reports, coordinate remediation on `main`
and subsequent production release deployment, and credit good-faith reporters who
request attribution after a fix is live. To preserve truthful public commitments,
this operational policy does not establish a paid bug-bounty program or a
contractual response-time SLA.
