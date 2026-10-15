# FairAssess NJ — Instructions for Claude Code

## Mission
FairAssess NJ is a free web app that helps Bergen County homeowners find out if their home is assessed fairly for property taxes. In New Jersey, a tax bill depends on the assessed value the town sets. If that value is too high compared to what the home is worth, the owner pays more than their fair share.

Two features:
1. Town rankings: using public NJ sales data (SR1A files), compare each sold home's assessed value to its sale price. Use the standard IAAO measures (median ratio, COD, PRD, PRB) to show whether each town tends to over-assess cheaper homes compared to expensive ones.
2. Appeal checker: a homeowner enters their town and assessed value. The app compares their home to recent similar sales in that town, estimates a market value range, applies New Jersey's Chapter 123 test, and says in plain English whether they may have grounds to appeal, are within the normal range, or whether there is not enough data. It explains how and when to file.

The full long-term plan is in private/gameplan.md. Read it when a task needs project context.

## Deadline
2026 Congressional App Challenge. The official deadline is Monday, October 26, 2026 at 12:00 PM ET. Zaden plans to submit on October 25, 2026.

## Who you are working with
Zaden, a high school student. Explain things in simple words. He uses Windows, so every command you give him must be for Windows PowerShell.

## Scope for v1 (submission on Oct 25, 2026)
- Bergen County only (county code 02). Residential single-family homes (property class 2).
- Data: NJ SR1A sales files; Chapter 123 average ratios and common level ranges for tax year 2027; Director's ratio history; Coefficient of Deviation tables; general tax rates.
- Out of scope for v1 (this is the 2.0 roadmap, shown on the site and in the README): statewide coverage; address lookup with MOD-IV parcel records; hedonic regression; revaluation-drift test; appeal outcome tracking; Spanish version and accessibility features for older users beyond the v1 baseline.

## Stack
- Data pipeline: Python 3.11+ in pipeline/ using pandas, numpy, pdfplumber, openpyxl, pytest. Virtual environment in .venv.
- Keep Python simple: pandas, small functions, a short docstring on each one.
- Website: the existing Next.js (App Router) + Tailwind CSS app in site/, deployed on Vercel from GitHub. Vercel builds and deploys ONLY the site/ folder. Supabase is used ONLY for the waitlist (and an optional feedback form).
- Data flow: Python runs locally on Zaden's machine and writes small JSON files into site/public/data/ (made by the pipeline's export step; never hand-edit them). The site reads those files. All checker math runs in the browser. No analysis runs on a server.

## Folders
- data/raw/ — original downloads. NEVER edit, move, or delete anything here. Gitignored.
- data/raw/notes/ — source notes for outside facts (deadlines, legal rules, links).
- data/interim/ — temporary pipeline files. Gitignored.
- data/processed/ — final pipeline tables (CSV). Committed if each file is under 5 MB.
- data/reference/ — Director's Ratios, tax rates, revaluation years, non-usable sale codes.
- pipeline/ — Python code. Tests in pipeline/tests/.
  - Transition note: early draft code still lives in src/. When the pipeline is built, move the v1 modules into pipeline/ and then delete src/ (Zaden approved this on 2026-10-14). src/hedonic.py is 2.0 roadmap work (hedonic regression), not v1. Do not build on it for v1.
  - Done in Prompt 2 (2026-10-14): DISCLAIMER.md and the site footer now use the combined disclaimer in rule 4.
  - Name on the website (Zaden, 2026-10-15): only the website writes the name "Fair Assess NJ" (two words; "FAIR ASSESS NJ" in the wordmark), including inside the rule 4 disclaimer as shown on the site. Everything else (repo docs, DISCLAIMER.md, logo artwork) keeps "FairAssess NJ".
- notebooks/ — exploratory notebooks, numbered 01_, 02_, ...
- reports/ — memos and one-page town findings.
- site/ — the Next.js website. site/public/data/ holds the generated JSON. Never hand-edit it.
- site/content/ — Markdown for the appeals guide, methodology, and about pages.
- docs/ — methodology.md, validation.md, data-dictionary.md, facts-sheet.md, video-script.md, site-format.md, changelog.md. (docs/log.md is an older work log, kept for reference. New session entries go in private/build-log.md.)
- brand/ — original logo files.
- private/ — NEVER pushed: gameplan, test homes, build log, notes. Never copy text from here into other files unless Zaden asks.

## Non-negotiable rules
1. Never run git commit, git push, or change git config. Zaden reviews and commits every change himself.
2. Never put secrets in code. Supabase keys live only in .env.local and Vercel environment variables. Only the anon key may reach the browser, and Row Level Security stays on. Never put passwords, API keys, owner names, or home addresses in any file outside private/.
3. Privacy: the checker never sends, saves, or logs anything a homeowner types. No analytics event may include input values. All checker math runs client-side.
4. Every website page, every page that shows results, and every checker result shows this disclaimer, word for word:
   "FairAssess NJ is an independent student research project that uses public data. It is not legal, tax, or appraisal advice. Homeowners file and present their own appeals. Confirm deadlines, fees, and forms with the Bergen County Board of Taxation."
5. Never invent data, statistics, URLs, deadlines, or legal facts. If something is missing, stop and ask Zaden. Every number on the site must trace to a pipeline output file. Every outside fact must come from a file in data/raw/ or data/raw/notes/ and show its source link on the site.
   - One exception (Zaden, 2026-10-14): the "The Story" paragraphs on the About page, which are Zaden's own words (private/about-founder.md), show no source links. Their facts must still be backed up in data/raw/notes/about-page-facts.md. This exception covers only those paragraphs. Everything else on the About page, and every other page, follows rule 5 in full.
6. Plain English, at an eighth-grade reading level. Use short sentences and put numbers before adjectives. Write for a homeowner with no finance background. Explain each term (assessment ratio, COD, PRD, PRB, Chapter 123, common level range) the first time it appears on a page.
7. Never say "you will win." Always show the appeal deadline and fee wherever appeals are discussed.
8. docs/methodology.md is the source of truth for every analysis rule. If code and methodology disagree, stop and tell Zaden. Never change a methodology rule on your own; propose it as a YOU DECIDE item.
9. After Prompt 2, use the design tokens only. No hard-coded hex colors in components.
10. Every calculation gets a test.
11. Accessibility: WCAG 2.1 AA contrast, keyboard navigation, labels on every input, and charts that have a text or table alternative.
12. Before saying a website change is finished, run npm run build inside site/ and fix any errors.
13. Add a dated line to docs/changelog.md for each meaningful change.

## Every session
- Start: read CLAUDE.md, docs/methodology.md, and the last 3 entries of private/build-log.md.
- Before changing more than 3 files: show a short plan and wait for Zaden's "go".
- End: run the relevant tests and/or the site build. Then give Zaden (a) every file changed, (b) what to check by hand, (c) PowerShell commands he needs to run, (d) YOU DECIDE items. Append an entry to private/build-log.md with: date, prompt number, what was built, decisions Zaden made, where he changed your proposal, and open questions.

## Design summary (details in the design system from Prompt 2)
The look comes from the FairAssess NJ logo: a house on top of balance scales over a New Jersey outline, split blue on the left and green on the right, with a gold center point. Deep navy wordmark in a bold geometric sans-serif (all caps), tagline "PUBLIC ASSESSMENT EQUITY". Feel: trustworthy, civic, calm, clear, balanced. Not a flashy startup. Site structure, page skeletons, and motion follow docs/site-format.md (from Prompt 2B), modeled on Zaden's other site, trustandtransition.org.
