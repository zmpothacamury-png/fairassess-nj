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

### Tables of Equalized Valuations: `data/processed/tev_bergen.csv`

From `data/raw/state/2025TEV.pdf` (amended by the Tax Court) and `2026TEV.pdf`, made by `pipeline/parse_state_tables.py`. One row per town and year (2 x 70 rows). Used by rule V4.

| Column | Type / units | Meaning |
|---|---|---|
| `year` | number | Table year (2025 or 2026). |
| `district_code`, `district_name` | text | Town code and name as printed. |
| `agg_assessed` | dollars | Column 1: aggregate assessed valuation of real property. |
| `average_ratio` | percent | Column 2: average ratio of assessed to true value. 2026 = the 2027 Chapter 123 ratio. |
| `agg_true_value` | dollars | Column 3: aggregate true value of real property (= `agg_assessed` / `average_ratio`). |
| `class2_railroad`, `personal_property` | dollars | Columns 4 and 5. |
| `equalized_valuation` | dollars | Column 6. |
| `amended_by_tax_court` | true/false | Name marked "**" in the table (changed by the Tax Court). |
| `source_file` | text | The PDF it came from. |

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

## 9. Cleaning outputs (`pipeline/clean.py`, methodology Section 4)

### `data/processed/sales_clean.csv`
One row per sale that passed rules C1 to C10 (Sales2025 and Sales2026). Rows are in file order: Sales2025, then Sales2026, each in its original line order.

| Column | Type | Meaning |
|---|---|---|
| `record_id` | text | District code + SERIAL-NUMBER, e.g. `0201-7354015`. |
| `source_file` | text | `Sales2025` or `Sales2026`. Town statistics use `Sales2026` only (rule T0). |
| `district_code` | text | 4-digit town code. |
| `town_slug` | text | URL slug from `towns.csv`. |
| `deed_date` | date | DEED-DATE (YYYY-MM-DD). |
| `recorded_date` | date | DATE-RECORDED (YYYY-MM-DD). |
| `assess_year` | number | ASSESS-YEAR, 2 digits (e.g. 26). |
| `sale_price` | dollars | VERIFIED-SALES-PRICE (REPORTED-SALES-PRICE if verified is zero or blank). |
| `assessed_value` | dollars | Main lot ASSESSED-VALUE-TOTAL on the sale record (rule C5). |
| `ratio` | decimal | assessed_value / sale_price. |
| `town_median_ratio` | decimal | Median ratio of the town's sales in the same file, just before C8. |
| `relative_ratio` | decimal | ratio / town_median_ratio (the scale C8 trims on). |

### `data/interim/removed_rows.parquet`
Every row a rule removed: all columns from `sr1a_bergen.parquet`, plus `sale_price`, `price_source`, and `rule_id` (the rule that removed it). Rows removed by C8 also carry `ratio`, `town_median_ratio`, `relative_ratio`, `c8_low_fence`, and `c8_high_fence`.

### `data/processed/filter_log.csv`
| Column | Type | Meaning |
|---|---|---|
| `step` | number | 1 to 10, the order the rules run. |
| `rule_id` | text | C1 to C10. |
| `rule_description` | text | Short description of the rule. |
| `source_file` | text | `Sales2025`, `Sales2026`, or `All` (both added together). |
| `district_code` | text | 4-digit town code, or `ALL` for the countywide row. |
| `town` | text | Display name, or "Bergen County (all towns)". |
| `rows_in`, `rows_removed`, `rows_out` | number | Rows before the rule, removed by it, and left after it. rows_in = rows_removed + rows_out. |

### `data/processed/c8_sensitivity.csv`
C8 at the main fence (3.0 x IQR) and the check fence (1.5 x IQR), one row per town and file. Not used in any result.

| Column | Type | Meaning |
|---|---|---|
| `source_file`, `district_code` | text | File and town. |
| `sales_before_c8` | number | Sales that reached C8. |
| `town_median_ratio` | decimal | Median ratio before C8. |
| `low_fence_3_0`, `high_fence_3_0`, `low_fence_1_5`, `high_fence_1_5` | decimal | Fences on the relative-ratio scale. |
| `removed_3_0`, `removed_1_5`, `extra_removed_at_1_5` | number | Sales removed at each fence, and the difference. |
| `sales_after_3_0`, `sales_after_1_5` | number | Sales left at each fence. |

