# Customer platform options

**Decision context:** Refs #3; child #6
**Owner:** Seven of Nine
**Independent correction revision owner:** Geordi La Forge; Seven of Nine, Miles O'Brien, Sarek and Nyota Uhura are locked out from this rejected revision
**Updated:** 2026-08-25 Cycle 3; claim-specific source dates remain in the source register
**Evidence class:** documented research only. No tenant, account, license, connector, identity provider, model, or payment processor was configured.

## Recommendation for Picard synthesis

Use replaceable phase boundaries rather than one suite:

1. **Phase 2 CRM:** keep HubSpot, Zoho CRM and Dynamics 365 Sales as an **unranked shortlist**. HubSpot remains blocked evidence, not a preferred pilot, until dated US tenant/checkout captures establish seats, contact/automation limits, structured export/deletion, DPA/processing region, cancellation and complete commercial terms. A spreadsheet or Microsoft List is not the customer-history system of record.
2. **Phase 2 scheduling:** keep Microsoft Bookings/Teams, Zoom Scheduler and any qualifying CRM-native scheduler as an **unranked shortlist**. Bookings/Teams remains blocked evidence until dated US tenant/admin/checkout captures establish exact Microsoft 365, Teams and Exchange entitlements, organizer/staff seats, feature limits, export/deletion, DPA/region and cancellation. Disable recording/transcription by default in any later approved option.
3. **Phase 3 identity:** keep Microsoft Entra External ID, Auth0, Clerk, Supabase Auth, and Firebase Authentication as **unranked, incomplete-evidence candidates** under the same gates. Require an external customer identity tenant separate from the workforce identity tenant. The application owns tenant membership and authorization; identity-provider authentication never substitutes for tenant-aware application authorization.
4. **Phase 3 files:** expose only connector packets that later pass every gate. Preview may ship a passing subset; GA requires OneDrive, Google Drive, and Box. All three are currently **blocked/deferred**, not failed, because live evidence was prohibited.
5. **Phase 3 customer AI:** use a replaceable `SelectedInferenceProvider` adapter. No inference vendor, seller, model, hosting platform, deployment type, or geography is selected. Any future selection must use an approved geography and non-stateful inference, keep retrieval read-only and tenant-scoped, revalidate source ACLs at request time, return grounded citations, and provide no action tools or arbitrary egress. Provider candidates remain unranked and must pass DPA, data-use/training, retention/deletion, subprocessor, region/transfer, support and breach-term gates before selection.
6. **Phase 4 payments:** require a processor-hosted redirect flow and keep Stripe, Square, PayPal, and an accounting-hosted invoice flow as **unranked documentation candidates**. No provider is preferred or selected. Apply the same fee, DPA, payout, reserve, dispute, accounting, accessibility, and professional-review evidence gates to every candidate.

These are reversible recommendations, not approvals. Cyrus approves vendor selection, licenses, spend, terms, registrations, and any live connection.

## Evidence classes

| Class | Meaning in these artifacts |
|---|---|
| `documented research` | A dated reading of an official page. It proves only what the cited page says. |
| `disposable mechanism spike` | A narrow live exercise with approved disposable resources. **None was executed.** |
| `future implementation test` | An executable acceptance criterion for a later implementation issue. It is not present evidence. |
| `blocked/deferred` | Required live evidence could not ethically be collected under issue #6 constraints. |

## Controlling workloads and cost scope

The sole numerical workload dictionary is [`RWL-2026-08-25.3`](../cost/reference-workloads.md). Use its exact scenarios:

- **R0** for disposable synthetic research only, never production;
- **L1** for the lean public band and separate Phase 2-4 planning quantities;
- **A1** for the Azure-aligned band at the same public volume and separate later-phase quantities;
- **G1** for growth planning.

Phase 2 CRM/scheduling comparisons use the R0/L1/A1/G1 Phase 2 dimensions. Phase 3 identity, connectors and customer AI use the R0/L1/A1/G1 Phase 3 dimensions. Phase 4 uses the corresponding Phase 4 dimensions. No independent seat, tenant, storage, connector-call, token or payment table in this artifact overrides that version.

