"""Tests for the cleaning rules C1 to C10 (pipeline/clean.py).

All data here is made up, so the right answer is known for every row.
"""

from datetime import datetime

import pandas as pd
import pytest

from pipeline import clean, config, run

REVAL_TOWNS = ["0202"]  # made-up: town 0202 is on the 2026 revaluation list
TOWNS = pd.DataFrame({
    "district_code": ["0201", "0202", "0203", "0204"],
    "display_name": ["Town A", "Town B", "Town Forty", "Town Hundred"],
    "slug": ["town-a", "town-b", "town-forty", "town-hundred"],
    "revaluation_tax_year": [None, 2026, None, None],
})


def sale(record_id, **overrides):
    """One made-up SR1A row that passes every rule unless overridden."""
    row = {
        "source_file": "Sales2026", "county_code": "02", "district_code": "0201",
        "property_class": "2", "qual_code": None, "un_type": "U",
        "line_md5": f"md5-{record_id}", "price_verified": 500_000, "price_reported": 500_000,
        "av_total": 400_000, "total_assessment": 400_000, "assess_year": 26,
        "deed_date": datetime(2026, 1, 15), "recorded_date": datetime(2026, 2, 1),
        "record_id": record_id, "superseded_by_newer_file": False,
    }
    row.update(overrides)
    return row


def frame(rows):
    """Build a DataFrame with the same types the parquet file uses."""
    df = pd.DataFrame(rows)
    for col in ["price_verified", "price_reported", "av_total", "total_assessment", "assess_year"]:
        df[col] = df[col].astype("Int64")
    return df


# One row that breaks each rule, plus good rows. Key = rule that must remove it.
BAD_ROWS = {
    "C1": sale("bad-county", county_code="03"),
    "C2": sale("bad-class", property_class="4A"),
    "C10": sale("bad-condo", qual_code="C0101"),
    "C3": sale("bad-nonusable", un_type="N"),
    "C7": sale("bad-dup", line_md5="md5-good-1"),  # same line as good-1, comes later
    "C4": sale("bad-cheap", price_verified=49_999, price_reported=49_999),
    "C5": sale("bad-zero-av", av_total=0, total_assessment=0),
    "C6": sale("bad-multilot", total_assessment=450_000),
    "C9": sale("bad-old-basis", district_code="0202", assess_year=25),
}
GOOD_ROWS = [
    sale("good-1"),
    sale("good-2", qual_code="H"),  # a non-condo qualifier stays
    sale("good-3", price_verified=50_000, price_reported=50_000,  # exactly the floor stays
         av_total=40_000, total_assessment=40_000),
    sale("good-4", assess_year=25),  # old basis is fine outside revaluation towns
    sale("good-5", district_code="0202", assess_year=26),  # new basis in a revaluation town
]


def rule_input():
    """Good rows first (so good-1 is the 'earlier' copy for C7), then the bad rows."""
    return frame(GOOD_ROWS + list(BAD_ROWS.values()))


def apply(rule_id, df):
    """Run one rule with the arguments it needs."""
    if rule_id == "C9":
        return clean.RULES[rule_id](df, REVAL_TOWNS)
    return clean.RULES[rule_id](df)


# ---------------------------------------------------------------- each rule on its own

@pytest.mark.parametrize("rule_id", list(BAD_ROWS))
def test_each_rule_removes_only_its_row(rule_id):
    df = clean.prepare_input(rule_input())
    kept, removed = apply(rule_id, df)
    assert set(removed["record_id"]) == {BAD_ROWS[rule_id]["record_id"]}
    assert len(kept) + len(removed) == len(df)


def test_c1_on_raw_county_codes():
    kept, removed = clean.rule_c1_county(rule_input())
    assert list(removed["record_id"]) == ["bad-county"]


def test_c10_lowercase_c_is_a_condo():
    df = frame([sale("upper", qual_code="C0101"), sale("lower", qual_code="c4293"),
                sale("other", qual_code="H"), sale("blank")])
    kept, removed = clean.rule_c10_condo(df)
    assert set(removed["record_id"]) == {"upper", "lower"}


def test_c7_keeps_the_first_copy():
    kept, removed = clean.rule_c7_duplicates(rule_input())
    assert "good-1" in set(kept["record_id"])
    assert list(removed["record_id"]) == ["bad-dup"]


def test_c9_keeps_other_towns_old_basis():
    kept, removed = clean.rule_c9_revaluation(rule_input(), REVAL_TOWNS)
    assert {"good-4", "good-5"} <= set(kept["record_id"])
    assert list(removed["record_id"]) == ["bad-old-basis"]


def test_c9_with_no_revaluation_towns_removes_nothing():
    kept, removed = clean.rule_c9_revaluation(rule_input(), [])
    assert removed.empty


