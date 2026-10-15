"""Tests for the validation against state numbers (pipeline/validate.py).

Most data here is made up, so the right answer is known. The last tests use
the real pipeline files and are skipped if they have not been built yet.
"""

import pandas as pd
import pytest

from pipeline import config, run, validate

# ---------------------------------------------------------------- small formulas, worked by hand
#
# Mean deviation: ratios 80, 90, 100, 130. Mean = 400 / 4 = 100.
# |R - 100| = 20, 10, 0, 30 -> average 15 -> 100 x 15 / 100 = 15.0


def test_mean_deviation_by_hand():
    assert validate.mean_deviation([80, 90, 100, 130]) == pytest.approx(15.0)


def test_mean_deviation_uniform_is_zero():
    assert validate.mean_deviation([0.7, 0.7, 0.7]) == pytest.approx(0.0, abs=1e-9)


def test_weighted_ratio_is_total_assessed_over_total_price():
    g = pd.DataFrame({"assessed": [50_000.0, 300_000.0], "sale_price": [100_000.0, 400_000.0]})
    assert validate.weighted_ratio(g) == pytest.approx(350_000 / 500_000)
    assert validate.weighted_ratio(g.iloc[0:0]) is None


def test_one_year_true_value_by_class_and_fallbacks():
    # 800,000 homes at 1.00 + 200,000 other at 0.50 = 800,000 + 400,000.
    assert validate.one_year_true_value(1_000_000, 800_000, 1.0, 0.5) == pytest.approx(1_200_000)
    # No other-property sales: everything valued at the home ratio.
    assert validate.one_year_true_value(1_000_000, 800_000, 0.5, None) == pytest.approx(2_000_000)
    # No home sales: everything valued at the other ratio.
    assert validate.one_year_true_value(1_000_000, 800_000, None, 0.5) == pytest.approx(2_000_000)
    # No sales at all.
    assert validate.one_year_true_value(1_000_000, 800_000, None, None) is None
    # Residential total above the town total (rounding): other part is never negative.
    assert validate.one_year_true_value(1_000_000, 1_000_100, 1.0, 0.5) == pytest.approx(1_000_100)


def test_two_year_averaging_and_backing_it_out():
    # Court opinion: aggregate true value = (this year's one-year value + last year's aggregate) / 2.
    assert validate.averaged_true_value(1_250_000, 1_000_000) == pytest.approx(1_125_000)
    assert validate.state_one_year_true_value(1_125_000, 1_000_000) == pytest.approx(1_250_000)


# ---------------------------------------------------------------- made-up towns
#
# Town 0201 (Alpha): usable sales
#   class 2: 80,000 / 100,000; 90,000 / 100,000; multi-lot 130,000 total / 100,000
#            -> weighted class-2 ratio = 300,000 / 300,000 = 1.00
#   class 4A: 50,000 / 100,000 -> other ratio 0.50
#   plain average = (80 + 90 + 130 + 50) / 4 = 87.5
#   Table 2026: assessed 1,000,000; homes 8 x 100,000 = 800,000; other 200,000
#   ours one-year TV = 800,000 / 1.00 + 200,000 / 0.50 = 1,200,000 -> 83.33
#   state: TV 2025 1,000,000, TV 2026 1,125,000 -> one-year 1,250,000 -> 80.00
#          published = 1,000,000 / 1,125,000 = 88.89
#   ours two-year = 1,000,000 / ((1,200,000 + 1,000,000) / 2) = 90.91
# Town 0202 (Beta): one class-2 sale at 50; no other sales (fallback)
#   assessed 600,000 (homes 400,000) -> TV = 1,200,000 -> 50.00
#   state: TV 2025 1,000,000, TV 2026 800,000 -> one-year 600,000 -> 100.00 (gap -50, flagged)
# Town 0203 (Gamma): no sales.

