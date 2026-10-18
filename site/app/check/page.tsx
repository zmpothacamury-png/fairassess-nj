import type { Metadata } from "next";
import { CheckerApp } from "@/components/checker/CheckerApp";
import { CtaBand } from "@/components/CtaBand";
import { PageHeader } from "@/components/PageHeader";
import { loadPriceIndex, loadTowns } from "@/lib/data/load";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  path: "/check",
  description:
    "Check whether your Bergen County home's assessment looks fair under New Jersey's Chapter 123 test, using recent public sales. Runs in your browser; nothing you type is sent.",
});

/**
 * Tool 2: the appeal checker (methodology Section 6). The town list and the
 * price index are built into the page here, so the browser only fetches the
 * one public town file the visitor picks. All checker math runs in the
 * browser (components/checker/CheckerApp.tsx calls lib/checker).
 */
export default async function CheckPage() {
  const [towns, index] = await Promise.all([loadTowns(), loadPriceIndex()]);
  const options = towns.map((t) => ({ slug: t.slug, name: t.name })).sort((a, b) => a.name.localeCompare(b.name));
  return (
    <main className="flex-1">
      <PageHeader
        eyebrow="Appeal Checker"
        title="Is your assessment fair?"
        intro="Enter your town and your assessed value. We compare your home with recent sales and apply New Jersey's Chapter 123 test for 2027. Then we tell you in plain English what we found."
      />
      <CheckerApp towns={options} priceIndex={{ base_month: index.base_month, months: index.months }} />
      <div className="print:hidden">
        <CtaBand
          title="See how your town compares"
          text="Town Rankings show how evenly each Bergen County town assesses homes."
          href="/towns"
          label="See Town Rankings"
        />
      </div>
    </main>
  );
}
