# Jamula experience requirements

**Work context:** Refs #3; child #5
**Owner:** Jadzia Dax, Experience & Design Lead
**Required reviewers:** Nyota Uhura, Miles O'Brien, Fact Checker
**Status:** Evaluation requirements for Picard synthesis; not an implementation, accessibility audit, or claim of conformance
**Updated:** 2026-08-24

## 1. Experience direction

Jamula should convey **calm technical confidence**: expert without being opaque, inventive without spectacle, and trustworthy without unsupported claims. The experience must make complex consulting services understandable, help a prospective customer take the next step, and give returning customers a predictable, private workspace.

The brand and experience must:

- lead with customer outcomes, evidence, and plain language rather than technology theater;
- feel precise, warm, contemporary, and human, with generous space and a restrained visual rhythm;
- use a distinctive but durable color, type, illustration, and diagram system that remains effective in high contrast, monochrome, print, and reduced-motion contexts;
- avoid dark patterns, urgency theater, scroll-jacking, autoplay, inaccessible novelty, and decorative motion that competes with the task;
- never use internal Squad identities or imply Microsoft, cloud-provider, customer, or rights-holder endorsement;
- distinguish approved achievements from aspirations and route public factual claims through the claims register;
- treat accessibility, privacy, security, performance, and environmental efficiency as design constraints, not later polish.

All requirements in this package apply equally to custom implementations, hosted site builders, CMS products, plugins, embeds, and provider-hosted flows.

## 2. Experience principles

1. **Understand before acting.** Each page has one clear purpose, descriptive headings, visible context, and an unambiguous next action.
2. **Content before chrome.** Core meaning and task paths work as semantic documents before enhancement.
3. **Progressive sophistication.** Enhancement may add previews, filtering, diagrams, transitions, or live status, but never remove a working baseline.
4. **Choice without coercion.** Consent, contact method, scheduling, sign-in, file provider, and payment choices state consequences and do not manipulate.
5. **State is visible.** Loading, saving, success, failure, permissions, tenant, file source, and payment status are expressed in text and programmatically.
6. **Recovery is designed.** Back, cancel, retry, resume, correction, and supported alternatives are available without losing valid user input.
7. **One system, many contexts.** Components and content adapt from 320 CSS pixels through wide screens, zoom, reflow, touch, keyboard, screen readers, and reduced motion.
8. **Performance is part of trust.** The experience remains responsive on representative mid-tier mobile hardware and constrained networks.

## 3. Audiences and outcomes

| Audience | Primary need | Required outcome |
|---|---|---|
| Prospective customer | Understand fit and credibility | Identify relevant services and a supported contact or scheduling path |
| Evaluating stakeholder | Assess approach and evidence | Find approved work, insights, methods, accessibility, privacy, and company information |
| Returning contact | Continue a conversation | Reach the correct contact or scheduled event without repeating avoidable information |
| Customer user | Reach authorized work and files | Authenticate, identify the active customer context, and complete authorized file tasks |
| Customer finance contact | Act on an invoice or agreement | Understand amount/status and complete or leave a hosted payment flow safely |
| Content editor | Publish accurate, accessible material | Preview responsive output, required metadata, media alternatives, and validation status |
| Support or accessibility reporter | Report a barrier or correction | Submit useful feedback through an accessible, privacy-respecting path and receive acknowledgment |

Human completion speed is not a usability gate: disability, assistive technology, language, and familiarity change task time. Measured limits in the acceptance journeys constrain system response, number of avoidable steps, error recovery, and delivery—not how quickly a person must act.

## 4. Information architecture

### 4.1 Phase 1 public structure

The primary navigation should remain short, stable, and task-oriented:

- **Services** — overview plus approved service-detail pages;
- **Work** — approved case studies/project showcases only;
- **Insights** — articles, explainers, and approved external-channel references;
- **About** — company approach, approved leadership material, values, and trust information;
- **Contact** — contact form, supported contact methods, expectations, and later scheduling entry.

Utility navigation contains **Customer sign in** only when Phase 3 is available. Footer navigation contains Accessibility, Privacy, Terms, Cookie/consent controls, Security or vulnerability reporting when approved, and social/GitHub destinations. A visible site search is introduced only when content volume and a maintained accessible search implementation justify it.

Recommended canonical route model:

```text
/
/services/
/services/{service-slug}/
/work/
/work/{approved-case-study}/
/insights/
/insights/{article-slug}/
/about/
/contact/
/accessibility/
/privacy/
/terms/
/customer/                 Phase 3
/customer/files/           Phase 3
/customer/billing/         Phase 4
```

Routes are lower-case, readable, stable, language-neutral where practical, and free of implementation/vendor names. Navigation labels must match page headings and user vocabulary. Breadcrumbs are required for content deeper than one level, but not as a substitute for a clear page title or back path.

