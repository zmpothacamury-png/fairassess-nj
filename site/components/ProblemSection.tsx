import { SectionHeading } from "./SectionHeading";
import { AppealBasics } from "./AppealBasics";
import { Reveal } from "./Reveal";

const ITEMS = [
  {
    number: "01",
    title: "How assessments work",
    body: "Every town assigns each home an assessed value for tax purposes. When a home sells, that assessment can be compared with the sale price. This is called the assessment-to-sale-price ratio. A ratio near 100% means the assessment matches the sale price closely.",
  },
  {
    number: "02",
    title: "What regressivity means",
    body: "In a fair system, this ratio stays about the same no matter how much a home is worth. A regressive system does the opposite: lower-priced homes get assessed at a higher share of their value than expensive homes. That shifts more of the tax burden onto owners of cheaper homes. The IAAO — the professional group that sets ratio-study standards — treats this pattern as a well-known risk in property assessment, which is exactly why it has its own standard measures.",
  },
  {
    number: "03",
    title: "The right to appeal",
    body: "New Jersey law lets any homeowner appeal their assessment. Appeals go to the county tax board first. Most homeowners never file, even when their assessment looks too high.",
  },
] as const;

/** Three plain-English explainer columns, laid out as a numbered list. */
export function ProblemSection() {
  return (
    <section id="problem" className="scroll-mt-24 bg-white">
      <div className="mx-auto max-w-content px-6 py-20 sm:py-24">
        <Reveal>
          <SectionHeading
            eyebrow="Background"
            title="The problem"
            description="Three ideas worth understanding before you look at any numbers."
          />
        </Reveal>

        <Reveal group className="grid gap-10 lg:grid-cols-3">
          {ITEMS.map((item) => (
            <div key={item.number} className="border-t border-outline-200 pt-6">
              <span className="font-heading text-2xl font-bold tabular-nums text-blue-600">
                {item.number}
              </span>
              <h3 className="mt-2 font-heading text-lg font-bold text-navy-900">
                {item.title}
              </h3>
              <p className="mt-4 text-base text-ink-600">{item.body}</p>
            </div>
          ))}
        </Reveal>

        <Reveal className="mt-16">
          <AppealBasics />
        </Reveal>
      </div>
    </section>
  );
}
