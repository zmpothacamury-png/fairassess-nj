import { Button } from "./Button";
import { Reveal } from "./Reveal";

/**
 * Closing call-to-action band, like T&T's .cta-band: a navy panel with a
 * heading and short line on the left and one button on the right.
 * Use it as the last section of a page, pointing to the next useful step.
 */
export function CtaBand({
  title,
  text,
  href,
  label,
}: {
  title: string;
  text?: string;
  href: string;
  label: string;
}) {
  return (
    <section className="bg-mist-50">
      <div className="mx-auto max-w-content px-6 py-20 sm:py-24">
        <Reveal className="flex flex-wrap items-center justify-between gap-8 rounded-card bg-navy-900 px-8 py-12 sm:px-14">
          <div className="max-w-prose">
            <h2 className="font-heading text-2xl font-bold text-white">{title}</h2>
            {text && <p className="mt-2 text-base text-outline-200">{text}</p>}
          </div>
          <Button href={href} variant="secondary" size="lg">
            {label}
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
