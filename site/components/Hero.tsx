import Image from "next/image";
import { Button } from "./Button";

/**
 * Home page hero in T&T's layout: eyebrow, headline, one sentence, two
 * buttons on the left; the logo visual on the right. The New Jersey outline
 * sits behind it as a faint watermark (Motif B). `nTowns` comes from meta.json.
 *
 * "Refined" (picked from 3 prototypes): a larger fluid headline
 * (text-5xl, 44 -> 72px) so the first screen has one dominant element, and
 * the logo anchored to the 12-column grid. The hero is NOT wrapped in Reveal:
 * it is the first screen, so it shows at full strength on load. (Wrapped, its
 * buttons loaded part-transparent on phones and failed Lighthouse's contrast
 * check.) Every section below keeps the T&T scroll reveal.
 */
export function Hero({ nTowns }: { nTowns: number }) {
  return (
    <section id="top" className="relative overflow-hidden bg-mist-50">
      {/* Motif B: the logo's New Jersey outline as a faint watermark. Kept to the right edge on phones so it
          never crosses the headline. */}
      <Image
        src="/nj-outline.png"
        alt=""
        aria-hidden="true"
        width={1179}
        height={2091}
        sizes="660px"
        // Usually the largest thing in the first screen (Lighthouse LCP), so it loads first.
        preload
        className="pointer-events-none absolute -right-48 -top-16 h-[130%] w-auto max-w-none opacity-40 select-none sm:-left-24 sm:right-auto"
      />

      <div className="relative mx-auto grid max-w-content items-center gap-12 px-6 py-16 sm:py-24 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <p className="eyebrow flex items-center gap-2 text-blue-600">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-gold-400" />
            Public Assessment Equity
          </p>
          <h1 className="mt-5 max-w-[14ch] font-heading text-5xl font-extrabold text-navy-900">
            Is your home assessed fairly?
          </h1>
          <p className="mt-6 max-w-[52ch] text-lg text-ink-800">
            Fair Assess NJ uses public home sales data to check property tax fairness in all{" "}
            <span className="tabular-nums">{nTowns}</span> Bergen County towns, and helps you see if you might have
            grounds to appeal.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button href="/check" size="lg">
              Check my assessment
            </Button>
            <Button href="/towns" variant="secondary" size="lg">
              See town rankings
            </Button>
          </div>
        </div>

        <div className="flex justify-center lg:col-span-4 lg:justify-end">
          <Image
            src="/logo-icon.png"
            alt="Fair Assess NJ logo: a house on balance scales over an outline of New Jersey"
            width={253}
            height={448}
            loading="eager"
            className="h-56 w-auto sm:h-72 lg:h-[28rem]"
          />
        </div>
      </div>
    </section>
  );
}
