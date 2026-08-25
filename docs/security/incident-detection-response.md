# Incident Detection and Response

**Status:** Proposed operating requirements; no on-call, alert, or response capability is yet proven

**Context:** Refs #3; child #7

**Revision owner:** Seven of Nine, Identity, Data & AI Engineering (cycle 2 independent remediation; original author locked out)

**Required review:** Platform, Identity/Data/AI, Legal/Privacy, Communications, Fact Checker; Cyrus approves operational ownership

**Reviewed sources through:** 2026-08-24

## Evidence boundary

This plan is `documented research` plus `future implementation test` requirements. A configured alert is not proof that it pages, reaches an authorized responder, or leads to containment. Launch requires end-to-end exercises with sanitized evidence. Vendor screenshots and disposable spikes prove only their recorded mechanism. Missing provider access must be a `blocked/deferred packet`, never a passing result.

NIST SP 800-61 Rev. 3 integrates incident response across cybersecurity risk management rather than treating it only as a linear playbook. Jamula will organize work as **Govern/Identify/Protect**, **Detect**, **Respond**, **Recover**, and **Improve**, with preparation and learning continuous.

## Operating roles and authority

Named people, alternates and reachable channels must be approved before launch; role labels below are not evidence of staffing.

| Role | Primary responsibility | Authority / constraint |
|---|---|---|
| Incident Commander (IC) | Own severity, timeline, decisions, handoffs and closure | May isolate services and invoke tested kill switches; may not make legal/public claims alone |
| Security/Detection Lead | Validate signal, scope identity/tenant/token/CI compromise, preserve evidence | Owns containment recommendations and detection gaps |
| Service/Platform Lead | Runtime, CI/CD, DNS, email, rollback, restore and vendor escalation | Executes approved isolation/rollback; preserves artifacts |
| Identity/Data/AI Lead | Sessions, membership, OAuth connectors, files, derivatives, AI and tenant scope | Revokes tokens/access; assesses data paths and deletion propagation |
| Privacy/Legal Lead | Data/breach assessment, insurer/counsel/regulator/customer clock tracking | Qualified counsel decides legal notification obligations; engineering does not infer deadlines |
| Communications Lead | Internal, customer, public and partner messages | Publishes only approved, evidence-scoped wording |
| Scribe/Evidence Custodian | UTC timeline, decisions, hashes, custody and action register | Restricts evidence; never copies secrets/raw customer content into tickets |
| Executive Approver | Business decisions, risk, external statements and recovery priorities | Cyrus or documented alternate |

At least two people must be able to assume IC and platform/identity containment roles. A responder must not approve their own break-glass access or evidence destruction.

## Phase operating model and funded capacity

This table is authoritative for human coverage and control cadence in the security documents. Automated safeguards monitor continuously when the service runs; **human 24x7 response exists only where the applicable row requires it and staffing/contract evidence passes**. “Alert sent” is not “human acknowledged.”

