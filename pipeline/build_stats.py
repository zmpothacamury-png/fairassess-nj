"""Build the town statistics (docs/methodology.md Sections 2 and 5).

Uses only the clean Sales2026 sales (rule T0). The math lives in
pipeline/stats.py; this file groups the sales, runs it, and writes:

- data/processed/town_stats.csv       one row per town (all 70)
- data/processed/town_tiers.csv       median ratio by value quarter, and T7 Chapter 123 shares
- data/processed/county_summary.json  countywide measures and label counts
- data/processed/sensitivity.csv      town statistics at C8 fence 3.0, 1.5, and no trimming
- docs/stats-summary.md               plain-English summary

Run after the clean stage:
.venv\\Scripts\\python.exe -m pipeline.build_stats
"""

import json
import math
from datetime import date

import numpy as np
import pandas as pd

from pipeline import clean, config, stats
from pipeline.profile_data import md_table

VARIANT_MAIN = "fence_3_0"
VARIANTS = [VARIANT_MAIN, "fence_1_5", "no_trim"]
DISCLAIMER = ("FairAssess NJ is an independent student research project that uses public data. It is not "
              "legal, tax, or appraisal advice. Homeowners file and present their own appeals. Confirm "
              "deadlines, fees, and forms with the Bergen County Board of Taxation.")


# ---------------------------------------------------------------- inputs

def load_inputs():
    """Read the clean sales, towns table, Sales2026 sales removed by C8, and 2027 Chapter 123 limits."""
    sales = pd.read_csv(config.SALES_CLEAN_CSV, dtype={"district_code": str})
    sales = sales[sales["source_file"] == config.TOWN_STATS_SOURCE_FILE].reset_index(drop=True)
    towns = pd.read_csv(config.TOWNS_CSV, dtype={"district_code": str})
    removed = pd.read_parquet(config.REMOVED_ROWS_PARQUET)
    c8_removed = removed[(removed["rule_id"] == "C8")
                         & (removed["source_file"] == config.TOWN_STATS_SOURCE_FILE)]
    ch123 = pd.read_csv(config.CH123_CSV[config.CH123_TAX_YEAR], dtype={"district_code": str})
    return sales, towns, c8_removed, ch123


def sensitivity_inputs(sales, c8_removed):
    """The three versions of the Sales2026 sales used in the C8 sensitivity check.

    fence_3_0 = the clean sales (main results); no_trim = clean sales plus the
    sales C8 removed; fence_1_5 = no_trim trimmed again with the 1.5 x IQR fence.
    """
    cols = ["source_file", "district_code", "assessed_value", "sale_price"]
    back = c8_removed.rename(columns={"av_total": "assessed_value"})[cols]
    no_trim = pd.concat([sales[cols], back], ignore_index=True)
    kept_1_5, _ = clean.rule_c8_outliers(no_trim.rename(columns={"assessed_value": "av_total"}),
                                         config.C8_SENSITIVITY_FENCE)
    fence_1_5 = kept_1_5.rename(columns={"av_total": "assessed_value"})[cols]
    return {VARIANT_MAIN: sales[cols], "fence_1_5": fence_1_5, "no_trim": no_trim}


def is_recent_reval(towns):
    """Map district_code -> True if the town is on the county's 2026 revaluation list (C9)."""
    return dict(zip(towns["district_code"], towns["revaluation_tax_year"] == config.REVAL_NEW_BASIS_TAX_YEAR))


# ---------------------------------------------------------------- town statistics

