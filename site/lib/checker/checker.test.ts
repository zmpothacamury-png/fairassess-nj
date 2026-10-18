// Tests for the appeal checker engine (docs/methodology.md Section 6, and 6.8 "How the checker is tested").
//
// 1. Three cases worked out by hand, step by step, in the comments.
// 2. Every case in pipeline/fixtures/checker_cases.json: the TypeScript engine must agree
//    with the independent Python reference (pipeline/checker_reference.py).
// 3. Edge cases and invalid inputs.
// 4. Privacy: the engine never sends anything anywhere.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PriceIndexSchema, TownFileSchema, type Comp } from "../data/schema";
import {
  chapter123Test,
  estimateMarketValue,
  estimateSavings,
  filingFee,
  runChecker,
  scoreComps,
  selectComps,
  timeAdjust,
  validateInputs,
  weightedPercentile,
  type CheckerPriceIndex,
  type CheckerResult,
  type CheckerTown,
} from "./engine";
import { fetchTownFile, townFileUrl } from "./load-town";

const SITE = path.resolve(__dirname, "..", "..");
const ROOT = path.resolve(SITE, "..");
const DATA = path.join(SITE, "public", "data");

// ---------------------------------------------------------------- test helpers

/** A made-up town. comps = [deed date, sale price, assessed value]. */
function town(
  ch123: [number, number, number],
  comps: [string, number, number][],
  opts: { reval?: number | null; rate?: number | null } = {},
): CheckerTown {
  const [average_ratio, lower_limit, upper_limit] = ch123;
  return {
    slug: "test-town",
    name: "Testville",
    revaluation_tax_year: opts.reval ?? null,
    ch123: { tax_year: 2027, average_ratio, lower_limit, upper_limit, amended_by_tax_court: false },
    tax_rate: opts.rate === null ? null : { year: 2025, general_tax_rate: opts.rate ?? 2.5 },
    comp_window: { deed_date_from: "2024-10-01", deed_date_to: "2026-06-30" },
    comps: comps.map(([deed_date, sale_price, assessed_value]) => ({
      deed_date,
      sale_price,
      assessed_value,
      ratio: Math.round((assessed_value / sale_price) * 10_000) / 10_000,
    })),
  };
}

/** A small made-up price index: June 2026 is the base (1.0) and October 2025 is 0.9083. */
const HAND_INDEX: CheckerPriceIndex = {
  base_month: "2026-06",
  months: [
    { month: "2025-10", n_sales: 100, kept: true, n_window: 300, raw_median_price: 767_500, index: 0.9083 },
    { month: "2026-06", n_sales: 100, kept: true, n_window: 300, raw_median_price: 845_000, index: 1.0 },
  ],
};

const run = (t: CheckerTown, assessedValue: number, ownEstimate: number | null = null, index = HAND_INDEX) =>
  runChecker({ townSlug: t.slug, assessedValue, ownEstimate }, t, index);

// ================================================================ 1. worked by hand

