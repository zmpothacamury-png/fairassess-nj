"use client";

import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from "recharts";
import { CHART, CHART_FONT, logMoneyTicks, percentTicks, shortDollars } from "@/lib/chart";
import { formatDollars } from "@/lib/home";

export type SalePoint = { value: number; ratio: number };

/**
 * Chart B: every sale (or an even sample of 300) as a dot, assessment ratio
 * against value, with value on a log scale so each step to the right is the
 * same percent increase. The gold line is the PRB trend line (its slope is
 * the town's PRB). Two series, so there is a legend (below the chart).
 */
export function SaleScatter({ points, trend }: { points: SalePoint[]; trend: SalePoint[] }) {
  const values = points.map((p) => p.value);
  const lo = Math.min(...values) * 0.9;
  const hi = Math.max(...values) * 1.1;
  const ratios = points.map((p) => p.ratio).concat(trend.map((t) => t.ratio));
  const yTicks = percentTicks(Math.max(0, Math.min(...ratios) * 0.95), Math.max(...ratios) * 1.02);
  const yMin = yTicks[0];
  const yMax = yTicks[yTicks.length - 1];
  return (
    <div>
      <div className="h-80 sm:h-[26rem]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 12, bottom: 24, left: 0 }}>
            <CartesianGrid vertical={false} stroke={CHART.grid} />
            <XAxis
              type="number"
              dataKey="value"
              scale="log"
              domain={[lo, hi]}
              ticks={logMoneyTicks(lo, hi)}
              tickFormatter={shortDollars}
              tick={{ fill: CHART.text, fontSize: CHART_FONT.tick }}
              stroke={CHART.grid}
              allowDataOverflow
              label={{ value: "Home value (log scale)", position: "bottom", offset: 4, fill: CHART.text, fontSize: CHART_FONT.tick }}
            />
            <YAxis
              type="number"
              dataKey="ratio"
              domain={[yMin, yMax]}
              ticks={yTicks}
              tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
              tick={{ fill: CHART.text, fontSize: CHART_FONT.tick }}
              stroke={CHART.grid}
              width={44}
            />
            <Tooltip
              cursor={false}
              content={({ active, payload }) => {
                const p = payload?.[0]?.payload as SalePoint | undefined;
                if (!active || !p || payload?.[0]?.name === "PRB trend line") return null;
                return (
                  <div className="rounded-control border border-outline-200 bg-white px-3 py-2 text-sm text-ink-800 shadow-raised">
                    <p className="tabular-nums">Value {formatDollars(p.value)}</p>
                    <p className="tabular-nums">Ratio {(p.ratio * 100).toFixed(1)}%</p>
                  </div>
                );
              }}
            />
            <Scatter
              name="Sales"
              data={points}
              fill={CHART.mark}
              fillOpacity={0.6}
              stroke={CHART.surface}
              strokeWidth={1}
              isAnimationActive={false}
              shape="circle"
            />
            <Scatter
              name="PRB trend line"
              data={trend}
              line={{ stroke: CHART.reference, strokeWidth: 3 }}
              shape={() => <g />}
              isAnimationActive={false}
              legendType="none"
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-600">
        <li className="flex items-center gap-2">
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14">
            <circle cx="7" cy="7" r="5" fill={CHART.mark} fillOpacity={0.6} />
          </svg>
          One sale
        </li>
        <li className="flex items-center gap-2">
          <svg aria-hidden="true" width="24" height="14" viewBox="0 0 24 14">
            <line x1="2" y1="7" x2="22" y2="7" stroke={CHART.reference} strokeWidth="3" />
          </svg>
          PRB trend line
        </li>
      </ul>
    </div>
  );
}
