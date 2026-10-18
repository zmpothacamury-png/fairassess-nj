import { describe, expect, it } from "vitest";
import type { Tier, TownEntry, TownStats } from "./data/schema";
import {
  appealDeadline,
  weekendDeadlineNote,
  assessmentAt,
  ch123Triggers,
  DEFAULT_FILTER,
  filterRanked,
  labelStatus,
  matchesQuery,
  nextSort,
  prbTrendPoints,
  prbTrendRatio,
  rankedTowns,
  signed4,
  sortRanked,
  statLines,
  summarySentence,
  tierPercents,
  townNotes,
  unrankedTowns,
} from "./towns";
import type { NoteContext, RankedEntry } from "./towns";

const STATS: TownStats = {
  median_ratio: 0.5, median_ci_low: 0.48, median_ci_high: 0.52,
  mean_ratio: 0.51, weighted_mean_ratio: 0.5,
  cod: 12, cod_ci_low: 10, cod_ci_high: 14,
  prd: 1.02, prd_ci_low: 1.0, prd_ci_high: 1.04,
  prb: -0.03, prb_intercept: 0.5, prb_se: 0.02, prb_ci_low: -0.07, prb_ci_high: 0.01,
  cod_meets_iaao: true, cod_below_5: false, prd_meets_iaao: true, prb_meets_iaao: true,
  prb_ci_outside_0_10: false,
  label_fence_1_5: "Within standards", label_no_trim: "Within standards", label_sensitive_to_outliers: false,
};

const CH123 = { tax_year: 2027, average_ratio: 50, lower_limit: 42.5, upper_limit: 57.5, amended_by_tax_court: false };

/** A made-up town. Only the fields a test changes need to be passed. */
function town(over: Omit<Partial<TownEntry>, "stats"> & { stats?: Partial<TownStats> | null } = {}): TownEntry {
  const { stats, ...rest } = over;
  return {
    slug: "test-town", name: "Test Town", district_code: "0201", revaluation_tax_year: null,
    n_sales: 60, data_quality: "normal", label: "Within standards", rank: 1,
    stats: stats === null ? null : { ...STATS, ...stats },
    ch123: CH123, tax_rate: { year: 2025, general_tax_rate: 3 }, avg_residential: null,
    ...rest,
  };
}

function tier(n: number, median: number): Tier {
  return {
    tier: n, n: 10, value_low: 1, value_high: 2, sale_price_low: 1, sale_price_high: 2, median_ratio: median,
    lower_trigger: null, upper_trigger: null, n_above_upper: null, n_below_lower: null,
    share_above_upper: null, share_below_lower: null,
  };
}

const CTX: NoteContext = { thinCount: 22, thinRevalCount: 21, period: "July 2025 to June 2026" };

describe("summary sentence template", () => {
  it("compares the lowest and highest value quarters in whole percents", () => {
    const t = { ...town(), tiers: [tier(1, 0.5163), tier(2, 0.49), tier(3, 0.47), tier(4, 0.4512)] };
    expect(summarySentence(t)).toBe(
      "In recent sales, homes in the lowest value quarter were assessed at a median of 52% of their sale price, compared with 45% for the highest value quarter.",
    );
  });

  it("uses one decimal when whole percents would hide a real gap", () => {
    expect(tierPercents(0.4512, 0.4538)).toEqual(["45.1%", "45.4%"]);
    expect(tierPercents(0.45, 0.45)).toEqual(["45%", "45%"]);
  });

  it("explains a 2026 revaluation town with too few sales", () => {
    const t = { ...town({ name: "Allendale", stats: null, n_sales: 17, data_quality: "recent revaluation" }), tiers: [] };
    expect(summarySentence(t)).toBe(
      "Allendale put new assessments into effect for 2026, and only 17 usable single-family sales on the new assessments are in our data, fewer than the 20 we need to measure how evenly homes are assessed.",
    );
  });

  it("explains a small town, with the right word for 1 sale", () => {
    const t = { ...town({ name: "Alpine", stats: null, n_sales: 12, data_quality: "not enough sales" }), tiers: [] };
    expect(summarySentence(t)).toBe(
      "Alpine had only 12 usable single-family sales in our data, fewer than the 20 we need to measure how evenly homes are assessed.",
    );
    expect(summarySentence({ ...t, n_sales: 1 })).toContain("only 1 usable single-family sale in");
  });

  it("falls back to the no-statistics sentence if the quarters are missing", () => {
    expect(summarySentence({ ...town(), tiers: [] })).toContain("fewer than the 20");
  });
});

