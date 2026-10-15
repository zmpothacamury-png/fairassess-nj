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
 │ parse → clean → stats →      │
 │ validate → index → export    │
 └──────────────────────────────┘
              │
              ▼
 Processed CSVs                                   data/processed/
              │
              ▼  (export step)
 Small JSON files: meta, county, town list, one file
 per town, price index, validation, filter log
                                                  site/public/data/
 + open-data CSV                                  site/public/downloads/
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
- The site only reads static JSON. Every file and field is listed in `docs/data-contract.md`, with a matching zod schema in `site/lib/data/schema.ts`.
- `npm run build` first runs `npm run validate-data`. If a data file is missing, has the wrong shape, or is over the size budget (150 KB per town file, 5 MB in all), **the build fails**, so bad data never reaches users. (Changed in Prompt 8; before that, the build passed without data.)
- Pages read the files with `site/lib/data/load.ts`, which validates each file again on read.
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
