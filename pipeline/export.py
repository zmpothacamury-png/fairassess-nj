"""Export everything the website needs as small JSON files (Prompt 8).

Reads the final pipeline tables in data/processed/ and writes:

- site/public/data/meta.json           dates, tax years, methodology version, town count
- site/public/data/county.json         countywide measures and label counts
- site/public/data/towns.json          one entry per town (all 70)
- site/public/data/towns/<slug>.json   one town: its entry + value quarters, chart points, checker comps
- site/public/data/price-index.json    Bergen monthly price index (K4)
- site/public/data/validation.json     checks against the state's numbers (Section 8)
- site/public/data/filter-log.json     sales removed by each cleaning rule (Section 4)
- site/public/downloads/fairassess-nj-town-stats.csv   open-data download of the town table

Every field is described in docs/data-contract.md. The site checks every file
against its schema (site/lib/data/schema.ts) before it builds.

Run after the validate stage:
.venv\\Scripts\\python.exe -m pipeline.export
"""

import json
import math
import re
from datetime import datetime, timezone

import numpy as np
import pandas as pd

from pipeline import config, price_index, stats, validate

TOWN_STAT_FIELDS = ["median_ratio", "median_ci_low", "median_ci_high", "mean_ratio", "weighted_mean_ratio",
                    "cod", "cod_ci_low", "cod_ci_high", "prd", "prd_ci_low", "prd_ci_high",
                    "prb", "prb_intercept", "prb_se", "prb_ci_low", "prb_ci_high"]
IAAO_FLAG_FIELDS = ["cod_meets_iaao", "cod_below_5", "prd_meets_iaao", "prb_meets_iaao", "prb_ci_outside_0_10"]
TIER_FIELDS = ["tier", "n", "value_low", "value_high", "sale_price_low", "sale_price_high", "median_ratio",
               "lower_trigger", "upper_trigger", "n_above_upper", "n_below_lower",
               "share_above_upper", "share_below_lower"]
VALIDATION_FIELDS = ["state_average_ratio", "our_class2_median", "diff_class2_median_pp", "v3_flag_over_10pp",
                     "state_one_year_ratio", "our_ratio_state_style", "diff_one_year_pp", "flag_over_5pp",
                     "averaging_effect_pp", "state_ratio_2025", "our_n_classes_1_2_4", "state_n_classes_1_2_4",
                     "counts_match", "state_cod_class2", "our_cod_state_style", "diff_cod", "v2_pass"]
SCATTER_METHOD = ("If a town has more than {max} sales, the sales are sorted by value proxy and {max} are "
                  "picked at evenly spaced positions (always including the lowest and highest). Otherwise "
                  "every sale is shown.")
PRICE_INDEX_NOTE = ("Built from every clean sale (rules C1 to C10 and C8) in Sales2025 and Sales2026, grouped "
                    "by deed month. End months with fewer than half the average monthly count are dropped as "
                    "incomplete. Each month's raw value is the median sale price of that month and the months "
                    "on each side together (2 months at the ends). Index = raw value / raw value of the last "
                    "kept month. No forecast: the index stays flat from the last kept month to the valuation "
                    "date (rules K4 and K5). The chart starts at the first month of the checker's comp window "
                    "(K2). Earlier months have few sales and no comp uses them, so they appear only in the table.")


# ---------------------------------------------------------------- small helpers

def clean_number(x, digits=None):
    """Round a number for JSON. NaN, Infinity, and missing become None.

    digits=None means whole number (money, counts): returns an int.
    """
    if x is None or x is pd.NA:
        return None
    x = float(x)
    if not math.isfinite(x):
        return None
    if digits is None:
        return int(round(x))
    return round(x, digits)


def clean_bool(x):
    """True/False for JSON, None if missing."""
    if x is None or x is pd.NA or (isinstance(x, float) and math.isnan(x)):
        return None
    if isinstance(x, str):
        return x.strip().lower() == "true"
    return bool(x)


def digits_for(field):
    """How many decimals a field gets: COD and percent points 2, money whole, other ratios 4."""
    if "cod" in field.split("_") or field.endswith("_pp"):
        return config.COD_DIGITS
    return config.RATIO_DIGITS


def round_tree(obj, key=""):
    """Round every float in a nested dict/list using digits_for on its key. Ints and text stay as they are."""
    if isinstance(obj, dict):
        return {k: round_tree(v, k) for k, v in obj.items()}
    if isinstance(obj, list):
        return [round_tree(v, key) for v in obj]
    if isinstance(obj, float):
        return clean_number(obj, digits_for(key))
    return obj


