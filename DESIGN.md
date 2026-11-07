---
name: Jamula.net — Woven Plane
description: Flat architectural bands cross around Jamula's integrated offer.
colors:
  deep: "#162d32"
  cloth: "#d9e8e2"
  sage: "#98c9bc"
  ochre: "#e7b666"
  white: "#f7f8f2"
typography:
  display:
    fontFamily: '"Aptos Display", "Segoe UI", "Helvetica Neue", Arial, sans-serif'
    fontSize: "clamp(2.15rem, 1.15rem + 5.2vw, 5.5rem)"
    fontWeight: 720
    lineHeight: 0.98
    letterSpacing: "-0.045em"
  heading:
    fontFamily: "{typography.display.fontFamily}"
    fontSize: "clamp(1.8rem, 1.15rem + 2.5vw, 3rem)"
    fontWeight: 650
    lineHeight: 1.04
    letterSpacing: "-0.045em"
  body:
    fontFamily: '"Aptos", "Segoe UI", "Helvetica Neue", Arial, sans-serif'
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.62
    letterSpacing: "normal"
  label:
    fontFamily: '"Aptos", "Segoe UI", "Helvetica Neue", Arial, sans-serif'
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.28
    letterSpacing: "0.08em"
rounded:
  sm: "0"
  md: "0"
spacing:
  "1": "0.25rem"
  "2": "0.5rem"
  "3": "0.75rem"
  "4": "1rem"
  "6": "1.5rem"
  "8": "2rem"
  "12": "3rem"
  "16": "4rem"
  "24": "6rem"
components:
  nav-link:
    textColor: "{colors.cloth}"
    typography: "{typography.label}"
    padding: "0.25rem 0"
  woven-band:
    backgroundColor: "{colors.cloth}"
    textColor: "{colors.deep}"
    padding: "clamp(1.5rem, 4.5vw, 3rem)"
  analytics-button:
    backgroundColor: "{colors.cloth}"
    textColor: "{colors.deep}"
    padding: "0.5rem 1rem"
---

# Jamula.net Design System — Woven Plane

> This file describes the built visual system for Jamula's public website.
> Homepage-specific order and composition live in
> `.impeccable/surfaces/www-src-pages-index-astro.md`; product truth lives in
> `PRODUCT.md`. Tokens are normative and map to `www/src/styles/tokens.css`.

## Overview

The site is a **Woven Plane**: flat architectural bands cross and continue
around Jamula's integrated AI strategy, custom software, and cloud consulting
offer. Its grammar is broad, matte fields in deep teal, pale cloth, and sage,
joined by a single ochre seam. Typography is clean, confident, and system-led.
There are no cards, gradients, glass, neon, or circuit decoration.

The public page uses the same palette in two readings: deep teal establishes
the field; pale cloth and sage planes carry text and service detail. The home
page's crossing is one composition, not the global template for every route.
The approved small Jamula `J` is the only brand image. No external fonts or new
imagery are used.

## Colors

| Role    | Value     | Use                                                       |
| ------- | --------- | --------------------------------------------------------- |
| `deep`  | `#162d32` | Page ground, dark fields, primary text on light bands     |
| `cloth` | `#d9e8e2` | Main offering plane, synthesis band, light service fields |
| `sage`  | `#98c9bc` | Crossing bands, alternate service field, next-step close  |
| `ochre` | `#e7b666` | Narrow structural seam and control underline              |
| `white` | `#f7f8f2` | Highest-emphasis text on the deep ground                  |

Use deep text on cloth and sage, and cloth or white text on deep teal. Ochre is
structural, not a text color. Deep against cloth measures 11.40:1, deep against
sage 7.84:1, deep against white 13.51:1, cloth against deep 11.40:1, and white
against deep 13.51:1. These text pairings exceed WCAG AA.

## Typography

System sans faces keep the page fast and CSP-compatible while lending the offer
a direct, contemporary voice. Display headings use
`"Aptos Display", "Segoe UI", "Helvetica Neue", Arial, sans-serif`; body and
navigation use `"Aptos", "Segoe UI", "Helvetica Neue", Arial, sans-serif`.
No font files are downloaded.

