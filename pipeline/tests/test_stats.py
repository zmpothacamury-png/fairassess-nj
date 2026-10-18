"""Tests for the ratio statistics (pipeline/stats.py and pipeline/build_stats.py).

All data here is made up, so the right answer is known.
"""

import math

import numpy as np
import pandas as pd
import pytest

from pipeline import build_stats, config, run, stats

# ---------------------------------------------------------------- tiny dataset, worked by hand
#
# 5 sales. Ratio R = assessed / price.
#   sale  assessed   price     R
#   1      90,000   100,000   0.90
#   2     160,000   200,000   0.80
#   3     210,000   300,000   0.70
#   4     400,000   400,000   1.00
#   5     300,000   500,000   0.60
#
# Median: sorted R = 0.60, 0.70, 0.80, 0.90, 1.00 -> middle = 0.80
# Mean:   (0.90 + 0.80 + 0.70 + 1.00 + 0.60) / 5 = 4.00 / 5 = 0.80
# Weighted mean: (90k + 160k + 210k + 400k + 300k) / (100k + ... + 500k)
#              = 1,160,000 / 1,500,000 = 0.773333
# COD: |R - 0.80| = 0.10, 0, 0.10, 0.20, 0.20 -> sum 0.60 -> average 0.12
#      100 x 0.12 / 0.80 = 15.0
# PRD: 0.80 / 0.773333 = 1.20 / 1.16 = 1.034483
#
# PRB:
#   Value proxy V = 0.5 x (A / 0.80) + 0.5 x S
#     1: 0.5 x 112,500 + 0.5 x 100,000 = 106,250
#     2: 0.5 x 200,000 + 0.5 x 200,000 = 200,000
#     3: 0.5 x 262,500 + 0.5 x 300,000 = 281,250
#     4: 0.5 x 500,000 + 0.5 x 400,000 = 450,000
#     5: 0.5 x 375,000 + 0.5 x 500,000 = 437,500
#   x = ln(V) / 0.693 (calculator): 16.700649, 17.613380, 18.105338, 18.783554, 18.742903
#   y = (R - 0.80) / 0.80:           0.125,     0,         -0.125,    0.25,      -0.25
#   mean x = 17.989165, mean y = 0
#   x - mean x = -1.288516, -0.375785, 0.116173, 0.794389, 0.753738
#   Sxx = sum (x - mean x)^2 = 3.014158
#   Sxy = sum (x - mean x)(y - mean y)
#       = -0.161065 + 0 - 0.014522 + 0.198597 - 0.188435 = -0.165423 (rounded)
#   slope b = Sxy / Sxx = -0.165423 / 3.014158 = -0.054882   <- PRB
#   intercept = mean y - b x mean x = 0.987284
#   sum of squared residuals = 0.147171
#   SE = sqrt(0.147171 / (5 - 2) / 3.014158) = 0.127576
#   95% range = -0.054882 -/+ 1.96 x 0.127576 = -0.304930 to 0.195166
#
# Label (T5): n = 5 is under 20 -> "Not enough sales". If the same numbers
# came from 20+ sales: PRD 1.0345 > 1.03 and PRB -0.0549 < -0.05 -> "Regressive pattern".
#
# Quarters (T3), 5 sales -> sizes 2, 1, 1, 1 (extras go to the lower quarters).
#   By value proxy: 106,250 (0.90), 200,000 (0.80) | 281,250 (0.70) | 437,500 (0.60) | 450,000 (1.00)
#     medians: 0.85, 0.70, 0.60, 1.00
#   By sale price:  100k (0.90), 200k (0.80) | 300k (0.70) | 400k (1.00) | 500k (0.60)
#     medians: 0.85, 0.70, 1.00, 0.60
TINY_A = [90_000, 160_000, 210_000, 400_000, 300_000]
TINY_S = [100_000, 200_000, 300_000, 400_000, 500_000]
TINY_R = [a / s for a, s in zip(TINY_A, TINY_S)]


def test_tiny_level_measures():
    assert stats.median_ratio(TINY_R) == pytest.approx(0.80, abs=1e-4)
    assert stats.mean_ratio(TINY_R) == pytest.approx(0.80, abs=1e-4)
    assert stats.weighted_mean_ratio(TINY_A, TINY_S) == pytest.approx(0.7733, abs=1e-4)