Customer-platform services, usage, incremental control labor, funded coverage and professional review are separate **full-roadmap reserves**. They are not included in or scored as public-site-only TCO. Any later provider-specific fixture must cite `RWL-2026-08-25.3`, name the scenario ID, show its derivation and remain unscored until a dated quote supports the units.

Cost calculations must use the exact selected region, currency, tax status, contract, model/version, and checkout quote on the calculation date. Dynamic vendor pages did not expose reliable complete price tables during this research; no exact price is asserted.

## Phase 2 CRM

### Hard gates

- Commercial use and an approved DPA/subprocessor/transfer disposition.
- Named CRM data owner; least-privilege seats; phishing-resistant MFA for administrators.
- Structured export of contacts, companies, deals, notes, activities, consent receipts, suppression, and audit evidence.
- API/webhook or documented batch export that supports correction, deletion, and exit.
- Purpose and communication-channel consent are distinct. A CRM record is not consent to marketing.
- No connector tokens, file contents, customer-AI prompts, or raw payment data in CRM.

### Options

| Option | Fit | Limits, licensing, data-use evidence | Portability / burden | Disposition |
|---|---|---|---|---|
| HubSpot Free → paid hubs | Candidate for basic contacts/deals/tasks and a small-business pipeline | Official pricing currently identifies Free Tools, but exact seats, contact/automation limits, export/deletion, DPA/region, cancellation and commercial terms were not established [S01]. | Export/API seam required; paid-feature coupling can create lock-in. Administration burden is unmeasured. | **Unranked shortlist / blocked evidence** until dated US tenant and checkout captures close every listed gap. No pilot or marketing automation is authorized. |
| Zoho CRM Free → Standard+ | Candidate CRM; official specifications describe a three-user Free Edition [S02] | Exact storage, automation, API and support limits vary by edition and must be captured at procurement. DPA/region review remains open. | Export/API available in product family; moderate suite coupling. | **Unranked shortlist / incomplete evidence** pending the same approved pricing, contract, privacy, export/deletion, accessibility, outage, rollback, reconciliation, and labor evidence required of every candidate. |
| Dynamics 365 Sales | Candidate with Microsoft ecosystem integration | Microsoft warns published prices vary by currency/country/region and checkout controls actual price [S03]. Per-user licensing and implementation effort are material. | Dataverse/Power Platform coupling; structured APIs, with setup and migration cost requiring measurement. | **Unranked shortlist / incomplete evidence** pending the same approved pricing, contract, privacy, export/deletion, accessibility, outage, rollback, reconciliation, and labor evidence required of every candidate. |
| Dataverse / Power Apps | Flexible low-code workflow | Requires exact Power Apps/Dataverse licensing and capacity analysis; multiplexing does not remove user-license duties [S32]. | Good Microsoft seam; custom schema, security, ALM and support are Jamula-owned. | Research further only with an approved app/use case. |
| Minimal custom CRM store | Maximum control and portability | Software may be cheap; Jamula owns email capture, pipeline UX, audit, DSAR, security, deliverability, backups and support. | Highest engineering/operational burden; easiest data export. | Reject for Phase 2 unless vendor terms fail or needs become product-specific. |
| Microsoft Lists / spreadsheet | Familiar and possibly already licensed | Not verified as a CRM; weak lifecycle, relationship, consent, audit and row-level authorization controls. | Easy CSV export; high manual-error risk. | **Reject as system of record**; temporary import staging only. |

### CRM boundary

The CRM is authoritative for lead/contact/company, pipeline stage, owner, follow-up, customer communication history, and channel preferences. Identity is authoritative for sign-in identifiers and memberships. Accounting is authoritative for posted invoices/credits. Payment processors are authoritative for payment-method tokens and processor transaction state. Connector and AI stores contain only their own tenant-scoped metadata.

## Phase 2 scheduling

