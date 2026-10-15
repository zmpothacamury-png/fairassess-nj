# FairAssess NJ Methodology

**Version 1.4 (2026-10-15).** This file is the source of truth for every analysis rule. If code and this file disagree, the code is wrong. Stop and tell Zaden. Changing a rule needs Zaden's approval and a changelog line (Section 9).

> FairAssess NJ is an independent student research project that uses public data. It is not legal, tax, or appraisal advice. Homeowners file and present their own appeals. Confirm deadlines, fees, and forms with the Bergen County Board of Taxation.

**How to read this file**
- Each rule is either a **fixed standard** (from IAAO or New Jersey law) or **our choice**. Each choice is marked *Our choice* and gives the reason in plain English.
- Rule IDs (C1, T3, K7, V2, ...) are fixed. Code, tests, and the filter log refer to them.
- Every outside fact cites a file in `data/raw/` or `data/raw/notes/`. The two main standard sources are summarized with quotes in `data/raw/notes/ratio-study-standards.md`.

---

## 1. Purpose and research question

**Research question.** Do Bergen County towns assess lower-priced single-family homes at a higher share of their market value than higher-priced homes?

**Hypothesis H1.** In towns with a regressive pattern, PRD is above 1.03 and PRB is below -0.05. (Section 2 explains PRD and PRB.)

"Regressive" means cheaper homes are assessed at a higher share of their value than expensive homes. When that happens, owners of cheaper homes pay more than their fair share of the town's taxes.

**Supporting finding (T7).** For each town, what share of sold homes in each value quarter had a ratio above the town's 2027 Chapter 123 limit? This links the town rankings to the appeal checker: it shows which homeowners are most likely to have grounds to appeal. It is a description, not a separate hypothesis test.

**Planned for version 2.0.** H2, the revaluation-drift question: does the regressive pattern grow with each year since a town's last revaluation? v1 does not test H2.

---

## 2. Borrowed standard tools

None of these tools are our inventions.

**Sources**
- IAAO *Standard on Ratio Studies*, approved April 2013. Saved as `data/raw/notes/IAAO_Standard_on_Ratio_Studies_GAcopy.pdf`, downloaded from https://www.audits2.ga.gov/wp-content/uploads/2024/08/Standard_on_Ratio_Studies.pdf. IAAO says its standards are advisory, and state law wins where they conflict. A revised IAAO draft exists (May 2026) but is not adopted, so we cite 2013.
- New Jersey Chapter 123 documents (Section 2.4).

### 2.1 Assessment ratio

**Assessment ratio = assessed value / sale price.**

It tells you what share of a home's market value the town is taxing. A home that sold for $500,000 and is assessed at $400,000 has a ratio of 0.80, or 80%.

- In code we store ratios as decimals (0.80). On the site we show them as percents (80%), because the state publishes its ratios as percents.
- The SR1A file has its own SALES-RATIO field. We do not use it. We compute the ratio ourselves from the two values so every step can be tested.

### 2.2 IAAO ratio study measures

In these formulas, a town has *n* sales. Sale *i* has assessed value *A_i*, sale price *S_i*, and ratio *R_i = A_i / S_i*.

| Measure | Formula | In one plain sentence |
|---|---|---|
| Median ratio | The middle value of all *R_i* when sorted (average of the two middle values if *n* is even) | The typical share of market value the town assesses at. |
| Mean ratio | (R_1 + R_2 + ... + R_n) / n | The plain average of all the ratios. |
| Weighted mean ratio | (A_1 + ... + A_n) / (S_1 + ... + S_n) | The total assessed value of all sold homes divided by their total sale prices, so pricier homes count for more. |
| COD (coefficient of dispersion) | 100 x [ (sum of \|R_i - median\|) / n ] / median | How far, on average, each home's ratio sits from the typical ratio, as a percent; lower means more even assessments. |
| PRD (price-related differential) | mean ratio / weighted mean ratio | Above 1 means cheaper homes tend to have higher ratios than expensive homes. |
| PRB (price-related bias) | See steps below | About how much the ratio changes, in percent, each time a home's value doubles. |

**PRB steps (IAAO Appendix D, page 56, exactly):**
1. Value proxy: *V_i = 0.50 x (A_i / median ratio) + 0.50 x S_i*. This mixes the sale price with the assessed value turned back into a market-value estimate, so neither one gets more weight.
2. Independent variable: *x_i = ln(V_i) / 0.693*. IAAO divides by 0.693 (about ln 2, so this is close to log base 2): one step in *x* means the value doubled. We use 0.693 exactly as IAAO writes it.
3. Dependent variable: *y_i = (R_i - median ratio) / median ratio*.
4. Fit an ordinary least squares line *y = a + b x*. **PRB = b** (the slope).

A PRB of -0.05 means the ratio falls by about 5% each time home value doubles.

### 2.3 IAAO reference ranges

| Measure | IAAO range | Where in the standard |
|---|---|---|
| COD, single-family homes | 5.0 to 15.0 in older or more mixed areas; 5.0 to 10.0 in newer or more similar areas. Below 5.0 "may indicate sales chasing or non-representative samples." | Table 1-3 (page 17) and section 9.2.2 |
| PRD | 0.98 to 1.03 | Table 1-3 footnote (page 17) |
| PRB | -0.05 to +0.05; if the 95% range falls outside -0.10 to +0.10, IAAO calls it "unacceptable" | Section 9.2.7 (page 19) |

*Our choice:* the site judges COD against **15.0**. *Reason:* most Bergen towns are older, built-out suburbs with a mix of home ages and styles, which matches IAAO's "older or more heterogeneous areas" row. The town page also mentions the 10.0 guideline for newer areas.

