"""Build the Bergen County monthly price index (docs/methodology.md rules K4 and K5).

Steps (K4):
1. Take every clean sale (C1 to C10 and C8) from Sales2025 and Sales2026, grouped by deed month.
2. Drop the newest deed months that look incomplete: months at the end of the
   series with fewer than half the average monthly count.
3. Raw value for month m = median sale price of all sales in months m-1, m, m+1
   together. At the ends of the series, use the 2 months available.
4. Index I(m) = raw(m) / raw(last kept month).

K5: no forecast. The index stays flat from the last kept month to the valuation date.

Writes data/processed/price_index.csv. Run after the clean stage:
.venv\\Scripts\\python.exe -m pipeline.price_index
"""

import pandas as pd

from pipeline import config


def deed_months(sales):
    """Deed month of each sale as a pandas monthly Period."""
    return pd.to_datetime(sales["deed_date"]).dt.to_period("M")


def monthly_counts(months):
    """Number of sales in every month from the first to the last, with 0 for empty months."""
    counts = months.value_counts().sort_index()
    full = pd.period_range(counts.index.min(), counts.index.max(), freq="M")
    return counts.reindex(full, fill_value=0)


def incomplete_end_months(counts, share=config.PRICE_INDEX_INCOMPLETE_SHARE):
    """Months at the end of the series with fewer than share x the average monthly count (K4 step 2).

    The average is over every month in the series. Walk back from the newest
    month and stop at the first month that is not short.
    """
    floor = share * counts.mean()
    dropped = []
    for month in reversed(counts.index):
        if counts[month] >= floor:
            break
        dropped.append(month)
    return sorted(dropped)


def smoothed_medians(prices, months, kept, width=config.PRICE_INDEX_SMOOTH_MONTHS):
    """Median sale price of months m-width to m+width together, for each kept month (K4 step 3).

    Only kept months are used, so at the ends of the series fewer months go in.
    Returns a DataFrame: month, n_window (sales used), raw_median_price.
    """
    rows = []
    for i, month in enumerate(kept):
        window = kept[max(0, i - width): i + width + 1]
        in_window = prices[months.isin(window)]
        rows.append({"month": month, "n_window": len(in_window), "raw_median_price": float(in_window.median())})
    return pd.DataFrame(rows)


def build_index(sales):
    """The full K4 table: one row per deed month, with kept flag, counts, raw value, and index."""
    months = deed_months(sales)
    counts = monthly_counts(months)
    dropped = incomplete_end_months(counts)
    kept = [m for m in counts.index if m not in dropped]
    smooth = smoothed_medians(sales["sale_price"].astype(float), months, kept)
    last = smooth["raw_median_price"].iloc[-1]
    smooth["index"] = smooth["raw_median_price"] / last
    table = pd.DataFrame({"month": counts.index, "n_sales": counts.to_numpy()})
    table = table.merge(smooth, on="month", how="left")
    table["kept"] = ~table["month"].isin(dropped)
    table["month"] = table["month"].astype(str)
    table["n_window"] = table["n_window"].astype("Int64")
    return table[["month", "n_sales", "kept", "n_window", "raw_median_price", "index"]]


def last_kept_month(table):
    """The newest month the index keeps (the base month, index 1.0)."""
    return table.loc[table["kept"], "month"].iloc[-1]


def load_sales():
    """Clean sales from the files the index uses (K4 step 1)."""
    sales = pd.read_csv(config.SALES_CLEAN_CSV, dtype={"district_code": str})
    return sales[sales["source_file"].isin(config.PRICE_INDEX_SOURCE_FILES)].reset_index(drop=True)


def main():
    """Build the index and write data/processed/price_index.csv."""
    table = build_index(load_sales())
    table.to_csv(config.PRICE_INDEX_CSV, index=False, float_format="%.6f")
    dropped = table.loc[~table["kept"], "month"].tolist()
    print(f"Price index: {len(table)} deed months, {table['kept'].sum()} kept, base month "
          f"{last_kept_month(table)}; dropped as incomplete: {dropped or 'none'}")
    print(f"Wrote {config.PRICE_INDEX_CSV.relative_to(config.ROOT)}")


if __name__ == "__main__":
    main()
