import { WaitlistForm } from "./WaitlistForm";
import { AppealBasics } from "./AppealBasics";
import { ConceptDiagram } from "./ConceptDiagram";

export function Hero() {
  return (
    <section id="top" className="scroll-mt-20 bg-paper">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
        <div className="grid gap-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate">
              New Jersey property tax research
            </p>
            <h1 className="mt-3 max-w-[19ch] font-serif text-4xl leading-tight text-ink sm:text-5xl">
              Do cheaper homes get taxed harder than expensive ones?
            </h1>
            <p className="mt-6 max-w-[56ch] text-lg text-slate">
              FairAssess NJ checks town assessment records against actual
              sale prices, town by town. Homeowners who are over-assessed
              have a legal right to appeal.
            </p>

            <div className="mt-10 max-w-xl">
              <WaitlistForm source="hero" />
              <p className="mt-3 text-sm text-slate">
                Free. No spam. We only use your email to tell you when the
                checker launches.
              </p>
            </div>
          </div>

          <ConceptDiagram />
        </div>

        <AppealBasics className="mt-16" />
      </div>
    </section>
  );
}
