# Experience acceptance journeys

**Work context:** Refs #3; child #5
**Owner:** Jadzia Dax, Experience & Design Lead
**Required reviewers:** Miles O'Brien, Nyota Uhura, Fact Checker
**Status:** Future implementation tests; all results are `not tested` until executed against a versioned candidate
**Updated:** 2026-08-24

## 1. How to use these journeys

These journeys turn the experience, accessibility, SEO, and performance requirements into platform-neutral acceptance tests. Run the same fixtures and outcome criteria against custom and turn-key candidates. Generated markup, plugins, embeds, themes, tag managers, and provider-hosted screens remain inside the evaluated journey.

Each execution record includes:

- candidate/platform, plan, region, theme/plugin/provider and exact versions;
- build/commit, route, fixture, viewport, locale, browser/OS/assistive technology;
- baseline or enhanced path, consent state, authentication/tenant, and network profile;
- steps, expected/actual outcome, system timings, violations, screenshots or sanitized logs, and tester;
- evidence state, barrier severity, fallback result, owner, phase disposition, and retest trigger.

Evidence is classified as documented research, disposable mechanism evidence, blocked/deferred packet, future implementation test, or production field evidence as defined in `accessibility-seo-performance.md`. A spike result never becomes an audit or conformance claim.

## 2. Common acceptance rules

Every applicable journey MUST be completed:

1. visually with pointer/touch;
2. keyboard-only without a pointer;
3. with the minimum screen-reader combinations defined in `accessibility-seo-performance.md`;
4. at 200% text resize and 400% zoom/equivalent 320 CSS-pixel viewport;
5. with reduced motion and, where applicable, forced colors/high contrast;
6. along error, cancel, retry, back, timeout, and recovery paths;
7. on the public no-script baseline where the task is public and not inherently application-only.

There is no human speed requirement. Timing assertions below measure system response, waiting disclosure, redirect behavior, delivery, or avoidable interaction count.

For every journey:

- focus order and visible focus match meaning; focused controls are not obscured;
- headings, landmarks, labels, names/roles/values, status, errors, and confirmation are programmatically available;
- no content or function is available only by color, hover, motion, drag, or spatial arrangement;
- valid input survives correctable failures; repeated activation does not duplicate submissions, bookings, connections, or payments;
- session, tenant, provider, amount, file, and consent context are explicit where relevant;
- all applicable budgets and good-CWV gates remain in force.

## 3. Public discovery and orientation

### J-01 — Find a relevant service and next step (Phase 1)

**Fixture:** prospective customer enters on home, a service detail, and an insight deep link.

**Steps**

1. Identify site/company, current page, primary navigation, and main content.
2. Reach a relevant service from home and from the deep link.
3. Find supporting evidence or approved work without encountering an unsupported claim.
4. Reach Contact and the lower-commitment alternative.
5. Use back/history and repeat at 320 CSS pixels.

**Pass**

- Skip link reaches main content; one meaningful `h1`; landmarks/navigation have distinct names.
- Every destination is keyboard/touch accessible and the current location is exposed.
- Navigation transformation does not reorder meaning, trap focus, or hide a route.
- Service and action are reachable within three purposeful navigation activations from home; this constrains IA depth, not user speed.
- Core meaning and links remain available with JavaScript disabled.
- Page title, description, canonical, heading, internal links, and structured data accurately match visible content.

### J-02 — Submit contact inquiry and recover from errors (Phase 1)

**Fixture:** missing required values, malformed email, valid inquiry, simulated network timeout, duplicate activation, anti-spam challenge.

**Steps**

1. Review collection purpose and optional/required fields.
2. Submit empty/invalid data, navigate from error summary to fields, and correct it.
3. Submit valid data during a timeout, retry once, and observe final status.
4. Return to the site and find contact expectations/history where designed.

**Pass**

- Persistent labels, instructions, input purposes, descriptions, and errors are associated correctly.
- Error summary receives or is announced at a logical point and links to each invalid field; color is not the only indication.
- Valid values persist. Timeout state appears within 200 ms of the detected wait and gives safe retry/cancel guidance.
- Exactly one inquiry is created after repeat activation/retry; confirmation names next steps without exposing submitted sensitive data in URL/telemetry.
- No puzzle, memory, visual-only, or audio-transcription challenge is the sole anti-spam route.
- Acknowledgment delivery/queue state is observable; internal delivery reliability is tested separately.

### J-03 — Grant, reject, change, and withdraw consent (Phase 1)

**Fixture:** new visitor, returning reject-all visitor, granular selection, withdrawal, CMP unavailable.

**Steps**

1. Load the page before making a choice and inspect requests/storage.
2. Reject non-essential processing.
3. Reopen settings, grant one category, then withdraw it.
4. Navigate/zoom while the consent surface is present.
5. Simulate third-party consent UI failure.

