# Data contract

The pipeline's export stage (`pipeline/export.py`) writes small JSON files into `site/public/data/`. The website reads only these files. This page lists every file and every field: its name, type, units, and meaning.

**The contract is enforced.** `site/lib/data/schema.ts` has a zod schema for each file. `npm run validate-data` checks every file against them, and `npm run build` runs it first. So if a file is missing, has an extra field, has a wrong type, or is over the size budget, the build fails and the bad data never reaches users. `site/lib/data/load.ts` checks each file again when a page reads it.

**Change a field in this order:** methodology (if a rule changes) → `pipeline/export.py` → this page → `site/lib/data/schema.ts`. Never hand-edit the JSON files. Rerun the pipeline instead.

**General rules**
- Ratios are **decimals** (0.8 = 80%) unless the field says *percent*. The state publishes its ratios as percents (89.97), so Chapter 123 fields stay in percents.
- Money is in **whole dollars**. Ratios, PRD, PRB, and shares are rounded to **4 decimals**. COD and percent-point differences are rounded to **2 decimals**.
- A missing value is `null`. A file never holds NaN or Infinity (the export refuses to write them, and the tests check).
- Dates are text: `YYYY-MM-DD`. Months are `YYYY-MM`. Timestamps are ISO 8601 in UTC.
- Rule IDs (C8, K2, T3, ...) refer to `docs/methodology.md`.
- **Privacy.** No file holds an owner name, street name, house number, block and lot, or SR1A record ID. The comp schema is strict, so a comp with any extra field fails the build.

**Size budget:** each `towns/<slug>.json` under 150 KB (153,600 bytes); everything in `site/public/data/` under 5 MB (5,242,880 bytes). Checked by both the pipeline and `validate-data`.

---

## meta.json

What the data is and when it was made. Every page shows "Data as of ..." from this file.

| Field | Type | Meaning |
|---|---|---|
| `generated_at` | timestamp (UTC) | When the export stage ran. |
| `data_as_of` | date | The newest recording date among the sales behind the town statistics (Sales2026). This is the date to show as "Data as of". |
| `county` | text | Always `"Bergen"` in v1. |
| `n_towns` | integer | Number of towns (70). Must equal the length of `towns.json`. |
| `town_stats_sales.source_file` | text | The SR1A file the town statistics use (`Sales2026`, rule T0). |
| `town_stats_sales.sr1a_extract_date` | date | The date the state made that SR1A file. |
| `town_stats_sales.recorded_from`, `recorded_to` | date | First and last deed recording dates in those sales. |
| `town_stats_sales.n_sales` | integer | Number of clean sales behind the town statistics. |
| `comp_sales.source_files` | list of text | SR1A files the checker's comps come from. |
| `comp_sales.deed_date_from`, `deed_date_to` | date | The comp window (rule K2): October 1, 2024 to the latest deed date in the data. |
| `price_index_months.from`, `to` | month | First month of the price index and its base month (index 1.0). |
| `valuation_date` | date | Checker valuation date, October 1, 2026 (Section 3.3). |
| `chapter123_tax_year` | integer | Tax year of the Chapter 123 limits used (2027). |
| `tax_rate_year` | integer | Year of the general tax rates used (2025, the newest we have). |
| `methodology_version`, `methodology_date` | text, date | Read from the first lines of `docs/methodology.md`. |

## county.json

Countywide results, copied from `data/processed/county_summary.json` and rounded. Made by the stats stage (rule T8).