## 10. Town statistics (`pipeline/build_stats.py`, methodology Sections 2 and 5)

All four files use the clean Sales2026 sales only (rule T0). Ratios are decimals (0.80 = 80%).

### `data/processed/town_stats.csv`
One row per town (all 70). Towns with under 20 sales (or 2026 revaluation towns under 20) have blank statistics, flags, and rank (rule T6).

| Column | Type | Meaning |
|---|---|---|
| `district_code`, `town`, `slug` | text | Town code, display name, URL slug (from `towns.csv`). |
| `revaluation_tax_year` | number | 2026 or 2027 if the town is on the county's revaluation list, else blank. |
| `n_sales` | number | Clean Sales2026 sales (T1). |
| `data_quality` | text | `normal` (40+), `limited data` (20 to 39), `not enough sales` (under 20), `recent revaluation` (2026 revaluation town under 20; C9). |
| `label` | text | T5 label: Regressive pattern, Progressive pattern, Within standards, Mixed signals, Not enough sales. |
| `prb_rank` | number | 1 = most negative PRB. Blank for "Not enough sales". |
| `median_ratio`, `mean_ratio`, `weighted_mean_ratio` | decimal | Section 2.2. |
| `cod`, `prd`, `prb` | number | Section 2.2. COD is a percent (15.0 = 15%). |
| `*_ci_low`, `*_ci_high` | number | 95% range (T4). Median, COD, PRD: bootstrap, 2,000 resamples, seed 20261025. PRB: slope +/- 1.96 x `prb_se`. |
| `prb_se` | number | Standard error of the PRB slope. |
| `prb_intercept` | number | Intercept *a* of the PRB line *y = a + b x* (Section 2.2). Added 2026-10-18 (Prompt 10A) so the town page can draw the PRB trend line. |
| `cod_meets_iaao` | true/false | COD at most 15.0 (Section 2.3, our choice). |
| `cod_below_5` | true/false | COD under 5.0 (IAAO: "may indicate sales chasing or non-representative samples"). |
| `prd_meets_iaao` | true/false | PRD from 0.98 to 1.03. |
| `prb_meets_iaao` | true/false | PRB from -0.05 to +0.05. |
| `prb_ci_outside_0_10` | true/false | The whole 95% PRB range is below -0.10 or above +0.10 (IAAO "unacceptable"). |
| `label_fence_1_5`, `label_no_trim` | text | The label if C8 used 1.5 x IQR, or no trimming (from `sensitivity.csv`). |
| `label_sensitive_to_outliers` | true/false | `label_fence_1_5` differs from `label` (Section 4, C8). |

### `data/processed/town_tiers.csv`
Median ratio by value quarter (T3) and the Chapter 123 shares (T7), for towns with 20 or more sales. `value_proxy` rows are the main results; `sale_price` rows are a comparison only (methodology T3).

| Column | Type | Meaning |
|---|---|---|
| `district_code`, `town` | text | Town. |
| `tier_basis` | text | `value_proxy` (sorted by the PRB value proxy; main) or `sale_price` (comparison). |
| `tier` | number | 1 = lowest-value quarter, 4 = highest. Extra sales go to the lower quarters. |
| `n` | number | Sales in the quarter. |
| `value_low`, `value_high` | dollars | Range of the sort key in the quarter (value proxy or sale price). |
| `sale_price_low`, `sale_price_high` | dollars | Range of sale prices in the quarter. |
| `median_ratio` | decimal | Median ratio of the quarter. |
| `lower_trigger`, `upper_trigger` | percent | Chapter 123 triggers *L\** and *U\** for tax year 2027 (printed limits from 2027CH123.pdf, capped at 100; rule K10). Blank for 2027 revaluation towns. |
| `n_above_upper`, `share_above_upper` | number | Sales in the quarter with ratio x 100 above *U\** (T7), and that count / `n`. Blank for 2027 revaluation towns (K14). |
| `n_below_lower`, `share_below_lower` | number | Same, below *L\**. |

