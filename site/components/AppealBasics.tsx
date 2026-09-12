import { CalendarIcon, ReceiptIcon } from "./icons";

/**
 * Deadline and fee facts. Shown wherever the page talks about appealing,
 * per CLAUDE.md rule 4.
 *
 * Sources (checked 2026-09-11):
 * - Deadline: NJ Division of Taxation, "A Guide to Tax Appeal Hearings"
 *   (nj.gov/treasury/taxation) and nj.gov/treasury/taxation/lpt/lpt-appeal.shtml.
 * - Filing fee tiers: N.J.A.C. 18:12A-1.6, as summarized by county tax
 *   boards and NJ property-tax-appeal law firms.
 * These are state rules and change rarely, but always confirm with your
 * county board before filing — some counties add local steps or forms.
 */
export function AppealBasics({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex flex-col gap-4 border border-slate/20 bg-paper/60 px-4 py-3 text-sm text-slate sm:flex-row sm:items-start sm:gap-6 ${className}`}
    >
      <div className="flex gap-2.5">
        <CalendarIcon className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
        <p>
          <strong className="block text-ink">Deadline: April 1</strong>
          May 1 the year after a revaluation or reassessment. Burlington,
          Gloucester, and Monmouth counties use January 15 instead.
        </p>
      </div>
      <div className="flex gap-2.5">
        <ReceiptIcon className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
        <p>
          <strong className="block text-ink">
            Filing fee: $5&ndash;$150
          </strong>
          Set by your assessed value: $5 under $150,000; $25 up to
          $500,000; $100 up to $1,000,000; $150 above that.
        </p>
      </div>
      <p className="text-xs text-slate/80 sm:max-w-[22ch]">
        Always check your county tax board for your town&rsquo;s exact
        deadline, fee, and forms before filing.
      </p>
    </div>
  );
}
