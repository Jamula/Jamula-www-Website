# Backup, Restore, and Cyber-Recovery Requirements

**Status:** Proposed objectives and future tests; no backup or restore is implemented or proven

**Context:** Refs #3; child #7

**Revision owner:** Seven of Nine, Identity, Data & AI Engineering (cycle 2 independent remediation; original author locked out)

**Required review:** Platform, Identity/Data/AI, Privacy/Legal, Fact Checker; Cyrus approves business objectives and residual risk

**Reviewed sources through:** 2026-08-24

## Evidence boundary

This artifact is `documented research` and `future implementation test` material. Vendor durability claims, enabled backup settings, successful jobs and object counts are not restore evidence. Only a timed, integrity-checked recovery into an isolated environment using the release procedure can prove the exercised recovery point and time. No production evidence exists during evaluation.

## Definitions and principles

- **RPO** is the maximum tolerable data loss measured backward from the incident.
- **RTO** is the maximum time from recovery declaration to a validated minimum service.
- Objectives below are proposed engineering targets, not contractual promises.
- Back up only data Jamula is authorized and required to retain. Minimize replicated sensitive data.
- Use multiple failure domains and at least one encrypted **immutable** copy protected by credentials and control plane separate from production.
- Recovery must not depend on the compromised identity, runtime, repository, key or DNS path it is intended to recover.
- Backup coverage includes data, schemas, configuration/IaC, access policy, required keys/certificates through an approved recovery mechanism, audit evidence and release/provenance records. Secrets are not copied into ordinary archives.
- The customer storage provider and hosted payment processor remain their authoritative systems unless an approved ADR changes the boundary; Jamula backs up only its necessary metadata, mappings, event/reconciliation evidence and permitted derivatives.

## Proposed service objectives

Final values require business-impact, cost, provider and legal review. Meeting a narrower vendor snapshot interval does not prove the end-to-end RPO.

| Data/service | Phase | Proposed RPO | Proposed RTO | Minimum validated recovery |
|---|---:|---:|---:|---|
| Public source/content/configuration and deployable artifact | 1 | 24 h for unpublished content; zero committed source loss through protected remote history | 4 h | Rebuild/verify immutable artifact from protected `main`, restore DNS/config/content and health checks |
| Contact submissions and consent receipts | 1 | 1 h | 8 h | Restore authorized records without duplicate delivery; reconcile queued/provider receipts |
| Security/audit logs and incident evidence | 1+ | 15 min | 4 h for search of critical sources | Prove sequence, UTC/correlation, integrity and restricted access; disclose known gaps |
| CRM/lead history and scheduling integration metadata | 2 | 4 h | 8 h | Tenant/owner mapping, status/history and processor reconciliation; no duplicate notifications |
| Identity configuration, memberships, tenant/policy metadata | 3 | 1 h | 4 h | Restore to safe deny-by-default state; validate membership/offboarding and revoke sessions/tokens |
| Connector account mappings, encrypted token records and sync cursors | 3 | 1 h | 4 h | Restore mappings/cursors only if keys and provider authorization remain valid; otherwise force safe re-consent |
| Customer-file metadata and authorized Jamula-managed copies | 3 | 4 h | 8 h | Tenant-selective metadata restore and provider reconciliation; never fabricate provider file truth |
| Derived previews, embeddings, search/vector indexes and AI caches | 3 | 24 h or rebuild from authorized source | 24 h | Prefer deletion/rebuild; re-check current ACL before becoming queryable |
| Payment mapping, webhook journal and reconciliation evidence | 4 | 15 min | 4 h | Reconcile from processor/accounting authoritative records; no entitlement from unverified local state |
| Public-AI configuration/safe corpus/index | 5 | 24 h | 8 h | Restore only approved public corpus/config; validate customer/private corpus exclusion |

Availability may be restored before all noncritical derivatives are rebuilt, but no feature may serve stale authorization, cross-tenant data or unreconciled financial state. A read-only/degraded mode is acceptable only when its authorization and communication behavior has been tested.

## Architecture and control requirements

