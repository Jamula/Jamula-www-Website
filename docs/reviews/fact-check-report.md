# Final Fact-Check and Devil's-Advocate Report

**Review date:** 2026-08-24 Pacific
**Reviewer:** Fact Checker, Verification & Devil's Advocate
**Scope:** PR 2 working-tree documentation for issues #3-#9
**Overall verdict:** **REVISE**

This is an independent source and internal-consistency review. It is not legal,
tax, accounting, insurance, PCI, accessibility-conformance, or other licensed
professional advice.

## Verdict, blockers, and reviewer lockout

The package is not ready for exact-SHA approval. The recommendation is framed as
provisional, but its published `83` score was produced contrary to its own hard-gate
rule, its TCO/customer-platform inputs do not share one controlling workload, and
its privacy and recovery artifacts prescribe incompatible backup retention. These
are material blockers, not editorial cleanup.

**Rejected artifacts for this revision cycle:**

- `docs/architecture/decision-framework.md`
- `docs/architecture/recommendation.md`

Their manifest author, **Jean-Luc Picard, is locked out of the next revision of
those two artifacts** and may not contribute as author, co-author, adviser, or pair.
Assign **Geordi La Forge** as the sole eligible revision owner for those artifacts.
This lockout is artifact-scoped; it does not bar Picard from unrelated work.

**Finding count:** 12 total — 0 Critical, 3 High, 7 Medium, 2 Low.

## Material blockers

### FCR-001 — A blocked hard gate was scored as a passable finalist

- **Severity:** High
- **Confidence:** High
- **Rating:** Contradicted
- **Exact location:** `docs/research/platform-options.md:40-42,74-82,110-134`;
  `docs/architecture/decision-framework.md:7-11,30-41`;
  `docs/architecture/recommendation.md:7-15`
- **Evidence/source:** The declared method says an option is not scored until
  evidence supports every hard gate, blocked is unresolved, and a material
  blocked/unverified claim receives a 15-point penalty. Custom static is nevertheless
  scored `85 - 2 = 83` while commercial host terms, cross-domain redirect, and
  restore evidence remain open. The 2-point penalty denotes current primary
  documentation, not the stated blocked evidence.
- **Impact:** The only option above the 70-point floor is advantaged by bypassing
  the method that excludes other candidates. “Preferred finalist” and the numerical
  margin are not reproducible.
- **Specific remediation:** Remove the `83` and all comparative rank language until
  one exact framework/host/plan clears every gate. Alternatively, amend the
  preregistered method **before** rescoring to define when conditional gates may be
  scored, then apply the same rule and penalty to every candidate. Record the
  criterion-level evidence and arithmetic, not only seven unexplained ratings.

### FCR-002 — Workloads and TCO do not form one controlling numerical model

- **Severity:** High
- **Confidence:** High
- **Rating:** Contradicted
- **Exact location:** `docs/architecture/decision-framework.md:13-26`;
  `docs/cost/cost-model.md:15-34,36-51,93-113`;
  `docs/research/customer-platform-options.md:34-48`;
  `docs/architecture/recommendation.md:21-32`
- **Evidence/source:** The platform model uses Azure-aligned `100 customers / 50
  MAU`, `100 GB` storage and `1m` AI tokens, while the customer-platform model uses
  `50 tenants / 200 active users`, `250 GB` source storage and `10m / 1.5m` AI
  input/output tokens. Growth similarly differs (`5,000/2,000` versus
  `250/1,000`, `5 TB` versus `2 TB`). The cost table's arithmetic is correct, but
  its service, labor, tax, overage, build, and exit ranges are assumptions rather
  than quoted bills; customer-AI and payment rates are expressly excluded.
- **Impact:** The TCO rating of `4`, scenario comparisons, and recommendation ranges
  cannot be traced to one workload or vendor bill. Apparent precision may be
  mistaken for a price comparison.
- **Specific remediation:** Establish one versioned workload dictionary with
  explicit public-site, tenant, user, storage, connector, model-token, and payment
  dimensions. Recalculate each scenario from unit-price/quantity rows or label it
  an unscored planning reserve. Do not award a TCO rating until dated US quotes
  cover Azure Static Web Apps Standard, the alternate host, DNS/email, and each
  included customer service.

### FCR-003 — Backup retention is mutually incompatible

- **Severity:** High
- **Confidence:** High
- **Rating:** Contradicted
- **Exact location:** `docs/security/backup-recovery.md:64-73`;
  `docs/privacy/data-inventory.md:41`;
  `docs/privacy/data-lifecycle.md:90-100`
- **Evidence/source:** Recovery requires daily points for 35 days, weekly points
  for 13 weeks, and monthly points for 12 months. Privacy sets a 35-day backup
  maximum, permits a monthly immutable copy for only 90 days if justified, and
  promises backup expiry within 35 days.
- **Impact:** Deletion notices, processor requirements, restore tests, discovery
  exposure, and storage cost cannot all comply with these schedules.
- **Specific remediation:** Seven, Miles, Sarek, and qualified counsel must produce
  one classification-specific schedule. Define whether long-term recovery points
  contain personal/customer data, how tombstones are replayed, legal-hold
  exceptions, and the externally disclosed maximum. Make all three artifacts point
  to that controlling schedule.

### FCR-004 — CRM and Bookings “leaders” exceed the current evidence

- **Severity:** Medium
- **Confidence:** High
- **Rating:** Needs Investigation
- **Exact location:** `docs/research/customer-platform-options.md:12-13,63-82`;
  `docs/research/customer-platform-source-register.md:10-14`;
  `docs/decisions/adr-003-customer-platform-phases.md:11-15`;
  `docs/architecture/recommendation.md:28-32`
- **Evidence/source:** Recheck of
  <https://www.hubspot.com/pricing/crm> exposed only “Free Tools,” not the
  two-user/contact/automation, export, deletion, DPA, or commercial-term evidence
  needed to prefer it. The current Microsoft Bookings service description,
  <https://learn.microsoft.com/en-us/office365/servicedescriptions/microsoft-bookings-service-description>,
  now points readers to plan-comparison pages and uses a “Small Business” feature
  category; the fetched current page did not substantiate the register's exact
  Business Basic/Standard/Premium list or “depends on Exchange Online” wording.
- **Impact:** Conditional language prevents a purchase, but “pilot leader” and
  “scheduling leader” still imply a comparative conclusion not present in the
  evidence packet.
- **Specific remediation:** Change both dispositions to unranked shortlist entries
  until dated US tenant/checkout captures prove seats, capacity, export/deletion,
  DPA/region, cancellation, and exact M365/Teams/Exchange entitlement. Update S04
  to the current page's exact supported wording and source date.

### FCR-005 — Connector token-custody claim conflicts with picker mechanics

- **Severity:** Medium
- **Confidence:** High
- **Rating:** Contradicted
- **Exact location:** `docs/architecture/customer-platform.md:139-146`;
  `docs/research/customer-platform-source-register.md:20-31`
- **Evidence/source:** Architecture says the server-side broker “alone sees tokens.”
  Microsoft's Picker v8 documentation requires the host to provide an access token
  to the Microsoft-hosted picker, and Google Picker web implementations require an
  OAuth access token. See
  <https://learn.microsoft.com/en-us/onedrive/developer/controls/file-pickers/?view=odsp-graph-online>
  and <https://developers.google.com/workspace/drive/picker/guides/overview>.
  The narrower statement that refresh tokens never reach the browser is supportable.
- **Impact:** The absolute claim can hide a browser access-token exposure and omit
  CSP, origin/message validation, lifetime, audience, and in-memory handling from
  the threat model and spike.
- **Specific remediation:** Replace “alone sees tokens” with provider-specific
  custody. State exactly which short-lived access token reaches each browser/picker,
  while keeping refresh tokens server-only. Add token exposure, origin/postMessage,
  audience, scope, lifetime, and teardown acceptance tests to each connector packet.

### FCR-006 — Legal applicability and professional dispositions are inconsistent

- **Severity:** Medium
- **Confidence:** High
- **Rating:** Contradicted
- **Exact location:** `docs/legal/jurisdiction-matrix.md:10-22`;
  `docs/legal/compliance-checklist.md:21-25,34`;
  `docs/legal/phase-review-gates.md:18-20,38,47`
- **Evidence/source:** GDPR territorial applicability is unresolved at matrix line
  19, but ROPA/DPIA/breach is marked `applicable` at line 21 rather than clearly
  distinguished as an internal global baseline. PCI requires an acquirer/QSA plus a
  licensed insurance broker, yet the only row disposition is
  `needs broker-professional`, which cannot represent the acquirer/QSA gate. PCI
  SSC itself says merchants should confirm SAQ A with the acquirer/payment brands:
  <https://blog.pcisecuritystandards.org/faq-clarifies-new-saq-a-eligibility-criteria-for-e-commerce-merchants>.
- **Impact:** A register consumer can treat an internal baseline as a legal
  applicability conclusion or mistake broker review for PCI scope confirmation.
- **Specific remediation:** Add a distinct `internal baseline` and
  `needs acquirer/QSA` disposition (or split combined rows). Keep GDPR legal
  applicability pending counsel while separately requiring Jamula's voluntary
  ROPA/DPIA controls. No AI review closes either professional gate.

