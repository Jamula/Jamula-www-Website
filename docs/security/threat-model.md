# Threat Model

**Status:** Proposed evaluation baseline; not implementation or production evidence

**Scope:** Jamula phases 1-5

**Context:** Refs #3; child #7

**Owner:** Quality & Reliability Engineering
**Token-custody revision owner:** Geordi La Forge, Platform Engineering (independent N-08 remediation)

**Required review:** Identity/Data/AI, Platform, Experience/Accessibility, Fact Checker; Cyrus approves phase gates and risk acceptance

**Reviewed sources through:** 2026-08-24

## Evidence and claim rules

This document defines threats, invariants, and future acceptance tests. It does **not** assert that a selected platform, deployed control, restore, alert, or service level exists.

| Evidence class | Meaning | Permitted conclusion |
|---|---|---|
| `documented research` | Dated primary-source requirement or vendor documentation | A control or mechanism is documented, not operationally proven |
| `disposable mechanism evidence` | Sanitized result from an approved, bounded, torn-down spike | Only the exercised mechanism worked under the recorded conditions |
| `blocked/deferred packet` | Blocker, attempted evidence, owner, remediation issue, user impact, and preview/GA disposition | Evidence is unavailable; the gate remains unmet |
| `future implementation test` | Executable test requirement attached to later implementation work | No behavior is proven until the test runs against the release candidate |
| `production evidence` | Approved release/deployment record plus monitored results | May be claimed only after implementation; none exists in this evaluation |

## Method, assumptions, and assets

STRIDE is applied to each phase and trust boundary: spoofing, tampering, repudiation, information disclosure, denial of service, and elevation of privilege. The architecture is not selected, so component names are logical. Re-run this model when a platform, data flow, provider, region, AI model/tool, or payment integration changes.

Primary assets are customer and contact data; workforce/customer identities; tenant membership and immutable tenant context; OAuth codes/tokens and signing/encryption keys; customer files and derived previews/embeddings/indexes; prompts/responses; invoices and reconciliation records; audit/security logs; source, workflows, build artifacts and provenance; backups; DNS/domain/email control; availability and spend budgets; and Jamula's reputation.

Threat actors include unauthenticated attackers, abusive customers, compromised customer or workforce accounts, malicious/revoked tenant members, compromised vendors/webhooks/dependencies/build runners, insiders/support staff, bots, and accidental operators. Customer storage and hosted payment providers remain authoritative for their own records unless a later ADR says otherwise.

## Trust-boundary catalogue

| ID | Boundary | Begins in phase | Required invariant |
|---|---|---:|---|
| TB-01 | Internet/browser -> DNS, CDN/WAF, public site | 1 | Untrusted input; TLS, origin restriction, safe caching, rate/cost bounds |
| TB-02 | Public forms/analytics/consent -> application, email and analytics processors | 1 | Validate/minimize data; consent separation; no secrets or sensitive data in telemetry |
| TB-03 | Repository/PR -> CI runner -> immutable artifact -> protected production | 1 | `main` only deploys; least privilege; pinned inputs; provenance and rollback |
| TB-04 | Workforce browser -> admin, CRM and scheduling vendors | 2 | Phishing-resistant privileged MFA; least privilege; auditable support/admin actions |
| TB-05 | Customer browser -> external IdP -> Jamula session/API | 3 | Exact OAuth redirects, PKCE/state/nonce and correct issuer/audience; server-only encrypted, revocable custody for refresh tokens and long-lived credentials; provider-specific controls for any approved short-lived browser picker token |
| TB-06 | Session/API -> authorization policy -> tenant data/storage/cache/index/key | 3 | Immutable tenant context; deny by default; every object/function/field decision is tenant-aware |
| TB-07 | Jamula connector -> OneDrive/Google Drive/Box API and inbound webhook | 3 | Minimum scope; provider/account binding; authenticated replay-safe webhooks; revoke promptly |
| TB-08 | Customer file -> ingestion/scanner/preview/parser -> derived data | 3 | Quarantine first; size/type/archive limits; isolated processing; derivatives inherit ACL/deletion |
| TB-09 | Portal/retrieval -> AI provider/model -> response | 3 | Read-only, tenant-scoped retrieval; ACL recheck; no arbitrary egress/actions; budget limits |
| TB-10 | Portal -> hosted payment UI/provider -> webhook/reconciliation/accounting | 4 | No raw card data in Jamula; tenant-aware records; signature, freshness, idempotency, reconciliation |
| TB-11 | Public user -> public AI/retrieval/model/moderation | 5 | No customer/private corpus; abuse/content/cost controls; no action tools or arbitrary egress |
| TB-12 | Runtime/providers -> logs, alerts, responders, evidence store | 1 | UTC, redacted, tenant-correlated, access-restricted, tamper-evident, exportable |
| TB-13 | Production/data stores -> encrypted immutable backup -> isolated recovery plane | 1 | Separate credentials; integrity/restore proof; tenant-selective recovery; deletion/legal-hold rules |

