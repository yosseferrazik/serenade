---
name: Gencat Web Style
description: Apply the visual style of the Generalitat de Catalunya websites (web.gencat.cat) to an interface. Use for institutional, accessible, flat design with Open Sans, the red/yellow/black palette, rectangular controls, white cards on grey, and a senyera-inspired logo.
---

# Gencat Web Style

Visual language extracted from <https://web.gencat.cat/ca/inici> and its public CSS (design tokens `--color-primary-*`, `--color-secondary-*`, `--color-grey-*`). Apply it when a project must look like a Catalan public-administration site.

## Principles

- Institutional, flat and sober. No gradients, glass effects, neon colors or decorative blobs.
- White content on a grey page (`#ececec`), dark chrome (`#333`), red as the only strong accent, yellow used sparingly.
- Rectangular geometry: 2–4 px radii. Borders are 1 px `#ddd`. Shadows are minimal.
- One typeface: Open Sans. Regular 400 for body, semibold 600 for labels and buttons, bold 700 for headings.
- Large headings use negative tracking (−0.3 to −0.7 px) and tight line-height (1.1–1.3).
- Content links are blue and underlined. Focus rings are bright blue.

## Tokens

```css
--color-primary-100: #f2cccc;
--color-primary-300: #d96666;
--color-primary-500: #c00000; /* main red */
--color-primary-600: #900000;
--color-primary-700: #660000;
--color-secondary-100: #fef9e7;
--color-secondary-300: #f9e79f;
--color-secondary-600: #f1c40f; /* yellow */
--color-secondary-800: #b7950b;
--color-grey-100: #f5f5f5;
--color-grey-200: #f2f2f2;
--color-grey-300: #dddddd;
--color-grey-400: #939393;
--color-grey-500: #777575;
--color-grey-600: #6e6e6e;
--color-grey-700: #333333;
--color-foreground: #202020;
--color-background: #ececec;
--color-link: #2020e0;
--color-focus: #1e87e7;
```

Semantic pairs (background 300 / text 700): red `#fbeeed`/`#dd0404`, orange `#fff5e1`/`#bc5000`, green `#eaf9ea`/`#3f7200`, blue `#ecf9fb`/`#006db5`, purple `#f5ecff`/`#7320c2`.

## Typography

```css
font-family: "Open Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
```

| Role | Size | Weight | Line-height |
| --- | --- | --- | --- |
| Display / h1 | 3rem | 700 | 1.1 |
| h2 | 2rem | 700 | 1.2 |
| h3 | 1.5rem | 700 | 1.3 |
| Body | 1rem | 400 | 1.5 |
| Small / meta | 0.875rem | 400 | 1.4 |
| Label / caption | 0.75rem | 600 | 1.3 |

Uppercase labels: 0.7–0.8 rem, weight 700, tracking 0.06–0.1 em.

## Layout

- Max width 1200–1280 px, gutters 16–24 px, section spacing 3.5 rem.
- Header, top to bottom:
  1. Slim utility bar: `#333` background, `#ddd` 0.75 rem text, white links.
  2. White main bar: logo left, utility actions right, 1 px `#ddd` bottom border.
  3. White navigation: `#333` 600 links; active item gets a 3 px `#c00000` bottom border. Sticky.
- Footer: `#333` background, `#ddd` text, white headings, 4 px `#c00000` top border.
- Content blocks are white panels on `#ececec`, separated by 1 px `#ddd` borders.

## Components

- **Primary button**: `#c00000` background, white text, 2 px radius, 600. Hover `#333`; active `#660000`.
- **Secondary button**: transparent, 1 px `#c00000` border and text. Hover `#333` border and text.
- **Tertiary button**: red text, transparent. Hover `#f5f5f5` background and `#333` text.
- **Inputs/selects**: white, 1 px `#939393`, 2 px radius, 44–48 px height. Focus: `#333` border plus `2px solid #1e87e7` outline with 2 px offset.
- **Chips/filters**: rectangular, 1 px `#ddd`, 600 text. Active: solid `#c00000`, white text.
- **Cards**: white, 1 px `#ddd`, 4 px radius, `0 1px 4px rgba(51,51,51,.15)`. Hover: red border, slightly stronger shadow, no large lift.
- **Section titles**: Open Sans 700; add a 3 px `#c00000` bar above or to the left.
- **Badges**: uppercase 700, 2 px radius. Neutral `#333`; semantic colors use a 300 background with 700 text and a colored dot.
- **Tables/fact sheets**: solid 1 px `#ddd` dividers, uppercase grey labels, 600 values.
- **Focus**: `outline: 2px solid #1e87e7; outline-offset: 3px` on every interactive element.

## Logo

- **Mark**: senyera square. Yellow `#f1c40f` field with four equal horizontal `#c00000` bars and a thin dark edge. No gradients, no rounding beyond 2 px.
- **Wordmark**: lowercase, Open Sans 700, `#202020`, tracking −0.5 px.
- **Descriptor**: uppercase, 0.6 rem, 600, `#777575`, tracking 0.12 em.
- **Inverse** (dark footer): white wordmark, `#ddd` descriptor.
- **Favicon**: the senyera mark alone.

## Motion and accessibility

- Transitions 150–200 ms ease. No parallax, no looping decoration.
- Respect `prefers-reduced-motion`.
- Minimum 44 px touch targets, visible focus, semantic landmarks, AA contrast.
- Never rely on color alone: pair semantic colors with text or an icon.

## Don'ts

- No serif display faces, neon greens, gradients, blur, pill buttons, oversized radii or dark-first palettes.
- Do not use red for large backgrounds; it is an accent.
- Do not center long body text.
