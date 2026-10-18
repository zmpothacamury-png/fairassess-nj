import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/Button";
import { Callout } from "@/components/Callout";
import { ChartFrame } from "@/components/ChartFrame";
import { CtaBand } from "@/components/CtaBand";
import { DataTable } from "@/components/DataTable";
import { Disclaimer } from "@/components/Disclaimer";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { StatCard } from "@/components/StatCard";
import { StatusPill } from "@/components/StatusPill";
import { Term } from "@/components/Term";
import { SaleScatter, TierChart } from "@/components/towns/LazyCharts";
import { loadCounty, loadFilterLog, loadMeta, loadTown, loadTowns, loadValidation } from "@/lib/data/load";
import type { TownFile, Validation } from "@/lib/data/schema";
import { tierRange } from "@/lib/chart";
import { formatCount, formatDollars, formatMonthYear, formatPercent } from "@/lib/home";
import { pageMetadata } from "@/lib/seo";
import { GITHUB_URL } from "@/lib/site";
import { SOURCES } from "@/lib/sources";
import type { SourceKey } from "@/lib/sources";
import {
  appealDeadline,
  weekendDeadlineNote,
  assessmentAt,
  ch123Triggers,
  FILING_FEES,
  LABEL_MEANING,
  labelStatus,
  prbTrendPoints,
  ratioPct,
  signed4,
  statePct,
  statLines,
  summarySentence,
  townNotes,
} from "@/lib/towns";

// One page per town, all built ahead of time. Any other slug is a 404.
export const dynamicParams = false;

