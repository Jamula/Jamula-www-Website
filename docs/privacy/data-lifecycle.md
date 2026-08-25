# Customer-platform data lifecycle

**Decision context:** Refs #3; child #6
**Owner:** Seven of Nine
**Status:** design requirement, not executed evidence or legal advice
**Updated:** 2026-08-25 Cycle 3; legal applicability remains professionally unresolved

This lifecycle implements the inventory in `data-inventory.md`. It is Jamula's applicable internal global control baseline, not a legal-applicability conclusion. GDPR and UK GDPR/PECR applicability and related representative/DPO, ROPA/DPIA, breach and transfer duties remain `needs counsel` under `docs/legal/jurisdiction-matrix.md`. Jurisdiction-specific bases, notices, clocks, exceptions, appeal rights, transfer mechanisms and professional conclusions remain launch gates.

## State model

`proposed → collected → validated → active → corrected/restricted → export-pending → closure-pending → logically deleted → processor-confirmed → backup-expired`

Legal hold changes eligible records to `held`; it never silently cancels a request. Every transition records tenant, actor, purpose, source, data class, policy/version, UTC time, reason and outcome in tamper-evident audit.

## Collection and purpose

1. Register the data set, owner, purpose, candidate basis, notice/consent version, fields, recipients, region, retention trigger and deletion path before enabling collection.
2. Collect the minimum fields. Reject secrets, connector tokens, card data and unnecessary sensitive free text. Do not infer sensitive attributes.
3. Present contextual notice. Marketing, nonessential analytics, recording/transcription and materially new AI uses require distinct controls; bundled portal terms are not universal consent.
4. Create an append-only receipt for consent: subject/channel, text and privacy-notice versions, locale, affirmative action, purpose, source, timestamp and withdrawal method. Consent is not presumed from silence.
5. A new purpose, recipient, model training use, region or materially broader scope pauses processing until compatibility/legal review, notice update and new consent where required.

## Identity and tenant lifecycle

### Invitation and linking

- Customer admin initiates an invitation for exactly one internal tenant and role. Equalized responses prevent account enumeration.
- Acceptance authenticates the invitee, verifies intended email/domain rules, requires explicit tenant/role acknowledgement and binds provider `(issuer, subject)` to one internal user. Email is not a stable primary key.
- Existing-subject, existing-email, social/work-account collision and domain-claim cases go to a verified recovery/linking flow; never auto-merge identities.
- Domain ownership does not automatically grant membership or access to prior accounts. Domain claim/change requires step-up, proof, dual approval and notification.

### Active access

- Server middleware resolves membership and emits immutable `tenant_id`; route parameters, tokens from other audiences and client-supplied tenant fields cannot override it.
- Authorization is deny-by-default at endpoint, service and datastore. Tenant row/prefix/partition/index/cache enforcement is mandatory.
- `customer_admin` can administer only its tenant. Jamula privileged roles are separate from customer roles.
- Sensitive actions require a recent phishing-resistant step-up: export, membership/domain/recovery, connector consent/revocation, payment portal/session creation, support access and security-setting changes.

### Switching, recovery and support

- Tenant switching creates a new server-resolved context and clears tenant caches; simultaneous mixed-tenant operations are prohibited.
- Recovery uses verified, rate-limited, out-of-band procedures; privileged recovery requires two-person approval and post-event notification. Recovery cannot bypass tenant ownership.
- Support access is off by default, case-linked, customer-authorized when practical, time-limited, least privilege, prominently indicated and fully audited. No hidden impersonation. Break-glass is hardware-authenticated, dual-approved, alerted and retrospectively reviewed.

### Offboarding

- Membership removal and account compromise revoke sessions immediately. Tenant closure freezes new writes, exports authorized data, disconnects/revokes connectors, disables AI/payment entry, and starts deletion.
- Identity-provider disablement alone is insufficient: remove application membership, service sessions, API keys, support grants and queued work.
- Reassignment is explicit; orphaned objects are quarantined from access until a customer admin resolves ownership.

## Connector lifecycle

1. **Authorize:** show provider, account, precise purpose, scopes, data retained, AI use, disconnect/deletion behavior and notice version. Use Authorization Code with PKCE, unpredictable state/nonce, exact redirect URIs and login-CSRF/account-link defenses per RFC 9700 [S35].
2. **Bind:** after callback, obtain provider stable account ID and bind it to authenticated `(tenant_id, user_id)` only after mismatch checks. Never trust display email alone.
3. **Custody:** refresh tokens remain server-only and envelope-encrypted under a connector/provider-specific key; the vault reference is tenant-bound. Microsoft OneDrive and Google Drive web pickers may require a short-lived access token in their browser picker context. Such access tokens are scope/audience/lifetime constrained, held only in memory, origin/CSP/message controlled and removed on completion/navigation; no browser persistence. Box browser-token behavior remains blocked pending an approved picker design. Separate dev/test/prod and providers. Redact every token from logs, traces, errors, tickets, AI and ordinary backups.
4. **Use:** request narrow/read-only or per-file scopes. Reject write/admin scopes. Each API call re-resolves the connection and tenant. Apply file type/size limits, safe streaming, parser isolation and malware policy.
5. **Reconcile:** provider change feed/webhook is an acceleration hint, not authorization proof. Validate signatures/replay where supported, then fetch current state. Run incremental reconciliation at least every 15 minutes while active and a complete ACL/grant reconciliation at least every 24 hours; provider limits or later spike evidence may tighten these proposed maxima.
6. **Fail closed:** token expiry/revocation, consent loss, unknown account/tenant mapping, stale ACL beyond 24 hours, webhook gap, policy-service outage or provider ambiguity blocks retrieval. The portal may show stale metadata only when clearly marked and non-sensitive; AI receives nothing.
7. **Invalidate:** permission loss, deletion or disconnect writes a deny tombstone immediately; evict cache/preview; remove chunks/embeddings/index entries within a 24-hour target; stop queues/webhooks; revoke token. Backups expire by schedule and reapply tombstones after restore.
8. **Evidence:** retain minimal consent/revocation/deletion audit, not usable tokens. Customer receives provider status and last successful reconciliation.

