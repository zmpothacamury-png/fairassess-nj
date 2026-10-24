// The appeal checker engine (docs/methodology.md Section 6).
//
// Pure functions only. Nothing here reads the network, the screen, storage, or
// the clock. The page passes in the town file and the price index, and gets
// one result object back. So nothing a homeowner types can leave the browser
// from this file (privacy rule). The only network call in lib/checker/ is
// fetchTownFile in load-town.ts, which loads a public town file and sends no
// homeowner input. checker.test.ts checks both of these.
//
// A second, independent version lives in pipeline/checker_reference.py. The
// tests run both on the same cases (pipeline/fixtures/checker_cases.json).
import type { Comp, PriceIndex, TownFile } from "../data/schema";
import { formatDollars, formatLongDate, formatMonthYear } from "../home";
import {
  BAND_PERCENT,
  CHAPTER123_TAX_YEAR,
  DAYS_PER_MONTH,
  DEADLINE_REVALUATION,
  DEADLINE_STANDARD,
  EDGE_SIZE_WEIGHT,
  FILING_FEES,
  HALF_LIFE_MONTHS,
  LIMIT_TOLERANCE_POINTS,
  MAX_INPUT_DOLLARS,
  MIN_COMPS,
  MIN_COMPS_BEFORE_WIDENING,
  MIN_INPUT_DOLLARS,
  OWN_ESTIMATE_WARN_SHARE,
  PERCENTILE_TOLERANCE,
  PERCENTILES,
  RATIO_CAP_PERCENT,
  VALUATION_DATE,
  WIDE_BAND_PERCENT,
} from "./config";

// ---------------------------------------------------------------- types

/** The parts of a town file the checker uses. */
export type CheckerTown = Pick<
  TownFile,
  "slug" | "name" | "revaluation_tax_year" | "ch123" | "tax_rate" | "comp_window" | "comps"
>;
/** The parts of price-index.json the checker uses. */
export type CheckerPriceIndex = Pick<PriceIndex, "base_month" | "months">;

export type InputField = "town" | "assessedValue" | "ownEstimate";
export type InputErrorCode =
  | "town-missing"
  | "town-unknown"
  | "blank"
  | "not-a-number"
  | "negative"
  | "not-whole"
  | "too-small"
  | "too-large";
export interface InputError {
  field: InputField;
  code: InputErrorCode;
  message: string;
}
/** What the homeowner typed, as text from the form. */
export interface RawInputs {
  town: string;
  assessedValue: string;
  ownEstimate?: string;
}
/** Checked inputs, ready for runChecker. */
export interface CheckerInputs {
  townSlug: string;
  assessedValue: number;
  ownEstimate: number | null;
}
export type InputCheck = { ok: true; inputs: CheckerInputs } | { ok: false; errors: InputError[] };

export interface CompSelection {
  /** 15, or 25 if the search was widened (K2). */
  bandPercent: number;
  widened: boolean;
  /** Comps found inside the 15% band, before any widening. */
  countAtFirstBand: number;
  /** The comps in the final band, oldest first (the town file's order). */
  comps: Comp[];
  /** False if fewer than 5 comps remain after widening (K3). */
  enough: boolean;
}

export interface AdjustedComp extends Comp {
  saleMonth: string; // YYYY-MM
  indexAtSale: number;
  indexAtValuation: number;
  adjustedPrice: number; // S_adj (not rounded)
  adjustedRatio: number; // R_adj = A / S_adj
}

export interface ScoredComp extends AdjustedComp {
  distance: number; // d = |comp A - homeowner A| / homeowner A
  sizeWeight: number;
  monthsBeforeValuation: number;
  timeWeight: number;
  weight: number;
}

export interface MarketValueEstimate {
  ratioP25: number;
  ratioP50: number;
  ratioP75: number;
  /** Whole dollars. Low comes from the 75th percentile ratio, high from the 25th (K8). */
  marketValueLow: number;
  marketValueMid: number;
  marketValueHigh: number;
  /** Not rounded, for the Chapter 123 test. */
  exact: { low: number; mid: number; high: number };
}

