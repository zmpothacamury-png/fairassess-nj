"""Read the Bergen County rows of the state's Chapter 123 PDFs.

Each certified list gives every town's average ratio and its common level
range (lower and upper limit), in percent. We copy the limits exactly as
printed and never recompute them (methodology Section 2.4).

Output: data/processed/ch123_2027.csv and ch123_2026.csv.
Run: .venv\\Scripts\\python.exe -m pipeline.parse_ch123
"""

import re

import pandas as pd
import pdfplumber

from pipeline import config

ROW = re.compile(r"^(?P<code>\d{4})\s+(?P<name>.+?)(?P<amended>\*\*)?\s+"
                 r"(?P<avg>\d+\.\d\d)\s+(?P<lower>\d+\.\d\d)\s+(?P<upper>\d+\.\d\d)$")


def parse_ch123_text(text, county=config.COUNTY_CODE):
    """Return one dict per town row whose code starts with the county code."""
    rows = []
    for line in text.splitlines():
        m = ROW.match(line.strip())
        if not m or not m["code"].startswith(county):
            continue
        rows.append({
            "district_code": m["code"],
            "town_name_printed": m["name"].strip(),
            "average_ratio": float(m["avg"]),
            "lower_limit": float(m["lower"]),
            "upper_limit": float(m["upper"]),
            # "**" = "AS AMENDED BY TAX COURT OF NEW JERSEY" (2026 list only)
            "amended_by_tax_court": m["amended"] is not None,
        })
    return rows


def parse_ch123(pdf_path, tax_year):
    """Read one Chapter 123 PDF and return Bergen rows as a DataFrame."""
    with pdfplumber.open(pdf_path) as pdf:
        text = "\n".join(page.extract_text() or "" for page in pdf.pages)
    df = pd.DataFrame(parse_ch123_text(text))
    df.insert(0, "tax_year", tax_year)
    df["source_file"] = f"data/raw/state/{pdf_path.name}"
    return df.sort_values("district_code").reset_index(drop=True)


def missing_codes(df, county=config.COUNTY_CODE, n=config.N_TOWNS):
    """List the expected district codes (0201..0270) that are not in df."""
    expected = {f"{county}{i:02d}" for i in range(1, n + 1)}
    return sorted(expected - set(df["district_code"]))


def main():
    """Parse both Chapter 123 PDFs, check for 70 towns, and save CSVs."""
    for year, pdf_path in config.CH123_PDFS.items():
        df = parse_ch123(pdf_path, year)
        df.to_csv(config.CH123_CSV[year], index=False)
        gone = missing_codes(df)
        print(f"{year}: {len(df)} Bergen rows -> {config.CH123_CSV[year].name}; "
              f"missing: {gone or 'none'}; amended rows: {int(df.amended_by_tax_court.sum())}")


if __name__ == "__main__":
    main()
