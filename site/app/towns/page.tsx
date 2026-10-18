import { Download } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ChartFrame } from "@/components/ChartFrame";
import { CtaBand } from "@/components/CtaBand";
import { DataTable } from "@/components/DataTable";
import { Disclaimer } from "@/components/Disclaimer";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { Term } from "@/components/Term";
import { ForestPlot } from "@/components/towns/ForestPlot";
import type { ForestPoint } from "@/components/towns/ForestPlot";
import { RankingsExplorer } from "@/components/towns/RankingsExplorer";
import { loadCounty, loadMeta, loadTowns } from "@/lib/data/load";
import { formatCount, formatLongDate, formatMonthYear } from "@/lib/home";
import { NAV_CTA } from "@/lib/nav";
import { SITE_NAME } from "@/lib/site";
import { SOURCES } from "@/lib/sources";
import { rankedTowns, signed4, sortRanked, unrankedTowns } from "@/lib/towns";

export const metadata: Metadata = {
  title: SITE_NAME,
  description:
    "How evenly each Bergen County town assesses single-family homes, ranked by the IAAO's price-related bias (PRB) test, from public NJ sales data.",
};

const LINK = "focus-ring font-semibold text-blue-600 underline underline-offset-4 hover:text-navy-700";
const CSV_PATH = "/downloads/fairassess-nj-town-stats.csv";

/**
 * Tool 1: Town Rankings. Every number comes from towns.json, county.json, and
 * meta.json (lib/data/load.ts). Rules: methodology Section 5. Wording rule:
 * describe patterns in the data, never accuse a town or assessor.
 */