### 4.2 Content model

Every indexable page requires:

- a unique purpose, title, first-level heading, concise summary, owner, review date, and canonical URL;
- structured fields for description, social preview, publication/update dates where relevant, and indexing state;
- ordered heading structure, meaningful link text, and media alternatives;
- a primary action and an optional lower-commitment action;
- claim/provenance references for factual public assertions;
- expiry or review triggers for time-sensitive content.

Services, case studies, and insights must be reusable without duplicating source content. A platform must allow editors to preview narrow/wide layouts, keyboard order, missing alternatives, metadata, and unpublished/noindex state before release.

## 5. Responsive design-system criteria

The implementation mechanism is open; the observable contract is not.

### 5.1 Foundations

The design system must provide governed tokens for:

- semantic color roles, including default, inverse, focus, status, and high-contrast-safe states;
- a fluid type scale with readable measure (target 45–80 characters for prose);
- spacing, content widths, grids, borders, radii, elevation, and layering;
- motion duration/easing plus an immediate or near-immediate reduced-motion mode;
- minimum target sizes, focus indicators, and disabled/read-only distinctions;
- responsive images, icon sizing, and data-visualization palettes/patterns.

Tokens must encode meaning rather than page-specific values. Components must not rely on color, position, hover, animation, or iconography alone to communicate meaning.

### 5.2 Layout behavior

- Start with the smallest supported content width and enhance based on available space, not named devices.
- At 320 CSS pixels and at 400% zoom, non-exempt content reflows without loss or two-dimensional scrolling.
- Content order in the accessibility tree matches the meaningful visual and keyboard order at every layout.
- Navigation transforms without hiding destinations or creating keyboard traps.
- Touch and pointer layouts preserve target size/spacing and do not require precision gestures.
- Data tables, diagrams, code, and other valid two-dimensional exceptions receive a labeled scroll region plus an equivalent summary or alternate presentation where meaning would otherwise be lost.
- Orientation is not locked. Safe-area insets, long translated strings, text spacing, and browser/user font overrides do not obscure controls.

### 5.3 Component contract

Every reusable component has documented:

- semantic role and native-element preference;
- required label, help, error, status, empty, loading, and disabled states;
- keyboard behavior, focus entry/exit, and screen-reader announcement behavior;
- narrow, wide, zoomed, high-contrast, forced-colors, and reduced-motion behavior;
- content constraints and truncation/overflow rules;
- expected performance cost and optional enhancement boundary;
- automated checks and manual acceptance examples.

Required components include navigation, breadcrumb, link/button, form field, validation summary, notification/status, card/list, disclosure, dialog, tabs only when justified, pagination, media player wrapper, file item/picker wrapper, consent surface, and authenticated tenant/status banner.

## 6. Sophisticated interaction, progressively enhanced

Progressive enhancement is the governing interaction model. Sophistication comes from clarity, responsive feedback, and useful continuity—not mandatory animation.

- Server-delivered or pre-rendered semantic content, links, and forms are the baseline for public routes.
- JavaScript enhancements must preserve URLs, browser history, deep links, focus, validation messages, and submitted values.
- Filtering and pagination expose a shareable URL and a non-scripted result path.
- Disclosures use native semantics where suitable; custom widgets follow a documented keyboard pattern and are used only when native controls cannot provide the outcome.
- Interactive diagrams and demos include a static summary, keyboard-operable controls, non-visual data/table alternative, and reduced-motion behavior.
- View transitions, reveal effects, count-up displays, and parallax are optional. Parallax and non-essential spatial motion are off when reduced motion is requested; essential status changes remain understandable without animation.
- Hover reveals duplicate their content on focus and touch. No task depends only on drag, swipe, long press, or hover.
- Loading indicators name the task, do not steal focus, and transition to a programmatically exposed success or error state.
- Long operations provide progress or an honest indeterminate state, cancellation when safe, retry, and preserved inputs.
- No autoplay audio. Video is user-initiated; captions/transcript and accessible player controls are available as specified in the accessibility requirements.
- External content uses a preview/link by default. An embed loads only when it adds material value, passes the gates, and meets consent and performance budgets.

The baseline and enhanced path must both be evaluated. A platform that cannot expose, test, disable, or replace its generated interaction fails the affected hard gate.

## 7. Cross-phase interaction requirements

### 7.1 Contact and public feedback

Forms use visible persistent labels, explicit optional/required status, useful input purpose, text errors tied to fields, an error summary, retained valid entries, and a clear final acknowledgment. Anti-spam must not introduce an unsolved visual/audio puzzle or inaccessible cognitive test. An accessibility/public-feedback path must permit barrier type, affected URL, assistive technology (optional), description, and reply details (optional) without forcing an account.

### 7.2 Consent