*Our choice:* a town's PRB counts as IAAO "unacceptable" only when its **whole** 95% range is below -0.10 or above +0.10. *Reason:* IAAO says "PRBs for which 95% confidence intervals fall outside the range of -0.10 to 0.10"; reading "fall outside" as the whole range avoids calling a small town unacceptable just because its range is wide.

*Our choice:* the median ratio gets **no** pass/fail flag. *Reason:* New Jersey towns assess at a fraction of market value on purpose (Bergen's 2027 average ratios run from 47.06% in Garfield to 119.50% in Rockleigh; 2027CH123.pdf), and Chapter 123 already handles the level. A level test made for 100% assessment would fail almost every town and mislead readers.

### 2.4 New Jersey's Chapter 123 test

Sources: `data/raw/state/ch123definitions.pdf` (Division of Taxation summary of Chapter 123, Laws of 1973, with 3 worked examples); `data/raw/state/2027CH123.pdf` (certified list for tax year 2027); Form A-1 instructions 9 and 10 (quoted in `data/raw/notes/appeal-deadlines-and-fees.md`).

- **Average ratio.** Each town's average ratio of assessed value to true value, set by the Director of the Division of Taxation "as of October 1 of the year preceding the tax year" (ch123definitions.pdf, page 1). For tax year 2027, that is the list promulgated as of **October 1, 2026** (2027CH123.pdf, page 1). The same ratio appears in the 2026 Table of Equalized Valuations (for example, Allendale 89.97 in both).
  - **How the Director computes it.** ch123definitions.pdf does not say. A 2026 Tax Court opinion does (`data/raw/notes/director-average-ratio-method.md`): it is "a weighted, classified and multi-year-averaged sales study." For each class, assessed values are compared with usable sale prices, giving "more weight to higher valued properties"; the class true values are added up; and "Averaging the current year's true value with the prior year's aggregate true value leads to the current year's aggregate true value. The average ratio is the ratio of assessed value to aggregate true value." So the 2027 ratio mixes the 2026 sales study with last year's value. Rule V4 checks this against our data.
- **Common level range.** "Plus or minus 15% of the average ratio for that district" (ch123definitions.pdf, page 1). We always use the **lower and upper limits exactly as printed** in 2027CH123.pdf. We never recompute them. (In the state's own example, an average ratio of 95.41 gives limits of 81.10 and 109.72.)
- **100% rule.** 2027CH123.pdf says under every county table: "RATIOS IN EXCESS OF 100% ARE TO BE CONSIDERED 100%." The state calls 100% the "county percentage level" (ch123definitions.pdf: "in all counties this level is 100%"). 7 Bergen towns have a 2027 average ratio above 100%: Elmwood Park, Leonia, Northvale, Norwood, Old Tappan, Rockleigh, and Wood-Ridge.
- **What the County Board does** (ch123definitions.pdf, page 1 and Examples I to III):
  1. If a home's ratio is above the upper limit or below the lower limit, the Board sets the taxable value to **true value x average ratio** (Example I).
  2. If the town's average ratio is below 100% and the home's ratio is **above 100%**, the Board lowers the taxable value to true value x average ratio, **even if the home's ratio is still inside the range** (Example II). This matters in towns whose upper limit is above 100%, such as Allendale (upper limit 103.47).
  3. If both the average ratio and the home's ratio are above 100%, the Board sets the taxable value to **true value x 100%** (Example III).
  4. "The act is not applicable with respect to any appeal from assessment of real property taken with respect to the tax year in which the taxing district shall have completed and put into operation a district-wide revaluation program." For a complete reassessment, the document says to "See County Board of Taxation rules," which we do not have on file. Rule K14 explains what this means for the checker.
- **True value** in these documents means market value. Form A-1 instruction 10 says the homeowner must show "the market value of your property ... as of October 1 of the preceding (pretax) year."

---

## 3. Data sources and time periods

### 3.1 Files

All files are in `data/raw/` and are never edited.

| File | What it is | Used in v1 for |
|---|---|---|
| `sr1a/Sales2026.zip` | SR1A sales, all NJ. Deeds **recorded July 1, 2025 to June 30, 2026** (checked in the data). | Town statistics; checker comps; price index |
| `sr1a/Sales2025.zip` | SR1A sales, the year before. Same July-to-June pattern; the pipeline logs the exact recording-date range. | Checker comps; price index |
| `sr1a/Sales2024.zip` | SR1A sales, deeds recorded July 2023 to June 2024. Its value fields do **not** follow either layout PDF (checked in `docs/data-profile.md`), so the pipeline counts its rows but does not decode it. | Not used in v1 (kept for 2.0) |
| `sr1a/YTDSR1A2026.zip` | An **older copy of Sales2026** (file date August 12, 2026; Sales2026 is September 24, 2026). Every Bergen sale in it is also in Sales2026, and the state changed 555 of them from usable to non-usable afterward. | Not used; kept as is (Zaden, 2026-10-14). When a sale is in both, the newer file wins. |
| `sr1a/SR1Afilelayout.pdf` | Field positions for the 663-character extract. **Our files are 663 characters per line, so this is the layout we use.** | Parsing |
| `sr1a/SR1A_FileLayout_Description.pdf` | Meaning of each field (dated 7/7/2011). | Field meanings |
| `state/2027CH123.pdf` | Average ratios, lower and upper limits for tax year 2027 appeals. Promulgated as of October 1, 2026 (signed September 22, 2026). | Checker test; T7; validation |
| `state/2026TEV.pdf` | 2026 Table of Equalized Valuations, promulgated as of October 1, 2026. | Cross-check of average ratios; V4 |
| `state/2025TEV.pdf` | 2025 Table of Equalized Valuations, certified October 1, 2025, as amended by the Tax Court January 30, 2026 (https://www.nj.gov/treasury/taxation/pdf/lptval/2024/2025TEV.pdf). | V4 (prior-year aggregate true value) |
| `state/DirRatios.xlsx` | Director's ratio history, 2002 to 2026, every town. | Town page context; 2.0 |
| `state/CoefficientDeviations.pdf` | State "coefficients of deviation" (dated 9/17/2026), years 2023 to 2026, by property class, with sale counts. | Validation |
| `state/2026AvgResStat.pdf` | 2026 average residential statistics, including number of sales per town. | Validation (sale counts) |
| `state/GTRhistory.xlsx`, `state/2025taxrates.pdf` | General tax rates, 1997 to 2025. **2025 is the newest year we have.** | Savings estimate |
| `state/ch123definitions.pdf` | Chapter 123 definitions and examples. | Section 2.4 |
| `state/2026CH123.pdf` | Ratios for tax year 2026 appeals. | Not used in v1 (deadline passed) |
| `notes/ratio-study-standards.md` + 2 PDFs | IAAO standard (2013) and NJ non-usable sale rules (May 2025). | Sections 2, 3.2, 4 |
| `notes/bergen-revaluations-2026-2027.md` | County list of 2026 and 2027 revaluation/reassessment towns (as of January 7, 2026). | Rules C9, K14 |
| `notes/appeal-deadlines-and-fees.md` | Form A-1 deadline, fees, and rules. | Checker result text |
| `notes/director-average-ratio-method.md` + PDF | Tax Court, *City of New Brunswick v. Director* (January 27, 2026): how the Director computes the average ratio. | Section 2.4; V4 |

**SR1A layout differences found** (the documents and the data disagree; we follow the data and the 663-character layout):
- Positions 5 to 16 hold TOTAL ASSESSMENT in our files (SR1Afilelayout.pdf), not BATCH-NUMBER and DLN (older description).
- PROPERTY-CLASS is 3 characters (positions 627 to 629).
- There is **no CONDO flag** in our layout (positions 650 to 652 are filler). Condos are marked by a QUALIFICATION-CODE starting with "C" (positions 620 to 624).
- The description says DEED-DATE and DATE-RECORDED are MMDDYY. In our files they read as **YYMMDD** (for example, Sales2026 recording dates run 250701 to 260630). The pipeline must parse YYMMDD and have a test that fails if a date is impossible.
- In Sales2024 the ETC (extra lots) flag is "X" on every Bergen row because that file does not follow the layout. In Sales2025 and Sales2026 it is blank on every Bergen row, so it cannot find multi-lot sales. Rule C6 uses TOTAL ASSESSMENT instead.
- Positions 5 to 16 (TOTAL ASSESSMENT) equal the main-lot assessment plus every extra lot's assessment, on every Bergen row in Sales2025 and Sales2026.
- Sales2025 fills empty ADDL-BLOCK fields with "00000" on many rows. These are placeholders, not extra lots.
- LAST-UPDATE-DATE reads as **MMDDYY**, unlike the deed and recording dates. We do not use it in any rule.
- Each sale is identified by **record_id** = district code + SERIAL-NUMBER (the description calls the serial number unique). No record_id repeats within a file.
- VERIFIED-SALES-PRICE equals REPORTED-SALES-PRICE on every usable class-2 Bergen sale in Sales2026. **We use VERIFIED-SALES-PRICE.** If it is ever zero or blank, we use REPORTED-SALES-PRICE and log it.
- The 2011 description says non-usable codes run 01 to 33. The current rule (May 2025) has 36 categories (Section 4, C3).

### 3.2 Town statistics period

**Rule T0: town statistics use only `Sales2026.zip`**, which holds deeds recorded July 1, 2025 to June 30, 2026.

**This is the state's own sampling period.** The Division of Taxation's *Guidelines for use of 36 Nonusable Categories* (May 2025; `data/raw/notes/NJ_Guidelines_Nonusable_Categories_36.pdf`, https://www.nj.gov/treasury/taxation/pdf/lpt/guidelines36.pdf) says: "Sampling period is defined as the period from July 1 to June 30, inclusive, preceding the date of promulgation of the Director's Table of Equalized Valuation ... The recording date of the deed within this period is the determining date." The 2026 Table was promulgated October 1, 2026, so its sampling period is July 1, 2025 to June 30, 2026.

**The data agrees.** Usable, class-2, Bergen sales in Sales2026.zip give the same count as the state's 2026 class-2 count in `CoefficientDeviations.pdf` and the "# of Sales" in `2026AvgResStat.pdf` for **all 70 Bergen towns (4,917 sales)**. The pipeline repeats this as test V1.

*Our choice (one year, not two):* *Reason:* using the exact sales behind the state's 2027 ratios lets us check our work against the state (Section 8), which is the strongest proof the numbers are right. Pooling two years would show more small towns, but it would mix two assessment years and break that check.

### 3.3 Checker valuation date

**October 1, 2026.** Confirmed by two documents:
- Form A-1, instruction 10: market value "as of October 1 of the preceding (pretax) year." For tax year 2027 appeals, that is October 1, 2026.
- 2027CH123.pdf: the ratios used for tax year 2027 appeals were "promulgated by me as of October 1, 2026."

### 3.4 What the data does not cover

Our newest sales were recorded by June 30, 2026. There are **no sales from July 1 to October 1, 2026** in our files. Rule K5 explains how the checker handles this gap.

---

## 4. Cleaning rules

Rules run in this order: C1, C2, C10, C3, C7, C4, C5, C6, C9, then C8 last (outlier trimming always runs on otherwise clean data).

**Logging.** For every rule, the pipeline writes rows in, rows removed, and rows out, for each town and for the whole county, to `data/processed/filter_log.csv`. A test checks that rows out of one rule equal rows in of the next.

| ID | Rule | Type |
|---|---|---|
| C1 | **Bergen County only.** COUNTY-CODE = "02". | Fixed |
| C2 | **Residential only.** PROPERTY-CLASS = "2" (the file description lists 2 = Residential). | Fixed |
| C10 | **No condominiums.** Drop rows whose QUALIFICATION-CODE starts with "C" or "c" ("C = Condominium unit"). | Our choice |
| C3 | **Usable sales only.** U-N-TYPE = "U". | Fixed |
| C7 | **No exact duplicates.** Drop a row if its full 663-character line exactly matches an earlier row. | Fixed |
| C4 | **Sale price at least $50,000.** | Our choice |
| C5 | **Valid assessment on the right basis.** ASSESSED-VALUE-TOTAL above 0, and use the assessment stored on the sale record. | Fixed |
| C6 | **Single lot only.** Drop sales that include extra lots. | Our choice |
| C9 | **Revaluation towns use only new-basis assessments.** | Our choice (backs up a state rule) |
| C8 | **Outlier trimming per town, 3.0 x IQR.** | Our choice (IAAO method) |

**C2 note.** The SR1A file does not say how many families live in a class-2 home. Class 2 is all residential property, so 2- to 4-family homes cannot be removed with this file. This is a limitation (Section 7).

**C10.** *Our choice. Reason:* v1 is about single-family homes, and condos are valued and assessed differently. In Sales2026, condos are 1,075 of the 4,917 usable class-2 Bergen sales, and more than 25% of the usable class-2 sales in 15 towns. A lowercase "c" counts too: one usable class-2 sale in Sales2025 (Wyckoff) has the code "c4293", which is a condo code typed in lowercase. Dropping one likely condo is safer than letting it act as a single-family comp.

**C3 note.** The state sets U or N. We do not second-guess it. For non-usable sales, the pipeline reports counts by SR-NU-CODE (the state's code; ASSESSOR-NU-CODE is logged too). The code meanings come from N.J.A.C. 18:12-1.1 as listed in the state's May 2025 guidelines (36 categories). Short labels for the site are in `data/raw/notes/ratio-study-standards.md`. Two state categories matter for us:
- **Category 27** removes sales recorded July 1 to December 31 before a revaluation or reassessment takes effect (see C9).
- **Category 36** removes sales whose ratio is "so disproportionate to the ratios of other usable sales that its inclusion ... would distort the overall municipal ratio." So the state already removes the most extreme ratios before marking sales usable (see C8).

**C4.** *Our choice. Reason:* a sale under $50,000 for a Bergen home is almost always a family transfer or a data error, not a market sale. In Sales2026 this rule removes 0 usable class-2 Bergen sales, so it is a safety net only.

**C5.** "In effect for the sale" means the assessment the state paired with the sale. Each record has ASSESS-YEAR. In Sales2026, sales recorded July to December 2025 carry 2025 assessments, and most sales recorded in 2026 carry 2026 assessments. We keep the state's pairing. We never swap in a different year's assessment.

**C6.** A sale counts as multi-lot if TOTAL ASSESSMENT (positions 5 to 16) is greater than MAIN LOT ASSESSED-VALUE-TOTAL, which means extra lots were sold with it. (Version 1.0 said "any ADDL-BLOCK is not blank"; that would wrongly drop 881 usable class-2 sales in Sales2025, whose empty ADDL-BLOCK fields hold "00000". With "00000" treated as blank, the ADDL-BLOCK test, the ADDL-VALUE-TOTAL test, and this test agree on all 10,212 usable class-2 sales in Sales2025 and Sales2026.) We still drop these sales instead of keeping them with TOTAL ASSESSMENT: they are few, and a homeowner using the checker is asking about one lot, so single-lot sales are the closest match. *Our choice. Reason:* the price covers more than one lot, but the assessed value field covers only the main lot, so the ratio would be too low. (State category 30 already removes multi-parcel sales that are not one economic unit; this catches the rest.) In Sales2026 this affects 21 usable class-2 Bergen sales.

**C9.** For towns on the county's **2026** revaluation/reassessment list, keep only sales with ASSESS-YEAR 26 or later (the new basis). If fewer than 20 sales remain, label the town "Recent revaluation" and hide its statistics. For towns on the **2027** list, the study data is all on the current basis, so their statistics stand; the town page notes that new assessments arrive for 2027. *Our choice. Reason:* mixing old and new assessments would make a town look uneven when it is really just two different bases. State category 27 already does most of this (in Allendale, a 2026 town, all usable sales carry 2026 assessments), so in Sales2026 C9 removes no sales and stays as a safety check. In Sales2025 it removes every sale in these towns, because all of them carry 2024 or 2025 assessments (1,093 sales in 34 towns; `docs/filter-log.md`). So in 2026 revaluation towns, the checker uses Sales2026 sales only.

**C8.** For each town separately, and for each SR1A file separately (Sales2025 and Sales2026 are different sampling years with different assessment years, so each has its own town median):
1. Compute each sale's relative ratio: *R_i / town median ratio*.
2. Find Q1 and Q3 (25th and 75th percentiles) of the relative ratios. IQR = Q3 - Q1.
3. Remove sales below Q1 - 3.0 x IQR or above Q3 + 3.0 x IQR.
4. Do this once (no repeat passes).

*Our choice. Reason:* this is IAAO's interquartile-range method (Appendix B, page 53: "A factor of 3.0 X IQR often is chosen to identify extreme outliers"). We use 3.0, not 1.5, because the state already removed the most extreme ratios (category 36), so a gentle trim avoids cutting real unfairness out of the data. Doing it per town respects each town's own level.

*Why not a fixed range like 0.25 to 2.0:* IAAO itself warns that "trimming of outliers using arbitrary limits, for example, eliminating all ratios less than 50 percent or greater than 150 percent, tends to distort results and should not be employed." Bergen towns are assessed at very different levels. For tax year 2027, Bergenfield's average ratio is 50.26% and Rockleigh's is 119.50%. In a town near 50%, many honest sales have ratios near 0.35 to 0.40, and a fixed floor would chip away at exactly the low-ratio sales that matter. Outside Bergen it is even more extreme: Union Township (Union County) has a 2027 average ratio of 8.03%, so a 0.25 floor would delete nearly every one of its sales.

*Note:* dividing by the median does not change which sales are removed (it scales everything by the same amount). We do it so the log can show fences on one common scale across towns.

*Sensitivity check:* the pipeline also runs every town statistic with a 1.5 x IQR fence and with no trimming, and writes both to `data/processed/sensitivity.csv`. The cleaning step also writes `data/processed/c8_sensitivity.csv`, which shows each town's fences and how many sales each fence removes. If a town's label (T5) changes between 3.0 and 1.5, the town page says the result is sensitive to outliers.

---

## 5. Town statistics and labels

### 5.1 What we compute (each town, after cleaning)

- **T1** Number of sales.
- **T2** Median ratio, mean ratio, weighted mean ratio, COD, PRD, PRB (Section 2.2 formulas).
- **T3** Median ratio by value quarter. Sort the town's sales by the PRB value proxy *V_i* (Section 2.2, using the town's own median ratio) and split them into 4 equal-count groups: Q1 (lowest-value 25%) to Q4 (highest-value 25%). If the count does not divide by 4, the extra sales go to the lower quarters. Ties are broken by the order in the file so the result repeats exactly. Only towns with 20 or more sales get quarters (T6).
  - *Our choice (adopted in 1.3; earlier versions sorted by sale price). Reason:* a sale price includes random luck (a quick sale, a bidding war). Homes that happened to sell low land in the cheapest quarter *and* get a high ratio for that same reason, so sorting by sale price makes towns look more regressive than they are. IAAO builds the value proxy for exactly this reason: it averages the sale price with the assessment, so neither one decides the order alone. In our Sales2026 data, sorting by sale price puts a higher median ratio in Q1 than in Q4 in 36 of 48 ranked towns (median gap 5.7 points). Sorting by the value proxy does so in 22 of 48 (median gap 0.5 points the other way), which agrees with PRB. `town_tiers.csv` keeps the sale-price version as a comparison (`tier_basis` = `sale_price`); results and the site use `value_proxy`.
- **T7** For each value quarter (T3): the share of sales with a ratio above the town's Chapter 123 upper trigger *U\** and below the lower trigger *L\** (rule K10 defines both, using 2027CH123.pdf). Not shown for towns on the 2027 revaluation list (Chapter 123 does not apply there in 2027; see K14). "Above" means the ratio x 100 is strictly greater than *U\**; "below" means strictly less than *L\**, matching K11. The county row adds up the counts of every town that shows T7.
- **T8** Countywide measures (home page). *Our choice.* The headline version is **within-town**: divide each sale's assessed value by its own town's median ratio, then pool all clean Sales2026 sales (every town, including towns with under 20 sales) and compute the Section 2.2 measures and T4 ranges. *Reason:* Bergen towns assess at very different levels (2027 average ratios from 47.06% in Garfield to 119.50% in Rockleigh), so pooling raw ratios would mostly measure differences between towns, not unevenness inside them. Each town sets its own assessments, so inside-town evenness is the fair test. A **pooled** version on raw ratios is also saved, as a reference only.

### 5.2 Confidence intervals

**T4.**
- Median ratio, COD, and PRD: percentile bootstrap. Draw 2,000 resamples of the town's sales (same size, with replacement), compute the measure each time, and take the 2.5th and 97.5th percentiles.
- PRB: slope +/- 1.96 x the slope's standard error from the regression. (This is how IAAO describes the PRB range in section 9.2.7.)
- Fixed random seed: **20261025**, so every run gives the same numbers.

*Our choice. Reason:* small towns have few sales, so one number alone can mislead; a range shows how sure we are. 2,000 resamples is enough for stable 95% ranges and still runs in seconds.

### 5.3 Minimum sales

**T6.** Under 20 sales: hide the statistics and show "Not enough sales." 20 to 39: show them with a "Limited data" tag. 40 or more: show normally.

*Our choice. Reason:* with fewer than 20 sales, one or two odd sales can flip PRD or PRB, and IAAO notes PRD "may be less meaningful when samples are small." In a scratch check (Sales2026, with C10 and C6 applied), **22 towns have under 20 sales, 18 have 20 to 39, and 30 have 40 or more.** Towns with too few sales still get a page with their sale count, the state's ratio, and the checker.

### 5.4 Labels

**T5.** Checked in this order:

| Label | Rule |
|---|---|
| Not enough sales | Under 20 sales (T6), or "Recent revaluation" (C9) |
| Regressive pattern | PRD > 1.03 **and** PRB < -0.05 |
| Progressive pattern | PRD < 0.98 **and** PRB > 0.05 |
| Within standards | PRD from 0.98 to 1.03 **and** PRB from -0.05 to +0.05 |
| Mixed signals | Anything else |

Labels use the point estimates. The town page also shows the confidence ranges.

**Rankings.** Sort by PRB, most negative first, with PRD shown beside it. Towns labeled "Not enough sales" are listed after the ranked towns.

*Our choice. Reason:* requiring both measures to agree avoids calling a town regressive because of one noisy number. PRB is the sort key because IAAO calls it "more meaningful and less sensitive to extreme prices or ratios" than PRD.

---

## 6. Appeal checker method

All checker math runs in the browser. Nothing the homeowner types is sent, saved, or logged (CLAUDE.md rule 3).

### 6.1 Inputs

- **K1** Town (required). Assessed value (required, whole dollars). The homeowner's own market value estimate (optional).

### 6.2 Comparable sales ("comps")

**K2.** A comp is a cleaned sale (rules C1 to C10, C8 included) that is:
- in the same town;
- dated (DEED-DATE) from **October 1, 2024** to the latest deed date in the data (from Sales2025 and Sales2026);
- assessed on the same basis as the homeowner's current assessment (in 2026 revaluation towns, ASSESS-YEAR 26 or later; see C9);
- assessed within **+/- 15%** of the homeowner's assessed value. If that finds fewer than 8 comps, widen to **+/- 25%**.

*Our choice. Reason:* without home features (Section 7), the assessed value is our best sign of a similar home, and 15% keeps homes close in size and quality. Widening to 25% helps smaller towns without reaching much less similar homes.

**K3.** If fewer than **5** comps remain after widening, the result is "Not enough data."

*Our choice. Reason:* the state's appeal guide asks for "3 to 5" comparable sales (`appeal-deadlines-and-fees.md`, Source 2), so 5 is the least we need to form a range, not just a guess.

### 6.3 Time adjustment

**K4. Bergen County monthly price index.**
1. Use all sales that pass C1 to C10 and C8, from Sales2025 and Sales2026, grouped by deed month.
2. Drop the newest deed months that look incomplete: any month at the end of the series with fewer than half the average monthly count. (Deeds are recorded after the sale date, so the last month in the file is always short.)
3. Raw value for month *m*: the median sale price of all sales dated in months *m-1*, *m*, and *m+1* together (3-month smoothing). At the ends of the series, use the 2 months available.
4. Index: *I(m) = raw(m) / raw(last kept month)*.

**K5.** We do not forecast. The index stays flat from the last kept month to October 1, 2026.

*Our choice. Reason:* sale prices change over time, so a 2024 sale needs updating to 2026 terms; a countywide index has enough sales each month to be steady. We have no sales after June 2026, and guessing a trend would add a number we cannot check.

**Time-adjusted price** of a comp sold in month *m*: *S_adj = S x I(last kept month) / I(m)*.
**Time-adjusted ratio**: *R_adj = A / S_adj*.

The pipeline writes the index to `data/processed/price_index.csv` and the site shows it as a chart with a table.

### 6.4 Weights

**K6.** Each comp gets a weight *w = w_size x w_time*:
- *d* = |comp assessed value - homeowner assessed value| / homeowner assessed value
- *band* = 0.15, or 0.25 if the search was widened
- **w_size = 1 - 0.5 x (d / band)**. So it is 1.0 for an exact match and 0.5 at the edge of the band.
- *t* = months from the comp's deed date to October 1, 2026 (days / 30.4375)
- **w_time = 0.5 ^ (t / 12)**. A 12-month half-life: a sale 12 months before the valuation date counts half as much as one on the date.

*Our choice. Reason:* closer and more recent sales tell us more about value on October 1, 2026. The 0.5 floor on w_size keeps edge comps in play, so a few near-matches cannot swamp the result.

### 6.5 Market value estimate

**K7. Weighted percentile.** Sort the comps by *R_adj*. Add up their weights in that order. The weighted *p*th percentile is the first *R_adj* where the running total reaches *p*% of the total weight.

**K8. Estimated market value.**
- Middle: *MV_mid = homeowner assessed value / weighted 50th percentile of R_adj*
- Range: *MV_low = assessed value / weighted 75th percentile*, and *MV_high = assessed value / weighted 25th percentile*.

(A higher ratio means a lower value, so the 75th percentile gives the low end.)

### 6.6 Homeowner's own estimate

**K9.** If the homeowner gives their own market value, the checker runs the K10 test on both values and shows both results side by side. If the two differ by more than 20% (|own - MV_mid| / MV_mid > 0.20), it shows a warning. The warning explains why they might differ: the homeowner knows the home's size, condition, and updates, and our estimate does not; recent sales may not match their home; online estimates can also be off.

### 6.7 Chapter 123 test

**K10.** Homeowner ratio *h = assessed value / market value x 100* (a percent). Using the town's row in 2027CH123.pdf (average ratio *AR*, lower limit *L*, upper limit *U*):
- *AR\* = min(AR, 100)* (the 100% rule)
- Upper trigger *U\* = min(U, 100)* (Examples II and III: a ratio above 100% gets relief even inside the range)
- Lower trigger *L\* = min(L, 100)* (only changes Rockleigh, whose printed lower limit is 101.58)

**K11. Results.**

| Result | When | What we say |
|---|---|---|
| **You may have grounds to appeal.** | *h > U\** | Strength **Strong** if *h* is above *U\** even at *MV_high* (the most generous value). **Borderline** if *h* is above *U\** at *MV_mid* but not at *MV_high*. |
| **Your assessment is within the normal range.** | *L\* <= h <= U\** | Chapter 123 does not lower an assessment that is inside the common level range. |
| **Your assessment may be lower than typical.** | *h < L\** | An appeal could lead the Board to *raise* the assessment, since the Board applies the average ratio in both directions (ch123definitions.pdf, Example I). |
| **Not enough data.** | K3 | Explain why and how to look up sales yourself. |

**K12. If the result is "may have grounds":**
- Estimated corrected assessment = *MV_mid x AR\* / 100*.
- Estimated yearly savings = *(current assessed value - corrected assessment) x general tax rate / 100*. The general tax rate is dollars per $100 of assessed value. We use the most recent year we have (**2025**, from `GTRhistory.xlsx`) and label it "2025 tax rate." The 2027 rate will be different.
- Both numbers are labeled as estimates. We never say "you will win."

**K13. Every checker result shows** the appeal deadline (April 1, or May 1 in a town with a town-wide revaluation or reassessment; the appeal must be received, not postmarked; a weekend or holiday deadline moves to the next business day) and the filing fee for the entered assessed value ($5 under $150,000; $25 from $150,000 to under $500,000; $100 from $500,000 to under $1,000,000; $150 at $1,000,000 or more). Source: `data/raw/notes/appeal-deadlines-and-fees.md` (Form A-1). It also shows the disclaimer.

**K14. Towns on the 2027 revaluation/reassessment list.** This replaces the earlier rule (2026-10-14) that ran the full test with a warning.
- ch123definitions.pdf says Chapter 123 does not apply in the tax year a town puts a district-wide revaluation into operation. For these 24 towns that year is 2027. For reassessments the document defers to County Board rules, which we do not have, and the county list does not say which towns are which.
- So for these towns the checker **does not give a Chapter 123 result**. It still shows the market value estimate (K8), clearly labeled, plus a warning: the town is getting new assessments for 2027; our numbers use the assessments from before that change; wait for the 2027 assessment notice and compare it to the estimate; the appeal deadline for these towns is May 1.
- The exact wording is written in a later site prompt and checked by Zaden.

---

## 7. Limitations

- **No home features in the checker.** The homeowner gives only a town and an assessed value, so comps are matched by assessed value. Size, age, lot, condition, and updates are not used. (Sold homes in the SR1A file do have YEAR-BUILT and LIVING-SPACE filled for most Bergen rows. Using them needs the same facts about the homeowner's own home, which is the 2.0 MOD-IV address lookup.)
- **Matching by assessed value is circular.** If the homeowner's assessment is wrong, the comps we pick are tied to that wrong number. This is the main reason the checker says "may" and shows a range.
- **Class 2 includes 2- to 4-family homes.** SR1A cannot separate them from single-family homes.
- **SR1A coding errors.** Usable/non-usable codes, property class, and prices are entered by people. A few errors will remain after cleaning.
- **The state already removes extreme ratios** (category 36). That means our COD and PRB describe the sales the state kept, which may slightly understate how uneven assessments really are.
- **Small towns.** 22 Bergen towns have under 20 cleaned sales in one year, so they get no statistics in v1.
- **The time adjustment is countywide.** One index for all of Bergen. A town whose prices moved faster or slower than the county will be a little off. Median prices also shift when a different mix of homes sells (for example, more large homes in summer).
- **No sales after June 30, 2026.** Values are held flat from the last full month to October 1, 2026.
- **The state's average ratio is not a single-family median.** It covers vacant land, homes, and commercial property, weights by price and by class, and averages in the prior year (Section 2.4). Our single-family median will not equal it (V3). We reproduce the state's method in V4, except that we use 2 classes (homes and everything else) where the state uses 4, because classes 1 and 4 have very few sales per town.
- **This is not an appraisal.** It is a screening tool. A homeowner who appeals must bring their own comparable sales, and assessments of other homes are not accepted as evidence (Form A-1, instruction 10).

---

## 8. Validation plan

Results go in `docs/validation.md`. The pipeline runs these as tests and checks.

**V1. Same sales as the state (pass = exact).** Before our extra filters (C1, C2, C3 only), the usable class-2 count per town in Sales2026 must equal the class-2 count for 2026 in CoefficientDeviations.pdf and the "# of Sales" in 2026AvgResStat.pdf. Pipeline: 70 of 70 towns match (4,917 sales; test `test_v1_sales2026_counts_match_state_counts`). Adding classes 1 and 4, our count also equals the state's TOTAL count in 70 of 70 towns (5,141 sales).

**V2. Coefficient of deviation.** The state's "coefficient of deviation" is not the same measure as the IAAO COD. In a scratch check, the state's class-2 numbers match the average distance from the **mean** ratio (100 x average of |R_i - mean ratio| / mean ratio), computed on the V1 sales with no trimming, within 0.02 in 56 of 66 towns. The IAAO COD (distance from the median) matched in only 7. No document on file explains the state's formula, so this match is our evidence.
- Test: compute the mean-based version on the V1 sales and compare to the state's class-2 "stratified" column for 2026. For a sale that includes extra lots, use TOTAL ASSESSMENT (all lots), not the main lot. *Reason:* that is how the state pairs them: the SR1A file's own SALES-RATIO field equals TOTAL ASSESSMENT / price on every usable multi-lot sale (34 of 34 in classes 1, 2, and 4 in Sales2026).
- Pass: within **0.25** points. (Pipeline, 2026-10-15: **69 of 69** towns with a state value. With main-lot assessments only, 65.) *Our choice. Reason:* that is close enough to show we read the same sales the same way, while allowing small state-side edits we cannot see.
- The site still publishes the IAAO COD. The validation page explains the difference.

**V3. Median ratio vs the state's average ratio (reported, not pass/fail).** Our class-2 median ratio will usually be **below** the state's average ratio. In the pipeline (2026-10-15) the median gap is -6.8 points and 13 towns are more than 10 points apart (largest: Rockleigh and Carlstadt). That is expected: the state's ratio covers more than single-family homes, weights by price and class, and averages in the prior year (Section 2.4; V4 shows this explains the gap).
- Flag for review any town where the gap is more than **10** percentage points. *Our choice. Reason:* a gap that large is worth a second look, but it is not proof of an error. A 5-point flag would mark most towns and hide the ones that matter.

**V4. The state's method, rebuilt (pass/fail by town).** This checks that our sales data reproduces the state's average ratio when we follow the state's method (Section 2.4).
1. *State's one-year ratio.* The state publishes only the averaged value. Since 2026 aggregate true value = (one-year true value + 2025 aggregate true value) / 2, the one-year true value = 2 x (2026 aggregate true value) - (2025 aggregate true value), using `2026TEV.pdf` and `2025TEV.pdf`. One-year ratio = 2026 aggregate assessed / one-year true value.
2. *Our one-year ratio.* From the V1 sales plus classes 1 and 4 (every usable Sales2026 sale in classes 1, 2, and 4; no other cleaning; TOTAL ASSESSMENT as in V2): the weighted ratio (total assessed / total price) for homes (class 2) and for everything else. Home assessed total = "# of Line Items" x "Avg Assessment" in `2026AvgResStat.pdf`; everything else = the town's 2026 aggregate assessed minus that. Our one-year true value = home total / home ratio + other total / other ratio. *Our choice:* 2 groups, not the state's 4, because most towns have only a handful of class 1 and class 4 sales; if a town has no sales in one group, that group is valued at the other group's ratio.
3. Compare the two. **Flag a town if they differ by more than 5 percentage points** (`VALIDATION_FLAG_PP` in `pipeline/config.py`). *Our choice. Reason:* this is a like-for-like comparison, so a 5-point miss would mean a real problem in our data or our reading of the method. (V3 keeps 10 points because it compares two different measures on purpose.) We also report how many towns are within 1 and 2 points.
- Pipeline result (2026-10-15): **70 of 70 towns within 5 points, 66 within 1 point**; none flagged. The same sales' plain average was within 5 points of the published ratio in only 44 towns, because averaging with the prior year raises the published ratio in 69 of 70 towns (median +4.6 points). Details in `docs/validation.md`.

**If a town is off** (fails V1, V2, or V4, or is flagged in V3):
1. Re-check the parsing (field positions, YYMMDD dates), the usable flag, the class, and the assessment year.
2. Look at the town's individual sales for multi-lot or odd records.
3. Write what we found in `docs/validation.md`.
4. **Never** adjust our numbers to match the state. If we cannot explain the gap, the town page says so.

---

## 9. Changelog

| Version | Date | What changed |
|---|---|---|
| 1.4 | 2026-10-15 | Prompt 7 validation. Zaden asked Claude to decide ("best interests of winning ..., the usefulness of the website, ... the goal of the project, and the instructions of the prompt"). Section 2.4 now says how the Director computes the average ratio (weighted, by class, averaged with the prior year), from a 2026 Tax Court opinion saved in `data/raw/notes/`. Added `2025TEV.pdf`. V2 uses TOTAL ASSESSMENT for multi-lot sales (the state's own pairing) and gives pipeline numbers. V3 gives pipeline numbers. New V4: rebuild the state's one-year ratio and flag towns more than 5 points apart. Section 7 limitation updated. No cleaning or town statistics rule changed. |
| 1.3 | 2026-10-15 | Prompt 6 town statistics. Zaden asked Claude to decide ("best interests of winning ..., the usefulness of the website, ... the goal of the project, and the instructions of the prompt"). T3 quarters now sort by the PRB value proxy, not sale price (sale-price version kept as a comparison). New T8: countywide headline is within-town (each sale divided by its town's median ratio). Section 2.3: PRB "unacceptable" means the whole 95% range is outside -0.10 to +0.10; no pass/fail for the median ratio. T7 now says "value quarter", strict above/below, and how the county row adds up. PRB keeps ln(V)/0.693 (the prompt said log2; IAAO's form wins). |
| 1.2 | 2026-10-15 | Prompt 5 cleaning findings. Zaden asked Claude to decide ("best interests of winning, usefulness, the goal, and the prompt"). C8 now says it runs per town *and* per SR1A file. C10 also drops codes starting with lowercase "c" (1 sale). C9 note now gives the real counts: 0 removed in Sales2026, 1,093 in Sales2025. Named `c8_sensitivity.csv`. |
| 1.1 | 2026-10-15 | Prompt 4 data findings. Zaden asked Claude to decide ("whatever most aligns with the prompts, the goal, usefulness, and winning"). C6 now tests TOTAL ASSESSMENT > main-lot total (the old ADDL-BLOCK test would have dropped 881 Sales2025 sales because of "00000" placeholders); multi-lot sales are still dropped, not kept. Section 3.1 updated: YTDSR1A2026 is an older copy of Sales2026; Sales2024 does not follow the layout; LAST-UPDATE-DATE is MMDDYY; record_id defined. |
| 1.0 | 2026-10-14 | Zaden asked Claude to choose all 19 decision-list items "to best align with the goal, prompt, winning the competition, and being a useful tool." Claude kept every draft default (T0, C4, C6, C8, C9, C10, T4, T5, T6, K2 to K6, V2 0.25, V3 10 points), kept the two document-driven rules (K10 100% trigger; K14 no Chapter 123 result in 2027 revaluation towns), and brought old H3 back as descriptive table T7. Added sources: IAAO Standard on Ratio Studies (2013) and NJ *Guidelines for use of 36 Nonusable Categories* (May 2025), quoted in `data/raw/notes/ratio-study-standards.md`. These confirmed the July 1 to June 30 sampling period, the full non-usable code list, IAAO ranges, and the PRB formula (now ln(V)/0.693 exactly as IAAO writes it). Added notes on state categories 27, 30, and 36; COD judged against 15.0. YTDSR1A2026.zip kept but unused. |
| 1.0-draft | 2026-10-14 | Full rewrite for Prompt 3: research question and H1; IAAO measures with formulas; Chapter 123 rules from ch123definitions.pdf and 2027CH123.pdf; data sources and periods; cleaning rules C1 to C10; town statistics T0 to T6; checker K1 to K14; limitations; validation V1 to V3. |
| (pre-draft) | 2026-10-14 | Added the rule for towns with a 2027 revaluation or reassessment. Zaden chose to run the checker with a warning instead of hiding results. (Replaced by K14 in 1.0.) |