describe("hand-worked case A: may have grounds (strong)", () => {
  // Town: average ratio 80.00%, common level range 68.00% to 92.00%. Tax rate $2.50 per $100.
  // Homeowner: assessed value $400,000.
  //
  // Step 1, comps (K2). 15% band = $340,000 to $460,000. 8 homes, all assessed at exactly $400,000,
  //   all sold June 15, 2026. 8 is not fewer than 8, so no widening.
  // Step 2, time adjustment (K4). June 2026 is the base month (index 1.0), so adjusted price = sale price.
  // Step 3, weights (K6). d = 0 for every home, so w_size = 1 - 0.5 x 0 = 1.
  //   t = 108 days / 30.4375 = 3.548 months, w_time = 0.5 ^ (3.548 / 12) = 0.8147. Same for all 8,
  //   so every home has the same weight (0.8147) and each one is 1/8 of the total.
  // Step 4, ratios, sorted low to high (assessed $400,000 / price):
  //   $420,000 -> 0.95238   $415,000 -> 0.96386   $410,000 -> 0.97561   $405,000 -> 0.98765
  //   $400,000 -> 1.00000   $395,000 -> 1.01266   $390,000 -> 1.02564   $385,000 -> 1.03896
  //   25th percentile: running weight first reaches 2/8 at the 2nd home  -> 0.96386 ($415,000)
  //   50th percentile: first reaches 4/8 at the 4th home -> 0.98765 ($405,000)
  //   75th percentile: first reaches 6/8 at the 6th home -> 1.01266 ($395,000)
  // Step 5, market value (K8): middle = 400,000 / 0.98765 = $405,000.
  //   Low = 400,000 / 1.01266 = $395,000. High = 400,000 / 0.96386 = $415,000.
  // Step 6, Chapter 123 (K10): h = 400,000 / 405,000 x 100 = 98.77%. U* = min(92, 100) = 92.
  //   98.77 > 92, so "may have grounds". At the high value: 400,000 / 415,000 = 96.39% > 92 -> Strong.
  // Step 7, savings (K12): corrected = 405,000 x 80 / 100 = $324,000.
  //   Savings = (400,000 - 324,000) x 2.50 / 100 = $1,900 a year.
  const t = town(
    [80, 68, 92],
    [420_000, 415_000, 410_000, 405_000, 400_000, 395_000, 390_000, 385_000].map(
      (p) => ["2026-06-15", p, 400_000] as [string, number, number],
    ),
  );
  const r = run(t, 400_000);

  it("uses the 15% band with 8 comps", () => {
    expect(r.comps.bandPercent).toBe(15);
    expect(r.comps.widened).toBe(false);
    expect(r.comps.count).toBe(8);
    for (const c of r.comps.used) {
      expect(c.sizeWeight).toBe(1);
      expect(c.timeWeight).toBeCloseTo(0.8147, 4);
      expect(c.adjustedPrice).toBe(c.salePrice);
    }
  });
  it("estimates $395,000 / $405,000 / $415,000", () => {
    expect(r.estimate!.ratioP25).toBeCloseTo(0.96386, 5);
    expect(r.estimate!.ratioP50).toBeCloseTo(0.98765, 5);
    expect(r.estimate!.ratioP75).toBeCloseTo(1.01266, 5);
    expect(r.estimate!.marketValueLow).toBe(395_000);
    expect(r.estimate!.marketValueMid).toBe(405_000);
    expect(r.estimate!.marketValueHigh).toBe(415_000);
  });
  it("says may have grounds, strong, and saves about $1,900", () => {
    expect(r.chapter123!.homeownerRatio).toBeCloseTo(98.77, 2);
    expect(r.chapter123!.ratioAtHighValue).toBeCloseTo(96.39, 2);
    expect(r.verdict).toBe("may-have-grounds");
    expect(r.strength).toBe("strong");
    expect(r.savings).toEqual({ correctedAssessment: 324_000, yearlySavings: 1_900, generalTaxRate: 2.5, taxRateYear: 2025 });
    expect(r.appeal).toEqual({ taxYear: 2027, deadline: "April 1, 2027", filingFee: 25 });
    expect(r.warnings).toEqual([]);
  });
});