| Highest live phase | Minimum human coverage | Minimum always-on automated safety | Required funded roles and proof | Bottom-up recurring active labor |
|---|---|---|---|---:|
| **P1 public/contact** | Staffed business window, minimum 08:00–18:00 Pacific Monday–Friday excluding approved holidays; primary and alternate. Outside the window, alerts reach both but no 5/10-minute claim is made | WAF/rate/size limits, contact queue expiry, deploy/provenance block, domain/certificate and secret alerts, contact-form kill switch, immutable audit/backup job alerts | Named IC primary/alternate and Platform/Security primary/alternate; monthly page-path exercise; published coverage and next-window handoff | **14 h/month:** weekday alert review 5.5; weekly vulnerability/dependency triage 4.5; monthly page/kill-switch test 2; metrics/runbook/admin 2 |
| **P2 CRM/scheduling** | P1 window plus one documented weekend/holiday check every 12 hours while integrations run; internal rotation or contracted monitor | P1 plus provider health, queue age/idempotency, CRM/scheduling reconciliation, privileged MFA/change alerts and provider disable switch | P1 roles plus CRM/scheduling owner/alternate and vendor escalation; weekend check evidence | **+10 h/month (24 cumulative):** provider/reconciliation review 4; access/processor review 2; weekend rotation administration 2; monthly outage/duplicate exercise 2 |
| **P3 portal/connectors/customer AI** | **Funded 24x7 on-call** with primary and independent alternate, internal rotation, contracted SOC/MSP, or hybrid; handoff, access and escalation exercised before preview | P2 plus tenant-policy fail-closed, token/connector revoke, AI/egress kill switch, critical audit pipeline, cross-tenant and spend canaries | Named service, Identity/Data/AI and IC responders; contract/rota shows every hour; quarterly cross-tenant/connector/AI exercise and alternate response | **40 cumulative active hours/month (16 incremental)** plus the funded 24x7 coverage service/rota: daily security review 15; weekly identity/connector/AI triage 8; monthly access/page tests 5; quarterly game-day amortization 4; risk/vendor admin 8 |
| **P4 payments** | P3 24x7 coverage with payment/accounting escalation and fraud/processor contact | P3 plus hosted-payment disable switch, webhook verification, amount/tenant invariant, duplicate/replay defense and daily processor/accounting/bank reconciliation | Payment and accounting primary/alternate; processor escalation; monthly mismatch/webhook exercise | **+12 h/month (52 cumulative):** daily payment/reconciliation exception review 5; weekly fraud/webhook review 4; monthly exercise/key/access review 3 |
| **P5 public AI candidate** | At least P3 coverage; expand contracted capacity for public abuse/denial-of-wallet before exposure | P3 plus public-corpus isolation, abuse/moderation/rate/spend controls and public-AI kill switch | AI safety and customer-support primary/alternate; approved abuse-volume model | **+10 h/month (62 cumulative if P4 is also live):** evaluation/abuse review 6; feedback/correction review 2; monthly kill-switch/model drill 2 |

Active-labor estimates are planning floors, not quotes and not standby coverage-hours. They exclude actual incident response, remediation, major upgrades, annual professional review and vendor fees. Geordi must cost employee/contractor rates, on-call premium/SOC subscription and growth sensitivity. If named people cannot sustainably cover the hours, reduce the live phase/surface or contract coverage; do not convert exhaustion into risk acceptance.

Each launch record names primary, alternate, coverage time zone/calendar, reachable paging paths, access level, maximum handoff delay, contracted SLA if used, monthly funded hours, last exercise and executive owner. A phase cannot advertise or contract to a response objective faster/broader than this evidence.

## Severity and response objectives

The automated-detection clock starts when the system receives a qualifying signal. The **human** clock starts only during the funded coverage window; P3+ coverage has no window gap. Outside P1/P2 coverage, automation takes its preapproved safe action, pages both responders and preserves evidence, but Jamula makes no 24x7 human-acknowledgement claim.

| Severity | Examples | P1/P2 human objective | P3+ funded 24x7 objective | Containment / communication |
|---|---|---|---|---|
| **SEV-0 Critical** | Confirmed cross-tenant disclosure; active privileged/CI/DNS compromise; exposed signing key; public customer-data leak; material payment integrity failure | Within coverage: acknowledge 15 min, triage 30 min, decision 60 min. Outside: automated disable/deny where applicable; human acknowledgement at next funded start (P1 overnight gap up to 14 h and weekend/holiday gap up to the published next staffed start; P2 no later than its 12-hour check) | Acknowledge 15 min, triage 30 min, containment decision 60 min | Alternate at 15 min and executive at 30 min if unacknowledged during coverage; update at least hourly while active |
| **SEV-1 High** | Suspected token theft with activity; bulk export anomaly; active exploit; production unavailable; runaway spend | Within coverage: acknowledge 30 min, triage 60 min, decision 2 h. Outside: automated quarantine/kill switch; next funded start | Acknowledge 30 min, triage 60 min, decision 2 h | Alternate at 30 min and executive at 60 min during coverage; update at least every 2 h while active |
| **SEV-2 Medium** | Contained single-account abuse; degraded connector; repeated webhook forgery; control failure without observed compromise | Acknowledge 4 staffed hours, triage 1 business day, decision 2 business days | Acknowledge 4 h, triage 8 h, decision 1 business day | Daily at material change |
| **SEV-3 Low** | Policy drift, low-confidence scan finding, failed noncritical synthetic | Acknowledge 1 business day, triage 2, disposition 5 | Same | At material change/closure |