def _sr1a_row(code, cls, assessed, price, un="U", total=None, verified=None, county="02", ay=26):
    return {"county_code": county, "district_code": code, "property_class": cls, "un_type": un,
            "av_total": assessed, "total_assessment": assessed if total is None else total,
            "price_reported": price, "price_verified": price if verified is None else verified,
            "assess_year": ay, "recorded_date": pd.Timestamp("2026-03-01"), "sr_nu_code": "  "}


def make_inputs():
    """3 made-up towns (see the worked numbers above)."""
    sr1a = pd.DataFrame([
        _sr1a_row("0201", "2", 80_000, 100_000),
        _sr1a_row("0201", "2  ", 90_000, 100_000),          # class with spaces
        _sr1a_row("0201", "4A", 50_000, 100_000),           # class 4 counts
        _sr1a_row("0201", "2", 10_000, 100_000, total=130_000),  # multi-lot: total assessment used
        _sr1a_row("0201", "2", 50_000, 100_000, un="N"),    # not usable: dropped
        _sr1a_row("0201", "15C", 50_000, 100_000),          # exempt class 15 (not class 1): dropped
        _sr1a_row("0201", "2", 50_000, 100_000, county="03"),  # other county: dropped
        _sr1a_row("0202", "2", 50_000, 0, verified=0),      # verified price 0 -> reported (set below)
    ])
    sr1a.loc[7, "price_reported"] = 100_000
    sr1a.loc[4, "sr_nu_code"] = "27"                         # the non-usable sale is category 27
    clean = pd.DataFrame({"district_code": ["0201", "0201", "0202"], "ratio": [0.7, 0.75, 0.5],
                          "sale_price": [100_000, 100_000, 100_000]})
    codes = ["0201", "0202", "0203"]
    towns = pd.DataFrame({"district_code": codes, "display_name": ["Alpha", "Beta", "Gamma"],
                          "revaluation_tax_year": [None, 2026, None]})
    town_stats = pd.DataFrame({"district_code": codes, "cod": [12.0, None, None]})
    published = [round(100 * 1_000_000 / 1_125_000, 2), 75.0, 70.0]
    ch123 = pd.DataFrame({"district_code": codes, "average_ratio": published})
    state_cod = pd.DataFrame({"district_code": ["0201", "0202", "0203", "0201"],
                              "year": [2026, 2026, 2026, 2025], "n_total": [4, 1, 0, 9],
                              "stratified_class2": [17.78, 0.0, None, 99.0]})
    avg_res = pd.DataFrame({"district_code": codes, "n_sales": [3, 1, 0], "line_items": [8, 1, 5],
                            "avg_assessment": [100_000.0, 400_000.0, 100_000.0],
                            "avg_sale_price": [100_000.0, 100_000.0, 0.0]})
    dir_ratios = pd.DataFrame({"district_code": codes, "year": [2026] * 3, "director_ratio": published})
    tev = pd.DataFrame({
        "year": [2025] * 3 + [2026] * 3, "district_code": codes * 2,
        "agg_assessed": [900_000] * 3 + [1_000_000, 600_000, 700_000],
        "average_ratio": [90.0] * 3 + published,
        "agg_true_value": [1_000_000] * 3 + [1_125_000, 800_000, 1_000_000],
    })
    return {"sr1a": sr1a, "clean": clean, "towns": towns, "town_stats": town_stats, "ch123": ch123,
            "state_cod": state_cod, "avg_res": avg_res, "dir_ratios": dir_ratios, "tev": tev}


def test_state_style_sales_filters_and_uses_total_assessment():
    s = validate.state_style_sales(make_inputs()["sr1a"])
    assert sorted(s["district_code"]) == ["0201"] * 4 + ["0202"]
    a = s[s["district_code"] == "0201"]
    assert sorted(a["ratio_pct"].round(6)) == [50.0, 80.0, 90.0, 130.0]
    assert sorted(a["ratio_main_pct"].round(6)) == [10.0, 50.0, 80.0, 90.0]
    b = s[s["district_code"] == "0202"]
    assert b["ratio_pct"].iloc[0] == pytest.approx(50.0)  # reported price used when verified is 0