describe("hand-worked case B: within range, with a widened band, closeness and recency weights, and time adjustment", () => {
  // Town: average ratio 90.00%, range 76.50% to 103.50%. Homeowner: assessed value $500,000.
  //
  // Step 1, comps (K2). 15% band = $425,000 to $575,000: only 3 homes ($450,000, $500,000, $550,000).
  //   3 is fewer than 8, so widen to 25% = $375,000 to $625,000: 6 homes. 6 is at least 5, so go on.
  //   ($625,000 is exactly 25% away. The edge counts.)
  // Step 2, time adjustment (K4). Index: October 2025 = 0.9083, June 2026 = 1.0.
  //   Oct 2025 sale of $454,150 -> 454,150 x 1.0 / 0.9083 = $500,000.
  //   Oct 2025 sale of $635,810 -> 635,810 x 1.0 / 0.9083 = $700,000. June 2026 sales stay the same.
  // Step 3, weights (K6), band = 0.25, so w_size = 1 - 0.5 x (d / 0.25) = 1 - 2d.
  //   Recency: Oct 15, 2025 is 351 days before Oct 1, 2026 = 11.532 months -> 0.5 ^ (11.532/12) = 0.5137.
  //            June 10, 2026 = 113 days = 3.713 months -> 0.8070.  June 20, 2026 = 103 days -> 0.8225.
  //   Home (assessed / adjusted price)   ratio     d     w_size  w_time  weight
  //   $400,000 / $470,000 (Jun 10)       0.85106   0.20  0.6     0.8070  0.4842
  //   $600,000 / $700,000 (Oct 15)       0.85714   0.20  0.6     0.5137  0.3082
  //   $500,000 / $560,000 (Jun 10)       0.89286   0     1.0     0.8070  0.8070
  //   $450,000 / $500,000 (Oct 15)       0.90000   0.10  0.8     0.5137  0.4110
  //   $550,000 / $600,000 (Jun 20)       0.91667   0.10  0.8     0.8225  0.6580
  //   $625,000 / $650,000 (Jun 10)       0.96154   0.25  0.5     0.8070  0.4035
  //   Total weight = 3.0718. Running totals: 0.4842, 0.7924, 1.5994, 2.0104, 2.6683, 3.0718.
  // Step 4, percentiles (K7).
  //   25th: target 0.25 x 3.0718 = 0.7680. First reached at 0.7924 -> ratio 0.85714.
  //   50th: target 1.5359. First reached at 1.5994 -> ratio 0.89286.
  //   75th: target 2.3039. First reached at 2.6683 -> ratio 0.91667.
  // Step 5, market value (K8): middle = 500,000 / 0.89286 = $560,000.
  //   Low = 500,000 / 0.91667 = $545,455. High = 500,000 / 0.85714 = $583,333.
  // Step 6, Chapter 123 (K10): h = 500,000 / 560,000 x 100 = 89.29%.
  //   U* = min(103.50, 100) = 100 (the 100% rule). L* = 76.50. 76.50 <= 89.29 <= 100 -> within range.
  //   Warnings: only 6 sales (limited data) and the band was widened.
  const t = town(
    [90, 76.5, 103.5],
    [
      ["2025-10-15", 454_150, 450_000],
      ["2025-10-15", 635_810, 600_000],
      ["2026-06-10", 560_000, 500_000],
      ["2026-06-20", 600_000, 550_000],
      ["2026-06-10", 470_000, 400_000],
      ["2026-06-10", 650_000, 625_000],
      ["2026-06-10", 300_000, 300_000], // 40% away: never used
    ],
  );
  const r = run(t, 500_000);

  it("widens to 25% and finds 6 comps", () => {
    expect(r.comps.countAtFirstBand).toBe(3);
    expect(r.comps.bandPercent).toBe(25);
    expect(r.comps.count).toBe(6);
  });
  it("time-adjusts and weights each comp", () => {
    const byAssessed = new Map(r.comps.used.map((c) => [c.assessedValue, c]));
    expect(byAssessed.get(450_000)!.adjustedPrice).toBe(500_000);
    expect(byAssessed.get(600_000)!.adjustedPrice).toBe(700_000);
    expect(byAssessed.get(600_000)!.weight).toBeCloseTo(0.3082, 4);
    expect(byAssessed.get(500_000)!.weight).toBeCloseTo(0.807, 4);
    expect(byAssessed.get(625_000)!.sizeWeight).toBeCloseTo(0.5, 10);
    expect(byAssessed.get(550_000)!.timeWeight).toBeCloseTo(0.8225, 4);
  });
  it("estimates $545,455 / $560,000 / $583,333 and says within range", () => {
    expect(r.estimate!.marketValueLow).toBe(545_455);
    expect(r.estimate!.marketValueMid).toBe(560_000);
    expect(r.estimate!.marketValueHigh).toBe(583_333);
    expect(r.chapter123!.homeownerRatio).toBeCloseTo(89.29, 2);
    expect(r.chapter123!.upperTrigger).toBe(100);
    expect(r.verdict).toBe("within-range");
    expect(r.strength).toBeNull();
    expect(r.savings).toBeNull();
    expect(r.warnings.map((w) => w.code)).toEqual(["limited-data", "widened-band"]);
    expect(r.appeal.filingFee).toBe(100);
  });
});

