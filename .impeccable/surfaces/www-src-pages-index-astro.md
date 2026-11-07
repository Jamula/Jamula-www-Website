---
version: 1
slug: "www-src-pages-index-astro"
primary_target: "www/src/pages/index.astro"
related_targets:
  [
    "route:/",
    "www/src/layouts/BaseLayout.astro",
    "www/src/styles/tokens.css",
    "www/src/styles/base.css",
    "www/src/components/SiteHeader.astro",
    "www/src/components/SiteFooter.astro",
  ]
---

# Homepage — Woven Plane

Route-specific strategy for Jamula.net's public homepage. Product truth remains
in PRODUCT.md; the durable visual system is documented in root DESIGN.md.

## Scope and visitor mode

- **Primary surface:** `www/src/pages/index.astro` (route `/`).
- **Related implementation:** shared site header/footer, tokens, and base styles.
- **Mode:** Persuade with an education-first, no-hard-sell posture.
- **Audience and job:** organizations exploring AI and general visitors learning
  about Jamula should understand the integrated offer and reach its existing
  contact path.
- **Action posture:** clarity first; the existing contact path closes the page
  without adding a dominant sales action.

## Content and constraints

- Preserve homepage copy verbatim; only its order and semantic placement change.
- Preserve `mailto:spam@jamula.net`, canonical `jamula.net` metadata, social and
  structured data, consent component, host policy, static Astro output, and CSP.
- Use only the approved small Jamula `J` mark. Do not add imagery, outside
  fonts, third-party requests, dependencies, capabilities, claims, or founder
  facts. Testimonials, results, metrics, prices, awards, certifications, and
  affiliation claims remain excluded.
- Preserve keyboard operation, focus visibility, semantic content, AA contrast
  as an engineering target, 320px/200% reflow, and reduced-motion behavior.

## Approved direction and composition

**Woven Plane — woven architectural bands.** The opening makes the offer legible
inside a flat, offset crossing rather than a standard hero or card system. The
integrated explanation follows immediately, ahead of all three detailed
service paths.

- **Composition approval:** `.impeccable/mocks/woven-compositions.html`,
  **C · The crossing**. The study's colors and exact text layout are not copied;
  the approved production palette and copy govern.
- **Direction seed:** `5acca6c6`, exactly as provided by the direction-choice
  task; no independent provenance is claimed here.
- **First viewport:** “AI strategy. Custom software. Cloud consulting.” and
  “Together — not as separate projects.” share the dominant pale plane;
  offset top/left/bottom bands and an ochre seam cross around that offer. The
  existing lead explanation sits in a deep-teal side band.
- **Visitor path:** crossing offer → integrated synthesis → AI Strategy,
  Custom Software, and Cloud Consulting → AI approach → About → existing next
  step and mail link.
- **Memorable moment:** flat bands interlace around the combined offer; the
  synthesis immediately below resolves the crossing before the separate paths.

## Material inventory and implementation commitments

| Ingredient / hierarchy                                                                   | Medium                                                         |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Small `J` and Jamula wordmark; section navigation                                        | Existing favicon asset plus semantic HTML/CSS                  |
| Three-line offer and together statement; dominant scale                                  | Semantic `h1`/paragraph with responsive CSS typography         |
| Top band, vertical rail, crossing offer, side explanation, lower return band, ochre seam | Semantic wrapper and decorative CSS flat geometry              |
| Immediate synthesis, then three service paths                                            | Semantic sections, headings, lists, and CSS band fields        |
| Method, About, next step                                                                 | Semantic HTML with shared woven rules and palette              |
| Focus, hover, disabled, and hidden control states                                        | Native controls and CSS; existing consent component retained   |
| Header, navigation, legal footer and analytics consent                                   | Shared semantic Astro components, CSS, existing consent script |

At narrow widths, the crossing becomes an offset spine with short horizontal
seams, then the synthesis and services stack in reading order. At 320px, bands
compress without clipping content; at 200% zoom the same semantic order is
preserved. No text depends on motion.

## Unresolved decisions

- The existing analytics consent mechanism and mailto contact path are retained;
  no new interaction or channel is introduced.
- No new route-level product claims or assets are in scope.
