# Accessibility, SEO, and performance gates

**Work context:** Refs #3; child #5
**Owner:** Jadzia Dax, Experience & Design Lead
**Required reviewers:** Miles O'Brien, Nyota Uhura, Fact Checker
**Status:** Evaluation baseline and future-test specification; no completed audit or conformance claim
**Source verification date:** 2026-08-24

## 1. Normative scope

`MUST`, `MUST NOT`, `SHOULD`, and `MAY` identify release requirements, recommendations, and options. These gates apply to every Jamula-authored page, component, template, state, breakpoint, language, document presented as web content, editor-produced output, and complete process. They also apply to third-party authentication, consent, scheduling, payment, media, and storage-picker surfaces used to complete a Jamula journey.

The conformance target is **WCAG 2.2 Level AA: every applicable Level A and Level AA success criterion** [A1]. Meeting selected criteria, passing automation, or citing vendor documentation is not conformance.

## 2. Evidence states

| State | Meaning | Permitted conclusion |
|---|---|---|
| Documented research | Current official material supports the stated standard or documented behavior | Requirement/source is grounded; implementation remains untested |
| Disposable mechanism evidence | Versioned, bounded spike exercised named behavior with synthetic data | Only that mechanism/configuration worked in the spike |
| Future implementation test | Repeatable test specified here or in the journey document | `not tested` until run against a versioned candidate |
| Blocked/deferred packet | Access, official evidence, or a required capability is unavailable | Behavior is unverified; packet records blocker, owner, impact, fallback, and retest trigger |
| Production field evidence | Approved RUM/search/monitoring data from the released scope | Only the measured routes, population, period, and percentile may be claimed |

No research, vendor statement, mechanism spike, Lighthouse score, or automated scan may be converted into a public accessibility or performance claim. A future conformance statement requires a defined scope, WCAG version/level, evaluation method, representative sample, exceptions, evaluator, evidence date, and Cyrus approval.

## 3. Accessibility release gate

### 3.1 Baseline

- All in-scope content and complete processes MUST satisfy WCAG 2.2 A and AA [A1].
- Evaluation MUST begin during design/content work and combine tools with knowledgeable human review; W3C states that no tool alone can determine whether a site meets accessibility standards [A4].
- Representative conformance evaluation SHOULD follow WCAG-EM's scope, exploration, sampling, evaluation, and reporting structure, while every critical journey is tested in full [A4].
- Native HTML semantics are preferred. Custom ARIA behavior is allowed only when a native control cannot provide the required outcome and the component contract is tested.
- Accessibility defects are triaged by blocked outcome and user impact, not only success-criterion count.

### 3.2 Perceivable content

- Informative images have purpose-specific text alternatives; decorative images are ignored by assistive technology.
- Prerecorded synchronized media has accurate captions and audio description when visual information is not otherwise available; audio/video has a transcript appropriate to its content and an accessible player [A8].
- Live media, if introduced, receives the applicable WCAG alternatives and a documented operational owner.
- Normal text contrast is at least **4.5:1**; large-scale text is at least **3:1**. Required UI boundaries, icons, focus/state indicators, and meaningful graphics are at least **3:1** against adjacent colors [A6][A7].
- Information is not conveyed by color, position, shape, sound, or motion alone.
- Text can be resized to 200% without loss. At 400% zoom or an equivalent **320 CSS-pixel-wide** viewport, non-exempt content reflows without loss or two-dimensional scrolling [A2].
- Browser text-spacing overrides, user fonts, high contrast, forced colors, dark/light preferences, and orientation changes do not hide content or functionality.

### 3.3 Operable interaction

- Every function works with keyboard alone, with no trap. Keyboard order follows meaning; skip navigation and landmarks provide efficient movement.
- Focus is visible, has at least the required non-text contrast, is not fully obscured by sticky content, consent surfaces, or overlays, and returns logically after dialogs or route updates [A10].
- Pointer targets are at least **24 by 24 CSS pixels** or meet a WCAG 2.2 spacing/equivalent exception; primary controls SHOULD target at least 44 by 44 CSS pixels [A9].
- No essential action requires a multipoint/path gesture, dragging, device motion, hover, or fine pointer control without a simple alternative.
- Time limits are absent unless essential; where used they warn, extend, preserve safe work, and satisfy applicable WCAG criteria.
- No content flashes beyond applicable thresholds. Autoplay audio is prohibited.
- `prefers-reduced-motion: reduce` disables non-essential spatial motion, parallax, animated scrolling, looping backgrounds, and decorative transitions. This Jamula requirement intentionally adopts the inclusive intent of WCAG 2.2's AAA animation guidance without claiming AAA conformance [A11].

