# Changelog

## 2026-10-15 (Prompt 6 follow-up: decisions and T7)
- Zaden delegated the 6 open items. Methodology is now version 1.3: value quarters (T3) sort by the PRB value proxy (the sale-price version stays in `town_tiers.csv` as a comparison); new rule T8 makes the within-town countywide measure the headline; a PRB is "unacceptable" only if its whole 95% range is outside -0.10 to +0.10; the median ratio gets no pass/fail flag; PRB keeps IAAO's ln(V)/0.693.
- Built T7: `town_tiers.csv` now has each quarter's Chapter 123 triggers and the count and share of sales above and below them (blank for the 24 towns on the 2027 revaluation list). `county_summary.json` adds T7 for 24 towns and the 2027 state average ratio range (47.06% Garfield to 119.50% Rockleigh).
- `docs/stats-summary.md` adds the T7 table, why quarters use value, and a note that all 3 labeled towns (Bergenfield, Cliffside Park, Englewood) are on the 2027 revaluation list.
- 6 new tests (46 in `test_stats.py`, 132 in all) pass. Two runs give identical files.

## 2026-10-15 (Prompt 6: ratio statistics)
- New `pipeline/stats.py`: small pure functions for median, mean, and weighted mean ratio, COD, PRD, PRB (with standard error and 95% range), the bootstrap ranges (2,000 resamples, seed 20261025), value quarters, the T5 label, the T6 data quality flag, and the IAAO pass/fail flags. Each docstring shows its formula.
- New `pipeline/build_stats.py` and a `stats` stage in `pipeline/run.py`. Outputs: `data/processed/town_stats.csv` (all 70 towns), `town_tiers.csv`, `county_summary.json`, `sensitivity.csv` (labels at C8 fence 3.0, 1.5, and no trimming), and the generated `docs/stats-summary.md`.
- Results (3,806 Sales2026 sales): 2 towns show a regressive pattern, 1 progressive, 28 within standards, 17 mixed signals, 22 not enough sales. Countywide within-town COD 11.9, PRD 1.009, PRB 0.001.
- `pipeline/tests/test_stats.py`: 40 tests, including a 5-sale dataset worked out by hand. 126 pipeline tests pass. Two runs give identical files.
- Methodology T3: added a proposed change (not adopted) to sort value quarters by the PRB value proxy instead of sale price. `town_tiers.csv` has both versions until Zaden decides.
- `docs/data-dictionary.md` section 10 and the README run steps.

