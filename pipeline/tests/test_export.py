"""Tests for the price index (pipeline/price_index.py) and the website export (pipeline/export.py).

Most data here is made up, so the right answer is known. The last tests read
the real files in site/public/data/ and are skipped if they have not been built yet.
"""

import json
import math

import pandas as pd
import pytest

from pipeline import config, export, price_index, run

# ---------------------------------------------------------------- price index (K4), worked by hand
#
# Months and sale prices:
#   Jan: 100, 200          Feb: 300          Mar: 400, 500, 600          Apr: 700 (short month)
# Counts 2, 1, 3, 1 -> average 1.75 -> half = 0.875. Apr has 1 >= 0.875, so it is kept.
# With Apr at 0 sales instead, Apr is dropped (0 < half of the average).


def hand_sales(apr_prices=(700,)):
    """Small made-up clean sales table."""
    rows = [("2025-01-05", 100), ("2025-01-20", 200), ("2025-02-10", 300),
            ("2025-03-01", 400), ("2025-03-15", 500), ("2025-03-30", 600)]
    rows += [("2025-04-02", p) for p in apr_prices]
    return pd.DataFrame(rows, columns=["deed_date", "sale_price"])


def test_monthly_counts_fill_empty_months_with_zero():
    months = price_index.deed_months(pd.DataFrame({"deed_date": ["2025-01-01", "2025-03-01"]}))
    counts = price_index.monthly_counts(months)
    assert counts.tolist() == [1, 0, 1]


def test_incomplete_end_months_drops_only_short_months_at_the_end():
    counts = pd.Series([10, 1, 10, 4, 2], index=pd.period_range("2025-01", periods=5, freq="M"))
    # average 5.4 -> half 2.7: May (2) dropped, Apr (4) stops the walk; Feb (1) is not at the end.
    assert [str(m) for m in price_index.incomplete_end_months(counts)] == ["2025-05"]


def test_index_by_hand():
    t = price_index.build_index(hand_sales())
    assert t["kept"].all()
    # Jan window = Jan + Feb = 100, 200, 300 -> 200. Feb window = Jan..Mar -> median of 6 = 350.
    # Mar window = Feb..Apr = 300..700 -> 500. Apr window = Mar + Apr = 400..700 -> 550 (base).
    assert t["raw_median_price"].tolist() == [200, 350, 500, 550]
    assert t["n_window"].tolist() == [3, 6, 5, 4]
    assert t["index"].tolist() == pytest.approx([200 / 550, 350 / 550, 500 / 550, 1.0])
    assert price_index.last_kept_month(t) == "2025-04"


def test_index_drops_incomplete_last_month_and_rebases():
    sales = hand_sales(apr_prices=())
    sales = pd.concat([sales, pd.DataFrame({"deed_date": ["2025-05-01"], "sale_price": [9_999]})])
    # Counts Jan 2, Feb 1, Mar 3, Apr 0, May 1 -> average 1.4 -> half 0.7.
    # May (1) is kept, so nothing is dropped; Apr is an empty month inside the series.
    t = price_index.build_index(sales)
    assert t["kept"].all()
    # Now make May the only short end month: give Jan..Mar many sales.
    many = pd.DataFrame({"deed_date": ["2025-01-10"] * 10 + ["2025-02-10"] * 10 + ["2025-03-10"] * 10,
                         "sale_price": [100] * 30})
    short = pd.concat([many, pd.DataFrame({"deed_date": ["2025-04-01"], "sale_price": [500]})])
    t = price_index.build_index(short)
    assert t["kept"].tolist() == [True, True, True, False]
    assert price_index.last_kept_month(t) == "2025-03"
    assert t.loc[t["kept"], "index"].iloc[-1] == pytest.approx(1.0)
    assert math.isnan(t["index"].iloc[-1])


# ---------------------------------------------------------------- export helpers


def test_clean_number_rounds_and_removes_nan_and_infinity():
    assert export.clean_number(123456.6) == 123457
    assert isinstance(export.clean_number(5.0), int)
    assert export.clean_number(0.123456, 4) == 0.1235
    assert export.clean_number(float("nan")) is None
    assert export.clean_number(float("inf"), 4) is None
    assert export.clean_number(None) is None


def test_clean_bool():
    assert export.clean_bool(True) is True
    assert export.clean_bool("False") is False
    assert export.clean_bool(float("nan")) is None


def test_digits_for_fields():
    assert export.digits_for("cod") == 2
    assert export.digits_for("cod_ci_low") == 2
    assert export.digits_for("median_cod") == 2
    assert export.digits_for("diff_one_year_pp") == 2
    assert export.digits_for("prd") == 4
    assert export.digits_for("share_above_upper") == 4


