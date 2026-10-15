# FairAssess NJ

Testing whether Bergen County, New Jersey assesses single-family homes fairly across price levels, plus a free tool that helps homeowners check whether a tax appeal may be worth filing. Version 1 covers Bergen County only; statewide coverage is on the 2.0 roadmap.

Live site: coming soon

## What is in this repo

| Folder | What it holds |
|---|---|
| data/raw/ | Untouched downloads. Not uploaded (too big). See docs/methodology.md for sources. |
| data/interim/ | Cleaned and merged tables. Not uploaded; rebuilt by the code. |
| data/processed/ | Final tables used in the analysis and on the website. |
| data/reference/ | Director's Ratios, tax rates, revaluation years, non-usable sale codes. |
| notebooks/ | Exploratory work, numbered 01_, 02_, ... |
| pipeline/ | Python pipeline: load, clean, ratio study, Chapter 123 test, comps, site export. Tests in pipeline/tests/. |
| src/ | Early draft stubs. Being replaced by pipeline/ and then deleted. |
| reports/ | Memos and one-page findings for each town. |
| site/ | The website (Next.js), deployed on Vercel. |
| docs/ | Methodology (the rules for every number), validation, data dictionary, changelog. |

## How to run

Set up Python (Windows PowerShell, Python 3.11 or newer):

    py -m venv .venv
    .\.venv\Scripts\python.exe -m pip install -r pipeline\requirements.txt

Build the data tables (needs the raw files in data\raw\). One command runs every stage in order (parse, clean, stats, then validate) and stops with a clear message if an input file is missing:

    .\.venv\Scripts\python.exe -m pipeline.run

To rerun only the cleaning step (and any later stages):

    .\.venv\Scripts\python.exe -m pipeline.run clean

To rerun only the town statistics:

    .\.venv\Scripts\python.exe -m pipeline.run stats

To rerun only the check against the state's numbers (writes data\processed\validation.csv and the results block in docs\validation.md):

    .\.venv\Scripts\python.exe -m pipeline.run validate

Run the Python tests:

    .\.venv\Scripts\python.exe -m pytest pipeline/tests

Preview the website:

    cd site
    npm install
    npm run dev

Then open http://localhost:3000

## License

Code: MIT (see LICENSE). Reports and data: CC-BY 4.0.

## Disclaimer

FairAssess NJ provides public-data analysis for educational purposes. It is not legal advice, tax advice, or an appraisal. Homeowners file and present their own appeals. Check your county board for current deadlines, fees, and forms.
