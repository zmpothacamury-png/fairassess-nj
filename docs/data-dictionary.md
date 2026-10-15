# Data dictionary

Every field the v1 pipeline reads or writes: what it means, its units, and the file it comes from. Rules (C1, K2, ...) refer to `docs/methodology.md`. Paths and file names live in `pipeline/config.py`.

**Joining tables.** Every table uses `district_code`: 4-digit text, county `02` + town `01` to `70` (for example `"0201"` = Allendale). `data/processed/towns.csv` is the master list.

**Ratios.** The state publishes ratios as percents (89.97). Our own ratios are decimals (0.8997). Each column below says which.

---

## 1. SR1A sales: `data/interim/sr1a_bergen.parquet`

Made by `pipeline/parse_sr1a.py` from `data/raw/sr1a/Sales2025.zip`, `Sales2026.zip`, and `YTDSR1A2026.zip`. Bergen rows only. Not committed (data/interim is gitignored).

- Each zip holds one fixed-width text file. Every line is **663 characters**, read as Latin-1.
- Field positions come from `data/raw/sr1a/SR1Afilelayout.pdf`, copied into `pipeline/sr1a_layout.csv` (field, start, end, length, picture, type, decimals, our column, note). Meanings come from `SR1A_FileLayout_Description.pdf` (7/7/2011). Where they disagree, the data and the 663-character layout win (methodology Section 3.1; `docs/data-profile.md` Section 6).
- `Sales2024.zip` does **not** match the layout and is not decoded (see `docs/data-profile.md` Section 1).
- **Privacy.** Names, mailing addresses, the property address (positions 106 to 322), and the state investigator's initials are never kept. The parser skips them as each line is read.

| Column | SR1A field (positions) | Type / units | Meaning | Used by |
|---|---|---|---|---|
| `source_file` | — | text | Which SR1A file the row came from (`Sales2025`, `Sales2026`, `YTDSR1A2026`). | Dedup, T0 |
| `county_code` | COUNTY-CODE (1-2) | text | County. Bergen = `"02"`. | C1 |
| `district_code` | DISTRICT-CODE (3-4) | text, 4 digits | County + town (`"0201"`). The raw field is 2 digits; we add the county. | All town rules |
| `total_assessment` | TOTAL ASSESSMENT (5-16) | whole dollars | Assessed value of **every** lot in the sale: main lot + extra lots. | C6 |
| `last_update_date` | LAST-UPDATE-DATE (20-25) | date, **MMDDYY** | Last date the state processed the record. Blank (000000) on many rows. | Profile only |
| `un_type` | U-N-TYPE (34) | text | `U` = usable in the state's ratio study, `N` = not usable. | C3 |
| `sr_nu_code` | SR-NU-CODE (35-37) | text, `"01"`-`"36"` | The state's reason a sale is not usable. Meanings: `data/reference/nonusable_codes.csv`. | C3 log |
| `price_reported` | REPORTED-SALES-PRICE (38-46) | whole dollars | Price on the recorded deed. | Backup for price |
| `price_verified` | VERIFIED-SALES-PRICE (47-55) | whole dollars | Price verified by the state. **Our sale price.** | Ratio, C4 |
| `av_land` | MAIN LOT ASSESSED-VALUE-LAND (56-64) | whole dollars | Land assessment, main lot. | Info |
| `av_bldg` | MAIN LOT ASSESSED-VALUE-BLDG (65-73) | whole dollars | Building assessment, main lot. | Info |
| `av_total` | MAIN LOT ASSESSED-VALUE-TOTAL (74-82) | whole dollars | Total assessment, main lot (land + building). **Our assessed value.** | Ratio, C5 |
| `state_sales_ratio` | SALES-RATIO (83-87) | percent, S999V99 (implied 2 decimals) | The state's own ratio. Not used for analysis (methodology 2.1). | Profile check |
| `serial_number` | SERIAL-NUMBER (99-105) | text, 7 digits | "Unique auto generated number issued to each SR1A." | record_id |
| `aging_date` | AGING-DATE (323-328) | date, YYMMDD | State's date for timing its review. | Profile only |
| `deed_book`, `deed_page` | DEED-BOOK, DEED-PAGE (329-338) | text | Where the deed is filed at the county. Never shown on the site. | Not used |
| `deed_date` | DEED-DATE (339-344) | date, **YYMMDD** | Date the deed was signed. | K2, K4, K6 |
| `recorded_date` | DATE-RECORDED (345-350) | date, **YYMMDD** | Date the deed was recorded. Sets the state's July-June sampling year. | T0, V1 |
| `block`, `block_suffix`, `lot`, `lot_suffix` | BLOCK ... LOT-SUFFIX (351-368) | text | Tax parcel ID. Never shown on the site. | C7 check |
| `etc_flag` | ETC (369) | text | `X` = extra lots in the sale. Blank on every Bergen row we decode. | C6 |
| `addl_block_1`..`_5` | ADDL-BLOCK(1-5) | text | Extra lots' blocks. **Sales2025 uses `"00000"` as an empty placeholder.** | C6 |
| `addl_lot_1`..`_5` | ADDL-LOT(1-5) | text | Extra lots' lot numbers. | C6 |
| `addl_qualifier_1`..`_5` | ADDL-QUALIFIER(1-5) | text | Extra lots' qualifiers. | Info |
| `addl_av_total_1`..`_5` | ADDL-VALUE-TOTAL(1-5) | whole dollars | Extra lots' total assessments. | C6 |
| `qual_code` | QUALIFICATION-CODES (620-624) | text | Starts with `C` = condominium unit. | C10 |
| `assess_year` | ASSESS-YEAR (625-626) | 2-digit year | Tax year of the assessment paired with the sale (`25` = 2025). | C5, C9, K2 |
| `property_class` | PROPERTY-CLASS (627-629) | text | `2` = Residential; `1` vacant; `4A` commercial; etc. Spaces removed. | C2 |
| `class_4_type` | CLASS-4-TYPE (630-632) | text | Commercial use code. | Not used |
| `assessor_nu_code` | ASSESSOR-NU-CODE (639-641) | text | The town assessor's non-usable code. | C3 log |
| `field_status_code` | FIELD-STATUS-CODE (642) | text | `O` outstanding / `R` returned field check. | Not used |
| `critical_error_flag` | CRITICAL-ERROR-FLAG (649) | text | `E` = state found a critical error. Blank on every Bergen row we decode. | Not used |
| `year_built` | YEAR-BUILT (653-656) | year | Actual or effective year built. | 2.0 |
| `living_sqft` | LIVING-SPACE (657-663) | square feet | Living area of the main building. | 2.0 |
| `line_md5` | whole line | text | Fingerprint of the full 663-character line. Two equal values = exact duplicate lines. | C7 |
| `record_id` | — | text | `district_code` + `-` + `serial_number`, for example `0201-7354015`. | Dedup |
| `superseded_by_newer_file` | — | true/false | True when the same `record_id` is also in a newer file (YTDSR1A2026 rows that are in Sales2026). Drop these before analysis. | Dedup |

