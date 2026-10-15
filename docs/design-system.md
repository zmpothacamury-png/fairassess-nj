# FairAssess NJ design system

Built in Prompt 2 (2026-10-14). The look comes from the logo: a house on balance scales over a pale New Jersey outline, blue on the left, green on the right, with a gold pivot point. The feel is balanced, civic, calm, and clear.

- **Source of truth for values:** `site/app/globals.css` (Tailwind v4 `@theme static`).
- **Live style guide:** `/design` on the site. It is not in the nav and is hidden from search engines.
- **Contrast check:** `site/lib/contrast.ts` lists every allowed color pair. `npm test` (in `site/`) fails if any pair drops below WCAG AA.

Rule 9 (CLAUDE.md): components use these tokens only. No hex colors in components. Tailwind's default palette is switched off (`--color-*: initial`), so classes like `bg-red-500` don't exist.

---

## 1. Colors

### Sampled from the logo

Measured with Python + Pillow in two ways: k-means clustering of the solid (non-edge) pixels, and the median color inside each named part of the logo. `brand/logo-full.png` and `brand/Logo.jpg` gave the same answers.

| Token | Zaden's estimate | Sampled (used) | Where |
|---|---|---|---|
| navy-700 | #14446E | **#10456B** | Letters of "FAIRASSESS" |
| blue-600 | #25598F | **#20608C** | Left roof |
| sky-400 | #5C9CC5 | **#5195B8** | Left pan fill |
| green-600 | #5E9A5C | **#58915E** | Right roof and chimney |
| gold-400 | #E3BD4F | **#E1BC55** | Pivot dot, right pan |
| outline-200 | #C3D2E0 | **#C3D1DE** | NJ outline |
| mist-50 | #F3F6F9 | **#F5F7FA** | Background of Logo.jpg |

### All tokens

| Token | Hex | Use it for | Don't use it for |
|---|---|---|---|
| navy-900 | #0B2F4C | Headings, page header and CTA band backgrounds, dark surfaces | — |
| navy-700 | #10456B | Wordmark, strong labels, primary button hover | — |
| blue-600 | #20608C | Primary buttons, links, eyebrows, focus rings, "assessed value" in charts | — |
| blue-100 | #E3EDF5 | Blue tint: footer background, "possibly under-assessed" results, hover backgrounds | Text |
| sky-400 | #5195B8 | Secondary fills (like the logo's left pan) | Text (3.3:1, fails) |
| green-600 | #58915E | "Fair" and "market value / sale price" fills, chart marks, borders | Text (3.7:1, fails) |
| green-700 | #3F7346 | Green **text** and icons ("Within the normal range") | — |
| green-100 | #E5F0E4 | Green tint: "within range" results | Text |
| gold-400 | #E1BC55 | The balance point: dots, highlights, reference lines, active-tab underline, focus ring on dark | **Text on light backgrounds (1.8:1)** |
| gold-700 | #8A6A14 | Gold **text** and icons ("May have grounds to appeal") | — |
| gold-100 | #FBF3DC | Gold tint: "may have grounds" results | Text |
| outline-200 | #C3D1DE | Card borders, dividers, table rules, the NJ outline; text on navy surfaces | Form-control borders (1.6:1, fails 3:1) |
| mist-50 | #F5F7FA | Page background | — |
| white | #FFFFFF | Cards, header | — |
| ink-800 | #1F2A37 | Body text | — |
| ink-600 | #4A5868 | Secondary text, captions, form-control borders | — |
| gray-100 | #EEF1F4 | "Not enough data" background, skeleton loaders | Text |

Restraint: pages are mostly white, mist, and navy. Blue, green, and gold carry meaning (assessed vs. market value, fair vs. caution, the balance point). They are not decoration.

### Checker result colors (no red)

The brand has no red, and we inform rather than alarm. Every status has its own icon **and** words, so color is never the only signal.

| Result | Background | Icon | Text |
|---|---|---|---|
| Within the normal range | green-100 | green-700, circle-check | navy-900 |
| May have grounds to appeal | gold-100 | gold-700, circle-alert | navy-900 |
| Possibly under-assessed | blue-100 | blue-600, info | navy-900 |
| Not enough data | gray-100 | ink-600, circle-help | ink-800 |