TB-03, TB-12, and TB-13 are cross-phase boundaries and must be reassessed at every phase gate.

## Phase-by-phase STRIDE analysis

| Phase and boundaries | Spoofing | Tampering | Repudiation | Information disclosure | Denial of service / wallet | Elevation of privilege |
|---|---|---|---|---|---|---|
| **1 Public site/contact** TB-01/02/03/12/13 | Domain/email impersonation, bot identity, forged analytics source | DNS/content/form/workflow/artifact alteration | Contact submission or admin publication denied without correlated receipt/audit | Form PII, analytics IDs, source maps, secrets or logs leak | Request/form/email exhaustion, oversized media, build/deploy spend | Workflow token, CMS/admin or origin compromise reaches production |
| **2 CRM/scheduling** TB-01-04/12/13 | Staff or prospect impersonation, forged meeting invite | Lead/status/appointment or routing rules changed | Staff/vendor disputes CRM or scheduling action | CRM history, calendars, meeting links/attendees exposed | Booking spam, notification quotas, vendor outage | Over-broad CRM/scheduling role or compromised staff account |
| **3 Portal/connectors/customer AI** TB-05-09/12/13 | Account takeover, invitation/recovery/linking collision, OAuth mix-up | Tenant membership, connector mapping, file, ACL, index, prompt or response poisoned | User/support/provider denies export, access, consent or AI action | Cross-tenant IDOR/BOLA/BOPLA, token/file/prompt/index/log leakage | Credential stuffing, expensive parsing/rescan/model calls, connector/API quota exhaustion | Tenant switch/confused deputy, stale claims, support impersonation, connector scopes or prompt injection bypass policy |
| **4 Hosted payments** TB-05/06/10/12/13 | Customer/provider/webhook impersonation | Amount, invoice, subscription state, return URL or reconciliation modified | Payment/refund/dispute action lacks immutable correlation | Cross-tenant invoice/receipt exposure or payment data enters Jamula logs | Checkout/webhook/fraud/notification cost exhaustion | Customer becomes billing admin; webhook or support path changes financial state |
| **5 Candidate public AI** TB-01/03/09/11-13 | Bot/user/model endpoint impersonation | Corpus, system prompt, moderation or model configuration poisoning | Missing prompt/model/policy-version evidence for abuse decisions | Customer data, hidden prompts, secrets, training data or cross-session context leaks | Token/concurrency abuse, recursive fetches, provider spend surge | Jailbreak/prompt injection enables private retrieval, tools, administration or network access |

## Priority abuse cases and future executable tests

All cases below are `future implementation test` requirements. A passing spike is insufficient for release.

