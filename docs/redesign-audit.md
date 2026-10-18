# Redesign audit (Prompt 10 Part B)

Written 2026-10-18, before any code change. This is Step 2 of Prompt 10 Part B: find what looks weak, say which skill flagged it, and propose a fix. Nothing here changes a number, label, source line, disclaimer, color meaning, the logo, the tabs, or the Trust & Transition motion values.

Screenshots: `docs/screenshots/redesign/before/` (375px and 1280px, full page, taken with reduced motion on so every Reveal block shows).

---

## 1. How the audit was done

| Tool | Command or file | What it gave |
|---|---|---|
| impeccable | `impeccable context`, then the **`audit`** command (`reference/audit.md`) and `impeccable detect --json site/app site/components` | 5-part health score (section 4); detector: 3 findings |
| taste-skill | **redesign-existing-projects** checklist; **design-taste-frontend** `scripts/lint.mjs` (45 files) and `scripts/inspect.mjs` (home, /towns, /towns/bergenfield at 1440/768/390) | lint: 19 FAIL, 10 WARN; inspect: per-page FAIL/WARN lists |
| taste-skill | **high-end-visual-design**, **minimalist-ui** (restraint only) | read as guidance for the marketing sections |
| skills-main | **emil-design-eng**, **apple-design**, **review-animations**, **animation-performance**, **break-ui** | read; used for the component and motion findings below. Full break-ui and review-animations runs happen in Step 4, after the redesign |
| Playwright | screenshot script (scratchpad, not in the repo) | 26 screenshots |
| Lighthouse 12.8.2 | mobile, 2 runs per page, production build | baseline in section 3 |

- **Why `audit` and not `critique`:** impeccable's `critique` must run as two separate sub-agents. `audit` checks the same code in one pass, plus its detector. I will run impeccable's **`polish`** command at the end (Step 4), with a second `audit` to compare scores.
- **impeccable context note:** the project has no PRODUCT.md or DESIGN.md. impeccable treats this as a *refinement* of the existing look (the brand is locked), so it uses the code as the design authority. It offers `impeccable init` afterward. Not needed for this prompt.
- **Two skills-main skills** (`review-animations`, `prototype`) are installed but hidden from the skill menu. I read their SKILL.md files directly from the plugin folder.

---

## 2. Where the skills disagree with this prompt (this prompt wins)

| Skill rule | Prompt / project rule | What I'll do |
|---|---|---|
| taste-skill, soft-skill, minimalist-ui, redesign: "Inter is banned" | Fonts aren't locked, but the wordmark is live Montserrat text | Keep Montserrat. Body font is a **YOU DECIDE** (section 7). |
| taste-skill: no eyebrows, no tiny uppercase labels | The eyebrow mirrors the logo's tagline; site-format uses it | Keep eyebrows, but fewer: drop the "01 · " prefix and keep one eyebrow per section head. |
| taste-skill: no 01/02/03 numbers | site-format checklist: "report-style section numbers (01, 02, 03)" | Keep the numbers on "How it works" (a real ordered list). Drop them from section eyebrows, where they add nothing. |
| taste-skill: no hairlines, no gradients | Balance line and split stripe are brand motifs (Motif A, C) | Keep both. The split stripe is two flat colors, not a fade. Use the balance divider **once per page** at most. |
| taste-skill: 4+ real photos, one video | Rule 5 + site-format: "real data and the logo are the only visuals" | No photos or video. Charts are the pictures. |
| soft-skill: double-bezel cards, pill buttons, glass nav, 800ms blur reveals | Calm civic look; T&T motion locked | Not used. |
| taste-skill / minimalist: no shadows at rest | design-system `shadow-soft` on cards | Remove shadows from static cards (outline + tone step instead). Keep `shadow-raised` for things that float (menus, pop-ups). Clearer, and reads more like a report. |
| minimalist-ui palette | Brand palette locked | Restraint principles only. |
| emil / review-animations: hover motion gated by `(hover: hover)` | Scroll cue hover lift is T&T's | Gate new hover motion. Leave the T&T scroll cue untouched. |

---

## 3. Baseline numbers (before)

