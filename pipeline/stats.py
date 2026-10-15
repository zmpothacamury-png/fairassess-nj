"""Ratio study statistics (docs/methodology.md Sections 2.2, 5.1 to 5.4).

Every function here is pure: it takes numbers in and gives numbers out,
with no files and no randomness except a seeded bootstrap. Inputs are
assessed values A and sale prices S for one group of sales (one town, or
the county). Ratio R = A / S.

Every number these functions use lives in pipeline/config.py.
"""

import math

import numpy as np
import pandas as pd

from pipeline import config


def _arrays(assessed, prices):
    """Turn assessed values and sale prices into float arrays of the same length."""
    a = np.asarray(assessed, dtype=float)
    s = np.asarray(prices, dtype=float)
    if a.shape != s.shape:
        raise ValueError("assessed and prices must be the same length")
    return a, s


# ---------------------------------------------------------------- level

def median_ratio(ratios):
    """Median ratio = the middle R when sorted (average of the two middle values if n is even)."""
    return float(np.median(np.asarray(ratios, dtype=float)))


def mean_ratio(ratios):
    """Mean ratio = (R_1 + R_2 + ... + R_n) / n."""
    return float(np.mean(np.asarray(ratios, dtype=float)))


def weighted_mean_ratio(assessed, prices):
    """Weighted mean ratio = (A_1 + ... + A_n) / (S_1 + ... + S_n)."""
    a, s = _arrays(assessed, prices)
    return float(a.sum() / s.sum())


# ---------------------------------------------------------------- uniformity

def cod(ratios):
    """COD = 100 x [ (sum of |R_i - median ratio|) / n ] / median ratio."""
    r = np.asarray(ratios, dtype=float)
    med = np.median(r)
    return float(100 * np.mean(np.abs(r - med)) / med)


def prd(assessed, prices):
    """PRD = mean ratio / weighted mean ratio, where R_i = A_i / S_i."""
    a, s = _arrays(assessed, prices)
    return mean_ratio(a / s) / weighted_mean_ratio(a, s)


def value_proxy(assessed, prices):
    """Value proxy V_i = 0.5 x (A_i / median ratio) + 0.5 x S_i (IAAO Appendix D, step 1)."""
    a, s = _arrays(assessed, prices)
    med = np.median(a / s)
    w = config.PRB_VALUE_WEIGHT
    return w * (a / med) + (1 - w) * s


def prb(assessed, prices):
    """PRB = slope b of the least squares line y = a + b x (IAAO Appendix D).

    y_i = (R_i - median ratio) / median ratio
    x_i = ln(V_i) / 0.693, where V_i is the value proxy
    b = sum((x - mean x)(y - mean y)) / sum((x - mean x)^2)
    standard error = sqrt( sum(residual^2) / (n - 2) / sum((x - mean x)^2) )
    95% range = b - 1.96 x SE to b + 1.96 x SE

    Returns a dict: prb, se, ci_low, ci_high, n. With fewer than 3 sales,
    or if every value proxy is the same, the numbers are NaN.
    """
    a, s = _arrays(assessed, prices)
    n = len(a)
    out = {"prb": math.nan, "se": math.nan, "ci_low": math.nan, "ci_high": math.nan, "n": n}
    if n < 3:
        return out
    r = a / s
    med = np.median(r)
    y = (r - med) / med
    x = np.log(value_proxy(a, s)) / config.PRB_LOG_DIVISOR
    dx = x - x.mean()
    sxx = float(np.sum(dx ** 2))
    if sxx == 0:
        return out
    b = float(np.sum(dx * (y - y.mean())) / sxx)
    intercept = y.mean() - b * x.mean()
    resid = y - (intercept + b * x)
    se = float(math.sqrt(np.sum(resid ** 2) / (n - 2) / sxx))
    out.update(prb=b, se=se, ci_low=b - config.PRB_CI_Z * se, ci_high=b + config.PRB_CI_Z * se)
    return out


# ---------------------------------------------------------------- confidence ranges

