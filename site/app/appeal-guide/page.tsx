import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Callout } from "@/components/Callout";
import { Band, Figure, LINK, Source, SourceLine } from "@/components/content/blocks";
import { CtaBand } from "@/components/CtaBand";
import { DataTable } from "@/components/DataTable";
import { Disclaimer } from "@/components/Disclaimer";
import { PageHeader } from "@/components/PageHeader";
import { Term } from "@/components/Term";
import { loadTowns } from "@/lib/data/load";
import { NAV_CTA } from "@/lib/nav";
import { pageMetadata } from "@/lib/seo";
import { FILING_FEES, weekendDeadlineNote } from "@/lib/towns";

export const metadata: Metadata = pageMetadata({
  path: "/appeal-guide",
  description:
    "How to appeal a property tax assessment in Bergen County for 2027: the deadline, the fee, the evidence the Board accepts, how to file, the hearing, and what Chapter 123 means for the outcome.",
});

/** When the sources in data/raw/notes/appeal-info.md were last checked (section 10: re-downloaded, unchanged). */
const LAST_CHECKED = "October 18, 2026";

const CHECK_BOARD = (
  <>
    Check with the <Source k="bergen_board">Bergen County Board of Taxation</Source>.
  </>
);

/**
 * "How to Appeal in Bergen County". Every legal or procedural fact comes ONLY
 * from data/raw/notes/appeal-info.md and is followed by its source link
 * (CLAUDE.md rule 5). Anything the notes don't cover says "Check with the
 * Bergen County Board of Taxation" instead of guessing.
 */
