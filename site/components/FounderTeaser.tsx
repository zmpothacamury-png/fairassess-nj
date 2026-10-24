import Link from "next/link";
import { Button } from "./Button";
import { Reveal } from "./Reveal";

/**
 * "Meet the Founder" teaser (T&T pattern), with a link to the full story on /about.
 * Editorial split, heading on the left and the text and links on
 * the right, so the band no longer reads as one short line in a wide space.
 */
export function FounderTeaser() {
  return (
    <section id="founder" className="bg-mist-50">
      <Reveal group className="mx-auto grid max-w-content gap-6 px-6 py-20 sm:py-24 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-5">
          <p className="eyebrow text-blue-600">Meet the Founder</p>
          <h2 className="mt-2 font-heading text-2xl font-bold text-navy-900">Who built this</h2>
        </div>
        <div className="lg:col-span-7">
          <p className="max-w-prose text-lg text-ink-800">
            An independent research project by Zaden Pothacamury, a student at Ramapo High School in Franklin Lakes. He
            built it so any Bergen County homeowner can check the numbers behind their tax bill, for free.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
            <Button href="/about" variant="secondary">
              Read the Full Story
            </Button>
            <Link
              href="/contact#updates"
              className="focus-ring inline-flex min-h-12 items-center text-sm font-semibold text-blue-600 underline underline-offset-4 hover:text-navy-700"
            >
              Get updates: new towns and appeal season reminders
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
