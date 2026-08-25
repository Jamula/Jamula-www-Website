# Platform Options Research

**Status:** Exploratory documented research; no score, rank, finalist or
architecture decision is eligible
**Evidence cut-off:** 2026-08-24 Pacific
**Context:** `Refs #3; child #8`; Cycle 2 remediation for FCR-001, FCR-002 and
FCR-007

No account, credential, live service, paid resource, deployment, production code
or production proof was created.

## Method status and reviewer correction

The gates, weights, penalties, score floor, risk ceiling and workloads were
written before the initial arithmetic, but **Cyrus had not approved them before
that scoring occurred**. More importantly, the initial calculation scored
combinations whose commercial plan, redirect, restore or other hard gates were
still conditional or blocked. That contradicted the stated rule.

All prior numeric scores, ratings, comparative margins, ranks and ordering
language in this artifact are therefore **withdrawn exploratory output**. They
are not historical decision evidence and must not be copied into synthesis. A
failed, conditional without required evidence, unverified or blocked hard gate
means **unscored**.

The single workload source is
[`../cost/reference-workloads.md`](../cost/reference-workloads.md), version
`RWL-2026-08-25.3`. It distinguishes Phase 1 public-site TCO from Phase 2-4
planning reserves.

## Proposed method awaiting Cyrus approval

### Hard gates

An exact `platform + plan + region + required add-ons + publication path`
combination may be scored only after evidence supports every gate:

1. **Commercial:** custom domain and Jamula commercial use are permitted under
   the exact plan, dependency and add-on licenses.
2. **Security/operations:** HTTPS, supported updates, least privilege, recovery,
   incident path, backup/rebuild and tested rollback exist.
3. **Privacy:** contact data can be minimized, retained/deleted and exported
   under approved processor terms; customer secrets remain outside the site/CMS.
4. **Accessibility:** complete WCAG 2.2 AA journeys can be independently tested
   and remediated, including required third parties or equivalent fallback.
5. **Export/exit:** owned text, metadata, media, redirects and form data have a
   machine-readable export; DNS and URLs can move.
6. **Delivery:** production is a reviewed immutable state derived from protected
   `main`; previews never become production.
7. **Canonical routing:** Jamula.net is canonical and Jamula.com redirects over
   valid HTTPS with safe path/query preservation.

`Conditional` records a future test, not a pass. `Blocked` is unresolved. Design
intent and vendor documentation are not mechanism or production evidence.

### Proposed scoring only after gates

Subject to Cyrus approval, weights total 100:
security/privacy/accessibility 20; launch/editorial 15; portability/export 20;
main-only delivery/test/rollback 15; quoted three-year TCO 15;
operations/support 10; scale/integration seams 5.

Ratings are 0-5 and require criterion-level evidence. Proposed penalties are:
0 current primary evidence plus relevant test; 2 primary documentation only;
5 stale/ambiguous or secondary; 10 vendor claim without corroboration/test;
15 material blocked/unverified. The proposed floor is 70/100 and risk ceiling is
zero Critical/High plus at most three owned, dated, testable Medium risks.

No TCO rating is permitted until dated US quotes cover the complete exact
combination, DNS/email and included customer services. This method itself remains
non-decision-eligible until Cyrus approves exact version/SHA and spending limits
[S01](platform-source-register.md).

## Equal-rubric discovery

| Option | Documented strengths | Burden, lock-in and unresolved evidence |
|---|---|---|
| Custom static-first (Astro, Next.js, SvelteKit, Nuxt, Blazor or simpler alternative) | Jamula can own source, routes, content schema, tests and build artifact; multiple host shapes are technically plausible | Exact framework/host/plan commercial terms, accessibility, redirect, restore, support labor and host coupling remain gates; no framework has an approved advantage |
| Wix Studio | Integrated visual editing, CDN, managed updates and HTTPS are documented narrowly [S15] | Price, full export, source artifact and protected-main publication remain blocked [S14-S15] |
| WordPress.com | Managed operation, plugins/themes and Git/GitHub deployment are advertised on Business; WXR/full-backup distinctions are documented [S12-S13] | Exact price is blocked; WXR omits design/plugins/media; plan-specific restore, patch and main-only behavior require tests |
| Named managed WordPress | Familiar editor/ecosystem and potentially portable database/media | No named host/plan quote or contract exists; patch, plugin, staging, backup/restore, incident and support burden require the symmetric fixture |
| Self-hosted WordPress | GPLv2-or-later core and infrastructure control [S20] | Operator owns hardening, patching, restore, compatibility, incident response and availability; exact hosting stack remains unverified |
| Webflow | Displayed site price and code-export omissions are documented [S10-S11] | Required Workspace+Site combination, naming, main-only publication and functional export/restore remain unresolved |
| Squarespace | Integrated builder/hosting may reduce administration | Official price/export responses were insufficient; commercial, export, delivery and redirect gates are blocked [S16-S17] |
| Ghost | Publishing-focused managed/self-host shape is plausible | Current price, export completeness, workflow and later seams remain blocked [S21] |
| Microsoft Power Pages | Microsoft-aligned later portal comparator | Phase 1 cost, source portability, static export and main-only artifact flow were not established |