def town_row(group, recent_reval, with_ci=True):
    """All statistics for one town's sales. Hidden towns (under 20 sales) get n and flags only."""
    n = len(group)
    row = {"n_sales": n, "data_quality": stats.data_quality(n, recent_reval)}
    if not stats.has_enough_sales(n, recent_reval):
        row["label"] = config.LABEL_NOT_ENOUGH
        return row
    a, s = group["assessed_value"].to_numpy(float), group["sale_price"].to_numpy(float)
    row.update(stats.point_measures(a, s))
    if with_ci:
        row.update(stats.bootstrap_ci(a, s))
        prb_result = {"prb": row["prb"], "ci_low": row["prb_ci_low"], "ci_high": row["prb_ci_high"]}
        row.update(stats.iaao_flags(row["cod"], row["prd"], prb_result))
    row["label"] = stats.town_label(n, row["prd"], row["prb"], recent_reval)
    return row


def stats_by_town(sales, towns, with_ci=True):
    """One statistics row per town (all 70, even towns with 0 sales)."""
    reval = is_recent_reval(towns)
    groups = dict(tuple(sales.groupby("district_code", sort=False)))
    empty = sales.iloc[0:0]
    rows = []
    for code in towns["district_code"]:
        row = town_row(groups.get(code, empty), reval[code], with_ci=with_ci)
        rows.append({"district_code": code, **row})
    return pd.DataFrame(rows)


def add_ranks(table):
    """Rank towns by PRB, most negative first (rank 1). Hidden towns get no rank.

    Ties in PRB are broken by district code so the order always repeats.
    """
    out = table.copy()
    ranked = out[out["label"] != config.LABEL_NOT_ENOUGH].sort_values(["prb", "district_code"], kind="mergesort")
    out["prb_rank"] = pd.Series(range(1, len(ranked) + 1), index=ranked.index)
    out["prb_rank"] = out["prb_rank"].astype("Int64")
    return out


TOWN_STATS_COLUMNS = [
    "district_code", "town", "slug", "revaluation_tax_year", "n_sales", "data_quality", "label", "prb_rank",
    "median_ratio", "median_ci_low", "median_ci_high", "mean_ratio", "weighted_mean_ratio",
    "cod", "cod_ci_low", "cod_ci_high", "prd", "prd_ci_low", "prd_ci_high",
    "prb", "prb_se", "prb_ci_low", "prb_ci_high",
    "cod_meets_iaao", "cod_below_5", "prd_meets_iaao", "prb_meets_iaao", "prb_ci_outside_0_10",
    "label_fence_1_5", "label_no_trim", "label_sensitive_to_outliers",
]
ROUND_COLUMNS = ["median_ratio", "median_ci_low", "median_ci_high", "mean_ratio", "weighted_mean_ratio",
                 "cod", "cod_ci_low", "cod_ci_high", "prd", "prd_ci_low", "prd_ci_high",
                 "prb", "prb_se", "prb_ci_low", "prb_ci_high"]


def town_stats_table(sales, towns, sens):
    """Build town_stats.csv: statistics, ranges, IAAO flags, label, rank, and sensitivity labels."""
    table = add_ranks(stats_by_town(sales, towns))
    meta = towns[["district_code", "display_name", "slug", "revaluation_tax_year"]].rename(
        columns={"display_name": "town"})
    table = meta.merge(table, on="district_code", how="left")
    labels = sens.pivot(index="district_code", columns="variant", values="label")
    table["label_fence_1_5"] = table["district_code"].map(labels["fence_1_5"])
    table["label_no_trim"] = table["district_code"].map(labels["no_trim"])
    table["label_sensitive_to_outliers"] = table["label_fence_1_5"] != table["label"]
    table["revaluation_tax_year"] = table["revaluation_tax_year"].astype("Int64")
    for col in ["cod_meets_iaao", "cod_below_5", "prd_meets_iaao", "prb_meets_iaao", "prb_ci_outside_0_10"]:
        table[col] = table[col].astype("boolean")
    table[ROUND_COLUMNS] = table[ROUND_COLUMNS].round(6)
    return table[TOWN_STATS_COLUMNS]