## Read-only AI lifecycle

1. Authenticate, resolve tenant/membership and enforce per-tenant/user rate and spend policy.
2. Classify and minimize the question; reject secrets, prohibited content and oversized requests. Do not log content by default.
3. Resolve only tenant-owned active connector grants. Query tenant-specific index/cache; no global semantic cache.
4. For every candidate chunk, re-fetch or validate current source ACL/version and the user's effective permission. Remove unauthorized candidates before prompt assembly.
5. Sanitize untrusted content, preserve source boundaries and provenance, and treat instructions inside documents as data. No arbitrary URL retrieval.
6. Submit only required excerpts to the approved model/deployment. Use stateless inference; provider use/training/monitoring/retention and geography must match contract and disclosure.
7. Return an answer with tenant-authorized citations, uncertainty and human escalation. Never call file, sharing, messaging, CRM, payment, connector-admin or network-action tools.
8. Record content-free usage/cost/safety metadata. Conversation storage is visible and time-limited; deletion removes prompts, responses and provider state.
9. At 80% of tenant monthly budget, alert and reduce optional context/output. At 100%, deny AI requests with an explanatory message while leaving portal/files intact. Platform owner reviews recovery. The kill switch is tested quarterly.

## Payment lifecycle

- The portal creates a tenant-bound, single-purpose server request after authorization and step-up, then redirects to a processor-hosted invoice/checkout/customer-portal URL. Jamula pages never render PAN/CVC/bank-credential fields and never proxy them.
- Never place personal/sensitive data in return URLs, processor metadata or idempotency keys. Use opaque internal invoice/tenant references.
- Return URLs are status hints only. A signed, replay-checked webhook plus processor API retrieval drives state.
- Normalize the minimum event, map it to one tenant/invoice, enforce idempotency and append an immutable financial event. Unmatched/conflicting events quarantine for reconciliation; they never guess a tenant.
- Reconcile processor ↔ accounting ↔ bank at least daily on business days. Portal displays derived status and timestamps, never claims to be the ledger.
- Refunds, credits, disputes, cancellations and subscription changes occur in the approved system of record with role, step-up, dual approval thresholds and customer notice defined before launch.

## Retention and deletion

