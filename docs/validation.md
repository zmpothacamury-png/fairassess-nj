# Validation: checking our numbers against the state's

> FairAssess NJ is an independent student research project that uses public data. It is not legal, tax, or appraisal advice. Homeowners file and present their own appeals. Confirm deadlines, fees, and forms with the Bergen County Board of Taxation.

This file compares our numbers with the State of New Jersey's published numbers and explains every big difference. The rules are V1 to V4 in `docs/methodology.md` Section 8. The code is `pipeline/validate.py` (the `validate` stage of `pipeline/run.py`). The full table is `data/processed/validation.csv`.

The "Results (generated)" block below is rewritten by the pipeline on every run. Everything else in this file is written by hand. Last full check: 2026-10-15 (Prompt 7).

## The short answer

**For 70 of 70 Bergen towns, our ratio was within 5 points of the state's, and for 66 it was within 1 point.** That is after we follow the state's own method: weighted by price and by property class, and before the state mixes in last year's value.

How we got there:
- **First try: a plain average of the same sales.** It was within 5 points of the published ratio in only 44 of 70 towns, and the state's number was higher in 69. Something was missing.
- **The missing step.** A 2026 Tax Court opinion explains the state's method. The state averages each year's value with the year before. Bergen home prices went up, so last year's value is lower, and that pushes the published ratio up (by a median of 4.6 points).
- **Rebuilding it.** We used the state's 2025 and 2026 Tables of Equalized Valuations to take that averaging back out. Then our one-year ratio and the state's agree very closely (median gap +0.2 points).