| ID | Scenario and expected control | Minimum release-candidate test / pass condition | Gate |
|---|---|---|---|
| TM-01 | **Cross-tenant IDOR/BOLA/BOPLA:** attacker substitutes object, nested resource, tenant, export, file, invoice, cache key or cursor identifiers. Tenant comes only from trusted session/policy context. | Generate two tenants, roles and colliding object names. Exercise every read/write/list/search/export/preview/history endpoint using path/query/body/header and encoded IDs. All cross-tenant attempts return indistinguishable deny/not-found, cause no mutation or count/timing disclosure, and create a tenant-correlated denial event. | Phase 3 preview and GA; Phase 4 |
| TM-02 | **Function/field elevation:** member invokes owner/support/admin operations or mass-assigns tenant/role/financial fields. | Authorization matrix covers every route, RPC, queue consumer and field. Unauthorized calls fail closed server-side; hidden UI is not accepted as control. | Phases 2-4 |
| TM-03 | **Tenant switch/confused deputy:** stale tab/token/job/webhook continues under the prior tenant. | Concurrent-tab, queued-job and token tests bind actor, subject tenant, resource tenant and provider account; mismatch is denied. Authorization changes invalidate within the approved revocation SLO. | Phase 3 |
| TM-04 | **Invitation/recovery/link collision:** attacker claims invited address/domain or links a different provider identity. | Expired/replayed invitation, alias/case/Unicode collision, email-change, recovery, issuer/subject collision and unverified-domain cases cannot gain membership; sensitive changes require reauthentication/step-up and alerts. | Phase 3 |
| TM-05 | **SSRF:** URL import, preview, webhook callback, metadata resolver or AI fetch reaches loopback, link-local/cloud metadata, private ranges, alternate encodings, redirects, DNS rebinding or non-HTTP schemes. | Egress-deny harness covers IPv4/IPv6, decimal/octal/hex, userinfo, redirect chains, DNS change and port/protocol variation. Only approved destinations resolve/connect after every redirect; credentials are never forwarded. | Any outbound fetch; phases 1-5 |
| TM-06 | **OAuth token/code theft, browser exposure or replay:** code injection, CSRF, mix-up, redirect wildcard, refresh replay, wrong audience/issuer/type, or token persistence/disclosure. Refresh tokens and all long-lived credentials stay encrypted, revocable and server-side only. An approved Microsoft or Google picker may place a minimum-audience/scope/lifetime access token in tightly controlled browser memory only; Box browser access-token custody remains unresolved and blocks that picker mechanism pending an approved design and test. | Per-provider negative protocol suite verifies Authorization Code + PKCE S256, transaction-bound state/nonce, exact redirect, issuer/audience/type/scope, one-time code, rotation/revocation and expiry. It scans cookies, localStorage, sessionStorage, IndexedDB, service workers, URLs/history, referrer, DOM/error reports, telemetry, logs and network destinations, and proves deterministic token teardown after completion, cancel, error, timeout and account switch. No prohibited persistence, destination, disclosure, acceptance or residual browser token is permitted. | Phase 3 preview per provider |
| TM-07 | **Webhook spoof/replay/reorder:** forged connector/payment event, old signature, duplicated or reordered event changes state. | Verify signature against raw body, endpoint/provider/tenant binding, freshness window, replay cache, idempotency, monotonic/version reconciliation and periodic authoritative rescan. Invalid events never mutate state and alert at threshold. | Phases 3-4 |
| TM-08 | **Bulk export/exfiltration:** compromised account enumerates lists/searches/exports/files/AI responses slowly or in bursts. | Rate/volume/novel-destination and privilege tests trigger step-up, user-visible confirmation and alert; export is tenant-scoped, encrypted, short-lived, audited, revocable and excludes unauthorized derivatives. | Phase 3 |
| TM-09 | **Malicious file:** polyglot, double extension, traversal name, macro, SVG/script, decompression bomb, recursive archive, parser exploit or malware. | Quarantine prevents retrieval/indexing before scan. Enforce byte-signature allowlist, size/count/depth/ratio/time/memory limits, generated storage names, isolated no-egress processing, scanner-failure deny, sanitized derivatives and safe download headers. | Phase 3 |
| TM-10 | **AI prompt injection/poisoning/exfiltration:** file or user prompt requests hidden instructions, other tenant data, secrets, URLs or actions. | Seed canaries and adversarial documents across tenants. Retrieval rechecks current ACL; response contains no canary/private data; citations point only to authorized sources; no action or arbitrary network request occurs; poisoned content is attributable/removable. | Phase 3, then 5 |
| TM-11 | **Denial of wallet/service:** bots amplify email, scans, previews, connector sync, model tokens, builds, logs or payment calls. | Load/abuse tests validate per-IP/account/tenant/global concurrency and spend limits, queue bounds, timeouts, circuit breakers, cache controls, budget alerts and tested kill switch without disabling security controls. | Every phase |
| TM-12 | **CI/dependency compromise:** mutable action/tag, dependency confusion, poisoned cache or untrusted PR obtains secrets or produces release. | Untrusted PR runs without production secrets/write token; dependencies/actions resolve to approved immutable digests/SHAs; cache cannot cross privilege boundary; artifact provenance/SBOM verifies before protected `main` deployment. | Phase 1 onward |
| TM-13 | **Support/break-glass abuse:** operator enters a tenant or exports data without authorization. | Just-in-time approval, phishing-resistant MFA, reason/ticket, short expiry, customer-visible/auditable session, prohibition on silent impersonation, alert and post-use review; break-glass use exercises credential rotation. | Phase 3 |
| TM-14 | **Payment state abuse:** amount/tenant changed client-side or forged success return grants service. | Server creates hosted session from authoritative invoice; return URL is informational only; only verified provider state plus idempotent reconciliation updates ledger; no raw card data appears in app/log/backup. | Phase 4 |

