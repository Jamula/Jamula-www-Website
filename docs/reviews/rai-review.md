# Responsible AI and content-safety pre-ship review

**Reviewer:** Rai, Responsible AI & Social Impact Reviewer

**Review date:** 2026-08-25

**Scope:** Generated PR 2 documentation listed in `docs/artifacts-manifest.md`, with emphasis on public/founder claims, customer and public AI, content/social workflows, privacy, accessibility, environmental claims, fairness, stakeholder inclusion, credentials, PII, and blocked evidence.

**Decision type:** Internal Responsible AI/content-safety review only. This is not legal, privacy, accessibility, security, environmental, accounting, or other professional approval.

## Verdict

## 🔴 RED — REJECT / DO NOT SHIP OR PRESENT PR 2 AS-IS

**Finding count:** 4 — 1 Critical, 2 High, 1 Medium.

The package would place unapproved founder personal/workplace-source metadata into a repository the architecture identifies as public. A `do not publish` label does not prevent repository publication. The rejected artifacts are locked: their original authors must not revise them. Independent revision owners are assigned below, and Rai must re-review the resulting exact diff before the package is presented or shipped.

## Findings

### RAI-01 — Unapproved founder personal and workplace-source metadata would be published

**Severity:** Critical

**Confidence:** High

**Artifacts rejected:** `docs/content/founder-profile-draft.md`; `docs/content/founder-source-register.md`

**Exact evidence**

- `docs/decisions/adr-006-repository-content-and-legal-gates.md:6` identifies the repository as public and says founder facts require controlled provenance.
- `docs/content/founder-profile-draft.md:9` publishes the named founder's LinkedIn and GitHub profile links even though `:5` says publication is blocked.
- `docs/content/founder-profile-draft.md:16` and `:28` disclose the Microsoft/workplace category and the existence/use of a private working profile.
- `docs/content/founder-source-register.md:7-9` records a private attachment, employer/profile cross-matching, personal profile URLs, and `publication No`.

**WHAT:** The repo-bound drafts contain identifiable profile links and metadata derived from or describing a private workplace source whose exact public use is explicitly unapproved.

**WHY:** Committing or presenting these files in a public repository is itself disclosure. Status text such as `unapproved` or `do not publish` does not stop indexing, copying, inference, or unwanted association. It also contradicts the recorded `publication No` disposition and exposes more source/provenance detail than the public needs.

**HOW:** Replace public-repository copies with non-identifying placeholders. Keep the private-source register, source-existence metadata, employer cross-match, and unapproved URLs in an access-controlled register outside the public repository. Add only Cyrus-selected exact facts/links after explicit recorded approval, minimization, expiry/correction controls, and required privacy/employer/trademark/professional review.

**Strict-lockout revision owner:** **Sarek**, not original author Nyota Uhura. Picard may integrate only after Sarek's independent revision, Fact Checker verification, Cyrus's exact-wording approval, and Rai re-review.

### RAI-02 — Editorial rejection routing conflicts with strict reviewer lockout

**Severity:** High

**Confidence:** High

**Artifact rejected:** `docs/content/editorial-workflow.md`

**Exact evidence**

- `docs/content/editorial-workflow.md:25` says, “Any failed gate returns to the author.”
- `docs/content/editorial-workflow.md:64-75` assigns independent review authority, including Rai for fairness, harmful framing, responsible AI, and content safety.

**WHAT:** The workflow routes every failed gate back to the original author, including a rejecting Responsible AI/content-safety review.

**WHY:** That route defeats strict rejection lockout, weakens independence, and permits the author of unsafe or privacy-invasive material to control its remediation. It is especially unsafe for public claims, founder information, environmental assertions, customer AI, and social content.

**HOW:** Distinguish ordinary editorial revision from formal rejection. A Red/rejecting reviewer decision must lock the original author out, record the rejection and exact diff, assign a different qualified revision owner, preserve reviewer independence, and require re-review before Cyrus approval. Do not let schedule, quota, or author ownership override the lock.

**Strict-lockout revision owner:** **Dax**, not original author Nyota Uhura. Rai re-reviews the exact corrected workflow.

### RAI-03 — Public-AI release gates omit explicit rights, transparency, fairness, and participation evidence

**Severity:** High

**Confidence:** High

**Artifacts rejected:** `docs/roadmap/phase-gates.md`; `docs/roadmap/implementation-backlog.md`

**Exact evidence**