def test_validation_table_v4_numbers():
    t = validate.validation_table(make_inputs()).set_index("district_code")
    assert t.loc["0201", "class2_weighted_ratio"] == 100.0
    assert t.loc["0201", "other_weighted_ratio"] == 50.0
    assert t.loc["0201", "residential_share_assessed"] == 0.8
    assert t.loc["0201", "our_one_year_true_value"] == 1_200_000
    assert t.loc["0201", "our_ratio_state_style"] == 83.33
    assert t.loc["0201", "state_one_year_true_value"] == 1_250_000
    assert t.loc["0201", "state_one_year_ratio"] == 80.0
    assert t.loc["0201", "diff_one_year_pp"] == 3.33
    assert not t.loc["0201", "flag_over_5pp"]
    assert t.loc["0201", "state_average_ratio"] == 88.89
    assert t.loc["0201", "our_average_ratio_two_year"] == 90.91
    assert t.loc["0201", "diff_two_year_pp"] == 2.02
    assert t.loc["0201", "averaging_effect_pp"] == 8.89
    assert t.loc["0201", "our_simple_mean_ratio"] == 87.5
    assert t.loc["0201", "diff_simple_mean_pp"] == -1.39
    # 0202: no other-property sales -> everything at the home ratio 0.50.
    assert t.loc["0202", "our_ratio_state_style"] == 50.0
    assert t.loc["0202", "state_one_year_ratio"] == 100.0
    assert t.loc["0202", "flag_over_5pp"] and t.loc["0202", "flag_rank"] == 1
    assert t.loc["0202", "investigated"]
    # 0203: no sales -> blanks, never flagged, still in the table.
    assert pd.isna(t.loc["0203", "our_ratio_state_style"])
    assert t.loc["0203", "state_one_year_ratio"] == 70.0
    assert not t.loc["0203", "flag_over_5pp"] and not t.loc["0203", "v3_flag_over_10pp"]
    assert t.loc["0203", "our_n_classes_1_2_4"] == 0 and t.loc["0203", "counts_match"]


def test_validation_table_other_checks():
    t = validate.validation_table(make_inputs()).set_index("district_code")
    assert t.loc["0201", "our_n_classes_1_2_4"] == 4 and t.loc["0201", "counts_match"]
    assert t.loc["0201", "n_class4"] == 1 and t.loc["0201", "n_multi_lot"] == 1
    assert t.loc["0201", "n_nonusable_cat27"] == 1 and t.loc["0202", "n_nonusable_cat27"] == 0
    assert t.loc["0201", "first_recorded"] == "2026-03-01"
    # V2: class-2 ratios 80, 90, 130 -> mean 100, |dev| 20, 10, 30 -> 20.0; state 17.78.
    assert t.loc["0201", "our_cod_state_style"] == 20.0
    assert t.loc["0201", "diff_cod"] == pytest.approx(2.22)
    assert not t.loc["0201", "v2_pass"]
    assert pd.isna(t.loc["0203", "v2_pass"])
    # V3: clean median(0.70, 0.75) = 72.5 vs 88.89 -> gap -16.39 -> flag.
    assert t.loc["0201", "our_class2_median"] == 72.5 and t.loc["0201", "v3_flag_over_10pp"]
    assert t.loc["0201", "our_iaao_cod"] == 12.0


def test_flag_threshold_is_strictly_greater(monkeypatch):
    monkeypatch.setattr(config, "VALIDATION_FLAG_PP", 50.0)
    t = validate.validation_table(make_inputs()).set_index("district_code")
    assert not t.loc["0202", "flag_over_5pp"]  # gap of exactly 50 is not "more than 50"


def test_every_town_appears_once():
    inputs = make_inputs()
    t = validate.validation_table(inputs)
    assert list(t["district_code"]) == list(inputs["towns"]["district_code"])


def test_summary_and_headline():
    t = validate.validation_table(make_inputs())
    s = validate.summarize(t)
    assert s["n_towns"] == 3 and s["n_one_year"] == 2
    assert s["one_year_within_flag"] == 1 and s["n_flagged"] == 1
    assert s["max_abs_one_year_town"] == "Beta"
    assert s["director_equals_ch123"] == 3 and s["tev_equals_ch123"] == 3
    assert validate.headline(s).startswith("For 1 of 2 towns, our ratio was within 5 points of the state's")