export default async function AppealGuidePage() {
  const towns = await loadTowns();
  const reval2027 = towns.filter((t) => t.revaluation_tax_year === 2027).map((t) => t.name).sort();

  return (
    <main className="flex-1">
      <PageHeader
        eyebrow="Appeal Guide"
        title="How to appeal in Bergen County"
        intro="Seven steps for a 2027 appeal of your home's assessed value: when, where, what it costs, and what to bring. Every rule here links to the official source."
        meta={<p className="text-sm text-ink-800">Sources last checked: {LAST_CHECKED}</p>}
      />

      <Band tight>
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
          <dl className="grid gap-6 sm:grid-cols-3 lg:col-span-8">
            <Figure label="Deadline for most towns" value="April 1, 2027" note="Or 45 days after notices are mailed, if later" />
            <Figure label="Towns with a 2027 revaluation" value="May 1, 2027" note="A Saturday; see step 1" />
            <Figure label="Filing fee" value="$5 to $150" note="Depends on your assessed value" />
          </dl>
          <div className="lg:col-span-4">
            <Callout tone="info" title="You file and present your own appeal">
              <p>Fair Assess NJ can&rsquo;t file for you or tell you whether you&rsquo;ll succeed. It can help you check whether an appeal is worth a closer look.</p>
            </Callout>
          </div>
        </div>
        <nav aria-label="Steps" className="mt-10">
          <ol className="flex flex-wrap gap-x-6 gap-y-2 text-base">
            {STEPS.map(([id, title], i) => (
              <li key={id}>
                <a href={`#${id}`} className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-control text-blue-600 hover:text-navy-700">
                  <span className="tabular-nums text-ink-600">{i + 1}</span>
                  <span className="underline underline-offset-4">{title}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </Band>

      <GuideStep n={1} id="deadline" title="Know your deadline" tone="mist">
        <p>
          Your appeal must be <strong className="text-navy-900">received</strong> by the Bergen County Board of
          Taxation, not just postmarked, on or before <strong className="text-navy-900">April 1 of the tax year</strong>{" "}
          (April 1, 2027), or 45 days after your town finishes mailing its Notification of Assessment, whichever is later.{" "}
          <Cite k="form_a1" />
        </p>
        <p>
          In a town with a town-wide revaluation or reassessment that year, the deadline is{" "}
          <strong className="text-navy-900">May 1 of the tax year</strong>. <Cite k="form_a1" /> <Cite k="nj_appeal_page" />
        </p>
        <p>{weekendDeadlineNote("May 1, 2027")}</p>
        <p>
          If the last day falls on a Saturday, Sunday, or legal holiday, it moves to the next business day. An appeal that
          arrives after closing time on the deadline is late and will be dismissed. <Cite k="form_a1" />
        </p>
        <div className="rounded-card bg-white p-6 ring-1 ring-outline-200">
          <p className="font-semibold text-navy-900">
            The {reval2027.length} Bergen towns on the county&rsquo;s 2027 revaluation or reassessment list
          </p>
          <p className="mt-2 text-base text-ink-800">{reval2027.join(", ")}.</p>
          <SourceLine className="mt-3">
            Source: <Source k="bergen_revaluations" />. If your town is on this list, confirm its exact deadline with the
            Board.
          </SourceLine>
        </div>
      </GuideStep>

      <GuideStep n={2} id="assessed-value" title="Find your assessed value">
        <p>
          Your town mails a <strong className="text-navy-900">Notification of Assessment</strong>. Its mailing date can
          set your deadline (step 1). <Cite k="form_a1" />
        </p>
        <p>
          The Board&rsquo;s web page links to a <Source k="bergen_property_search" />. <Cite k="bergen_board" /> Where the
          assessed value appears on your notice or tax bill, and when Bergen towns mail the 2027 notices:{" "}
          {CHECK_BOARD}
        </p>
        <p>
          <strong className="text-navy-900">You appeal the value, not the tax.</strong> Only the property value can be
          appealed, not the amount of taxes. <Cite k="form_a1" /> Property taxes come from your town&rsquo;s budget and
          can&rsquo;t be appealed. <Cite k="appeal_hearing_guide" />
        </p>
        <p>
          You can ask your town for a copy of your <strong className="text-navy-900">property record card</strong>; the
          town must give it to you at least 7 calendar days before your hearing. <Cite k="form_a1" />
        </p>
      </GuideStep>

      <GuideStep n={3} id="check" title="Check your assessment with Fair Assess NJ" tone="mist">
        <p>
          Our <Link href="/check" className={LINK}>appeal checker</Link> compares your home with recent sales in your
          town and applies the state&rsquo;s{" "}
          <Term definition="A New Jersey law (Chapter 123, Laws of 1973). If a home's assessment ratio is more than 15% above or below the town's average ratio, the County Board corrects the assessment.">
            Chapter 123
          </Term>{" "}
          test (step 7). It runs in your browser, and nothing you type is sent or saved.
        </p>
        <p>
          It is a screening tool, not evidence. Our list of sales does not include block and lot numbers, which the Board
          needs (step 4). If you have an appraisal or a recent purchase price, enter it as your own estimate.
        </p>
        <div>
          <Link
            href="/check"
            className="focus-ring pressable inline-flex min-h-12 items-center rounded-control bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-navy-700"
          >
            Check my assessment
          </Link>
        </div>
      </GuideStep>

      <GuideStep n={4} id="evidence" title="Gather your evidence">
        <p>
          <strong className="text-navy-900">The burden of proof is on you.</strong> By law, your current assessment is
          assumed to be correct, and you must overcome that to change it. <Cite k="bergen_board" /> You need enough
          evidence to show your home&rsquo;s true market value. <Cite k="appeal_hearing_guide" /> You must show what it was worth on{" "}
          <strong className="text-navy-900">October 1, 2026</strong>, the October 1 before the tax year.{" "}
          <Cite k="form_a1" /> All evidence should come from before that date, especially sales. <Cite k="appeal_hearing_guide" />
        </p>
        <ul className="flex list-disc flex-col gap-3 pl-6">
          <li>
            <strong className="text-navy-900">Comparable sales.</strong> Recent sales of homes like yours are accepted as
            evidence of market value. Give no more than 5. For each, include the block, lot, sale price, and deed date.{" "}
            <Cite k="form_a1" /> The state suggests 3 to 5 sales of homes with similar features, attached when you file.{" "}
            <Cite k="appeal_hearing_guide" /> If they are not with your petition, they must reach the assessor, the town
            clerk, and the Board at least 7 calendar days before the hearing. <Cite k="form_a1" />
          </li>
          <li>
            <strong className="text-navy-900">Not accepted:</strong> the assessments of other homes. Comparable{" "}
            <em>assessments</em> are not evidence of value. <Cite k="form_a1" />
          </li>
          <li>
            <strong className="text-navy-900">Photos and other facts.</strong> The Board may let you show photographs,
            a survey, cost data, and similar information about your home. <Cite k="form_a1" /> Photos of your home and
            the comparable homes help illustrate your argument. <Cite k="appeal_hearing_guide" />
          </li>
          <li>
            <strong className="text-navy-900">An appraisal.</strong> If you rely on one, give a written report to the
            Board (one for the tax administrator and each Board member) and one to each other party at least 7 calendar
            days before the hearing. The appraiser must come to the hearing to testify. <Cite k="form_a1" />
          </li>
        </ul>
      </GuideStep>

      <GuideStep n={5} id="file" title="File with the Bergen County Board of Taxation" tone="mist">
        <p>
          File the original petition of appeal (<Source k="form_a1">Form A-1</Source>) with the county board of
          taxation. <Cite k="form_a1" /> The Bergen Board urges everyone to{" "}
          <Source k="bergen_online_filing">file online</Source>. Its{" "}
          <Source k="bergen_paper_form">paper form</Source> must be hand delivered or mailed, and the Board also accepts
          appeals in person. <Cite k="bergen_board" />
        </p>
        <ul className="flex list-disc flex-col gap-2 pl-6">
          <li>
            Send a copy to your town&rsquo;s tax assessor and to the town clerk, with the same supporting documents. Keep
            a copy for yourself. <Cite k="form_a1" />
          </li>
          <li>Sign the petition. File a separate appeal for each taxed parcel. <Cite k="form_a1" /></li>
          <li>
            Keep paying your taxes: you must pay at least all taxes due through the first quarter of the year.{" "}
            <Cite k="form_a1" />
          </li>
        </ul>
        <div>
          <h3 className="font-heading text-lg font-bold text-navy-900">Filing fee</h3>
          <div className="mt-3 max-w-md">
            <DataTable label="Filing fees" caption="Filing fee by assessed value" maxHeight="max-h-none">
              <thead>
                <tr>
                  <th scope="col">Your assessed value</th>
                  <th scope="col" className="num">Fee</th>
                </tr>
              </thead>
              <tbody>
                {FILING_FEES.map((f) => (
                  <tr key={f.range}>
                    <td>{f.range}</td>
                    <td className="num">{f.fee}</td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </div>
          <p className="mt-3">
            The fee goes with your petition. Make checks payable to the County Tax Administrator. Fees are not refundable.{" "}
            <Cite k="form_a1" /> Whether the online system takes the fee online, and how: {CHECK_BOARD}
          </p>
        </div>
        <p className="text-base text-ink-800">
          Bergen County Board of Taxation: Two Bergen County Plaza, 1st Floor, Hackensack, NJ 07601-7076. Phone
          201-336-6300. <Cite k="bergen_board" />
        </p>
      </GuideStep>

      <GuideStep n={6} id="hearing" title="Prepare for the hearing">
        <p>
          On the form you choose an <strong className="text-navy-900">in-person hearing</strong>, a{" "}
          <strong className="text-navy-900">virtual hearing</strong> (the form says to check whether the county offers
          it), or a <strong className="text-navy-900">summary hearing</strong> decided only on the evidence you send,
          without you there. <Cite k="form_a1" /> Whether Bergen offers virtual hearings in 2027: {CHECK_BOARD}
        </p>
        <ul className="flex list-disc flex-col gap-3 pl-6">
          <li>
            <strong className="text-navy-900">Be there.</strong> You must attend unless you chose a summary hearing or
            are represented by a New Jersey attorney. <Cite k="form_a1" /> If you don&rsquo;t show up, the Board can rule
            against you for &ldquo;lack of prosecution,&rdquo; and that may stop a later appeal to the Tax Court.{" "}
            <Cite k="appeal_hearing_guide" />
          </li>
          <li>
            <strong className="text-navy-900">Delays are rare.</strong> No adjournments are granted except for
            extraordinary reasons. <Cite k="form_a1" />
          </li>
          <li>
            <strong className="text-navy-900">When.</strong> Hearings are generally held within 3 months of the filing
            deadline, and the Board must decide all appeals within 3 months of the last filing day.{" "}
            <Cite k="appeal_hearing_guide" /> For 2025, the Board posted its{" "}
            <Source k="bergen_hearing_dates_2025">hearing dates</Source> on its web page, and hearings were open to the
            public in person. <Cite k="bergen_board" /> The 2027 dates, and how you&rsquo;ll learn yours: {CHECK_BOARD}
          </li>
          <li>
            <strong className="text-navy-900">Summary hearings.</strong> Your evidence is the only basis for the
            decision, and you can&rsquo;t explain your comparable sales at the hearing, but you can send a written
            explanation. The Board may reject sales that aren&rsquo;t comparable. If you send an appraisal, you and the
            appraiser must appear. <Cite k="form_a1" />
          </li>
          <li>
            <strong className="text-navy-900">Your town can respond.</strong> It may file a cross appeal of your
            assessment; you&rsquo;ll be told and can appear. A settlement between you and the town must be approved by
            the Board. <Cite k="form_a1" />
          </li>
        </ul>
      </GuideStep>

      <GuideStep n={7} id="outcome" title="What Chapter 123 means for the outcome" tone="mist">
        <p>
          If the Board finds your home&rsquo;s ratio of assessed value to true value is above the upper limit or below the
          lower limit of the{" "}
          <Term definition="15% above and below the town's average ratio for the year, set by the state. A home's ratio outside this range is corrected on appeal.">
            common level range
          </Term>{" "}
          (15% around your town&rsquo;s average ratio), it must revise your assessment by applying the average ratio to
          your home&rsquo;s true value. <Cite k="form_a1" /> <Cite k="appeal_hearing_guide" />
        </p>
        <p>
          Your taxable value is your home&rsquo;s market value times your town&rsquo;s average ratio. If the average ratio
          is over 100%, your taxable value is your market value. <Cite k="form_a1" /> Below the range, the same rule can
          raise an assessment. <Cite k="form_a1" />
        </p>
        <p>
          <strong className="text-navy-900">After the decision.</strong> You can appeal to the Tax Court of New Jersey
          within 45 days of the date the judgment is mailed. If your assessed value is over $1,000,000, you may file with
          the Tax Court directly. <Cite k="form_a1" />
        </p>
        <p>
          <strong className="text-navy-900">The freeze.</strong> If no one appeals to the Tax Court, the Board&rsquo;s
          decision is &ldquo;frozen&rdquo; for that year and the next 2 years, unless your property&rsquo;s value
          changes a lot (for example, a town-wide revaluation). You can end the freeze by filing another appeal.{" "}
          <Cite k="form_a1" />
        </p>
        <p>
          See how your own town&rsquo;s numbers work in{" "}
          <Link href="/methodology#chapter-123" className={LINK}>
            How It Works
          </Link>{" "}
          or on your <Link href="/towns" className={LINK}>town&rsquo;s page</Link>.
        </p>
      </GuideStep>

      <Band tight>
        <Disclaimer />
        <SourceLine className="mt-4">
          Every fact on this page comes from these sources, last checked {LAST_CHECKED}: <Source k="form_a1" />;{" "}
          <Source k="appeal_hearing_guide" />; <Source k="nj_appeal_page" />; <Source k="bergen_board" />;{" "}
          <Source k="bergen_revaluations" />.
        </SourceLine>
      </Band>

      <CtaBand
        title="Check your own home first"
        text="See whether your assessment looks out of line with recent sales."
        href={NAV_CTA.href}
        label={NAV_CTA.label}
      />
    </main>
  );
}

const STEPS: [string, string][] = [
  ["deadline", "Know your deadline"],
  ["assessed-value", "Find your assessed value"],
  ["check", "Check your assessment"],
  ["evidence", "Gather evidence"],
  ["file", "File"],
  ["hearing", "Prepare for the hearing"],
  ["outcome", "What Chapter 123 means"],
];

/** A short source link after a fact: "(Form A-1)". */
function Cite({ k }: { k: "form_a1" | "appeal_hearing_guide" | "nj_appeal_page" | "bergen_board" }) {
  const short = {
    form_a1: "Form A-1",
    appeal_hearing_guide: "State hearing guide",
    nj_appeal_page: "NJ Division of Taxation",
    bergen_board: "Bergen County Board",
  }[k];
  return (
    <span className="whitespace-nowrap text-sm text-ink-600">
      (<Source k={k}>{short}</Source>)
    </span>
  );
}

/** One numbered step: number and heading on the left, the text on the right (12-column split). */
function GuideStep({
  n,
  id,
  title,
  tone = "white",
  children,
}: {
  n: number;
  id: string;
  title: string;
  tone?: "white" | "mist";
  children: ReactNode;
}) {
  return (
    <Band id={id} tone={tone}>
      <div className="grid gap-6 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <p className="font-heading text-4xl font-bold tabular-nums text-blue-600" aria-hidden="true">
              {String(n).padStart(2, "0")}
            </p>
            <h2 className="mt-2 font-heading text-2xl font-bold text-navy-900">
              <span className="sr-only">Step {n}: </span>
              {title}
            </h2>
          </div>
        </div>
        <div className="flex max-w-prose flex-col gap-4 text-base text-ink-800 lg:col-span-8">{children}</div>
      </div>
    </Band>
  );
}
