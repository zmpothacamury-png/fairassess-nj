// Logic for the Town Rankings page and the town pages: the summary sentence,
// table sorting and filtering, plain-English stat lines, and town notes.
// Every number comes from the pipeline's JSON (lib/data/load.ts); these
// functions only pick, compare, and word it. Rules are in docs/methodology.md
// (Sections 2.3, 5, and 6.7). Wording rule: describe patterns in the data,
// never accuse a town or an assessor.
import type { Tier, TownEntry, TownStats } from "./data/schema";
import type { SourceKey } from "./sources";

// ---------------------------------------------------------------- IAAO ranges (methodology 2.3)

export const IAAO = {
  codMax: 15.0,
  codMaxNewer: 10.0,
  codLowWarning: 5.0,
  prdLow: 0.98,
  prdHigh: 1.03,
  prbLow: -0.05,
  prbHigh: 0.05,
  prbUnacceptable: 0.1,
} as const;

// ---------------------------------------------------------------- formatting

/** 0.4777 -> "47.8%". A ratio (decimal) as a percent with `digits` decimals. */
export function ratioPct(ratio: number, digits = 1): string {
  return `${(ratio * 100).toFixed(digits)}%`;
}

/** 57.8 -> "57.80%". A percent the state prints with 2 decimals. */
export function statePct(percent: number): string {
  return `${percent.toFixed(2)}%`;
}

/** -0.098 -> "−0.0980", 0.05 -> "+0.0500". PRB and PRD keep 4 decimals so values near a cutoff read right. */
export function signed4(x: number): string {
  if (x === 0) return "0.0000";
  return `${x < 0 ? "−" : "+"}${Math.abs(x).toFixed(4)}`;
}

// ---------------------------------------------------------------- summary sentence (page header + meta description)

/**
 * Two tier medians as whole percents. If rounding would make two different
 * medians look the same, use one decimal so the sentence never hides a gap.
 */
export function tierPercents(low: number, high: number): [string, string] {
  const a = Math.round(low * 100);
  const b = Math.round(high * 100);
  if (a === b && low !== high) return [ratioPct(low, 1), ratioPct(high, 1)];
  return [`${a}%`, `${b}%`];
}

/**
 * The one-sentence summary at the top of a town page, built from the data with
 * a template. Towns with statistics compare the lowest and highest value
 * quarters (rule T3). Towns without statistics say why (T6, C9).
 */
export function summarySentence(town: Pick<TownEntry, "name" | "n_sales" | "data_quality" | "stats"> & { tiers: Tier[] }): string {
  const q1 = town.tiers.find((t) => t.tier === 1);
  const q4 = town.tiers.find((t) => t.tier === 4);
  if (town.stats && q1 && q4) {
    const [low, high] = tierPercents(q1.median_ratio, q4.median_ratio);
    return `In recent sales, homes in the lowest value quarter were assessed at a median of ${low} of their sale price, compared with ${high} for the highest value quarter.`;
  }
  const sales = town.n_sales === 1 ? "1 usable single-family sale" : `${town.n_sales} usable single-family sales`;
  if (town.data_quality === "recent revaluation") {
    return `${town.name} put new assessments into effect for 2026, and only ${sales} on the new assessments are in our data, fewer than the 20 we need to measure how evenly homes are assessed.`;
  }
  return `${town.name} had only ${sales} in our data, fewer than the 20 we need to measure how evenly homes are assessed.`;
}

// ---------------------------------------------------------------- labels -> StatusPill

/** StatusPill look for each label (T5). Color is never alone: each pill has its own icon and words. */
export function labelStatus(label: TownEntry["label"]) {
  switch (label) {
    case "Within standards":
      return "within-range" as const;
    case "Regressive pattern":
      return "may-have-grounds" as const;
    case "Progressive pattern":
      return "under-assessed" as const;
    case "Not enough sales":
      return "not-enough-data" as const;
    default:
      return "neutral" as const;
  }
}

/** One plain sentence for each label, worded as a pattern in the data. */
export const LABEL_MEANING: Record<TownEntry["label"], string> = {
  "Regressive pattern": "In recent sales, cheaper homes were assessed at a higher share of their value than pricier homes. Both tests (PRD and PRB) are past the IAAO limits.",
  "Progressive pattern": "In recent sales, pricier homes were assessed at a higher share of their value than cheaper homes. Both tests (PRD and PRB) are past the IAAO limits.",
  "Within standards": "In recent sales, cheaper and pricier homes were assessed at similar shares of their value. Both tests are inside the IAAO ranges.",
  "Mixed signals": "The two tests (PRD and PRB) do not agree, so we do not call this a clear pattern.",
  "Not enough sales": "Fewer than 20 usable sales, so we do not show statistics.",
};