| Check | Home | /towns |
|---|---|---|
| Lighthouse mobile performance (run 1 / run 2) | 85 / 95 | 89 / 90 |
| Accessibility | 96 | 100 |
| Best practices | 96 | 100 |
| SEO | 100 | 100 |
| LCP (run 2) | 2.9 s | 3.6 s |
| CLS | 0.000 | 0.000 |

- **Home accessibility 96:** "color-contrast" fails on the two hero buttons. Most likely cause: the hero is wrapped in `Reveal`, so on a phone screen the buttons sit low enough that they load part-transparent.
- **Home best-practices 96:** the hero NJ watermark image is drawn at the wrong aspect ratio.
- **impeccable detect:** 3 warnings, all "thick colored border on one side of a card": `Callout.tsx:29`, `Header.tsx:198` (mobile-menu active item), `WaitlistForm.tsx:63`.
- **taste lint:** 19 FAIL / 10 WARN. Most are locked brand items (section 2). **False positive:** "elevate" (3×) is the CSS variable `--nav-elevate`, not marketing copy.
- **Rule 9 check:** no hex colors in any component. Tokens only.

---

## 4. impeccable audit health score (before)

| # | Dimension | Score | Key finding |
|---|---|---|---|
| 1 | Accessibility | 3 | Hero buttons load part-transparent on phones (Lighthouse contrast fail); chart ticks and scroll cue at 11–12px |
| 2 | Performance | 3 | Mobile LCP 2.9–4.4 s; motion uses transform/opacity; `will-change` left on every Reveal element at rest |
| 3 | Theming | 3 | Full token system, no hex. No dark mode (not in scope). Shadows on static cards break the design system's own "nothing heavier" intent |
| 4 | Responsive | 2 | Scroll cue wraps to 2 lines on phones; /towns scrolls sideways at 768px; /towns is 25,180px tall on a phone (31 screens) |
| 5 | Implementation integrity | 3 | Coherent, brand-specific system. Drift: 4 balance dividers on home, side-stripe callouts, 3 near-identical card rows |
| **Total** | | **14/20** | **Good: fix the weak dimensions** |

**Integrity verdict: pass.** The site is clearly built for this product: the balance motif, real-data stat cards, the forest plot, the source lines. The weak spots are repetition (every section is a box with a border and a shadow) and phone layout, not identity.

---

## 5. Findings by page

Flagged by: **IMP** = impeccable audit/detect · **RD** = taste redesign-existing-projects · **TS** = taste design-taste-frontend (lint/inspect) · **HE** = high-end-visual-design · **MIN** = minimalist-ui · **EMIL** = emil-design-eng · **APL** = apple-design · **RA** = review-animations · **AP** = animation-performance · **BRK** = break-ui · **LH** = Lighthouse · **EYE** = my screenshot review.

### All pages (header, footer, shared)

| Problem | Flagged by | Proposed fix |
|---|---|---|
| "Scroll to explore" pill wraps to two lines on phones and covers the content behind it. Cause: `left: 50%` caps its width at half the screen | EYE, BRK | `white-space: nowrap` on the pill. T&T sizes and motion unchanged |
| Cue and chart text at 10–12px, below the 14px type scale | TS (small-text), IMP | Chart ticks to 13–14px. The cue's 10/11px is a T&T value (locked): leave it, note it |
| Buttons: no press feedback; `transition-colors` only; hover not gated for touch | RD, EMIL, RA, APL | `:active` scale 0.97 over 120ms; hover color only under `(hover: hover)`; list exact properties |
| Every card has border **and** shadow **and** white fill. 3 near-identical card rows per page read as a template | TS (shadow, outlined-box), MIN, RD, IMP | Static cards: outline + tone step, no shadow. Shadow only on pop-ups, menus, sticky header |
| Side-stripe callouts (thick colored left edge) | IMP detect (3×), RD | Full tinted surface + icon + bold title, no stripe. Same tone colors and meaning |
| Headings run 3–5 lines on phones (home CTA band: 5 lines) | TS (headline-lines), APL (tracking) | Fluid sizes with `clamp()`, `text-wrap: balance`, negative tracking on display sizes. Shorter heading text only where a fact isn't lost |
| Large intro paragraphs run 5–6 lines at 22px on phones | TS (statement-length) | Lead text 20px on phones, 22px from `sm` |
| Display headings have no tracking adjustment (0em at 55px) | APL, RD | −0.02em at 35px+, −0.01em at 28px |
| Mobile menu active item uses a 4px side stripe | IMP detect | Gold dot + navy weight, like the desktop underline's meaning |
| Footer: the disclaimer sits right under the page's own disclaimer on most pages (two copies in a row) | EYE | Keep both (rule 4). Make the page copy a quiet "notice" block so the two don't look duplicated by accident |
| Learn menu and Term pop-ups appear instantly; menu chevron rotates with default ease | EMIL, RA | 150ms opacity + scale 0.97 from the trigger corner; reduced motion = fade only |

