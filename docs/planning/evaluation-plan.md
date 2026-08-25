# Jamula Website Evaluation and Squad Bootstrap Plan

## Problem and approach

Jamula, Inc. needs a modern public website for Jamula.com and Jamula.net, a secure customer area, and a practical path to CRM, storage integrations, AI chat, meeting scheduling, and eventual online billing. The first implementation should minimize recurring cost, prefer genuinely free services where sensible, remain portable to Azure, and preserve a clear Microsoft-platform path. The design must support a global launch using strict, broadly applicable privacy and security controls from the start.

`Jamula.net` is the canonical public website. `Jamula.com` will permanently redirect to the matching canonical `Jamula.net` URL, subject to final DNS/certificate validation.

This work will produce exactly two top-level delivery pull requests. Child workstream PRs are integration mechanics for PR 2 and do not replace or add top-level delivery PRs:

1. A portable, project-specific Squad bootstrap with the approved Star Trek roster.
2. A research-backed website decision package for review before any website implementation begins.

Both top-level PRs target `main`; this project does not use a `dev` branch.

`main` is the sole persistent integration, release, and CI/CD source branch. Short-lived issue/worktree branches and PR 2's temporary integration branch exist only to prepare reviewed changes for `main`; they are deleted after incorporation.

No production website code will be added during the evaluation phase. Narrow, disposable spikes are allowed for high-risk assumptions such as OAuth verification and token handling, Entra External ID behavior, and email deliverability. Retain sanitized reproducibility packages (procedure, versions, configuration schema, hashes, redacted measurements, and results), but delete credentials, test data, cloud resources, and unapproved production code.

## Approved Squad roster

| Member | Role | Scope |
|---|---|---|
| Jean-Luc Picard | Product & Architecture Lead | Business goals, scope, architecture decisions, cost tradeoffs, and final reviews |
| Jadzia Dax | Experience & Design Lead | Brand, information architecture, visual systems, sophisticated interaction design, accessibility, SEO, and design quality |
| Nyota Uhura | Content, Multimedia & Social Lead | Editorial strategy, website copy, case studies, image/audio/video workflows, social campaigns, channel adaptation, publishing cadence, and content analytics |
| Geordi La Forge | Full-Stack & Platform Engineer | Advanced web application engineering, CMS/turn-key platform evaluation, APIs, integrations, CI/CD, observability, and portable deployment |
| Seven of Nine | Identity, Data & AI Engineer | Authentication, customer portal, storage connectors, CRM data, privacy, and Phase 3 customer AI |
| Miles O'Brien | Quality & Reliability Engineer | Test strategy, security checks, performance, accessibility validation, and release readiness |
| Sarek | Legal, Regulatory & Corporate Advisor | Washington State and federal small-business requirements, privacy, contracts, IP/trademarks, website terms, and legal-review checklists |
| Scribe | Silent memory role | Decisions, memory, and session logs |
| Ralph | Monitor role | Work queue, backlog health, and keep-alive |
| Rai | Background safety role | Responsible AI, content safety, privacy, and credential awareness |
| Fact Checker | Verification role | Source verification, cost and limit validation, and Devil's Advocate review |

Cyrus retains final approval over role boundaries, backlog ownership, and all architectural decisions.

Star Trek names are internal Squad identities only. They must not appear in public website content, customer-facing product surfaces, marketing, or Jamula branding.

Sarek provides research, issue spotting, compliance checklists, and questions for professionals. Sarek is not a lawyer, CPA, or licensed professional and must not present output as legal or tax advice. Any launch-critical legal, tax, employment, privacy, contract, or regulatory conclusion must be marked for review by appropriately licensed counsel or an accountant.

## Jamula operating principles

Jamula's internal operating philosophy will be an original synthesis inspired by the intent of Amazon's official Leadership Principles and Microsoft's official mission, values, growth mindset, collaboration, inclusion, trust, accessibility, responsible AI, and sustainability commitments. It will not copy or present either company's principles as Jamula-owned language.

Proposed internal principles:

1. **Start with customer outcomes** - understand the real customer need, earn trust, and work backward from measurable value.
2. **Own the whole system** - take long-term responsibility across product, engineering, operations, security, privacy, support, and business impact.
3. **Learn, invent, and simplify** - stay curious, experiment responsibly, welcome outside ideas, and remove avoidable complexity.
4. **Decide with evidence and diverse perspectives** - combine judgment with facts, seek dissent and lived experience, and state uncertainty.
5. **Act with urgency and judgment** - move quickly on reversible decisions while applying deeper rigor to security, money, people, customer data, and irreversible choices.
6. **Raise quality and deliver** - define success, maintain high standards, close loops, and produce durable results rather than activity.
7. **Earn trust through respect, integrity, and accountability** - communicate honestly, protect confidentiality, admit mistakes, and own outcomes.
8. **Challenge respectfully, then commit together** - surface concerns directly, record decisions, and support the chosen path once the decision is made.
9. **Think boldly and stay resourceful** - pursue ambitious outcomes, use constraints creatively, and spend customer/company resources deliberately.
10. **Grow people, partners, and community** - share knowledge, create inclusive opportunities, develop others, and avoid success that depends on one person.
11. **Build responsibly for people and planet** - design for accessibility, privacy, security, responsible AI, social impact, energy/material efficiency, and long-term environmental stewardship.
12. **Scale responsibility with capability** - as Jamula's reach grows, increase transparency, safeguards, measurement, and accountability.

Application rules:

- Every major issue/ADR records customer outcome, owner, evidence, dissent/tradeoffs, privacy/security/accessibility impact, environmental/social impact, cost, and measurable result.
- Reversible decisions favor bounded action; high-risk decisions require deeper evidence and approval.
- Frugality never overrides safety, privacy, accessibility, fair treatment, commercial permission, or legal obligations.
- Environmental claims require measurable evidence, scope, date, and source. Avoid vague carbon-neutral, green, ethical, or socially responsible claims that could mislead.
- Maintain a public-claims register with claim text, status (`aspiration` or `achieved`), scope/baseline, metric, evidence source, owner, approval, review cadence, expiry date, and correction/removal action.
- Vendor/platform evaluation includes energy/resource efficiency, sustainability transparency, accessibility/inclusion, labor/social concerns where verifiable, data ethics, and exit impact without treating vendor marketing as proof.
- Architecture favors efficient delivery such as static generation where suitable, optimized media, caching, right-sized infrastructure, token/compute budgets, retention minimization, and deletion of unused resources.
- Rai reviews responsible-AI/social-impact risks; Sarek reviews claim/regulatory exposure; Fact Checker verifies evidence; Dax and Uhura ensure public language is understandable and not performative.
- Create an internal operating-principles document and a shorter public values draft. Both remain explicitly provisional in PR 1 and become authoritative only after a separate recorded wording approval from Cyrus.

## Agent and skill capability audit

The repository currently has a usable Squad coordinator and strong generic process skills, but it is not yet ready for this project:

- Present: coordinator/init/response/source-of-truth, collaboration, routing, error recovery, iterative retrieval, reviewer protocol, secret handling, session recovery, testing discipline, tiered memory, and git workflow skills.
- Present: built-in charters for Scribe, Ralph, Rai, and Fact Checker.
- Missing: the seven approved cast-agent charters and histories.
- Missing: project-specific guidance for product decisions, web/platform evaluation, UX/accessibility/SEO, identity/privacy/security, OAuth storage connectors, legal/compliance research, and vendor/cost fact checking.
- The sole `.github\agents\squad.agent.md` coordinator is appropriate; cast members should be defined through Squad team/charter state rather than duplicating seven separate coordinator agents.

