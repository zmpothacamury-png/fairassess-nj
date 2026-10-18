"use client";

import { Table2 } from "lucide-react";
import { useId, useState } from "react";
import type { ReactNode } from "react";

/**
 * A chart with its title, a caption that says what it shows, a source line,
 * and a "View as table" button (CLAUDE.md rule 11: every chart has a table
 * alternative). The table is always in the HTML, so search engines and
 * screen readers can reach it; the button only shows or hides it.
 */
export function ChartFrame({
  title,
  caption,
  source,
  table,
  children,
  headingLevel = "h3",
}: {
  title: string;
  caption: ReactNode;
  source: ReactNode;
  table: ReactNode;
  children: ReactNode;
  headingLevel?: "h2" | "h3";
}) {
  const [showTable, setShowTable] = useState(false);
  const tableId = useId();
  const Heading = headingLevel;
  return (
    <figure className="rounded-card border border-outline-200 bg-white p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <Heading className="font-heading text-lg font-bold text-navy-900">{title}</Heading>
        <button
          type="button"
          aria-expanded={showTable}
          aria-controls={tableId}
          onClick={() => setShowTable(!showTable)}
          className="focus-ring pressable inline-flex min-h-12 items-center gap-2 rounded-control px-3 text-sm font-semibold text-blue-600 hover:bg-blue-100 hover:text-navy-700 aria-expanded:bg-blue-100"
        >
          <Table2 aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
          {showTable ? "Hide table" : "View as table"}
        </button>
      </div>
      <figcaption className="mt-2 max-w-prose text-base text-ink-600">{caption}</figcaption>
      <div className="mt-6">{children}</div>
      <div id={tableId} hidden={!showTable} className="mt-6">
        {table}
      </div>
      <p className="mt-4 border-t border-outline-200 pt-2 text-sm text-ink-600">{source}</p>
    </figure>
  );
}
