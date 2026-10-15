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
NONUSABLE_CODES_CSV = REFERENCE_DIR / "nonusable_codes.csv"
REVALUATION_TOWNS_CSV = REFERENCE_DIR / "bergen_revaluation_towns.csv"

# ---------------------------------------------------------------- outputs
SR1A_PARQUET = INTERIM_DIR / "sr1a_bergen.parquet"
CH123_CSV = {year: PROCESSED_DIR / f"ch123_{year}.csv" for year in CH123_PDFS}
DIR_RATIOS_CSV = PROCESSED_DIR / "director_ratios_bergen.csv"
STATE_COD_CSV = PROCESSED_DIR / "state_cod_bergen.csv"
TAX_RATES_CSV = PROCESSED_DIR / "tax_rates_bergen.csv"
AVG_RES_CSV = PROCESSED_DIR / "avg_residential_bergen.csv"
TOWNS_CSV = PROCESSED_DIR / "towns.csv"
DATA_PROFILE_MD = DOCS_DIR / "data-profile.md"