- **Display offer:** responsive `clamp(2.15rem, 1.15rem + 5.2vw, 5.5rem)`,
  weight 720, line-height 0.98, tracking −0.045em.
- **Section headings:** responsive `clamp(1.8rem, 1.15rem + 2.5vw, 3rem)`,
  weight 650.
- **Body:** 1.0625rem / 1.62; large explanatory passages use 1.1875rem.
- **Labels:** 0.875rem, bold, uppercase, and lightly tracked. They orient
  sections without functioning as decorative eyebrows above the offer.

## Layout

- Shared content max-width is 74rem. The homepage uses 1.5rem side gutters,
  reduced to 1rem on narrow viewports.
- Desktop opening: a top horizontal band, left rail, prominent cloth offer
  plane, deep-teal explanatory side band, and lower return band make a crossing.
- The integrated synthesis occupies the next section immediately, before the
  three service paths. Services are full-width alternating planes in a vertical
  sequence, never a set of cards.
- At tablet widths the opening compresses to two columns; at 42rem and below it
  becomes an offset spine with short horizontal seams. Content stays in reading
  order and wraps at 320px and 200% zoom.
- Homepage, CSS, image, and network budgets remain those previously set for
  the site: HTML ≤20 KB; CSS ≤20 KB; no added homepage JavaScript; no downloaded
  fonts; homepage image ≤5 KB; no third-party request before consent. Existing
  shared analytics consent behavior is retained.
- **Measured on the built homepage:** HTML 14,790 bytes raw / 4,318 gzip; CSS
  15,298 raw / 3,562 gzip across two files; existing shared consent script
  8,606 raw / 2,822 gzip; approved `J` mark 1,131 bytes. No new homepage
  JavaScript, downloaded fonts, or requests before consent.

## Elevation & Depth

There is no elevation or shadow. Broad, flat color planes and visible seams
create the crossing; depth does not depend on blur, transparency, or motion.

## Shapes

Square edges throughout. The canvas is constructed from rectangular bands,
solid fills, and thin or heavy seams. No rounded card chrome, framed tiles, or
decorative shadows.

## Components

- **Site header:** deep ground, small approved `J` mark and Jamula wordmark at
  left; real homepage section links at right. Links gain an ochre bottom seam
  on hover. The layout wraps into a stacked brand/navigation arrangement.
- **Crossing offer:** a semantic `h1` and supporting sentence on the dominant
  cloth plane. CSS-only bands surround it; all decoration is hidden from
  assistive technology.
- **Synthesis:** a pale continuous field immediately following the offer, with
  a strong heading and readable two-paragraph explanation.
- **Service paths:** semantic sections with headings, paragraphs, and lists.
  Their flat cloth/sage bands are separated by a seam, not individual card
  shells.
- **Passages and next step:** open text sections on the deep ground, closing in
  a sage field with the existing mail link.
- **Site footer and consent:** shared copyright baseline and the existing
  analytics choice controls. Buttons use square pale fills with an ochre
  lower seam; disabled and hidden states remain distinguishable.
- **Keyboard:** the skip link and `:focus-visible` keep a high-contrast,
  3px outline with offset. Hover is not the only signal.
- **Motion:** no content depends on animation; reduced-motion users see the
  same complete layout.

## Do's and Don'ts

**Do**

- Let the integrated offer remain the first and strongest message.
- Use offset bands to show continuity and crossing, not separate product tiles.
- Keep each field matte and flat; use ochre only as a narrow seam.
- Preserve semantic HTML, working anchors, keyboard focus, reflow, and contrast.
- Keep copy and claims unchanged unless separately approved.

**Don't**

- Reintroduce cards, rounded panels, gradients, glass, glow, neon, or generic
  circuit motifs.
- Add imagery, third-party fonts, decorative icons, new contact channels, or
  unapproved claims.
- Put text on ochre or rely on color alone for meaning.
- Hide or move essential copy behind motion.
