"""Tests for the Python reference checker (pipeline/checker_reference.py).

The 3 hand-worked cases are the same ones worked step by step in
site/lib/checker/checker.test.ts (see the comments there). The last tests read
the real site files and are skipped if they have not been built yet.
"""

import json

import pytest

from pipeline import checker_reference as cr
from pipeline import config, run

HAND_INDEX = {"base_month": "2026-06", "months": [
    {"month": "2025-10", "kept": True, "index": 0.9083},
    {"month": "2026-06", "kept": True, "index": 1.0},
]}


def same_value_town(ar, lower, upper, assessed, prices, rate=2.5, reval=None):
    """Made-up town: every comp assessed at `assessed`, sold June 15, 2026."""
    return cr.fake_town("test-hand", ar, lower, upper, cr.same_value_comps(assessed, prices), reval=reval, rate=rate)


def test_hand_case_a_strong_grounds():
    """Case A: middle $405,000, range $395,000 to $415,000, h 98.77% > 92 -> strong; saves $1,900."""
    town = same_value_town(80.0, 68.0, 92.0, 400_000,
                           [420_000, 415_000, 410_000, 405_000, 400_000, 395_000, 390_000, 385_000])
    r = cr.run_checker(town, HAND_INDEX, 400_000)
    assert (r["band_percent"], r["n_comps"]) == (15, 8)
    assert (r["market_value_low"], r["market_value_mid"], r["market_value_high"]) == (395_000, 405_000, 415_000)
    assert r["homeowner_ratio"] == pytest.approx(98.765, abs=0.001)
    assert (r["verdict"], r["strength"]) == ("may-have-grounds", "strong")
    assert (r["corrected_assessment"], r["yearly_savings"]) == (324_000, 1_900)
    assert r["filing_fee"] == 25 and r["deadline"] == "April 1, 2027" and r["warnings"] == []


def test_hand_case_b_widened_weighted_within():
    """Case B: widened to 25%, 6 comps, time-adjusted; middle $560,000 -> h 89.29%, within range."""
    town = cr.fake_town("test-b", 90.0, 76.5, 103.5, [
        ("2025-10-15", 454_150, 450_000), ("2025-10-15", 635_810, 600_000), ("2026-06-10", 560_000, 500_000),
        ("2026-06-20", 600_000, 550_000), ("2026-06-10", 470_000, 400_000), ("2026-06-10", 650_000, 625_000),
        ("2026-06-10", 300_000, 300_000)])
    r = cr.run_checker(town, HAND_INDEX, 500_000)
    assert (r["count_at_first_band"], r["band_percent"], r["n_comps"]) == (3, 25, 6)
    by_assessed = {c["assessed_value"]: c for c in r["comps"]}
    assert by_assessed[450_000]["adjusted_price"] == 500_000
    assert by_assessed[600_000]["adjusted_price"] == 700_000
    assert by_assessed[600_000]["weight"] == pytest.approx(0.3082, abs=1e-4)
    assert (r["market_value_low"], r["market_value_mid"], r["market_value_high"]) == (545_455, 560_000, 583_333)
    assert r["upper_trigger"] == 100.0
    assert r["verdict"] == "within-range"
    assert r["warnings"] == ["limited-data", "widened-band"]


def test_hand_case_c_average_ratio_over_100():
    """Case C: AR 110 -> AR* = U* = 100; h 103.70% is inside the printed range but above 100 -> grounds; $300."""
    town = same_value_town(110.0, 93.5, 126.5, 420_000,
                           [420_000, 415_000, 410_000, 405_000, 400_000, 395_000, 390_000, 380_000], rate=2.0)
    r = cr.run_checker(town, HAND_INDEX, 420_000)
    assert r["market_value_mid"] == 405_000
    assert (r["verdict"], r["strength"]) == ("may-have-grounds", "strong")
    assert (r["average_ratio_used"], r["upper_trigger"], r["lower_trigger"]) == (100.0, 100.0, 93.5)
    assert (r["corrected_assessment"], r["yearly_savings"]) == (405_000, 300)


def test_limits_are_inclusive():
    """A ratio exactly on a limit is within range; a hair past it is not (K11)."""
    ch = {"average_ratio": 80.0, "lower_limit": 68.0, "upper_limit": 92.0}
    assert cr.ch123_position(460_000, 500_000, ch)[1] == "within"
    assert cr.ch123_position(340_000, 500_000, ch)[1] == "within"
    assert cr.ch123_position(460_050, 500_000, ch)[1] == "above"
    assert cr.ch123_position(339_950, 500_000, ch)[1] == "below"


