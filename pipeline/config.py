"""All paths and constants for the FairAssess NJ pipeline.

Every other pipeline file imports from here. No other file may hard-code
these values (county code, file names, dates, seed, folders).
"""

from datetime import date
from pathlib import Path

# ---------------------------------------------------------------- folders
ROOT = Path(__file__).resolve().parent.parent
PIPELINE_DIR = ROOT / "pipeline"
RAW_DIR = ROOT / "data" / "raw"
RAW_SR1A_DIR = RAW_DIR / "sr1a"
RAW_STATE_DIR = RAW_DIR / "state"
RAW_NOTES_DIR = RAW_DIR / "notes"
INTERIM_DIR = ROOT / "data" / "interim"
INTERIM_SR1A_DIR = INTERIM_DIR / "sr1a"
PROCESSED_DIR = ROOT / "data" / "processed"
REFERENCE_DIR = ROOT / "data" / "reference"
SITE_DATA_DIR = ROOT / "site" / "public" / "data"
DOCS_DIR = ROOT / "docs"

# ---------------------------------------------------------------- scope
COUNTY_CODE = "02"  # Bergen County (methodology rule C1)
COUNTY_NAME = "Bergen"
N_TOWNS = 70  # Bergen has 70 taxing districts (codes 0201 to 0270)
RESIDENTIAL_CLASS = "2"  # property class 2 = Residential (rule C2)

# Checker valuation date (methodology Section 3.3) and bootstrap seed (T4).
VALUATION_DATE = date(2026, 10, 1)
RANDOM_SEED = 20261025

# ---------------------------------------------------------------- SR1A sales files
# Listed oldest extract first. When the same sale (record_id) is in two
# files, the row from the file listed LATER wins (it is the newer extract).
# "extracted" is the date stamped on the .txt file inside each zip.
# "layout_ok" is False when the file does not follow SR1Afilelayout.pdf
# (checked in Prompt 4; see docs/data-profile.md). Those files are counted
# but not decoded.
SR1A_FILES = [
    {"name": "Sales2024", "zip": "Sales2024.zip", "txt": "Sales2024.txt",
     "extracted": date(2024, 9, 24), "layout_ok": False},
    {"name": "Sales2025", "zip": "Sales2025.zip", "txt": "Sales2025.txt",
     "extracted": date(2025, 9, 22), "layout_ok": True},
    {"name": "YTDSR1A2026", "zip": "YTDSR1A2026.zip", "txt": "YTDSR1A2026.txt",
     "extracted": date(2026, 8, 12), "layout_ok": True},
    {"name": "Sales2026", "zip": "Sales2026.zip", "txt": "Sales2026.txt",
     "extracted": date(2026, 9, 24), "layout_ok": True},
]
SR1A_LAYOUT_PDF = RAW_SR1A_DIR / "SR1Afilelayout.pdf"
SR1A_DESCRIPTION_PDF = RAW_SR1A_DIR / "SR1A_FileLayout_Description.pdf"
SR1A_LAYOUT_CSV = PIPELINE_DIR / "sr1a_layout.csv"
SR1A_LINE_LENGTH = 663
SR1A_ENCODING = "latin-1"

# Two-digit years: 00-49 -> 2000s, 50-99 -> 1900s. SR1A deed dates are
# never after 2049, and a few old deeds (1990s) do appear.
CENTURY_PIVOT = 50

# ---------------------------------------------------------------- state files
CH123_PDFS = {
    2027: RAW_STATE_DIR / "2027CH123.pdf",
    2026: RAW_STATE_DIR / "2026CH123.pdf",
}
DIR_RATIOS_XLSX = RAW_STATE_DIR / "DirRatios.xlsx"
COD_PDF = RAW_STATE_DIR / "CoefficientDeviations.pdf"
GTR_XLSX = RAW_STATE_DIR / "GTRhistory.xlsx"
AVG_RES_PDF = RAW_STATE_DIR / "2026AvgResStat.pdf"
# Tables of Equalized Valuations. 2026 = the year behind the 2027 Chapter 123
# ratios; 2025 (amended) gives the prior-year aggregate true value (rule V4).
TEV_PDFS = {
    2025: RAW_STATE_DIR / "2025TEV.pdf",
    2026: RAW_STATE_DIR / "2026TEV.pdf",
}
NONUSABLE_CODES_CSV = REFERENCE_DIR / "nonusable_codes.csv"
REVALUATION_TOWNS_CSV = REFERENCE_DIR / "bergen_revaluation_towns.csv"