If severity is uncertain, use the higher class. These are internal planning objectives, not a public/customer SLA. A faster objective may be adopted only with a funded rota/contract, reachable primary/alternate, access and two passing exercises. P3 preview, P4 and P5 are blocked without the 24x7 evidence in the phase table.

## Detection catalogue

Thresholds are initial proposals and must be tuned with synthetic traffic without hiding low-and-slow behavior. Events are UTC, tenant-correlated, redacted, tamper-evident and linked to actor/session/request/provider/policy/artifact identifiers.

| ID | Use case / required signal | Primary owner | Initial trigger | Automated safe action | Human SLO |
|---|---|---|---|---|---|
| DET-01 | Credential stuffing, enumeration, MFA downgrade/push abuse, impossible session change | Identity | Adaptive threshold across IP/account/device plus known-bad indicators; never expose account existence | Rate/challenge; do not mass-lock accounts | SEV-1 if privileged/successful; else SEV-2 |
| DET-02 | Cross-tenant authorization attempt or tenant-context mismatch | Security + Identity | Any unexpected allow = SEV-0; repeated denies or one privileged mismatch = SEV-1 | Deny, invalidate affected session/job, preserve trace | Applicable phase/severity objective above |
| DET-03 | Invitation, membership, domain claim, recovery, identity-link or support/break-glass change | Identity | Any break-glass; anomalous/replayed change; high-risk combination | Step-up/hold; notify affected admin through independent channel | SEV-1 |
| DET-04 | OAuth token misuse: wrong audience/type, refresh replay, revoked token, new geography/provider account | Identity/Data | Any refresh replay or post-revocation success; anomaly threshold otherwise | Reject, revoke token family/connector where safe | SEV-0 if cross-tenant; SEV-1 otherwise |
| DET-05 | Webhook forgery, stale/replay flood, ordering gap or reconciliation mismatch | Service owner | Any valid-signature tenant mismatch; error/rate threshold; missed sequence | Reject/quarantine; circuit break without accepting state | SEV-1 payment; SEV-2 connector |
| DET-06 | Bulk export/file enumeration/AI-mediated exfiltration | Data/Security | Per-actor/tenant volume, rare destination, step-up failure, canary access | Pause export/session and revoke short-lived link | SEV-0 confirmed cross-tenant; SEV-1 suspected |
| DET-07 | Malicious upload/parser/scanner failure or archive/resource bomb | Platform/Data | Malware/high-risk type; scanner unavailable; processing budget exceeded | Quarantine and stop derivative/index path | SEV-1 exploit; SEV-2 contained |
| DET-08 | AI prompt injection, cross-tenant canary, unsafe tool/egress attempt, model/policy drift | AI/Security | Any private canary/tool/egress; quality/safety regression threshold | Block response/session/model route; disable AI kill switch if systemic | SEV-0 leak; SEV-1 attempted bypass |
| DET-09 | CI/repository compromise: workflow/action/permission/protection/provenance change | Platform/Security | Unapproved privileged workflow or failed provenance/digest; secret alert | Block promotion, revoke workflow/cloud credentials, quarantine artifact | SEV-0 active deploy; SEV-1 otherwise |
| DET-10 | DNS/certificate/domain/email-control change or takeover indicator | Platform | Any unapproved protected-record/account change; certificate anomaly | Freeze deployment/change path; registrar/provider escalation | SEV-0 takeover; SEV-1 suspected |
| DET-11 | Denial of service/wallet: traffic, email/SMS, scan, sync, AI token, logging or build spend | Platform + cost owner | Burn-rate and absolute budgets at 50/80/100%; unusual amplification | Per-tenant/global rate/concurrency caps, queue pause, approved kill switch | SEV-1 at emergency threshold |
| DET-12 | Payment amount/tenant/state mismatch, duplicate effect or reconciliation gap | Payment owner + Security | Any cross-tenant/amount mismatch; unreconciled event beyond SLO | Stop entitlement/state mutation, hold workflow, reconcile provider truth | SEV-0 integrity; SEV-1 availability |
| DET-13 | Backup deletion/policy/key change, missed backup, integrity/restore failure | Platform + Evidence Custodian | Any immutability/credential change; missed RPO; failed validation | Protect remaining copies, deny destructive automation | SEV-1 compromise; SEV-2 failure |
| DET-14 | Logging blind spot, clock drift, redaction failure, audit tamper | Security/Platform | P1/P2 critical source silent >30 min; P3+ critical source silent >5 min; >60 s clock drift; any secret canary/tamper | Stop affected sensitive action if audit is mandatory; rotate leaked secret | SEV-1 for sensitive-path blind spot under applicable coverage |