## Tenant-isolation invariants

1. The authenticated actor, active tenant, resource tenant, provider account and authorization-policy version are separate values and must agree.
2. Client input never selects authoritative tenant context. Background jobs carry a signed/validated tenant and reauthorize at execution.
3. Database/storage enforcement is tenant-aware at the lowest practical layer; application checks are defense in depth.
4. Cache, rate-limit, object-store, search, vector/index, encryption-key, log and backup namespaces include unambiguous tenant identity.
5. Lists, counts, errors, timing, autocomplete, analytics and AI citations must not reveal existence across tenants.
6. Permission removal, offboarding, connector revocation and deletion invalidate sessions, previews, caches, embeddings and indexes within defined SLOs.
7. Support access is not a tenant bypass. Break-glass is time-bound, independently approved, alerted and reviewed.
8. Isolation tests run with randomized tenant/object IDs, parallel activity, stale tokens and real data-layer policy; mocks alone do not satisfy the gate.

## Risk treatment and phase gates

- No unresolved **Critical** or **High** threat may enter the affected preview/GA state. A Medium may be accepted only by Cyrus with the security/data/platform owners' written recommendation.
- Acceptance records require threat/control IDs, affected phase/tenants/data, likelihood/impact, evidence and uncertainty, compensating controls, accountable owner, exact artifact/PR SHA, expiry no longer than 90 days, remediation issue/date, monitoring, rollback trigger, customer disclosure if relevant, and approvers. Expired acceptance blocks deployment.
- A provider unavailable for approved testing uses a `blocked/deferred packet`; it is not marked passing. Phase 3 preview may omit and disclose a failed connector; Phase 3 GA requires OneDrive, Google Drive and Box all to pass.
- Any critical third-party accessibility barrier blocks the affected flow unless an equivalent supported fallback passes.
- Phase 5 cannot start until Phase 3 customer AI has approved production evidence for isolation, safety, utility, incident handling and cost control. Public AI must use a corpus isolated from customer/private data.
- Platform selection, architecture changes, new AI actions, arbitrary egress, payment custody, or new sensitive data require an updated data-flow diagram and threat-model review before implementation.

## Official sources

Claims below are `documented research`, verified 2026-08-24:

- OWASP, **Application Security Verification Standard 5.0.0**, latest stable version and version-qualified identifier guidance: <https://owasp.org/www-project-application-security-verification-standard/>.
- OWASP, **OWASP Top 10:2025**, current web-risk awareness list: <https://owasp.org/Top10/2025/>.
- OWASP, **API Security Top 10 – 2023**, including BOLA, unrestricted resource consumption, SSRF and unsafe API consumption: <https://owasp.org/API-Security/editions/2023/en/0x11-t10/>.
- IETF/RFC Editor, **RFC 9700, Best Current Practice for OAuth 2.0 Security**, BCP 240, January 2025: <https://www.rfc-editor.org/rfc/rfc9700.html>.

These sources define baselines, not Jamula compliance. Detailed traceability and executable control ownership are in `control-test-matrix.md`.
