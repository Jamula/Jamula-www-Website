# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary audiences confirmed by the owner (Cyrus Jamula) for the public homepage:

- **Organizations exploring AI** — teams and leaders evaluating whether and how to
  adopt AI, who need to understand what Jamula offers and whether it fits their
  situation before starting a conversation.
- **General visitors learning about Jamula** — people arriving to understand who
  Jamula is, what it does, and how to make contact.

These are the confirmed homepage audiences. Broader audience segments described in
internal planning (for example product/technology leaders, Microsoft-oriented
organizations, partners/practitioners, and existing customers in
`docs/content/content-strategy.md`) are planning hypotheses, not confirmed
homepage targets, and remain subject to validation. Audience assumptions are not
demographic targeting profiles.

## Product Purpose

Jamula.net is the canonical public website for Jamula, Inc. Its purpose is to
explain what Jamula offers, why it is different, and how to get in touch, so that
visitors can understand fit and choose a low-friction next step.

The current production homepage is intentionally minimal and does not yet explain
the offering; this record exists so future homepage and content work does not have
to re-infer audience, purpose, positioning, and evidence boundaries each time.

Success for this phase is defined by task completion and qualified contact — a
visitor understanding the offering and reaching an accessible contact path — not by
any performance, popularity, or outcome metric. No metric is a customer outcome or
public claim by itself.

## Positioning

Jamula's confirmed differentiation themes (owner-approved as internal positioning
truth; exact public wording remains editorial and review-gated):

- **Practical, responsible AI guidance without hype** — useful, grounded advice
  rather than inflated promises.
- **Deep Microsoft and Azure expertise** — stated as Jamula's own capability and
  preference, never as an endorsement, partnership, or affiliation with Microsoft.
- **Combined AI strategy, custom software, and cloud execution** — the three
  offering categories delivered together, so strategy is carried through to built
  and operated systems rather than stopping at advice.

The defensible position is the combination: responsible-AI strategy taken through
custom-software delivery and cloud execution with Microsoft/Azure depth, under an
honest-claims discipline. This is a positioning statement, not a proven-outcome
claim.

## Operating Context

- **Offering categories (owner-approved, category-level product truth):**
  `Jamula provides AI strategy, custom software, and cloud consulting.` This is
  approved as category-level truth about what Jamula does. It is **not** approved
  final published wording — the exact public copy remains editorial and
  review-gated (Fact Checker, Sarek, Rai, and Cyrus per
  `docs/content/content-strategy.md` and `docs/content/public-claims-register.md`).
- **Company / public identity:** Jamula, operated by Jamula, Inc.
- **Canonical domain:** `jamula.net`. The Azure site is currently served at
  `www.jamula.net` while migration of the apex (`jamula.net`) is being evaluated;
  the apex migration is not yet done. `Jamula.com` is intended to redirect to the
  canonical domain.
- **Current public-site implementation:** the public website is an Astro project
  with `output: "static"` (`www/astro.config.ts`, canonical `https://jamula.net`),
  deployed to Azure Static Web Apps via `.github/workflows/azure-static-web-apps.yml`.
- **Durable platform selection remains open:** the long-term rendering/CMS/framework/
  host choice is an unresolved evaluation (ADR-001, `docs/decisions/`), where custom
  and turn-key options are still in scope and no platform is selected. The Astro/Azure
  setup above is the current build-and-deploy reality, not a decided durable outcome.
- **Deployment / branch model:** protected `main` is the sole production source and
  the only persistent branch; pull-request previews are ephemeral and non-production.
- **Future secure customer portal is a separate product surface:** the planned
  customer portal (identity, CRM, storage connectors, customer AI, payments — see
  `docs/requirements/business-product-requirements.md`) is a separate deployment and
  codebase from this public website and is out of scope for the public site.

## Capabilities and Constraints

**Confirmed for the public website (Phase 1):**

- A static, statically hosted public marketing/company website whose job is to
  describe Jamula's offering categories and route visitors to contact.