Form errors follow the same rule: navy text with a gold-700 alert icon.

---

## 2. Contrast table (WCAG 2.1 AA)

Normal text needs 4.5:1. Large text, icons, borders, focus rings, and chart marks need 3:1. Generated from `site/lib/contrast.ts`, the same list the test checks.

| Foreground | Background | Used for | Ratio | Needs | Result |
|---|---|---|---|---|---|
| navy-900 | white | Headings | 13.77:1 | 4.5:1 | Pass |
| navy-700 | white | Wordmark, strong labels | 10.07:1 | 4.5:1 | Pass |
| ink-800 | white | Body text | 14.54:1 | 4.5:1 | Pass |
| ink-600 | white | Secondary text | 7.27:1 | 4.5:1 | Pass |
| blue-600 | white | Links, eyebrows | 6.75:1 | 4.5:1 | Pass |
| green-700 | white | "Fair" text | 5.60:1 | 4.5:1 | Pass |
| gold-700 | white | Caution icons and text | 5.06:1 | 4.5:1 | Pass |
| ink-600 | white | Input borders | 7.27:1 | 3:1 | Pass |
| navy-900 | mist-50 | Headings | 12.83:1 | 4.5:1 | Pass |
| navy-700 | mist-50 | Wordmark, strong labels | 9.38:1 | 4.5:1 | Pass |
| ink-800 | mist-50 | Body text | 13.54:1 | 4.5:1 | Pass |
| ink-600 | mist-50 | Secondary text | 6.78:1 | 4.5:1 | Pass |
| blue-600 | mist-50 | Links, eyebrows | 6.29:1 | 4.5:1 | Pass |
| green-700 | mist-50 | "Fair" text | 5.22:1 | 4.5:1 | Pass |
| gold-700 | mist-50 | Caution icons and text | 4.71:1 | 4.5:1 | Pass |
| ink-600 | mist-50 | Input borders | 6.78:1 | 3:1 | Pass |
| navy-900 | green-100 | Within range: text | 11.75:1 | 4.5:1 | Pass |
| green-700 | green-100 | Within range: icon, label | 4.77:1 | 4.5:1 | Pass |
| navy-900 | gold-100 | May have grounds: text | 12.43:1 | 4.5:1 | Pass |
| gold-700 | gold-100 | May have grounds: icon, label | 4.56:1 | 4.5:1 | Pass |
| navy-900 | blue-100 | Possibly under-assessed: text | 11.60:1 | 4.5:1 | Pass |
| blue-600 | blue-100 | Possibly under-assessed: icon, label | 5.68:1 | 4.5:1 | Pass |
| ink-800 | gray-100 | Not enough data: text | 12.82:1 | 4.5:1 | Pass |
| ink-600 | gray-100 | Not enough data: icon, label | 6.42:1 | 4.5:1 | Pass |
| white | blue-600 | Primary button | 6.75:1 | 4.5:1 | Pass |
| white | navy-700 | Primary button hover | 10.07:1 | 4.5:1 | Pass |
| white | navy-900 | Page header and CTA band headings | 13.77:1 | 4.5:1 | Pass |
| ink-800 | blue-100 | Footer body text and links | 12.25:1 | 4.5:1 | Pass |
| ink-600 | blue-100 | Footer disclaimer and credit | 6.13:1 | 4.5:1 | Pass |
| navy-700 | blue-100 | Footer wordmark and tagline | 8.49:1 | 4.5:1 | Pass |
| outline-200 | navy-900 | Text on navy surfaces | 8.85:1 | 4.5:1 | Pass |
| gold-400 | navy-900 | Gold accent on dark only | 7.56:1 | 4.5:1 | Pass |
| navy-900 | gold-400 | Text on a gold fill | 7.56:1 | 4.5:1 | Pass |
| blue-600 | white | Chart: assessed value | 6.75:1 | 3:1 | Pass |
| green-600 | white | Chart: sale / market value | 3.73:1 | 3:1 | Pass |
| blue-600 | mist-50 | Focus ring | 6.29:1 | 3:1 | Pass |
| blue-600 | white | Focus ring | 6.75:1 | 3:1 | Pass |
| gold-400 | navy-900 | Focus ring on dark surfaces | 7.56:1 | 3:1 | Pass |