Every detection has a runbook link, query/config version, mapped threat/control, data source and expected latency, threshold owner, false-positive review, privacy classification, retention, test fixture, last successful exercise, and fallback when the monitoring provider fails.

## Response procedure

1. **Validate and open record:** acknowledge, assign IC/severity, use a unique incident ID, record detection time/current UTC and preserve the original alert.
2. **Stabilize:** protect people/data first; deny affected authorization, isolate tenant/provider/artifact, pause queue/export/AI/payment mutation or roll back using preapproved reversible controls. Never destroy evidence to recover quickly.
3. **Scope:** build actor/tenant/data/provider/artifact/time matrix; search for equivalent indicators across identity, authorization, connector, AI, CI, DNS, payment, logs and backups. Assume tokens and derivatives may propagate.
4. **Preserve:** export required logs/configuration/provenance with hashes and access log into an isolated evidence store. Record collection method, UTC, custodian and transfers. Minimize customer content and secrets; rotate secrets rather than copying them.
5. **Eradicate:** revoke sessions/tokens/keys, remove persistence, quarantine artifacts/data, patch through reviewed `main`, rebuild from trusted source and invalidate caches/previews/embeddings/indexes.
6. **Recover:** verify clean artifact provenance, authorization/tenant tests, reconciliation, restore integrity and monitoring before staged traffic. Roll back if safety checks, burn rate or error thresholds fail.
7. **Communicate:** use confirmed scope and explicit uncertainty. Privacy/Legal determines insurer, counsel, processor, regulator and customer obligations and clocks.
8. **Improve:** within 5 business days for SEV-0/1 (10 for SEV-2), complete blameless review, root/contributing factors, detection and control gaps, customer impact, cost, actions/owners/dates and risk disposition. Verify action closure.

## Evidence preservation and sensitive handling

- Use UTC-synchronized original sources where possible; retain query, export scope, hash, source version, collector, access and chain of custody.
- Legal hold is initiated/released only by authorized Legal/Privacy direction. Do not promise evidentiary admissibility without professional review.
- Tickets/chat/email contain classifications and secure references, not access tokens, passwords, raw payment data, full files/prompts or unnecessary personal data.
- Production access uses approved, time-bound, MFA-protected accounts; no shared responder credentials.
- Incident evidence retention and deletion are set by the approved privacy/legal schedule. Backup immutability does not override lawful deletion without a recorded basis.

## Communication matrix and templates

| Audience | Owner | Trigger | Minimum content |
|---|---|---|---|
| Responders/executive | IC | SEV-0/1 declaration | Incident ID, UTC, severity, confirmed/unknown scope, actions, risk, owner, next update |
| Affected customer admin | Communications + Privacy/Legal | Approved evidence of effect or required precaution | What happened/when, affected service/data if known, what Jamula did, customer action, support path, next update; no speculation |
| All customers/status page | Communications | Material shared availability/security impact | Service/region, observed impact, mitigation, current state, next update |
| Provider/processor | Service/Data owner | Contract/runbook threshold | Tenant-safe correlation, evidence, requested containment/data, response deadline |
| Insurer/counsel/regulator/law enforcement | Privacy/Legal | Policy/contract/law decision | Only approved factual package; record recipient, time, scope and advice |
| Public/media | Executive + Communications + Legal | Explicit approval | Evidence-scoped statement and correction route |

**Initial internal:** `[INC-ID][SEV][UTC] We are investigating <signal>. Confirmed: <facts>. Unknown: <items>. Containment: <actions>. Customer effect: <known/unknown>. IC/owners: <roles>. Next update: <UTC>.`

**Customer holding:** `We are investigating an issue affecting <service/scope> first observed at <UTC>. We have <contained/disabled> <function>. We are validating impact and will update by <UTC>. If action is required, we will provide it through <authenticated channel>.`