## Advisory cleanup

### FCR-007 — Turnkey comparison remains too incomplete for a final rank

- **Severity:** Medium
- **Confidence:** High
- **Rating:** Needs Investigation
- **Exact location:** `docs/research/platform-options.md:88-120,129-138,200-205`;
  `docs/research/platform-source-register.md:25-36,46-56`
- **Evidence/source:** Current official evidence supports Webflow's displayed plan
  prices and export omissions, WordPress.com's WXR/full-backup distinctions, and
  GitHub Pages' online-business restriction. Wix, Squarespace, Ghost, exact
  WordPress.com pricing, a named managed-WordPress contract, and combined Webflow
  Workspace+Site cost/main-only flow remain blocked. Azure's USD Standard price and
  Cloudflare/Netlify commercial account fit also remain unresolved.
- **Impact:** The documents appropriately leave several products unscored, but the
  recommendation must not be described later as a complete market comparison.
- **Specific remediation:** Preserve the blocked status; obtain dated official
  quotes/terms and equal export/deploy/restore tests before any final score. Recheck
  Webflow naming and the exact Workspace plus Site combination at checkout.

### FCR-008 — Stale, broken, and inaccessible citations need explicit repair

- **Severity:** Medium
- **Confidence:** High
- **Rating:** Needs Investigation
- **Exact location:** `docs/legal/jurisdiction-matrix.md:27,33`;
  `docs/legal/compliance-checklist.md:19`;
  `docs/legal/content-ip-review.md:17`;
  `docs/legal/legal-pages-requirements.md:17`;
  `docs/content/content-strategy.md:111`;
  `docs/content/editorial-workflow.md:154`;
  `docs/content/multimedia-social-plan.md:118`