The inventory contains proposed active-system and authoritative-record schedules. A shorter customer contract or professionally confirmed stricter duty wins unless a documented legal obligation/hold requires more. Backup/recovery-point retention is controlled only by the [authoritative classification-specific schedule](../security/backup-recovery.md#authoritative-classification-specific-backup-schedule), not by this document. Every retention job is tenant-aware, retryable, observable and produces evidence without retaining deleted content.

### Deletion order

1. verify requester/authority without collecting disproportionate identity data;
2. freeze new processing and write an access-deny tombstone;
3. export first when authorized/requested;
4. remove active membership/sessions and revoke connector/payment-portal sessions;
5. delete application rows, objects, previews, prompts, responses, caches, queues, search/vector entries and derived telemetry;
6. call processor deletions and record result/retry/exception;
7. preserve only approved suppression, financial/security audit or legal-hold records, segregated and purpose-restricted;
8. protect the minimal deletion/suppression/withdrawal/revocation tombstone ledger at least as current as the source RPO; expire C2/C3/personal-C4 backup copies within the controlling 35-day maximum;
9. restore only into isolated, non-serving quarantine; replay the current tombstone ledger and validate tenant/ACL/classification/expiry before queries, jobs, provider calls or AI resume; if freshness/order cannot be proven, fail closed;
10. segregate any C5 legal hold from product recovery, review it under counsel direction and resume deletion when released;
11. issue a completion record listing active/processor scope, completion date, applicable backup class/expiry and narrowly retained authoritative/legal-hold exceptions.

Target: active-system logical denial immediately; Jamula active stores and AI derivatives within 24 hours; ordinary processors within 30 days unless their verified SLA is shorter. Ordinary encrypted C2 personal/customer backups, justified C3 points and personal-data C4 backup copies expire within **35 days**. C0/C1 points may use the longer controlling schedule only when they contain no personal/customer data; C4 authoritative records and C5 legal holds follow separately approved purposes and schedules. These are proposed engineering SLOs, not jurisdictional response clocks.

## Data-subject/customer requests

- Single intake for access, correction, deletion, restriction, objection/opt-out, portability, authorized agent and appeal. Publish accessible alternatives.
- Verify proportionately using existing authenticated account or controlled email challenge; high-risk exports require step-up. Never demand government ID by default.
- Log jurisdiction, role (individual/customer admin), scope, due date, processor tasks, exceptions, communications, decision and appeal. Counsel defines applicable clocks.
- Export in secure, time-limited delivery: readable PDF/HTML plus structured JSON/CSV and source files/links where authorized. Exclude secrets, other tenants/people and security-sensitive material with documented rationale.
- Corrections preserve necessary financial/audit history through amendment, not silent mutation. Propagate correction/deletion to CRM, scheduling, identity, connectors, indexes, AI state, payments/accounting as applicable.
- Authorized-agent requests require authority and subject verification. Denials/partial denials identify reason and appeal path. Track aggregate request metrics without exposing requesters.

## Legal holds

Only an approved legal owner can open a scoped hold with matter ID, data/subjects, basis, custodians, systems, start/review date and access list. Hold data is segregated, immutable where required and unavailable for ordinary product use. Review at least quarterly. Release requires legal approval and resumes queued deletion. Notify subjects only when approved/required. Coordinate holds and releases with processors.

## Transfers, processors and ongoing assurance

- Maintain a jurisdiction matrix for served/targeted locations, regulator/contact, representative/DPO and DPIA screening, rights/clocks, minors, cookies/GPC, breach rules, localization and counsel disposition.
- Before transfer, record processor role, source/destination and actual region. Adequacy, SCCs, UK Addendum/IDTA, TIA and related duties are evaluated when GDPR/UK applicability and the transfer facts are professionally determined; the internal map does not claim those laws apply.
- Subscribe to subprocessor/terms changes; assess before effective date where possible. Material objection must support disabling the feature, migration or termination without insecure continuation.
- Reassess processors at least annually and on incident, acquisition, material subprocessor/model/region/term change or control failure. Test export/deletion/exit annually.
- Contract breach notification must give Jamula enough time and information to meet the strictest applicable clock; exact SLA requires counsel/procurement approval.

## Backup, incident and telemetry interaction

- Follow `docs/security/backup-recovery.md` for classification, creation, maximum retention, RPO/RTO, immutability and drill cadence; this lifecycle cannot extend that schedule.
- Restore into isolated non-serving quarantine. Verify malware/integrity/class/expiry, replay the separately protected current deletion/suppression/consent-withdrawal/account-closure/connector-revocation tombstone ledger, revalidate authorization/ACL and attest that no tombstoned record is queryable before promotion. Restored content never re-enters AI indexes automatically.
- Security incidents can pause deletion only through a documented, precisely scoped legal hold/necessity decision. Hold data remains segregated from product restore. On release, resume deletion under counsel direction.
- Approved customer wording states that active access is denied when deletion is accepted, ordinary encrypted personal/customer backup copies expire within 35 days, restore cannot return tombstoned data to service, and narrowly retained authoritative/legal-hold records may remain on an approved basis.
- Telemetry forbids token/secret, raw file, prompt/response, full contact details, payment credential, sensitive query-string and cross-tenant data. Use allowlisted structured fields and automated redaction tests.

## Future implementation tests

- Cross-tenant guessed/sequential IDs fail at API, storage, cache, queue, search/vector, export and support layers.
- Tenant switching clears context/caches; concurrent tabs cannot confuse tenant context.
- Invite collision, identity linking, domain claim, recovery, offboarding, break-glass and support-access tests fail closed and generate complete audit.
- Consent withdrawal/GPC propagates; versioned receipts and purpose changes behave correctly.
- Connector token revocation, webhook loss, ACL removal, source deletion, account relink and provider outage deny retrieval and delete derivatives within SLO.
- Microsoft/Google picker access-token scope/audience/lifetime, CSP/origin/message handling, memory-only custody and teardown tests pass; refresh tokens remain server-only. Box custody remains blocked until its chosen picker design passes equivalent tests.
- AI leakage/poisoning/prompt-injection, source-citation, model-change, moderation, budget/concurrency and kill-switch tests pass.
- DSR export/deletion/correction and authorized-agent/appeal workflows meet approved clocks; processor retries and backup tombstones are evidenced.
- Hosted payment redirect, webhook forgery/replay/duplicates/out-of-order events, tenant mismatch, reconciliation, refund/dispute and no-card-data log tests pass.
- Annual portable export/restore-and-delete exercise proves exit for every production processor.

## Approval dependencies

Cyrus approves product purposes, served/targeted markets and vendors; Sarek and qualified professionals decide jurisdiction/legal conclusions. GDPR and UK applicability remain pending counsel while Jamula's voluntary internal controls remain required. Miles approves threat, incident, backup and test evidence; Rai reviews AI impact; Fact Checker revalidates sources and claims. No live customer data or connector/payment/AI activation is authorized by this design.
