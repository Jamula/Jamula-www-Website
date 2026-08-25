# Phase 4 hosted payments evaluation

**Decision context:** Refs #3; child #6
**Independent correction revision owner:** Geordi La Forge; Seven of Nine, Miles O'Brien, Sarek and Nyota Uhura are locked out from this rejected revision
**Status:** independently remediated documented research and processor-neutral architecture only; this revision is not approval, a vendor decision, professional advice, or new evidence, and no account, processor, MCP, credential, checkout, invoice, webhook, payment or charge was created
**Source register last verified:** 2026-08-24; remediation revised 2026-08-25 without re-verifying or adding evidence

## Architecture posture and candidate set

Preserve a processor-neutral facade and require a **full-page provider-hosted redirect** for consulting invoices, deposits/milestones and recurring retainers. The retained **unranked documentation candidate set** is Stripe, Square, PayPal and accounting-system hosted invoice flows. The currently captured official material differs in depth, so it cannot support a comparative conclusion. No provider is preferred or chosen; every retained candidate must pass the same gates below before any future decision. Braintree is an unverified research lead outside that set, not a retained candidate.

This is not a vendor approval. Cyrus has not approved a processor, terms, spend or live test mode. Sarek and qualified counsel/CPA review PCI, tax/nexus/B&O, revenue recognition, invoice requirements, recurring assent/renewal, cancellation/refund, sanctions/KYC, insurance and records. The acquirer/payment brands or a QSA confirm the applicable PCI SAQ.

## Non-negotiable design

- Jamula never stores, processes, transmits or logs PAN, CVC, magnetic-stripe/chip data, bank-login credentials or equivalent raw payment credentials.
- Use an ordinary link/HTTP redirect to the processor's hosted page, not Jamula-hosted Elements, iframe or proxied form. Embedded hosted forms can add script-security eligibility concerns; confirm current SAQ A criteria and scope [S34][S42].
- No payment capability in Phases 1–3. Earlier code provides only an inactive interface/configuration seam.
- Tenant authorization and recent phishing-resistant step-up occur before creating an invoice/payment/customer-portal session. Hosted URLs are short-lived/single-purpose where supported and never exposed to another tenant.
- Browser return/success URL is not payment evidence. Only verified webhook plus processor API retrieval and reconciliation can change state.
- Processor, environment and endpoint secrets are least privilege, vaulted, separated and rotated. Test and live accounts/keys/webhooks/data never mix.
- The website/portal is a display/workflow layer, not an accounts-receivable, general, tax or cash ledger.

## Supported business flows

| Flow | Hosted target | Jamula role | Required controls |
|---|---|---|---|
| Consulting invoice | Processor-hosted invoice page | Request link for an approved accounting/CRM invoice; display normalized status | Exact customer/tenant mapping, amount/currency read-only, expiry, partial-payment policy, receipt, daily reconciliation |
| Project deposit/milestone | Hosted invoice or Checkout session tied to contract/milestone | Create single-purpose session after authorized billable event | No arbitrary customer-entered amount unless approved; contract reference, refund/cancellation terms, idempotency |
| Recurring retainer/subscription | Hosted Checkout/invoice plus hosted customer portal | Initiate approved plan and redirect customer for self-service | Explicit price/cadence/trial/renewal/cancellation assent, proration policy, retries/dunning, mandate/payment-method rules |
| Receipt/payment history | Processor/accounting-hosted or portal read-only projection | Display minimal status/document link | Tenant authorization; no sensitive method details beyond provider-approved brand/last4; source/timestamp shown |
| Refund/credit | Accounting/processor administration, not public portal action initially | Display resulting status | Role/step-up/dual approval threshold, immutable reason, credit memo, customer notice, reconciliation |
| Dispute/chargeback | Processor system | Link case to tenant/invoice; support workflow | Restricted evidence, deadlines, no cross-tenant documents, accounting treatment and immutable audit |
| Failed payment | Processor dunning/customer portal | Show status and hosted update link | Do not collect replacement card; notification consent/channel, retry limits, human escalation |
| Cancellation | Hosted customer portal or approved contract workflow | Redirect/display effective date | Clear effect, final invoice/refund, data retention, proof of request and no dark patterns |

## Systems of record

