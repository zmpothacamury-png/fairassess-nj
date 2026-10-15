import { Map, SearchCheck } from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import { AppealBasics } from "./AppealBasics";
import { StatusPill } from "./StatusPill";
import { Reveal } from "./Reveal";

export function BuildingSection() {
  return (
    <section id="roadmap" className="scroll-mt-24 bg-mist-50">
      <div className="mx-auto max-w-content px-6 py-20 sm:py-24">
        <Reveal>
          <SectionHeading
            eyebrow="Roadmap"
            title="What we're building"
            description="Two pieces, built from the same underlying data."
          />
        </Reveal>

        <Reveal group className="grid gap-6 sm:grid-cols-2">
          <div className="split-accent flex flex-col rounded-card border border-outline-200 bg-white p-6 shadow-soft sm:p-8">
            <Map aria-hidden="true" className="h-7 w-7 text-blue-600" strokeWidth={2} />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <h3 className="font-heading text-lg font-bold text-navy-900">
                Town-by-town equity study
              </h3>
              <StatusPill status="neutral">In development</StatusPill>
            </div>
            <p className="mt-4 text-base text-ink-600">
              This public, reproducible study scores every Bergen County
              town. It checks whether each town assesses lower-priced
              single-family homes more heavily than expensive ones. It uses
              IAAO ratio-study measures and the state&rsquo;s own Chapter 123
              range checks.
            </p>
          </div>

          <div className="split-accent flex flex-col rounded-card border border-outline-200 bg-white p-6 shadow-soft sm:p-8">
            <SearchCheck aria-hidden="true" className="h-7 w-7 text-green-700" strokeWidth={2} />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <h3 className="font-heading text-lg font-bold text-navy-900">
                A free appeal checker
              </h3>
              <StatusPill status="neutral">In development</StatusPill>
            </div>
            <p className="mt-4 text-base text-ink-600">
              Enter your town and your assessed value. See in plain language
              whether your assessment looks out of line with recent sales in
              your town.
            </p>
          </div>
        </Reveal>

        <Reveal className="mt-10">
          <AppealBasics />
        </Reveal>
      </div>
    </section>
  );
}