| Field | Type | Meaning |
|---|---|---|
| `source_file`, `sales_recorded` | text | Which sales were used and their recording dates. |
| `n_sales`, `n_towns`, `n_towns_with_sales` | integer | Counts. |
| `headline_version` | `"within_town"` or `"pooled"` | Which version the home page leads with (within_town, rule T8). |
| `within_town`, `pooled` | object | The Section 2.2 measures for all sales together. `within_town` first divides each sale by its own town's median ratio; `pooled` uses raw ratios (reference only). Fields: `about` (plain-English note), `n_sales`, `median_ratio`, `mean_ratio`, `weighted_mean_ratio`, `cod`, `prd`, `prb`, `prb_intercept`, `prb_se`, and 95% ranges `*_ci_low` / `*_ci_high` for median, COD, PRD, and PRB. |
| `towns_by_label` | object | Number of towns with each label (T5). Every label is present. |
| `towns_by_data_quality` | object | Number of towns with each data quality flag (T6, C9). |
| `ranked_towns` | integer | Towns with statistics (20 or more sales). |
| `ranked_towns_meeting_iaao.cod`, `.prd`, `.prb` | integer | Ranked towns inside each IAAO range (Section 2.3). |
| `ranked_towns_prb_range_below_zero`, `_above_zero`, `_outside_0_10` | integer | Ranked towns whose whole PRB 95% range is below 0, above 0, or outside -0.10 to +0.10. |
| `ranked_towns_label_sensitive_to_outliers` | integer | Ranked towns whose label changes with a 1.5 x IQR fence (C8 check). |
| `t7_value_quarters` | object | Rule T7 for the whole county: `n_towns`, and `by_tier` with `tier` (1 = lowest-value quarter), `n_sales`, `n_above_upper`, `n_below_lower`, and the matching shares (0 to 1). |
| `state_average_ratio_range` | object | Lowest and highest 2027 state average ratio (**percent**) with town names and source file. |
| `typical_ranked_town` | object | Median COD, PRD, and PRB across ranked towns. |

## towns.json

A list with one entry per town (all 70), in district code order.

| Field | Type | Meaning |
|---|---|---|
| `slug` | text | URL name, e.g. `ho-ho-kus`. Also the town file name. |
| `name` | text | Display name, e.g. `Ho-Ho-Kus`. |
| `district_code` | text | 4-digit state code, `0201` to `0270`. |
| `revaluation_tax_year` | integer or null | 2026 or 2027 if the town is on the county's revaluation/reassessment list for that year; null otherwise (rules C9, K14). |
| `n_sales` | integer | Clean Sales2026 sales (T1). |
| `data_quality` | text | `normal`, `limited data` (20 to 39 sales), `not enough sales` (under 20), or `recent revaluation` (C9). |
| `label` | text | T5 label: `Regressive pattern`, `Progressive pattern`, `Within standards`, `Mixed signals`, or `Not enough sales`. |
| `rank` | integer or null | Rank by PRB, most negative first (1 = most regressive-looking). Null for towns without statistics. |
| `stats` | object or null | **Null when the town's statistics are hidden** (under 20 sales or recent revaluation). Otherwise the fields below. |
| `stats.median_ratio`, `mean_ratio`, `weighted_mean_ratio` | decimal | Section 2.2 measures. |
| `stats.cod` | number (percent) | IAAO coefficient of dispersion. |
| `stats.prd` | number | Price-related differential. |
| `stats.prb`, `stats.prb_se` | number | Price-related bias and its standard error. |
| `stats.prb_intercept` | number | The intercept *a* of the PRB line *y = a + b x* (Section 2.2). The town page uses it to draw the PRB trend line on the scatter chart: ratio = median x (1 + a + PRB x ln(value) / 0.693). |
| `stats.*_ci_low`, `*_ci_high` | same as measure | 95% ranges for median, COD, PRD (bootstrap) and PRB (slope +/- 1.96 x SE), rule T4. |
| `stats.cod_meets_iaao` | true/false | COD at or below 15.0 (our choice in Section 2.3). |
| `stats.cod_below_5` | true/false | COD under 5.0 (IAAO warning sign). |
| `stats.prd_meets_iaao` | true/false | PRD from 0.98 to 1.03. |
| `stats.prb_meets_iaao` | true/false | PRB from -0.05 to +0.05. |
| `stats.prb_ci_outside_0_10` | true/false | Whole PRB 95% range outside -0.10 to +0.10 (IAAO "unacceptable"). |
| `stats.label_fence_1_5`, `label_no_trim` | text | The label with a 1.5 x IQR outlier fence, and with no trimming (C8 check). |
| `stats.label_sensitive_to_outliers` | true/false | True if the label changes at 1.5 x IQR. The town page must say so. |
| `ch123.tax_year` | integer | 2027. |
| `ch123.average_ratio`, `lower_limit`, `upper_limit` | number (**percent**) | Exactly as printed in 2027CH123.pdf. The checker applies the 100% rule itself (K10). |
| `ch123.amended_by_tax_court` | true/false | The printed row was amended by the Tax Court. |
| `tax_rate.year`, `tax_rate.general_tax_rate` | integer, number | Newest general tax rate we have, in **dollars per $100 of assessed value** (K12). |
| `avg_residential` | object or null | State's 2026 average residential statistics: `year`, `line_items` (number of residential properties), `avg_assessment` (dollars), `n_sales`, `avg_sale_price` (dollars). |

