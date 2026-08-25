# Platform research source register

**Verified/accessed:** 2026-08-24 Pacific unless stated otherwise
**Context:** `Refs #3; child #8`

Statuses: **verified** means the official page returned content supporting the
exact narrow claim; **partial** means useful official content returned but a
material field was absent; **blocked** means the attempted official source was
inaccessible, dynamic, redirected incorrectly, or returned insufficient content.
Vendor documentation is evidence of documented behavior, not independent
production proof. Prices are snapshots, USD and US/global-web presentation unless
the row says otherwise; tax and checkout may differ.

| ID | Official URL | Title / publisher | Region/version | Exact supported claim | Status |
|---|---|---|---|---|---|
| S01 | [`docs/planning/evaluation-plan.md`](../planning/evaluation-plan.md) | Jamula Website Evaluation and Squad Bootstrap Plan / Jamula | Repository version at access | Requires equal rubric, preregistered gates/workloads/weights/penalties/risk ceiling, four cost scenarios, main-only production, portability contract, canonical-domain behavior and approval gates. | **verified**, internal durable source |
| S02 | https://azure.microsoft.com/en-us/pricing/details/app-service/static/ | Azure Static Web Apps pricing / Microsoft | US English; price snapshot | Free plan describes hosting, SSL, custom domain and 1m free Functions executions; Standard is hourly and supports bandwidth overage. The page response did not expose a Standard USD figure. | **partial** |
| S03 | https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/tutorial-acm-create-budgets | Create and manage budgets / Microsoft Learn | Doc updated 2025-09-26; Azure global | Budgets notify on actual/forecast thresholds; resources are not affected and consumption is not stopped; data may lag 8–24h and evaluation occurs every 24h. | **verified** |
| S04 | https://azure.microsoft.com/en-us/pricing/details/app-service/linux/ | App Service pricing—Linux / Microsoft | US English; current page | F1 has 60 CPU min/day, 1 GB RAM/storage, no SLA and is not supported for production; dynamic dollar cells were blank. | **verified** limits; **blocked** price |
| S05 | https://developers.cloudflare.com/pages/platform/limits/ | Pages limits / Cloudflare | Updated 2026-07-16; Free/Pro/Business | Free: 500 builds/month, 20-minute timeout, 100 custom domains, 20k files, 25 MiB asset, unlimited previews; Functions use Workers quota. | **verified** |
| S06 | https://www.netlify.com/pricing/ | Netlify Pricing / Netlify | Current USD | Free $0/300 credits, Personal $9/1,000, Pro $20/3,000; auto-recharge packs and unit credit consumption are published. | **verified** snapshot; commercial account-fit still needs terms review |
| S07 | https://vercel.com/pricing | Vercel Pricing / Vercel | Current USD | Hobby $0 is described for personal projects; Pro $20/month. Page publishes included edge requests/transfer and usage unit prices. | **verified** snapshot |
| S08 | https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits | GitHub Pages limits / GitHub Docs | Current GitHub.com | Pages is not intended/allowed as free hosting for an online business/ecommerce/SaaS; 1 GB site, soft 100 GB/month bandwidth and build limits. | **verified**; production commercial gate fails |
| S09 | https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets | About rulesets / GitHub Docs | GitHub.com, current | Rulesets can restrict branch pushes/deletion, allow controlled bypass and layer with branch protection; most restrictive aggregate applies. | **verified** |
| S10 | https://webflow.com/pricing | Plans & pricing / Webflow | Current USD, billed yearly where shown | Starter free: 2 pages/1 GB/50 forms. Basic $15 annually; Premium $25 annually with CMS and selectable bandwidth. Two consecutive bandwidth-overage months can auto-upgrade. Taxes added at checkout. | **verified** snapshot |
| S11 | https://help.webflow.com/hc/en-us/articles/33961386739347-Code-export | Export Webflow site code / Webflow Help | Current | Paid Workspace exports HTML/CSS/JS/assets; Site plans alone do not. CMS/user/ecommerce/localization functionality, forms, search and password protection do not survive code export; collections can export separately to CSV. | **verified** |
| S12 | https://wordpress.com/pricing/ | WordPress.com Pricing / Automattic | Current page | Page returned plan features (unlimited pages/posts/users/visitors; Business advertises plugins, 50 GB, backups, SSH/WP-CLI/Git/GitHub deployments) but price placeholders were blank. | **partial** features; **blocked** price |
| S13 | https://wordpress.com/support/export/ | Export your site’s content / WordPress.com | Current | WXR/XML contains posts/pages/comments/categories/tags and media links, not theme design/customizations/plugins or actual media; Business/Commerce can download full backup. | **verified** |
| S14 | https://www.wix.com/studio/plans | Wix Studio Pricing / Wix | Current page | Only the page title returned; no price/limits usable for a claim. | **blocked** |
| S15 | https://support.wix.com/en/article/exporting-or-embedding-your-wix-site-elsewhere | Exporting or embedding your Wix site elsewhere / Wix Support | Current response | Response documented Wix-managed global CDN, updates, HTTPS/SSL and monitoring but did not provide the expected export terms. | **partial** hosting; **blocked** export |
| S16 | https://www.squarespace.com/pricing | Pricing / Squarespace | Current page | Response did not expose website plan prices; it only surfaced payment availability text. | **blocked** |
| S17 | https://support.squarespace.com/hc/en-us/articles/206566687-Exporting-your-site | Exporting your site / Squarespace Help | Current page | Response redirected into generic/help form content and did not expose export rules. | **blocked** |
| S18 | https://www.namecheap.com/security/2fa-two-factor-authentication/ | Two-Factor Authentication / Namecheap | Current | Namecheap states 2FA adds an account-security layer and is free. Method strength/support still needs account-level verification. | **verified** narrow claim |
| S19 | https://www.namecheap.com/support/knowledgebase/article.aspx/9722/2232/how-can-i-enable-dnssec-for-my-domain/ | Managing DNSSEC for domains pointed to Custom DNS / Namecheap Support | Current | Namecheap permits enabling DNSSEC and entering provider DS values for custom nameservers; says allow 60 minutes. | **verified** |
| S20 | https://wordpress.org/about/license/ | License / WordPress.org | Modified 2023-07-11 | WordPress software is GPLv2 or later; WordPress states plugins/themes it considers derivatives inherit GPL. | **verified**; legal scope needs professional review |
| S21 | https://ghost.org/help/exports/ | Exports / Ghost Help | Current response | Attempt returned only navigation/marketing fragment, insufficient to support export claims. | **blocked** |
| S22 | https://learn.microsoft.com/en-us/azure/static-web-apps/custom-domain | Custom domains with Azure Static Web Apps / Microsoft Learn | Updated 2026-01-23; Azure global | Custom domains are supported; free TLS certificates are automatically created; external DNS and zero-downtime TXT validation flow are documented. | **verified** |
| S23 | https://learn.microsoft.com/en-us/azure/static-web-apps/configuration#routes | Configure Azure Static Web Apps / Microsoft Learn | Updated 2026-03-25 | `staticwebapp.config.json` controls routes/headers; redirect rules can return 301/302. Cross-domain path/query preservation was not proven. | **verified** mechanism; implementation test needed |
| S24 | https://www.namecheap.com/hosting/email/ | Private Email / Namecheap | Current response | Response described business-email features but exposed no usable prices. | **blocked** price |
| S25 | https://azure.microsoft.com/en-us/pricing/details/communication-services/ | Azure Communication Services pricing / Microsoft | Current response | Response exposed no email unit prices. | **blocked** price |
| S26 | https://www.microsoft.com/en-us/corporate-responsibility/sustainability/report | Environmental Sustainability Report / Microsoft | Current corporate page | Official sustainability material exists, but fetched content did not provide a workload-specific Azure emissions factor usable here. | **partial**, vendor-reported |
| S27 | https://www.cloudflare.com/impact/ | Cloudflare Impact / Cloudflare | 2025 report linked; page current | Cloudflare publishes impact material and sustainability framing; no Jamula-workload emissions factor was verified. | **partial**, vendor-reported |
| S28 | https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages | What is GitHub Pages? / GitHub Docs | Current GitHub.com | Pages serves repository HTML/CSS/JS, supports custom domains, and logs visitor IP addresses for security. | **verified** |
| S29 | https://docs.github.com/en/actions/how-tos/manage-workflow-runs/skip-workflow-runs | Skipping workflow runs / GitHub Docs | Current GitHub.com | Required skipped checks can remain pending and block merge; skip instructions do not apply to every event. | **verified**; supports fail-closed CI design |

