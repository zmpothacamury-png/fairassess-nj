"""Read the state's SR1A sales files into one small Bergen County table.

Steps:
1. Unzip each SR1A zip into data/interim/sr1a/ (never into data/raw/).
2. Build pipeline/sr1a_layout.csv from SR1Afilelayout.pdf.
3. Read the fixed-width lines, keep Bergen (county "02") right away,
   decode numbers and dates, and drop names and addresses.
4. Mark sales that also appear in a newer file (same record_id).
5. Save data/interim/sr1a_bergen.parquet.

This file only reads and describes. It does not apply cleaning rules.
Run: .venv\\Scripts\\python.exe -m pipeline.parse_sr1a
"""

import hashlib
import re
import zipfile
from datetime import date

import pandas as pd
import pdfplumber

from pipeline import config

# Our short column name for each SR1A field we keep. Fields not listed here
# are not kept. Names, addresses, and the seller's "name control" are never
# kept (CLAUDE.md rule 2).
COLUMN_NAMES = {
    "COUNTY-CODE": "county_code",
    "DISTRICT-CODE": "district_code",
    "TOTAL ASSESSMENT": "total_assessment",
    "LAST-UPDATE-DATE": "last_update_date",
    "U-N-TYPE": "un_type",
    "SR-NU-CODE": "sr_nu_code",
    "REPORTED-SALES-PRICE": "price_reported",
    "VERIFIED-SALES-PRICE": "price_verified",
    "MAIN LOT ASSESSED-VALUE-LAND": "av_land",
    "MAIN LOT ASSESSED-VALUE-BLDG": "av_bldg",
    "MAIN LOT ASSESSED-VALUE-TOTAL": "av_total",
    "SALES-RATIO": "state_sales_ratio",
    "SERIAL-NUMBER": "serial_number",
    "AGING-DATE": "aging_date",
    "DEED-BOOK": "deed_book",
    "DEED-PAGE": "deed_page",
    "DEED-DATE": "deed_date",
    "DATE-RECORDED": "recorded_date",
    "BLOCK": "block",
    "BLOCK-SUFFIX": "block_suffix",
    "LOT": "lot",
    "LOT-SUFFIX": "lot_suffix",
    "ETC": "etc_flag",
    **{f"ADDL-BLOCK({i})": f"addl_block_{i}" for i in range(1, 6)},
    **{f"ADDL-LOT({i})": f"addl_lot_{i}" for i in range(1, 6)},
    **{f"ADDL-QUALIFIER({i})": f"addl_qualifier_{i}" for i in range(1, 6)},
    **{f"ADDL-VALUE-TOTAL({i})": f"addl_av_total_{i}" for i in range(1, 6)},
    "QUALIFICATION-CODES": "qual_code",
    "ASSESS-YEAR": "assess_year",
    "PROPERTY-CLASS": "property_class",
    "CLASS-4-TYPE": "class_4_type",
    "ASSESSOR-NU-CODE": "assessor_nu_code",
    "FIELD-STATUS-CODE": "field_status_code",
    "CRITICAL-ERROR-FLAG": "critical_error_flag",
    "YEAR-BUILT": "year_built",
    "LIVING-SPACE": "living_sqft",
}

# Date formats. The PDF gives no format. These come from checking the data
# (Prompt 4): deed, recording, and aging dates read as YYMMDD (for example,
# Sales2026 recording dates run 250701 to 260630). LAST-UPDATE-DATE reads as
# MMDDYY (values like 122925 = December 29, 2025 cannot be YYMMDD).
DATE_FORMATS = {
    "DEED-DATE": "YYMMDD",
    "DATE-RECORDED": "YYMMDD",
    "AGING-DATE": "YYMMDD",
    "LAST-UPDATE-DATE": "MMDDYY",
}

