# Homepage Copy Draft — The Standing Statement

**Status:** Candidate wording only. **Not approved for publication.**
All sections require independent gate reviews and Cyrus exact-SHA approval before any copy
is published, implemented in code, or used in any channel.

**Issue:** #43 (parent #39); review-condition fixes in #46
**Owner:** Nyota Uhura
**Visual direction:** The Standing Statement — letterpress-inspired editorial narrative;
three offerings split and recombine.
**Base SHA:** `b3c405d39ce6b6dfc3d5d4d50588060ea63688a3`; review-fix base `de96810a01ad09d040666eff3012b67e42c9c720`

**Required gates before merge or publication:**

| Gate | Reviewer | Scope |
|---|---|---|
| Claims and source fidelity | Fact Checker | Every factual statement; verify or flag for reframing |
| Legal, endorsement, employer, privacy | Sarek | Blocking: Microsoft/Azure framing, founder copy, contact mechanism, any comparative claim |
| Responsible-AI framing | Rai | Sections 6, 7; all AI approach language; confirm no overstatement or understatement |
| Exact-version approval | Cyrus | Final wording, channels, conditions, and expiry — no copy publishes without this |

**Intentionally excluded (must not be added without a complete approved claims-register
entry):** testimonials; case studies; named customer outcomes; certifications or credentials;
Microsoft partnership, endorsement, or affiliation; environmental, social, or sustainability
claims; security, reliability, or compliance achievements; performance benchmarks; accuracy
claims; pricing or availability.

---

## Reading-order note

Section headings are drafted to support semantic HTML (`<h1>` through `<h3>`) in a logical
reading order. The visual "split/recombine" treatment of the three offerings (Sections 2–4)
should not be implemented through a DOM order that breaks the sequence AI Strategy → Custom
Software → Cloud Consulting → synthesis. Screen readers must encounter the sections in the
order written here.

---

## Section 1 — Hero / Opening Statement

> *Heading — rendered as `<h1>` on the page, equivalent to the site name and primary
> statement. One clear idea. No tagline needed until the sub-heading reinforces it.*

### Candidate wording

**Heading:**
Jamula

**Sub-heading / standing statement:**
AI strategy. Custom software. Cloud consulting.
Together — not as separate projects.

**Lead paragraph:**
Organizations exploring AI often receive advice that stops before it reaches their systems.
Jamula doesn't stop there. We work across AI strategy, custom software, and cloud
infrastructure in a single engagement, so what we recommend is also what we build and run.

---

*Claim cross-reference:* `#43-H-001`, `#43-H-002` (see `public-claims-register.md`).
Status: proposed; not approved.

*Blocked:* No customer outcome, testimonial, or performance claim may appear here until a
verified claims-register entry is approved by all required reviewers and Cyrus.

---

## Section 2 — AI Strategy

> *First panel of the split. Stands alone as a complete description of one offering.
> Readable without the other two panels. No internal cross-references to other sections.*

### Candidate wording

**Heading:**
AI Strategy

**Body:**
Artificial intelligence creates real choices — and real ways to get them wrong. Jamula helps
organizations think clearly about AI: what it can do for your situation, what it cannot do,
and how to make a decision that holds up.

That means grounded scoping before any commitment, honest assessment of capability and risk,
and a strategy you can evaluate against something measurable — defined before work starts.

**What this engagement includes:**
- Evaluation of AI fit for a specific business problem
- Identification of the right approach, tools, and level of investment
- Honest characterization of limitations and conditions for success
- A decision frame that survives scrutiny — internally and from customers

---

*Claim cross-reference:* `#43-H-003`, `#43-H-004`.
Status: proposed; not approved.

*Blocked slots:*
- `[BLOCKED: Customer outcome or case study — requires approved claims-register entry,
  customer permission, and Cyrus approval before any use]`
- `[BLOCKED: Any AI-performance or accuracy metric — requires controlled baseline, Fact
  Checker verification, Sarek review, Rai review, and Cyrus approval]`

---

## Section 3 — Custom Software

> *Second panel of the split. Stands alone. Explains what custom software is for and why
> it is the right answer in specific situations — not as a default upsell.*

