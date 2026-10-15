"""Cleaning rules C1 to C10 (docs/methodology.md Section 4) with a filter log.

Each rule is one small, pure function named after its rule ID. It takes a
DataFrame and returns (kept, removed). Nothing else changes the rows.
Every number a rule uses lives in pipeline/config.py.

Outputs:
- data/processed/sales_clean.csv     one row per kept sale
- data/interim/removed_rows.parquet  every removed row and the rule that removed it
- data/processed/filter_log.csv      rows in / removed / out per rule, town, and file
- data/processed/c8_sensitivity.csv  C8 at the 1.5 x IQR fence (not used in results)
- docs/filter-log.md                 plain-English waterfall

Run after the parsers:
.venv\\Scripts\\python.exe -m pipeline.clean
"""

from datetime import date

import numpy as np
import pandas as pd

from pipeline import config
from pipeline.profile_data import md_table

RULE_DESCRIPTIONS = {
    "C1": "Bergen County only",
    "C2": "Residential only (property class 2)",
    "C10": "No condominiums",
    "C3": "Usable sales only",
    "C7": "No exact duplicate lines",
    "C4": f"Sale price at least ${config.MIN_SALE_PRICE:,}",
    "C5": "Assessed value above $0",
    "C6": "Single lot only",
    "C9": "Revaluation towns use only new-basis assessments",
    "C8": f"Outlier trimming per town, {config.C8_IQR_FENCE} x IQR",
}
# Short labels for the one-line waterfall ("C2 removed 1,058 non-residential").
WATERFALL_LABELS = {
    "C1": "outside Bergen",
    "C2": "non-residential",
    "C10": "condos",
    "C3": "non-usable",
    "C7": "exact duplicates",
    "C4": f"under ${config.MIN_SALE_PRICE:,}",
    "C5": "with no assessment",
    "C6": "multi-lot",
    "C9": "old-basis sales in 2026 revaluation towns",
    "C8": "outliers",
}
COUNTYWIDE = "ALL"  # district_code used for countywide rows in the filter log
ALL_FILES = "All"  # source_file used for rows that add up both files


# ---------------------------------------------------------------- input

def prepare_input(sr1a):
    """Pick the rows that go into cleaning and add the sale price used.

    Keeps only the files in CLEAN_SOURCE_FILES and drops older copies of a
    sale (superseded_by_newer_file), so there is one row per sale. Sale price
    is VERIFIED-SALES-PRICE, or REPORTED-SALES-PRICE when the verified price is
    zero or blank (methodology Section 3.1); price_source says which.
    Rows are ordered Sales2025 then Sales2026, each in its original line order.
    """
    df = sr1a[sr1a["source_file"].isin(config.CLEAN_SOURCE_FILES)
              & ~sr1a["superseded_by_newer_file"]].copy()
    verified_ok = df["price_verified"].fillna(0) > 0
    df["sale_price"] = df["price_verified"].where(verified_ok, df["price_reported"])
    df["price_source"] = np.where(verified_ok, "verified", "reported")
    file_order = {name: i for i, name in enumerate(config.CLEAN_SOURCE_FILES)}
    df["_file_order"] = df["source_file"].map(file_order)
    # Stable sort by file only, so rows keep their line order inside each file
    # ("earlier row" in C7 means earlier in the file).
    df = df.sort_values("_file_order", kind="mergesort")
    return df.drop(columns="_file_order").reset_index(drop=True)


def split(df, keep_mask):
    """Split df into (kept, removed) by a True/False mask (NA counts as removed)."""
    keep_mask = keep_mask.fillna(False).astype(bool)
    return df[keep_mask].copy(), df[~keep_mask].copy()


# ---------------------------------------------------------------- rules

def rule_c1_county(df):
    """C1: keep Bergen County only (COUNTY-CODE = "02")."""
    return split(df, df["county_code"] == config.COUNTY_CODE)


