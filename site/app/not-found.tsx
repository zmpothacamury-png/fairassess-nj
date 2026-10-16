import { BalanceDivider } from "@/components/BalanceDivider";
import { Button } from "@/components/Button";
import { PageHeader } from "@/components/PageHeader";
import { NAV_CTA } from "@/lib/nav";

/** 404 page in the brand style: short message, the balance divider, and two ways back. */
export default function NotFound() {
  return (
    <main className="flex-1">
      <PageHeader
        eyebrow="404"
        title="Page not found"
        intro="We could not find that page. It may have moved, or the link may have a typo."
      />
      <section className="bg-white">
        <div className="mx-auto max-w-content px-6 py-20">
          <BalanceDivider />
          <div className="mt-12 flex flex-wrap gap-4">
            <Button href="/" variant="secondary" size="lg">
              Home
            </Button>
            <Button href={NAV_CTA.href} size="lg">
              {NAV_CTA.label}
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