// Four ranked towns and one without statistics.
const TOWNS: TownEntry[] = [
  town({ slug: "a", name: "Ho-Ho-Kus", rank: 3, label: "Mixed signals", n_sales: 25, data_quality: "limited data", stats: { prb: -0.02, prd: 1.05, cod: 9, median_ratio: 0.9 } }),
  town({ slug: "b", name: "Bergenfield", rank: 1, label: "Regressive pattern", n_sales: 156, stats: { prb: -0.098, prd: 1.0304, cod: 13.67, median_ratio: 0.4777 } }),
  town({ slug: "c", name: "Teaneck", rank: 2, label: "Within standards", n_sales: 230, stats: { prb: -0.04, prd: 1.01, cod: 11, median_ratio: 0.8 } }),
  town({ slug: "d", name: "Englewood", rank: 4, label: "Progressive pattern", n_sales: 96, stats: { prb: 0.07, prd: 0.97, cod: 15, median_ratio: 0.8 } }),
  town({ slug: "e", name: "Alpine", rank: null, label: "Not enough sales", n_sales: 12, data_quality: "not enough sales", stats: null }),
];
const RANKED = rankedTowns(TOWNS);
const names = (list: RankedEntry[]) => list.map((t) => t.name);

describe("rankings table: filtering", () => {
  it("keeps towns with statistics in the table and lists the rest separately", () => {
    expect(names(RANKED)).toEqual(["Ho-Ho-Kus", "Bergenfield", "Teaneck", "Englewood"]);
    expect(unrankedTowns(TOWNS).map((t) => t.name)).toEqual(["Alpine"]);
  });

  it("searches names ignoring case, spaces, and hyphens", () => {
    expect(matchesQuery("Ho-Ho-Kus", "hohokus")).toBe(true);
    expect(matchesQuery("Ho-Ho-Kus", "HO HO")).toBe(true);
    expect(matchesQuery("Ho-Ho-Kus", "teaneck")).toBe(false);
    expect(matchesQuery("Teaneck", "  ")).toBe(true);
    expect(names(filterRanked(RANKED, { ...DEFAULT_FILTER, query: "eng" }))).toEqual(["Englewood"]);
  });

  it("filters by label", () => {
    expect(names(filterRanked(RANKED, { ...DEFAULT_FILTER, label: "Regressive pattern" }))).toEqual(["Bergenfield"]);
    expect(filterRanked(RANKED, { ...DEFAULT_FILTER, label: "Mixed signals", query: "teaneck" })).toEqual([]);
  });

  it("includes limited-data towns by default, and the toggle hides them", () => {
    expect(filterRanked(RANKED, DEFAULT_FILTER)).toHaveLength(4);
    expect(names(filterRanked(RANKED, { ...DEFAULT_FILTER, includeLimited: false }))).not.toContain("Ho-Ho-Kus");
  });
});

