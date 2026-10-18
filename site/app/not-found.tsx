import { Button } from "@/components/Button";
import { PageHeader } from "@/components/PageHeader";
import { NAV_CTA } from "@/lib/nav";

/**
 * 404 page in the brand style: short message and two ways back. Prompt 10B:
 * the second balance line under the header was removed (the header already
 * ends in one).
 */
export default function NotFound() {
  return (
    <main className="flex-1">
      <PageHeader
        eyebrow="404"
        title="Page not found"
        intro="We could not find that page. It may have moved, or the link may have a typo."
      />
      <section className="bg-white">
        <div className="mx-auto flex max-w-content flex-wrap gap-4 px-6 py-16 sm:py-20">
          <Button href="/" variant="secondary" size="lg">
            Home
          </Button>
          <Button href={NAV_CTA.href} size="lg">
            {NAV_CTA.label}
          </Button>
        </div>
      </section>
    </main>
  );
}
