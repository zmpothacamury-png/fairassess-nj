"""Reference version of the appeal checker (docs/methodology.md Section 6, rules K1 to K14).

The website's checker is written in TypeScript (site/lib/checker/). This file
is a second version, written straight from methodology.md, not translated from
the TypeScript. Both read the same site files (site/public/data/). The fixtures
stage runs this version on 30+ cases and saves its answers to
pipeline/fixtures/checker_cases.json. The website's tests (Vitest) then check
that the TypeScript gives the same answers.

Run after the export stage:
.venv\\Scripts\\python.exe -m pipeline.checker_reference
"""

import json
import math
import random
import re
from datetime import date
from itertools import accumulate

import pandas as pd

from pipeline import config

CAP = 100.0  # K10: "RATIOS IN EXCESS OF 100% ARE TO BE CONSIDERED 100%"


# ---------------------------------------------------------------- loading the site files

def load_town(slug):
    """One town's site file (towns/<slug>.json) as a dict."""
    return json.loads((config.SITE_TOWNS_DIR / f"{slug}.json").read_text(encoding="utf-8"))


def load_price_index():
    """price-index.json as a dict."""
    return json.loads(config.PRICE_INDEX_JSON.read_text(encoding="utf-8"))


def town_slugs():
    """Every town slug with a site file, sorted."""
    return sorted(p.stem for p in config.SITE_TOWNS_DIR.glob("*.json"))


# ---------------------------------------------------------------- K1: inputs

def round_half_up(x):
    """Round to whole dollars, halves going up."""
    return math.floor(x + 0.5)


def parse_money(text, required):
    """Turn typed text into whole dollars. Returns (value, error code); value is None on an error or a blank."""
    s = re.sub(r"[\s,$]", "", text or "")
    if s == "":
        return None, ("blank" if required else None)
    if re.fullmatch(r"-\d+(\.\d+)?", s):
        return None, "negative"
    m = re.fullmatch(r"(\d+)(?:\.(\d+))?", s)
    if m is None:
        return None, "not-a-number"
    if m.group(2) and m.group(2).strip("0"):
        return None, "not-whole"
    value = int(m.group(1))
    if value < config.CHECKER_INPUT_MIN:
        return None, "too-small"
    if value > config.CHECKER_INPUT_MAX:
        return None, "too-large"
    return value, None


def validate_inputs(town, assessed_text, own_text, slugs):
    """K1. Returns (inputs dict or None, list of {field, code}) for what the homeowner typed."""
    errors = []
    town = (town or "").strip()
    if not town:
        errors.append({"field": "town", "code": "town-missing"})
    elif town not in slugs:
        errors.append({"field": "town", "code": "town-unknown"})
    assessed, code = parse_money(assessed_text, required=True)
    if code:
        errors.append({"field": "assessedValue", "code": code})
    own, code = parse_money(own_text, required=False)
    if code:
        errors.append({"field": "ownEstimate", "code": code})
    if errors:
        return None, errors
    return {"town": town, "assessed_value": assessed, "own_estimate": own}, []


# ---------------------------------------------------------------- K2, K3: comps

def comps_in_band(pool, assessed_value, band):
    """Comps whose assessed value is within +/- band of the homeowner's, edge included.

    Compared in whole percents (100 x gap <= percent x value) so the edge is exact.
    """
    percent = round(band * 100)
    return [c for c in pool if 100 * abs(c["assessed_value"] - assessed_value) <= percent * assessed_value]


def pick_comps(town, assessed_value):
    """K2/K3: comps in the window, 15% band, widened to 25% if under 8. Returns (comps, band, count at 15%)."""
    lo, hi = town["comp_window"]["deed_date_from"], town["comp_window"]["deed_date_to"]
    pool = [c for c in town["comps"] if lo <= c["deed_date"] <= hi]
    narrow_band, wide_band = config.CHECKER_BANDS
    narrow = comps_in_band(pool, assessed_value, narrow_band)
    if len(narrow) >= config.CHECKER_WIDEN_BELOW:
        return narrow, narrow_band, len(narrow)
    return comps_in_band(pool, assessed_value, wide_band), wide_band, len(narrow)


# ---------------------------------------------------------------- K4 to K6: adjust and weigh

