# Changelog

## 2026-10-23 (Prompt 17: Submission assets)
- New `docs/facts-sheet.md`: every number for the application, video, and fair, with the file it came from (sales and cleaning, the biggest data problem, validation, labels, checker settings, test counts, Lighthouse and axe, and a checker example worked by hand for a made-up Hasbrouck Heights home).
- New `docs/video-script.md`: a 2:30 to 3:00 first-person script with a timed shot list (New Milford as the real example; a made-up Teaneck $450,000 home in the checker) and Windows recording and YouTube tips.
- New hidden pages `/cover` (2 cover designs, 600x800) and `/handout` (one US Letter page with a QR code). Both are noindex, left out of the sitemap, and blocked in `robots.txt`. Numbers come from the data files and the website's own checker engine (`site/lib/submission.ts`, with tests). The handout carries the disclaimer, because the site footer is hidden in print.
- New `site/scripts/capture-submission.ts` (`npm run capture-submission`): saves `docs/submission/cover-600x800.jpg`, `cover-alt-600x800.jpg` (exactly 600x800, JPEG quality 90, captured at 2x), and `fair-handout.pdf`. The QR code follows `SUBMISSION_URL` when set, so it can switch to a custom domain later.
- New dependency: `qrcode` (and `@types/qrcode`).
- `npm audit fix` (no breaking changes): updated `zod` and `undici` in the lock file to fix 2 high-severity warnings. One low-severity KaTeX warning is left: its fix is a breaking version, and KaTeX only runs at build time.
- Cover design A is the submission cover; B is kept as the alternate.
- 196 pytest, 264 Vitest, lint, validate-data, build, 157 Playwright: all pass.

## 2026-10-18 (Prompt 16: README and open-source readiness)
- Took the AI assistant instruction files (`CLAUDE.md`, `site/CLAUDE.md`, `site/AGENTS.md`) out of the public repo. They stay on Zaden's computer and are now in `.gitignore`. Removed the placeholder "How AI was used" section from `README.md`.
- Safety check before going public: nothing from `private/`, `data/raw/`, `data/interim/`, or any `.env` file is tracked or was ever in the history (only empty `.gitkeep` files and the blank `site/.env.local.example`). A search of all 16 commits found no keys, tokens, passwords, or real Supabase URLs. Committed data has no owner names or street addresses.
- New `README.md`: logo, tagline, live link, CI badge, both features with screenshots, why it matters, a data-flow diagram, methodology in brief with the validation headline, Windows PowerShell steps (download the raw data, set up Python, run the pipeline, run the site, run `scripts\check-all.ps1`), project structure, testing, data sources and license, the 2.0 roadmap (the six items on /about), a placeholder "How AI was used" section, the disclaimer, and author and contact.
- New `docs/screenshots/` images (desktop 1280px and phone 390px): home, town rankings, the Bergenfield page, and a checker result for an example input (Teaneck, $450,000).
- New `CONTRIBUTING.md` and a "Bug report" issue template. The "Report a data problem" template now asks for the source too.
- `site/README.md`: removed out-of-date parts (pre-launch description, old to-do list for removed components, old palette, a fake email). Kept the run steps and the Supabase setup checklist.
- Removed the old draft folder `src/` (replaced by `pipeline/`; approved 2026-10-14) and the empty `docs/log.md`. CLAUDE.md updated to match.
- LICENSE stays the standard MIT text so GitHub recognizes it. The data note (public NJ records; our processed data under CC-BY 4.0) is in the README.
- 196 pytest, 256 Vitest, lint, validate-data, build, 156 Playwright pass.

