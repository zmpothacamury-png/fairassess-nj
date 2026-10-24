# Facts sheet

Written 2026-10-23. Every number below is copied from a pipeline output or a test run, with the file it came from. Use this sheet for the App Challenge form, the video, and the fair. If a pipeline rerun changes a number, update it here.

> FairAssess NJ is an independent student research project that uses public data. It is not legal, tax, or appraisal advice. Homeowners file and present their own appeals. Confirm deadlines, fees, and forms with the Bergen County Board of Taxation.

## 1. Sales and cleaning

Town statistics use one year of sales: deeds recorded July 1, 2025 to June 30, 2026 (`Sales2026.zip`, rule T0). Source: `docs/filter-log.md` section 1 and `data/processed/filter_log.csv`.

| Step | Sales removed | Sales left |
|---|---|---|
| Bergen sales read | | **14,012** |
| C1 Bergen County only | 0 | 14,012 |
| C2 Residential only (property class 2) | 1,058 | 12,954 |
| C10 No condominiums | 2,364 | 10,590 |
| C3 Usable sales only (the state's own flag) | 6,748 | 3,842 |
| C7 No exact duplicate lines | 0 | 3,842 |
| C4 Sale price at least $50,000 | 0 | 3,842 |
| C5 Assessed value above $0 | 0 | 3,842 |
| C6 Single lot only | 8 | 3,834 |
| C9 Revaluation towns: new-basis assessments only | 0 | 3,834 |
| C8 Outlier trimming per town, 3.0 x IQR | 28 | **3,806 sales analyzed** |

The checker and price index also use the year before (`Sales2025.zip`). Both files together: 28,015 read, **6,679** clean (`docs/filter-log.md` section 2). There, C4 removes 1 sale, C9 removes 1,093, and C8 removes 64.

**Towns** (`docs/filter-log.md` section 5; `site/public/data/county.json`, `towns_by_data_quality`):
- **30** towns with full statistics (40 or more sales)
- **18** towns with "Limited data" (20 to 39 sales)
- **22** towns with "Not enough sales" (under 20). 21 of the 22 are on the county's 2026 revaluation list. The last one is Alpine (12 sales).

## 2. The biggest data problem, and how it was handled

**The state's layout guide did not match the real files.** Sources: `docs/data-profile.md` section 6 and `docs/methodology.md` section 3.1.
- **Extra-lot placeholders.** In `Sales2025`, **881** usable home sales had "00000" in the ADDL-BLOCK field. That is a placeholder, not an extra lot. A rule that read the guide literally ("any ADDL-BLOCK is not blank") would have thrown out 881 good sales. *Fix (methodology 1.1, rule C6):* a sale counts as multi-lot only when TOTAL ASSESSMENT is greater than the main-lot assessment. Three different tests agree on all 10,212 usable class-2 sales.
- **Dates stored backwards.** The guide says dates are MMDDYY. In the files, DEED-DATE and DATE-RECORDED are YYMMDD, while LAST-UPDATE-DATE really is MMDDYY. *Fix:* each field is read in its real format, and a test fails if any date is impossible.
- **No condo flag.** The guide's CONDO field is blank filler. Condos are marked by a qualification code starting with "C". *Fix:* rule C10, which removes 2,364 condo sales from Sales2026.

## 3. Validation against the state

Source: `docs/validation.md` and `site/public/data/validation.json`.

**Headline sentence:** "For 70 of 70 Bergen towns, our ratio was within 5 points of the state's, and for 66 it was within 1 point." That is after following the state's own method: weighted by price and by property class, before the state blends in last year's value.

- **Same sales as the state:** 70 of 70 towns (5,141 sales in classes 1, 2, and 4).
- **Same spread** (the state's "coefficient of deviation"): within 0.25 points in 69 of 69 towns.
- **First try** (a plain average of the same sales): within 5 points in only 44 of 70 towns. A 2026 Tax Court opinion explained why: the state blends each year with the year before, and that raises the published ratio by a median of 4.62 points.
- **Flagged towns, V4 (5-point flag): none.** The 3 biggest gaps are Bogota (-3.01), Cresskill (-2.90), and Alpine (-2.56). *Cause:* each has only 1 to 3 sales that are not homes, so our 2-group shortcut can't value the town's land and commercial property as well as the state's 4 classes.
- **Flagged towns, V3 (our home median more than 10 points from the state's ratio): 13 towns.** Rockleigh (-30.22), Carlstadt (-22.81), Rochelle Park (-18.35), Elmwood Park (-14.97), Northvale (-14.80), South Hackensack (-14.13), Edgewater (-13.62), Cliffside Park (-12.60), Paramus (-12.29), East Rutherford (-12.28), Little Ferry (-11.31), Ho-Ho-Kus (-11.09), Ridgefield (-10.23). *Causes:* (1) the state's ratio blends in last year's value, which moves it a lot in revaluation towns; (2) the state's ratio includes commercial property. In Carlstadt, for example, non-home property is 75% of the assessed value. These gaps are expected, not errors.
- **Data errors found:** none.

## 4. Town labels and countywide numbers

Source: `docs/stats-summary.md` and `site/public/data/county.json`.

| Label | Towns |
|---|---|
| Within standards | 28 |
| Mixed signals | 17 |
| Regressive pattern | 2 (Bergenfield, Cliffside Park) |
| Progressive pattern | 1 (Englewood) |
| Not enough sales | 22 |

- **48** towns are ranked (20 or more sales).
- **Countywide, within towns (the headline): PRD 1.009 (95% range 1.004 to 1.015), PRB 0.001 (-0.006 to 0.009), COD 11.9.** All are inside IAAO's ranges. Bergen as a whole is not regressive. The unevenness is town by town.
- Of the 48 ranked towns, 43 meet the IAAO COD guideline, 44 the PRD range, and 29 the PRB range.
- **New Milford** (the video's example; `site/public/data/towns/new-milford.json`):
  - 100 sales; not on either revaluation list.
  - PRB -0.184 (95% range -0.265 to -0.103). It is the 1 ranked town whose whole PRB range is outside -0.10 to +0.10, which IAAO calls "unacceptable."
  - PRD 1.027, just under 1.03, so its label is "Mixed signals."
  - Cheapest value quarter: median ratio 96.8%, with 9 of 25 sales (36%) above the Chapter 123 upper limit. Most expensive quarter: 80.8%, with 2 of 25 (8%) above.
  - The label stays the same with other outlier fences.
- All 3 labeled towns are on the 2027 revaluation list, so their patterns describe the old assessments. Bergenfield's label is also sensitive to outliers: it changes at 1.5 x IQR.

## 5. The appeal checker

Source: `docs/methodology.md` section 6, `pipeline/fixtures/checker_cases.json`, and `data/processed/checker_grounds_sweep.csv`.

- **Minimum comps:** 5 (rule K3). Fewer gives "Not enough data."
- **Comp window:** deed dates from October 1, 2024 to June 25, 2026, the newest deed in the data (`site/public/data/meta.json`).
- **Band:** comps with an assessed value within 15% of the home's. If that finds fewer than 8, the band widens to 25%.
- **How often the band widened in the 58 shared test cases:** 16 of the 49 valid cases. That is 12 of the 29 real-town cases and 4 of the 20 made-up edge cases. The other 9 cases are invalid inputs.
- **Two independent versions:** TypeScript (`site/lib/checker/`) and Python (`pipeline/checker_reference.py`) must agree on all 58 cases: same result, dollars within $1, ratios within 0.0001.
- **How often comps alone find grounds:** of 3,894 test values in 42 towns, 7 gave "may have grounds" (all in Alpine and Old Tappan), 2,470 "within the normal range", and 1,417 "may be lower than typical."

## 6. Tests and quality

Counted on 2026-10-23, after the submission-page tests were added.

| Kind | Count | Where |
|---|---|---|
| Python tests (pytest) | 196 | `pipeline/tests/` |
| Site unit tests (Vitest) | 264 | `site/**/*.test.ts(x)` (12 files) |
| Browser tests (Playwright) | 157 | `site/e2e/` (8 files) |
| Also run by `scripts\check-all.ps1` | lint, data check, build | |

**Lighthouse (mobile, median of 3 runs; `docs/quality-report.md`):**

| Page | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|
| `/` | 95 | 100 | 100 | 100 |
| `/towns` | 94 | 100 | 100 | 100 |
| `/towns/teaneck` | 95 | 100 | 100 | 100 |
| `/check` | 94 | 100 | 100 | 100 |

**Accessibility:** axe-core found **0 issues** on 10 pages, including a checker result with "Show the math" open. Keyboard-only use, visible focus, 200% zoom, reduced motion, and a table for every chart are each covered by a test.

## 7. One checker example, worked by hand

A **made-up** home: **Hasbrouck Heights, assessed at $650,000**, no own estimate. These are real town data, run through the website's checker engine. Hasbrouck Heights has few comps, so every step fits on one page.

1. **Find similar sales.** The checker looks for Hasbrouck Heights sales from Oct 1, 2024 to June 25, 2026 with an assessed value within 15% of $650,000 ($552,500 to $747,500). It finds **10**, which is enough (5 needed). They are all from 2026, because the town had a revaluation for 2026 and only sales on the new assessments count (rule C9).
2. **Bring old prices up to date.** Each price is moved to June 2026 terms with the Bergen price index. A $780,000 sale from January 2026 becomes $856,014, because Bergen prices rose about 10% from January to June.
3. **Compute each sale's ratio.** Assessed value / updated price. That same January sale: $663,900 / $856,014 = **0.776**.
4. **Weight them.** Sales closer in assessed value and closer in time count more. Weights run from 0.40 to 0.79.
5. **Find the weighted middle ratio.** Sorted from low to high, the middle ratio (by weight) is **0.8186**. The 25th percentile is 0.7756 and the 75th is 0.8685.
6. **Estimate market value.** $650,000 / 0.8186 = **$794,031**. Likely range: $650,000 / 0.8685 = $748,450 to $650,000 / 0.7756 = $838,092.
7. **Apply Chapter 123.** The home's ratio is $650,000 / $794,031 = **81.86%**. Hasbrouck Heights' 2027 average ratio is 93.16%, and its printed limits are 79.19% to 107.13%, tested up to 100% (`2027CH123.pdf`). 81.86% is inside the range, so the result is **"Your assessment is within the normal range."**
8. **What the result also shows:** the appeal deadline, **April 1, 2027**; the filing fee for a $650,000 assessment, **$100**; and a note that the town had a 2026 revaluation, so there are fewer sales to compare.