def index_lookup(price_index):
    """Map YYYY-MM -> index for the kept months, plus the base month's index."""
    table = {m["month"]: m["index"] for m in price_index["months"] if m["kept"] and m["index"] is not None}
    return table, table[price_index["base_month"]]


def adjust_and_weigh(comps, assessed_value, band, price_index):
    """K4-K6 for each comp: time-adjusted price and ratio, closeness weight, recency weight."""
    table, base = index_lookup(price_index)
    out = []
    for c in comps:
        month = c["deed_date"][:7]
        # K5: no forecast, so any month after the base month uses the base month's index.
        idx = base if month > price_index["base_month"] else table[month]
        adj_price = c["sale_price"] * base / idx
        d = abs(c["assessed_value"] - assessed_value) / assessed_value
        w_size = 1 - 0.5 * (d / band)
        t = (config.VALUATION_DATE - date.fromisoformat(c["deed_date"])).days / config.CHECKER_DAYS_PER_MONTH
        w_time = 0.5 ** (t / config.CHECKER_HALF_LIFE_MONTHS)
        out.append({
            "sale_month": month,
            "sale_price": c["sale_price"],
            "adjusted_price": adj_price,
            "assessed_value": c["assessed_value"],
            "adjusted_ratio": c["assessed_value"] / adj_price,
            "w_size": w_size,
            "w_time": w_time,
            "weight": w_size * w_time,
        })
    return out


# ---------------------------------------------------------------- K7, K8: estimate

def weighted_pct(rows, p):
    """K7: first R_adj (sorted low to high) where the running weight reaches p of the total."""
    ordered = sorted(rows, key=lambda r: r["adjusted_ratio"])
    running = list(accumulate(r["weight"] for r in ordered))
    goal = p * running[-1] * (1 - config.CHECKER_PERCENTILE_TOLERANCE)
    for r, cum in zip(ordered, running):
        if cum >= goal:
            return r["adjusted_ratio"]
    return ordered[-1]["adjusted_ratio"]


# ---------------------------------------------------------------- K10, K11: Chapter 123

def ch123_position(assessed_value, market_value, ch123):
    """K10/K11: (h, 'above' / 'within' / 'below'). Over-100% limits count as 100%; ties are 'within'."""
    h = assessed_value / market_value * 100
    upper = min(ch123["upper_limit"], CAP)
    lower = min(ch123["lower_limit"], CAP)
    if h - upper > config.CHECKER_FLOAT_TOLERANCE:
        return h, "above"
    if lower - h > config.CHECKER_FLOAT_TOLERANCE:
        return h, "below"
    return h, "within"


def fee_for(assessed_value):
    """K13: Form A-1 filing fee."""
    return next(fee for below, fee in config.CHECKER_FEES if assessed_value < below)


# ---------------------------------------------------------------- the whole checker