# Notes written into sr1a_layout.csv where the data disagrees with the PDF.
FIELD_NOTES = {
    "REALTY-TRANSFER-FEE": "Not kept. Sales2026 stores it with a written decimal point "
                           "(10 characters, 88-97); Sales2025 stores whole dollars.",
    "RTF-ERROR-FLAG": "Not kept. In Sales2026 this position holds the last digit of the "
                      "transfer fee.",
    "FIELD-DATE": "Not kept. Format unclear in the data.",
    "LIVING-SPACE": "Left-aligned with trailing spaces in Sales2025/2026.",
    "PROPERTY-CLASS": "Left-aligned (\"2  \"); spaces removed.",
    "SR-NU-CODE": "Left-aligned (\"27 \"); spaces removed.",
    "TOTAL ASSESSMENT": "The older description PDF has BATCH-NUMBER and DLN here.",
    "DISTRICT-CODE": "Saved as 4 digits (county + district, \"0201\") to match every other table.",
}

# Numeric-looking codes read as text so leading zeros stay ("02", "0001234").
CODE_FIELDS = {"COUNTY-CODE", "DISTRICT-CODE", "SERIAL-NUMBER", "CLASS-4-TYPE"}

PRIVATE_FIELD_PATTERN = re.compile(r"GRANTOR|GRANTEE|PROPERTY-LOCATION|OPERATOR")

LAYOUT_LINE = re.compile(r"^(?P<field>.+?)\s+(?P<picture>\S+)\s+(?P<start>\d+)\s+"
                         r"(?P<end>\d+)\s+(?P<length>\d+)$")


# ---------------------------------------------------------------- layout

def field_type(field, picture):
    """Return (type, decimals) for one layout row, from its COBOL picture."""
    if field in DATE_FORMATS:
        return "date_" + DATE_FORMATS[field].lower(), 0
    if "V" in picture:
        after = picture.split("V")[1]  # "99" or "9(2)"
        m = re.search(r"\((\d+)\)", after)
        decimals = int(m.group(1)) if m else len(after)
        kind = "signed_decimal" if picture.startswith("S") else "decimal"
        return kind, decimals
    if field in CODE_FIELDS or field.startswith("FILLER") or picture.startswith("X"):
        return "text", 0
    if re.fullmatch(r"[9()\d]+", picture):
        return "int", 0
    return "text", 0


def parse_layout_text(text):
    """Turn the layout PDF's text into a table of fields (one row each)."""
    rows = []
    for line in text.splitlines():
        line = line.strip()
        if line.startswith("---") or line.startswith("SR1A-EXTRACT"):
            continue
        m = LAYOUT_LINE.match(line)
        if not m:
            continue
        field = m["field"]
        kind, decimals = field_type(field, m["picture"])
        keep = field in COLUMN_NAMES and not PRIVATE_FIELD_PATTERN.search(field)
        rows.append({
            "field": field,
            "start": int(m["start"]),
            "end": int(m["end"]),
            "length": int(m["length"]),
            "picture": m["picture"],
            "type": kind,
            "decimals": decimals,
            "column": COLUMN_NAMES[field] if keep else "",
            "note": FIELD_NOTES.get(field, "Never kept (private)." if
                                    PRIVATE_FIELD_PATTERN.search(field) else ""),
        })
    return pd.DataFrame(rows)


def build_layout(pdf_path=config.SR1A_LAYOUT_PDF, out_path=config.SR1A_LAYOUT_CSV):
    """Read SR1Afilelayout.pdf and save pipeline/sr1a_layout.csv."""
    with pdfplumber.open(pdf_path) as pdf:
        text = "\n".join(page.extract_text() or "" for page in pdf.pages)
    layout = parse_layout_text(text)
    check_layout(layout)
    layout.to_csv(out_path, index=False)
    return layout


def check_layout(layout):
    """Stop if the layout has gaps, overlaps, or does not end at 663."""
    pos = 1
    for row in layout.itertuples():
        if row.start != pos:
            raise ValueError(f"Layout gap or overlap at {row.field}: starts {row.start}, expected {pos}")
        if row.end - row.start + 1 != row.length:
            raise ValueError(f"Layout length mismatch at {row.field}")
        pos = row.end + 1
    if pos - 1 != config.SR1A_LINE_LENGTH:
        raise ValueError(f"Layout ends at {pos - 1}, expected {config.SR1A_LINE_LENGTH}")


def load_layout(path=config.SR1A_LAYOUT_CSV):
    """Read the saved layout table (build it first if it is missing)."""
    if not path.exists():
        return build_layout(out_path=path)
    return pd.read_csv(path, dtype={"column": str, "note": str}, keep_default_na=False)


# ---------------------------------------------------------------- decoding

