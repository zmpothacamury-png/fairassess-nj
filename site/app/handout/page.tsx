import Image from "next/image";
import type { Metadata } from "next";
import { pct2 } from "@/components/checker/copy";
import { Disclaimer } from "@/components/Disclaimer";
import { BigMeter, QrCode } from "@/components/submission/Pieces";
import { loadCounty, loadMeta, loadPriceIndex, loadTown, loadValidation } from "@/lib/data/load";
import { formatCount } from "@/lib/home";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { SOURCES } from "@/lib/sources";
import { EXAMPLE_HOME, HEADLINE_TOWN, exampleResult, labelCounts, quarterGap, submissionUrl } from "@/lib/submission";

/** One-page App Challenge Fair handout, US Letter (Prompt 17). Hidden from the nav, sitemap, and search.
 *  `site/scripts/capture-submission.ts` prints it to docs/submission/fair-handout.pdf. The site header
 *  and footer are hidden in print (globals.css), so this page carries its own disclaimer. */
export const metadata: Metadata = {
  title: SITE_NAME,
  robots: { index: false, follow: false },
};

const STEP = "flex gap-3";
const STEP_NUM =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-900 font-heading text-[15px] font-bold text-white";

export default async function HandoutPage() {
  const [county, meta, validation, headline, town, priceIndex] = await Promise.all([
    loadCounty(),
    loadMeta(),
    loadValidation(),
    loadTown(HEADLINE_TOWN),
    loadTown(EXAMPLE_HOME.townSlug),
    loadPriceIndex(),
  ]);
  const labels = labelCounts(county);
  const gap = quarterGap(headline);
  const v = validation.summary;
  const result = exampleResult(town, priceIndex);
  const c = result.chapter123;
  const e = result.estimate;
  const url = submissionUrl(SITE_URL);
  const shownUrl = url.replace(/^https?:\/\//, "");

  return (
    <main className="flex justify-center bg-mist-50 py-10 print:bg-white print:py-0">
      {/* Letter page minus the print margins in globals.css (16mm top/bottom, 14mm sides). */}
      <article
        id="handout"
        className="flex flex-col bg-white text-[12.5px] leading-snug text-ink-800 print:shadow-none"
        style={{ width: "7.4in", minHeight: "9.5in" }}
      >
        <header className="flex items-center justify-between gap-6 border-b border-outline-200 pb-3">
          <div className="flex shrink-0 items-center gap-3">
            <Image src="/logo-icon.png" alt="" width={394} height={698} loading="eager" style={{ height: 72, width: "auto" }} />
            <div>
              <p className="font-heading text-[26px] font-extrabold leading-none tracking-wide text-navy-700">FAIR ASSESS NJ</p>
              <p className="mt-1.5 font-heading text-[9.5px] font-bold tracking-[0.14em] text-ink-600">
                PUBLIC ASSESSMENT EQUITY
              </p>
            </div>
          </div>
          <p className="max-w-[3.9in] font-heading text-[17px] font-bold leading-tight text-navy-900">
            A free website that helps Bergen County homeowners see if their home is assessed fairly for
            property taxes.
          </p>
        </header>

        <section className="mt-4 grid grid-cols-[1fr_auto] gap-6">
          <div>
            <p className="eyebrow text-blue-600">What I found</p>
            <p className="mt-1 font-heading text-[17px] font-bold leading-snug text-navy-900">
              In {headline.name}, the cheapest quarter of sold homes was assessed at about {gap?.lowPercent}% of
              its sale price. The most expensive quarter: about {gap?.highPercent}%.
            </p>
            <p className="mt-2">
              (An <strong>assessment ratio</strong> is assessed value divided by sale price.) When cheaper homes have
              higher ratios, their owners pay more than their fair share: a <strong>regressive</strong> pattern.
            </p>
            <p className="mt-2">
              I studied {formatCount(county.n_sales)} single-family home sales in Bergen County (July 2025 to June
              2026). Of the {labels.ranked} towns with enough sales to rank: {labels.within} are within the
              international standard (IAAO), {labels.mixed} show mixed signals, {labels.regressive} show a regressive
              pattern, and {labels.progressive} shows the opposite.
            </p>
          </div>
          <div className="w-[1.9in] rounded-card bg-mist-50 p-4">
            <p className="eyebrow text-blue-600">Checked against the state</p>
            <p className="mt-2">
              <span className="font-heading text-[22px] font-extrabold text-navy-900">
                {v.counts_match} of {v.n_towns}
              </span>
              <br />
              towns: the same sales as the state ({formatCount(Number(v.total_ours))} sales)
            </p>
            <p className="mt-2">
              <span className="font-heading text-[22px] font-extrabold text-navy-900">
                {v.one_year_within_flag} of {v.n_towns}
              </span>
              <br />
              towns: my ratio within 5 points of the state&rsquo;s, using the state&rsquo;s method
            </p>
          </div>
        </section>

        <section className="mt-4 border-t border-outline-200 pt-3">
          <p className="eyebrow text-blue-600">How the appeal checker works</p>
          <ol className="mt-2 grid grid-cols-3 gap-5">
            <li className={STEP}>
              <span className={STEP_NUM}>1</span>
              <span>
                <strong className="text-navy-900">Pick your town and enter your assessed value</strong> from your tax
                bill. Nothing you type leaves your browser.
              </span>
            </li>
            <li className={STEP}>
              <span className={STEP_NUM}>2</span>
              <span>
                <strong className="text-navy-900">It compares recent sales</strong> of homes with similar assessed
                values in your town to estimate a market value range.
              </span>
            </li>
            <li className={STEP}>
              <span className={STEP_NUM}>3</span>
              <span>
                <strong className="text-navy-900">It applies New Jersey&rsquo;s Chapter 123 test</strong> (the
                state&rsquo;s rule for when an assessment is too high) and explains the result in plain English.
              </span>
            </li>
          </ol>
        </section>

        {c && e && (
          <section className="mt-4 rounded-card border border-outline-200 px-5 py-4">
            <p className="eyebrow text-blue-600">Example result (a made-up home)</p>
            <p className="mt-1">
              {result.town.name}, assessed at ${formatCount(result.assessedValue)}. Estimated market value $
              {formatCount(e.marketValueMid)} (likely ${formatCount(e.marketValueLow)} to $
              {formatCount(e.marketValueHigh)}). Result: <strong className="text-navy-900">within the normal range</strong>.
            </p>
            <div className="mt-3 grid grid-cols-[1fr_2.3in] items-center gap-6">
              <div>
                <BigMeter result={result} />
                <p className="sr-only">
                  {result.town.name}&rsquo;s common level range runs from {pct2(c.lowerLimit)} to {pct2(c.upperLimit)}.
                  This home&rsquo;s ratio is {pct2(c.homeownerRatio)}, inside the range.
                </p>
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-[12px]">
                <dt className="text-ink-600">This home&rsquo;s ratio</dt>
                <dd className="font-semibold tabular-nums text-navy-900">{pct2(c.homeownerRatio)}</dd>
                <dt className="text-ink-600">Lower limit</dt>
                <dd className="font-semibold tabular-nums text-navy-900">{pct2(c.lowerLimit)}</dd>
                <dt className="text-ink-600">Upper limit</dt>
                <dd className="font-semibold tabular-nums text-navy-900">
                  {pct2(c.upperLimit)}
                  {c.upperLimit > 100 ? " (tested as 100%)" : ""}
                </dd>
                <dt className="text-ink-600">Town average</dt>
                <dd className="font-semibold tabular-nums text-navy-900">{pct2(c.averageRatio)}</dd>
              </dl>
            </div>
            <p className="mt-2 text-[12px] text-ink-600">
              Green is the town&rsquo;s <strong className="text-ink-800">common level range</strong>, the band the
              state allows around its average ratio. Above it (gold) may mean grounds to appeal. The navy bar is this
              home.
            </p>
            <p className="mt-2">
              Appeals for tax year {result.appeal.taxYear} are due <strong>{result.appeal.deadline}</strong> (May 1,
              2027 in towns with a 2027 revaluation). The filing fee is $5 to $150, depending on the assessed value
              (${result.appeal.filingFee} for this home).
            </p>
          </section>
        )}

        <footer className="mt-auto flex items-end justify-between gap-6 border-t border-outline-200 pt-3">
          <div className="max-w-[5.2in]">
            <p className="font-heading text-[15px] font-bold text-navy-900">
              Built by Zaden Pothacamury, Ramapo High School.
            </p>
            <p className="mt-1 text-[11px] text-ink-600">
              Data: {SOURCES.sr1a.label} ({SOURCES.sr1a.url}); {SOURCES.ch123_2027.label}; deadlines and fees: {SOURCES.form_a1.label}. Data as of{" "}
              {meta.data_as_of}.
            </p>
            <Disclaimer className="mt-2 text-[11px]" />
          </div>
          <div className="flex flex-col items-center">
            <QrCode text={url} size={104} />
            <p className="mt-1 font-heading text-[13px] font-bold text-navy-900">{shownUrl}</p>
          </div>
        </footer>
      </article>
    </main>
  );
}