- `docs/roadmap/phase-gates.md:12` gates public AI on corpus separation, no private retrieval/actions/egress, Phase 3 evidence, abuse/moderation/model-change/cost tests, and reviewer go/no-go.
- `docs/roadmap/implementation-backlog.md:22` repeats isolation, abuse/moderation/cost, and explicit go/no-go.

**WHAT:** The optional public-AI gate does not require testable evidence for corpus rights/provenance, AI disclosure, intended users and prohibited uses, representational and allocation harms, language/locale performance, accessibility, impacted-stakeholder participation, contestability/appeal, or correction/removal.

**WHY:** Isolation and abuse testing are necessary but do not establish that a public AI experience is fair, understandable, rights-safe, accessible, or socially acceptable. A reviewer name in a gate is not a substitute for defined evidence and acceptance thresholds.

**HOW:** Add hard, non-waivable public-AI evidence requirements: approved corpus manifest and rights/removal trail; conspicuous AI/limitations/data-use disclosure; harm taxonomy and red-team plan; predeclared quality, harmful-output, refusal, citation, locale, and accessibility thresholds; compensated participation by representative/affected users; accessible escalation, feedback, appeal, correction, and shutdown paths; model/change re-evaluation; documented Rai, Dax, Sarek, Miles, Fact Checker, and Cyrus dispositions. Do not infer sensitive traits merely to measure fairness; use consented, minimized evaluation methods.

**Strict-lockout revision owner:** **Miles O'Brien**, not original author Picard. Rai re-reviews the exact revised gates.

### RAI-04 — Customer-AI success criteria do not measure answer safety, equitable quality, or stakeholder outcomes

**Severity:** Medium

**Confidence:** High

**Artifact rejected:** `docs/security/quality-strategy.md`

**Exact evidence**

- `docs/security/quality-strategy.md:45` defines customer-AI success as technical success within latency, an authorized citation or no-answer, zero leakage/action/egress, and a cost kill switch.
- `docs/security/quality-strategy.md:47` similarly defines the public-AI candidate primarily by technical success and isolation/spend controls.
- `docs/security/quality-strategy.md:77` makes participation by disabled people conditional on “when feasible.”
- `docs/privacy/data-inventory.md:30-33` acknowledges that customer source content and AI sessions may contain special-category or personal data.

**WHAT:** The measurable SLOs omit answer correctness/entailment, harmful-output and unsafe-advice rates, over-refusal/under-refusal, performance across representative source types/languages/access needs, and outcome-based stakeholder evaluation.

**WHY:** A response can be technically successful, cited, tenant-isolated, and still be misleading, harmful, systematically less useful to some users, or inaccessible. Optional participation provides weak evidence for a customer-facing AI release.

**HOW:** Before Phase 3 preview, define versioned evaluation cards and release thresholds for grounded correctness/citation entailment, unsupported assertions, harmful content, appropriate refusal, escalation, representative languages/source types, and accessibility. Require compensated participation by disabled and representative customer users, or a documented release blocker—not “when feasible.” Record subgroup/locale limitations without inferring or retaining sensitive attributes unnecessarily; monitor regressions and provide tenant-visible feedback/correction/escalation.

**Strict-lockout revision owner:** **Seven of Nine**, not original author Miles O'Brien. Rai re-reviews the exact revised strategy.

## Controls confirmed

These controls are present and must not be weakened during remediation:

- **Customer AI remains tenant-scoped and read-only.** `docs/architecture/customer-platform.md:168-179`, `docs/privacy/data-lifecycle.md:57-72`, and `docs/security/control-test-matrix.md:55` require exact tenant namespaces, current ACL/version revalidation, attributable authorized citations, no file/CRM/payment/messaging/admin/network actions, no arbitrary egress, and content-free telemetry.
- **Public AI remains separate and optional.** `docs/roadmap/phase-gates.md:12` and `docs/security/control-test-matrix.md:78` require a separate public corpus, independent exclusion of customer/private corpora, no actions/egress, Phase 3 production evidence, and a separate approval.
- **Blocked connector evidence remains blocked.** `docs/spikes/connectors/onedrive.md:1-12`, `google-drive.md:1-12`, and `box.md:1-12` accurately state that credentials/resources were prohibited and no live mechanism was run. Preview/GA remain blocked at `:57-58`.
- **Unsupported public claims remain unapproved.** `docs/content/public-claims-register.md:7-8` marks the general positioning unverified and the Microsoft-preferred/multi-cloud wording blocked, with publication approval `No`. No customer outcome, Microsoft endorsement, accessibility-conformance, or environmental/sustainability achievement is approved.
- **Professional gates remain pending.** `docs/legal/professional-review-register.md:7-16` consistently records pending professional review; this Rai review does not satisfy or replace any such gate.
- **Credential/secret scan:** No raw private key, API key, OAuth token, password, personal email address, or telephone number was observed in the reviewed Markdown. The founder metadata in RAI-01 is the identified personal/private-source exposure and must be removed before repository publication.

