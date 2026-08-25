# Platform Cost Model

**Currency/base:** 2026 USD, US region, before signed contract
**Evidence cut-off:** 2026-08-24 Pacific
**Decision status:** Unscored planning arithmetic; not a quote, budget approval,
tax/accounting conclusion or production recommendation
**Context:** `Refs #3; child #8`; Cycle 3 consistency remediation

The controlling workload is
[`reference-workloads.md`](reference-workloads.md)
`RWL-2026-08-25.3`. Cyrus did not approve the rubric/workload before the initial
exploratory score. No TCO score or platform comparison is eligible until dated
quotes replace the reserves below.

Version `.3` makes A1's Phase 1 inquiries/mail and retained logs/retention
identical to L1. The public TCO envelopes below are unchanged because none of their
cells multiplies those workload quantities: they use unquoted composite
external-service bands plus the same P1 14 h/month active-control floor. This is
not evidence that L1 and A1 cost the same. Both remain unquoted and unscored until
exact plan rates and usage formulas replace the reserves.

Source IDs refer to
[`../research/platform-source-register.md`](../research/platform-source-register.md).
No purchase, account, live resource or deployment was made.

## Cost taxonomy

Every future quote-ready row must preserve these separate fields:

1. **Documented vendor rate:** a dated official display or written quote for an
   exact plan/region/billing basis. It is not a complete bill.
2. **External-service planning reserve:** an explicit unquoted allowance for
   missing domains, compute, mail, monitoring, backup, CMS/add-ons and support.
3. **Recurring control labor:** hours by control/cadence multiplied by an approved
   labor rate.
4. **Professional review:** separately quoted accessibility, privacy/security,
   legal/tax/accounting, insurance, PCI or deliverability work.
5. **Tax/overage:** tax sensitivity plus usage reserve; never an asserted tax rate
   or provider cap.
6. **Build/migration/verification:** one-time engineering hours and external costs.
7. **Renewal/reverification:** recurring professional and migration-readiness work.
8. **Exit:** export, clean-host restore, dual run, DNS change and deletion proof.
9. **AI unit fees:** model input/output plus retrieval, vector, storage and egress.
10. **Payment unit fees:** percentage/fixed transaction, billing/invoice, FX,
    dispute/refund, payout and accounting/tax integration.

Labor sensitivity remains **$100-$200/hour**, not an asserted market rate.
Professional reserves require actual scope/quotes. Service-tax sensitivity is
0-15% of external services only; a CPA determines actual treatment.

## Documented rate anchors, not complete prices

| Item | Narrow documented rate/limit | Evidence status | Missing before TCO |
|---|---|---|---|
| Netlify | Displayed $0 / $9 / $20 credit plans [S06] | Current price snapshot; commercial account fit unresolved | Credit consumption, overage/recharge, support, tax, exact eligible account |
| Vercel | Pro displayed at $20/month; Hobby described for personal projects [S07] | Current price snapshot | Exact commercial workload, usage, support, tax and contract |
| Webflow | Displayed site-plan price, including $25 annual-billing Premium [S10] | Snapshot only | Required Workspace+Site combination, exact current naming, overage and export workflow |
| Azure Static Web Apps | Free features and hourly Standard shape [S02] | Partial; no usable Standard USD amount | Region/SKU calculator export, bandwidth, support, monitoring and tax |
| WordPress.com / managed WordPress | Features/export distinctions [S12-S13] | Price blocked / named host absent | Exact plan/contract, plugins/themes, staging, backup/restore, support and renewal |
| Domain and mail | Narrow Namecheap/Azure feature evidence [S18-S19, S24-S25] | Renewal/mail prices blocked | Two-domain renewal, registry lock, mailboxes/messages, deliverability and tax |

These anchors cannot be summed into a bill and award no TCO points.

## Phase 1 external-service reserves

These are broad cash-planning allowances, not quotes. The total row is controlling
for arithmetic; category rows explain coverage and are not mechanically additive
because bundles overlap.