describe("hand-worked case C: average ratio over 100% (Chapter 123 Example III)", () => {
  // Town: average ratio 110.00%, printed range 93.50% to 126.50%. Homeowner: assessed $420,000.
  // 2027CH123.pdf: "RATIOS IN EXCESS OF 100% ARE TO BE CONSIDERED 100%", so AR* = 100, U* = 100, L* = 93.50.
  //
  // Comps: 8 homes assessed at $420,000, sold June 15, 2026 (equal weights, as in case A).
  //   Ratios sorted: $420,000 -> 1.00000, $415,000 -> 1.01205, $410,000 -> 1.02439, $405,000 -> 1.03704,
  //                  $400,000 -> 1.05000, $395,000 -> 1.06329, $390,000 -> 1.07692, $380,000 -> 1.10526.
  //   25th = 2nd = 1.01205 ($415,000). 50th = 4th = 1.03704 ($405,000). 75th = 6th = 1.06329 ($395,000).
  // Market value: middle $405,000, low $395,000, high $415,000.
  // h = 420,000 / 405,000 x 100 = 103.70%. That is INSIDE the printed range (93.50 to 126.50),
  //   but above U* = 100, so "may have grounds". At the high value, 420,000 / 415,000 = 101.20% > 100 -> Strong.
  // Corrected assessment = 405,000 x 100 / 100 = $405,000 (Example III: true value x 100%).
  // Savings with a $2.00 rate = (420,000 - 405,000) x 2.00 / 100 = $300 a year.
  const t = town(
    [110, 93.5, 126.5],
    [420_000, 415_000, 410_000, 405_000, 400_000, 395_000, 390_000, 380_000].map(
      (p) => ["2026-06-15", p, 420_000] as [string, number, number],
    ),
    { rate: 2 },
  );
  const r = run(t, 420_000);

  it("applies the 100% rule", () => {
    expect(r.estimate!.marketValueMid).toBe(405_000);
    expect(r.estimate!.marketValueLow).toBe(395_000);
    expect(r.estimate!.marketValueHigh).toBe(415_000);
    expect(r.chapter123!.homeownerRatio).toBeCloseTo(103.7, 2);
    expect(r.chapter123!.averageRatioUsed).toBe(100);
    expect(r.chapter123!.upperTrigger).toBe(100);
    expect(r.chapter123!.lowerTrigger).toBe(93.5);
    expect(r.verdict).toBe("may-have-grounds");
    expect(r.strength).toBe("strong");
    expect(r.savings!.correctedAssessment).toBe(405_000);
    expect(r.savings!.yearlySavings).toBe(300);
  });
  it("explains the 100% rule in the steps", () => {
    expect(r.steps.join(" ")).toContain("over 100% as 100%");
  });
});

// ================================================================ 2. TypeScript vs. Python reference

type Fixture = {
  id: string;
  description: string;
  town_data: CheckerTown | null;
  input: { town: string; assessed_value: string; own_estimate: string | null };
  expected: Record<string, unknown> & { valid: boolean };
};
const FIXTURES = JSON.parse(readFileSync(path.join(ROOT, "pipeline", "fixtures", "checker_cases.json"), "utf8")) as {
  tolerances: { dollars: number; ratio: number };
  cases: Fixture[];
};
const REAL_INDEX = PriceIndexSchema.parse(JSON.parse(readFileSync(path.join(DATA, "price-index.json"), "utf8")));
const REAL_SLUGS = readdirSync(path.join(DATA, "towns")).map((f) => f.replace(/\.json$/, ""));
const loadRealTown = (slug: string) =>
  TownFileSchema.parse(JSON.parse(readFileSync(path.join(DATA, "towns", `${slug}.json`), "utf8")));

/** Run one fixture through the TypeScript engine. */
function runFixture(f: Fixture): { errors: { field: string; code: string }[] } | { result: CheckerResult } {
  const slugs = f.town_data ? [...REAL_SLUGS, f.town_data.slug] : REAL_SLUGS;
  const check = validateInputs(
    { town: f.input.town, assessedValue: f.input.assessed_value, ownEstimate: f.input.own_estimate ?? undefined },
    slugs,
  );
  if (!check.ok) return { errors: check.errors.map(({ field, code }) => ({ field, code })) };
  const t = f.town_data ?? loadRealTown(check.inputs.townSlug);
  return { result: runChecker(check.inputs, t, REAL_INDEX) };
}

/** The TypeScript result in the Python reference's field names. */
function asReference(r: CheckerResult) {
  return {
    verdict: r.verdict,
    strength: r.strength,
    band_percent: r.comps.bandPercent,
    widened: r.comps.widened,
    count_at_first_band: r.comps.countAtFirstBand,
    n_comps: r.comps.count,
    ratio_p25: r.estimate?.ratioP25 ?? null,
    ratio_p50: r.estimate?.ratioP50 ?? null,
    ratio_p75: r.estimate?.ratioP75 ?? null,
    market_value_low: r.estimate?.marketValueLow ?? null,
    market_value_mid: r.estimate?.marketValueMid ?? null,
    market_value_high: r.estimate?.marketValueHigh ?? null,
    homeowner_ratio: r.chapter123?.homeownerRatio ?? null,
    ratio_at_high_value: r.chapter123?.ratioAtHighValue ?? null,
    lower_trigger: r.chapter123?.lowerTrigger ?? null,
    upper_trigger: r.chapter123?.upperTrigger ?? null,
    average_ratio_used: r.chapter123?.averageRatioUsed ?? null,
    own_position: r.ownEstimate?.test?.position ?? null,
    own_ratio: r.ownEstimate?.test?.homeownerRatio ?? null,
    own_difference_share: r.ownEstimate?.differenceShare ?? null,
    corrected_assessment: r.savings?.correctedAssessment ?? null,
    yearly_savings: r.savings?.yearlySavings ?? null,
    tax_rate_year: r.savings?.taxRateYear ?? null,
    filing_fee: r.appeal.filingFee,
    deadline: r.appeal.deadline,
    warnings: r.warnings.map((w) => w.code),
  };
}

