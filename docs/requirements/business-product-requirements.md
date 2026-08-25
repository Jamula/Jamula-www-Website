# Business and Product Requirements

**Status:** Proposed / pending Cyrus exact-SHA approval
**Decision context:** [Parent #3](https://github.com/Jamula/Jamula-www-Website/issues/3) and children [#4](https://github.com/Jamula/Jamula-www-Website/issues/4)-[#9](https://github.com/Jamula/Jamula-www-Website/issues/9)
**Token-custody revision owner:** Geordi La Forge, Platform Engineering (independent N-08 remediation)
**Scheduling correction revision owner:** Jadzia Dax (independent FCR-016 remediation; Geordi La Forge is locked out from this rejected revision)

## Product outcome and boundaries

Jamula.net is the canonical public site for Jamula, Inc.; Jamula.com redirects over valid HTTPS to the matching safe path/query. The site supports AI-native technology consulting and custom-software discovery, a Microsoft-preferred but multi-cloud-capable delivery posture, and progressively stronger customer workflows without coupling every phase to one vendor.

`main` is the only persistent branch and sole production source. This package authorizes no production code, deployment, account, credential, registration, purchase, public claim, or professional conclusion.

## Audiences and measurable outcomes

| Audience | Outcome | Future measure |
|---|---|---|
| Prospective customer | Understand fit and complete contact or scheduling | Task completion, qualified contacts, delivery failures |
| Evaluating stakeholder | Inspect approved work, methods, trust information and sources | Journey success, content freshness, correction rate |
| Customer user | Reach only the correct tenant, files and grounded answers | Zero isolation failures; authorized journey success |
| Customer finance contact | Understand and complete a hosted payment flow | Zero tenant/amount errors; reconciliation success |
| Editor | Publish accurate, accessible, rights-cleared content | 100% approval/rights/accessibility-record completeness |

Targets beyond process completeness require an approved baseline. No metric is a customer outcome or public claim by itself.

## Exact phases

1. **Public:** public service, work, insight, about, contact, accessibility/privacy/terms surfaces; social and GitHub links; consent-aware analytics; reliable anti-abuse contact delivery; monitoring; accessible media and correction routes.
2. **CRM/scheduling:** lead/contact/company ownership and follow-up in an exportable CRM. Scheduling must preserve the separate workforce calendar as authoritative, minimize customer and booking data, prevent calendar conflicts, and keep recording/transcription off by default. Microsoft Bookings/Teams, Zoom Scheduler, and any qualifying CRM-native scheduler are an unranked shortlist; all remain unselected and must pass the same entitlement, pricing, contract, DPA/region, export/deletion, accessibility, calendar-conflict, outage, rollback, reconciliation, and labor gates.
3. **Portal + all three connectors for GA + read-only customer AI:** dedicated customer identity, application-owned tenant authorization, portal, OneDrive/SharePoint, Google Drive and Box, tenant-scoped retrieval and cited read-only AI. Preview may expose only passing connectors with disclosure; GA requires all three. AI has no mutations, actions, arbitrary egress or cross-tenant cache/index.
4. **Invoices/deposits/recurring retainers via hosted flows:** provider-hosted invoices/checkout/customer portal, verified webhooks, accounting/processor/bank reconciliation, no raw card or bank credentials in Jamula systems.
5. **Optional public AI:** considered only after Phase 3 has approved production evidence for safety, utility, isolation, incident handling and cost control; separate public corpus and approval required.

## Experience and content requirements

- Calm technical confidence; plain language, stable task-oriented navigation and progressive enhancement.
- WCAG 2.2 AA for complete applicable journeys, with knowledgeable manual review and equivalent supported fallbacks for critical third-party barriers.
- Good field Core Web Vitals at p75 when sufficient data exists: LCP <=2.5 s, INP <=200 ms and CLS <=0.1, separately for mobile and desktop. Until then status is provisional.
- Public initial transfer <=900 KiB; interactive/authenticated shell <=1,500 KiB, with the category budgets in [the experience gate](../experience/accessibility-seo-performance.md).
- Jamula.net is the canonical editorial source. Services, projects/case studies, insights, founder material and channel adaptations require evidence, rights, accessibility alternatives, exact-version approval, review/expiry and correction/takedown.
- No founder fact, customer result, accessibility, security, privacy, AI, performance, environmental, ethical or social claim is approved by this document.

## Trust, data and operations requirements

- Minimize collection; maintain purpose, candidate lawful basis, notice/consent version, processor/region, retention, export, correction and deletion for every data set.
- No nonessential cookie by default until the applicable consent decision; recognize applicable universal opt-out signals such as GPC.
- Immutable server-resolved tenant context, deny-by-default authorization, lowest-layer tenant controls, phishing-resistant privileged MFA and step-up for exports, membership, connectors, payment sessions and support.
- Connector refresh tokens and all long-lived credentials are stored and refreshed server-side only, encrypted and revocable. Microsoft and Google short-lived picker access tokens may enter tightly controlled browser memory only when an approved provider-specific picker flow requires it; use the minimum audience, scope and lifetime, persist nothing in cookies, localStorage, sessionStorage, IndexedDB, service workers, URLs, telemetry or logs, and deterministically tear down the token on completion, cancellation, error, timeout and account switch. Box browser access-token custody is unresolved, so that picker mechanism remains blocked until an approved design and future implementation test exist. Associated future implementation tests scan storage, history, referrer, DOM/error reports, service workers, logs and network destinations and exercise every listed teardown path. Current ACL/grant is revalidated before file or AI access; stale/unknown state denies.
- `main` produces one immutable, checksummed, provenance-recorded artifact; PR previews are non-production and data-free.
- Separate registrar, DNS, TLS/edge, hosting, CMS, mail, CRM, identity, portal, connectors, AI and payments so each can be replaced.
- Proposed RPO/RTO and SLOs remain internal targets pending evidence and approval; Critical/High release risk is never accepted.

## Non-goals and deferrals

- No production implementation, live data, deployment, vendor account, OAuth/identity registration, paid resource, DNS change or payment test.
- No self-built customer passwords, custom Phase 2 scheduler, website financial ledger, raw card handling, broad connector shortcuts, autonomous AI action, or public AI in Phases 1-4.
- No legal/tax/accounting/insurance conclusion, public conformance claim, or inferred founder/customer fact.
- Builder/CMS options are not rejected because evidence is unavailable; blocked packets must close before scoring or selection.

## Evidence and approvals

Documented research establishes only what sources say. Disposable mechanism evidence proves only the exercised configuration. Blocked/deferred packets are unresolved. Future implementation tests are not evidence. Release requires exact artifact/SHA evidence, named reviewers, all applicable professional gates and Cyrus approval.

Sources: [content](../content/content-strategy.md), [experience](../experience/experience-requirements.md), [customer platform](../architecture/customer-platform.md), [security](../security/control-test-matrix.md), [legal gates](../legal/phase-review-gates.md), and [cost model](../cost/cost-model.md).