### Candidate wording

**Heading:**
Custom Software

**Body:**
Off-the-shelf tools solve standard problems. When your problem isn't standard — or when
you're building the capability that makes your organization different — custom software is
the answer.

Jamula designs and builds software for the specific problem at hand: the workflow that doesn't
fit a template, the integration that existing products can't make, the tool that turns your AI
strategy into something your team actually uses.

**What this engagement includes:**
- Design and development of purpose-built applications and integrations
- Architecture that separates your business logic from the platforms it runs on
- Delivery with clear scope, a testable definition of done, and documented handoffs
- Software built to be operated, maintained, and eventually replaced — not locked in

---

*Claim cross-reference:* `#43-H-005`.
Status: proposed; not approved.

*Blocked slots:*
- `[BLOCKED: Technology choices, named frameworks, or specific platform integrations —
  require Fact Checker verification and Cyrus approval before publication]`
- `[BLOCKED: Customer or project references — require customer permission, Sarek rights
  review, and Cyrus approval]`

---

## Section 4 — Cloud Consulting

> *Third panel of the split. Stands alone. Contains review-gated Microsoft/Azure language —
> see the `[REVIEW-GATED]` markers below. Do not publish bracketed text as-is.*

### Candidate wording

**Heading:**
Cloud Consulting

**Body:**
Cloud infrastructure done well is invisible — it doesn't slow software down, it doesn't
surprise you on a bill, and it doesn't create problems when you need to move.

`[REVIEW-GATED #43-H-006: "Jamula brings deep Microsoft and Azure expertise to client work."
— This wording must be reviewed by Sarek (endorsement/trademark risk, BLOCKING) and Fact
Checker (capability baseline) before publication. It must convey Jamula's own capability
only, never Microsoft endorsement, partnership, or affiliation. Sarek must approve the exact
wording. Do not use placeholder text in place of the approved sentence.
— ADDITIONAL PREREQUISITE (#46): Before publication clearance of this sentence, Cyrus must
disclose any current or recent Microsoft employment, contractor, or advisory relationship to
qualified counsel. The nature of any such relationship must not be recorded in this
repository.]`

That expertise exists to give organizations optionality, not lock them into one vendor.
`[REVIEW-GATED #43-H-007: "We work on Microsoft and Azure because that's where we're deepest
— but we build in ways that preserve your ability to move." — Blocked pending Sarek
endorsement-risk review and Fact Checker wording review. Current multi-cloud claims-register
entry is also blocked. Do not publish until both gates clear.
— ADDITIONAL PREREQUISITE (#46): Before publication clearance of this sentence, Cyrus must
disclose any current or recent Microsoft employment, contractor, or advisory relationship to
qualified counsel. The nature of any such relationship must not be recorded in this
repository.]`

**What this engagement includes:**
- Infrastructure design and implementation for cloud-hosted software and AI workloads
- Cost, reliability, and operations planning — including the assumptions behind each tradeoff
- Documentation sufficient to run, audit, and transfer the infrastructure
- A path that keeps your options open

---

*Claim cross-reference:* `#43-H-006` (blocked), `#43-H-007` (blocked).

*Blocked slots:*
- `[BLOCKED: Multi-cloud capability claim — public-claims-register entry blocked; requires
  Sarek and Fact Checker review of exact wording before any use]`
- `[BLOCKED: Security, compliance, or reliability claim — requires controlled evidence, Fact
  Checker, Sarek, and Cyrus gates]`
- `[BLOCKED: Any Microsoft trademark use beyond stating capability — Sarek review mandatory]`

---

## Section 5 — Synthesis / The Three Together

> *The recombine. Follows the three split panels. Shows how the three offerings connect as
> a single engagement. Explains the consequence of separation and the mechanism of
> integration. No outcome promise.*

### Candidate wording

**Heading:**
Three disciplines, one engagement

**Body:**
The problem with separate AI, software, and cloud engagements is that strategy doesn't
survive the handoffs. A strategy that can't be built doesn't get used. Software that can't
run in the cloud doesn't work at scale. Jamula keeps all three under one engagement so
decisions stay consistent from the whiteboard to the server.