export type Chapter123Position = "above" | "within" | "below";
export interface Chapter123Test {
  /** h = assessed value / market value x 100. */
  homeownerRatio: number;
  averageRatioUsed: number; // AR* = min(AR, 100)
  lowerTrigger: number; // L* = min(L, 100)
  upperTrigger: number; // U* = min(U, 100)
  position: Chapter123Position;
}

export interface SavingsEstimate {
  correctedAssessment: number; // whole dollars
  yearlySavings: number; // whole dollars
  generalTaxRate: number; // dollars per $100 of assessed value
  taxRateYear: number;
}

export type Verdict =
  | "may-have-grounds"
  | "within-range"
  | "possibly-under-assessed"
  | "not-enough-data"
  | "revaluation-no-test";
export type Strength = "strong" | "borderline";
export type WarningCode =
  | "own-estimate-differs"
  | "revaluation-this-year"
  | "revaluation-last-year"
  | "limited-data"
  | "widened-band"
  | "no-tax-rate";
export interface CheckerWarning {
  code: WarningCode;
  message: string;
}

/** One comp as the result shows it. Sale month only, never the full date. */
export interface CompUsed {
  saleMonth: string;
  salePrice: number;
  adjustedPrice: number;
  assessedValue: number;
  adjustedRatio: number;
  sizeWeight: number;
  timeWeight: number;
  weight: number;
}

export interface CheckerResult {
  verdict: Verdict;
  strength: Strength | null;
  town: { slug: string; name: string; revaluationTaxYear: number | null };
  assessedValue: number;
  comps: {
    windowFrom: string;
    windowTo: string;
    bandPercent: number;
    widened: boolean;
    countAtFirstBand: number;
    count: number;
    used: CompUsed[];
  };
  estimate: MarketValueEstimate | null;
  /** Null for "not enough data" and for towns where Chapter 123 does not apply this year (K14). */
  chapter123: (Chapter123Test & { ratioAtHighValue: number; averageRatio: number; lowerLimit: number; upperLimit: number }) | null;
  ownEstimate: {
    value: number;
    test: Chapter123Test | null;
    /** |own - middle estimate| / middle estimate, or null with no estimate. */
    differenceShare: number | null;
  } | null;
  savings: SavingsEstimate | null;
  appeal: { taxYear: number; deadline: string; filingFee: number };
  warnings: CheckerWarning[];
  /** True when the homeowner gave no estimate of their own and our comps did not find grounds.
   *  The page should invite them to enter one (an appraisal or their own comparable sales), because
   *  comps matched by assessed value rarely find grounds on their own (methodology Section 7). */
  suggestOwnEstimate: boolean;
  /** "Show the math": plain-English steps with the real numbers filled in. */
  steps: string[];
}

// ---------------------------------------------------------------- small helpers

const MS_PER_DAY = 86_400_000;

/** Days from one YYYY-MM-DD date to another, counted in UTC so time zones never shift the answer. */
function daysBetween(fromIso: string, toIso: string): number {
  const utc = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((utc(toIso) - utc(fromIso)) / MS_PER_DAY);
}

/** 98.7654 -> "98.77%". The state prints its ratios with 2 decimals. */
function pct(points: number): string {
  return `${points.toFixed(2)}%`;
}

/** Whole dollars, rounding halves up (the same rule as the Python reference). */
function wholeDollars(x: number): number {
  return Math.floor(x + 0.5);
}

/** K13: Form A-1 filing fee for an assessed value. */
export function filingFee(assessedValue: number): number {
  return FILING_FEES.find((row) => assessedValue < row.below)!.fee;
}

// ---------------------------------------------------------------- K1: inputs

const FIELD_WORDS: Record<Exclude<InputField, "town">, string> = {
  assessedValue: "assessed value",
  ownEstimate: "market value estimate",
};

