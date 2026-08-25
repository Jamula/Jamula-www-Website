# Security Control and Future-Test Matrix

**Status:** Proposed, implementation-ready control baseline; no compliance or production claim

**Context:** Refs #3; child #7

**Revision owner:** Geordi La Forge, Platform Engineering (independent N-08 token-custody remediation; prior authors locked out)

**Required review:** Identity/Data/AI, Platform, Fact Checker; Cyrus approves exceptions and phase gates

**Verified through:** 2026-08-24

## Evidence semantics

Every matrix result must be labeled `documented research`, `disposable mechanism evidence`, `blocked/deferred packet`, `future implementation test`, or `production evidence`. At evaluation time, all tests below are **future implementation tests** unless a separate spike record says exactly what was executed. `planned`, `documented`, `configured`, and `passing in a spike` do not mean production-proven or standards-conformant.

## Version-pinned baseline

| Standard | Pinned release | Application | Verification and status |
|---|---|---|---|
| OWASP ASVS | **5.0.0** | ASVS Level 2 baseline for authenticated/API surfaces; applicable Level 1+2 requirements. Level 3 requirements are selected where risk warrants. IDs use `v5.0.0-x.y.z`. | OWASP calls 5.0.0 latest stable and requires version-qualified IDs. Verified 2026-08-24: <https://owasp.org/www-project-application-security-verification-standard/> |
| OWASP Web Top 10 | **2025** | Awareness crosswalk; not a verification standard | Official 2025 release lists A01-A10. Verified 2026-08-24: <https://owasp.org/Top10/2025/> |
| OWASP API Security Top 10 | **2023** | API threat crosswalk, especially object/field/function authorization, resource consumption, SSRF and unsafe upstream APIs | Official 2023 list. Verified 2026-08-24: <https://owasp.org/API-Security/editions/2023/en/0x11-t10/> |
| OAuth Security BCP | **RFC 9700 / BCP 240, January 2025** | OAuth/OIDC client, authorization server and resource server behavior for storage connectors and identity integrations | IETF Best Current Practice; updates RFCs 6749, 6750 and 6819. Verified 2026-08-24: <https://www.rfc-editor.org/rfc/rfc9700.html> |
| WCAG | **WCAG 2.2, W3C Recommendation 5 October 2023; current Recommendation snapshot 12 December 2024** | Phase-gating accessibility baseline at Level AA | W3C Recommendation. Verified 2026-08-24: <https://www.w3.org/TR/WCAG22/> |

Before implementation starts, Fact Checker must confirm that each pin remains current. A newer release triggers impact analysis; it does not silently change test IDs. If an official current version cannot be confirmed, label it `needs investigation` and do not claim compliance.

## Test conventions

- Test IDs are durable requirements. The selected stack may add tool-specific cases without weakening them.
- `P1`-`P5` means the first affected phase; a control continues into later phases.
- `PR` runs on every relevant pull request; `RC` runs against an immutable release candidate; `Scheduled` means the exact phase-specific cadence below or the row's explicit cadence; `Prod` is a synthetic/operational check after launch. It does **not** imply continuous human review.
- Safety invariants (authorization, tenant isolation, token audience, payment amounts) require **zero** unexpected allows. Flaky security tests are release failures, not retries-to-green.
- Test fixtures use synthetic data and at least two tenants. Logs and artifacts must be sanitized, access-controlled and retained with the release record.

### Phase-specific execution cadence

`incident-detection-response.md` § “Phase operating model and funded capacity” controls human coverage, owners/alternates and labor. `backup-recovery.md` controls recovery cadence. This matrix controls technical test frequency without inventing a second staffing model.

