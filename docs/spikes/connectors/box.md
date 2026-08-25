# Box connector — blocked/deferred packet

**Decision context:** Refs #3; child #6
**Owner:** Seven of Nine
**Required reviewers:** Miles O'Brien, Sarek, Rai, Fact Checker; Cyrus approval for any live action
**Evidence class:** documented research only
**Status:** blocked/deferred
**Updated:** 2026-08-25 Cycle 3; no live mechanism evidence

## Blocker and attempted evidence

Issue #6 prohibited Box enterprise/developer accounts, applications, credentials, connections and resources. No approved Box plan/enterprise/test users, Developer Console application, enterprise-admin consent, terms/DPA, vault, API allocation/spend, verification path or teardown owner exists. No OAuth, picker, token, API, webhook, ACL, rate-limit, deletion or isolation mechanism was run.

Official documented evidence:

- Box OAuth 2.0 is intended for applications acting for existing Box users and requires a Developer Console app [S20].
- App scopes and user permissions both constrain access; `root_readonly` reads all files/folders available to the authenticated user, while authorization can downscope to configured scopes [S21].
- OAuth refresh tokens are single-use, rotate, and expire if not used within 60 days [S22]; the API documents active-token revocation [S23].
- Box recommends V2 webhooks, which require HTTPS, support payload verification and retry delivery [S24].
- Box documents general, endpoint-specific and license-based API limits, including approximately 1,000 general calls/minute/user [S25].

The official pricing/privacy pages returned access errors during research. Exact plan, API allocation, platform terms, picker entitlement, data residency, DPA/subprocessor and support-access claims are **unverified**, not inferred.

## Unresolved evidence

- Find and execute a customer-friendly selection mechanism and prove whether a persistent token can be limited to selected files/folders. `root_readonly` is read-only but broad; UI selection does not confine the token.
- Evaluate Box UI Elements Content Picker and token downscoping under current official docs/terms. Record whether refresh-token authority remains broad and whether server-side retrieval can operate with an item-limited token.
- Verify managed enterprise versus individual account authorization, admin approval, app enablement, stable account/enterprise binding and revoked-user behavior.
- Verify V2 webhook signature/replay details, folder-only scope (V2 cannot attach at root per current overview), retry gaps, event/ACL APIs and complete reconciliation.
- Obtain official current Box plan/API allocation, overage behavior, commercial Platform terms, DPA, subprocessor list, region/residency, file limits, malware/Shield/classification handling, export/deletion and accessibility evidence.
- Decide whether broad read authority exceeds Jamula's risk ceiling. If no accepted per-item design exists, do not weaken the gate; escalate product architecture.

## Proposed minimum design

- OAuth 2.0 Authorization Code with PKCE/state/nonce/exact redirects. Request/configure only read authority; reject `root_readwrite`, manage users/groups/webhooks/sign, enterprise-wide or impersonation scopes.
- Require a selected-file/folder allowlist and, if supported, a downscoped access token for each retrieval. Refresh tokens remain server-only and highly restricted in the token broker. Whether a Box UI Element/picker requires an access token in a browser context is unresolved and must be documented and tested; do not claim broker-only custody.
- If any access token reaches a browser picker, enforce restrictive CSP `connect-src`/`frame-src`, exact Box HTTPS origins, non-wildcard `postMessage` target origin and sender/source/origin/schema validation; constrain issuer/audience/account/scope/lifetime; hold only in memory; and destroy on success/cancel/error/navigation. No token persistence in cookies, local/session storage, IndexedDB, service workers, URLs/history/referrers, DOM, logs or telemetry.
- Bind Box stable user and enterprise (when present) to Jamula tenant/user; reject email-only linking and enterprise/account changes.
- Serialize refresh because every Box refresh token is one-use; atomically replace encrypted access/refresh pair. Alert before 60-day inactivity expiry, but never refresh a disconnected/unused connection just to retain access.
- Use signed/replay-checked V2 webhooks on selected folders/files where feasible, followed by authoritative fetch; combine with event/cursor polling and daily complete selected-resource/ACL reconciliation.
- Respect `Retry-After` and all user/enterprise/license limits. Cap calls and searches per tenant.
- On disconnect/offboarding: deny first, revoke token, delete webhooks/cursors/allowlist and invalidate every derivative within 24 hours.

## Disclosure and UX plan

Preview settings card:

> **Box is not yet available in this preview.** Jamula has not completed Box plan/terms, least-privilege, permission-change, deletion, accessibility and enterprise-approval verification. Jamula will not ask staff to copy files or use a shared administrator account as a workaround.

If a passing design retains a token technically able to read more than selected items, consent must say so plainly; “selected files only” is prohibited. Connected-account UX shows Box user/enterprise, technical scope, selected allowlist, webhook/reconciliation health, last ACL check, token-expiry risk, disconnect and deletion state.

## Remediation issue recommendation

Create after incorporation: **“Execute approved Box least-privilege connector spike and commercial review”**, owner Seven of Nine; reviewers Miles, Sarek, Rai, Fact Checker. Prerequisites: approved plan/enterprise/users/app/admin, official Platform terms/DPA/subprocessors/region, picker/downscope design, API allocation, vault/spend and teardown. Link `Refs #3; child #6`.

## Preview / GA disposition

- **Preview:** unavailable/hidden until per-item/allowlist enforcement, token-custody, enterprise approval, current commercial evidence and all tests pass.
- **GA:** mandatory with OneDrive and Google Drive. If only an unacceptably broad persistent token is feasible, Box remains blocked and therefore Phase 3 GA remains blocked pending Cyrus's product decision; never misrepresent or weaken.

## Teardown

**Not applicable.** No Box account/enterprise, application, key/secret, consent, token, webhook, file, API call/allocation, cache, derivative or charge was created.

## Future implementation tests

- Individual/managed enterprise/admin approval and account-switch matrix; stable user/enterprise binding and email collision.
- Determine and record Box picker/UI Element token custody. Test CSP/origin/frame/connect policy, `postMessage` sender/source/origin/schema/target validation, access-token issuer/audience/account/scope/lifetime, in-memory handling and accessible fallback.
- Success, cancellation, timeout, error, navigation and account-switch teardown scans cookies, local/session storage, IndexedDB, service-worker caches, DOM, URL/history/referrer, console/error telemetry, application logs and network destinations; refresh token remains server-only and no browser token artifact survives.
- Picker/downscoped token/allowlist behavior proves unselected file/folder and all write/admin/impersonation operations fail.
- Broad refresh-token threat test, vault separation, concurrent single-use refresh rotation, 60-day expiry/reconsent and revocation.
- Cross-Jamula-tenant Box ID, shared collaboration, metadata, preview, cache, vector, citation and export isolation.
- Collaboration/ACL removal, shared-link changes, move/version/classification/Shield, delete/trash, user disable, app disable and offboarding deny immediately and erase derivatives.
- V2 signature/replay, retry/duplicate/order/gap, target deletion, root-coverage limitation and authoritative event/ACL reconciliation.
- User/search/enterprise/license 429 limits and `Retry-After`; no quota-circumvention; API allocation alert and kill switch.
- Disconnect removes V2 webhooks, revokes token and provides deletion/teardown evidence.
