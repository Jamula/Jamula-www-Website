# Platform Portability Contract and Symmetric Evaluation

**Status:** Proposed research contract and disposable-fixture plan; no option is
scored, selected, implemented or production-proven
**Evidence cut-off:** 2026-08-25 Pacific
**Context:** `Refs #3; child #8`; N-10 symmetry revision

This contract applies equally to custom/static, WordPress and visual-builder
shapes. No account, resource, credential, DNS change, deployment or spike exists.

## Non-negotiable boundaries

1. Jamula.net is canonical; Jamula.com redirects over valid HTTPS to the same safe
   path/query. Failure pauses launch.
2. Protected `main` is the only production source. PR previews are isolated and
   never promoted by DNS.
3. One exact reviewed state produces checksum, lock/dependency manifest,
   SBOM/provenance and configuration version before protected deployment.
4. Registrar, DNS, TLS/edge, site host, CMS, workforce mail, transactional mail,
   analytics, CRM, portal, identity, storage, AI and payments remain replaceable
   trust boundaries.
5. No site/CMS receives portal tokens, payment credentials or unrestricted
   production-repository access.

GitHub rulesets, Azure custom domains/TLS and redirect configuration are
documented mechanisms [S09, S22-S23](../research/platform-source-register.md),
not Jamula configuration or redirect proof.

## Portability contract

| Concern | Required portable form | Prohibited coupling | Exit acceptance |
|---|---|---|---|
| Runtime/build/release | LTS/documented runtime, portable output or complete documented platform release/export; lock/inventory; neutral automation where supported; OCI only when justified | Host-only core rendering or undocumented dashboard state as the only release record | Clean environment and second compatible target reproduce logical output and release provenance |
| Content/editorial | UTF-8 Markdown/JSON/YAML or documented WXR/SQL/CSV; stable IDs; revisions and schedule export | Opaque CMS as sole copy | Counts/hashes and top 20 routes reconcile; editor records retained |
| Media | Originals, rights/alt/caption metadata, checksums, derivative recipe | CDN URL as sole copy | Restore originals and regenerate derivatives |
| Routing/SEO | Versioned URL/canonical/redirect/sitemap/robots/metadata data | Dashboard-only rules | Both-domain crawl preserves URL behavior |
| Forms/contact | Provider-neutral schema, consent version, retention and idempotency | Vendor inbox as sole record | Submit/export/delete and endpoint replacement |
| Identity/connectors/AI/payments | Provider-neutral internal IDs and adapters | Vendor IDs/SDK objects as business model | Alternate adapter test; disable boundary safely |
| Configuration/secrets | Typed config, secret references, least privilege | Undocumented dashboard state or embedded secrets | Recreate empty non-prod with fresh secrets |
| Observability | Redacted structured export and portable SLI/runbooks | Vendor dashboard as sole history | Recreate alerts and retain evidence |
| Backup/restore | Independent encrypted export, checksum and approved retention | Backup only inside failed account | Isolated timed restore and reconciliation |

Webflow's documented code export omits CMS/users/ecommerce/localization, forms,
search and password protection [S11]. WordPress.com WXR omits design, plugins and
actual media, while eligible plans advertise full backup [S13]. Missing export
evidence blocks scoring; it is not waived by a rebuild estimate.

## Common fixture and workload

Every retained candidate fixture uses the same `RWL-2026-08-25.3` L1 public
workload and one frozen common corpus:

- 20 public routes spanning all templates;
- exactly 250 structured content items, including drafts/revisions and 5 scheduled
  items;
- 100 media assets totaling 250 MB, with rights/accessibility metadata;
- 25 redirects; sitemap, robots, canonical and structured data;
- two editor identities with different least-privilege roles;
- one synthetic disabled-by-default contact adapter and no personal data;
- identical accessibility, URL, export, restore, patch and support-hour evidence.

One common manifest enumerates every route, content ID/state/revision/schedule,
media ID/hash/rights/accessibility record, redirect and expected metadata outcome.
Freeze the manifest and its SHA-256 before any fixture executes. Each fixture's execution
record must match the approved manifest hash and report route, content, media,
redirect, draft/revision and scheduled-item counts. Any manifest hash or count
mismatch blocks execution; it cannot be recorded as a platform-specific deviation.