PR 1 will add concise project-local skills, referenced by the relevant charters:

| Skill | Primary users | Scope |
|---|---|---|
| `jamula-product-context` | Picard, all agents | Business goals, phase boundaries, audience, cost posture, Microsoft preference, multi-cloud portability, and approval gates |
| `architecture-options-and-adrs` | Picard, Geordi, Seven | Comparable evaluation method, reversible ADRs, source quality, portability, and decision triggers |
| `web-experience-accessibility-seo` | Dax, Miles | Content architecture, design/brand constraints, WCAG 2.2 AA, SEO, structured data, Core Web Vitals, and performance budgets |
| `content-multimedia-social-publishing` | Uhura, Dax, Sarek, Rai | Editorial planning, channel-specific copy, image/audio/video production, captions/transcripts/alt text, content rights, approvals, social publishing, reuse, moderation, and analytics |
| `cms-and-turnkey-platform-evaluation` | Geordi, Picard, Dax, Uhura | Wix Studio, WordPress.com, managed/self-hosted WordPress, Webflow/Squarespace comparators, extensibility, portal/integration fit, total ownership cost, security/maintenance, migration, and lock-in |
| `secure-customer-portal` | Seven, Miles | Identity, RBAC, tenant isolation, sessions, audit, secrets, OWASP ASVS, incident response, and file-handling controls |
| `privacy-data-governance` | Seven, Sarek, Rai | Global data inventory, lawful basis/consent, retention, DSAR, processors, cross-border transfers, telemetry redaction, and legal-review boundaries |
| `oauth-storage-connectors` | Seven, Geordi, Miles | OneDrive/Google Drive/Box scopes, verification, token custody, rotation/revocation, tenant isolation, spikes, and provider-independent abstractions |
| `cloud-hosting-and-cost-evaluation` | Geordi, Picard, Fact Checker | Free-tier/commercial-use analysis, Azure portability, DNS/email, CI/CD, observability, overages, budgets, and kill switches |
| `legal-compliance-research` | Sarek, Fact Checker | Official-source Washington/federal issue spotting, effective dates, applicability assumptions, legal/CPA escalation, licensing, contracts, and no-legal-advice guardrails |
| `source-and-claim-verification` | Fact Checker, all agents | Official-source hierarchy, dated pricing/limit checks, contradiction handling, uncertainty labels, and citation quality |
| `payments-and-billing-evaluation` | Seven, Geordi, Miles, Sarek, Picard | Hosted checkout, invoices, deposits, recurring retainers/subscriptions, processor comparison, PCI scope reduction, webhooks, disputes/refunds, tax/accounting boundaries, and Phase 4 migration seams |
| `jamula-operating-principles` | All agents | Customer outcomes, ownership, learning, evidence, responsible speed, quality, trust, respectful dissent, resourcefulness, people development, social responsibility, environmental stewardship, and measurable accountability |

External skills are optional accelerators, not trust authorities:

- Add Microsoft's official `Cloud Solution Architect` skill from `microsoft/skills` after reviewing and pinning commit `6a2bf7b76bb2f3a24ebe18c95d6fce9ca6417326`. Copy the complete skill directory, including its `references\` content, preserve Microsoft's MIT license/copyright notice, and record source/revision in the third-party notice and `docs\README.md`.
- Agent Finder returned Microsoft's `Microsoft Foundry` skill as a possible Phase 3 customer-AI accelerator; document it as a future candidate but do not install it during PR 1.
- Agent Finder returned third-party legal plugins, but relevance scores are not trust or safety ratings. They must not be installed or relied on without provenance, license, security, maintenance, and legal-scope review.
- No external skill may override project policy, official-source verification, Sarek's no-legal-advice boundary, or licensed-counsel review.
- Prefer audited project-local skills when an external resource is broad, unmaintained, legally ambiguous, or unnecessary.

## Documentation location and structure

The session artifact `plan.md` remains the planning-mode source of truth until approval. Once execution begins, copy the approved plan into the repository and maintain project documents under `docs\`.

Planned structure:

| Path | Purpose |
|---|---|
| `docs\README.md` | Document index, status, owners, and approval state |
| `docs\artifacts-manifest.md` | Exact artifact path, author, reviewers, approver, dependencies, issue/PR, status, and index entry |
| `docs\company\operating-principles.md` | Provisional internal Jamula operating principles pending recorded wording approval |
| `docs\company\public-values-draft.md` | Concise public values and evidence-backed environmental/ethical commitments pending approval |
| `docs\planning\evaluation-plan.md` | Approved execution plan and change history |
| `docs\requirements\business-requirements.md` | Product scope, journeys, non-goals, and success measures |
| `docs\research\options-matrix.md` | Current vendor/platform comparison |
| `docs\research\source-register.md` | Dated official citations and verification status |
| `docs\architecture\overview.md` | Context, containers, data flows, and trust boundaries |
| `docs\architecture\adr\` | Architecture decision records |
| `docs\security\` | Threat model, controls, incident response, RPO/RTO, and test strategy |
| `docs\privacy\` | Data inventory, processing map, retention, DSAR, consent, and subprocessors |
| `docs\legal\` | Washington/federal checklists, legal-page drafts, license scope, and review log |
| `docs\legal\license-inventory.md` | Path-level Apache, MIT/vendor, reserved-content, trademark, provenance, and prior-rights map |
| `docs\legal\jurisdiction-matrix.md` | Global applicability, regulator/representative/DPO/DPIA questions, launch conditions, and counsel disposition |
| `docs\legal\professional-review-register.md` | Reviewer qualification, jurisdiction, scope, conditions, expiry, and re-review triggers |
| `docs\cost\cost-model.md` | Free, lean, Azure-aligned, and growth scenarios |
| `docs\spikes\` | Disposable-spike plans, evidence, and conclusions only |
| `docs\payments\` | Phase 4 billing requirements, provider comparison, PCI scope, legal/tax questions, and future ADRs |
| `docs\content\founder-profile-draft.md` | Public-facts-only founder draft pending approval |
| `docs\content\founder-source-register.md` | User-approved facts, public URLs, matching criteria, excluded facts, verification date, and approval |
| `docs\content\public-claims-register.md` | Environmental, ethical, social, accessibility, and other public claims with evidence/expiry |
| `docs\planning\work-ownership.md` | Issue dependency DAG, RACI, exclusive path ownership, and merge order |
| `docs\decisions\approvals.md` | SHA/artifact-version-bound approvals, conditions, outcomes, rejections, and rework |
| `docs\roadmap\` | Phased roadmap, dependency map, and Squad-ready backlog |

Repository/platform-required files may remain outside `docs\` when their standard location is operationally required, including `LICENSE`, `NOTICE`, `THIRD_PARTY_NOTICES`, `.github\`, `.squad\`, and machine-readable security/configuration files. Their rationale and ownership will be indexed from `docs\README.md`.

## Execution and collaboration protocol

### Start clean

- Before editing repository files, capture the branch, HEAD, upstream, `git status`, tracked diff, tracked/untracked/ignored-file inventories, and content hashes for all in-scope work; create a named stash that includes tracked and untracked bootstrap files; record the stash SHA; fetch the remote; and synchronize the verified dedicated branch with `origin/main`.
- If the branch is shared or already has an open PR, do not rewrite it; create a fresh branch from `origin/main` and restore the named stash there.
- Restore with `stash apply`, verify tracked/untracked paths and content hashes, and stop for explicit resolution if synchronization or stash application conflicts. Drop the exact recorded stash only after verification, commit, push, and confirmation that every original path is durable. Do not overwrite or drop existing work.
- Record the resulting base commit in the first tracking issue and PR.

### GitHub issues are the work ledger

- Create a GitHub issue before beginning each independently owned unit of work, including the Squad bootstrap.
- Use one parent evaluation issue plus linked child issues for research workstreams, spikes, integration, fact checking, and final decision synthesis.
- Every issue must contain scope, non-goals, owner, expected artifact paths, acceptance criteria, dependencies, privacy/security considerations, and the closing PR.
- PR 1 may use `Closes #...` because it targets the default branch.
- Child PRs target PR 2's non-default integration branch, so use `Refs #...`. After a child PR is incorporated, comment on the issue with the merge/commit link and close it explicitly; do not rely on GitHub closing keywords.
- PR 2 targets `main` and may use `Closes #...` for the parent evaluation issue after all acceptance gates are satisfied.
- Present proposed issue ownership to Cyrus before creating or assigning the workstream issues.
- Keep the session SQL todos as local execution support only; GitHub issues are the durable cross-session source of truth.

