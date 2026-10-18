import type { Metadata } from "next";
import { BalanceDivider } from "@/components/BalanceDivider";
import { CtaBand } from "@/components/CtaBand";
import { Disclaimer } from "@/components/Disclaimer";
import { FounderTeaser } from "@/components/FounderTeaser";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { RankingsPreview } from "@/components/RankingsPreview";
import { Reveal } from "@/components/Reveal";
import { StatCard } from "@/components/StatCard";
import { WhyItMatters } from "@/components/WhyItMatters";
import { loadCounty, loadMeta, loadTowns } from "@/lib/data/load";
import { formatCount, formatMonthYear, labeledOutsidePreview, monthsSpanned, rankingPreview } from "@/lib/home";
import { NAV_CTA } from "@/lib/nav";
import { pageMetadata } from "@/lib/seo";
import { SITE_DESCRIPTION } from "@/lib/site";

export const metadata: Metadata = pageMetadata({ path: "/", description: SITE_DESCRIPTION });

const SOURCE = "NJ Division of Taxation SR1A sales files";

/**
 * Home page. Every number comes from the pipeline's JSON (meta.json,
 * county.json, towns.json) through lib/data/load.ts.
 */
export default async function Home() {
  const [meta, county, towns] = await Promise.all([loadMeta(), loadCounty(), loadTowns()]);
  const sales = meta.town_stats_sales;
  const regressive = county.towns_by_label["Regressive pattern"];
  const from = formatMonthYear(sales.recorded_from);
  const to = formatMonthYear(sales.recorded_to);
  // Methodology 5.4: the rankings sort by PRB, most negative first.
  const preview = rankingPreview(towns, 5);

  return (
    <main className="flex-1">
      <Hero nTowns={meta.n_towns} />

      <section id="numbers" aria-labelledby="numbers-heading" className="bg-mist-50">
        <div className="mx-auto max-w-content px-6 pb-20 sm:pb-24">
          <h2 id="numbers-heading" className="sr-only">
            The numbers behind the study
          </h2>
          <Reveal group className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              value={formatCount(meta.n_towns)}
              label="Towns analyzed"
              summary={`Every town in Bergen County, using ${formatCount(county.n_sales)} home sales.`}
              explanation={`We looked at ${formatCount(county.n_sales)} home sales. We left out condos, sales the state says don't show a fair price, and a few very unusual sales. ${formatCount(county.ranked_towns)} towns had enough sales (20 or more) to rank.`}
              href="/methodology"
              source={SOURCE}
            />
            <StatCard
              value={formatCount(regressive)}
              label="Towns showing a regressive pattern"
              summary={`Out of ${formatCount(county.ranked_towns)} towns with enough sales. Cheaper homes there were assessed at a higher share of their value.`}
              explanation="We use two standard tests. A town gets this label only when both tests say cheaper homes are assessed too high compared to expensive ones."
              href="/towns"
              linkLabel="See the rankings"
              source={SOURCE}
            />
            <StatCard
              value={formatCount(county.ranked_towns_prb_range_below_zero)}
              label="Towns leaning regressive"
              summary={`Out of ${formatCount(county.ranked_towns)}. Cheaper homes tend to be assessed a bit higher, but not always by enough for the full label.`}
              explanation="In these towns, one test (PRB) shows the assessment share going down as home prices go up, and we are confident it is not just chance. The full label also needs a second test to agree."
              href="/towns"
              linkLabel="See the rankings"
              source={SOURCE}
            />
            <StatCard
              value={formatCount(monthsSpanned(sales.recorded_from, sales.recorded_to))}
              label="Months of recorded sales"
              summary={`Sales recorded from ${from} to ${to}.`}
              explanation={`We use the same year of sales the state used to set its ${meta.chapter123_tax_year} numbers. That lets us check our results against the state's.`}
              href="/methodology"
              source={SOURCE}
            />
          </Reveal>
        </div>
      </section>

      {/* One balance divider per page (Prompt 10B); after it, sections are set apart by white | mist tone steps. */}
      <BalanceDivider />
      <HowItWorks />
      <WhyItMatters />
      <RankingsPreview
        towns={preview}
        leanRegressiveCount={county.ranked_towns_prb_range_below_zero}
        alsoLabeled={labeledOutsidePreview(towns, preview)}
        rankedCount={county.ranked_towns}
        regressiveCount={regressive}
        salesSource={`${county.source_file}, recorded ${from} to ${to}`}
      />
      <FounderTeaser />
      <CtaBand
        title="Is your assessment fair? Find out in two minutes."
        text="Enter your town and assessed value. Everything runs in your browser; nothing you type is saved or sent."
        href={NAV_CTA.href}
        label={NAV_CTA.label}
        tone="navy"
      />

      <section aria-label="Disclaimer" className="bg-mist-50">
        <div className="mx-auto max-w-content px-6 pb-12">
          <Disclaimer />
        </div>
      </section>
    </main>
  );
}