OVERPUNCH = {"{": ("+", "0"), "}": ("-", "0"),
             **{c: ("+", str(i + 1)) for i, c in enumerate("ABCDEFGHI")},
             **{c: ("-", str(i + 1)) for i, c in enumerate("JKLMNOPQR")}}


def decode_int(raw):
    """Decode a whole-number field. Blank -> None."""
    s = raw.strip()
    if not s:
        return None
    return int(s)


def decode_decimal(raw, decimals, signed=False):
    """Decode a number with an implied decimal point (COBOL 9V99 / S9V99).

    "08496" with 2 decimals -> 84.96. A written "." is used as is.
    Signed fields may carry the sign as a leading/trailing + or -, or as an
    "overpunch" letter in the last digit ("}" = -0, "J" = -1, ... "R" = -9).
    """
    s = raw.strip()
    if not s:
        return None
    sign = 1
    if s[0] in "+-":
        sign, s = (-1 if s[0] == "-" else 1), s[1:]
    elif s[-1] in "+-":
        sign, s = (-1 if s[-1] == "-" else 1), s[:-1]
    elif signed and s[-1] in OVERPUNCH:
        mark, digit = OVERPUNCH[s[-1]]
        sign, s = (-1 if mark == "-" else 1), s[:-1] + digit
    if "." in s:
        return sign * float(s)
    return round(sign * int(s) / 10 ** decimals, decimals)


def expand_year(yy, pivot=config.CENTURY_PIVOT):
    """Turn a 2-digit year into 4 digits: below the pivot -> 2000s, else 1900s."""
    return 2000 + yy if yy < pivot else 1900 + yy


def decode_date(raw, fmt="YYMMDD"):
    """Decode a 6-digit date (YYMMDD or MMDDYY). Blank, zeros, or impossible -> None."""
    s = raw.strip()
    if not s or set(s) == {"0"} or len(s) != 6 or not s.isdigit():
        return None
    if fmt == "YYMMDD":
        yy, mm, dd = int(s[0:2]), int(s[2:4]), int(s[4:6])
    else:
        mm, dd, yy = int(s[0:2]), int(s[2:4]), int(s[4:6])
    try:
        return date(expand_year(yy), mm, dd)
    except ValueError:
        return None


def decode_text(raw):
    """Strip spaces. Blank -> None."""
    s = raw.strip()
    return s or None


def decode_field(raw, kind, decimals):
    """Decode one raw field string by its layout type."""
    if kind == "int":
        return decode_int(raw)
    if kind in ("decimal", "signed_decimal"):
        return decode_decimal(raw, decimals, signed=kind == "signed_decimal")
    if kind.startswith("date_"):
        return decode_date(raw, kind[5:].upper())
    return decode_text(raw)


def parse_line(line, layout):
    """Decode one 663-character SR1A line into a dict of kept columns."""
    out = {}
    for row in layout.itertuples():
        if not row.column:
            continue
        out[row.column] = decode_field(line[row.start - 1:row.end], row.type, row.decimals)
    return out


# ---------------------------------------------------------------- reading files

def unzip_sr1a(spec):
    """Unzip one SR1A file into data/interim/sr1a/ and return the .txt path."""
    config.INTERIM_SR1A_DIR.mkdir(parents=True, exist_ok=True)
    target = config.INTERIM_SR1A_DIR / spec["txt"]
    with zipfile.ZipFile(config.RAW_SR1A_DIR / spec["zip"]) as zf:
        info = zf.getinfo(spec["txt"])
        if not target.exists() or target.stat().st_size != info.file_size:
            zf.extract(info, config.INTERIM_SR1A_DIR)
    return target


def read_county_lines(txt_path, county=config.COUNTY_CODE):
    """Return (all_line_count, bad_length_count, county_lines) for one file."""
    total, bad, keep = 0, 0, []
    with open(txt_path, encoding=config.SR1A_ENCODING) as fh:
        for line in fh:
            line = line.rstrip("\r\n")
            total += 1
            if len(line) != config.SR1A_LINE_LENGTH:
                bad += 1
            if line[:2] == county:
                keep.append(line)
    return total, bad, keep


