# Editorial Workflow

**Status:** Cycle 2 independent remediation; no copy or asset is approved for production publishing
**Original author / editorial process owner:** Nyota Uhura
**Revision owner:** Jadzia Dax (assigned under RAI-02 strict lockout)
**Lockout:** Nyota Uhura may not author, advise on, or co-author this artifact revision
**Required independent re-reviewers:** Rai (rejecting reviewer), Sarek, Fact Checker
**Reviewer independence:** Jadzia Dax is the revision author and cannot approve her own revision
**Final approver:** Cyrus Jamula

## Workflow

| Stage | Owner | Required record | Exit criterion |
|---|---|---|---|
| 1. Intake | Requester + Nyota | Content ID, audience, purpose, channel, owner, due window, canonical location, sensitivity, proposed metric, expiry | Scope and accountable owner accepted |
| 2. Source/evidence | Author + Fact Checker | Source URLs/files, publisher, retrieval date, version/region, exact supported statement, counter-evidence, evidence state | Each factual statement supported or removed |
| 3. Claims triage | Nyota | Claim classification and proposed claims-register packet | Regulated/public claims approved in register or omitted |
| 4. Rights/privacy | Author + Sarek | Asset ledger, licenses/releases, confidentiality and personal-data check, disclosures | Rights and privacy scope verified |
| 5. Draft/adapt | Author | Canonical draft and channel adaptations; change history | Meaning, citations, disclosure, correction path, and expiry preserved |
| 6. Accessibility/experience | Dax + author | Alt text, captions, transcript, descriptions, responsive renditions, plain-language and player checks | All applicable checks pass |
| 7. Safety/accuracy/legal | Rai, Fact Checker, Sarek | Review dispositions and conditions | No unresolved blocker; professional gate identified where needed |
| 8. Approval | Cyrus | Exact artifact version/hash, channels, conditions, approval time, expiry | Explicit exact-version approval |
| 9. Publish | Named publisher | URL/post ID, timestamp, actor, approved version, disclosures, expiry | Live item matches approved version; no draft is silently substituted |
| 10. Verify | Publisher + author | Link, rendering, metadata, accessibility smoke test, analytics/consent check | Verification within 1 hour; rollback if critical failure |
| 11. Monitor/review | Owner | Metric, moderation, feedback, source/terms changes, review decision | Retain, revise, retire, or escalate |
| 12. Archive/delete | Owner + records/privacy owner | Final capture/hash where permitted, disposition, deletion propagation, legal hold | Derivatives and scheduled posts reconciled |

### Feedback, rejection, and lockout

Ordinary editorial feedback is not a rejection. A reviewer may request a bounded correction while leaving the artifact in `in review`; the current author may make that correction, and the reviewer records the disposition.

A formal **Red/reject** verdict is different and cannot be treated as an ordinary failed gate:

1. The rejection record names the reviewer, verdict/time, artifact and rejected revision/hash, finding IDs, exact evidence, and the exact diff from the review baseline that is rejected.
2. The original author is locked out of that artifact for the revision cycle. They may not revise it or participate as an advisor, co-author, or pair.
3. The coordinator assigns a different qualified revision owner and records that the assignee is not the locked-out author. Schedule, quota, familiarity, or nominal content ownership cannot override the lock.
4. The revision owner produces an independently attributable exact diff and a finding-by-finding response without obtaining revision input from the locked-out author.
5. The rejecting reviewer independently re-reviews the exact revised diff. All other required domain reviewers re-review affected gates before Cyrus receives it.
6. Cyrus may approve only the exact independently re-reviewed version. Approval does not clear a rejection retroactively or carry across a material factual, visual, rights, channel, audience, disclosure, or claim change.
7. If the revision is rejected, that revision owner is also locked out for the next cycle and a third qualified owner is required. If no qualified unlocked owner remains, escalate to Cyrus; do not re-admit a locked-out author.

A rejection lockout ends only after the independently revised artifact is approved for that cycle. It is artifact-specific and does not prevent the original author from working on unrelated artifacts.

## Evidence discipline