def rule_c2_class(df):
    """C2: keep residential sales only (PROPERTY-CLASS = "2")."""
    return split(df, df["property_class"].str.strip() == config.RESIDENTIAL_CLASS)


def rule_c10_condo(df):
    """C10: drop condominiums (QUALIFICATION-CODE starts with "C" or "c")."""
    is_condo = df["qual_code"].fillna("").str.upper().str.startswith(config.CONDO_QUAL_PREFIX)
    return split(df, ~is_condo)


def rule_c3_usable(df):
    """C3: keep sales the state marked usable (U-N-TYPE = "U")."""
    return split(df, df["un_type"] == config.USABLE_CODE)


def rule_c7_duplicates(df):
    """C7: drop a row whose full 663-character line matches an earlier row."""
    return split(df, ~df["line_md5"].duplicated(keep="first"))


def rule_c4_price(df):
    """C4: keep sales with a sale price of at least MIN_SALE_PRICE."""
    return split(df, df["sale_price"] >= config.MIN_SALE_PRICE)


def rule_c5_assessment(df):
    """C5: keep sales whose assessment on the sale record is above $0."""
    return split(df, df["av_total"] > config.MIN_ASSESSED_VALUE)


def rule_c6_single_lot(df):
    """C6: drop multi-lot sales (TOTAL ASSESSMENT greater than the main lot's value)."""
    multi_lot = df["total_assessment"].fillna(0) > df["av_total"]
    return split(df, ~multi_lot)


def rule_c9_revaluation(df, reval_towns):
    """C9: in 2026 revaluation towns, keep only ASSESS-YEAR 26 or later.

    reval_towns is the list of district codes on the county's 2026 list.
    """
    old_basis = df["district_code"].isin(reval_towns) & (df["assess_year"] < config.REVAL_MIN_ASSESS_YEAR)
    return split(df, ~old_basis.fillna(True))


def c8_fences(df, fence):
    """Add ratio, town median ratio, relative ratio, and the C8 fences to each row.

    Each town is trimmed on its own, separately for each SR1A file (one
    sampling year and assessment year at a time). The fences are on the
    relative-ratio scale (ratio / town median).
    """
    out = df.copy()
    out["ratio"] = out["av_total"].astype(float) / out["sale_price"].astype(float)
    groups = out.groupby(["source_file", "district_code"], sort=False)["ratio"]
    out["town_median_ratio"] = groups.transform("median")
    out["relative_ratio"] = out["ratio"] / out["town_median_ratio"]
    rel = out.groupby(["source_file", "district_code"], sort=False)["relative_ratio"]
    q1 = rel.transform(lambda s: s.quantile(0.25, interpolation=config.C8_QUANTILE_METHOD))
    q3 = rel.transform(lambda s: s.quantile(0.75, interpolation=config.C8_QUANTILE_METHOD))
    out["c8_low_fence"] = q1 - fence * (q3 - q1)
    out["c8_high_fence"] = q3 + fence * (q3 - q1)
    return out


def rule_c8_outliers(df, fence=config.C8_IQR_FENCE):
    """C8: per town, drop relative ratios below Q1 - fence x IQR or above Q3 + fence x IQR.

    One pass only. Uses the ratio divided by the town's median ratio, never
    a fixed ratio range.
    """
    out = c8_fences(df, fence)
    inside = (out["relative_ratio"] >= out["c8_low_fence"]) & (out["relative_ratio"] <= out["c8_high_fence"])
    return split(out, inside)


RULES = {
    "C1": rule_c1_county,
    "C2": rule_c2_class,
    "C10": rule_c10_condo,
    "C3": rule_c3_usable,
    "C7": rule_c7_duplicates,
    "C4": rule_c4_price,
    "C5": rule_c5_assessment,
    "C6": rule_c6_single_lot,
    "C9": rule_c9_revaluation,
    "C8": rule_c8_outliers,
}


# ---------------------------------------------------------------- running the rules

