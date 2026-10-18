// Settings for the appeal checker (docs/methodology.md Section 6).
// Every number here comes from a methodology rule or from the sources it cites.
// The Python reference version (pipeline/checker_reference.py) keeps its own
// copy in pipeline/config.py, so the two versions stay independent.

/** Input range for the assessed value and the homeowner's own estimate (K1). Our choice: wide enough
 *  for every Bergen home (comps run from about $52,000 to $16,500,000), narrow enough to catch typos. */
export const MIN_INPUT_DOLLARS = 10_000;
export const MAX_INPUT_DOLLARS = 20_000_000;

/** K2: assessed-value band, in whole percents so the edge test uses exact whole-number math. */
export const BAND_PERCENT = 15;
export const WIDE_BAND_PERCENT = 25;
/** K2: widen the band if the 15% band finds fewer than this many comps. */
export const MIN_COMPS_BEFORE_WIDENING = 8;
/** K3: fewer comps than this after widening means "Not enough data". */
export const MIN_COMPS = 5;

/** Section 3.3: the valuation date for tax year 2027 appeals. */
export const VALUATION_DATE = "2026-10-01";
/** K6: months are days / 30.4375 (the average month length). */
export const DAYS_PER_MONTH = 30.4375;
/** K6: recency weight halves every 12 months. */
export const HALF_LIFE_MONTHS = 12;
/** K6: a comp at the edge of the band keeps half its weight. */
export const EDGE_SIZE_WEIGHT = 0.5;

/** K8: the weighted percentiles behind the low, middle, and high estimate. */
export const PERCENTILES = { low: 0.25, mid: 0.5, high: 0.75 } as const;

/** K9: warn when the homeowner's own estimate differs from ours by more than 20%. */
export const OWN_ESTIMATE_WARN_SHARE = 0.2;

/** K10: "RATIOS IN EXCESS OF 100% ARE TO BE CONSIDERED 100%" (2027CH123.pdf). */
export const RATIO_CAP_PERCENT = 100;
/** K14: towns whose revaluation or reassessment takes effect this tax year get no Chapter 123 result. */
export const CHAPTER123_TAX_YEAR = 2027;

/** Floating-point allowances (methodology Section 6.8). A homeowner ratio within this many percentage
 *  points of a limit counts as exactly at the limit (so it is "within" the range). */
export const LIMIT_TOLERANCE_POINTS = 1e-6;
/** K7: a running weight within this share of the target counts as reaching it. */
export const PERCENTILE_TOLERANCE = 1e-9;

/** K13: Form A-1 instruction 4 filing fees (data/raw/notes/appeal-deadlines-and-fees.md). */
export const FILING_FEES = [
  { below: 150_000, fee: 5 },
  { below: 500_000, fee: 25 },
  { below: 1_000_000, fee: 100 },
  { below: Infinity, fee: 150 },
] as const;

/** K13: Form A-1 instruction 1. April 1 of the tax year; May 1 in a town whose town-wide revaluation
 *  or reassessment takes effect that year. Received, not postmarked; weekends and holidays move it
 *  to the next business day. */
export const DEADLINE_STANDARD = "April 1";
export const DEADLINE_REVALUATION = "May 1";
