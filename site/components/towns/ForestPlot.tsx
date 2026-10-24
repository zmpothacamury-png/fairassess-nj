"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useMemo, useRef, useState } from "react";
import { CHART } from "@/lib/chart";
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

// Recharts loads after the page shows. The box around it keeps the
// chart's exact height, so nothing below it moves. The table under the chart
// (ChartFrame) has every number without waiting.
const ForestChart = dynamic(() => import("./ForestChart").then((m) => m.ForestChart), {
  ssr: false,
  loading: () => <div aria-hidden="true" className="h-full rounded-control bg-gray-100" />,
});


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
      <div className="flex min-h-24 flex-col justify-center rounded-control bg-mist-50 px-4 py-2 text-base text-ink-800">
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

      <div className="mt-2" style={{ height: points.length * ROW + AXIS }}>
        {chart}
      </div>

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