## 2026-10-18 (Prompt 15: Testing and reliability)
- New browser tests. `e2e/home.spec.ts`: the home page's headline numbers match `meta.json` and `county.json`; every nav tab (and both Learn links) opens its page, and only that tab is marked current, on desktop and in the phone menu; the 404 page links home.
- `e2e/towns.spec.ts`: the forest plot and the rankings table list the same 48 towns in the same order; clicking a town opens its page; a regressive town (Bergenfield), a within-standards town (Fair Lawn), and a limited-data town (Closter) each show their 4 measures, draw their charts, and open the chart table.
- `e2e/check.spec.ts`: invalid inputs (no town, blank, letters, negative, cents, too small, too large, letters in the estimate) each show the right error; `/check?town=` picks the town (an unknown slug leaves it empty); a stricter privacy test records every request and fails if a typed amount appears in any URL, header, or body, if any request goes to another domain, or if a typed amount is in cookies or browser storage. All 5 verdicts were already covered.
- `playwright.config.ts`: 2 workers; on GitHub, 1 retry and an HTML report.
- New `site/scripts/check-real-homes.ts` (`npm run check-real-homes`): runs `private/test-homes.csv` through the website's checker engine and writes `private/real-home-results.md` (verdict, estimate, range, comps, warnings, flags, and the full math for the 2 homes with the fewest comps). Both files stay private.
- New `.github/workflows/ci.yml`: Python tests, and site unit tests, lint, validate-data, build, and Playwright on every push and pull request, with pip, npm, Next.js, and Playwright caches. The build uses placeholder (not secret) Supabase values so the waitlist test works.
- New `scripts/check-all.ps1`: the same checks on Windows, with a PASS/FAIL summary; it stops an old test server on port 3100 first.
- New `docs/usability-test.md`: a 15-minute family test script (5 tasks, what to watch for, 4 questions, a blank results table).
- 196 pytest, 256 Vitest, 156 Playwright, lint, build pass.

## 2026-10-18 (Prompt 14: SEO, accessibility, performance, security)
- Search and sharing: every page has its own description, a canonical link, and Open Graph and Twitter tags (`lib/seo.ts`). The browser tab still reads "Fair Assess NJ" everywhere, and town pages no longer set their own tab title. Each of the 70 town pages has a generated share image (`next/og`) with the town name, label, and logo. New `sitemap.xml` (78 URLs) and `robots.txt` (everything except `/design`). JSON-LD: WebApplication (every page) and Dataset (the town stats CSV, on /towns).
- Analytics: Vercel Web Analytics, page views only, on Vercel builds only. Each URL is sent without its `?query` and `#hash`, and there are no custom events (a test enforces both). /privacy updated, with a source note `data/raw/notes/vercel-web-analytics.md`.
- Security headers in `next.config.ts`: Content-Security-Policy (only this site plus the Supabase URL), X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, frame-ancestors 'none'. Zod set to `jitless` so it never tries `eval`. Waitlist checked in a test (request faked, nothing saved).
- Performance: page-header and hero outline images preloaded at about their shown size. Logos ask for small files. Recharts loads after the page shows on /towns and town pages, with same-height placeholders. Cache header for `/data/*`. A site-wide loading page was tried and removed, because it made pre-built pages jump.
- New error pages: `app/error.tsx` and `app/global-error.tsx` in the brand style, both with the disclaimer.
- Accessibility: new `e2e/a11y.spec.ts` (axe on 9 pages and the checker result, lang, focus, 200% zoom, keyboard sort, chart tables). axe found 0 issues before and after.
- Lighthouse mobile (median of 3): 94 to 95 Performance and 100 in Accessibility, Best Practices, and SEO on /, /towns, a town page, and /check. Before: /towns was 89. Full results in `docs/quality-report.md`.
- 256 Vitest, 145 Playwright, lint, build pass.

## 2026-10-18 (Prompt 13 follow-up: decisions)
- Re-checked the appeal sources online: Form A-1 and the hearing guide are unchanged (same file hash). Added 4 facts from the Bergen Board page (assessment presumed correct; in-person filing; property record search link; 2025 hearing dates posted, hearings in person). The Appeal Guide now says "Sources last checked: October 18, 2026".
- May 1, 2027 is a Saturday: the checker result, the 24 revaluation-town pages, and the Appeal Guide now say so and quote Form A-1's next-business-day rule, with "confirm the exact date with the Board". New tested helper `weekendDeadlineNote`.
- How It Works: the "rarely finds grounds" limitation links to `checker_grounds_sweep.csv` on GitHub.
- 246 Vitest, 112 Playwright, lint, build pass.