| Public-site scope / month | R0 research | L1 lean | A1 Azure-aligned | G1 growth |
|---|---:|---:|---:|---:|
| Registrar + two-domain renewal | $3-$15 | $3-$15 | $3-$15 | $3-$20 |
| DNS/TLS/CDN/runtime | $0 research only | $0-$100 | $10-$300 | $100-$3,500 |
| Workforce + transactional mail | $0-$20 | $10-$75 | $10-$100 | $100-$1,000 |
| Monitoring/logs/backups | $0 | $0-$50 | $10-$100 | $100-$1,500 |
| CMS/plugins/themes | $0 | $0-$125 | $0-$75 | $50-$750 |
| **Composite external reserve** | **$0-$35** | **$25-$250** | **$50-$500** | **$250-$6,000** |

## Authoritative recurring active-control labor

Seven's
[`incident-detection-response.md`](../security/incident-detection-response.md)
phase operating table is authoritative. The former R0 4-12, L1 15-47, A1 17-55
and G1 30-90 h/month assumptions, plus the former Phase 2/3/4 ranges, are
withdrawn rather than blended with it.

| Highest live phase | Active labor floor | Increment | Coverage cost outside the active hours |
|---|---:|---:|---|
| **P1 public/contact** | **14 h/month** | 14 h/month from no live service | Business-window staffing is required |
| **P2 CRM/scheduling** | **24 h/month cumulative** | **+10 h/month** | Includes the table-defined weekend/holiday checks |
| **P3 portal/connectors/customer AI** | **40 h/month cumulative** | **+16 h/month** | **Funded 24x7 on-call service/rota is additional and unpriced** |
| **P4 payments** | **52 h/month cumulative** | **+12 h/month** | P3 coverage plus payment/accounting escalation remains funded separately |
| **P5 public AI candidate** | **62 h/month cumulative if P4 is also live** | **+10 h/month from P4** | At least P3 coverage and any capacity expansion remain funded separately |

These are planning floors, not quotes or standby coverage-hours. They exclude
actual incidents, remediation, major upgrades, annual professional review and
vendor fees. The authoritative table has no P0/R0 live phase, so research labor
must use approved spike/timesheet evidence rather than a monthly operating
assumption.

No cost is assigned to P3+ 24x7 coverage until one evidenced plan exists: an
internal rota with compensation, leave, training and alternates; a contracted
responder with an SLA; or a managed service with explicit scope and escalation.
A missing staffing plan or quote is not `$0`.

## Phase 1 public-site-only TCO arithmetic

The P1 active-labor floor costs `14 hours x $100-$200 = $1,400-$2,800/month`
using the unapproved labor-rate sensitivity. Tax/overage remains separate. Initial
work is `engineering hours x labor rate + initial professional reserve`.

Monthly endpoints are rounded to the nearest dollar; one- and three-year
endpoints are rounded to the nearest $0.1k only after calculating the underlying
components. They are minimum planning envelopes before the unpriced blockers
listed below, not complete quotes.

| Public scope | External/mo | Control labor | Tax + overage/mo | **Monthly** | Initial engineering | Initial professional | **1 year** | Years 2-3 professional | Exit reserve | **3 years** |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| P1 public/contact — L1 lean external band | $25-$250 | 14h = $1.4k-$2.8k | $0-$288 | **$1,425-$3,338** | 80-200h = $8k-$40k | $2k-$15k | **$27.1k-$95.1k** | $2k-$16k | $0.8k-$8k | **$64.1k-$199.2k** |
| P1 public/contact — A1 Azure external band | $50-$500 | 14h = $1.4k-$2.8k | $0-$575 | **$1,450-$3,875** | 100-260h = $10k-$52k | $2k-$15k | **$29.4k-$113.5k** | $2k-$16k | $0.8k-$8k | **$67.0k-$230.5k** |
| P1 public/contact — G1 growth external band | $250-$6k | 14h = $1.4k-$2.8k | $100-$3.9k | **$1,750-$12,700** | 160-500h = $16k-$100k | $2k-$15k | **$39.0k-$267.4k** | $2k-$16k | $2k-$16k | **$85.0k-$604.2k** |

Formulas:

- `monthly = external + recurring control labor + tax/overage`;
- `year 1 = 12 x monthly + initial engineering + initial professional`;
- `three years = 36 x monthly + initial engineering + initial professional
  + years-2/3 professional + exit reserve`.

Example L1 high before display rounding: tax plus usage is
`($250 x 15%) + $250 = $287.50`; monthly is
`$250 + $2,800 + $287.50 = $3,337.50`; year 1 is
`12 x $3,337.50 + $40,000 + $15,000 = $95,050`; and three years is
`36 x $3,337.50 + $40,000 + $15,000 + $16,000 + $8,000 = $199,150`.