Hosting remains separate from authoring. GitHub Pages fails the documented
online-business commercial gate [S08]. Vercel Hobby is described for personal
projects [S07]. Netlify's displayed $0/$9/$20 credit rates do not establish
Jamula's contractual eligibility [S06]. Cloudflare Pages limits are documented,
but commercial/overage fit remains unresolved [S05]. Azure Static Web Apps
documents free hosting/custom-domain/TLS behavior and an hourly Standard plan,
but no usable Standard USD amount was retrieved [S02].

## Current gate disposition: all exact combinations unscored

| Shape | Material unresolved hard-gate evidence | Disposition |
|---|---|---|
| Custom static + any named host/plan | Exact commercial terms; complete accessibility journey; Jamula.com redirect; restore/rollback; support cadence | **Unscored** |
| WordPress.com Business | Exact price/terms; full export/restore; plugin/theme controls; equivalent protected-main publication; routing/accessibility | **Unscored** |
| Named managed WordPress | Named plan/contract; security/update SLA; export/clean-host restore; main-only publication; accessibility/routing | **Unscored** |
| Self-hosted WordPress | Exact host/operations model; patch/incident/recovery staffing; accessibility/routing | **Unscored** |
| Webflow paid Workspace + Site | Complete combined quote; functional export/restore; main-only publication | **Unscored** |
| Wix Studio | Price/terms, export, main-only publication and routing | **Unscored** |
| Squarespace | Price/terms, export, main-only publication, accessibility and routing | **Unscored** |
| Ghost | Exact plan/terms, export/restore, publication and routing | **Unscored** |
| Power Pages | Deferred Phase 3 evidence packet | **Unscored / deferred** |

This is an incomplete market comparison, not a final shortlist.

## Cross-cutting documented findings

### Domain, DNS, TLS and email

Namecheap may remain registrar only if a later approved decision supports it;
authoritative DNS and hosting are separate. Before launch require account
recovery, phishing-resistant MFA where supported, registrar lock, DNSSEC/DS, CAA,
DNS audit and takeover checks. Namecheap documents free 2FA and custom-DNS DS
management narrowly [S18-S19]; registry lock, renewals and exact mailbox prices
remain quote items.

Both domains need valid certificates. Jamula.net is canonical; Jamula.com needs a
future end-to-end permanent redirect test. Azure documents custom domains,
automatic TLS and configurable redirects, not Jamula path/query behavior
[S22-S23]. Workforce and transactional mail remain separate; SPF, DKIM, staged
DMARC and MTA-STS/TLS-RPT are future implementation tests. Prices remain blocked
[S24-S25].

### Protected `main`, observability and sustainability

`main` alone produces production. PRs validate and may create data-free previews.
Build/reconcile one immutable state, retain checksum/SBOM/provenance, and prohibit
unreviewed dashboard publication. GitHub rulesets are documented, not configured
evidence [S09].

Monitor HTTPS/redirect, certificate/domain/DNS, deploy provenance, errors/latency,
Core Web Vitals, forms/mail, quota/cost and restore age with redacted bounded
logs. Vendor sustainability reports [S26-S27] are vendor-reported leads, not
Jamula measurements or comparative proof.

## Evidence classes and next cycle

- **Documented research:** this discovery, official-source register and unapproved
  method.
- **Blocked/deferred:** Wix, Squarespace, Ghost, complete Webflow, WordPress
  quotes/contracts, static-host commercial terms, Azure regional price, domain
  renewals and mail.
- **Disposable mechanism evidence:** only the symmetric, preregistered fixtures in
  [`platform-portability.md`](../architecture/platform-portability.md), after
  Cyrus approves exact plans/accounts/spend.
- **Future implementation tests:** complete accessibility journeys, canonical
  routing, DNS/email, main-only provenance, backup/restore, incident, cost cap and
  kill switches.

Next: obtain dated non-purchase quotes and terms, have Fact Checker verify them,
freeze exact static and managed-WordPress combinations, execute equal fixtures,
measure control labor, and only then apply a Cyrus-approved method. No option is
recommended by this artifact.