def run_rules(df, reval_towns, fence=config.C8_IQR_FENCE):
    """Run every rule in CLEAN_RULE_ORDER.

    Returns (kept, removed, steps). removed has a rule_id column. steps is a
    list of (rule_id, rows_in, rows_removed) DataFrames used for the filter log.
    """
    kept, removed_parts, steps = df, [], []
    for rule_id in config.CLEAN_RULE_ORDER:
        rule = RULES[rule_id]
        if rule_id == "C9":
            new_kept, removed = rule(kept, reval_towns)
        elif rule_id == "C8":
            new_kept, removed = rule(kept, fence)
        else:
            new_kept, removed = rule(kept)
        steps.append((rule_id, kept, removed))
        removed_parts.append(removed.assign(rule_id=rule_id))
        kept = new_kept
    removed_all = pd.concat(removed_parts, ignore_index=True)
    return kept, removed_all, steps


def count_by(df, files, towns):
    """Count rows by (source_file, district_code), including file "All" and town "ALL"."""
    counts = df.groupby(["source_file", "district_code"]).size()
    full = pd.MultiIndex.from_product([files, towns], names=["source_file", "district_code"])
    counts = counts.reindex(full, fill_value=0).reset_index(name="n")
    by_file_all_towns = counts.groupby("source_file", as_index=False)["n"].sum().assign(district_code=COUNTYWIDE)
    counts = pd.concat([counts, by_file_all_towns], ignore_index=True)
    all_files = counts.groupby("district_code", as_index=False)["n"].sum().assign(source_file=ALL_FILES)
    return pd.concat([counts, all_files], ignore_index=True)


def build_filter_log(steps, towns):
    """Turn the rule steps into the filter log table.

    towns has district_code and display_name. One row per rule x file
    (Sales2025, Sales2026, All) x town (70 towns plus a countywide row).
    """
    files = list(config.CLEAN_SOURCE_FILES)
    codes = list(towns["district_code"])
    names = dict(zip(towns["district_code"], towns["display_name"]))
    names[COUNTYWIDE] = "Bergen County (all towns)"
    rows = []
    for order, (rule_id, rows_in, removed) in enumerate(steps, start=1):
        n_in = count_by(rows_in, files, codes).rename(columns={"n": "rows_in"})
        n_rm = count_by(removed, files, codes).rename(columns={"n": "rows_removed"})
        table = n_in.merge(n_rm, on=["source_file", "district_code"])
        table["rows_out"] = table["rows_in"] - table["rows_removed"]
        table.insert(0, "step", order)
        table.insert(1, "rule_id", rule_id)
        table.insert(2, "rule_description", RULE_DESCRIPTIONS[rule_id])
        rows.append(table)
    log = pd.concat(rows, ignore_index=True)
    log["town"] = log["district_code"].map(names)
    file_rank = {f: i for i, f in enumerate([ALL_FILES, *files])}
    log["_f"] = log["source_file"].map(file_rank)
    log["_t"] = (log["district_code"] != COUNTYWIDE).astype(int)
    log = log.sort_values(["step", "_f", "_t", "district_code"], kind="mergesort")
    cols = ["step", "rule_id", "rule_description", "source_file", "district_code", "town",
            "rows_in", "rows_removed", "rows_out"]
    return log[cols].reset_index(drop=True)