def test_round_tree_rounds_nested_floats_only():
    out = export.round_tree({"cod": 11.936994, "prd": 1.009346, "n_sales": 3806,
                             "by_tier": [{"share_above_upper": 0.141447}], "about": "text"})
    assert out == {"cod": 11.94, "prd": 1.0093, "n_sales": 3806,
                   "by_tier": [{"share_above_upper": 0.1414}], "about": "text"}


def test_to_json_text_refuses_nan():
    with pytest.raises(ValueError):
        export.to_json_text({"x": float("nan")})


def test_methodology_version_read_from_file(tmp_path):
    p = tmp_path / "m.md"
    p.write_text("# Title\n\n**Version 2.0 (2026-11-01).** Text.\n", encoding="utf-8")
    assert export.methodology_version(p) == ("2.0", "2026-11-01")
    p.write_text("# No version here\n", encoding="utf-8")
    with pytest.raises(ValueError):
        export.methodology_version(p)


def test_even_sample_positions():
    assert export.even_sample_positions(5, 300) == [0, 1, 2, 3, 4]
    picks = export.even_sample_positions(1000, 300)
    assert len(picks) == 300
    assert picks[0] == 0 and picks[-1] == 999
    gaps = [b - a for a, b in zip(picks, picks[1:])]
    assert max(gaps) - min(gaps) <= 1  # evenly spaced


def test_scatter_points_sampled_evenly_and_sorted_by_value():
    n = 1000
    group = pd.DataFrame({"sale_price": [400_000 + 1_000 * i for i in range(n)],
                          "assessed_value": [200_000 + 500 * i for i in range(n)]})
    points, sampling = export.scatter_points(group)
    assert len(points) == 300
    assert sampling["n_sales"] == 1000 and sampling["n_shown"] == 300
    values = [p["value"] for p in points]
    assert values == sorted(values)
    assert values[0] == 400_000 and values[-1] == 400_000 + 999_000  # ratio is 0.5 everywhere
    assert set(points[0]) == {"value", "ratio"}
    assert points[0]["ratio"] == 0.5


def test_comp_pool_keeps_window_and_only_approved_fields():
    group = pd.DataFrame({
        "deed_date": ["2024-09-30", "2024-10-01", "2026-06-25", "2026-06-26"],
        "sale_price": [500_000, 600_000, 700_000, 800_000],
        "assessed_value": [250_000, 300_000, 350_000, 400_000],
        "street": ["MAIN ST"] * 4, "record_id": ["a", "b", "c", "d"], "source_file": ["x"] * 4,
    })
    window = {"deed_date_from": "2024-10-01", "deed_date_to": "2026-06-25"}
    comps = export.comp_pool(group, window)
    assert [c["deed_date"] for c in comps] == ["2024-10-01", "2026-06-25"]
    assert all(list(c) == config.COMP_FIELDS for c in comps)
    assert comps[0] == {"deed_date": "2024-10-01", "sale_price": 600_000, "assessed_value": 300_000,
                        "ratio": 0.5}


def test_check_sizes_enforces_budgets(monkeypatch):
    assert export.check_sizes({"towns/a.json": "x" * 10, "meta.json": "y"}) == {"towns/a.json": 10,
                                                                               "meta.json": 1}
    with pytest.raises(ValueError, match="Town files"):
        export.check_sizes({"towns/a.json": "x" * (config.TOWN_FILE_MAX_BYTES + 1)})
    monkeypatch.setattr(config, "SITE_DATA_MAX_BYTES", 5)
    with pytest.raises(ValueError, match="budget"):
        export.check_sizes({"meta.json": "x" * 6})


def test_run_has_index_and_export_stages_last():
    names = [name for name, _, _ in run.STAGES]
    assert names[-2:] == ["index", "export"]


# ---------------------------------------------------------------- real exported files

TOWNS_JSON = config.SITE_DATA_DIR / "towns.json"
real = pytest.mark.skipif(not TOWNS_JSON.exists(), reason="run the pipeline export stage first")


def strict_load(path):
    """Load JSON, failing if the text holds NaN or Infinity."""
    def refuse(name):
        raise ValueError(f"{path.name} contains {name}")
    return json.loads(path.read_text(encoding="utf-8"), parse_constant=refuse)


def walk_numbers(obj):
    """Every number anywhere in a JSON object."""
    if isinstance(obj, dict):
        for v in obj.values():
            yield from walk_numbers(v)
    elif isinstance(obj, list):
        for v in obj:
            yield from walk_numbers(v)
    elif isinstance(obj, (int, float)) and not isinstance(obj, bool):
        yield obj


@real
def test_all_70_towns_exported():
    towns = strict_load(TOWNS_JSON)
    assert len(towns) == config.N_TOWNS
    assert len({t["slug"] for t in towns}) == config.N_TOWNS
    files = sorted(p.stem for p in config.SITE_TOWNS_DIR.glob("*.json"))
    assert files == sorted(t["slug"] for t in towns)
    assert strict_load(config.SITE_DATA_DIR / "meta.json")["n_towns"] == config.N_TOWNS


