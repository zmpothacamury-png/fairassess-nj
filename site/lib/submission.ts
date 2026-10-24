// Numbers and helpers for the hidden submission pages (/cover and /handout).
// Every number comes from the pipeline's JSON files or from the website's own checker
// engine run on them. Nothing here is typed in by hand.
import QRCode from "qrcode";
import { runChecker, type CheckerResult } from "@/lib/checker";
import type { County, PriceIndex, TownFile } from "@/lib/data/schema";

/** The made-up example home on the cover and handout: a town and an assessed value only, never an address.
 *  Same example as the README checker screenshot. */
export const EXAMPLE_HOME = { townSlug: "teaneck", assessedValue: 450_000 } as const;

/** The town used for the handout's headline finding (Zaden). */
export const HEADLINE_TOWN = "new-milford";

/** Run the website's checker on the example home. */
export function exampleResult(town: TownFile, priceIndex: PriceIndex): CheckerResult {
  return runChecker(
    { townSlug: EXAMPLE_HOME.townSlug, assessedValue: EXAMPLE_HOME.assessedValue, ownEstimate: null },
    town,
    priceIndex,
  );
}

/** The countywide label counts for the ranked towns (towns with 20 or more sales). */
export function labelCounts(county: County) {
  const by = county.towns_by_label;
  return {
    ranked: county.ranked_towns,
    within: by["Within standards"] ?? 0,
    mixed: by["Mixed signals"] ?? 0,
    regressive: by["Regressive pattern"] ?? 0,
    progressive: by["Progressive pattern"] ?? 0,
  };
}

/** The lowest- and highest-value quarters of a town (rule T3), with median ratios as whole percents. */
export function quarterGap(town: TownFile) {
  const low = town.tiers.find((t) => t.tier === 1);
  const high = town.tiers.find((t) => t.tier === 4);
  if (!low || !high) return null;
  return {
    lowPercent: Math.round(100 * low.median_ratio),
    highPercent: Math.round(100 * high.median_ratio),
    perQuarter: low.n,
  };
}

/** Where marks sit on the cover's big balance meter, as 0 to 100 (% of the track width). Same
 *  framing as the checker's BalanceMeter: room on both sides of the range, widened to fit the marks. */
export function meterScale(lowerTrigger: number, upperTrigger: number, marks: number[]) {
  const span = Math.max(upperTrigger - lowerTrigger, 10);
  const lo = Math.max(Math.min(lowerTrigger - 0.35 * span, ...marks.map((m) => m - 0.08 * span)), 0);
  const hi = Math.max(upperTrigger + 0.35 * span, ...marks.map((m) => m + 0.08 * span));
  return (v: number) => Math.min(Math.max((v - lo) / (hi - lo), 0), 1) * 100;
}

/** A QR code as a grid of dark (true) and light (false) squares, so the page can draw it with
 *  design-token colors. Error correction "M" survives a little smudging on paper. */
export function qrModules(text: string): { size: number; dark: boolean[] } {
  const qr = QRCode.create(text, { errorCorrectionLevel: "M" });
  const size = qr.modules.size;
  const dark: boolean[] = [];
  for (let i = 0; i < size * size; i++) dark.push(Boolean(qr.modules.data[i]));
  return { size, dark };
}

/** The address the QR code points to and the handout prints. Set SUBMISSION_URL at build time
 *  (for example, once a custom domain is live); otherwise the site's own production address. */
export function submissionUrl(siteUrl: string): string {
  return (process.env.SUBMISSION_URL ?? siteUrl).replace(/\/+$/, "");
}
