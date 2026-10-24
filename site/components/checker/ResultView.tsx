"use client";

import { ArrowRight, ChevronDown, Lock, Printer, RotateCcw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { forwardRef, useId, useState, type ReactNode } from "react";
import { Button } from "@/components/Button";
import { Callout } from "@/components/Callout";
import { DataTable } from "@/components/DataTable";
import { Disclaimer } from "@/components/Disclaimer";
import { StatusPill } from "@/components/StatusPill";
import { Term } from "@/components/Term";
import type { CheckerResult, CheckerTown } from "@/lib/checker";
import { MIN_COMPS } from "@/lib/checker/config";
import { formatCount, formatDollars, formatMonthYear } from "@/lib/home";
import { SOURCES, type SourceKey } from "@/lib/sources";
import { weekendDeadlineNote } from "@/lib/towns";
import { BalanceMeter } from "./BalanceMeter";
import { POSITION_VERDICT, VERDICTS, WARNING_TITLES, pct2, ratioRange, strengthLine, verdictReason } from "./copy";

const LINK = "focus-ring font-semibold text-blue-600 underline underline-offset-4 hover:text-navy-700";

/** A link to one outside source, by key (lib/sources.ts). */
function Source({ k, children }: { k: SourceKey; children?: ReactNode }) {
  return (
    <a href={SOURCES[k].url} className={LINK} rel="noopener noreferrer">
      {children ?? SOURCES[k].label}
    </a>
  );
}

/** A small label over a big number (design system "Figures"). */
function Figure({ label, value, note, small = false }: { label: ReactNode; value: ReactNode; note?: ReactNode; small?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-sm text-ink-600">{label}</dt>
      <dd className={`mt-1 font-heading font-bold tabular-nums text-navy-900 ${small ? "text-xl" : "text-2xl"}`}>{value}</dd>
      {note && <dd className="mt-1 text-sm text-ink-600">{note}</dd>}
    </div>
  );
}

/** What the homeowner typed, kept with the result so a printout matches the result it shows. */
export type CheckedInputs = { townName: string; assessedValue: number; ownEstimate: number | null; checkedOn: string };

/**
 * The checker result. It only shows what runChecker returned; it
 * never re-does any math. It appears at once: nothing here fades or slides in
 * (site-format: never animate a checker result). Only the small scale icon in
 * the balance meter tilts, and only if the visitor allows motion.
 */
export const ResultView = forwardRef<
  HTMLHeadingElement,
  {
    result: CheckerResult;
    town: Pick<CheckerTown, "ch123" | "name" | "slug">;
    inputs: CheckedInputs;
    stale?: boolean;
    onAddEstimate?: () => void;
    onReset: () => void;
  }
>(function ResultView({ result: r, town, inputs, stale = false, onAddEstimate, onReset }, headingRef) {
  const copy = VERDICTS[r.verdict];
  const strength = strengthLine(r);
  const ratios = ratioRange(r);
  const c = r.chapter123;
  const ownTest = r.ownEstimate?.test ?? null;
  const showMeter = c !== null || ownTest !== null;
  const reval = r.verdict === "revaluation-no-test";

  return (
    <div className="flex flex-col gap-8">
      <PrintHeader inputs={inputs} />

      {stale && (
        <Callout tone="info" title="You changed your answers" className="print:hidden">
          <p>This result is for the answers you checked before. Select &ldquo;Check my assessment&rdquo; to update it.</p>
        </Callout>
      )}

      {/* 1. Verdict */}
      <div className="split-accent overflow-hidden rounded-card border border-outline-200 bg-white p-6 sm:p-8">
        {/* Focus lands here when the result appears, so a screen reader reads the town and the verdict. */}
        <h2 ref={headingRef} tabIndex={-1} className="focus-ring scroll-mt-28 rounded-control outline-none">
          <span className="eyebrow block text-blue-600">Your result for {r.town.name}</span>
          <span className="mt-4 block font-heading text-2xl font-bold text-navy-900">{copy.headline}</span>
        </h2>
        <div className="mt-4">
          <StatusPill status={copy.status}>{copy.pill}</StatusPill>
        </div>
        {strength && <p className="mt-2 text-lg font-semibold text-navy-900">{strength}</p>}
        <p className="mt-3 max-w-prose text-base text-ink-800">{verdictReason(r)}</p>

        {r.ownEstimate && (
          <dl className="mt-6 grid gap-4 border-t border-outline-200 pt-6 sm:grid-cols-2 sm:gap-8">
            <div>
              <dt className="text-sm text-ink-600">Using our estimate from recent sales</dt>
              <dd className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
                <StatusPill status={copy.status}>{copy.pill}</StatusPill>
                {c && <span className="tabular-nums text-ink-800">Ratio {pct2(c.homeownerRatio)}</span>}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-ink-600">
                Using your estimate of <span className="tabular-nums">{formatDollars(r.ownEstimate.value)}</span>
              </dt>
              <dd className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
                {ownTest ? (
                  <>
                    <StatusPill status={VERDICTS[POSITION_VERDICT[ownTest.position]].status}>
                      {VERDICTS[POSITION_VERDICT[ownTest.position]].pill}
                    </StatusPill>
                    <span className="tabular-nums text-ink-800">Ratio {pct2(ownTest.homeownerRatio)}</span>
                  </>
                ) : (
                  <StatusPill status="neutral">{VERDICTS["revaluation-no-test"].pill}</StatusPill>
                )}
              </dd>
            </div>
            {ownTest?.position === "above" && r.verdict !== "may-have-grounds" && (
              <p className="text-base text-ink-800 sm:col-span-2">
                With your estimate, your ratio is above the range we test ({pct2(ownTest.upperTrigger)}). An appeal needs
                proof of that value, such as an appraisal or sales of similar homes. We don&rsquo;t estimate savings
                from your own estimate.
              </p>
            )}
          </dl>
        )}

        <p className="mt-6 text-sm text-ink-600">
          Sources: <Source k="ch123_2027" />; <Source k="ch123_definitions" />; our analysis of{" "}
          <Source k="sr1a">NJ SR1A sales</Source>.
        </p>
      </div>

      {r.suggestOwnEstimate && r.verdict !== "not-enough-data" && onAddEstimate && (
        <Callout tone="info" title="Have an appraisal or a recent purchase price?" className="print:hidden">
          <p>
            Our estimate matches you with homes assessed like yours, so it rarely finds grounds on its own. You know your
            home better than we do. Add your own estimate of its market value to test that too.
          </p>
          <Button variant="secondary" className="mt-4" onClick={onAddEstimate}>
            Add my own estimate
          </Button>
        </Callout>
      )}

      {/* 2. Balance meter */}
      {showMeter && (
        <div className="rounded-card border border-outline-200 bg-white p-6 sm:p-8">
          <BalanceMeter
            townName={r.town.name}
            range={{
              lowerLimit: town.ch123.lower_limit,
              upperLimit: town.ch123.upper_limit,
              averageRatio: town.ch123.average_ratio,
              lowerTrigger: (c ?? ownTest)!.lowerTrigger,
              upperTrigger: (c ?? ownTest)!.upperTrigger,
            }}
            ours={c && ratios ? { mid: c.homeownerRatio, low: ratios.low, high: ratios.high, label: "Our estimate" } : null}
            own={ownTest ? { mid: ownTest.homeownerRatio, label: "Your estimate" } : null}
            position={c?.position ?? ownTest?.position ?? null}
          />
        </div>
      )}

      {/* 3. Key numbers */}
      <section aria-labelledby="key-numbers" className="rounded-card border border-outline-200 bg-white p-6 sm:p-8">
        <h3 id="key-numbers" className="font-heading text-xl font-bold text-navy-900">
          Key numbers
        </h3>
        <dl className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          <Figure label="Your assessed value" value={formatDollars(r.assessedValue)} />
          {r.estimate && (
            <Figure
              label="Estimated market value (estimate)"
              value={formatDollars(r.estimate.marketValueMid)}
              note={
                <>
                  Likely range <span className="tabular-nums">{formatDollars(r.estimate.marketValueLow)}</span> to{" "}
                  <span className="tabular-nums">{formatDollars(r.estimate.marketValueHigh)}</span>, as of October 1, 2026
                </>
              }
            />
          )}
          {c && (
            <Figure
              label={
                <>
                  Your{" "}
                  <Term definition="Your assessed value divided by your home's market value. It is the share of your home's value that the town taxes.">
                    assessment ratio
                  </Term>
                </>
              }
              value={pct2(c.homeownerRatio)}
              note="Assessed value divided by our middle estimate"
            />
          )}
          {!reval && (
            <Figure
              small
              label={
                <>
                  {r.town.name}&rsquo;s{" "}
                  <Term definition="15% above and below the town's average ratio for 2027, set by the state under Chapter 123. If a home's assessment ratio is outside this range, the County Board corrects the assessment.">
                    common level range
                  </Term>
                </>
              }
              value={
                <span className="whitespace-nowrap">
                  {pct2(town.ch123.lower_limit)} to {pct2(town.ch123.upper_limit)}
                </span>
              }
              note={<>Average ratio {pct2(town.ch123.average_ratio)}, tax year 2027</>}
            />
          )}
          {r.savings && (
            <>
              <Figure
                label="Estimated corrected assessment (estimate)"
                value={formatDollars(r.savings.correctedAssessment)}
                note="If the Board agreed with our middle estimate"
              />
              <Figure
                label="Estimated yearly savings (estimate)"
                value={formatDollars(r.savings.yearlySavings)}
                note={
                  <>
                    Uses the {r.savings.taxRateYear} tax rate (${r.savings.generalTaxRate} per $100). The 2027 rate will
                    be different.
                  </>
                }
              />
            </>
          )}
        </dl>
        {r.savings && (
          <p className="mt-6 text-sm text-ink-600">
            Source: <Source k="tax_rates_2025" />.
          </p>
        )}
      </section>

      {/* 4. Warnings */}
      {r.warnings.length > 0 && (
        <div className="flex flex-col gap-4">
          {r.warnings.map((w) => (
            <Callout key={w.code} tone={WARNING_TITLES[w.code].tone} title={WARNING_TITLES[w.code].title}>
              <p>{w.message}</p>
              {w.code === "revaluation-this-year" && (
                <p className="mt-2 text-sm text-ink-600">
                  Sources: <Source k="ch123_definitions" />; <Source k="bergen_revaluations" />.
                </p>
              )}
            </Callout>
          ))}
        </div>
      )}

      {r.verdict === "not-enough-data" && <NotEnoughData result={r} onAddEstimate={onAddEstimate} />}

      {/* 5. Show the math */}
      <ShowTheMath steps={r.steps} />

      {/* 6. Comps */}
      {r.comps.used.length > 0 && <CompsTable result={r} />}

      {/* 7. Next steps */}
      <NextSteps result={r} />

      {/* 8. Buttons */}
      <div className="flex flex-wrap gap-4 print:hidden">
        <Button variant="secondary" onClick={() => window.print()}>
          <Printer aria-hidden="true" className="h-5 w-5" strokeWidth={2} />
          Print or save this result
        </Button>
        <Button onClick={onReset}>
          <RotateCcw aria-hidden="true" className="h-5 w-5" strokeWidth={2} />
          Check another home
        </Button>
      </div>
      <p className="flex items-center gap-2 text-sm text-ink-600 print:hidden">
        <Lock aria-hidden="true" className="h-4 w-4 shrink-0 text-ink-600" strokeWidth={2} />
        Printing happens on your device. Nothing is saved.
      </p>

      {/* 9. Disclaimer, right under the result (disclaimer rule). */}
      <Disclaimer className="border-t border-outline-200 pt-6" />
    </div>
  );
});

/** Only on paper: the logo, the inputs, and the date (print stylesheet). */
function PrintHeader({ inputs }: { inputs: CheckedInputs }) {
  return (
    <div className="hidden print:block">
      <div className="flex items-center gap-3 border-b border-outline-200 pb-4">
        <Image src="/logo-icon.png" alt="" width={394} height={698} className="h-14 w-auto" />
        <div>
          <p className="font-heading text-lg font-extrabold tracking-wide text-navy-700">FAIR ASSESS NJ</p>
          <p className="text-sm text-ink-600">Appeal checker result, printed {inputs.checkedOn}</p>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-4 text-base">
        <div>
          <dt className="text-sm text-ink-600">Town</dt>
          <dd className="font-semibold text-navy-900">{inputs.townName}</dd>
        </div>
        <div>
          <dt className="text-sm text-ink-600">Assessed value</dt>
          <dd className="font-semibold tabular-nums text-navy-900">{formatDollars(inputs.assessedValue)}</dd>
        </div>
        <div>
          <dt className="text-sm text-ink-600">Your own estimate</dt>
          <dd className="font-semibold tabular-nums text-navy-900">
            {inputs.ownEstimate === null ? "None entered" : formatDollars(inputs.ownEstimate)}
          </dd>
        </div>
      </dl>
    </div>
  );
}

/** "Show the math": the engine's plain-English steps. Opens instantly; always open on paper. */
function ShowTheMath({ steps }: { steps: string[] }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <section className="rounded-card border border-outline-200 bg-white">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen(!open)}
          className="focus-ring flex min-h-14 w-full items-center justify-between gap-4 rounded-card px-6 py-4 text-left font-heading text-xl font-bold text-navy-900 transition-colors duration-[var(--duration-press)] hover:text-blue-600 sm:px-8"
        >
          Show the math
          <ChevronDown
            aria-hidden="true"
            className={`h-6 w-6 shrink-0 text-blue-600 transition-transform duration-[var(--duration-pop)] ease-[var(--ease-out)] motion-reduce:transition-none print:hidden ${open ? "rotate-180" : ""}`}
            strokeWidth={2}
          />
        </button>
      </h3>
      <div id={id} className={`${open ? "" : "hidden"} border-t border-outline-200 px-6 pb-6 pt-4 sm:px-8 print:block`}>
        <ol className="flex max-w-prose list-decimal flex-col gap-3 pl-6 text-base text-ink-800 marker:font-semibold marker:text-blue-600">
          {steps.map((s, i) => (
            <li key={i} className="tabular-nums">
              {s}
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm text-ink-600">
          Every rule is in{" "}
          <Link href="/methodology" className={LINK}>
            How It Works
          </Link>
          .
        </p>
      </div>
    </section>
  );
}

/** "Sales we compared you to": newest first. Sale month only, no street names (docs/data-contract.md). */
function CompsTable({ result: r }: { result: CheckerResult }) {
  const rows = [...r.comps.used].reverse();
  const enough = r.estimate !== null;
  return (
    <section aria-labelledby="comps-heading">
      <h3 id="comps-heading" className="font-heading text-xl font-bold text-navy-900">
        Sales we compared you to
      </h3>
      <p className="mt-2 max-w-prose text-base text-ink-800">
        {enough ? "These are the" : "We found only"} {formatCount(r.comps.count)} {r.comps.count === 1 ? "home" : "homes"} in{" "}
        {r.town.name} that sold from {formatMonthYear(r.comps.windowFrom)} to {formatMonthYear(r.comps.windowTo)} and were
        assessed within {r.comps.bandPercent}% of your assessment. Homes assessed closer to yours, and newer sales, get more
        weight.
      </p>
      <div className="mt-4">
        <DataTable
          label="Table of sales we compared you to"
          caption={`${formatCount(r.comps.count)} comparable sales in ${r.town.name}`}
          maxHeight="max-h-[28rem] print:max-h-none print:overflow-visible"
        >
          <thead>
            <tr>
              <th scope="col">Sale month</th>
              <th scope="col" className="num">
                Sale price
              </th>
              <th scope="col" className="num">
                Price in Oct. 2026 terms
              </th>
              <th scope="col" className="num">
                Assessed value
              </th>
              <th scope="col" className="num">
                Weight
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c, i) => (
              <tr key={i}>
                <td className="whitespace-nowrap">{formatMonthYear(c.saleMonth)}</td>
                <td className="num">{formatDollars(c.salePrice)}</td>
                <td className="num">{formatDollars(c.adjustedPrice)}</td>
                <td className="num">{formatDollars(c.assessedValue)}</td>
                <td className="num">{c.weight.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </div>
      <p className="mt-2 text-sm text-ink-600">
        Source: our analysis of <Source k="sr1a">NJ SR1A sales</Source>, cleaned by the rules in{" "}
        <Link href="/methodology" className={LINK}>
          How It Works
        </Link>
        . Prices are updated with our Bergen County price index.
      </p>
    </section>
  );
}

/** Extra help when there are too few sales (K3). */
function NotEnoughData({ result: r, onAddEstimate }: { result: CheckerResult; onAddEstimate?: () => void }) {
  return (
    <section aria-labelledby="other-options" className="rounded-card bg-gray-100 p-6 sm:p-8">
      <h3 id="other-options" className="font-heading text-xl font-bold text-navy-900">
        Why we can&rsquo;t say more, and what you can do
      </h3>
      <p className="mt-2 max-w-prose text-base text-ink-800">
        We compare your home with recent sales of homes assessed close to yours. We need at least {MIN_COMPS} to make a
        fair estimate, and {r.town.name} had {formatCount(r.comps.count)}. Small towns and homes with unusual
        assessments often have too few.
      </p>
      <ul className="mt-4 flex max-w-prose list-disc flex-col gap-2 pl-6 text-base text-ink-800">
        <li>
          Read our{" "}
          <Link href="/appeal-guide" className={LINK}>
            appeal guide
          </Link>{" "}
          to see what an appeal needs.
        </li>
        <li>Ask your town&rsquo;s tax assessor which sales they compared your home to.</li>
        <li>
          Look up recent sales of homes like yours. The state asks for 3 to 5 comparable sales (
          <Source k="appeal_hearing_guide" />
          ).
        </li>
        {onAddEstimate && (
          <li>
            If you have an appraisal or a recent purchase price,{" "}
            <button type="button" onClick={onAddEstimate} className={`${LINK} print:no-underline`}>
              add your own estimate
            </button>{" "}
            and we&rsquo;ll test it.
          </li>
        )}
      </ul>
    </section>
  );
}

const LEAD: Record<CheckerResult["verdict"], string> = {
  "may-have-grounds":
    "If you decide to appeal, these are the steps. The County Board decides each appeal. This result is a screening, not a promise.",
  "within-range":
    "Chapter 123 would not change an assessment inside the range. You can still appeal if you can show your home is worth less than our estimate, for example with an appraisal or sales of homes like yours.",
  "possibly-under-assessed":
    "Think carefully before you appeal. The County Board could raise your assessment. If you still want to appeal, these are the steps.",
  "not-enough-data": "You can still appeal with your own evidence of your home's value. These are the steps.",
  "revaluation-no-test":
    "Wait for your 2027 assessment notice. Then compare it with the estimate above. If you decide to appeal, these are the steps.",
};

/** "What to do next": deadline, fee, and filing steps, only from data/raw/notes/appeal-deadlines-and-fees.md. */
function NextSteps({ result: r }: { result: CheckerResult }) {
  const reval = r.town.revaluationTaxYear === r.appeal.taxYear;
  return (
    <section aria-labelledby="next-steps" className="rounded-card bg-white p-6 ring-1 ring-outline-200 sm:p-8">
      <h3 id="next-steps" className="font-heading text-xl font-bold text-navy-900">
        What to do next
      </h3>
      <p className="mt-2 max-w-prose text-base text-ink-800">{LEAD[r.verdict]}</p>

      <dl className="mt-6 grid gap-6 border-y border-outline-200 py-6 sm:grid-cols-2 sm:gap-8">
        <Figure
          label={`Appeal deadline, tax year ${r.appeal.taxYear}`}
          value={r.appeal.deadline}
          note={
            reval
              ? `${r.town.name} is on the county's list for a town-wide revaluation or reassessment in ${r.appeal.taxYear}, so its deadline is May 1. ${weekendDeadlineNote(r.appeal.deadline) ?? ""}`.trim()
              : `Or 45 days after ${r.town.name} finishes mailing assessment notices, if that is later.`
          }
        />
        <Figure
          label="Filing fee for your assessed value"
          value={formatDollars(r.appeal.filingFee)}
          note="Not refundable. Make the check payable to the County Tax Administrator."
        />
      </dl>
      <p className="mt-4 max-w-prose text-base text-ink-800">
        The County Board must <strong className="text-navy-900">receive</strong> your appeal by the deadline. A postmark
        is not enough, and an appeal that arrives after closing time that day is late. If the deadline falls on a
        weekend or holiday, it moves to the next business day.
      </p>

      <ol className="mt-6 flex max-w-prose list-decimal flex-col gap-3 pl-6 text-base text-ink-800 marker:font-semibold marker:text-blue-600">
        <li>
          File a petition of appeal (<Source k="form_a1">Form A-1</Source>) with the{" "}
          <Source k="bergen_board">Bergen County Board of Taxation</Source>. The Board asks people to{" "}
          <Source k="bergen_online_filing">file online</Source>. A paper form must be hand delivered or mailed.
        </li>
        <li>Send a copy to your town&rsquo;s tax assessor and to the town clerk.</li>
        <li>
          Bring proof of your home&rsquo;s market value on October 1, 2026. You can give up to 5 comparable sales, each
          with its block, lot, sale price, and deed date. The assessments of other homes are not accepted as proof. Our
          table above does not list block and lot, so you will need to look them up.
        </li>
        <li>Keep paying your property taxes. You must pay at least the taxes due through the first quarter of the year.</li>
        <li>
          If you disagree with the County Board&rsquo;s decision, you can appeal to the Tax Court of New Jersey within 45
          days.
        </li>
      </ol>

      <p className="mt-6 text-sm text-ink-600">
        Sources: <Source k="form_a1" />; <Source k="bergen_board" />; <Source k="appeal_hearing_guide" />. Questions?
        Check with the <Source k="bergen_board">Bergen County Board of Taxation</Source> (Two Bergen County Plaza, 1st
        Floor, Hackensack, NJ 07601-7076; 201-336-6300).
      </p>
      <Link
        href="/appeal-guide"
        className="focus-ring group mt-6 inline-flex min-h-12 items-center gap-2 rounded-control font-semibold text-blue-600 hover:text-navy-700 print:hidden"
      >
        Read the full appeal guide
        <ArrowRight
          aria-hidden="true"
          className="h-4 w-4 transition-transform duration-[var(--duration-press)] ease-[var(--ease-out)] motion-safe:group-hover:translate-x-0.5"
          strokeWidth={2}
        />
      </Link>
    </section>
  );
}