### Parallel worktree sessions

- Use isolated worktree-backed project sessions for independent Squad issues whenever the work can proceed safely in parallel.
- Start each sub-agent from the current integration base, never from another agent's unmerged work unless the dependency is explicit.
- Snapshot the coordinator's actual model, reasoning effort, context tier, mode, and agent setting immediately before spawning worktree sessions, and pass those settings explicitly where the session API supports them. The current expected model is `gpt-5.6-sol`, but the execution-time snapshot is authoritative.
- Do not substitute a different model or supported parameter silently. Any required deviation must be presented to and approved by Cyrus before the affected session starts.
- Give each agent a complete prompt with its issue, TEAM ROOT, output ownership, dependency inputs, privacy/security constraints, and decision-recording path.
- Before spawning, approve `docs\planning\work-ownership.md` with the issue dependency DAG, exclusive author path ownership, reviewers/verifiers/approver, merge order, and RACI. Agents may review shared concerns but only the named author edits an artifact.
- Shared decisions go through `.squad\decisions\inbox\` and are consolidated by Scribe. Promote accepted decisions into indexed ADRs or another canonical `docs\` artifact.
- Run independent workstreams in parallel, but keep architecture synthesis and final recommendations behind their declared dependencies.

### PR readiness, approvals, integration, and cleanup

- After PR 1 merges, fetch updated `origin/main`.
- Create the named evaluation integration branch `squad/{parent-issue}-website-platform-evaluation` from updated `origin/main` and verify the PR 1 merge SHA is an ancestor before spawning children.
- Start child issue branches/worktree sessions from that integration branch and target child PRs back to it.
- Use Agent Merge for readiness of any eligible child or top-level PR when available, including review comments, required checks, and conflicts.
- Agent Merge may prepare a PR but must never merge it directly; the app or authorized human performs the merge.
- Agent Merge follows only its run's authorized actions, treats required checks as gates, does not poll or remediate optional checks unless explicitly requested, and cannot bypass recorded approvals.
- PR 2 is the second top-level delivery from `squad/{parent-issue}-website-platform-evaluation` to `main`.
- Keep each top-level PR in draft state and disable merge automation until Cyrus records approval for the exact reviewed head SHA in `docs\decisions\approvals.md`. Any new commit invalidates that approval and requires re-review/re-approval.
- After SHA-bound approval, repository automation may merge when required reviews/checks and branch protections are satisfied.
- After a child PR is merged and its result is incorporated, archive the corresponding project session so its worktree is removed. Remove merged remote branches when safe.
- Archive abandoned or superseded sub-agent sessions only after recording status, HEAD, pushed/unpushed commits, branch retention/incorporation, artifact disposition, teardown, and explicit approval for any discarded work. End each work phase with no stale worktrees or active sessions.

### Main-only CI/CD

- Pull requests run required validation and may create ephemeral preview environments, but never deploy production.
- A merge to protected `main` is the only source event for production CI/CD. There is no persistent `dev`, staging branch, or branch-based promotion chain.
- Use protected GitHub environments, least-privilege OIDC, path filters, and explicit deployment gates so documentation/Squad-only changes do not invoke website deployment before an application exists.
- Keep environment-specific configuration and secrets outside source control; deploy the same immutable build artifact through required checks rather than rebuilding from a different branch.
- Record deployment SHA, artifact digest, configuration version, migrations, health checks, and rollback target for every production release.
- Require post-deploy smoke/health checks and automatic or operator-approved rollback to the last known-good `main` artifact when release criteria fail.
- Use tags/releases for durable production history where useful, but tags do not replace `main` as the deployment source.

## PR 1: Initialize the Star Trek Squad

### Changes

- Create a GitHub tracking issue for the Squad bootstrap before modifying the generated files.
- Complete the currently generated but empty Squad roster and routing configuration.
- Replace placeholder project context with Jamula, Inc., Jamula.com/Jamula.net, the website mission, and Cyrus Jamula as project owner.
- Add project-specific charters and initial histories for the seven cast agents.
- Add and wire the project-local skills from the capability audit, keeping each skill focused and avoiding duplicated instructions across charters.
- Add the approved Jamula operating-principles skill, internal principles document, and public-values draft workflow.
- Add the reviewed, commit-pinned Microsoft `Cloud Solution Architect` skill and all referenced files with intact MIT attribution.
- Initialize casting registry/history for the approved persistent Star Trek names.
- Keep the four built-in roles intact: Scribe, Ralph, Rai, and Fact Checker.
- Configure routing for product/architecture, experience/design, content/multimedia/social, full-stack/platform, identity/data/AI, quality/reliability, and legal/regulatory/corporate work.
- Preserve append-only merge rules and the applicable Squad GitHub workflows.
- Harden workflow supply-chain behavior: least-privilege permissions, immutable action pins, no long-lived cloud credentials, and explicit review of write-capable automation.
- Preserve the upstream MIT license and copyright notice for generated Squad CLI/template material rather than implicitly relicensing those files under Jamula's Apache-2.0 license. Record the installed package version and source in a standard third-party notice.
- Review generated files before staging:
  - exclude machine-local paths and settings;
  - exclude example-only MCP configuration that is not required;
  - retain only portable configuration needed by contributors and automation;
  - scan staged content for secrets, credentials, email addresses, and local-only identifiers.
- Correct the project name currently inherited from the generated worktree name.
- Add `docs\README.md` and the approved plan at `docs\planning\evaluation-plan.md` without adding evaluation conclusions to PR 1.
- Before adding mixed content, add root `LICENSE_SCOPE.md`, `TRADEMARKS.md`, `CONTRIBUTING.md`, and `THIRD_PARTY_NOTICES.md`; add `docs\legal\license-inventory.md` with path-level licensing/provenance and reserved-content markers.
- Record each redistributed third-party source path, upstream repository, exact revision/version, license/copyright text, local modifications, and destination path; validate required notices in CI.
- Add a Star Trek non-affiliation/trademark statement, avoid logos/quotes/likenesses/public marketing use, and require Sarek plus qualified counsel review before merge.
- Use canonical Squad paths: `.squad\team.md`, `.squad\routing.md`, `.squad\ceremonies.md`, `.squad\casting\`, and `.squad\agents\{name}\charter.md`. Initialize history through the configured two-layer state backend rather than committing ignored `.squad\agents\*\history.md` files to `main`.
- Store project-local skills at `.github\skills\{skill}\SKILL.md`; store the pinned Microsoft skill at `.github\skills\cloud-solution-architect\` with all references; use `THIRD_PARTY_NOTICES.md` as the canonical attribution file.

### Delivery and branch model

- Fetch `origin` and safely synchronize the verified dedicated PR 1 branch with `origin/main` before making edits.
- Reuse the current branch only if every existing commit is verified in scope, it has no unrelated upstream/open PR, and its base is updated safely. Otherwise create a fresh dedicated branch from `origin/main` and restore only the verified bootstrap work.
- Commit the sanitized Squad bootstrap on the verified dedicated branch.
- Open PR 1 against `main`.
- Pause for Cyrus to review and merge PR 1.
- After merge, start the evaluation integration branch from updated `main`.

### PR 1 acceptance criteria

- The complete eleven-member roster is present under the exact `## Members` heading required by Squad workflows.
- Routing names and labels match the approved roster.
- Every cast agent has a project-specific charter and initial context.
- Every cast agent references the project-local skills required for its domain, and every planned evaluation workstream has an accountable agent with the necessary guidance.
- Installed external skills, if any, have documented source, version/ref, license, trust review, and reason for inclusion.
- The Microsoft Cloud Solution Architect skill resolves every relative reference locally and is pinned to the reviewed upstream commit rather than a floating branch.
- Every cast charter references the Jamula operating principles, and issue/ADR templates capture the required customer, trust, environmental/social, cost, dissent, owner, and outcome fields.
- No committed file contains an absolute user-machine path, live credential, or private workplace detail.
- Workflow YAML is syntactically valid and references files that exist.
- Workflows use minimal permissions, pinned actions, and no new long-lived cloud secret.
- Repository workflows enforce the main-only model: PR validation/previews, production deployment only from protected `main`, and path filters preventing documentation-only deployment.
- Upstream Squad material has complete MIT attribution and remains clearly distinguishable from Jamula-authored Apache-2.0 code.
- The bootstrap issue is linked and closed by the PR.
- `docs\README.md` indexes the approved plan and explains where future project documents belong.
- The PR contains only Squad bootstrap/governance changes plus the approved plan, documentation index, and operating-principles drafts.
- The path-level license inventory, Apache scope, reserved-content markers, contribution policy, complete third-party notices, trademark/non-affiliation notice, and professional-review disposition are present before mixed content is merged.
- Operating-principles documents and charter references are clearly marked provisional until a separate exact-version approval is recorded.