/** Read one dollar amount typed by the homeowner. Allows "$", commas, spaces, and ".00". */
function parseDollars(text: string | undefined, field: "assessedValue" | "ownEstimate"): InputError | number | null {
  const words = FIELD_WORDS[field];
  const err = (code: InputErrorCode, message: string): InputError => ({ field, code, message });
  const cleaned = (text ?? "").replace(/[\s,$]/g, "");
  if (cleaned === "") {
    if (field === "ownEstimate") return null; // optional
    return err("blank", "Please enter your assessed value. It is on your tax bill and your assessment notice.");
  }
  if (/^-\d+(\.\d+)?$/.test(cleaned)) return err("negative", `Your ${words} can't be a negative number.`);
  const decimal = /^(\d+)\.(\d+)$/.exec(cleaned);
  if (decimal && !/^0+$/.test(decimal[2])) {
    return err("not-whole", `Please enter your ${words} in whole dollars, with no cents.`);
  }
  const digits = decimal ? decimal[1] : cleaned;
  if (!/^\d+$/.test(digits)) {
    return err("not-a-number", `Your ${words} should be a number in dollars, like 450,000.`);
  }
  const value = Number(digits);
  if (value < MIN_INPUT_DOLLARS) {
    return err("too-small", `Your ${words} must be at least ${formatDollars(MIN_INPUT_DOLLARS)}. Check that no digits are missing.`);
  }
  if (value > MAX_INPUT_DOLLARS) {
    return err("too-large", `Your ${words} must be ${formatDollars(MAX_INPUT_DOLLARS)} or less. Check for extra digits.`);
  }
  return value;
}

/**
 * Check what the homeowner typed (methodology K1). The town must be one of `townSlugs`.
 * The assessed value is required; the market value estimate is optional. Both must be
 * whole dollars from $10,000 to $20,000,000 (config.ts). Returns every problem at once,
 * each with a friendly message.
 */
export function validateInputs(raw: RawInputs, townSlugs: readonly string[]): InputCheck {
  const errors: InputError[] = [];
  const town = raw.town.trim();
  if (town === "") errors.push({ field: "town", code: "town-missing", message: "Please choose your town." });
  else if (!townSlugs.includes(town)) {
    errors.push({
      field: "town",
      code: "town-unknown",
      message: "We don't have data for that town. Please choose a Bergen County town from the list.",
    });
  }
  const assessed = parseDollars(raw.assessedValue, "assessedValue");
  const own = parseDollars(raw.ownEstimate, "ownEstimate");
  for (const v of [assessed, own]) if (v !== null && typeof v === "object") errors.push(v);
  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, inputs: { townSlug: town, assessedValue: assessed as number, ownEstimate: own as number | null } };
}

// ---------------------------------------------------------------- K2, K3: comps

/** True if a comp's assessed value is within `bandPercent` of the homeowner's, edge included.
 *  Whole-number math (100 x gap <= percent x value), so a comp exactly on the edge always counts. */
function inBand(compAssessed: number, assessedValue: number, bandPercent: number): boolean {
  return 100 * Math.abs(compAssessed - assessedValue) <= bandPercent * assessedValue;
}

/**
 * Pick the comparable sales (methodology K2 and K3). Keep the town's clean sales with a deed date
 * inside the comp window and an assessed value within 15% of the homeowner's. If that finds fewer
 * than 8, widen to 25%. Fewer than 5 after that is "not enough". Reports the band used.
 * (The town file holds only clean sales on the current assessment basis, rules C1 to C10.)
 */
export function selectComps(town: CheckerTown, assessedValue: number): CompSelection {
  const { deed_date_from: from, deed_date_to: to } = town.comp_window;
  const pool = town.comps.filter((c) => c.deed_date >= from && c.deed_date <= to);
  const narrow = pool.filter((c) => inBand(c.assessed_value, assessedValue, BAND_PERCENT));
  if (narrow.length >= MIN_COMPS_BEFORE_WIDENING) {
    return { bandPercent: BAND_PERCENT, widened: false, countAtFirstBand: narrow.length, comps: narrow, enough: true };
  }
  const wide = pool.filter((c) => inBand(c.assessed_value, assessedValue, WIDE_BAND_PERCENT));
  return {
    bandPercent: WIDE_BAND_PERCENT,
    widened: true,
    countAtFirstBand: narrow.length,
    comps: wide,
    enough: wide.length >= MIN_COMPS,
  };
}

