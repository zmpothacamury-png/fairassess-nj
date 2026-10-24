import type { Metadata } from "next";
import { Disclaimer } from "@/components/Disclaimer";
import { LogoLockup, PhoneResult } from "@/components/submission/Pieces";
import { loadPriceIndex, loadTown } from "@/lib/data/load";
import { SITE_NAME } from "@/lib/site";
import { EXAMPLE_HOME, exampleResult } from "@/lib/submission";

/** Congressional App Challenge cover image (Prompt 17). Hidden: not in the nav, the sitemap, or search.
 *  `site/scripts/capture-submission.ts` screenshots each 600x800 design to docs/submission/. */
export const metadata: Metadata = {
  title: SITE_NAME,
  robots: { index: false, follow: false },
};

export default async function CoverPage() {
  const [town, priceIndex] = await Promise.all([loadTown(EXAMPLE_HOME.townSlug), loadPriceIndex()]);
  const result = exampleResult(town, priceIndex);

  return (
    <main className="mx-auto flex max-w-content flex-col items-center gap-12 px-6 py-12">
      <p className="max-w-prose text-sm text-ink-600">
        Cover designs for the App Challenge submission, 600 by 800. The checker card uses the website&rsquo;s own
        checker on a made-up home ({result.town.name}, ${EXAMPLE_HOME.assessedValue.toLocaleString("en-US")} assessed).
      </p>

      {/* Design A: light, logo on top. */}
      <section
        id="cover-a"
        aria-label="Cover design A"
        className="flex shrink-0 flex-col items-center overflow-hidden bg-mist-50"
        style={{ width: 600, height: 800 }}
      >
        <div className="split-accent h-2 w-full" style={{ backgroundSize: "100% 8px" }} />
        <div className="mt-7">
          <LogoLockup iconHeight={104} wordSize={42} />
        </div>
        <div className="mt-6">
          <PhoneResult result={result} townName={result.town.name} width={330} />
        </div>
        <div className="mt-auto w-full bg-navy-900 px-10 pb-7 pt-6 text-center">
          <p className="font-heading text-[34px] font-extrabold leading-tight text-white">
            Check your property tax fairness
          </p>
          <p className="mt-2 font-heading text-[22px] font-bold tracking-wide text-gold-400">Bergen County, NJ</p>
        </div>
      </section>

      {/* Design B (alternate): navy, the logo on a white tile and a larger phone. */}
      <section
        id="cover-b"
        aria-label="Cover design B"
        className="flex shrink-0 flex-col overflow-hidden bg-navy-900"
        style={{ width: 600, height: 800 }}
      >
        <div className="mx-8 mt-7 flex items-center justify-center rounded-card bg-white px-6 py-4">
          <LogoLockup iconHeight={78} wordSize={34} />
        </div>
        <div className="mt-6 flex justify-center">
          <PhoneResult result={result} townName={result.town.name} width={350} />
        </div>
        <div className="mt-auto px-10 pb-8 text-center">
          <p className="font-heading text-[36px] font-extrabold leading-tight text-white">
            Check your property tax fairness
          </p>
          <p className="mt-2 font-heading text-[22px] font-bold tracking-wide text-gold-400">Bergen County, NJ</p>
        </div>
      </section>

      <div className="w-full max-w-prose">
        <Disclaimer />
      </div>
    </main>
  );
}