def c8_sensitivity(pre_c8):
    """Compare C8 at the main fence (3.0) with the sensitivity fence (1.5), per town and file."""
    _, removed_main = rule_c8_outliers(pre_c8, config.C8_IQR_FENCE)
    _, removed_alt = rule_c8_outliers(pre_c8, config.C8_SENSITIVITY_FENCE)
    fences = c8_fences(pre_c8, config.C8_IQR_FENCE)
    alt = c8_fences(pre_c8, config.C8_SENSITIVITY_FENCE)
    keys = ["source_file", "district_code"]
    table = fences.groupby(keys).agg(
        sales_before_c8=("ratio", "size"),
        town_median_ratio=("town_median_ratio", "first"),
        low_fence_3_0=("c8_low_fence", "first"),
        high_fence_3_0=("c8_high_fence", "first"),
    )
    table["low_fence_1_5"] = alt.groupby(keys)["c8_low_fence"].first()
    table["high_fence_1_5"] = alt.groupby(keys)["c8_high_fence"].first()
    table["removed_3_0"] = removed_main.groupby(keys).size().reindex(table.index, fill_value=0)
    table["removed_1_5"] = removed_alt.groupby(keys).size().reindex(table.index, fill_value=0)
    table["extra_removed_at_1_5"] = table["removed_1_5"] - table["removed_3_0"]
    table["sales_after_3_0"] = table["sales_before_c8"] - table["removed_3_0"]
    table["sales_after_1_5"] = table["sales_before_c8"] - table["removed_1_5"]
    for col in ["town_median_ratio", "low_fence_3_0", "high_fence_3_0", "low_fence_1_5", "high_fence_1_5"]:
        table[col] = table[col].round(4)
    return table.reset_index()


def sales_clean_table(kept, towns):
    """Pick and order the columns of sales_clean.csv."""
    slugs = dict(zip(towns["district_code"], towns["slug"]))
    out = pd.DataFrame({
        "record_id": kept["record_id"],
        "source_file": kept["source_file"],
        "district_code": kept["district_code"],
        "town_slug": kept["district_code"].map(slugs),
        "deed_date": pd.to_datetime(kept["deed_date"]).dt.strftime("%Y-%m-%d"),
        "recorded_date": pd.to_datetime(kept["recorded_date"]).dt.strftime("%Y-%m-%d"),
        "assess_year": kept["assess_year"],
        "sale_price": kept["sale_price"],
        "assessed_value": kept["av_total"],
        "ratio": kept["ratio"].round(6),
        "town_median_ratio": kept["town_median_ratio"].round(6),
        "relative_ratio": kept["relative_ratio"].round(6),
    })
    return out.reset_index(drop=True)


# ---------------------------------------------------------------- report

def waterfall_text(log, source_file):
    """One-line waterfall: 'Started with X -> C2 removed Y ... -> Z left'."""
    rows = log[(log["source_file"] == source_file) & (log["district_code"] == COUNTYWIDE)]
    parts = [f"Started with {rows['rows_in'].iloc[0]:,} Bergen sales"]
    for r in rows.itertuples():
        parts.append(f"{r.rule_id} removed {r.rows_removed:,} {WATERFALL_LABELS[r.rule_id]}")
    parts.append(f"**{rows['rows_out'].iloc[-1]:,} clean sales**")
    return " -> ".join(parts)


def waterfall_table(log, source_file):
    """Countywide rows of the filter log for one file, as a small table."""
    rows = log[(log["source_file"] == source_file) & (log["district_code"] == COUNTYWIDE)]
    return rows[["rule_id", "rule_description", "rows_in", "rows_removed", "rows_out"]].rename(columns={
        "rule_id": "Rule", "rule_description": "What it does", "rows_in": "Sales in",
        "rows_removed": "Removed", "rows_out": "Sales out"})


def most_affected(log, top=3):
    """For each rule, the towns that lost the most sales (both files together)."""
    towns = log[(log["source_file"] == ALL_FILES) & (log["district_code"] != COUNTYWIDE)]
    out = []
    for rule_id in config.CLEAN_RULE_ORDER:
        part = towns[(towns["rule_id"] == rule_id) & (towns["rows_removed"] > 0)]
        part = part.sort_values(["rows_removed", "district_code"], ascending=[False, True], kind="mergesort")
        if part.empty:
            out.append({"Rule": rule_id, "Towns most affected (removed of sales in)": "none removed"})
            continue
        text = "; ".join(f"{r.town} {r.rows_removed:,} of {r.rows_in:,} ({r.rows_removed / r.rows_in:.0%})"
                         for r in part.head(top).itertuples())
        n_towns = len(part)
        out.append({"Rule": rule_id, "Towns most affected (removed of sales in)": f"{text} ({n_towns} {'town' if n_towns == 1 else 'towns'} in all)"})
    return pd.DataFrame(out)