// ---------------------------------------------------------------- K4, K5: time adjustment

/**
 * Bring each comp's price to October 1, 2026 terms (methodology K4 and K5):
 * S_adj = S x I(base month) / I(sale month), and R_adj = A / S_adj.
 * A sale after the base month uses the base month's index (K5: flat, no forecast).
 * Throws if a sale month is missing from the index, since that would be a data error.
 */
export function timeAdjust(comps: Comp[], priceIndex: CheckerPriceIndex): AdjustedComp[] {
  const byMonth = new Map<string, number>();
  for (const m of priceIndex.months) if (m.kept && m.index !== null) byMonth.set(m.month, m.index);
  const base = byMonth.get(priceIndex.base_month);
  if (base === undefined) throw new Error(`price index has no value for its base month ${priceIndex.base_month}`);
  return comps.map((c) => {
    const saleMonth = c.deed_date.slice(0, 7);
    const atSale = saleMonth > priceIndex.base_month ? base : byMonth.get(saleMonth);
    if (atSale === undefined) throw new Error(`price index has no value for ${saleMonth}`);
    const adjustedPrice = (c.sale_price * base) / atSale;
    return {
      ...c,
      saleMonth,
      indexAtSale: atSale,
      indexAtValuation: base,
      adjustedPrice,
      adjustedRatio: c.assessed_value / adjustedPrice,
    };
  });
}

// ---------------------------------------------------------------- K6: weights

/**
 * Weight each comp by closeness and recency, exactly as methodology K6 says:
 * d = |comp A - homeowner A| / homeowner A;  w_size = 1 - 0.5 x (d / band);
 * t = days from the deed date to October 1, 2026 / 30.4375;  w_time = 0.5 ^ (t / 12);
 * weight = w_size x w_time.
 */
export function scoreComps(comps: AdjustedComp[], assessedValue: number, bandPercent: number): ScoredComp[] {
  const band = bandPercent / 100;
  return comps.map((c) => {
    const distance = Math.abs(c.assessed_value - assessedValue) / assessedValue;
    const sizeWeight = 1 - EDGE_SIZE_WEIGHT * (distance / band);
    const monthsBeforeValuation = daysBetween(c.deed_date, VALUATION_DATE) / DAYS_PER_MONTH;
    const timeWeight = 0.5 ** (monthsBeforeValuation / HALF_LIFE_MONTHS);
    return { ...c, distance, sizeWeight, monthsBeforeValuation, timeWeight, weight: sizeWeight * timeWeight };
  });
}

// ---------------------------------------------------------------- K7, K8: market value

/**
 * Weighted percentile (methodology K7): sort by R_adj, add up the weights in that order,
 * and return the first R_adj where the running total reaches p of the total weight.
 * A running total within a billionth of the target counts as reaching it (Section 6.8).
 */
export function weightedPercentile(comps: Pick<ScoredComp, "adjustedRatio" | "weight">[], p: number): number {
  if (comps.length === 0) throw new Error("weightedPercentile needs at least one comp");
  const sorted = [...comps].sort((a, b) => a.adjustedRatio - b.adjustedRatio);
  const total = sorted.reduce((sum, c) => sum + c.weight, 0);
  const target = p * total * (1 - PERCENTILE_TOLERANCE);
  let running = 0;
  for (const c of sorted) {
    running += c.weight;
    if (running >= target) return c.adjustedRatio;
  }
  return sorted[sorted.length - 1].adjustedRatio;
}

/**
 * Estimated market value (methodology K8): middle = A / weighted median R_adj;
 * low = A / weighted 75th percentile; high = A / weighted 25th percentile.
 */