# ---------------------------------------------------------------- outputs
SR1A_PARQUET = INTERIM_DIR / "sr1a_bergen.parquet"
CH123_CSV = {year: PROCESSED_DIR / f"ch123_{year}.csv" for year in CH123_PDFS}
DIR_RATIOS_CSV = PROCESSED_DIR / "director_ratios_bergen.csv"
STATE_COD_CSV = PROCESSED_DIR / "state_cod_bergen.csv"
TAX_RATES_CSV = PROCESSED_DIR / "tax_rates_bergen.csv"
AVG_RES_CSV = PROCESSED_DIR / "avg_residential_bergen.csv"
TEV_CSV = PROCESSED_DIR / "tev_bergen.csv"
TOWNS_CSV = PROCESSED_DIR / "towns.csv"
DATA_PROFILE_MD = DOCS_DIR / "data-profile.md"

# ---------------------------------------------------------------- cleaning (methodology Section 4)
# Rule order is fixed by methodology Section 4: C8 always runs last.
CLEAN_RULE_ORDER = ["C1", "C2", "C10", "C3", "C7", "C4", "C5", "C6", "C9", "C8"]

# Files that go into cleaning. YTDSR1A2026 is an older copy of Sales2026 and is
# not used (Section 3.1); rows marked superseded_by_newer_file are dropped
# before C1, so the waterfall starts from one row per sale.
CLEAN_SOURCE_FILES = ["Sales2025", "Sales2026"]
# Town statistics use only this file (rule T0, Section 3.2).
TOWN_STATS_SOURCE_FILE = "Sales2026"

CONDO_QUAL_PREFIX = "C"  # C10, Section 4: QUALIFICATION-CODE starting "C" or "c" = condominium unit
USABLE_CODE = "U"  # C3, Section 4: U-N-TYPE "U" = usable
MIN_SALE_PRICE = 50_000  # C4, Section 4: sale price at least $50,000
MIN_ASSESSED_VALUE = 0  # C5, Section 4: assessed value must be ABOVE this
REVAL_NEW_BASIS_TAX_YEAR = 2026  # C9, Section 4: towns on the county's 2026 list
REVAL_MIN_ASSESS_YEAR = 26  # C9, Section 4: keep ASSESS-YEAR 26 or later in those towns
C8_IQR_FENCE = 3.0  # C8, Section 4: remove relative ratios beyond Q1/Q3 -/+ 3.0 x IQR
C8_SENSITIVITY_FENCE = 1.5  # C8 sensitivity check, Section 4 (never used in main results)
# C8, Section 4: how Q1 and Q3 are computed (numpy "linear" = standard
# interpolation between the two nearest sales).
C8_QUANTILE_METHOD = "linear"

# Minimum sales (rule T6, Section 5.3), used here only to report thin towns.
MIN_SALES_SHOW = 20  # under 20: "Not enough sales" (also the C9 "Recent revaluation" cutoff)
MIN_SALES_FULL = 40  # 20 to 39: "Limited data"

SALES_CLEAN_CSV = PROCESSED_DIR / "sales_clean.csv"
REMOVED_ROWS_PARQUET = INTERIM_DIR / "removed_rows.parquet"
FILTER_LOG_CSV = PROCESSED_DIR / "filter_log.csv"
C8_SENSITIVITY_CSV = PROCESSED_DIR / "c8_sensitivity.csv"
FILTER_LOG_MD = DOCS_DIR / "filter-log.md"

# ---------------------------------------------------------------- town statistics (methodology Sections 2 and 5)
# PRB (Section 2.2, IAAO Appendix D): x = ln(value proxy) / 0.693, exactly as IAAO writes it.
PRB_LOG_DIVISOR = 0.693
PRB_VALUE_WEIGHT = 0.5  # value proxy = 0.5 x sale price + 0.5 x (assessed / median ratio)
PRB_CI_Z = 1.96  # T4: PRB range = slope +/- 1.96 x standard error