### 3.4 Understandable forms and state

- Pages use consistent navigation, naming, icon meaning, and help placement.
- Every field has a persistent visible label; instructions and required status precede the input; autocomplete/input-purpose tokens are correct.
- Automatically detected errors identify the field and describe the problem in text; suggestions are actionable; an error summary links to invalid fields; valid input is retained [A5].
- Success, pending, failure, saving, loading, and connection state are exposed programmatically without unexpected focus movement.
- Destructive, legal, financial, and data-sharing actions provide review/correction and confirmation appropriate to risk.
- Help is reachable consistently. Accessibility feedback never requires authentication.

### 3.5 Robust authentication and embedded flows

- Authentication permits password-manager/autofill assistance and paste. Every step, including MFA and recovery, has a path that does not depend on an unaided cognitive-function test, transcription, or puzzle [A3].
- CAPTCHA or anti-abuse controls MUST NOT make a visual, audio-transcription, memory, or puzzle task the only route.
- Embedded and cross-origin flows expose an accessible name/purpose, announce the provider transition, preserve a return/cancel path, and do not trap focus.
- Customer identity and tenant context, consent scope, provider account, selected files, invoice/payment status, and errors are available in text and programmatically.

### 3.6 Minimum future test matrix

Record exact OS, browser, assistive-technology, platform/plugin, content fixture, viewport, and build versions. At minimum:

1. keyboard-only on every representative template/state and all critical journeys;
2. Windows with current NVDA on current Firefox and Chromium-based browser;
3. iOS with VoiceOver on Safari, including touch exploration and external-provider transitions;
4. macOS with VoiceOver on Safari for public and editor-produced templates;
5. JAWS with Edge or Chrome for Phase 3 portal and Phase 4 payment journeys when the licensed test environment is available; lack of access is a blocked evidence packet, not a pass;
6. 200% text resize; 400% browser zoom/320 CSS-pixel reflow; 1280px and wide layouts;
7. forced-colors/high-contrast and contrast measurement for every semantic token/state;
8. reduced motion, no-script public baseline, touch, keyboard, and error/recovery paths.

Automated checks MUST cover parsed HTML/landmarks/names, common WCAG rules, keyboard-focus smoke tests, missing media alternatives/metadata, color-token contrast, and route/state regression. Zero automated violations is necessary for rules the tool can test but is never sufficient [A4].

## 4. Third-party barrier and fallback gate

A **critical barrier** prevents or materially compromises independent completion, comprehension, privacy, security, recovery, or confirmation for a user with a disability in a required flow.

Before adoption, each critical third-party flow MUST have documented official accessibility evidence where available, a versioned hands-on test, an accountable vendor/remediation owner, and a replace/disable plan. Missing current official evidence is marked **unverified**.

An equivalent supported fallback MUST:

- be presented at or before the barrier, in accessible language, without requiring the inaccessible flow first;
- achieve the same material business outcome, authorization strength, privacy/security, price/terms, and durable confirmation;
- be independently operable through the supported test matrix; a phone-only or unstaffed email route is not equivalent;
- avoid collecting credentials, raw card data, or customer files through insecure channels;
- have a documented service owner, operating hours/SLA if human fulfillment is unavoidable, maintenance path, analytics/incident visibility, and end-to-end test;
- remain available whenever the primary provider is available.

Required fail-safe behavior:

| Flow | Minimum fallback behavior |
|---|---|
| Consent | Keep non-essential processing off and expose a native preference surface |
| Scheduling | Accessible Jamula request form with timezone, confirmation, cancel/reschedule support |
| Authentication | Independently operable approved sign-in/recovery method with no authorization downgrade |
| Storage picker | Approved accessible provider/API or file-selection path with identical tenant/scope controls; never shared credentials or impersonation |
| Payment | Another approved hosted invoice/checkout method; never email/chat/manual capture of card credentials |
| Embedded media/social | Accessible first-party summary/transcript/link without requiring the embed |

**If a critical barrier remains and the equivalent supported fallback is absent or fails, the affected phase release is blocked.** Disclosure, vendor roadmap language, partial automation scores, or support contact details do not waive the gate.