- **Documented research:** current official documentation or primary evidence, recorded with URL/title/publisher, retrieval date, effective/version/region, exact supported statement, limits, and status.
- **Mechanism evidence:** a bounded test record with configuration, synthetic data, steps, measurements, result, and teardown. It supports only the exercised mechanism.
- **Blocked/deferred packet:** blocker, attempted evidence, owner, effect on the audience, safe fallback, remediation issue, review date, and release disposition.
- **Future implementation test:** an executable criterion, fixture/data constraints, pass threshold, owner, and evidence output. Planned tests are not completed evidence.

Vendor marketing, relevance scores, impressions, prototypes, and disposable spikes do not substantiate production, customer, accessibility, security, environmental, or ethical outcomes.

Each cited claim receives one status: `verified narrow official claim`, `vendor-documented`, `partial`, `access-blocked`, `unverified`, `needs investigation`, `contradicted`, or `future test`. A reachable source can support only the exact retrieved statement; it does not verify legal applicability, production behavior, or every statement on the page. An access-blocked or unretrieved source is never labeled verified.

## Claims gate

The following must not be published without an approved `public-claims-register.md` entry:

- environmental or resource claims;
- ethical, fair, inclusive, social-impact, community, or responsible-AI claims;
- accessibility/conformance claims;
- customer names, endorsements, testimonials, outcomes, savings, or satisfaction;
- speed, quality, reliability, security, privacy, compatibility, scale, accuracy, or other performance claims;
- rankings, comparisons, “best,” “leading,” “green,” “secure,” “compliant,” or similar implications.

The packet proposed to Picard must contain exact wording, status (`aspiration` or `achieved`), scope/baseline, method/metric, dated evidence, limitations, owner, Fact Checker disposition, Sarek and Rai dispositions, Cyrus approval field, review cadence, expiry, and correction/removal action. Until integrated and approved, substitute neutral mechanism language or omit the statement.

## Editorial calendar

Nyota maintains a planning calendar with one record per content ID:

`content ID | working title | audience | purpose | canonical/channel | pillar | evidence state | claim status | asset IDs | author | owner | reviewers | approver | draft/review/publish windows | metric | review date | expiry | status | correction link`

Planning rhythm:

- **Weekly:** triage requests, blockers, moderation, expiring sources/assets, and capacity. No quota forces publication.
- **Monthly:** approve the next bounded set of website/social work; review scorecard, rights completeness, accessibility failures, and corrections.
- **Quarterly:** evaluate pillars/channels, account access, platform terms, retention, stale content, and audience feedback.
- **Event-driven:** releases, verified research, customer permission, material corrections, incidents, platform-term changes, or claim expiry.

Status values are `idea`, `research`, `blocked`, `draft`, `in review`, `approved`, `scheduled`, `published`, `correcting`, `expired`, `withdrawn`, and `archived`.

## Review authority

| Role | Decision |
|---|---|
| Nyota | Editorial purpose, coherence, adaptation, calendar, and publishing readiness |
| Dax | Information experience, visual communication, responsive behavior, and accessibility |
| Fact Checker | Source quality, exact factual support, contradictions, freshness, and metric interpretation |
| Sarek | Rights, releases, platform terms, disclosures, regulatory exposure, and professional-review escalation |
| Rai | Social impact, fairness, harmful framing, responsible AI, and content-safety escalation |
| Customer/partner | Exact use of its name, logo, quotation, result, screenshot, or confidential context |
| Cyrus | Exact public version, conditions, channels, and expiry; the only final publication approver |
| Publisher | Faithful execution only; cannot waive a gate or alter approved meaning |

## Moderation and response

1. Capture the minimum evidence needed; do not replicate harmful or personal material unnecessarily.
2. Classify critical, high, standard, or constructive under `multimedia-social-plan.md`.
3. Restrict exposure where possible, notify the owner, and route threats/security/privacy to the incident process.
4. Apply the platform policy consistently; record action, reason, time, reviewer, appeal, and follow-up.
5. Do not remove good-faith criticism merely because it is unfavorable. Correct Jamula's errors visibly.

