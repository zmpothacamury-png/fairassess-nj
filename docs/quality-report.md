# Quality report: SEO, accessibility, performance, security

Prompt 14, 2026-10-18. Every number below comes from a test run on Zaden's machine against the production build (`npm run build`, then `npm run start -- -p 3100`).

## 1. Lighthouse (mobile)

Lighthouse 13.5.0, default mobile settings (simulated slow 4G and a slower phone CPU), headless Chrome. Scores are out of 100.

**Before** (one run per page, before any Prompt 14 change):

| Page | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| `/` | 96 | 100 | 100 | 100 | 2.9 s | 0 | 10 ms |
| `/towns` | **89** | 100 | 100 | 100 | 3.7 s | 0 | 100 ms |
| `/towns/teaneck` | 91 | 100 | 100 | 100 | 3.4 s | 0 | 80 ms |
| `/check` | 95 | 100 | 100 | 100 | 2.9 s | 0 | 10 ms |

**After** (median of 3 runs per page; the 3 runs are in brackets):

| Page | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| `/` | 95 (94/95/95) | 100 | 100 | 100 | 3.0 s | 0 | 10 ms |
| `/towns` | 94 (94/94/94) | 100 | 100 | 100 | 3.1 s | 0 | 80 ms |
| `/towns/teaneck` | 95 (95/95/96) | 100 | 100 | 100 | 2.9 s | 0 | 70 ms |
| `/check` | 94 (94/94/94) | 100 | 100 | 100 | 3.1 s | 0 | 0 ms |

All four pages now meet the 90+ target in every category. A single run can move by 1 to 2 points, so the "after" table uses the middle of 3 runs. Lighthouse on Vercel will differ a little: Vercel compresses and caches differently from `next start`.

**Note on `/` and `/check`.** Their single "before" runs (96 and 95) are 1 point above the "after" medians. That is inside the run-to-run spread. Both pages got the same changes as the others (smaller logo files, the outline image preloaded).

## 2. axe-core accessibility scan

`@axe-core/playwright` 4.14.0, rules tagged WCAG 2.0/2.1 A and AA. `e2e/a11y.spec.ts` fails on any **serious** or **critical** issue.

| Page / state | Before | After |
|---|---|---|
| `/` | 0 issues | 0 issues |
| `/towns` | 0 | 0 |
| `/towns/teaneck` | 0 | 0 |
| `/check`, empty | 0 | 0 |
| `/check`, with a result and "Show the math" open | 0 | 0 |
| `/methodology` | 0 | 0 |
| `/appeal-guide` | 0 | 0 |
| `/about` | 0 | 0 |
| `/privacy` | 0 | 0 |
| `/contact` (extra) | 0 | 0 |

No violations at any level, before or after. Between 43 and 56 rules passed on each page.

axe also lists some color-contrast checks as "needs review" (it could not decide, so these are not failures). They were checked by hand:
- The header and other text over the New Jersey outline image: axe can't measure contrast over a picture. These pairs (navy and ink on blue-100, mist, and white) are in `lib/contrast.ts`, and `npm test` checks them against WCAG AA.
- Gold-700 text in the "Made-up example" card on /methodology: the gradient axe saw is the 4px blue and green stripe on top of the card. The text sits on white (gold-700 on white is an approved pair).
- KaTeX formula pieces and chart tick labels: too short or only symbols for axe to judge. They use ink and navy on white.

## 3. Manual accessibility checks

Each check below is now an automated test, so it stays true.

| Check | Result | How it was checked |
|---|---|---|
| Keyboard-only use of the checker | Pass | `e2e/check.spec.ts`: type the town, choose it with the arrow keys and Enter, Tab to the value, submit with Enter. Errors are linked to their fields, and focus moves to the result heading. |
| Keyboard-only use of the rankings table | Pass | `e2e/a11y.spec.ts`: a sort button works with Enter and Space and `aria-sort` updates. `e2e/towns.spec.ts`: every forest-plot dot is a link reached with Tab. On phones, "Show all" moves focus to town 13. |
| Visible focus everywhere | Pass | `e2e/a11y.spec.ts`: the first 25 Tab stops on 10 pages (and the 404 page) all show a 2px outline or a ring. |
| 200% browser zoom | Pass | `e2e/a11y.spec.ts`: a 1280px window at 200% (640 CSS px wide, 2x pixels). No page scrolls sideways. `e2e/layout.spec.ts` also covers 375px to 1440px. |
| Reduced motion | Pass | `e2e/motion.spec.ts`: with reduced motion on, everything shows in place and nothing moves. The skeleton placeholders added here don't animate. |
| `html lang="en"` | Pass | `e2e/a11y.spec.ts` checks every page. `app/global-error.tsx` sets it too. |
| Every chart has a text alternative | Pass | `e2e/a11y.spec.ts`: each chart on /towns, a town page, and /methodology sits in a figure with a "View as table" button and its table. The tables are in the HTML, so they work before the charts load. |