## PR 2: Website decision package

### 1. Business and product requirements

Create a source-of-truth requirements document covering:

- Jamula positioning: technology consulting, custom software, AI-native delivery, Microsoft preference, and multi-cloud capability.
- Target audiences, core customer journeys, calls to action, trust signals, and success measures.
- A content operating model covering editorial themes, service narratives, case studies, thought leadership, project showcases, content calendar, review/approval roles, publishing cadence, reuse across channels, and analytics feedback.
- Multimedia requirements covering photography/illustration, diagrams, demos, audio/video, captions, transcripts, alt text, thumbnails, responsive delivery, compression, metadata, rights/releases, retention, and source-asset ownership.
- Sophisticated-experience requirements covering responsive design systems, rich but accessible interactions, reduced-motion behavior, progressive enhancement, structured content, previews, reusable page composition, interactive demonstrations, and performance budgets.
- Phase 1:
  - public marketing and service pages;
  - contact form with anti-spam and reliable delivery;
  - LinkedIn, Medium, WhatsApp, GitHub, and other practical social integrations;
  - analytics, consent, privacy, accessibility, SEO, monitoring, and operational ownership.
- Phase 2:
  - basic CRM and lead/pipeline tracking;
  - customer inquiry/history workflows and internal ownership/follow-up;
  - Microsoft 365/Teams/Zoom-compatible public meeting scheduling.
- Phase 3:
  - secure customer authentication and authorization;
  - authenticated customer portal;
  - OneDrive, Google Drive, and Box customer storage integrations;
  - customer-only grounded AI chat over authorized Jamula and customer content.
- Phase 4:
  - consulting invoice payment;
  - project deposits and milestone payments;
  - recurring retainers/subscriptions;
  - customer receipts, payment history, failed-payment handling, cancellation, refunds, disputes, and accounting/reconciliation integration.
- Phase 5 candidate:
  - public AI chat only after customer-only AI has demonstrated safe, useful, and cost-controlled operation.
- Explicit non-goals and deferred capabilities to prevent premature platform complexity.
- Public-values content describing customer responsibility, ethics, accessibility/inclusion, social awareness, and environmental stewardship, with every factual claim tied to evidence and an approval owner.

### 2. Privacy and data-lifecycle design

Design for a global launch using strict, broadly applicable controls, with legal text marked for professional review:

- Inventory and classify personal, customer, authentication, CRM, file, analytics, support, and AI-related data.
- Produce a data-flow and processing map that identifies controller/processor roles, subprocessors, regions, cross-border transfers, storage locations, and trust boundaries.
- Record the purpose and lawful basis or consent source for every personal-data flow.
- Define collection minimization, retention periods, deletion propagation, account closure, data export, correction, and data-subject request procedures.
- Define DSAR identity verification, authorized-agent handling, jurisdiction-specific response clocks, exceptions/appeals, secure export, processor handoffs, evidence logs, deletion SLAs, and backup-expiry disclosure.
- Define cookie/consent behavior by category, including a privacy-preserving analytics option and a no-nonessential-cookie baseline where practical.
- Record legitimate-interest assessments where used, consent-receipt versions, withdrawal propagation, suppression records, and purpose-change review.
- Define telemetry and log redaction rules so tokens, file contents, prompts, contact details, and customer identifiers are not exposed.
- Create a subprocessor/DPA checklist and a public privacy-notice outline.
- Add processor due diligence, breach-notification SLAs, subprocessor-change alerts, annual reassessment, deletion evidence, and tested export/exit procedures.
- For cross-border transfers, record adequacy status, SCCs, UK IDTA/Addendum needs, transfer-impact assessments, supplementary safeguards, onward transfers, localization commitments, and reassessment cadence.
- Create a global jurisdiction applicability matrix covering targeted/served regions, regulator contacts, representative and DPO assessments, records of processing, DPIA screening/triggers, transfer mechanisms, launch conditions, and counsel disposition.
- Cover sale/share, targeted advertising, profiling, sensitive-data limitation, nondiscrimination, Global Privacy Control and other universal opt-out signals, appeals, suppression propagation, request metrics, and vendor contract controls.
- Define legal-hold initiation, scoped access, immutable evidence, periodic review, release approval, notification, deletion suspension, processor coordination, and deletion resumption.
- State that Jamula does not knowingly target or collect data from minors; include an age-handling decision even if the final answer is not applicable.
- Draft baseline privacy, terms, acceptable-use, cookie, and AI disclosures from reputable templates and mark every legal artifact for review before launch.

### 3. Security architecture and threat model