An engagement with Jamula typically starts with understanding: what you're trying to
accomplish, what you already have, and where the real constraints are. From there, we
recommend what we think you need — including when the answer is less than you might expect —
and carry that recommendation through design, build, and operation.

---

*Claim cross-reference:* `#43-H-002`, `#43-H-008`.
Status: proposed; not approved.

*Blocked slots:*
- `[BLOCKED: Process timeline, guaranteed delivery cadence, or outcome promise — prohibited
  without verified evidence]`

---

## Section 6 — How We Approach AI

> *Responsible-AI approach section. Describes mechanism, not value claim. Intentionally
> avoids "Jamula's AI is responsible" (a values/outcome claim). Rai must confirm this
> framing is accurate and does not overstate or understate any safety commitment.*

### Candidate wording

**Heading:**
How we approach AI

**Body:**
Jamula's work on AI starts from a practical question: what will this actually do, for this
organization, in this situation? That question is harder than it sounds.

Jamula starts by checking whether incomplete data, unclear objectives, or untested assumptions
are the real problem. We work to surface those problems early — before the commitment,
before the build — because an honest scoping conversation is more valuable than a confident
one.

We don't claim AI is safe by default, and we don't claim any particular AI implementation is
safe until we can evaluate it against something measurable. We aim to make the evaluation
criteria clear and to tell you what we find. `[REVIEWER NOTE #43-H-010: Rai
review is blocking for this paragraph. Rai must confirm this accurately represents Jamula's
approach and carries no unintended implication — e.g., it should not suggest Jamula provides
safety certification or that any evaluation exhaustively proves safety.]`

---

*Claim cross-reference:* `#43-H-009` (Fact Checker may require reframing),
`#43-H-010` (Rai blocking review).
Status: proposed; not approved.

*Blocked slots:*
- `[BLOCKED: Responsible-AI certification, compliance, or "safe AI" claim — prohibited
  without verified evidence and all gates]`
- `[BLOCKED: Industry statistics or research citations — require Fact Checker source
  verification]`

---

## Section 7 — Founder / About Jamula

> *Founder section. Publication boundary is from issue #43 Cyrus approval comment,
> 2026-08-29. Only the identification as founder is approved in principle. All other
> founder copy is blocked. See founder-source-register.md.*

### Candidate wording

**Heading:**
About Jamula

**Body — approved identification (candidate; exact published copy still gated):**
Cyrus Jamula founded Jamula.

**Body — technical background (blocked):**
`[BLOCKED #43-F-002: Technical background description. No approved wording exists. Source
lead (LinkedIn public profile) recorded in founder-source-register.md; exact URL to be
confirmed by Cyrus. Exact claim must be drafted after source confirmation and must pass
Fact Checker (source verification), Sarek (privacy/employer/endorsement review), Rai
(framing review), Dax (presentation/accessibility), and Cyrus exact-wording approval.
Do not substitute inferred, guessed, or third-party-speculative wording. Do not describe
Cyrus's employer, title, community/religious affiliations, addresses, client names, private
contacts, or unverified credentials.]`

---

*Claim cross-reference:* `#43-F-001` (identification — approved in principle; copy gated),
`#43-F-002` (technical background — blocked).

*Blocked slots:*
- `[BLOCKED: Microsoft employer or title]`
- `[BLOCKED: Community or religious affiliations]`
- `[BLOCKED: Addresses or personal contact information]`
- `[BLOCKED: Client names or project references]`
- `[BLOCKED: Unverified credentials or certifications]`

---

## Section 8 — Next Step

> *Education-first. The goal is to make it easy for the right visitors to start a
> conversation — not to pressure them into a funnel. No "book a call" or "get started"
> CTA unless Cyrus approves that posture explicitly.*

### Candidate wording

**Heading:**
Start a conversation

**Body:**
If you're trying to understand whether AI has a real application in your organization, or
whether your software or infrastructure needs are something Jamula can help with, the right
place to start is a direct conversation.

