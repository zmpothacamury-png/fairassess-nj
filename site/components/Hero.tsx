import Image from "next/image";
import { Button } from "./Button";
import { Reveal } from "./Reveal";

/**
 * Home page hero in T&T's layout: eyebrow, headline, one sentence, two
 * buttons on the left; the logo visual on the right. The New Jersey outline
 * sits behind it as a faint watermark (Motif B). `nTowns` comes from meta.json.
 */
export function Hero({ nTowns }: { nTowns: number }) {
  return (
    <section id="top" className="relative overflow-hidden bg-mist-50">
      {/* Motif B: the logo's New Jersey outline as a faint watermark. */}
      <Image
        src="/nj-outline.png"
        alt=""
        aria-hidden="true"
        width={1179}
        height={2091}
        priority
        className="pointer-events-none absolute -left-24 -top-8 h-[120%] w-auto opacity-50 select-none sm:left-[8%]"
      />

      <div className="relative mx-auto max-w-content px-6 py-20 sm:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.25fr_0.75fr]">
          <Reveal group>
            <p className="eyebrow flex items-center gap-2 text-blue-600">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-gold-400" />
              Public Assessment Equity
            </p>
            <h1 className="mt-4 max-w-[16ch] font-heading text-3xl font-extrabold text-navy-900 sm:text-4xl">
              Is your home assessed fairly?
            </h1>
            <p className="mt-6 max-w-[56ch] text-lg text-ink-600">
              Fair Assess NJ uses public home sales data to check property tax fairness in all{" "}
              <span className="tabular-nums">{nTowns}</span> Bergen County towns, and helps you see if you might
              have grounds to appeal.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Button href="/check" size="lg">
                Check my assessment
              </Button>
              <Button href="/towns" variant="secondary" size="lg">
                See town rankings
              </Button>
            </div>
          </Reveal>

          <Reveal className="flex justify-center lg:justify-end">
            <Image
              src="/logo-icon.png"
              alt="Fair Assess NJ logo: a house on balance scales over an outline of New Jersey"
              width={394}
              height={698}
              priority
              className="h-64 w-auto sm:h-80 lg:h-[26rem]"
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