Platform-specific changes may adapt configuration, theme/templates or deployment,
but may not change the common corpus, reduce content, routes, editorial tasks,
controls or pass thresholds.

## Candidate register and gate before any combination runs or scores

Freeze exact vendor, product, plan, region, billing basis, framework/CMS/core,
theme, plugins/add-ons, runtime/build image and support contract. The combination
must first clear commercial use, accessibility testability, export, protected-main
publication, canonical routing, privacy/security terms and approved spend.

The immutable preregistration packet must contain a closed candidate register.
Every retained row must become one exact fixture or an approved formal exclusion
that identifies a proven preregistered hard-gate failure. Reserved IDs are:

| Retained category | Reserved fixture ID |
|---|---|
| Each custom/static renderer + host combination | `CUSTOM-STATIC-<slug>-01` |
| Managed WordPress | `MWP-PORT-01` |
| WordPress.com | `WPCOM-01` |
| Self-hosted WordPress | `SWP-01` |
| Wix Studio | `WIX-STUDIO-01` |
| Webflow | `WEBFLOW-01` |
| Squarespace | `SQUARESPACE-01` |
| Each other retained credible option | `OTHER-<slug>-01` |

The IDs are placeholders, not exact fixtures or evidence that a run occurred.
Each must be expanded with the exact fields above. An `OTHER` row is per named
product and cannot aggregate Ghost, an Azure-managed CMS pattern, Power Pages, or
another option. Earlier `STATIC-AZ-01`, `STATIC-NL-01`, `STATIC-CF-01`, and
`STATIC-VC-01` identifiers are reserved research placeholders only; they create no
static-host baseline, priority, or complete candidate set.

Inaccessible, incomplete, dynamic, expired, or unretrieved evidence does not prove
failure. It leaves the candidate retained and blocks the selection cycle without
score, penalty, or silent exclusion. Formal exclusion requires exact candidate
identity, direct current hard-gate evidence, counterevidence, and the approvals
specified by the [decision framework](decision-framework.md).

## Custom/static framework fixture requirements

| Field | Preregistered requirement |
|---|---|
| Editorial workflow | Measure editor onboarding; create, revise, preview, schedule and roll back the same 250-item common corpus through the documented Git/editor path |
| Git control | Source, content, routes, config, dependencies and production state trace to protected `main` |
| Move | Serve the retained output on a second gate-cleared target; record adapter/config and any renderer coupling |
| Change limit | Record changed/generated lines and labor; no page/component/content/schema/URL redesign |
| Export/restore | Rebuild from an empty runner/account using retained source, media, config and fresh secrets |
| Patch burden | Apply one representative dependency/security update; record work, regression and rollback |
| Support measure | Four-week simulated release/control cycle; record active and elapsed hours by task |

## WordPress fixture requirements

`MWP-PORT-01`, `WPCOM-01`, and `SWP-01` each use the common corpus, journeys,
gates, tests, evidence window, labor/TCO method, portability measures, and exit
measures. Each has a separate exact record; evidence cannot be borrowed between
WordPress variants.

Before authorization, append the exact platform/host, plan, region, WordPress core
version, theme/version, plugin/add-on list, PHP/database versions where applicable,
publication path, and operations/support/backup contract to the immutable fixture
record. Until then the candidate remains retained, unscored, and
selection-blocking unless formally excluded under the approved rule.

| Field | Preregistered requirement |
|---|---|
| Same artifact semantics | Implement the identical 20 routes, same 250-item common corpus/manifest, 100/250-MB media set, 25 redirects, metadata and disabled form outcome |
| Editor onboarding | Time two editors from invitation through least-privilege role, preview, revision comparison, scheduled publication, rollback and offboarding |
| Preview/revision/scheduling | Demonstrate draft isolation, exact preview, revision attribution/restore and five scheduled items without bypassing approval |
| Git-controlled state | Theme/custom code, dependency/plugin manifest, declarative config and deployment automation live in protected `main`; record any unavoidable database/dashboard state and reconciliation |
| Export | Capture WXR/SQL as permitted, full media originals, users/roles where lawful, redirects, SEO metadata, plugin/theme/config inventory and checksums |
| Clean-host restore | Restore into a new empty account/install with fresh secrets; no manual copy/paste or old-host dependency; record unsupported state |
| URL/output parity | Crawl route/status/canonical/redirect/sitemap/metadata and compare content/media counts/hashes and accessibility/performance budgets |
| Patch burden | Apply one core, theme and representative plugin security/update cycle; measure preparation, regression, rollback, downtime and vendor support |
| Support measure | Same four-week simulated release/control cycle and common task ledger; include backup, malware/security, plugin compatibility and editor support |
| Exit | Export again, restore to a second clean compatible target, validate, then securely delete disposable accounts/data |