def run_checker(town, price_index, assessed_value, own_estimate=None):
    """Run rules K2 to K14 for one homeowner. Returns a dict of the key results (snake_case)."""
    year = config.CH123_TAX_YEAR
    reval_now = town["revaluation_tax_year"] == year
    reval_last = town["revaluation_tax_year"] == year - 1
    comps, band, n_first = pick_comps(town, assessed_value)
    rows = adjust_and_weigh(comps, assessed_value, band, price_index)
    enough = len(rows) >= config.CHECKER_MIN_COMPS
    res = {
        "verdict": None, "strength": None,
        "band_percent": round(band * 100), "widened": band != config.CHECKER_BANDS[0],
        "count_at_first_band": n_first, "n_comps": len(rows),
        "ratio_p25": None, "ratio_p50": None, "ratio_p75": None,
        "market_value_low": None, "market_value_mid": None, "market_value_high": None,
        "homeowner_ratio": None, "ratio_at_high_value": None,
        "lower_trigger": None, "upper_trigger": None, "average_ratio_used": None,
        "own_position": None, "own_ratio": None, "own_difference_share": None,
        "corrected_assessment": None, "yearly_savings": None, "tax_rate_year": None,
        "filing_fee": fee_for(assessed_value),
        "deadline": f"{config.CHECKER_DEADLINE_REVAL if reval_now else config.CHECKER_DEADLINE}, {year}",
        "warnings": [],
        "comps": [{k: (round_half_up(v) if k == "adjusted_price" else v)
                   for k, v in r.items() if k in ("sale_month", "sale_price", "adjusted_price",
                                                  "assessed_value", "adjusted_ratio", "weight")}
                  for r in rows],
    }
    mv_mid = None
    if not enough:
        res["verdict"] = "not-enough-data"
    else:
        p25, p50, p75 = (weighted_pct(rows, p) for p in (0.25, 0.50, 0.75))
        mv_mid, mv_high = assessed_value / p50, assessed_value / p25
        res.update(ratio_p25=p25, ratio_p50=p50, ratio_p75=p75,
                   market_value_low=round_half_up(assessed_value / p75),
                   market_value_mid=round_half_up(mv_mid), market_value_high=round_half_up(mv_high))
        if reval_now:
            res["verdict"] = "revaluation-no-test"  # K14
        else:
            h, where = ch123_position(assessed_value, mv_mid, town["ch123"])
            h_high, where_high = ch123_position(assessed_value, mv_high, town["ch123"])
            res["verdict"] = {"above": "may-have-grounds", "within": "within-range",
                              "below": "possibly-under-assessed"}[where]
            res.update(homeowner_ratio=h, ratio_at_high_value=h_high,
                       lower_trigger=min(town["ch123"]["lower_limit"], CAP),
                       upper_trigger=min(town["ch123"]["upper_limit"], CAP),
                       average_ratio_used=min(town["ch123"]["average_ratio"], CAP))
            if where == "above":
                res["strength"] = "strong" if where_high == "above" else "borderline"
                if town["tax_rate"] is not None:  # K12
                    corrected = round_half_up(mv_mid * res["average_ratio_used"] / 100)
                    res["corrected_assessment"] = corrected
                    res["yearly_savings"] = round_half_up(
                        (assessed_value - corrected) * town["tax_rate"]["general_tax_rate"] / 100)
                    res["tax_rate_year"] = town["tax_rate"]["year"]

    if own_estimate is not None:  # K9
        if not reval_now:
            res["own_ratio"], res["own_position"] = ch123_position(assessed_value, own_estimate, town["ch123"])
        if mv_mid is not None:
            res["own_difference_share"] = abs(own_estimate - mv_mid) / mv_mid

    w = res["warnings"]
    if res["own_difference_share"] is not None and res["own_difference_share"] > config.CHECKER_OWN_ESTIMATE_WARN:
        w.append("own-estimate-differs")
    if reval_now:
        w.append("revaluation-this-year")
    if reval_last:
        w.append("revaluation-last-year")
    if enough and len(rows) < config.CHECKER_WIDEN_BELOW:
        w.append("limited-data")
    if enough and res["widened"]:
        w.append("widened-band")
    if res["verdict"] == "may-have-grounds" and town["tax_rate"] is None:
        w.append("no-tax-rate")
    return res


# ---------------------------------------------------------------- fixture cases

def fake_town(slug, ar, lower, upper, comps, reval=None, rate=2.0):
    """A made-up town for edge cases. comps = list of (deed date, sale price, assessed value)."""
    return {
        "slug": slug, "name": slug.replace("test-", "").replace("-", " ").title(),
        "revaluation_tax_year": reval,
        "ch123": {"tax_year": 2027, "average_ratio": ar, "lower_limit": lower, "upper_limit": upper,
                  "amended_by_tax_court": False},
        "tax_rate": None if rate is None else {"year": 2025, "general_tax_rate": rate},
        "comp_window": {"deed_date_from": "2024-10-01", "deed_date_to": "2026-06-30"},
        "comps": [{"deed_date": d, "sale_price": s, "assessed_value": a, "ratio": round(a / s, 4)}
                  for d, s, a in comps],
    }


def same_value_comps(assessed, prices, deed="2026-06-15"):
    """Comps all assessed at `assessed`, sold on one date, at these prices."""
    return [(deed, p, assessed) for p in prices]