### `data/processed/county_summary.json`
Countywide numbers for the home page (rule T8). `within_town` (the headline) divides each sale's assessed value by its own town's median ratio before pooling, so only unevenness inside towns is measured. `pooled` uses the raw ratios (reference only). Both have n, median, mean, weighted mean, COD, PRD, PRB, and their 95% ranges. Also: towns by label and data quality, how many ranked towns meet each IAAO range, how many have a PRB range fully below or above 0, `t7_value_quarters` (T7 counts and shares added up over every town that shows T7), `state_average_ratio_range` (lowest and highest 2027 state average ratio, with town names), and the median COD, PRD, and PRB of ranked towns.

### `data/processed/sensitivity.csv`
One row per town and version (`fence_3_0` = main results, `fence_1_5`, `no_trim`): n, data quality, label, median ratio, COD, PRD, PRB and its range. No bootstrap.

## 11. Validation (`pipeline/validate.py`, methodology Section 8)

### `data/processed/validation.csv`
One row per town (all 70). Compares our numbers with the state's. Ratios here are **percents** (80.0 = 80%), like the state's tables. "State-style" sales = every usable Sales2026 sale in property classes 1, 2, and 4, with no other cleaning, and ratio = TOTAL ASSESSMENT / sale price (the state's pairing; rule V2). Blank = no sales.

| Column | Type | Meaning |
|---|---|---|
| `district_code`, `town` | text | Town code and display name (from `towns.csv`). |
| `revaluation_tax_year` | number | 2026 or 2027 if on the county's revaluation list, else blank. |
| `state_one_year_ratio` | percent | V4: 2026 aggregate assessed / `state_one_year_true_value`. |
| `our_ratio_state_style` | percent | V4: 2026 aggregate assessed / `our_one_year_true_value`. |
| `diff_one_year_pp`, `flag_over_5pp` | points, true/false | Ours minus the state's; \|gap\| more than `VALIDATION_FLAG_PP` (5.0). |
| `state_average_ratio` | percent | Published 2027 Chapter 123 average ratio (`2027CH123.pdf`). |
| `our_average_ratio_two_year`, `diff_two_year_pp` | percent, points | 2026 aggregate assessed / ((our one-year true value + 2025 true value) / 2), and its gap to the published ratio. |
| `averaging_effect_pp` | points | Published ratio minus the state's one-year ratio (the part caused by averaging with 2025). |
| `our_simple_mean_ratio`, `diff_simple_mean_pp` | percent, points | First try: plain average of the state-style sales ratios, and its gap to the published ratio. |
| `our_n_classes_1_2_4`, `state_n_classes_1_2_4`, `counts_match` | number, true/false | State-style sale count, the state's TOTAL count (`CoefficientDeviations.pdf`, 2026), and whether they are equal. |
| `our_class2_median`, `n_clean` | percent, number | Our published class-2 median ratio and clean sale count (`sales_clean.csv`, Sales2026). |
| `diff_class2_median_pp`, `v3_flag_over_10pp` | points, true/false | Class-2 median minus the published ratio; more than 10 points apart (V3). |
| `state_cod_class2` | number | State "coefficient of deviation," class 2, stratified, 2026. |
| `our_cod_state_style`, `diff_cod`, `v2_pass` | number, true/false | Our mean-based coefficient on the usable class-2 sales (V2), the difference, and whether it is within 0.25. Blank if either side is missing. |
| `our_cod_main_lot` | number | Same, using the main-lot assessment only (shows what the TOTAL ASSESSMENT choice changes). |
| `our_iaao_cod` | number | Our published IAAO COD (`town_stats.csv`; blank for hidden towns). |
| `state_avg_sale_price`, `state_n_class2` | dollars, number | State 2026 average residential sale price and number of sales (`2026AvgResStat.pdf`). |
| `our_mean_price_class2_usable` | dollars | Our average price of the same usable class-2 sales (should equal the state's). |
| `our_median_price_clean`, `price_diff_pct` | dollars, percent | Our clean median price, and how far it is from the state's average. |
| `n_class1`, `n_class2_usable`, `n_class4`, `n_multi_lot` | number | State-style sales by class, and how many cover extra lots. |
| `class2_weighted_ratio`, `other_weighted_ratio` | percent | Total assessed / total price for homes, and for classes 1 and 4 together. |
| `residential_share_assessed` | decimal | Home assessed total ("# of Line Items" x "Avg Assessment") / 2026 aggregate assessed. |
| `agg_assessed_2025`, `agg_assessed_2026`, `agg_true_value_2025` | dollars | From `tev_bergen.csv`. |
| `state_one_year_true_value` | dollars | 2 x (2026 aggregate true value) - (2025 aggregate true value). |
| `our_one_year_true_value` | dollars | Home total / home ratio + other total / other ratio (a group with no sales uses the other group's ratio). |
| `min_ratio`, `max_ratio` | percent | Lowest and highest state-style sale ratio. |
| `share_old_assessment` | decimal | Share of state-style sales with ASSESS-YEAR before 26. |
| `first_recorded`, `last_recorded` | date | Recording dates of the first and last state-style sale. |
| `n_nonusable_cat27` | number | Non-usable sales (any class) with state code 27 (recorded July to December before a revaluation). |
| `state_ratio_2025` | percent | 2025 Table average ratio. |
| `state_director_ratio_2026`, `tev_ratio_2026` | percent | 2026 Director's ratio (`DirRatios.xlsx`) and 2026 Table ratio; both equal `state_average_ratio` in every town. |
| `flag_rank`, `investigated` | number, true/false | 1 = biggest V4 gap over the flag; the top 10 flagged are written up in `docs/validation.md`. |

## 12. Price index and website export (`pipeline/price_index.py`, `pipeline/export.py`)

### `data/processed/price_index.csv`
The Bergen monthly price index for the checker's time adjustment (rules K4 and K5). One row per deed month, from the first to the last month in the clean Sales2025 + Sales2026 sales (empty months count as 0).

| Column | Type | Meaning |
|---|---|---|
| `month` | text `YYYY-MM` | Deed month. |
| `n_sales` | number | Clean sales with a deed date in the month. |
| `kept` | true/false | False if dropped as an incomplete end month (fewer than half the average monthly count; K4 step 2). |
| `n_window` | number | Sales in the smoothing window (months m-1, m, m+1 among kept months). Blank if not kept. |
| `raw_median_price` | dollars | Median sale price of the window. Blank if not kept. |
| `index` | number | `raw_median_price` / `raw_median_price` of the last kept month (1.0 there). Blank if not kept. |

### Website files
`pipeline/export.py` writes the JSON files in `site/public/data/` and the open-data CSV `site/public/downloads/fairassess-nj-town-stats.csv`. Every file and field is described in **`docs/data-contract.md`**.

## 13. Appeal checker reference and sweep (`pipeline/checker_reference.py`, methodology Sections 6.8 and 7)

Made by the `fixtures` stage, after the export stage.

**`pipeline/fixtures/checker_cases.json`**: the shared test cases. `cases[]` has `id`, `description`, `input` (`town`, `assessed_value`, `own_estimate`, as typed text), `town_data` (a made-up town for edge cases, or null for a real town), and `expected` (the Python reference's answer: `valid`, then either `errors` or the result fields). `tolerances` gives the allowed difference ($1 and 0.0001). The website's tests (`site/lib/checker/checker.test.ts`) must match every case.

**`data/processed/checker_grounds_sweep.csv`**: one row per town. The checker runs, with no own estimate, at assessed values 1% apart from the town's lowest to highest comp assessment.

| Column | Meaning |
|---|---|
| `slug`, `town`, `revaluation_tax_year` | Town. |
| `n_comps_in_file` | Comps in the town's site file. |
| `n_values_tried` | Assessed values tried. |
| `n_may_have_grounds`, `n_within_range`, `n_possibly_under_assessed`, `n_not_enough_data`, `n_revaluation_no_test` | How many tried values gave each result. They add up to `n_values_tried`. |
| `max_points_above_upper_trigger` | The highest homeowner ratio found minus the upper trigger U\*, in percentage points (negative = never reached it). Blank if no value got a Chapter 123 result. |

