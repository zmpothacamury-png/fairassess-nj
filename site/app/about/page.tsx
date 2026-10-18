import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CtaBand } from "@/components/CtaBand";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { loadValidation } from "@/lib/data/load";
import { formatCount } from "@/lib/home";
import { GITHUB_URL, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: SITE_NAME,
  description: "Who built Fair Assess NJ, why, and the values behind it.",
};

/** The full write-up of our check against the state's ratios (docs/validation.md). */
const VALIDATION_URL = `${GITHUB_URL}/blob/main/docs/validation.md`;

const LINK = "focus-ring font-semibold text-blue-600 underline underline-offset-4 hover:text-navy-700";

/*
 * "The Story" is Zaden's own words (private/about-founder.md), used with his
 * approval. Keep them word for word; the only change is the website's name
 * spacing, "Fair Assess NJ". CLAUDE.md rule 5 exception: these paragraphs show
 * no source links. Their two outside facts are backed up in
 * data/raw/notes/about-page-facts.md.
 */
const STORY = [
  "New Jersey has some of the highest property taxes in the country, yet a confusing assessment system keeps most homeowners from ever questioning their bill. With a long-standing passion for finance, I created Fair Assess NJ to change that.",
  "My background includes running Trust & Transition, a free financial planning series for families of adults with special needs. Through my work with dozens of families, I’ve seen firsthand how a seemingly “small” financial difference can be life-changing, and how often everyday people lack the time or tools to verify if the numbers they’re given are actually fair.",
  "When I began researching property assessments, I discovered a troubling national trend: lower-priced homes are frequently over-assessed compared to more expensive ones. This means the families who can least afford it are often carrying an unfair tax burden. I wanted to know if this was happening right here in Bergen County—and more importantly, I wanted to create a solution. While the data to check these assessments is public, it’s buried in massive state spreadsheets. Fair Assess NJ takes that complex data and makes it simple, accessible, and actionable for every homeowner.",
];

/**
 * About page in T&T's About structure (docs/site-format.md): founder header,
 * The Story, What Drives This Work, and a closing band to Contact. No team
 * section (no other names given).
 */