def test_report_keeps_hand_written_text(tmp_path):
    path = tmp_path / "validation.md"
    path.write_text("# Title\n\nHand intro.\n", encoding="utf-8")
    t = validate.validation_table(make_inputs())
    s = validate.summarize(t)
    validate.write_report(t, s, path=path)
    path.write_text(path.read_text(encoding="utf-8") + "\n## Hand section after\n", encoding="utf-8")
    first = path.read_text(encoding="utf-8")
    validate.write_report(t, s, path=path)
    second = path.read_text(encoding="utf-8")
    assert first == second
    assert second.startswith("# Title\n\nHand intro.")
    assert second.count(validate.BEGIN_MARK) == 1 and "## Hand section after" in second
    assert "Alpha" in second and "Gamma" in second


def test_run_has_validate_stage_after_stats():
    names = [name for name, _, _ in run.STAGES]
    assert names.index("validate") == names.index("stats") + 1


# ---------------------------------------------------------------- real pipeline files

REAL_FILES = [config.SR1A_PARQUET, config.SALES_CLEAN_CSV, config.TOWN_STATS_CSV, config.STATE_COD_CSV,
              config.TEV_CSV]
needs_real = pytest.mark.skipif(not all(p.exists() for p in REAL_FILES),
                                reason="pipeline outputs not built yet")


@needs_real
def test_real_second_run_gives_same_files(tmp_path):
    """validate.py reproduces the same table and report block on a second run."""
    outputs = []
    for i in range(2):
        t = validate.validation_table(validate.load_inputs())
        s = validate.summarize(t)
        csv = tmp_path / f"v{i}.csv"
        md = tmp_path / f"v{i}.md"
        t.to_csv(csv, index=False, lineterminator="\n")
        validate.write_report(t, s, path=md)
        outputs.append((csv.read_bytes(), md.read_bytes()))
    assert outputs[0] == outputs[1]


@needs_real
def test_real_all_70_towns_in_validation_csv():
    t = pd.read_csv(config.VALIDATION_CSV, dtype={"district_code": str})
    towns = pd.read_csv(config.TOWNS_CSV, dtype={"district_code": str})
    assert len(t) == config.N_TOWNS == t["district_code"].nunique()
    assert set(t["district_code"]) == set(towns["district_code"])


@needs_real
def test_real_saved_csv_matches_fresh_run():
    """The saved validation.csv is what the code makes now (no hand edits)."""
    t = validate.validation_table(validate.load_inputs())
    saved = pd.read_csv(config.VALIDATION_CSV, dtype={"district_code": str})
    fresh = pd.read_csv(pd.io.common.StringIO(t.to_csv(index=False)), dtype={"district_code": str})
    pd.testing.assert_frame_equal(saved, fresh)


@needs_real
def test_real_same_sales_as_state_and_v2():
    """Our usable class 1+2+4 counts equal the state's in every town, and V2 passes where it can be checked."""
    t = pd.read_csv(config.VALIDATION_CSV, dtype={"district_code": str})
    assert t["counts_match"].all()
    v2 = t["v2_pass"].dropna()
    assert len(v2) > 0 and v2.astype(bool).all()
    assert (t["state_director_ratio_2026"] == t["state_average_ratio"]).all()


@needs_real
def test_real_state_two_year_rule_reproduces_published_ratio():
    """Published ratio = 2026 assessed / ((state one-year TV + 2025 TV) / 2), to the state's rounding."""
    t = pd.read_csv(config.VALIDATION_CSV, dtype={"district_code": str})
    rebuilt = 100 * t["agg_assessed_2026"] / ((t["state_one_year_true_value"] + t["agg_true_value_2025"]) / 2)
    assert ((rebuilt - t["state_average_ratio"]).abs() < 0.01).all()