| Option | Evidence and constraints | Disposition |
|---|---|---|
| Microsoft Bookings + Teams | The current service description says Bookings provides a web booking calendar, syncs with Outlook, integrates with Teams for virtual appointments, links to Microsoft 365 business/enterprise plan comparisons, and lists features by the broad “Small Business” and other categories [S04]. It does not establish Jamula's exact US SKU, Teams/Exchange/organizer entitlement, seats, limits, export/deletion, DPA/region or cancellation. | **Unranked shortlist / blocked evidence** pending symmetric approved pricing, contract, privacy, export/deletion, accessibility, calendar-conflict, outage, rollback, reconciliation, and labor evidence. Disable recording/transcription by default if later selected. |
| Zoom Scheduler | Official FAQ documents Scheduler as a Zoom add-on; a search result showed a current numeric price, but the price page was inaccessible, so price is **unverified** [S05]. Verify organizer license, meeting limits, data region, recording/transcription/AI Companion defaults, DPA and cancellation flow. | **Unranked shortlist / incomplete evidence** pending the same symmetric approved evidence as every scheduling candidate. Disable recording/transcription by default if later selected. |
| CRM-native meeting scheduler | May reduce lead handoff but couples scheduling and CRM licensing/data; provider-specific evidence has not been approved. | **Unranked shortlist / incomplete evidence** pending the same symmetric approved evidence as every scheduling candidate, including Teams/Zoom interoperability and calendar-conflict controls. |
| Custom scheduler | Owns availability, time-zone, email, abuse, conflict, accessibility and calendar integration risk. | Reject for Phase 2. |

Collect only name, business email, company, time zone, meeting purpose category, optional short note, consent/notice version, and calendar event identifiers. Do not ask for sensitive case details. Rate-limit public booking; prevent calendar enumeration; send equalized availability responses; redact meeting notes from telemetry.

## Phase 3 identity and authorization

Microsoft Entra External ID, Auth0, Clerk, Supabase Auth, and Firebase Authentication are unranked, incomplete-evidence candidates. Apply the same commercial terms and pricing, lifecycle, MFA, recovery, administrator control, audit/log retention, customer-tenant model, DPA/subprocessor/region/transfer, accessibility, availability/support, export/deletion, portability, and application-authorization integration gates to each. No comparative rank or vendor selection is supported.

| Option | Evidence and constraints | Disposition |
|---|---|---|
| Microsoft Entra External ID external tenant | Official feature matrix distinguishes external customer tenants, MAU pricing, roles, local/social identities, and current feature gaps [S06]. Dynamic pricing did not yield a usable rate; exact MAU/SMS/custom-domain/P1-related costs are unverified. | **Unranked / incomplete evidence** pending every symmetric identity gate and approved mechanism evidence. |
| Auth0 / Clerk | Mature customer identity alternatives with developer-oriented integrations. | **Unranked / incomplete evidence** pending every symmetric identity gate and approved mechanism evidence. |
| Supabase / Firebase auth | Low-cost application-platform options. | **Unranked / incomplete evidence** pending every symmetric identity gate and approved mechanism evidence; do not couple identity selection to database convenience. |
| Self-built authentication | Maximum control but Jamula owns credential, recovery, MFA, abuse and vulnerability lifecycle. | Reject. |

Roles are application concepts: `customer_viewer`, `customer_member`, `customer_billing`, `customer_admin`, `support_readonly`, and `jamula_admin`. The identity provider authenticates; the portal resolves a server-side membership to one immutable internal `tenant_id`. Every object, query, cache key, index, queue message and audit event carries that tenant. Missing or conflicting tenant context fails closed. See `docs/architecture/customer-platform.md`.

Privileged Jamula administrators use phishing-resistant passkeys/FIDO2 and conditional access; sensitive exports, membership/domain changes, connector changes, payment portal creation, support access and recovery require recent step-up. Microsoft documents phishing-resistant authentication strengths and notes Conditional Access licensing [S07], while passkeys are available across Entra editions [S08]; exact workforce license procurement remains open.

## Phase 3 connectors and customer AI

### Connector disposition