| Record | Authority | Jamula portal may retain |
|---|---|---|
| Customer relationship, opportunity, project and contract reference | CRM / executed contract repository | Opaque IDs and display-safe project label |
| Approved billable item/invoice/credit, tax treatment and general ledger | Accounting system | Opaque invoice ID, amount/currency/status/due date/document URL |
| Payment method token, hosted page/session, authorization/capture, processor transaction/subscription, dispute | Payment processor | Opaque processor IDs, normalized status and timestamps; brand/last4 only if necessary |
| Cash settlement | Bank; reconciled in accounting | Reconciliation result/reference, not bank credential |
| Customer tenant/membership/role | Jamula tenant store | Authoritative |
| Contract/renewal/cancellation assent | Approved contract/e-sign or billing evidence store | Version/hash/time/actor/tenant and processor reference |
| Security/payment event audit | Jamula append-only audit | Event ID/type/result/reason with no card data |

Conflicts do not use last-write-wins. Quarantine, compare processor/accounting/bank, and require an authorized reconciliation adjustment.

## Retained unranked candidates and research leads

Dynamic commercial pages did not reliably expose complete current fee tables, and exact fees vary by country, method, volume, plan and contract. No exact fee is asserted. Procurement must capture date-stamped US checkout/written quotes.

| Option | Classification | Provider-specific documented facts | Known gaps |
|---|---|---|---|
| Stripe Checkout + Invoicing + Billing/customer portal | **Retained unranked candidate / incomplete evidence** | Full-page hosted checkout supports one-time/subscription payments [S26]. Hosted invoices cover one-time/recurring, partial-payment and reconciliation features [S27]. Customer portal supports invoice/payment-method/subscription self-service [S28]. Raw-body signature verification is documented [S29]. | Card/ACH/wallet fees; Billing/Invoicing fees; international/FX; disputes/refunds; instant payout; Tax/accounting add-ons; minimum/volume contract; reserves/holds; subscription/invoice-object and dunning portability. |
| Square Invoices + Payment Links + Subscriptions | **Retained unranked candidate / incomplete evidence** | Payment Links provide processor-hosted payment and reporting [S30]; official Square invoice/subscription pages require a dated follow-up. | Free/paid invoice plan; online/card-on-file/ACH rates and caps; recurring features; international/FX; disputes/refunds; payouts; accounting/API access; portal and portability evidence. |
| PayPal Checkout / invoicing / subscriptions | **Retained unranked candidate / incomplete evidence** | Standard Checkout covers immediate and authorize/capture and server-side refunds [S31]. Webhooks support HTTPS, retries and cryptographic verification [S33]. | PayPal/card/Pay Later/ACH methods; fixed and percentage fees; cross-border/FX; disputes/refunds; payout/holds; invoice/subscription fees; accounting export; hosted-card PCI boundary; invoice/retainer/customer-portal coherence. |
| Braintree | **Unverified research lead outside the retained candidate set** | No current official evidence was captured in this pass. | Pricing; product status; hosted UI; vault/subscription and PayPal linkage; webhooks; DPA; export and migration are unverified. |
| Accounting-system hosted invoices (for example QuickBooks/Xero) | **Retained unranked candidate / incomplete evidence** | These flows may keep invoice authority near the ledger; no provider-specific accounting-hosted flow was researched sufficiently in this pass. | Processor and hosted methods; recurring retainers; fees; payout/reserve/dispute handling; API/webhook; region; accounting subscription; portability. |

Only the four retained-candidate rows share the disposition **unranked documentation candidate with incomplete evidence; no vendor decision**. Braintree cannot be shortlisted, scored, selected or mechanism-tested until current official evidence is captured and the candidate set is amended through the same approved symmetric gate. For each retained candidate, record each gate as verified, unverified, contradicted or needing investigation; any missing or failed gate blocks further consideration:

| Symmetric gate | Required evidence for every retained candidate and any approved candidate-set amendment |
|---|---|
| Fees and commercial terms | Date-stamped US written quote or checkout capture for methods, fixed/percentage charges, platform/invoice/subscription add-ons, FX, refunds, disputes, payouts, minimums, volume terms, tax and cancellation. |
| DPA and data handling | Approved DPA; processor/controller roles; regions/transfers; subprocessors; retention/deletion; KYC/sanctions/fraud data; analytics/model use; support access and breach terms. |
| Payout, reserve and dispute behavior | Payout timing, holds/reserves, working-capital impact, dispute/refund workflow, evidence handling, deadlines and accounting treatment. |
| Portability and exit | Structured export, API/webhook coverage, vault/network-token migration limits, customer re-entry, dual-run reconciliation, rollback and deletion/closure evidence. |
| Accounting | Invoice/credit/tax authority, general-ledger and bank-reconciliation boundary, exact integration behavior, export and CPA-reviewed treatment. |
| Accessibility | Keyboard, screen-reader, zoom and reflow evidence for hosted payment, invoice and self-service surfaces, plus an equivalent supported non-card fallback. |
| Professional review | Qualified counsel, CPA, acquirer/payment brands or QSA, and other named professionals complete the applicable PCI, tax, accounting, contract, renewal/refund, sanctions/KYC, insurance and records reviews. |
| Future mechanism tests | Under separately approved test-mode resources, execute the tenant isolation, hosted redirect, webhook, idempotency, failure/reconciliation, accessibility, fee-statement, export/migration and teardown tests in this artifact without treating test evidence as production proof. |