Service measures: critical initial action within 1 hour, high within 4 hours, standard within 1 business day, and constructive acknowledgement within 2 business days. Report monthly median/95th-percentile response time, missed-SLO count, appeals, reversals, and recurrence.

## Correction and takedown

| Severity | Trigger | Initial action | Target |
|---|---|---|---|
| Critical | Exposed secret/personal/customer data, credible safety threat, unlawful or clearly unlicensed material | Unpublish/restrict immediately; activate incident/legal path; preserve minimum controlled evidence | 1 hour |
| Material | False customer/performance/endorsement claim, materially misleading guidance, revoked permission | Pause promotion, mark/withdraw canonical item, notify reviewers/affected party, investigate | 4 hours |
| Standard | Broken link, stale version, typo that changes meaning, inaccessible derivative | Correct canonical item and propagate | 2 business days |
| Minor | Cosmetic issue with no changed meaning | Correct in next controlled update | 5 business days |

Correction record: content/asset ID; reporter; received time; affected channels; original approved version; issue and risk; evidence; decision owner; action; public correction text where appropriate; customer/rights-holder notice; derivative propagation; search/cache/archive limits; completion time; and prevention action.

- Correct the canonical source first, then all known derivatives and scheduled content.
- Preserve a public correction note when transparency outweighs removal; remove immediately when continued exposure causes privacy, security, safety, or rights harm.
- A platform that cannot be edited receives a clarifying follow-up or deletion/repost according to reviewer direction.
- Takedown requests are acknowledged within 1 business day; validity and final legal deadlines are determined by Sarek/counsel, not guessed here.
- Expired approval, source, license, release, or claim automatically pauses publication until reapproval.

## Analytics and governance checks

Monthly measures:

- 100% published items have owner, approval, metric, review date, and expiry;
- 100% assets have rights/provenance records;
- 100% applicable media have human-reviewed accessibility derivatives;
- expired published items: target zero;
- critical corrections within SLO: target 100%;
- moderation SLO and appeal/reversal rate;
- qualified referrals and task completion by channel;
- WhatsApp opt-out/complaint rate and human-response SLO;
- correction recurrence and blocked-packet age.

Targets beyond process completeness require an approved baseline. Analytics collection itself must pass privacy, consent, retention, and accessibility review.

## Account, retention, and continuity checks

- Quarterly: recertify platform owners/admins/publishers and remove stale access.
- Every six months: exercise account recovery and correction/takedown propagation using synthetic content.
- Before staff/contractor exit: revoke platform sessions/tokens within 4 hours for privileged access and transfer approved assets/records.
- Fourteen days before expiry: notify owner and reviewers; at expiry, unpublish/unlist/mark stale if no reapproval.
- Retention periods for consent, releases, claims, moderation evidence, and legal holds remain **blocked pending Sarek and Seven review**. Working exports are deleted within 30 days after secure master ingestion.

## Future implementation tests

1. Prevent scheduling when approval, rights, claim, accessibility, or expiry fields are incomplete.
2. Compare the live item hash/critical fields to the approved version.
3. Crawl published items for broken links, expired evidence, missing alt text, missing captions/transcripts, and stale canonical references.
4. Test keyboard, screen reader, 200% zoom/reflow, reduced motion, captions, transcript access, and responsive renditions on representative content.
5. Run a synthetic correction across all five channels and measure propagation time.
6. Run account-recovery/offboarding table-tops without real credential disclosure.
7. Verify WhatsApp suppression before every business-initiated message and prohibit send without consent evidence.
8. Verify analytics honor consent and omit disallowed identifiers.

These are acceptance criteria, not evidence that the controls exist.

## Register update proposals and Picard actions

**Context for every item: `Refs #3; child #4`.** These are proposals only; Nyota did not edit either register.

