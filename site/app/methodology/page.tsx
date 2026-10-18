import "katex/dist/katex.min.css";
import { Download } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ChartFrame } from "@/components/ChartFrame";
import { Band, Disclosure, Figure, LINK, Source, SourceLine } from "@/components/content/blocks";
import { FilterFunnel, type FunnelStep } from "@/components/content/FilterFunnel";
import { Formula } from "@/components/content/Formula";
import { PriceIndexChart } from "@/components/content/PriceIndexChart";
import { CtaBand } from "@/components/CtaBand";
import { DataTable } from "@/components/DataTable";
import { Disclaimer } from "@/components/Disclaimer";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { Term } from "@/components/Term";
import { MIN_COMPS, MIN_COMPS_BEFORE_WIDENING } from "@/lib/checker/config";
import { loadFilterLog, loadMeta, loadPriceIndex, loadValidation } from "@/lib/data/load";
import { formatCount, formatLongDate, formatMonthYear } from "@/lib/home";
import { NAV_CTA } from "@/lib/nav";
import { GITHUB_URL } from "@/lib/site";
import { CSV_PATH, pageMetadata } from "@/lib/seo";
import { statePct } from "@/lib/towns";

export const metadata: Metadata = pageMetadata({
  path: "/methodology",
  description:
    "How Fair Assess NJ works: the state sales files we use, how we clean them, the IAAO measures (median ratio, COD, PRD, PRB), Chapter 123, the appeal checker, and how we checked our work.",
});

const DOC = (file: string) => `${GITHUB_URL}/blob/main/docs/${file}`;

/** One plain reason per cleaning rule (methodology Section 4). Labels come from filter-log.json. */
const RULE_REASONS: Record<string, string> = {
  C1: "This version covers Bergen County only.",
  C2: "This version covers homes, not stores, land, or farms.",
  C10: "Condos are valued and assessed differently from single-family homes.",
  C3: "The state marks sales that are not fair market sales, like sales between family members, as not usable. We follow the state.",
  C7: "The same line listed twice would count one sale twice.",
  C4: "A Bergen home selling for under $50,000 is almost always a family transfer or a typing error. A safety net.",
  C5: "We need an assessed value to compute a ratio.",
  C6: "The price covers more than one lot, but the assessed value covers only one, so the ratio would be too low.",
  C9: "In towns that just revalued, mixing old and new assessments would make the town look uneven. A safety net.",
  C8: "Removes extreme ratios inside each town with the IAAO's 3 × IQR method. The state already removed the worst ones.",
};

const TERMS = {
  ratio: "Assessed value divided by sale price. A home that sold for $500,000 and is assessed at $400,000 has a ratio of 80%.",
  median: "The middle assessment ratio of a town's sales when they are sorted from lowest to highest.",
  cod: "Coefficient of dispersion: how far, on average, each home's ratio is from the town's typical ratio, as a percent. Lower means more even.",
  prd: "Price-related differential: the plain average ratio divided by the price-weighted average ratio. Above 1 means cheaper homes tend to have higher ratios.",
  prb: "Price-related bias: about how much the ratio changes, in percent, each time a home's value doubles. Below zero means cheaper homes are assessed at a higher share of value.",
  ch123: "A New Jersey law (Chapter 123, Laws of 1973). If a home's assessment ratio is more than 15% above or below the town's average ratio, the County Board corrects the assessment.",
  clr: "15% above and below the town's average ratio for the year, set by the state. A home's ratio outside this range can be corrected on appeal.",
  iqr: "Interquartile range: the spread of the middle half of the values (from the 25th to the 75th percentile).",
  comps: "Comparable sales: recent sales of homes like yours.",
} as const;