# T4: percentile bootstrap for median, COD, and PRD. Every town uses the same
# seed (RANDOM_SEED above), so every run gives the same ranges.
BOOTSTRAP_RESAMPLES = 2000
CI_LOW_PCT = 2.5
CI_HIGH_PCT = 97.5

# IAAO reference ranges (Section 2.3).
COD_MAX = 15.0  # our choice: judge COD against 15.0 (older, mixed suburbs)
COD_MAX_NEWER_AREAS = 10.0  # IAAO guideline for newer or similar areas (shown as context only)
COD_LOW_WARNING = 5.0  # IAAO: below 5.0 "may indicate sales chasing or non-representative samples"
PRD_LOW, PRD_HIGH = 0.98, 1.03
PRB_LOW, PRB_HIGH = -0.05, 0.05
PRB_UNACCEPTABLE = 0.10  # IAAO: a 95% range outside -0.10 to 0.10 is "unacceptable"

# T3: number of value quarters. Main results sort by the PRB value proxy;
# sale price is kept as a comparison only.
N_TIERS = 4
TIER_BASIS_MAIN = "value_proxy"
TIER_BASES = ["value_proxy", "sale_price"]

# T7 / K10: Chapter 123 limits for tax year 2027 appeals; ratios above 100%
# count as 100% ("RATIOS IN EXCESS OF 100% ARE TO BE CONSIDERED 100%").
CH123_TAX_YEAR = 2027
CH123_RATIO_CAP = 100.0
# T7 is not shown for towns on the 2027 revaluation list (K14).
T7_SKIP_REVAL_TAX_YEAR = 2027

# T5 labels, in the order they are checked (Section 5.4).
LABEL_NOT_ENOUGH = "Not enough sales"
LABEL_REGRESSIVE = "Regressive pattern"
LABEL_PROGRESSIVE = "Progressive pattern"
LABEL_WITHIN = "Within standards"
LABEL_MIXED = "Mixed signals"
LABELS = [LABEL_REGRESSIVE, LABEL_PROGRESSIVE, LABEL_WITHIN, LABEL_MIXED, LABEL_NOT_ENOUGH]

# Data quality flags (T6 and C9).
QUALITY_NORMAL = "normal"
QUALITY_LIMITED = "limited data"
QUALITY_NOT_ENOUGH = "not enough sales"
QUALITY_RECENT_REVAL = "recent revaluation"

TOWN_STATS_CSV = PROCESSED_DIR / "town_stats.csv"
TOWN_TIERS_CSV = PROCESSED_DIR / "town_tiers.csv"
COUNTY_SUMMARY_JSON = PROCESSED_DIR / "county_summary.json"
SENSITIVITY_CSV = PROCESSED_DIR / "sensitivity.csv"
STATS_SUMMARY_MD = DOCS_DIR / "stats-summary.md"

# ---------------------------------------------------------------- validation (methodology Section 8)
# The state's own sample: usable Sales2026 sales in property classes 1, 2, and 4
# (leading number of PROPERTY-CLASS, so 4A, 4B, 4C count as 4 and 15C does not count as 1). These are the
# classes CoefficientDeviations.pdf reports; its TOTAL count equals our usable
# class 1 + 2 + 4 count in all 70 Bergen towns.
STATE_STUDY_CLASSES = ["1", "2", "4"]
STATE_COD_YEAR = 2026  # CoefficientDeviations.pdf rows that match the Sales2026 sampling period
# V4, Section 8: flag a town whose one-year ratio (state's method, our sales) differs
# from the state's one-year ratio by more than this many percentage points.
VALIDATION_FLAG_PP = 5.0
V3_FLAG_PP = 10.0  # V3, Section 8: flag if our class-2 median differs by more than 10 points
V2_PASS_PP = 0.25  # V2, Section 8: state-style coefficient within 0.25 points
VALIDATION_MAX_INVESTIGATE = 10  # write up at most the 10 biggest flagged gaps

