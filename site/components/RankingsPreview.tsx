import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatCount, labelInPlainWords, prbInPlainWords, townCaveats } from "@/lib/home";
import type { RankedTown } from "@/lib/home";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";
import { StatusPill } from "./StatusPill";

/** IAAO Standard on Ratio Studies (2013), the source of the PRD and PRB ranges (methodology 2.3). */
const IAAO_STANDARD_URL = "https://www.audits2.ga.gov/wp-content/uploads/2024/08/Standard_on_Ratio_Studies.pdf";

const LINK = "focus-ring font-semibold text-blue-600 underline underline-offset-4 hover:text-navy-700";

/**
 * The first towns in the rankings (sorted by PRB, most negative first), each
 * with its real label, PRB in plain words, and any caveats. Wording rule:
 * "shows a regressive pattern in recent sales", never "unfair town".
 */
export function RankingsPreview({
  towns,
  rankedCount,
  regressiveCount,
  leanRegressiveCount,
  alsoLabeled,
  salesSource,
}: {
  towns: RankedTown[];
  rankedCount: number;
  regressiveCount: number;
  /** Ranked towns whose whole PRB 95% range is below zero (county.json). */
  leanRegressiveCount: number;
  /** Towns labeled "Regressive pattern" that rank below the preview. */
  alsoLabeled: RankedTown[];
  salesSource: string;
}) {
  return (
    <section id="rankings" className="bg-white">
      <div className="mx-auto max-w-content px-6 py-20 sm:py-24">
        <Reveal>
          <SectionHeading
            eyebrow="Town rankings preview"
            title={`The ${towns.length} towns that lean most regressive`}
          />
          <div className="-mt-4 mb-10 flex max-w-prose flex-col gap-4 text-base text-ink-800 sm:mb-12">
            <p>
              We use two standard tests from the International Association of Assessing Officers (IAAO), the
              professional group for assessors. <strong className="font-semibold text-navy-900">PRB</strong> (price-related
              bias) shows how the assessment ratio changes as home value goes up.{" "}
              <strong className="font-semibold text-navy-900">PRD</strong> (price-related differential) compares the
              average ratio with a value-weighted one; above 1.03 means cheaper homes tend to have higher ratios.
            </p>
            <p>
              These are the first {towns.length} of the <span className="tabular-nums">{rankedCount}</span> towns with
              enough sales to rank, sorted by PRB. A town gets the &ldquo;Regressive pattern&rdquo; label only when both
              tests agree. <span className="tabular-nums">{regressiveCount}</span> towns do.
            </p>
            <p>
              A wider view: in <span className="tabular-nums">{leanRegressiveCount}</span> of the{" "}
              <span className="tabular-nums">{rankedCount}</span> towns, PRB is below zero across its whole 95% range.
              That means we are fairly sure their ratios fall as home values rise, even though most of them do not meet
              both tests for the label.
            </p>
          </div>
        </Reveal>

        <Reveal group className="flex flex-col gap-4">
          {towns.map((town) => {
            const caveats = townCaveats(town);
            return (
              <article
                key={town.slug}
                className="grid gap-4 rounded-card border border-outline-200 bg-white p-6 shadow-soft md:grid-cols-[auto_1fr_auto] md:items-start md:gap-8"
              >
                <p className="font-heading text-xl font-extrabold tabular-nums text-blue-600">
                  <span className="sr-only">Rank </span>
                  {town.rank}
                </p>
                <div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <h3 className="font-heading text-lg font-bold text-navy-900">{town.name}</h3>
                    <StatusPill status="neutral">{town.label}</StatusPill>
                  </div>
                  <p className="mt-2 text-base text-ink-800">{labelInPlainWords(town)}</p>
                  <p className="mt-1 text-base text-ink-600">{prbInPlainWords(town.stats.prb)}</p>
                  {caveats.length > 0 && (
                    <ul className="mt-2 flex flex-col gap-1 text-sm text-ink-600">
                      {caveats.map((note) => (
                        <li key={note} className="flex gap-2">
                          <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-400" />
                          {note}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <dl className="grid grid-cols-3 gap-x-6 gap-y-1 text-sm md:grid-cols-1 md:text-right">
                  <div>
                    <dt className="text-ink-600">PRB</dt>
                    <dd className="font-semibold tabular-nums text-navy-900">{town.stats.prb.toFixed(4)}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-600">PRD</dt>
                    <dd className="font-semibold tabular-nums text-navy-900">{town.stats.prd.toFixed(4)}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-600">Sales</dt>
                    <dd className="font-semibold tabular-nums text-navy-900">{formatCount(town.n_sales)}</dd>
                  </div>
                </dl>
              </article>
            );
          })}
        </Reveal>

        {alsoLabeled.map((t) => (
          <p key={t.slug} className="mt-6 max-w-prose text-base text-ink-800">
            Also labeled &ldquo;Regressive pattern&rdquo;:{" "}
            <strong className="font-semibold text-navy-900">{t.name}</strong>, rank{" "}
            <span className="tabular-nums">{t.rank}</span> (PRB <span className="tabular-nums">{t.stats.prb.toFixed(4)}</span>,
            PRD <span className="tabular-nums">{t.stats.prd.toFixed(4)}</span>). {townCaveats(t).join(" ")}
          </p>
        ))}

        <p className="mt-6 max-w-prose text-sm text-ink-600">
          Source: our analysis of NJ Division of Taxation SR1A sales ({salesSource}). IAAO ranges (PRD 0.98 to 1.03,
          PRB &minus;0.05 to +0.05):{" "}
          <a href={IAAO_STANDARD_URL} className={LINK} rel="noopener noreferrer">
            IAAO Standard on Ratio Studies, 2013
          </a>
          .
        </p>
        <Link href="/towns" className={`${LINK} mt-6 inline-flex min-h-12 items-center gap-1`}>
          See the full town rankings
          <ArrowRight aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
        </Link>
      </div>
    </section>
  );
}