def test_whole_run_removes_each_bad_row_with_its_rule():
    df = clean.prepare_input(rule_input())
    kept, removed, _ = clean.run_rules(df, REVAL_TOWNS)
    assert dict(zip(removed["record_id"], removed["rule_id"])) == {
        row["record_id"]: rule_id for rule_id, row in BAD_ROWS.items()}
    assert set(kept["record_id"]) == {r["record_id"] for r in GOOD_ROWS}


# ---------------------------------------------------------------- input preparation

def test_prepare_drops_older_copies_and_unused_files():
    df = frame([sale("a"), sale("b", superseded_by_newer_file=True, source_file="YTDSR1A2026"),
                sale("c", source_file="YTDSR1A2026"), sale("d", source_file="Sales2025")])
    out = clean.prepare_input(df)
    assert list(out["record_id"]) == ["d", "a"]  # Sales2025 first, then Sales2026


def test_prepare_uses_reported_price_when_verified_is_zero():
    df = frame([sale("a", price_verified=0, price_reported=610_000), sale("b")])
    out = clean.prepare_input(df).set_index("record_id")
    assert out.loc["a", "sale_price"] == 610_000
    assert out.loc["a", "price_source"] == "reported"
    assert out.loc["b", "price_source"] == "verified"


# ---------------------------------------------------------------- C8 outlier trimming

def town_sales(code, ratios, prefix):
    """Made-up sales in one town, $500,000 each, with the given ratios."""
    return [sale(f"{prefix}-{i:02d}", district_code=code, av_total=round(r * 500_000),
                 total_assessment=round(r * 500_000)) for i, r in enumerate(ratios)]


FORTY = [0.36 + 0.004 * i for i in range(21)]  # 0.36 to 0.44: a town assessed near 40%
HUNDRED = [0.95 + 0.005 * i for i in range(21)]  # 0.95 to 1.05: a town assessed near 100%


def test_c8_keeps_normal_sales_in_a_40_percent_town():
    """The old fixed 0.5-1.5 trim would delete every one of these sales. C8 must keep them."""
    df = clean.prepare_input(frame(town_sales("0203", FORTY, "forty")))
    kept, removed = clean.rule_c8_outliers(df)
    assert removed.empty
    assert len(kept) == len(FORTY)


def test_c8_removes_only_the_extreme_sale_in_a_40_percent_town():
    df = clean.prepare_input(frame(town_sales("0203", FORTY + [1.60], "forty")))
    kept, removed = clean.rule_c8_outliers(df)
    assert list(removed["record_id"]) == ["forty-21"]


def test_c8_is_per_town():
    """A ratio of 0.40 is normal in the 40% town but an outlier in the 100% town."""
    rows = town_sales("0203", FORTY, "forty") + town_sales("0204", HUNDRED + [0.40], "hundred")
    kept, removed = clean.rule_c8_outliers(clean.prepare_input(frame(rows)))
    assert list(removed["record_id"]) == ["hundred-21"]


def test_c8_relative_ratio_is_ratio_over_town_median():
    df = clean.prepare_input(frame(town_sales("0203", FORTY, "forty")))
    kept, _ = clean.rule_c8_outliers(df)
    assert kept["town_median_ratio"].iloc[0] == pytest.approx(0.40)
    assert (kept["relative_ratio"] - kept["ratio"] / 0.40).abs().max() < 1e-9


def test_c8_same_removals_at_any_assessment_level():
    """Scaling every assessment in a town by the same amount must not change C8."""
    ratios = HUNDRED + [0.40, 1.90]
    a = clean.rule_c8_outliers(clean.prepare_input(frame(town_sales("0204", ratios, "t"))))[1]
    b = clean.rule_c8_outliers(clean.prepare_input(frame(town_sales("0204", [r * 0.4 for r in ratios], "t"))))[1]
    assert set(a["record_id"]) == set(b["record_id"]) == {"t-21", "t-22"}


def test_c8_runs_each_file_separately():
    """Sales2025 sales are trimmed against Sales2025's median, not Sales2026's."""
    rows = town_sales("0204", HUNDRED, "new") + [
        {**r, "source_file": "Sales2025"} for r in town_sales("0204", FORTY, "old")]
    kept, removed = clean.rule_c8_outliers(clean.prepare_input(frame(rows)))
    assert removed.empty


def test_c8_sensitivity_fence_removes_at_least_as_many():
    df = clean.prepare_input(frame(town_sales("0204", HUNDRED + [0.80, 1.20, 1.5], "t")))
    main = clean.rule_c8_outliers(df, config.C8_IQR_FENCE)[1]
    alt = clean.rule_c8_outliers(df, config.C8_SENSITIVITY_FENCE)[1]
    assert set(main["record_id"]) <= set(alt["record_id"])
    assert len(alt) > len(main)