export default async function AboutPage() {
  const validation = await loadValidation();
  const { one_year_within_flag: within, n_towns: nTowns } = validation.summary;
  const flagPoints = validation.thresholds.v4_flag_pp;

  const values = [
    {
      title: "Accuracy",
      body: (
        <>
          Every number comes from public State of New Jersey data and the standard methods assessors use. We checked
          our work against the state&rsquo;s own numbers. Done the state&rsquo;s way, our results came within{" "}
          <span className="tabular-nums">{flagPoints}</span> percentage points of the state&rsquo;s in{" "}
          <span className="tabular-nums">
            {formatCount(Number(within))} of {formatCount(Number(nTowns))}
          </span>{" "}
          towns.
        </>
      ),
      link: { href: "/methodology", label: "How it works" },
    },
    {
      title: "Transparency",
      body: <>Our methods, code, and results are open. Anyone can download the town results and check them.</>,
      link: { href: "/downloads/fairassess-nj-town-stats.csv", label: "Download the town results (CSV)", external: true },
    },
    {
      title: "Privacy",
      body: (
        <>
          The appeal checker runs in your own browser. Nothing you type is sent, saved, or logged. We never ask for
          your name or address.
        </>
      ),
      link: { href: "/privacy", label: "Privacy" },
    },
    {
      title: "Free & accessible",
      body: <>Free for every homeowner, with no account needed, and written in plain English.</>,
      link: { href: "/check", label: "Try the appeal checker" },
    },
  ];

  return (
    <main className="flex-1">
      {/* Founder header (T&T about.html:90-100), in Fair Assess NJ colors like every inner page header. */}
      <header className="relative bg-blue-100">
        {/* Only the watermark is clipped, so the pivot dot below can hang past the header's edge. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <Image
            src="/nj-outline.png"
            alt=""
            width={1179}
            height={2091}
            className="absolute -right-10 -top-10 h-[160%] w-auto max-w-none opacity-60 select-none sm:right-[6%]"
          />
        </div>
        <div className="relative mx-auto grid max-w-content items-center gap-10 px-6 pb-14 pt-16 md:grid-cols-[auto_1fr] md:gap-14">
          <Reveal>
            <Image
              src="/logo-icon.png"
              alt="Fair Assess NJ logo: a house on balance scales over an outline of New Jersey"
              width={394}
              height={698}
              priority
              className="h-40 w-auto sm:h-52"
            />
          </Reveal>
          <Reveal group>
            <p className="eyebrow flex items-center gap-2 text-blue-600">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-gold-400" />
              About the Founder
            </p>
            <h1 className="mt-4 font-heading text-3xl font-bold text-navy-900">Zaden Pothacamury</h1>
            <p className="mt-2 font-semibold text-navy-700">Founder, Fair Assess NJ</p>
            <p className="mt-4 max-w-prose text-lg text-ink-800">
              Fair Assess NJ was founded by Zaden Pothacamury, a junior at Ramapo High School in Franklin Lakes, New
              Jersey. He built it so any Bergen County homeowner can check whether their assessment is fair, using
              public data, for free.
            </p>
          </Reveal>
        </div>
        <div aria-hidden="true" className="relative z-10 flex items-center">
          <span className="h-1 flex-1 bg-blue-600" />
          <span className="h-1 flex-1 bg-green-600" />
          <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-400" />
        </div>
      </header>

      <section id="story" className="bg-white">
        {/* Editorial split (Prompt 10B): the heading stays in view on the left while the story reads on the right. */}
        <div className="mx-auto grid max-w-content gap-2 px-6 py-20 sm:py-24 lg:grid-cols-12 lg:gap-8">
          <Reveal className="lg:col-span-4">
            <div className="lg:sticky lg:top-28">
              <SectionHeading eyebrow="The Story" title="Why Fair Assess NJ exists" />
            </div>
          </Reveal>
          <Reveal group className="flex max-w-prose flex-col gap-6 text-lg text-ink-800 lg:col-span-8">
            {STORY.map((paragraph) => (
              <p key={paragraph.slice(0, 24)}>{paragraph}</p>
            ))}
          </Reveal>
        </div>
      </section>

      <section id="values" className="bg-mist-50">
        <div className="mx-auto max-w-content px-6 py-20 sm:py-24">
          <Reveal>
            <SectionHeading title="Four promises to every homeowner" />
          </Reveal>
          <Reveal group className="grid gap-6 sm:grid-cols-2">
            {values.map((value) => (
              <div
                key={value.title}
                className="flex flex-col rounded-card border border-outline-200 bg-white p-6 sm:p-8"
              >
                <h3 className="font-heading text-lg font-bold text-navy-900">{value.title}</h3>
                <p className="mt-2 flex-1 text-base text-ink-600">{value.body}</p>
                {value.link.external ? (
                  <a href={value.link.href} className={`${LINK} mt-4 inline-flex min-h-12 items-center self-start text-sm`} rel="noopener noreferrer">
                    {value.link.label}
                  </a>
                ) : (
                  <Link href={value.link.href} className={`${LINK} mt-4 inline-flex min-h-12 items-center self-start text-sm`}>
                    {value.link.label}
                  </Link>
                )}
              </div>
            ))}
          </Reveal>
          <p className="mt-6 max-w-prose text-sm text-ink-600">
            Source for the accuracy check: our comparison with the State of New Jersey&rsquo;s 2027 Chapter 123
            average ratios, written up in full in{" "}
            <a href={VALIDATION_URL} className={LINK} rel="noopener noreferrer">
              our validation report
            </a>
            .
          </p>
        </div>
      </section>

      <CtaBand
        title="Want to get in touch?"
        text="Questions, corrections, or ideas are welcome."
        href="/contact"
        label="Contact"
      />
    </main>
  );
}
