"use client";

import dynamic from "next/dynamic";

/**
 * The town page's two Recharts charts, loaded after the page shows (Prompt 14).
 * Recharts only draws in the browser anyway (it needs the chart's width), so
 * nothing is lost by skipping the server. Each placeholder is the chart's
 * exact height (plus the one-line legend under it), so the page doesn't jump.
 * The data tables under each chart are server-rendered and always there.
 */
export const TierChart = dynamic(() => import("./TierChart").then((m) => m.TierChart), {
  ssr: false,
  loading: () => (
    <div aria-hidden="true">
      <div className="h-80 rounded-control bg-gray-100 sm:h-96" />
      <div className="mt-2 h-5" />
    </div>
  ),
});

export const SaleScatter = dynamic(() => import("./SaleScatter").then((m) => m.SaleScatter), {
  ssr: false,
  loading: () => (
    <div aria-hidden="true">
      <div className="h-80 rounded-control bg-gray-100 sm:h-[26rem]" />
      <div className="mt-2 h-5" />
    </div>
  ),
});
