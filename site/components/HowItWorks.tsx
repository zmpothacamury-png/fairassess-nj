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

/**
 * "How it works" as a real ordered list: three steps in a row, each with a
 * report-style number (01-03, docs/site-format.md) and a hairline rule.
 * Prompt 10B: no boxes, so the steps read as one sequence, not three cards.
 */
export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white">
      <div className="mx-auto max-w-content px-6 py-20 sm:py-24">
        <Reveal>
          <SectionHeading eyebrow="How it works" title="Three steps, all from public data" />
        </Reveal>
        <Reveal group as="ol" className="grid gap-10 md:grid-cols-3 md:gap-8">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex flex-col">
              <div aria-hidden="true" className="flex items-center gap-4">
                <span className="font-heading text-4xl font-extrabold tabular-nums text-blue-600">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {/* A hairline from each number toward the next step. Neutral: blue, green, and gold carry meaning. */}
                <span className="h-px flex-1 bg-outline-200" />
              </div>
              <h3 className="mt-6 font-heading text-lg font-bold text-navy-900">
                <span className="sr-only">Step {i + 1}: </span>
                {step.title}
              </h3>
              <p className="mt-2 max-w-[38ch] text-base text-ink-800">{step.text}</p>
            </li>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