**Number and date decoding** (`pipeline/parse_sr1a.py`, tested in `pipeline/tests/test_parsers.py`):
- Implied decimals: `08496` with picture `S999V99` = 84.96. Signs may be a leading/trailing `+`/`-` or a COBOL "overpunch" letter in the last digit.
- 2-digit years: 00-49 = 2000s, 50-99 = 1900s (`CENTURY_PIVOT` in config).
- Blank or all-zero dates are empty. Impossible dates (like month 13) are empty and counted in the profile.

## 2. Chapter 123 tables: `data/processed/ch123_2027.csv`, `ch123_2026.csv`

Made by `pipeline/parse_ch123.py` from `data/raw/state/2027CH123.pdf` and `2026CH123.pdf` (Bergen pages). 70 rows each.

| Column | Type / units | Meaning |
|---|---|---|
| `tax_year` | year | Tax year the list applies to (2027 or 2026). |
| `district_code` | text | Town code. |
| `town_name_printed` | text | Name exactly as printed (for example `HOHOKUS BORO`). |
| `average_ratio` | percent | The town's average ratio of assessed value to true (market) value. |
| `lower_limit`, `upper_limit` | percent | Common level range, copied exactly as printed (never recomputed). |
| `amended_by_tax_court` | true/false | Printed with `**` ("AS AMENDED BY TAX COURT OF NEW JERSEY"). Only Alpine in 2026. |
| `source_file` | text | The PDF the row came from. |

The PDFs do **not** mark revaluation or reassessment towns. That flag comes from the county list (`towns.csv`, below).

## 3. Director's ratios: `data/processed/director_ratios_bergen.csv`

From `data/raw/state/DirRatios.xlsx` (sheet "Director's Ratio History"). Long format: one row per town per year, 2002 to 2026.

