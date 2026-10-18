"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
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
import { useNarrow } from "@/lib/useNarrow";

export type ForestPoint = {
  slug: string;
  name: string;
  rank: number;
  label: string;
  prb: number;
  low: number;
  high: number;
  n: number;
  limited: boolean;
};

const ROW = 24; // px per town

const AXIS = 56; // px for the x-axis band and top margin

function describe(p: ForestPoint): string {
  return `${p.name}: PRB ${signed4(p.prb)}, 95% range ${signed4(p.low)} to ${signed4(p.high)}, ${p.n} sales, ${p.label}${p.limited ? ", limited data" : ""}.`;
}

/**
 * The chart itself. It does not depend on which town is selected, so showing
 * details never re-draws it (a re-draw would replace the focused dot and drop
 * keyboard focus). The highlight ring comes from CSS hover/focus instead.
 */
function ForestChart({
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
    <div className="mt-2" style={{ height: points.length * ROW + AXIS }}>
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

/**
 * Forest plot: every ranked town as a dot (its PRB) with a line for its 95%
 * range, sorted by PRB with rank 1 at the top (methodology 5.4). The gold
 * band is the IAAO range, -0.05 to +0.05. Dots left of the band lean
 * regressive.
 *
 * Each dot is a link to the town page, so every point can be reached with
 * Tab, and its link name reads out the same details. Hover, keyboard focus,
 * or a first tap also shows them in the box above the chart; a second tap (or
 * a click) opens the town page.
 */
export function ForestPlot({ points }: { points: ForestPoint[] }) {
  const [active, setActive] = useState<string | null>(null);
  const activeRef = useRef<string | null>(null);
  const onShow = useCallback((slug: string) => {
    activeRef.current = slug;
    setActive(slug);
  }, []);
  const isShown = useCallback((slug: string) => activeRef.current === slug, []);
  const narrow = useNarrow();
  // Built once per data set, so selecting a town never re-draws the chart.
  const chart = useMemo(
    () => <ForestChart points={points} onShow={onShow} isShown={isShown} narrow={narrow} />,
    [points, onShow, isShown, narrow],
  );
  const current = points.find((p) => p.slug === active) ?? null;

  return (
    <div>
      <div className="flex min-h-24 flex-col justify-center rounded-control border border-outline-200 bg-mist-50 px-4 py-2 text-base text-ink-800">
        {current ? (
          <>
            <p>
              <strong className="font-semibold text-navy-900">
                #{current.rank} {current.name}
              </strong>{" "}
              &middot; {current.label}
              {current.limited ? " · Limited data" : ""}
            </p>
            <p className="tabular-nums">
              PRB {signed4(current.prb)} (95% range {signed4(current.low)} to {signed4(current.high)}) &middot;{" "}
              {current.n} sales
            </p>
            <Link
              href={`/towns/${current.slug}`}
              className="focus-ring inline-flex items-center gap-1 self-start text-sm font-semibold text-blue-600 underline underline-offset-4"
            >
              Open the {current.name} page
              <ArrowRight aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
            </Link>
          </>
        ) : (
          <p className="text-ink-600">Point to a dot, tap it, or press Tab to move through the towns.</p>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-ink-600">
        <p>&larr; Regressive side: cheaper homes assessed at a higher share of their value</p>
        <p className="text-right">Progressive side: pricier homes assessed at a higher share &rarr;</p>
      </div>

      {chart}

      <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-600">
        <li className="flex items-center gap-2">
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14">
            <circle cx="7" cy="7" r="5" fill={CHART.mark} stroke={CHART.mark} strokeWidth="2" />
          </svg>
          Town (40 or more sales)
        </li>
        <li className="flex items-center gap-2">
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14">
            <circle cx="7" cy="7" r="5" fill={CHART.surface} stroke={CHART.mark} strokeWidth="2" />
          </svg>
          Limited data (20 to 39 sales)
        </li>
        <li className="flex items-center gap-2">
          <svg aria-hidden="true" width="24" height="14" viewBox="0 0 24 14">
            <line x1="2" y1="7" x2="22" y2="7" stroke={CHART.context} strokeWidth="1.5" />
          </svg>
          95% range
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="inline-block h-3.5 w-6 bg-gold-400/30" />
          IAAO range, &minus;0.05 to +0.05
        </li>
      </ul>
    </div>
  );
}