1. **Founder register:** ask Cyrus to select exact LinkedIn facts and exact GitHub projects/activity, approve precise wording, set review/expiry dates, and define correction/removal action. Picard should keep founder publication blocked until this is complete.
2. **Claims register:** add candidate entries only when exact proposed wording and evidence exist for Jamula positioning, accessibility, environmental responsibility, ethical/social responsibility, customer outcomes, AI capability, security/privacy, compatibility, and performance. Picard should preserve the required Fact Checker, Sarek, Rai, and Cyrus gates.
3. **Channel terms:** assign Sarek a launch/applicability review of the currently retrievable LinkedIn terms and the WhatsApp replacement terms effective 2026-09-23. Retrieval supports only the narrow source statements below; legal applicability and post-effective WhatsApp use remain blocked pending disposition.
4. **Retention:** assign Seven and Sarek to approve retention/deletion periods for consent, release, claim, moderation, analytics, correction, and takedown records.
5. **Implementation backlog:** Picard should create future implementation acceptance criteria for approval enforcement, expiry, rights ledger, accessibility audits, consent suppression, account recovery, analytics governance, and correction propagation. Do not create production issues or code during this evaluation task.
6. **Source integration:** Picard should have Fact Checker reconcile the dated primary-source notes in these four artifacts with the shared research source register and contradiction pass.

## Dated primary-source basis

Claim-level retrieval was repeated **2026-08-25**:

| Source | Narrow claim supported | Status |
|---|---|---|
| W3C [WCAG 2.2 Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/), [Images Tutorial](https://www.w3.org/WAI/tutorials/images/), and [Accessible Audio/Video](https://www.w3.org/WAI/media/av/) | Official accessibility criteria/guidance cover text alternatives and accessible media planning/deliverables | `verified narrow official claim` |
| LinkedIn [User Agreement](https://www.linkedin.com/legal/user-agreement) and [Professional Community Policies](https://www.linkedin.com/legal/professional-community-policies) | Official pages state account/service responsibilities and content/conduct restrictions | `verified narrow official claim`; launch applicability still requires Sarek |
| Medium [Terms](https://policy.medium.com/medium-terms-of-service-9db0094a1e0f), [Rules](https://help.medium.com/hc/en-us/articles/213477928-Medium-Rules), and [Stats](https://help.medium.com/hc/en-us/articles/215108608-Stats) | Official pages document user/content responsibilities, moderation rules, and named metric definitions | `verified narrow official claim`; product behavior remains `vendor-documented` |
| WhatsApp [Business Terms](https://www.whatsapp.com/legal/business-terms), [Business Messaging Policy](https://www.whatsapp.com/legal/business-policy/), and [Messaging Guidelines](https://www.whatsapp.com/legal/messaging-guidelines) | Current official pages document business use, opt-in/opt-out, template, escalation, and messaging-policy duties | `verified narrow official claim` for current pages; replacement terms effective 2026-09-23 are `needs investigation` pending Sarek review |
| GitHub [Terms](https://docs.github.com/en/site-policy/github-terms/github-terms-of-service) and [Acceptable Use Policies](https://docs.github.com/en/site-policy/acceptable-use-policies/github-acceptable-use-policies) | Official pages document account/content responsibility and restrictions involving safety, IP, privacy, authenticity, and conduct | `verified narrow official claim` |
| Federal Register API, [Guides Concerning the Use of Endorsements and Testimonials in Advertising](https://www.federalregister.gov/api/v1/documents/2023-14795.json), with [official GovInfo PDF](https://www.govinfo.gov/content/pkg/FR-2023-07-26/pdf/2023-14795.pdf) | FTC adopted revised Endorsement Guides, effective 2023-07-26 | `verified narrow official claim`; exact applicability/disclosure wording requires Sarek/counsel |
| FTC [Disclosures 101](https://www.ftc.gov/business-guidance/resources/disclosures-101-social-media-influencers), [AI topic](https://www.ftc.gov/industry/technology/artificial-intelligence), and prior AI-claims blog endpoint | Automated retrieval returned 403, while FCR-008 also observed stale/404 behavior for the AI blog | `access-blocked` / `needs investigation`; these endpoints do not support a verified claim in this packet |

No source row is a publication approval, legal conclusion, platform-conformance result, or public claim.