## towns/&lt;slug&gt;.json

One file per town. It holds **every field of the town's `towns.json` entry** (they must match exactly), plus:

| Field | Type | Meaning |
|---|---|---|
| `tiers` | list | Value quarters (T3) and Chapter 123 shares (T7). Empty when `stats` is null. |
| `tiers[].tier` | integer | 1 = lowest-value 25% of sales, 4 = highest. |
| `tiers[].n` | integer | Sales in the quarter. |
| `tiers[].value_low`, `value_high` | dollars | Value proxy range of the quarter. |
| `tiers[].sale_price_low`, `sale_price_high` | dollars | Sale price range of the quarter. |
| `tiers[].median_ratio` | decimal | Median ratio in the quarter. |
| `tiers[].lower_trigger`, `upper_trigger` | percent or null | Chapter 123 triggers L\* and U\* (K10). Null for towns on the 2027 revaluation list (K14). |
| `tiers[].n_above_upper`, `n_below_lower` | integer or null | Sales above U\* / below L\*. Null as above. |
| `tiers[].share_above_upper`, `share_below_lower` | decimal 0 to 1, or null | The same as shares. |
| `scatter` | list | Points for the ratio-vs-value chart, sorted by value. Empty when `stats` is null. |
| `scatter[].value` | dollars | Value proxy, the same one PRB uses: 0.5 x (assessed / town median ratio) + 0.5 x sale price. |
| `scatter[].ratio` | decimal | Assessed value / sale price. |
| `scatter_sampling` | object | `n_sales` (sales available), `n_shown` (points in `scatter`), `max_points` (300), and `method` (plain-English note). With more than 300 sales, the sales are sorted by value and 300 are picked at evenly spaced positions, including the lowest and highest. |
| `comp_window.deed_date_from`, `deed_date_to` | date | Rule K2 comp window. |
| `comps` | list | The checker's comp pool: every clean sale (C1 to C10 and C8, Sales2025 and Sales2026) in this town with a deed date inside the window, oldest first. The browser picks the comps near the homeowner's assessment (K2) and does all the math. |
| `comps[].deed_date` | date | Deed date. Kept to the day because rule K6 counts days to the valuation date. |
| `comps[].sale_price` | dollars | Sale price (VERIFIED-SALES-PRICE). |
| `comps[].assessed_value` | dollars | Assessed value paired with the sale (C5). |
| `comps[].ratio` | decimal | assessed_value / sale_price. |

| `filter_log` | list | This town's rows from the cleaning log (Section 4), so the town page can show how many sales each rule removed: `source_file` (`All`, `Sales2025`, or `Sales2026`), `rule_id`, `rows_in`, `rows_removed`, `rows_out`, in rule order. |

These four are the **only** comp fields. No street names or house numbers (the Prompt 8 default), no owner names, no record IDs.

## price-index.json

The Bergen monthly price index for the checker's time adjustment (rules K4 and K5). Also in `data/processed/price_index.csv`.

