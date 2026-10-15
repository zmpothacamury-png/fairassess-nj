import type { Metadata } from "next";
import { AppealBasics } from "@/components/AppealBasics";
import { ComingSoon } from "@/components/ComingSoon";
import { CtaBand } from "@/components/CtaBand";
import { PageHeader } from "@/components/PageHeader";
import { NAV_CTA } from "@/lib/nav";

export const metadata: Metadata = { title: "Appeal Guide | Fair Assess NJ" };

/** Content comes in Prompt 12. Appeals are discussed, so the deadline and fee show (CLAUDE.md rule 7). */
export default function AppealGuidePage() {
  return (
    <main className="flex-1">
      <PageHeader
        eyebrow="Appeal Guide"
        title="How to appeal your assessment"
        intro="Who to file with, when, and what it costs in Bergen County."
      />
      <ComingSoon>
        <AppealBasics />
      </ComingSoon>
      <CtaBand
        title="Check your own home first"
        text="See whether your assessment looks out of line with recent sales."
        href={NAV_CTA.href}
        label={NAV_CTA.label}
      />
    </main>
  );
}
