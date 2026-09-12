# Changelog

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