- Produce data-flow and trust-boundary diagrams for the Phase 1 public/contact surface, Phase 2 CRM/scheduling, Phase 3 identity/portal/connectors/customer AI, Phase 4 payments, and optional Phase 5 public AI.
- Threat-model the system using a recognized method such as STRIDE and map mitigations to OWASP Top 10 and an appropriate OWASP ASVS Level 2 baseline for the authenticated portal.
- Define authentication, MFA options, authorization, RBAC, per-customer tenant isolation, privileged administration, session handling, offboarding, and break-glass access.
- Mandate phishing-resistant MFA for privileged users and step-up authentication for exports, payment/connector changes, and other sensitive actions. Cover invitation, membership changes, tenant switching, domain claims, recovery, identity collision/linking, and confused-deputy tests.
- Require immutable tenant context, deny-by-default authorization, tenant-enforced database/storage access such as row-level security where applicable, tenant-scoped encryption/caches/indexes, cross-tenant IDOR tests, and controlled/audited support impersonation.
- Define secrets management, encryption in transit and at rest, key/token rotation, audit logging, vulnerability management, dependency/SBOM policy, and software supply-chain controls.
- Define CSP and security headers, CSRF/XSS protections, input validation, malware/file scanning, upload limits, rate limits, abuse controls, and bot defenses.
- Define backup/restore with proposed RPO/RTO, incident response and breach-notification flow, audit retention, and a vulnerability-disclosure/`security.txt` decision.
- Require encrypted immutable backups with separate credentials, tenant-level restoration, restore drills, integrity evidence, and documented interaction with deletion obligations.
- Define incident severities, roles/alternates, evidence preservation, insurer/counsel escalation, jurisdictional notification clocks, processor escalation SLAs, tabletop cadence, and corrective-action tracking.
- Make audit logs tenant-correlated, UTC-synchronized, access-restricted, tamper-evident, exportable, and complete for authentication, authorization, administration, CRM, connector, file, consent, and AI events.
- Require least-privilege CI permissions, immutable action references, protected environments, OIDC where cloud authentication is needed, secret scanning, and dependency automation.
- Add lockfile enforcement, dependency review, private-package namespace protection, isolated builds, signed artifacts/provenance, release records, and emergency credential-revocation procedures.
- Threat-model credential stuffing, enumeration, IDOR, SSRF, connector abuse, bulk export/exfiltration, malicious files, contact-form exhaustion, webhook spoofing, dependency confusion, and denial-of-wallet.
- Pin applicable OWASP ASVS, Web Top 10, API Security Top 10, and OAuth security BCP versions; map controls to future tests and require recorded risk acceptance for unmet controls.
- Define detection use cases, alert owners, after-hours coverage, triage/escalation SLOs, communication templates, and exercises for identity abuse, cross-tenant access, token misuse, bulk export, webhook abuse, CI compromise, and denial-of-wallet.
- Require accessibility due diligence and an equivalent supported fallback for third-party authentication, consent, scheduling, payment, and storage-picker flows; unresolved critical barriers block the relevant phase.

### 4. Storage connector security and spike evidence

OneDrive, Google Drive, and Box are required Phase 3 capabilities, so each provider must receive a documented spike and security decision covering:

- OAuth application registration and verification requirements, commercial terms, expected approval lead time, and recurring cost.
- Minimum scopes and whether a picker/delegated flow can avoid broad or persistent drive access.
- Consent UX, Authorization Code with PKCE, state/nonce validation, exact redirect allowlists, login-CSRF/account-linking protections, encrypted server-side token custody with separated key management, refresh-token rotation, revocation, expiry, re-consent, validated webhooks, and customer offboarding.
- Strict customer and tenant isolation, provider-account linking rules, audit events, and prevention of cross-customer file disclosure.
- File-type/size limits, malware scanning responsibility, caching rules, metadata retention, deletion propagation, and data residency.
- Define permission/revocation reconciliation, webhook and periodic full-rescan behavior, maximum staleness, fail-closed access, derivative invalidation across previews/embeddings/indexes/backups, and deletion propagation SLAs.
- Failure behavior and a provider-independent interface so one connector can be disabled without breaking the portal.
- A stop-and-escalate gate if a provider cannot meet security, verification, or startup-cost constraints; a required connector must never be silently weakened to pass evaluation.
- Phase 3 preview/partial release may include the subset of OneDrive, Google Drive, and Box connectors that pass every hard gate. Phase 3 general availability requires all three connectors to pass. Any unavailable provider must be clearly disclosed in preview, retain a GitHub remediation issue with owner/blocker/evidence, and be added only after it passes the same gates.
- Before each spike, approve prerequisite issues for provider/test accounts, tenants, app registrations, consent authority, credential custody, terms acceptance, spending limits, verification/approval dependencies, and teardown ownership.

### 5. Options and architecture matrix

Evaluate current capabilities, limits, scalability, hidden costs, lock-in, and migration paths across:

- Web frameworks and rendering models: Astro, Next.js, SvelteKit, Nuxt, Blazor, and appropriate simpler alternatives.
- Hosting and edge platforms: Azure Static Web Apps, Azure App Service/Container Apps, Cloudflare Pages/Workers, Netlify, Vercel, and GitHub Pages where applicable.
- Turn-key and CMS platforms: Wix Studio, WordPress.com, managed WordPress, self-hosted WordPress, Webflow, Squarespace, and credible Microsoft-aligned low-code options where applicable.
- Content management: Git-based content, headless CMS, turn-key visual builders, traditional WordPress, media-library/DAM needs, editorial workflows, previews, approvals, scheduling, localization readiness, and the operational cost of each.
- Authentication: Microsoft Entra External ID, Static Web Apps authentication, Auth0, Clerk, Supabase, Firebase, and other credible low-cost choices.
- Contact processing, email delivery, spam protection, and notification reliability.
- CRM/lead tracking: HubSpot, Zoho, Microsoft options, low-code tables, open-source CRM, and a minimal custom data store.
- Customer files: OneDrive/SharePoint, Google Drive, Box, Dropbox, and Jamula-managed Azure Blob Storage.
- Social/project integrations: LinkedIn, Medium RSS, WhatsApp click-to-chat, GitHub REST/GraphQL, and practical embed/API restrictions.
- DNS, certificates, domain routing, and email options for Namecheap-managed domains.
- Analytics, consent, monitoring, logging, backups, and CI/CD.
- Main-only trunk-based CI/CD with PR validation, ephemeral previews, protected production environments, immutable artifacts, deployment evidence, and rollback.
- Environmental and social responsibility: delivery efficiency, media/compute/token budgets, vendor sustainability transparency, accessibility/inclusion, responsible-AI/data-use posture, measurable claims, and greenwashing risk.
- Phase 2 CRM and M365/Teams/Zoom scheduling alternatives.
- Phase 3 authenticated portal, connector, and customer-only AI/RAG alternatives.
- Phase 4 payment processors and billing platforms, including Stripe, Square, PayPal/Braintree, turn-key platform payment capabilities, and credible accounting/invoicing integrations.
- Repository/content licensing, third-party dependency notices, and rights restrictions for embedded or syndicated social content.

Use official vendor documentation as the primary source. Record the verification date, exact free-tier limits, first paid tier, overage behavior, commercial-use restrictions, OAuth verification burdens, and recent product/deprecation changes. Clearly mark anything that cannot be independently verified.

Do not assume a custom-coded site is superior. Apply the same hard gates and scorecard to custom frameworks, Wix Studio, WordPress, and other finalists. Explicitly compare:

