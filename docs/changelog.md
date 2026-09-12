# Changelog

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
