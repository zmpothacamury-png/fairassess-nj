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
}: {
  value: string;
  label: string;
  summary: string;
  explanation: ReactNode;
  source?: string;
}) {
  return (
    <div className="flex flex-col rounded-card border border-outline-200 bg-white p-6 shadow-soft">
      <div className="flex items-start justify-between gap-2">
        <p className="font-heading text-3xl font-bold tabular-nums text-navy-900">{value}</p>
        <InfoButton label={label}>{explanation}</InfoButton>
      </div>
      <p className="mt-2 font-semibold text-navy-700">{label}</p>
      <p className="mt-2 text-base text-ink-600">{summary}</p>
      {source && <p className="mt-4 border-t border-outline-200 pt-2 text-sm text-ink-600">Source: {source}</p>}
    </div>
  );
}
