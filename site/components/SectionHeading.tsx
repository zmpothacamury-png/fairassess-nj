/**
 * Heading used at the top of each section: a small uppercase eyebrow label,
 * the title, and an optional one-line subtitle.
 * `as` sets the heading level so each page keeps a correct outline.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  as: Tag = "h2",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  as?: "h1" | "h2" | "h3";
}) {
  return (
    <div className="mb-10 max-w-prose sm:mb-12">
      {eyebrow && <p className="eyebrow text-blue-600">{eyebrow}</p>}
      <Tag className="mt-2 font-heading text-2xl font-bold text-navy-900">{title}</Tag>
      {description && <p className="mt-4 text-lg text-ink-600">{description}</p>}
    </div>
  );
}