| Provider | Minimum documented approach | Current evidence | Preview / GA |
|---|---|---|---|
| OneDrive/SharePoint | Delegated picker; evaluate `Files.Read` versus Selected permissions and explicit assignment [S11][S12] | Documented research; live app/tenant/consent prohibited | Blocked for preview until packet passes; required for GA |
| Google Drive | Google Picker plus non-sensitive `drive.file`, limited to files selected/shared with the app [S15][S16] | Documented research; live project/verification/consent prohibited | Blocked for preview until packet passes; required for GA |
| Box | OAuth 2.0 with the narrowest configured/read-only scope, picker, rotating refresh tokens and V2 webhooks [S20]-[S24] | Documented research; live app/enterprise/consent prohibited | Blocked for preview until packet passes; required for GA |

Packets are under `docs/spikes/connectors/`.

### Read-only AI gates

- A request is `(tenant_id, user_id, session_id, allowed_connector_grants, purpose)`; none is accepted from an untrusted body without server-side resolution.
- Separate object storage prefixes/containers, metadata partitions, vector indexes/namespaces, encryption context and caches per tenant. No global semantic cache.
- Revalidate current source ACL and connector grant at retrieval time. Webhook/change feeds reduce staleness; a scheduled full reconciliation bounds it. Revocation, deletion, expiry, unknown ACL or unavailable policy enforcement immediately deny and invalidate previews, chunks, embeddings, citations and caches.
- Treat retrieved content as untrusted data. Strip active content, preserve provenance, scan files, constrain types/sizes, isolate parsers, mark source boundaries, and instruct the model never to follow retrieved instructions as authority.
- Return grounded citations to authorized source/version. If grounding is insufficient, say so and offer human escalation.
- No file mutation, share, message, payment, CRM update, connector administration, arbitrary URL fetch, plug-in, code execution or other action tool. A future action needs its own issue, threat model, allowlist, step-up and explicit confirmation.
- Do not log prompt/file content by default. Redact identifiers; separate abuse/security telemetry; disclose provider monitoring and retention. Use non-stateful inference unless a separately reviewed feature requires storage.
- Enforce per-tenant concurrent request, request/day, input/output token, retrieved-byte and monthly spend budgets. Owner: platform on-call. At 80% alert and reduce limits; at 100% disable AI for that tenant while portal/file access remains available. Recovery requires owner review. Provider billing and budget alerts, including Azure Budget alerts only if Azure were later selected, are advisory rather than the hard cap.
- Test cross-tenant retrieval, guessed IDs, stale ACLs, poisoning/prompt injection, malicious files, citations, moderation, model/version change, deletion propagation, provider outage, denial-of-wallet and human escalation before preview.

Microsoft states that prompts/completions/embeddings for models sold by Azure are not made available to other customers or model providers and are not used to train foundation models without permission; deployment type controls processing geography [S09]. This is unranked candidate evidence only, not an inference-vendor, seller, model, hosting, deployment or geography selection. It requires DPA, data-use, retention, subprocessor and product-terms review plus deployment-specific verification. Current pricing is dynamic and did not render numeric values [S10]; this pass captured no symmetric evidence supporting a comparative conclusion.

## Decision gates and actions

1. **Cyrus:** approve exact workload dictionary `RWL-2026-08-25.3`, any later CRM/scheduling selection, identity direction, allowed regions, and a zero-live-action evaluation posture.
2. **Geordi:** use only R0/L1/A1/G1 from `RWL-2026-08-25.3` and calculate customer-platform full-roadmap reserves separately from public-site TCO after dated checkout evidence; include labor, coverage, verification, messaging, storage, egress, AI and payment sensitivity.
3. **Miles:** threat-model and later test identity, IDOR, connector, webhook, AI and payment boundaries.
4. **Sarek / qualified professionals:** review privacy bases, DPAs/transfers, records/retention, AI disclosures, PCI validation, tax/accounting, auto-renewal, refunds and contract assent.
5. **Rai:** review customer-AI purpose, transparency, harmful-content handling, human escalation, accessibility and disproportionate impact.
6. **Fact Checker:** re-open every dynamic or partially verified source immediately before ADR approval.
7. Create provider-specific implementation/remediation issues only after #6 is incorporated; each must inherit the future tests in the connector packets. Do not claim availability before evidence passes.
