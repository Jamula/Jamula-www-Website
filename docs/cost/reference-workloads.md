# Reference Workload Dictionary

**Version:** `RWL-2026-08-25.3`
**Status:** Controlling numerical dictionary for the Geordi research, cost and
portability artifacts; proposed and not decision-eligible until Cyrus approves
this exact version and SHA
**Context:** `Refs #3; child #8`; Cycle 3 consistency remediation for N-05

This dictionary reconciles the public-platform and customer-platform planning
numbers. It is a comparison fixture, not a demand forecast, capacity commitment,
customer promise or vendor bill. Values are deliberately rounded; a range or
order-of-magnitude estimate is preferable to invented precision.

## Scenario meanings

| ID | Meaning | Cost use |
|---|---|---|
| R0 | Free research: disposable, synthetic, non-production work | Mechanism/research cost only; never a free-production claim |
| L1 | Lean operating band: Phase 1 public launch volume plus later-phase planning quantities | Phase 1 TCO uses only public dimensions; later phases are separate reserves |
| A1 | Azure-aligned planning band at the exact same Phase 1 public volume as L1, with separate Phase 2-4 planning quantities | Phase 1 Azure TCO remains public-site-only; architecture/cost treatment may differ, public demand does not |
| G1 | Growth planning band for public and later services | Public TCO and later-phase reserves remain separately reported |

## Authoritative cumulative active-control labor

[`../security/incident-detection-response.md`](../security/incident-detection-response.md)
is authoritative for phase labels, minimum coverage and recurring active-control
labor. These are planning floors, not quotes, standby coverage-hours or estimates
of incident response, remediation or major upgrades.

| Highest live phase | Active labor floor | Increment from preceding phase | Separate coverage treatment |
|---|---:|---:|---|
| **P1 public/contact** | **14 h/month** | 14 h/month from no live service | Staffed business window defined by the authoritative table |
| **P2 CRM/scheduling** | **24 h/month cumulative** | **+10 h/month** | P1 window plus the table-defined weekend/holiday checks |
| **P3 portal/connectors/customer AI** | **40 h/month cumulative** | **+16 h/month** | **Funded 24x7 on-call service/rota is additional and unpriced pending staffing evidence or a quote** |
| **P4 payments** | **52 h/month cumulative** | **+12 h/month** | P3 24x7 coverage plus payment/accounting escalation |
| **P5 public AI candidate** | **62 h/month cumulative if P4 is also live** | **+10 h/month from P4** | At least P3 coverage; capacity expansion remains separately funded |

The authoritative table has no `P0` or `R0` live phase. `R0` remains a
non-production research scenario and is not mapped to the P1 14-hour operating
floor. Research labor must be recorded from an approved spike or timesheet rather
than assigned an invented monthly operating quantity.

## Phase 1 public-site dimensions

| Monthly dimension | R0 | L1 | A1 | G1 |
|---|---:|---:|---:|---:|
| Visits / page views | 5k / 20k | 25k / 100k | 25k / 100k | 250k / 1m |
| Public CDN egress | 5 GB | 25 GB | 25 GB | 500 GB |
| Production deploys / PR previews | 4 / 8 | 12 / 30 | 12 / 30 | 30 / 100 |
| Published content items / editors | 50 / 1 | 250 / 2 | 250 / 2 | 2,500 / 8 |
| New inquiries / transactional emails | 25 / 50 | 100 / 500 | 100 / 500 | 2,000 / 10k |
| Retained logs / retention | 1 GB / 7 days | 5 GB / 30 days | 5 GB / 30 days | 100 GB / 90 days |

L1 and A1 now have identical values for every Phase 1 public dimension. A1 remains
an Azure-aligned architecture and cost-sensitivity arm; it is not a higher public
demand scenario. Phase 2-4 A1 planning quantities remain separate and do not alter
this Phase 1 equivalence.

## Phase 2 CRM and scheduling dimensions

| Monthly dimension | R0 | L1 | A1 | G1 |
|---|---:|---:|---:|---:|
| CRM operator seats | 2 | 3 | 5 | 15 |
| Active CRM contacts | 250 | 2,500 | 5,000 | 50,000 |
| Public bookings | 10 | 50 | 100 | 1,000 |

R0 Phase 2 values are quote/research fixtures only; they do not authorize
production CRM or scheduling.

## Phase 3 portal, connector and AI dimensions