## 2026-10-18 (Prompt 13: How It Works, Appeal Guide, About, Contact, Privacy)
- New source note `data/raw/notes/appeal-info.md` (the file the prompt names): word-for-word quotes from the saved Form A-1 and the state's *Guide to Tax Appeal Hearings* PDFs, plus the Bergen Board and state web page facts from `appeal-deadlines-and-fees.md`. It ends with the facts the sources don't cover. No existing file in `data/raw/` was changed.
- `/methodology` ("How It Works") built: the question and what our answers are (patterns, not accusations); every state file with its link and dates; the cleaning funnel from `filter-log.json` with a reason per rule; the measures with KaTeX formulas, the IAAO ranges, and the label rules; Chapter 123 with a labeled made-up example; how the checker works, with the price index chart and table; validation (headline, comparison figures, what changed, the full 70-town table in an expandable section); limitations; version, changelog, CSV, GitHub.
- `/appeal-guide` built: 7 steps for a 2027 appeal. Every fact is followed by its source link. Facts the sources don't cover say "Check with the Bergen County Board of Taxation". Lists the 24 towns with a May 1 deadline. "Sources last checked" date.
- `/about`: founder header and Story unchanged (Zaden's words). Added "What's next" (the 6 Version 2.0 items) and Credits with a Get Updates link.
- `/contact`: page description and a Privacy link under the updates form. The waitlist code is unchanged (Zaden confirmed it works).
- `/privacy` built from what the code does: the checker saves and sends nothing (the only request is the public town file); the updates list stores email, sign-up page, and date in Supabase (insert-only from the site); no analytics or tracking cookies; no ads or selling; delete on request.
- New components: `content/blocks`, `content/Formula`, `content/FilterFunnel`, `content/PriceIndexChart`. New sources in `lib/sources.ts` (state data files, Bergen paper form, state appeal page). Added `katex` 0.16.47 (exact). Removed the unused `ComingSoon` and `AppealBasics` components.
- impeccable detector on the 5 pages: source lines now stop at reading width (it flagged long lines). Page-header eyebrows and the numbered report sections on How It Works are kept on purpose.
- Tests: new `e2e/content-pages.spec.ts` (9 tests). 245 Vitest, 112 Playwright, lint, build pass.

## 2026-10-18 (Prompt 12: appeal checker page)
- `/check` is live. Step 1: a searchable list of all 70 towns (arrow keys, Enter, Escape; `?town=<slug>` preselects one, and the slug is the only thing ever read from the URL). Step 2: assessed value, with commas added as you type. Step 3 (optional, collapsed): your own market value estimate. A lock-icon privacy line sits beside the form. Errors show under each field in plain words and are linked with `aria-describedby`.
- The page only calls `validateInputs` and `runChecker` (Prompt 11). It does no checker math of its own. The browser downloads one file: the public town file you pick.
- Result: keyboard focus moves to the result heading and a live region announces it. Verdict card (5 verdicts, including "No Chapter 123 test in 2027" for revaluation towns, K14), strength, both tests side by side when you enter your own estimate, the balance meter, key numbers (savings only for "may have grounds", labeled as estimates with the 2025 tax rate), warnings, "Show the math", the sales we compared you to (sale month only, no street names), and "What to do next" (deadline, fee, 5 filing steps, all from `data/raw/notes/appeal-deadlines-and-fees.md` with source links). Then Print or save, Check another home, and the disclaimer.
- Balance meter: blue zone below the town's common level range, green inside, gold above; gold dot for the average ratio; navy bar with a whisker for your ratio; a ring for your own estimate. Every mark is labeled, and a sentence for screen readers says the same. A small scale icon tips once (500ms): blue side down above the range, level within, green side down below. It stays still with reduced motion.
- Print stylesheet: logo, inputs, date, result, math (always open), comps, next steps with link addresses, and the disclaimer. No header, footer, form, or buttons.
- Loading skeleton; a friendly "Try again" if the town file fails; "not enough data" explains why and lists other options (the appeal guide, asking the assessor which sales they used, finding 3 to 5 sales yourself, or entering your own estimate).
- Design checks on /check: impeccable audit and detector (placeholder text contrast fixed here and on /towns; the page-header eyebrow flag is the site's locked pattern), review-animations (scale tilt cut from 900ms to 500ms; the wide "Show the math" bar no longer shrinks when pressed), break-ui (limit labels overlapped when both limits are over 100%, now fixed; nothing else broke at 320, 640, or 1280px). Notes in `docs/redesign-audit.md` section 9.
- New sources in `site/lib/sources.ts`: Bergen online filing and the state's Guide to Tax Appeal Hearings (both already quoted in `appeal-deadlines-and-fees.md`).
- Tests: 32 new component tests (form validation, every verdict from a fixed result, privacy scan); new `e2e/check.spec.ts` (10 tests: every verdict at 375px with no sideways scroll, keyboard only, privacy: requests and URL, print view, Check another home, retry). 245 Vitest, 103 Playwright, lint, typecheck, build pass.

## 2026-10-18 (Prompt 10 Part B follow-up: decisions)
- /towns on phones: cards show the first 12 towns, then a "Show all 48 towns" button (a search or filter always shows every match); towns without enough sales sit two across. Phone page 25,180px to 11,712px. New e2e test.
- Tab underline now grows with a transform instead of animating `right` (same look and timing as Trust & Transition).
- Before/after screenshots saved as JPEG (33 MB to 15.4 MB).

## 2026-10-18 (Prompt 10 Part B: UI redesign)
- Audit first: `docs/redesign-audit.md` (impeccable audit and detector, taste-skill lint and inspector, Lighthouse, 26 before screenshots). Then a visual and usability redesign. No number, label, source line, disclaimer, color token, logo, tab, route, or T&T motion value changed.
- Body font is now Public Sans (the U.S. Web Design System typeface) instead of Inter. Headings stay Montserrat.
- Fluid type scale: big headings shrink on phones instead of wrapping to 4-5 lines; tighter letter-spacing on large type; new 72px home headline (`text-5xl`) and 13px chart text (`text-xs`).
- Cards have no shadow at rest (outline only); side notes are tinted panels; only pop-ups and menus float. Callouts lost their colored side stripe. At most one balance divider per page.
- Small motion for hover, press, pop-ups, and menus (120-160ms, off or fade-only with reduced motion). The scroll reveal, scroll cue, and header keep T&T's exact values.
- Home: bigger hero chosen from 3 prototypes ("Refined"); the hero now shows at full strength on load (it failed Lighthouse's contrast check while fading in on phones). "How it works" is a numbered list, not three boxes. Rankings preview and founder sections are side-by-side layouts.
- Town pages: label, rank, and sales count moved into the page header. The Chapter 123 numbers lead as a row of figures. Comparison and context numbers sit in single panels.
- /towns: label counts as figures beside the intro; the table starts at 1024px (it scrolled sideways at 768px); phones and iPads get compact cards with a "More numbers" button.
- About: "The Story" is a side-by-side layout. 404: one line, not two.
- Fixes found with break-ui (worst-case data): long stat values like "$16,500,000" step down a size; sales counts show commas (1,284); label pills never wrap; the town column has a minimum width.
- Fixes found in the audit: "Scroll to explore" no longer wraps on phones; the NJ watermark keeps its shape (Lighthouse "image aspect ratio").
- Lighthouse mobile: home 96/100/100/100 (was 85-95/96/96/100); /towns 91/100/100/100 (was 89-90/100/100/100). 213 Vitest and 92 Playwright tests pass; build clean.
- Docs: `docs/design-system.md` (type, surfaces, micro-interactions, components), `docs/site-format.md` (page patterns, checklist), `/design` style guide.

## 2026-10-18 (Prompt 10 Part A follow-up: decisions)
- Zaden asked Claude to decide the 6 open items. Kept: the "include limited data" toggle starts on; the Median ratio column; no average tax bill (2026 assessments x 2025 rate would mix years); the label pill colors.
- 2027 revaluation warning on town pages: now also says that for a reassessment the County Board's own rules decide, and the county list does not say which towns have which (methodology 2.4 and K14).
- `AppealBasics` (on /check and /appeal-guide): rewritten from Form A-1 for Bergen only. It now gives the 45-day rule, May 1 in the tax year of a town-wide revaluation or reassessment (it used to say "the year after"), received-not-postmarked, the weekend rule, and all 4 fee tiers, with source links. The other-county line is gone.

## 2026-10-18 (Prompt 10 Part A: town rankings and town pages)
- New `/towns` page: intro with pop-up definitions (assessment ratio, PRB, PRD, COD), a forest plot of every ranked town's PRB and 95% range with the gold IAAO band, and a rankings table with search, a label filter, a limited-data toggle, and sorting (PRB by default). Phones get cards. The 22 towns without enough sales are listed below the table with the reason. Links to the CSV download and How It Works.
- New `/towns/[slug]` pages, all 70 built ahead of time (unknown towns are a 404): summary sentence, label and caveats (limited data, outlier sensitivity, 2026/2027 revaluations), 4 stat cards, "Assessment ratio by home value" and "Every sale" charts, a Chapter 123 box with the deadline, fee, and a "Check my assessment in <Town>" button, our median beside the state's ratio, context numbers, and the sales removed by each cleaning rule. Every chart has a caption, a source line, and a "View as table" button.
- Pipeline: new `prb_intercept` field (the PRB line's intercept) in `town_stats.csv`, `towns.json`, the town files, `county.json`, and the CSV download, so the town page can draw the official PRB trend line. Reran from the stats stage. No other number changed. Data contract, data dictionary, and schema updated.
- New `data/raw/notes/state-data-sources.md`: official links for `2027CH123.pdf`, `2026AvgResStat.pdf`, the tax-rate files, and the SR1A page. The 3 PDFs match our copies byte for byte.
- Added Recharts 3.10.1 for charts. Chart colors use the design tokens (`site/lib/chart.ts`).
- `StatCard` has an optional `details` slot (used for the 95% range and IAAO pass/outside lines).
- Town pages use their own browser tab title ("<Town> property assessment fairness | Fair Assess NJ") for search. Other pages keep "Fair Assess NJ". Claude decided this at Zaden's request.
- Tests: new `lib/towns.test.ts` (summary template, table sorting and filtering, stat lines, PRB trend line, Chapter 123 lines, notes) and `lib/chart.test.ts`; new `e2e/towns.spec.ts` (keyboard access to every chart dot, aria-sort, filters, 404); two town pages added to the layout test. The pytest hand-worked PRB test now also checks the intercept.

## 2026-10-18 (Prompt 11 follow-up: decisions)
- Zaden asked Claude to decide the 6 open items. Kept: the 5th result for 2027 revaluation towns (rule K14), a ratio exactly on a limit counts as within, the own-estimate test still runs when sales are thin, the "limited data" warning below 8 sales, and loading the town file as the only request.
- New `data/processed/checker_grounds_sweep.csv` (fixtures stage). It shows how often the comps alone give each result. Only 7 of 3,894 tested values (Alpine and Old Tappan) give "may have grounds".
- Methodology Section 7: new limitation explaining this. Section 6.8: the town-file request shows which town was picked, never a dollar amount.
- The checker result has a new `suggestOwnEstimate` flag, so the checker page can invite the homeowner to enter their own estimate when the comps find no grounds.

## 2026-10-18 (Prompt 11: appeal checker engine)
- New `site/lib/checker/`: the appeal checker's math as pure TypeScript functions (methodology Section 6): `validateInputs`, `selectComps`, `timeAdjust`, `scoreComps`, `estimateMarketValue`, `chapter123Test`, `estimateSavings`, and `runChecker`. Settings are in `config.ts`. No UI yet.
- Results can be: may have grounds (strong or borderline), within range, possibly under-assessed, not enough data, or (for the 24 towns on the 2027 revaluation list) an estimate with no Chapter 123 result, as rule K14 says.
- Privacy: the engine makes no network calls. The only request is `fetchTownFile`, a plain GET for the public town file, with no homeowner input in it.
- New `pipeline/checker_reference.py`: a second checker in Python, written from the methodology. The new `fixtures` stage (last in `pipeline.run`) writes 58 test cases to `pipeline/fixtures/checker_cases.json`.
- Tests: 92 new Vitest tests (3 cases worked by hand, all 58 cases matched to the Python answers, edge cases, invalid inputs, privacy). 13 new pytest tests.
- Methodology 1.6: new Section 6.8, "How the checker is tested". No rule changed. `meta.json` now says 1.6.
- Finding: with real data, only 2 towns (Old Tappan and Alpine) give "may have grounds" at any assessed value we tried. Comps are matched by assessed value (Section 7), so a home's ratio comes out close to its neighbors'.

## 2026-10-15 (Prompt 9 follow-up 3: final touch-ups)
- Every page's browser tab now reads just "Fair Assess NJ", with the logo icon. The name lives in `SITE_NAME` in `site/lib/site.ts`.
- The 4th home stat card now shows "12" with the label "Months of recorded sales", so all 4 numbers line up.
- The gold pivot dot on the inner-page header line (Town Rankings, Appeal Checker, How It Works, Appeal Guide, About, Contact, Privacy, 404) is now a full circle, the same size as before. Only the NJ watermark is clipped now, not the dot.
- About page: removed the "What Drives This Work" eyebrow. The section heading is just "Four promises to every homeowner".
- Results: 88 unit tests, 71 browser tests, lint, and build pass with no warnings.

## 2026-10-15 (Prompt 9 follow-up 2: Zaden's design changes and the About page)
- Home stat cards:
  - added a 4th card, "9 towns leaning regressive" (out of 48 ranked; from `county.json` `ranked_towns_prb_range_below_zero`)
  - all 4 cards sit on one row on laptops and desktops (2 by 2 on iPads, stacked on phones)
  - simpler wording in the summaries and info pop-ups
- Fixed info pop-ups that were cut off behind the next card. The card with an open pop-up is now lifted above the others, and the "i" pop-up opens toward the inside of its own card.
- Rankings preview: the limited-data and 2027 revaluation notes are removed (Zaden). The outlier note stays. Town pages will still show those notes.
- Inner pages (Town Rankings, Appeal Checker, How It Works, Appeal Guide, About, Contact, Privacy, 404) now use Fair Assess NJ colors instead of T&T's dark navy:
  - light blue page header with the balance line
  - white closing band with the blue | green stripe
- "Scroll to explore" is now a white pill with a blue outline on every page. The home page is otherwise unchanged.
- About page built:
  - founder header and bio
  - "The Story" in Zaden's own words, from `private/about-founder.md`, with his approval. The only change is the website's name spacing, "Fair Assess NJ". No source links, per the rule 5 exception.
  - "What Drives This Work": 4 cards. The accuracy card shows "70 of 70 towns within 5 points" from `validation.json` and links to `docs/validation.md`.
  - closing band to Contact
- Results: 88 unit tests, 71 browser tests, lint, and build pass with no warnings.

## 2026-10-15 (Prompt 9 follow-up: home page decisions)
- Zaden delegated items 1–3 and approved 4 and 5.
  1. The rankings preview now also says how many ranked towns have a PRB whose whole 95% range is below zero: 9 of 48, from `county.json`. The regressive stat card's info pop-up says the same.
  2. The preview still shows the top 5 by PRB (methodology 5.4). Any town with the "Regressive pattern" label that ranks below the top 5 is now named under the list, with its rank, PRB, PRD, and caveats. Today that is Bergenfield, rank 6. New helper `labeledOutsidePreview` with 2 tests.
  3. The founder line is kept.
- Item 4: the Get Updates form now says "new towns and appeal season reminders". This covers the contact page heading and note, the form's button ("Get updates"), and its success message.
- Results: 88 unit tests, 71 browser tests, lint, and build pass with no warnings.

## 2026-10-15 (Prompt 9: site layout, navigation, home page)
- New home page (`site/app/page.tsx`), built in this order:
  1. hero ("Is your home assessed fairly?", two buttons, NJ watermark, logo on the right)
  2. three stat cards: 70 towns analyzed, using 3,806 sales; 2 towns showing a regressive pattern out of 48 ranked; 12 months of recorded sales, July 2025 to June 2026
  3. "How it works" 01–03
  4. "Why it matters", with a made-up two-home example, labeled as made up
  5. rankings preview: the first 5 towns by PRB, each with its real label, PRB and PRD to 4 decimals, and caveats
  6. Meet the Founder teaser + "Get updates" link
  7. closing CTA band
  8. the disclaimer
- All numbers on the page come from `meta.json`, `county.json`, and `towns.json` through `lib/data/load.ts`.
- The waitlist form is no longer on the home page. It lives at `/contact#updates`.
- New `site/lib/home.ts` (formatting, rankings preview, PRB in plain words, label text, caveats, example tax shares) with 13 tests in `home.test.ts`.
- Layout changes:
  - "Skip to main content" link
  - new default title and description (no more "Join the waitlist")
  - the footer reads "Data as of" through `loadMeta()`, shows it as "June 30, 2026", and shows the methodology version
- The 404 page gets the balance divider and Home + Check My Assessment buttons.
- `StatCard` takes an optional link. Removed the old landing sections that were no longer used: `ProblemSection`, `BuildingSection`, `MethodologySection`, `WaitlistSection`, `ConceptDiagram`.
- `lib/data/load.ts`: added a bundler ignore comment, which removes the "whole project traced" build warning.
- Browser tests:
  - `e2e/layout.spec.ts` adds a 375px screen
  - `e2e/motion.spec.ts` now targets the new section IDs (`#numbers`, `#rankings`)
- Results: 86 unit tests, 71 browser tests, lint, and build pass with no warnings.

## 2026-10-15 (Prompt 8 follow-up: export decisions)
- Zaden delegated the 3 open items. (1) Comps keep the full deed date (rule K6 counts days); no street names. (2) The price index chart starts at the comp window, October 2024 (new `chart_from` in `price-index.json`); January to April 2024 have only 1 to 8 sales each and stay in the table only. Methodology 1.5 adds this display note; the index math is unchanged. (3) Each town's cleaning-log rows moved from `filter-log.json` into its own town file (`filter_log`), so town pages can show how many sales each rule removed; `filter-log.json` keeps the rules and county rows (227 KB to 3.4 KB).
- Sizes now: total 988.8 KB (budget 5 MB); largest town file 53.5 KB, Mahwah (budget 150 KB). Data contract and zod schemas updated. 3 new pipeline tests (177 pass); site tests, validate-data, lint, and build pass.

## 2026-10-15 (Prompt 8: data export for the website)
- New `pipeline/price_index.py` (rules K4 and K5) and an `index` stage: writes `data/processed/price_index.csv`, the Bergen monthly price index (30 deed months, January 2024 to June 2026; none dropped as incomplete; base month June 2026).
- New `pipeline/export.py` and an `export` stage. It writes `site/public/data/`: `meta.json`, `county.json`, `towns.json` (all 70 towns), `towns/<slug>.json` (70 files: town entry, value quarters, up to 300 chart points, and the checker's comp pool), `price-index.json`, `validation.json`, and `filter-log.json`. Also the open-data download `site/public/downloads/fairassess-nj-town-stats.csv`. Ratios rounded to 4 decimals, COD to 2, money to whole dollars; NaN and Infinity are refused.
- Comps carry only deed date, sale price, assessed value, and ratio. No street names, house numbers, owner names, or record IDs.
- Size budget checked on every export: total 1,035 KB (budget 5 MB); largest town file 50.9 KB, Mahwah (budget 150 KB).
- New `docs/data-contract.md` (every file and field). Site: zod schemas and types in `site/lib/data/schema.ts`, a validating loader in `site/lib/data/load.ts`, folder checks in `site/lib/data/validate.ts`, and `npm run validate-data`. `npm run build` now runs it first, so a bad or missing data file fails the build. Added `zod` and `tsx` to `site/package.json`.
- Tests: 22 new in `pipeline/tests/test_export.py` (174 pipeline tests pass); 11 new in `site/lib/data/schema.test.ts`. README, architecture, and data dictionary section 12 updated.

## 2026-10-15 (Prompt 7 follow-up: town page decision)
- Decided (Zaden delegated): town pages will show the state's 2027 average ratio beside our home median, with a plain-English note on why they differ (land and commercial property, price weighting, two-year blend; extra line for 2026 revaluation towns). Recorded in `docs/validation.md` ("What I changed", item 5). To be built in the town-pages prompt; no site files changed now.

## 2026-10-15 (Prompt 7 follow-up: the state's method found, rule V4)
- Zaden delegated the 4 open items. Found how the Director computes the average ratio: a 2026 Tax Court opinion (*City of New Brunswick v. Director*) describes "a weighted, classified and multi-year-averaged sales study" that averages each year's true value with the prior year's. Saved the opinion and the 2025 Table of Equalized Valuations in `data/raw/`, with quotes in `data/raw/notes/director-average-ratio-method.md`.
- New `data/processed/tev_bergen.csv` (2025 and 2026 Tables, parse stage). New rule V4 in `pipeline/validate.py`: rebuild the state's one-year ratio from our sales (weighted, homes vs other property) and compare it with the state's one-year ratio backed out of the two Tables. Result: **70 of 70 towns within 5 points, 66 within 1 point**; no town flagged. Averaging with the prior year raises the published ratio in 69 of 70 towns (median +4.6 points), which explains the old gap.
- Methodology 1.4: Section 2.4 (how the ratio is computed), Section 3.1 (2 new sources), V1/V2/V3 pipeline numbers, V2 uses TOTAL ASSESSMENT for multi-lot sales, new V4 with the 5-point flag, Section 7 limitation. No cleaning or statistics rule changed.
- `docs/validation.md` rewritten around V4, with the "What I changed" section filled in. `validation.csv` has new columns (data dictionary section 11; new `tev_bergen.csv` entry). 152 pipeline tests pass.

## 2026-10-15 (Prompt 7: validation against state ratios)
- New `pipeline/validate.py` and a `validate` stage in `pipeline/run.py`. Output: `data/processed/validation.csv` (all 70 towns) and a generated results block inside `docs/validation.md` (the rest of that file is hand-written and kept on rerun).
- Result: for 44 of 70 towns, our state-style ratio (mean of all usable class 1, 2, and 4 sales) was within 5 points of the state's 2027 average ratio. The state's ratio is higher in 69 of 70 towns (median gap 4.5 points), and in 4 towns it is higher than every one of the town's sales, so the state uses a step our files do not describe. Same sales as the state in 70 of 70 towns; V2 coefficient match in 69 of 69; average sale price match in 69 of 69.
- Found that the state pairs multi-lot sales with TOTAL ASSESSMENT (its SALES-RATIO field). Using it in the validation comparison fixes the 4 old V2 misses. No cleaning rule or methodology rule changed.
- `docs/validation.md` rewritten: how the state computes its ratio (and what is not in our files), our two versions, the full table, the 10 biggest flagged towns explained (mostly small samples and 2026 revaluations; Wallington unexplained), and what this means for the rankings.
- `config.py`: validation constants (5-point flag is a proposal, not yet in the methodology). 13 new tests in `test_validate.py`; 145 pipeline tests pass. Two runs give identical files. README and data dictionary section 11.

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