- custom domains and commercial-use limits on free/entry tiers;
- visual quality, responsive control, accessibility, SEO, Core Web Vitals, structured data, and media workflows;
- contact/CRM/social/GitHub capabilities;
- Phase 2 CRM/scheduling and Phase 3 authenticated portal/OneDrive/Google Drive/Box/customer-AI feasibility;
- plugin/app ecosystem quality, update burden, supply-chain risk, backup/restore, and incident response;
- invoices, deposits, subscriptions, hosted checkout, payment-provider ecosystem, and the feasibility of adding Phase 4 without replatforming;
- developer extensibility, APIs/webhooks, testability, CI/CD, environments, version control, and rollback;
- total cost of ownership, support dependence, export fidelity, portability, migration effort, and vendor lock-in.

Use a staged evaluation funnel:

1. Discovery: capture requirements and longlist.
2. Hard gates: remove options that fail commercial-use, security, privacy, or export requirements. Apply connector gates per provider; a platform remains qualified when it supports the approved Phase 3 launch subset and safely disables/defer failed connectors.
3. Shortlist: score qualified options using common workloads and criteria.
4. Spikes: test only mandatory connectors and finalist assumptions.
5. Synthesis: produce ADRs, confidence levels, unresolved risks, and recommendation.
6. Approval: Cyrus accepts, rejects, or requests another bounded evidence cycle.

Pre-register and approve hard gates, weights, scoring anchors, evidence-confidence penalties, minimum qualifying score, and maximum unresolved-risk ceiling before vendor scoring begins.

Use three explicit evidence classes:

- `documented research`: current official documentation and dated vendor evidence;
- `disposable mechanism spike`: a narrow, non-production proof of only the mechanism actually exercised;
- `future implementation test`: an executable requirement attached to a later implementation issue.

Do not describe research or spikes as proof of production behavior. For each connector, PR 2 accepts either executed mechanism-spike evidence or a standardized `blocked/deferred` packet when app verification, tenant access, licensing, or another external approval prevents hands-on evidence; record the blocker, attempted evidence, owner, user-facing plan, remediation issue, and Phase 3 preview/GA disposition.

### 6. Cost model

Provide comparable monthly and one-time estimates for:

- `$0 launch`: genuinely free services, including their operational and lock-in tradeoffs.
- `Lean startup`: the recommended production-worthy baseline.
- `Azure-aligned`: the closest practical Microsoft-first alternative.
- `Growth`: representative higher traffic, customer, storage, CRM, and AI usage.

Separate fixed, usage-based, optional, and hidden costs. Include trigger points for moving from a free service to a paid or Azure-hosted alternative. For every PAYG or metered service, document overage behavior, budget alerts, service quotas, a hard cap or automatic shutdown where available, and an operational kill switch. Explicitly note that Azure PAYG budget alerts are not a hard spending cap.

Define reference workloads for traffic, authenticated customers, CRM seats, contact messages, transactional email, storage, connector calls, egress, logs, AI tokens, support effort, and one-time verification/legal work. Show sensitivity ranges and the first threshold at which each free tier or architecture stops being viable.

Approve numeric workload bands before pricing research and report monthly, first-year, and three-year TCO ranges including labor, migration, renewal, verification, professional review, support, taxes, and expected overages.

Every kill switch must have an owner, trigger, automated/manual action, alert path, expected degraded behavior, recovery procedure, and tabletop or test evidence.

### 7. Recommendation and ADRs

Recommend a default stack using this tie-breaker:

1. Secure, privacy-respecting, commercially permitted, and credible for customer data.
2. Genuinely free at launch when it satisfies the first requirement.
3. Portable to Azure without a rewrite.
4. Operationally simple for a small team.
5. Scalable when usage justifies cost.

Document major decisions as ADRs, including:

- framework and rendering strategy;
- hosting, DNS, and deployment;
- content management;
- contact form and email;
- identity and authorization;
- CRM and lead ownership;
- OneDrive, Google Drive, and Box connector architecture;
- privacy, consent, retention, data-subject rights, and subprocessors;
- security architecture, threat model, incident response, backup/restore, and supply-chain controls;
- analytics and observability;
- cost guardrails and kill switches;
- repository code/content/trademark licensing;
- Phase 2 CRM and scheduling approach;
- Phase 3 identity, portal, connector, and customer-only AI architecture;
- Phase 4 payments, billing, reconciliation, and accounting boundaries;
- Phase 5 public-AI adoption gate.

Each ADR will include alternatives, rationale, consequences, reversibility, portability/exit steps, data-export implications, and the measurable trigger for reconsideration.

Use a decision scorecard with non-negotiable security/privacy/commercial gates, followed by weighted launch cost, portability, operational burden, scalability, and evidence-confidence scores. Define the maximum unresolved high-risk items allowed for a recommendation and report cost/migration estimates as ranges.

Define an Azure portability contract for finalists: portable runtime, data export formats, identity and storage seams, configuration, IaC, proprietary edge dependencies, migration/rollback steps, estimated effort, and a disposable representative artifact that proves only the exercised packaging/deployment mechanism can move without application redesign.

Define the representative workload, Azure target, permitted adapter changes, data volume, migration duration, rollback threshold, and prohibited redesign before running the portability spike.

Separate decisions for registrar, authoritative DNS, canonical domain/redirects, certificates, transactional email, and workforce mail. Include account recovery, hardware-backed registrar MFA, registrar/registry lock options, DNSSEC/CAA, DNS change audit, dangling-record monitoring, subdomain-takeover checks, SPF/DKIM/DMARC, and MTA-STS/TLS-RPT decisions.

### 8. Founder, legal, and trust content

- Use the supplied working profile only to tailor collaboration and understand leadership strengths.
- Draft public founder content from user-provided public facts plus clearly matching public LinkedIn and GitHub information.
- Maintain `docs\content\founder-source-register.md` with user-supplied facts, approved public URLs, identity-matching criteria, excluded facts, verification dates, and Cyrus's exact-content approval.
- Do not publish internal Microsoft project details, inferred performance claims, personal contact data, or unsupported statements.
- Mark the founder draft as requiring Cyrus's explicit approval before it is used on the website.
- Avoid language that implies Microsoft endorsement or reveals internal systems, projects, customers, or performance information.
- Draft legal-page outlines from reputable templates, clearly label them as not legal advice, and require legal review before launch.
- Require rights/provenance records for photographs, illustrations, music, fonts, video, testimonials, customer logos, case studies, screenshots, syndicated social content, and AI-assisted media.
- Require captions/transcripts, alt text, accessible players, consent/model releases where applicable, platform disclosure rules, moderation/escalation, and a correction/takedown process.
- Maintain `docs\content\public-claims-register.md`; Uhura authors, Fact Checker verifies evidence, Sarek reviews regulatory exposure, Rai reviews social/RAI impact, and Cyrus approves publication.

### Phase 4 payment guardrails

