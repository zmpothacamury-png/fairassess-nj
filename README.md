# FairAssess NJ

Testing whether New Jersey property assessments are fair across price levels, plus a free tool that helps homeowners check whether a tax appeal is worth filing.

Live site: coming soon

## What is in this repo

| Folder | What it holds |
|---|---|
| data/raw/ | Untouched downloads. Not uploaded (too big). See docs/methodology.md for sources. |
| data/interim/ | Cleaned and merged tables. Not uploaded; rebuilt by the code. |
| data/processed/ | Final tables used in the analysis and on the website. |
| data/reference/ | Director's Ratios, tax rates, revaluation years, non-usable sale codes. |
| notebooks/ | Exploratory work, numbered 01_, 02_, ... |
| src/ | Python pipeline: load, clean, ratio study, regression, Chapter 123 flags, comps, site export. |
| reports/ | Memos and one-page findings for each town. |
| site/ | The website (Next.js), deployed on Vercel. |
| docs/ | Methodology, data dictionary, changelog, work log. |

## How to run

Install the Python packages:

    python -m pip install -r requirements.txt

Preview the website:

    cd site
    npm install
    npm run dev

Then open http://localhost:3000

## License

Code: MIT (see LICENSE). Reports and data: CC-BY 4.0.

## Disclaimer

FairAssess NJ provides public-data analysis for educational purposes. It is not legal advice, tax advice, or an appraisal. Homeowners file and present their own appeals. Check your county board for current deadlines, fees, and forms.