const DOLLAR_FIELDS = new Set([
  "market_value_low", "market_value_mid", "market_value_high", "corrected_assessment", "yearly_savings",
]);
const RATIO_FIELDS = new Set([
  "ratio_p25", "ratio_p50", "ratio_p75", "homeowner_ratio", "ratio_at_high_value", "own_ratio", "own_difference_share",
  "lower_trigger", "upper_trigger", "average_ratio_used",
]);

describe("TypeScript and the Python reference agree on every fixture case", () => {
  it("has at least 30 cases, including random real towns and edge cases", () => {
    expect(FIXTURES.cases.length).toBeGreaterThanOrEqual(30);
    expect(FIXTURES.cases.filter((c) => c.id.startsWith("random-")).length).toBeGreaterThanOrEqual(15);
    expect(FIXTURES.cases.filter((c) => c.id.startsWith("edge-")).length).toBeGreaterThanOrEqual(10);
  });

  it.each(FIXTURES.cases.map((c) => [c.id, c] as const))("%s", (_id, f) => {
    const out = runFixture(f);
    if (!f.expected.valid) {
      expect("errors" in out ? out.errors : null).toEqual(f.expected.errors);
      return;
    }
    expect("result" in out).toBe(true);
    if (!("result" in out)) return;
    const ts = asReference(out.result);
    const { dollars, ratio } = FIXTURES.tolerances;
    for (const [key, mine] of Object.entries(ts)) {
      const theirs = f.expected[key];
      if (mine === null || theirs === null || typeof mine !== "number") {
        expect(mine, key).toEqual(theirs);
      } else if (DOLLAR_FIELDS.has(key)) {
        expect(Math.abs(mine - (theirs as number)), key).toBeLessThanOrEqual(dollars);
      } else if (RATIO_FIELDS.has(key)) {
        expect(Math.abs(mine - (theirs as number)), key).toBeLessThanOrEqual(ratio);
      } else {
        expect(mine, key).toEqual(theirs);
      }
    }
    // The comps used: same homes, same order, same adjusted prices and weights.
    const refComps = f.expected.comps as { sale_month: string; adjusted_price: number; assessed_value: number; weight: number; adjusted_ratio: number }[];
    expect(out.result.comps.used.length).toBe(refComps.length);
    out.result.comps.used.forEach((c, i) => {
      expect(c.saleMonth).toBe(refComps[i].sale_month);
      expect(c.assessedValue).toBe(refComps[i].assessed_value);
      expect(Math.abs(c.adjustedPrice - refComps[i].adjusted_price)).toBeLessThanOrEqual(dollars);
      expect(Math.abs(c.adjustedRatio - refComps[i].adjusted_ratio)).toBeLessThanOrEqual(ratio);
      expect(Math.abs(c.weight - refComps[i].weight)).toBeLessThanOrEqual(ratio);
    });
  });
});

// ================================================================ 3. edge cases

const fixture = (id: string) => {
  const f = FIXTURES.cases.find((c) => c.id === id);
  if (!f) throw new Error(`no fixture ${id}`);
  const out = runFixture(f);
  if (!("result" in out)) throw new Error(`fixture ${id} is not a valid input`);
  return out.result;
};