def methodology_version(path=config.METHODOLOGY_MD):
    """Read the version and date from the first lines of methodology.md: '**Version 1.4 (2026-10-15).**'."""
    text = path.read_text(encoding="utf-8")
    m = re.search(r"\*\*Version ([\d.]+) \((\d{4}-\d{2}-\d{2})\)\.\*\*", text)
    if not m:
        raise ValueError(f"No '**Version X (YYYY-MM-DD).**' line found in {path}")
    return m.group(1), m.group(2)


def to_json_text(obj):
    """Compact JSON. Fails on NaN or Infinity instead of writing them."""
    return json.dumps(obj, ensure_ascii=False, allow_nan=False, separators=(",", ":"))


# ---------------------------------------------------------------- inputs

def load_inputs():
    """Read every processed table the export uses."""
    def read(path):
        return pd.read_csv(path, dtype={"district_code": str})

    return {
        "towns": read(config.TOWNS_CSV),
        "town_stats": read(config.TOWN_STATS_CSV),
        "tiers": read(config.TOWN_TIERS_CSV),
        "sales": read(config.SALES_CLEAN_CSV),
        "ch123": read(config.CH123_CSV[config.CH123_TAX_YEAR]),
        "tax_rates": read(config.TAX_RATES_CSV),
        "avg_res": read(config.AVG_RES_CSV),
        "validation": read(config.VALIDATION_CSV),
        "filter_log": read(config.FILTER_LOG_CSV),
        "price_index": pd.read_csv(config.PRICE_INDEX_CSV, dtype={"month": str}),
        "county": json.loads(config.COUNTY_SUMMARY_JSON.read_text(encoding="utf-8")),
    }


# ---------------------------------------------------------------- one town

def latest_tax_rates(tax_rates):
    """Each town's newest general tax rate (dollars per $100 of assessed value) and its year."""
    t = tax_rates.dropna(subset=["general_tax_rate"]).sort_values(["district_code", "year"])
    return t.groupby("district_code").tail(1).set_index("district_code")


def town_entry(stat, ch123, tax, avg_res):
    """The towns.json entry for one town. stats is None when the town's statistics are hidden (T6, C9)."""
    has_stats = not pd.isna(stat["median_ratio"])
    entry = {
        "slug": stat["slug"],
        "name": stat["town"],
        "district_code": stat["district_code"],
        "revaluation_tax_year": clean_number(stat["revaluation_tax_year"]),
        "n_sales": int(stat["n_sales"]),
        "data_quality": stat["data_quality"],
        "label": stat["label"],
        "rank": clean_number(stat["prb_rank"]),
        "stats": None,
        "ch123": {
            "tax_year": config.CH123_TAX_YEAR,
            "average_ratio": clean_number(ch123["average_ratio"], 2),
            "lower_limit": clean_number(ch123["lower_limit"], 2),
            "upper_limit": clean_number(ch123["upper_limit"], 2),
            "amended_by_tax_court": clean_bool(ch123["amended_by_tax_court"]),
        },
        "tax_rate": None if tax is None else {
            "year": int(tax["year"]),
            "general_tax_rate": clean_number(tax["general_tax_rate"], 3),
        },
        "avg_residential": None if avg_res is None else {
            "year": config.STATE_COD_YEAR,
            "line_items": clean_number(avg_res["line_items"]),
            "avg_assessment": clean_number(avg_res["avg_assessment"]),
            "n_sales": clean_number(avg_res["n_sales"]),
            "avg_sale_price": clean_number(avg_res["avg_sale_price"]),
        },
    }
    if has_stats:
        s = {f: clean_number(stat[f], digits_for(f)) for f in TOWN_STAT_FIELDS}
        s.update({f: clean_bool(stat[f]) for f in IAAO_FLAG_FIELDS})
        s.update({"label_fence_1_5": stat["label_fence_1_5"], "label_no_trim": stat["label_no_trim"],
                  "label_sensitive_to_outliers": clean_bool(stat["label_sensitive_to_outliers"])})
        entry["stats"] = s
    return entry


