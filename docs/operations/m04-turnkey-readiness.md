# M04 turnkey operations readiness

**Status:** Unapproved, non-production research and proposed runbooks for
[#186](https://github.com/Jamula/Jamula-www-Website/issues/186),
[#187](https://github.com/Jamula/Jamula-www-Website/issues/187), and
[#193](https://github.com/Jamula/Jamula-www-Website/issues/193). No provider,
terms, spend, account, integration, or production operation is approved here.
No tenant, payment, export, deletion, accessibility, or reconciliation test
was performed. This is not legal, accounting, tax, or PCI advice.

The official vendor sources linked below were read on **2026-11-28 UTC**. The
prices are public USD list-price observations, not Jamula quotes; selected
plans, regions, taxes, entitlements, and contract versions can change the
result. Sources describe vendor features or terms, not tested controls. The
historical [customer-platform options](../research/customer-platform-options.md)
and [payments evaluation](../payments/phase-4-evaluation.md) retain their
original review status. Attio and Cal.com are additional leads named in #186,
not additions to an approved shortlist. No candidates are ranked or selected.

## CRM and scheduling evidence

Each candidate remains **blocked on incomplete evidence**. For every candidate,
capture the exact US plan/checkout and commercial-use terms, applicable DPA,
processing and backup locations/transfers, subprocessors, supported structured
export, subject-specific deletion, cancellation, accessibility, outage and
rollback, calendar conflicts, and operating labor. Capture a dated quote and
recheck prices within 30 days and on a material change. An untested vendor claim
is not a passed gate.

### CRM candidates

- **HubSpot Free:** The [HubSpot free CRM page](https://www.hubspot.com/products/crm)
  lists no-cost use with up to two users and 1,000 contacts. Its
  [September 2026 DPA](https://legal.hubspot.com/dpa) distinguishes processor
  data from controller-to-controller processing for enrichment or tracking
  with intent-data sharing. Its [hosting FAQ](https://knowledge.hubspot.com/account-security/hubspot-cloud-infrastructure-and-data-hosting-frequently-asked-questions)
  says account data-center assignment depends on signup geolocation and that
  free accounts must upgrade to change location; some processing can occur
  outside the assigned location. Its [export guide](https://knowledge.hubspot.com/account-management/export-your-content-and-data)
  lists multiple data types but warns that not all account data can be merged.
  [Permanent contact deletion](https://knowledge.hubspot.com/privacy-and-consent/how-do-i-perform-a-gdpr-delete-in-hubspot)
  is individual, may take up to 30 days to purge, and can leave other data
  requiring separate handling. The [cancellation guide](https://knowledge.hubspot.com/account/how-do-i-cancel-my-hubspot-account)
  describes free-account deletion and paid cancellation at the end of the
  commitment. Exact paid pricing, actual account region, all required export
  types, DPA applicability, permissions, and complete exit remain unverified.
- **Zoho CRM Free:** Zoho's [free-edition guide](https://www.zoho.com/crm/what-is-zoho-crm-free-edition.html)
  lists three users and 5,000 contacts. Its [US pricing page](https://www.zoho.com/en-us/crm/zohocrm-pricing.html)
  says Free includes data export up to ten times; the precise limit/reset and
  complete field coverage need confirmation. The free-edition guide says
  deleted records remain in the recycle bin for 60 days and can be retrieved
  through the API for up to 120 days. Zoho's
  [privacy policy](https://www.zoho.com/privacy.html), updated December 2025,
  says service data is deleted from active databases within six months after
  account termination and from backups within three months thereafter; it also
  says customers can request a DPA. These are not proof of the timing of an
  individual rights request. Obtain the applicable DPA, exact region,
  subject-deletion and account-closure procedures, and evidence addressing the
  proposed processor-deletion target before selecting this option.
- **Attio Free:** The [Attio pricing page](https://attio.com/pricing) lists
  $0 for up to three users, 50,000 records, and three objects. Its
  [plan guide](https://attio.com/help/reference/workspace-settings-billing/attio-plans-and-features)
  says new workspaces start with a 14-day Pro trial, Free data is visible and
  editable by all workspace users, and automatic enrichment is included. The
  [services agreement](https://attio.com/legal/services-agreement) permits
  internal business use and describes renewal notice requirements. Attio's
  [September 2026 DPA](https://attio.com/legal/attio-data-processing-addendum)
  provides 30 days of post-termination export and deletion on request within
  30 days if it still holds the customer personal data, subject to its terms.
  The [workspace export](https://attio.com/help/reference/imports-exports/back-up-your-workspace-data)
  excludes emails; meetings require an API export. Demonstrate complete
  required communication-history export, compatible least-privilege controls,
  enrichment choices, actual regions, and cancellation for the chosen plan;
  none is established by these pages.

### Scheduling candidates

- **Microsoft Bookings/Teams:** Microsoft's [US Business Basic page](https://www.microsoft.com/en-us/microsoft-365/business/microsoft-365-business-basic)
  lists the offer with Teams at $7/user/month on an annual subscription or
  $8.40/user/month monthly and includes Bookings; it does not establish
  Jamula's existing entitlement or incremental cost. The
  [Teams Bookings admin guide](https://learn.microsoft.com/en-us/microsoftteams/bookings-app-admin)
  requires Exchange Online and appropriate Teams meeting licenses for staff;
  it also says SMS notifications are on by default for the described feature.
  Microsoft publishes a [November 2026 DPA](https://www.microsoft.com/licensing/docs/view/Microsoft-Products-and-Services-Data-Protection-Addendum-DPA),
  but the applicable tenant agreement and geography are unverified. The
  [Shared Bookings report](https://learn.microsoft.com/en-us/microsoft-365/bookings/reporting-info)
  exports four-month TSV views, not proof of a complete exit export.
  [Deleting a shared page](https://learn.microsoft.com/en-us/microsoft-365/bookings/delete-calendar)
  deletes its mailbox and all bookings; it is not a subject-specific deletion
  procedure. Verify the actual SKU, staff/calendar permissions, retention,
  individual deletion, complete export, and cancellation terms.
- **Cal.com Individuals:** [Cal.com pricing](https://cal.com/pricing) lists a
  free one-user plan; the page does not establish a US/EU hosting choice for
  that plan. The [terms](https://cal.com/terms) permit internal business use,
  describe paid renewal cancellation at the end of the billing period, and
  distinguish cancellation from account closure. The
  [privacy policy](https://cal.com/privacy), effective November 2026, describes
  US processing with some subprocessors elsewhere. Its
  [DPA v2.3](https://cal.com/dpa), effective November 2026, provides at least
  30 days for export after termination, followed by deletion normally within
  90 days; backup retention and controller data are separately qualified.
  This does not establish individual-request deletion timing. Its
  [booking guide](https://cal.com/help/bookings/manage-a-booking) says deleting
  a booking does not notify attendees. Verify complete structured export,
  account closure, actual regions, recording defaults, and target compatibility.

Zoho's account-termination schedule and Cal.com's post-termination schedule
are materially longer than the ordinary-processor **30-day proposed target**
in [data lifecycle](../privacy/data-lifecycle.md#retention-and-deletion).
They do not by themselves establish the individual-request SLA or legal
noncompliance. Obtain provider-specific evidence and a qualified counsel
disposition; do not silently waive the target or characterize either as passed.

## Proposed CRM and scheduling operating procedure

1. Cyrus must approve the provider, permissible use and spend, actual signup or
   disposable test, data categories, markets, notices, role owners, and
   recording/transcription policy before configuration. Counsel must review
   privacy, transfers, messaging, vendor terms, and retention. Record exact
   artifact version, reviewer, scope, conditions, expiry, and re-review triggers.
2. With separately authorized disposable resources and synthetic data, verify
   least-privilege seats and administrator MFA, purpose versus channel consent,
   suppression and withdrawal, contact/deal/activity and consent export,
   booking/calendar conflict behavior, subject deletion and backup behavior,
   outage and rollback. Record actual observed results and unresolved gaps;
   never infer success from a vendor page. No real customer data or live
   connections are authorized by this document.
3. Before any booking page is made available, verify recording and transcription
   are off by default, review SMS and AI/enrichment settings, and test keyboard,
   screen-reader, zoom/reflow, time-zone, and accessible equivalent fallback.
   Collect only the approved minimum; CRM presence is not marketing consent.
4. #186 proposes `hello@jamula.net`, but the
   [approved current inquiry path](../content/public-claims-register.md) is
   `spam@jamula.net` with plain-text fallback. `hello@jamula.net` existence and
   delivery are unverified. Do not publish or substitute it until Cyrus confirms
   the working mailbox and approves the exact wording. Adding a scheduling
   widget or CRM intake also requires its separate privacy/legal/security gate.

## Proposed export, deletion, and cancellation runbook

This is a future procedure for an approved provider, not an instruction to
close an existing account or delete data now.

1. A designated data owner inventories each data class, processor, connected
   calendar/mailbox, region, retention rule, and lawful hold. Identify the
   requester or accountable exit owner, verify authority, and log a minimal
   request reference, scope, deadline, and status in an approved restricted
   system. Follow the [data-subject and hold process](../privacy/data-lifecycle.md#data-subjectcustomer-requests).
2. Suspend new collection when appropriate. For an authorized export, obtain
   contacts, companies, deals, notes, activities and communication history,
   consent/withdrawal/suppression, relevant scheduling history and audit
   evidence in documented formats. Compare counts, relationships, field
   mappings, time ranges, and a sample restoration in an approved isolated
   destination. Record omissions and keep the gate blocked if required data
   cannot be exported; do not treat Attio's workspace CSV or Bookings' TSV as
   complete merely because it downloaded.
3. For an individual request, identify and remove or restrict only the
   applicable person's records in every approved system, including connected
   calendars, CRM copies, exports, and processors. Track exceptions, retries,
   backup expiry, and provider confirmation; preserve only authorized
   suppression, financial/audit records, or counsel-approved holds. Confirm
   that a restored backup cannot reintroduce deleted data. A provider's
   account-termination schedule is not an individual-request SLA.
4. For full exit, reconcile the final export and outstanding bookings, cancel
   future appointments with appropriate notice, revoke authorized integrations,
   then follow the selected plan's documented cancellation and account-closure
   steps. Confirm renewal stops, required data is deleted, remaining backup
   and legal retention are recorded, and access is revoked. Do not delete a
   Microsoft shared booking mailbox to satisfy a request about one person.
   Cal.com booking deletion does not notify attendees; cancel or separately
   notify them when appropriate before deletion.
5. Keep evidence and exported data only in the approved restricted location
   and for the approved retention period. Record dates, scope, and outcomes,
   not personal content or credentials in this repository. An incomplete
   export, unconfirmed deletion, or unresolved hold stays open and escalates to
   the data owner and counsel.

## Hosted payment evidence and boundary

Stripe and accounting-hosted invoicing remain **unranked, unapproved
candidates**. Stripe's [US Payments pricing](https://stripe.com/pricing) lists
domestic cards at 2.9% + $0.30 and ACH Direct Debit at 0.8%, capped at $5;
Payment Links are included with Payments. [Invoicing Starter](https://stripe.com/invoicing/pricing)
lists 0.4% per paid invoice plus payment fees, and
[Billing pay-as-you-go](https://stripe.com/billing/pricing) lists 0.7% of
Billing volume. These are separate product price observations: determine the
actual applicable combination, account terms, FX, refunds/disputes, payout
charges, taxes, reserves, and labor before estimating total cost.

Stripe's [Invoicing versus Payment Links comparison](https://docs.stripe.com/payment-links)
describes invoices for specific customers and links usable by anyone holding
them, potentially more than once. A Payment Link is not automatically
single-use or customer-bound. A [hosted invoice](https://docs.stripe.com/invoicing/hosted-invoice-page)
has a unique, expiring URL, which must still be protected as a bearer link.
The [customer portal](https://docs.stripe.com/customer-management) has
configuration and subscription limitations that require scenario testing.
Stripe's [September 2026 DPA](https://stripe.com/legal/dpa) describes both
processor and controller roles; the applicable agreement, transfer, retention,
and accounting-provider terms require counsel review.

If later approved, use full-page provider-hosted payment entry, not an embedded,
proxied, or Jamula-domain card form. Never collect raw PAN/CVC, bank
credentials, or usable payment credentials in Jamula domains, logs, CRM, or
the repository. Do not add a custom payment backend or credential store for
M04. The processor owns transaction state, accounting owns posted
invoices/credits and the ledger, and the bank establishes settlement; the
website is not the ledger. A future application projection remains subject to
the separate tenant, verified-webhook, idempotency, and reconciliation controls
in the historical payments evaluation; the manual runbook below does not
implement that projection.

## Proposed processor-to-accounting-to-bank reconciliation

Before any payment testing, obtain the applicable counsel, acquirer/payment
brand or qualified QSA/ISA, and broker reviews required by the
[professional gates](../legal/phase-review-gates.md). Before accepting value,
also obtain CPA review and Cyrus's provider, accounting, roles, terms, spending,
and exact-version approvals. A hosted flow is not proof of PCI exemption.
Assign an operator and independent reviewer/backup, and define restricted
storage, exception ownership, and a response deadline before the runbook is used.

1. On each business day, the operator obtains the approved processor activity
   and accounting records for the same account, mode, currency, and defined
   period, plus the bank settlement statement when available. Use minimum
   necessary data and opaque invoice/customer references; never put payment
   credentials or raw financial exports in the repository.
2. Match each processor payment, refund, and dispute by stable processor ID and
   approved invoice/credit reference to accounting. Match accounting credits to
   processor events when applicable; track unapplied credits separately.
   Confirm currency, gross, fees, net, and status; do not mark a pending/failed
   payment as settled or create duplicate postings. The CPA determines tax,
   revenue, fee, credit, FX, and dispute treatment.
3. For automatic payouts, use Stripe's
   [payout reconciliation report](https://docs.stripe.com/reports/payout-reconciliation)
   and itemized rows grouped by `automatic_payout_id`. Its reporting window
   is based on when the payout affects Stripe's balance, not bank arrival.
   Sum the included signed net amounts, compare them to the payout, then
   match the payout to a bank deposit using available references, account,
   currency, amount, and timing. If a bank statement lacks a payout ID, require
   enough independent evidence to establish a unique match; never match solely
   on amount or date.
4. For manual or instant payouts, Stripe cannot automatically attribute each
   payout to transactions. Use the [balance summary report](https://docs.stripe.com/reports/balance)
   to reconcile the whole balance: opening balance plus signed non-payout
   activity minus net outbound payout movements equals closing balance, by
   currency. Use the report's categories so payout returns and reversals are
   counted exactly once. Reconcile each payout separately to the bank.
   Distinguish pending activity, statement timing, and any FX conversion rather
   than forcing equal dates or mixing currencies.
5. Quarantine missing, duplicate, ambiguous, wrong-account/mode/currency, or
   mismatched rows. Record the exception owner, evidence reference, age, and
   resolution; escalate material or unresolved differences to the reviewer
   and CPA. Do not invent a match or post an unapproved adjustment. The
   independent reviewer signs off the period only after all required matches
   and exceptions are resolved or explicitly accepted under approved policy.

**Synthetic example, USD:** An automatic payout includes a $100.00 charge
with a $3.20 fee (net $96.80), a $20.00 refund (net -$20.00), and a
$0.80 adjustment (net -$0.80). Signed itemized net totals
`96.80 - 20.00 - 0.80 = 76.00`; a uniquely matched $76.00 bank deposit clears
that payout. Do not subtract the $3.20 fee again from net. This is illustrative,
not an actual transaction, fee quote, accounting entry, or completed test.

## Exit gate

All three issues remain open. #193 depends on #186 and #187. Closing the
milestone requires verified candidate-specific controls, approved privacy
notice and export/deletion and reconciliation runbooks, qualified professional
reviews, and Cyrus's approval of the exact resulting versions. Public
documentation, a merged PR, or this research alone does not satisfy those gates.
