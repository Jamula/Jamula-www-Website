# Multimedia and Social Plan

**Status:** Draft plan; no production publishing authorized
**Owner:** Nyota Uhura
**Reviewers:** Jadzia Dax, Sarek, Rai, Fact Checker
**Approver:** Cyrus Jamula

## Publishing model

`Jamula.net` is the canonical source. Social and repository items are purposeful adaptations, not automatic cross-posts. Each adaptation preserves the approved meaning, claim scope, citations, disclosures, correction link, accessibility, and expiry while fitting the channel.

| Channel | Format and purpose | Cadence | Owner / approval | Metric | Expiry control |
|---|---|---|---|---|---|
| Website | Canonical pages, articles, diagrams, demos, case studies | Monthly review; readiness-driven publication | Nyota; reviewers above; Cyrus exact-version approval | Task completion, qualified contacts, accessibility defects | 90-day factual / 180-day evergreen review |
| LinkedIn | Short insight, document/image post, captioned clip linking to canonical source | Maximum 2/week | Nyota/publisher; Cyrus campaign or sensitive-post approval | Meaningful engagements and qualified visits | 30-day outcome review; 90-day factual expiry |
| Medium | Source-rich technical article; canonical link and disclosure where applicable | Maximum 2/month | Nyota/editor; Cyrus exact-version approval | Reads, read ratio, qualified referrals | Sources 90 days; article 180 days |
| WhatsApp | Opted-in, event-driven conversation or approved template | No unsolicited schedule | Communications owner; Cyrus template approval | Opt-outs, complaints, response SLO, resolution | Consent per send; template 90 days |
| GitHub | Project-specific README/release/showcase content | Release/event driven | Maintainer + Nyota; Cyrus positioning approval | Documentation task success, issue SLO, referrals | Each release and quarterly |

## Channel adaptation rules

- **LinkedIn:** front-load the useful point; use plain text, descriptive links, and native alt text/captions when supported. Disclose employment, sponsorship, gifted access, partnership, or other material connection clearly in the item itself. Never imply Microsoft endorsement.
- **Medium:** publish a complete, useful article rather than a clipped traffic funnel. Cross-post only Jamula-owned work; preserve canonical attribution where supported. Medium prohibits duplicate copies on Medium, requires rights to posted content, restricts third-party advertising, and requires disclosure of value received.
- **WhatsApp:** contact only people who supplied their number and opted in to subsequent WhatsApp communications. Honor opt-out immediately. Keep consent evidence and provide a human escalation path. Do not place sensitive credentials, customer files, payment-card data, or health information in marketing conversations.
- **GitHub:** keep promotion related to the hosted project. Do not advertise in other users' accounts, post private information, or use inauthentic engagement. A repository showcase must identify its license scope and exclude customer/confidential assets.
- **Website:** every adaptation links to a stable canonical record when one exists. Correct the canonical record first, then propagate the correction.

## Rights and provenance ledger

No asset enters draft layout without an asset ID and ledger record. Required fields are: asset ID; class; title/description; creator and rights holder; source URL or acquisition record; creation/acquisition date; original file hash; license/contract/release; permitted media, territory, term, edits, sublicensing, and attribution; people/locations/brands depicted; privacy and consent status; AI/tool involvement; accessibility derivatives; storage location; retention/deletion date; owner; reviewer; approval; and takedown contact.

| Asset class | Minimum clearance | Special rule |
|---|---|---|
| Copy and translations | Authorship or license; quotation/source record; translator approval | Plagiarism and factual review; preserve meaning and disclosure |
| Photography | Photographer rights plus model/property release where applicable | Record minors, private locations, sensitive context, and alteration |
| Illustration, icons, diagrams | Creator/license and source files | Do not assume stock or template elements permit trademark/commercial use |
| Fonts | Exact family/weight/file and web/app embedding license | Sarek verifies redistribution, self-hosting, and attribution terms |
| Audio, music, sound effects | Composition and recording rights, voice consent, channel/territory/term | “Royalty free” is not a rights record |
| Video, animation, livestream | Footage, performance, music, location, logo, and distribution rights | Preserve project files, releases, caption/transcript masters |
| Testimonials and quotations | Signed exact wording, attribution, channels, term, result substantiation | Material connections and non-typical results require disclosure/review |
| Customer/partner logos | Written brand-use permission and current guidelines | Approval is channel-, placement-, and time-specific; no implied endorsement |
| Product/customer screenshots | Software/content rights and privacy/security redaction | Synthetic data by default; strip metadata and secrets; customer approval |
| Syndicated/embedded social content | Platform/embed terms plus author/content rights and privacy assessment | Prefer link or consented capture; embeds may add tracking and can disappear |
| AI-assisted media | Prompt/input provenance, model/tool/version, output review, human editor, applicable terms | No confidential inputs; no living-artist imitation, deceptive likeness, or rights assumption |
| Templates, stock, and third-party media | Purchase/license receipt and exact use restrictions | Record seat, project, edit, attribution, and redistribution limits |