| Monthly dimension | R0 | L1 | A1 | G1 |
|---|---:|---:|---:|---:|
| Customer tenants / active users | 0 / 0 | 10 / 40 | 50 / 200 | 250 / 1,000 |
| Connected provider accounts | 0 | 20 | 100 | 1,000 |
| Indexed source files / source storage | 0 / 0 GB | 2,000 / 50 GB | 20,000 / 250 GB | 250,000 / 2 TB |
| Customer-content egress | 0 | 10 GB | 50 GB | 400 GB |
| Connector API calls | 0 | 2,000 | 10,000 | 1m |
| Customer-AI conversations | 0 | 200 | 2,000 | 20,000 |
| Model input / output tokens | 0 / 0 | 1m / 150k | 10m / 1.5m | 100m / 15m |

Customer-content egress is a sensitivity assumption of approximately 20% of
stored source volume per month, rounded to vendor billing units. Connector calls
are coarse load fixtures, not derived promises. Replace both with measured
distributions before capacity or price approval.

## Phase 4 hosted-payment dimensions

| Monthly dimension | R0 | L1 | A1 | G1 |
|---|---:|---:|---:|---:|
| Successful payments / gross volume | 0 / $0 | 20 / $50k | 50 / $150k | 200 / $500k |
| Active recurring retainers | 0 | 5 | 15 | 50 |
| ACH/bank-debit mix sensitivity | 0% | 20%, 50%, 80% | 20%, 50%, 80% | 20%, 50%, 80% |
| International/FX sensitivity | 0% | 0%, 5%, 20% | 0%, 5%, 20% | 0%, 5%, 20% |
| Refund-count range | 0 | 0-2 | 0-5 | 0-20 |
| Dispute-count sensitivity | 0 | 0, 1 | 0, 1, 3 | 0, 2, 10 |

## Cost-scope rules

1. **Public-site-only TCO** includes Phase 1 hosting, domains/DNS/TLS, mail,
   monitoring/logs/backups, CMS/runtime, public-site controls and their labor.
2. **Full-roadmap reserve** reports Phase 2, 3, 4 and optional Phase 5 fixed
   services, usage-unit formulas, incremental active-control labor, separately
   funded coverage and professional review. It is not added to a platform score
   or presented as a vendor bill.
3. AI cost is `input tokens x dated input rate + output tokens x dated output
   rate`, plus retrieval/vector/storage/egress and applicable provisioned-capacity
   charges.
4. Payment cost is `method percentage x method volume + fixed fee x transaction
   count + billing/invoice/platform + FX/international + dispute/refund + payout
   + tax/accounting integration`.
5. Existing licenses and credits count only at evidenced avoidable incremental
   cost. They do not erase labor, controls, renewal or exit.
6. Re-price at 50%, 80% and 100% of a quota and when a measured dimension differs
   from its band by more than 25% for two months.

## Version control and change record

Any change creates a new version and records old value, new value, evidence,
reason, cost impact and affected calculations.

| Version | Change | Evidence and reason | Cost impact |
|---|---|---|---|
| `RWL-2026-08-25.1` | Initial controlling workload dimensions; Geordi-derived labor sensitivities remained in the cost model | Cycle 2 reconciliation | Superseded for labor calculations |
| `RWL-2026-08-25.2` | Replaced 4-12, 15-47, 17-55 and 30-90 h/month assumptions and Phase 2/3/4 ranges with P1 14, P2 24 cumulative, P3 40 cumulative, P4 52 cumulative and P5 62 cumulative when P4 is live | Seven's authoritative phase table in `incident-detection-response.md` | Recalculates Phase 1 public-site envelopes and later-phase increments; P3+ 24x7 coverage remains unpriced |
| `RWL-2026-08-25.3` | A1 Phase 1 inquiries changed `200` → `100` while transactional mail stays `500`; retained logs changed `10 GB` → `5 GB` while retention stays `30 days`. All other Phase 1 values are unchanged, making L1 and A1 public volume identical. | N-05 consistency finding: architecture/cost arms require the same public demand fixture | No arithmetic change to the unquoted public TCO envelopes: they use composite external-service reserves and the common P1 14 h/month control floor, not inquiry or retained-log unit multiplication. Requote exact services before scoring. |

Future cadence or quantity changes must record the exact old/new value and every
affected cost cell against this version; no anticipatory adjustment or guessed
cadence is permitted.
