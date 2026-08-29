---
version: 1
slug: "www-src-pages-index-astro"
primary_target: "www/src/pages/index.astro"
related_targets: ["route:/","www/src/layouts/BaseLayout.astro","www/src/styles/tokens.css","www/src/styles/base.css"]
---

# Homepage — The Standing Statement

Durable strategy for the Jamula.net homepage surface. Product truth lives in
PRODUCT.md; durable visual tokens will live in DESIGN.md, written at finish from
the built world. This brief holds only what belongs to this route.

## Scope and visitor mode

- **Primary surface:** `www/src/pages/index.astro` (the homepage, route `/`).
- **Related future targets:** the shared shell (`www/src/layouts/BaseLayout.astro`)
  and the global style/token files (`www/src/styles/tokens.css`,
  `www/src/styles/base.css`) that this world will redefine, plus the site chrome
  (`SiteHeader.astro`, `SiteFooter.astro`) it must re-theme.
- **Mode:** Persuade, held to an education-first / no-hard-sell posture. The job is
  belief and understanding, not a conversion push.
- **Current state:** an intentional placeholder ("Jamula / More to come.") on
  provisional blue-accent, system-font tokens. This is evidence of what the site is,
  not authority over what it becomes; the world replaces it rather than polishing it.

## Audience and job

- **Audiences (confirmed in PRODUCT.md):** organizations exploring AI, and general
  visitors learning who Jamula is.
- **Job:** let a visitor understand the offering and its fit, then reach an
  accessible, low-friction contact path — task completion and qualified contact, not
  any performance or popularity metric.

## Action posture (credibility-first)

- Credibility and education lead; there is no dominant sales action and no repeated
  aggressive CTA.
- A single quiet, accessible contact path closes the page. It is a door, not a push.

## Proof and assets on hand

- **Icon:** the owner-approved green, circuit-inspired Jamula "J", present as a
  favicon / app-icon set (`favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`,
  `apple-touch-icon.png`). Used as a restrained maker's mark — never enlarged into
  page-wide circuit-board decoration.
- **Offering categories (category-level product truth, PRODUCT.md):** AI strategy,
  custom software, and cloud consulting, delivered together. Exact public wording is
  still editorial and review-gated (Fact Checker, Sarek, Rai, Cyrus).
- **Deliberately absent (must not be invented):** testimonials, case studies,
  customer outcomes, certifications, awards, vendor partnership/endorsement claims,
  quantified performance/reliability claims, pricing, or founder facts.

## Constraints

- **Preserve:** WCAG 2.2 AA and reduced-motion as engineering targets; keyboard
  access; robust contrast and typography; the approved J mark; a Microsoft-preferred,
  vendor-honest posture with no implied affiliation.
- **Avoid (category ruts):** generic corporate-consulting layouts; neon / sci-fi AI
  visuals (glowing grids, gradients, robot imagery); aggressive CTA repetition;
  playful-startup styling; and literal circuit-board decoration from the J mark.

## Selected direction — The Standing Statement

A confident, letterpress-inspired editorial homepage. Jamula's three offerings are
set as a single typographic standing statement, then **split into three specimen
paths** — AI strategy, custom software, cloud consulting — each explained on its own
terms, and **recombined into one continuous strategy-to-execution story**. The
letterpress-editorial world carries authority and calm rather than sales pressure.

**Direction provenance (deterministic concept-seed):**
- Selected by Cyrus Jamula (issue #42 approval comment).
- Seed key: `6fe54e8e`.
- Committed staging: `spatial-navigation-split-spectrum-corridors`.

### First viewport

The offering stated once, in type, as a set editorial masthead — the strategy-to-
execution thesis demonstrated typographically, not trapped in a generic hero or card
shell. The J mark appears small, as a pressed maker's mark. No dominant CTA.

### Visitor path

Standing statement → the statement divides into three legible specimen paths, each
teaching one offering with honest, education-first framing → the three recombine into
a single "strategy carried through to execution" close → one quiet, accessible
contact path.

### Memorable moment (split / recombine)

The divergence and rejoining of the three specimen paths — three columns of set type
that separate to be read individually, then resolve back into one line. It reads as
structure first, so it survives with motion disabled.

### Responsive and reduced-motion behavior

- **Responsive:** the three specimen paths stack to a single column on narrow
  viewports and recombine as a stacked closing statement; type scales with `clamp()`;
  any letterpress texture must never reduce text contrast or legibility.
- **Reduced motion:** the split/recombine is expressed through layout and typography
  and is fully legible with no animation. Motion is an enhancement only, gated by
  `prefers-reduced-motion`, from an already-visible default.

## Content dependencies

- Final public wording for the offering categories and any claim — review-gated and
  owner-approved; none is approved for publication yet.
- A self-hosted display/text typeface whose character fits the letterpress-editorial
  voice, with tracked licensing/provenance (Uhura for copy/media, Sarek for rights).
- An accessible contact mechanism/route — not built yet and not yet specified.

## Unresolved decisions

- Durable rendering/CMS/framework/host platform is open (ADR-001); this brief must not
  assume the current Astro/Azure setup is permanent.
- The contact path (route, form vs. mailto, fields) is undecided.
- Final typeface selection and license are unresolved.
- Exact published copy for offerings, positioning, and any claim is pending review.
- Build execution path (comp-led vs. code-led) follows the Impeccable config default;
  DESIGN.md is deferred until the built world is verified.