**Pass**

- Before opt-in, non-essential script/network/storage activity is zero.
- Accept and reject are comparably visible and operable; either decision is reachable in at most two purposeful activations from the first surface.
- Categories have plain-language purpose/vendor consequences and granular state.
- Withdrawal is reachable from every page in no more activations than grant and takes effect on the next eligible request.
- Focus is contained only when the surface is intentionally modal, never obscured, and restored logically.
- On provider failure, non-essential processing remains off and the accessible native preference fallback works; otherwise Phase 1 is blocked.

## 4. Scheduling

### J-04 — Schedule, reschedule, cancel, and use fallback (Phase 2)

**Fixture:** two timezones, no availability, provider error, embedded/cross-origin flow, fallback request.

**Steps**

1. Review purpose, duration, timezone, meeting platform, and data use.
2. Select a slot entirely by keyboard and with screen reader; change timezone.
3. Trigger validation/provider error without losing entered data.
4. Complete and receive confirmation; reschedule and cancel.
5. Repeat using the Jamula fallback with the provider unavailable.

**Pass**

- Date/slot controls expose date, time, timezone, availability, selection, and errors in text; no calendar grid is mandatory.
- Provider transition, privacy context, and return/cancel route are announced.
- No focus trap, inaccessible CAPTCHA, precision gesture, or forced account prevents completion.
- Pending feedback starts within 200 ms; the final state clearly distinguishes booked, requested, failed, cancelled, and unknown.
- Reschedule/cancel links are keyboard/screen-reader operable and do not disclose booking details to an unauthorized user.
- Fallback produces the same meeting-request outcome, timezone context, durable confirmation, and operational ownership. If neither path passes, Phase 2 is blocked.

## 5. Authentication and account recovery

### J-05 — Sign in, MFA, timeout, and recover access (Phase 3)

**Fixture:** known/unknown account, invalid credential, password manager, paste, device approval/passkey where supported, recovery, timeout, locked/rate-limited state.

**Steps**

1. Autofill or paste credentials and sign in without solving a cognitive puzzle.
2. Complete each supported MFA method, including the non-transcription path.
3. Trigger invalid, unknown, rate-limited, and timeout responses.
4. Recover access without exposing whether an account exists.
5. After sign-in, verify identity and active customer/tenant; sign out.

**Pass**

- Labels, input purpose, show-password control, help, errors, and status are available visually and programmatically.
- Paste, password managers, and autofill are not blocked.
- At least one complete authentication/recovery path avoids unaided memorization, transcription, object recognition, or puzzle solving.
- Error wording and timing do not unnecessarily enumerate accounts; focus moves predictably without clearing valid input.
- Timeout warning permits extension when safe and preserves non-sensitive draft work.
- Successful sign-in announces context; sign-out invalidates the session and returns focus/context safely.
- Any third-party critical barrier requires an independently operable approved method with no authorization downgrade. Without it, Phase 3 is blocked.

## 6. Storage connections and customer files

### J-06 — Connect and use each storage picker (Phase 3)

Run separately for **OneDrive, Google Drive, and Box**. A passing connector cannot stand in for another.

**Fixture:** multiple provider accounts, nested folders, duplicate/long names, unsupported and revoked permissions, provider outage, 200+ items.

**Steps**

1. Choose provider and review requested permissions/account.
2. Authorize, return to the correct tenant, and open the picker.
3. Navigate folders/search/list, select and deselect files, confirm selection, and cancel.
4. Revoke provider access and repeat after permissions change.
5. Exercise the approved fallback/disabled-connector state.

**Pass**

- Provider, account, scope, tenant, folder, selection count, file name/type/size, and disabled reason are available in text.
- Keyboard/screen-reader users can navigate and select without a spatial grid, drag, hover, or pointer precision.
- Virtualized lists maintain stable focus, set size/position where needed, and do not repeat/skip items.
- Cancel/back returns to the invoking control without connection or selection side effects.
- Revocation and stale permissions fail closed, explain recovery, and invalidate inaccessible derivatives as specified elsewhere.
- No cross-tenant/account selection, credential sharing, manual impersonation, or authorization downgrade occurs.
- Preview may disclose and disable a connector through an approved blocked packet; Phase 3 GA requires all three to pass security and accessibility gates.

### J-07 — Inspect, preview, download, and handle a customer file (Phase 3)

**Fixture:** authorized file, same-name files, inaccessible preview, large file, quarantined/unsupported file, deleted/revoked file, another tenant's identifier.

**Steps**