| ID | Requirement | Future verification |
|---|---|---|
| BR-01 Inventory | Machine-readable inventory maps every store/region/tenant/classification to owner, authoritative source, backup mechanism, RPO/RTO, retention, encryption/key, immutability and restore dependency | CI/config comparison finds no unowned production store; quarterly owner attestation |
| BR-02 Separation | Backup account/project/subscription and privileged identities are separate from production; no runtime delete permission; phishing-resistant MFA and just-in-time admin | Compromised-production-role simulation cannot read keys or alter/delete immutable copies |
| BR-03 Immutability | Time-based retention lock/WORM or equivalent prevents alteration/deletion, including by routine administrators, for the approved period | Attempt overwrite/delete/retention shortening with production and backup-admin test roles; all prohibited operations fail and alert |
| BR-04 Encryption/key recovery | Encrypted in transit/at rest; keys inventoried, separated and recoverable under dual control; rotation does not orphan required restore points | Restore samples across key versions; simulate one unavailable operator/key path; record authorized recovery |
| BR-05 Completeness/consistency | Application-consistent snapshots or replayable journals preserve schema/version relationships; transactions use idempotent reconciliation | Restore at boundary during writes and upgrades; validate counts, referential/tenant constraints and replay once |
| BR-06 Integrity | Cryptographic digest/manifest and backup-job evidence are stored separately; malware/corruption scanning does not mutate originals | Corrupt a disposable backup block/object; validation detects it and selects a clean point |
| BR-07 Tenant restore | Restore one tenant into isolated staging, validate authorization and selectively promote without overwriting other tenants | Two-tenant fixture; recover tenant A to a point while B remains byte/logically unchanged; all cross-tenant tests pass |
| BR-08 Clean-room recovery | Documented bootstrap uses trusted devices/accounts, known-good source/artifact/provenance, isolated network and new credentials | Phase-specific clean-room drill in the cadence table assumes production identity/runtime/repo token compromised |
| BR-09 Monitoring | Alert on missed/late backup, replication lag, lock/policy/key change, capacity, integrity failure and untested restore | Synthetic missed job and policy-change events page the accountable owner within incident SLO |
| BR-10 Retention/deletion | Retention schedule is classification- and contract-aware; deletion tombstones prevent reintroduction; legal hold is separately authorized | Delete subject/tenant fixture, restore older point, prove suppression/re-deletion before service; legal-hold release resumes deletion |
| BR-11 Provider exit | Export format, API/egress limits, duration, cost, integrity, cancellation and verified deletion are known | Annual bounded export/restore rehearsal or blocked packet with owner, cost and phase disposition |
| BR-12 Runbook survivability | Recovery contacts, dependency order, credentials/key process, DNS, communication and validation steps are available offline and access-controlled | Recover with primary collaboration/runtime unavailable; alternate responder locates current runbook |

## Authoritative classification-specific backup schedule

This is the single controlling **backup/recovery-point** schedule. It does not set retention for authoritative business records. A database export or archive retained to satisfy accounting, security, contract or legal duties is a primary record governed by its approved record schedule, not a backup disguised to avoid deletion.

Classification is by the most sensitive content in the recovery point. A mixed archive containing one personal/customer item is Class C2 and cannot inherit the longer C0/C1 schedule. Backup inventory and automated content/metadata checks enforce that boundary.

| Class | Included / excluded | Recovery-point creation | Maximum routine backup retention | Deletion and restore rule | Decision owner |
|---|---|---|---|---|---|
| **C0 Public/reproducible** | Approved public content, open-source code, immutable release artifact, SBOM/provenance. Excludes unpublished personal biography, credentials, customer data and private evidence | Protected source history plus daily release/config point when changed | Daily 35 days; weekly 13 weeks; monthly 12 months. Protected repository/release history may persist under the repository record policy | May restore directly only after provenance/malware validation and confirmation that the point remains C0 | Platform owner; Content/IP review for public status |
| **C1 Non-personal configuration** | IaC templates, schemas, public DNS intent, redacted runbooks, policy/config with no identifiers/secrets. Secret values and tenant/customer identifiers excluded | On change plus daily point when active | Daily 35 days; weekly 13 weeks; monthly 12 months | Restore into quarantine; inject current secrets from approved recovery, and revalidate current policy before promotion | Platform + Security owners |
| **C2 Personal/customer/tenant** | Contact/CRM/scheduling; identity/membership; customer-file content or metadata; connector mappings/tokens/cursors; AI prompts/responses/chunks/embeddings/index/cache; support; payment/customer references; any mixed point containing these | Journal/incremental as needed for RPO plus daily point | **Maximum 35 days; no weekly/monthly copy may survive day 35.** A shorter contract, consent or processor schedule wins | Logical access denial and deletion tombstone are immediate; every restore replays current tombstones/withdrawals/revocations before any query/traffic. Tokens restore only if still valid/authorized, otherwise re-consent | Data owner + Privacy; counsel approves any exception |
| **C3 Reproducible sensitive derivatives** | Customer previews, extracts, embeddings, search/vector indexes and AI caches that can be rebuilt from currently authorized source | **No routine backup by default**; rebuild. If a measured RTO requires a recovery point, classify/store as C2 | C2 maximum 35 days | Never restore directly to serving state; rebuild/revalidate current source ACL/version and delete denied derivatives | Identity/Data/AI owner |
| **C4 Restricted authoritative records** | Approved financial/tax records, consent/suppression, security/audit/incident evidence retained as the authoritative record | Authoritative append-only/archive process under its record schedule; any disaster-recovery copy is a backup | Backup copy **maximum 35 days if it contains personal data**. The authoritative record follows counsel/CPA-approved retention and purpose restriction | Restore copy in quarantine, replay deletion/restriction rules, and expose only the authoritative record purpose. Do not use long retention as product recovery history | Record owner + Sarek + qualified counsel/CPA |
| **C5 Approved legal hold** | Precisely scoped preserved records named by matter/hold; not a general snapshot | Separate preservation export after authorized hold | Until documented release/review date; not eligible as routine product recovery point | Segregated, access-logged and unavailable to ordinary restore/product use. On release, resume deletion and remove hold copy under counsel direction | Sarek/authorized legal owner + qualified counsel |