export default async function TownsPage() {
  const [meta, county, towns] = await Promise.all([loadMeta(), loadCounty(), loadTowns()]);
  const ranked = sortRanked(rankedTowns(towns), "prb", "asc");
  const unranked = unrankedTowns(towns);
  const sales = meta.town_stats_sales;
  const period = `${formatMonthYear(sales.recorded_from)} to ${formatMonthYear(sales.recorded_to)}`;
  const points: ForestPoint[] = ranked.map((t) => ({
    slug: t.slug,
    name: t.name,
    rank: t.rank,
    label: t.label,
    prb: t.stats.prb,
    low: t.stats.prb_ci_low,
    high: t.stats.prb_ci_high,
    n: t.n_sales,
    limited: t.data_quality === "limited data",
  }));
  const byLabel = county.towns_by_label;

  return (
    <main className="flex-1">
      <PageHeader
        eyebrow="Tool 1"
        title="Town Rankings"
        intro={`How evenly each of Bergen County's ${meta.n_towns} towns assesses single-family homes, based on ${formatCount(sales.n_sales)} home sales recorded from ${period}.`}
      />

      <section className="bg-white">
        {/* Editorial split (Prompt 10B): how the tests work on the left, the label counts as figures on the right. */}
        <div className="mx-auto grid max-w-content gap-12 px-6 py-20 sm:py-24 lg:grid-cols-12 lg:gap-8">
          <Reveal className="flex max-w-prose flex-col gap-4 text-base text-ink-800 lg:col-span-7">
            <p className="text-lg">
              For every home that sold, we divide the town&rsquo;s assessed value by the sale price. That is the{" "}
              <Term definition="Assessed value divided by sale price. A home that sold for $500,000 and is assessed at $400,000 has a ratio of 80%. It shows what share of a home's value the town is taxing.">
                assessment ratio
              </Term>
              . In a fair town, cheap and expensive homes have similar ratios. We use three standard tests from the
              IAAO (International Association of Assessing Officers):
            </p>
            <ul className="flex flex-col gap-2 pl-6 [list-style:disc]">
              <li>
                <Term definition="Price-related bias. About how much the assessment ratio changes, in percent, each time a home's value doubles. -0.05 means the ratio falls about 5% when value doubles. The IAAO range is -0.05 to +0.05.">
                  PRB
                </Term>{" "}
                shows whether ratios fall or rise as home values go up. We rank towns by PRB.
              </li>
              <li>
                <Term definition="Price-related differential: the plain average ratio divided by a value-weighted average ratio. Above 1.03 means cheaper homes tend to have higher ratios. The IAAO range is 0.98 to 1.03.">
                  PRD
                </Term>{" "}
                is a second check on the same question.
              </li>
              <li>
                <Term definition="Coefficient of dispersion: how far, on average, each home's ratio sits from the town's typical ratio, as a percent. Lower means more even. IAAO says 15.0 or less for older, mixed areas like most of Bergen County.">
                  COD
                </Term>{" "}
                shows how even assessments are overall.
              </li>
            </ul>
            <p>
              A town gets the &ldquo;Regressive pattern&rdquo; label only when PRD and PRB both point the same way.
              These labels describe patterns in recent sales. They are not findings about any assessor.
            </p>
          </Reveal>
          <Reveal className="self-start rounded-card bg-mist-50 p-6 sm:p-8 lg:col-span-5">
            <h2 className="font-heading text-lg font-bold text-navy-900">
              The <span className="tabular-nums">{county.ranked_towns}</span> towns with enough sales
            </h2>
            <dl className="mt-4 flex flex-col">
              {(
                [
                  ["Regressive pattern", "show a regressive pattern"],
                  ["Progressive pattern", "show a progressive pattern"],
                  ["Within standards", "are within standards"],
                  ["Mixed signals", "show mixed signals"],
                ] as const
              ).map(([label, words]) => (
                <div key={label} className="flex items-baseline gap-4 border-b border-outline-200 py-3 last:border-b-0">
                  <dt className="text-base text-ink-800">{words}</dt>
                  {/* Shown first, read second: valid <dl> order is dt then dd. */}
                  <dd className="order-first w-12 shrink-0 text-right font-heading text-2xl font-bold tabular-nums text-navy-900">
                    {byLabel[label]}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      <section id="forest-plot" className="bg-mist-50">
        <div className="mx-auto max-w-content px-6 py-20 sm:py-24">
          <Reveal>
            <SectionHeading
              eyebrow="Every town at a glance"
              title="Where each town's PRB falls"
              description={`Each dot is one of the ${ranked.length} towns with enough sales. The line through it is its 95% range: we are 95% sure the true PRB is somewhere on that line.`}
            />
          </Reveal>
          <ChartFrame
            title="PRB by town, with 95% ranges"
            caption={
              <>
                Towns are sorted by PRB, most negative first. Dots left of the gold IAAO band lean regressive: cheaper
                homes were assessed at a higher share of their value. A long line means fewer sales and less
                certainty. Select a town to open its page.
              </>
            }
            source={
              <>
                Source: our analysis of{" "}
                <a href={SOURCES.sr1a.url} className={LINK} rel="noopener noreferrer">
                  NJ Division of Taxation SR1A sales
                </a>{" "}
                ({sales.source_file}, recorded {period}). IAAO range:{" "}
                <a href={SOURCES.iaao.url} className={LINK} rel="noopener noreferrer">
                  {SOURCES.iaao.label}
                </a>
                .
              </>
            }
            table={
              <DataTable label="PRB by town, as a table" caption="PRB and 95% range for each ranked town" maxHeight="max-h-[28rem]">
                <thead>
                  <tr>
                    <th scope="col" className="num">Rank</th>
                    <th scope="col">Town</th>
                    <th scope="col" className="num">PRB</th>
                    <th scope="col" className="num">95% range</th>
                    <th scope="col" className="num">Sales</th>
                  </tr>
                </thead>
                <tbody>
                  {points.map((p) => (
                    <tr key={p.slug}>
                      <td className="num">{p.rank}</td>
                      <td>{p.name}</td>
                      <td className="num">{signed4(p.prb)}</td>
                      <td className="num whitespace-nowrap">
                        {signed4(p.low)} to {signed4(p.high)}
                      </td>
                      <td className="num">{formatCount(p.n)}</td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            }
          >
            <ForestPlot points={points} />
          </ChartFrame>
        </div>
      </section>

      <section id="rankings" className="bg-white">
        <div className="mx-auto max-w-content px-6 py-20 sm:py-24">
          <Reveal>
            <SectionHeading
              eyebrow="The full rankings"
              title="Find your town"
              description="Search, filter, or sort. Select a town for its charts, the state's Chapter 123 numbers, and a link to the appeal checker."
            />
          </Reveal>
          <RankingsExplorer
            ranked={ranked}
            unranked={unranked}
            thinRevalCount={county.towns_by_data_quality["recent revaluation"]}
          />
        </div>
      </section>

      <section id="data" className="bg-mist-50">
        <div className="mx-auto max-w-content px-6 py-20 sm:py-24">
          <Reveal className="flex max-w-prose flex-col gap-4 text-base text-ink-800">
            <h2 className="font-heading text-2xl font-bold text-navy-900">Check our numbers</h2>
            <p>
              Every number on this page is in one open file, one row per town, with the same rounding you see here.
            </p>
            <a href={CSV_PATH} download className={`${LINK} inline-flex min-h-12 items-center gap-2 self-start`}>
              <Download aria-hidden="true" className="h-5 w-5" strokeWidth={2} />
              Download the data (CSV)
            </a>
            <p>
              How we clean the sales, compute each measure, and pick the labels is explained on{" "}
              <Link href="/methodology" className={LINK}>
                How It Works
              </Link>
              . Data as of {formatLongDate(meta.data_as_of)}. Methodology version {meta.methodology_version}.
            </p>
          </Reveal>
        </div>
      </section>

      <CtaBand
        title="Check your own home"
        text="Compare your assessment with recent sales in your town."
        href={NAV_CTA.href}
        label={NAV_CTA.label}
      />

      <div className="bg-mist-50">
        <div className="mx-auto max-w-content px-6 pb-16">
          <Disclaimer />
        </div>
      </div>
    </main>
  );
}
