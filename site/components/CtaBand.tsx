import { Button } from "./Button";
import { Reveal } from "./Reveal";

/**
 * Closing call-to-action band: a heading and short line on the left and one
 * button on the right. Use it as the last section of a page.
 * - tone "light" (default, inner pages): white panel with the logo's
 *   blue | green stripe on top, navy heading, blue button.
 * - tone "navy" (home page): the navy panel Zaden chose for the home page.
 */
export function CtaBand({
  title,
  text,
  href,
  label,
  tone = "light",
}: {
  title: string;
  text?: string;
  href: string;
  label: string;
  tone?: "light" | "navy";
}) {
  const navy = tone === "navy";
  return (
    <section className="bg-mist-50">
      <div className="mx-auto max-w-content px-6 py-20 sm:py-24">
        <Reveal
          className={`flex flex-wrap items-center justify-between gap-8 overflow-hidden rounded-card px-8 py-12 sm:px-14 ${
            navy ? "bg-navy-900" : "split-accent border border-outline-200 bg-white"
          }`}
        >
          <div className="max-w-prose">
            <h2 className={`font-heading text-2xl font-bold ${navy ? "text-white" : "text-navy-900"}`}>{title}</h2>
            {text && <p className={`mt-2 text-base ${navy ? "text-outline-200" : "text-ink-600"}`}>{text}</p>}
          </div>
          <Button href={href} variant={navy ? "secondary" : "primary"} size="lg">
            {label}
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