We'll tell you honestly what we think — including whether we're a good fit or whether someone
else is better suited.

**Contact path:**
`[BLOCKED: Contact email address, form action URL, or contact mechanism — not defined in
this draft. Requires Sarek (privacy and contact-data review), Dax (accessible form/link
implementation), and Cyrus approval before any contact mechanism is added. Do not add a
placeholder email address or guessed contact path.]`

---

*Claim cross-reference:* `#43-H-011`.
Status: proposed; not approved.

*Blocked slots:*
- `[BLOCKED: Contact email or form — privacy review and Cyrus approval required]`
- `[BLOCKED: "Book a call," "request a demo," or "get started" language — counter to
  education-first posture; requires Cyrus explicit approval if posture changes]`

---

## Claim Cross-Reference Index

| Row ID | Section | Candidate wording (summary) | Status | Register entry |
|---|---|---|---|---|
| #43-H-001 | Hero | "Jamula provides AI strategy, custom software, and cloud consulting." | Proposed; category-level truth owner-approved; exact copy review-gated | `public-claims-register.md` |
| #43-H-002 | Hero / Synthesis | "Together — not as separate projects." | Proposed; unverified | `public-claims-register.md` |
| #43-H-003 | AI Strategy | AI approach / grounding description | Proposed; unverified; no comparative framing | `public-claims-register.md` |
| #43-H-004 | AI Strategy | "A strategy you can evaluate against something measurable — defined before work starts" | Proposed; unverified | `public-claims-register.md` |
| #43-H-005 | Custom Software | Custom software positioning | Proposed; unverified | `public-claims-register.md` |
| #43-H-006 | Cloud Consulting | Microsoft and Azure expertise statement | Proposed; **blocked** — Sarek endorsement-risk review blocking; employer-conflict prerequisite (#46) | `public-claims-register.md` |
| #43-H-007 | Cloud Consulting | Multi-cloud optionality positioning | Proposed; **blocked** — Sarek endorsement-risk review; employer-conflict prerequisite (#46) | `public-claims-register.md` |
| #43-H-008 | Synthesis | Process description ("typically starts with understanding") | Proposed; unverified | `public-claims-register.md` |
| #43-H-009 | Responsible AI | "Jamula starts by checking whether incomplete data, unclear objectives, or untested assumptions are the real problem." | Proposed; unverified | `public-claims-register.md` |
| #43-H-010 | Responsible AI | Safety-evaluation approach; "aim" wording | Proposed; unverified; Rai review **blocking** | `public-claims-register.md` |
| #43-H-011 | Next Step | CTA / conversation framing | Proposed; unverified; contact mechanism separately gated | `public-claims-register.md` |
| #43-F-001 | Founder | "Cyrus Jamula founded Jamula." | Proposed; identification approved in principle; exact copy gated | `founder-source-register.md`, `public-claims-register.md` |
| #43-F-002 | Founder | Technical background description | **Blocked** — no approved wording; source confirmation required | `founder-source-register.md`, `public-claims-register.md` |

---

## Voice and Style Reference

**Use:**
- Second person ("you," "your") to address the visitor directly.
- Precise, concrete language. If a word doesn't say something specific, remove it.
- Short sentences alongside longer ones. Vary rhythm.

**Do not use:**
- "Cutting-edge," "innovative," "world-class," "revolutionary," "transformative."
- "Leverage," "synergy," "best-in-class," "game-changing."
- "Guaranteed," "always," "never fails," "proven."
- Microsoft or Azure as the subject of a marketing claim (they are only the subject of
  a capability description, and only after Sarek clears the wording).

**Section length target:**
Each section should be readable in under 30 seconds. A paragraph that is not saying
something specific should be cut, not padded.

**Audience posture:**
The reader is an intelligent adult who can evaluate fit for themselves. The copy should
give them what they need to make that evaluation — not try to persuade them before they
have it.

---

**Context:** `Refs #43; parent #39; review-condition fixes #46`. No section of this draft is approved for
publication. All candidate wording requires Fact Checker, Sarek, and Rai gate reviews,
then Cyrus exact-SHA approval before any use.