## Visual-builder and other retained fixture requirements

`WIX-STUDIO-01`, `WEBFLOW-01`, `SQUARESPACE-01`, and every
`OTHER-<slug>-01` fixture execute the same baseline. Their exact records must also
freeze workspace/site/account plans, region, template, apps/extensions/add-ons,
roles, API/automation and publication paths, export entitlements, support, backup,
renewal, overage and cancellation terms.

Platform-specific configuration is allowed only to exercise equivalent outcomes.
It may not reduce the corpus, journeys, gates, tests, evidence window, labor/TCO
capture, portability/exit measures, or thresholds. Opaque or unsupported state is
recorded as a test result; missing documentation remains a selection block rather
than a presumed failure or penalty.

## Symmetric acceptance and evidence

Every fixture must:

1. pass 100% route/status/redirect/canonical/metadata checks;
2. prove the approved common-manifest SHA-256 and every count match before
   execution, then reconcile content/media hashes, drafts/revisions/schedules and
   editor role outcomes;
3. retain or reconcile production state to protected `main` with immutable
   provenance;
4. complete clean-environment rebuild/restore within 4 hours and rollback within
   30 minutes, or record failure;
5. introduce no new serious/critical automated accessibility finding and complete
   the same required manual journey sample;
6. meet the same performance budgets under the same harness;
7. execute backup/restore, security update and editor workflow without unapproved
   manual repair;
8. report setup, active support, waiting/vendor, patch, restore and exit hours
   separately, plus external costs and teardown.

These thresholds create comparable mechanism evidence; they do not prove
production reliability, accessibility conformance, security, support quality or
TCO. No fixture receives a score until its hard gates pass and Cyrus approves the
method. No platform selection is permitted until every retained candidate has
completed this same cycle or has an approved evidence-based hard-gate exclusion.

## Platform-independent production provenance and domain exit

PRs use pinned actions, least privilege and no production secrets. Production
deploys only from protected `main`. The release retains an artifact or, where a
platform does not consume a static artifact, a checksum-bound content/configuration
export, dependency/add-on inventory, automation record and platform release ID.
It runs domain, canonical, security-header, route and form smoke tests and rolls
back on failure. Any CMS/dashboard publish must be disabled or reconciled into
that reviewed main-bound state; inability to do so fails the publication gate.

Before cutover, export DNS/mail records, verify recovery/admins, lower TTL, prove
both-domain TLS, test root/deep/encoded/safe-query/404/canonical behavior, stage
Jamula.net then Jamula.com, and pause/roll back on TLS, loop, path loss, canonical
or DNSSEC failure.

## Evidence classes, teardown and follow-up

- **Documented research:** this contract and cited vendor behavior.
- **Selection-blocking incomplete evidence:** exact platform/renderer/CMS/host
  combinations, plans/regions/add-ons, named WordPress contracts, complete builder
  exports, and domain/mail quotes. Missing access does not exclude or penalize.
- **Disposable mechanism evidence:** only an approved fixture record containing
  source/artifact SHA, versions, manifests, sanitized results, hours, cost,
  deviations and complete teardown.
- **Future implementation tests:** production ruleset/provenance, DNS/email,
  accessibility, incident, backup/restore, cost caps and kill switches.

Delete disposable resources/previews/installations, revoke credentials, remove
test DNS, delete synthetic content and confirm no recurring billing. If a later approved revision changes cadence, follow-up reports the exact
fixture/test delta and measured cost; it does not guess in advance.

Reconsider the portability contract when an exit rehearsal fails, core coupling
is required, control/support hours breach an approved ceiling twice, terms or
security change, or workloads leave their approved band.