Unknown ownership, release scope, platform licensing, synthetic-likeness permission, trademark permission, or redistribution terms are **blocked/unverified**. Do not use the asset while blocked.

## Accessibility and rendition acceptance

Targets apply to the canonical asset and every published adaptation.

| Asset | Required deliverables | Measurable acceptance |
|---|---|---|
| Informative image | Context-specific alt text; long description/data table for complex images | 100% informative-image alt coverage; decorative images use null alt; human review before approval |
| Graphic with text | Equivalent HTML text and alt; source text retained | No essential information available only as pixels |
| Prerecorded video | Corrected captions, transcript, description of essential visuals, accessible controls, poster alt | 100% caption/transcript coverage; caption QA against full program; keyboard and screen-reader player test passes |
| Live video | Real-time captions and accessible participation path | Caption provider confirmed before event; recording withheld until corrected captions/transcript exist |
| Audio-only | Corrected transcript and accessible player/download | 100% transcript coverage; speaker and meaningful non-speech audio identified |
| Animation/demo | Pause/stop controls, no unsafe flashing, reduced-motion/static alternative, instructions independent of sensory cues | Keyboard, screen reader, zoom/reflow, reduced-motion, and seizure-risk checks pass |
| Responsive media | Width/format variants, intrinsic dimensions, focal-point check, fallback | Test at 320/768/1280/1920 CSS px and 200% zoom; no cropped meaning or horizontal page scroll |

Production requirements:

- Plan captions, descriptions, and transcripts in the script/storyboard. Automated output is a starting point only; a human corrects names, terminology, timing, speaker identity, and meaningful sounds.
- Use a player with keyboard-operable controls, visible focus, programmatic names/states, caption selection, transcript access, volume controls, and no forced autoplay with sound.
- Retain a lossless or highest-quality source master; generate efficient modern renditions plus a supported fallback. Strip unnecessary metadata while retaining the provenance record separately.
- Implementation establishes page-weight and quality thresholds through representative tests; until Dax/Miles/Picard approve numeric budgets, rendition-size claims are **blocked/deferred**.
- Future implementation tests measure caption and transcript coverage, alt-text completeness, player conformance, responsive cropping, media transfer size, rendering time, and broken-asset rate in CI or scheduled audits.