These are sensitivity envelopes, not expected values. Do not average endpoints,
compare vendors with them, or call them quotes.

R0 research is intentionally absent: it is not a live phase and has no
authoritative monthly operating-labor row. Record actual approved research labor
and external spend instead.

## Full-roadmap planning reserves: excluded from Phase 1 TCO

| Highest live phase | Cumulative / incremental active labor | Incremental active-labor cost at $100-$200/h | External, coverage and professional treatment |
|---|---:|---:|---|
| **P2 CRM/scheduling** | **24 h/month / +10 h** | **+$1k-$2k/month** | Exact CRM seats/contacts/bookings use a dated quote; privacy/marketing/vendor review is separate |
| **P3 portal/connectors/customer AI** | **40 h/month / +16 h** | **+$1.6k-$3.2k/month** | Identity, runtime, storage/egress, connector and model units require dated rates; professional review and the funded 24x7 service/rota are separate and unpriced |
| **P4 payments** | **52 h/month / +12 h** | **+$1.2k-$2.4k/month** | Payment formula uses dated rates; counsel, CPA, acquirer/QSA, insurance and continued 24x7 coverage are separately quoted |
| **P5 public AI candidate, if P4 is live** | **62 h/month / +10 h** | **+$1k-$2k/month** | Public-AI usage/abuse model, professional review and any 24x7 capacity expansion remain undefined and unpriced |

If P5 is considered without P4, the source establishes at least P3 coverage but
does not provide a 62-hour cumulative path; no alternative cumulative cost is
inferred.

AI formula:

`input tokens x input rate + output tokens x output rate + vector/retrieval
operations + storage + egress + provisioned capacity/support`

Payment formula:

`method percentage x gross volume + fixed fee x payment count
+ invoice/billing/platform + international/FX + refunds/disputes + payout
+ tax/accounting integration`

No model/payment rates or 24x7 staffing quote were captured, so no AI/payment
total, full-roadmap TCO or TCO score is asserted.

## Alerts, caps and kill switches

Azure budgets notify; they do not stop resources, can lag 8-24 hours and evaluate
daily [S03]. Use 50/80/100% alerts plus service quotas and a tested narrow switch.

| Meter / owner | Cap/switch | Degraded mode | Recovery evidence |
|---|---|---|---|
| Hosting/builds/egress — Platform | Stop nonessential previews/dynamic routes before overage; no unapproved auto-recharge | Cached static site; alternate contact path | Approved forecast, PR change, synthetic/tabletop test |
| Logs — Reliability | Allowlist/sample fields and cap retention; never drop critical security/deploy counters | Reduced diagnostics | Source fixed, alert and redaction verification |
| Transactional mail — Operations | Per-form/IP/user and daily ceilings | Honest alternate contact; no false acceptance | Deliverability plus SPF/DKIM/DMARC test |
| Connectors/storage — Data | Per-tenant quotas/rates; disable sync/upload narrowly | Safe read-only/unavailable state | Reconciliation and integrity test |
| AI — Data/AI | Per-user/tenant tokens/concurrency; disable at approved ceiling | Portal/files remain; AI unavailable | Security/privacy/cost review and regression test |

Each switch needs owner/on-call, trigger, permissions, runbook, customer state,
reconciliation, restart approval and last-test evidence. None is implemented by
this document.

## Quote and refresh gate

Capture exact plan/SKU, region, billing basis, custom domains/TLS/WAF, usage,
builds/previews, storage/logs, backup/restore, support, add-ons, taxes, renewal,
auto-upgrade/recharge, cancellation, export/deletion and SLA. Separately quote
domain, workforce/transactional mail, migration/exit and professionals. Approve
the internal/contract labor rate and obtain a staffed P3+ 24x7 rota cost or
SOC/MSP quote covering compensation, alternates, leave, training, escalation and
incident surge; none is included in the active-hour subtotal.

Wix, Squarespace, Ghost, complete Webflow, WordPress.com, named managed
WordPress, Namecheap renewal/mail and Azure prices remain blocked/deferred. A
missing rate is never `$0`. Recheck within 30 days of approval/purchase and at
least quarterly after launch.
