---
name: Jamula.net — The Standing Statement
description: A letterpress type-specimen system for Jamula's public homepage — green press-ink on proofing-stock paper.
colors:
  paper: "#e9e7df"
  paper-deep: "#e0ddd1"
  ink: "#1b1a16"
  ink-soft: "#4a463c"
  press: "#245a3a"
  press-strong: "#17402a"
  rule: "#b8b4a6"
  rule-ink: "#2c2920"
  paper-dark: "#17160f"
  paper-deep-dark: "#201e15"
  ink-dark: "#e9e7df"
  ink-soft-dark: "#a8a394"
  press-dark: "#63bd8d"
typography:
  display:
    fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Palatino, "URW Palladio L", "Sorts Mill Goudy", Georgia, "Times New Roman", serif'
    fontSize: "clamp(2rem, 1rem + 6.2vw, 5.75rem)"
    fontWeight: 600
    lineHeight: 0.98
    letterSpacing: "-0.02em"
  heading:
    fontFamily: "{typography.display.fontFamily}"
    fontSize: "clamp(1.7rem, 1.1rem + 2.6vw, 3rem)"
    fontWeight: 600
    lineHeight: 1.06
    letterSpacing: "-0.02em"
  body:
    fontFamily: "{typography.display.fontFamily}"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.62
    letterSpacing: "normal"
  label:
    fontFamily: "{typography.display.fontFamily}"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.28
    letterSpacing: "0.18em"
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
  next-action:
    textColor: "{colors.press}"
    typography: "{typography.label}"
    padding: "0"
  specimen-tick:
    backgroundColor: "{colors.press}"
    width: "1rem"
    height: "2px"
  recombine-band:
    backgroundColor: "{colors.paper-deep}"
    textColor: "{colors.ink}"
    padding: "4rem 2rem"
---

# Jamula.net Design System — The Standing Statement

> This file describes the **built** homepage world (`www/src/pages/index.astro`
> and its shared shell), not an aspiration. Product truth lives in `PRODUCT.md`;
> the durable per-route strategy lives in
> `.impeccable/surfaces/www-src-pages-index-astro.md`. Tokens above are
> normative and map 1:1 to `www/src/styles/tokens.css`.

## Overview

The homepage is a **letterpress type specimen**. Jamula's one offer — AI
strategy, custom software, and cloud consulting, delivered together — is set
once as a standing statement, split into three legible specimen paths, and
recombined into a single strategy-to-execution close. The world carries
authority through set type and pressed rules rather than sales pressure: no
cards, no gradients, no glass, no glow, no page-wide circuit motif.

The single non-neutral ink is a deep **press-green** derived from the approved
Jamula mark. It is used deliberately — over the terracotta/red default of
generic AI editorial layouts — so the accent stays brand-honest.

Two schemes are two physical readings of the same press:

- **Light — positive impression:** warm near-black ink pressed into cool
  proofing-stock paper.
- **Dark — proof pull:** the paper reversed out of an inked field, with the
  press-green lifted so it holds on the dark ground.

## Colors

Semantic roles (see `tokens.css` for the `--j-*` variable names). Every pairing
below is measured against WCAG 2.2.

**Light (positive impression)**

| Role | Value | On paper (`#e9e7df`) |
| --- | --- | --- |
| `ink` (body) | `#1b1a16` | 14.5:1 |
| `ink-soft` (secondary/labels) | `#4a463c` | 7.6:1 |
| `press` (accent, links, marks) | `#245a3a` | 6.6:1 |
| `rule` (hairlines) | `#b8b4a6` | structural, non-text |
| `rule-ink` (heavy rules) | `#2c2920` | structural, non-text |

On the `paper-deep` recombine band (`#e0ddd1`): ink 13.1:1, ink-soft 6.9:1,
press 6.0:1.

**Dark (proof pull)**

| Role | Value | On field (`#17160f`) |
| --- | --- | --- |
| `ink` (body) | `#e9e7df` | 14.5:1 |
| `ink-soft` | `#a8a394` | 7.3:1 |
| `press` | `#63bd8d` | 7.9:1 |

Color is committed at page scale as ink-and-paper fields, never as accents
scattered over a neutral ground. `::selection` is press-green with paper text.

## Typography

One face does the work: a **bookish oldstyle serif** system stack (Iowan Old
Style → Palatino → Book Antiqua → Georgia → serif). No web fonts are downloaded
— the specimen voice comes from set type, not a loaded display face, which also
keeps the font budget at zero and satisfies the site CSP (`font-src 'self'`).

- **Standing statement (`display`)** — `clamp(2rem, 1rem + 6.2vw, 5.75rem)`,
  weight 600, line-height 0.98, tracking −0.02em. Each offering line ends in a
  small green terminal mark that foreshadows its specimen path.
