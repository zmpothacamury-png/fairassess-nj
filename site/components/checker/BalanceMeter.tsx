import type { CSSProperties } from "react";
import type { Chapter123Position } from "@/lib/checker";
import { pct2, tiltFor } from "./copy";

export type MeterRange = {
  /** The limits as the state printed them (2027CH123.pdf). */
  lowerLimit: number;
  upperLimit: number;
  averageRatio: number;
  /** The limits the test uses: L* and U* (capped at 100%, methodology K10). */
  lowerTrigger: number;
  upperTrigger: number;
};
export type MeterMarker = { mid: number; low?: number; high?: number; label: string };

/**
 * The balance meter (the checker's signature visual). A horizontal track of
 * assessment ratios: blue zone below the town's common level range, green
 * inside it, gold above it (the result colors). The gold dot is the town's
 * average ratio, like the logo's pivot. The navy bar is the homeowner's ratio
 * from our estimate, with a whisker for the likely range; a hollow ring is the
 * ratio from their own estimate. Every mark has a direct label, and a
 * sentence for screen readers says the same thing. It never animates in: only
 * the small scale icon tilts, and it stays still under reduced motion.
 */
export function BalanceMeter({
  townName,
  range,
  ours,
  own,
  position,
}: {
  townName: string;
  range: MeterRange;
  ours?: MeterMarker | null;
  own?: MeterMarker | null;
  position: Chapter123Position | null;
}) {
  const L = range.lowerTrigger;
  const U = range.upperTrigger;
  const span = Math.max(U - L, 10);
  const marks = [ours?.mid, ours?.low, ours?.high, own?.mid].filter((v): v is number => v !== undefined);
  // Room on both sides for the limit labels, widened to fit the marks, but never so far that one
  // wild value (a typo in the homeowner's estimate) squeezes the range into a sliver.
  let lo = Math.min(L - 0.35 * span, ...marks.map((m) => m - 0.08 * span));
  let hi = Math.max(U + 0.35 * span, ...marks.map((m) => m + 0.08 * span));
  lo = Math.max(lo, L - 1.2 * span, 0);
  hi = Math.min(hi, U + 1.2 * span);
  const pos = (v: number) => Math.min(Math.max((v - lo) / (hi - lo), 0), 1) * 100;
  const off = (v: number) => v < lo || v > hi;
  const edgeLabel = (p: number): CSSProperties =>
    p < 28 ? { left: 0 } : p > 72 ? { right: 0 } : { left: `${p}%`, transform: "translateX(-50%)" };

  const close = pos(U) - pos(L) < 40;
  const tilt = tiltFor(position);
  const capped = range.upperLimit > 100 || range.lowerLimit > 100;
  const positionWords =
    position === "above"
      ? "above the range"
      : position === "below"
        ? "below the range"
        : position === "within"
          ? "inside the range"
          : null;

  const sr =
    `${townName}'s common level range for 2027 runs from ${pct2(range.lowerLimit)} to ${pct2(range.upperLimit)}, ` +
    `and its average ratio is ${pct2(range.averageRatio)}.` +
    (capped ? ` The state counts ratios over 100% as 100%, so the range we test is ${pct2(L)} to ${pct2(U)}.` : "") +
    (ours
      ? ` Your ratio using ${ours.label.toLowerCase()}: ${pct2(ours.mid)}` +
        (ours.low !== undefined && ours.high !== undefined ? `, likely from ${pct2(ours.low)} to ${pct2(ours.high)}` : "") +
        "."
      : "") +
    (own ? ` Your ratio using ${own.label.toLowerCase()}: ${pct2(own.mid)}.` : "") +
    (positionWords ? ` Your ratio is ${positionWords}. ${tilt.words}` : "");

  return (
    <figure className="min-w-0">
      <figcaption className="flex items-center gap-3">
        <ScaleIcon degrees={tilt.degrees} />
        <span className="font-heading text-lg font-bold text-navy-900">Where your ratio sits</span>
      </figcaption>
      <p className="sr-only">{sr}</p>

      <div aria-hidden="true" className="mt-6 select-none">
        {/* Labels for the homeowner's marks, above the track. */}
        {[own, ours].map((m, row) =>
          m ? (
            <div key={row} className="relative h-7">
              <span
                className="absolute bottom-1 whitespace-nowrap text-sm font-semibold tabular-nums text-navy-900"
                style={edgeLabel(pos(m.mid))}
              >
                {m.label}: {pct2(m.mid)}
                {off(m.mid) ? (m.mid > hi ? " →" : " ←") : ""}
              </span>
            </div>
          ) : null,
        )}

        {/* The track: blue below the range, green inside, gold above. */}
        <div className="relative h-8">
          <div className="absolute inset-x-0 top-1/2 h-3 -translate-y-1/2 overflow-hidden rounded-full border border-outline-200">
            <span className="absolute inset-y-0 left-0 bg-blue-100" style={{ width: `${pos(L)}%` }} />
            <span
              className="absolute inset-y-0 border-x-2 border-green-600 bg-green-100"
              style={{ left: `${pos(L)}%`, width: `${pos(U) - pos(L)}%` }}
            />
            <span className="absolute inset-y-0 right-0 bg-gold-100" style={{ left: `${pos(U)}%` }} />
          </div>
          {/* Town average: the gold pivot dot. */}
          <span
            className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-gold-400"
            style={{ left: `${pos(range.averageRatio)}%` }}
          />
          {ours && ours.low !== undefined && ours.high !== undefined && (
            <span
              className="absolute top-1/2 h-0.5 -translate-y-1/2 bg-navy-900"
              style={{ left: `${pos(ours.low)}%`, width: `${Math.max(pos(ours.high) - pos(ours.low), 0)}%` }}
            >
              <span className="absolute -left-px -top-1.5 h-3.5 w-0.5 bg-navy-900" />
              <span className="absolute -right-px -top-1.5 h-3.5 w-0.5 bg-navy-900" />
            </span>
          )}
          {ours && (
            <span
              className="absolute top-0 h-8 w-1.5 -translate-x-1/2 rounded-full bg-navy-900 ring-2 ring-white"
              style={{ left: `${pos(ours.mid)}%` }}
            />
          )}
          {own && (
            <span
              className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-navy-700 bg-white"
              style={{ left: `${pos(own.mid)}%` }}
            />
          )}
        </div>

        {/* Limit labels point away from each other from their ticks. When the ticks are close (or the
            same, when both limits are over 100%), the labels move to the two ends so they never overlap. */}
        <div className={`relative mt-2 text-sm tabular-nums text-ink-600 ${capped ? "h-[4.5rem]" : "h-12"}`}>
          <span
            className="absolute top-0 whitespace-nowrap text-right"
            style={close || pos(L) < 30 ? { left: 0, textAlign: "left" } : { right: `${100 - pos(L)}%` }}
          >
            <span className="block">Lower limit</span>
            <span className="block font-semibold text-navy-900">{pct2(range.lowerLimit)}</span>
            {range.lowerLimit > 100 && <span className="block">tested as 100%</span>}
          </span>
          <span
            className="absolute top-0 whitespace-nowrap"
            style={close || pos(U) > 62 ? { right: 0, textAlign: "right" } : { left: `${pos(U)}%` }}
          >
            <span className="block">Upper limit</span>
            <span className="block font-semibold text-navy-900">{pct2(range.upperLimit)}</span>
            {range.upperLimit > 100 && <span className="block">tested as 100%</span>}
          </span>
        </div>
        <div className="relative h-10 text-sm tabular-nums text-ink-600">
          <span className="absolute top-0 flex items-center gap-1.5 whitespace-nowrap" style={edgeLabel(pos(range.averageRatio))}>
            <span className="h-2.5 w-2.5 rounded-full bg-gold-400" />
            Town average <span className="font-semibold text-navy-900">{pct2(range.averageRatio)}</span>
          </span>
        </div>
      </div>

      <p className="mt-2 max-w-prose text-sm text-ink-600">
        Green is {townName}&rsquo;s common level range for 2027. Above it (gold) you may have grounds to appeal; below
        it (blue) an appeal could raise your assessment.
        {ours?.low !== undefined ? " The thin line shows our likely range." : ""}
        {capped ? " The state counts any ratio over 100% as 100%, so the range we test stops at 100%." : ""}
      </p>
    </figure>
  );
}