export async function generateStaticParams() {
  const towns = await loadTowns();
  return towns.map((t) => ({ slug: t.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const town = await loadTown(slug);
  // ownImage: the town's generated share image (opengraph-image.tsx) applies.
  return pageMetadata({ path: `/towns/${town.slug}`, description: summarySentence(town), ownImage: true });
}

const LINK = "focus-ring font-semibold text-blue-600 underline underline-offset-4 hover:text-navy-700";
const QUARTER_NAMES = ["Lowest 25%", "Second 25%", "Third 25%", "Highest 25%"];
const QUARTER_SHORT = ["Lowest", "2nd", "3rd", "Highest"];

/** A link to one outside source, by key (lib/sources.ts). */
function Source({ k, children }: { k: SourceKey; children?: ReactNode }) {
  return (
    <a href={SOURCES[k].url} className={LINK} rel="noopener noreferrer">
      {children ?? SOURCES[k].label}
    </a>
  );
}

/**
 * One section with the site's standard padding. `tight` is for the short band
 * right under the page header, which needs less room than a full section.
 */
function Band({
  id,
  tone = "white",
  tight = false,
  children,
}: {
  id?: string;
  tone?: "white" | "mist";
  tight?: boolean;
  children: ReactNode;
}) {
  return (
    <section id={id} className={tone === "white" ? "bg-white" : "bg-mist-50"}>
      <div className={`mx-auto max-w-content px-6 ${tight ? "py-12 sm:py-16" : "py-20 sm:py-24"}`}>{children}</div>
    </section>
  );
}

/** One figure in a row of figures: a small label over a big number. */
function Figure({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-sm text-ink-600">{label}</dt>
      <dd className="mt-1 font-heading text-2xl font-bold tabular-nums text-navy-900">{value}</dd>
    </div>
  );
}

/**
 * One town's page. Every number comes from towns/<slug>.json plus the shared
 * files (lib/data/load.ts). Rules: methodology Sections 2, 5, 6.7, and 8.
 * Wording rule: describe patterns in the data, never accuse a town or assessor.
 */
export default async function TownPage({ params }: Props) {
  const { slug } = await params;
  const [town, meta, county, validation, filterLog] = await Promise.all([
    loadTown(slug),
    loadMeta(),
    loadCounty(),
    loadValidation(),
    loadFilterLog(),
  ]);
  const sales = meta.town_stats_sales;
  const period = `${formatMonthYear(sales.recorded_from)} to ${formatMonthYear(sales.recorded_to)}`;
  const notes = townNotes(town, {
    thinCount: county.towns_by_label["Not enough sales"],
    thinRevalCount: county.towns_by_data_quality["recent revaluation"],
    period,
  });
  const v = validation.towns.find((row) => row.district_code === town.district_code) ?? null;
  const salesSource = (
    <>
      Source: our analysis of <Source k="sr1a">NJ Division of Taxation SR1A sales</Source> ({sales.source_file},
      recorded {period}).
    </>
  );

  return (
    <main className="flex-1">
      {/* The label, rank, and sales count sit in the header (Prompt 10B), so they are in the first screen. */}
      <PageHeader
        eyebrow="Town Rankings · Bergen County"
        title={town.name}
        intro={summarySentence(town)}
        back={{ href: "/towns", label: "All town rankings" }}
        meta={
          <>
            <StatusPill status={labelStatus(town.label)}>{town.label}</StatusPill>
            {town.rank !== null && (
              <p className="text-base text-ink-800">
                Rank <span className="font-semibold tabular-nums text-navy-900">{town.rank}</span> of{" "}
                <span className="tabular-nums">{county.ranked_towns}</span> by PRB (1 = most negative)
              </p>
            )}
            <p className="text-base text-ink-800">
              <span className="font-semibold tabular-nums text-navy-900">{formatCount(town.n_sales)}</span> usable
              single-family {town.n_sales === 1 ? "sale" : "sales"}
            </p>
          </>
        }
      />

      {/* What the label means, and the notes that come with it. */}
      <Band tight>
        <Reveal className="flex flex-col gap-6">
          <p className="max-w-prose text-lg text-ink-800">{LABEL_MEANING[town.label]}</p>
          {notes.length > 0 && (
            <div className="grid gap-4 lg:grid-cols-2">
              {notes.map((n) => (
                <Callout key={n.id} tone={n.id === "limited" || n.id === "outliers" ? "caution" : "info"} title={n.title}>
                  <p>{n.body}</p>
                  {n.sources.length > 0 && (
                    <p className="mt-2 text-sm text-ink-600">
                      Source:{" "}
                      {n.sources.map((k, i) => (
                        <span key={k}>
                          {i > 0 && "; "}
                          <Source k={k} />
                        </span>
                      ))}
                      .
                    </p>
                  )}
                </Callout>
              ))}
            </div>
          )}
        </Reveal>
      </Band>

      {town.stats ? <StatsSections town={town} salesSource={salesSource} /> : null}

      <Chapter123Section town={town} />
      <StateComparison town={town} v={v} />
      <ContextSection town={town} />
      <DataNotes town={town} period={period} filterRules={filterLog.rules} />

      <CtaBand
        title={`Check your assessment in ${town.name}`}
        text="Compare your assessed value with recent sales in town. Nothing you type leaves your browser."
        href={`/check?town=${town.slug}`}
        label="Check my assessment"
      />

      <div className="bg-mist-50">
        <div className="mx-auto max-w-content px-6 pb-16">
          <Disclaimer />
        </div>
      </div>
    </main>
  );
}

// ---------------------------------------------------------------- stats: cards and charts

function StatsSections({ town, salesSource }: { town: TownFile; salesSource: ReactNode }) {
  const s = town.stats!;
  const lines = statLines(s);
  const explanations: Record<string, string> = {
    median: "Assessed value divided by sale price, for every sale. The median is the middle one. New Jersey towns assess homes at a share of market value on purpose, and the state's Chapter 123 test handles that level, so IAAO's level test does not apply here.",
    cod: "Coefficient of dispersion: how far, on average, each home's ratio sits from the town's typical ratio, as a percent. Lower means more even. IAAO says 15.0 or less for older, mixed areas like most of Bergen County, and 10.0 or less for newer, more similar areas.",
    prd: "Price-related differential: the plain average ratio divided by a value-weighted average ratio. Above 1.03 means cheaper homes tend to have higher ratios than expensive homes. Below 0.98 means the opposite.",
    prb: "Price-related bias: about how much the ratio changes, in percent, each time a home's value doubles. A PRB of -0.05 means the ratio falls about 5% when value doubles. IAAO's range is -0.05 to +0.05.",
  };
  const bars = town.tiers.map((t) => ({
    tier: t.tier,
    name: QUARTER_NAMES[t.tier - 1],
    shortName: QUARTER_SHORT[t.tier - 1],
    range: tierRange(t.value_low, t.value_high),
    ratio: t.median_ratio,
  }));
  const values = town.scatter.map((p) => p.value);
  const trend = prbTrendPoints(Math.min(...values), Math.max(...values), s).map((p) => ({ value: p.value, ratio: p.trend }));
  const sampling = town.scatter_sampling;
  const hasT7 = town.tiers.some((t) => t.share_above_upper !== null);

  return (
    <>
      <Band id="numbers" tone="mist">
        <Reveal>
          <SectionHeading
            eyebrow="01 · Key numbers"
            title="Four standard measures"
            description="Each card shows our number, its 95% range (where the true value very likely falls), and the IAAO range."
          />
        </Reveal>
        {/* 4 across only from 1280px: PRB values like "−0.0980" need the room. */}
        <Reveal group className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {lines.map((l) => (
            <StatCard
              key={l.key}
              value={l.value}
              label={l.label}
              summary={l.sentence}
              explanation={explanations[l.key]}
              source="NJ Division of Taxation SR1A sales"
              details={
                <>
                  <span className="tabular-nums">{l.range}</span>
                  <span>{l.iaao}</span>
                  {l.meets !== null && (
                    <span>
                      <StatusPill status={l.meets ? "within-range" : "may-have-grounds"}>
                        {l.meets ? "Inside IAAO range" : "Outside IAAO range"}
                      </StatusPill>
                    </span>
                  )}
                </>
              }
            />
          ))}
        </Reveal>
        <p className="mt-6 max-w-prose text-sm text-ink-600">
          {salesSource} IAAO ranges: <Source k="iaao" />.
        </p>
      </Band>

      <Band id="charts">
        <Reveal>
          <SectionHeading
            eyebrow="02 · Charts"
            title="Cheaper homes compared with pricier homes"
            description="If assessments were perfectly even, every bar would sit on the gold line, and the gold trend line in the second chart would be flat."
          />
        </Reveal>
        <div className="flex flex-col gap-10">
          <ChartFrame
            title="Assessment ratio by home value"
            caption={
              <>
                We sorted {town.name}&rsquo;s {formatCount(town.n_sales)} sales by home value and split them into 4
                equal groups. Each bar is the median ratio in one group. Home value here mixes the sale price with the
                assessment, the way IAAO does, so one lucky or unlucky sale price does not decide which group a home
                lands in.
              </>
            }
            source={salesSource}
            table={
              <DataTable label="Assessment ratio by home value, as a table" caption="Median assessment ratio in each value quarter">
                <thead>
                  <tr>
                    <th scope="col">Value quarter</th>
                    <th scope="col" className="num">Home values</th>
                    <th scope="col" className="num">Sale prices</th>
                    <th scope="col" className="num">Sales</th>
                    <th scope="col" className="num">Median ratio</th>
                    {hasT7 && <th scope="col" className="num">Above the Chapter 123 upper line</th>}
                  </tr>
                </thead>
                <tbody>
                  {town.tiers.map((t) => (
                    <tr key={t.tier}>
                      <td>{QUARTER_NAMES[t.tier - 1]}</td>
                      <td className="num whitespace-nowrap">
                        {formatDollars(t.value_low)} to {formatDollars(t.value_high)}
                      </td>
                      <td className="num whitespace-nowrap">
                        {formatDollars(t.sale_price_low)} to {formatDollars(t.sale_price_high)}
                      </td>
                      <td className="num">{t.n}</td>
                      <td className="num">{ratioPct(t.median_ratio)}</td>
                      {hasT7 && (
                        <td className="num">
                          {t.share_above_upper === null ? "Not shown" : `${formatPercent(t.share_above_upper)} (${t.n_above_upper})`}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            }
          >
            <TierChart bars={bars} median={s.median_ratio} />
          </ChartFrame>

          <ChartFrame
            title="Every sale"
            caption={
              <>
                Each dot is one sale: its assessment ratio (up) against its home value (across). Value is on a log
                scale, so each step to the right is the same percent increase. The gold line is the PRB trend line.
                It slopes {s.prb < 0 ? "down" : "up"} because {town.name}&rsquo;s PRB is {signed4(s.prb)}.{" "}
                {sampling.n_shown < sampling.n_sales
                  ? `This chart shows ${formatCount(sampling.n_shown)} of the ${formatCount(sampling.n_sales)} sales, picked at evenly spaced positions from lowest to highest value (including both ends). Every statistic uses all ${formatCount(sampling.n_sales)}.`
                  : `All ${formatCount(sampling.n_sales)} sales are shown.`}
              </>
            }
            source={salesSource}
            table={
              <DataTable label="Every sale, as a table" caption="Home value and assessment ratio for each sale shown in the chart" maxHeight="max-h-[24rem]">
                <thead>
                  <tr>
                    <th scope="col" className="num">Home value</th>
                    <th scope="col" className="num">Assessment ratio</th>
                  </tr>
                </thead>
                <tbody>
                  {town.scatter.map((p, i) => (
                    <tr key={i}>
                      <td className="num">{formatDollars(p.value)}</td>
                      <td className="num">{ratioPct(p.ratio)}</td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            }
          >
            <SaleScatter points={town.scatter} trend={trend} />
          </ChartFrame>
        </div>
      </Band>
    </>
  );
}

// ---------------------------------------------------------------- Chapter 123

function Chapter123Section({ town }: { town: TownFile }) {
  const ch = town.ch123;
  const trig = ch123Triggers(ch);
  const deadline = appealDeadline(town);
  const reval2027 = town.revaluation_tax_year === 2027;
  const avgPrice = town.avg_residential?.avg_sale_price ?? null;
  const q1 = town.tiers.find((t) => t.tier === 1);
  const q4 = town.tiers.find((t) => t.tier === 4);
  const showT7 = !reval2027 && q1?.share_above_upper != null && q4?.share_above_upper != null;

  return (
    <Band id="chapter-123" tone="mist">
      <Reveal>
        <SectionHeading eyebrow="03 · Appeals" title="Chapter 123: the state's range for 2027 appeals" />
      </Reveal>
      <Reveal className="split-accent flex flex-col gap-6 overflow-hidden rounded-card border border-outline-200 bg-white p-6 sm:p-8">
        {/* The state's three numbers as figures first (Prompt 10B); the sentence below explains them. */}
        <dl className="grid grid-cols-1 gap-4 border-b border-outline-200 pb-6 pt-2 sm:grid-cols-3 sm:gap-8">
          <Figure label={`State average ratio, ${ch.tax_year}`} value={statePct(ch.average_ratio)} />
          <Figure label="Common level range: lower limit" value={statePct(ch.lower_limit)} />
          <Figure label="Common level range: upper limit" value={statePct(ch.upper_limit)} />
        </dl>
        <div className="flex max-w-prose flex-col gap-4 text-base text-ink-800">
          <p className="text-lg">
            For tax year {ch.tax_year} appeals, the state set {town.name}&rsquo;s{" "}
            <Term definition="The state's estimate of the share of market value this town assesses at, for all property. The Director of the Division of Taxation sets it each year as of October 1.">
              average ratio
            </Term>{" "}
            at <strong className="tabular-nums text-navy-900">{statePct(ch.average_ratio)}</strong>. The{" "}
            <Term definition="15% above and below the town's average ratio. If a home's assessment divided by its market value is outside this range, the County Board corrects it.">
              common level range
            </Term>{" "}
            runs from <strong className="tabular-nums text-navy-900">{statePct(ch.lower_limit)}</strong> to{" "}
            <strong className="tabular-nums text-navy-900">{statePct(ch.upper_limit)}</strong>.
          </p>

          {reval2027 ? (
            <Callout tone="caution" title="Chapter 123 may not apply here in 2027">
              <p>
                {town.name} is on the county&rsquo;s list of towns getting a town-wide revaluation or reassessment for
                tax year 2027. The state says Chapter 123 does not apply in the year a town puts a town-wide
                revaluation into effect. For a reassessment, the County Board&rsquo;s own rules decide, and the
                county&rsquo;s list does not say which one {town.name} is having. So our checker does not give a
                Chapter 123 result for {town.name}. It still
                estimates your home&rsquo;s market value from recent sales. Our numbers use the assessments from before
                the change. Wait for your 2027 assessment notice, then compare it with that estimate. The appeal
                deadline for these towns is May 1.
              </p>
              <p className="mt-2 text-sm text-ink-600">
                Sources: <Source k="ch123_definitions" />; <Source k="bergen_revaluations" />.
              </p>
            </Callout>
          ) : (
            <>
              <p>
                <strong className="text-navy-900">What it means for an appeal.</strong> Divide your assessed value by
                what your home was worth on October 1, 2026. If the result is above{" "}
                <strong className="tabular-nums">{statePct(trig.upper)}</strong>, you may have grounds to appeal: the
                County Board can lower your assessment to your home&rsquo;s value times{" "}
                <span className="tabular-nums">{trig.averageCapped ? "100%" : statePct(ch.average_ratio)}</span>. If it
                is below <strong className="tabular-nums">{statePct(trig.lower)}</strong>, an appeal could lead the
                Board to <em>raise</em> your assessment. In between, Chapter 123 does not change it.
              </p>
              {(trig.upperCapped || trig.averageCapped || trig.lowerCapped) && (
                <p>
                  The state counts any ratio above 100% as 100%.
                  {trig.upperCapped &&
                    ` So although the printed upper limit is ${statePct(ch.upper_limit)}, a ratio above 100% already counts as too high.`}
                  {trig.averageCapped &&
                    ` The average ratio is above 100%, so the Board would set the assessment at the home's full market value.`}
                  {trig.lowerCapped && ` The printed lower limit is ${statePct(ch.lower_limit)}, so the lower line is also 100%.`}
                </p>
              )}
              {avgPrice !== null && (
                <p>
                  <strong className="text-navy-900">Example.</strong> A home worth{" "}
                  <span className="tabular-nums">{formatDollars(avgPrice)}</span> (the state&rsquo;s{" "}
                  {town.avg_residential!.year} average residential sale price in {town.name}) is above the range if it
                  is assessed above <span className="tabular-nums">{formatDollars(assessmentAt(avgPrice, trig.upper))}</span>
                  {trig.upper === 100 ? ", its full value" : ""}.
                </p>
              )}
              {showT7 && (
                <p>
                  In recent sales, <span className="tabular-nums">{formatPercent(q1!.share_above_upper!)}</span> of homes
                  in the lowest value quarter had a ratio above the upper line, compared with{" "}
                  <span className="tabular-nums">{formatPercent(q4!.share_above_upper!)}</span> in the highest value
                  quarter.
                </p>
              )}
            </>
          )}
          <p className="text-sm text-ink-600">
            Sources: <Source k="ch123_2027" />; <Source k="ch123_definitions" />.
          </p>
        </div>

        {/* Deadline and fee wherever appeals come up (CLAUDE.md rule 7; methodology K13). */}
        <div className="grid gap-6 border-t border-outline-200 pt-6 md:grid-cols-2">
          <div className="text-base text-ink-800">
            <p className="font-semibold text-navy-900">
              Appeal deadline: <span className="tabular-nums">{deadline.date}</span>
            </p>
            <p className="mt-1">{deadline.detail}</p>
            {weekendDeadlineNote(deadline.date) && <p className="mt-1">{weekendDeadlineNote(deadline.date)}</p>}
            <p className="mt-1">
              The County Board must receive your appeal by then. A postmark is not enough. If the deadline falls on a
              weekend or legal holiday, it moves to the next business day.
            </p>
          </div>
          <div className="text-base text-ink-800">
            <p className="font-semibold text-navy-900">Filing fee (set by your assessed value)</p>
            <ul className="mt-1 flex flex-col gap-1 tabular-nums">
              {FILING_FEES.map((f) => (
                <li key={f.range} className="flex justify-between gap-4 border-b border-outline-200 py-1">
                  <span>{f.range}</span>
                  <span className="font-semibold text-navy-900">{f.fee}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-sm text-ink-600 md:col-span-2">
            Source: <Source k="form_a1" />. Confirm deadlines, fees, and forms with the <Source k="bergen_board" />.
          </p>
        </div>

        <Button href={`/check?town=${town.slug}`} size="lg" className="self-start">
          Check my assessment in {town.name}
        </Button>
      </Reveal>
    </Band>
  );
}

// ---------------------------------------------------------------- our numbers vs the state's (methodology Section 8)

function StateComparison({ town, v }: { town: TownFile; v: Validation["towns"][number] | null }) {
  if (!v) return null;
  const gap = v.diff_class2_median_pp;
  return (
    <Band id="state-comparison">
      <Reveal>
        <SectionHeading eyebrow="04 · Checking our work" title="How our numbers compare with the state's" />
      </Reveal>
      <Reveal className="grid gap-8 lg:grid-cols-[2fr_3fr]">
        {/* One tinted panel of figures instead of four outlined boxes (Prompt 10B). */}
        <dl className="grid grid-cols-2 content-start gap-x-6 gap-y-6 self-start rounded-card bg-mist-50 p-6">
          <Figure label={<>State&rsquo;s 2027 average ratio</>} value={statePct(v.state_average_ratio)} />
          <Figure
            label="Our single-family median"
            value={v.our_class2_median === null ? "No sales" : statePct(v.our_class2_median)}
          />
          {v.our_ratio_state_style !== null && v.state_one_year_ratio !== null && (
            <>
              <Figure label={<>State&rsquo;s one-year ratio</>} value={statePct(v.state_one_year_ratio)} />
              <Figure label="Our rebuild of it" value={statePct(v.our_ratio_state_style)} />
            </>
          )}
        </dl>
        <div className="flex max-w-prose flex-col gap-4 text-base text-ink-800">
          {gap !== null && v.our_class2_median !== null ? (
            <p>
              Our median for single-family homes is{" "}
              <span className="tabular-nums">
                {Math.abs(gap).toFixed(2)} points {gap < 0 ? "lower" : "higher"}
              </span>{" "}
              than the state&rsquo;s average ratio. A gap is expected. The state&rsquo;s ratio also covers land and
              commercial property, gives more weight to expensive sales, and blends this year&rsquo;s sales with last
              year&rsquo;s values.
              {town.revaluation_tax_year === 2026 &&
                ` Because ${town.name} put new assessments in place for 2026, half of that blend still comes from values measured before the revaluation.`}
              {!town.stats &&
                ` With only ${town.n_sales} ${town.n_sales === 1 ? "sale" : "sales"}, our median is a rough number. That is why this page shows no other statistics.`}
            </p>
          ) : (
            <p>We have no single-family sales in {town.name} to compare with the state&rsquo;s ratio.</p>
          )}
          {v.our_ratio_state_style !== null && v.diff_one_year_pp !== null && (
            <p>
              To check our data, we rebuilt the state&rsquo;s own one-year ratio from the same sales, using the
              state&rsquo;s method. We got <span className="tabular-nums">{statePct(v.our_ratio_state_style)}</span>{" "}
              and the state&rsquo;s figure works out to{" "}
              <span className="tabular-nums">{statePct(v.state_one_year_ratio!)}</span>, a difference of{" "}
              <span className="tabular-nums">{Math.abs(v.diff_one_year_pp).toFixed(2)}</span> points.
              {v.flag_over_5pp
                ? " That is more than 5 points, so we flagged this town for review."
                : " That is within our 5-point check."}
            </p>
          )}
          {v.v3_flag_over_10pp && (
            <p>
              The gap between our median and the state&rsquo;s ratio is more than 10 points, so we looked into it. The
              rebuild above shows the state&rsquo;s method explains it.
            </p>
          )}
          <p className="text-sm text-ink-600">
            Sources: <Source k="ch123_2027" />; how the state computes its ratio: <Source k="tax_court_method" />. Full
            write-up:{" "}
            <a href={`${GITHUB_URL}/blob/main/docs/validation.md`} className={LINK} rel="noopener noreferrer">
              our validation report
            </a>
            .
          </p>
        </div>
      </Reveal>
    </Band>
  );
}

// ---------------------------------------------------------------- context

function ContextSection({ town }: { town: TownFile }) {
  const avg = town.avg_residential;
  const rate = town.tax_rate;
  if (!avg && !rate) return null;
  return (
    <Band id="context" tone="mist">
      <Reveal>
        <SectionHeading eyebrow="05 · Context" title={`${town.name} at a glance`} />
      </Reveal>
      {/* One white panel, three figures side by side (Prompt 10B; was three outlined cards). */}
      <Reveal group className="grid gap-8 rounded-card border border-outline-200 bg-white p-6 sm:p-8 md:grid-cols-3">
        {avg && (
          <div>
            <p className="text-sm text-ink-600">Average residential sale price, {avg.year}</p>
            <p className="mt-1 font-heading text-2xl font-bold tabular-nums text-navy-900">{formatDollars(avg.avg_sale_price)}</p>
            <p className="mt-2 text-sm text-ink-600">
              From <span className="tabular-nums">{formatCount(avg.n_sales)}</span> residential sales the state counted.
            </p>
          </div>
        )}
        {avg && (
          <div>
            <p className="text-sm text-ink-600">Average residential assessment, {avg.year}</p>
            <p className="mt-1 font-heading text-2xl font-bold tabular-nums text-navy-900">{formatDollars(avg.avg_assessment)}</p>
            <p className="mt-2 text-sm text-ink-600">
              Across <span className="tabular-nums">{formatCount(avg.line_items)}</span> residential properties.
            </p>
          </div>
        )}
        {rate && (
          <div>
            <p className="text-sm text-ink-600">General tax rate, {rate.year}</p>
            <p className="mt-1 font-heading text-2xl font-bold tabular-nums text-navy-900">${rate.general_tax_rate.toFixed(3)}</p>
            <p className="mt-2 text-sm text-ink-600">Per $100 of assessed value. {rate.year} is the newest year we have.</p>
          </div>
        )}
      </Reveal>
      <p className="mt-6 max-w-prose text-sm text-ink-600">
        We do not show an average tax bill. Our newest tax rate is from {rate?.year ?? "an earlier year"}, and the
        assessments are from {avg?.year ?? "a different year"}, so multiplying them would not give a real bill. Sources:{" "}
        {avg && <Source k="avg_residential_2026" />}
        {avg && rate && "; "}
        {rate && <Source k="tax_rates_2025" />}.
      </p>
    </Band>
  );
}

// ---------------------------------------------------------------- data notes

function DataNotes({
  town,
  period,
  filterRules,
}: {
  town: TownFile;
  period: string;
  filterRules: { rule_id: string; description: string }[];
}) {
  const rows = town.filter_log.filter((r) => r.source_file === "Sales2026");
  const describe = new Map(filterRules.map((r) => [r.rule_id, r.description]));
  const first = rows[0];
  const last = rows[rows.length - 1];
  return (
    <Band id="data-notes">
      <Reveal>
        <SectionHeading eyebrow="06 · Data notes" title="Where these numbers come from" />
      </Reveal>
      <Reveal className="grid gap-8 lg:grid-cols-2">
        <div className="flex max-w-prose flex-col gap-4 text-base text-ink-800">
          <p>
            The statistics use the state&rsquo;s SR1A sales file for deeds recorded from {period}. That is the same
            year of sales the state used to set {town.name}&rsquo;s 2027 ratio.
          </p>
          {first && last && (
            <p>
              The file has <span className="tabular-nums">{formatCount(first.rows_in)}</span> records for {town.name}.
              After our cleaning rules, <span className="tabular-nums">{formatCount(last.rows_out)}</span> usable
              single-family sales remain. The table shows how many each rule removed.
            </p>
          )}
          {town.stats && <p>The 95% ranges come from 2,000 resamples of the sales (a bootstrap); PRB&rsquo;s comes from its regression.</p>}
          <p>
            Every rule is explained on{" "}
            <Link href="/methodology" className={LINK}>
              How It Works
            </Link>
            .
          </p>
        </div>
        {rows.length > 0 && (
          <DataTable label={`Sales removed by each cleaning rule in ${town.name}`} caption="Records removed by each cleaning rule, in order">
            <thead>
              <tr>
                <th scope="col">Rule</th>
                <th scope="col" className="num">Removed</th>
                <th scope="col" className="num">Left</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.rule_id}>
                  <td>
                    <span className="font-semibold text-navy-900">{r.rule_id}</span> {describe.get(r.rule_id)}
                  </td>
                  <td className="num">{formatCount(r.rows_removed)}</td>
                  <td className="num">{formatCount(r.rows_out)}</td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </Reveal>
    </Band>
  );
}