## 5. Search and discovery gate

### 5.1 Canonical domain and redirects

- The only canonical public origin is `https://jamula.net`.
- Every indexable Jamula.net page MUST emit one absolute, self-referential canonical URL in the original HTML and use that same URL in internal links and the sitemap. Redirect, canonical, and sitemap signals MUST NOT conflict [S1].
- `https://jamula.com/{path}?{query}` MUST return a permanent server-side **301 or 308** to `https://jamula.net/{same-path}?{same-safe-query}`. Both domains require valid HTTPS certificates.
- HTTP, `www`, case/trailing-slash, and known legacy variants MUST converge to the single approved Jamula.net URL in one redirect where infrastructure permits and never more than two. There MUST be no loops, open redirects, protocol downgrade, blanket redirect of missing pages to home, or Jamula.com `200` duplicate.
- Valid query parameters are preserved exactly unless an approved privacy/security normalization rule removes known tracking parameters; tests record that rule. Path encoding, Unicode, fragments handled by the user agent, 404/410 behavior, and dangerous external-looking values receive explicit cases.
- Permanent server-side redirects are a strong canonical signal and Google's recommended mechanism for permanent moves [S2]. Redirect behavior MUST be tested from multiple regions/networks after DNS/certificate cutover; failure pauses launch rather than changing the canonical domain silently.

### 5.2 Crawl and index control

- `sitemap.xml` contains only absolute Jamula.net canonical URLs that are intended to index and return `200`; it excludes redirects, errors, duplicate/filter URLs, previews, authentication, portal, consent callbacks, and payment/session routes. `lastmod` reflects meaningful content change. Submit and monitor it in the relevant search-console properties [S3].
- Root `robots.txt` is syntactically valid, references the Jamula.net sitemap, and permits required HTML/CSS/image/script resources. It manages crawling only; it is not used to hide sensitive content or force canonicalization [S4].
- Non-public content is protected by authorization. Public-but-nonindexable pages use supported `noindex` delivery while remaining crawlable as needed; preview environments use access controls plus noindex defense in depth.
- Search/crawl validation checks status, canonical, index directive, language, title, description, heading, links, and rendered/HTML parity across every representative template.

### 5.3 Metadata and structured data

- Each indexable page has a unique, descriptive title and meta description aligned with visible content; one meaningful `h1`; semantic headings; descriptive internal links; and complete Open Graph/social preview metadata where used.
- The home page MAY emit truthful `Organization` JSON-LD using only approved name, URL, logo, description, and verified profile/contact fields. Google documents that home-page Organization data can help disambiguate an organization; it does not guarantee a visual result [S6].
- Use `BreadcrumbList` on genuine hierarchical pages, `Article` on eligible insights, and `VideoObject` only when the actual visible media and required properties exist. Other schema.org types are allowed only when truthful and useful.
- Structured data MUST describe visible page content, include applicable required properties, use canonical Jamula.net URLs, and pass syntax/schema and Google's Rich Results Test where the type is supported [S5].
- Never mark up fabricated reviews, ratings, FAQs, services, people, social profiles, locations, prices, or claims. Rich-result eligibility or display is not promised.

## 6. Performance gate

### 6.1 Field outcome

For each critical route class, **all three Core Web Vitals MUST be “good” at the 75th percentile, separately for mobile and desktop field data**:

- **LCP ≤ 2.5 seconds** [P1];
- **INP ≤ 200 milliseconds** [P2];
- **CLS ≤ 0.1** [P3].

An origin-level pass does not hide a failing critical route. Report route/template cohort, geography, device class, sample size, collection window, consent/privacy treatment, and tool. Use approved privacy-preserving real-user measurement plus CrUX/Search Console where available. New or low-traffic launches without sufficient field data remain **provisional**; lab and synthetic results do not prove the p75 field gate.

### 6.2 Jamula transfer and execution budgets

Budgets use encoded transfer bytes on a cold cache for the initial usable route. They include first- and third-party resources initiated before user action. User-selected customer files and media streamed only after explicit activation are excluded from initial transfer but have separate limits. The tighter aggregate or category limit wins.