describe("edge cases", () => {
  const sameValue = (assessed: number, prices: number[]) =>
    prices.map((p) => ["2026-06-15", p, assessed] as [string, number, number]);

  it("zero comps -> not enough data, with steps that say why", () => {
    const r = run(town([80, 68, 92], []), 400_000);
    expect(r.verdict).toBe("not-enough-data");
    expect(r.estimate).toBeNull();
    expect(r.chapter123).toBeNull();
    expect(r.comps.count).toBe(0);
    expect(r.steps.at(-1)).toContain("at least 5 sales");
    expect(fixture("real-teterboro").verdict).toBe("not-enough-data");
  });

  it("exactly 5 comps (the minimum) gives a result; 4 does not", () => {
    const five = fixture("edge-exactly-5-comps");
    expect(five.comps.count).toBe(5);
    expect(five.verdict).toBe("within-range");
    expect(fixture("edge-4-comps").verdict).toBe("not-enough-data");
  });

  it("widens the band only below 8 comps, and reports it", () => {
    const w = fixture("edge-band-widening");
    expect([w.comps.countAtFirstBand, w.comps.bandPercent, w.comps.count]).toEqual([3, 25, 6]);
    expect(w.warnings.map((x) => x.code)).toContain("widened-band");
    const eight = fixture("edge-exactly-8-no-widening");
    expect([eight.comps.bandPercent, eight.comps.count]).toEqual([15, 8]);
    expect(eight.warnings.map((x) => x.code)).not.toContain("widened-band");
  });

  it("a comp exactly on the band edge counts", () => {
    // 8 homes exactly 15% above $400,000 ($460,000) plus one $1 further out. The 8 fill the 15% band
    // (so no widening), and the $460,001 home stays out.
    const comps = [...Array(8).fill(460_000), 460_001].map((a) => ["2026-06-15", 500_000, a] as [string, number, number]);
    const s = selectComps(town([80, 68, 92], comps), 400_000);
    expect([s.bandPercent, s.comps.length]).toEqual([15, 8]);
    expect(s.comps.every((c) => c.assessed_value === 460_000)).toBe(true);
    expect(fixture("edge-comp-on-15pct-edge").comps.bandPercent).toBe(15);
  });

  it("a ratio exactly at the upper limit is within range; just above is not", () => {
    const at = run(town([80, 68, 92], sameValue(460_000, Array(8).fill(500_000))), 460_000);
    expect(at.verdict).toBe("within-range");
    const above = run(town([80, 68, 92], sameValue(460_050, Array(8).fill(500_000))), 460_050);
    expect(above.verdict).toBe("may-have-grounds");
    expect(chapter123Test(460_000, 500_000, { tax_year: 2027, average_ratio: 80, lower_limit: 68, upper_limit: 92, amended_by_tax_court: false }).position).toBe("within");
  });

  it("a ratio exactly at the lower limit is within range; just below is not", () => {
    const at = run(town([80, 68, 92], sameValue(340_000, Array(8).fill(500_000))), 340_000);
    expect(at.verdict).toBe("within-range");
    const below = run(town([80, 68, 92], sameValue(339_950, Array(8).fill(500_000))), 339_950);
    expect(below.verdict).toBe("possibly-under-assessed");
  });

  it("borderline: above the limit at the middle value but not at the high value", () => {
    const r = fixture("edge-borderline");
    expect(r.verdict).toBe("may-have-grounds");
    expect(r.strength).toBe("borderline");
  });

  it("warns when the homeowner's estimate is 25% away, not when it is 15% away", () => {
    const base = town([80, 68, 92], sameValue(400_000, Array(8).fill(500_000)));
    const far = run(base, 400_000, 625_000); // 25% above our $500,000
    expect(far.ownEstimate!.differenceShare).toBeCloseTo(0.25, 10);
    expect(far.warnings.map((w) => w.code)).toContain("own-estimate-differs");
    expect(far.ownEstimate!.test!.position).toBe("below"); // 400,000 / 625,000 = 64% < 68%
    const near = run(base, 400_000, 425_000); // 15% below
    expect(near.warnings.map((w) => w.code)).not.toContain("own-estimate-differs");
  });

  it("2027 revaluation town: market value estimate, but no Chapter 123 result (K14), May 1 deadline", () => {
    const r = run(town([80, 68, 92], sameValue(460_000, Array(8).fill(500_000)), { reval: 2027 }), 460_000, 450_000);
    expect(r.verdict).toBe("revaluation-no-test");
    expect(r.estimate!.marketValueMid).toBe(500_000);
    expect(r.chapter123).toBeNull();
    expect(r.ownEstimate!.test).toBeNull();
    expect(r.savings).toBeNull();
    expect(r.appeal.deadline).toBe("May 1, 2027");
    expect(r.warnings.map((w) => w.code)).toContain("revaluation-this-year");
  });

  it("2026 revaluation town: normal test plus a warning", () => {
    const r = fixture("edge-reval-2026");
    expect(r.verdict).toBe("within-range");
    expect(r.appeal.deadline).toBe("April 1, 2027");
    expect(r.warnings.map((w) => w.code)).toContain("revaluation-last-year");
  });

  it("average ratio over 100%: limits are capped at 100 (also the lower limit, as in Rockleigh)", () => {
    expect(fixture("edge-average-over-100").verdict).toBe("may-have-grounds");
    const rockleighLike = fixture("edge-lower-limit-over-100");
    expect(rockleighLike.chapter123!.lowerTrigger).toBe(100);
    expect(rockleighLike.verdict).toBe("possibly-under-assessed"); // 99% < 100%
    const real = fixture("real-elmwood-park");
    expect(real.chapter123!.averageRatioUsed).toBe(100);
  });

  it("a town with too few sales says not enough data (Rockleigh)", () => {
    const r = fixture("real-rockleigh");
    expect(r.verdict).toBe("not-enough-data");
    expect(r.comps.count).toBeLessThan(5);
  });

  it("no tax rate: no savings, with a warning", () => {
    const r = fixture("edge-no-tax-rate");
    expect(r.verdict).toBe("may-have-grounds");
    expect(r.savings).toBeNull();
    expect(r.warnings.map((w) => w.code)).toContain("no-tax-rate");
  });

  it("suggests entering an own estimate only when it could change the answer", () => {
    const base = town([80, 68, 92], sameValue(400_000, Array(8).fill(500_000)));
    expect(run(base, 400_000).suggestOwnEstimate).toBe(true); // within range, no own estimate
    expect(run(base, 400_000, 450_000).suggestOwnEstimate).toBe(false); // already gave one
    expect(run(town([80, 68, 92], []), 400_000).suggestOwnEstimate).toBe(true); // not enough data
    expect(fixture("edge-just-above-upper").suggestOwnEstimate).toBe(false); // already may have grounds
    expect(fixture("edge-under-assessed").suggestOwnEstimate).toBe(false);
    expect(fixture("edge-reval-2027").suggestOwnEstimate).toBe(false);
  });

  it("filing fees follow Form A-1 at each boundary", () => {
    expect([149_999, 150_000, 499_999, 500_000, 999_999, 1_000_000].map(filingFee)).toEqual([5, 25, 25, 100, 100, 150]);
  });

  it("time adjustment holds flat after the base month (K5) and fails on a missing month", () => {
    const comps: Comp[] = [{ deed_date: "2026-07-15", sale_price: 500_000, assessed_value: 400_000, ratio: 0.8 }];
    expect(timeAdjust(comps, HAND_INDEX)[0].adjustedPrice).toBe(500_000);
    const missing: Comp[] = [{ deed_date: "2025-01-15", sale_price: 500_000, assessed_value: 400_000, ratio: 0.8 }];
    expect(() => timeAdjust(missing, HAND_INDEX)).toThrow(/2025-01/);
  });

  it("small functions match the formulas", () => {
    const scored = scoreComps(
      timeAdjust([{ deed_date: "2025-10-01", sale_price: 454_150, assessed_value: 460_000, ratio: 1 }], HAND_INDEX),
      400_000,
      15,
    );
    expect(scored[0].sizeWeight).toBeCloseTo(0.5, 12); // exactly at the 15% edge
    expect(scored[0].monthsBeforeValuation).toBeCloseTo(365 / 30.4375, 12);
    expect(weightedPercentile([{ adjustedRatio: 0.9, weight: 1 }, { adjustedRatio: 0.8, weight: 3 }], 0.5)).toBe(0.8);
    expect(weightedPercentile([{ adjustedRatio: 0.9, weight: 1 }, { adjustedRatio: 0.8, weight: 1 }], 0.5)).toBe(0.8);
    expect(() => estimateMarketValue([], 1)).toThrow();
    const ch = { tax_year: 2027, average_ratio: 80, lower_limit: 68, upper_limit: 92, amended_by_tax_court: false };
    expect(estimateSavings(400_000, 405_000, ch, null)).toBeNull();
  });

  it("show-the-math steps contain the real numbers", () => {
    const r = fixture("edge-just-above-upper");
    const text = r.steps.join("\n");
    expect(text).toContain("$460,050");
    expect(text).toContain("92.01%");
    expect(text).toContain("2025 tax rate");
  });
});

