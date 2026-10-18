import { CalendarDays, Receipt } from "lucide-react";
import { FILING_FEES } from "@/lib/towns";
import { SOURCES } from "@/lib/sources";

const LINK = "focus-ring font-semibold text-blue-600 underline underline-offset-4 hover:text-navy-700";

/**
 * Deadline and fee facts for Bergen County appeals. Shown wherever the page
 * talks about appealing (CLAUDE.md rule 7).
 *
 * Source: NJ Form A-1 instructions 1 and 4, quoted in
 * data/raw/notes/appeal-deadlines-and-fees.md (methodology K13). Town pages
 * show the town's own deadline (lib/towns.ts appealDeadline).
 */
export function AppealBasics({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex flex-col gap-4 rounded-card border border-outline-200 bg-white px-6 py-4 text-base text-ink-600 lg:flex-row lg:items-start lg:gap-6 ${className}`}
    >
      <div className="flex gap-2 lg:flex-1">
        <CalendarDays aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-gold-700" strokeWidth={2} />
        <p>
          <strong className="block text-navy-900">The deadline is April 1</strong>
          Or 45 days after your town finishes mailing assessment notices, if that is later. In a town with a town-wide
          revaluation or reassessment that year, it is May 1. The County Board must receive your appeal by then; a
          postmark is not enough. A weekend or holiday deadline moves to the next business day.
        </p>
      </div>
      <div className="flex gap-2 lg:flex-1">
        <Receipt aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-gold-700" strokeWidth={2} />
        <div>
          <strong className="block text-navy-900">The filing fee is $5 to $150</strong>
          <p>Your assessed value sets the fee:</p>
          <ul className="mt-1 tabular-nums">
            {FILING_FEES.map((f) => (
              <li key={f.range}>
                {f.range}: <span className="font-semibold text-navy-900">{f.fee}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="text-sm text-ink-600 lg:max-w-[24ch]">
        Source:{" "}
        <a href={SOURCES.form_a1.url} className={LINK} rel="noopener noreferrer">
          NJ Form A-1
        </a>
        . Confirm deadlines, fees, and forms with the{" "}
        <a href={SOURCES.bergen_board.url} className={LINK} rel="noopener noreferrer">
          Bergen County Board of Taxation
        </a>
        .
      </p>
    </div>
  );
}