### Flow, disclosure and expiry

1. Capture journals/points only as needed for the approved RPO; replicate with a restricted service identity to a separate failure/control plane and lock at least one required point.
2. Tag every object/manifest with class, included stores/tenants, creation/expiry UTC, owner, key and hold status. Lifecycle policy must physically expire C2/C3 and personal-data C4 backup copies by day 35.
3. Keep the deletion/suppression/consent-withdrawal/connector-revocation tombstone ledger separately protected and at least as current as the source RPO. It contains minimal identifiers, not deleted content.
4. Continuously validate job freshness and manifests. Use synthetic or C0/C1 samples for routine decrypt tests; access to C2/C4 samples requires an approved, logged purpose.
5. Quarantine suspect points. Malware/corruption scanning cannot silently delete the only eligible clean point or move C2 data into longer retention.
6. Public/customer disclosure must state that access is denied in active systems when deletion is accepted, ordinary encrypted personal/customer backup copies expire within **35 days**, a restore cannot return deleted data to service because tombstones replay, and narrowly retained authoritative/legal-hold records may remain when an approved legal basis applies.

Sarek and qualified counsel must decide the wording and applicability of financial/security/suppression retention, legal holds, litigation discovery, processor differences and jurisdiction/contract rights before launch. Any exception identifies data, purpose/basis, access, notice, review/expiry and deletion resumption; it never silently extends an entire customer backup.

## Restore procedure

1. **Declare:** IC selects incident, recovery scope, target RPO/RTO, authoritative systems and approvers. Record UTC.
2. **Protect:** isolate affected production identities/data paths; preserve evidence; prevent replication of new corruption where safe.
3. **Select:** choose the newest pre-incident point that passes manifest, key, malware and provenance validation. Record expected data-loss window.
4. **Bootstrap:** use isolated recovery account/network and known-good infrastructure/config/artifact from protected `main`; rotate compromised credentials.
5. **Restore to quarantine:** restore schema then data in dependency order into an isolated, non-serving account/network. Do not enable customer queries, background jobs, outbound provider calls, indexing or AI.
6. **Replay current authority:** apply the separately protected deletion/suppression/consent-withdrawal/account-closure/connector-revocation tombstone ledger through current UTC. Apply legal holds only to the segregated authorized record scope. If the ledger or ordering cannot be proven, fail closed and do not promote.
7. **Validate:** verify digests, counts, referential constraints, tenant namespaces, audit continuity, authorization/IDOR suite, token validity/revocation, expiry/classification, reconciliation and monitoring. C2/C3 data remains unavailable until current source ACL/version is revalidated.
8. **Reconcile:** compare CRM/scheduling, storage providers, identity provider and payment/accounting authoritative records; process events idempotently. Delete denied/expired derivatives and re-consent rather than resurrect uncertain tokens.
9. **Promote:** obtain IC/service/data/Privacy approval; attest that no expired or tombstoned record is queryable; stage traffic; monitor error/security/cost burn; roll back if validation fails.
10. **Communicate:** report achieved recovery point/time, deletion/hold treatment, excluded data and uncertainty as measured facts.
11. **Close/improve:** preserve sanitized drill evidence, defects and actions; securely remove recovery environment and temporary access.