export function estimateMarketValue(comps: ScoredComp[], assessedValue: number): MarketValueEstimate {
  const ratioP25 = weightedPercentile(comps, PERCENTILES.low);
  const ratioP50 = weightedPercentile(comps, PERCENTILES.mid);
  const ratioP75 = weightedPercentile(comps, PERCENTILES.high);
  const exact = { low: assessedValue / ratioP75, mid: assessedValue / ratioP50, high: assessedValue / ratioP25 };
  return {
    ratioP25,
    ratioP50,
    ratioP75,
    marketValueLow: wholeDollars(exact.low),
    marketValueMid: wholeDollars(exact.mid),
    marketValueHigh: wholeDollars(exact.high),
    exact,
  };
}

// ---------------------------------------------------------------- K10, K11: Chapter 123

/**
 * Chapter 123 test (methodology K10 and K11, from ch123definitions.pdf and 2027CH123.pdf).
 * h = assessed value / market value x 100. Ratios over 100% count as 100%, so
 * AR* = min(AR, 100), U* = min(U, 100), L* = min(L, 100).
 * "above" means h is strictly greater than U*; "below" means strictly less than L*.
 * Boundary: a ratio exactly on a limit is "within". Because computers store decimals with
 * tiny rounding errors, h within 0.000001 points of a limit counts as exactly on it.
 */
export function chapter123Test(
  assessedValue: number,
  marketValue: number,
  ch123: CheckerTown["ch123"],
): Chapter123Test {
  const homeownerRatio = (100 * assessedValue) / marketValue;
  const averageRatioUsed = Math.min(ch123.average_ratio, RATIO_CAP_PERCENT);
  const upperTrigger = Math.min(ch123.upper_limit, RATIO_CAP_PERCENT);
  const lowerTrigger = Math.min(ch123.lower_limit, RATIO_CAP_PERCENT);
  let position: Chapter123Position = "within";
  if (homeownerRatio > upperTrigger + LIMIT_TOLERANCE_POINTS) position = "above";
  else if (homeownerRatio < lowerTrigger - LIMIT_TOLERANCE_POINTS) position = "below";
  return { homeownerRatio, averageRatioUsed, lowerTrigger, upperTrigger, position };
}

// ---------------------------------------------------------------- K12: savings

/**
 * Estimated corrected assessment and yearly savings (methodology K12). Use only for a
 * "may have grounds" result. Corrected = middle market value x AR* / 100 (whole dollars).
 * Savings = (current assessment - corrected) x general tax rate / 100, with the newest
 * tax rate we have (labeled with its year). Returns null if the town has no tax rate.
 */
export function estimateSavings(
  assessedValue: number,
  marketValueMid: number,
  ch123: CheckerTown["ch123"],
  taxRate: CheckerTown["tax_rate"],
): SavingsEstimate | null {
  if (taxRate === null) return null;
  const correctedAssessment = wholeDollars((marketValueMid * Math.min(ch123.average_ratio, RATIO_CAP_PERCENT)) / 100);
  return {
    correctedAssessment,
    yearlySavings: wholeDollars(((assessedValue - correctedAssessment) * taxRate.general_tax_rate) / 100),
    generalTaxRate: taxRate.general_tax_rate,
    taxRateYear: taxRate.year,
  };
}

// ---------------------------------------------------------------- putting it together

const VERDICT_FOR: Record<Chapter123Position, Verdict> = {
  above: "may-have-grounds",
  within: "within-range",
  below: "possibly-under-assessed",
};

/**
 * Run the whole checker (methodology Section 6, rules K1 to K14) for checked inputs.
 * Returns the verdict, its strength, every key number, the comps used, warnings, and
 * "show the math" steps. Pure: the same inputs always give the same result.
 */