@real
def test_every_town_file_matches_its_towns_json_entry():
    for entry in strict_load(TOWNS_JSON):
        town = strict_load(config.SITE_TOWNS_DIR / f"{entry['slug']}.json")
        assert town["slug"] == entry["slug"]
        assert {k: town[k] for k in entry} == entry


@real
def test_no_nan_or_infinity_in_any_file():
    for path in config.SITE_DATA_DIR.rglob("*.json"):
        assert all(math.isfinite(x) for x in walk_numbers(strict_load(path))), path.name


@real
def test_comp_pool_has_only_approved_fields():
    for path in config.SITE_TOWNS_DIR.glob("*.json"):
        town = strict_load(path)
        assert all(list(c) == config.COMP_FIELDS for c in town["comps"]), path.name
        window = town["comp_window"]
        assert all(window["deed_date_from"] <= c["deed_date"] <= window["deed_date_to"] for c in town["comps"])


@real
def test_hidden_towns_have_no_stats_points_or_tiers():
    for entry in strict_load(TOWNS_JSON):
        town = strict_load(config.SITE_TOWNS_DIR / f"{entry['slug']}.json")
        hidden = entry["label"] == config.LABEL_NOT_ENOUGH
        assert (entry["stats"] is None) == hidden
        if hidden:
            assert town["scatter"] == [] and town["tiers"] == [] and entry["rank"] is None
        else:
            assert len(town["tiers"]) == config.N_TIERS
            assert len(town["scatter"]) == min(town["n_sales"], config.SCATTER_MAX_POINTS)


@real
def test_files_within_size_budget():
    sizes = {p: p.stat().st_size for p in config.SITE_DATA_DIR.rglob("*.json")}
    assert all(b <= config.TOWN_FILE_MAX_BYTES for p, b in sizes.items() if p.parent.name == "towns")
    assert sum(sizes.values()) <= config.SITE_DATA_MAX_BYTES


@real
def test_exported_numbers_match_pipeline_tables():
    stats = pd.read_csv(config.TOWN_STATS_CSV, dtype={"district_code": str}).set_index("slug")
    for entry in strict_load(TOWNS_JSON):
        row = stats.loc[entry["slug"]]
        assert entry["n_sales"] == row["n_sales"]
        if entry["stats"]:
            assert entry["stats"]["prb"] == pytest.approx(row["prb"], abs=5e-5)
            assert entry["stats"]["cod"] == pytest.approx(row["cod"], abs=5e-3)
    download = pd.read_csv(config.TOWN_STATS_DOWNLOAD_CSV, dtype={"district_code": str})
    assert len(download) == config.N_TOWNS
    assert "street" not in " ".join(download.columns)


def test_filter_log_json_has_county_rows_only():
    log = pd.DataFrame({
        "step": [1, 2, 1, 2], "rule_id": ["C1", "C2", "C1", "C2"],
        "rule_description": ["Bergen", "Residential", "Bergen", "Residential"],
        "source_file": ["All"] * 4, "district_code": ["ALL", "ALL", "0201", "0201"],
        "rows_in": [10, 10, 5, 5], "rows_removed": [0, 2, 0, 1], "rows_out": [10, 8, 5, 4]})
    out = export.filter_log_json(log)
    assert set(out) == {"rules", "county"}
    assert [r["rule_id"] for r in out["rules"]] == ["C1", "C2"]
    assert out["county"][1] == {"source_file": "All", "rule_id": "C2", "rows_in": 10, "rows_removed": 2,
                                "rows_out": 8}


@real
def test_town_files_carry_their_own_filter_log():
    log = pd.read_csv(config.FILTER_LOG_CSV, dtype={"district_code": str})
    for entry in strict_load(TOWNS_JSON):
        town = strict_load(config.SITE_TOWNS_DIR / f"{entry['slug']}.json")
        mine = log[log["district_code"] == entry["district_code"]]
        assert len(town["filter_log"]) == len(mine) > 0
        sales26 = [r for r in town["filter_log"] if r["source_file"] == config.TOWN_STATS_SOURCE_FILE]
        assert sales26[-1]["rule_id"] == "C8"  # C8 runs last
        assert sales26[-1]["rows_out"] == entry["n_sales"]
    assert "towns" not in strict_load(config.SITE_DATA_DIR / "filter-log.json")


@real
def test_price_index_chart_starts_at_comp_window():
    idx = strict_load(config.SITE_DATA_DIR / "price-index.json")
    assert idx["chart_from"] == config.COMP_WINDOW_START.strftime("%Y-%m")
    assert idx["chart_from"] in [m["month"] for m in idx["months"]]