Before a choice, non-essential scripts/storage remain off. Accept and reject choices are comparably visible and operable; settings explain purposes without vendor jargon. Withdrawal is reachable from every page and is no harder than granting consent. Focus, reading order, and page access remain usable while the surface is present.

### 7.3 Scheduling

Users see meeting purpose, duration, timezone, platform, data destination, confirmation behavior, and cancellation/reschedule path before commitment. An embedded scheduler must not trap focus or strand the user after an error. A supported native request path provides the same business outcome if the provider flow is blocked.

### 7.4 Authentication and customer context

Sign-in supports password managers, paste, autofill, and at least one path without an unaided memory/transcription/puzzle test. Recovery and MFA explain next steps without exposing account existence. The active customer/tenant and identity are visible after sign-in; tenant changes and sensitive transitions are explicit. Timeouts warn users and preserve safe draft state where possible.

### 7.5 Storage pickers and customer files

Provider choice, connected account, requested scope, active tenant, selection count, file name/type/size, and permission effects are available in text. Users can select, deselect, cancel, retry, revoke, and return without ambiguity. Lists support keyboard and screen reader use without requiring a spatial grid. Preview/download errors, malware quarantine, unsupported types, stale permissions, and access revocation provide safe next steps. No fallback may weaken authorization, share credentials, or impersonate a missing connector.

### 7.6 Payments

Before leaving Jamula, users see the provider transition, amount/currency, invoice or payment purpose, recurring terms when applicable, and cancel/return behavior. Provider-hosted flows must expose errors and status accessibly, prevent duplicate activation, and return a durable success/pending/failure state. Jamula surfaces never request or retain raw card data. A fallback may use another approved hosted or invoiced path, never email/chat collection of payment credentials.

## 8. Platform-neutral evaluation

Custom code, Wix Studio, WordPress.com, managed/self-hosted WordPress, Webflow, Squarespace, and other finalists receive the same representative content, route set, journeys, network profile, assistive-technology matrix, and budgets.

### Hard gates

A candidate is disqualified for the affected release when it cannot:

1. meet and be independently tested against WCAG 2.2 Level AA across generated, custom, editor, and third-party task surfaces;
2. provide an equivalent supported fallback for a critical third-party barrier;
3. control semantic output, responsive order/reflow, focus, validation, metadata, canonical URLs, redirects, sitemap, robots directives, and structured data;
4. measure and meet field Core Web Vitals and explicit transfer budgets without hiding provider payload;
5. prevent unpublished/private/customer content from public indexing;
6. export content/assets/metadata and preserve stable URL mappings;
7. replace or disable a failing plugin/embed without breaking the core journey.

Visual-builder convenience, plugin availability, vendor accessibility statements, or a high automated score are not proof. Custom code receives no presumption of quality and owns every defect in its dependencies and composition.

### Comparable scorecard after hard gates

Score qualified candidates on responsive/visual control, content/editor experience, accessibility testability, SEO control, measured performance, fallback feasibility, integration fit, export fidelity, operational burden, cost, support, and remediation speed. Record exact platform/plan/plugin versions and distinguish native capability from paid add-on, custom extension, manual process, and unverified vendor assertion.

## 9. Evidence and release interpretation

Use these labels consistently:

- **Documented research:** a dated official source establishes a standard or vendor-documented behavior. It does not prove Jamula implementation quality.
- **Disposable mechanism evidence:** a bounded spike demonstrates only the exact platform/version/configuration and path exercised. It is not an accessibility audit, production readiness finding, or broad vendor endorsement.
- **Blocked/deferred packet:** records unavailable access/evidence, barrier, affected journey/phase, owner, source status, supported disclosure/fallback, remediation issue, retest trigger, and whether release is blocked.
- **Future implementation test:** an acceptance procedure that must run against a versioned preview or production-equivalent build. Until it passes, status is `not tested`.

Vendor-specific behavior without current official evidence is **unverified**. Research must never be reported as proof of WCAG conformance, good field Core Web Vitals, or successful end-to-end operation.

## 10. Synthesis-ready decisions and actions

Picard should carry forward these platform gates:

1. Approve calm technical confidence, the Phase 1 IA, and progressive sophistication as the experience direction.
2. Make all Level A and AA WCAG 2.2 criteria, critical-flow fallback, canonical-domain behavior, and good field Core Web Vitals non-negotiable.
3. Require each finalist to run the journeys in `acceptance-journeys.md` and meet `accessibility-seo-performance.md`.
4. Reject a platform/plan/plugin combination that prevents independent testing, remediation, replacement, export, or measurement.
5. Keep public launch, scheduling, portal/connectors, and payments as separate release gates; a failed later-phase flow does not excuse or silently weaken the requirement.

This document defines intent and observable criteria only. It makes no claim that any platform or Jamula surface has passed them.