export function runChecker(inputs: CheckerInputs, town: CheckerTown, priceIndex: CheckerPriceIndex): CheckerResult {
  const A = inputs.assessedValue;
  const revalThisYear = town.revaluation_tax_year === CHAPTER123_TAX_YEAR;
  const revalLastYear = town.revaluation_tax_year === CHAPTER123_TAX_YEAR - 1;
  const selection = selectComps(town, A);
  const scored = scoreComps(timeAdjust(selection.comps, priceIndex), A, selection.bandPercent);
  const estimate = selection.enough ? estimateMarketValue(scored, A) : null;

  // Chapter 123 on our estimate (K10, K11), unless K3 or K14 stops it.
  let verdict: Verdict;
  let strength: Strength | null = null;
  let chapter123: CheckerResult["chapter123"] = null;
  if (estimate === null) verdict = "not-enough-data";
  else if (revalThisYear) verdict = "revaluation-no-test";
  else {
    const mid = chapter123Test(A, estimate.exact.mid, town.ch123);
    const atHigh = chapter123Test(A, estimate.exact.high, town.ch123);
    verdict = VERDICT_FOR[mid.position];
    if (verdict === "may-have-grounds") strength = atHigh.position === "above" ? "strong" : "borderline";
    chapter123 = {
      ...mid,
      ratioAtHighValue: atHigh.homeownerRatio,
      averageRatio: town.ch123.average_ratio,
      lowerLimit: town.ch123.lower_limit,
      upperLimit: town.ch123.upper_limit,
    };
  }

  // The homeowner's own estimate (K9): same test, shown side by side.
  let ownEstimate: CheckerResult["ownEstimate"] = null;
  if (inputs.ownEstimate !== null) {
    ownEstimate = {
      value: inputs.ownEstimate,
      test: revalThisYear ? null : chapter123Test(A, inputs.ownEstimate, town.ch123),
      differenceShare: estimate ? Math.abs(inputs.ownEstimate - estimate.exact.mid) / estimate.exact.mid : null,
    };
  }

  const savings =
    verdict === "may-have-grounds" && estimate
      ? estimateSavings(A, estimate.exact.mid, town.ch123, town.tax_rate)
      : null;

  const warnings = buildWarnings({ town, selection, estimate, ownEstimate, verdict, revalThisYear, revalLastYear });
  const used: CompUsed[] = scored.map((c) => ({
    saleMonth: c.saleMonth,
    salePrice: c.sale_price,
    adjustedPrice: wholeDollars(c.adjustedPrice),
    assessedValue: c.assessed_value,
    adjustedRatio: c.adjustedRatio,
    sizeWeight: c.sizeWeight,
    timeWeight: c.timeWeight,
    weight: c.weight,
  }));

  const result: CheckerResult = {
    verdict,
    strength,
    town: { slug: town.slug, name: town.name, revaluationTaxYear: town.revaluation_tax_year },
    assessedValue: A,
    comps: {
      windowFrom: town.comp_window.deed_date_from,
      windowTo: town.comp_window.deed_date_to,
      bandPercent: selection.bandPercent,
      widened: selection.widened,
      countAtFirstBand: selection.countAtFirstBand,
      count: selection.comps.length,
      used,
    },
    estimate,
    chapter123,
    ownEstimate,
    savings,
    appeal: {
      taxYear: CHAPTER123_TAX_YEAR,
      deadline: `${revalThisYear ? DEADLINE_REVALUATION : DEADLINE_STANDARD}, ${CHAPTER123_TAX_YEAR}`,
      filingFee: filingFee(A),
    },
    warnings,
    suggestOwnEstimate:
      inputs.ownEstimate === null && (verdict === "within-range" || verdict === "not-enough-data"),
    steps: [],
  };
  result.steps = showTheMath(result, scored);
  return result;
}

// ---------------------------------------------------------------- warnings