| Highest live phase | Minimum recurring control execution |
|---|---|
| P1 | Relevant PR + immutable RC suites; always-on automated safeguards; human alert review each staffed weekday; monthly page/kill-switch and public artifact rebuild; quarterly store restore; semiannual CI compromise and clean-room exercise |
| P2 | P1 plus daily business-day queue/provider reconciliation, documented weekend checks, monthly provider outage/duplicate synthetic, semiannual CRM/scheduling recovery |
| P3 | Relevant PR + RC; always-on critical tenant/token/audit/AI alerts backed by funded 24x7 on-call; daily exception review, weekly identity/connector/AI triage, monthly page/access/canary synthetics, quarterly cross-tenant/tenant-restore/game-day evidence |
| P4 | P3 plus daily payment/accounting/bank reconciliation, weekly fraud/webhook review, monthly payment mismatch/webhook test and quarterly recovery exercise |
| P5 | At least P3 plus a new AI evaluation card on every material change, monthly public-AI evaluation/abuse/feedback review and quarterly denial-of-wallet exercise |

If the funded people/contract and hours do not cover a cadence, the control is `blocked`; it is not reported as continuously monitored or silently reduced.

## Control-to-test traceability

| Control | Required behavior | Standards traceability | Future executable test and pass condition | Phase / cadence |
|---|---|---|---|---|
| SEC-01 Input/encoding | Canonicalize once; validate by context; encode output; parameterize interpreters | ASVS `v5.0.0-1.1.1`, `-1.2.1` family; Web A05 Injection | Property/fuzz corpus across forms, APIs, templates and headers; no interpreter execution, stored payload execution or parser differential | P1 PR+RC |
| SEC-02 Browser boundary | CSRF protection, strict CORS, CSP and security headers; safe cache policy | ASVS V3/V4/V14/V15; Web A02/A05 | Browser tests for cross-site state change, origin/preflight, framing, MIME sniffing, HSTS/CSP and authenticated cache; unauthorized origin cannot read/mutate | P1 PR+RC |
| SEC-03 Abuse/cost bounds | Rate, concurrency, size, time and spend limits with safe degradation | ASVS `v5.0.0-2.4.1`, `-4.3.1`, `-5.2.1`; API4/API6; Web A10 | Boundary/load tests for form, email, parser, sync, AI, log and build amplification; limits activate before approved cost/capacity threshold and legitimate recovery works | P1/P2 RC+monthly synthetic; P3+ continuous enforcement, RC and quarterly game day |
| SEC-04 Authentication | Secure identity proofing/session initiation; no enumeration; privileged phishing-resistant MFA | ASVS V6/V7; Web A07; API2 | Enumeration timing/content, credential stuffing, MFA downgrade/push abuse, session fixation and privileged-auth policy tests; no bypass/disclosure | P3 RC+monthly synthetic+policy change |
| SEC-05 Session/re-auth | Server-side revocation; idle/absolute expiry; re-auth/step-up for sensitive changes/exports | ASVS `v5.0.0-7.4.1`, `-7.4.3`, `-7.5.1`, `-8.1.4`; Web A01/A07 | Logout/recovery/MFA-change/offboarding invalidates all required sessions; stale tabs/jobs deny; sensitive action without fresh required strength is challenged | P3 RC |
| SEC-06 Authorization model | Deny by default at trusted service layer for function, object and field | ASVS `v5.0.0-8.1.1`, `-8.1.2`, `-8.2.2`, `-8.2.3`, `-8.3.1`; API1/API3/API5; Web A01 | Generated subject-role-resource-action-field matrix covers every handler/consumer; zero unexpected allows and no client-only enforcement | P2-P4 PR+RC |
| SEC-07 Tenant isolation | Immutable tenant context and lowest-layer cross-tenant controls | ASVS `v5.0.0-8.4.1`; API1/API3/API5; Web A01 | Two-or-more-tenant IDOR suite across CRUD/list/search/export/file/AI/cache/index/invoice plus path/query/body/header ID mutation; no data/existence/timing leak or mutation | P3/P4 PR+RC |
| SEC-08 Membership/support | Secure invitation, tenant switch, domain claim, linking, offboarding and audited support/break-glass | ASVS V6-V8; API2/API5; Web A01/A07 | Replay/expiry/Unicode/link-collision/concurrent-tenant tests and time-bound approved support session; unauthorized membership impossible; use alerts and expires | P3 RC+quarterly access review+semiannual break-glass exercise |
| SEC-09 OAuth transaction | Authorization Code + PKCE S256; unpredictable bound state/nonce; exact redirect; mix-up defense; minimum scopes | ASVS `v5.0.0-10.1.2`, `-10.2.1`, `-10.2.2`, `-10.2.3`, `-10.4.1`, `-10.4.6`; RFC 9700 §§2.1, 4.1, 4.4-4.8 | Provider protocol-negative suite for CSRF, code injection, downgrade, wildcard/encoded redirect and wrong issuer; each fails without token/account linking | P3 each provider RC |
| SEC-10 Token custody | Refresh tokens and all long-lived credentials are stored and refreshed server-side only, encrypted, key-separated and revocable. Microsoft and Google short-lived picker access tokens may enter tightly controlled browser memory only for an approved provider-specific picker flow, with minimum audience/scope/lifetime, no persistence in cookies, localStorage, sessionStorage, IndexedDB, service workers, URLs, telemetry or logs, and deterministic teardown. Box browser access-token custody is unresolved and blocks that picker mechanism until an approved design and test exist. | ASVS `v5.0.0-9.2.2`, `-10.1.1`, `-10.3.1`-`-10.3.5`, `-10.4.5`, `-10.4.8`, `-10.4.9`; RFC 9700 §§2.2-2.3, 4.9-4.10, 4.14 | Per-provider future implementation tests scan storage, history, referrer, DOM/error reports, service workers, logs and network destinations; exercise completion, cancel, error, timeout and account-switch teardown; and reject wrong type/audience/issuer/scope, stolen-token replay, refresh replay and use after revocation. No prohibited persistence, destination, disclosure, acceptance or residual browser token is permitted; Box cannot enable the mechanism before its design and test are approved. | P3 each provider RC+quarterly |
| SEC-11 Outbound request/SSRF | Default-deny egress and protocol/domain/path/port allowlist applied after each resolution/redirect | ASVS `v5.0.0-1.3.6`, `-1.5.3`; API7/API10; Web A06 | IPv4/IPv6/private/link-local/metadata, alternate encoding, redirect, DNS rebinding, scheme and credential-forwarding corpus; no prohibited connection | Any fetch PR+RC |
| SEC-12 Webhooks | Authenticate raw payload and endpoint; freshness/replay/idempotency/order/tenant binding; authoritative reconciliation | API2/API6/API10; Web A01/A08 | Forged, malformed, stale, duplicate, reordered and cross-tenant events never cause unauthorized mutation; valid duplicate is one effect; missed event repaired | Each exposed provider RC+monthly low-cost synthetic; integrated connector drill semiannual and payment drill quarterly |
| SEC-13 File safety | Quarantine, type/size/archive controls, generated names, isolated no-egress processing, malware scan, safe serving | ASVS V5, including `v5.0.0-5.2.1` and `-5.3.2`; API4/API10; Web A05/A06/A10 | EICAR where contractually permitted plus polyglot, macro, SVG/script, traversal, oversized and archive-bomb corpus; scanner failure denies; unsafe item never reaches retrieval/index | P3 PR+RC+scanner update |
| SEC-14 Connector ACL freshness | Bind provider account to tenant; webhook + periodic reconciliation; fail closed when stale; derivatives inherit current ACL | ASVS V8/V10; API1/API10; Web A01 | Remove/share/move/delete file and revoke connector during active session/sync; access and all derivatives disappear within approved SLO; stale state disables access | P3 each provider RC+monthly synthetic+quarterly integrated tenant exercise |
| SEC-15 AI retrieval isolation | Read-only, tenant-scoped retrieval/cache/index; ACL recheck; attributable citations; no arbitrary egress/tools | ASVS `v5.0.0-8.4.1`, `-2.4.1`; API1/API4/API7/API10; Web A01/A06 | Cross-tenant canaries, prompt injection, poisoned source, deleted/revoked source and tool/URL requests; no private canary/action/egress, authorized citations only | P3 RC+model/prompt/retrieval/config change+monthly canary |
| SEC-15A AI outcome evaluation | Versioned card measures correctness/entailment, unsupported assertions, harmful/unsafe output, refusal/over-refusal, escalation, languages/source types, accessibility, feedback/correction and change regression; representative users participate without unnecessary sensitive attributes | `quality-strategy.md` non-waivable AI card; WCAG 2.2; privacy minimization | Reproduce card from hashed set/rubric; every overall/stratum threshold passes, no zero-tolerance event occurs, ≥8 compensated users including ≥4 disabled users complete the approved study, and seeded tenant feedback/correction works | Before P3 preview/GA; every material AI change; monthly live sample review |
| SEC-16 Data export/exfiltration | Step-up, least data, volume controls, encryption, short expiry, audit and revocation | ASVS V8/V16; API1/API3/API4/API6; Web A01/A09 | Slow/burst bulk enumeration and export; only authorized tenant fields included; alerts/limits activate; artifact expires and cannot be guessed/reused | P3/P4 RC+quarterly |
| SEC-17 Logging/audit | Inventory, UTC, correlation, redaction, encoding, tamper evidence and restricted access | ASVS `v5.0.0-16.1.1`, `-16.2.2`, `-16.2.4`, `-16.2.5`, `-16.3.2`, `-16.4.1`; Web A09 | Golden-event schema and log-injection/secret-canary tests across auth/authz/admin/CRM/connector/file/consent/AI/payment; required fields present, forbidden values absent, tamper detected | P1 PR+RC and staffed-weekday health review; P3+ continuous blind-spot alert and daily review |
| SEC-18 Secrets/keys | Managed secret/key lifecycle, inventory, separation, rotation, no plaintext source/artifact/log | ASVS `v5.0.0-11.1.1`, `-11.1.2`; Web A04/A08 | Secret scanning plus synthetic rotation/revocation and old-key rejection; compromised credential can be revoked without rebuild/data loss | P1 PR+quarterly |
| SEC-19 Cryptography/transport | Approved algorithms/protocols; authenticated encryption at rest where required; certificate validation | ASVS V11/V12; Web A04 | TLS/config scan, downgrade/certificate failures and encrypted-store inspection; weak/invalid transport rejected and sensitive stores unreadable without authorized keys | P1 RC+monthly external synthetic+configuration change |
| SEC-20 Supply chain | Lockfiles, approved registries, dependency-confusion defense, immutable CI inputs, SBOM/provenance and verified artifact | ASVS `v5.0.0-15.2.4`; Web A03/A08 | Clean isolated build from lockfile; malicious namespace/cache/untrusted PR cases; SBOM covers direct/transitive components; provenance subject digest/source/workflow verifies before deploy | P1 PR+RC |
| SEC-21 Main-only deployment | Only reviewed protected `main` produces production deployment; immutable promotion, protected environment, rollback | Web A02/A03/A08; NIST SSDF PO/PS/PW/RV | Attempt deploy from PR/tag/other branch and artifact substitution; all denied. Approved `main` artifact digest is promoted unchanged; rollback rehearsal meets RTO | P1 each RC+semiannual compromise/rollback exercise+trust change |
| SEC-22 Backup/recovery | Encrypted immutable isolated backups, integrity verification, tenant restore, classification schedule, 35-day personal/customer expiry, tombstone replay and legal-hold separation | ASVS V13/V16; Web A08/A10 | Destructive/corrupt-source restore into quarantine; manifest/count/authz validated; current tombstones replayed before query; no expired C2/C3 resurrected; RPO/RTO met | Exact classification/phase cadence in `backup-recovery.md` |
| SEC-23 Payments | Hosted flow; authoritative server amount/tenant; no card data; signed idempotent webhooks and reconciliation | ASVS V8/V10/V16; API1/API3/API5/API10; Web A01/A08 | Price/tenant/return tampering, webhook replay/order and reconciliation faults; no entitlement from redirect; only verified state updates once; card-data canary absent | P4 RC+monthly |
| SEC-24 Error/failure behavior | Fail closed without secret/stack disclosure; bounded retry/circuit breaker and operator visibility | Web A10; ASVS V2/V4/V13/V15 | Dependency timeout/malformed response/policy/log/scanner outage and retry-storm injection; safe user response, no bypass, bounded load, alert and recovery | Every phase RC |
| SEC-25 Vulnerability intake | Published, current vulnerability contact/process; triage without granting testing permission | RFC 9116 (April 2022); Web A09 | Fetch/parse `/.well-known/security.txt`, validate canonical URL and future expiry; exercise report intake/ack/escalation | P1 RC; quarterly P1/P2, monthly P3+, and routing change |