VALIDATION_CSV = PROCESSED_DIR / "validation.csv"
VALIDATION_MD = DOCS_DIR / "validation.md"

# ---------------------------------------------------------------- price index (methodology K4, K5)
# K4: all clean sales (C1 to C10 and C8) from both files, grouped by deed month.
PRICE_INDEX_SOURCE_FILES = CLEAN_SOURCE_FILES
PRICE_INDEX_INCOMPLETE_SHARE = 0.5  # K4 step 2: drop end months with under half the average monthly count
PRICE_INDEX_SMOOTH_MONTHS = 1  # K4 step 3: months m-1, m, m+1
PRICE_INDEX_CSV = PROCESSED_DIR / "price_index.csv"

# ---------------------------------------------------------------- export to the website
METHODOLOGY_MD = DOCS_DIR / "methodology.md"
SITE_TOWNS_DIR = SITE_DATA_DIR / "towns"
SITE_DOWNLOADS_DIR = ROOT / "site" / "public" / "downloads"
TOWN_STATS_DOWNLOAD_CSV = SITE_DOWNLOADS_DIR / "fairassess-nj-town-stats.csv"

# K2: comps are dated (DEED-DATE) from October 1, 2024 to the latest deed date in the data.
COMP_WINDOW_START = date(2024, 10, 1)
# The only fields a comp may have in the site files. No street, house number,
# owner name, block/lot, or record ID. deed_date (not just the month) is kept
# because K6 counts days from the deed date to the valuation date.
COMP_FIELDS = ["deed_date", "sale_price", "assessed_value", "ratio"]
SCATTER_MAX_POINTS = 300  # ratio-vs-value chart: at most 300 points per town
RATIO_DIGITS = 4  # ratios, PRD, PRB, and shares
COD_DIGITS = 2  # COD and percent-point numbers
TOWN_FILE_MAX_BYTES = 150 * 1024  # size budget: each towns/<slug>.json
SITE_DATA_MAX_BYTES = 5 * 1024 * 1024  # size budget: everything in site/public/data

# ---------------------------------------------------------------- appeal checker reference (methodology Section 6)
# The Python reference version of the checker (pipeline/checker_reference.py).
# The website keeps its own copy of these numbers in site/lib/checker/config.ts,
# so the two versions are written independently and the tests compare them.
PRICE_INDEX_JSON = SITE_DATA_DIR / "price-index.json"
CHECKER_INPUT_MIN = 10_000  # K1 input range (our choice), whole dollars
CHECKER_INPUT_MAX = 20_000_000
CHECKER_BANDS = (0.15, 0.25)  # K2: +/- 15%, widened to +/- 25%
CHECKER_WIDEN_BELOW = 8  # K2: widen if the 15% band finds fewer than 8 comps
CHECKER_MIN_COMPS = 5  # K3: fewer than 5 after widening -> "Not enough data"
CHECKER_DAYS_PER_MONTH = 30.4375  # K6
CHECKER_HALF_LIFE_MONTHS = 12  # K6
CHECKER_OWN_ESTIMATE_WARN = 0.20  # K9
CHECKER_FLOAT_TOLERANCE = 1e-6  # Section 6.8: within this many points of a limit = on the limit
CHECKER_PERCENTILE_TOLERANCE = 1e-9  # Section 6.8: K7 running weight within this share of the target
# K13: Form A-1 filing fees as (assessed value below, fee) rows, and deadlines.
CHECKER_FEES = [(150_000, 5), (500_000, 25), (1_000_000, 100), (float("inf"), 150)]
CHECKER_DEADLINE = "April 1"
CHECKER_DEADLINE_REVAL = "May 1"
CHECKER_FIXTURES_JSON = PIPELINE_DIR / "fixtures" / "checker_cases.json"
CHECKER_N_RANDOM_CASES = 22  # random real towns in the fixtures (plus named real towns and edge cases)
CHECKER_SWEEP_STEP = 0.01  # Section 7 sweep: try assessed values 1% apart across each town's comp range
CHECKER_SWEEP_CSV = PROCESSED_DIR / "checker_grounds_sweep.csv"