// ---------------------------------------------------------------- rankings table: filter and sort

export type SortKey = "prb" | "prd" | "cod" | "median" | "n_sales" | "name";
export type SortDir = "asc" | "desc";
export type RankedEntry = TownEntry & { rank: number; stats: TownStats };

export const SORT_LABELS: Record<SortKey, string> = {
  prb: "PRB",
  prd: "PRD",
  cod: "COD",
  median: "Median ratio",
  n_sales: "Sales analyzed",
  name: "Town",
};

/** The direction a column sorts in when first clicked. PRB starts most negative first (methodology 5.4). */
export const DEFAULT_DIR: Record<SortKey, SortDir> = {
  prb: "asc",
  prd: "desc",
  cod: "desc",
  median: "desc",
  n_sales: "desc",
  name: "asc",
};

export type TownFilter = {
  /** Text typed in the search box. Matches town names, ignoring case, spaces, and hyphens. */
  query: string;
  /** "all" or one label. */
  label: "all" | TownEntry["label"];
  /** Show towns tagged "limited data" (20 to 39 sales). */
  includeLimited: boolean;
};

export const DEFAULT_FILTER: TownFilter = { query: "", label: "all", includeLimited: true };

/** "Ho-Ho-Kus" -> "hohokus", so "ho ho kus" and "hohokus" both find it. */
export function normalizeName(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function matchesQuery(name: string, query: string): boolean {
  const q = normalizeName(query);
  return q === "" || normalizeName(name).includes(q);
}

/** Towns with statistics (a rank). These fill the rankings table and the forest plot. */
export function rankedTowns(towns: TownEntry[]): RankedEntry[] {
  return towns.filter((t): t is RankedEntry => t.rank !== null && t.stats !== null);
}

/** Towns without statistics ("Not enough sales"), listed below the table. */
export function unrankedTowns(towns: TownEntry[]): TownEntry[] {
  return towns.filter((t) => t.rank === null || t.stats === null).sort((a, b) => a.name.localeCompare(b.name));
}

/** Ranked towns that pass the search box, label filter, and limited-data toggle. */
export function filterRanked(towns: RankedEntry[], f: TownFilter): RankedEntry[] {
  return towns.filter(
    (t) =>
      matchesQuery(t.name, f.query) &&
      (f.label === "all" || t.label === f.label) &&
      (f.includeLimited || t.data_quality !== "limited data"),
  );
}

function sortValue(t: RankedEntry, key: SortKey): number | string {
  switch (key) {
    case "prb":
      return t.stats.prb;
    case "prd":
      return t.stats.prd;
    case "cod":
      return t.stats.cod;
    case "median":
      return t.stats.median_ratio;
    case "n_sales":
      return t.n_sales;
    case "name":
      return t.name;
  }
}

/** Sort a copy. Ties keep the official PRB rank order, so the result always repeats. */
export function sortRanked(towns: RankedEntry[], key: SortKey, dir: SortDir): RankedEntry[] {
  const sign = dir === "asc" ? 1 : -1;
  return [...towns].sort((a, b) => {
    const va = sortValue(a, key);
    const vb = sortValue(b, key);
    const c = typeof va === "string" ? va.localeCompare(vb as string) : va - (vb as number);
    return c !== 0 ? sign * c : a.rank - b.rank;
  });
}

/** Next sort state when a column header is clicked: same column flips, a new column starts at its default. */
export function nextSort(current: { key: SortKey; dir: SortDir }, clicked: SortKey): { key: SortKey; dir: SortDir } {
  if (current.key === clicked) return { key: clicked, dir: current.dir === "asc" ? "desc" : "asc" };
  return { key: clicked, dir: DEFAULT_DIR[clicked] };
}

// ---------------------------------------------------------------- stat cards

export type StatLine = {
  key: "median" | "cod" | "prd" | "prb";
  label: string;
  value: string;
  range: string;
  iaao: string;
  /** null: IAAO sets no pass/fail for this measure (the median ratio). */
  meets: boolean | null;
  sentence: string;
};

/** The four stat cards on a town page: value, 95% range, IAAO range, pass/outside, one plain sentence. */
export function statLines(s: TownStats): StatLine[] {
  const prdSentence =
    s.prd > IAAO.prdHigh
      ? "On average, cheaper homes had higher ratios than pricier homes."
      : s.prd < IAAO.prdLow
        ? "On average, pricier homes had higher ratios than cheaper homes."
        : "On average, cheaper and pricier homes had similar ratios.";
  const prbPct = Math.round(Math.abs(s.prb) * 100);
  const prbSentence =
    prbPct === 0
      ? "The ratio barely changes as home value goes up."
      : `The ratio ${s.prb < 0 ? "falls" : "rises"} about ${prbPct}% each time home value doubles.`;
  let codSentence = `On average, a home's ratio was ${s.cod.toFixed(1)}% away from the typical ratio. Lower means more even.`;
  if (s.cod_below_5) codSentence += " IAAO says a COD under 5.0 can mean the sales are not typical.";
  return [
    {
      key: "median",
      label: "Median assessment ratio",
      value: ratioPct(s.median_ratio),
      range: `95% range: ${ratioPct(s.median_ci_low)} to ${ratioPct(s.median_ci_high)}`,
      iaao: "No IAAO pass/fail. New Jersey towns assess at a share of market value on purpose.",
      meets: null,
      sentence: `A typical home that sold was assessed at about ${Math.round(s.median_ratio * 100)}% of its sale price.`,
    },
    {
      key: "cod",
      label: "COD (evenness)",
      value: s.cod.toFixed(2),
      range: `95% range: ${s.cod_ci_low.toFixed(2)} to ${s.cod_ci_high.toFixed(2)}`,
      iaao: `IAAO: ${IAAO.codMax.toFixed(1)} or less (${IAAO.codMaxNewer.toFixed(1)} or less in newer, more similar areas)`,
      meets: s.cod_meets_iaao,
      sentence: codSentence,
    },
    {
      key: "prd",
      label: "PRD (price-related differential)",
      value: s.prd.toFixed(4),
      range: `95% range: ${s.prd_ci_low.toFixed(4)} to ${s.prd_ci_high.toFixed(4)}`,
      iaao: `IAAO: ${IAAO.prdLow.toFixed(2)} to ${IAAO.prdHigh.toFixed(2)}`,
      meets: s.prd_meets_iaao,
      sentence: prdSentence,
    },
    {
      key: "prb",
      label: "PRB (price-related bias)",
      value: signed4(s.prb),
      range: `95% range: ${signed4(s.prb_ci_low)} to ${signed4(s.prb_ci_high)}`,
      iaao: "IAAO: −0.05 to +0.05",
      meets: s.prb_meets_iaao,
      sentence: s.prb_ci_outside_0_10
        ? `${prbSentence} Its whole 95% range is outside −0.10 to +0.10, which IAAO calls unacceptable.`
        : prbSentence,
    },
  ];
}

// ---------------------------------------------------------------- PRB trend line (scatter chart)

/**
 * The PRB line turned back into ratios (methodology 2.2): y = a + b x with
 * x = ln(V) / 0.693 and y = (R - median) / median, so
 * R = median x (1 + a + b x ln(V) / 0.693).
 */
export function prbTrendRatio(value: number, s: Pick<TownStats, "median_ratio" | "prb" | "prb_intercept">): number {
  const x = Math.log(value) / 0.693;
  return s.median_ratio * (1 + s.prb_intercept + s.prb * x);
}

/** Points for the trend line: `steps` values spread evenly on a log scale from lo to hi. */
export function prbTrendPoints(lo: number, hi: number, s: Pick<TownStats, "median_ratio" | "prb" | "prb_intercept">, steps = 24) {
  const a = Math.log(lo);
  const b = Math.log(hi);
  return Array.from({ length: steps }, (_, i) => {
    const value = Math.exp(a + ((b - a) * i) / (steps - 1));
    return { value, trend: prbTrendRatio(value, s) };
  });
}

// ---------------------------------------------------------------- Chapter 123 (methodology K10)

/**
 * The lines the checker uses (K10): U* = min(U, 100) and L* = min(L, 100),
 * because the state counts ratios over 100% as 100%.
 */
export function ch123Triggers(ch: TownEntry["ch123"]) {
  return {
    upper: Math.min(ch.upper_limit, 100),
    lower: Math.min(ch.lower_limit, 100),
    upperCapped: ch.upper_limit > 100,
    lowerCapped: ch.lower_limit > 100,
    averageCapped: ch.average_ratio > 100,
  };
}

/** Assessment at which a home worth `value` crosses a trigger (percent). Rounded to whole dollars. */
export function assessmentAt(value: number, triggerPct: number): number {
  return Math.round((value * triggerPct) / 100);
}

/** Appeal deadline wording for tax year 2027 (methodology K13, Form A-1 instruction 1). */
export function appealDeadline(town: Pick<TownEntry, "revaluation_tax_year">): { date: string; detail: string } {
  if (town.revaluation_tax_year === 2027) {
    return {
      date: "May 1, 2027",
      detail: "This town is on the county's list for a town-wide revaluation or reassessment in 2027, so its deadline is May 1.",
    };
  }
  return {
    date: "April 1, 2027",
    detail: "Or 45 days after the town finishes mailing assessment notices, if that is later.",
  };
}

/** Filing fees by assessed value (methodology K13, Form A-1 instruction 4). */
export const FILING_FEES = [
  { range: "Under $150,000", fee: "$5" },
  { range: "$150,000 to under $500,000", fee: "$25" },
  { range: "$500,000 to under $1,000,000", fee: "$100" },
  { range: "$1,000,000 or more", fee: "$150" },
] as const;

// ---------------------------------------------------------------- notes shown on a town page

/** Facts from other files that the notes need. */
export type NoteContext = {
  /** Towns without statistics (county.json towns_by_label). */
  thinCount: number;
  /** Of those, towns hidden because of a 2026 revaluation (county.json towns_by_data_quality). */
  thinRevalCount: number;
  /** Recording period of the sales, e.g. "July 2025 to June 2026" (meta.json). */
  period: string;
};

export type TownNote = {
  id: "limited" | "outliers" | "reval-2027" | "reval-2026-stats" | "reval-2026-thin" | "few-sales";
  title: string;
  body: string;
  sources: SourceKey[];
};

/**
 * Warnings for a town page, in the order they show. These come from
 * methodology T6 (limited data), C8 (outlier sensitivity), C9 and K14
 * (revaluations), and C3 category 27.
 */
export function townNotes(
  town: Pick<TownEntry, "name" | "n_sales" | "data_quality" | "revaluation_tax_year" | "stats" | "label">,
  ctx: NoteContext,
): TownNote[] {
  const notes: TownNote[] = [];
  const s = town.stats;
  if (town.data_quality === "limited data") {
    notes.push({
      id: "limited",
      title: "Limited data",
      body: `This town has ${town.n_sales} usable sales (20 to 39 counts as limited). With this few sales, one or two unusual sales can move the results, so the 95% ranges are wide.`,
      sources: [],
    });
  }
  if (s?.label_sensitive_to_outliers) {
    notes.push({
      id: "outliers",
      title: "Sensitive to unusual sales",
      body: `With a stricter rule for setting aside unusual sales (1.5 x IQR instead of 3.0), this town's label would be "${s.label_fence_1_5}" instead of "${town.label}". Read the label with care.`,
      sources: [],
    });
  }
  if (town.revaluation_tax_year === 2027) {
    notes.push({
      id: "reval-2027",
      title: "New assessments coming for 2027",
      body: `${town.name} is on the county's list of towns getting a town-wide revaluation or reassessment for tax year 2027. Our results describe the assessments from before that change.`,
      sources: ["bergen_revaluations"],
    });
  }
  if (town.revaluation_tax_year === 2026 && s) {
    notes.push({
      id: "reval-2026-stats",
      title: "New assessments in 2026",
      body: `${town.name} put new assessments into effect for 2026. We use only sales that carry the new assessments (methodology rule C9).`,
      sources: ["bergen_revaluations"],
    });
  }
  if (town.data_quality === "recent revaluation") {
    notes.push({
      id: "reval-2026-thin",
      title: "Why there are so few sales",
      body: `${town.name} put new assessments into effect for 2026. The state does not use sales recorded from July to December before new assessments take effect (non-usable category 27), and we keep only sales on the new assessments (rule C9). That leaves ${town.n_sales} usable sales, fewer than the 20 we need. The same is true of ${ctx.thinRevalCount} of the ${ctx.thinCount} Bergen towns without statistics.`,
      sources: ["nonusable_guidelines", "bergen_revaluations"],
    });
  } else if (town.data_quality === "not enough sales") {
    notes.push({
      id: "few-sales",
      title: "Why there are no statistics",
      body: `${town.name} had ${town.n_sales} usable single-family sales recorded from ${ctx.period}. With fewer than 20, one or two unusual sales could flip the results, so we do not show them.`,
      sources: [],
    });
  }
  return notes;
}