### Home (`/`)

| Problem | Flagged by | Proposed fix |
|---|---|---|
| Hero buttons fail contrast on first paint on phones (part-transparent from Reveal) | LH, IMP | Show the hero at full opacity on load. Reveal stays on everything below the hero, timing unchanged |
| First screen has no dominant element: 55px headline (3.8vw), logo floats at the right | TS (focal-point), HE | Bigger fluid headline (to about 72px at 1440), tighter tracking; logo larger and anchored |
| NJ watermark lines cross the headline on phones; wrong aspect ratio | EYE, LH | Move it to the right edge on phones, fix sizing |
| 4 stat cards: links and source lines at 4 different heights; summary text (18px) is bigger than the details (14px) | RD (buttons not bottom-aligned), BRK | Pin link + source to the bottom (`mt-auto`); one text size for summary |
| 4 balance dividers between sections | TS, MIN, EYE | One divider at most; separate sections by tone step and space |
| "How it works": three equal boxed cards, 01/02/03 | TS (numbering, icon-cards), RD (3 equal columns) | Keep the numbers (site-format) as a real `<ol>`: three columns, no boxes, big numerals, joined by a thin balance line |
| Rankings preview: a 3-paragraph wall of text before the list | EYE, IMP (cognitive load) | One-sentence intro on the left, the "9 of 48" note in a side note; list rows tighter |
| Founder teaser: one paragraph in a wide empty band | TS (fullness), EYE | Editorial split: heading left, text + buttons right |

### Town Rankings (`/towns`)

| Problem | Flagged by | Proposed fix |
|---|---|---|
| On phones the page is 25,180px tall: 48 cards, each about 330px, showing all 7 numbers | EYE, BRK (huge list) | Compact phone card: name, rank, label, PRB + range. PRD/COD/median/sales/quality behind a "More numbers" disclosure. Nothing removed; table view unchanged on wider screens. **YOU DECIDE 3** |
| One row scrolls sideways at 768px (rankings table) | TS (side-scroll) | Table shows from 1024px; phones and iPads use the cards |
| Forest plot town labels are 11px and wrap ("Upper / Saddle River") on phones | EYE, TS (small-text) | 13px labels, single line, wider label column on phones |
| Intro: dense paragraph + 3 bullets + long paragraph before the first chart | EYE | Same words, split into a 2-column intro (text left, label counts as a small figure list right) |
| "01 · ", "02 · " eyebrows | TS | Drop the numbers; keep the words |

### Town pages (`/towns/[slug]`): Bergenfield (regressive), Fair Lawn (within standards), Closter (limited data), Allendale (no stats)

| Problem | Flagged by | Proposed fix |
|---|---|---|
| The label pill, rank, and sales count sit below a large gap under the header; the summary sentence repeats the header's | EYE, IMP (hierarchy) | Move pill + rank + sales into the page header under the town name |
| Two note callouts side by side end at different heights, and the scroll cue covers them at 1280×800 | EYE | Equal-height grid, tinted surfaces (see callouts) |
| StatCard: "−0.0980" runs into the info button at 1280px | BRK, EYE | Value on its own line with `min-width: 0`; info button sits in the label row |
| StatCard: 5 text sizes inside one card | RD, EMIL | 3 sizes: value, label, small text |
| Chapter 123 box: the 3 key numbers (50.26%, 42.72%, 57.80%) are buried in a sentence; the right half is empty beside the long K14 warning | EYE | Show the three as a figure row (average ratio · lower limit · upper limit) above the same sentence; warning full width |
| Charts: 11–12px ticks; scatter has vertical gridlines too; tooltip unstyled | EYE, TS | 13px ticks, horizontal gridlines only, tooltip in the pop-up style |
| "How our numbers compare" mini cards are 4 more boxes | TS (outlined-box) | Plain figure list on a tone-step panel |
| Allendale (no stats): page is mostly notes; holds up (break-ui pre-check) | BRK | Check in Step 4 |

