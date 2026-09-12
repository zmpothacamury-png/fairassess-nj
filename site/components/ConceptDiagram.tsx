import { HouseIcon } from "./icons";

/**
 * Illustrates what "regressive" assessment means: a lower-priced home
 * assessed above its actual sale value, next to a higher-priced home
 * assessed below its sale value. The percentages are a made-up teaching
 * example, not a finding from this project — the caption says so, and
 * nothing here is presented as a real town's data.
 */
function RatioRow({
  label,
  price,
  ratio,
  barClass,
}: {
  label: string;
  price: string;
  ratio: number;
  barClass: string;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-ink">
        <HouseIcon className="h-5 w-5 shrink-0 self-center text-slate" />
        <span className="text-sm font-semibold">{label}</span>
        <span className="ml-auto font-serif text-sm text-slate">{price}</span>
      </div>
      <div className="relative mt-2 h-3 w-full overflow-hidden rounded-full bg-slate/15">
        <div
          className={`h-full rounded-full ${barClass}`}
          style={{ width: `${Math.min(ratio, 130) / 1.3}%` }}
        />
        <div
          className="absolute inset-y-0 border-l border-dashed border-ink/40"
          style={{ left: "76.9%" }}
          aria-hidden="true"
        />
      </div>
      <p className="mt-1 text-right text-xs text-slate">
        assessed at {ratio}% of sale price
      </p>
    </div>
  );
}

export function ConceptDiagram() {
  return (
    <figure className="border border-slate/20 bg-mist p-6 sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate">
        A teaching example
      </p>
      <h2 className="mt-1 font-serif text-lg text-ink">
        What &ldquo;regressive&rdquo; assessment looks like
      </h2>

      <div className="mt-6 flex flex-col gap-6">
        <RatioRow
          label="Lower-priced home"
          price="$220,000 sale"
          ratio={112}
          barClass="bg-gold"
        />
        <RatioRow
          label="Higher-priced home"
          price="$780,000 sale"
          ratio={91}
          barClass="bg-signal"
        />
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-slate">
        <span className="inline-block h-2 w-2 rounded-full border border-dashed border-ink/40" />
        100% line &mdash; assessment exactly matches the sale price
      </div>

      <figcaption className="mt-5 border-t border-slate/20 pt-4 text-xs text-slate">
        Made-up numbers, for illustration only &mdash; not a real town.
        Real, town-by-town ratios from New Jersey sales data will replace
        this diagram once the study publishes.
      </figcaption>
    </figure>
  );
}
