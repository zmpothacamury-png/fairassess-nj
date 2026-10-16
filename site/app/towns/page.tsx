import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";
import { ComingSoon } from "@/components/ComingSoon";
import { CtaBand } from "@/components/CtaBand";
import { PageHeader } from "@/components/PageHeader";
import { NAV_CTA } from "@/lib/nav";

export const metadata: Metadata = { title: SITE_NAME };

/** Tool 1. Content comes in Prompt 10. */
export default function TownsPage() {
  return (
    <main className="flex-1">
      <PageHeader
        eyebrow="Tool 1"
        title="Town Rankings"
        intro="How evenly each Bergen County town assesses single-family homes, based on recent home sales."
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