def tier_rows(tiers, district_code):
    """Value quarters (T3) and Chapter 123 shares (T7) for one town, main basis only."""
    t = tiers[(tiers["district_code"] == district_code) & (tiers["tier_basis"] == config.TIER_BASIS_MAIN)]
    money = {"value_low", "value_high", "sale_price_low", "sale_price_high"}
    counts = {"tier", "n", "n_above_upper", "n_below_lower"}
    rows = []
    for _, r in t.sort_values("tier").iterrows():
        row = {}
        for f in TIER_FIELDS:
            if f in money or f in counts:
                row[f] = clean_number(r[f])
            elif f in ("lower_trigger", "upper_trigger"):
                row[f] = clean_number(r[f], 2)
            else:
                row[f] = clean_number(r[f], config.RATIO_DIGITS)
        rows.append(row)
    return rows


def even_sample_positions(n, k):
    """k positions spread evenly from 0 to n-1 (first and last included). All n if n <= k."""
    if n <= k:
        return list(range(n))
    return sorted(set(np.round(np.linspace(0, n - 1, k)).astype(int).tolist()))


def scatter_points(group, max_points=config.SCATTER_MAX_POINTS):
    """Points for the ratio-vs-value chart: value proxy (whole dollars) and ratio (4 decimals).

    Uses the same value proxy as PRB (methodology Section 2.2). Sorted by value.
    Returns (points, sampling note).
    """
    a = group["assessed_value"].to_numpy(dtype=float)
    s = group["sale_price"].to_numpy(dtype=float)
    v = stats.value_proxy(a, s)
    order = np.argsort(v, kind="stable")
    picks = order[even_sample_positions(len(v), max_points)]
    points = [{"value": clean_number(v[i]), "ratio": clean_number(a[i] / s[i], config.RATIO_DIGITS)}
              for i in picks]
    sampling = {"n_sales": len(v), "n_shown": len(points), "max_points": max_points,
                "method": SCATTER_METHOD.format(max=max_points)}
    return points, sampling


def comp_window(sales):
    """K2 comp window: October 1, 2024 to the latest deed date in the clean data."""
    return {"deed_date_from": config.COMP_WINDOW_START.isoformat(), "deed_date_to": sales["deed_date"].max()}


def comp_pool(group, window):
    """The checker's comps for one town (rule K2): only the approved fields, oldest first.

    No street name, house number, owner name, block/lot, or record ID ever leaves the pipeline.
    """
    g = group[(group["deed_date"] >= window["deed_date_from"]) & (group["deed_date"] <= window["deed_date_to"])]
    g = g.sort_values(["deed_date", "sale_price", "assessed_value"], kind="stable")
    return [{"deed_date": r.deed_date, "sale_price": clean_number(r.sale_price),
             "assessed_value": clean_number(r.assessed_value),
             "ratio": clean_number(r.assessed_value / r.sale_price, config.RATIO_DIGITS)}
            for r in g.itertuples()]


def town_file(entry, tiers, stats_sales, comp_sales, window, town_log):
    """Everything in a town's towns.json entry, plus quarters, chart points, comps, and its filter log."""
    has_stats = entry["stats"] is not None
    if has_stats:
        points, sampling = scatter_points(stats_sales)
    else:
        points, sampling = [], {"n_sales": len(stats_sales), "n_shown": 0,
                                "max_points": config.SCATTER_MAX_POINTS,
                                "method": "Not shown: the town's statistics are hidden (rules T6 and C9)."}
    comps = comp_pool(comp_sales, window)
    return {**entry,
            "tiers": tier_rows(tiers, entry["district_code"]) if has_stats else [],
            "scatter": points,
            "scatter_sampling": sampling,
            "comp_window": window,
            "comps": comps,
            "filter_log": filter_rows(town_log)}


# ---------------------------------------------------------------- county-wide files

def meta(inputs, now=None):
    """meta.json: when and from what the data was made."""
    version, version_date = methodology_version()
    sales = inputs["sales"]
    s26 = sales[sales["source_file"] == config.TOWN_STATS_SOURCE_FILE]
    idx = inputs["price_index"]
    extract = {f["name"]: f["extracted"] for f in config.SR1A_FILES}
    now = now or datetime.now(timezone.utc)
    return {
        "generated_at": now.replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "data_as_of": s26["recorded_date"].max(),
        "county": config.COUNTY_NAME,
        "n_towns": len(inputs["town_stats"]),
        "town_stats_sales": {
            "source_file": config.TOWN_STATS_SOURCE_FILE,
            "sr1a_extract_date": extract[config.TOWN_STATS_SOURCE_FILE].isoformat(),
            "recorded_from": s26["recorded_date"].min(),
            "recorded_to": s26["recorded_date"].max(),
            "n_sales": len(s26),
        },
        "comp_sales": {
            "source_files": config.CLEAN_SOURCE_FILES,
            **comp_window(sales),
        },
        "price_index_months": {"from": idx["month"].iloc[0],
                               "to": price_index.last_kept_month(idx)},
        "valuation_date": config.VALUATION_DATE.isoformat(),
        "chapter123_tax_year": config.CH123_TAX_YEAR,
        "tax_rate_year": int(latest_tax_rates(inputs["tax_rates"])["year"].max()),
        "methodology_version": version,
        "methodology_date": version_date,
    }


