import { formatCount } from "@/lib/home";

export type FunnelStep = { ruleId: string; label: string; reason: string; rowsIn: number; removed: number; rowsOut: number };

/**
 * "From raw sales to clean data": one row per cleaning rule, in the order the
 * rules run. The blue bar is the sales still in after the rule; the pale
 * segment after it is what the rule removed. Bars share one scale (the
 * starting count), so the drop is visible. Numbers are written on every row,
 * so the bars are never the only signal. Plain HTML, no chart library.
 */
export function FilterFunnel({ start, steps }: { start: number; steps: FunnelStep[] }) {
  const w = (n: number) => `${(100 * n) / start}%`;
  return (
    <ol className="flex flex-col gap-4" aria-label="Sales left after each cleaning rule">
      <li className="grid gap-1">
        <p className="flex flex-wrap items-baseline justify-between gap-x-4 text-base">
          <span className="font-semibold text-navy-900">All Bergen rows in the file</span>
          <span className="font-semibold tabular-nums text-navy-900">{formatCount(start)}</span>
        </p>
        <div aria-hidden="true" className="h-3 rounded-full bg-blue-600" />
      </li>
      {steps.map((s) => (
        <li key={s.ruleId} className="grid gap-1">
          <p className="flex flex-wrap items-baseline justify-between gap-x-4 text-base">
            <span className="min-w-0 text-navy-900">
              <span className="font-semibold">{s.label}</span>{" "}
              <span className="text-sm text-ink-600">(rule {s.ruleId})</span>
            </span>
            <span className="whitespace-nowrap tabular-nums text-ink-800">
              {s.removed === 0 ? "none removed" : `−${formatCount(s.removed)}`}
              <span className="mx-2 text-outline-200" aria-hidden="true">
                |
              </span>
              <span className="font-semibold text-navy-900">{formatCount(s.rowsOut)} left</span>
            </span>
          </p>
          <div aria-hidden="true" className="flex h-3 overflow-hidden rounded-full bg-mist-50">
            <span className="h-full bg-blue-600" style={{ width: w(s.rowsOut) }} />
            {s.removed > 0 && (
              <span className="h-full border-l-2 border-white bg-sky-400/40" style={{ width: w(s.removed) }} />
            )}
          </div>
          <p className="max-w-prose text-sm text-ink-600">{s.reason}</p>
        </li>
      ))}
    </ol>
  );
}