describe("rankings table: sorting", () => {
  it("sorts by PRB, most negative first, by default (methodology 5.4)", () => {
    expect(names(sortRanked(RANKED, "prb", "asc"))).toEqual(["Bergenfield", "Teaneck", "Ho-Ho-Kus", "Englewood"]);
  });

  it("sorts by each column, both ways", () => {
    expect(names(sortRanked(RANKED, "prd", "desc"))).toEqual(["Ho-Ho-Kus", "Bergenfield", "Teaneck", "Englewood"]);
    expect(names(sortRanked(RANKED, "cod", "asc"))).toEqual(["Ho-Ho-Kus", "Teaneck", "Bergenfield", "Englewood"]);
    expect(names(sortRanked(RANKED, "n_sales", "desc"))).toEqual(["Teaneck", "Bergenfield", "Englewood", "Ho-Ho-Kus"]);
    expect(names(sortRanked(RANKED, "name", "asc"))).toEqual(["Bergenfield", "Englewood", "Ho-Ho-Kus", "Teaneck"]);
  });

  it("breaks ties by the official rank in either direction, and does not change the input", () => {
    // Teaneck (rank 2) and Englewood (rank 4) both have a median of 0.8.
    expect(names(sortRanked(RANKED, "median", "desc"))).toEqual(["Ho-Ho-Kus", "Teaneck", "Englewood", "Bergenfield"]);
    expect(names(sortRanked(RANKED, "median", "asc"))).toEqual(["Bergenfield", "Teaneck", "Englewood", "Ho-Ho-Kus"]);
    expect(names(RANKED)).toEqual(["Ho-Ho-Kus", "Bergenfield", "Teaneck", "Englewood"]);
  });

  it("flips direction on the same column and starts a new column at its default", () => {
    expect(nextSort({ key: "prb", dir: "asc" }, "prb")).toEqual({ key: "prb", dir: "desc" });
    expect(nextSort({ key: "prb", dir: "asc" }, "name")).toEqual({ key: "name", dir: "asc" });
    expect(nextSort({ key: "name", dir: "asc" }, "n_sales")).toEqual({ key: "n_sales", dir: "desc" });
  });
});

describe("labels and number formats", () => {
  it("gives each label its own pill", () => {
    expect(labelStatus("Within standards")).toBe("within-range");
    expect(labelStatus("Regressive pattern")).toBe("may-have-grounds");
    expect(labelStatus("Progressive pattern")).toBe("under-assessed");
    expect(labelStatus("Not enough sales")).toBe("not-enough-data");
    expect(labelStatus("Mixed signals")).toBe("neutral");
  });

  it("shows PRB with a sign and 4 decimals", () => {
    expect(signed4(-0.098)).toBe("−0.0980");
    expect(signed4(0.05)).toBe("+0.0500");
    expect(signed4(0)).toBe("0.0000");
  });
});

describe("stat cards", () => {
  it("shows PRD at 4 decimals, so 1.0304 does not read as 1.030 (outside the range)", () => {
    const prd = statLines({ ...STATS, prd: 1.0304, prd_meets_iaao: false }).find((l) => l.key === "prd")!;
    expect(prd.value).toBe("1.0304");
    expect(prd.meets).toBe(false);
    expect(prd.sentence).toBe("On average, cheaper homes had higher ratios than pricier homes.");
  });

  it("gives the median no pass/fail and explains PRB in plain words", () => {
    const lines = statLines({ ...STATS, prb: -0.098, prb_meets_iaao: false });
    expect(lines.find((l) => l.key === "median")!.meets).toBeNull();
    expect(lines.find((l) => l.key === "median")!.value).toBe("50.0%");
    expect(lines.find((l) => l.key === "prb")!.sentence).toBe("The ratio falls about 10% each time home value doubles.");
  });

  it("adds IAAO warnings for a COD under 5 and a PRB range wholly outside ±0.10", () => {
    const lines = statLines({ ...STATS, cod: 4.2, cod_below_5: true, prb: 0.2, prb_ci_outside_0_10: true });
    expect(lines.find((l) => l.key === "cod")!.sentence).toContain("under 5.0");
    expect(lines.find((l) => l.key === "prb")!.sentence).toContain("IAAO calls unacceptable");
  });
});

describe("PRB trend line", () => {
  // Hand check: value 2^20 -> ln(V)/0.693 = 20 x 0.6931472 / 0.693 = 20.004248
  // y = 0.5 + (-0.03 x 20.004248) = -0.1001274; R = 0.5 x (1 - 0.1001274) = 0.4499363.
  it("turns the PRB line back into a ratio", () => {
    expect(prbTrendRatio(2 ** 20, STATS)).toBeCloseTo(0.4499363, 6);
  });

  it("matches the pipeline's hand-worked example (pipeline/tests/test_stats.py)", () => {
    // Median 0.80, PRB -0.054882, intercept 0.987284; mean x 17.989165 gives mean y 0, so R = median.
    const s = { median_ratio: 0.8, prb: -0.054882, prb_intercept: 0.987284 };
    expect(prbTrendRatio(Math.exp(17.989165 * 0.693), s)).toBeCloseTo(0.8, 4);
  });

  it("spreads points evenly on a log scale between the lowest and highest value", () => {
    const pts = prbTrendPoints(100_000, 1_000_000, STATS, 3);
    expect(pts.map((p) => Math.round(p.value))).toEqual([100_000, 316_228, 1_000_000]);
    expect(pts[0].trend).toBeGreaterThan(pts[2].trend); // negative PRB: falls as value rises
  });
});