### Other pages

| Page | Problem | Flagged by | Proposed fix |
|---|---|---|---|
| `/about` | "The Story" is a narrow column with the right half empty at 1280px; 4 promise cards with links at different heights | EYE, RD | Editorial split: heading left (sticky), story right; promise cards with links pinned to the bottom |
| `/contact` | Fine. Form uses a side stripe (detector) | IMP | Tinted surface |
| `/check` | Placeholder (checker UI is a later prompt); 3 cramped columns in AppealBasics | EYE | Spacing and type only. The checker UI prompt does the rest |
| 404 | Page header line + a second divider right under it; buttons float in empty space | EYE | One line; buttons inside a short "Where to go" block |
| `/design` | Shows the old tokens | — | Update after Step 3.1 so it shows the new type scale, spacing, and states |

---

## 6. Prioritized plan

### Must fix
1. Scroll cue wraps on phones (`nowrap`): every page.
2. Hero buttons part-transparent on phones (Lighthouse contrast): hero not wrapped in Reveal.
3. StatCard: value/info collision, 5 text sizes, links/sources not bottom-aligned.
4. Phone headings 3–5 lines: fluid type scale + balance + tracking.
5. /towns sideways scroll at 768px.
6. Chart text under 13px; consistent axes/gridlines/tooltips (Step 3.4).
7. Side-stripe callouts and menu item (impeccable detector).
8. Button press + focus + gated hover states.

### Should fix
9. Foundations: fluid type scale, tracking, line heights, spacing scale, section rhythm; no shadows at rest (tokens + design-system.md).
10. Balance divider at most once per page; tone steps between sections.
11. Home: hero focal point, How it works as a real ordered list, rankings preview intro, founder split.
12. Town page header carries the label, rank, and sales; Chapter 123 figure row; comparison panel.
13. /towns compact phone cards (YOU DECIDE 3) and forest-plot label sizes.
14. About editorial split; 404 cleanup.
15. Pop-up, menu, and chevron motion (150–200ms, from the trigger, reduced-motion fade).

### Nice to have
16. Body font swap (YOU DECIDE 1).
17. Hero prototypes behind a picker (YOU DECIDE 2).
18. Footer: tighter link columns, fewer lines.
19. `/design` page shows every new state (hover, press, focus, disabled).

---

## 7. YOU DECIDE (from the audit)