def town_counts(log, towns):
    """Clean Sales2026 sales per town (rule T0), with the T6 group each falls in."""
    last = log[(log["rule_id"] == config.CLEAN_RULE_ORDER[-1])
               & (log["source_file"] == config.TOWN_STATS_SOURCE_FILE)
               & (log["district_code"] != COUNTYWIDE)][["district_code", "town", "rows_out"]]
    last = last.merge(towns[["district_code", "revaluation_tax_year"]], on="district_code", how="left")
    last["group"] = np.select(
        [last["rows_out"] < config.MIN_SALES_SHOW, last["rows_out"] < config.MIN_SALES_FULL],
        [f"under {config.MIN_SALES_SHOW}", f"{config.MIN_SALES_SHOW} to {config.MIN_SALES_FULL - 1}"],
        default=f"{config.MIN_SALES_FULL} or more")
    return last.sort_values(["rows_out", "district_code"], kind="mergesort").reset_index(drop=True)


def write_report(log, sens, counts, prepared, kept, path=config.FILTER_LOG_MD, today=None):
    """Write docs/filter-log.md, the plain-English version of the filter log."""
    today = today or date.today().isoformat()
    stats_file = config.TOWN_STATS_SOURCE_FILE
    under = counts[counts["rows_out"] < config.MIN_SALES_SHOW]
    limited = counts[(counts["rows_out"] >= config.MIN_SALES_SHOW) & (counts["rows_out"] < config.MIN_SALES_FULL)]
    full = counts[counts["rows_out"] >= config.MIN_SALES_FULL]
    reval = counts[counts["revaluation_tax_year"] == config.REVAL_NEW_BASIS_TAX_YEAR]
    reval_hidden = reval[reval["rows_out"] < config.MIN_SALES_SHOW]

    def town_list(df):
        return ", ".join(f"{r.town} ({r.rows_out})" for r in df.itertuples()) or "none"

    c9 = log[(log["rule_id"] == "C9") & (log["district_code"] != COUNTYWIDE) & (log["rows_removed"] > 0)
             & (log["source_file"] != ALL_FILES)]
    c9_lines = [f"- {r.town}, {r.source_file}: {r.rows_removed:,} of {r.rows_in:,} removed"
                for r in c9.itertuples()] or ["- No sales removed."]

    s26 = sens[sens["source_file"] == stats_file]
    changed = sens[sens["extra_removed_at_1_5"] > 0]
    changed26 = s26[s26["extra_removed_at_1_5"] > 0].merge(counts[["district_code", "town"]], on="district_code")
    changed26 = changed26.sort_values(["extra_removed_at_1_5", "district_code"], ascending=[False, True], kind="mergesort")
    crosses = changed26[(changed26["sales_after_3_0"] >= config.MIN_SALES_SHOW)
                        & (changed26["sales_after_1_5"] < config.MIN_SALES_SHOW)]
    sens_table = changed26[["town", "sales_before_c8", "removed_3_0", "removed_1_5", "extra_removed_at_1_5"]].rename(
        columns={"town": "Town", "sales_before_c8": "Sales before C8", "removed_3_0": "Removed at 3.0",
                 "removed_1_5": "Removed at 1.5", "extra_removed_at_1_5": "Extra at 1.5"})
    n_reported = int((prepared["price_source"] == "reported").sum())
    n_reported_kept = int((kept["price_source"] == "reported").sum())

    lines = [
        "# Filter log",
        "",
        f"*Generated by `pipeline/clean.py` on {today}. Do not edit by hand; rerun the pipeline.*",
        "",
        "This page shows every sale the cleaning step removed, and why. Rule IDs (C1, C8, T0, ...) "
        "refer to `docs/methodology.md` Section 4. The full table is `data/processed/filter_log.csv`, "
        "and every removed sale is saved with its rule ID in `data/interim/removed_rows.parquet`.",
        "",
        "> FairAssess NJ is an independent student research project that uses public data. It is not legal, "
        "tax, or appraisal advice. Homeowners file and present their own appeals. Confirm deadlines, fees, "
        "and forms with the Bergen County Board of Taxation.",
        "",
        "**What goes in.** Bergen rows from Sales2025 and Sales2026. YTDSR1A2026 is an older copy of "
        "Sales2026, so it is left out (methodology Section 3.1). Rules run in this order: "
        + ", ".join(config.CLEAN_RULE_ORDER) + ". Outlier trimming (C8) always runs last.",
        "",
        f"## 1. {stats_file}: the sales behind the town statistics",
        "",
        f"Town statistics use only {stats_file} (rule T0). This is the state's own sampling year: "
        "deeds recorded July 1, 2025 to June 30, 2026.",
        "",
        waterfall_text(log, stats_file) + ".",
        "",
        md_table(waterfall_table(log, stats_file)),
        "",
        "## 2. Both files: the sales the checker and price index can use",
        "",
        "The appeal checker (rule K2) and the price index (rule K4) use clean sales from both files.",
        "",
        waterfall_text(log, ALL_FILES) + ".",
        "",
        md_table(waterfall_table(log, ALL_FILES)),
        "",
        "Rule C1 removes nothing because the parser already keeps Bergen rows only. It stays as a safety check.",
        "",
        "## 3. Towns most affected by each rule",
        "",
        "Both files together. Each entry is: town, sales removed, of sales that reached the rule (share).",
        "",
        md_table(most_affected(log)),
        "",
        "## 4. Revaluation towns (rule C9)",
        "",
        f"In the {len(reval)} towns on the county's 2026 revaluation list, only sales with a 2026 or later "
        "assessment are kept. State category 27 already removes most old-basis sales.",
        "",
        *c9_lines,
        "",
        f"2026 revaluation towns with under {config.MIN_SALES_SHOW} clean {stats_file} sales "
        f"(labeled \"Recent revaluation\"; statistics hidden): {town_list(reval_hidden)}.",
        "",
        f"## 5. Clean {stats_file} sales per town (rule T6)",
        "",
        f"- **Under {config.MIN_SALES_SHOW} sales ({len(under)} towns)**, statistics hidden: {town_list(under)}.",
        f"- **{config.MIN_SALES_SHOW} to {config.MIN_SALES_FULL - 1} sales ({len(limited)} towns)**, "
        f"\"Limited data\": {town_list(limited)}.",
        f"- **{config.MIN_SALES_FULL} or more sales ({len(full)} towns).**",
        "",
        "## 6. Sensitivity check: outlier fence 1.5 instead of 3.0",
        "",
        f"C8 uses a fence of {config.C8_IQR_FENCE} x IQR. As a check only, we reran it with "
        f"{config.C8_SENSITIVITY_FENCE} x IQR. **The main results do not use this.** Per-town fences for "
        "both are in `data/processed/c8_sensitivity.csv`.",
        "",
        f"- Both files: {int(sens['removed_3_0'].sum()):,} sales removed at 3.0, "
        f"{int(sens['removed_1_5'].sum()):,} at 1.5 "
        f"({int(sens['extra_removed_at_1_5'].sum()):,} more, in {changed['district_code'].nunique()} towns).",
        f"- {stats_file}: {int(s26['removed_3_0'].sum()):,} removed at 3.0, {int(s26['removed_1_5'].sum()):,} at 1.5 "
        f"({int(s26['extra_removed_at_1_5'].sum()):,} more, in {len(changed26)} towns).",
        f"- Towns that would drop under {config.MIN_SALES_SHOW} {stats_file} sales at 1.5: "
        + (", ".join(crosses["town"]) or "none") + ".",
        "",
        f"{stats_file} towns that would lose more sales at 1.5:",
        "",
        md_table(sens_table) if len(sens_table) else "None.",
        "",
        "Whether a town's label changes at 1.5 is checked when the town statistics are built "
        "(`data/processed/sensitivity.csv`, methodology Section 4, C8).",
        "",
        "## 7. Notes",
        "",
        f"- Sale price is the verified price. It was zero or blank on {n_reported:,} input rows, which use "
        f"the reported price instead; {n_reported_kept:,} of those survive cleaning.",
        "- C8 trims each town separately for each file, because each file is a different sampling year "
        "with a different assessment year. A town's median ratio in the clean file is the median before C8.",
        "",
    ]
    path.write_text("\n".join(lines), encoding="utf-8")