def sensitivity_table(variants, towns):
    """Point statistics and label for every town under each C8 version (no bootstrap)."""
    parts = []
    for name in VARIANTS:
        part = stats_by_town(variants[name], towns, with_ci=False)
        part.insert(1, "variant", name)
        parts.append(part)
    out = pd.concat(parts, ignore_index=True)
    cols = ["district_code", "variant", "n_sales", "data_quality", "label",
            "median_ratio", "cod", "prd", "prb", "prb_ci_low", "prb_ci_high"]
    out = out.reindex(columns=cols)
    out[cols[5:]] = out[cols[5:]].round(6)
    # Parts are already in VARIANTS order, so a stable sort by town keeps that order.
    return out.sort_values("district_code", kind="mergesort").reset_index(drop=True)


T7_COLUMNS = ["n_above_upper", "n_below_lower", "share_above_upper", "share_below_lower",
              "lower_trigger", "upper_trigger"]


def tier_ch123(group, basis, lower_trigger, upper_trigger):
    """T7 for one town: per quarter, how many sales are above U* and below L*."""
    a, s = group["assessed_value"].to_numpy(float), group["sale_price"].to_numpy(float)
    tiers = stats.tier_numbers(a, s, basis)
    rows = []
    for tier in range(1, config.N_TIERS + 1):
        pick = tiers == tier
        sh = stats.ch123_shares(a[pick] / s[pick], lower_trigger, upper_trigger)
        rows.append({"tier": tier, "n_above_upper": sh["n_above"], "n_below_lower": sh["n_below"],
                     "share_above_upper": sh["share_above"], "share_below_lower": sh["share_below"]})
    return pd.DataFrame(rows)


def town_tiers_table(sales, town_stats, ch123):
    """Build town_tiers.csv: median ratio and count per value quarter (T3), plus T7.

    Both bases are written: tier_basis "value_proxy" is the main result and
    "sale_price" is the comparison (T3 note). Only towns whose statistics are
    shown (20 or more sales) get tiers. T7 columns are blank for towns on the
    2027 revaluation list (K14).
    """
    shown = town_stats.loc[town_stats["label"] != config.LABEL_NOT_ENOUGH,
                           ["district_code", "town", "revaluation_tax_year"]]
    limits = ch123.set_index("district_code")
    groups = dict(tuple(sales.groupby("district_code", sort=False)))
    parts = []
    for r in shown.itertuples():
        g = groups[r.district_code]
        lower, upper = stats.ch123_triggers(limits.loc[r.district_code, "lower_limit"],
                                            limits.loc[r.district_code, "upper_limit"])
        skip_t7 = pd.notna(r.revaluation_tax_year) and r.revaluation_tax_year == config.T7_SKIP_REVAL_TAX_YEAR
        for basis in config.TIER_BASES:
            t = stats.value_tiers(g["assessed_value"], g["sale_price"], basis=basis)
            t = t.merge(tier_ch123(g, basis, lower, upper), on="tier")
            t["lower_trigger"], t["upper_trigger"] = lower, upper
            if skip_t7:
                t[T7_COLUMNS] = math.nan
            t.insert(0, "tier_basis", basis)
            t.insert(0, "town", r.town)
            t.insert(0, "district_code", r.district_code)
            parts.append(t)
    out = pd.concat(parts, ignore_index=True)
    for col in ["value_low", "value_high", "sale_price_low", "sale_price_high", "n_above_upper", "n_below_lower"]:
        out[col] = out[col].round(0).astype("Int64")
    for col in ["median_ratio", "share_above_upper", "share_below_lower"]:
        out[col] = out[col].round(6)
    return out


