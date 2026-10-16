import { EXAMPLE_HOMES, formatDollars, formatPercent, taxShares } from "@/lib/home";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";
import { StatusPill } from "./StatusPill";

/**
 * "Why it matters": what a regressive pattern is, shown with two MADE-UP
 * homes on the logo's balance. The numbers are hypothetical on purpose and
 * labeled that way; they come from EXAMPLE_HOMES in lib/home.ts.
 */
export function WhyItMatters() {
  const [a, b] = taxShares(EXAMPLE_HOMES);

  return (
    <section id="why-it-matters" className="bg-mist-50">
      <div className="mx-auto grid max-w-content gap-12 px-6 py-20 sm:py-24 lg:grid-cols-2 lg:items-center lg:gap-16">
        <Reveal>
          <SectionHeading eyebrow="Why it matters" title="When cheaper homes carry more of the tax" />
          <div className="flex max-w-prose flex-col gap-4 text-base text-ink-800">
            <p>
              Your tax bill is based on your assessed value. Every home in a town pays the same tax rate on that
              value. So if one home is assessed at a higher share of what it is worth, its owner pays more than their
              fair share.
            </p>
            <p>
              When cheaper homes are assessed at a higher share of their value than expensive homes, experts call it a{" "}
              <strong className="font-semibold text-navy-900">regressive</strong> pattern. The opposite, where expensive
              homes carry more, is called <strong className="font-semibold text-navy-900">progressive</strong>.
            </p>
          </div>
        </Reveal>

        <Reveal>
          <figure className="rounded-card border border-outline-200 bg-white p-6 shadow-soft sm:p-8">
            <StatusPill status="neutral">Example with made-up numbers</StatusPill>
            <figcaption className="mt-4 font-heading text-lg font-bold text-navy-900">
              Two homes in the same town
            </figcaption>

            {/* The balance: a beam with the gold pivot in the middle, one home on each side. */}
            <div aria-hidden="true" className="relative mt-6 flex items-center">
              <span className="h-1 flex-1 bg-blue-600" />
              <span className="h-1 flex-1 bg-green-600" />
              <span className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-400" />
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              {[a, b].map((home) => (
                <div key={home.name}>
                  <p className="font-heading text-base font-bold text-navy-900">{home.name}</p>
                  <dl className="mt-2 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm">
                    <dt className="text-ink-600">Worth</dt>
                    <dd className="text-right tabular-nums text-ink-800">{formatDollars(home.value)}</dd>
                    <dt className="text-ink-600">Assessed at</dt>
                    <dd className="text-right tabular-nums text-ink-800">{formatDollars(home.assessed)}</dd>
                    <dt className="text-ink-600">Assessment ratio</dt>
                    <dd className="text-right font-semibold tabular-nums text-navy-900">{formatPercent(home.ratio)}</dd>
                  </dl>
                  <ShareBar label="Share of the value" share={home.valueShare} tone="green" />
                  <ShareBar label="Share of the taxes" share={home.taxShare} tone="blue" />
                </div>
              ))}
            </div>

            <p className="mt-6 border-t border-outline-200 pt-4 text-base text-ink-800">
              {a.name} is worth {formatPercent(a.valueShare)} of the total, but its owner pays{" "}
              <strong className="font-semibold text-navy-900">{formatPercent(a.taxShare)}</strong> of the taxes. If
              both homes had the same ratio, each owner would pay a share equal to their home&rsquo;s share of the
              value.
            </p>
          </figure>
        </Reveal>
      </div>
    </section>
  );
}

/** A labeled bar. Green = market value, blue = assessed value (design system chart palette). */
function ShareBar({ label, share, tone }: { label: string; share: number; tone: "green" | "blue" }) {
  return (
    <div className="mt-3">
      <p className="flex justify-between text-sm text-ink-600">
        <span>{label}</span>
        <span className="font-semibold tabular-nums text-navy-900">{formatPercent(share)}</span>
      </p>
      <div aria-hidden="true" className="mt-1 h-2 rounded-full bg-gray-100">
        <div
          className={`h-2 rounded-full ${tone === "green" ? "bg-green-600" : "bg-blue-600"}`}
          style={{ width: `${share * 100}%` }}
        />
      </div>
    </div>
  );
}