1. Identify active tenant/provider and locate the authorized file.
2. Review metadata and preview or use the accessible equivalent.
3. Download through an explicit action; cancel/retry an interrupted request.
4. Attempt revoked, deleted, quarantined, unsupported, and cross-tenant paths.
5. Return to the same meaningful list context.

**Pass**

- File rows/items expose unique name plus distinguishing path/source/type/size/status; icon/color is supplementary.
- Preview has correct document semantics, zoom/reflow, keyboard controls, and text/media alternative; otherwise a safe accessible download or equivalent presentation is adjacent.
- Progress/status is announced without excessive repetition; interruption preserves context and offers safe retry.
- Unauthorized/cross-tenant requests reveal no file existence or metadata and never appear in history, cache, search, or announcements.
- Malware/quarantine and unsupported states explain permitted next steps without unsafe bypass.
- Focus returns to the invoking file and list context after close/error.

## 7. Hosted payments

### J-08 — Pay invoice/deposit and manage recurring terms (Phase 4)

**Fixture:** invoice, deposit, subscription/retainer, declined and pending payment, duplicate activation, cancellation, hosted-provider outage, approved alternative hosted path.

**Steps**

1. Verify active customer, invoice/purpose, amount/currency, provider, and recurring/cancellation terms.
2. Enter the hosted flow and complete it with keyboard and screen reader.
3. Trigger field errors, decline, timeout, back/cancel, and repeat activation.
4. Return to Jamula and distinguish success, pending, failed, cancelled, and unknown.
5. Find receipt/history and use the approved fallback while the provider is unavailable.

**Pass**

- The provider transition and terms occur before commitment; amount/status is not conveyed only visually.
- Labels, errors, help, review, and confirmation in the hosted flow pass the accessibility matrix.
- Pending feedback starts within 200 ms; activation is idempotent and cannot create an accidental duplicate payment/subscription.
- Jamula never requests, receives, displays, or logs raw card credentials.
- Return state does not trust query text alone; it provides a durable, authorized status and receipt path.
- The fallback uses another approved hosted invoice/checkout route with equivalent amount/terms/security/accessibility. Email/chat/manual card capture is prohibited. Without a passing primary or equivalent fallback, Phase 4 is blocked.

## 8. Media and rich interaction

### J-09 — Consume video, audio, diagram, and interactive demonstration (applicable phase)

**Fixture:** captioned video with meaningful visuals, audio, data diagram, reduced motion, transcript, player failure, slow connection.

**Steps**

1. Reach the media without automatic playback.
2. Operate play/pause, seek, volume, captions, full-screen, and transcript by keyboard/screen reader.
3. Obtain visual information through audio description or descriptive transcript.
4. Use the diagram/demo without color, drag, hover, or motion.
5. Enable reduced motion and simulate player/embed failure.

**Pass**

- Zero audio/video bytes load before intent except approved metadata/poster; poster and activated segment meet budgets.
- Captions are accurate and synchronized; transcript is navigable; meaningful visual content has description.
- Player controls have names/state, visible focus, sufficient contrast, and no trap.
- Static summary/table alternative communicates the diagram/demo outcome and remains available when scripts/embed fail.
- Reduced motion removes non-essential spatial effects without hiding status or content.

## 9. Accessibility and public feedback

### J-10 — Report a barrier or correction (Phase 1 onward)

**Fixture:** anonymous report, optional reply details, invalid data, attachment absent by default, delivery error.

**Steps**

1. Reach Accessibility/Feedback from header/footer and from an error/fallback.
2. Report affected URL, barrier/correction, and optional assistive technology/contact details.
3. Correct errors and submit; simulate delivery failure.
4. Review acknowledgment, privacy expectation, response path, and urgent alternative.

**Pass**

- No account, inaccessible third party, or mandatory sensitive data is required.
- The form itself passes keyboard, screen-reader, zoom/reflow, contrast, reduced-motion, and error tests.
- Acknowledgment provides a reference/next step without echoing sensitive details publicly.
- Failure retains valid content and gives retry plus a maintained accessible alternate channel.
- Feedback enters an owned triage process with severity, affected journey, response target, remediation status, and closure/retest evidence.

## 10. Canonical, crawl, and performance journeys

### J-11 — Resolve every domain/URL variant (Phase 1)

**Fixture matrix:** HTTP/HTTPS, Jamula.net/Jamula.com, `www`, root/deep/missing path, trailing slash/case policy, encoded path, safe query, tracking query, external-looking query value.

**Pass**

- Every supported noncanonical variant reaches the exact approved `https://jamula.net` target by 301/308 in one redirect where possible, never more than two.
- Jamula.com never serves a duplicate `200`; HTTPS certificates are valid before redirect.
- Safe path/query is preserved under the approved normalization rule; no open redirect, loop, downgrade, or blanket home redirect exists.
- Canonical HTML, internal links, structured data, and sitemap agree.
- Missing resources remain meaningful 404/410 responses on Jamula.net.
- DNS/certificate/redirect failure invokes pause-and-remediate rollback; it never silently changes the canonical domain.