Broad ASVS chapter references must be expanded into a complete applicability worksheet once the architecture and ASVS 5.0.0 machine-readable requirement set are imported. The worksheet records every Level 1/2 item as applicable, not applicable with rationale, passing evidence, failing, or risk accepted. The representative IDs above are traceability anchors, not a claim of full ASVS coverage.

## Phase security gates

| Gate | Required evidence before release |
|---|---|
| Phase 1 public launch | SEC-01/02/03/17-22/24/25 passing against immutable RC; canonical Dax performance table passes; DNS/domain/email controls reviewed; P1 funded owner/alternate/hours, incident and restore exercises; no open Critical/High |
| Phase 2 CRM/scheduling | Phase 1 remains passing; SEC-04-06/17/18/22/24 for workforce/vendor flows; P2 funded owner/alternate/weekend checks; processor access/export/rollback and accessible fallback verified |
| Phase 3 preview | SEC-04-20 including SEC-15A, SEC-22/24 passing for identity/portal and every exposed connector; versioned AI card and compensated participation pass; cross-tenant/AI canaries have zero unexpected allows/leaks; funded 24x7 coverage proven; unavailable provider disclosed with blocked packet |
| Phase 3 GA | OneDrive, Google Drive and Box each pass the same gate; revocation/deletion and restore exercises; funded P3 coverage remains proven; approved production evidence period and SLO review |
| Phase 4 | SEC-23 plus applicable earlier controls; P4 payment/accounting coverage funded; hosted payment boundary, tenant tests, reconciliation/rollback and incident exercise; legal/CPA/contract gates remain external |
| Phase 5 candidate | Separate approval after Phase 3 production evidence; SEC-03/11/15/15A/17/20/22/24 adapted to public abuse; separate public-AI card/participation and funded capacity; private/customer corpus exclusion independently tested |

