# Changelog

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
