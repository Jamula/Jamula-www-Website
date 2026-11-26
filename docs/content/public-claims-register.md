# Public Claims Register

**Status (reconciled `2026-11-25T08:29:40.046-08:00`):** No environmental, ethical,
social, accessibility-conformance, customer-outcome, comparative, performance,
reliability, security-certification, vendor-endorsement, or AI-safety guarantee
claim is approved for publication.

Baseline offering, synthesis, method, founder-identification, direct email inquiry,
and scoped analytics-privacy copy is present in `main` source
([`www/src/pages/index.astro`](../../www/src/pages/index.astro) and
[`www/src/pages/privacy.astro`](../../www/src/pages/privacy.astro)), merged via
exact-SHA pull-request reviews (see provenance summary below; zero versioned
GitHub Releases have been dispatched yet). Merging baseline page source on `main`
is **not** treated here as a blanket formal claims-register sign-off or qualified
legal opinion: `Cyrus approval` cells below preserve only explicitly recorded
approvals rather than fabricating backdated register or counsel sign-offs, and any
expansion, external marketing reuse, or blocked claim remains gated until its
required reviews and explicit owner claims-register approval are recorded.

## Baseline copy currently in `main` source (`www/src/pages/`)

| Surface in `main` | Provenance | Scope in source | Remaining register / activation gate |
|---|---|---|---|
| Homepage `<title>` (`"AI Strategy, Custom Software & Cloud Consulting"` rendered with `" — Jamula"`) and `Organization` JSON-LD (`https://jamula.net/`) | Issues [#89](https://github.com/Jamula/Jamula-www-Website/issues/89); PRs [#96](https://github.com/Jamula/Jamula-www-Website/pull/96), [#98](https://github.com/Jamula/Jamula-www-Website/pull/98) | Descriptive category title and conservative entity identification (`name`, `url`, `logo`); no outcome, credential, or vendor-affiliation claim | Re-review before adding `sameAs`, social profiles, founder `Person` schema, or broader claims |
| Homepage baseline narrative, service scope lists, AI method, and founder identification (`www/src/pages/index.astro`) | PRs [#49](https://github.com/Jamula/Jamula-www-Website/pull/49), [#103](https://github.com/Jamula/Jamula-www-Website/pull/103), [#170](https://github.com/Jamula/Jamula-www-Website/pull/170) | Renders `#43-H-001`–`#43-H-005`, `#43-H-008`–`#43-H-010`, adapted `#43-H-011`, and `#43-F-001`; omits blocked `#43-H-006`, `#43-H-007`, and `#43-F-002` | Formal claims-register sign-off is not fabricated below; any wording expansion, comparative framing, Microsoft/Azure claim, or biographical detail requires full register gate and explicit Cyrus approval |
| Homepage inquiry path (`Contact Jamula, Inc.` → `mailto:spam@jamula.net` + plain-text `spam@jamula.net` fallback) | Issue [#86](https://github.com/Jamula/Jamula-www-Website/issues/86); PR [#98](https://github.com/Jamula/Jamula-www-Website/pull/98) | Owner-approved direct email link and plain-text fallback only; no server-backed contact form or automated intake | Separate privacy/legal/security gate required before introducing any web form, CRM intake, or scheduling widget |
| Scoped website analytics privacy notice (`/privacy/`, `www/src/pages/privacy.astro`) and consent-first GA4 UI | PR [#99](https://github.com/Jamula/Jamula-www-Website/pull/99); open gate [#95](https://github.com/Jamula/Jamula-www-Website/issues/95) (`M01 - Phase 1: Public website`) | Describes opt-in GA4 page-view and contact-click counting, GPC honor, consent choice validity of up to 180 days (while the local-storage record can remain until replaced or site data is cleared), and withdrawal; analytics stays off until accepted. [#95](https://github.com/Jamula/Jamula-www-Website/issues/95) already records Cyrus's exact static-copy approval (`b1e9e82de580f77d3ec5bf83ad8ba5364cf67518254fa5c4519a8c598702e826`), signed-off storage/retention clarification (`fe4b0915685ccac4b3da378e55e07b617efb6104`), exact runtime withdrawal-warning approval, and owner confirmation of the four GA settings on both `.net` and `.com` properties (fulfilled items; do not reclassify as unknown) | Remaining open [#95](https://github.com/Jamula/Jamula-www-Website/issues/95) gates: remove `privacy.astro`'s stale draft frontmatter comment, record dated administrator saved-setting and remaining-restriction evidence (including aggregate-report handling), document the USA-only market / Google DPA / transfer disposition, obtain separate analytics activation approval, and complete post-release four-origin verification |

## Existing candidate entries (pre-issue-#43)

| Exact candidate wording | Status | Scope/baseline | Evidence | Owner | Required review | Cyrus approval | Review/expiry | Correction/removal |
|---|---|---|---|---|---|---|---|---|
| "Jamula provides technology consulting and custom software with AI-native delivery." | Superseded in homepage source by `#43-H-001`; unverified for standalone publication | Company positioning only; no outcome implication | [Approved evaluation plan](../planning/evaluation-plan.md) records the internal requirement; external substantiation/wording review pending | Content lead | Fact Checker, Legal researcher, Responsible AI reviewer | No | Before any use; 90-day factual review if approved | Omit until approved; remove/correct on dispute or source change |
| "Jamula is Microsoft-preferred and multi-cloud capable." | Proposed; **blocked** (absent from `www/`) | Preference/capability wording; must not imply Microsoft endorsement or demonstrated multi-cloud outcome | Internal product requirement only; capability baseline and endorsement-risk review absent | Content lead | Fact Checker, Legal researcher, Responsible AI reviewer | No | Before any use; immediate re-review on vendor/relationship change | Do not publish while blocked |
| "Jamula targets WCAG 2.2 Level AA." | Proposed aspiration; not conformance (absent from `www/`) | Engineering target, not a statement that any site passes | [Experience gate](../experience/accessibility-seo-performance.md); future implementation evidence absent | Experience lead/Content lead | Quality/reliability engineer, Fact Checker, Legal researcher | No | At release and quarterly if approved | Use target language only if approved; never shorten to "accessible/compliant" |

No environmental, ethical/social, customer-result, security/privacy-certification, AI-performance,
reliability, or sustainability candidate has sufficiently exact wording and evidence to enter
this register. `Refs #3; child #4`.

---

## Issue #43 — Homepage copy draft candidate entries

**Status of entries below:** Baseline offering, synthesis, method, next-step, and
founder-identification copy (`#43-H-001`–`#43-H-005`, `#43-H-008`–`#43-H-010`,
adapted `#43-H-011`, and `#43-F-001`) is present in `main` source
([`www/src/pages/index.astro`](../../www/src/pages/index.astro)) via reviewed PRs
`#49`, `#98`, and `#103`, whereas `#43-H-006`, `#43-H-007` (Microsoft/Azure), and
`#43-F-002` (founder technical background) remain **blocked and absent from `www/`**.
Because PR merges are not backdated here as standalone claims-register sign-offs or
formal legal opinions, the `Cyrus approval` column retains its conservative register
state (`No` or scoped `in principle` notes) until explicit per-entry register
sign-off is recorded; no expansion beyond the baseline `www/src/pages/index.astro`
copy is authorized without completing the named gates.

### Offering and positioning

| Exact candidate wording | Status | Scope/baseline | Evidence | Owner | Required review | Cyrus approval | Review/expiry | Correction/removal |
|---|---|---|---|---|---|---|---|---|
| `#43-H-001` "Jamula provides AI strategy, custom software, and cloud consulting." | In `main` source (`www/src/pages/index.astro` headline/lead via PRs `#49`, `#103`, `#98`); standalone claims-register sign-off not separately recorded | Company offering categories; no outcome or performance implication | PRODUCT.md "Offering categories (owner-approved, category-level product truth)"; issue #43 approval comment; descriptive `<title>` approved in `#89` / PR `#98` | Content lead | Fact Checker (exact wording), Legal researcher, Responsible AI reviewer | Category truth and `<title>` (`#89`) approved; standalone claims-register entry: No | 90-day factual review; re-gate before external reuse or expansion | Remove/correct on scope change or dispute |
| `#43-H-002` "Together — not as separate projects." / integrated engagement positioning | In `main` source (`www/src/pages/index.astro` via PRs `#49`, `#103`); standalone claims-register sign-off not separately recorded | Positioning statement about integrated engagement model; no outcome implication | Internal product requirement (PRODUCT.md: "Strategy through execution"); no external outcome claim | Content lead | Fact Checker, Legal researcher, Responsible AI reviewer | No (separate claims-register sign-off not recorded) | 90-day review; re-gate before expansion | Remove/correct if engagement model changes |
| `#43-H-008` "An engagement with Jamula typically starts with understanding: what you're trying to accomplish, what you already have, and where the real constraints are." | In `main` source (`www/src/pages/index.astro` via PRs `#49`, `#103`); standalone claims-register sign-off not separately recorded | Process description; no outcome claim; "typically" hedges against strict process promise | Internal product requirement and positioning (PRODUCT.md); no external source | Content lead | Fact Checker, Legal researcher | No (separate claims-register sign-off not recorded) | 90-day review; re-gate before expansion | Remove/correct if engagement process changes |

### AI Strategy

| Exact candidate wording | Status | Scope/baseline | Evidence | Owner | Required review | Cyrus approval | Review/expiry | Correction/removal |
|---|---|---|---|---|---|---|---|---|
| `#43-H-003` "Jamula helps organizations think clearly about AI: what it can do for your situation, what it cannot do, and how to make a decision that holds up." | In `main` source (`www/src/pages/index.astro` via PRs `#49`, `#103`); wording aligned with draft Section 2 verbatim (`#46`); standalone claims-register sign-off not separately recorded | Approach description; no outcome or competitor implication | Internal positioning (PRODUCT.md: "Practical, responsible AI guidance without hype"); no external evidence | Content lead | Fact Checker, Legal researcher, Responsible AI reviewer | No (separate claims-register sign-off not recorded) | 90-day review; re-gate before expansion | Remove/correct on dispute or framing change |
| `#43-H-004` "A strategy you can evaluate against something measurable — defined before work starts." | In `main` source (`www/src/pages/index.astro` via PRs `#49`, `#103`); wording aligned with draft Section 2 verbatim (`#46`); standalone claims-register sign-off not separately recorded | Approach description; process wording; no outcome claim | Internal product positioning (PRODUCT.md, content strategy); no external substantiation | Content lead | Fact Checker, Legal researcher, Responsible AI reviewer | No (separate claims-register sign-off not recorded) | Re-gate before expansion or external reuse | Remove/correct on process change |

### Custom Software

| Exact candidate wording | Status | Scope/baseline | Evidence | Owner | Required review | Cyrus approval | Review/expiry | Correction/removal |
|---|---|---|---|---|---|---|---|---|
| `#43-H-005` "Jamula designs and builds software for the specific problem at hand: the workflow that doesn't fit a template, the integration that existing products can't make, the tool that turns your AI strategy into something your team actually uses." | In `main` source (`www/src/pages/index.astro` via PRs `#49`, `#103`); standalone claims-register sign-off not separately recorded | Custom software positioning; no outcome or performance claim | Internal product requirement (PRODUCT.md, requirements docs); no external source | Content lead | Fact Checker, Legal researcher, Responsible AI reviewer | No (separate claims-register sign-off not recorded) | 90-day review; re-gate before expansion | Remove/correct on scope change |

### Cloud Consulting and Microsoft/Azure

| Exact candidate wording | Status | Scope/baseline | Evidence | Owner | Required review | Cyrus approval | Review/expiry | Correction/removal |
|---|---|---|---|---|---|---|---|---|
| `#43-H-006` "Jamula brings deep Microsoft and Azure expertise to client work." | Proposed; **blocked** (absent from `www/`) pending endorsement-risk and exact-wording review; **additional prerequisite (#46)**: before publication clearance, Cyrus must disclose any current or recent Microsoft employment, contractor, or advisory relationship to qualified counsel — nature of relationship must not be recorded in this repository | Jamula's own capability and training; explicitly not a partnership, endorsement, or affiliation claim; must not imply Microsoft endorses Jamula; supersedes prior "Microsoft-preferred" blocked entry for this context | Internal positioning (PRODUCT.md: "Deep Microsoft and Azure expertise — stated as Jamula's own capability and preference, never as an endorsement, partnership, or affiliation with Microsoft"); capability baseline absent; endorsement-risk review absent | Content lead | Fact Checker (capability baseline), Legal researcher (**BLOCKING** — endorsement/trademark risk must be cleared before any use), Responsible AI reviewer | No | Before any use; immediate re-review on vendor/relationship change | Do not publish while blocked on Legal researcher endorsement-risk review |
| `#43-H-007` "We work on Microsoft and Azure because that's where we're deepest — but we build in ways that preserve your ability to move." | Proposed; **blocked** (absent from `www/`) pending Legal researcher endorsement-risk and Fact Checker wording review; **additional prerequisite (#46)**: before publication clearance, Cyrus must disclose any current or recent Microsoft employment, contractor, or advisory relationship to qualified counsel — nature of relationship must not be recorded in this repository | Capability statement with portability note; not an endorsement or multi-cloud performance claim; current multi-cloud claims-register entry remains blocked | Internal positioning (PRODUCT.md portability principles); no external verification | Content lead | Fact Checker, Legal researcher (endorsement + multi-cloud capability), Responsible AI reviewer | No | Before any use | Do not publish while blocked |

### Responsible AI approach

| Exact candidate wording | Status | Scope/baseline | Evidence | Owner | Required review | Cyrus approval | Review/expiry | Correction/removal |
|---|---|---|---|---|---|---|---|---|
| `#43-H-009` "Jamula starts by checking whether incomplete data, unclear objectives, or untested assumptions are the real problem." | In `main` source (`www/src/pages/index.astro` via PRs `#49`, `#103`); wording reframed as explicit Jamula method (`#46`); standalone claims-register sign-off not separately recorded | Jamula process description; scoped to Jamula's own approach; no industry-level generalization | Internal positioning (PRODUCT.md responsible AI differentiation); wording is Jamula-perspective only | Content lead | Fact Checker, Legal researcher, Responsible AI reviewer (accuracy of AI framing) | No (separate claims-register sign-off not recorded) | Re-gate before expansion or external reuse | Remove/correct on framing change |
| `#43-H-010` "We don't claim AI is safe by default, and we don't claim any particular AI implementation is safe until we can evaluate it against something measurable. We aim to make the evaluation criteria clear and to tell you what we find." | In `main` source (`www/src/pages/index.astro` via PRs `#49`, `#103`); `aim` replaces prior `commit` (`#46` fix); standalone claims-register sign-off not separately recorded | Responsible AI approach description; negative claim ("don't claim") plus process statement ("aim"); no guarantee; `aim` does not constitute a safety certification or exhaustive proof | Internal positioning (PRODUCT.md responsible AI differentiation); no external source | Content lead | Fact Checker, Responsible AI reviewer (**BLOCKING** for any expansion — must preserve non-guarantee framing), Legal researcher | No (separate claims-register sign-off not recorded) | Re-gate before any wording change or external reuse | If Responsible AI reviewer identifies misrepresentation, revise or remove immediately |

### Next step / CTA

| Exact candidate wording | Status | Scope/baseline | Evidence | Owner | Required review | Cyrus approval | Review/expiry | Correction/removal |
|---|---|---|---|---|---|---|---|---|
| `#43-H-011` "If you're trying to understand whether AI has a real application in your organization… the right place to start is a direct conversation. We'll tell you honestly what we think — including whether we're a good fit or whether someone else is better suited." | Adapted wording in `main` source (`www/src/pages/index.astro` `#next` section via PRs `#49`, `#103`) paired with `mailto:spam@jamula.net` + plain-text fallback (`#86` / PR `#98`) | Educational next-step posture; adapted on-page `#synthesis` link plus owner-approved `mailto:spam@jamula.net` contact link; no outcome claim and no server-side form | Internal positioning (homepage posture: credibility and education); issue `#86` and PR `#98` for `mailto:spam@jamula.net` | Content lead | Fact Checker, Legal researcher, Experience lead (accessible contact target & plain-text fallback verified in `test_built_site.mjs` / `homepage-contact.test.mjs`) | Contact address/link (`#86` / PR `#98`) approved; standalone claims-register entry for prose: No | Re-gate before replacing email address or adding any intake form/scheduling tool | Remove/correct if inquiry mailbox or intake channel changes |

### Founder

| Exact candidate wording | Status | Scope/baseline | Evidence | Owner | Required review | Cyrus approval | Review/expiry | Correction/removal |
|---|---|---|---|---|---|---|---|---|
| `#43-F-001` "Cyrus Jamula founded Jamula." | In `main` source (`www/src/pages/index.astro` `#about` section via PRs `#49`, `#103`); standalone claims-register sign-off beyond principle approval not separately recorded | Founder identification only; no title, employer, credentials, affiliations, or private details | Issue #43 Cyrus approval comment, 2026-08-29: "Homepage copy may identify Cyrus Jamula as founder" | Content lead | Fact Checker (exact-wording verification), Legal researcher (privacy/publicity review), Responsible AI reviewer | Identification as founder approved in principle (`#43`); standalone claims-register sign-off: No | Annual review; do not expand without separate gate | Remove/correct if identification changes; do not elaborate into biographical detail without separate gate |
| `#43-F-002` Technical background description for Cyrus Jamula | **Blocked** (absent from `www/`) — exact wording does not exist; source confirmation required | Founder technical background within approved boundary; excluded: Microsoft employer/title, community/religious affiliations, addresses, client names, private contacts, unverified credentials | No approved wording; source lead (LinkedIn profile) identified in [founder-source-register.md](founder-source-register.md); no claim extracted | Content lead | Fact Checker (source verification), Legal researcher (privacy/endorsement), Responsible AI reviewer, Experience lead | No | Before any use; source must be confirmed before claim is drafted | Do not publish; no placeholder or inferred wording may substitute |

**Context:** `Refs #43; parent #39; wording corrections #46; baseline PRs #49, #96, #98, #99, #103`. Category-level
offering truth and baseline `mailto:spam@jamula.net` / `<title>` updates were merged via exact-SHA PR review,
while blocked rows and any claims beyond the baseline copy currently in `www/src/pages/` remain strictly
gated on Fact Checker, Legal researcher, Responsible AI reviewer, and explicit Cyrus approval before publication.

