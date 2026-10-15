import type { Metadata } from "next";
import { AppealBasics } from "@/components/AppealBasics";
import { ComingSoon } from "@/components/ComingSoon";
import { CtaBand } from "@/components/CtaBand";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Appeal Checker | Fair Assess NJ" };

/** Tool 2. Content comes in Prompt 11. Appeals are mentioned, so the deadline and fee show (CLAUDE.md rule 7). */
export default function CheckPage() {
  return (
    <main className="flex-1">
      <PageHeader
        eyebrow="Tool 2"
        title="Appeal Checker"
        intro="Enter your town and assessed value. The checker compares your home with recent sales. Then it tells you in plain English whether you may have grounds to appeal."
      />
      <ComingSoon>
        <AppealBasics />
      </ComingSoon>
      <CtaBand
        title="See how your town compares"
        text="Town Rankings show how evenly each town assesses homes."
        href="/towns"
        label="See Town Rankings"
      />
    </main>
  );
}