def t7_county(tiers):
    """T7 added up over every town that shows T7: share above U* and below L* in each value quarter."""
    main = tiers[(tiers["tier_basis"] == config.TIER_BASIS_MAIN) & tiers["n_above_upper"].notna()]
    by = main.groupby("tier").agg(n=("n", "sum"), n_above=("n_above_upper", "sum"),
                                  n_below=("n_below_lower", "sum"))
    return {
        "n_towns": int(main["district_code"].nunique()),
        "by_tier": [{"tier": int(tier), "n_sales": int(row.n), "n_above_upper": int(row.n_above),
                     "n_below_lower": int(row.n_below),
                     "share_above_upper": _clean_number(row.n_above / row.n, 6),
                     "share_below_lower": _clean_number(row.n_below / row.n, 6)}
                    for tier, row in by.iterrows()],
    }


# ---------------------------------------------------------------- county summary

def _clean_number(x, digits):
    """Round for JSON; NaN becomes None."""
    if x is None or (isinstance(x, float) and math.isnan(x)):
        return None
    return round(float(x), digits)


def group_measures(assessed, prices):
    """Point measures plus bootstrap ranges for one group of sales, rounded for JSON."""
    m = stats.point_measures(assessed, prices)
    m.update(stats.bootstrap_ci(assessed, prices))
    return {k: (v if k == "n_sales" else _clean_number(v, 6)) for k, v in m.items()}


def within_town_values(sales):
    """Divide each sale's assessed value by its town's median ratio.

    Then every town's median ratio becomes 1.0, so towns assessed at
    different levels (50% vs 120%) can be pooled. What is left is only the
    unevenness inside each town.
    """
    r = sales["assessed_value"] / sales["sale_price"]
    town_median = r.groupby(sales["district_code"]).transform("median")
    return sales["assessed_value"] / town_median, sales["sale_price"]


def average_ratio_range(ch123, town_stats):
    """Lowest and highest state average ratio (percent) for the Chapter 123 tax year, with town names."""
    c = ch123.merge(town_stats[["district_code", "town"]], on="district_code")
    lo, hi = c.loc[c["average_ratio"].idxmin()], c.loc[c["average_ratio"].idxmax()]
    return {"tax_year": config.CH123_TAX_YEAR, "source": config.CH123_PDFS[config.CH123_TAX_YEAR].name,
            "min": float(lo["average_ratio"]), "min_town": lo["town"],
            "max": float(hi["average_ratio"]), "max_town": hi["town"]}


def county_summary(sales, town_stats, tiers, ch123):
    """Countywide measures (two versions, rule T8), T7 by quarter, and counts of towns in each label and flag."""
    shown = town_stats[town_stats["label"] != config.LABEL_NOT_ENOUGH]
    adj_a, adj_s = within_town_values(sales)
    by_label = {lab: int((town_stats["label"] == lab).sum()) for lab in config.LABELS}
    quality = [config.QUALITY_NORMAL, config.QUALITY_LIMITED, config.QUALITY_NOT_ENOUGH, config.QUALITY_RECENT_REVAL]
    return {
        "source_file": config.TOWN_STATS_SOURCE_FILE,
        "sales_recorded": "2025-07-01 to 2026-06-30",
        "n_sales": int(len(sales)),
        "n_towns": int(len(town_stats)),
        "n_towns_with_sales": int((town_stats["n_sales"] > 0).sum()),
        "headline_version": "within_town",
        "within_town": {
            "about": "Each sale's assessed value is divided by its own town's median ratio before pooling, "
                     "so differences in assessment level between towns are removed. Measures only the "
                     "unevenness inside towns.",
            **group_measures(adj_a, adj_s),
        },
        "pooled": {
            "about": "All clean sales pooled with no adjustment. Mixes towns assessed at very different "
                     "levels, so COD and PRD here partly reflect differences between towns.",
            **group_measures(sales["assessed_value"], sales["sale_price"]),
        },
        "towns_by_label": by_label,
        "towns_by_data_quality": {q: int((town_stats["data_quality"] == q).sum()) for q in quality},
        "ranked_towns": int(len(shown)),
        "ranked_towns_meeting_iaao": {
            "cod": int(shown["cod_meets_iaao"].sum()),
            "prd": int(shown["prd_meets_iaao"].sum()),
            "prb": int(shown["prb_meets_iaao"].sum()),
        },
        "ranked_towns_prb_range_below_zero": int((shown["prb_ci_high"] < 0).sum()),
        "ranked_towns_prb_range_above_zero": int((shown["prb_ci_low"] > 0).sum()),
        "ranked_towns_prb_range_outside_0_10": int(shown["prb_ci_outside_0_10"].sum()),
        "ranked_towns_label_sensitive_to_outliers": int(shown["label_sensitive_to_outliers"].sum()),
        "t7_value_quarters": t7_county(tiers),
        "state_average_ratio_range": average_ratio_range(ch123, town_stats),
        "typical_ranked_town": {
            "median_cod": _clean_number(shown["cod"].median(), 6),
            "median_prd": _clean_number(shown["prd"].median(), 6),
            "median_prb": _clean_number(shown["prb"].median(), 6),
        },
    }