def county(summary):
    """county.json: county_summary.json rounded for the site."""
    return round_tree(summary)


def price_index_json(idx):
    """price-index.json: one row per deed month, kept or not, and how it was built."""
    months = []
    for r in idx.itertuples():
        kept = clean_bool(r.kept)
        months.append({"month": r.month, "n_sales": int(r.n_sales), "kept": kept,
                       "n_window": clean_number(r.n_window) if kept else None,
                       "raw_median_price": clean_number(r.raw_median_price) if kept else None,
                       "index": clean_number(r.index, config.RATIO_DIGITS) if kept else None})
    return {"base_month": price_index.last_kept_month(idx),
            "chart_from": config.COMP_WINDOW_START.strftime("%Y-%m"),
            "valuation_date": config.VALUATION_DATE.isoformat(),
            "note": PRICE_INDEX_NOTE,
            "months": months}


def validation_json(v):
    """validation.json: headline counts and one row per town (methodology Section 8)."""
    summary = {k: (clean_number(x, 2) if isinstance(x, float) else x)
               for k, x in validate.summarize(v).items()}
    towns = []
    for _, r in v.iterrows():
        row = {"district_code": r["district_code"], "town": r["town"]}
        for f in VALIDATION_FIELDS:
            x = r[f]
            if f in ("v3_flag_over_10pp", "flag_over_5pp", "counts_match", "v2_pass"):
                row[f] = clean_bool(x)
            elif f.startswith("our_n") or f.startswith("state_n"):
                row[f] = clean_number(x)
            else:
                row[f] = clean_number(x, 2)
        towns.append(row)
    return {"thresholds": {"v4_flag_pp": config.VALIDATION_FLAG_PP, "v3_flag_pp": config.V3_FLAG_PP,
                           "v2_pass_pp": config.V2_PASS_PP},
            "summary": summary, "towns": towns}


def filter_rows(frame):
    """Filter log rows in rule order: source_file, rule_id, rows_in, rows_removed, rows_out."""
    return [{"source_file": r["source_file"], "rule_id": r["rule_id"], "rows_in": int(r["rows_in"]),
             "rows_removed": int(r["rows_removed"]), "rows_out": int(r["rows_out"])}
            for _, r in frame.sort_values(["source_file", "step"], kind="stable").iterrows()]


def filter_log_json(log):
    """filter-log.json: the rules in order and the county waterfall.

    Each town's own rows go in its town file instead (town_file), so the
    methodology page loads a small file and town pages can show their own removals.
    """
    county_rows = log[log["district_code"] == "ALL"]
    rules = (county_rows[["step", "rule_id", "rule_description"]].drop_duplicates("rule_id")
             .sort_values("step"))
    return {"rules": [{"step": int(r.step), "rule_id": r.rule_id, "description": r.rule_description}
                      for r in rules.itertuples()],
            "county": filter_rows(county_rows)}


def town_stats_download(entries):
    """Rows for the open-data CSV: one flat row per town, same rounding as towns.json."""
    rows = []
    for e in entries:
        s = e["stats"] or {}
        row = {"district_code": e["district_code"], "town": e["name"], "slug": e["slug"],
               "revaluation_tax_year": e["revaluation_tax_year"], "n_sales": e["n_sales"],
               "data_quality": e["data_quality"], "label": e["label"], "rank": e["rank"]}
        row.update({f: s.get(f) for f in TOWN_STAT_FIELDS + IAAO_FLAG_FIELDS})
        row["label_sensitive_to_outliers"] = s.get("label_sensitive_to_outliers")
        row.update({"ch123_tax_year": e["ch123"]["tax_year"],
                    "ch123_average_ratio_pct": e["ch123"]["average_ratio"],
                    "ch123_lower_limit_pct": e["ch123"]["lower_limit"],
                    "ch123_upper_limit_pct": e["ch123"]["upper_limit"],
                    "general_tax_rate": (e["tax_rate"] or {}).get("general_tax_rate"),
                    "tax_rate_year": (e["tax_rate"] or {}).get("year")})
        rows.append(row)
    table = pd.DataFrame(rows)
    whole = ["revaluation_tax_year", "n_sales", "rank", "ch123_tax_year", "tax_rate_year"]
    table[whole] = table[whole].astype("Int64")
    return table