def edge_cases():
    """Made-up towns and inputs for the edge cases the tests must cover. Returns a list of case dicts."""
    ar80 = dict(ar=80.0, lower=68.0, upper=92.0)
    eight = [500_000] * 8
    cases = [
        ("edge-zero-comps", "Town with no sales at all",
         fake_town("test-empty", comps=[], **ar80), "400000", None),
        ("edge-exactly-5-comps", "Exactly 5 comps after widening (the minimum): a result is given",
         fake_town("test-five", comps=[("2026-06-15", 500_000, a) for a in
                                       (400_000, 420_000, 450_000, 480_000, 500_000)], **ar80), "400000", None),
        ("edge-4-comps", "Only 4 comps after widening: not enough data",
         fake_town("test-four", comps=[("2026-06-15", 500_000, a) for a in
                                       (400_000, 420_000, 450_000, 480_000)], **ar80), "400000", None),
        ("edge-band-widening", "3 comps at 15%, 6 at 25%: band widened",
         fake_town("test-widen", comps=[("2026-06-15", 500_000, a) for a in
                                        (400_000, 410_000, 420_000, 470_000, 480_000, 490_000)], **ar80),
         "400000", None),
        ("edge-exactly-8-no-widening", "Exactly 8 comps at 15%: no widening, and the 20%-away comps are ignored",
         fake_town("test-eight", comps=same_value_comps(400_000, [480_000 + 5_000 * i for i in range(8)])
                   + [("2026-06-15", 400_000, 480_000), ("2026-06-15", 400_000, 320_000)], **ar80),
         "400000", None),
        ("edge-comp-on-15pct-edge", "Comps exactly 15% away count inside the 15% band",
         fake_town("test-edge", comps=[("2026-06-15", 500_000, a) for a in
                                       (340_000, 460_000) * 4], **ar80), "400000", None),
        ("edge-ratio-at-upper-limit", "Homeowner ratio exactly at the upper limit (92%): within range",
         fake_town("test-at-upper", comps=same_value_comps(460_000, eight), **ar80), "460000", None),
        ("edge-ratio-at-lower-limit", "Homeowner ratio exactly at the lower limit (68%): within range",
         fake_town("test-at-lower", comps=same_value_comps(340_000, eight), **ar80), "340000", None),
        ("edge-own-at-upper-limit", "Own estimate gives exactly 92% (460,000 / 500,000): within range",
         fake_town("test-own-upper", comps=same_value_comps(460_000, eight), **ar80), "460000", "500000"),
        ("edge-just-above-upper", "Ratio 92.01%, just above 92%: may have grounds (strong)",
         fake_town("test-above", comps=same_value_comps(460_050, eight), **ar80), "460050", None),
        ("edge-borderline", "Above the limit at the middle value but not at the high value: borderline",
         fake_town("test-borderline", comps=same_value_comps(
             460_000, [470_000, 480_000, 490_000, 495_000, 498_000, 510_000, 520_000, 530_000]), **ar80),
         "460000", None),
        ("edge-under-assessed", "Ratio below the lower limit: may be lower than typical",
         fake_town("test-under", comps=same_value_comps(300_000, eight), **ar80), "300000", None),
        ("edge-own-25pct-away", "Own estimate 25% above our estimate: warning",
         fake_town("test-own25", comps=same_value_comps(400_000, eight), **ar80), "400000", "625000"),
        ("edge-own-15pct-away", "Own estimate 15% below our estimate: no warning",
         fake_town("test-own15", comps=same_value_comps(400_000, eight), **ar80), "400000", "425000"),
        ("edge-reval-2027", "Town on the 2027 revaluation list: estimate but no Chapter 123 result (K14)",
         fake_town("test-reval-2027", comps=same_value_comps(460_000, eight), reval=2027, **ar80),
         "460000", "450000"),
        ("edge-reval-2026", "Town revalued for 2026: normal test plus a warning",
         fake_town("test-reval-2026", comps=same_value_comps(460_000, eight), reval=2026, **ar80),
         "460000", None),
        ("edge-average-over-100", "Average ratio 110%: ratio 103.7% is inside the printed range but above 100%",
         fake_town("test-over-100", ar=110.0, lower=93.5, upper=126.5,
                   comps=same_value_comps(420_000, [420_000, 415_000, 410_000, 405_000,
                                                    400_000, 395_000, 390_000, 380_000])), "420000", None),
        ("edge-lower-limit-over-100", "Printed lower limit 101.58% counts as 100% (like Rockleigh)",
         fake_town("test-rockleigh-like", ar=119.5, lower=101.58, upper=137.43,
                   comps=same_value_comps(495_000, eight)), "495000", None),
        ("edge-no-tax-rate", "May have grounds, but the town has no tax rate: no savings, warning",
         fake_town("test-no-rate", comps=same_value_comps(500_000, eight), rate=None, **ar80), "500000", None),
        ("edge-time-adjust", "Older comps get a lower recency weight and an index-adjusted price",
         fake_town("test-time", comps=[(d, 500_000, 450_000) for d in
                                       ("2024-10-15", "2025-03-10", "2025-07-01", "2025-10-15",
                                        "2026-01-20", "2026-04-05", "2026-06-10", "2026-06-25")], **ar80),
         "450000", None),
    ]
    return [{"id": cid, "description": desc, "town_data": town,
             "input": {"town": town["slug"], "assessed_value": a, "own_estimate": own}}
            for cid, desc, town, a, own in cases]


