import { SectionHeading } from "./SectionHeading";
import { DocumentIcon } from "./icons";

const PILLARS = [
  {
    title: "Data sources",
    body: "MOD-IV parcel records (every assessment in the state) and SR-1A sale reports (usable, arm's-length sales), both published by the NJ Division of Taxation.",
  },
  {
    title: "Ratio-study measures",
    body: "The coefficient of dispersion (COD), price-related differential (PRD), and price-related bias (PRB) — the standard statistics the IAAO uses to test whether assessments are fair across price levels.",
  },
  {
    title: "Chapter 123 check",
    body: "New Jersey's own rule for comparing an assessment to a sale price, applied the same way the county tax boards apply it during a real appeal.",
  },
] as const;

export function MethodologySection() {
  return (
    <section id="methodology" className="scroll-mt-20 bg-mist">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
        <SectionHeading
          eyebrow="Transparency"
          title="Methodology"
          description="Where the numbers come from and how we calculate every measure."
        />

        <div className="grid gap-8 sm:grid-cols-3">
          {PILLARS.map((pillar) => (
            <div key={pillar.title} className="border-t-2 border-gold pt-4">
              <h3 className="font-serif text-lg text-ink">{pillar.title}</h3>
              <p className="mt-2 text-base text-slate">{pillar.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-4 border border-slate/20 bg-paper p-6 sm:flex-row sm:items-center sm:gap-6">
          <DocumentIcon className="h-8 w-8 shrink-0 text-slate" />
          <p className="text-sm text-slate">
            We publish the full methodology write-up, with every formula
            and data-cleaning step, before any town result goes live. Until
            then, this page describes the approach only &mdash; no town
            has been scored yet.
          </p>
        </div>
      </div>
    </section>
  );
}