def bootstrap_ci(assessed, prices, n_resamples=config.BOOTSTRAP_RESAMPLES, seed=config.RANDOM_SEED):
    """Percentile bootstrap 95% ranges for median ratio, COD, and PRD (rule T4).

    Draw n_resamples resamples of the sales (same size, with replacement),
    compute each measure on every resample, and take the 2.5th and 97.5th
    percentiles. The same seed always gives the same answer.

    Returns a dict: median_ci_low, median_ci_high, cod_ci_low, cod_ci_high,
    prd_ci_low, prd_ci_high.
    """
    a, s = _arrays(assessed, prices)
    n = len(a)
    keys = ["median_ci_low", "median_ci_high", "cod_ci_low", "cod_ci_high", "prd_ci_low", "prd_ci_high"]
    if n == 0:
        return dict.fromkeys(keys, math.nan)
    rng = np.random.default_rng(seed)
    idx = rng.integers(0, n, size=(n_resamples, n))
    ra, rs = a[idx], s[idx]
    r = ra / rs
    med = np.median(r, axis=1)
    cods = 100 * np.mean(np.abs(r - med[:, None]), axis=1) / med
    prds = r.mean(axis=1) / (ra.sum(axis=1) / rs.sum(axis=1))
    pct = [config.CI_LOW_PCT, config.CI_HIGH_PCT]
    out = {}
    for name, values in [("median", med), ("cod", cods), ("prd", prds)]:
        low, high = np.percentile(values, pct)
        out[f"{name}_ci_low"], out[f"{name}_ci_high"] = float(low), float(high)
    return out


# ---------------------------------------------------------------- value quarters

def tier_sizes(n, n_tiers=config.N_TIERS):
    """How many sales go in each quarter: equal counts, extras to the lower quarters (rule T3).

    Example: 10 sales -> [3, 3, 2, 2].
    """
    base, extra = divmod(n, n_tiers)
    return [base + (1 if i < extra else 0) for i in range(n_tiers)]


def tier_key(assessed, prices, basis="value_proxy"):
    """The number sales are sorted by for quarters.

    basis = "value_proxy": the PRB value proxy (rule T3, the main results).
    basis = "sale_price": sale price (comparison only; see T3 note).
    """
    a, s = _arrays(assessed, prices)
    if basis == "value_proxy":
        return value_proxy(a, s)
    if basis == "sale_price":
        return s
    raise ValueError(f"unknown basis {basis!r}")


def tier_numbers(assessed, prices, basis="value_proxy", n_tiers=config.N_TIERS):
    """Quarter (1 to 4) of each sale, in input order (rule T3).

    Sort by the tier key; equal-count groups with extras in the lower
    quarters. Ties keep the input order (stable sort), so it always repeats.
    """
    key = tier_key(assessed, prices, basis)
    order = np.argsort(key, kind="mergesort")
    tiers = np.zeros(len(key), dtype=int)
    start = 0
    for tier, size in enumerate(tier_sizes(len(key), n_tiers), start=1):
        tiers[order[start:start + size]] = tier
        start += size
    return tiers


def value_tiers(assessed, prices, basis="value_proxy", n_tiers=config.N_TIERS):
    """Split sales into 4 equal-count quarters and give the median ratio of each (rule T3).

    Tier 1 is the lowest-value quarter, tier 4 the highest.

    Returns a DataFrame: tier, n, value_low, value_high, sale_price_low,
    sale_price_high, median_ratio.
    """
    a, s = _arrays(assessed, prices)
    key = tier_key(a, s, basis)
    tiers = tier_numbers(a, s, basis, n_tiers)
    rows = []
    for tier in range(1, n_tiers + 1):
        pick = tiers == tier
        if not pick.any():
            rows.append({"tier": tier, "n": 0, "value_low": math.nan, "value_high": math.nan,
                         "sale_price_low": math.nan, "sale_price_high": math.nan, "median_ratio": math.nan})
            continue
        rows.append({
            "tier": tier, "n": int(pick.sum()),
            "value_low": float(key[pick].min()), "value_high": float(key[pick].max()),
            "sale_price_low": float(s[pick].min()), "sale_price_high": float(s[pick].max()),
            "median_ratio": median_ratio(a[pick] / s[pick]),
        })
    return pd.DataFrame(rows)


# ---------------------------------------------------------------- Chapter 123 (T7)

def ch123_triggers(lower_limit, upper_limit):
    """Chapter 123 triggers, in percent (rule K10).

    Upper trigger U* = min(upper limit, 100). Lower trigger L* = min(lower limit, 100).
    Limits are used exactly as printed in 2027CH123.pdf.
    """
    cap = config.CH123_RATIO_CAP
    return min(float(lower_limit), cap), min(float(upper_limit), cap)