# ---------------------------------------------------------------- build and write

def build_all(inputs, now=None):
    """Every output, as {relative path: object}. Town files go under 'towns/'."""
    ts = inputs["town_stats"].sort_values("district_code")
    ch123 = inputs["ch123"].set_index("district_code")
    tax = latest_tax_rates(inputs["tax_rates"])
    avg_res = inputs["avg_res"].set_index("district_code")
    sales = inputs["sales"]
    window = comp_window(sales)
    stats_sales = sales[sales["source_file"] == config.TOWN_STATS_SOURCE_FILE]

    entries, files = [], {}
    for _, stat in ts.iterrows():
        code = stat["district_code"]
        entry = town_entry(stat, ch123.loc[code], tax.loc[code] if code in tax.index else None,
                           avg_res.loc[code] if code in avg_res.index else None)
        entries.append(entry)
        files[f"towns/{entry['slug']}.json"] = town_file(
            entry, inputs["tiers"], stats_sales[stats_sales["district_code"] == code],
            sales[sales["district_code"] == code], window,
            inputs["filter_log"][inputs["filter_log"]["district_code"] == code])

    files.update({
        "meta.json": meta(inputs, now),
        "county.json": county(inputs["county"]),
        "towns.json": entries,
        "price-index.json": price_index_json(inputs["price_index"]),
        "validation.json": validation_json(inputs["validation"]),
        "filter-log.json": filter_log_json(inputs["filter_log"]),
    })
    return files, town_stats_download(entries)


def check_sizes(texts):
    """Size budget: each town file and all data together. Returns {path: bytes}; raises if over."""
    sizes = {path: len(text.encode("utf-8")) for path, text in texts.items()}
    too_big = {p: b for p, b in sizes.items() if p.startswith("towns/") and b > config.TOWN_FILE_MAX_BYTES}
    if too_big:
        raise ValueError(f"Town files over {config.TOWN_FILE_MAX_BYTES:,} bytes: {too_big}")
    total = sum(sizes.values())
    if total > config.SITE_DATA_MAX_BYTES:
        raise ValueError(f"Site data is {total:,} bytes, over the {config.SITE_DATA_MAX_BYTES:,} byte budget")
    return sizes


def write_outputs(files, download, data_dir=config.SITE_DATA_DIR, download_csv=config.TOWN_STATS_DOWNLOAD_CSV):
    """Write the JSON files and the CSV. Old town files are removed first so no stale town is left behind."""
    texts = {path: to_json_text(obj) for path, obj in files.items()}
    sizes = check_sizes(texts)
    towns_dir = data_dir / "towns"
    towns_dir.mkdir(parents=True, exist_ok=True)
    for old in towns_dir.glob("*.json"):
        old.unlink()
    for path, text in texts.items():
        (data_dir / path).write_text(text, encoding="utf-8", newline="\n")
    download_csv.parent.mkdir(parents=True, exist_ok=True)
    download.to_csv(download_csv, index=False, lineterminator="\n")
    return sizes


def size_report(sizes):
    """Print the file sizes: shared files one by one, town files as min / median / max."""
    town = {p: b for p, b in sizes.items() if p.startswith("towns/")}
    for path, b in sorted(sizes.items()):
        if not path.startswith("towns/"):
            print(f"  {path:<20} {b / 1024:8.1f} KB")
    biggest = max(town, key=town.get)
    print(f"  towns/*.json ({len(town)} files): min {min(town.values()) / 1024:.1f} KB, median "
          f"{float(np.median(list(town.values()))) / 1024:.1f} KB, max {town[biggest] / 1024:.1f} KB ({biggest})")
    print(f"  total {sum(sizes.values()) / 1024:.1f} KB "
          f"(budget {config.SITE_DATA_MAX_BYTES / 1024:.0f} KB; town file budget {config.TOWN_FILE_MAX_BYTES / 1024:.0f} KB)")


def main():
    """Build and write every site data file, then report sizes."""
    files, download = build_all(load_inputs())
    sizes = write_outputs(files, download)
    print(f"Wrote {len(sizes)} JSON files to {config.SITE_DATA_DIR.relative_to(config.ROOT)} and "
          f"{config.TOWN_STATS_DOWNLOAD_CSV.relative_to(config.ROOT)}")
    size_report(sizes)


if __name__ == "__main__":
    main()