## Re-review condition

Red remains in force until all four findings are independently revised under lockout, the public-repository founder material is minimized or moved to access-controlled storage, the exact diff passes Rai re-review, and Cyrus records the required approval. This review does not authorize public claims, founder wording, customer/public AI, connector availability, environmental/sustainability claims, or professional/legal conclusions.

## Remediation re-review — 2026-08-25

**Re-review basis:** Exact current working-tree contents were compared finding-by-finding with RAI-01 through RAI-04. The original review and rejection above remain the immutable decision history.

## 🟢 GREEN — ALL FOUR RAI FINDINGS RESOLVED

**Disposition count:** 4 resolved; 0 unresolved.

This Green verdict supersedes the prior Red only for the exact artifact versions fingerprinted below. It is a Responsible AI/content-safety disposition, not publication authorization, Cyrus approval, connector evidence, or legal/privacy/accessibility/security/environmental/professional approval. Any material change to these artifacts reopens the affected finding.

### Exact revision set

| Artifact | Current SHA-256 |
|---|---|
| `docs/content/founder-profile-draft.md` | `63389cd9c7f2b292f1a775ad6276d6531c0247f5f49a388827c5b508f45b749f` |
| `docs/content/founder-source-register.md` | `be8afba241c0df17e5eb0f71f67a762fe6a5c51d856fe10b12bbed1d3b52d6e6` |
| `docs/content/editorial-workflow.md` | `463ee457adc5b8e71ac7159f219406debbabd6cc8fe18f2625fbf267cadc5061` |
| `docs/roadmap/phase-gates.md` | `b61bd858e8d43e2bd70058f99fb134bb3d9de87ec553687b03049a1d93028f91` |
| `docs/roadmap/implementation-backlog.md` | `3db6d44e01bcf9d2b8987267cde46ac7d21d2d026ffc940f37abfaf6046694da` |
| `docs/security/quality-strategy.md` | `3c545f9a9a3508ba1b3ca7d8d627da70fe539bfb4f553746fcd1ce6416a05cbc` |

### RAI-01 — Resolved

**Evidence**

- `docs/content/founder-profile-draft.md:1-9` is now a neutral, non-identifying placeholder with no biography, profile URL, employer/workplace reference, credential, or personal fact.
- `docs/content/founder-profile-draft.md:13-23` requires exact Cyrus approval and an access-controlled external source register, prohibits copying private-source/identity/workplace/source-URL metadata into this repository, and permits only the neutral placeholder until approval.
- `docs/content/founder-source-register.md:1-12` is a public-repository stub containing no founder facts, source links, or source descriptions; publication remains blocked.
- `docs/content/founder-source-register.md:14` retains only the abstract approval/evidence fields required for a future controlled record.
- `docs/artifacts-manifest.md:31-32` records Sarek—not locked-out original author Nyota Uhura—as the independent RAI-01 revision owner.

**Status:** **Resolved.** A full documentation scan found no LinkedIn personal-profile URL or Cyrus personal GitHub profile URL. The preserved rejection history above names only the risk categories necessary to explain the prior decision; the remediated domain artifacts expose no profile URL, source identity/content, employer identity, cross-match, contact detail, or approved founder fact.

### RAI-02 — Resolved

**Evidence**

- `docs/content/editorial-workflow.md:3-9` records independent revision ownership by Jadzia Dax, locks Nyota Uhura out of authoring/advising/co-authoring, preserves independent review, and reserves final approval to Cyrus.
- `docs/content/editorial-workflow.md:28-42` distinguishes ordinary feedback from formal Red/reject; requires a recorded rejected revision/diff, artifact-specific author lockout, a different qualified owner, independent revision, exact-diff re-review, and a third owner or Cyrus escalation after another rejection.
- `docs/artifacts-manifest.md:30` records Jadzia Dax as the RAI-02 revision owner and Rai re-review as pending at the inspected baseline.

**Status:** **Resolved.** The workflow now implements strict lockout and prohibits schedule, familiarity, nominal ownership, advising, pairing, or self-approval from bypassing it.

### RAI-03 — Resolved

**Evidence**