def test_tiny_cod_and_prd():
    assert stats.cod(TINY_R) == pytest.approx(15.0, abs=1e-4)
    assert stats.prd(TINY_A, TINY_S) == pytest.approx(1.0345, abs=1e-4)


def test_tiny_value_proxy():
    assert stats.value_proxy(TINY_A, TINY_S) == pytest.approx([106_250, 200_000, 281_250, 450_000, 437_500])


def test_tiny_prb():
    p = stats.prb(TINY_A, TINY_S)
    assert p["n"] == 5
    assert p["prb"] == pytest.approx(-0.0549, abs=1e-4)
    assert p["intercept"] == pytest.approx(0.9873, abs=1e-4)
    assert p["se"] == pytest.approx(0.1276, abs=1e-4)
    assert p["ci_low"] == pytest.approx(-0.3049, abs=1e-4)
    assert p["ci_high"] == pytest.approx(0.1952, abs=1e-4)


def test_tiny_labels():
    m = stats.point_measures(TINY_A, TINY_S)
    assert stats.town_label(5, m["prd"], m["prb"]) == config.LABEL_NOT_ENOUGH
    assert stats.town_label(20, m["prd"], m["prb"]) == config.LABEL_REGRESSIVE


def test_tiny_tiers_both_bases():
    by_value = stats.value_tiers(TINY_A, TINY_S, basis="value_proxy")
    assert list(by_value["n"]) == [2, 1, 1, 1]
    assert list(by_value["median_ratio"]) == pytest.approx([0.85, 0.70, 0.60, 1.00])
    assert list(by_value["value_low"]) == pytest.approx([106_250, 281_250, 437_500, 450_000])
    by_price = stats.value_tiers(TINY_A, TINY_S, basis="sale_price")
    assert list(by_price["median_ratio"]) == pytest.approx([0.85, 0.70, 1.00, 0.60])
    assert list(by_price["sale_price_high"]) == pytest.approx([200_000, 300_000, 400_000, 500_000])


def test_tier_sizes_extras_go_low():
    assert stats.tier_sizes(10) == [3, 3, 2, 2]
    assert stats.tier_sizes(8) == [2, 2, 2, 2]
    assert stats.tier_sizes(23) == [6, 6, 6, 5]


def test_tiers_ties_keep_input_order():
    # 4 sales with the same price: input order decides the quarter.
    t = stats.value_tiers([100, 200, 300, 400], [1000, 1000, 1000, 1000], basis="sale_price")
    assert list(t["median_ratio"]) == pytest.approx([0.1, 0.2, 0.3, 0.4])


def test_even_median_is_average_of_middle_two():
    assert stats.median_ratio([0.6, 0.7, 0.9, 1.0]) == pytest.approx(0.8)


# ---------------------------------------------------------------- uniform, regressive, progressive

PRICES = np.geomspace(200_000, 2_000_000, 40)


def test_uniform_ratios():
    a = 0.75 * PRICES
    r = a / PRICES
    assert stats.cod(r) == pytest.approx(0.0, abs=1e-12)
    assert stats.prd(a, PRICES) == pytest.approx(1.0, abs=1e-12)
    assert stats.prb(a, PRICES)["prb"] == pytest.approx(0.0, abs=1e-12)


def test_regressive_pattern():
    # Cheaper homes get higher ratios: assessed grows slower than price.
    a = 30 * PRICES ** 0.75
    m = stats.point_measures(a, PRICES)
    assert m["prd"] > 1
    assert m["prb"] < 0
    assert stats.town_label(40, m["prd"], m["prb"]) == config.LABEL_REGRESSIVE


def test_progressive_pattern():
    # Expensive homes get higher ratios: assessed grows faster than price.
    a = 0.02 * PRICES ** 1.25
    m = stats.point_measures(a, PRICES)
    assert m["prd"] < 1
    assert m["prb"] > 0
    assert stats.town_label(40, m["prd"], m["prb"]) == config.LABEL_PROGRESSIVE


def test_prb_too_few_sales_is_nan():
    assert math.isnan(stats.prb([1, 2], [2, 3])["prb"])