## Drill programme and pass criteria

| Drill | Cadence | Pass criteria |
|---|---:|---|
| Job/manifest/expiry policy | Automated daily while store is live; alert by phase model | Required point is fresh, manifest/lock/key valid, C2/C3/personal-C4 expiry ≤35 days, no unclassified store |
| Sample decrypt/integrity | Monthly using synthetic or C0/C1 by default | Sample decrypts, manifest matches, forbidden plaintext/secret/personal-content scan clear |
| Public artifact/config rebuild | Monthly in P1+ and after build/trust change | C0/C1 rebuilds from protected source; provenance/config/current secrets and canonical health pass |
| Store-level isolated restore | Quarterly, rotating active authoritative stores | Quarantine restore completes; schema/count/integrity, tombstone replay and owner checks pass within target |
| Tenant-selective restore | Before Phase 3 preview and quarterly while P3+ live | RPO/RTO met; other tenant unchanged; IDOR/authz/derivative/deletion tests pass |
| Full clean-room recovery | P1/P2 semiannual; P3+ quarterly; after material architecture/trust change | Minimum live-phase service restored from isolated controls within RTO; current tombstones replay; achieved RPO and funded communication path measured |
| Provider reconciliation | P2 CRM/scheduling semiannual; each exposed P3 connector quarterly; P4 payment quarterly | Local state rebuilt from authoritative provider without duplicate/misattributed effects |
| Destructive credential/immutability | P1/P2 annual; P3+ semiannual | Production compromise cannot delete/alter locked copy; alternate access works and alerts |
| Vendor exit/export | Annual or before renewal/exit | Export complete in approved format/cost/time with hash and test import; otherwise formal blocked packet |

A drill fails if it exceeds RPO/RTO, restores outside quarantine, skips current tombstone/authorization/tenant validation, depends on unapproved manual data repair, exposes sensitive data, retains C2/C3 beyond 35 days, cannot account for legal holds, or lacks sanitized reproducibility evidence. Failure creates an owned remediation issue and blocks the affected phase when safety or recoverability is High/Critical.

## Evidence record

Retain incident/drill ID, scope and exclusions, source/target regions and versions, target and achieved RPO/RTO, selected point UTC, artifact/config/SBOM/provenance and manifest digests, commands/config schema, synthetic fixture counts, access/approvals, validation results, defects, cost, screenshots/log extracts with redaction, evidence hash/location, teardown/deletion and reviewer. Classify it as spike, future test or production evidence.

## Risk acceptance and phase gates

- Phase 1 requires BR-01-06/08/09/12 and a full clean-room drill for public/contact/audit data.
- Phase 2 adds CRM/scheduling reconciliation; Phase 3 adds BR-07/10/11 and each connector; Phase 4 adds payment journal/reconciliation; Phase 5 adds verified public/private corpus separation.
- An enabled-but-unrestored backup, provider claim, missing immutable copy, single compromised control plane, unknown key path, or missed RPO is not acceptable evidence.
- No Critical/High recoverability risk is accepted. Medium acceptance follows `control-test-matrix.md`, expires within 90 days, identifies loss window/customer effect/compensation/monitoring and is approved by Cyrus plus service/data/Privacy owners.
- Recovery exercises, paging and human review use the funded phase model and recurring capacity in `incident-detection-response.md`; a cadence is not credible if the launch budget does not fund its owner/alternate and estimated labor.

## Official sources

Verified 2026-08-24:

- NIST, **SP 800-34 Rev. 1, Contingency Planning Guide for Federal Information Systems**, May 2010, updated November 2010: <https://csrc.nist.gov/pubs/sp/800/34/r1/upd1/final>. It remains useful planning guidance; applicability and freshness for Jamula require review.
- NIST, **SP 800-61 Rev. 3**, published April 2025, for incident recovery integration: <https://csrc.nist.gov/pubs/sp/800/61/r3/final>.
- CISA, **#StopRansomware Guide**, current official ransomware resilience guidance: <https://www.cisa.gov/stopransomware/ransomware-guide>.

These sources support contingency principles. They do not certify the proposed RPO/RTO, provider durability, legal retention, or Jamula recovery capability.