/** "How It Works": a readable public version of docs/methodology.md. Every number comes from the pipeline's JSON. */
export default async function MethodologyPage() {
  const [meta, filterLog, index, validation] = await Promise.all([loadMeta(), loadFilterLog(), loadPriceIndex(), loadValidation()]);
  const v = validation.summary;
  const n = (k: string) => formatCount(Number(v[k]));
  const sales = meta.town_stats_sales;

  const labels = new Map(filterLog.rules.map((r) => [r.rule_id, r.description]));
  const funnel = (file: string) => {
    const rows = filterLog.county.filter((r) => r.source_file === file);
    const steps: FunnelStep[] = rows.map((r) => ({
      ruleId: r.rule_id,
      label: labels.get(r.rule_id) ?? r.rule_id,
      reason: RULE_REASONS[r.rule_id] ?? "",
      rowsIn: r.rows_in,
      removed: r.rows_removed,
      rowsOut: r.rows_out,
    }));
    return { start: rows[0].rows_in, steps, end: rows[rows.length - 1].rows_out };
  };
  const f26 = funnel("Sales2026");
  const fAll = funnel("All");

  const indexPoints = index.months
    .filter((m) => m.kept && m.index !== null && m.month >= index.chart_from)
    .map((m) => ({ month: m.month, label: shortMonth(m.month), index: m.index as number }));

  return (
    <main className="flex-1">
      <PageHeader
        eyebrow="How It Works"
        title="How we calculate every number"
        intro="The question we ask, the state files we use, the sales we keep, the formulas behind each measure, and how we checked our work against the state's."
        meta={
          <p className="text-sm text-ink-800">
            Methodology version <span className="font-semibold tabular-nums">{meta.methodology_version}</span>, updated{" "}
            {formatLongDate(meta.methodology_date)}
          </p>
        }
      />

      {/* 01: the question */}
      <Band id="question" tight>
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
          <Reveal className="lg:col-span-7">
            <p className="eyebrow text-blue-600">01 · The question</p>
            <h2 className="mt-2 font-heading text-2xl font-bold text-navy-900">
              Do Bergen County towns assess cheaper homes at a higher share of their value than expensive homes?
            </h2>
            <p className="mt-4 max-w-prose text-lg text-ink-800">
              We compare each home&rsquo;s assessed value with the price it sold for. That share is the{" "}
              <Term definition={TERMS.ratio}>assessment ratio</Term>. When cheaper homes have higher ratios than
              expensive homes, their owners pay more than their fair share of the town&rsquo;s taxes. Experts call this
              pattern &ldquo;regressive.&rdquo;
            </p>
            <p className="mt-4 max-w-prose text-base text-ink-800">
              <strong className="text-navy-900">What our answers are, and are not.</strong> They describe patterns in
              recent sales, using the same tests professional assessors use. They are not accusations. A pattern can
              come from many causes, like an old revaluation or fast-changing prices, and each town sets its own
              assessments.
            </p>
          </Reveal>
          <Reveal className="lg:col-span-5">
            <nav aria-label="On this page" className="rounded-card bg-mist-50 p-6">
              <p className="font-semibold text-navy-900">On this page</p>
              <ol className="mt-3 flex flex-col gap-1 text-base">
                {[
                  ["data", "Where the data comes from"],
                  ["cleaning", "From raw sales to clean data"],
                  ["measures", "The measures"],
                  ["chapter-123", "Chapter 123, simply"],
                  ["checker", "How the appeal checker works"],
                  ["validation", "How we checked our work"],
                  ["limitations", "Limitations"],
                  ["versions", "Versions and downloads"],
                ].map(([id, label], i) => (
                  <li key={id}>
                    <a href={`#${id}`} className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-control text-blue-600 hover:text-navy-700">
                      <span className="w-6 tabular-nums text-ink-600">{String(i + 2).padStart(2, "0")}</span>
                      <span className="underline underline-offset-4">{label}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </Reveal>
        </div>
      </Band>

      {/* 02: data sources */}
      <Band id="data" tone="mist">
        <Reveal>
          <SectionHeading
            eyebrow="02 · Data"
            title="Where the data comes from"
            description="Every file is public and comes from the New Jersey Division of Taxation, unless it says otherwise. We never edit the original files."
          />
        </Reveal>
        <DataTable label="State files we use" caption="State files used by Fair Assess NJ" maxHeight="max-h-none">
          <thead>
            <tr>
              <th scope="col">File</th>
              <th scope="col">What it is</th>
              <th scope="col">Dates used</th>
              <th scope="col">What we use it for</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><Source k="sales2026">SR1A sales, Sales2026</Source></td>
              <td>Every recorded property sale in New Jersey</td>
              <td className="whitespace-nowrap">Deeds recorded {formatLongDate(sales.recorded_from)} to {formatLongDate(sales.recorded_to)}</td>
              <td>Town statistics, checker sales, price index</td>
            </tr>
            <tr>
              <td><Source k="sales2025">SR1A sales, Sales2025</Source></td>
              <td>The year before</td>
              <td className="whitespace-nowrap">Sales from {formatMonthYear(meta.comp_sales.deed_date_from)} on</td>
              <td>Checker sales, price index</td>
            </tr>
            <tr>
              <td><Source k="ch123_2027">Chapter 123 ratios, 2027</Source></td>
              <td>Each town&rsquo;s average ratio and common level range</td>
              <td>Tax year {meta.chapter123_tax_year}</td>
              <td>The appeal checker&rsquo;s test</td>
            </tr>
            <tr>
              <td><Source k="ch123_definitions">Chapter 123 definitions</Source></td>
              <td>The rules, with 3 worked examples</td>
              <td>Current</td>
              <td>Section 05</td>
            </tr>
            <tr>
              <td><Source k="tev_2026" />, <Source k="tev_2025" /></td>
              <td>Each town&rsquo;s total assessed and market value</td>
              <td>2025 and 2026</td>
              <td>Checking our work</td>
            </tr>
            <tr>
              <td><Source k="coefficient_deviations" />, <Source k="avg_residential_2026" /></td>
              <td>The state&rsquo;s own sale counts and spread</td>
              <td>2026</td>
              <td>Checking our work</td>
            </tr>
            <tr>
              <td><Source k="dir_ratios" /></td>
              <td>Every town&rsquo;s ratio since 2002</td>
              <td>2002 to 2026</td>
              <td>Town page context</td>
            </tr>
            <tr>
              <td><Source k="tax_rates_2025" />, <Source k="gtr_history" /></td>
              <td>Dollars of tax per $100 of assessed value</td>
              <td>{meta.tax_rate_year} (the newest we have)</td>
              <td>The checker&rsquo;s savings estimate</td>
            </tr>
            <tr>
              <td><Source k="bergen_revaluations" /></td>
              <td>Towns getting new assessments (Bergen County Board of Taxation)</td>
              <td>2026 and 2027</td>
              <td>Revaluation rules</td>
            </tr>
          </tbody>
        </DataTable>
        <SourceLine className="mt-4">
          All state files are listed on the <Source k="sr1a">NJ Division of Taxation statistics page</Source>. We use
          the state&rsquo;s own July-to-June sampling year for town statistics, so we can check our numbers against the
          state&rsquo;s (Section 07).
        </SourceLine>
      </Band>

      {/* 03: cleaning */}
      <Band id="cleaning">
        <Reveal>
          <SectionHeading
            eyebrow="03 · Cleaning"
            title="From raw sales to clean data"
            description={`We start with every Bergen sale in the file and keep only fair, single-family sales. ${formatCount(f26.end)} sales are left for the town statistics.`}
          />
        </Reveal>
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <ChartFrame
              title="Sales left after each rule (Sales2026)"
              caption={`Each bar is the sales still in after a rule; the pale part is what the rule removed. Rules run top to bottom, and outlier trimming always runs last.`}
              source={
                <>
                  Source: our analysis of <Source k="sales2026">NJ SR1A Sales2026</Source>. Every removed sale is logged
                  in <a href={DOC("filter-log.md")} className={LINK} rel="noopener noreferrer">our filter log</a>.
                </>
              }
              table={
                <DataTable label="Cleaning rules table" caption="Sales in, removed, and left for each cleaning rule" maxHeight="max-h-none">
                  <thead>
                    <tr>
                      <th scope="col">Rule</th>
                      <th scope="col">What it does</th>
                      <th scope="col" className="num">In</th>
                      <th scope="col" className="num">Removed</th>
                      <th scope="col" className="num">Left</th>
                    </tr>
                  </thead>
                  <tbody>
                    {f26.steps.map((s) => (
                      <tr key={s.ruleId}>
                        <td>{s.ruleId}</td>
                        <td>{s.label}</td>
                        <td className="num">{formatCount(s.rowsIn)}</td>
                        <td className="num">{formatCount(s.removed)}</td>
                        <td className="num">{formatCount(s.rowsOut)}</td>
                      </tr>
                    ))}
                  </tbody>
                </DataTable>
              }
            >
              <FilterFunnel start={f26.start} steps={f26.steps} />
            </ChartFrame>
          </div>
          <div className="flex flex-col gap-4 text-base text-ink-800 lg:col-span-4">
            <p>
              <strong className="text-navy-900">Why so many removed?</strong> Most removed sales are ones the state
              itself marks as not usable (rule C3), and condos (rule C10). Removing a sale is not a judgment about the
              buyer or seller. It means the price is not a fair test of the assessment.
            </p>
            <p>
              <strong className="text-navy-900">The appeal checker</strong> also uses the year before (Sales2025),
              because it needs more recent sales near each home&rsquo;s value. After the same rules, both files together
              give <span className="font-semibold tabular-nums">{formatCount(fAll.end)}</span> clean sales.
            </p>
            <p>
              <strong className="text-navy-900">Outliers.</strong> Rule C8 uses the IAAO&rsquo;s{" "}
              <Term definition={TERMS.iqr}>IQR</Term> fence, separately in each town, because Bergen towns assess at
              very different levels. A fixed cutoff would remove honest sales in low-ratio towns.
            </p>
          </div>
        </div>
      </Band>

      {/* 04: measures */}
      <Band id="measures" tone="mist">
        <Reveal>
          <SectionHeading
            eyebrow="04 · Measures"
            title="The measures"
            description="These are the standard tests from the International Association of Assessing Officers (IAAO). None of them are our inventions."
          />
        </Reveal>
        <p className="mb-8 max-w-prose text-base text-ink-800">
          In each formula, a town has <em>n</em> sales. Sale <em>i</em> has assessed value <em>A</em>
          <sub>i</sub> and sale price <em>S</em>
          <sub>i</sub>, and its ratio is <em>R</em>
          <sub>i</sub>.
        </p>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <MeasureCard
            title="Assessment ratio"
            plain="The share of a home's sale price that the town assesses."
            tex="R_i = \dfrac{A_i}{S_i}"
            label="R sub i equals A sub i divided by S sub i."
          />
          <MeasureCard
            title={<Term definition={TERMS.median}>Median ratio</Term>}
            plain="The typical share of value a town assesses at. Half the sales are above it, half below."
            tex="\tilde{R} = \text{middle value of } R_1, \dots, R_n"
            label="R tilde is the middle value of all the ratios when sorted. With an even count, the average of the two middle values."
          />
          <MeasureCard
            title={<Term definition={TERMS.cod}>COD</Term>}
            plain="How far, on average, each home's ratio is from the town's typical ratio, as a percent. Lower means more even."
            tex="\text{COD} = \dfrac{100}{\tilde{R}} \times \dfrac{1}{n}\sum_{i=1}^{n} \left| R_i - \tilde{R} \right|"
            label="COD equals 100 divided by the median ratio, times the average distance of each ratio from the median."
          />
          <MeasureCard
            title={<Term definition={TERMS.prd}>PRD</Term>}
            plain="Above 1 means cheaper homes tend to have higher ratios than expensive homes."
            tex="\text{PRD} = \dfrac{\tfrac{1}{n}\sum R_i}{\sum A_i \,/\, \sum S_i}"
            label="PRD equals the plain average ratio divided by total assessed value over total sale price."
          />
          <div className="min-w-0 md:col-span-2">
            <MeasureCard
              title={<Term definition={TERMS.prb}>PRB</Term>}
              plain="About how much the ratio changes, in percent, each time a home's value doubles. A PRB of −0.05 means the ratio falls about 5% each time value doubles. We follow the IAAO's steps exactly."
              tex={String.raw`\begin{aligned}
V_i &= 0.5\,\frac{A_i}{\tilde{R}} + 0.5\,S_i && \text{value: half assessment-based, half sale price}\\
x_i &= \frac{\ln V_i}{0.693} && \text{one step = value doubles}\\
y_i &= \frac{R_i - \tilde{R}}{\tilde{R}} && \text{how far the ratio is from the median}\\
y_i &= a + b\,x_i, \quad \text{PRB} = b && \text{the slope of a straight-line fit}
\end{aligned}`}
              label="PRB is the slope b of a straight line fit of y on x, where V mixes the sale price with the assessment, x is log value divided by 0.693, and y is the ratio's distance from the median."
            />
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <h3 className="font-heading text-xl font-bold text-navy-900">IAAO&rsquo;s acceptable ranges</h3>
            <div className="mt-4">
              <DataTable label="IAAO ranges" caption="IAAO acceptable ranges for each measure" maxHeight="max-h-none">
                <thead>
                  <tr>
                    <th scope="col">Measure</th>
                    <th scope="col">IAAO range</th>
                    <th scope="col">How we use it</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>COD</td>
                    <td className="whitespace-nowrap tabular-nums">5.0 to 15.0</td>
                    <td>For older or mixed areas, like most Bergen towns (5.0 to 10.0 for newer, similar homes)</td>
                  </tr>
                  <tr>
                    <td>PRD</td>
                    <td className="whitespace-nowrap tabular-nums">0.98 to 1.03</td>
                    <td>Part of each town&rsquo;s label</td>
                  </tr>
                  <tr>
                    <td>PRB</td>
                    <td className="whitespace-nowrap tabular-nums">−0.05 to +0.05</td>
                    <td>Part of the label; also the rankings&rsquo; sort order</td>
                  </tr>
                  <tr>
                    <td>Median ratio</td>
                    <td>No pass/fail</td>
                    <td>New Jersey towns assess at a share of value on purpose; Chapter 123 handles the level</td>
                  </tr>
                </tbody>
              </DataTable>
            </div>
            <SourceLine className="mt-2">
              Source: <Source k="iaao" /> (Table 1-3 and section 9.2.7).
            </SourceLine>
          </div>
          <div className="flex flex-col gap-4 text-base text-ink-800 lg:col-span-5">
            <h3 className="font-heading text-xl font-bold text-navy-900">How towns get their label</h3>
            <ul className="flex flex-col gap-2">
              <li><strong className="text-navy-900">Regressive pattern:</strong> PRD above 1.03 and PRB below −0.05.</li>
              <li><strong className="text-navy-900">Progressive pattern:</strong> PRD below 0.98 and PRB above +0.05.</li>
              <li><strong className="text-navy-900">Within standards:</strong> both inside their ranges.</li>
              <li><strong className="text-navy-900">Mixed signals:</strong> anything else.</li>
              <li><strong className="text-navy-900">Not enough sales:</strong> under 20 clean sales. 20 to 39 sales show a &ldquo;Limited data&rdquo; tag.</li>
            </ul>
            <p>
              Both measures must agree, so one noisy number can&rsquo;t label a town. Each town page also shows 95% ranges
              from 2,000 resamples.
            </p>
          </div>
        </div>
      </Band>

      {/* 05: Chapter 123 */}
      <Band id="chapter-123">
        <Reveal>
          <SectionHeading
            eyebrow="05 · Chapter 123"
            title="Chapter 123, simply"
            description="The New Jersey law that decides whether an assessment is out of line on appeal."
          />
        </Reveal>
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="flex max-w-prose flex-col gap-4 text-base text-ink-800 lg:col-span-6">
            <p>
              Each year the state sets every town&rsquo;s <strong className="text-navy-900">average ratio</strong>: the
              share of market value the town assesses at, for all property. Under{" "}
              <Term definition={TERMS.ch123}>Chapter 123</Term>, the{" "}
              <Term definition={TERMS.clr}>common level range</Term> runs 15% below to 15% above that average.
            </p>
            <p>
              On appeal, if a home&rsquo;s ratio is <strong className="text-navy-900">above</strong> the range, the County
              Board lowers its taxable value to its market value times the average ratio. If it is{" "}
              <strong className="text-navy-900">below</strong>, the Board can raise it the same way. Inside the range,
              Chapter 123 does not change it.
            </p>
            <p>
              The state counts any ratio over 100% as 100%. So in a town whose upper limit is above 100%, a home assessed
              above its full market value can still get relief.
            </p>
            <SourceLine>
              Sources: <Source k="ch123_definitions" /> (Examples I to III); <Source k="ch123_2027" />.
            </SourceLine>
          </div>
          <div className="lg:col-span-6">
            <div className="split-accent overflow-hidden rounded-card border border-outline-200 bg-white p-6 sm:p-8">
              <p className="eyebrow text-gold-700">Made-up example, round numbers</p>
              <p className="mt-2 text-base text-ink-800">
                Not a real town or home. It only shows how the test works.
              </p>
              <dl className="mt-6 grid grid-cols-2 gap-6">
                <Figure label="Town's average ratio" value="80%" note="Range: 68% to 92%" />
                <Figure label="Home's market value" value="$500,000" />
                <Figure label="Home's assessment" value="$480,000" />
                <Figure label="Home's ratio" value="96%" note="$480,000 ÷ $500,000" />
              </dl>
              <p className="mt-6 border-t border-outline-200 pt-6 text-base text-ink-800">
                96% is above 92%, so the Board would set the taxable value to{" "}
                <strong className="tabular-nums text-navy-900">$500,000 × 80% = $400,000</strong>. If the assessment had
                been $440,000 (a ratio of 88%), it would be inside the range and would not change.
              </p>
            </div>
          </div>
        </div>
      </Band>

      {/* 06: the checker */}
      <Band id="checker" tone="mist">
        <Reveal>
          <SectionHeading
            eyebrow="06 · The appeal checker"
            title="How the appeal checker works"
            description="Everything runs in your browser. Nothing you type is sent, saved, or logged."
          />
        </Reveal>
        <ol className="grid max-w-5xl gap-x-12 gap-y-8 text-base text-ink-800 md:grid-cols-2">
          <Step n={1} title="Find similar sales">
            We look for <Term definition={TERMS.comps}>comps</Term>: clean sales in your town since{" "}
            {formatMonthYear(meta.comp_sales.deed_date_from)}, of homes assessed within 15% of yours. If there are fewer
            than {MIN_COMPS_BEFORE_WIDENING}, we widen to 25%. With fewer than {MIN_COMPS}, we say there is not enough
            data.
          </Step>
          <Step n={2} title="Update old prices">
            Prices change over time. We bring every sale to {formatMonthYear(index.base_month)} prices with a Bergen
            County price index (the median sale price, smoothed over 3 months). We do not guess at prices after that; the
            index stays flat to {formatLongDate(meta.valuation_date)}, the date the state values homes for{" "}
            {meta.chapter123_tax_year} appeals.
          </Step>
          <Step n={3} title="Weigh each sale">
            Homes assessed closer to yours count more (a home at the edge of the search counts half). Recent sales count
            more: a sale 12 months before {formatLongDate(meta.valuation_date)} counts half as much as one on that date.
          </Step>
          <Step n={4} title="Estimate a value range">
            Each sale&rsquo;s ratio tells us what share of value homes like yours are assessed at. Your assessed value
            divided by the weighted middle ratio is our middle estimate. The 25th and 75th percentiles give the range.
          </Step>
          <Step n={5} title="Apply Chapter 123">
            Your ratio is your assessed value divided by our middle estimate. Above the range: you may have grounds to
            appeal. Inside it: within the normal range. Below it: your assessment may be lower than typical. Too few
            sales: not enough data. In towns getting new assessments for {meta.chapter123_tax_year}, Chapter 123 does not
            apply that year, so we show only the value estimate.
          </Step>
          <Step n={6} title="Two independent versions">
            The checker is written twice: once for the website and once, separately, in Python from the written rules.
            Both run the same 58 test cases, including 3 worked out by hand, and must agree to within $1. If someone
            changes a rule in only one version, the tests fail.
          </Step>
        </ol>
        <div className="mt-12">
          <ChartFrame
            title="Bergen County price index"
            caption={`How Bergen home prices moved, by month. It starts in ${formatMonthYear(index.chart_from)}, the first month the checker can use; earlier months have few sales and are in the table only.`}
            source={
              <>
                Source: our analysis of <Source k="sr1a">NJ SR1A sales</Source> (Sales2025 and Sales2026).
              </>
            }
            table={
              <DataTable label="Price index table" caption="Bergen County price index by month" maxHeight="max-h-96">
                <thead>
                  <tr>
                    <th scope="col">Month</th>
                    <th scope="col" className="num">Sales</th>
                    <th scope="col" className="num">Index</th>
                  </tr>
                </thead>
                <tbody>
                  {index.months.map((m) => (
                    <tr key={m.month}>
                      <td className="whitespace-nowrap">{formatMonthYear(m.month)}</td>
                      <td className="num">{formatCount(m.n_sales)}</td>
                      <td className="num">{m.kept && m.index !== null ? m.index.toFixed(4) : "Not used (incomplete month)"}</td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            }
          >
            <PriceIndexChart points={indexPoints} baseLabel={formatMonthYear(index.base_month)} />
          </ChartFrame>
        </div>
      </Band>

      {/* 07: validation */}
      <Band id="validation">
        <Reveal>
          <SectionHeading eyebrow="07 · Validation" title="How we checked our work" />
        </Reveal>
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="flex flex-col gap-6 lg:col-span-7">
            <p className="max-w-prose text-lg text-ink-800">
              <strong className="text-navy-900">
                For {n("one_year_within_flag")} of {n("n_towns")} Bergen towns, our ratio came within{" "}
                {validation.thresholds.v4_flag_pp} points of the state&rsquo;s, and for {n("one_year_within_1")} it was
                within 1 point.
              </strong>{" "}
              That is when we follow the state&rsquo;s own method: weighted by price and by property class, before the
              state blends in last year&rsquo;s value.
            </p>
            <dl className="grid gap-6 border-y border-outline-200 py-6 sm:grid-cols-3">
              <Figure label="Same sales as the state" value={`${n("counts_match")} of ${n("n_towns")}`} note={`towns; ${n("total_ours")} sales`} />
              <Figure label="Same spread (within 0.25 points)" value={`${n("v2_pass")} of ${n("v2_n")}`} note="towns the state reports" />
              <Figure label="Same average sale price" value={`${n("price_mean_matches")} of ${n("price_n")}`} note="towns with home sales" />
            </dl>
            <p className="max-w-prose text-base text-ink-800">
              Our first try, a plain average of the same sales, was within {validation.thresholds.v4_flag_pp} points in
              only {n("simple_within_flag")} towns. A 2026 Tax Court opinion explained why: the state averages each
              year&rsquo;s value with the year before, which raised the published ratio by a median of{" "}
              {Number(v.averaging_median).toFixed(1)} points. Once we took that step back out, the numbers lined up.
            </p>
            <SourceLine>
              Sources: <Source k="ch123_2027" />; <Source k="tev_2026" />; <Source k="tev_2025" />;{" "}
              <Source k="coefficient_deviations" />; <Source k="avg_residential_2026" />; <Source k="tax_court_method" />.
              Full report: <a href={DOC("validation.md")} className={LINK} rel="noopener noreferrer">validation.md</a>.
            </SourceLine>
          </div>
          <div className="rounded-card bg-mist-50 p-6 lg:col-span-5">
            <h3 className="font-heading text-lg font-bold text-navy-900">What I changed because of validation</h3>
            <ol className="mt-4 flex list-decimal flex-col gap-3 pl-5 text-base text-ink-800 marker:font-semibold marker:text-blue-600">
              <li>Found and saved the Tax Court opinion that explains the state&rsquo;s method, and the 2025 Table it needs.</li>
              <li>Added a new check: rebuild the state&rsquo;s one-year ratio from our sales, and flag any town more than {validation.thresholds.v4_flag_pp} points off.</li>
              <li>Used the total assessment of every lot for multi-lot sales in these checks, the way the state pairs them.</li>
              <li>Show the state&rsquo;s ratio beside ours on every town page, with a note on why they differ.</li>
            </ol>
            <p className="mt-4 text-base text-ink-800">No cleaning rule, town statistic, or ranking changed.</p>
          </div>
        </div>
        <div className="mt-10">
          <Disclosure summary={`Show the full comparison for all ${n("n_towns")} towns`}>
            <DataTable label="Validation table" caption="Our ratio compared with the state's, by town" maxHeight="max-h-[32rem]">
              <thead>
                <tr>
                  <th scope="col">Town</th>
                  <th scope="col" className="num">State 2027 average ratio</th>
                  <th scope="col" className="num">State one-year ratio</th>
                  <th scope="col" className="num">Ours, state&rsquo;s method</th>
                  <th scope="col" className="num">Gap (points)</th>
                  <th scope="col">Same sales?</th>
                </tr>
              </thead>
              <tbody>
                {validation.towns.map((t) => (
                  <tr key={t.district_code}>
                    <td>{t.town}</td>
                    <td className="num">{statePct(t.state_average_ratio)}</td>
                    <td className="num">{t.state_one_year_ratio === null ? "—" : statePct(t.state_one_year_ratio)}</td>
                    <td className="num">{t.our_ratio_state_style === null ? "—" : statePct(t.our_ratio_state_style)}</td>
                    <td className="num">{t.diff_one_year_pp === null ? "—" : `${t.diff_one_year_pp > 0 ? "+" : ""}${t.diff_one_year_pp.toFixed(2)}`}</td>
                    <td>{t.counts_match ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
            <SourceLine className="mt-2">
              The state&rsquo;s one-year ratio is its 2026 value with the prior-year averaging taken back out, using{" "}
              <Source k="tev_2026" /> and <Source k="tev_2025" />.
            </SourceLine>
          </Disclosure>
        </div>
      </Band>

      {/* 08: limitations */}
      <Band id="limitations" tone="mist">
        <Reveal>
          <SectionHeading eyebrow="08 · Limitations" title="What our numbers can't tell you" />
        </Reveal>
        <ul className="grid max-w-5xl gap-x-12 gap-y-6 text-base text-ink-800 md:grid-cols-2">
          {LIMITATIONS.map(([title, body, link]) => (
            <li key={title}>
              <p className="font-semibold text-navy-900">{title}</p>
              <p className="mt-1">
                {body}
                {link && (
                  <>
                    {" "}
                    <a href={link.href} className={LINK} rel="noopener noreferrer">
                      {link.label}
                    </a>
                    .
                  </>
                )}
              </p>
            </li>
          ))}
        </ul>
      </Band>

      {/* 09: versions */}
      <Band id="versions">
        <Reveal>
          <SectionHeading eyebrow="09 · Versions" title="Versions and downloads" />
        </Reveal>
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            <p className="text-base text-ink-800">
              This page follows methodology version{" "}
              <strong className="tabular-nums text-navy-900">{meta.methodology_version}</strong> (
              {formatLongDate(meta.methodology_date)}). The full rules, with every change and the reason for it, are in{" "}
              <a href={DOC("methodology.md")} className={LINK} rel="noopener noreferrer">
                methodology.md
              </a>
              .
            </p>
            <ol className="mt-6 flex flex-col gap-3 border-l-2 border-outline-200 pl-6 text-base text-ink-800">
              {CHANGELOG.map(([version, date, text]) => (
                <li key={version}>
                  <span className="font-semibold tabular-nums text-navy-900">{version}</span>{" "}
                  <span className="text-sm text-ink-600">{date}</span>
                  <span className="block">{text}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="flex flex-col gap-4 lg:col-span-5">
            <a
              href={CSV_PATH}
              className="focus-ring pressable inline-flex min-h-12 items-center gap-2 self-start rounded-control border-2 border-blue-600 bg-white px-4 text-sm font-semibold text-blue-600 hover:border-navy-700 hover:text-navy-700"
            >
              <Download aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
              Download town statistics (CSV)
            </a>
            <p className="text-base text-ink-800">
              The code, the data pipeline, and every write-up are open on{" "}
              <a href={GITHUB_URL} className={LINK} rel="noopener noreferrer">
                GitHub
              </a>
              . Found a problem?{" "}
              <Link href="/contact" className={LINK}>
                Tell us
              </Link>
              .
            </p>
            <Disclaimer />
          </div>
        </div>
      </Band>

      <CtaBand
        title="Check your own home"
        text="Compare your assessment with recent sales in your town."
        href={NAV_CTA.href}
        label={NAV_CTA.label}
      />
    </main>
  );
}

/** "2024-10" -> "Oct '24" for chart ticks. */
function shortMonth(month: string): string {
  const [y, m] = month.split("-");
  const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${names[Number(m) - 1]} ’${y.slice(2)}`;
}

function MeasureCard({ title, plain, tex, label }: { title: ReactNode; plain: string; tex: string; label: string }) {
  return (
    <div className="flex h-full min-w-0 flex-col gap-3 rounded-card border border-outline-200 bg-white p-6">
      <h3 className="font-heading text-lg font-bold text-navy-900">{title}</h3>
      <p className="text-base text-ink-800">{plain}</p>
      <Formula tex={tex} label={label} />
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <li className="flex gap-4">
      <span aria-hidden="true" className="font-heading text-2xl font-bold tabular-nums text-blue-600">
        {String(n).padStart(2, "0")}
      </span>
      <div>
        <h3 className="font-heading text-lg font-bold text-navy-900">{title}</h3>
        <p className="mt-1">{children}</p>
      </div>
    </li>
  );
}

/** Methodology Section 7, in plain words. */
const LIMITATIONS: [string, string, { href: string; label: string }?][] = [
  ["No home features in the checker", "You give only a town and an assessed value, so we match homes by assessed value. Size, age, lot, condition, and updates are not used."],
  ["Matching by assessment is circular", "If your assessment is off, the homes we pick are tied to that number. That is why the checker says \"may\" and shows a range."],
  ["The checker rarely finds grounds on its own", "Homes matched by assessment have ratios close to yours, and close to the town's typical ratio, which is usually well inside the state's range. Your own estimate, like an appraisal, often matters more. We tested every town at many assessed values:", { href: `${GITHUB_URL}/blob/main/data/processed/checker_grounds_sweep.csv`, label: "see the results" }],
  ["Two- to four-family homes", "The state's residential class includes them, and the sales file can't separate them from single-family homes."],
  ["Coding errors", "Sale codes, property classes, and prices are typed in by people. A few errors will remain after cleaning."],
  ["The state removes extreme sales first", "Our spread measures describe the sales the state kept, so they may slightly understate how uneven assessments are."],
  ["Small towns", "Towns with under 20 clean sales get no statistics, only their state ratio, sales count, and the checker."],
  ["One price index for all of Bergen", "A town whose prices moved faster or slower than the county will be a little off."],
  ["No sales after June 30, 2026", "Prices are held flat from the last full month to October 1, 2026."],
  ["The state's ratio covers more than homes", "It includes land and commercial property, weights by price and class, and blends in last year, so our home median won't equal it."],
  ["This is not an appraisal", "It is a screening tool. An appeal needs your own evidence, and the assessments of other homes are not accepted as evidence."],
];

/** Methodology Section 9, in plain words. */
const CHANGELOG: [string, string, string][] = [
  ["1.6", "Oct 18, 2026", "How the checker is tested (two independent versions, 58 cases). New limitation: the checker rarely finds grounds from sales alone."],
  ["1.5", "Oct 15, 2026", "The price index chart starts at the checker's first month."],
  ["1.4", "Oct 15, 2026", "How the state computes its average ratio; a new check that rebuilds it."],
  ["1.3", "Oct 15, 2026", "Value quarters sorted by the IAAO value mix, not sale price; countywide numbers measured inside each town."],
  ["1.2", "Oct 15, 2026", "Outlier trimming runs per town and per file; lowercase condo codes count."],
  ["1.1", "Oct 15, 2026", "Multi-lot test fixed after checking the real files."],
  ["1.0", "Oct 14, 2026", "First full version."],
];
