// Helpers for the home page: number and date formatting, the rankings
// preview, and the made-up "Why it matters" example. Every real number comes
// from the pipeline's JSON (loaded with lib/data/load.ts); these functions
// only pick and format it.
import type { TownEntry } from "./data/schema";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "2026-06-30" -> "June 30, 2026". Parsed by hand so the time zone can never shift the day. */
export function formatLongDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

/** "2025-07-01" (or "2025-07") -> "July 2025". */
export function formatMonthYear(isoDate: string): string {
  const [y, m] = isoDate.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

/** Calendar months covered from one date to another, counting both ends: 2025-07-01 to 2026-06-30 -> 12. */
export function monthsSpanned(fromIso: string, toIso: string): number {
  const [y1, m1] = fromIso.split("-").map(Number);
  const [y2, m2] = toIso.split("-").map(Number);
  return (y2 - y1) * 12 + (m2 - m1) + 1;
}

/** 3806 -> "3,806". */
export function formatCount(n: number): string {
  return n.toLocaleString("en-US");
}

/** 300000 -> "$300,000". */
export function formatDollars(n: number): string {
  return `$${formatCount(Math.round(n))}`;
}

/** 0.4 -> "40%". Whole percents. */
export function formatPercent(share: number): string {
  return `${Math.round(share * 100)}%`;
}

/** A ranked town: it has statistics and a rank (20 or more sales, no recent revaluation). */
export type RankedTown = TownEntry & { rank: number; stats: NonNullable<TownEntry["stats"]> };

/**
 * The first `n` towns in the rankings (methodology 5.4: sorted by PRB, most
 * negative first). Towns without statistics are left out.
 */
export function rankingPreview(towns: TownEntry[], n = 5): RankedTown[] {
  return towns
    .filter((t): t is RankedTown => t.rank !== null && t.stats !== null)
    .sort((a, b) => a.rank - b.rank)
    .slice(0, n);
}

/**
 * Ranked towns with a given label that are NOT in the preview, in rank order.
 * The preview follows the PRB ranking (methodology 5.4), so a town labeled
 * "Regressive pattern" can rank just below it; the home page names it so
 * readers are not misled.
 */
export function labeledOutsidePreview(
  towns: TownEntry[],
  preview: RankedTown[],
  label: TownEntry["label"] = "Regressive pattern",
): RankedTown[] {
  const shown = new Set(preview.map((t) => t.slug));
  return rankingPreview(towns, towns.length).filter((t) => t.label === label && !shown.has(t.slug));
}

/**
 * PRB in plain words (methodology 2.2: a PRB of -0.05 means the ratio falls
 * about 5% each time home value doubles).
 */
export function prbInPlainWords(prb: number): string {
  const pct = Math.round(Math.abs(prb) * 100);
  if (pct === 0) return "The assessment ratio barely changes as home value goes up.";
  const way = prb < 0 ? "falls" : "rises";
  return `The assessment ratio ${way} about ${pct}% each time home value doubles.`;
}

/** One plain-English line for a town's label (methodology T5). Never says "unfair". */
export function labelInPlainWords(town: RankedTown): string {
  const { prb, prd_meets_iaao: prdOk } = town.stats;
  switch (town.label) {
    case "Regressive pattern":
      return "Shows a regressive pattern in recent sales: PRD and PRB are both past the IAAO limits.";
    case "Progressive pattern":
      return "Shows a progressive pattern in recent sales: pricier homes were assessed at a higher share of their value.";
    case "Within standards":
      return "PRD and PRB are both inside the IAAO ranges.";
    default:
      if (prb < -0.05 && prdOk) {
        return "Mixed signals: PRB leans regressive, but PRD is inside the IAAO range, so the two tests do not agree.";
      }
      return "Mixed signals: PRD and PRB do not agree.";
  }
}

/**
 * Warnings shown next to a town's label in the home page preview (methodology
 * C8). Zaden removed the limited-data and revaluation notes from the preview
 * (2026-10-15); town pages still show those.
 */
export function townCaveats(town: RankedTown): string[] {
  const notes: string[] = [];
  if (town.stats.label_sensitive_to_outliers) {
    notes.push("This label changes if a few unusual sales are set aside.");
  }
  return notes;
}

/** A made-up home for the "Why it matters" example. */
export type ExampleHome = { name: string; value: number; assessed: number };

/** HYPOTHETICAL homes in one town. Round numbers, not real data. */
export const EXAMPLE_HOMES: ExampleHome[] = [
  { name: "Home A", value: 300_000, assessed: 300_000 },
  { name: "Home B", value: 600_000, assessed: 450_000 },
];

/**
 * For each home: its assessment ratio, its share of the total value, and its
 * share of the taxes. Taxes are split by assessed value (one tax rate for the
 * whole town), so a home's tax share = its assessed value / total assessed.
 */
export function taxShares(homes: ExampleHome[]) {
  const totalValue = homes.reduce((sum, h) => sum + h.value, 0);
  const totalAssessed = homes.reduce((sum, h) => sum + h.assessed, 0);
  return homes.map((h) => ({
    ...h,
    ratio: h.assessed / h.value,
    valueShare: h.value / totalValue,
    taxShare: h.assessed / totalAssessed,
  }));
}
