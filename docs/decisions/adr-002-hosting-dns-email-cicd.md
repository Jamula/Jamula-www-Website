# ADR-002: Hosting, DNS, Email and CI/CD

**Status:** Proposed / pending Cyrus exact-SHA approval

## Context
Jamula.net must be canonical, Jamula.com must redirect, and only protected `main` may produce production.

## Options
No provider is selected. Evaluate registrar, authoritative DNS, TLS/edge,
platform-bundled or separate hosting, workforce mail, transactional mail, and
CI/CD/release mechanisms as independent trust and exit boundaries. Candidate
services remain unscored until their exact product, plan, region, add-ons, terms,
quotes, recovery and portability evidence are preregistered.

## Proposed decision
Select no registrar, DNS, TLS/edge, host, mail, or CI/CD provider in this ADR.
Evaluate those boundaries independently of the eventual platform, including
bundled services as separately measured dependencies. Production deploys only
from protected `main`. Each release retains checksum/SBOM/provenance and an
immutable artifact or, for a CMS/builder that does not consume a static artifact,
a checksum-bound content/configuration export, dependency/add-on inventory,
automation record and platform release ID. Unreviewed dashboard publication must
be disabled or reconciled into that main-bound release.

Require HTTPS on both domains, permanent safe path/query redirect to Jamula.net,
DNSSEC/DS, CAA, registrar lock/recovery, phishing-resistant MFA where supported,
SPF/DKIM/DMARC staged to enforcement, and MTA-STS/TLS-RPT evaluation. These gates
apply to every retained platform fixture. Incomplete or inaccessible evidence
blocks selection and cannot silently exclude or penalize a service or platform.

## Consequences
Auditable, platform-neutral delivery and replaceable boundaries; more
configuration and ownership than dashboard publishing. Failed
DNS/TLS/redirect/main-provenance pauses launch.

## Reversibility
Version DNS records/config; retain the last-known-good release package; test a
second compatible delivery target and rollback on an isolated hostname before
cutover.

## Portability / exit
No dashboard-only production state. Export zone, platform/host config, content,
dependency/add-on inventory, headers, redirects, metrics and release records.

## Data export
Redacted logs and delivery counters; no message bodies. Mailbox and transactional-message export/retention require vendor review.

## Cost
Every plan requires commercial/overage proof. Registrar, DNS, TLS/edge,
platform/hosting, CI/CD and domain/mail renewals remain quote items; budgets are
alerts, not caps.

## Confidence
Medium on the independent-boundary method; low on every exact vendor/price and
untested cross-domain or platform-release behavior.

## Dissent / tradeoffs
Bundling may reduce administration; separation may reduce coupled failure and
exit risk. Neither posture nor any provider has decision-grade comparative
evidence.

## Reconsideration trigger
Redirect/restore failure, terms/price change, DNS/mail recovery weakness,
non-main drift, release-record gaps, quota breach, or two workload metrics above
band for two months.
