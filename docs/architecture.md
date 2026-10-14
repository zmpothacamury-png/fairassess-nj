# Architecture

How FairAssess NJ is put together for v1 (Bergen County, single-family homes).
Written 2026-10-14 after the Prompt 1 repo audit.

## Folder layout

```
fairassessnj/
├── data/
│   ├── raw/              Original downloads. Never edited. Gitignored.
│   │   ├── sr1a/         SR1A sales zips + file layout PDFs
│   │   ├── state/        Chapter 123, Director's ratios, COD tables, tax rates
│   │   └── notes/        Source notes for outside facts (deadlines, fees, links)
│   ├── interim/          Temporary pipeline files (unzipped SR1A, parsed PDFs). Gitignored.
│   ├── processed/        Final pipeline tables (CSV). Committed if under 5 MB each.
│   └── reference/        Director's ratios, tax rates, revaluation years, non-usable sale codes
├── pipeline/             Python data pipeline (replaces the old src/ folder)
│   └── tests/            pytest tests, one or more per calculation
├── site/                 Next.js website. Vercel builds ONLY this folder.
│   ├── app/              Routes (App Router)
│   ├── components/       React components
│   ├── content/          Markdown for the appeals guide, methodology, and about pages
│   ├── lib/              Helpers (Supabase client, checker math, data loading)
│   └── public/
│       └── data/         Generated JSON from the pipeline. Never hand-edited.
├── docs/                 methodology, validation, data dictionary, architecture, changelog, ...
├── notebooks/            Exploratory notebooks (01_, 02_, ...)
├── reports/              Memos and one-page town findings
├── brand/                Original logo files
└── private/              Gameplan, test homes, build log. Never pushed.
```

## Data flow

```
 SR1A sales files (2024, 2025, 2026, YTD 2026)
 + state files (Chapter 123 ratios, Director's ratios,
   COD tables, tax rates)                         data/raw/
              │
              ▼
 ┌──────────────────────────────┐
 │ Python pipeline (local only) │   pipeline/   runs on Zaden's PC
 │ load → clean → ratio study → │
 │ Chapter 123 → export         │
 └──────────────────────────────┘
              │
              ▼
 Processed CSVs                                   data/processed/
              │
              ▼  (export step)
 Small JSON files: one town list + one file per town
                                                  site/public/data/
              │
              ▼  (git push → Vercel builds site/)
 ┌──────────────────────────────┐
 │ Next.js site on Vercel       │
 │  - Town pages read the JSON  │
 │  - Appeal checker math runs  │
 │    in the visitor's browser  │──── nothing a homeowner types
 └──────────────────────────────┘     is sent, saved, or logged
              │
              ▼  (waitlist form only)
 Supabase: "waitlist" table, insert-only (Row Level Security on)
```

Key points:
- No analysis runs on a server. The pipeline runs on Zaden's machine. The checker runs in the browser.
- The site only reads static JSON. If the JSON is missing, the build should still pass.
- Supabase is used only for the waitlist (and maybe a feedback form later).

## Site routes (planned)

| Route | What it shows |
|---|---|
| `/` | Home page: what the project is, links to towns and the checker, waitlist |
| `/towns` | Table of Bergen County towns with median ratio, COD, PRD, PRB |
| `/towns/[slug]` | One town: its measures, a chart with a table alternative, plain-English summary |
| `/check` | Appeal checker: town + assessed value → market value range and Chapter 123 result |
| `/methodology` | How every number is calculated (from docs/methodology.md) |
| `/appeal-guide` | How and when to file an appeal in Bergen County, with deadline and fee |
| `/about` | Who built this and why |
| `/contact` | Get Updates form (`#updates`), email, report a data problem, press line. Not a header tab: linked from the footer (Zaden's choice). |
| `/privacy` | What the site collects (waitlist email only) and what it never collects |
| `/design` | Internal style guide (hidden from search engines, not in the nav) |
| 404 page | `app/not-found.tsx`: friendly "page not found" with links home |

Every page shows the disclaimer from CLAUDE.md rule 4, word for word.
Header tabs, footer layout, page skeletons, and motion: see `docs/site-format.md`.