# ---------------------------------------------------------------- bootstrap

def test_bootstrap_same_seed_same_result():
    rng = np.random.default_rng(1)
    s = rng.uniform(300_000, 1_500_000, 60)
    a = s * rng.uniform(0.6, 1.0, 60)
    first = stats.bootstrap_ci(a, s, n_resamples=500, seed=config.RANDOM_SEED)
    second = stats.bootstrap_ci(a, s, n_resamples=500, seed=config.RANDOM_SEED)
    assert first == second
    other = stats.bootstrap_ci(a, s, n_resamples=500, seed=config.RANDOM_SEED + 1)
    assert other != first


def test_bootstrap_range_contains_estimate():
    rng = np.random.default_rng(2)
    s = rng.uniform(300_000, 1_500_000, 80)
    a = s * rng.uniform(0.6, 1.0, 80)
    ci = stats.bootstrap_ci(a, s)
    r = a / s
    assert ci["median_ci_low"] <= stats.median_ratio(r) <= ci["median_ci_high"]
    assert ci["cod_ci_low"] <= stats.cod(r) <= ci["cod_ci_high"]
    assert ci["prd_ci_low"] <= stats.prd(a, s) <= ci["prd_ci_high"]


def test_bootstrap_uses_config_defaults():
    assert config.BOOTSTRAP_RESAMPLES == 2000
    assert config.RANDOM_SEED == 20261025


# ---------------------------------------------------------------- labels and flags

@pytest.mark.parametrize("n, reval, quality", [
    (0, False, config.QUALITY_NOT_ENOUGH),
    (19, False, config.QUALITY_NOT_ENOUGH),
    (19, True, config.QUALITY_RECENT_REVAL),
    (20, True, config.QUALITY_LIMITED),
    (39, False, config.QUALITY_LIMITED),
    (40, False, config.QUALITY_NORMAL),
])
def test_data_quality(n, reval, quality):
    assert stats.data_quality(n, reval) == quality


@pytest.mark.parametrize("prd, prb, label", [
    (1.04, -0.06, config.LABEL_REGRESSIVE),
    (1.03, -0.06, config.LABEL_MIXED),      # PRD must be ABOVE 1.03
    (0.97, 0.06, config.LABEL_PROGRESSIVE),
    (1.03, 0.05, config.LABEL_WITHIN),      # edges of both ranges count as within
    (0.98, -0.05, config.LABEL_WITHIN),
    (1.04, 0.00, config.LABEL_MIXED),
    (1.00, -0.08, config.LABEL_MIXED),
])
def test_town_label_rules(prd, prb, label):
    assert stats.town_label(50, prd, prb) == label


def test_under_minimum_is_not_enough_even_if_regressive():
    assert stats.town_label(19, 1.10, -0.20) == config.LABEL_NOT_ENOUGH
    assert stats.town_label(10, 1.10, -0.20, recent_revaluation=True) == config.LABEL_NOT_ENOUGH


def test_iaao_flags():
    f = stats.iaao_flags(15.0, 1.031, {"prb": -0.04, "ci_low": -0.25, "ci_high": -0.11})
    assert f == {"cod_meets_iaao": True, "cod_below_5": False, "prd_meets_iaao": False,
                 "prb_meets_iaao": True, "prb_ci_outside_0_10": True}
    f = stats.iaao_flags(4.0, 1.0, {"prb": 0.0, "ci_low": -0.12, "ci_high": 0.05})
    assert f["cod_below_5"] and not f["prb_ci_outside_0_10"]


# ---------------------------------------------------------------- build_stats on made-up towns

def town_sales(code, n, exponent, seed):
    """n made-up sales for one town. exponent < 1 makes a regressive town."""
    rng = np.random.default_rng(seed)
    s = np.round(np.geomspace(300_000, 1_500_000, n) * rng.uniform(0.97, 1.03, n))
    a = np.round(0.7 * 400_000 * (s / 400_000) ** exponent)
    return pd.DataFrame({"source_file": "Sales2026", "district_code": code,
                         "assessed_value": a, "sale_price": s})