**Not allowed** (the test also checks that these really fail):

| Foreground | Background | Why | Ratio |
|---|---|---|---|
| gold-400 | white / mist-50 | Gold text on light backgrounds. Use gold-700. | 1.82:1 / 1.70:1 |
| green-600 | white | Logo green as text. Use green-700. | 3.73:1 |
| sky-400 | white | Sky blue as text. Fills only. | 3.31:1 |
| outline-200 | white | As a form-control border. Use ink-600. | 1.56:1 |

---

## 3. Typography

- **Headings:** Montserrat 700 and 800 (via `next/font`), class `font-heading`. Matches the logo's geometric all-caps wordmark.
- **Eyebrow labels:** the `eyebrow` utility: Montserrat 700, uppercase, letter-spacing 0.08em, 14px. Usually `text-blue-600`. Like the logo's tagline.
- **Body and UI:** Inter 400, 500, 600 (via `next/font`), the default `font-sans`.
- **Numbers:** every statistic and dollar amount uses `tabular-nums` so columns line up. Table number cells use `class="num"`.
- **Line length:** about 65 characters (`max-w-prose`).

**Type scale:** 18px body, each step ×1.25, rounded to whole pixels. Tailwind's default sizes are switched off, so only these exist:

| Class | Size | Use |
|---|---|---|
| text-4xl | 55px | Home hero heading |
| text-3xl | 44px | Page heading, big stats |
| text-2xl | 35px | Section heading (h2) |
| text-xl | 28px | Sub-heading (h3) |
| text-lg | 22px | Lead paragraph, card title |
| text-base | 18px | Body text |
| text-sm | 14px | Captions, source lines, eyebrows |

---

## 4. Shape, spacing, icons

