# Customer platform architecture

**Decision context:** Refs #3; child #6
**Revision owner:** Jadzia Dax (independent revision owner)
**Status:** proposed vendor-neutral architecture for Picard synthesis; documented research only; no identity provider, inference provider, model, deployment, or vendor is selected or approved
**Updated:** 2026-08-25 Cycle 4; N-09 vendor-neutral boundary revision; no live mechanism evidence

## Scope and boundaries

This design covers Phase 2 CRM/scheduling, Phase 3 customer identity/portal/storage connectors/read-only AI, and the Phase 4 hosted-payment seam. The public site, workforce administration, customer portal, provider connectors, AI inference, and payments remain separate trust boundaries. A vendor suite may implement several boundaries, but shared branding does not make shared trust safe.

Non-goals: production implementation, public AI, custom password storage, autonomous actions, live provider setup, card entry in Jamula systems, tax/accounting conclusions, and forcing all phases into one vendor.

## Logical design

```text
Public browser
  ├─> Public site ──> Contact ingress ──> CRM adapter ──> CRM (lead SoR)
  └─> Booking link ──> Bookings/Teams or Zoom (calendar/booking SoR)

Customer browser
  ──> WAF / portal edge
      ──> Identity callback ──> SelectedExternalIdP (none selected)
      ──> Portal API
          ├─> Tenant membership + policy service
          ├─> Tenant-enforced operational database
          ├─> Audit/event append service
          ├─> Connector broker ──> Microsoft / Google / Box
          ├─> Retrieval service ──> tenant object/chunk/vector/cache partitions
          ├─> Read-only AI broker ──> SelectedInferenceProvider adapter (none selected)
          └─> Payment facade ──redirect─> hosted processor
                                         └─webhook─> payment event ingress

Workforce administrator
  ──phishing-resistant MFA + conditional access + step-up─> Admin API
```

All arrows crossing a line above are authenticated, authorized, encrypted, rate-limited, audited and failure-designed. No connector or payment webhook enters a customer request path without independent validation and a fresh authoritative read.

## Systems of record

| Domain | System of record | Portal copy |
|---|---|---|
| Lead/contact/company/pipeline and communication preferences | Selected CRM | Stable CRM reference and minimal display cache only |
| Workforce calendar and booking | Exchange/Bookings or approved Zoom account | Booking/provider IDs and status only |
| Authentication identity | `SelectedExternalIdP` external-customer identity plane (none selected) | Provider issuer/subject mapping; no password |
| Customer tenant, membership and application role | Jamula tenant/policy database | Authoritative |
| Source file and provider ACL | OneDrive/SharePoint, Google Drive, or Box | Provenance, ACL fingerprint and revocable derivatives |
| AI conversation | Jamula, only when visible retention is enabled | Authoritative session history; model provider state disabled by default |
| Contract/project and billable intent | Approved CRM/contract workflow | Opaque reference |
| Invoice, credit and general ledger | Accounting system | Read-only projection |
| Payment method and processor transaction/subscription state | Payment processor | Opaque IDs plus normalized status |
| Cash settlement | Bank, reconciled by accounting | No ledger role |
| Security/authorization audit | Append-only Jamula audit store | Restricted views/exports |

The website/portal is never the financial ledger, source-file authority, identity credential store or CRM merely because it displays data.

## Identity, tenant and authorization model

### Separate identity planes

