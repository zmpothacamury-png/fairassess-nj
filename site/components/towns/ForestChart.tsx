"use client";

import { useRef } from "react";
import {
  CartesianGrid,
  ErrorBar,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
} from "recharts";
import { CHART, CHART_FONT, prbDomain } from "@/lib/chart";
import { signed4 } from "@/lib/towns";
import type { ForestPoint } from "./ForestPlot";

function describe(p: ForestPoint): string {
  return `${p.name}: PRB ${signed4(p.prb)}, 95% range ${signed4(p.low)} to ${signed4(p.high)}, ${p.n} sales, ${p.label}${p.limited ? ", limited data" : ""}.`;
}

/**
 * The chart itself. It does not depend on which town is selected, so showing
 * details never re-draws it (a re-draw would replace the focused dot and drop
 * keyboard focus). The highlight ring comes from CSS hover/focus instead.
 * Its own file so the town rankings page can load Recharts after it shows
 * (ForestPlot.tsx). It fills the fixed-height box ForestPlot draws.
 */
export function ForestChart({
  points,
  onShow,
  isShown,
  narrow,
}: {
  points: ForestPoint[];
  narrow: boolean;
  onShow: (slug: string) => void;
  /** Reads the selected town at click time (a ref, so the chart never re-draws). */
  isShown: (slug: string) => boolean;
}) {
  const lastPointer = useRef<string>("mouse");
  const data = points.map((p) => ({ ...p, err: [p.prb - p.low, p.high - p.prb] }));
  const domain = prbDomain(
    points.map((p) => p.low),
    points.map((p) => p.high),
  );
  const ticks: number[] = [];
  for (let t = domain[0]; t <= domain[1] + 1e-9; t += 0.05) ticks.push(Number(t.toFixed(2)));

  return (
    <div className="h-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 24, right: 12, bottom: 24, left: 0 }} accessibilityLayer={false}>
          <CartesianGrid horizontal={false} stroke={CHART.grid} />
          <ReferenceArea
            x1={-0.05}
            x2={0.05}
            fill={CHART.reference}
            fillOpacity={0.3}
            stroke="none"
            label={{ value: "IAAO range", position: "top", fill: CHART.strongText, fontSize: CHART_FONT.tick }}
          />
          <ReferenceLine x={0} stroke={CHART.context} strokeWidth={1} />
          <XAxis
            type="number"
            dataKey="prb"
            domain={domain}
            ticks={ticks}
            tickFormatter={(v: number) => (v === 0 ? "0" : v.toFixed(2).replace("-", "−"))}
            tick={{ fill: CHART.text, fontSize: CHART_FONT.tick }}
            stroke={CHART.grid}
            label={{ value: "PRB (price-related bias)", position: "bottom", offset: 4, fill: CHART.text, fontSize: CHART_FONT.tick }}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={narrow ? 124 : 164}
            interval={0}
            reversed
            tick={{ fill: CHART.strongText, fontSize: narrow ? CHART_FONT.narrow : CHART_FONT.tick }}
            stroke={CHART.grid}
            tickLine={false}
          />
          <Scatter
            data={data}
            isAnimationActive={false}
            shape={(props: { cx?: number; cy?: number; payload?: ForestPoint }) => {
              const { cx = 0, cy = 0, payload } = props;
              if (!payload) return <g />;
              return (
                <a
                  href={`/towns/${payload.slug}`}
                  aria-label={`${describe(payload)} Open the town page.`}
                  className="group focus-ring"
                  onMouseEnter={() => onShow(payload.slug)}
                  onFocus={() => onShow(payload.slug)}
                  onPointerDown={(e) => {
                    lastPointer.current = e.pointerType;
                  }}
                  onClick={(e) => {
                    // On a touch screen the first tap shows the details; the second opens the page.
                    if (lastPointer.current === "touch" && !isShown(payload.slug)) {
                      e.preventDefault();
                      onShow(payload.slug);
                    }
                  }}
                >
                  {/* Larger invisible target so the dot is easy to hit (about 24px). */}
                  <circle cx={cx} cy={cy} r={12} fill="transparent" />
                  <circle
                    cx={cx}
                    cy={cy}
                    r={9}
                    fill="none"
                    stroke={CHART.focus}
                    strokeWidth={2}
                    className="opacity-0 group-hover:opacity-100 group-focus:opacity-100"
                  />
                  <circle
                    cx={cx}
                    cy={cy}
                    r={5}
                    fill={payload.limited ? CHART.surface : CHART.mark}
                    stroke={CHART.mark}
                    strokeWidth={2}
                  />
                </a>
              );
            }}
          >
            <ErrorBar dataKey="err" direction="x" width={6} stroke={CHART.context} strokeWidth={1.5} />
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