| Column | Type / units | Meaning |
|---|---|---|
| `district_code`, `district_name` | text | Town code and the name as the sheet spells it. |
| `year` | year | Year the ratio was set (as of October 1). The 2026 value equals the tax year 2027 Chapter 123 average ratio (Allendale 89.97 in both). |
| `director_ratio` | percent | Director's ratio. |

## 4. State coefficients of deviation: `data/processed/state_cod_bergen.csv`

From `data/raw/state/CoefficientDeviations.pdf` (dated 9/17/2026). One row per town per year, 2023 to 2026 (280 rows). A `-` in the PDF is blank here.

| Column | Type / units | Meaning |
|---|---|---|
| `district_code`, `district_name` | text | Town code and name as printed (wrapped names joined). |
| `year` | year | Year of the state's study. |
| `amended` | true/false | The PDF prints `*` in its "Amended" column. |
| `general_coeff` | percent points | The state's general coefficient of deviation (all classes). |
| `stratified_class1`, `_class2`, `_class4` | percent points | Coefficient by class, "stratified". V2 compares `stratified_class2`. |
| `segmented_class1`, `_class2`, `_class4` | percent points | Coefficient by class, "segmented". |
| `n_class1`, `n_class2`, `n_class4`, `n_total` | count | Number of usable sales in each class. V1 compares `n_class2`. |

The state's coefficient is not the IAAO COD (methodology V2).

## 5. Tax rates: `data/processed/tax_rates_bergen.csv`

From `data/raw/state/GTRhistory.xlsx` (sheet "General Tax Rates 1997-2025"). One row per town per year. **Newest year: 2025.** No 2026 file is on hand.

| Column | Type / units | Meaning |
|---|---|---|
| `district_code`, `district_name` | text | Town code and name. |
| `year` | year | Tax year. |
| `general_tax_rate` | dollars per $100 of assessed value | General tax rate (rule K12). |

## 6. Average residential statistics: `data/processed/avg_residential_bergen.csv`

From `data/raw/state/2026AvgResStat.pdf`. One row per town. Values are matched to columns by their position on the page, so an empty column stays empty.

| Column | Type / units | Meaning |
|---|---|---|
| `district_code`, `district_name` | text | Town code and name. |
| `line_items` | count | "# of Line Items": residential properties on the tax list. |
| `avg_assessment` | dollars | Average residential assessment. |
| `avg_tax_bill` | dollars | "Avg Tax Bill". **Empty in the PDF for every Bergen town.** |
| `n_sales` | count | "# of Sales" (V1). |
| `avg_sale_price` | dollars | Average sale price. |

## 7. Master town list: `data/processed/towns.csv`

Made by `pipeline/build_towns.py`. 70 rows.

| Column | Type | Meaning |
|---|---|---|
| `district_code` | text | Town code. |
| `official_name` | text | Name as printed in 2027CH123.pdf. |
| `display_name` | text | Clean name for the site (for example `Ho-Ho-Kus`, `Fair Lawn`). |
| `slug` | text | URL piece (for example `franklin-lakes`). |
| `revaluation_tax_year` | year or blank | 2026 or 2027 if the town is on the county's revaluation/reassessment list; blank if not. |
| `display_name_source` | text | Where the display name came from: the county revaluation list (59 towns), CoefficientDeviations.pdf with "Boro/Twp/..." removed (10 towns), or a chosen override (Washington Township). |

## 8. Reference tables (`data/reference/`)

Small tables copied by hand or by a one-time script from a saved source. Each row says where it came from.

### `bergen_revaluation_towns.csv`
| Column | Type | Meaning |
|---|---|---|
| `district_code` | text | Town code, matched to 2027CH123.pdf. |
| `district_name` | text | Name as the state spells it in 2027CH123.pdf. |
| `name_on_county_list` | text | Name as printed on the county's revaluation list. |
| `revaluation_tax_year` | year | 2026 or 2027: the tax year the new assessments take effect. |
| `source` | text | Where the row came from. |

60 rows: 36 towns for 2026, 24 for 2027. The county list does not say which towns had a revaluation and which had a reassessment.

### `nonusable_codes.csv`
| Column | Type | Meaning |
|---|---|---|
| `code` | text | Two-digit code, `"01"` to `"36"`, matching SR-NU-CODE. |
| `short_label` | text | Our plain-English label. Full wording is in the source PDF. |
| `may_be_used_after_investigation` | yes/no | "yes" for the 10 categories N.J.A.C. 18:12-1.1(b) says may still be used after a full investigation. |
| `source` | text | Rule and link. |