- **Section headings (`heading`)** — `clamp(1.7rem, 1.1rem + 2.6vw, 3rem)`.
- **Body** — 1.0625rem / 1.62, oldstyle proportional numerals, measure capped
  at ~34rem in specimen columns and ~60ch in passages.
- **Labels** — the same serif in **letterspaced all-small-caps** (`0.18em`),
  used for the quiet marks above each section and the maker's mark row.

## Layout

- Content max-width `74rem`, centered, with `1.5rem` inline gutters
  (`1rem` at ≤32rem).
- **The split:** a 3-column grid of specimen corridors separated by 1px
  hairline rules, hung beneath a 3px heavy rule. Columns collapse to a single
  stacked column at ≤52rem; the corridors then read top-to-bottom. The
  split/recombine is expressed entirely through layout and type, so it remains
  understandable in a single column and with motion disabled.
- **The recombine:** a full-bleed `paper-deep` band whose top edge is a heavy
  rule, with three short green corridors converging into it (one at ≤52rem).
- Verified free of horizontal overflow at 320px, 768px, and 1440px, and at
  200% zoom.

## Elevation & Depth

None. This world has **no shadows and no elevation** — depth is the physical
impression of ink and rule on paper. `--j-shadow-sm` resolves to `none` and is
retained only for token compatibility. Structure is carried by rule weight:
hairline `1px`, medium `2px`, heavy `3px`.

## Shapes

Square. All radii are `0` — letterpress has no rounded chrome. Forms are
rules, fields, and set type. The bullet in specimen lists is a short green
**press-tick** (a 1rem × 2px bar), not a dot; list markers use `list-style:
none` with the tick drawn via `::before`.

## Components

- **Site header** — a flat colophon bar closed by a heavy `rule-ink` rule.
  Wordmark set in letterspaced small-caps; not sticky, so the page masthead
  owns the top.
- **Site footer** — legal-baseline colophon (small-caps mark + copyright)
  above a heavy rule. The previous placeholder `/privacy` and `/legal` links
  were removed because those routes do not exist and are out of scope; restore
  them only when approved legal/privacy pages ship.
- **Masthead** — pressed maker's mark (the approved favicon `J`, ~1.75rem,
  `alt=""` since the wordmark is adjacent) + wordmark; then the standing
  statement; then the green `Together — not as separate projects.` close and a
  lead paragraph. No dominant call to action.
- **Specimen path** — small-caps label, `heading`, body, a rule-topped
  “What this engagement includes” list with green press-ticks.
- **Next step** — an educational, on-page close. The one link is a same-page
  anchor back to the recombine (`#synthesis`), set in small-caps. There is no
  contact form, email, or action URL on the page.

**Focus & motion (sidecar behavior, not frontmatter):**

- **Focus:** `:focus-visible` draws a 3px solid `press` outline at 3px offset —
  a pressed ink outline, never a glow.
- **Motion:** one authored moment, gated by `prefers-reduced-motion:
  no-preference` and layered only on decorative ink — the green terminal marks
  press in (`scaleX`) and the three corridors draw down (`scaleY`). Text is
  never hidden or moved, so the page reads fully from an already-visible
  default and is complete with motion disabled.

## Do's and Don'ts

**Do**

- Let set type and pressed rules carry hierarchy; add space above a heading,
  less below.
- Keep the press-green as the single accent, tied to the mark.
- Use the maker's mark small and once, as a pressed mark.
- Measure contrast independently in both schemes before shipping a new pairing.

**Don't**

- Add cards, gradients, glass, glow/neon, rounded chrome, or drop shadows.
- Enlarge the `J` mark into page-wide circuit-board decoration.
- Download web fonts or add client JavaScript, trackers, or third-party
  requests (the homepage ships **zero** of each).
- Hide content behind an entrance animation, or rely on motion to make a
  layout legible.

## Performance budgets (measured on the built homepage)

| Asset | Budget (raw) | Measured (raw / gzip) |
| --- | --- | --- |
| HTML (`index.html`) | ≤ 20 KB | 13.4 KB / 4.0 KB |
| CSS (all, 2 files) | ≤ 20 KB | 13.1 KB / 3.3 KB |
| Client JS | **0 KB (hard)** | 0 KB |
| Downloaded fonts | **0 (hard)** | 0 (system stack) |
| Homepage images | ≤ 5 KB | 1.1 KB (favicon `J`, only image) |
| Third-party requests | **0 (hard)** | 0 |

Static output only; compatible with the site CSP (`default-src 'self'`,
`font-src 'self'`, `script-src 'self'`).
