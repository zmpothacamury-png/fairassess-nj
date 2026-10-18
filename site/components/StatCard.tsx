import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { InfoButton } from "./Term";

/**
 * One headline statistic: a big number, its label, one plain-English line,
 * and an info button with a longer explanation. Numbers use tabular figures
 * so columns of stats line up. Every value shown must come from a pipeline
 * output file (CLAUDE.md rule 5); `source` names where it came from.
 */
export function StatCard({
  value,
  label,
  summary,
  explanation,
  source,
  href,
  linkLabel = "What this means",
  details,
}: {
  value: string;
  label: string;
  summary: string;
  explanation: ReactNode;
  source?: string;
  /** Optional link to the page that explains this number. */
  href?: string;
  linkLabel?: string;
  /** Optional extra lines under the label, e.g. a 95% range and a pass/outside pill. */
  details?: ReactNode;
}) {
  return (
    // While its info box is open, the card is lifted above its neighbors. Reveal gives each card its
    // own layer, so without this a later card would paint over the box.
    // Layout (Prompt 10B): the number gets its own line so long values like "−0.0980" never run into
    // the info button, which now sits with the label. The link and source are pinned to the bottom so
    // they line up across a row of cards of different lengths.
    <div className="relative flex min-w-0 flex-col rounded-card border border-outline-200 bg-white p-6 has-[[aria-expanded=true]]:z-30">
      {/* Long values step down a size instead of running out of the card (break-ui: "$16,500,000" at 4 across). */}
      <p
        className={`whitespace-nowrap font-heading leading-none font-bold tabular-nums text-navy-900 ${
          value.length <= 8 ? "text-3xl" : value.length <= 10 ? "text-2xl" : "text-xl"
        }`}
      >
        {value}
      </p>
      <div className="mt-4 flex items-start justify-between gap-2">
        <p className="pt-1 font-semibold text-navy-700">{label}</p>
        <span className="-mr-2 shrink-0">
          <InfoButton label={label}>{explanation}</InfoButton>
        </span>
      </div>
      {details && <div className="mt-2 flex flex-col items-start gap-2 text-sm text-ink-600">{details}</div>}
      <p className="mt-3 text-base text-ink-600">{summary}</p>
      {(href || source) && (
        <div className="mt-auto pt-4">
          {href && (
            <Link
              href={href}
              className="focus-ring group inline-flex min-h-12 items-center gap-1 text-sm font-semibold text-blue-600 underline underline-offset-4 hover:text-navy-700"
            >
              {linkLabel}
              <span className="sr-only">: {label}</span>
              <ArrowRight
                aria-hidden="true"
                className="h-4 w-4 transition-transform duration-[var(--duration-press)] ease-[var(--ease-out)] motion-safe:group-hover:translate-x-0.5"
                strokeWidth={2}
              />
            </Link>
          )}
          {source && <p className="mt-2 border-t border-outline-200 pt-3 text-sm text-ink-600">Source: {source}</p>}
        </div>
      )}
    </div>
  );
}
