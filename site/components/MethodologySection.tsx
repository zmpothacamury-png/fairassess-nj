import { FileText } from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import { Reveal } from "./Reveal";

const PILLARS = [
  {
    title: "Data sources",
    body: "SR-1A sale reports and the state's Chapter 123 average ratios. The NJ Division of Taxation publishes both. We use only the sales the state itself marks as usable, arm's-length sales.",
  },
  {
    title: "Ratio-study measures",
    body: "The coefficient of dispersion (COD), price-related differential (PRD), and price-related bias (PRB). These are the standard statistics the IAAO uses to test whether assessments are fair across price levels.",
  },
  {
    title: "Chapter 123 check",
    body: "New Jersey's own rule for comparing an assessment to a home's market value. It uses the limits the state publishes for each town every October 1.",
  },
] as const;

export function MethodologySection() {
  return (
    <section id="methodology" className="scroll-mt-24 bg-white">
      <div className="mx-auto max-w-content px-6 py-20 sm:py-24">
        <Reveal>
          <SectionHeading
            eyebrow="Transparency"
            title="Methodology"
            description="Where the numbers come from and how we calculate every measure."
          />
        </Reveal>

        <Reveal group className="grid gap-8 lg:grid-cols-3">
          {PILLARS.map((pillar) => (
            <div key={pillar.title} className="border-t-2 border-gold-400 pt-4">
              <h3 className="font-heading text-lg font-bold text-navy-900">{pillar.title}</h3>
              <p className="mt-2 text-base text-ink-600">{pillar.body}</p>
            </div>
          ))}
        </Reveal>

        <Reveal className="mt-10 flex flex-col gap-4 rounded-card border border-outline-200 bg-mist-50 p-6 sm:flex-row sm:items-center sm:gap-6">
          <FileText aria-hidden="true" className="h-8 w-8 shrink-0 text-blue-600" strokeWidth={2} />
          <p className="text-base text-ink-600">
            We will publish the full methodology write-up before any town
            result goes live. It will include every formula and
            data-cleaning step. Until then, this page describes the approach
            only. No town has been scored yet.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
