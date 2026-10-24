// Chart colors and number formats (design system "Chart palette").
// Colors point at the design tokens in app/globals.css, so charts never hold a
// hex value (design-token rule).

export const CHART = {
  /** Data marks: dots and bars (blue-600, the "assessed value" color). */
  mark: "var(--color-blue-600)",
  /** Reference lines and the IAAO band: the balance point (gold-400). Always paired with a text label. */
  reference: "var(--color-gold-400)",
  /** Range lines and the zero line. */
  context: "var(--color-ink-600)",
  /** Gridlines and axis rules. */
  grid: "var(--color-outline-200)",
  /** Axis and label text. */
  text: "var(--color-ink-600)",
  strongText: "var(--color-ink-800)",
  /** Surface behind marks (rings around dots). */
  surface: "var(--color-white)",
  /** Highlight ring on the active dot. */
  focus: "var(--color-navy-900)",
} as const;

/**
 * Chart text sizes in px. One place for every chart, so axes match.
 * 13px is the type scale's text-xs. Phones drop to 12px where labels share a
 * narrow column (town names, the second line under each bar).
 */
export const CHART_FONT = {
  tick: 13,
  label: 13,
  narrow: 12,
} as const;

/** 1_250_000 -> "$1.25M", 394_017 -> "$394k". Short money labels for chart axes. */
export function shortDollars(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `$${Number.isInteger(m) ? m : Number(m.toFixed(2))}M`;
  }
  return `$${Math.round(n / 1000)}k`;
}

/** "$394k to $570k": a value quarter's range for an axis label. */
export function tierRange(lo: number, hi: number): string {
  return `${shortDollars(lo)} to ${shortDollars(hi)}`;
}

/**
 * Evenly spaced ratio ticks from lo to hi (decimals): every 10 points, or
 * every 20 if that would give more than 8 ticks. lo and hi are rounded out.
 */
export function percentTicks(lo: number, hi: number): number[] {
  const step = (hi - lo) / 0.1 > 8 ? 0.2 : 0.1;
  const start = Math.floor(lo / step + 1e-9) * step;
  const ticks: number[] = [];
  for (let t = start; t < hi + step - 1e-9; t += step) ticks.push(Number(t.toFixed(2)));
  return ticks;
}

/** Round, readable ticks for a log-scale money axis between lo and hi. */
export function logMoneyTicks(lo: number, hi: number): number[] {
  const candidates = [
    100_000, 200_000, 300_000, 500_000, 750_000, 1_000_000, 1_500_000, 2_000_000, 3_000_000, 5_000_000,
    7_500_000, 10_000_000, 20_000_000,
  ];
  const inRange = candidates.filter((t) => t >= lo && t <= hi);
  // Keep at most 6 ticks so labels never collide on a phone.
  if (inRange.length <= 6) return inRange;
  const step = Math.ceil(inRange.length / 6);
  return inRange.filter((_, i) => i % step === 0);
}

/** Padded axis limits for PRB ranges, rounded out to the nearest 0.05. */
export function prbDomain(lows: number[], highs: number[]): [number, number] {
  const lo = Math.min(-0.1, ...lows);
  const hi = Math.max(0.1, ...highs);
  return [Math.floor(lo / 0.05) * 0.05, Math.ceil(hi / 0.05) * 0.05];
}
