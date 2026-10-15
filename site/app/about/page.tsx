import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";
import { CtaBand } from "@/components/CtaBand";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "About | Fair Assess NJ" };

/**
 * Content comes in Prompt 13 (founder header, The Story, What Drives This
 * Work). Zaden's grade and his own words on how he started are still needed.
 */
export default function AboutPage() {
  return (
    <main className="flex-1">
      <PageHeader
        eyebrow="About"
        title="About Fair Assess NJ"
        intro="Why this project exists and who built it."
      />
      <ComingSoon />
      <CtaBand title="Want to get in touch?" href="/contact" label="Contact" />
    </main>
  );
}
