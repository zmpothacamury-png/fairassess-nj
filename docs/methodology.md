# Methodology

## Research question

Are NJ residential assessments regressive, and does regressivity grow with years since a town's last revaluation?

## Hypotheses

- H1 — Within a town, the assessment-to-sale ratio falls as sale price rises (IAAO price-related differential above 1.03; price-related bias below −0.05).
- H2 — Regressivity is near zero in the first two years after a revaluation and grows each year after.
- H3 — Parcels whose ratio sits above the Chapter 123 upper limit (the legal appeal threshold) are concentrated in the bottom price quartile.

## Data sources

## Which sales count (usable-sale rules)

## Measures (COD, PRD, PRB)

## Models

## Limitations

### Towns with a 2027 revaluation or reassessment
- Source: Bergen County Board of Taxation list, "2026 & 2027 Revaluations and Reassessments" (as of January 7, 2026). See `data/raw/notes/bergen-revaluations-2026-2027.md`.
- For these towns, the checker still runs. Every result for these towns shows a clear warning:
  - The town is getting new assessments for 2027.
  - Our numbers use the assessments from before that change, so the result may not match the homeowner's new assessed value.
  - The 2027 appeal deadline for these towns is May 1, not April 1.
- The exact warning wording will be written in a site prompt and checked by Zaden.

## Change history

- 2026-10-14: Added the rule for towns with a 2027 revaluation or reassessment. Zaden chose to run the checker with a warning instead of hiding results.