## 2026-10-15 (Website wording: simpler grammar)
- Zaden asked for simpler grammar on the website with no dashes, colons, or semicolons, keeping the same tone, message, and formatting, and leaving the footer alone. Long sentences were split into shorter ones on the home page (The problem, What we're building, Methodology), the deadline and fee box ("The deadline is April 1", "The filing fee is $5 to $150"; facts unchanged), the teaching diagram, the waitlist section, and the Appeal Checker intro. Also the site description, the link-preview image description, and the scroll button's screen-reader name. Footer, disclaimer, and the hidden /design page unchanged. Lint, 62 unit tests, 60 browser tests, and the build pass.

## 2026-10-15 (Prompt 5: cleaning pipeline and filter log)
- New `pipeline/clean.py`: one function per cleaning rule (C1, C2, C10, C3, C7, C4, C5, C6, C9, C8, in methodology order). Every number they use is in `pipeline/config.py`. C8 trims each town on its ratio divided by the town median, separately for each file.
- New outputs: `data/processed/sales_clean.csv` (6,679 clean sales; 3,806 in Sales2026), `data/processed/filter_log.csv`, `data/processed/c8_sensitivity.csv`, `data/interim/removed_rows.parquet`, and the plain-English `docs/filter-log.md`.
- New `pipeline/run.py`: one command runs every stage (parse, then clean) and stops if an input file is missing. README updated.
- `pipeline/tests/test_clean.py`: 33 tests on made-up data (each rule removes only its rows; a town assessed near 40% keeps its normal sales; rows in = kept + removed everywhere; two runs give identical files). 86 pipeline tests pass.
- `docs/data-dictionary.md`: new section 9 for the cleaning outputs.
- Methodology 1.2 (Zaden delegated the 4 open items): C8 runs per town and per SR1A file; C10 also drops codes starting with lowercase "c" (1 Wyckoff sale in Sales2025); C9 note gives real counts (0 in Sales2026, 1,093 in Sales2025); `c8_sensitivity.csv` named in the text.

## 2026-10-15 (Prompt 4 follow-up: decisions, name, footer)
- Zaden delegated the 5 open items. Methodology is now version 1.1: rule C6 finds multi-lot sales with TOTAL ASSESSMENT > main-lot total (the old ADDL-BLOCK test would have dropped 881 Sales2025 sales because of "00000" placeholders); multi-lot sales are still dropped. Section 3.1 now explains YTDSR1A2026 (older copy of Sales2026), the Sales2024 layout problem, MMDDYY update dates, and record_id.
- Town 0266 shows as "Washington Township" (`towns.csv`, slug `washington-township`).
- `docs/validation.md`: V1 now passes as a pipeline test (70 of 70 towns). The 5 towns with the largest raw gaps to the state ratio are logged to recheck after cleaning.
- Website name is now written "Fair Assess NJ" ("FAIR ASSESS NJ" in the header and footer wordmark), in page titles, the hero, the footer, and the disclaimer as shown on the site. Only the website changes; repo docs, DISCLAIMER.md, and the logo artwork keep "FairAssess NJ" (Zaden).
- Footer keeps its layout but uses Fair Assess NJ colors instead of T&T's navy and gold: light blue tint background, navy text, full-color logo icon, blue/green heading bars, and the logo's blue/green balance line with the gold pivot dot. New contrast pairs added and tested. Lint, 62 unit tests, 60 browser tests, and the build pass.

## 2026-10-15 (Prompt 4: data intake and profiling)
- New pipeline code in `pipeline/`: `config.py` (all paths and constants), `parse_sr1a.py`, `parse_ch123.py`, `parse_state_tables.py`, `build_towns.py`, `profile_data.py`. No cleaning rules applied yet.
- `pipeline/sr1a_layout.csv` built from SR1Afilelayout.pdf (80 fields, positions 1 to 663). Bergen SR1A rows saved to `data/interim/sr1a_bergen.parquet` (names and addresses never kept).
- New tables in `data/processed/`: `ch123_2027.csv`, `ch123_2026.csv` (70 towns each), `director_ratios_bergen.csv`, `state_cod_bergen.csv`, `tax_rates_bergen.csv` (newest year 2025), `avg_residential_bergen.csv`, `towns.csv` (display names and URL slugs).
- New `docs/data-profile.md` (generated). Findings: YTDSR1A2026 is an older copy of Sales2026; Sales2024 uses a different layout and is not decoded; Sales2025 uses "00000" as an empty extra-lot placeholder; TOTAL ASSESSMENT covers all lots in a sale. V1 (same sale counts as the state) passes in 70 of 70 towns.
- `docs/data-dictionary.md` rewritten for every field the pipeline reads or writes.
- `pipeline/tests/test_parsers.py`: 48 tests (layout, number and date decoding, Chapter 123, state tables, towns, V1).
- Added pyarrow and scipy. `pipeline/requirements.txt` is now the package list; the root `requirements.txt` points to it. README lists the run order.

## 2026-10-14 (ready for Prompt 4)
- Home page now matches methodology 1.0: the study covers Bergen County single-family homes (not every NJ town); the checker asks for your town and assessed value (not your address); the data sources list SR-1A sales and Chapter 123 ratios (MOD-IV is 2.0 work).
- New reference tables in `data/reference/`: `bergen_revaluation_towns.csv` (60 towns with state district codes, 2026 and 2027) and `nonusable_codes.csv` (all 36 state non-usable codes with plain-English labels and sources).
- `docs/data-dictionary.md`: every SR1A field the pipeline will read, with positions in the 663-character layout, YYMMDD dates, and the rule that names and addresses are dropped as soon as a line is read.
- New `docs/validation.md` with the first (preliminary) checks against the state: 70 of 70 towns have the same sale count; the state's coefficient matches our mean-based version in 62 of 66 towns within 0.25.
- Python setup: `.venv` created; `requirements.txt` pinned to exact versions so results repeat. README updated with Windows setup and test commands, Bergen-only scope, and the `pipeline/` folder.

## 2026-10-14 (Prompt 3 follow-up: methodology 1.0)
- `docs/methodology.md` is now version 1.0. Zaden asked Claude to make all 19 decisions. Claude kept every draft default and both document-driven rules (a ratio above 100% counts as grounds; no Chapter 123 result in 2027 revaluation towns), and added T7: the share of sales over the Chapter 123 limit in each price quarter.
- Saved new sources in `data/raw/notes/` (local only): the IAAO *Standard on Ratio Studies* (2013) and the NJ Division of Taxation *Guidelines for use of 36 Nonusable Categories* (May 2025), with quotes and code labels in `ratio-study-standards.md`. They confirm the July 1 to June 30 sampling period, the IAAO ranges, and the PRB formula. They also give the meaning of every non-usable code.

## 2026-10-14 (Prompt 3: methodology draft)
- Rewrote `docs/methodology.md` as version 1.0-draft: research question and H1, IAAO measures with formulas (median, mean, weighted mean, COD, PRD, PRB), Chapter 123 rules, data sources and periods, cleaning rules C1 to C10, town statistics and labels, appeal checker method (K1 to K14), limitations, and validation plan. Proposed rules are tagged for Zaden to confirm.
- Found from the state documents: a home's ratio above 100% also qualifies for relief (Chapter 123 Example II), and Chapter 123 does not apply in a town's revaluation year. The second one changes the earlier rule for 2027 revaluation towns (checker gives no Chapter 123 result there); waiting on Zaden.
- Found from the data: Sales2026.zip matches the state's 2026 sale counts in all 70 Bergen towns; the state's "coefficient of deviation" is measured around the mean ratio, not the median (IAAO COD); SR1A dates are YYMMDD and our files use the 663-character layout.

## 2026-10-14 (footer cleanup and phone/iPad layout pass)
- Footer reworked to be less crowded: brand + disclaimer on the left, link columns Site | Tools | Project (Methodology, Privacy, About, Contact, GitHub) on the right, then the data date, source, and independence lines, then the credit and tagline. Removed the "Get Involved" column (Zaden). Get Updates and Report a data problem stay on the Contact page.
- Phone and iPad fixes: the home page's three-column sections and the deadline/fee box now stack until laptop width (1024px) instead of squeezing into narrow strips; the deadline/fee box on Appeal Checker and Appeal Guide uses the full page width; footer lines stack below laptop width.
- Added `e2e/layout.spec.ts`: every page at phone (390px), iPad (768px, 1024px), laptop (1280px), and desktop (1440px) widths must have no sideways scrolling, and the header must show the right navigation for each width.
- CLAUDE.md rule 5: added a narrow exception so Zaden's own "The Story" paragraphs on the About page show no source links (the facts are still backed up in data/raw/notes/about-page-facts.md).

## 2026-10-14 (Prompt 2B: site format from Trust & Transition)
- Zaden's changes first: removed the blue/green stripe from the top of the header; removed Contact from the header tabs and put it in the footer link row (Methodology, Privacy, About, Contact, GitHub).
- Added `docs/site-format.md`: what T&T does (with file:line citations), the FairAssess tab map and page skeletons, the motion table, and the "Not vibe coded" checklist.
- Motion now matches T&T exactly (`site/lib/motion.ts`): scroll-linked text reveal (94%→50% of viewport, 54px rise, 0.972 scale, 34px stagger, reversible), "Scroll to explore" button on every page (1.7s chevron bob, hides at the footer), header border/shadow after 8px of scroll, growing gold tab underline, mobile menu that slides in from the right. Reduced motion turns movement off; with JavaScript off, all content shows.
- New: `Reveal` (rewritten), `RevealController`, `ScrollCue` (rewritten), `PageHeader`, `CtaBand`, `ComingSoon`; Header and Footer reworked into T&T's format.
- New placeholder pages so every link works: /towns, /check, /methodology, /appeal-guide, /about, /privacy, plus a 404 page. New /contact page with the working Get Updates form at #updates.
- Added a GitHub issue form for data problems (`.github/ISSUE_TEMPLATE/data-problem.md`).
- Tests: header tabs and active state (Vitest + Testing Library), motion math, and Playwright browser tests for the scroll cue, reveal, reduced motion, and no-JavaScript view. `npm run test:e2e` runs the browser tests.

## 2026-10-14 (Prompt 2 follow-up)
- Upgraded `next` and `eslint-config-next` to 16.4.1 (fixes a critical security advisory in 16.3.4). Ran the non-breaking `npm audit fix`. The 5 remaining high warnings are in lint tools only, which never ship to the browser.
- Saved the logo-asset script as `pipeline/brand_assets.py` with tests in `pipeline/tests/test_brand_assets.py`. Its output matches the installed site files pixel for pixel. Added `pillow` to `requirements.txt`.
- Kept the full logo for the favicon (Zaden agreed).

## 2026-10-14 (Prompt 2: design system from the logo)
- Sampled the logo's real colors with Python + Pillow and built the token set in `site/app/globals.css` (Tailwind v4 `@theme static`). Tailwind's default colors, sizes, radii, and shadows are switched off so only brand tokens exist. Added `green-700` (Zaden approved) because the logo green fails AA as text.
- Fonts: Montserrat (headings, eyebrows) and Inter (body) replace Source Serif and Source Sans.
- New components: Button, Card, StatCard, StatusPill, Callout, Disclaimer, BalanceDivider, Term/InfoButton, DataTable, Skeleton, Header, plus a rewritten SectionHeading and Footer. Removed TopBar and the hand-drawn icons file (now lucide-react).
- Rebuilt the logo assets from `brand/Logo.jpg` with clean transparent edges: logo-icon, logo-icon-light, NJ watermark, favicon, icon, apple-icon, and the link-preview image (with alt text). Set `metadataBase` so previews use the real site address.
- Restyled the landing page and waitlist form. Wording and waitlist behavior are unchanged.
- Footer and `DISCLAIMER.md` now use the combined disclaimer from CLAUDE.md rule 4.
- Added `/design` style guide (noindex, not in the nav) and `docs/design-system.md`.
- Added Vitest. `lib/contrast.test.ts` checks every approved color pair for WCAG AA. `lib/nav.test.ts` checks the active-tab rule. Raised `@types/node` to v24 to match Node 24 and Vitest 5.

## 2026-10-14 (repo audit and cleanup)
- Added `docs/architecture.md`: folder layout, data flow, and planned site routes.
- Moved `Logo.jpg` from the repo root to `brand/`. Copied `site/public/logo-full.png` to `brand/logo-full.png`.
- Trimmed `requirements.txt` to the v1 stack: pandas, numpy, pdfplumber, openpyxl, pytest. The removed packages (geopandas, statsmodels, scipy, duckdb, matplotlib, plotly, pyarrow) were for 2.0 work.
- Deleted the empty three-town memo stub in `reports/`. The v1 town pages replace it.
- `docs/methodology.md`: added the rule for towns with a 2027 revaluation or reassessment (checker runs, with a warning and the May 1 deadline).
- Added source notes for appeal deadlines, fees, and Bergen revaluation towns in `data/raw/notes/` (local only, not committed).

## 2026-10-14 (project context for the App Challenge)
- Rewrote `CLAUDE.md` with the full v1 scope (Bergen County, single-family homes), stack, folder map, and rules. All earlier rules were kept. The two disclaimers are now one combined disclaimer.
- Renamed `docs/data_dictionary.md` to `docs/data-dictionary.md`.
- Added `.pytest_cache/`, `.env.local`, and `.env*.local` to `.gitignore`.

## 2026-09-12 (real favicon)
- `site/app/favicon.ico` was still the default Next.js/Vercel icon left over from `create-next-app` (Phase 0), so the browser tab showed that instead of our logo even though `site/app/icon.png` already had the FairAssess NJ mark. Replaced it with a real `.ico` built from the same logo (via `sharp`, hand-wrapped in a minimal ICO container since Node has no built-in ICO writer) so both the tab icon and bookmark icon show the house-and-scale mark, not Vercel's.
- Confirmed in the built page's `<head>` that both `/favicon.ico` and `/icon.png` now point at the FairAssess NJ logo, and that no manifest or apple-touch-icon file references anything else.
- Ran `npm run build` and `npm run lint` in `site/` — both pass.

## 2026-09-12 (scroll-cue now follows the page + mobile pass)
- Rebuilt `components/ScrollCue.tsx` to check trustandtransition.org's own "Scroll to explore" behavior and match it: the button is now `position: fixed` so it stays pinned to the bottom of the screen the whole time you scroll (previously it only sat once under the hero and scrolled away with it). Each click now jumps to the next `<section>` on the page (works from anywhere, not just the hero), and it fades out once the footer comes into view since there's nothing left to explore there.
- Made the button a little smaller and sit a little lower on small screens so it takes up less room where mobile hero content is short.
- Checked every section at a narrow (390px) test width alongside the normal desktop width: nav, hero, the three-column and two-card sections, the waitlist card, and the footer all stack and wrap correctly with no overflow. The one known rough edge (matching the reference site's own behavior) is that on a very short phone screen, the floating button can briefly sit over non-clickable helper text near the bottom of the hero — it never covers an actual button or the email field at normal phone heights.
- Ran `npm run build` and `npm run lint` in `site/` — both pass.

## 2026-09-12 (scroll animation reset + scroll-cue button style)
- Changed `components/Reveal.tsx` so sections fade back out when you scroll back up past them, then replay the fade-in when you scroll back down to them, instead of only ever animating once.
- Restyled the "Scroll to explore" cue as a circular bordered button (was plain text + arrow) so it reads clearly as something to click.
- Ran `npm run build` in `site/` — passes.

## 2026-09-12 (logo, colors, and scroll animation)
- Cut the house-and-scale mark out of `Logo.jpg` (transparent background, via `sharp` — already a dependency of Next.js) into `site/public/logo-icon.png` (color, for light backgrounds), `site/public/logo-icon-light.png` (single light color, for the dark footer), and `site/public/logo-full.png` (icon + wordmark). Also made `site/app/icon.png` (square favicon) and `site/app/opengraph-image.png` (social share image) from the same source.
- Replaced the "FA" text-square monogram in `TopBar` with the real logo icon. Added the icon to `WaitlistSection` and `Footer` (light version) too.
- Retuned the `site/app/globals.css` color tokens (`--color-slate`, `--color-gold`, `--color-signal`) to match the navy, amber, and green actually used in the logo, so the site and the logo read as one brand. Left `--color-ink`, `--color-mist`, and `--color-paper` as they were — already the right family of colors.
- Added a "Scroll to explore" link under the hero that jumps to "The problem" section (plain anchor + CSS bounce, no JavaScript needed, so it still works if scripts fail).
- Added `components/Reveal.tsx` (a small client component using IntersectionObserver) so section headings, cards, and callouts fade and slide into place the first time they scroll into view, instead of just appearing. Respects `prefers-reduced-motion`.
- Ran `npm run build` in `site/` — passes.

## 2026-09-11 (waitlist database connected)
- Connected the live "Fair Assess NJ" Supabase project to the Vercel project (the marketplace integration and its env vars were already set up in Vercel minutes before this session; confirmed they point at the right Supabase project).
- Ran `site/supabase/schema.sql` against that project to create the `waitlist` table (email, source, created_at) with row-level security and an anon-insert-only policy. Found one leftover duplicate policy from earlier setup work and removed it, so there is exactly one insert policy.
- Redeployed the Vercel project so the `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` env vars (added to Vercel but not yet in a build) took effect.
- Added `site/.env.local` (git-ignored, not committed) with the same two values for local development.
- Verified the whole path end-to-end: ran the site locally, submitted a test signup through the real `WaitlistForm`, confirmed the row landed in Supabase, then deleted that test row.
- Note for Zaden: there is a second, apparently-unused Supabase project called "Free Assess NJ" (us-west-2) in the same org - left untouched pending a decision on whether to delete it.

## 2026-09-11 (redesign)
- Redesigned the whole landing page to remove every bracketed placeholder and TODO note, and to fix the lopsided, left-hugging layout Zaden flagged.
- Added a two-column hero with a new hand-built `ConceptDiagram` component (a labeled "teaching example" bar diagram, clearly marked as made-up numbers, not town data) so the page isn't just one narrow text column with empty space on the right.
- Rewrote `AppealBasics` with the real, sourced NJ appeal deadline (April 1; May 1 after a revaluation; Jan 15 in Burlington/Gloucester/Monmouth) and the real county tax board filing fee tiers ($5 / $25 / $100 / $150 by assessed value), verified against nj.gov's "Guide to Tax Appeal Hearings" and county fee schedules.
- Replaced the placeholder "[X% of towns...]" statistic and the placeholder methodology block with honest, sourced copy (IAAO/MOD-IV/SR-1A/COD-PRD-PRB/Chapter 123 facts already established for this project) instead of invented numbers.
- Redesigned `TopBar` (sticky, in-page nav links), `ProblemSection` (numbered list), `BuildingSection` (timeline-style two-up roadmap), `MethodologySection` (three-pillar grid), `WaitlistSection` (two-column), and `Footer` (nav row; removed the fake contact@fairassessnj.org address pending a real one).
- Added `components/icons.tsx`, a small set of hand-drawn line icons (no icon library) matching the site palette.
- Added smooth in-page scrolling and scroll-margin offsets in `app/globals.css` so the sticky top bar doesn't cover section headings when you click a nav link.
- Ran `npm run build` and `npm run lint` in `site/` — both pass.

## 2026-09-11
- Built the pre-launch landing page: top bar, hero with a waitlist form, "The problem" (3 plain-English columns, placeholders marked TODO), "What we're building" (analysis + appeal checker, both labeled In development), a methodology placeholder section, a second larger waitlist section, and a site-wide footer with the required disclaimer.
- Added the FairAssess NJ color and font tokens (navy/mist/paper/gold/signal, Source Serif 4 + Source Sans 3) as a Tailwind v4 `@theme` block in `app/globals.css`.
- Added a reusable `WaitlistForm` component (client-side email validation, loading/success/error states, honeypot bot field, duplicate-email handled silently as success) wired to a new Supabase `waitlist` table via `@supabase/supabase-js`.
- Added `site/supabase/schema.sql` (table + insert-only RLS policy for anon) and `.env.local.example`; documented the full Supabase/Vercel setup checklist and remaining launch TODOs in `site/README.md`.
- Ran `npm run build` and `npm run lint` in `site/` - both pass.

## 2026-09-10
- Set up the repo: folders, README, disclaimer, CLAUDE.md, .gitignore, and the Next.js site.
- Filled in the "Research question" and "Hypotheses" sections of docs/methodology.md, copied word-for-word from private/gameplan.md Section 1.
- Replaced the Next.js starter home page with a FairAssess NJ placeholder, added the required disclaimer footer to every page, updated the site title/description metadata, and removed unused starter SVGs.