- Keep payment processing out of Phases 1-3 implementation, but require finalists to demonstrate a viable Phase 4 integration path.
- Prefer provider-hosted checkout, invoices, and customer portals so Jamula does not store, process, or log raw card data and can target the smallest practical PCI DSS scope.
- Evaluate cards, ACH/bank debit where appropriate, digital wallets, invoice links, deposits, recurring billing, proration, failed-payment recovery, receipts, refunds, disputes/chargebacks, cancellation, and customer self-service.
- Require signed and replay-resistant webhooks, idempotency, reconciliation, immutable financial audit events, least-privilege keys, environment separation, key rotation, fraud controls, rate limits, and tested failure behavior.
- Keep payment identity and authorization tenant-aware; do not expose one customer's invoices, subscriptions, or receipts to another customer.
- Define system-of-record boundaries among the payment processor, CRM, accounting system, bank, and Jamula portal. Avoid making the website the financial ledger.
- Document processor fees, fixed/percentage charges, international/FX costs, ACH fees, dispute/refund fees, payout delays, reserve/hold risk, tax tooling, and subscription-revenue costs in the growth model.
- Route sales-tax, business-and-occupation tax, revenue recognition, invoicing, automatic-renewal, refund/cancellation, sanctions/KYC, and accounting-treatment questions to Sarek for issue spotting and then to licensed counsel/CPA as applicable.
- Add clickwrap/contract-assent evidence, pricing/renewal disclosures, channel-specific payment/communication rules, tax registration/nexus questions, and phase-specific cyber/E&O/payment insurance review.
- Treat the Stripe MCP result from Agent Finder only as a future operational integration candidate. Do not install or connect it until Stripe is selected, provenance/permissions are reviewed, test mode is enforced, and the user explicitly approves connection.

Sarek will maintain a dated issue-spotting checklist covering at least:

- Washington entity registration and annual-report status, Department of Revenue/business licensing, registered-agent obligations, and applicable City of Kirkland/King County licensing or home-business requirements.
- Federal entity/EIN and reporting obligations, with current FinCEN/Corporate Transparency Act status verified rather than assumed.
- Federal and Washington tax questions routed to a CPA, including sales/business taxes and treatment of consulting/software services.
- FTC advertising, testimonial, endorsement, AI-claim, and unfair/deceptive-practices requirements.
- CAN-SPAM, TCPA, WhatsApp/SMS consent, call-to-action, opt-out, and recordkeeping requirements where the site uses messaging.
- ADA/accessibility exposure, with WCAG 2.2 AA as the engineering baseline.
- Privacy, breach notification, consumer protection, data-processing agreements, subprocessors, cross-border transfers, and any applicable Washington-specific data law.
- Customer contracting needs: website terms, privacy notice, acceptable-use policy, MSA/SOW, DPA, confidentiality, IP ownership, warranties, limitations of liability, and dispute/venue questions.
- Jamula name/trademark clearance and protection, open-source obligations, contributor terms, social-content rights, case-study/customer permissions, and separation of Apache-licensed code from reserved content/assets.
- Cyber, professional/E&O, and general business-insurance questions for a broker.
- Contractor/employee classification and workplace obligations only when Jamula begins hiring or engaging contractors.
- Social/channel terms, endorsements/disclosures, intellectual-property and privacy rules, moderation, accessibility, records, and account-control requirements.
- Open-source contribution terms, third-party contribution acceptance, contributor representations, and trademark clearance.
- Phase-specific insurance questions for public launch, CRM/scheduling, portal/connectors/AI, and payments.

Every checklist item will contain the current official source, effective/verification date, applicability assumptions, owner, required evidence, and a disposition of `applicable`, `not applicable`, `needs counsel`, `needs CPA`, or `needs user decision`.

Every required professional review is recorded in `docs\legal\professional-review-register.md` with reviewer identity/qualification, jurisdiction, scope, artifact version, conditions, expiry, re-review triggers, and disposition. An AI/Squad review never satisfies a licensed-professional gate.

### 9. Repository license and intellectual-property policy

- Record that the repository is public and currently uses Apache License 2.0.
- Keep Apache-2.0 for Jamula-authored reusable source code. Apache-2.0 Section 6 already withholds trademark rights, but it does not by itself define which mixed repository content is outside the licensed work.
- Add an explicit scope notice so Jamula trademarks, logos, brand assets, photographs, copy, case studies, customer materials, and other site content are not unintentionally licensed under Apache-2.0.
- Add the appropriate repository notices, directory-level proprietary markers, and trademark guidance before brand/content assets are introduced.
- Create the initial path-level license inventory in PR 1 before mixed content is merged, then maintain it throughout PR 2. Map Jamula-authored Apache-2.0 paths, upstream MIT/vendor paths and complete notices, reserved-content paths, trademarks, provenance, modifications, and unknown items requiring review.
- Preserve rights already granted under prior commits; license-scope changes govern future contributions/content and must not claim to revoke permissions already granted.
- Preserve all third-party licenses and generate/maintain dependency and asset attribution where required. The currently generated Squad CLI/template material reports MIT licensing and therefore requires its upstream copyright/license notice even though the repository's Jamula-authored code is Apache-2.0.
- Treat the current Apache license as suitable for code but incomplete for a mixed code/content business website until the scope and trademark notices are added.
- Require legal review of the final license-scope wording; this plan is an engineering recommendation, not legal advice.
- Treat Star Trek names as referential internal theming only, include a non-affiliation/trademark notice, avoid logos/quotes/likenesses/public marketing use, and require documented counsel clearance before PR 1 merge.

### 10. Evaluation workstreams and proposed ownership

The following ownership is proposed and must be approved by Cyrus before issues are created:

| Owner | Evaluation issue |
|---|---|
| Jean-Luc Picard | Business requirements, decision criteria, cost-model integration, ADR synthesis, and final recommendation |
| Jadzia Dax | Brand system, information architecture, sophisticated UX/interaction design, accessibility, SEO, design quality, and visual acceptance criteria |
| Nyota Uhura | Editorial/content strategy, site copy, founder/case-study drafts, multimedia pipeline, social-channel plan, publishing governance, and content analytics |
| Geordi La Forge | Custom frameworks, Wix/WordPress/turn-key platforms, hosting, DNS/CDN/email, CI/CD, observability, performance, portability, and email-deliverability spike |
| Seven of Nine | Global privacy/data lifecycle, Phase 2 CRM data, Phase 3 identity/RBAC/customer portal/OneDrive/Google Drive/Box/customer-AI spikes, and Phase 4 payment data boundaries |
| Miles O'Brien | Independent threat model, security architecture, reliability/SLOs, supply-chain controls, and acceptance-test strategy |
| Sarek | Washington and federal legal/regulatory research, business compliance checklist, contracts/privacy/legal-page requirements, IP/trademark/license scope, and professional-review questions |
| Fact Checker | Cross-workstream citation, pricing, licensing, security-claim, and contradiction verification |
| Scribe | Decision consolidation and cross-agent context |
| Ralph | Issue/dependency monitoring and stalled-work detection |
| Rai | Privacy, responsible-AI, content-safety, and credential review |

### 11. Roadmap and Squad-ready backlog

- Produce a phased roadmap with dependencies, decision gates, and measurable exit criteria rather than date estimates.
- Produce `docs\roadmap\phase-gates.md` with prerequisites, minimum launch scope, measurable exit thresholds, preview/partial/GA states, permitted deferrals, disclosure requirements, approval authority, and blocked downstream work for every phase.
- Track evaluation and implementation work in GitHub issues so ownership, dependencies, decisions, and completion survive session cleanup.
- Draft implementation epics/issues as repository documents with acceptance criteria, security/accessibility requirements, and dependencies; do not create GitHub implementation issues during PR 2.
- Propose an owner from the approved Star Trek roster for every epic.
- Present the complete implementation ownership matrix to Cyrus for approval before creating implementation issues or assigning implementation work.
- Do not begin website implementation until Cyrus approves the recommendation and assignment matrix.