| Budget | Public content route | Interactive/authenticated shell |
|---|---:|---:|
| Total initial transfer | ≤ 900 KiB | ≤ 1,500 KiB |
| HTML | ≤ 75 KiB | ≤ 100 KiB |
| CSS | ≤ 100 KiB | ≤ 140 KiB |
| JavaScript, including inline and third party | ≤ 225 KiB | ≤ 300 KiB |
| Third-party JavaScript subset | ≤ 75 KiB | ≤ 100 KiB |
| Initial fonts | ≤ 120 KiB; max 2 families/2 files | same |
| Initial responsive imagery | ≤ 450 KiB | ≤ 500 KiB |
| Network requests before usable | ≤ 50 | ≤ 65 |
| DOM elements on representative state | ≤ 1,500 | ≤ 2,000 |

Media limits:

- each initial raster image: ≤ 200 KiB mobile candidate and ≤ 350 KiB desktop candidate;
- hero image: included in the imagery aggregate; never preloaded if it is not the likely LCP element;
- video poster: ≤ 120 KiB; audio/video bytes loaded before user intent: **0 KiB** beyond approved metadata/poster;
- user-activated video uses adaptive delivery; first media segment ≤ 1 MiB and a lower-bandwidth rendition is available;
- animated images are replaced with efficient video or static/reduced-motion alternatives when animation is material;
- uploaded source assets do not bypass delivered-media limits.

Execution limits in the agreed representative mobile lab profile:

- LCP ≤ 2.5 s, CLS ≤ 0.1, FCP ≤ 1.8 s, TTFB ≤ 0.8 s, and Total Blocking Time ≤ 200 ms;
- no individual main-thread task over 200 ms during load or a measured critical interaction; investigate tasks over 50 ms;
- visible response to activation starts within 100 ms when local, or an accessible pending state appears within 200 ms for network work;
- reserve dimensions/aspect ratio for images, video, embeds, consent, and personalization to prevent shift.

The lab hardware/network profile, tool/version, cache state, repetitions, median and worst run MUST be recorded before platform comparison. Every candidate uses the same harness and fixtures. Lab thresholds are diagnostic launch gates; field CWV remains the outcome.

### 6.3 Loading policy

- Render critical public content without client-side JavaScript dependency.
- Load analytics, chat, social embeds, schedulers, and other non-essential third parties only after applicable consent and/or user intent.
- Self-host or responsibly subset fonts where licensing permits; use resilient system fallbacks and `font-display` behavior that avoids invisible text and excessive shift.
- Use responsive modern image formats with intrinsic dimensions, lazy-load below-fold media, and do not lazy-load the LCP asset.
- Partition enhancements by route/component. A turn-key platform's generated runtime, plugin payload, and tag-manager code count in full.
- Performance exceptions require owner, measured benefit, accessibility/privacy/security impact, expiry, and approved compensating reduction; they cannot waive good p75 CWV.

## 7. Continuous verification and phase gates

Before each preview and release:

1. run automated accessibility, HTML, link, metadata, structured-data, redirect, sitemap/robots, and performance-budget checks;
2. manually execute all applicable journeys with the minimum accessibility matrix;
3. inspect each third-party flow and its fallback after provider/plugin changes;
4. compare lab traces to the saved baseline and investigate regressions;
5. record unresolved items with severity, owner, affected users/routes/phase, evidence, workaround/fallback, retest date, and release disposition.

After launch:

- monitor CWV by route cohort, crawl/index coverage, sitemap errors, redirect/certificate behavior, structured-data validity, 404s, broken links, accessibility feedback, and third-party release notes;
- retest quarterly, after material template/design-system/provider changes, and after accessibility/performance incidents;
- do not publish a conformance or “fast site” claim without the scoped evidence and approvals defined above.

## 8. Official source register

All sources below were accessed and verified on **2026-08-24**. “Verified” means the cited official source supported the narrow documented claim; it does not verify Jamula or vendor conformance.