# ---------------------------------------------------------------- main

def load_inputs():
    """Read the SR1A parquet, the towns table, and the 2026 revaluation towns."""
    sr1a = pd.read_parquet(config.SR1A_PARQUET)
    towns = pd.read_csv(config.TOWNS_CSV, dtype={"district_code": str})
    reval = pd.read_csv(config.REVALUATION_TOWNS_CSV, dtype={"district_code": str})
    reval_towns = sorted(reval.loc[reval["revaluation_tax_year"] == config.REVAL_NEW_BASIS_TAX_YEAR,
                                   "district_code"])
    return sr1a, towns, reval_towns


def clean_all(sr1a, towns, reval_towns):
    """Run the whole cleaning step in memory and return every output table."""
    prepared = prepare_input(sr1a)
    kept, removed, steps = run_rules(prepared, reval_towns)
    log = build_filter_log(steps, towns)
    pre_c8 = steps[-1][1]
    sens = c8_sensitivity(pre_c8)
    return {"prepared": prepared, "kept": kept, "removed": removed, "log": log, "sens": sens,
            "sales_clean": sales_clean_table(kept, towns), "counts": town_counts(log, towns)}


def write_outputs(result, towns, paths=None, today=None):
    """Save the CSV, parquet, and Markdown outputs. paths overrides the config paths (tests)."""
    paths = paths or {
        "sales_clean": config.SALES_CLEAN_CSV, "removed": config.REMOVED_ROWS_PARQUET,
        "log": config.FILTER_LOG_CSV, "sens": config.C8_SENSITIVITY_CSV, "report": config.FILTER_LOG_MD,
    }
    for p in paths.values():
        p.parent.mkdir(parents=True, exist_ok=True)
    result["sales_clean"].to_csv(paths["sales_clean"], index=False, lineterminator="\n")
    result["removed"].to_parquet(paths["removed"], index=False)
    result["log"].to_csv(paths["log"], index=False, lineterminator="\n")
    result["sens"].to_csv(paths["sens"], index=False, lineterminator="\n")
    write_report(result["log"], result["sens"], result["counts"], result["prepared"], result["kept"],
                 path=paths["report"], today=today)


def main():
    """Clean the Bergen sales and write every output."""
    sr1a, towns, reval_towns = load_inputs()
    result = clean_all(sr1a, towns, reval_towns)
    write_outputs(result, towns)
    log, counts = result["log"], result["counts"]
    for source in [config.TOWN_STATS_SOURCE_FILE, ALL_FILES]:
        print(f"[{source}] " + waterfall_text(log, source).replace("**", ""))
    under = counts[counts["rows_out"] < config.MIN_SALES_SHOW]
    print(f"Towns under {config.MIN_SALES_SHOW} clean {config.TOWN_STATS_SOURCE_FILE} sales: {len(under)}")
    print(f"Saved {len(result['sales_clean']):,} clean sales -> {config.SALES_CLEAN_CSV.relative_to(config.ROOT)}")
    print(f"Saved {len(result['removed']):,} removed rows -> {config.REMOVED_ROWS_PARQUET.relative_to(config.ROOT)}")


if __name__ == "__main__":
    main()
