# Storage connector evidence packets

**Decision context:** Refs #3; child #6
**Owner:** Seven of Nine
**Updated:** 2026-08-25 Cycle 3; no live mechanism evidence

## Evaluation status

| Provider | Evidence class | Status | Preview | Phase 3 GA |
|---|---|---|---|---|
| OneDrive / SharePoint | Documented research + standardized blocked/deferred packet | Blocked: no approved tenant/app/credentials/consent | Hidden until all gates pass | Required; GA blocked |
| Google Drive | Documented research + standardized blocked/deferred packet | Blocked: no approved project/app/credentials/consent/verification | Hidden until all gates pass | Required; GA blocked |
| Box | Documented research + standardized blocked/deferred packet | Blocked: no approved enterprise/app/credentials/consent | Hidden until all gates pass | Required; GA blocked |

No disposable mechanism spike was executed. No app registration, provider account, tenant, credential, OAuth consent, token, API call, webhook, customer file, cost, teardown or live security claim exists. The issue explicitly prohibited those actions. Reading official documentation is not execution evidence.

## Common hard gates

1. Cyrus approves test account/tenant, app registration, consent authority, accepted terms, cost ceiling, verification/security-assessment path, credential custodian, data classification, region and teardown owner.
2. Use Authorization Code with PKCE, exact redirects, state/nonce, issuer/account-link defenses and OAuth Security BCP RFC 9700. No implicit or resource-owner-password flow.
3. Read-only, least-privilege or user-selected file access. No write/share/delete/admin scope. A broad persistent token needs explicit risk acceptance and a narrower-alternative analysis.
4. Provider-specific token custody with provider/environment key separation, atomic rotation, revocation and tested offboarding. Refresh tokens remain envelope-encrypted and server-only. Short-lived access tokens may enter Microsoft/Google browser picker memory only under the controls below; Box behavior remains blocked until its selected picker design is proven. No token enters browser persistence, logs, telemetry, support tooling or AI.
5. Bind provider stable account to authenticated internal tenant/user. Email/domain is display metadata, not authorization.
6. Revalidate source ACL and grant at retrieval time. Webhook/change feed plus bounded full scan. Unknown, stale, expired or revoked denies.
7. Tenant-scoped metadata, storage, chunks, embeddings, index and cache; derivatives retain provenance/ACL/version and are invalidated on change/revocation/deletion.
8. Approved file type/size, malware and isolated-parser responsibility; safe throttling/backoff; no arbitrary URL fetching.
9. Current terms, commercial license, API allocation, DPA, subprocessors, regions/transfers, deletion/export and vendor data-use/AI restrictions pass professional/procurement review.
10. Accessibility, failure status, disconnect and deletion UX pass. A missing connector is never impersonated by manual staff access.

## Provider-specific browser token boundary

Microsoft File Picker v8 and Google Picker web flows may require a short-lived access token to reach the provider's browser picker context. This is a bounded exposure, not evidence that the browser owns refresh authority. Refresh tokens remain server-only. The future Microsoft and Google spikes must record the exact access-token issuer, audience, scope, lifetime, acquisition path, recipient frame/window, in-memory location and teardown behavior.

Box UI Elements/picker and downscoped-token custody are unresolved. A future Box design must state whether any access token reaches a browser context; no server-only or browser-only claim is accepted without execution evidence.

Every browser picker design must pass restrictive CSP `connect-src`/`frame-src`, exact HTTPS origin allowlists, `postMessage` sender/source/origin/schema validation, non-wildcard target origin, issuer/audience/account checks, minimum-scope and lifetime enforcement, memory-only handling, and deterministic success/cancel/timeout/error/account-switch teardown. Tests scan cookies, local/session storage, IndexedDB, service-worker caches, DOM, URLs/history/referrers, console/error telemetry, application logs and network destinations.

## Standard blocked/deferred packet fields

Each provider file records:

- blocker and why no mechanism was executed;
- attempted evidence and official sources;
- unresolved terms/price/license/verification and mechanism questions;
- accountable owner and required reviewers;
- minimum-scope/token/reconciliation/deletion design;
- customer disclosure and UX placement;
- remediation issue recommendation;
- preview and GA disposition;
- teardown status (`not applicable` when nothing was created);
- executable future implementation tests.

## Shared future test harness

Use at least two Jamula tenants, two users per tenant and distinct provider accounts/files. Seed same-named files and guessed/sequential identifiers. Prove:

- callback state/nonce/PKCE/redirect/issuer, login CSRF, account swap and identity-collision rejection;
- no write/admin operation is authorized; refresh tokens never reach the browser; Microsoft/Google picker access tokens exist only in the approved in-memory context/lifetime and no token appears in browser persistence, URLs, logs, traces, errors, tickets, queues or model input;
- restrictive CSP/origin/frame/connect policy and `postMessage` sender/source/origin/schema/target checks reject unapproved frames, windows, messages and endpoints; wrong audience/account/scope and expired tokens fail;
- success, cancellation, timeout, error, navigation and account-switch teardown remove in-memory token references and picker state, revoke where required and leave no service-worker/cache/history/referrer artifact;
- tenant A cannot list, infer, fetch, preview, cache-hit, index-search, cite or export tenant B data;
- user permission removal, file move/share/delete, token revocation/expiry, webhook loss, cursor invalidation, connection relink and provider outage fail closed;
- webhook verification/replay, duplicates, ordering, retries and authenticated reconciliation;
- preview/chunk/embedding/vector/cache/job deletion within approved SLO and no resurrection after restore;
- throttling uses provider guidance; retries are bounded/jittered and cannot create denial-of-wallet;
- disconnect is idempotent and produces revocation/deletion evidence;
- picker, consent, status, reconnect/disconnect and equivalent supported fallback are keyboard/screen-reader/zoom/reflow accessible.

The provider-specific packet can tighten but never weaken these tests.
