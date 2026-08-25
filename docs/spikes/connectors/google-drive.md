# Google Drive connector — blocked/deferred packet

**Decision context:** Refs #3; child #6
**Owner:** Seven of Nine
**Required reviewers:** Miles O'Brien, Sarek, Rai, Fact Checker; Cyrus approval for any live action
**Evidence class:** documented research only
**Status:** blocked/deferred
**Updated:** 2026-08-25 Cycle 3; no live mechanism evidence

## Blocker and attempted evidence

Issue #6 prohibited Cloud projects, OAuth consent screens/clients, credentials, accounts, verification submissions, provider connections and resources. No approved Google Workspace/consumer test accounts, consent authority, Cloud project, verified domain/brand, client, vault, billing/spend ceiling, accepted terms or teardown owner exists. No OAuth, Picker, Drive API, change feed, revocation, ACL, deletion, quota or verification mechanism was run.

Official documented evidence:

- Google recommends the non-sensitive `drive.file` scope for per-file access and says it works with files the user opens/shares with the app, including through Google Picker; all-drive read scopes are restricted [S15].
- Google Picker provides user file selection and supports `drive.file` [S16].
- Sensitive/restricted scopes can require verification; restricted server-side use can require annual third-party security assessment [S17].
- Google API Services User Data Policy requires accurate disclosure, minimum permissions, contextual consent and Limited Use compliance [S18].
- Drive documents quotas, 403/429/backoff and a planned later-2026 charging model [S19].
- Change collection and `changes.watch` support change detection [S38]; web-server OAuth documents protected credentials/state, exact redirects and revocation [S39].

This research does not prove Jamula configuration, verification classification, quota/billing, Picker behavior, ACL freshness, deletion or isolation.

## Unresolved evidence

- Confirm the `drive.file` + Picker workflow exposes every read/list/export operation needed for Google native and binary selected files without broader `drive.readonly` or metadata scopes.
- Confirm consumer and Workspace account behavior, shared drives, shortcuts, ownership transfer, export formats, resource keys and account switching.
- Record brand/app verification outcome and whether any requested scope is sensitive/restricted. Do not accept a restricted scope until security-assessment cost, annual renewal and lead time are approved.
- Verify change feeds/channels for per-file grants, channel renewal, notification authentication, missed-event recovery, ACL/permission retrieval and maximum staleness.
- Reverify Drive API quotas and any announced charging before spike; current page says later-2026 charges are planned [S19]. No price is asserted.
- Review API User Data Policy/Limited Use, Google Workspace/Cloud terms, applicable DPA, service coverage, subprocessors, processing regions, deletion/export, support access and any AI/ML restrictions. The Cloud DPA's applicability to the selected Drive API/account contract is unresolved [S40].

## Proposed minimum design

- Request `https://www.googleapis.com/auth/drive.file` only, using Google Picker. Reject `drive`, `drive.readonly`, `drive.metadata*`, activity, admin/domain-wide delegation and all write/admin scopes not inherent in a required selected-file API. `drive.file` permits modification of files opened/shared with the app, so Jamula's adapter must expose only read calls and test that no mutation route exists.
- Use Authorization Code with PKCE, state/nonce, exact redirect, incremental/contextual authorization and explicit Google account confirmation. Bind stable Google subject/account and selected file IDs to internal tenant/user.
- Store refresh token server-side/encrypted; serialize refresh and revoke at Google's endpoint on disconnect. Google Picker web use may place a short-lived Google OAuth access token in the browser picker context; constrain issuer/audience/account, `drive.file` scope and lifetime, keep it only in memory and destroy it after success/cancel/error/navigation. Refresh tokens remain server-only.
- Enforce restrictive CSP `connect-src`/`frame-src`, exact Google HTTPS origins, non-wildcard `postMessage` target origin where messaging is used, and sender/source/origin/schema validation. Do not persist tokens in cookies, local/session storage, IndexedDB, service workers, URLs/history/referrers, DOM, logs or telemetry.
- Persist a selected-file allowlist. A valid token does not authorize Jamula to process any ID outside the allowlist. Validate current file metadata/version/permissions before retrieval and AI.
- Use change feed/watch where scope permits plus at least daily complete selected-file authorization reconciliation. Renew channels before expiry; notification is a hint followed by authenticated API read.
- For Google-native documents, export only approved MIME formats with size/page/token limits; preserve source/version and disclose conversion.

## Disclosure and UX plan

Preview settings card:

> **Google Drive is not yet available in this preview.** Jamula has not completed Google OAuth/brand verification, least-privilege, permission-change, deletion, accessibility, quota and data-use review. Jamula will not request broader access or ask staff to copy files as a workaround.

Passing consent flow must identify Jamula, the exact `drive.file` purpose, selected files, read-only AI, derivative/retention/region, reconciliation delay, disconnect/deletion and privacy policy. Connected-account UX shows stable provider account, selected files, last reconciliation, token/verification health, disconnect and deletion progress. Never imply Google endorses Jamula.

## Remediation issue recommendation

Create after incorporation: **“Execute approved Google Drive `drive.file` connector spike and verification review”**, owner Seven of Nine; reviewers Miles, Sarek, Rai, Fact Checker. Prerequisites: approved project/accounts/domain/brand, consent copy, exact scope classification, terms/DPA/Limited Use, region, vault, billing/spend and teardown. Link `Refs #3; child #6`.

## Preview / GA disposition

- **Preview:** unavailable/hidden until `drive.file` functionality, OAuth/brand verification, terms and all security/privacy/accessibility gates pass.
- **GA:** mandatory with OneDrive and Box. A restricted/broad scope cannot be adopted merely to meet schedule; failure blocks GA or requires product-scope reconsideration by Cyrus.

## Teardown

**Not applicable.** No Cloud project, OAuth screen/client/secret, account consent, token, API enablement, Picker key, channel, file, quota charge, cache or log was created.

## Future implementation tests

- `drive.file` Picker selection for consumer, Workspace, shared drive, shortcut, Google-native export and binary file; no all-drive list/read.
- Negative mutations: update/upload/delete/share/permission and unselected file IDs fail in Jamula even if the scope could permit an operation.
- Callback PKCE/state/nonce/redirect; account swap, Google subject/email collision and tenant mismatch.
- Picker CSP/origin/frame/connect and any `postMessage` sender/source/origin/schema/target checks; access-token issuer/audience/account/`drive.file` scope/lifetime and memory-only handling.
- Success, cancellation, timeout, error, navigation and account-switch teardown scans cookies, local/session storage, IndexedDB, service-worker caches, DOM, URL/history/referrer, console/error telemetry, application logs and network destinations; refresh token remains server-only and no access-token artifact survives.
- Cross-Jamula-tenant file/shortcut/resource key, metadata, cache, vector, citation and export isolation.
- Permission removal, ownership transfer, shortcut target change, move, version/update, trash/delete, token revocation, app removal and offboarding immediately deny and delete derivatives within SLO.
- Change cursor pagination/expiry, channel renewal/spoof/gap/duplicate/outage and full reconciliation.
- 403/429 truncated exponential backoff, quota unit/egress monitoring, spend alert/hard Jamula kill switch and announced-pricing regression.
- Limited Use disclosure and deletion test; refresh concurrency/revocation; teardown proof.