- `docs/roadmap/phase-gates.md:12` makes every P5-AI-01 through P5-AI-12 gate non-waivable and requires separate recorded Rai, Dax, Sarek, Miles, Fact Checker, and Cyrus dispositions.
- `docs/roadmap/phase-gates.md:16-33` now requires public/customer corpus isolation; item-level rights/provenance/removal; plain-language AI/data-use disclosure; intended/prohibited use controls; representational, allocation, locale, privacy, and safety harm testing; frozen evaluation; consented and compensated representative/disabled-user participation; accessible feedback, appeal, correction, human support and operator shutdown; privacy-preserving fairness measurement; change re-evaluation; monitoring; and independent approval.
- `docs/roadmap/phase-gates.md:35-48` sets per-locale grounded-quality, harmful-output, refusal, citation, language, accessibility, and zero-tolerance boundary thresholds.
- `docs/roadmap/implementation-backlog.md:22` binds optional public AI to all twelve gates, and `:26-40` decomposes rights, transparency, fairness/harm, participation, accessibility, appeal/correction, privacy, monitoring, shutdown, and independent go/no-go evidence without authorizing implementation.
- `docs/artifacts-manifest.md:76-77` records Miles O'Brien—not locked-out original author Picard—as the independent RAI-03 revision owner.

**Status:** **Resolved.** Public AI remains optional and absent unless every rights, transparency, fairness, accessibility, participation, contestability, correction, operations, and shutdown gate passes.

### RAI-04 — Resolved

**Evidence**

- `docs/security/quality-strategy.md:47` explicitly separates technical request success from answer quality and makes the evaluation card non-waivable.
- `docs/security/quality-strategy.md:61-77` requires immutable, versioned evaluation cards with purpose/use boundaries, languages/locales, representative source types, rights/provenance, per-stratum results, compensated participation, accessibility technologies, known limitations, and change-triggered reruns.
- `docs/security/quality-strategy.md:79-94` sets non-waivable thresholds: grounded correctness ≥95% overall/≥90% per stratum; citation entailment ≥98% overall/≥95% per stratum; unsupported material assertions ≤1% and zero for high-impact claims; zero Critical/High harmful outputs; bounded lower-severity harm and over-refusal; required no-answer/human escalation; independent per-language/source passing; zero Critical/High accessibility defects and ≥90% critical-task completion per participant/access cohort; regression limits; and tenant-visible correction.
- `docs/security/quality-strategy.md:96-102` requires at least eight compensated representative customer users per Phase 3 preview/GA card, including at least four disabled users across named access needs, representation of every supported launch language and material source type, consent/minimization, and a release block if participation cannot safely occur.
- `docs/security/quality-strategy.md:7` and `docs/artifacts-manifest.md:52` record Seven of Nine—not locked-out original author Miles O'Brien—as the independent RAI-04 revision owner.

**Status:** **Resolved.** Customer-AI release evidence now includes measurable correctness, citation, unsupported-assertion, safety/refusal, locale/source, accessibility, correction, and compensated-user thresholds in addition to tenant isolation/read-only invariants.

### Re-scan results

- **Secrets/credentials:** No raw private key, AWS/GitHub/OpenAI/Google/Slack-style token, JWT, populated password/client-secret/access-token/refresh-token/connection-string assignment, or other raw credential pattern was found in `docs/**/*.md`.
- **Personal contacts and profiles:** No personal email address, telephone number, LinkedIn personal-profile URL, or Cyrus personal GitHub profile URL was found in `docs/**/*.md`.
- **Microsoft, customer, accessibility, environmental and sustainability claims:** `docs/content/public-claims-register.md:3-11` still marks all such publication claims unapproved; the Microsoft-preferred wording is blocked with Cyrus approval `No`, and no customer-result or environmental/sustainability candidate has sufficient wording/evidence. `docs/company/public-values-draft.md:3-14` and `docs/company/operating-principles.md:3-24` remain provisional rather than achieved-outcome claims.
- **Connector evidence:** `docs/spikes/connectors/onedrive.md:1-14`, `google-drive.md:1-14`, and `box.md:1-14` remain `documented research only`, `blocked/deferred`, and explicit that no live mechanism ran. Their preview gates remain unavailable/hidden at each file's `:56-59`, and teardown sections at `:61-63` accurately record that no resources, credentials, tokens, files, calls, or charges were created.

### Final disposition

No RAI finding remains Red, so no new revision owner is required. The prior strict lockouts are satisfied for this revision cycle by the independently attributed versions above. The package may proceed past the Rai gate only after the other named reviewers complete their own dispositions and Cyrus approves the exact SHA; all professional and public-claim gates remain separate and pending.