- The approved Jamula icon/brand asset is integrated (see Brand Commitments).

**Durable constraints future work must preserve:**

- Publish only owner-approved, review-gated content. No public claim ships without
  its required review gate and Cyrus's exact-version approval.
- Preserve a Microsoft-preferred, multi-cloud-capable posture stated as Jamula's own
  capability; never imply Microsoft (or any vendor) endorses, partners with, or is
  affiliated with Jamula.
- Keep the public website and the future customer portal as separate, separable
  deployments and codebases.
- Keep `main` as the sole production source; treat PR previews as ephemeral and
  data-free.

**Explicitly undecided (open decisions — do not resolve by inventing):**

- The durable rendering/CMS/framework/host platform (ADR-001 evidence cycle is
  unresolved).
- Apex-domain (`jamula.net`) migration from the current `www.jamula.net` custom
  hostname.
- Final public wording for offering categories, positioning, and any claim — pending
  editorial review and owner approval.
- Later phases (CRM/scheduling, portal/storage/customer AI, payments, optional public
  AI) and any of their product facts.

## Brand Commitments

- **Name:** Jamula / Jamula, Inc. Use "Jamula" as the public brand name.
- **Logo:** a user-supplied green, circuit-inspired "J" logo is owner-approved for
  website icon use, and its icon set is present in the repository. No other visual
  direction (palette, typography, components) is fixed here.
- **Voice (from confirmed positioning):** practical and honest, without hype or
  inflated claims.
- **Identity constraint:** internal Squad working identities (fictional-character
  code names used only inside `.squad/`) are internal only and must never appear in
  public branding, content, metadata, or assets, and must not imply affiliation with
  any rights holder.

## Evidence on Hand

**Present in the repository:**

- Extensive internal planning and decision records under `docs/` (requirements,
  content strategy, ADRs, experience/accessibility gates, legal and privacy gates,
  claims register). These record internal requirements and proposals, not
  publication-approved public claims.
- The approved Jamula icon asset set.
- The current minimal Astro public site (`www/`).

**Deliberately absent — future work must NOT fabricate these:**

- No approved testimonials, case studies, or customer outcomes/results.
- No certifications, awards, or credentials approved for publication.
- No Microsoft (or other vendor) partnership, endorsement, or affiliation claim.
- No quantified or comparative performance, reliability, security, or benchmark
  claims.
- No environmental, social, or sustainability outcome claims.
- No final service packages, availability, or pricing.
- No detailed founder biography or private founder facts approved for publication.

Every environmental, ethical, social, accessibility, customer, AI, and performance
claim is blocked until it has a complete, verified entry in
`docs/content/public-claims-register.md` and passes its required reviews and owner
approval.

## Product Principles

1. **Truth before promotion.** Publish only owner-approved, review-gated,
   evidence-backed statements. When evidence is absent, say less rather than invent.
2. **Vendor-honest posture.** Microsoft/Azure depth is stated as Jamula's own
   capability and preference, never as endorsement, partnership, or affiliation.
3. **Strategy through execution.** The offering's value is AI strategy carried into
   custom software and cloud execution together — not advice alone.
4. **Separation for portability.** Keep the public site and the future portal as
   independent, replaceable deployments; keep `main` the sole production source.
5. **Phase discipline.** The public website is Phase 1; CRM/scheduling,
   portal/storage/customer AI, and payments are later phases behind their own
   approval gates.

## Accessibility & Inclusion

- **WCAG 2.2 Level AA** is an engineering target for the applicable public-site
  journeys, and good field Core Web Vitals (per the experience gate in
  `docs/experience/accessibility-seo-performance.md`) are engineering targets — not
  achieved conformance or public claims. Never shorten the target to
  "accessible"/"compliant" in public wording.
- Preserve semantic structure, keyboard access, sufficient contrast, reduced-motion
  support, and zoom/reflow in future homepage and content work.
- Provide accessible alternatives for any media, and an accessible contact path.