# ---------------------------------------------------------------- report

def pct(x, digits=1):
    """0.8123 -> '81.2%'."""
    return f"{100 * x:.{digits}f}%"


def town_rank_table(rows):
    """Markdown-ready table of ranked towns with n and 95% ranges."""
    return pd.DataFrame({
        "Rank": rows["prb_rank"].astype(int),
        "Town": rows["town"],
        "Sales": rows["n_sales"],
        "PRB (95% range)": [f"{r.prb:.3f} ({r.prb_ci_low:.3f} to {r.prb_ci_high:.3f})" for r in rows.itertuples()],
        "PRD (95% range)": [f"{r.prd:.3f} ({r.prd_ci_low:.3f} to {r.prd_ci_high:.3f})" for r in rows.itertuples()],
        "COD": [f"{r.cod:.1f}" for r in rows.itertuples()],
        "Label": rows["label"],
        "Data": rows["data_quality"],
    })


def t7_table(summary):
    """Countywide T7 table: share of sales above and below the Chapter 123 triggers, per value quarter."""
    names = {1: "1 (lowest value)", 2: "2", 3: "3", 4: "4 (highest value)"}
    rows = summary["t7_value_quarters"]["by_tier"]
    return pd.DataFrame({
        "Value quarter": [names[r["tier"]] for r in rows],
        "Sales": [f"{r['n_sales']:,}" for r in rows],
        "Above the upper limit": [f"{r['n_above_upper']:,} ({pct(r['share_above_upper'])})" for r in rows],
        "Below the lower limit": [f"{r['n_below_lower']:,} ({pct(r['share_below_lower'])})" for r in rows],
    })


def tier_gap_counts(tiers):
    """For each tier basis: how many towns have a higher median ratio in quarter 1 than in quarter 4."""
    p = tiers.pivot_table(index=["tier_basis", "district_code"], columns="tier", values="median_ratio")
    higher = (p[1] > p[config.N_TIERS]).groupby(level="tier_basis").sum()
    gap = (p[1] - p[config.N_TIERS]).groupby(level="tier_basis").median()
    return {basis: (int(higher[basis]), float(gap[basis])) for basis in config.TIER_BASES}