- **Customers:** `SelectedExternalIdP` is the logical boundary for a dedicated external-customer identity plane, separate from workforce identity. No IdP is selected. Sign-in provides identity claims only; Microsoft Entra External ID, Auth0, Clerk, Supabase Auth, and Firebase Authentication remain explicitly non-selected, unranked documented candidates in the [customer-platform research](../research/customer-platform-options.md#phase-3-identity-and-authorization).
- **Workforce administrators:** workforce tenant with phishing-resistant Conditional Access. Customer identities cannot receive Jamula workforce roles.
- **Service identities:** workload identity/federation where possible; no shared human/service accounts.
- Validate issuer, audience, signature, nonce, authorization-code flow and token lifetime. Pin allowed external identity realms/tenants and policies only after selection. Reject tokens from an unexpected identity plane.

### Immutable tenant context

1. Authenticate provider `(issuer, subject)`.
2. Resolve an active internal user and membership server-side.
3. For a request addressing a tenant, require exactly one active membership and derive immutable `TenantContext(tenant_id, user_id, role_set, auth_time, correlation_id)`.
4. Bind context to the server request/unit of work. Client payload, URL, cookie, file metadata, connector account, model output and webhook cannot replace it.
5. Pass the context explicitly to every repository, cache, queue, connector, retrieval, export and audit operation. A missing, wildcard, conflicting or stale context is a denial.

Use non-meaningful UUID tenant IDs. Do not derive authorization from email domain, CRM company, provider account email or user-selected labels.

### Deny-by-default authorization

- Central policy describes `principal × action × tenant × resource × state`; handlers must name an allowed action. “Authenticated” grants nothing.
- Enforce twice: service/object policy and tenant-aware datastore controls (for example row-level security plus composite tenant/object keys). Blob prefixes, search namespaces, encryption context and cache keys include tenant.
- Database connection pools set and clear tenant context transactionally; tests prove no context leakage between pooled requests.
- Object lookup uses `(tenant_id, object_id)`, never `object_id` followed by an ownership check.
- Resource responses and timing do not reveal whether another tenant's object exists.
- Exports snapshot authorized scope and reauthorize each resource; background jobs carry a signed, short-lived, single-tenant capability, never a raw role.
- Support access is separate, case-bound, time-bound, step-up protected and audited. Break-glass is dual-approved and alerted.

### Roles and sensitive actions

| Role | Allowed intent |
|---|---|
| `customer_viewer` | Read approved portal records/files/AI answers |
| `customer_member` | Viewer plus create own read-only AI sessions |
| `customer_billing` | View authorized invoices and open a processor-hosted payment/customer portal |
| `customer_admin` | Manage tenant invitations/roles and connector grants within policy |
| `support_readonly` | Approved case/time-bound diagnostic view, no content by default |
| `jamula_admin` | Approved workforce administration; no automatic customer data access |

Require recent phishing-resistant step-up for tenant export, invite/role/domain/recovery changes, connector authorization/revocation, payment session creation, support/break-glass and security settings. Do not accept SMS as privileged phishing-resistant MFA. Sessions use secure, HttpOnly, SameSite cookies; rotate at authentication/privilege change; enforce idle/absolute limits and CSRF protection.

## Phase 2 adapters

### CRM ingress

The public form validates/minimizes fields, rate-limits and scans for abuse before creating a signed internal event. A worker idempotently upserts through a `CrmPort`; failure queues encrypted minimal data with expiry and alerts an owner. CRM identifiers never become portal tenant IDs.

```text
CrmPort
  upsertLead(sourceEvent, contact, company, purposeReceipt)
  appendActivity(crmRef, redactedActivity)
  setPreference(crmRef, channel, state, receiptVersion)
  exportSubject(crmRef)
  deleteOrSuppress(crmRef, policy)
```

The adapter maintains field mapping/export documentation so HubSpot, Zoho or Dynamics can be replaced. It does not sync passwords, connector grants, file content, prompts or card data.

### Scheduling

Public booking redirects to provider-hosted scheduling. Collect only minimal business fields. Provider webhooks/polling may update CRM status, but meeting notes, recordings, transcripts and AI summaries are disabled by default and require a separate approved purpose. Calendar availability is never exposed as raw event data. Equalize/rate-limit availability searches and protect cancellation/reschedule links.

## Connector broker

### Provider-neutral contract

```text
ConnectorPort
  beginAuthorization(tenant, user, requestedReadGrant)
  completeAuthorization(callback, expectedTenant, expectedUser)
  listAuthorizedSources(connection, cursor)
  readMetadata(connection, sourceId)
  streamContent(connection, sourceId, expectedVersion)
  readEffectiveAcl(connection, sourceId, user)
  reconcile(connection, cursor)
  revokeAndDelete(connection)
```

There is deliberately no write/share/delete/upload method. Provider IDs are namespaced; typed connections cannot be substituted across tenant/provider/account.

### OAuth and token custody

- Authorization Code with PKCE, exact redirect allowlist, unpredictable state/nonce, issuer mix-up protection and login-CSRF/account-linking checks; follow OAuth Security BCP RFC 9700 [S35].
- Prefer user-selected/per-file read grants. Reject requested scope escalation and all write/admin scope. Each provider packet identifies unresolved scope fit.
- The server-side broker exclusively stores and refreshes long-lived credentials. Refresh tokens never reach browser, queues, analytics, support tooling or AI. Store envelope-encrypted token documents under provider/environment-specific keys in a managed vault/HSM path; associated data includes tenant, connection, provider, client and environment.
- Custody is provider-specific. Microsoft File Picker v8 and Google Picker web flows may require the host to supply a short-lived access token to the provider's browser picker context [S11][S16]. Those tokens are held only in memory, constrained to the verified provider audience, minimum scope and shortest supported lifetime, and destroyed after picker completion, cancellation, navigation or error. They are never persisted in cookies, local/session storage, IndexedDB, service-worker caches, URLs, telemetry or application logs.
- Box browser access-token handling is unresolved until a specific Box UI Elements/picker/downscope design is approved and tested. Do not infer that either browser or broker alone has custody.
- Serialize refresh per connection, handle provider rotation atomically, retain neither old token nor plaintext. Revocation and disconnect are idempotent.
- Separate development/test/production registrations, redirects, keys, webhooks and data. No production customer can authorize a test client.

Browser picker integration is denied by default. An approved provider-specific flow must enforce a restrictive CSP and `connect-src`/`frame-src`, exact HTTPS origin allowlists, validated sender/source/origin and schema for every `postMessage`, no wildcard target origin, audience/issuer/account checks, minimum scopes, measured token lifetime, memory-only handling and deterministic teardown. Tests inspect browser storage, history, referrers, service workers, DOM/error reports, logs and network destinations before and after success, cancel, timeout, account switch and failure.

### Reconciliation and deletion

Provider webhook/change notification validates transport/signature/replay as supported, maps to a connection without trusting payload tenant, then enqueues a fresh provider read. Incremental feeds run at least every 15 minutes while active; full grant/ACL scan is proposed at least daily. Exact cadence must respect verified provider limits.

Each derivative stores:

```text
tenant_id, connection_id, provider, account_id, source_id, source_version,
acl_fingerprint, content_hash, derivative_kind, model/parser_version,
created_at, last_acl_validated_at, expires_at
```

On revocation, permission loss, deletion, account mismatch or stale policy: write a deny tombstone synchronously; block read/AI; cancel queued work; evict caches/previews; delete chunks/embeddings/index records within 24 hours; revoke token/delete webhook. Backup classes and expiry follow the [authoritative classification-specific schedule](../security/backup-recovery.md#authoritative-classification-specific-backup-schedule). Restore only to quarantine, replay current tombstones/withdrawals/revocations and revalidate current ACL before promotion. Do not silently impersonate a customer or ask staff to copy inaccessible files.

## Read-only retrieval and AI

### Ingestion

Only files explicitly authorized by the connector grant enter ingestion. Enforce allowlisted formats and configured byte/page limits before download. Stream through malware detection and an isolated parser with no network, macros, external references or active content. Persist sanitized text/chunks rather than whole content unless a documented feature requires a short-lived encrypted copy.

Index writes require tenant partition, source version, ACL fingerprint and expiry. Index/query APIs require an exact tenant namespace; there is no cross-tenant admin query. Per-tenant keys are preferred for high-sensitivity tiers.

### Request path

1. Resolve tenant/user and `ai.ask` policy.
2. Enforce concurrency, request/day, retrieved-byte, token and spend budget.
3. Search only tenant index.
4. For each candidate, revalidate connection, source version and effective user ACL against provider/current reconciled evidence. Unknown/stale denies.
5. Sanitize and assemble bounded excerpts with immutable provenance. Retrieved instructions are untrusted.
6. Call the approved model deployment only through the `SelectedInferenceProvider` egress-deny adapter. No URL/tool/plugin/action access.
7. Filter/validate answer, attach authorized citations and disclose uncertainty/human escalation.
8. Store only visible, approved conversation history and content-free usage/security telemetry.

`SelectedInferenceProvider` is a logical approved-model-deployment adapter; no inference vendor, seller, model, deployment type, or version is selected. Any future selection must use an approved geography rather than a global deployment where residency requires constraint, pin model/deployment/version, and pass regression before change. Optional provider stateful features, fine-tuning and customer-data training are off. Provider DPA, data-use, human abuse review, retention and subprocessor terms are gates. Microsoft documentation stating no foundation-model training without permission remains non-selected candidate evidence only, not a Jamula architecture decision, contract, approval, or deployment proof [S09].

### Prompt-injection and poisoning controls

- System policy and authorization are code controls, never instructions the model may override.
- Clearly delimit sources; suppress hidden/active text; detect suspicious instructions; prefer multiple corroborating sources for sensitive answers.
- Model output cannot choose tenant, source, URL, tool or authorization decision.
- Cite source/version and provide “insufficient authorized evidence” rather than guess.
- Allow tenant admins to report/quarantine a source; reindex only after approval. Keep quarantine inaccessible to AI.

### Cost controls

The sole numerical planning dictionary is [`RWL-2026-08-25.3`](../cost/reference-workloads.md). Phase 3 designs and reserves use its exact R0, L1, A1 and G1 customer-tenant/user, provider-account, file/storage, egress, connector-call, conversation and model input/output-token dimensions. R0 authorizes only disposable synthetic research. Customer-platform costs are separate full-roadmap reserves and never enter public-site TCO.

Provider- and route-specific concurrency, daily request, retrieved-byte/chunk and per-request token controls must be derived from a named RWL scenario plus measured spike results and documented as a provider-specific fixture; this architecture sets no competing seat/storage/token table. Apply the RWL cost-scope checkpoints: re-price at 50%, 80% and 100% of quota and when a measured dimension differs from its band by more than 25% for two months. At the approved hard tenant/global budget, disable AI while portal/file access remains available. Provider billing and budget alerts—including Azure Budget alerts only if Azure were later selected—are advisory, not the enforcement mechanism.

## Phase 4 payment seam

The Payment facade accepts an authorized internal invoice reference and creates a single-purpose hosted session/link at the selected processor. Prefer a full-page redirect over embedded fields to reduce payment-page attack and PCI scope; confirm SAQ with acquirer/QSA [S34][S42].

- No Jamula page, API, log, analytics or support tool receives PAN, CVC or bank login data.
- Processor keys are least privilege, environment-separated, vaulted and rotated. Browser gets only hosted URL/public identifier.
- Return URL never marks paid. Webhook ingress preserves raw bytes, verifies current/rotating signature secret and timestamp tolerance, rejects replay, retrieves authoritative object, then normalizes.
- `provider + event_id` and business transition are idempotent. Out-of-order events use processor creation/version time and API state. Tenant mapping comes from server-created opaque invoice/session metadata, then is checked against accounting/CRM mapping.
- Unmatched/ambiguous/mismatched events quarantine and alert; no automated cross-tenant reassignment.
- Daily reconciliation compares processor, accounting and bank settlement. Portal is a read-only projection. Refund/credit/dispute/subscription actions occur in their approved system of record.

See `docs/payments/phase-4-evaluation.md`.

## Audit, privacy and lifecycle

Audit records are UTC-synchronized, tenant-correlated, append-only/tamper-evident, access-restricted and exportable. Capture authentication, policy allow/deny, membership/admin, connector consent/refresh/revoke/reconcile, source/ACL/derivative, AI usage/safety, payment webhook/reconciliation, support/break-glass, consent, export and deletion events. Record identifiers/reasons/hashes, never secret tokens, source content, prompts or raw payment credentials.

Follow `docs/privacy/data-inventory.md`, `docs/privacy/data-lifecycle.md` and the authoritative schedule in `docs/security/backup-recovery.md`. Legal holds are precisely scoped and segregated from ordinary restore/product use. Restores remain quarantined until current deletion/revocation/suppression/withdrawal tombstones replay, tenant/ACL/classification/expiry validation passes and promotion is approved; they do not repopulate AI indexes automatically.

## Failure behavior

| Failure | Safe behavior |
|---|---|
| Identity provider unavailable | Existing short session may continue only within policy; new/step-up/admin actions deny |
| Membership/policy unavailable or ambiguous | Deny all tenant data operations |
| Connector expired/revoked/stale/provider down | Deny file/AI retrieval; show provider-specific status and remediation |
| Webhook invalid/gap | Reject; reconcile through authenticated provider API |
| Parser/scanner uncertain | Quarantine; do not index |
| Vector/model unavailable or budget exhausted | Disable AI; portal/files remain available |
| CRM down | Expiring encrypted queue for minimal contact event; no duplicate spam |
| Scheduling down | Clear provider status; no fake booking confirmation |
| Payment processor/webhook down | Keep pending; do not mark paid; reconcile later |
| Audit write unavailable for sensitive mutation | Fail closed |

## Security baseline and future evidence

Pin OAuth security to RFC 9700 [S35], application verification to OWASP ASVS 5.0.0 Level 2 target [S36], and API threats to OWASP API Security Top 10 2023 [S37]. Miles maps exact version-qualified controls and threat model.

Required implementation evidence:

- unit/property/integration tests for tenant context and deny defaults;
- two real tenants with cross-tenant IDOR, datastore, object, cache, queue, export, connector, vector and AI leakage attempts;
- invitation/linking/recovery/domain/tenant-switch/offboarding/support/break-glass tests;
- provider OAuth callback, scope, rotation, revocation, account mismatch, webhook/change gap, ACL loss and deletion propagation tests;
- provider-specific picker CSP, exact origin/frame/connect allowlists, `postMessage` sender/source/origin/schema/target validation, token issuer/audience/scope/lifetime, memory-only browser handling, storage/history/referrer/log/network leakage and success/cancel/error/account-switch teardown tests; Microsoft/Google short-lived access-token exposure is explicit and refresh tokens remain server-only;
- malicious file/parser/prompt-injection/poisoning/citation/model-regression and cost-kill-switch tests;
- hosted-payment no-card-data capture, signature/replay/idempotency/out-of-order/tenant-mismatch/reconciliation tests;
- tenant backup restore after deletion proving tombstones prevent resurrection;
- accessibility tests for auth, consent, storage picker, AI citations/status, scheduling and hosted payment fallback.

No component passes from documented research alone. Connector packets currently record blocked/deferred evidence honestly. Preview may expose only providers with completed gates and approved disclosure; Phase 3 GA is blocked until OneDrive, Google Drive and Box all pass.

## Decision and review gates

- **Cyrus:** approve vendors, exact controlling workload version `RWL-2026-08-25.3`, regions, registrations, spend, disclosures and live spikes.
- **Picard:** synthesize ADRs and reversibility.
- **Geordi:** map runtime/storage/observability costs and portability.
- **Miles:** threat model and verify controls/evidence.
- **Sarek / professionals:** DPA/transfers, privacy, records, PCI/tax/accounting/renewal/refund.
- **Rai:** AI purpose, safeguards, accessibility and human escalation.
- **Fact Checker:** revalidate official sources, dynamic terms/price/limits and contradictions.
