"use client";

import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { CHART, CHART_FONT } from "@/lib/chart";
import { useNarrow } from "@/lib/useNarrow";

export type IndexPoint = { month: string; label: string; index: number };

/**
 * The Bergen County monthly price index (methodology K4), from the first month
 * of the comp window (display rule in methodology 6.3). 1.00 = the base month.
 * Square markers, a gold base line with a text label, and a table beside it
 * in ChartFrame, so color is never the only signal.
 */
export function PriceIndexChart({ points, baseLabel }: { points: IndexPoint[]; baseLabel: string }) {
  const narrow = useNarrow();
  const values = points.map((p) => p.index);
  const lo = Math.floor(Math.min(...values, 1) * 20) / 20;
  const hi = Math.ceil(Math.max(...values, 1) * 20) / 20;
  const ticks: number[] = [];
  for (let t = lo; t <= hi + 1e-9; t += 0.05) ticks.push(Number(t.toFixed(2)));
  return (
    <div>
      <div className="h-72 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 12, right: 12, bottom: 8, left: 0 }}>
            <CartesianGrid vertical={false} stroke={CHART.grid} />
            <XAxis
              dataKey="label"
              interval={narrow ? 5 : 2}
              tick={{ fill: CHART.text, fontSize: narrow ? CHART_FONT.narrow : CHART_FONT.tick }}
              stroke={CHART.grid}
              tickLine={false}
            />
            <YAxis
              domain={[lo, hi]}
              ticks={ticks}
              tickFormatter={(v: number) => v.toFixed(2)}
              tick={{ fill: CHART.text, fontSize: CHART_FONT.tick }}
              stroke={CHART.grid}
              width={44}
            />
            <ReferenceLine y={1} stroke={CHART.reference} strokeWidth={3} strokeDasharray="8 5" />
            <Line
              dataKey="index"
              stroke={CHART.mark}
              strokeWidth={2}
              isAnimationActive={false}
              dot={({ cx, cy, index }) => (
                <rect key={index} x={Number(cx) - 3.5} y={Number(cy) - 3.5} width={7} height={7} fill={CHART.mark} stroke={CHART.surface} />
              )}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 flex items-center gap-2 text-sm text-ink-600">
        <svg aria-hidden="true" width="28" height="14" viewBox="0 0 28 14">
          <line x1="2" y1="7" x2="26" y2="7" stroke={CHART.reference} strokeWidth="3" strokeDasharray="8 5" />
        </svg>
        1.00 = prices in {baseLabel}. Each older sale&rsquo;s price is adjusted to this level.
      </p>
    </div>
  );
}
