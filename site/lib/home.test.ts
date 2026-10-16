import { describe, expect, it } from "vitest";
import type { TownEntry, TownStats } from "./data/schema";
import {
  EXAMPLE_HOMES,
  formatCount,
  formatDollars,
  formatLongDate,
  formatMonthYear,
  formatPercent,
  labelInPlainWords,
  labeledOutsidePreview,
  monthsSpanned,
  prbInPlainWords,
  rankingPreview,
  taxShares,
  townCaveats,
} from "./home";
import type { RankedTown } from "./home";

const STATS = {
  median_ratio: 0.8, median_ci_low: 0.78, median_ci_high: 0.82,
  mean_ratio: 0.82, weighted_mean_ratio: 0.8,
  cod: 10, cod_ci_low: 9, cod_ci_high: 11,
  prd: 1.02, prd_ci_low: 1.0, prd_ci_high: 1.04,
  prb: -0.1, prb_se: 0.02, prb_ci_low: -0.14, prb_ci_high: -0.06,
  cod_meets_iaao: true, cod_below_5: false, prd_meets_iaao: true, prb_meets_iaao: false,
  prb_ci_outside_0_10: false,
  label_fence_1_5: "Mixed signals", label_no_trim: "Mixed signals", label_sensitive_to_outliers: false,
} as const;

function town(over: Omit<Partial<TownEntry>, "stats"> & { stats?: Partial<TownStats> | null } = {}): TownEntry {
  const { stats, ...rest } = over;
  return {
    slug: "test", name: "Test", district_code: "0201", revaluation_tax_year: null,
    n_sales: 50, data_quality: "normal", label: "Mixed signals", rank: 1,
    stats: stats === null ? null : { ...STATS, ...stats },
    ch123: { tax_year: 2027, average_ratio: 90, lower_limit: 76.5, upper_limit: 103.5, amended_by_tax_court: false },
    tax_rate: null, avg_residential: null,
    ...rest,
  } as TownEntry;
}

describe("formatting", () => {
  it("formats dates without a time-zone shift", () => {
    expect(formatLongDate("2026-06-30")).toBe("June 30, 2026");
    expect(formatLongDate("2026-01-01")).toBe("January 1, 2026");
    expect(formatMonthYear("2025-07-01")).toBe("July 2025");
    expect(formatMonthYear("2026-12")).toBe("December 2026");
  });
  it("counts calendar months, both ends included", () => {
    expect(monthsSpanned("2025-07-01", "2026-06-30")).toBe(12);
    expect(monthsSpanned("2026-03-01", "2026-03-31")).toBe(1);
  });
  it("formats counts, dollars, and percents", () => {
    expect(formatCount(3806)).toBe("3,806");
    expect(formatDollars(300000)).toBe("$300,000");
    expect(formatPercent(0.4)).toBe("40%");
    expect(formatPercent(1 / 3)).toBe("33%");
  });
});

describe("rankingPreview", () => {
  it("keeps only ranked towns, in rank order, up to n", () => {
    const towns = [
      town({ name: "C", rank: 3 }),
      town({ name: "Hidden", rank: null, stats: null }),
      town({ name: "A", rank: 1 }),
      town({ name: "B", rank: 2 }),
    ];
    expect(rankingPreview(towns, 2).map((t) => t.name)).toEqual(["A", "B"]);
    expect(rankingPreview(towns).map((t) => t.name)).toEqual(["A", "B", "C"]);
  });
});

describe("labeledOutsidePreview", () => {
  it("names regressive towns that rank below the preview, in rank order", () => {
    const towns = [
      town({ slug: "a", rank: 1, label: "Regressive pattern" }),
      town({ slug: "b", rank: 2 }),
      town({ slug: "d", rank: 4, label: "Regressive pattern" }),
      town({ slug: "c", rank: 3, label: "Regressive pattern" }),
      town({ slug: "h", rank: null, stats: null, label: "Not enough sales" }),
    ];
    const preview = rankingPreview(towns, 2);
    expect(labeledOutsidePreview(towns, preview).map((t) => t.slug)).toEqual(["c", "d"]);
  });
  it("is empty when every labeled town is already shown", () => {
    const towns = [town({ slug: "a", rank: 1, label: "Regressive pattern" }), town({ slug: "b", rank: 2 })];
    expect(labeledOutsidePreview(towns, rankingPreview(towns, 2))).toEqual([]);
  });
});

describe("prbInPlainWords", () => {
  it("follows the methodology example: -0.05 = falls about 5% per doubling", () => {
    expect(prbInPlainWords(-0.05)).toBe("The assessment ratio falls about 5% each time home value doubles.");
  });
  it("rounds and handles rises and near-zero", () => {
    expect(prbInPlainWords(-0.2678)).toContain("falls about 27%");
    expect(prbInPlainWords(0.061)).toContain("rises about 6%");
    expect(prbInPlainWords(0.0014)).toBe("The assessment ratio barely changes as home value goes up.");
  });
});

describe("labelInPlainWords", () => {
  it("uses the careful regressive wording", () => {
    const t = town({ label: "Regressive pattern" }) as RankedTown;
    expect(labelInPlainWords(t)).toMatch(/^Shows a regressive pattern in recent sales/);
  });
  it("explains mixed signals when PRB leans regressive but PRD passes", () => {
    expect(labelInPlainWords(town() as RankedTown)).toMatch(/PRB leans regressive, but PRD is inside/);
    const other = town({ stats: { prb: 0.01, prd_meets_iaao: false } }) as RankedTown;
    expect(labelInPlainWords(other)).toBe("Mixed signals: PRD and PRB do not agree.");
  });
  it("never calls a town unfair", () => {
    for (const label of ["Regressive pattern", "Progressive pattern", "Within standards", "Mixed signals"] as const) {
      expect(labelInPlainWords(town({ label }) as RankedTown).toLowerCase()).not.toContain("unfair");
    }
  });
});

describe("townCaveats", () => {
  it("notes outlier sensitivity only (no limited-data or revaluation notes in the preview)", () => {
    const t = town({
      data_quality: "limited data", n_sales: 38, revaluation_tax_year: 2027,
      stats: { label_sensitive_to_outliers: true },
    }) as RankedTown;
    expect(townCaveats(t)).toEqual(["This label changes if a few unusual sales are set aside."]);
  });
  it("is empty for a town whose label holds without outliers", () => {
    const t = town({ data_quality: "limited data", revaluation_tax_year: 2027 }) as RankedTown;
    expect(townCaveats(t)).toEqual([]);
  });
});

describe("taxShares (made-up example)", () => {
  it("splits taxes by assessed value", () => {
    const [a, b] = taxShares(EXAMPLE_HOMES);
    expect(a.ratio).toBe(1);
    expect(b.ratio).toBe(0.75);
    expect(a.valueShare).toBeCloseTo(1 / 3);
    expect(a.taxShare).toBeCloseTo(0.4);
    expect(b.valueShare).toBeCloseTo(2 / 3);
    expect(b.taxShare).toBeCloseTo(0.6);
  });
  it("gives equal shares when both homes have the same ratio", () => {
    const [a] = taxShares([
      { name: "A", value: 300_000, assessed: 240_000 },
      { name: "B", value: 600_000, assessed: 480_000 },
    ]);
    expect(a.taxShare).toBeCloseTo(a.valueShare);
  });
});