def write_report(town_stats, tiers, summary, path=config.STATS_SUMMARY_MD, today=None):
    """Write docs/stats-summary.md, the plain-English summary of the town statistics."""
    today = today or date.today().isoformat()
    t7 = summary["t7_value_quarters"]
    gaps = tier_gap_counts(tiers)
    n_tier_towns = tiers["district_code"].nunique()
    (vp_n, vp_gap), (sp_n, sp_gap) = gaps["value_proxy"], gaps["sale_price"]
    lvl = summary["state_average_ratio_range"]
    w, p = summary["within_town"], summary["pooled"]
    ranked = town_stats[town_stats["prb_rank"].notna()].sort_values("prb_rank")
    most = ranked.head(10)
    least = ranked.sort_values(["prb", "district_code"], ascending=[False, True], kind="mergesort").head(10)
    hidden = town_stats[town_stats["label"] == config.LABEL_NOT_ENOUGH]
    n_reval_hidden = int((hidden["data_quality"] == config.QUALITY_RECENT_REVAL).sum())
    labels = summary["towns_by_label"]
    iaao = summary["ranked_towns_meeting_iaao"]
    k = summary["ranked_towns"]
    sensitive = ranked[ranked["label_sensitive_to_outliers"]]
    label_table = pd.DataFrame({"Label": list(labels), "Towns": list(labels.values())})
    lines = [
        "# Town statistics summary",
        "",
        f"*Generated by `pipeline/build_stats.py` on {today}. Do not edit by hand; rerun the pipeline.*",
        "",
        f"> {DISCLAIMER}",
        "",
        f"This page sums up the town statistics for Bergen County single-family homes. It uses "
        f"{summary['n_sales']:,} clean sales with deeds recorded July 1, 2025 to June 30, 2026 (rule T0). "
        "Rule IDs refer to `docs/methodology.md`. The full tables are `data/processed/town_stats.csv`, "
        "`town_tiers.csv`, and `county_summary.json`.",
        "",
        "## What the measures mean",
        "",
        "- **Assessment ratio**: assessed value divided by sale price. A home assessed at $400,000 that sold "
        "for $500,000 has a ratio of 80%.",
        "- **Median ratio**: the middle ratio in a town. It is the typical share of market value the town assesses at.",
        "- **COD (coefficient of dispersion)**: how far, on average, each home's ratio is from the median, as a "
        f"percent. Lower means more even. IAAO's guideline for older, mixed suburbs is {config.COD_MAX:.0f} or less.",
        "- **PRD (price-related differential)**: the average ratio divided by the value-weighted average ratio. "
        f"Above 1 means cheaper homes tend to have higher ratios. IAAO's range is {config.PRD_LOW} to {config.PRD_HIGH}.",
        "- **PRB (price-related bias)**: about how much the ratio changes each time a home's value doubles. "
        f"-0.05 means the ratio falls about 5% per doubling. IAAO's range is {config.PRB_LOW} to +{config.PRB_HIGH}.",
        "- **95% range**: the span where the true value most likely falls, given how many sales a town has. "
        "Small towns have wide ranges.",
        "- **Value quarter**: each town's sales split into 4 equal groups, from lowest to highest value. "
        "Value here is the same mix PRB uses: half the sale price and half the assessment, turned back "
        "into a market value (rule T3).",
        "- **Chapter 123 limits**: each year the state sets a range around each town's average ratio "
        "(about 15% above and below it). A home assessed above the upper limit may have grounds for an "
        "appeal. Ratios above 100% count as 100%.",
        "- **Regressive pattern**: cheaper homes are assessed at a higher share of their value than expensive "
        "homes. A town gets this label when PRD is above 1.03 **and** PRB is below -0.05 (rule T5).",
        "",
        "## Countywide results",
        "",
        f"Bergen towns assess at very different levels (the state's {config.CH123_TAX_YEAR} average ratios run "
        f"from {lvl['min']:.2f}% in {lvl['min_town']} to {lvl['max']:.2f}% in {lvl['max_town']}; "
        f"{config.CH123_PDFS[config.CH123_TAX_YEAR].name}), so we "
        "report two versions. **The within-town version is the headline.** It divides each sale by its own "
        "town's median first, so it only measures unevenness inside towns.",
        "",
        md_table(pd.DataFrame({
            "Measure": ["Sales", "Median ratio", "COD", "PRD", "PRB"],
            "Within towns (headline)": [
                f"{w['n_sales']:,}", "1.000 (by design)",
                f"{w['cod']:.1f} ({w['cod_ci_low']:.1f} to {w['cod_ci_high']:.1f})",
                f"{w['prd']:.3f} ({w['prd_ci_low']:.3f} to {w['prd_ci_high']:.3f})",
                f"{w['prb']:.3f} ({w['prb_ci_low']:.3f} to {w['prb_ci_high']:.3f})"],
            "All sales pooled (reference)": [
                f"{p['n_sales']:,}",
                f"{pct(p['median_ratio'])} ({pct(p['median_ci_low'])} to {pct(p['median_ci_high'])})",
                f"{p['cod']:.1f} ({p['cod_ci_low']:.1f} to {p['cod_ci_high']:.1f})",
                f"{p['prd']:.3f} ({p['prd_ci_low']:.3f} to {p['prd_ci_high']:.3f})",
                f"{p['prb']:.3f} ({p['prb_ci_low']:.3f} to {p['prb_ci_high']:.3f})"],
        })),
        "",
        "Numbers in parentheses are 95% ranges.",
        "",
        "## Towns in each label",
        "",
        md_table(label_table),
        "",
        f"- {k} towns have 20 or more sales and get a rank. {len(hidden)} towns have under 20 sales, so their "
        f"statistics are hidden. {n_reval_hidden} of those are on the county's 2026 revaluation list "
        "(labeled \"Recent revaluation\"; see rule C9).",
        f"- Of the {k} ranked towns, {iaao['cod']} meet the IAAO COD guideline, {iaao['prd']} meet the PRD "
        f"range, and {iaao['prb']} meet the PRB range.",
        f"- In {summary['ranked_towns_prb_range_below_zero']} ranked towns the whole 95% PRB range is below 0, "
        f"and in {summary['ranked_towns_prb_range_above_zero']} it is above 0. In "
        f"{summary['ranked_towns_prb_range_outside_0_10']} the whole range is outside -0.10 to +0.10, which IAAO "
        "calls an \"unacceptable\" vertical inequity.",
        f"- {len(sensitive)} ranked towns change label when outliers are trimmed at 1.5 x IQR instead of 3.0: "
        + (", ".join(sensitive["town"]) or "none") + ". Their town pages will say the result is sensitive to outliers.",
        "",
        "## 10 most regressive towns (lowest PRB)",
        "",
        "These towns show the strongest regressive pattern in this data: cheaper homes sold in the year had "
        "higher assessment ratios than expensive ones. This describes the sales in one year. It does not show "
        "that a town broke a rule, and it says nothing about any single home.",
        "",
        md_table(town_rank_table(most)),
        "",
        "## 10 least regressive towns (highest PRB)",
        "",
        "These towns show the weakest regressive pattern, or a progressive one (expensive homes with higher "
        "ratios), in this data.",
        "",
        md_table(town_rank_table(least)),
        "",
        "## Sold homes outside the Chapter 123 limits, by value quarter (rule T7)",
        "",
        f"This adds up {t7['n_towns']} towns with 20 or more sales, using each town's tax year 2027 limits "
        "(2027CH123.pdf). Towns on the 2027 revaluation list are left out, because Chapter 123 does not "
        "apply there in 2027 (rule K14). A sold home \"above the upper limit\" had a ratio high enough "
        "that, if its owner had the same numbers, they may have had grounds to appeal. This describes sold "
        "homes only. It is not a result for any one home.",
        "",
        md_table(t7_table(summary)),
        "",
        "More sold homes fall below the lower limit than above the upper one. That is expected: the state's "
        "average ratio covers more than single-family homes, and our single-family median ratio is usually "
        "below it (methodology V3). So the limits sit a little high for single-family homes.",
        "",
        "## Labeled towns and the 2027 revaluations",
        "",
        "Towns on the county's 2027 revaluation list get new assessments for tax year 2027. Our numbers use "
        "the assessments from before that change. Labeled towns on that list: "
        + (", ".join(f"{r.town} ({r.label})" for r in town_stats[
            town_stats["label"].isin([config.LABEL_REGRESSIVE, config.LABEL_PROGRESSIVE])
            & town_stats["revaluation_tax_year"].eq(config.T7_SKIP_REVAL_TAX_YEAR).fillna(False)].itertuples())
           or "none")
        + ". Their town pages should say the pattern describes the old assessments.",
        "",
        "## Why quarters use value, not sale price",
        "",
        f"If we split homes by sale price instead, homes that happened to sell cheap would land in the "
        f"lowest quarter *and* get a high ratio for the same reason. That makes towns look more regressive "
        f"than they are. In this data, sorting by sale price gives the lowest quarter a higher median ratio "
        f"than the highest quarter in {sp_n} of {n_tier_towns} towns (median gap {100 * sp_gap:.1f} points). "
        f"Sorting by value does so in {vp_n} of {n_tier_towns} (median gap {100 * vp_gap:.1f} points), which "
        "agrees with PRB. Both versions are in `town_tiers.csv` (`tier_basis`).",
        "",
        "## How to talk about these results",
        "",
        "- Say a town \"shows a regressive pattern in this data.\" Do not say a town \"is unfair\" or \"is breaking the law.\"",
        "- Labels use the point estimates (rule T5). Many small towns have wide 95% ranges, so check the range "
        "before making a strong claim.",
        "- \"Limited data\" towns have 20 to 39 sales. Treat their numbers with extra care.",
        "",
    ]
    path.write_text("\n".join(lines), encoding="utf-8")