Disposable spikes use a standard record under `docs\spikes\` containing the hypothesis, issue/owner, fixed scope, test environment and synthetic data, pass/fail threshold, measurements, evidence, decision impact, cost, credential/resource teardown, token revocation, data deletion, and cleanup confirmation. Spike source code is not retained unless Cyrus separately approves promotion into an implementation issue.

Retain sanitized reproducibility records with procedure/commands, configuration schema, dependency versions, artifact hashes, environment description, redacted raw measurements, and known limitations.

### PR 2 acceptance criteria

- `docs\artifacts-manifest.md` lists every deliverable's exact path, author, reviewers, approver, dependencies, issue/PR, status, and `docs\README.md` entry.
- `docs\planning\work-ownership.md` defines the issue DAG, exclusive author ownership, reviewers/verifiers/approver, and merge order with no overlapping edit ownership.
- Every material factual or pricing claim has a dated official citation or is clearly labeled unverified.
- The matrix compares capability, cost, scalability, operational burden, security, portability, and vendor lock-in.
- The matrix gives custom-coded, Wix Studio, WordPress, and other credible turn-key paths a fair, evidence-based comparison.
- Phase 1 public site, Phase 2 CRM/scheduling, Phase 3 authenticated portal/connectors/customer AI, Phase 4 payments, and optional Phase 5 public AI boundaries are explicit.
- The recommendation includes at least one viable free launch path and one Azure-aligned path.
- Cost scenarios expose hidden verification, licensing, domain, email, and overage costs.
- Every data store and processor has a classification, purpose/lawful basis, region, retention period, export path, deletion path, and subprocessor/DPA status.
- Threat models cover all trust boundaries, with explicit RBAC, tenant-isolation, token-custody, audit, incident-response, and backup/restore decisions.
- Spike evidence demonstrates relevant finalist isolation mechanisms where testable. Future Phase 3 implementation issues must include executable cross-tenant authorization, storage, cache/index, connector, and AI retrieval tests proving that one customer cannot discover or access another customer's data.
- OneDrive, Google Drive, and Box each have executed spike evidence or a standardized blocked/deferred evidence packet plus a security/verification and preview/GA decision.
- Every deferred Phase 3 connector has approved disclosure copy and placement requirements, a future implementation criterion for displaying status, a tracked remediation issue, owner, blocking evidence, and no insecure/manual impersonation of the missing integration.
- Domain and email guidance covers registrar MFA/lock, DNSSEC, CAA, dedicated sending domains, SPF, DKIM, and a staged DMARC enforcement policy.
- Domain guidance includes Jamula.net/Jamula.com cutover tests, HTTPS/path/query behavior, search/analytics effects, account recovery, rollback criteria, and the approved pause-and-remediate fallback.
- Accessibility targets WCAG 2.2 AA. Performance targets include "good" Core Web Vitals at the 75th percentile and explicit page-weight/performance budgets.
- Evaluation artifacts define the manual keyboard, screen-reader, zoom/reflow, contrast, reduced-motion, form-error, authentication, customer-file-flow, and public-feedback tests required by future implementation issues; spikes provide evidence only for mechanisms they actually exercise.
- Phase 3 customer-only AI guidance covers provider data-use/retention terms, prompt-injection defenses, PII redaction, grounding/citations, per-session limits, rate limits, abuse controls, and a cost kill switch.
- Phase 3 customer-only AI uses tenant-scoped retrieval/index/cache boundaries, revalidates source ACLs at retrieval time, and includes cross-tenant leakage, poisoning, moderation, model-change regression, human-escalation, and per-tenant spend/concurrency tests.
- Initial customer AI is read-only: no autonomous file mutation, sharing, messaging, payment, connector administration, arbitrary network egress, or action tools. Every future action capability requires a separate issue, threat model, user approval, and allowlisted operation.
- Phase 4 guidance supports invoices, deposits, and recurring retainers/subscriptions through a hosted processor flow with minimized PCI scope, tenant isolation, reconciliation, legal/tax escalation, and no raw card-data handling by Jamula systems.
- The public-repository license policy clearly separates Apache-2.0 code from reserved Jamula trademarks, assets, and content.
- Washington and federal compliance claims use current official sources, state applicability assumptions, and identify every item requiring licensed counsel or CPA review.
- All committed planning and evaluation artifacts are indexed under `docs\`; standard-location exceptions are linked from that index.
- Founder content contains only approved/public professional facts and is marked draft.
- Founder/public-value content has controlled source records, claim ownership, evidence, expiry, and correction/removal procedures.
- Content/multimedia deliverables include an editorial workflow, channel plan, asset-rights model, accessibility requirements, and measurable publishing/engagement signals.
- Internal operating principles and public values are original Jamula language, source-informed, provisional until separately approved, and backed by measurable environmental/ethical claim rules.
- The backlog is implementation-ready; work is tracked in GitHub issues, but production website code is not created during evaluation.
- Fact Checker performs a final source and contradiction pass.

## Approval gates

1. Approve this execution plan.
2. Approve the proposed evaluation issue DAG, RACI, path ownership, and merge order.
3. Approve PR 1's exact head SHA, license scope, third-party notices, Star Trek non-affiliation/trademark disposition, and provisional principles state; repository automation may merge only after this record exists.
4. Approve the exact operating-principles wording before it becomes authoritative for Squad work.
5. Approve the vendor scoring rubric, numeric reference workloads, evidence penalties, risk ceiling, connector-spike accounts/tenants/consent authority, and spending limits.
6. Review the researched shortlist, spike/blocked packets, global privacy/security baseline, phase gates, and preliminary cost model before ADRs are finalized.
7. Approve founder-profile, public-values/claims, and legal-template wording.
8. Review Sarek's global, Washington, federal, and Kirkland compliance checklist and decide which items require counsel, CPA, broker, or other professional engagement.
9. Approve the maintained repository license inventory, scope, trademark policy, content rights, and professional-review dispositions.
10. Approve the final stack and ADRs.
11. Approve the implementation Squad ownership matrix and draft backlog before implementation issues are created.
12. Approve PR 2's exact head SHA and all conditions; repository automation may merge to `main` only after this record exists.

Every gate records prerequisites, accountable approver, exact artifact version/hash and PR head SHA, acceptance criteria, allowed outcomes (`approved`, `approved with conditions`, `rejected`, `needs rework`, `pending professional review`), conditions/expiry, and downstream work blocked until resolution.

## Notes and considerations

- Jamula.net is canonical; Jamula.com redirects permanently without serving duplicate content. Preserve paths/query strings where safe and validate certificates, DNS, analytics attribution, sitemap, robots, structured data, and search-console configuration for both domains.
- If Jamula.net cannot satisfy redirect, certificate, DNSSEC, or account-recovery gates, pause launch and remediate; do not silently switch canonical domains or waive the failed control.
- Employer experience can add credibility, but public wording must avoid implying Microsoft endorsement or revealing internal work.
- OneDrive, Google Drive, and Box are required for Phase 3, but no connector may proceed without acceptable OAuth, token-custody, tenant-isolation, verification, and cost evidence.
- The public site, CRM/scheduling, authenticated portal/connectors/customer AI, payments, and optional public AI are separate trust and data boundaries. They should not be forced into one vendor solely for convenience.
- Payments are a separate Phase 4 trust and compliance boundary. Earlier platform choices must preserve an integration seam without introducing cardholder-data scope now.
- Free tiers and pricing change frequently; the decision package will show verification dates and replacement triggers instead of treating current limits as permanent.
- Namecheap registrar MFA and lock, DNSSEC, CAA, and email SPF/DKIM/DMARC are launch-security requirements, not optional polish.
- Global privacy controls reduce later rework but do not replace jurisdiction-specific legal advice.
