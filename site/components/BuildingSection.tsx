import { SectionHeading } from "./SectionHeading";
import { AppealBasics } from "./AppealBasics";
import { SearchCheckIcon, MapIcon } from "./icons";
import { Reveal } from "./Reveal";

function StatusPill({ children }: { children: string }) {
  return (
    <span className="inline-block rounded-full border border-slate/40 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-slate">
      {children}
    </span>
  );
}

export function BuildingSection() {
  return (
    <section id="roadmap" className="scroll-mt-20 bg-paper">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
        <Reveal>
          <SectionHeading
            eyebrow="Roadmap"
            title="What we're building"
            description="Two pieces, built from the same underlying data."
          />
        </Reveal>

        <div className="grid gap-px overflow-hidden border border-slate/20 bg-slate/20 sm:grid-cols-2">
          <Reveal className="flex flex-col bg-paper p-6 sm:p-8">
            <MapIcon className="h-7 w-7 text-gold" />
            <div className="mt-4 flex items-center gap-3">
              <h3 className="font-serif text-lg text-ink">
                Town-by-town equity study
              </h3>
              <StatusPill>In development</StatusPill>
            </div>
            <p className="mt-3 text-base text-slate">
              A public, reproducible study that scores every New Jersey
              town on whether it assesses lower-priced homes more heavily
              than expensive ones, using IAAO ratio-study measures and the
              state&rsquo;s own Chapter 123 range checks.
            </p>
          </Reveal>

          <Reveal className="flex flex-col bg-paper p-6 sm:p-8" delay={150}>
            <SearchCheckIcon className="h-7 w-7 text-gold" />
            <div className="mt-4 flex items-center gap-3">
              <h3 className="font-serif text-lg text-ink">
                A free appeal checker
              </h3>
              <StatusPill>In development</StatusPill>
            </div>
            <p className="mt-3 text-base text-slate">
              Enter your address. See whether your assessment looks out of
              line with recent sales in your town, in plain language.
            </p>
          </Reveal>
        </div>

        <Reveal>
          <AppealBasics className="mt-10" />
        </Reveal>
      </div>
    </section>
  );
}