**Resolution:** Include incident window, affected scope, customer action, remediation and monitoring; separate confirmed facts from estimates. Privacy/Legal approves breach/privacy language. If an earlier statement becomes wrong, correct it promptly and preserve both versions.

No document here states a universal breach-notification deadline. Jurisdiction, contracts, insurer terms and facts vary; Sarek/qualified counsel must maintain and invoke the applicable clock register.

## Exercises and measurable gates

| Exercise | Cadence | Pass criteria |
|---|---:|---|
| Alert-to-page synthetic for each critical data source | P1/P2 monthly; P3+ monthly across both primary/alternate and after routing change | Correct covered responder receives redacted alert; outside-window P1/P2 behavior is labeled automation-only; escalation matches funded model |
| Cross-tenant/token tabletop plus technical containment | Before Phase 3 preview; quarterly while P3+ live | Detect, deny/revoke, scope derivatives, preserve evidence and communicate within funded P3+ objectives |
| Connector webhook/revocation drill per exposed provider | Before exposure; semiannual in P3, quarterly after material provider/control change | Forgery/replay rejected; reconciliation repairs gap; revocation objective met |
| CI credential/artifact compromise | Before Phase 1; semiannual and after CI trust change | Promotion blocked, credentials revoked, trusted artifact rebuilt from protected `main`, provenance verified |
| Denial-of-wallet and AI kill switch | Before cost-bearing feature; quarterly while AI is live or after model/control change | Budget alert and bounded degradation occur before approved emergency limit; recovery is tested |
| Payment mismatch/webhook drill | Before Phase 4; quarterly | No false entitlement; provider truth reconciled; customer-safe rollback |
| Incident communications tabletop | P1/P2 annual and before phase change; P3+ semiannual | Owners/alternates, secure channels, approvals and clock register work; templates are accessible |
| Full restore/cyber-recovery drill | Cadence controlled by `backup-recovery.md` classification/phase schedule | Recovery passes without trusting compromised production credentials or resurrecting deleted data |

P1/P2 produce a monthly report; P3+ additionally review a weekly exception dashboard. Report coverage by threat, staffed versus unstaffed clock, mean/90th-percentile acknowledge/triage/containment, missed/late pages, false-positive burden, source blind time, control-action age, exercise pass rate, active labor versus funded hours, on-call gaps, error-budget impact and accepted-risk expiry. Metrics are internal readiness evidence, not public performance claims.

## Vulnerability disclosure

Phase 1 should publish `/.well-known/security.txt` conforming to RFC 9116 with monitored contact, canonical URL, policy, preferred language and an expiry less than one year away. Test it before release, quarterly in P1/P2 and monthly in P3+, plus after routing change. The policy must define safe reporting and acknowledgement targets that match funded coverage and state that `security.txt` does not itself grant permission to test. Intake must avoid requiring reporters to send sensitive evidence by ordinary email.

## Phase gates and risk acceptance

- No phase launches without its table-defined named primaries/alternates, funded hours/coverage, access, current runbooks, critical automated safeguards, restore path and a passing exercise. P1/P2 must clearly disclose internally that human coverage is not 24x7; P3+ must prove funded 24x7 on-call.
- An untested detection, inaccessible provider log, missing retention, unreachable pager or unresolved logging blind spot is failing/blocked evidence.
- No unresolved Critical/High incident-readiness risk is accepted. Any Medium acceptance follows `control-test-matrix.md`, expires within 90 days, includes compensating detection and a remediation issue, and is approved by Cyrus and accountable owners.
- SEV-0/1 corrective actions that restore a broken safety boundary block the next release until verified.

## Official sources

Verified 2026-08-24:

- NIST, **SP 800-61 Rev. 3, Incident Response Recommendations and Considerations for Cybersecurity Risk Management**, published April 2025 and superseding Rev. 2: <https://csrc.nist.gov/pubs/sp/800/61/r3/final>.
- IETF/RFC Editor, **RFC 9116, A File Format to Aid in Security Vulnerability Disclosure**, April 2022: <https://www.rfc-editor.org/rfc/rfc9116.html>.
- OWASP, **ASVS 5.0.0**, especially logging/audit requirements in V16: <https://github.com/OWASP/ASVS/tree/v5.0.0>.

The sources support the framework and controls; they do not prove Jamula readiness or legal compliance.