function buildWarnings(ctx: {
  town: CheckerTown;
  selection: CompSelection;
  estimate: MarketValueEstimate | null;
  ownEstimate: CheckerResult["ownEstimate"];
  verdict: Verdict;
  revalThisYear: boolean;
  revalLastYear: boolean;
}): CheckerWarning[] {
  const { town, selection, estimate, ownEstimate, verdict } = ctx;
  const out: CheckerWarning[] = [];
  if (ownEstimate?.differenceShare != null && ownEstimate.differenceShare > OWN_ESTIMATE_WARN_SHARE) {
    out.push({
      code: "own-estimate-differs",
      message:
        `Your estimate differs from ours by ${Math.round(ownEstimate.differenceShare * 100)}%. That can happen for good reasons. ` +
        "You know your home's size, condition, and updates, and our estimate does not. Recent sales may not match your home. " +
        "Online estimates can also be off.",
    });
  }
  if (ctx.revalThisYear) {
    out.push({
      code: "revaluation-this-year",
      message:
        `${town.name} is getting new assessments for ${CHAPTER123_TAX_YEAR}. Our numbers use the assessments from before that change, ` +
        `so we do not give a Chapter 123 result. Wait for your ${CHAPTER123_TAX_YEAR} assessment notice and compare it to the estimate. ` +
        `The appeal deadline for this town is ${DEADLINE_REVALUATION}.`,
    });
  }
  if (ctx.revalLastYear) {
    out.push({
      code: "revaluation-last-year",
      message:
        `${town.name} had a town-wide revaluation or reassessment for ${CHAPTER123_TAX_YEAR - 1}. ` +
        "We use only sales on the new assessments, so there are fewer sales to compare.",
    });
  }
  if (verdict !== "not-enough-data" && selection.comps.length < MIN_COMPS_BEFORE_WIDENING) {
    out.push({
      code: "limited-data",
      message: `This result is based on only ${selection.comps.length} sales. Treat it as a rough guide.`,
    });
  }
  if (selection.widened && estimate !== null) {
    out.push({
      code: "widened-band",
      message:
        `Fewer than ${MIN_COMPS_BEFORE_WIDENING} homes were assessed within ${BAND_PERCENT}% of yours, ` +
        `so we widened the search to ${WIDE_BAND_PERCENT}%. Some of these homes are less similar to yours.`,
    });
  }
  if (verdict === "may-have-grounds" && town.tax_rate === null) {
    out.push({ code: "no-tax-rate", message: "We don't have a tax rate for this town, so we can't estimate savings." });
  }
  return out;
}

// ---------------------------------------------------------------- show the math

