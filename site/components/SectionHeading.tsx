/** Heading used at the top of each section, with a short gold rule under it. */
export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-10 max-w-[60ch] sm:mb-14">
      {eyebrow && (
        <p className="text-sm font-semibold uppercase tracking-wide text-slate">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-1 font-serif text-2xl text-ink sm:text-3xl">
        {title}
      </h2>
      <span className="mt-3 block h-[3px] w-12 bg-gold" aria-hidden="true" />
      {description && (
        <p className="mt-4 text-base text-slate">{description}</p>
      )}
    </div>
  );
}