describe("Chapter 123 and appeal facts", () => {
  it("caps the lines at 100% (methodology K10)", () => {
    expect(ch123Triggers(CH123)).toMatchObject({ upper: 57.5, lower: 42.5, upperCapped: false });
    const allendale = ch123Triggers({ ...CH123, average_ratio: 89.97, lower_limit: 76.47, upper_limit: 103.47 });
    expect(allendale).toMatchObject({ upper: 100, upperCapped: true, lowerCapped: false, averageCapped: false });
    const rockleigh = ch123Triggers({ ...CH123, average_ratio: 119.5, lower_limit: 101.58, upper_limit: 137.43 });
    expect(rockleigh).toMatchObject({ upper: 100, lower: 100, lowerCapped: true, averageCapped: true });
  });

  it("works out the assessment at a line", () => {
    expect(assessmentAt(732_368, 57.8)).toBe(423_309);
  });

  it("gives May 1 only to 2027 revaluation towns (Form A-1)", () => {
    expect(appealDeadline({ revaluation_tax_year: 2027 }).date).toBe("May 1, 2027");
    expect(appealDeadline({ revaluation_tax_year: 2026 }).date).toBe("April 1, 2027");
    expect(appealDeadline({ revaluation_tax_year: null }).date).toBe("April 1, 2027");
  });

  it("notes a weekend deadline: May 1, 2027 is a Saturday; April 1, 2027 is a Thursday", () => {
    expect(weekendDeadlineNote("May 1, 2027")).toMatch(/^May 1, 2027 is a Saturday\. Form A-1 says/);
    expect(weekendDeadlineNote("April 1, 2027")).toBeNull();
    expect(weekendDeadlineNote("May 2, 2027")).toMatch(/is a Sunday/);
    expect(weekendDeadlineNote("May 3, 2027")).toBeNull();
    expect(() => weekendDeadlineNote("2027-05-01")).toThrow();
  });
});

describe("town notes", () => {
  const ids = (t: TownEntry) => townNotes(t, CTX).map((n) => n.id);

  it("shows nothing extra for a normal town", () => {
    expect(ids(town())).toEqual([]);
  });

  it("warns about limited data, outliers, and a 2027 revaluation together", () => {
    const t = town({
      name: "Cliffside Park", n_sales: 38, data_quality: "limited data", revaluation_tax_year: 2027,
      label: "Regressive pattern", stats: { label_sensitive_to_outliers: true, label_fence_1_5: "Mixed signals" },
    });
    const notes = townNotes(t, CTX);
    expect(notes.map((n) => n.id)).toEqual(["limited", "outliers", "reval-2027"]);
    expect(notes[1].body).toContain('would be "Mixed signals" instead of "Regressive pattern"');
    expect(notes[2].sources).toEqual(["bergen_revaluations"]);
  });

  it("explains the 2026 revaluation rule, with or without statistics", () => {
    expect(ids(town({ revaluation_tax_year: 2026 }))).toEqual(["reval-2026-stats"]);
    const thin = townNotes(town({ revaluation_tax_year: 2026, stats: null, data_quality: "recent revaluation", n_sales: 17 }), CTX);
    expect(thin.map((n) => n.id)).toEqual(["reval-2026-thin"]);
    expect(thin[0].body).toContain("21 of the 22");
    expect(thin[0].sources).toContain("nonusable_guidelines");
  });

  it("explains a small town that is not a revaluation town", () => {
    const notes = townNotes(town({ name: "Alpine", stats: null, data_quality: "not enough sales", n_sales: 12 }), CTX);
    expect(notes.map((n) => n.id)).toEqual(["few-sales"]);
    expect(notes[0].body).toContain("recorded from July 2025 to June 2026");
  });
});
