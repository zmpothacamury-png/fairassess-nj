"use client";

import { Button } from "@/components/Button";
import { PageHeader } from "@/components/PageHeader";
import { NAV_CTA } from "@/lib/nav";

/**
 * Shown if a page breaks while it runs. Same look as the 404
 * page. The header and footer (with the disclaimer) stay on screen. Nothing
 * is logged or sent anywhere (privacy rule).
 */
export default function ErrorPage({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="flex-1">
      <PageHeader
        eyebrow="Error"
        title="Something went wrong"
        intro="This page did not load correctly. Nothing you typed was saved or sent. Try again, or go back to the home page."
      />
      <section className="bg-white">
        <div className="mx-auto flex max-w-content flex-wrap gap-4 px-6 py-16 sm:py-20">
          <Button onClick={() => retry()} size="lg">
            Try again
          </Button>
          <Button href="/" variant="secondary" size="lg">
            Home
          </Button>
          <Button href={NAV_CTA.href} variant="secondary" size="lg">
            {NAV_CTA.label}
          </Button>
        </div>
      </section>
    </main>
  );
}