TOWNS = pd.DataFrame({
    "district_code": ["0201", "0202", "0203", "0204", "0205", "0206"],
    "display_name": ["Regress", "Flat", "Small", "Small Reval", "Empty", "Reval 2027"],
    "slug": ["regress", "flat", "small", "small-reval", "empty", "reval-2027"],
    "revaluation_tax_year": [None, None, None, 2026, None, 2027],
})
# Made-up 2027 Chapter 123 limits. Town 0202's upper limit is above 100, so its trigger is 100.
CH123 = pd.DataFrame({
    "district_code": ["0201", "0202", "0203", "0204", "0205", "0206"],
    "average_ratio": [70.0, 90.0, 70.0, 70.0, 70.0, 70.0],
    "lower_limit": [59.5, 76.5, 59.5, 59.5, 59.5, 59.5],
    "upper_limit": [80.5, 103.5, 80.5, 80.5, 80.5, 80.5],
})
C8_REMOVED = pd.DataFrame(columns=["source_file", "district_code", "av_total", "sale_price"])


def made_up_sales():
    """Sales for the made-up towns: a regressive town, a flat town, two small towns, a 2027 reval town."""
    return pd.concat([
        town_sales("0201", 60, 0.7, 1),
        town_sales("0202", 25, 1.0, 2),
        town_sales("0203", 12, 0.7, 3),
        town_sales("0204", 8, 0.7, 4),
        town_sales("0206", 30, 0.7, 6),
    ], ignore_index=True)


@pytest.fixture(scope="module")
def built():
    return build_stats.build_all(made_up_sales(), TOWNS, C8_REMOVED, CH123)


def test_every_town_gets_a_row(built):
    t = built["town_stats"]
    assert list(t["district_code"]) == list(TOWNS["district_code"])
    assert list(t["n_sales"]) == [60, 25, 12, 8, 0, 30]


def test_small_towns_labeled_and_unranked(built):
    t = built["town_stats"].set_index("district_code")
    assert t.loc["0203", "label"] == config.LABEL_NOT_ENOUGH
    assert t.loc["0203", "data_quality"] == config.QUALITY_NOT_ENOUGH
    assert t.loc["0204", "data_quality"] == config.QUALITY_RECENT_REVAL
    assert t.loc["0205", "data_quality"] == config.QUALITY_NOT_ENOUGH
    for code in ["0203", "0204", "0205"]:
        assert pd.isna(t.loc[code, "prb_rank"])
        assert pd.isna(t.loc[code, "prd"])  # statistics hidden


def test_ranked_towns(built):
    t = built["town_stats"].set_index("district_code")
    assert t.loc["0201", "label"] == config.LABEL_REGRESSIVE
    assert t.loc["0202", "prb_rank"] == 3  # flat town ranks after both regressive towns
    assert set(t.loc[["0201", "0206"], "prb_rank"]) == {1, 2}
    assert t.loc["0202", "data_quality"] == config.QUALITY_LIMITED
    assert t.loc["0201", "data_quality"] == config.QUALITY_NORMAL


def test_tiers_only_for_shown_towns(built):
    tiers = built["tiers"]
    assert sorted(tiers["district_code"].unique()) == ["0201", "0202", "0206"]
    assert len(tiers) == 3 * 2 * config.N_TIERS  # 3 towns x 2 bases x 4 quarters
    regress = tiers[(tiers["district_code"] == "0201") & (tiers["tier_basis"] == "value_proxy")]
    assert list(regress["n"]) == [15, 15, 15, 15]
    assert regress["median_ratio"].is_monotonic_decreasing  # cheaper quarter, higher ratio


def test_county_summary_counts(built):
    s = built["summary"]
    assert s["n_sales"] == 135
    assert s["n_towns"] == 6
    assert sum(s["towns_by_label"].values()) == 6
    assert s["towns_by_label"][config.LABEL_NOT_ENOUGH] == 3
    assert s["ranked_towns"] == 3
    assert s["within_town"]["median_ratio"] == pytest.approx(1.0, abs=0.02)


def test_within_town_removes_level_differences():
    # Two towns, each perfectly even, but at 50% and 100%: pooled COD is high,
    # within-town COD is 0.
    s = pd.Series([400_000.0, 600_000.0, 800_000.0] * 2)
    sales = pd.DataFrame({"district_code": ["A"] * 3 + ["B"] * 3, "sale_price": s,
                          "assessed_value": s * np.array([0.5] * 3 + [1.0] * 3)})
    a, p = build_stats.within_town_values(sales)
    assert stats.cod(a / p) == pytest.approx(0.0, abs=1e-12)
    assert stats.cod(sales["assessed_value"] / sales["sale_price"]) > 10