/** Plain-English steps with the real numbers filled in. */
function showTheMath(r: CheckerResult, scored: ScoredComp[]): string[] {
  const A = r.assessedValue;
  const steps: string[] = [];
  const band = (p: number) =>
    `${formatDollars(A * (1 - p / 100))} to ${formatDollars(A * (1 + p / 100))}`;
  steps.push(
    `We looked for homes in ${r.town.name} that sold from ${formatMonthYear(r.comps.windowFrom)} to ` +
      `${formatMonthYear(r.comps.windowTo)} and were assessed within ${BAND_PERCENT}% of your ${formatDollars(A)} ` +
      `(${band(BAND_PERCENT)}). We found ${r.comps.countAtFirstBand}.`,
  );
  if (r.comps.widened) {
    steps.push(
      `That is fewer than ${MIN_COMPS_BEFORE_WIDENING}, so we widened the search to ${WIDE_BAND_PERCENT}% ` +
        `(${band(WIDE_BAND_PERCENT)}). We found ${r.comps.count}.`,
    );
  }
  if (r.estimate === null) {
    steps.push(
      `We need at least ${MIN_COMPS} sales to make a fair estimate, so we stopped here. ` +
        "You can look up recent sales yourself with the county's records or a real estate website.",
    );
    return steps;
  }

  const example = [...scored].sort((a, b) => a.deed_date.localeCompare(b.deed_date))[0];
  steps.push(
    `Home prices change over time, so we updated each sale price to ${formatLongDate(VALUATION_DATE)} prices with the ` +
      `Bergen County price index. For example, a home that sold for ${formatDollars(example.sale_price)} in ` +
      `${formatMonthYear(example.saleMonth)} counts as ${formatDollars(example.adjustedPrice)}.`,
  );
  const weights = scored.map((c) => c.weight);
  steps.push(
    "Each sale gets a weight. Homes assessed closer to yours count more, and recent sales count more " +
      `(a sale from 12 months before ${formatLongDate(VALUATION_DATE)} counts half as much). ` +
      `The weights run from ${Math.min(...weights).toFixed(2)} to ${Math.max(...weights).toFixed(2)}.`,
  );
  const e = r.estimate;
  steps.push(
    "For each sale, we divided its assessed value by its updated price. This is its assessment ratio. " +
      `Using the weights, the middle ratio is ${pct(100 * e.ratioP50)}. The middle half of ratios runs from ` +
      `${pct(100 * e.ratioP25)} to ${pct(100 * e.ratioP75)}.`,
  );
  steps.push(
    `Your assessed value divided by the middle ratio: ${formatDollars(A)} / ${pct(100 * e.ratioP50)} = ` +
      `${formatDollars(e.marketValueMid)}. That is our estimate of your home's market value. ` +
      `The likely range is ${formatDollars(e.marketValueLow)} to ${formatDollars(e.marketValueHigh)}.`,
  );
  if (r.verdict === "revaluation-no-test") {
    steps.push(
      `${r.town.name} is getting new assessments for ${CHAPTER123_TAX_YEAR}, so Chapter 123 does not apply this year. We stop here.`,
    );
    return steps;
  }

  const c = r.chapter123!;
  steps.push(
    `Your assessment ratio: ${formatDollars(A)} / ${formatDollars(e.marketValueMid)} = ${pct(c.homeownerRatio)}.`,
  );
  let limits =
    `${r.town.name}'s ${CHAPTER123_TAX_YEAR} average ratio is ${pct(c.averageRatio)}. Chapter 123 sets a common level range ` +
    `of 15% on either side: ${pct(c.lowerLimit)} to ${pct(c.upperLimit)}.`;
  if (c.upperLimit > RATIO_CAP_PERCENT) {
    limits +=
      ` The state treats any ratio over ${RATIO_CAP_PERCENT}% as ${RATIO_CAP_PERCENT}%, so a home assessed above its full market value ` +
      `can get relief. The upper limit we test is ${pct(c.upperTrigger)}` +
      (c.lowerLimit > RATIO_CAP_PERCENT ? `, and the lower limit is ${pct(c.lowerTrigger)}.` : ".");
  }
  steps.push(limits);
  if (r.verdict === "may-have-grounds") {
    steps.push(
      `${pct(c.homeownerRatio)} is above ${pct(c.upperTrigger)}, so you may have grounds to appeal. ` +
        (r.strength === "strong"
          ? `Even at the high end of our range (${formatDollars(e.marketValueHigh)}), your ratio is ${pct(c.ratioAtHighValue)}, still above the limit. So this is a strong result.`
          : `At the high end of our range (${formatDollars(e.marketValueHigh)}), your ratio would be ${pct(c.ratioAtHighValue)}, which is not above the limit. So this is a borderline result.`),
    );
    if (r.savings) {
      const s = r.savings;
      steps.push(
        `If the Board agreed with our middle estimate, your assessment could become ${formatDollars(e.marketValueMid)} x ` +
          `${pct(c.averageRatioUsed)} = ${formatDollars(s.correctedAssessment)}. With the ${s.taxRateYear} tax rate of ` +
          `$${s.generalTaxRate} per $100, that is about (${formatDollars(A)} - ${formatDollars(s.correctedAssessment)}) x ` +
          `${s.generalTaxRate} / 100 = ${formatDollars(s.yearlySavings)} a year. This is an estimate. The ${CHAPTER123_TAX_YEAR} rate will be different.`,
      );
    }
  } else if (r.verdict === "within-range") {
    steps.push(`${pct(c.homeownerRatio)} is inside the range, so your assessment is within the normal range.`);
  } else {
    steps.push(
      `${pct(c.homeownerRatio)} is below ${pct(c.lowerTrigger)}, so your assessment may be lower than typical. ` +
        "An appeal could lead the Board to raise it.",
    );
  }
  return steps;
}