def test_too_few_comps_and_widening():
    """K2/K3: under 8 at 15% widens; under 5 at 25% is not enough data."""
    four = cr.fake_town("t", 80.0, 68.0, 92.0, [("2026-06-15", 500_000, a) for a in (400_000, 420_000, 450_000, 480_000)])
    assert cr.run_checker(four, HAND_INDEX, 400_000)["verdict"] == "not-enough-data"
    five = cr.fake_town("t", 80.0, 68.0, 92.0,
                        [("2026-06-15", 500_000, a) for a in (400_000, 420_000, 450_000, 480_000, 500_000)])
    r = cr.run_checker(five, HAND_INDEX, 400_000)
    assert (r["band_percent"], r["n_comps"], r["verdict"]) == (25, 5, "within-range")


def test_reval_2027_gives_no_chapter_123_result():
    """K14: estimate but no Chapter 123 result, May 1 deadline."""
    town = same_value_town(80.0, 68.0, 92.0, 460_000, [500_000] * 8, reval=2027)
    r = cr.run_checker(town, HAND_INDEX, 460_000, own_estimate=450_000)
    assert r["verdict"] == "revaluation-no-test"
    assert r["market_value_mid"] == 500_000 and r["own_position"] is None
    assert r["deadline"] == "May 1, 2027"


@pytest.mark.parametrize("text,code", [
    ("", "blank"), ("abc", "not-a-number"), ("-450000", "negative"), ("450000.5", "not-whole"),
    ("9999", "too-small"), ("20000001", "too-large"), ("$450,000", None), ("450000.00", None),
])
def test_parse_money(text, code):
    """K1: friendly parsing of typed dollar amounts."""
    assert cr.parse_money(text, required=True)[1] == code


def test_fees():
    """K13: Form A-1 fee table boundaries."""
    assert [cr.fee_for(v) for v in (149_999, 150_000, 500_000, 1_000_000)] == [5, 25, 100, 150]


def test_fixtures_stage_runs_after_export():
    """The fixtures stage reads the export stage's files, so it must come last."""
    names = [name for name, _, _ in run.STAGES]
    assert names[-2:] == ["export", "fixtures"]


needs_site_data = pytest.mark.skipif(not config.PRICE_INDEX_JSON.exists(), reason="site data not built yet")


@needs_site_data
def test_fixtures_are_up_to_date_and_big_enough():
    """The saved fixtures equal a fresh build (same seed, same data), with 30+ cases."""
    if not config.CHECKER_FIXTURES_JSON.exists():
        pytest.skip("fixtures not built yet")
    saved = json.loads(config.CHECKER_FIXTURES_JSON.read_text(encoding="utf-8"))
    fresh = json.loads(json.dumps(cr.build_fixtures()))
    assert saved == fresh
    assert len(saved["cases"]) >= 30
    verdicts = {c["expected"].get("verdict") for c in saved["cases"]}
    assert {"may-have-grounds", "within-range", "possibly-under-assessed", "not-enough-data"} <= verdicts


def test_sweep_values_step_one_percent():
    """Section 7 sweep: values run from the lowest to the highest comp assessment, 1% apart."""
    town = cr.fake_town("t", 80.0, 68.0, 92.0, [("2026-06-15", 500_000, 100_000), ("2026-06-15", 500_000, 103_000)])
    assert cr.sweep_values(town) == [100_000, 101_000, 102_010]
    assert cr.sweep_values(cr.fake_town("t", 80.0, 68.0, 92.0, [])) == []


@needs_site_data
def test_sweep_file_matches_a_fresh_run():
    """data/processed/checker_grounds_sweep.csv equals a fresh sweep, and the summary counts add up."""
    if not config.CHECKER_SWEEP_CSV.exists():
        pytest.skip("sweep not built yet")
    import pandas as pd
    saved = pd.read_csv(config.CHECKER_SWEEP_CSV)
    fresh = cr.grounds_sweep(cr.town_slugs(), cr.load_price_index())
    assert len(saved) == len(fresh) == config.N_TOWNS
    assert saved["n_may_have_grounds"].tolist() == fresh["n_may_have_grounds"].tolist()
    assert (saved["n_values_tried"] == saved.filter(regex="^n_(may|within|possibly|not|reval)").sum(axis=1)).all()
    summary = cr.sweep_summary(saved)
    assert 0 <= summary["towns_with_any_grounds"] <= summary["towns_with_a_test_result"]