def test_sensitivity_has_three_versions(built):
    sens = built["sens"]
    assert set(sens["variant"]) == set(build_stats.VARIANTS)
    assert len(sens) == len(TOWNS) * len(build_stats.VARIANTS)


def test_build_is_repeatable(built):
    again = build_stats.build_all(made_up_sales(), TOWNS, C8_REMOVED, CH123)
    pd.testing.assert_frame_equal(again["town_stats"], built["town_stats"])
    pd.testing.assert_frame_equal(again["tiers"], built["tiers"])
    assert again["summary"] == built["summary"]


# ---------------------------------------------------------------- T7 (Chapter 123 shares by quarter)

def test_ch123_triggers_cap_at_100():
    assert stats.ch123_triggers(76.47, 103.47) == (76.47, 100.0)  # Allendale 2027: upper capped
    assert stats.ch123_triggers(101.58, 137.43) == (100.0, 100.0)  # Rockleigh 2027: both capped
    assert stats.ch123_triggers(42.72, 57.80) == (42.72, 57.80)


def test_ch123_shares_by_hand():
    # Triggers L* = 60, U* = 80. Ratios 0.50, 0.60, 0.70, 0.80, 0.85:
    # above 80 -> only 85 (80 is not ABOVE) = 1 of 5 = 0.20
    # below 60 -> only 50 (60 is not BELOW) = 1 of 5 = 0.20
    sh = stats.ch123_shares([0.50, 0.60, 0.70, 0.80, 0.85], 60.0, 80.0)
    assert sh == {"n": 5, "n_above": 1, "n_below": 1, "share_above": 0.2, "share_below": 0.2}


def test_tier_numbers_match_value_tiers():
    tiers = stats.tier_numbers(TINY_A, TINY_S)
    # Value proxy order: sale 1, 2 | 3 | 5 | 4  (see the hand-worked block at the top)
    assert list(tiers) == [1, 1, 2, 4, 3]


def test_t7_columns(built):
    tiers = built["tiers"]
    main = tiers[tiers["tier_basis"] == config.TIER_BASIS_MAIN].set_index(["district_code", "tier"])
    # 2027 revaluation town: T7 left blank (K14). Median ratios still shown.
    assert main.loc["0206", "share_above_upper"].isna().all()
    assert main.loc["0206", "median_ratio"].notna().all()
    # Town 0202's printed upper limit is 103.5, so the trigger is 100.
    assert (main.loc["0202", "upper_trigger"] == 100.0).all()
    # Shares match counts.
    town = main.loc["0201"]
    assert list(town["share_above_upper"]) == pytest.approx(list(town["n_above_upper"] / town["n"]), abs=1e-6)


def test_t7_county_adds_up(built):
    t7 = built["summary"]["t7_value_quarters"]
    assert t7["n_towns"] == 2  # 0201 and 0202; 0206 is a 2027 revaluation town
    tiers = built["tiers"]
    main = tiers[(tiers["tier_basis"] == config.TIER_BASIS_MAIN) & tiers["district_code"].isin(["0201", "0202"])]
    assert sum(r["n_sales"] for r in t7["by_tier"]) == int(main["n"].sum()) == 85
    assert sum(r["n_above_upper"] for r in t7["by_tier"]) == int(main["n_above_upper"].sum())


def test_report_written(built, tmp_path):
    paths = {k: tmp_path / f"{k}.out" for k in ["town_stats", "tiers", "summary", "sens", "report"]}
    build_stats.write_outputs(built, paths=paths, today="2026-10-15")
    text = paths["report"].read_text(encoding="utf-8")
    assert "It is not legal, tax, or appraisal advice." in text
    assert "rule T7" in text
    assert "is unfair" not in text.replace('"is unfair"', "")


def test_run_has_stats_stage():
    names = [name for name, _, _ in run.STAGES]
    assert names.index("stats") == names.index("clean") + 1