// ================================================================ invalid inputs

describe("validateInputs", () => {
  const slugs = ["ridgewood", "teaneck"];
  const codes = (town: string, assessedValue: string, ownEstimate?: string) => {
    const c = validateInputs({ town, assessedValue, ownEstimate }, slugs);
    return c.ok ? [] : c.errors.map((e) => `${e.field}:${e.code}`);
  };

  it("accepts whole dollars written in common ways", () => {
    for (const text of ["450000", "450,000", "$450,000", " $ 450,000 ", "450000.00"]) {
      const c = validateInputs({ town: "ridgewood", assessedValue: text }, slugs);
      expect(c.ok && c.inputs.assessedValue).toBe(450_000);
    }
    const withOwn = validateInputs({ town: "teaneck", assessedValue: "450000", ownEstimate: "600,000" }, slugs);
    expect(withOwn.ok && withOwn.inputs).toEqual({ townSlug: "teaneck", assessedValue: 450_000, ownEstimate: 600_000 });
    const blankOwn = validateInputs({ town: "teaneck", assessedValue: "450000", ownEstimate: "  " }, slugs);
    expect(blankOwn.ok && blankOwn.inputs.ownEstimate).toBeNull();
  });

  it("refuses blank, letters, negative, cents, too small, and too large", () => {
    expect(codes("ridgewood", "")).toEqual(["assessedValue:blank"]);
    expect(codes("ridgewood", "abc")).toEqual(["assessedValue:not-a-number"]);
    expect(codes("ridgewood", "45O000")).toEqual(["assessedValue:not-a-number"]); // letter O, not zero
    expect(codes("ridgewood", "-450000")).toEqual(["assessedValue:negative"]);
    expect(codes("ridgewood", "450000.50")).toEqual(["assessedValue:not-whole"]);
    expect(codes("ridgewood", "0")).toEqual(["assessedValue:too-small"]);
    expect(codes("ridgewood", "9999")).toEqual(["assessedValue:too-small"]);
    expect(codes("ridgewood", "20000001")).toEqual(["assessedValue:too-large"]);
    expect(codes("ridgewood", "99999999999999999999999")).toEqual(["assessedValue:too-large"]);
    expect(codes("ridgewood", "10000")).toEqual([]);
    expect(codes("ridgewood", "20000000")).toEqual([]);
  });

  it("checks the town and the optional estimate, and reports every problem at once", () => {
    expect(codes("", "450000")).toEqual(["town:town-missing"]);
    expect(codes("newark", "450000")).toEqual(["town:town-unknown"]);
    expect(codes("ridgewood", "450000", "lots")).toEqual(["ownEstimate:not-a-number"]);
    expect(codes("", "", "-5")).toEqual(["town:town-missing", "assessedValue:blank", "ownEstimate:negative"]);
  });

  it("gives friendly, specific messages", () => {
    const c = validateInputs({ town: "ridgewood", assessedValue: "25,000,000" }, slugs);
    expect(c.ok).toBe(false);
    if (!c.ok) expect(c.errors[0].message).toBe("Your assessed value must be $20,000,000 or less. Check for extra digits.");
  });
});