## Failure, deferral, and risk acceptance

1. A failing safety invariant blocks the phase. No test waiver converts failure or missing evidence into proof.
2. A `blocked/deferred packet` contains control/test ID, provider/version/region, blocker and attempts, evidence available, owner, remediation issue, customer disclosure and fallback, preview/GA disposition, expiry, and teardown status.
3. Risk acceptance requires Cyrus plus accountable security and service/data owners. It records exact artifact/PR SHA, affected phase/data/tenants, likelihood/impact, counterevidence, compensating controls, monitoring, rollback trigger, remediation issue, and expiry (maximum 90 days). Critical or High release risk is not acceptable under this baseline.
4. A control mapped to law, contract, payment scope or professional judgment cannot be waived by an engineering acceptance; it remains pending the named professional/authority.

## Result record schema

Each execution stores test/control ID, issue/commit and artifact digest, environment and versions, synthetic fixture IDs, commands/configuration, start/end UTC, expected/actual result, sanitized raw evidence hash/location, runner identity, reviewer, defects, evidence class, retention, and teardown. Production claims require production evidence and approval separate from this evaluation package.

## Additional official sources

Verified 2026-08-24:

- W3C, **Web Content Accessibility Guidelines (WCAG) 2.2**, Recommendation: <https://www.w3.org/TR/WCAG22/>.
- IETF/RFC Editor, **RFC 9116, A File Format to Aid in Security Vulnerability Disclosure**, April 2022: <https://www.rfc-editor.org/rfc/rfc9116.html>.
- NIST, **SP 800-218, Secure Software Development Framework (SSDF) v1.1**, February 2022: <https://csrc.nist.gov/pubs/sp/800/218/final>.

Use of these baselines is a design decision; this document does not claim certification, legal compliance, or executed conformance.