## 4. Performance: what changed

1. **The New Jersey outline behind each page header was the slowest element (LCP) on every inner page.** It was lazy-loaded and fetched at up to 3840px wide. Now it is preloaded (`preload`) with `sizes` near its shown width (300 to 360px). On the home page, the hero outline is preloaded the same way.
2. **Logo images were about 9 times bigger than shown.** The header, footer, hero, and About logos now ask for files near their shown size (for example 25 x 44 in the header instead of 394 x 698). `priority` (deprecated in Next.js 16) was replaced.
3. **Chart code (Recharts) now loads after the page shows,** on `/towns` (forest plot) and town pages (two charts). Each chart keeps a box of its exact height while it loads, so nothing moves (CLS stays 0). The tables and all the numbers are in the page from the start. The forest plot's Recharts part moved to `components/towns/ForestChart.tsx`. This change took `/towns` from 89 to 94.
4. **Cache header for `/data/*.json`**: browsers keep the files 10 minutes, and Vercel's CDN keeps them until the next deploy.
5. Already in place before Prompt 14: every page is built ahead of time (all 70 town pages through `generateStaticParams`), and fonts load through `next/font`.

**A loading page was tried and removed.** A site-wide `app/loading.tsx` made every pre-built page send its skeleton first and the real content at the end of the HTML. On a slow phone, the footer showed first and then jumped (CLS 0.38) and the page took longer. Every page is pre-built, so visitors never wait on the server, and the file was removed. Places that do load something (the checker's town file) already show their own loading message.

## 5. Security headers

Set for every path in `site/next.config.ts`:

| Header | Value |
|---|---|
| Content-Security-Policy | `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' <Supabase URL>; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'` |
| X-Content-Type-Options | `nosniff` |
| X-Frame-Options | `DENY` (older browsers; same as frame-ancestors) |
| Referrer-Policy | `strict-origin-when-cross-origin` |
| Permissions-Policy | `camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()` |

- The pages are static, so the policy follows the Next.js "without nonces" setup. It allows inline scripts, which Next.js needs for its page data and which the reveal script uses. Nonces would force every page to be rendered on each request.
- `'unsafe-eval'` is allowed only in `next dev`, never in production (a test checks this).
- Vercel Web Analytics loads from the site's own address in production, so `'self'` covers it.
- Zod's speed check tried `Function("")` and the browser reported it as a CSP problem (Best Practices 96). `z.config({ jitless: true })` in `lib/data/schema.ts` turns that check off.
- **Waitlist still works**: `e2e/seo-security.spec.ts` fills the Contact form and checks that the request to Supabase leaves the browser (the CSP allowed it) and that the success message shows. The test answers the request itself, so no email is saved.

## 6. Search and sharing

- Every page: title "Fair Assess NJ" (Zaden's rule), its own description, a canonical link on the production URL (`lib/site.ts`, which follows Vercel's production domain), Open Graph and Twitter tags (`lib/seo.ts`).
- Share images: the site-wide `opengraph-image.png` / `twitter-image.png` with alt text. Each town page has its own image made with `next/og` (`app/towns/[slug]/opengraph-image.tsx`): the town name, its label in the label's colors, and the logo on the mist background. All 70 are made at build time. Colors are read from the design tokens. The font is Montserrat (SIL Open Font License, `site/assets/fonts/`).
- `sitemap.xml`: 8 pages and 70 town pages, dated with the data export date. `robots.txt`: everything allowed except `/design`.
- JSON-LD: `WebApplication` on every page. `Dataset` on `/towns` for the town stats CSV (name, description, SR1A source, CC-BY 4.0 license from the README, date modified from `meta.json`).
- Icons: `favicon.ico`, `icon.png`, `apple-icon.png` (from Prompt 2) are linked on every page (tested).

## 7. Analytics

Vercel Web Analytics, page views only (Zaden approved, 2026-10-18). It runs only in Vercel builds, and it must also be turned on in the Vercel dashboard. A `beforeSend` removes the `?query` and `#hash` from every URL. No custom events exist. A Vitest test fails if any file other than `components/SiteAnalytics.tsx` imports the package or calls `track(`. The checker's own privacy test already bans "analytics" in its code. `/privacy` describes it, with its source in `data/raw/notes/vercel-web-analytics.md`.

## 8. Tests

256 Vitest (10 new, in `lib/seo.test.ts`), 145 Playwright (`e2e/a11y.spec.ts` with 23 tests and `e2e/seo-security.spec.ts` with 10 are new), lint, build: all pass.