The W3C [Images Tutorial](https://www.w3.org/WAI/tutorials/images/) and [Making Audio and Video Media Accessible](https://www.w3.org/WAI/media/av/) were verified 2026-08-24 and are the documented-research basis. WCAG 2.2 AA is the project target; legal conformance conclusions remain for Sarek/counsel.

## Account control

| Control | Requirement and evidence | Metric / review |
|---|---|---|
| Ownership | Organization-controlled identity, business email/number, current recovery details; no personal-only ownership | Inventory completeness 100%; quarterly |
| Privilege | Named primary and backup administrators; publisher role separated where supported; least privilege | Quarterly access recertification; leavers removed within 4 hours of notice |
| Authentication | Unique credentials in approved manager; MFA/phishing-resistant method where supported; recovery codes secured separately | MFA coverage 100%; recovery drill every 6 months |
| Change control | Approved content ID/version, actor, time, channel, and URL recorded | Publication log completeness 100% monthly |
| Recovery | Platform support path, proof of business control, alternate communications channel, incident owner | Recovery tabletop every 6 months |
| Automation | No automation until platform terms, permissions, rate limits, secrets, human review, and kill switch are approved | Unauthorized automation count 0 |
| Offboarding | Revoke sessions/tokens, transfer drafts/assets, rotate shared secrets, preserve required records | Completion within 4 hours for privileged access |

Credentials, recovery codes, tokens, and private messages never enter the content ledger or repository.

## Moderation and community care

Publish a concise participation standard: be relevant, respectful, truthful, privacy-safe, and free of harassment, hate, threats, doxxing, spam, impersonation, or rights violations.

| Severity | Example | Action and service level |
|---|---|---|
| Critical | Credible threat, doxxing, exposed credential/customer data, child-safety concern | Hide/restrict where possible; preserve minimum evidence securely; alert incident owner immediately; initial action within 1 hour |
| High | Harassment, hate, impersonation, fraud, infringement notice | Restrict/report; Sarek or safety owner review; initial action within 4 hours |
| Standard | Spam, repeated off-topic promotion, misinformation risk | Label/hide/remove per policy; action within 1 business day |
| Constructive | Question, criticism, correction | Acknowledge within 2 business days; answer or route without suppressing dissent |

Track count, category, channel, response time, outcome, appeal, and repeat pattern without copying unnecessary personal data. Publish no automated moderation until bias, appeal, privacy, and human-escalation tests pass.

## Retention, correction, and takedown

- Source masters and approvals: retain while published plus the approved legal/business period; exact period is **blocked pending privacy/legal retention decisions**.
- Working exports: delete within 30 days after approved master/derivatives are secured.
- Social drafts: delete rejected drafts within 30 days unless needed for an active dispute or documented learning.
- Platform analytics: export only aggregate fields needed for the scorecard; retain 13 months provisionally, subject to privacy approval.
- Consent, release, claim, correction, and takedown evidence: retention is **blocked pending Sarek/Seven review**; do not invent a period.
- Expiry automation must flag items 14 days before review; expired factual content is unpublished, unlisted, or clearly marked stale until reapproved.
- Correction/takedown follows the workflow in `editorial-workflow.md`; platform removal never substitutes for correcting the canonical source and derivative archive.

## Terms, disclosure, and review triggers

Claim-level retrieval was repeated on **2026-08-25**. Statuses describe only the exact retrieved claim:

| Source | Narrow use | Status |
|---|---|---|
| LinkedIn [User Agreement](https://www.linkedin.com/legal/user-agreement) and [Professional Community Policies](https://www.linkedin.com/legal/professional-community-policies) | Account/service responsibility and content/conduct restrictions | `verified narrow official claim`; launch applicability requires Sarek |
| Medium [Terms](https://policy.medium.com/medium-terms-of-service-9db0094a1e0f), [Rules](https://help.medium.com/hc/en-us/articles/213477928-Medium-Rules), and [Stats](https://help.medium.com/hc/en-us/articles/215108608-Stats) | User/content responsibilities, moderation rules, and named metrics | `verified narrow official claim`; feature/metric behavior is `vendor-documented` |
| WhatsApp [Business Terms](https://www.whatsapp.com/legal/business-terms), [Business Messaging Policy](https://www.whatsapp.com/legal/business-policy/), and [Messaging Guidelines](https://www.whatsapp.com/legal/messaging-guidelines) | Current business use, recipient opt-in/opt-out, approved templates, escalation paths, and messaging restrictions | `verified narrow official claim` for current retrieved pages |
| WhatsApp [preview replacement terms](https://www.facebook.com/legal/wa-for-business-terms-preview) | WhatsApp states replacement terms take effect **2026-09-23** | `vendor-documented`; Sarek review is `needs investigation`, and affected publishing pauses if unresolved |
| GitHub [Terms](https://docs.github.com/en/site-policy/github-terms/github-terms-of-service) and [Acceptable Use Policies](https://docs.github.com/en/site-policy/acceptable-use-policies/github-acceptable-use-policies) | Account/content responsibility and safety, IP, privacy, authenticity, and conduct restrictions | `verified narrow official claim` |
| Federal Register API [2023-14795](https://www.federalregister.gov/api/v1/documents/2023-14795.json) and [official GovInfo PDF](https://www.govinfo.gov/content/pkg/FR-2023-07-26/pdf/2023-14795.pdf) | FTC adopted revised Endorsement Guides effective 2023-07-26 | `verified narrow official claim`; exact applicability/disclosure wording requires Sarek/counsel |
| FTC [Disclosures 101](https://www.ftc.gov/business-guidance/resources/disclosures-101-social-media-influencers), [AI topic](https://www.ftc.gov/industry/technology/artificial-intelligence), and prior AI-claims blog endpoint | No narrow claim is relied on because current automated access returned 403 and FCR-008 also recorded stale/404 AI-blog behavior | `access-blocked` / `needs investigation`; not verified |

Reachability is not publication approval. Platform terms do not substantiate Jamula outcomes, and no AI, endorsement, customer, environmental, accessibility, or performance claim may bypass the claims gate.

Re-review immediately after a platform notice, feature/API change, account transfer, security incident, new monetization/sponsorship, new data collection, new jurisdiction/campaign, or complaint suggesting the approved process is inadequate.