A Wix, WordPress or other turn-key payment app is an implementation-pattern comparator/research lead, not a retained processor candidate or a route around these gates. Such a shell adds platform/app/plugin parties and may obscure processor, PCI, webhook and system-of-record boundaries. Any future shell evaluation must preserve provider-hosted card entry, direct merchant ownership, export, webhook verification and portal tenant isolation.

## Reference workloads and cost method

The sole numerical workload authority is [`RWL-2026-08-25.3`, Phase 4 hosted-payment dimensions](../cost/reference-workloads.md#phase-4-hosted-payment-dimensions). Use its exact **R0, L1, A1 and G1** values for successful payments/gross volume, active recurring retainers, ACH/bank-debit mix, international/FX, refund count and dispute count. This artifact intentionally does not repeat or extend those values.

Accounting seats and licenses are **not workload dimensions or demand assumptions**. For every retained candidate, capture the exact accounting product, edition, seat type/count, integration/add-on license, contract term, region/currency, tax treatment, quote date and written quote or checkout evidence as separate unapproved quote inputs. The candidate packet owner must update those inputs whenever product, contract, region, seat need or quote changes; an absent input remains unpriced and blocks cost comparison.

For each retained candidate's provider packet, Geordi calculates:

`monthly processor cost = Σ(method percentage × method volume) + Σ(method fixed fee × transaction count) + billing/invoice/platform fees + FX/international + disputes/refunds + payout + tax/accounting integration`

Report monthly, first-year and three-year ranges; include setup/integration, professional/QSA review, verification, support, reconciliation labor, migration/export and taxes. Record payout timing and working-capital/reserve risk, not only transaction fees. Reverify price after 30 days and immediately on contract/region/product change.

## Tenant-aware hosted flow

1. Customer signs in; server resolves immutable tenant and `customer_billing`.
2. Step-up is required. Server loads the approved invoice/retainer from its authority using `(tenant_id, invoice_id)`.
3. Payment facade sends only minimum amount/currency/customer/opaque references to processor with an idempotency key. Never put sensitive data in metadata or return URLs.
4. Server returns a processor-hosted HTTPS URL; browser leaves Jamula for card/bank entry. Clearly announce provider, new context, privacy/terms and accessible fallback.
5. Return page says “processing” and queries Jamula normalized state. It never trusts URL query or browser payload as paid.
6. Webhook ingress preserves raw bytes, authenticates signature/timestamp, rejects replay, stores `provider + event_id` idempotency, retrieves current processor object, resolves opaque tenant/invoice mapping and applies an allowed state transition.
7. A duplicate/out-of-order/unknown/tenant-mismatched event is safely ignored or quarantined and alerted. It never guesses.
8. Reconciliation compares processor transactions/payouts, accounting invoices/credits and bank settlement daily on business days. Differences have owner, aging and resolution audit.

## Webhook and event controls

- Dedicated TLS endpoint per environment/provider; request size/content-type limits and rate controls.
- Verify with current and overlap-rotation secret/certificate using original body. Validate timestamp tolerance and expected account/mode. PayPal documents self-verification and delivery retries [S33]; Stripe documents original-body signature verification [S29].
- Acknowledge only after durable receipt or use documented safe retry semantics. Queue encrypted minimal payload; poison events quarantine.
- Idempotent state machine allows only known transitions. API fetch defeats forged/stale payload. Never execute arbitrary URLs or deserialize unsafe objects.
- Redact secrets, full billing/contact details and raw payload from routine logs. Preserve minimal encrypted raw event only when approved for diagnosis/dispute, maximum 30 days proposed.
- Monitor invalid signatures/replay, event gaps, processing age, duplicate rate, reconciliation breaks, mode/account mismatch and endpoint disablement. Test secret rotation and provider outage.

## PCI and security scope

A hosted redirect can reduce Jamula's card-data exposure, but **does not make Jamula “PCI exempt.”** Current SAQ eligibility and service-provider responsibilities depend on the actual integration and must be confirmed with acquirer/payment brands/QSA [S34][S42].

- Inventory every payment page, redirect, script, DNS record, administrator, provider and data flow.
- Protect the pre-payment portal and invoice-link creation against account takeover, IDOR, content injection and redirect substitution.
- Administrators use phishing-resistant MFA; payout/bank/key/webhook/refund changes use step-up and dual approval where risk requires.
- Signed immutable audit, vulnerability/dependency management, CSP/security headers, domain monitoring and incident response remain required.
- Never ask customers to send card data by email, chat, CRM note, support ticket or phone recording. Redact and incident-handle accidental receipt.
- A payment MCP or operational integration is prohibited until a future vendor decision, provenance/permissions review, test mode and explicit Cyrus approval.

## Privacy, contract and customer experience

- At redirect, state processor identity, purpose, amount/currency, billing cadence, cancellation/refund path, privacy/terms links and whether the processor stores the method.
- Obtain durable assent to price, scope, cadence, trial, auto-renewal, cancellation and material terms before recurring charge. Version/hash evidence and accessibility require counsel review.
- Processor/accounting DPA, roles, regions/transfers, subprocessors, retention/deletion, KYC/sanctions, fraud data, model/analytics use, support access and breach SLA are gates.
- Provide keyboard/screen-reader/zoom/reflow compatible hosted flow or an equivalent supported non-card fallback. A critical accessibility barrier blocks launch.
- Avoid dark patterns. Cancellation should be as clear as signup where required/appropriate; disclose timing, final invoice and refund effect.
- Do not expose one tenant's amount, invoice, receipt, hosted URL, payment method, subscription or dispute to another.

## Portability and exit

Export customers, invoices, credits, payments, refunds, disputes, subscriptions/plans/prices, mandates where legally/technically portable, event history, payout/reconciliation mapping and consent evidence in documented formats. Processor payment credentials may not be portable; record network-token/vault migration support and customer re-entry plan before any future vendor decision.

Keep internal tenant/customer/invoice/contract IDs independent of provider IDs. `PaymentPort` methods are limited to create hosted invoice/checkout/portal session, read state, verify/normalize event and revoke session; business policy does not import provider SDK objects. Exit requires dual-running reconciliation, rollback criteria, final exports and processor deletion/closure evidence.

## Future implementation tests

- Two-tenant invoice/receipt/subscription/hosted-URL IDOR and cache/export isolation.
- Step-up, role, session fixation, redirect substitution and expired/reused hosted-session denial.
- Automated scans verify no PAN/CVC/bank credential enters request logs, analytics, traces, CRM, support, database, queues, backups or error reports.
- Test/live account, key, webhook, product/price and data isolation; least-privilege key denial and rotation.
- Signature missing/invalid/old, replay, duplicate, out-of-order, delayed, unknown, wrong mode/account, wrong tenant metadata, API mismatch and endpoint outage.
- Idempotent create/refund/event/reconciliation; amount/currency/tenant mismatch quarantines.
- Successful/failed/partial payment, ACH delay/return, invoice expiry, retry/dunning, cancellation, refund/credit, dispute and payout reconciliation.
- Hosted accessibility and equivalent fallback; clear renewal/cancellation/refund/processor disclosures.
- Fee model matches real sandbox/test statements where possible without treating sandbox as production price proof.
- Export/migration and account teardown; customer deletion retains only professionally approved financial/compliance records.

## Gates and next actions

1. Cyrus may approve the exact workload dictionary `RWL-2026-08-25.3`, flows, any future processor decision, accounting authority, spend/test accounts and exact live-spike prerequisites only after the symmetric gates are satisfied; none is approved here.
2. Geordi produces date-stamped cost ranges and adapter/hosting effort using the formula above.
3. Miles threat-models and witnesses the future tests.
4. Sarek plus counsel/CPA/QSA/acquirer determine contracts, PCI SAQ, taxes/B&O/nexus, accounting/revenue recognition, KYC/sanctions, auto-renewal, cancellation/refund, records and insurance.
5. Rai reviews fairness, accessibility, harmful/dark-pattern and customer-support impacts.
6. Fact Checker revalidates fees, product status, terms, payout/reserve/dispute and official sources.
7. Only after approval, create a separate remediation/spike issue with test-mode resources and teardown. This document authorizes none.
