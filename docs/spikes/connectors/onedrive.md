# OneDrive / SharePoint connector — blocked/deferred packet

**Decision context:** Refs #3; child #6
**Owner:** Seven of Nine
**Required reviewers:** Miles O'Brien, Sarek, Rai, Fact Checker; Cyrus approval for any live action
**Evidence class:** documented research only
**Status:** blocked/deferred
**Updated:** 2026-08-25 Cycle 3; no live mechanism evidence

## Blocker and attempted evidence

Issue #6 prohibited app registrations, tenants, credentials, provider connections and resource creation. No approved Microsoft test tenant/account, Entra app, consent administrator, credential vault, spending limit, product-terms acceptance or teardown owner was supplied. Therefore no OAuth, picker, Graph, delta, throttling, ACL, revocation, deletion or tenant-isolation mechanism could be executed honestly.

Attempted evidence was limited to official documentation:

- OneDrive File Picker v8 is a Microsoft-hosted delegated control requiring an Entra registration. Its setup examples include broad Graph/SharePoint permissions, while its permissions table identifies delegated `Files.Read`/`MyFiles.Read` options [S11].
- Microsoft Selected permissions require both consent and explicit resource assignment; until both are present the app has no resource access [S12].
- Graph `driveItem: delta` enumerates changes and marks deleted items; delegated `Files.Read` is listed as least privileged for that API [S13].
- Graph throttling returns 429 and recommends `Retry-After`, backoff and change tracking [S14].
- Microsoft online-service terms require appropriate licenses and DPA review [S32][S41].

These statements do not prove consumer/workforce coverage, picker configuration, admin-consent behavior, per-file assignment usability, rate capacity, notification reliability or Jamula isolation.

## Unresolved evidence

- Decide supported account types: organizational OneDrive/SharePoint only, personal OneDrive, or both. Verify multi-tenant publisher/consent requirements.
- Demonstrate whether a user-selected flow can persist only a selected file/folder grant. `Files.Read` is read-only but can authorize all files the user can access; the Picker UI does not itself prove token confinement. Selected permissions add an explicit assignment step whose customer/admin UX and delegated suitability must be tested.
- Verify File Picker v8 redirect/origin/postMessage controls, token acquisition, logout/account switching, file/folder/site/Teams behavior and accessibility.
- Verify change-notification support for chosen resources, delta cursor lifecycle, ACL retrieval, revocation and maximum staleness.
- Record exact M365/SharePoint licensing, Graph/API allocation, app verification/publisher requirements, commercial terms, DPA, subprocessors, storage/processing geography, export/deletion and support access. No exact recurring price is asserted.
- Decide malware scanning and Microsoft sensitivity-label/encrypted-file behavior; prohibit silently bypassing labels or DRM.

## Proposed minimum design

- Begin with delegated user authorization and read-only operations. Request only the scope demonstrated necessary for the selected-resource design; reject `Files.ReadWrite*`, `Sites.ReadWrite*`, application-wide file/site permissions and directory/admin scopes.
- Preference order: a verified per-item/folder Selected grant; otherwise a bounded delegated `Files.Read` token only with explicit Cyrus/Miles/Sarek risk acceptance, prominent disclosure of technical reach and application-layer allowlist that denies unselected IDs. A picker alone is not a security boundary.
- Bind `(issuer, Microsoft subject, Graph account/tenant, drive, item)` to Jamula `(tenant_id, user_id, connection_id)`. Reject tenant/account mismatch and consumer/workforce issuer confusion.
- Store and refresh long-lived credentials server-side only. File Picker v8 may require a short-lived Microsoft access token in the Microsoft-hosted browser picker context; constrain it to the verified issuer/audience, minimum scope and shortest supported lifetime, keep it only in memory and destroy it after success/cancel/error/navigation. Refresh tokens remain server-only. Use PKCE/state/nonce/exact redirects, atomic rotation and revoke/delete on disconnect/offboarding. Do not use application permissions for customer files.
- Enforce restrictive CSP `connect-src`/`frame-src`, exact Microsoft HTTPS origins, non-wildcard `postMessage` target origin and sender/source/origin/schema validation. Deny account/tenant/audience/scope mismatch. Do not persist tokens in cookies, local/session storage, IndexedDB, service workers, URLs/history/referrers, DOM, logs or telemetry.
- Persist only selected source IDs, metadata, version/eTag/cTag, ACL fingerprint and derivatives. Before retrieval/AI, fetch current item and effective permission/grant; unknown denies.
- Use delta plus provider notifications where available and a daily full selected-resource/ACL reconciliation. On deletion/access loss, immediate deny tombstone; derivatives deleted within 24 hours.
- Respect 429 `Retry-After`; bounded jitter/backoff; cap per-tenant calls. No Graph bulk extraction.

## Disclosure and UX plan

Preview settings card and connection dialog:

> **OneDrive is not yet available in this preview.** Jamula has not completed Microsoft authorization, least-privilege, permission-change, deletion, accessibility and terms verification. Jamula will not ask staff to copy your files as a workaround.

When passing, consent must state the actual technical scope, selected files/folders, read-only AI purpose, derivatives/retention, region, reconciliation delay, disconnect effect and privacy link before redirect. The connected-accounts page shows provider account/tenant, exact grant, selected sources, last successful ACL reconciliation, health, disconnect and deletion progress. Never say “only selected files” unless the token and tested enforcement make it true.

## Remediation issue recommendation

Create after incorporation: **“Execute approved OneDrive least-privilege connector spike”**, owner Seven of Nine; reviewers Miles, Sarek, Rai, Fact Checker. Attach approved tenant/accounts, registration/publisher status, scopes, terms/DPA, region, vault, spend, teardown and the tests below. Link `Refs #3; child #6`.

## Preview / GA disposition

- **Preview:** unavailable/hidden until a disposable mechanism spike passes every common and provider-specific hard gate and Cyrus approves exact disclosure.
- **GA:** mandatory. Phase 3 GA remains blocked until OneDrive, Google Drive and Box all pass. No scope weakening, application-permission shortcut or manual impersonation is allowed.

## Teardown

**Not applicable.** No tenant, registration, secret, consent, token, webhook/subscription, file, cache, log or paid resource was created. A future spike must inventory and delete all such artifacts and preserve only redacted evidence.

## Future implementation tests

- Personal versus organizational issuer/account matrix; wrong-tenant and account-switch callback rejection.
- Picker CSP/origin/frame/connect policy; `postMessage` sender/source/origin/schema/target validation; access-token issuer/audience/account/scope/lifetime; in-memory-only handling; selected-resource fidelity and accessible fallback.
- Success, cancellation, timeout, error, navigation and account-switch teardown scans cookies, local/session storage, IndexedDB, service-worker caches, DOM, URL/history/referrer, console/error telemetry, application logs and network destinations; refresh token remains server-only and no access-token artifact survives.
- Scope negative tests prove all write, sharing, unselected file/site, directory and application-permission operations fail.
- Selected grant assignment/revocation versus `Files.Read` risk path is measured and documented; no unsupported “selected only” claim.
- Cross-Jamula-tenant drive/item ID, preview, chunk, cache, vector, citation and export attempts fail.
- Delta initial/page/resume/cursor-expiry/deletion behavior; notification duplicate/gap/outage; daily ACL scan; 429 `Retry-After`.
- File unshare, permission downgrade, move, version change, label/encryption, deletion, token/admin revocation and tenant offboarding deny immediately and erase derivatives within SLO.
- Refresh concurrency/rotation, secret leakage and recovery; disconnect removes subscription/grant and token.
