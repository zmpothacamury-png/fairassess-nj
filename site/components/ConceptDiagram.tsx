import { House } from "lucide-react";

/**
 * Illustrates what "regressive" assessment means: a lower-priced home
 * assessed above its actual sale value, next to a higher-priced home
 * assessed below its sale value. The percentages are a made-up teaching
 * example, not a finding from this project — the caption says so, and
 * nothing here is presented as a real town's data.
 *
 * Chart palette: assessed-value bars are blue-600; the 100% reference line
 * is gold-400. Each bar also has a text label, so color is never the only cue.
 */
function RatioRow({
  label,
  price,
  ratio,
}: {
  label: string;
  price: string;
  ratio: number;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-navy-900">
        <House aria-hidden="true" className="h-5 w-5 shrink-0 self-center text-blue-600" strokeWidth={2} />
        <span className="text-sm font-semibold">{label}</span>
        <span className="ml-auto text-sm tabular-nums text-ink-600">{price}</span>
      </div>
      <div className="relative mt-2 h-3 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-blue-600"
          style={{ width: `${Math.min(ratio, 130) / 1.3}%` }}
        />
        <div
          className="absolute inset-y-0 border-l-2 border-dashed border-gold-400"
          style={{ left: "76.9%" }}
          aria-hidden="true"
        />
      </div>
      <p className="mt-1 text-right text-sm tabular-nums text-ink-600">
        assessed at {ratio}% of sale price
      </p>
    </div>
  );
}

export function ConceptDiagram() {
  return (
    <figure className="rounded-card border border-outline-200 bg-white p-6 shadow-soft sm:p-8">
      <p className="eyebrow text-blue-600">A teaching example</p>
      <h2 className="mt-2 font-heading text-lg font-bold text-navy-900">
        What &ldquo;regressive&rdquo; assessment looks like
      </h2>

      <div className="mt-6 flex flex-col gap-6">
        <RatioRow label="Lower-priced home" price="$220,000 sale" ratio={112} />
        <RatioRow label="Higher-priced home" price="$780,000 sale" ratio={91} />
      </div>

      <div className="mt-4 flex items-center gap-2 text-sm text-ink-600">
        <span aria-hidden="true" className="inline-block h-4 border-l-2 border-dashed border-gold-400" />
        100% line &mdash; assessment exactly matches the sale price
      </div>

      <figcaption className="mt-6 border-t border-outline-200 pt-4 text-sm text-ink-600">
        Made-up numbers, for illustration only &mdash; not a real town.
        Real, town-by-town ratios from New Jersey sales data will replace
        this diagram once the study publishes.
      </figcaption>
    </figure>
  );
}
