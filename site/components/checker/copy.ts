// Words and display choices for the appeal checker page.
//
// The page never re-does any checker math (methodology Section 6). Everything
// here only reads a CheckerResult from lib/checker and picks words, colors,
// and positions for it. Headlines are the result names in methodology K11.
import type { Status } from "@/components/StatusPill";
import type { Chapter123Position, CheckerResult, Verdict, WarningCode } from "@/lib/checker";
import { MIN_COMPS } from "@/lib/checker/config";
import { formatCount } from "@/lib/home";

export type VerdictCopy = {
  status: Status;
  pill: string;
  headline: string;
};

/** Pill, color status, and headline for each verdict (K11, and K14 for 2027 revaluation towns). */
export const VERDICTS: Record<Verdict, VerdictCopy> = {
  "may-have-grounds": {
    status: "may-have-grounds",
    pill: "May have grounds to appeal",
    headline: "You may have grounds to appeal.",
  },
  "within-range": {
    status: "within-range",
    pill: "Within the normal range",
    headline: "Your assessment is within the normal range.",
  },
  "possibly-under-assessed": {
    status: "under-assessed",
    pill: "May be lower than typical",
    headline: "Your assessment may be lower than typical.",
  },
  "not-enough-data": {
    status: "not-enough-data",
    pill: "Not enough data",
    headline: "Not enough data to check your home.",
  },
  "revaluation-no-test": {
    status: "neutral",
    pill: "No Chapter 123 test in 2027",
    headline: "Chapter 123 does not apply in your town this year.",
  },
};

/** Same pills for one Chapter 123 test position (used for the homeowner's own estimate, K9). */
export const POSITION_VERDICT: Record<Chapter123Position, Verdict> = {
  above: "may-have-grounds",
  within: "within-range",
  below: "possibly-under-assessed",
};

/** One plain sentence under the headline that says why. */
export function verdictReason(r: CheckerResult): string {
  const town = r.town.name;
  switch (r.verdict) {
    case "may-have-grounds":
      return `Your assessment is a bigger share of your home's estimated value than ${town}'s common level range allows. The County Board could lower it.`;
    case "within-range":
      return `Your assessment ratio is inside ${town}'s common level range. Chapter 123 does not lower an assessment that is inside the range.`;
    case "possibly-under-assessed":
      return `Your assessment ratio is below ${town}'s common level range. If you appeal, the County Board could raise your assessment, because it applies the town's average ratio in both directions.`;
    case "not-enough-data":
      return `We found ${formatCount(r.comps.count)} recent ${r.comps.count === 1 ? "sale" : "sales"} in ${town} of homes assessed close to yours. We need at least ${MIN_COMPS} to make a fair estimate.`;
    case "revaluation-no-test":
      return `${town} is getting new assessments for ${r.appeal.taxYear}, so we do not give a Chapter 123 result. Below is our estimate of your home's market value from recent sales.`;
  }
}

/** The strength line for "may have grounds" (K11). */
export function strengthLine(r: CheckerResult): string | null {
  if (r.strength === "strong") {
    return "Strong result: even at the high end of our value range, your ratio is still above the limit.";
  }
  if (r.strength === "borderline") {
    return "Borderline result: at the high end of our value range, your ratio would be inside the limit.";
  }
  return null;
}

/** Title and tone for each warning Callout. The engine writes the message itself. */
export const WARNING_TITLES: Record<WarningCode, { title: string; tone: "info" | "caution" }> = {
  "own-estimate-differs": { title: "Your estimate and ours are far apart", tone: "caution" },
  "revaluation-this-year": { title: "New assessments are coming in 2027", tone: "caution" },
  "revaluation-last-year": { title: "This town just had a revaluation", tone: "info" },
  "limited-data": { title: "Limited data", tone: "caution" },
  "widened-band": { title: "We widened the search", tone: "info" },
  "no-tax-rate": { title: "No savings estimate", tone: "info" },
};

/** 98.7654 -> "98.77%". Ratios show with 2 decimals, like the state's list (methodology 6.8). */
export function pct2(points: number): string {
  return `${points.toFixed(2)}%`;
}

/**
 * The homeowner's ratio at the low, middle, and high market value (percent).
 * h = A / (A / R) x 100 = R x 100, so these are the engine's own weighted
 * percentile ratios (K8) shown as percents: a unit change, not new math.
 * The low ratio goes with the high market value and the other way around.
 */
export function ratioRange(r: CheckerResult): { low: number; mid: number; high: number } | null {
  if (!r.estimate) return null;
  return { low: 100 * r.estimate.ratioP25, mid: 100 * r.estimate.ratioP50, high: 100 * r.estimate.ratioP75 };
}

/** Which way the small balance-scale icon tips. Blue (assessed value) side down when the ratio is
 *  above the range; level when it is within; green (market value) side down when it is below. */
export function tiltFor(position: Chapter123Position | null): { degrees: number; words: string } {
  if (position === "above") return { degrees: -8, words: "The scale tips toward the assessed value side." };
  if (position === "below") return { degrees: 8, words: "The scale tips toward the market value side." };
  return { degrees: 0, words: "The scale is level." };
}

/** Text that is only digits, commas, spaces, and "$" gets commas added as the user types. Anything
 *  else (cents, letters, a minus sign) is left exactly as typed so the engine can explain the problem. */
export function formatMoneyTyping(text: string): string {
  if (!/^[\d,\s$]*$/.test(text)) return text;
  const digits = text.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  if (digits === "") return "";
  // Group by hand (not Number()), so a very long typo keeps every digit the user typed.
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** How many digits come before position `caret` in `text` (to keep the cursor in place). */
export function digitsBefore(text: string, caret: number): number {
  return text.slice(0, caret).replace(/\D/g, "").length;
}

/** The caret position in `text` just after its `n`th digit. */
export function caretAfterDigits(text: string, n: number): number {
  if (n === 0) return 0;
  let seen = 0;
  for (let i = 0; i < text.length; i++) {
    if (/\d/.test(text[i])) seen++;
    if (seen === n) return i + 1;
  }
  return text.length;
}