def invalid_cases():
    """Inputs the checker must refuse, each with the error codes we expect."""
    rows = [
        ("invalid-blank", "Blank assessed value", "ridgewood", "", None),
        ("invalid-letters", "Letters instead of a number", "ridgewood", "four hundred thousand", None),
        ("invalid-negative", "Negative assessed value", "ridgewood", "-450000", None),
        ("invalid-too-large", "Assessed value over $20,000,000", "ridgewood", "25,000,000", None),
        ("invalid-too-small", "Assessed value under $10,000", "ridgewood", "4500", None),
        ("invalid-cents", "Assessed value with cents", "ridgewood", "450000.50", None),
        ("invalid-unknown-town", "Town not in Bergen", "newark", "450000", None),
        ("invalid-no-town", "No town chosen", "", "450000", None),
        ("invalid-own-letters", "Own estimate with letters", "ridgewood", "450000", "abc"),
    ]
    return [{"id": cid, "description": desc, "town_data": None,
             "input": {"town": town, "assessed_value": a, "own_estimate": own}}
            for cid, desc, town, a, own in rows]


def real_cases(slugs):
    """Real towns: a few named ones that test special rules, then random towns and values (fixed seed)."""
    rng = random.Random(config.RANDOM_SEED)
    named = [
        ("real-teterboro", "Teterboro: no comps at all", "teterboro", "300000", None),
        ("real-rockleigh", "Rockleigh: average ratio over 100% and very few sales", "rockleigh", "1500000", None),
        ("real-elmwood-park", "Elmwood Park: average ratio 108.46%", "elmwood-park", "480000", "450000"),
        ("real-formatted-input", "Typed with a dollar sign and commas", "new-milford", "$ 650,000.00", "1,000,000"),
        ("real-old-tappan-grounds", "Old Tappan: one of the few real values that gives 'may have grounds'",
         "old-tappan", "1739400", None),
        ("real-alpine-grounds", "Alpine: another real value that gives 'may have grounds'", "alpine", "2211300", None),
        ("real-ridgewood-reval-2027", "Ridgewood: 2027 revaluation town (K14)", "ridgewood", "850000", "1000000"),
    ]
    cases = [{"id": cid, "description": desc, "town_data": None,
              "input": {"town": t, "assessed_value": a, "own_estimate": own}} for cid, desc, t, a, own in named]
    for i, slug in enumerate(rng.sample(slugs, config.CHECKER_N_RANDOM_CASES)):
        town = load_town(slug)
        if town["comps"]:
            base = rng.choice(town["comps"])["assessed_value"]
        else:
            base = rng.randrange(300_000, 1_200_000)
        assessed = max(config.CHECKER_INPUT_MIN, round(base * rng.uniform(0.85, 1.15), -2))
        own = None
        if i % 3 == 0:  # every third case also has the homeowner's own estimate
            own = str(round(assessed / (town["ch123"]["average_ratio"] / 100) * rng.uniform(0.7, 1.3), -3))
        cases.append({"id": f"random-{i + 1:02d}-{slug}", "description": f"Random real case in {town['name']}",
                      "town_data": None, "input": {"town": slug, "assessed_value": str(int(assessed)),
                                                   "own_estimate": own}})
    return cases


def expected_for(case, slugs, price_index):
    """Run the reference checker on one case and return its expected answer."""
    inp = case["input"]
    known = slugs + ([case["town_data"]["slug"]] if case["town_data"] else [])
    inputs, errors = validate_inputs(inp["town"], inp["assessed_value"], inp["own_estimate"], known)
    if inputs is None:
        return {"valid": False, "errors": errors}
    town = case["town_data"] or load_town(inputs["town"])
    return {"valid": True, **run_checker(town, price_index, inputs["assessed_value"], inputs["own_estimate"])}