# ---------------------------------------------------------------- main

def build_all(sales, towns, c8_removed, ch123):
    """Compute every output table in memory."""
    variants = sensitivity_inputs(sales, c8_removed)
    sens = sensitivity_table(variants, towns)
    town_stats = town_stats_table(sales, towns, sens)
    tiers = town_tiers_table(sales, town_stats, ch123)
    summary = county_summary(sales, town_stats, tiers, ch123)
    return {"town_stats": town_stats, "tiers": tiers, "summary": summary, "sens": sens}


def write_outputs(result, paths=None, today=None):
    """Save every output. paths overrides the config paths (tests)."""
    paths = paths or {"town_stats": config.TOWN_STATS_CSV, "tiers": config.TOWN_TIERS_CSV,
                      "summary": config.COUNTY_SUMMARY_JSON, "sens": config.SENSITIVITY_CSV,
                      "report": config.STATS_SUMMARY_MD}
    for p in paths.values():
        p.parent.mkdir(parents=True, exist_ok=True)
    result["town_stats"].to_csv(paths["town_stats"], index=False, lineterminator="\n")
    result["tiers"].to_csv(paths["tiers"], index=False, lineterminator="\n")
    result["sens"].to_csv(paths["sens"], index=False, lineterminator="\n")
    paths["summary"].write_text(json.dumps(result["summary"], indent=2) + "\n", encoding="utf-8")
    write_report(result["town_stats"], result["tiers"], result["summary"], path=paths["report"], today=today)


def main():
    """Build and save the town statistics."""
    sales, towns, c8_removed, ch123 = load_inputs()
    result = build_all(sales, towns, c8_removed, ch123)
    write_outputs(result)
    s = result["summary"]
    print(f"Town statistics from {s['n_sales']:,} {config.TOWN_STATS_SOURCE_FILE} sales in {s['n_towns']} towns.")
    print("Towns by label: " + ", ".join(f"{k} {v}" for k, v in s["towns_by_label"].items()))
    w = s["within_town"]
    print(f"Countywide (within towns): COD {w['cod']:.2f}, PRD {w['prd']:.4f}, PRB {w['prb']:.4f}")
    for p in [config.TOWN_STATS_CSV, config.TOWN_TIERS_CSV, config.COUNTY_SUMMARY_JSON,
              config.SENSITIVITY_CSV, config.STATS_SUMMARY_MD]:
        print(f"Saved {p.relative_to(config.ROOT)}")


if __name__ == "__main__":
    main()