| Field | Type | Meaning |
|---|---|---|
| `base_month` | month | Last kept month; its index is 1.0. |
| `chart_from` | month | First month to draw on the chart: the month the comp window starts (K2, October 2024). Earlier months have few sales and no comp uses them, so the site shows them only in the table. |
| `valuation_date` | date | October 1, 2026. The index stays flat from `base_month` to this date (K5). |
| `note` | text | How the index was built, in plain English. |
| `months[].month` | month | Deed month. |
| `months[].n_sales` | integer | Clean sales with a deed date in that month. |
| `months[].kept` | true/false | False if dropped as an incomplete end month (K4 step 2). |
| `months[].n_window` | integer or null | Sales in the 3-month smoothing window (2 at the ends). |
| `months[].raw_median_price` | dollars or null | Median sale price of the window. |
| `months[].index` | number or null | raw_median_price / raw_median_price of the base month. |

The checker's time-adjusted price is *sale price x index(base month) / index(deed month)* (Section 6.3).

## validation.json

Our checks against the state's own numbers (methodology Section 8; the full write-up is `docs/validation.md`).

| Field | Type | Meaning |
|---|---|---|
| `thresholds.v4_flag_pp`, `v3_flag_pp`, `v2_pass_pp` | number | Flag and pass limits in percentage points (5, 10, 0.25). |
| `summary` | object | Headline counts from `pipeline/validate.py` `summarize()`, e.g. `one_year_within_flag` (towns within 5 points in V4), `one_year_within_1`, `counts_match` (V1), `v2_pass`, `v3_flagged`. Numbers rounded to 2 decimals; a few fields are town names. |
| `towns[].district_code`, `town` | text | Town. |
| `towns[].state_average_ratio` | percent | 2027 Chapter 123 average ratio. |
| `towns[].our_class2_median` | percent or null | Our clean single-family median ratio (V3). |
| `towns[].diff_class2_median_pp`, `v3_flag_over_10pp` | number, true/false | Gap from the state's ratio, and whether it is more than 10 points. |
| `towns[].state_one_year_ratio`, `our_ratio_state_style`, `diff_one_year_pp`, `flag_over_5pp` | percent, percent, number, true/false | V4: the state's one-year ratio, ours rebuilt with the state's method, the gap, and the 5-point flag. |
| `towns[].averaging_effect_pp` | number | How much averaging with the prior year moved the published ratio. |
| `towns[].state_ratio_2025` | percent | The prior year's state ratio. |
| `towns[].our_n_classes_1_2_4`, `state_n_classes_1_2_4`, `counts_match` | integer, integer, true/false | V1 sale counts. |
| `towns[].state_cod_class2`, `our_cod_state_style`, `diff_cod`, `v2_pass` | number or null, true/false/null | V2 coefficient check. |

## filter-log.json

How many sales each cleaning rule removed (Section 4), countywide, from `data/processed/filter_log.csv`. Each town's own rows are in its town file (`filter_log`), not here.

| Field | Type | Meaning |
|---|---|---|
| `rules[].step`, `rule_id`, `description` | integer, text, text | The rules in the order they run (C1, C2, C10, C3, C7, C4, C5, C6, C9, C8). |
| `county[]` | list | Countywide rows: `source_file` (`All`, `Sales2025`, or `Sales2026`), `rule_id`, `rows_in`, `rows_removed`, `rows_out`. |

---

## Download: `site/public/downloads/fairassess-nj-town-stats.csv`

Open data, so anyone can check our numbers. One row per town, the same values and rounding as `towns.json`, flattened. Columns: `district_code`, `town`, `slug`, `revaluation_tax_year`, `n_sales`, `data_quality`, `label`, `rank`, the `stats` fields (blank when hidden), `label_sensitive_to_outliers`, `ch123_tax_year`, `ch123_average_ratio_pct`, `ch123_lower_limit_pct`, `ch123_upper_limit_pct` (percents), `general_tax_rate` (dollars per $100), and `tax_rate_year`. Not checked by `validate-data` (it is not read by the site); the pipeline tests check it has 70 rows.
