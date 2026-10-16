import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";

const STEPS = [
  {
    title: "We collect public sales records",
    text: "Every home sale in New Jersey is reported to the state. We use the State of New Jersey's public sales files for Bergen County.",
  },
  {
    title: "We compare assessed value to sale price",
    text: "For each sold home, we divide its assessed value by what it actually sold for. That share is the assessment ratio. Then we use the standard methods assessors use to check how even those ratios are.",
  },
  {
    title: "You see your town and check your home",
    text: "See how your town scores in the rankings. Then enter your own assessed value to see how it compares with recent sales near your value.",
  },
];

/** "How it works" as numbered 01-03 cards (T&T's numbered card pattern). */
export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white">
      <div className="mx-auto max-w-content px-6 py-20 sm:py-24">
        <Reveal>
          <SectionHeading eyebrow="How it works" title="Three steps, all from public data" />
        </Reveal>
        <Reveal group className="grid gap-6 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <div key={step.title} className="rounded-card border border-outline-200 bg-mist-50 p-6 sm:p-8">
              <p aria-hidden="true" className="font-heading text-3xl font-extrabold tabular-nums text-blue-600">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-4 font-heading text-lg font-bold text-navy-900">
                <span className="sr-only">Step {i + 1}: </span>
                {step.title}
              </h3>
              <p className="mt-2 text-base text-ink-600">{step.text}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