# ---------------------------------------------------------------- filter log

def full_dataset():
    """Bad rows, good rows, two C8 towns, and a Sales2025 copy of everything."""
    rows = GOOD_ROWS + list(BAD_ROWS.values()) + town_sales("0203", FORTY + [1.6], "forty") \
        + town_sales("0204", HUNDRED + [0.4], "hundred")
    older = [{**r, "source_file": "Sales2025", "record_id": "25-" + r["record_id"],
              "line_md5": "25-" + r["line_md5"], "assess_year": 25} for r in rows]
    return frame(rows + older)


def test_rows_in_equals_kept_plus_removed_everywhere():
    result = clean.clean_all(full_dataset(), TOWNS, REVAL_TOWNS)
    log = result["log"]
    assert (log["rows_in"] == log["rows_out"] + log["rows_removed"]).all()
    assert len(result["kept"]) + len(result["removed"]) == len(result["prepared"])


def test_rows_out_of_one_rule_are_rows_in_of_the_next():
    log = clean.clean_all(full_dataset(), TOWNS, REVAL_TOWNS)["log"]
    for _, group in log.groupby(["source_file", "district_code"]):
        group = group.sort_values("step")
        assert list(group["rows_out"].iloc[:-1]) == list(group["rows_in"].iloc[1:])


def test_town_rows_add_up_to_countywide_and_files_add_up_to_all():
    log = clean.clean_all(full_dataset(), TOWNS, REVAL_TOWNS)["log"]
    for (step, source), group in log.groupby(["step", "source_file"]):
        county = group[group["district_code"] == clean.COUNTYWIDE].iloc[0]
        towns = group[group["district_code"] != clean.COUNTYWIDE]
        for col in ["rows_in", "rows_removed", "rows_out"]:
            assert towns[col].sum() == county[col]
    for (step, code), group in log.groupby(["step", "district_code"]):
        files = group[group["source_file"] != clean.ALL_FILES]
        both = group[group["source_file"] == clean.ALL_FILES].iloc[0]
        assert files["rows_removed"].sum() == both["rows_removed"]


def test_filter_log_has_every_rule_town_and_file():
    log = clean.clean_all(full_dataset(), TOWNS, REVAL_TOWNS)["log"]
    n_files = len(config.CLEAN_SOURCE_FILES) + 1
    assert len(log) == len(config.CLEAN_RULE_ORDER) * n_files * (len(TOWNS) + 1)
    assert list(log.drop_duplicates("step")["rule_id"]) == config.CLEAN_RULE_ORDER


def test_removed_rows_carry_their_rule_id():
    removed = clean.clean_all(full_dataset(), TOWNS, REVAL_TOWNS)["removed"]
    assert removed["rule_id"].notna().all()
    assert set(removed["rule_id"]) <= set(config.CLEAN_RULE_ORDER)


def test_sales_clean_columns():
    out = clean.clean_all(full_dataset(), TOWNS, REVAL_TOWNS)["sales_clean"]
    assert list(out.columns) == ["record_id", "source_file", "district_code", "town_slug", "deed_date",
                                 "recorded_date", "assess_year", "sale_price", "assessed_value", "ratio",
                                 "town_median_ratio", "relative_ratio"]
    assert out["town_slug"].notna().all()


# ---------------------------------------------------------------- repeatable

def run_once(folder):
    """Run the cleaning step on the made-up data and write outputs into folder."""
    paths = {"sales_clean": folder / "sales_clean.csv", "removed": folder / "removed_rows.parquet",
             "log": folder / "filter_log.csv", "sens": folder / "c8_sensitivity.csv",
             "report": folder / "filter-log.md"}
    result = clean.clean_all(full_dataset(), TOWNS, REVAL_TOWNS)
    clean.write_outputs(result, TOWNS, paths=paths, today="2026-10-15")
    return paths


def test_running_twice_gives_identical_outputs(tmp_path):
    first = run_once(tmp_path / "one")
    second = run_once(tmp_path / "two")
    for key in first:
        assert first[key].read_bytes() == second[key].read_bytes(), key


# ---------------------------------------------------------------- run.py

def test_run_stops_with_clear_message_when_input_missing(tmp_path, monkeypatch):
    missing = config.ROOT / "data" / "raw" / "no-such-file.zip"
    ran = []
    monkeypatch.setattr(run, "STAGES", [("clean", lambda: ran.append(1), lambda: [missing])])
    with pytest.raises(SystemExit) as stop:
        run.main([])
    assert "no-such-file.zip" in str(stop.value)
    assert ran == []


def test_run_rejects_unknown_stage():
    with pytest.raises(SystemExit) as stop:
        run.main(["nope"])
    assert "Unknown stage" in str(stop.value)