| ID | Official source | Publisher / source date | Applicable scope | Exact documented claim and status |
|---|---|---|---|---|
| A1 | [Web Content Accessibility Guidelines (WCAG) 2.2](https://www.w3.org/TR/WCAG22/) | W3C Recommendation, 2024-12-12 | Web content, technology-neutral | WCAG 2.2 defines testable A/AA/AAA success criteria and conformance requirements. **Verified; documented research.** |
| A2 | [Understanding SC 1.4.10: Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) | W3C WAI, WCAG 2.2 | Level AA | Non-exempt vertical content reflows at width equivalent to 320 CSS px; 320 CSS px corresponds to 400% zoom from 1280 CSS px. **Verified.** |
| A3 | [Understanding SC 3.3.8: Accessible Authentication (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html) | W3C WAI, WCAG 2.2 | Level AA authentication | A path through authentication must not rely on an unaided cognitive-function test; paste/autofill and alternatives can assist. **Verified.** |
| A4 | [Evaluating Web Accessibility Overview](https://www.w3.org/WAI/test-evaluate/) and [WCAG-EM overview](https://www.w3.org/WAI/test-evaluate/conformance/wcag-em/) | W3C WAI | Evaluation method | No tool alone determines conformance; knowledgeable human evaluation is required. WCAG-EM structures scope, exploration, sampling, evaluation, and reporting. **Verified.** |
| A5 | [Understanding SC 3.3.1: Error Identification](https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html) | W3C WAI, WCAG 2.2 | Level A forms | Automatically detected errors identify the item and describe the error in text. **Verified.** |
| A6 | [Understanding SC 1.4.3: Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) | W3C WAI, WCAG 2.2 | Level AA visual content | Thresholds are 4.5:1 for normal text and 3:1 for large-scale text. **Verified.** |
| A7 | [Understanding SC 1.4.11: Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) | W3C WAI, WCAG 2.2 | Level AA UI/graphics | Visual information needed to identify controls and states requires at least 3:1 against adjacent colors. **Verified.** |
| A8 | [Making Audio and Video Media Accessible](https://www.w3.org/WAI/media/av/) | W3C WAI | Media accessibility | W3C guidance covers captions, transcripts, visual description, and accessible players. **Verified.** |
| A9 | [Understanding SC 2.5.8: Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) | W3C WAI, WCAG 2.2 | Level AA pointer targets | Targets are at least 24 by 24 CSS px or satisfy a defined exception. **Verified.** |
| A10 | [Understanding SC 2.4.11: Focus Not Obscured (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html) | W3C WAI, WCAG 2.2 | Level AA keyboard focus | The focused component must not be entirely hidden by author-created content. **Verified.** |
| A11 | [Understanding SC 2.3.3: Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html) | W3C WAI, WCAG 2.2 | Level AAA guidance used as Jamula policy | Non-essential interaction-triggered motion can be disabled; user/OS reduced-motion preference is a documented approach. **Verified; Jamula adopts a stricter policy without claiming AAA.** |
| P1 | [Largest Contentful Paint (LCP)](https://web.dev/articles/lcp) | Google web.dev, updated 2025-09-04 | Field web performance | Good LCP is ≤2.5 s at p75, segmented mobile/desktop. **Verified.** |
| P2 | [Interaction to Next Paint (INP)](https://web.dev/articles/inp) | Google web.dev, updated 2025-09-02 | Field web performance | Good INP is ≤200 ms at p75, segmented mobile/desktop. **Verified.** |
| P3 | [Cumulative Layout Shift (CLS)](https://web.dev/articles/cls) | Google web.dev | Field web performance | Good CLS is ≤0.1 at p75, segmented mobile/desktop. **Verified.** |
| S1 | [How to specify a canonical URL](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls) | Google Search Central | Google Search | Redirects and `rel=canonical` are strong signals; sitemap inclusion is weaker; signals should agree and self-canonical is recommended. **Verified.** |
| S2 | [Redirects and Google Search](https://developers.google.com/search/docs/crawling-indexing/301-redirects) | Google Search Central | Google Search | Permanent server-side 301/308 redirects signal the target canonical and are recommended for permanent moves. **Verified.** |
| S3 | [Build and submit a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) | Google Search Central | Google Search | Google supports protocol-defined sitemap formats; XML can include additional media/localization data. **Verified.** |
| S4 | [Introduction to robots.txt](https://developers.google.com/search/docs/crawling-indexing/robots/intro) | Google Search Central | Google Search | `robots.txt` manages crawler access/traffic and is not a mechanism for keeping a page out of Google. **Verified.** |
| S5 | [Introduction to structured data markup](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data) | Google Search Central | Google Search | Structured data describes visible page content; required properties and validation matter; display is not guaranteed. **Verified.** |
| S6 | [Organization structured data](https://developers.google.com/search/docs/appearance/structured-data/organization) | Google Search Central | Google Search home page | Organization markup on the home page can help Google understand/disambiguate administrative details. **Verified.** |

Vendor/platform behavior is intentionally absent from this source register. It must be evaluated on the selected plan, version, plugins, region, and configuration. Unavailable official evidence remains **unverified** and enters a blocked/deferred packet.
