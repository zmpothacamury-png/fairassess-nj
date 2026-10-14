import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Privacy | FairAssess NJ" };

/** Content comes in a later prompt. */
export default function PrivacyPage() {
  return (
    <main className="flex-1">
      <PageHeader eyebrow="Privacy" title="Privacy" intro="What this site collects, and what it never collects." />
      <ComingSoon />
    </main>
  );
}