// ================================================================ 4. privacy: nothing is sent anywhere

describe("privacy (CLAUDE.md rule 3)", () => {
  afterEach(() => vi.unstubAllGlobals());

  const DIR = __dirname;
  const sources = readdirSync(DIR)
    .filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"))
    .map((f) => ({ file: f, text: readFileSync(path.join(DIR, f), "utf8") }));

  it("no checker file uses any way to send or store data, except the one town-file fetch", () => {
    const banned = /XMLHttpRequest|sendBeacon|WebSocket|EventSource|localStorage|sessionStorage|indexedDB|document\.cookie|console\.|supabase|import\(|navigator\./;
    for (const { file, text } of sources) {
      expect(banned.test(text), file).toBe(false);
      const fetches = text.match(/\bfetch\b/g) ?? [];
      if (file === "load-town.ts") expect(fetches.length).toBeGreaterThan(0);
      else expect(fetches.length, file).toBe(0);
    }
  });

  it("running the checker on every fixture makes no network call", () => {
    const spy = vi.fn();
    vi.stubGlobal("fetch", spy);
    for (const f of FIXTURES.cases) runFixture(f);
    expect(spy).not.toHaveBeenCalled();
  });

  it("the town loader asks for the public town file only, with no homeowner input", async () => {
    const body = readFileSync(path.join(DATA, "towns", "ridgewood.json"), "utf8");
    const spy = vi.fn(async () => new Response(body, { status: 200 }));
    const town = await fetchTownFile("ridgewood", spy as unknown as typeof fetch);
    expect(town.slug).toBe("ridgewood");
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith("/data/towns/ridgewood.json", { method: "GET", credentials: "omit" });
  });

  it("the town loader refuses anything that is not a plain town slug, before any request", async () => {
    const spy = vi.fn();
    await expect(fetchTownFile("../secrets", spy as unknown as typeof fetch)).rejects.toThrow();
    await expect(fetchTownFile("ridgewood?value=450000", spy as unknown as typeof fetch)).rejects.toThrow();
    expect(spy).not.toHaveBeenCalled();
    expect(townFileUrl("ho-ho-kus")).toBe("/data/towns/ho-ho-kus.json");
  });
});