def ch123_shares(ratios, lower_trigger, upper_trigger):
    """Share of sales above U* and below L* (rule T7). Ratios are decimals; triggers are percents.

    above = count(100 x R > U*) / n; below = count(100 x R < L*) / n.
    Returns a dict: n, n_above, n_below, share_above, share_below.
    """
    pct = 100 * np.asarray(ratios, dtype=float)
    n = len(pct)
    n_above, n_below = int((pct > upper_trigger).sum()), int((pct < lower_trigger).sum())
    return {"n": n, "n_above": n_above, "n_below": n_below,
            "share_above": n_above / n if n else math.nan, "share_below": n_below / n if n else math.nan}


# ---------------------------------------------------------------- labels

def data_quality(n, recent_revaluation=False):
    """Data quality flag (rules T6 and C9).

    2026 revaluation town with under 20 sales -> "recent revaluation";
    under 20 -> "not enough sales"; 20 to 39 -> "limited data"; 40+ -> "normal".
    """
    if n < config.MIN_SALES_SHOW:
        return config.QUALITY_RECENT_REVAL if recent_revaluation else config.QUALITY_NOT_ENOUGH
    if n < config.MIN_SALES_FULL:
        return config.QUALITY_LIMITED
    return config.QUALITY_NORMAL


def has_enough_sales(n, recent_revaluation=False):
    """True if a town's statistics are shown and ranked (20 or more sales, T6)."""
    return data_quality(n, recent_revaluation) in (config.QUALITY_NORMAL, config.QUALITY_LIMITED)


def town_label(n, prd_value, prb_value, recent_revaluation=False):
    """Town label (rule T5), checked in this order, using the point estimates:

    1. Not enough sales: under 20 sales, or a 2026 revaluation town under 20 (C9)
    2. Regressive pattern: PRD > 1.03 and PRB < -0.05
    3. Progressive pattern: PRD < 0.98 and PRB > 0.05
    4. Within standards: PRD from 0.98 to 1.03 and PRB from -0.05 to +0.05
    5. Mixed signals: anything else
    """
    if not has_enough_sales(n, recent_revaluation):
        return config.LABEL_NOT_ENOUGH
    if prd_value > config.PRD_HIGH and prb_value < config.PRB_LOW:
        return config.LABEL_REGRESSIVE
    if prd_value < config.PRD_LOW and prb_value > config.PRB_HIGH:
        return config.LABEL_PROGRESSIVE
    if config.PRD_LOW <= prd_value <= config.PRD_HIGH and config.PRB_LOW <= prb_value <= config.PRB_HIGH:
        return config.LABEL_WITHIN
    return config.LABEL_MIXED


def iaao_flags(cod_value, prd_value, prb_result):
    """IAAO pass/fail flags (Section 2.3). prb_result is the dict from prb().

    cod_meets_iaao: COD at most 15.0. cod_below_5: COD under 5.0 (IAAO warning).
    prd_meets_iaao: PRD from 0.98 to 1.03. prb_meets_iaao: PRB from -0.05 to 0.05.
    prb_ci_outside_0_10: the whole 95% PRB range is below -0.10 or above 0.10.
    """
    lim = config.PRB_UNACCEPTABLE
    return {
        "cod_meets_iaao": bool(cod_value <= config.COD_MAX),
        "cod_below_5": bool(cod_value < config.COD_LOW_WARNING),
        "prd_meets_iaao": bool(config.PRD_LOW <= prd_value <= config.PRD_HIGH),
        "prb_meets_iaao": bool(config.PRB_LOW <= prb_result["prb"] <= config.PRB_HIGH),
        "prb_ci_outside_0_10": bool(prb_result["ci_high"] < -lim or prb_result["ci_low"] > lim),
    }


def point_measures(assessed, prices):
    """All point estimates for one group of sales: n, median, mean, weighted mean, COD, PRD, PRB (+ SE, range)."""
    a, s = _arrays(assessed, prices)
    r = a / s
    p = prb(a, s)
    return {
        "n_sales": len(a),
        "median_ratio": median_ratio(r), "mean_ratio": mean_ratio(r),
        "weighted_mean_ratio": weighted_mean_ratio(a, s),
        "cod": cod(r), "prd": prd(a, s),
        "prb": p["prb"], "prb_se": p["se"], "prb_ci_low": p["ci_low"], "prb_ci_high": p["ci_high"],
    }