def build_fixtures():
    """Every fixture case with its expected answer from this reference version."""
    slugs = town_slugs()
    price_index = load_price_index()
    cases = real_cases(slugs) + edge_cases() + invalid_cases()
    for case in cases:
        case["expected"] = expected_for(case, slugs, price_index)
    return {
        "about": ("Made by pipeline/checker_reference.py (the Python reference checker) from the files in "
                  "site/public/data/. site/lib/checker/checker.test.ts checks that the website's checker gives "
                  "the same answers. Do not edit by hand; rerun the fixtures stage."),
        "seed": config.RANDOM_SEED,
        "price_index_base_month": price_index["base_month"],
        "tolerances": {"dollars": 1, "ratio": 0.0001},
        "cases": cases,
    }


# ---------------------------------------------------------------- how often each result happens (Section 7)

def sweep_values(town, step=config.CHECKER_SWEEP_STEP):
    """Assessed values from the town's lowest to highest comp assessment, each 1% above the last (whole dollars)."""
    values = [c["assessed_value"] for c in town["comps"]]
    if not values:
        return []
    out, v = [], float(min(values))
    while v <= max(values):
        out.append(int(v))
        v *= 1 + step
    return out


def grounds_sweep(slugs, price_index):
    """Run the checker at many assessed values in every town; count each result (no own estimate).

    Shows how often the comp estimate alone can give "may have grounds" (methodology Section 7).
    One row per town; towns with no comps get a row of zeros.
    """
    rows = []
    for slug in slugs:
        town = load_town(slug)
        counts = {"may-have-grounds": 0, "within-range": 0, "possibly-under-assessed": 0,
                  "not-enough-data": 0, "revaluation-no-test": 0}
        closest = None
        for value in sweep_values(town):
            r = run_checker(town, price_index, value)
            counts[r["verdict"]] += 1
            if r["homeowner_ratio"] is not None:
                gap = r["homeowner_ratio"] - r["upper_trigger"]
                closest = gap if closest is None else max(closest, gap)
        rows.append({"slug": slug, "town": town["name"], "revaluation_tax_year": town["revaluation_tax_year"],
                     "n_comps_in_file": len(town["comps"]), "n_values_tried": sum(counts.values()),
                     **{f"n_{k.replace('-', '_')}": n for k, n in counts.items()},
                     "max_points_above_upper_trigger": None if closest is None else round(closest, 2)})
    return pd.DataFrame(rows)


def sweep_summary(sweep):
    """Plain counts for the methodology: towns where a Chapter 123 result is possible, and how many can give grounds."""
    testable = sweep[(sweep["revaluation_tax_year"] != config.CH123_TAX_YEAR)
                     & (sweep["n_values_tried"] > sweep["n_not_enough_data"])]
    grounds = testable[testable["n_may_have_grounds"] > 0]
    return {"towns_with_a_test_result": len(testable), "towns_with_any_grounds": len(grounds),
            "grounds_towns": ", ".join(grounds["town"]),
            "share_of_tested_values_with_grounds": float(round(
                testable["n_may_have_grounds"].sum() / max(1, (testable["n_values_tried"]
                                                                - testable["n_not_enough_data"]).sum()), 4))}


def main():
    """Write pipeline/fixtures/checker_cases.json and data/processed/checker_grounds_sweep.csv."""
    fixtures = build_fixtures()
    config.CHECKER_FIXTURES_JSON.parent.mkdir(parents=True, exist_ok=True)
    config.CHECKER_FIXTURES_JSON.write_text(json.dumps(fixtures, indent=1) + "\n", encoding="utf-8")
    verdicts = {}
    for c in fixtures["cases"]:
        key = c["expected"]["verdict"] if c["expected"]["valid"] else "invalid input"
        verdicts[key] = verdicts.get(key, 0) + 1
    print(f"Wrote {len(fixtures['cases'])} checker cases to {config.CHECKER_FIXTURES_JSON.relative_to(config.ROOT)}")
    for k, n in sorted(verdicts.items()):
        print(f"  {k}: {n}")
    sweep = grounds_sweep(town_slugs(), load_price_index())
    sweep.to_csv(config.CHECKER_SWEEP_CSV, index=False)
    print(f"Wrote {config.CHECKER_SWEEP_CSV.relative_to(config.ROOT)}: {sweep_summary(sweep)}")


if __name__ == "__main__":
    main()
