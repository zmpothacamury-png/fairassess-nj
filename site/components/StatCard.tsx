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
}: {
  value: string;
  label: string;
  summary: string;
  explanation: ReactNode;
  source?: string;
  /** Optional link to the page that explains this number. */
  href?: string;
  linkLabel?: string;
}) {
  return (
    // While its info box is open, the card is lifted above its neighbors. Reveal gives each card its
    // own layer, so without this a later card would paint over the box.
    <div className="relative flex flex-col rounded-card border border-outline-200 bg-white p-6 shadow-soft has-[[aria-expanded=true]]:z-30">
      <div className="flex items-start justify-between gap-2">
        <p className="font-heading text-3xl font-bold tabular-nums text-navy-900">{value}</p>
        <InfoButton label={label}>{explanation}</InfoButton>
      </div>
      <p className="mt-2 font-semibold text-navy-700">{label}</p>
      <p className="mt-2 text-base text-ink-600">{summary}</p>
      {href && (
        <Link
          href={href}
          className="focus-ring mt-4 inline-flex min-h-12 items-center gap-1 self-start text-sm font-semibold text-blue-600 underline underline-offset-4 hover:text-navy-700"
        >
          {linkLabel}
          <span className="sr-only">: {label}</span>
          <ArrowRight aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
        </Link>
      )}
      {source && <p className="mt-4 border-t border-outline-200 pt-2 text-sm text-ink-600">Source: {source}</p>}
    </div>
  );
}