/**
 * The logo's balance scale, small: blue pan on the left (assessed value),
 * green on the right (market value), gold pivot. The beam tips once when the
 * result appears (CSS `scale-tilt` in globals.css); reduced motion shows the
 * final angle with no movement. Decorative: the sentence above says it in words.
 */
function ScaleIcon({ degrees }: { degrees: number }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 56 40" className="h-10 w-14 shrink-0" fill="none">
      <path d="M28 12 L22 36 H34 Z" className="fill-navy-700" />
      <g className="scale-tilt" style={{ "--tilt": `${degrees}deg` } as CSSProperties}>
        <line x1="6" y1="12" x2="50" y2="12" strokeWidth="2.5" strokeLinecap="round" className="stroke-navy-700" />
        <line x1="8" y1="12" x2="8" y2="20" strokeWidth="1.5" className="stroke-navy-700" />
        <line x1="48" y1="12" x2="48" y2="20" strokeWidth="1.5" className="stroke-navy-700" />
        <path d="M1 20 H15 A7 6 0 0 1 1 20 Z" className="fill-blue-600" />
        <path d="M41 20 H55 A7 6 0 0 1 41 20 Z" className="fill-green-600" />
      </g>
      <circle cx="28" cy="12" r="3.5" className="fill-gold-400" />
    </svg>
  );
}