def summarize_raw_file(spec):
    """Count rows and date ranges straight from the raw lines of one file.

    Works for every file, even one whose value fields do not match the
    layout, because positions 1-4, 34, and 339-350 are the same in both
    SR1A layouts.
    """
    txt = unzip_sr1a(spec)
    total, bad, lines = read_county_lines(txt)
    deed = [decode_date(l[338:344]) for l in lines]
    rec = [decode_date(l[344:350]) for l in lines]
    good_deed = [d for d in deed if d]
    good_rec = [d for d in rec if d]
    return {
        "source_file": spec["name"],
        "extracted": spec["extracted"],
        "layout_ok": spec["layout_ok"],
        "rows_all_nj": total,
        "rows_wrong_length": bad,
        "rows_bergen": len(lines),
        "recorded_min": min(good_rec), "recorded_max": max(good_rec),
        "recorded_bad": len(rec) - len(good_rec),
        "deed_min": min(good_deed), "deed_max": max(good_deed),
        "deed_bad": len(deed) - len(good_deed),
        "exact_duplicate_lines": len(lines) - len(set(lines)),
    }


def parse_file(spec, layout):
    """Decode every Bergen line of one SR1A file into a DataFrame."""
    txt = unzip_sr1a(spec)
    _, _, lines = read_county_lines(txt)
    records = []
    for line in lines:
        rec = parse_line(line, layout)
        rec["line_md5"] = hashlib.md5(line.encode(config.SR1A_ENCODING)).hexdigest()
        records.append(rec)
    df = pd.DataFrame.from_records(records)
    df.insert(0, "source_file", spec["name"])
    return df


def add_record_ids(df):
    """Make district_code 4 digits, add record_id, and mark older copies.

    district_code becomes county + district ("0201"), the code every other
    table uses. record_id = district_code + "-" + serial number.

    The SR1A description calls SERIAL-NUMBER a "unique auto generated number
    issued to each SR1A". A row is superseded when the same record_id is in
    a file listed later in config.SR1A_FILES (a newer extract).
    """
    df = df.copy()
    df["district_code"] = df["county_code"] + df["district_code"]  # "02"+"01" -> "0201"
    df["record_id"] = df["district_code"] + "-" + df["serial_number"]
    order = {spec["name"]: i for i, spec in enumerate(config.SR1A_FILES)}
    df["_order"] = df["source_file"].map(order)
    newest = df.groupby("record_id")["_order"].transform("max")
    df["superseded_by_newer_file"] = df["_order"] < newest
    return df.drop(columns="_order")


def tidy_types(df):
    """Give columns compact, consistent types for the parquet file."""
    for col in ["deed_date", "recorded_date", "aging_date", "last_update_date"]:
        df[col] = pd.to_datetime(df[col])
    int_cols = ["total_assessment", "price_reported", "price_verified", "av_land", "av_bldg",
                "av_total", "assess_year", "year_built", "living_sqft",
                *[f"addl_av_total_{i}" for i in range(1, 6)]]
    for col in int_cols:
        df[col] = df[col].astype("Int64")
    df["state_sales_ratio"] = df["state_sales_ratio"].astype("Float64")
    return df


def build_sr1a(out_path=config.SR1A_PARQUET):
    """Parse every SR1A file whose layout matches, and save the parquet file."""
    layout = load_layout()
    frames = [parse_file(spec, layout) for spec in config.SR1A_FILES if spec["layout_ok"]]
    df = tidy_types(add_record_ids(pd.concat(frames, ignore_index=True)))
    out_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_parquet(out_path, index=False)
    return df


def main():
    """Build the layout, summarize all files, and write the Bergen parquet."""
    layout = build_layout()
    print(f"Layout: {len(layout)} fields -> {config.SR1A_LAYOUT_CSV.relative_to(config.ROOT)}")
    summary = pd.DataFrame([summarize_raw_file(s) for s in config.SR1A_FILES])
    summary.to_csv(config.INTERIM_DIR / "sr1a_file_summary.csv", index=False)
    print(summary.to_string(index=False))
    df = build_sr1a()
    print(f"Saved {len(df):,} Bergen rows -> {config.SR1A_PARQUET.relative_to(config.ROOT)}")
    print(df.groupby("source_file")["superseded_by_newer_file"].agg(["size", "sum"]))


if __name__ == "__main__":
    main()