### J-12 — Crawl and validate representative templates (Phase 1 onward)

**Fixture:** home, service, case study, insight, contact, legal/accessibility, 404, preview, login, portal, provider callback, payment return.

**Pass**

- Indexable pages return `200`, have unique title/description/`h1`, self-canonical Jamula.net URL, allowed crawl, and one sitemap entry.
- Private, preview, session, portal, callback, and payment routes are excluded and protected by the correct authorization/index controls.
- `robots.txt` references the canonical sitemap and does not hide secrets or block required render resources.
- Structured data matches visible approved facts and passes applicable validation with no critical error; no rich-result claim is made.
- Sitemap contains no redirect/error/noncanonical/private URL and its meaningful `lastmod` values are accurate.

### J-13 — Meet route budgets and good Core Web Vitals (every released phase)

**Fixture cohorts:** home, heaviest public content, contact/consent, scheduling entry, authentication, portal shell/file list, billing/hosted-payment entry.

**Steps**

1. Run the approved repeated cold/warm lab profile and save trace/budget output.
2. Exercise the most expensive critical interaction and third-party activation.
3. Test before/after consent, reduced motion, slow network, failure, and populated realistic content.
4. After sufficient production traffic, inspect privacy-approved field cohorts separately for mobile and desktop.

**Pass**

- Each route meets the total, HTML, CSS, JavaScript, third-party script, font, image/media, request, and DOM budgets in `accessibility-seo-performance.md`.
- Lab LCP/CLS/FCP/TTFB/TBT and interaction-feedback thresholds pass without hiding third-party payload.
- Field **LCP ≤2.5 s, INP ≤200 ms, and CLS ≤0.1 at p75**, separately on mobile and desktop, for every critical route cohort with sufficient data.
- Insufficient field sample is labeled provisional; it is not converted into a pass or performance claim.
- Regression/error budgets have an owner and block release when a hard threshold is exceeded without an approved remediation.

## 11. Automated and manual evidence bundle

Each candidate/release evidence bundle MUST contain:

- automated accessibility results for every representative route/state plus documented manual findings;
- keyboard paths and screen-reader transcripts/notes for J-01 through every phase-applicable journey;
- zoom/reflow, text spacing, contrast, forced-colors, and reduced-motion results;
- caption/transcript/description and accessible-player review for each media pattern;
- redirect matrix, status/headers, canonical extraction, sitemap/robots validation, crawl/index matrix, and structured-data validation;
- transfer/request/category budget report, lab traces, and later field-CWV cohort reports;
- third-party primary and fallback results, including provider version and cross-origin limitations;
- unresolved findings and blocked/deferred packets with phase disposition.

Automation can catch regressions but cannot sign off a journey. Manual evidence without repeatable fixtures/versions is also insufficient.

## 12. Release decision table

| Condition | Disposition |
|---|---|
| Any applicable WCAG 2.2 A/AA failure blocks a critical journey | Block affected phase |
| Third-party critical barrier and no passing equivalent supported fallback | Block affected phase |
| Jamula.com HTTPS/path/query redirect or Jamula.net canonical conflict | Block Phase 1 launch |
| Private/customer route is publicly crawlable/indexable | Block affected phase and treat as security/privacy incident |
| Any critical route exceeds a hard transfer or lab budget | Remediate before release; exception cannot waive field-CWV target |
| Sufficient field data fails any good-CWV p75 threshold | Release remains out of performance compliance; remediate and remeasure |
| Field data is insufficient | Provisional/not proven; continue lab/RUM monitoring, make no claim |
| Vendor evidence or test access unavailable | Mark unverified; create blocked/deferred packet and apply phase/fallback gate |
| All applicable journeys and gates pass on a versioned candidate | Eligible for reviewer verification and Cyrus's phase approval; not by itself a public conformance claim |

## 13. Picard synthesis actions

For `Refs #3; child #5`, carry these test obligations into the option matrix, ADRs, phase gates, and implementation backlog:

1. Attach J-01–J-03 and J-09–J-13 to Phase 1.
2. Add J-04 to Phase 2.
3. Add J-05–J-07 separately for OneDrive, Google Drive, and Box to Phase 3.
4. Add J-08 to Phase 4.
5. Require Miles to own independent release verification, Fact Checker to verify claims/sources, Uhura to review content/media usability, and Cyrus to approve any public claim.
6. Record every unavailable vendor behavior as unverified; never use research or a mechanism spike as proof of conformance.
