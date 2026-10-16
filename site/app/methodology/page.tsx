import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";
import { ComingSoon } from "@/components/ComingSoon";
import { CtaBand } from "@/components/CtaBand";
import { PageHeader } from "@/components/PageHeader";
import { NAV_CTA } from "@/lib/nav";

export const metadata: Metadata = { title: SITE_NAME };

/** Content comes in Prompt 12, from docs/methodology.md. */
export default function MethodologyPage() {
  return (
    <main className="flex-1">
      <PageHeader
        eyebrow="How It Works"
        title="How we calculate every number"
        intro="The data we use, the sales we count, and the formula behind each measure."
      />
      <ComingSoon />
      <CtaBand
        title="Check your own home"
        text="Compare your assessment with recent sales in your town."
        href={NAV_CTA.href}
        label={NAV_CTA.label}
      />
    </main>
  );
}
