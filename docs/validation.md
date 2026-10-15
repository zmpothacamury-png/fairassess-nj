# Validation

This file records how we check our numbers against the state's. The rules are V1 to V3 in `docs/methodology.md` Section 8.

**Status:** preliminary. The results below come from one-time scratch scripts run on 2026-10-14, before the pipeline existed. The pipeline will rerun every check as a test, and this file will be updated with the pipeline's numbers. No number here may appear on the site until the pipeline reproduces it.

## Inputs
- Sales: `data/raw/sr1a/Sales2026.zip` (deeds recorded July 1, 2025 to June 30, 2026)
- State counts and coefficients: `data/raw/state/CoefficientDeviations.pdf` (dated 9/17/2026, year 2026 rows, class 2), `data/raw/state/2026AvgResStat.pdf`
- State average ratios: `data/raw/state/2027CH123.pdf`

## V1. Same sales as the state

Filter: Bergen (C1), class 2 (C2), usable (C3). No other filters.

| Check | Result |
|---|---|
| Towns where our count = CoD class-2 count | 70 of 70 |
| Total sales, ours / CoD / AvgResStat | 4,917 / 4,917 / 4,917 |
| Same test with Sales2025.zip | 4 of 70 match (wrong period, as expected) |
| Same test with YTDSR1A2026.zip | 8 of 70 match (different extract; not used) |

**Preliminary result: pass.**

## V2. Coefficient of deviation

Same sales as V1, no trimming. Compared to the state's class-2 "stratified" coefficient for 2026.

| Our formula | Towns within 0.02 | Towns within 0.25 |
|---|---|---|
| Distance from the **mean** ratio (state style) | 56 of 66 | 62 of 66 |
| Distance from the **median** ratio (IAAO COD) | 7 of 66 | not computed |

66 towns had at least 5 sales and a state value. The 4 towns outside 0.25 (codes 0214, 0223, 0226, 0227) will be investigated by the pipeline.

**Preliminary result: the state's measure is mean-based. 62 of 66 pass the 0.25 rule; 4 to investigate.**

## V3. Median ratio vs the state's average ratio

| Check | Result |
|---|---|
| Our class-2 median minus the state average ratio, average across towns | about -6.3 points |
| Range | about -22.8 (Carlstadt) to +0.2 points |

Our median is almost always lower. That is expected (methodology Section 8, V3). Towns more than 10 points apart are flagged for review once the pipeline runs with all cleaning rules.

## Investigation log

| Date | Town | Check | What we found | Action |
|---|---|---|---|---|
| — | — | — | — | — |