1. **Body font.** Three skills flag Inter as "the default AI font". Option: **Public Sans**, the U.S. government's own web font (U.S. Web Design System), free on Google Fonts. It says "civic and official" without being flashy and reads well for older homeowners. Montserrat stays for headings and the wordmark. **Recommendation: switch to Public Sans.** Keep Inter if you'd rather not change the feel.
2. **Hero prototypes.** Build 3 home-hero versions behind a dev-only picker (skills-main `prototype`) before choosing: "Refined" (today's layout, bigger type), "Data-led" (headline + the 4 real stat numbers in the first screen, logo smaller), "Editorial" (large headline across the full width, logo as a watermark). **Recommendation: yes.** It's about 1 extra step, and you pick.
3. **/towns on phones.** Compact cards with a "More numbers" disclosure (every number still one tap away). **Recommendation: yes.** (My estimate was "about 12 screens"; the real result is about 24, see section 8.)

---

## 8. After the redesign (Steps 3 and 4)

Zaden delegated YOU DECIDE 1-3 ("You decide based on the best interests of winning the Congressional App Challenge..."). Choices: **1 Public Sans: yes. 2 Hero prototypes: yes, "Refined" chosen. 3 Compact phone cards: yes.**

### 8.1 Hero prototypes (skills-main `prototype`)

Three versions behind the skill's picker on a dev-only route (`/prototypes/hero`, 404 in production), all with real data, then deleted after the choice.

| # | Version | Idea | Result |
|---|---|---|---|
| 1 | **Refined** (chosen) | Today's layout, headline 44 to 72px, logo anchored to the 12-column grid | Keeps the locked hero skeleton (logo visual on the right); clear focal point |
| 2 | Data-led | 4 real study numbers beside the headline, logo as watermark | Repeats the 4 stat cards directly below; drops the logo visual the skeleton requires |
| 3 | Editorial | Headline set very large across the page, logo small | Logo becomes an icon; on phones the second button falls below the first screen |

### 8.2 What changed, by step

| Step | Change | Skill(s) behind it | Files |
|---|---|---|---|
| 3.1 Foundations | Public Sans body font; fluid type scale (text-lg to text-5xl) with tracking on the tokens; text-xs 13px for charts; `text-wrap` balance/pretty; no shadows at rest; `--ease-out`, `--duration-press`, `--duration-pop`; `pressable` and `pop-in` utilities; browser surfaces (accent, caret, scrollbar, underline offset); scroll cue `nowrap` | redesign-existing-projects (font, tracking), apple-design (size-specific tracking), emil-design-eng (curves, durations, press scale), minimalist-ui and design-taste-frontend (no resting shadows), impeccable craft floor (browser surfaces), break-ui (cue wrap) | `app/globals.css`, `app/layout.tsx` |
| 3.2 Components | Button press + gated hover; Callout without side stripe; StatCard re-laid out (value line, label + "i", bottom-pinned link/source, long values step down); PageHeader `back` + `meta`; Term/InfoButton `pop-in` from the trigger edge; Learn menu `pop-in` + chevron; mobile menu gold dot instead of side stripe; StatusPill `nowrap`; Reveal `as`; ChartFrame button | emil-design-eng, apple-design (origin-aware), impeccable detect (side stripes), break-ui | `components/Button.tsx`, `Callout.tsx`, `Card.tsx`, `StatCard.tsx`, `PageHeader.tsx`, `Term.tsx`, `Header.tsx`, `StatusPill.tsx`, `Reveal.tsx`, `ChartFrame.tsx`, `WaitlistForm.tsx` |
| 3.3 Pages | Home: hero (Refined, not revealed), one balance divider, How it works as `<ol>`, rankings preview split, founder split. /towns: intro split with label counts as figures, no "01 ·" prefixes, table from 1024px, compact phone cards. Town pages: label/rank/sales in header, tight first band, Chapter 123 figure row, comparison figure panel, context as one panel. About: story split with sticky heading. 404: one line, not two | design-taste-frontend, high-end-visual-design (marketing sections), redesign-existing-projects (layout), impeccable audit (hierarchy) | `components/Hero.tsx`, `HowItWorks.tsx`, `RankingsPreview.tsx`, `FounderTeaser.tsx`, `towns/RankingsExplorer.tsx`, `app/page.tsx`, `app/towns/page.tsx`, `app/towns/[slug]/page.tsx`, `app/about/page.tsx`, `app/not-found.tsx` |
| 3.4 Charts | One `CHART_FONT` (13px ticks/labels, 12px narrow); scatter horizontal gridlines only; forest plot label column 124/164px; tooltip already floating style | design-taste-frontend (small text), emil-design-eng | `lib/chart.ts`, `components/towns/ForestPlot.tsx`, `TierChart.tsx`, `SaleScatter.tsx` |
| 3.5 Micro-interactions | See design-system.md section 4 table | emil-design-eng, apple-design, review-animations | as above |
| Docs | Style guide shows new scale, font, surfaces, states | | `app/design/page.tsx`, `docs/design-system.md`, `docs/site-format.md` |

**Color tokens:** no hex value changed. Hues and meanings unchanged.

### 8.3 break-ui (worst-case data)

Dev-only harness at `/dev/break-ui` (404 in production) with a **Demo data / Worst case / Empty / One** toggle; worst-case data entered through the components' own props. Checked at 375, 640 (= 200% zoom on a 1280px laptop), 768, and 1280px. After the run the harness was **removed from the app** so it can never ship (prompt rule); its worst-case values are listed in the site-format checklist for reuse.

Worst-case values used: names "Lower Alloways Creek Township", "Little Egg Harbor Township", "Borough of Upper Saddle River" (real NJ names; 2.0 goes statewide); 1,284 sales; PRB −0.4445 (−0.9821 to +0.2607); COD 48.37; median ratio 112.4%; PRD 1.2875; stat value "$16,500,000"; 0 and 1 sales; empty lists; one town.

| # | Severity | Field | Worst-case value | What happened | Fix (done) |
|---|---|---|---|---|---|
| 1 | Broken | StatCard value | `$16,500,000` at 4 across | Ran out of the card | Value steps down a size when long (`StatCard.tsx`) |
| 2 | Ugly | Sales count | `1284` | Shown with no comma in the table, phone cards, thin list, forest-plot table | `formatCount()` everywhere (`RankingsExplorer.tsx`, `app/towns/page.tsx`) |
| 3 | Ugly | Label pill | "Regressive pattern" in the table | Wrapped to two lines | `whitespace-nowrap` (`StatusPill.tsx`) |
| 4 | Ugly | Town column | "Lower Alloways Creek Township" | Squeezed to 4 lines next to the pill | `min-w-40` on the town cell |
| 5 | Fragile | Town name | any | Schema has no maximum length (`schema.ts:150`) | Not changed: names wrap by design; flagged for the 2.0 statewide build |
| 6 | Fragile | Thin-town sentence | 0 towns listed | Copy reads "21 of the 0" only if the county count and list disagree (impossible with real data, both come from the same export) | No change |

**Decisions:** names wrap (they identify a town); numbers never wrap or truncate. **Held up:** no sideways scroll in any state at any width; empty state message; "1 sale" singular; long names in the page header (2 lines); phone cards with all notes; header at 200% zoom.

### 8.4 review-animations (every micro-interaction)

| Before | After | Why |
|---|---|---|
| Buttons: `transition-colors`, no press feedback | `pressable`: color + `scale(0.97)` 120ms `cubic-bezier(0.23,1,0.32,1)`; no shrink with reduced motion | Feedback on press; exact properties, not `all` |
| Pop-ups and Learn menu appear with no transition | `pop-in`: opacity + scale 0.97, 160ms, origin at the trigger edge, `@starting-style`; fade only with reduced motion | Not from nowhere, not from `scale(0)`, origin-aware, under 300ms, CSS so interruptible |
| Learn chevron: default `transition-transform` (150ms, weak ease) | 160ms `--ease-out`, off with reduced motion | Consistent curve |
| Link arrows nudge on hover for everyone | `motion-safe:` only | Movement off for reduced motion |
| "More numbers" content | Opens instantly | Opened often; motion would slow it (frequency rule) |

**Locked T&T motion (follow-up, Zaden delegated):** the tab underline now grows with `transform: scaleX()` from its left edge instead of animating `right`. Same 2px gold line, same 0.3s and T&T curve. The Reveal elements keep `will-change` on purpose: they are re-styled on every scroll frame, so the hint saves a layer promotion each time (comment added in `globals.css`).

**animation-performance:** every new motion is `transform`/`opacity` (plus color on hover). All CSS, so it runs off the main thread. No animated blur, no animated CSS variables, no state updates per frame.

**Verdict: Approve.** No feel-breaking regressions, durations 120–160ms, curves custom ease-out, reduced motion respected, hover gated (Tailwind v4 `hover:` uses `@media (hover: hover)`).

### 8.5 impeccable final audit

Commands run: `impeccable context`, `audit` (before), the `polish` playbook (system → evidence → triage → whole path → verify), `detect` (after), `audit` (after).

| # | Dimension | Before | After | Note |
|---|---|---|---|---|
| 1 | Accessibility | 3 | 4 | Lighthouse a11y 100 on home and /towns; every Tab stop shows a ring; 200% zoom clean |
| 2 | Performance | 3 | 3 | Home mobile 96, /towns 91; Reveal `will-change` at rest is locked |
| 3 | Theming | 3 | 3 | Tokens only, no hex; no dark mode (not in v1 scope) |
| 4 | Responsive | 2 | 4 | Cue fixed, 768px sideways scroll gone, phone /towns 25,180px to 11,712px |
| 5 | Implementation integrity | 3 | 4 | Detector: 0 findings (was 3); one surface system; one divider per page |
| **Total** | | **14/20** | **18/20** | **Excellent** |

High-severity (P0/P1) issues left: **none**. Kept on purpose (section 2): eyebrows and 01-03 numbers. Theming stays 3: no dark mode (not in v1 scope).

taste-skill gate after: home "no focal point" FAIL gone; phone headings past two lines 4 → 2 (home) and 5 → 3 (Bergenfield); "statement too long" and 768px "side-scroll" gone. Remaining FAILs are the locked items in section 2, the scroll cue's T&T 10–11px label and shadow, and the photo/video rules that rule 5 overrides. One false positive: the word "shadow" in a code comment.

### 8.6 Accessibility

| Foreground | Background | Used for | Ratio | Needs | Result |
|---|---|---|---|---|---|
| ink-800 | blue-100 | PageHeader intro and meta row (was ink-600) | 12.25:1 | 4.5:1 | Pass |
| navy-900 | blue-100 | PageHeader meta numbers; Learn menu hover | 11.60:1 | 4.5:1 | Pass |
| gold-700 | white | Phone card data-quality note | 5.06:1 | 4.5:1 | Pass |
| ink-800 | mist-50 | Tone panels | 13.54:1 | 4.5:1 | Pass |
| navy-900 | mist-50 | Figures on tone panels | 12.83:1 | 4.5:1 | Pass |
| ink-600 | mist-50 | Figure labels on tone panels | 6.78:1 | 4.5:1 | Pass |
| blue-600 | blue-100 | Open or hovered "i" / "View as table" | 5.68:1 | 4.5:1 | Pass |
| navy-700 | white | Secondary button hover | 10.07:1 | 4.5:1 | Pass |

All pairs were already in `lib/contrast.ts` (`npm test` checks them). Keyboard: Tab through home, /towns, Bergenfield, About, Contact: 292 stops, every one with a visible ring. 200% zoom (640px viewport): no sideways scroll on 8 pages. `prefers-reduced-motion`: press shrink, pop-up grow, chevrons, and arrow nudges all off; content never waits on motion.

### 8.7 Information check (5 towns)

Script compared every number on /towns (table row or thin-town row) and on each town page (header, 4 stat values and their 95% ranges, 4 quarter medians, Chapter 123 average and limits, context dollars and tax rate) with `towns.json` and `towns/<slug>.json`.

| Town | Why | Result |
|---|---|---|
| Bergenfield | Regressive pattern, 2027 reval | All match |
| Fair Lawn | Within standards | All match |
| Closter | Limited data | All match |
| Allendale | Not enough sales (no stats) | All match |
| Ridgefield Park | Rank 1 (most negative PRB) | All match |

**154 checks, 0 mismatches.**

### 8.8 Tests and scores

| Check | Before | After |
|---|---|---|
| Vitest | 213 pass | 213 pass |
| Playwright | 92 pass | 93 pass (new: phone cards and Show all) |
| validate-data + build | pass | pass (0 warnings) |
| Lint, typecheck | clean | clean |
| Lighthouse home (mobile) perf / a11y / best / SEO | 85–95 / 96 / 96 / 100 | 96 / 100 / 100 / 100 |
| Lighthouse /towns (mobile) | 89–90 / 100 / 100 / 100 | 91 / 100 / 100 / 100 |
| Home LCP | 2.9–4.4 s | 2.8 s |
| /towns page height on a phone | 25,180px | 11,712px (about 15 screens) |
| Bergenfield page height on a phone | 14,688px | 14,140px |

### 8.9 Screenshots

`docs/screenshots/redesign/before/` and `docs/screenshots/redesign/after/`, same file names (taken at 375px and 1280px, full page, reduced motion so every block shows; plus `home-fold-*`, `menu-open-375`, `learn-menu-1280`). Saved as JPEG; the 1280px shots are scaled to 1000px wide (all 52 files: 33 MB as PNG, 15.4 MB now). Best pairs to compare: `home-1280.jpg`, `home-fold-375.jpg`, `town-bergenfield-regressive-1280.jpg`, `towns-375.jpg`, `about-1280.jpg`.

### 8.10 Follow-up decisions (Zaden delegated, same day)

1. **Screenshots:** keep all 52 as JPEG (evidence for judges and the AI disclosure, small enough for the repo; Vercel builds only `site/`).
2. **Locked T&T motion:** underline converted to `scaleX` (same timing); Reveal `will-change` kept with a reason.
3. **/towns on phones:** cards show the first 12 towns with a "Show all 48 towns (36 more)" button; a search or label filter always shows every match; after Show all, keyboard focus moves to town 13 (the button disappears). The 22 towns without enough sales sit two across on phones. Forest plot unchanged (it is the page's main picture and every dot is a link). Result: 25,180px to 11,712px. New e2e test in `e2e/towns.spec.ts`.

## 9. Appeal checker page (Prompt 12, 2026-10-18)

The same three checks, run on `/check` after it was built.

### 9.1 impeccable audit and detector

| # | Dimension | Score | Key finding |
|---|---|---|---|
| 1 | Accessibility | 4 | Placeholder text was 3.0:1 (fixed: ink-600); combobox, live region, focus to result, linked errors all verified |
| 2 | Performance | 4 | Only the town file loads; the tilt is one transform |
| 3 | Theming | 4 | Tokens only; no hex in the new components |
| 4 | Responsive | 4 | No sideways scroll at 320, 375, 640, 1280px (e2e checks every verdict at 375px) |
| 5 | Implementation integrity | 4 | Reuses PageHeader, Callout, StatusPill, DataTable, Button, Term, Disclaimer, CtaBand |
| **Total** | | **20/20** | |

Detector (source): 0 findings. Detector (rendered page): 2. Low-contrast placeholder (fixed, also on /towns). "Kicker above heading" on the page header's "Appeal Checker" eyebrow: a false positive here, because the eyebrow is the site's locked page-header pattern (Prompt 10B kept eyebrows).

### 9.2 review-animations

| Before | After | Why |
|---|---|---|
| Scale icon tilt 900ms | 500ms, same `--ease-out` | Over the 300ms UI budget. 500ms is kept on purpose: it runs once per result, is decorative, and never delays the result (the numbers are already on screen) |
| `pressable` (3% shrink) on the full-width "Show the math" bar | Color change only | A 3% shrink on a 1,000px bar moves its edges about 30px |

Kept: chevrons turn in 160ms like the rest of the site; the town list, the Step 3 disclosure, and "Show the math" open instantly; the skeleton pulses only with motion allowed; the tilt is off under reduced motion. Verdict: **Approve**.

### 9.3 break-ui

A dev-only harness rendered the result from worst-case town files and inputs through the real engine (states: Demo, Worst case, Grounds, Empty, One, 300 comps) at 320, 640, and 1280px. It was deleted afterward so it can't ship. Worst case: "Lower Alloways Creek Township", limits 101.58% and 137.42% (both over 100%, like Rockleigh), no tax rate, a 2026 revaluation, 6 comps at the $20,000,000 input cap, and an own estimate at the $10,000 floor (ratio 200,000%).

| # | Severity | What happened | Fix |
|---|---|---|---|
| 1 | Broken | Both limits tested at 100%, so the "Lower limit" and "Upper limit" labels printed on top of each other | When the ticks are close, the labels move to the two ends of the track (`BalanceMeter.tsx`) |
| 2 | Broken (found earlier in screenshots) | "117.46% (tested as 100%)" ran off a 375px phone (5px sideways scroll); "You, our estimate" label ran off the left edge | "tested as 100%" on its own line; shorter labels; labels pin to an edge when their mark is near it |
| 3 | Fragile | An own estimate of $10,000 on a $20,000,000 assessment gives a 200,000% ratio | Kept: the meter pins the ring to the edge with an arrow and the label shows the real value. The engine's 20% warning explains the gap |

Held up: plurals ("1 recent sale", "1 home"), $20,000,000 and $16,500,000 figures, the long town name in the heading and sentences, 0 comps (no table), 300 comps (table scrolls), all 5 warnings at once, no sideways scroll in any state.