- **Spacing:** 8px grid. Tailwind's unit is 4px, so use even steps only (`p-2` = 8px, `p-4` = 16px, `p-6` = 24px ...). Section padding is `py-20 sm:py-24`.
- **Content width:** `max-w-content` = 1120px, with `px-6` side padding.
- **Corners** (echo the logo's rounded strokes): `rounded-card` 12px for cards, `rounded-control` 8px for buttons and inputs, `rounded-full` for pills and dots. Default Tailwind radii are switched off.
- **Shadows:** `shadow-soft` for cards, `shadow-raised` for pop-ups and menus. Nothing heavier.
- **Touch targets:** buttons and nav links are at least 48px tall.
- **Icons:** `lucide-react` with `strokeWidth={2}`, matching the logo's even line weight. Decorative icons get `aria-hidden="true"`.
- **Focus:** the `focus-ring` utility (2px blue-600 outline, 2px offset) on every interactive element; `focus-ring-dark` (gold-400) on navy surfaces. The footer is light (blue-100), so it uses `focus-ring`.

---

## 5. Motifs

- **A. Balance divider** (`BalanceDivider`): a thin line, blue-600 on the left half and green-600 on the right, with an 8px gold-400 dot at the center. Goes between major sections. Decorative, so screen readers skip it.
- **B. NJ watermark:** `public/nj-outline.png`, the New Jersey outline from the logo in outline-200, at 50% opacity behind the home hero. It is decorative (`alt=""`, `aria-hidden`).
- **C. Split accent** (`split-accent` utility): a 4px stripe across the top, blue | green. Used on a few key cards (Zaden removed it from the top of the header in Prompt 2B). Drawn as a background stripe, not `border-image`, because `border-image` would recolor every border.

### Chart palette

| Data | Color | Marker |
|---|---|---|
| Assessed value | blue-600 | Squares |
| Sale price / market value | green-600 | Circles |
| Reference lines: the 1.0 fairness line, town average, Chapter 123 range | gold-400 | Dashed line |
| Context data | outline-200 marks, ink-600 labels | Small dots |

Blue and green can look alike to some color-blind readers. Charts must also use different marker shapes and **direct labels**, never color alone. Every chart also needs a text or table alternative (CLAUDE.md rule 11).

---

## 6. Components (`site/components/`)

| Component | What it is |
|---|---|
| `Button` | Primary (blue fill), secondary (outline), ghost (text). Pass `href` for a link. `buttonClasses()` gives the same look to other elements. |
| `Card` | White card, outline border, soft shadow. `accent` adds the split stripe. |
| `StatCard` | Big number + label + one plain-English line + info button + optional "Source:" line. |
| `StatusPill` | The four checker results, plus `neutral` for labels like "In development". |
| `Callout` | Info / caution / success note with an icon and a colored left edge. |
| `Disclaimer` | The exact CLAUDE.md rule 4 text. Exported as `DISCLAIMER_TEXT` too. |
| `SectionHeading` | Eyebrow + title + optional subtitle. `as` sets the heading level. |
| `BalanceDivider` | Motif A. |
| `Term` | A word with a dotted underline that opens a short definition. Works with Enter/Space; Escape closes and returns focus. `InfoButton` is the same pop-up behind an "i" icon. |
| `DataTable` | Keyboard-scrollable wrapper for `.data-table` (sticky header, zebra rows, right-aligned tabular numbers). |
| `Skeleton` | Loading placeholder. Pulses only if the visitor allows motion. |
| `Header` | Logo icon + "FAIRASSESS NJ" as live Montserrat 800 text; tabs Home, Town Rankings, Appeal Checker, Learn (How It Works, Appeal Guide), About; "Check My Assessment" button; menu below 1280px that slides in from the right; current page gets a gold underline and `aria-current`. Format and motion: `docs/site-format.md`. |
| `Footer` | Brand + disclaimer; link columns Site, Tools, Project (Methodology, Privacy, About, Contact, GitHub); "Data as of", source, and independence lines; "Built by Zaden Pothacamury, Ramapo High School." and the tagline. Details: `docs/site-format.md`. |
| `PageHeader`, `CtaBand`, `Reveal`, `ScrollCue` | Page shell and motion pieces from Prompt 2B. See `docs/site-format.md`. |

---

## 7. Logo assets

All made from `brand/Logo.jpg`, the original file. `brand/logo-full.png` was made from it earlier, but its NJ outline had been left part-transparent and looked speckled on dark colors. The originals in `brand/` were not changed.

| File | Size | What |
|---|---|---|
| `site/public/logo-icon.png` | 394×698 | Icon only (house, scales, NJ outline), transparent |
| `site/public/logo-icon-light.png` | 394×698 | Same shape, one light color, for dark surfaces (the footer now uses the full-color icon) |
| `site/public/nj-outline.png` | 1179×2091 | NJ outline only, for the hero watermark |
| `site/app/favicon.ico` | 16, 32, 48 | Browser tab icon |
| `site/app/icon.png` | 512×512 | App icon |
| `site/app/apple-icon.png` | 180×180 | iPhone home-screen icon (mist background, since iOS doesn't do transparency) |
| `site/app/opengraph-image.png` | 1200×630 | Link preview: full logo centered on mist. Alt text in `opengraph-image.alt.txt`. |

Next.js finds the `app/` files by name and adds the right `<link>` and `<meta>` tags. The link-preview address comes from `metadataBase` in `site/lib/site.ts`. On Vercel it uses the production domain automatically, so it follows a custom domain without a code change.

**To rebuild them**, run from the repo root (inside `.venv`):

```powershell
python -m pipeline.brand_assets             # preview in data/interim/brand_assets/
python -m pipeline.brand_assets --install   # also copy into site/app and site/public
```

The script is `pipeline/brand_assets.py`, tested by `pipeline/tests/test_brand_assets.py`.

**How the transparency was made** (so edges are clean, with no pale halo):
1. A 3×3 median filter removes JPEG speckle.
2. The background is estimated separately at each pixel, because Logo.jpg has a soft vignette (near-white center, mist edges).
3. "Palette color-to-alpha": each pixel is matched to the nearest logo color on the line from its local background to that color. On the line, it becomes that exact color with transparency equal to how far along the line it is. Pixels off every line (like the blue/green seam) stay solid.
4. The NJ outline is picked by color, blurred slightly, enlarged 3×, and given a soft threshold so the watermark has smooth edges at large sizes.
5. The icon is cut at the middle of the empty band between the artwork and the wordmark.

The live header uses `logo-icon.png` next to the wordmark written as **text**, so the name stays sharp at every size.