## Blocked/deferred evidence packets

| Packet | Attempted evidence | Blocker | Decision effect | Required remediation / owner |
|---|---|---|---|---|
| Wix Studio | S14–S15 | Dynamic/insufficient official responses | No gate pass, score or TCO assertion | Geordi: obtain dated US quote, commercial terms, full export/data/API and Git/main-only publishing docs; Fact Checker verifies |
| Squarespace | S16–S17 | Dynamic/incorrect help response | No gate pass, score or TCO assertion | Geordi: obtain dated plan quote and export/redirect/developer docs |
| Webflow complete plan | S10–S11 | Site price known; required Workspace price and main-only flow not established | Not scored as finalist | Geordi: quote combined plan and test export/rebuild in synthetic spike |
| WordPress variants | S12–S13, S20 | WordPress.com price blank; managed-host contract unnamed | **Unscored; prior exploratory output withdrawn; exact plan evidence pending** | Geordi: official checkout quote and two managed-host quotes; Miles: restore/update SLA review |
| Ghost / Power Pages | S21 / not reached | Insufficient official packet | Deferred comparator | Re-open only if shortlist needs another option or portal decision requires it |
| Registrar/domain/email | S18–S19, S24–S25 | Renewal, registry lock, mailbox and transactional-email unit prices absent | Planning reserve only | Obtain non-purchase Namecheap/Azure/M365 quotes; Sarek reviews terms |
| Sustainability comparison | S26–S27 | Non-comparable vendor reports; no workload measurements | No vendor awarded points | Fact Checker reviews reports; implementation measures bytes/build/runtime/storage |

## Claim-use rules

1. Re-verify every price at checkout before approval and record billing cadence,
   seat/site/account basis, taxes, renewal, auto-upgrade and overage.
2. A “free” plan is not commercially eligible unless its terms expressly fit
   Jamula; absence of a prohibition is not treated as permission.
3. Marketing security, availability or sustainability language is not production
   proof. Bind contractual claims to the purchased plan and test what Jamula can.
4. Quotes and professional estimates expire after 30 days; technical limits and
   terms are rechecked at final ADR approval and before implementation.
5. Public sustainability, security, performance or accessibility claims need a
   named owner, measured baseline, scope, approval, review date and removal plan.

## Recommended next evidence cycle

After Cyrus approves the preregistration, spend no money: collect official
Wix/Squarespace/WordPress/managed-host/Namecheap/email/Azure quotes, then have
Fact Checker independently verify the exact supported claims. Only thereafter
authorize the bounded synthetic spikes in
[`../architecture/platform-portability.md`](../architecture/platform-portability.md).
`Refs #3; child #8`.
