import Image from "next/image";
import { WaitlistForm } from "./WaitlistForm";
import { AppealBasics } from "./AppealBasics";
import { ConceptDiagram } from "./ConceptDiagram";
import { Reveal } from "./Reveal";

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-mist-50">
      {/* Motif B: the logo's New Jersey outline as a faint watermark. */}
      <Image
        src="/nj-outline.png"
        alt=""
        aria-hidden="true"
        width={1179}
        height={2091}
        priority
        className="pointer-events-none absolute -right-16 top-8 h-[120%] w-auto opacity-50 select-none sm:right-0 lg:right-[4%]"
      />

      <div className="relative mx-auto max-w-content px-6 py-20 sm:py-24">
        <div className="grid gap-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12">
          <Reveal group>
            <p className="eyebrow text-blue-600">New Jersey property tax research</p>
            <h1 className="mt-4 max-w-[19ch] font-heading text-3xl font-extrabold text-navy-900 sm:text-4xl">
              Do cheaper homes get taxed harder than expensive ones?
            </h1>
            <p className="mt-6 max-w-[56ch] text-lg text-ink-600">
              FairAssess NJ checks town assessment records against actual
              sale prices, town by town. Homeowners who are over-assessed
              have a legal right to appeal.
            </p>

            <div className="mt-10 max-w-xl">
              <WaitlistForm source="hero" />
              <p className="mt-4 text-sm text-ink-600">
                Free. No spam. We only use your email to tell you when the
                checker launches.
              </p>
            </div>
          </Reveal>

          <Reveal>
            <ConceptDiagram />
          </Reveal>
        </div>

        <Reveal className="mt-16">
          <AppealBasics />
        </Reveal>
      </div>
    </section>
  );
}
