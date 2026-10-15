# Data dictionary

This file lists every input field the v1 pipeline reads and every reference table. Output tables (in `data/processed/` and `site/public/data/`) are added here when the pipeline creates them. Rules (C1, K2, ...) refer to `docs/methodology.md`.

## 1. SR1A sales files (`data/raw/sr1a/Sales2025.zip`, `Sales2026.zip`)

- Each zip holds one fixed-width text file. Every line is **663 characters**. Encoding: read as Latin-1.
- Field positions follow `SR1Afilelayout.pdf` (the 663-character extract). Meanings follow `SR1A_FileLayout_Description.pdf`. Where they disagree, the data and the 663-character layout win (methodology Section 3.1).
- Positions are 1-based and inclusive, as in the PDF. In Python, field `start..end` is `line[start-1:end]`.

| Field | Start | End | Our column | Type | Meaning | Used by |
|---|---|---|---|---|---|---|
| COUNTY-CODE | 1 | 2 | `county_code` | text | County. Bergen = "02". | C1 |
| DISTRICT-CODE | 3 | 4 | `district_code` | text | Town within the county. Joined with county as `cd_code` ("0201"). | All town rules |
| U-N-TYPE | 34 | 34 | `usable` | text | U = usable sale, N = non-usable. | C3 |
| SR-NU-CODE | 35 | 37 | `nu_code` | text | State's non-usable code, "01" to "36" (strip spaces; stored left-aligned, like "10 "). | C3 log |
| REPORTED-SALES-PRICE | 38 | 46 | `price_reported` | whole dollars | Price on the recorded deed. | Backup for price |
| VERIFIED-SALES-PRICE | 47 | 55 | `price` | whole dollars | Price verified by the state. Our sale price. | Ratio, C4 |
| ASSESSED-VALUE-LAND | 56 | 64 | `av_land` | whole dollars | Land assessment, main lot. | Info |
| ASSESSED-VALUE-BLDG | 65 | 73 | `av_bldg` | whole dollars | Building assessment, main lot. | Info |
| ASSESSED-VALUE-TOTAL | 74 | 82 | `av` | whole dollars | Total assessment, main lot. | Ratio, C5 |
| PROPERTY-LOCATION | 298 | 322 | — | text | Street address. **Never read into any output** (CLAUDE.md rule 2). | Not used |
| GRANTOR-NAME, GRANTEE-NAME and their addresses | 110 | 297 | — | text | Seller and buyer names. **Never read into any output.** | Not used |
| DEED-DATE | 339 | 344 | `deed_date` | date, **YYMMDD** | Date the deed was signed. | K2, K4, K6 |
| DATE-RECORDED | 345 | 350 | `recorded_date` | date, **YYMMDD** | Date the deed was recorded. Sets the state's sampling period. | T0, V1 |
| BLOCK | 351 | 355 | `block` | text | Tax block. | C7 check |
| LOT | 360 | 364 | `lot` | text | Tax lot. | C7 check |
| ETC | 369 | 369 | `etc_flag` | text | "X" = extra lots in the sale. Unreliable in Sales2024. | C6 |
| ADDL-BLOCK(1) to (5) | 370, 420, 470, 520, 570 | +8 | `addl_block_1`..`_5` | text | Extra lots in the sale. Any non-blank = multi-lot. | C6 |
| QUALIFICATION-CODES | 620 | 624 | `qual_code` | text | Starts with "C" = condominium unit. | C10 |
| ASSESS-YEAR | 625 | 626 | `assess_year` | 2-digit year | Tax year of the assessment paired with the sale. | C5, C9, K2 |
| PROPERTY-CLASS | 627 | 629 | `property_class` | text | "2" = Residential (strip spaces). | C2 |
| YEAR-BUILT | 653 | 656 | `year_built` | year | Actual or effective year built. Read for reporting only in v1. | 2.0 |
| LIVING-SPACE | 657 | 663 | `living_sqft` | square feet | Living area of the main building. Read for reporting only in v1. | 2.0 |

**Privacy rule for the parser.** The parser drops names and addresses (positions 110 to 322) as soon as a line is read. They never reach `data/interim/`, `data/processed/`, or the site.

## 2. Reference tables (`data/reference/`)

These are small tables copied by hand or by a one-time script from a saved source. Each row says where it came from.

### `bergen_revaluation_towns.csv`
| Column | Type | Meaning |
|---|---|---|
| `district_code` | text | 4-digit county+district code from 2027CH123.pdf, like "0201". |
| `district_name` | text | Name as the state spells it in 2027CH123.pdf. |
| `name_on_county_list` | text | Name as printed on the county's revaluation list. |
| `revaluation_tax_year` | year | 2026 or 2027: the tax year the new assessments take effect. |
| `source` | text | Where the row came from. |

60 rows: 36 towns for 2026, 24 for 2027. The county list does not say which towns had a revaluation and which had a reassessment. 9 names needed a manual match because the state abbreviates them (for example, "HO-HO-KUS" = "HOHOKUS BORO", "TWP. OF WASHINGTON" = "WASHINGTON TWP").

### `nonusable_codes.csv`
| Column | Type | Meaning |
|---|---|---|
| `code` | text | Two-digit code, "01" to "36", matching SR-NU-CODE. |
| `short_label` | text | Our plain-English label for the site. Full wording is in the source PDF. |
| `may_be_used_after_investigation` | yes/no | "yes" for the 10 categories N.J.A.C. 18:12-1.1(b) says may still be used after a full investigation. |
| `source` | text | Rule and link. |

## 3. State tables read by the pipeline (planned)

| File | What we read | Notes |
|---|---|---|
| `state/2027CH123.pdf` | Bergen rows: code, name, average ratio, lower limit, upper limit | Percents with 2 decimals. Lines look like `0201 ALLENDALE BORO 89.97 76.47 103.47`. |
| `state/CoefficientDeviations.pdf` | Bergen 2026 rows: class-2 "stratified" coefficient and class-2 sale count | Some rows have a `*` in the "Amended" column. Validation V1, V2. |
| `state/2026AvgResStat.pdf` | Bergen "# of Sales" | Validation V1. |
| `state/GTRhistory.xlsx` | Sheet "General Tax Rates 1997-2025", Bergen rows, 2025 column | Dollars per $100 of assessed value. K12. |
| `state/DirRatios.xlsx` | Sheet "Director's Ratio History", Bergen rows | Town page context. |