- **Evidence/source:** An automated GET audit of 213 unique HTTP(S) strings returned:
  - **404:** CPPA `ccpa_updates_2025.html` (replace with
    <https://cppa.ca.gov/regulations/ccpa_updates.html>); King County personal
    property (replace with the current Assessor personal-property/eListing page);
    ANPD `/assuntos/legislacao` (current redirect target is
    <https://www.gov.br/anpd/pt-br/centrais-de-conteudo/legislacao>); FTC AI-claims
    blog; and the FTC Endorsement Guides rule URL. The FTC endpoints returned 403
    through a second retrieval path, so their exact current endpoints remain
    **Needs Investigation**, not proven absent. A current FTC federal-register
    source exists for 16 CFR Part 255.
  - **403/access-blocked:** CRTC CASL; two CISA pages; two Kirkland Code Publishing
    pages; three FCC pages; Kirkland licensing; and two Namecheap pages. Kirkland
    licensing and both Namecheap claims were independently retrieved successfully;
    the other eight remain access-blocked, not proven broken.
  - **TLS/timeout/nonstandard response:** WhatsApp Messaging Policy, Netlify
    pricing, PCI document library, and LinkedIn profile. Alternate retrieval
    verified Netlify pricing and the LinkedIn URL only partially; WhatsApp policy
    and PCI library freshness remain unverified by this pass.
  - Intended-domain probes timed out for `jamula.net`; `jamula.com` did not resolve
    in the audit. Template URLs containing `{path}` are not valid freshness probes.
- **Impact:** “Verified 2026-08-24” cannot be reproduced from several cited URLs.
- **Specific remediation:** Replace the three confirmed stale government paths;
  replace/revalidate both FTC endpoints; capture dated official PDF/API alternatives
  for bot-blocked authorities; and record `access-blocked` rather than `verified`
  until a reviewer retrieves the exact source. Test real canonical/redirect URLs
  only after DNS is provisioned.

### FCR-009 — Two different performance budgets are both presented as controlling

- **Severity:** Medium
- **Confidence:** High
- **Rating:** Contradicted
- **Exact location:** `docs/experience/accessibility-seo-performance.md:154-167`;
  `docs/security/quality-strategy.md:81-95`
- **Evidence/source:** Experience requires 900/1,500 KiB totals, 225/300 KiB
  JavaScript, 120 KiB fonts, and 450/500 KiB imagery. Quality uses 1.0/1.5 MB,
  200/300 KB JavaScript, 150/200 KB fonts, and 400/600 KB imagery. Units and category
  limits differ.
- **Impact:** CI can pass one gate and fail the other; implementers cannot know
  which threshold controls.
- **Specific remediation:** Choose one canonical byte unit and budget table. Make
  the second artifact reference it, then define whether the tighter aggregate or
  category rule wins.

### FCR-010 — Founder identity evidence is overstated, although publication is blocked

- **Severity:** Low
- **Confidence:** High
- **Rating:** Unverified
- **Exact location:** `docs/content/founder-source-register.md:5-12`;
  `docs/content/founder-profile-draft.md:9-26`
- **Evidence/source:** The LinkedIn URL resolves but this pass did not retrieve
  profile header/employer evidence; the GitHub URL returned no usable profile
  details. The register records “name, employer and GitHub cross-match” without an
  exact fact, snapshot, or retained evidence.
- **Impact:** The link-only draft remains safely blocked, but the register's
  verification field cannot support later publication.
- **Specific remediation:** Keep publication blocked. For each selected fact,
  retain a dated public snapshot or user-approved source, exact wording, identity
  match, expiry, and correction/removal action. Do not infer employer, projects, or
  activity from link existence.

### FCR-011 — Required decision source is absent

- **Severity:** Low
- **Confidence:** High
- **Rating:** Needs Investigation
- **Exact location:** `.squad/decisions.md` (missing)
- **Evidence/source:** The requested team decision file does not exist in the
  worktree or local Squad state. No decision history could be reconciled against
  the generated artifacts.
- **Impact:** This review cannot establish that all cross-agent decisions were
  incorporated or detect contradictions with a nonexistent authority.
- **Specific remediation:** Coordinator/Scribe must identify the authoritative
  decision register or explicitly record that no decisions exist, then rerun the
  consistency check before exact-SHA approval.

### FCR-012 — Blanket “verified” labels conflict with source-level results

- **Severity:** Medium
- **Confidence:** High
- **Rating:** Contradicted
- **Exact location:** `docs/legal/jurisdiction-matrix.md:3-4`;
  `docs/legal/compliance-checklist.md:3-4`;
  `docs/content/editorial-workflow.md:152-154`
- **Evidence/source:** These headers label all listed sources “verified” on
  2026-08-24, while FCR-008 identifies stale, 404, blocked, or only partially
  retrievable endpoints. In contrast, the platform and customer source registers
  correctly distinguish verified, partial, blocked, documented vendor claim, and
  unexecuted test.
- **Impact:** Readers may convert source existence or vendor documentation into
  current legal applicability, contractual proof, or production evidence.
- **Specific remediation:** Apply the source-register vocabulary to every cited
  claim: `verified narrow official claim`, `vendor-documented`, `partial`,
  `access-blocked`, `unverified`, or `future test`. Remove blanket verification
  statements and record claim-specific dates.

## Verified or appropriately bounded material claims

The following checks did not produce findings beyond the conditions already stated:

- Azure Static Web Apps documents free hosting/TLS/custom domains and an hourly
  Standard plan, but no usable USD Standard amount was retrieved.
- Cloudflare Pages free limits (500 builds/month, 20-minute build timeout, 100
  custom domains, 20,000 files, 25 MiB assets) and Netlify's displayed
  $0/$9/$20 credit plans were supported; neither establishes Jamula's contractual
  production eligibility.
- GitHub Pages' exclusion for a site primarily facilitating an online business is
  supported by official GitHub documentation.
- WordPress core's GPLv2-or-later statement and WordPress.com's export omissions
  are supported, with legal scope and plan-specific restore behavior still gated.
- Namecheap's free 2FA statement and custom-DNS DS-record management were supported.
  Registry lock, renewal, mailbox, transactional-email prices, SPF/DKIM/DMARC
  deployment, and deliverability remain future quote/test items.
- Entra External ID external-tenant/MAU distinctions and Microsoft Foundry's
  documented model-data statements are supported as vendor documentation, not
  contract or deployment proof.
- Google `drive.file`/Picker guidance, Box rotating 60-day refresh-token behavior,
  Stripe hosted Checkout/Invoicing capabilities, and Microsoft multiplexing rules
  are supported narrowly. Connector, payment, DPA, region, price, and PCI behavior
  remains unexecuted or professionally gated as the artifacts state.
- OWASP ASVS 5.0.0, OWASP Web Top 10:2025, API Security Top 10:2023, RFC 9700
  (BCP 240), SLSA 1.2, and CycloneDX 1.7 are current official versions/formats at
  the review date.
- WCAG 2.2 AA criteria, 320-CSS-pixel reflow, 24-CSS-pixel target-size minimum,
  p75 Core Web Vitals thresholds, and the need for knowledgeable human evaluation
  are correctly bounded. No conformance claim is made.
- FinCEN's 2026 BOI exemption for U.S. companies/persons, Washington's
  2025-10-01 IT/website/software sales-tax change, Kirkland's licensing statement,
  Washington MHMDA issue spotting, and Washington's 30-day breach framework were
  supported by current official sources. Exact applicability remains with the
  named user/professional gates.

## Approval conditions

Approval requires closing FCR-001 through FCR-006, repairing FCR-008 and FCR-012,
and reconciling FCR-009 before the affected gates become executable. All dynamic
prices and commercial terms must be rechecked at quote/checkout and bound to the
selected region, plan, billing basis, artifact SHA, and expiry. Legal and
professional conclusions remain pending the qualified reviewers named in the
artifacts.

## Remediation verification

**Verification date:** 2026-08-25 Pacific

**Verification target:** Exact current working tree, not a committed SHA

**Disposition:** 10 resolved; 2 unresolved

**Remediation verdict:** **REVISE**

This section is append-only. The original report above, including its original
2026-08-24 verdict and lockout, is preserved verbatim as the record of the first
review. This verification supersedes that verdict only for the independently
revised domain artifacts examined below. It is not legal, tax, accounting,
insurance, PCI, accessibility-conformance, or other licensed professional
advice.

### Independence boundary

I revised the following integration ledgers and therefore exclude them from this
independent remediation verdict:

- `docs/artifacts-manifest.md`
- `docs/planning/work-ownership.md`
- `docs/README.md`
- `docs/decisions/approvals.md`
- `docs/decisions/README.md`
- `docs/reviews/adversarial-review.md`

The assigned adversarial reviewer must independently verify those six files,
including artifact coverage, ownership/lockout history, approval identifiers,
issue state, ADR indexing, and the preserved F-01 through F-09 register. Nothing
in this section approves those ledgers.

### Finding-by-finding verification

#### FCR-001 — Resolved

- **Evidence:** `docs/research/platform-options.md:3-4,14-24,96-110,156-159`
  withdraws every prior score, rating, margin, rank, order, and finalist label;
  each exact shape is explicitly `Unscored`. `docs/architecture/decision-framework.md:7-11,36-64`
  requires approved preregistration and complete hard-gate evidence before
  weighting. `docs/architecture/recommendation.md:7-13,25-27` selects no platform
  and proposes only a symmetric evidence cycle.
- **Verification:** No `83`, preferred finalist, winning margin, or surviving
  exact-option score was found in the revised platform prose. Static fixtures
  `STATIC-AZ-01`, `STATIC-NL-01`, `STATIC-CF-01`, `STATIC-VC-01`, and
  `MWP-PORT-01` are proposed test fixtures, not finalists.
- **Disposition:** **Resolved.** Every exact platform/plan remains unscored and
  no platform is preferred or selected.

#### FCR-002 — Resolved

- **Evidence:** `docs/cost/reference-workloads.md:1-12,14-21,43-110` defines
  `RWL-2026-08-25.2` as the single numerical dictionary for public traffic and
  later CRM, scheduling, tenant, user, storage, connector, AI, and payment
  dimensions. `docs/research/customer-platform-options.md:32-41` adopts those
  same R0/L1/A1/G1 dimensions and prohibits a second provider workload table.
- **Evidence:** `docs/cost/cost-model.md:1-17,57-70,99-161` now presents only
  Phase 1 public-site planning envelopes, separates vendor anchors from
  unquoted reserves, shows the arithmetic, and excludes Phase 2-5 from public
  TCO. `docs/architecture/recommendation.md:54-66` reproduces that bounded
  public-only posture and rejects TCO scoring.
- **Verification:** The former incompatible `100 customers / 50 MAU` workload
  is withdrawn. No full-roadmap TCO, AI/payment total, vendor bill, or TCO score
  is asserted. The displayed Phase 1 labor basis is consistently 14 hours/month
  at an expressly unapproved $100-$200/hour sensitivity.
- **Disposition:** **Resolved.** One versioned workload controls public and
  later-phase quantities while cost scopes remain separate.

#### FCR-003 — Resolved

- **Evidence:** `docs/security/backup-recovery.md:64-88` is now the single
  classification-specific backup schedule. C2 personal/customer/tenant points,
  justified C3 points, and personal-data C4 backup copies expire within 35
  days; C0/C1 longer schedules exclude personal/customer data; C4 authoritative
  records and C5 legal holds are not ordinary product backups.
- **Evidence:** `docs/privacy/data-inventory.md:40,53,68-70` and
  `docs/privacy/data-lifecycle.md:84-102,113-115` point to that controlling
  schedule, require immediate logical denial, tombstone replay, quarantined
  restore, and separately scoped legal holds.
- **Verification:** The earlier 35-day promise no longer conflicts with
  13-week/12-month personal-data recovery points. The longer C0/C1 period cannot
  inherit mixed C2 content, and no restored deleted record may return to service
  before current tombstones and authorization are applied.
- **Disposition:** **Resolved**, subject to the expressly pending
  counsel/CPA/contract decisions and future restore/deletion tests.

#### FCR-004 — Unresolved

- **Partial repair:** `docs/research/customer-platform-options.md:12-13` calls
  both CRM and scheduling lists **unranked** and labels HubSpot and Microsoft
  Bookings blocked evidence. `docs/decisions/adr-003-customer-platform-phases.md:34-36`
  and `docs/architecture/recommendation.md:29-36` repeat the non-ordered posture
  and select neither product.
- **Contradiction:** The detailed option table does not implement that posture.
  `docs/research/customer-platform-options.md:61-62` still calls Zoho a
  **“Fallback if HubSpot gates fail,”** calls Dynamics the **“Best”** Microsoft
  fit, and labels it a **“Microsoft-aligned upgrade, not lean default.”**
  Lines 76-77 similarly describe Zoom as an “alternative” and a CRM-native
  scheduler by whether it beats Bookings. These are ordering/comparative
  conclusions without the symmetric evidence required by the same artifact.
- **Official-source recheck:** HubSpot's official CRM pricing response still
  exposed only `Free Tools`. The Microsoft Bookings service description,
  dated 2026-01-12, still documents a web booking calendar, Outlook sync, Teams
  integration, plan-comparison links, broad `Small Business`/enterprise
  categories, and the staff Teams/Skype license footnote. It does not establish
  Jamula's exact US SKU, seat, Exchange, export/deletion, DPA/region,
  cancellation, or checkout terms.
- **Impact:** HubSpot and Bookings lost the literal `leader` labels, but the
  option rows still make them the reference choices against which “fallback”
  and “alternative” products are judged. The asserted unranked shortlist is
  internally inconsistent.
- **Required remediation:** Make HubSpot, Zoho, and Dynamics dispositions
  explicitly unranked pending the same dated commercial, DPA/region,
  export/deletion, cancellation, integration, accessibility, labor, and exit
  evidence. Remove `Fallback`, `Best`, `upgrade`, and `lean default`. Apply the
  same neutral disposition wording to Bookings, Zoom, and a qualifying
  CRM-native scheduler until an approved symmetric comparison exists.
- **Disposition:** **Unresolved.**

#### FCR-005 — Resolved

- **Evidence:** `docs/architecture/customer-platform.md:139-149` limits
  server-exclusive custody to long-lived credentials and refresh tokens,
  explicitly permits a short-lived access token in Microsoft/Google browser
  picker memory, leaves Box custody unresolved, and specifies
  CSP/origin/`postMessage`/audience/scope/lifetime/teardown tests.
  `docs/spikes/connectors/README.md:17-36` establishes the same
  provider-specific boundary, and each provider packet keeps execution blocked.
- **Official-source recheck:** Microsoft File Picker v8 still says the host must
  respond to picker commands with authentication tokens and shows an
  `access_token` supplied to the hosted picker. Google Picker still says web
  apps require an access token passed through `setOAuthToken`.
- **Disposition:** **Resolved.** The absolute “broker alone sees tokens” claim
  is gone; refresh-token and short-lived picker-token custody are distinguished.

#### FCR-006 — Resolved

- **Evidence:** `docs/legal/jurisdiction-matrix.md:21-24,32,37-39` keeps GDPR
  applicability with counsel and separately labels voluntary global controls as
  an internal baseline, not a statutory conclusion.
  `docs/legal/compliance-checklist.md:3-8,22-25,36-38` has separate
  `needs acquirer/QSA` and `needs broker-professional` dispositions.
  `docs/legal/phase-review-gates.md:14-25,28-36` and
  `docs/legal/professional-review-register.md:12-17` preserve distinct counsel,
  CPA, acquirer/QSA, and broker gates.
- **Official-source recheck:** PCI SSC's SAQ A clarification remains live and
  says merchants should confirm the appropriate SAQ with their acquirer or
  payment brands. The official PCI document-library endpoint also responded.
- **Disposition:** **Resolved.** Internal controls no longer imply GDPR
  applicability, and insurance review cannot satisfy PCI scope/merchant
  validation.

#### FCR-007 — Resolved

- **Evidence:** `docs/research/platform-options.md:74-110,142-159` keeps custom,
  Wix, WordPress.com, named/self-hosted WordPress, Webflow, Squarespace, Ghost,
  and Power Pages bounded by missing evidence and marks every exact combination
  unscored. `docs/research/platform-source-register.md:25-42,46-67` retains
  claim-specific verified/partial/blocked statuses, commercial-fit caveats,
  expiry rules, and equal future quote/test requirements.
- **Verification:** No final market rank or completed turnkey comparison is
  claimed. Azure Standard USD, commercial Cloudflare/Netlify fit,
  Wix/Squarespace/Ghost evidence, complete Webflow cost/export, WordPress.com
  price, and a named managed-WordPress contract remain blocked.
- **Cleanup note:** `docs/research/platform-source-register.md:53` still says
  WordPress variants have “Only conditional scores/ranges.” This is stale
  historical wording, but it contains no number or rank and is overridden
  explicitly by `platform-options.md:20-24,96-108`. Replace it with “Unscored”
  during the next eligible domain edit to remove ambiguity.
- **Disposition:** **Resolved for the original ranking finding.** The cleanup
  note does not establish a surviving score or winner.

#### FCR-008 — Unresolved

- **Confirmed repairs:** The corrected CPPA URL
  `https://cppa.ca.gov/regulations/ccpa_updates.html` returned HTTP 200 and
  states the rulemaking is complete/effective 2026-01-01. The current King
  County eListing URL returned HTTP 200 with a browser user agent. The revised
  ANPD regulations URL returned HTTP 200. Netlify pricing, the PCI library, and
  the redirected WhatsApp Business Messaging Policy also returned HTTP 200.
- **Still accurately bounded:** CRTC, FCC, and Kirkland Code Publishing returned
  HTTP 403 in this recheck. FTC advertising, endorsement, and CAN-SPAM
  endpoints returned HTTP 200 through browser-user-agent `curl` but HTTP 403
  through the independent fetch path; retaining `access-blocked/unverified`
  rather than promoting substantive FTC claims is conservative and reproducible
  only if the retrieval path is recorded.
- **Unresolved exact evidence:** `docs/legal/legal-pages-requirements.md:21`
  says the cited CISA VDP endpoint returned HTTP 403, but both independent fetch
  and browser-user-agent retrieval now return **HTTP 404**. Current official
  CISA VDP fact-sheet PDFs and a CISA VDP annual-report page returned HTTP 200,
  but this pass did not establish that either is a claim-equivalent replacement
  for the legal-page requirement. Also,
  `docs/legal/compliance-checklist.md:21` still records the now-reachable King
  County URL as access-blocked, while `docs/legal/content-ip-review.md:24`
  records a WhatsApp policy TLS failure although the current redirected policy
  was retrieved successfully.
- **Impact:** The packet no longer falsely labels these claims verified, but its
  source-status ledger is not fresh or internally consistent for CISA, King
  County, and WhatsApp. A 404 must not be described as access blocking.
- **Required remediation:** Replace or remove the CISA URL after a manual
  claim-equivalence check against a current official source; change its status
  to `stale/broken` until then. Reconcile the King County and WhatsApp rows with
  dated retrieval evidence and effective URLs. Preserve mixed FTC behavior as
  access-path-dependent and do not promote an FTC claim without retained
  official content.
- **Disposition:** **Unresolved.**

#### FCR-009 — Resolved

- **Evidence:** `docs/experience/accessibility-seo-performance.md:145-177` is
  the canonical table: 900/1,500 KiB aggregates, 225/300 KiB JavaScript,
  120/120 KiB fonts, 450/500 KiB imagery, binary units, and the tighter-rule
  wins. `docs/security/quality-strategy.md:128-136` calls Dax's section 6 the
  sole normative source, mirrors those values, and prohibits a second local
  threshold table.
- **Disposition:** **Resolved.** CI has one normative performance budget; field
  Core Web Vitals remain future evidence, not a conformance claim.

#### FCR-010 — Resolved

- **Evidence:** `docs/content/founder-source-register.md:1-16` contains no
  founder fact, URL, employer/workplace metadata, or identity cross-match.
  `docs/content/founder-profile-draft.md:1-25` contains only a neutral blocked
  placeholder and requires a controlled private source record plus exact
  Cyrus/reviewer approval before publication.
- **Disposition:** **Resolved.** Public metadata is minimized rather than
  treating link existence as identity evidence.

#### FCR-011 — Resolved

- **Evidence:** The Squad state health check reports
  **FSStorageProvider**, and the `decisions` state directory was confirmed
  empty. There is therefore no missing mutable decision entry to reconcile.
  The six ADR files each identify themselves as `Proposed`; the documentation
  approval/ADR records are the authoritative proposal records, not accepted
  decisions.
- **Independence caveat:** Because I revised
  `docs/decisions/approvals.md` and `docs/decisions/README.md`, this finding
  verifies the absence and authority model only. The adversarial reviewer must
  independently verify those ledgers' content and completeness.
- **Disposition:** **Resolved.** Absence of `.squad/decisions.md` is not an
  unaccounted decision-history gap when the configured decision store is empty.

#### FCR-012 — Resolved

- **Evidence:** `docs/legal/jurisdiction-matrix.md:3-6`,
  `docs/legal/compliance-checklist.md:3-8`,
  `docs/legal/content-ip-review.md:3-7`, and
  `docs/legal/legal-pages-requirements.md:3-8` explicitly reject blanket
  verification and apply claim-level states. Access-blocked, partial,
  vendor-documented, future-professional, and narrow-official statuses now
  appear on the individual rows. `docs/content/content-strategy.md:93-107` and
  `docs/content/editorial-workflow.md:53` prohibit treating reachability or an
  unretrieved source as verification.
- **Disposition:** **Resolved.** No reviewed domain header labels all sources
  verified, and narrow source support is separated from legal applicability,
  contract, production, or publication proof.

### Remediation verdict and remaining gate

FCR-001 through FCR-003 and FCR-005 through FCR-007 are resolved in the
reviewed domain artifacts. FCR-009 through FCR-012 are also resolved, with the
non-material WordPress wording cleanup noted above. FCR-004 remains unresolved
because its detailed CRM/scheduling rows contradict its unranked-shortlist
policy. FCR-008 remains unresolved because one cited official CISA endpoint is
now 404 and three retrieval-status rows require reconciliation.

The remediation verdict is therefore **REVISE**, not Reject: repair and
independently recheck FCR-004 and FCR-008 before exact-SHA approval. No new
reviewer lockout is imposed by this revise verdict. The adversarial reviewer
must separately review the six excluded integration ledgers; this report cannot
approve them.

## Final independent verification pass

**Verification date:** 2026-08-25 Pacific
**Verification target:** Complete current uncommitted working tree; no committed
SHA or canonical Git blob OIDs exist for this package
**Final verdict:** **REVISE**
**Prior-finding disposition:** **27 resolved / 4 unresolved** across the 31
prior FCR, F/N and RAI identifiers
**New high-confidence findings:** **3** — FCR-013 through FCR-015

This append-only pass preserves every prior review section above verbatim. It
supersedes the earlier remediation status for the current working tree only. It
is not legal, tax, accounting, insurance, PCI, accessibility-conformance, vendor
approval, procurement, deployment, or other licensed professional advice.

### Exact scope and methods

The scope was all **60 Markdown artifacts under `docs/`** for parent issue #3
and children #4-#9, including synthesis, ADRs, roadmap, integration ledgers,
domain research, source registers, connector packets, cost/workload artifacts,
and all three review records. I also read the Fact Checker charter, routing/team
context and source-verification method. `.squad/decisions.md` is absent, as
already reconciled in FCR-011.

Methods:

1. Re-read all current domain and integration artifacts and traced every prior
   FCR-001 through FCR-012, adversarial F-01 through F-09 and N-01 through N-06,
   and RAI-01 through RAI-04.
2. Recomputed the displayed cost endpoints from the documented formulas. L1,
   A1 and G1 monthly, year-one and three-year endpoints reproduce exactly before
   display rounding.
3. Verified `RWL-2026-08-25.3` Phase 1 L1/A1 equality, the 250-item symmetric
   fixture, labor floors, backup schedule, performance-budget authority, and
   current `.3` references. Older `.1`/`.2` references outside the workload
   change record occur only in preserved prior-review history.
4. Enumerated the documentation set and parsed local links: the manifest lists
   exactly 60/60 files, `docs/README.md` links all 60, and no local Markdown link
   is broken.
5. Recomputed all six SHA-256 values in Rai's Green ledger; every fingerprint
   still matches the exact file bytes recorded in `rai-review.md`.
6. Queried GitHub read-only: issues #3, #4, #5, #6, #7, #8 and #9 were all
   **OPEN** on 2026-08-25. The documented validate/commit, new draft PR,
   incorporation-comment, explicit child-closure, ledger-check, identifier and
   exact-head-approval order is coherent. No issue, PR, approval or deployment
   was created or changed by this review.
7. Probed 214 unique current documentation URLs with a browser user agent:
   164 returned HTTP 200, two returned 202, 11 returned 403, one returned 500,
   and 36 had transport failures. A failed automated probe was treated as
   access-path evidence, not proof that a source or claim is absent. Material
   claims were checked separately against official primary sources.

No vendor account, tenant, credential, consent, registration, paid resource,
connector call, payment, deployment, restore, accessibility audit, professional
review or production test was inferred from documentation or reachability.
Documented research, blocked/deferred packets, disposable mechanism evidence
(none executed), and future implementation tests remain distinct.

### Prior FCR finding status

| Finding | Final status | Current evidence |
|---|---|---|
| FCR-001 | **Resolved** | Scores, ranks and finalist language remain withdrawn; every exact platform/plan is unscored. |
| FCR-002 | **Unresolved / reopened** | Public TCO arithmetic and `.3` are coherent, but the payment artifact retains an unversioned duplicate workload and an extra dimension outside the sole dictionary; see FCR-015. |
| FCR-003 | **Resolved** | The classification-specific backup schedule controls; privacy artifacts point to it and preserve tombstone-aware quarantine. |
| FCR-004 | **Resolved** | CRM and scheduling research rows are now explicitly unranked with symmetric blocked/incomplete evidence. HubSpot still yielded only “Free Tools”; the current Bookings description still does not establish Jamula's exact SKU/entitlements/terms. |
| FCR-005 | **Unresolved / reopened** | Provider packets are corrected, but broad synthesis/security statements again say connector tokens have server-only custody; see FCR-014. |
| FCR-006 | **Resolved** | Internal privacy baselines remain separate from legal applicability, and counsel/CPA/acquirer-QSA/broker dispositions remain distinct and pending. |
| FCR-007 | **Resolved** | The stale WordPress “conditional scores/ranges” wording is now replaced by explicit `Unscored`; no completed market rank is claimed. |
| FCR-008 | **Resolved** | Current CISA, King County and WhatsApp evidence/status rows were repaired and rechecked as described below. |
| FCR-009 | **Resolved** | Dax's binary-unit performance table remains the sole normative budget and the security artifact references it. |
| FCR-010 | **Resolved** | Founder artifacts remain non-identifying placeholders; no founder fact or personal profile is approved. |
| FCR-011 | **Resolved** | No missing accepted Squad decision was found; all six ADRs remain explicitly Proposed. |
| FCR-012 | **Resolved** | Legal/content artifacts use claim-level status and do not convert reachability into applicability, contract, production or publication proof. |

### Adversarial F/N and Rai status

| Prior ID | Final status | Basis |
|---|---|---|
| F-01 | **Resolved** | All scores/ranks are withdrawn, including the platform source-register wording. |
| F-02 | **Resolved** | Exact fixture/plan/version/region/add-on/quote gates remain mandatory and unexecuted. |
| F-03 | **Unresolved / reopened** | `.3` repairs L1/A1 public demand, but payment workload propagation is incomplete; see FCR-015. |
| F-04 | **Resolved** | P1-P5 labor floors align; P3+ 24x7 coverage remains additional, unpriced and launch-blocking. |
| F-05 | **Resolved** | Every static arm and `MWP-PORT-01` now requires the identical 250-item manifest and pre-run hash/count equality. |
| F-06 | **Resolved** | One backup schedule controls and no restore/deletion implementation is claimed. |
| F-07 | **Resolved** | One performance-budget authority controls. |
| F-08 | **Resolved** | Issue states, canonical post-commit identity, and closure/approval sequence are reproducible and correctly pending. |
| F-09 | **Resolved** | Legal drafting remains deferred to qualified counsel; no AI legal text or approval is claimed. |
| N-01 | **Resolved** | Rai Green is stated only for the six fingerprinted files; all six hashes still match. |
| N-02 | **Resolved** | WordPress and static fixtures use the same 250-item corpus/manifest. |
| N-03 | **Unresolved** | The neutral synthesis conflicts with surviving Stripe “leader” and comparator ordering; see FCR-013. |
| N-04 | **Resolved** | Commit and draft PR now precede child incorporation comments and explicit #4-#9 closure; #3 stays open while draft. |
| N-05 | **Resolved** | `.3` makes every Phase 1 L1/A1 public quantity identical and records the exact changes. |
| N-06 | **Resolved** | ADR-001 and portability both reference `.3` and the same 250-item fixture. |
| RAI-01 through RAI-04 | **Resolved (4/4)** | Rai's six recorded fingerprints match; Green remains limited to those bytes and is not a public/professional approval. |

### Official-source rechecks dated 2026-08-25

- **HubSpot / Bookings:** HubSpot's official CRM pricing response still exposed
  only “Free Tools.” Microsoft's current
  [Bookings service description](https://learn.microsoft.com/en-us/office365/servicedescriptions/microsoft-bookings-service-description)
  is dated 2026-01-12 and supports the narrow calendar, Outlook, Teams,
  plan-comparison, category and staff-license wording now recorded. It does not
  establish Jamula's exact US SKU, seats, Exchange entitlement, DPA/region,
  export/deletion, cancellation or checkout terms.
- **Legal-source repair:** The official
  [CISA VDP template](https://www.cisa.gov/vulnerability-disclosure-policy-template)
  was retrieved and is expressly an agency-oriented template, not Jamula legal
  text. The current King County Assessor reporting page returned HTTP 200 with a
  browser user agent. The current
  [WhatsApp Business Messaging Policy](https://whatsappbusiness.com/policy/)
  was retrieved and supports the narrow identity, opt-in and opt-out statements.
  The [replacement WhatsApp terms preview](https://www.facebook.com/legal/wa-for-business-terms-preview)
  confirms a 2026-09-23 effective date. The
  [CPPA update](https://cppa.ca.gov/regulations/ccpa_updates.html) confirms
  completed rulemaking and a 2026-01-01 effective date.
- **Federal/standards:** FinCEN's
  [BOI page](https://www.fincen.gov/boi) and the official
  [Federal Register API record](https://www.federalregister.gov/api/v1/documents/2026-16576.json)
  support the 2026-08-14 final-rule date and the narrow U.S.-company/U.S.-person
  exemptions. Official sources also continued to support PCI DSS v4.0.1 SAQ-A
  acquirer/payment-brand confirmation, RFC 9700, OWASP ASVS 5.0.0, OWASP Top
  10:2025, API Security Top 10:2023, SLSA 1.2 and CycloneDX 1.7. These are
  source/version checks, not Jamula implementation or compliance evidence.

### New high-confidence findings

#### FCR-013 — Payment ranking survives the package's neutral shortlist rule

- **Severity / confidence / rating:** Medium / High / Contradicted
- **Exact evidence:** `docs/payments/phase-4-evaluation.md:10,51-61` calls Stripe
  the “documentation-fit leader,” “Leader,” and “Strongest documented combined
  fit,” while Square and PayPal are only “Comparator” options.
  `docs/research/customer-platform-options.md:17`,
  `docs/architecture/recommendation.md:46-48`, and
  `docs/decisions/adr-003-customer-platform-phases.md:48-50` require unranked,
  documentation-only payment candidates and no comparative conclusion.
- **Impact:** The synthesis says vendor-neutral while a controlling child
  artifact preserves an asymmetric rank based on a richer Stripe source packet.
  No equivalent price, contract, DPA, payout/reserve, accessibility, accounting,
  cancellation, exit or executed mechanism evidence exists across candidates.
- **Owner / remediation:** **Sarek (assigned N-03 follow-up), coordinating Miles
  O'Brien for the independently revised #6 payment artifact.** Remove
  leader/strongest/comparator ordering and apply one unranked evidence
  disposition until a preregistered symmetric procurement/test packet runs.

#### FCR-014 — Absolute server-only connector-token claims were reintroduced

- **Severity / confidence / rating:** Medium / High / Contradicted
- **Exact evidence:** `docs/requirements/business-product-requirements.md:46`,
  `docs/security/control-test-matrix.md:64`, and
  `docs/security/threat-model.md:43,76` broadly require connector tokens or token
  custody to remain server-only. In contrast,
  `docs/architecture/customer-platform.md:143-149`,
  `docs/spikes/connectors/README.md:22,30-36`, and the provider packets correctly
  distinguish server-only refresh/long-lived credentials from possible
  short-lived Microsoft/Google browser-picker access tokens and unresolved Box
  custody.
- **Official evidence:** Microsoft
  [File Picker v8](https://learn.microsoft.com/en-us/onedrive/developer/controls/file-pickers/?view=odsp-graph-online)
  requires the host to provide authentication tokens to the hosted picker.
  Google
  [Picker](https://developers.google.com/workspace/drive/picker/guides/overview)
  requires a web-app OAuth access token.
- **Impact:** A reader implementing the broad requirement/test rows could omit
  the documented browser exposure and its CSP, origin/message, audience, scope,
  lifetime, memory and teardown controls.
- **Owner / remediation:** **Geordi La Forge** for the independently revised
  requirements and **Seven of Nine** for the independently revised security
  artifacts. Qualify every broad row as refresh/long-lived-credential custody
  and cross-reference the provider-specific browser boundary and tests.

#### FCR-015 — RWL `.3` is not the sole versioned payment workload

- **Severity / confidence / rating:** Medium / High / Contradicted
- **Exact evidence:** `docs/cost/reference-workloads.md:3-6,87-96` defines the
  proposed `.3` Phase 4 dimensions.
  `docs/research/customer-platform-options.md:32-41` calls `.3` the sole
  numerical dictionary, requires Phase 4 to use it, and prohibits an independent
  payment table from overriding it. Yet
  `docs/payments/phase-4-evaluation.md:64-77,144-152` repeats an unversioned
  Lean/Azure/Growth payment table, adds an `Accounting users` dimension absent
  from `.3`, and asks Cyrus to approve only a generic “workload.”
- **Impact:** The duplicated values currently match `.3`, so no displayed
  arithmetic is wrong, but the extra unversioned dimension breaks propagation
  and can drift independently during pricing or approval.
- **Owner / remediation:** **Miles O'Brien**, independent revision owner for the
  #6 payment artifact, with Seven of Nine. Replace the duplicate with an exact
  `.3` reference/derived view; either add accounting users through a new
  controlled workload version or label it a separate non-controlling
  procurement assumption with owner and change rule.

### Coherence checks that passed

- Cost formulas and displayed L1/A1/G1 monthly, year-one and three-year values
  are arithmetically reproducible. They remain planning envelopes, not quotes,
  forecasts, budgets or vendor comparisons.
- `.3` correctly makes all Phase 1 L1/A1 quantities identical; public TCO and
  Phase 2-5 reserves remain separate; P3+ 24x7 coverage remains unpriced rather
  than `$0`.
- Backup/privacy retention, sole performance budgets, phase boundaries,
  professional-review disclaimers, legal-draft deferral, connector packet
  blocked status, Rai Green fingerprint scope, issue state/closure sequence, and
  canonical post-commit approval identity are internally coherent.
- The manifest/source-register structure is complete. Source registers generally
  distinguish narrow official documentation, vendor claims, blocked/partial
  evidence and future tests without converting them into live proof.

### Final gate

The final verdict is **REVISE**. Resolve FCR-013 through FCR-015 and independently
recheck their affected artifacts before validation/commit. The unresolved prior
IDs are FCR-002, FCR-005, F-03 and N-03; the three new findings above explain
those four reopened/remaining statuses. No new reviewer lockout is imposed by
this pass. Every platform/vendor/ADR/public claim/professional disposition,
canonical identifier, exact-head approval, implementation and deployment remains
pending.

---

## Correction-verification pass — Miles, Geordi, Dax and Seven revisions

**Verification date:** 2026-08-25 Pacific
**Evidence cut-off:** Current uncommitted working tree after the four correction
revisions became stable
**Requested scope:** FCR-013 through FCR-015; adversarial N-03 and N-07 through
N-10; workload-version, token-custody, vendor-neutrality, provider-selection and
platform-cycle-symmetry regressions; and the intentionally sequenced N-11 ledger
reconciliation.

### Method and evidence limits

1. Compared the corrected payment, requirements, security, customer-architecture,
   platform-portability, decision-framework, recommendation and ADR artifacts
   against their controlling workload and cross-document claims.
2. Searched all Markdown under `docs/` for superseded active RWL references,
   duplicated payment dimensions, absolute token-custody claims, provider
   preferences/selections and asymmetric fixture identifiers.
3. Rechecked the Microsoft and Google picker mechanics against current official
   primary sources on 2026-08-25:
   - [OneDrive File Picker - OneDrive dev center](https://learn.microsoft.com/en-us/onedrive/developer/controls/file-pickers/?view=odsp-graph-online),
     Microsoft Learn, page metadata updated 2024-06-17: File Picker v8 requires
     the host to provide authentication tokens and documents an `access_token`
     supplied to the picker.
   - [Google Picker overview](https://developers.google.com/workspace/drive/picker/guides/overview),
     Google for Developers: the web-app flow is client-side and requires an
     access token passed through `setOAuthToken`.
4. Revalidated manifest and local-link integrity: 60 Markdown artifacts, 60
   manifest paths, no missing/extra manifest path, and zero broken local Markdown
   links. Outside immutable review/version history, no active `.1` or `.2` RWL
   reference remains.
5. No account, credential, registration, paid resource, live test, approval,
   professional advice, implementation, deployment or production behavior was
   inferred. Current connector packets remain blocked/deferred documented
   research plus future-test requirements.

The current `docs/reviews/adversarial-review.md` still durably defines only N-01
through N-06. The exact N-07 through N-11 wording is therefore not verifiable
from that register. Status below uses the correction scope supplied for this
pass; the missing durable reconciliation is included in N-11 rather than guessed
into a separate defect.

### Per-finding status

| Finding | Status | Current evidence |
|---|---|---|
| FCR-013 | **Resolved** | `docs/payments/phase-4-evaluation.md:10,51-74` now labels every captured processor/accounting flow unranked, gives every row the same incomplete-evidence disposition and applies the same gates. `docs/research/customer-platform-options.md:17` and `docs/decisions/adr-003-customer-platform-phases.md:48-50` likewise contain no Stripe leader/comparator rank. |
| FCR-014 | **Resolved** | `docs/requirements/business-product-requirements.md:47`, `docs/security/control-test-matrix.md:64`, and `docs/security/threat-model.md:44,77` now restrict server-only language to refresh tokens/long-lived credentials, explicitly permit controlled Microsoft/Google short-lived picker-token memory, keep Box unresolved/blocked, and require storage/leak/teardown tests. This matches the official picker mechanics above. |
| FCR-015 | **Resolved** | `docs/payments/phase-4-evaluation.md:78-88,151` names `RWL-2026-08-25.3` as the sole numerical authority, intentionally does not repeat/extend its payment values, and treats accounting seats/licenses as separate unapproved quote inputs with an owner/change rule. |
| N-03 | **Resolved** | The exact prior defects are removed: `docs/research/customer-platform-options.md:12-17,60-62,75-77` now uses unranked CRM, scheduling and payment dispositions without fallback/upgrade/Stripe-leader ordering. Provider-neutrality regressions outside that exact finding remain under FCR-016/N-09 below. |
| N-07 | **Resolved on the supplied payment-correction substance; durable ID definition unverified** | The Miles revision passes the payment-neutrality and sole-RWL checks at `docs/payments/phase-4-evaluation.md:10,51-88,151`. Because the adversarial register has not yet persisted N-07, exact ID traceability awaits N-11 and is not separately double-counted. |
| N-08 | **Resolved** | The Geordi correction is consistently propagated through requirements and security at the FCR-014 evidence above, while provider packets retain blocked/deferred status and future tests. No surviving broad statement says all connector access tokens are server-only. |
| N-09 | **Unresolved** | `docs/architecture/customer-platform.md:5-6,23-31,62,180-184` correctly uses non-selected logical identity/inference adapters, but the package still selects preferences in `docs/research/customer-platform-options.md:16` and `docs/requirements/business-product-requirements.md:28`; see FCR-016. |
| N-10 | **Unresolved** | `docs/architecture/platform-portability.md:73-184`, `docs/architecture/decision-framework.md:64-106`, `docs/architecture/recommendation.md:9-34` and ADR-001 now require a complete symmetric cycle, but ADR-005 still narrows “identical” exit checks to only four static placeholders and managed WordPress; see FCR-017. |
| N-11 | **Unresolved by the intended sequence; not a new defect** | The ledgers remain materially stale: `docs/README.md:64-74`, `docs/artifacts-manifest.md:81-83`, `docs/planning/work-ownership.md:57-64,100-105`, and `docs/decisions/approvals.md:39-41` still publish the earlier 10-resolved/2-unresolved Fact Checker and N-01-N-06 adversarial snapshots. Reconciliation was intentionally deferred until both independent domain checks; it must now incorporate the actual correction outcomes and current reviewer verdicts. |

### New high-confidence findings

#### FCR-016 — Provider-neutral correction did not reach research and requirements

- **Severity / confidence / rating:** Medium / High / Contradicted
- **Exact evidence:** `docs/research/customer-platform-options.md:16` still says
  to “prefer a replaceable Azure-hosted inference adapter, initially a model sold
  by Azure.” `docs/requirements/business-product-requirements.md:28` makes
  M365/Teams scheduling the normal path and Zoom conditional on justification.
  Those preferences conflict with the non-selection claims in
  `docs/architecture/customer-platform.md:5-6,23-31,62,180-184` and the
  non-ordered scheduling shortlist in
  `docs/architecture/recommendation.md:36-43`.
- **Impact:** A reader can treat Azure inference and M365/Teams scheduling as
  already preferred provider decisions even though the corrected architecture
  says no IdP or inference provider is selected and the evidence packets remain
  incomplete.
- **Owner / remediation:** **Miles O'Brien** for the independently revised
  customer-research artifact and **Geordi La Forge** for the requirements
  synthesis, under the coordinator's next strict-lockout assignment. Replace
  provider preference with logical capability constraints or explicitly route a
  separately approved, evidence-backed preference decision; preserve all
  candidates and symmetric gates meanwhile.

#### FCR-017 — Platform symmetry is contradicted by ADR-005's restricted exit set

- **Severity / confidence / rating:** Medium / High / Contradicted
- **Exact evidence:** `docs/decisions/adr-005-cost-portability-and-lock-in.md:67-76`
  says to apply identical checks to only `STATIC-AZ-01`, `STATIC-NL-01`,
  `STATIC-CF-01`, `STATIC-VC-01` and `MWP-PORT-01`. It omits WordPress.com,
  self-hosted WordPress, Wix Studio, Webflow, Squarespace and each named `OTHER`
  fixture. In contrast, `docs/architecture/decision-framework.md:64-93` and
  `docs/architecture/platform-portability.md:73-184` require every retained exact
  candidate to receive the same corpus, gates, evidence window, labor/TCO,
  portability and exit measures or an approved evidence-based hard-gate
  exclusion.
- **Impact:** The decision ADR can authorize asymmetric portability/exit evidence
  even though the controlling framework prohibits selection from a partial or
  unequal cycle.
- **Owner / remediation:** **Seven of Nine** for N-10 follow-up, coordinating the
  eligible independent ADR-005 revision owner. Replace the five-item subset with
  the closed candidate-register rule and the complete reserved fixture families;
  do not infer any fixture exists or has run.

### Count and verdict

There are **3 unresolved material finding IDs: N-09, N-10 and N-11**.
FCR-016 and FCR-017 explain N-09 and N-10 and are not double-counted. N-07's
missing durable definition is part of N-11 reconciliation, not a fourth
substantive defect.

The correction-verification verdict is **REVISE**.

---

## Geordi follow-up correction verification — inference and payment candidate set

**Verification date:** 2026-08-25 Pacific
**Evidence cut-off:** Current working tree after Geordi's latest independent
corrections to `docs/research/customer-platform-options.md` and
`docs/payments/phase-4-evaluation.md`
**Scope:** Recheck N-09 and the supplied adversarial R-01 Braintree scope;
confirm N-03/N-07 were not regressed; reassess FCR-016 and whether N-11 is the
only unresolved status-ledger item.

### Method and evidence limits

I compared the two corrected files with
`docs/architecture/customer-platform.md`,
`docs/decisions/adr-003-customer-platform-phases.md`, the current workload
authority, the prior correction-verification evidence and the integration
ledgers. I also searched the complete documentation package for inference-vendor
preference/selection and Braintree classification. No source was reclassified,
and no live test, account, approval, professional conclusion, resource or
deployment was inferred.

The current `docs/reviews/adversarial-review.md` still ends with N-06 and does
not durably define R-01. R-01 is therefore verified only against the Braintree
scope supplied for this follow-up; exact register wording remains unverified and
belongs in the pending N-11 reconciliation.

### Explicit recheck

| Finding | Updated status | Exact current evidence |
|---|---|---|
| N-09 | **Resolved** | `docs/research/customer-platform-options.md:17` now uses the logical `SelectedInferenceProvider`, says no inference vendor, seller, model, host, deployment type or geography is selected, and leaves candidates unranked behind common gates. `:119,122` limits Azure references to conditional alert behavior and explicitly non-selected candidate evidence. This now agrees with `docs/architecture/customer-platform.md:5-6,30,180-184`. No inference-vendor preference or selection remains in those two controlling customer-platform artifacts. |
| R-01 — Braintree candidate-set expansion | **Resolved on the supplied scope; durable ID definition unverified** | `docs/payments/phase-4-evaluation.md:10,55-65` fixes the retained unranked set at Stripe, Square, PayPal and accounting-hosted flows. Braintree is separately labeled an unverified research lead outside the retained set and cannot be shortlisted, scored, selected or mechanism-tested without current evidence and a symmetrically approved candidate-set amendment. This aligns with `docs/research/customer-platform-options.md:18` and `docs/decisions/adr-003-customer-platform-phases.md:48-50`. |
| N-03 | **Remains resolved** | `docs/research/customer-platform-options.md:13-18,61-63,76-78` retains unranked CRM, scheduling, identity and payment dispositions without the prior fallback/upgrade/Stripe-leader ordering. The Braintree correction creates no processor rank. |
| N-07 | **Remains resolved on the supplied payment scope** | `docs/payments/phase-4-evaluation.md:10,55-88,151` preserves processor neutrality, equal evidence gates for every retained candidate and `RWL-2026-08-25.3` as the sole numerical payment authority. Braintree's research-lead status cannot affect scoring. |
| FCR-016 | **Partially resolved; remains open** | The Azure-inference limb at prior line 16 is corrected by current `docs/research/customer-platform-options.md:17,119,122`. The independent scheduling limb remains: `docs/requirements/business-product-requirements.md:28` makes M365/Teams the normal scheduling path and Zoom conditional on justification, while `docs/research/customer-platform-options.md:14,76-78`, `docs/architecture/recommendation.md:36-43` and ADR-003 describe a non-ordered shortlist. No inference-provider defect remains, but the scheduling preference still requires an approved evidence-backed preference decision or neutral capability wording. |
| N-10 / FCR-017 | **Unchanged / unresolved** | `docs/decisions/adr-005-cost-portability-and-lock-in.md:67-76` still applies “identical” exit checks only to four static placeholders and `MWP-PORT-01`, unlike the complete retained-candidate cycle required by `docs/architecture/decision-framework.md:64-106` and `docs/architecture/platform-portability.md:73-184`. Neither Geordi follow-up file changed this scope. |
| N-11 | **Unresolved; sole unresolved status-ledger item** | `docs/README.md:64-74`, `docs/artifacts-manifest.md:81-83`, `docs/planning/work-ownership.md:57-64,100-105`, and `docs/decisions/approvals.md:39-41` still publish pre-correction Fact Checker/adversarial counts, owners and remaining work. N-11 must reconcile N-09 and R-01 as resolved while preserving the still-open FCR-016 scheduling limb and N-10/FCR-017. |

### Current conclusion

**Yes: N-11 is the sole unresolved status-ledger item.** It is not the sole
unresolved package finding: FCR-016's scheduling-preference limb and
N-10/FCR-017's ADR-005 symmetry contradiction remain material content findings.
The current package verdict therefore remains **REVISE**.

---

## Final targeted verification — Dax scheduling and Seven ADR-005 corrections

**Verification date:** 2026-08-25 Pacific
**Evidence cut-off:** Current stable working tree after the targeted Dax and
Seven corrections
**Scope:** FCR-016's scheduling limb; N-10/FCR-017; and regression checks for
N-08, platform no-selection, candidate symmetry, `RWL-2026-08-25.3`,
TCO/labor/spend gates and approval posture.

### Method

I compared the corrected requirements and ADR-005 text with the customer-platform
shortlists, decision framework, portability contract, recommendation, workload
dictionary, cost model and pending-approval register. I searched all active
non-review documentation for superseded `.1`/`.2` workload references and
rechecked token-custody and platform-selection language. No live test, account,
fixture, quote, approval, professional conclusion, implementation or deployment
was inferred.

### Decisive findings

| Item | Status | Exact current evidence |
|---|---|---|
| FCR-016 scheduling limb | **Resolved** | `docs/requirements/business-product-requirements.md:29` now makes Microsoft Bookings/Teams, Zoom Scheduler and qualifying CRM-native schedulers an unranked shortlist, explicitly leaves all unselected and requires the same entitlement, pricing, contract, DPA/region, export/deletion, accessibility, calendar-conflict, outage, rollback, reconciliation and labor gates. This agrees with `docs/research/customer-platform-options.md:14,76-78`, `docs/architecture/recommendation.md:36-43` and `docs/decisions/adr-003-customer-platform-phases.md:30-36`. The prior “Zoom only when justified” preference is absent. |
| N-10 / FCR-017 | **Resolved** | `docs/decisions/adr-005-cost-portability-and-lock-in.md:69` now applies identical checks to every retained exact fixture family: each custom/static combination, managed WordPress, WordPress.com, self-hosted WordPress, Wix Studio, Webflow, Squarespace and each named `OTHER` candidate. `:78` requires an exact preregistered fixture or an approved evidence-based formal exclusion for a proven hard-gate failure and makes omission/incomplete evidence selection-blocking. `:80` disclaims fixture execution and platform selection. This matches `docs/architecture/decision-framework.md:64-106` and `docs/architecture/platform-portability.md:73-184`. |
| N-08 regression | **No regression** | `docs/requirements/business-product-requirements.md:48` still limits server-only custody to refresh tokens and long-lived credentials, explicitly permits controlled short-lived Microsoft/Google picker-token memory, and keeps Box browser custody blocked pending design and future tests. The same distinction remains in `docs/security/control-test-matrix.md:64`, `docs/security/threat-model.md:44,77` and the provider packets. |
| Platform no-selection and candidate symmetry | **No regression** | ADR-005 `:3-5,9,22,69,78,80` keeps every exact combination unscored, no platform/vendor selected, incomplete evidence selection-blocking, every retained fixture symmetric and execution unproven. `docs/architecture/recommendation.md:9-34` still prohibits selection from a partial cycle. |
| RWL, TCO, labor and spend gates | **No regression** | ADR-005 `:20,24` uses only `RWL-2026-08-25.3`; no active `.1`/`.2` reference exists outside immutable history. `:22,28-38` retains quote/preregistration gates and labels public-site amounts planning envelopes, not comparisons or observations. `:42-52` preserves cumulative floors of 14/24/40/52/62 hours and the unpriced Phase 3 24x7 block, matching `docs/cost/reference-workloads.md:27-36` and `docs/cost/cost-model.md:89-95`. `:56-65` preserves alerts, supported caps, application quotas, kill switches and the rule that Azure budgets are not hard caps. |
| Approval posture | **No regression** | Requirements `:3,12,55,62` remains proposed and authorizes no implementation, resource, vendor account, public claim or professional conclusion. ADR-005 `:3-5,22,80,97-107,111` remains proposed, pending exact-SHA/professional/Cyrus gates, and authorizes no live resource or selection. `docs/decisions/approvals.md:23-45` keeps every PR 2 decision and exact-head approval pending. |

### Final count and verdict

- **Unresolved content findings:** **0**
- **New findings:** **0**
- **Sole remaining inconsistency:** **N-11 stale integration/status ledgers** at
  `docs/README.md:64-74`, `docs/artifacts-manifest.md:81-83`,
  `docs/planning/work-ownership.md:57-64,100-105`, and
  `docs/decisions/approvals.md:39-41`. They still publish superseded reviewer
  counts, owners and residual actions.

The targeted content corrections are clear. Because N-11 remains materially
stale, the final package verdict is **REVISE**.

---

## Final ledger-only verification — post-Sarek N-11 reconciliation

**Verification date:** 2026-08-25 Pacific
**Scope:** `docs/README.md`, `docs/artifacts-manifest.md`,
`docs/planning/work-ownership.md`, `docs/decisions/approvals.md`,
`docs/reviews/adversarial-review.md`, and the complete current Fact Checker
history. Rai's six recorded working-tree fingerprints were recomputed solely to
verify the ledgers' scoped Green wording.

### Verification results

| Check | Status | Exact evidence |
|---|---|---|
| Active correction counts and finding status | **Pass** | `docs/README.md:5-17,70-82`, `docs/artifacts-manifest.md:3-17,84-86`, `docs/planning/work-ownership.md:3-11,61-67`, and `docs/decisions/approvals.md:32-41` consistently report final Fact Checker/adversarial content counts of 0 unresolved / 0 new while preserving original/intermediate history. `docs/reviews/adversarial-review.md:307-351` explicitly supersedes the intermediate active state and records N-03, N-07 through N-10, R-01, FCR-016 and FCR-017 resolved. |
| Issue/PR sequence | **Pass** | `docs/README.md:103-113`, `docs/artifacts-manifest.md:95-100`, `docs/planning/work-ownership.md:83-114`, `docs/decisions/approvals.md:47-59`, and `docs/reviews/adversarial-review.md:353-364` consistently require validate → commit → draft PR with `Closes #3` → child comments naming the actual commit/PR → explicit #4-#9 closure → ledger check → canonical identifiers, while #3 remains open and the PR remains draft. |
| Rai Green scope and fingerprints | **Pass** | `docs/README.md:13-17`, `docs/artifacts-manifest.md:12-17`, `docs/planning/work-ownership.md:7-11,65-67`, `docs/decisions/approvals.md:33,38,40`, and `docs/reviews/adversarial-review.md:341-344` limit Green to the six fingerprinted working-tree artifacts, preserve the original Red, require reopening on material change and keep canonical identifiers/Cyrus approval pending. Independent SHA-256 recomputation matched all six values recorded at `docs/reviews/rai-review.md:134-143`. |
| Approval/evidence posture | **Pass** | `docs/README.md:19-23,68,92,103-113,137-140`, `docs/artifacts-manifest.md:3-17,84-100`, `docs/planning/work-ownership.md:27-38,94-114`, `docs/decisions/approvals.md:23-45`, and `docs/reviews/adversarial-review.md:341-364` make no commit, PR, issue-comment/closure, professional approval, live mechanism, registration, spend, implementation, deployment or exact-head approval claim. |
| Active correction-owner provenance | **Fail** | The current manifest still records **Miles O'Brien** as independent revision owner for `docs/research/customer-platform-options.md` and `docs/payments/phase-4-evaluation.md` at `docs/artifacts-manifest.md:42,51`, although the preserved final Fact Checker history identifies Geordi's later independent corrections at `docs/reviews/fact-check-report.md:953-984`. It records **Geordi La Forge** alone for requirements and ADR-005 at `docs/artifacts-manifest.md:70,78`, while the final targeted verification identifies the later Dax scheduling and Seven ADR-005 corrections at `docs/reviews/fact-check-report.md:1000-1024`. Those active manifest rows omit the latest lockout-correction owners and therefore do not satisfy the requested owner reconciliation. |

### New finding

#### FCR-018 — Active manifest omits the latest independent correction owners

- **Severity / confidence / rating:** Medium / High / Contradicted
- **Impact:** The package's active artifact provenance can route re-review or
  lockout enforcement to superseded owners even though the final content status
  is correct.
- **Owner / remediation:** **Sarek**, as the assigned N-11 integration-ledger
  owner in `docs/planning/work-ownership.md:56,76`. Reconcile the manifest's
  affected owner cells with the full independent revision sequence without
  erasing historical owners or implying approval.

### Final counts and verdict

- **Unresolved content findings:** **0**
- **Unresolved ledger findings:** **1** — FCR-018 / incomplete N-11 owner
  reconciliation (one defect, not double-counted)
- **New findings:** **1** — FCR-018

N-11 is **not yet truly resolved** because active correction-owner provenance
remains stale even though counts, content dispositions, sequence, Rai scope and
approval/evidence posture are reconciled. The final verdict is **REVISE**.

---

## Terminal FCR-018 disposition — owner-provenance recheck

**Verification date:** 2026-08-25 Pacific
**Evidence cut-off:** Current working tree after Sarek's FCR-018-only changes to
`docs/artifacts-manifest.md` and `docs/planning/work-ownership.md`
**Method:** Compared both corrected ledgers with the unchanged domain-file owner
headers and the preserved Geordi, Dax and Seven correction-verification history;
then enumerated every `docs/**/*.md` artifact, manifest entry and README link and
checked all local Markdown links. No approval or additional evidence is inferred.

### FCR-018 recheck

| Artifact | Disposition | Exact evidence |
|---|---|---|
| `docs/research/customer-platform-options.md` | **Resolved** | The artifact remains Seven's original work and names **Geordi La Forge** as latest independent correction owner while locking Seven, Miles, Sarek and Nyota out of that rejected revision at `docs/research/customer-platform-options.md:3-7`. The manifest now preserves the chronological Miles → Sarek → Nyota → **Geordi (latest)** sequence, original Seven ownership and the lockout at `docs/artifacts-manifest.md:23-28,47`; `docs/planning/work-ownership.md:55` routes the latest options correction to Geordi while preserving Seven and Miles provenance. |
| `docs/payments/phase-4-evaluation.md` | **Resolved** | `docs/payments/phase-4-evaluation.md:3-6` names **Geordi La Forge** as latest independent correction owner and preserves the Seven/Miles/Sarek/Nyota lockout. `docs/artifacts-manifest.md:56` preserves Seven as original, Miles as prior correction owner, Geordi as latest and all named locked-out authors; `docs/planning/work-ownership.md:55` records the corresponding prior/latest routing. |
| `docs/requirements/business-product-requirements.md` | **Resolved** | The file records **Geordi La Forge** for N-08 token custody followed by **Jadzia Dax** for FCR-016 scheduling, with Geordi locked out of Dax's rejected revision at `docs/requirements/business-product-requirements.md:3-6`. The same Picard-original, Geordi-prior, Dax-latest chronology and lockout now appears at `docs/artifacts-manifest.md:75` and `docs/planning/work-ownership.md:57`. |
| `docs/decisions/adr-005-cost-portability-and-lock-in.md` | **Resolved** | The preserved decisive verification identifies Seven's N-10/FCR-017 correction at `docs/reviews/fact-check-report.md:1000-1024`. `docs/artifacts-manifest.md:83` and `docs/planning/work-ownership.md:57` now preserve Picard as original, **Geordi La Forge** as prior synthesis correction owner and **Seven of Nine** as latest exit-symmetry correction owner. |
| `docs/architecture/customer-platform.md` | **Resolved** | The artifact names **Jadzia Dax** as independent revision owner for its N-09 vendor-neutral Cycle 4 correction at `docs/architecture/customer-platform.md:3-6`. `docs/artifacts-manifest.md:51` and `docs/planning/work-ownership.md:55` now preserve Seven as original, **Miles O'Brien** as prior correction owner and **Dax** as latest; the general chronology, lockout and no-approval rules remain explicit at `docs/artifacts-manifest.md:23-28` and `docs/planning/work-ownership.md:15-16,47-59`. |

FCR-018 is **resolved**. The corrected ledgers preserve durable original
ownership, prior independent correction provenance, file-specific latest owners
and applicable lockout history without treating ownership as review or approval.

### Coverage and active status

- **Coverage:** **Pass** — filesystem enumeration found 60 Markdown artifacts
  under `docs/`; the manifest contains exactly 60 unique artifact rows, the
  README links all 60, and there are 0 missing/extra manifest entries, 0
  README-unlinked artifacts and 0 broken local Markdown links. This confirms
  `docs/artifacts-manifest.md:93-98`.
- **Active review status:** **Pass** —
  `docs/artifacts-manifest.md:3-18,89-91` and
  `docs/planning/work-ownership.md:3-13,64-70` accurately preserve 0 unresolved
  content findings, the prior FCR-018 Revise, and the fact that its remediation
  awaited this independent disposition. This terminal section is the controlling
  re-verification; all original/intermediate review history remains preserved.
  `docs/README.md:5-23,70-82`, `docs/decisions/approvals.md:23-45`, and
  `docs/reviews/adversarial-review.md:307-364` remain coherent: content findings
  are clear, all issues/decisions/approvals/professional gates and canonical
  identifiers remain pending, and no commit, PR, closure, live test,
  implementation or deployment is claimed.

### Final counts and verdict

- **Unresolved content findings:** **0**
- **Unresolved ledger findings:** **0**
- **New findings:** **0**

The terminal FCR-018 verdict is **CLEAR**.
