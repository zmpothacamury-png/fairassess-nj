"use client";

import { Bar, BarChart, CartesianGrid, LabelList, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { CHART, CHART_FONT, percentTicks } from "@/lib/chart";
import { useNarrow } from "@/lib/useNarrow";

/** `shortName` is used on phones, where 4 full labels do not fit (the ranges are then in the table only). */
export type TierBar = { tier: number; name: string; shortName: string; range: string; ratio: number };

/**
 * Chart A: the median assessment ratio in each value quarter (rule T3), as 4
 * bars, with the town's overall median as a gold line. The line also has a
 * text label, because gold on white is too light to be read alone.
 */
export function TierChart({ bars, median }: { bars: TierBar[]; median: number }) {
  const top = Math.max(median, ...bars.map((b) => b.ratio));
  const ticks = percentTicks(0, top * 1.1);
  const yMax = ticks[ticks.length - 1];
  const narrow = useNarrow();
  return (
    <div>
      <div className="h-80 sm:h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bars} margin={{ top: 28, right: 8, bottom: 8, left: 0 }}>
            <CartesianGrid vertical={false} stroke={CHART.grid} />
            <XAxis
              dataKey="name"
              interval={0}
              height={narrow ? 28 : 48}
              stroke={CHART.grid}
              tickLine={false}
              tick={({ x, y, payload, index }) => (
                // Two lines: the quarter's name, then its home value range.
                <g transform={`translate(${Number(x)},${Number(y)})`}>
                  <text textAnchor="middle" dy={16} fill={CHART.strongText} fontSize={narrow ? CHART_FONT.narrow : CHART_FONT.tick} fontWeight={600}>
                    {narrow ? bars[index ?? 0]?.shortName : String(payload?.value ?? "")}
                  </text>
                  {!narrow && (
                    <text textAnchor="middle" dy={32} fill={CHART.text} fontSize={CHART_FONT.narrow}>
                      {bars[index ?? 0]?.range}
                    </text>
                  )}
                </g>
              )}
            />
            <YAxis
              domain={[0, yMax]}
              ticks={ticks}
              tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
              tick={{ fill: CHART.text, fontSize: CHART_FONT.tick }}
              stroke={CHART.grid}
              width={44}
            />
            <Bar dataKey="ratio" fill={CHART.mark} maxBarSize={56} radius={[4, 4, 0, 0]} isAnimationActive={false}>
              <LabelList
                dataKey="ratio"
                position="insideBottom"
                offset={12}
                formatter={(v: unknown) => `${((v as number) * 100).toFixed(1)}%`}
                fill={CHART.surface}
                fontSize={CHART_FONT.tick}
                fontWeight={600}
              />
            </Bar>
            <ReferenceLine
              y={median}
              stroke={CHART.reference}
              strokeWidth={3}
              strokeDasharray="8 5"
              ifOverflow="extendDomain"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* The line's label lives here, so it never collides with a bar. */}
      <p className="mt-2 flex items-center gap-2 text-sm text-ink-600">
        <svg aria-hidden="true" width="28" height="14" viewBox="0 0 28 14">
          <line x1="2" y1="7" x2="26" y2="7" stroke={CHART.reference} strokeWidth="3" strokeDasharray="8 5" />
        </svg>
        Town median: <span className="font-semibold tabular-nums text-navy-900">{(median * 100).toFixed(1)}%</span>
      </p>
    </div>
  );
}