The other checks match too:
- **The same sales** as the state in all 70 towns (5,141 sales).
- **The same spread** (the state's "coefficient of deviation") within 0.25 points in all 69 towns where it can be checked.
- **The same average home sale price**, to the dollar, in all 69 towns that have home sales.

So our data and our reading of it are right. And the town rankings depend on the spread inside each town, which we match (Section 4).

## 1. How the state computes its average ratio

### What `ch123definitions.pdf` says, and does not say

The state's Chapter 123 summary (`data/raw/state/ch123definitions.pdf`, page 1) defines the average ratio as:

> that ratio promulgated by the Director of the Division of Taxation pursuant to P.L. 1954, C. 86 (C.54:1-35.1 et seq.), as of October 1 of the year preceding the tax year as revised by the Tax Court of New Jersey.

It says the common level range is "plus or minus 15% of the average ratio." But it does **not** say which sales, which classes, which kind of average, or how outliers are handled.

### What the Tax Court says

*City of New Brunswick v. Director, Division of Taxation*, Tax Court of New Jersey, decided January 27, 2026 (saved as `data/raw/notes/NJTaxCourt_NewBrunswick_v_Director_2026.pdf`; quotes in `data/raw/notes/director-average-ratio-method.md`; https://www.njcourts.gov/system/files/court-opinions/2026/10387-25.pdf):

> At the center of this formulation is a weighted, classified and multi-year-averaged sales study.

> The study gives more weight to higher valued properties, classifies property values into four classes (i.e., vacant land, residential, farm and commercial) for comparison, and averages the determinations of multiple years.

> Averaging the current year's true value with the prior year's aggregate true value leads to the current year's aggregate true value. The average ratio is the ratio of assessed value to aggregate true value.

In plain words, for each town:
1. For each property class, divide the assessed values by the sale prices, so bigger sales count for more.
2. Use those class ratios to turn the town's whole tax list into a "true value" (market value) for this year.
3. Average that with last year's true value.
4. Average ratio = the town's total assessed value / that averaged true value.

### What our other state files confirm

| Question | Answer | Evidence |
|---|---|---|
| Which ratio is used for 2027 appeals? | The Director's 2026 ratio. | The 2027 Chapter 123 average ratio equals the 2026 Table ratio and the 2026 ratio in `DirRatios.xlsx` in **70 of 70** towns. None was changed by the Tax Court. |
| Which period? | Deeds recorded July 1, 2025 to June 30, 2026. | NJ *Guidelines for use of 36 Nonusable Categories* (May 2025): "Sampling period is defined as the period from July 1 to June 30, inclusive ..." This is exactly `Sales2026.zip`. |
| Which sales? | Only sales the state marked usable. | The same guidelines list 36 non-usable reasons. Category 27 drops sales recorded July to December before a revaluation. Category 36 is the state's outlier rule (a ratio "so disproportionate ... that its inclusion ... would distort the overall municipal ratio"). |
| Which classes? | Class 1 (vacant), 2 (residential), and 4 (commercial, industrial, apartments). | `CoefficientDeviations.pdf` reports classes 1, 2, and 4 and a TOTAL. Our usable class 1 + 2 + 4 count equals that TOTAL in **70 of 70** towns. (Class names: `SR1A_FileLayout_Description.pdf`, "1 = Vacant 2 = Residential ... 4A = Commercial 4B = Industrial 4C = Apartment".) |
| Which assessment for a sale with extra lots? | The total for all lots. | The state's own SALES-RATIO field equals TOTAL ASSESSMENT / price on all 34 usable multi-lot sales in classes 1, 2, and 4, and main-lot assessment / price on every single-lot sale. |
| How is the spread measured? | Average distance from the **mean** ratio. | Our mean-based version matches the state's "coefficient of deviation" in 69 of 69 towns (V2). The IAAO COD (distance from the median) is a different measure. |
| What was last year's value? | The 2025 Table of Equalized Valuations. | `data/raw/state/2025TEV.pdf` (amended by the Tax Court January 30, 2026). |

## 2. Our versions

**Our one-year ratio (rule V4)** follows the state's method as closely as our files allow:
- Every usable `Sales2026.zip` sale in classes 1, 2, and 4, with no other cleaning. Ratio pairs TOTAL ASSESSMENT with the price, as the state does.
- Two groups: homes (class 2) and everything else. For each, the weighted ratio = total assessed / total price.
- The town's home assessed total = "# of Line Items" x "Avg Assessment" from `2026AvgResStat.pdf`. Everything else = the town's 2026 aggregate assessed (`2026TEV.pdf`) minus homes.
- One-year true value = homes / home ratio + everything else / other ratio. One-year ratio = aggregate assessed / one-year true value.

**The state's one-year ratio.** The state publishes only the averaged number, so we take the averaging back out. Since 2026 true value = (one-year value + 2025 true value) / 2, the one-year value = 2 x (2026 true value) - (2025 true value).

**What we cannot copy exactly:**
- The state uses 4 classes; we use 2. Most towns have only a few vacant-land and commercial sales (often 0 to 3), so we put them together. The court says the state treats "all class 4 properties together," so the main difference is class 1 (vacant land).
- When a town has no sales in one group, we value that group at the other group's ratio. We do not know what the state does in that case.

**Our published class-2 median** (the number on our town pages) is different on purpose. It covers homes only, with no condos (C10), single lots only (C6), and gentle outlier trimming (C8). It uses the median, which is the IAAO standard and is not pulled by one odd sale. It is checked with rule V3.

**Other comparisons.**
- **COD.** We compare the state's class-2 "coefficient of deviation" (2026) to our mean-based version on the same sales (V2). Our published IAAO COD is listed for context. It is a different measure, so it should not match.
- **Sale price.** We compare the state's 2026 average residential sale price to our clean median price (median gap -1.7%). A median is lower because a few very expensive homes do not pull it up. Our average on the same sales matches the state's to the dollar.

**Flag thresholds.** V4 flags a town if our one-year ratio and the state's differ by more than **5 points** (`VALIDATION_FLAG_PP` in `pipeline/config.py`). This is a like-for-like comparison, so a 5-point miss would mean a real problem. V3 keeps its **10-point** flag, because it compares two measures that are meant to differ.

<!-- BEGIN GENERATED by pipeline/validate.py. Do not edit by hand; rerun the pipeline. -->

## Results (generated)

**Headline.** For 70 of 70 towns, our ratio was within 5 points of the state's, and for 66 it was within 1 point, once we follow the state's method (weighted by property class, before the state averages in last year).

| Check | Result |
|---|---|
| Same sales as the state: usable class 1 + 2 + 4 count matches the state's TOTAL count | 70 of 70 towns (5,141 vs 5,141 sales) |
| 2027 Chapter 123 average ratio equals the 2026 Table ratio and the Director's 2026 ratio | 70 and 70 of 70 towns |
| **V4 one-year ratio: ours within 5 points of the state's** | **70 of 70 towns** |
| V4 one-year ratio: within 2 points / within 1 point | 67 / 66 of 70 towns |
| V4 one-year ratio: median gap (ours minus state's); biggest gap | +0.23 points; 3.01 (Bogota) |
| Published ratio vs our two-year version: within 5 points / within 1 point | 70 / 66 of 70 towns |
| First try, plain average of the same sales vs the published ratio: within 5 points | 44 of 70 towns (state higher in 69; median gap -4.50) |
| Averaging with last year raises the published ratio above the one-year ratio | 69 of 70 towns (median +4.62 points) |
| Published ratio higher than every one of the town's sales | 4 towns (East Rutherford, Rockleigh, South Hackensack, Teterboro) |
| Our published class-2 median within 5 points of the published ratio | 15 of 69 towns with clean sales |
| V3: class-2 median more than 10 points from the published ratio | 13 towns (median gap -6.82) |
| V2: our coefficient within 0.25 of the state's class-2 coefficient | 69 of 69 towns (main-lot assessment only: 65) |
| State's average sale price equals our class-2 average on the same sales | 69 of 70 towns |
| Median gap, our clean median price vs the state's average price | -1.7% |

### Gap by group

| Group | Towns | Within 1 point | Median one-year gap | Median plain-average gap |
|---|---|---|---|---|
| Revaluation: On neither list | 10 | 8 | +0.35 | -4.21 |
| Revaluation: On the 2026 revaluation list | 36 | 35 | +0.22 | -5.79 |
| Revaluation: On the 2027 revaluation list | 24 | 23 | +0.18 | -3.19 |
| Sample size: 20 or more sales | 56 | 53 | +0.23 | -3.95 |
| Sample size: Under 20 sales | 14 | 13 | +0.20 | -8.04 |

### Full comparison table

Ratios are percents. "One-year" = before the state averages in last year (rule V4). "Ours" uses every usable class 1, 2, and 4 sale, weighted by price, with homes and other property weighted by their share of the town's assessed value. "Gap" = ours minus the state's, in percentage points. A dash means no sales.

| Town | State one-year | Ours one-year | Gap | Over 5? | State published | Ours two-year | Plain average | n (ours / state) | Class-2 median (clean) | State coeff. | Ours coeff. | IAAO COD | State avg price | Our median price |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Allendale | 85.72 | 86.04 | +0.32 | no | 89.97 | 90.15 | 85.97 | 21 / 21 | 82.79 | 10.68 | 10.69 | — | 1,018,189 | 870,000 |
| Alpine | 77.94 | 75.38 | -2.56 | no | 86.74 | 85.13 | 80.89 | 13 / 13 | 84.90 | 22.48 | 22.48 | — | 5,647,833 | 4,125,000 |
| Bergenfield | 46.44 | 46.54 | +0.10 | no | 50.26 | 50.32 | 49.27 | 170 / 170 | 47.77 | 14.46 | 14.45 | 13.67 | 732,368 | 640,000 |
| Bogota | 84.54 | 81.53 | -3.01 | no | 85.74 | 84.16 | 81.21 | 38 / 38 | 79.30 | 10.18 | 10.17 | 8.52 | 630,171 | 627,500 |
| Carlstadt | 101.19 | 101.61 | +0.42 | no | 98.05 | 98.25 | 90.79 | 15 / 15 | 75.24 | 15.16 | 15.16 | — | 737,500 | 689,000 |
| Cliffside Park | 56.29 | 56.61 | +0.32 | no | 60.06 | 60.24 | 59.78 | 192 / 192 | 47.46 | 17.03 | 17.04 | 17.48 | 698,021 | 812,500 |
| Closter | 85.11 | 84.68 | -0.43 | no | 90.05 | 89.81 | 85.47 | 34 / 34 | 83.05 | 10.27 | 10.26 | 10.36 | 1,376,903 | 1,100,000 |
| Cresskill | 82.07 | 79.17 | -2.90 | no | 85.04 | 83.45 | 81.86 | 29 / 29 | 79.69 | 10.22 | 10.23 | 10.64 | 1,376,964 | 1,285,000 |
| Demarest | 91.23 | 92.01 | +0.78 | no | 96.89 | 97.33 | 91.14 | 64 / 64 | 90.87 | 8.54 | 8.53 | 8.50 | 1,636,758 | 1,320,000 |
| Dumont | 89.74 | 89.79 | +0.05 | no | 95.24 | 95.27 | 90.89 | 29 / 29 | 88.35 | 9.03 | 9.03 | 6.60 | 674,707 | 675,000 |
| Elmwood Park | 97.29 | 97.96 | +0.67 | no | 108.46 | 108.88 | 94.29 | 39 / 39 | 93.49 | 8.09 | 8.09 | 8.27 | 663,629 | 625,000 |
| East Rutherford | 83.82 | 84.26 | +0.44 | no | 94.28 | 94.56 | 81.35 | 11 / 11 | 82.00 | 7.13 | 7.13 | — | 669,500 | 658,000 |
| Edgewater | 89.01 | 89.14 | +0.12 | no | 91.93 | 92.00 | 91.47 | 64 / 64 | 78.31 | 8.63 | 8.63 | — | 863,078 | 1,183,000 |
| Emerson | 60.49 | 61.08 | +0.60 | no | 63.38 | 63.71 | 60.23 | 56 / 56 | 55.54 | 15.07 | 15.07 | 14.01 | 813,970 | 770,000 |
| Englewood | 52.04 | 52.07 | +0.03 | no | 58.12 | 58.14 | 56.02 | 200 / 200 | 48.37 | 16.05 | 16.05 | 12.32 | 795,467 | 700,000 |
| Englewood Cliffs | 74.60 | 75.02 | +0.42 | no | 77.83 | 78.06 | 74.30 | 53 / 53 | 74.49 | 12.32 | 12.32 | 12.37 | 1,792,424 | 1,730,000 |
| Fair Lawn | 50.04 | 50.92 | +0.87 | no | 53.46 | 53.95 | 48.12 | 245 / 245 | 45.93 | 9.68 | 9.69 | 9.24 | 718,024 | 690,000 |
| Fairview | 77.67 | 77.73 | +0.07 | no | 81.45 | 81.49 | 78.91 | 26 / 26 | 73.52 | 13.67 | 13.68 | — | 709,739 | 690,000 |
| Fort Lee | 55.75 | 55.70 | -0.05 | no | 60.88 | 60.85 | 61.77 | 263 / 263 | 54.37 | 13.51 | 13.51 | 15.42 | 748,057 | 999,000 |
| Franklin Lakes | 60.46 | 62.19 | +1.73 | no | 66.17 | 67.19 | 61.92 | 115 / 115 | 60.39 | 14.75 | 14.75 | 15.10 | 1,990,026 | 1,750,444 |
| Garfield | 43.84 | 43.93 | +0.08 | no | 47.06 | 47.11 | 44.97 | 177 / 177 | 42.78 | 16.06 | 16.05 | 14.27 | 643,099 | 680,000 |
| Glen Rock | 52.71 | 53.07 | +0.36 | no | 57.45 | 57.66 | 53.94 | 110 / 110 | 51.83 | 11.21 | 11.21 | 10.82 | 1,129,576 | 1,067,500 |
| Hackensack | 66.90 | 67.17 | +0.27 | no | 69.95 | 70.10 | 66.72 | 287 / 287 | 60.40 | 11.97 | 11.97 | 10.15 | 447,510 | 660,000 |
| Harrington Park | 56.86 | 56.91 | +0.05 | no | 61.22 | 61.25 | 59.63 | 35 / 35 | 52.82 | 16.79 | 16.79 | 9.81 | 889,729 | 999,000 |
| Hasbrouck Heights | 88.83 | 89.17 | +0.34 | no | 93.16 | 93.35 | 88.49 | 23 / 23 | 89.14 | 4.79 | 4.79 | 4.60 | 730,088 | 732,500 |
| Haworth | 49.68 | 50.31 | +0.63 | no | 55.60 | 55.99 | 51.10 | 31 / 31 | 49.17 | 14.29 | 14.29 | 12.12 | 1,382,646 | 1,350,000 |
| Hillsdale | 56.83 | 56.80 | -0.03 | no | 60.20 | 60.18 | 57.90 | 77 / 77 | 56.79 | 13.70 | 13.70 | 13.04 | 870,892 | 875,000 |
| Ho-Ho-Kus | 83.81 | 84.29 | +0.48 | no | 94.22 | 94.53 | 87.50 | 18 / 18 | 83.13 | 16.39 | 16.39 | — | 1,519,011 | 1,437,500 |
| Leonia | 98.70 | 98.79 | +0.09 | no | 100.16 | 100.21 | 99.69 | 15 / 15 | 92.14 | 8.36 | 8.36 | — | 697,600 | 805,000 |
| Little Ferry | 87.08 | 87.45 | +0.37 | no | 88.07 | 88.26 | 83.31 | 30 / 30 | 76.76 | 10.43 | 10.43 | — | 528,091 | 620,000 |
| Lodi | 44.64 | 44.64 | -0.00 | no | 48.00 | 48.00 | 46.22 | 118 / 118 | 44.70 | 13.05 | 13.04 | 13.80 | 683,915 | 672,000 |
| Lyndhurst | 80.94 | 81.16 | +0.22 | no | 85.26 | 85.38 | 79.54 | 40 / 40 | 78.20 | 10.69 | 10.68 | 10.99 | 658,865 | 650,000 |
| Mahwah | 61.72 | 61.95 | +0.23 | no | 63.77 | 63.89 | 59.16 | 301 / 301 | 58.74 | 10.44 | 10.45 | 10.06 | 728,413 | 577,500 |
| Maywood | 74.90 | 75.11 | +0.21 | no | 82.46 | 82.59 | 76.32 | 20 / 20 | 76.54 | 12.43 | 12.43 | 12.40 | 792,050 | 757,500 |
| Midland Park | 51.59 | 51.66 | +0.07 | no | 55.82 | 55.86 | 54.32 | 44 / 44 | 52.33 | 13.60 | 13.60 | 13.55 | 741,940 | 772,500 |
| Montvale | 57.15 | 57.29 | +0.13 | no | 63.82 | 63.90 | 59.22 | 76 / 76 | 54.35 | 15.80 | 15.80 | 15.79 | 989,818 | 900,000 |
| Moonachie | 95.43 | 95.44 | +0.00 | no | 99.79 | 99.79 | 96.01 | 4 / 4 | 97.18 | 8.35 | 8.35 | — | 628,750 | 667,500 |
| New Milford | 85.64 | 85.68 | +0.04 | no | 91.16 | 91.18 | 87.94 | 106 / 106 | 86.37 | 11.69 | 11.69 | 11.65 | 724,237 | 672,500 |
| North Arlington | 81.32 | 81.47 | +0.14 | no | 86.42 | 86.50 | 80.76 | 29 / 29 | 80.67 | 8.51 | 8.51 | 8.64 | 685,621 | 641,000 |
| Northvale | 95.81 | 96.11 | +0.30 | no | 103.95 | 104.13 | 92.06 | 17 / 17 | 89.15 | 6.20 | 6.20 | — | 795,875 | 795,000 |
| Norwood | 95.03 | 95.38 | +0.36 | no | 100.89 | 101.09 | 93.36 | 26 / 26 | 91.00 | 8.12 | 8.12 | — | 1,008,913 | 875,000 |
| Oakland | 90.27 | 90.56 | +0.29 | no | 92.89 | 93.04 | 90.34 | 43 / 43 | 89.22 | 8.17 | 8.17 | 8.18 | 794,578 | 700,000 |
| Old Tappan | 96.70 | 97.04 | +0.34 | no | 102.14 | 102.33 | 96.27 | 21 / 21 | 94.19 | 13.20 | 13.20 | — | 1,268,357 | 1,520,000 |
| Oradell | 76.49 | 76.69 | +0.20 | no | 84.28 | 84.40 | 75.46 | 18 / 18 | 76.26 | 10.23 | 10.23 | — | 1,203,000 | 1,195,000 |
| Palisades Park | 87.31 | 87.84 | +0.52 | no | 90.86 | 91.14 | 88.43 | 51 / 51 | 87.55 | 12.08 | 12.08 | 13.58 | 964,814 | 977,500 |
| Paramus | 97.81 | 98.66 | +0.85 | no | 98.22 | 98.64 | 87.92 | 81 / 81 | 85.93 | 13.79 | 13.79 | 13.28 | 1,211,663 | 960,000 |
| Park Ridge | 54.33 | 54.38 | +0.05 | no | 58.83 | 58.86 | 55.10 | 95 / 95 | 52.52 | 13.79 | 13.79 | 14.66 | 798,356 | 850,000 |
| Ramsey | 85.17 | 85.39 | +0.22 | no | 91.90 | 92.03 | 84.15 | 56 / 56 | 82.99 | 9.16 | 9.17 | 10.48 | 814,472 | 890,000 |
| Ridgefield | 86.11 | 86.44 | +0.33 | no | 93.47 | 93.67 | 86.29 | 37 / 37 | 83.24 | 9.19 | 9.19 | 7.71 | 739,297 | 760,000 |
| Ridgefield Park | 69.83 | 70.61 | +0.78 | no | 74.47 | 74.91 | 72.68 | 82 / 82 | 68.60 | 15.31 | 15.32 | 16.13 | 606,216 | 635,000 |
| Ridgewood | 52.22 | 51.94 | -0.28 | no | 56.09 | 55.93 | 52.22 | 193 / 193 | 50.39 | 12.71 | 12.71 | 12.35 | 1,434,671 | 1,165,000 |
| River Edge | 88.14 | 88.61 | +0.47 | no | 92.94 | 93.20 | 88.43 | 13 / 13 | 87.53 | 8.90 | 8.91 | — | 854,615 | 775,000 |
| River Vale | 60.65 | 61.34 | +0.70 | no | 67.04 | 67.46 | 62.47 | 105 / 105 | 61.11 | 11.50 | 11.50 | 12.25 | 1,006,087 | 999,225 |
| Rochelle Park | 97.98 | 98.99 | +1.00 | no | 99.22 | 99.73 | 89.22 | 17 / 17 | 80.87 | 11.31 | 11.32 | — | 694,375 | 700,000 |
| Rockleigh | 89.91 | 89.91 | -0.00 | no | 119.50 | 119.50 | 89.28 | 2 / 2 | 89.28 | 3.55 | 3.55 | — | 2,365,000 | 2,365,000 |
| Rutherford | 62.36 | 62.82 | +0.46 | no | 64.31 | 64.55 | 58.95 | 126 / 126 | 56.26 | 13.01 | 13.02 | 12.16 | 727,816 | 775,000 |
| Saddle Brook | 72.64 | 72.70 | +0.06 | no | 78.49 | 78.52 | 70.79 | 36 / 36 | 70.72 | 11.54 | 11.54 | 11.48 | 688,735 | 660,000 |
| Saddle River | 73.01 | 73.34 | +0.33 | no | 80.00 | 80.20 | 72.77 | 34 / 34 | 71.64 | 12.35 | 12.35 | 12.96 | 3,007,217 | 3,350,000 |
| South Hackensack | 68.42 | 68.43 | +0.01 | no | 82.52 | 82.52 | 68.39 | 2 / 2 | 68.39 | 4.15 | 4.14 | — | 741,000 | 741,000 |
| Teaneck | 84.97 | 85.33 | +0.37 | no | 87.43 | 87.62 | 83.54 | 264 / 264 | 80.88 | 11.47 | 11.47 | 11.97 | 733,950 | 680,000 |
| Tenafly | 54.04 | 54.50 | +0.47 | no | 58.89 | 59.17 | 56.24 | 124 / 124 | 55.02 | 14.60 | 14.60 | 14.88 | 1,617,994 | 1,395,000 |
| Teterboro | 31.67 | 31.67 | -0.00 | no | 48.54 | 48.54 | 31.67 | 1 / 1 | — | — | — | — | 0 | — |
| Upper Saddle River | 50.42 | 50.89 | +0.48 | no | 55.03 | 55.31 | 53.19 | 102 / 102 | 50.20 | 16.37 | 16.37 | 14.88 | 1,606,222 | 1,444,995 |
| Waldwick | 75.35 | 75.45 | +0.10 | no | 81.09 | 81.15 | 77.28 | 101 / 101 | 75.94 | 10.43 | 10.43 | 10.43 | 694,678 | 675,000 |
| Wallington | 81.93 | 82.58 | +0.65 | no | 88.87 | 89.25 | 80.60 | 52 / 52 | 80.45 | 11.25 | 11.25 | 11.39 | 711,825 | 700,000 |
| Washington Township | 88.25 | 88.50 | +0.24 | no | 96.81 | 96.96 | 88.86 | 30 / 30 | 89.41 | 6.44 | 6.44 | 6.85 | 816,400 | 790,000 |
| Westwood | 88.18 | 88.36 | +0.19 | no | 90.90 | 91.00 | 86.55 | 16 / 16 | 88.92 | 10.24 | 10.24 | — | 603,036 | 715,000 |
| Woodcliff Lake | 83.93 | 83.99 | +0.06 | no | 86.28 | 86.31 | 83.88 | 21 / 21 | 79.46 | 7.90 | 7.90 | — | 1,187,417 | 1,180,000 |
| Wood-Ridge | 96.11 | 96.25 | +0.14 | no | 100.99 | 101.07 | 96.47 | 25 / 25 | 95.14 | 7.21 | 7.21 | — | 712,360 | 707,500 |
| Wyckoff | 65.53 | 65.55 | +0.02 | no | 70.06 | 70.07 | 66.57 | 132 / 132 | 64.39 | 13.40 | 13.40 | 12.64 | 1,265,428 | 1,250,000 |

### Where the plain average missed most, and why

The 10 towns where our first try (a plain average) was furthest from the published ratio. "Averaging" = published ratio minus the state's one-year ratio (the part caused by mixing in last year). "Left over" = our one-year ratio minus the state's.

| Town | Plain-average gap | Averaging | Left over | Sales (1 / 2 / 4) | State 2025 ratio | Assessed 2025 → 2026 ($M) | Reval year |
|---|---|---|---|---|---|---|---|
| Rockleigh | -30.22 | +29.59 | -0.00 | 0 / 2 / 0 | 111.94 | 251 → 399 | 2026 |
| Teterboro | -16.87 | +16.87 | -0.00 | 0 / 0 / 1 | 94.39 | 588 → 647 | 2026 |
| Elmwood Park | -14.17 | +11.17 | +0.67 | 0 / 38 / 1 | 61.16 | 2,202 → 4,411 | 2026 |
| South Hackensack | -14.13 | +14.10 | +0.01 | 0 / 2 / 0 | 98.39 | 1,148 → 1,213 | 2026 |
| East Rutherford | -12.93 | +10.46 | +0.44 | 0 / 10 / 1 | 102.14 | 2,986 → 3,150 | 2026 |
| Northvale | -11.89 | +8.14 | +0.30 | 0 / 16 / 1 | 60.79 | 893 → 1,668 | 2026 |
| Paramus | -10.30 | +0.41 | +0.85 | 0 / 76 / 5 | 93.30 | 12,886 → 13,623 | 2026 |
| Rochelle Park | -10.00 | +1.24 | +1.00 | 0 / 16 / 1 | 63.89 | 963 → 1,515 | 2026 |
| Oradell | -8.82 | +7.79 | +0.20 | 0 / 16 / 2 | 89.20 | 2,359 → 2,481 | 2026 |
| Wallington | -8.27 | +6.94 | +0.65 | 0 / 49 / 3 | 96.76 | 1,768 → 1,774 | — |

**Towns over the 5-point flag (V4):** none.

<!-- END GENERATED -->

## 3. The flagged towns, explained

### V4: no town is flagged

All 70 towns are within 5 points. The 3 biggest gaps are about 3 points. Each is a town where our "everything else" group rests on just 1 to 3 sales:
- **Bogota (-3.0).** 35 home sales, but only 3 others (2 vacant land, 1 commercial). The state rates vacant land and commercial separately; we cannot with 3 sales.
- **Cresskill (-2.9).** No commercial sales. The only non-home sale is 1 vacant lot with a ratio of 48.6. We use it to value all of the town's non-home property (7% of the assessed total).
- **Alpine (-2.6).** Same pattern: 1 vacant lot with a ratio of 40.0 stands in for all non-home property (8% of the assessed total). Alpine also has only 12 home sales.

These are limits of our 2-group shortcut, not data errors.

### The 26 towns our first try flagged

Our first try, a plain average of the same sales, was more than 5 points from the published ratio in 26 towns. V4 explains every one of them. The generated table above splits each gap into two parts. "Averaging" is the part caused by the state mixing in last year. "Left over" is what remains after we follow the state's method. It is under 1.1 points in all 10 towns.

**1. Rockleigh (plain-average gap -30.2).** Rockleigh's 2 sales have ratios of 86.1 and 92.5. The published ratio, 119.50, is higher than both. Rockleigh is a 2026 revaluation town. Its assessed total jumped from $251 million to $399 million, but its 2025 true value was only $224 million. Averaging that low 2025 value in lifts the ratio by 29.6 points. With that taken out, the state's one-year ratio (89.91) equals ours (89.91).

**2. Teterboro (-16.9).** 1 usable sale, an industrial property with a ratio of 31.7. Averaging adds 16.9 points. The left-over gap is 0.00. Teterboro has no home sales, so it has no home statistics.

**3. Elmwood Park (-14.2).** A 2026 revaluation doubled its assessed total, from $2.20 billion to $4.41 billion. Its 2025 true value was $3.60 billion. The state's one-year true value is $4.53 billion; ours is $4.50 billion. Averaging with the 2025 value gives the published 108.46. Averaging adds 11.2 points. The rest is homes vs. commercial weighting. Left over: +0.67.

**4. South Hackensack (-14.1).** 2 sales. Averaging adds 14.1 points. Left over: +0.01.

**5. East Rutherford (-12.9).** 11 sales. Averaging adds 10.5 points. Left over: +0.44.

**6. Northvale (-11.9).** A 2026 revaluation (assessed total $893 million to $1,668 million). Averaging adds 8.1 points. Left over: +0.30.

**7. Paramus (-10.3).** Here averaging adds only 0.4 points. The gap comes from **class weighting**. Paramus homes have a weighted ratio of 87.05, but its 5 commercial sales have a ratio of 119.18, and non-home property is 44% of the town's assessed value. A plain average lets the 76 home sales outvote the commercial ones. The state's method does not. Left over: +0.85.

**8. Rochelle Park (-10.0).** Mostly class weighting too. One commercial sale (ratio 153.5) stands for non-home property, which is 32% of the assessed total. Averaging adds 1.2 points. Left over: +1.00.

**9. Oradell (-8.8).** Averaging adds 7.8 points. Left over: +0.20.

**10. Wallington (-8.3).** Not on either revaluation list, with 52 sales over the full year. Wallington's 2025 ratio was 96.76. Averaging that older, higher level in adds 6.9 points. Left over: +0.65.

The other 16 towns follow the same pattern: averaging, plus class weighting in towns with a lot of commercial property. In all 70 towns, the published ratio and our two-year version are within 5 points (66 within 1 point).

**Why small towns and 2026 revaluation towns had the biggest first-try gaps.** In a revaluation year the assessed total jumps but last year's true value does not, so averaging moves the ratio a lot. In a town with 2 sales, one year's sales can be far from last year's value. After V4, these towns match as well as any other: 35 of 36 revaluation towns are within 1 point, and so are 13 of 14 towns with under 20 sales.

**V3 (our class-2 median vs the published ratio).** 13 towns are more than 10 points apart. The causes are the same: averaging, and the published ratio covering commercial property. Example: in Carlstadt, non-home property is 75% of the assessed value, with a commercial ratio of 114.5 against 76.3 for homes. Our home median is meant to describe homes only, so these gaps are expected, not errors.

**Did we find any data errors?** No. Every count matches the state's, and no town fails V2 or V4. Validation turned up one thing we did differently from the state: for sales with extra lots, the state uses the total assessment. This matters only for the comparisons, because our cleaning drops multi-lot sales anyway (rule C6).

## 4. What this means for the town rankings

- **We read the same data the state reads.** Same sales in 70 of 70 towns. Same average price in 69 of 69. Same spread in 69 of 69. Same ratio, once we follow the state's method, in 70 of 70 (66 within 1 point). If our parsing, dates, usable flags, or assessments were wrong, these checks would fail.
- **The rankings use spread, not level.** COD, PRD, and PRB compare homes inside one town with each other. The state's averaging with last year changes a town's level, not the spread among its homes, so it does not touch our rankings.
- **The published state ratio is a two-year blend.** For a 2026 revaluation town, the 2027 average ratio still carries half of the town's pre-revaluation value. Town pages can say this in plain words. It helps explain why the Chapter 123 limits can look high or low next to recent sales.
- **The appeal checker uses the state's printed limits**, from `2027CH123.pdf`, never our ratio. This validation shows those limits rest on the same sales we use.
- **It explains a result in our statistics.** More sold homes fall below the state's lower limit than above its upper limit (`docs/stats-summary.md`, T7). That fits a published ratio raised by averaging and by commercial property.

## What I changed because of validation

Zaden asked Claude to decide the open items (2026-10-15: "based on the best interests of winning the congressional app challenge, the usefulness of the website, the success of the website, ... the goal of the project, and the instructions of the prompt"). Changes:
1. **Found and saved the state's method.** Added the 2026 Tax Court opinion and the 2025 Table of Equalized Valuations to `data/raw/`, with a quote file (`director-average-ratio-method.md`). Methodology Section 2.4 now explains how the average ratio is computed.
2. **New rule V4.** Rebuild the state's one-year ratio from our sales and compare. Flag a town more than 5 points apart. Kept V3's 10-point flag for the class-2 median, since that comparison is meant to differ.
3. **Total assessment for multi-lot sales** in V2 and V4, because that is how the state pairs them. V2 now passes in 69 of 69 towns (65 with the main lot only).
4. **Updated old numbers** in methodology V1, V2, V3, and Section 7 to the pipeline's numbers. Methodology is now version 1.4.

5. **Town pages will show the state's ratio beside ours** (decided 2026-10-15, built in the town-pages prompt). Each page shows the published 2027 average ratio (with its source link, `2027CH123.pdf`) next to our home median, plus a short note: the state's ratio includes commercial property and land, gives more weight to expensive sales, and blends this year with last year (source link: the Tax Court opinion). For 2026 revaluation towns, the note adds that the state's ratio still carries half of the value from before the revaluation. Numbers come from `validation.csv`. The methodology page links to this file.

No cleaning rule, town statistic, or ranking changed.

## Investigation log

| Date | Town | Check | What we found | Action |
|---|---|---|---|---|
| 2026-10-14 | All | V1, V2, V3 scratch checks | Preliminary: V1 70 of 70; V2 62 of 66 within 0.25; class-2 median about 6 points below the state's. | Replaced by the pipeline results above. |
| 2026-10-15 | Rockleigh, Carlstadt, Elmwood Park, South Hackensack, Rochelle Park | V3 (raw, before cleaning) | Biggest raw gaps; all on the 2026 revaluation list. | Closed: averaging with the prior year, plus class weighting (Section 3). |
| 2026-10-15 | Emerson, Hackensack, Haworth, Hillsdale | V2 | The 4 old V2 misses. Each has a multi-lot home sale with a tiny main-lot ratio. Using the total assessment, as the state does, all 4 pass. | Closed. Written into V2. |
| 2026-10-15 | All | Prompt 7 | Plain average 44 of 70 within 5 points; state higher in 69; 4 towns above every sale. | Closed by the Tax Court opinion and V4: 70 of 70 within 5 points, 66 within 1. |
| 2026-10-15 | Bogota, Cresskill, Alpine | V4 | Biggest V4 gaps (about 3 points). Each has only 1 to 3 non-home sales. | Known limit of the 2-group method. No action. |
