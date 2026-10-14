import { Button } from "@/components/Button";
import { PageHeader } from "@/components/PageHeader";
import { NAV_CTA } from "@/lib/nav";

/** 404 page. */
export default function NotFound() {
  return (
    <main className="flex-1">
      <PageHeader eyebrow="404" title="Page not found" intro="The page you were looking for doesn't exist or has moved." />
      <section className="bg-white">
        <div className="mx-auto flex max-w-content flex-wrap gap-4 px-6 py-20">
          <Button href="/" variant="secondary">
            Go to the home page
          </Button>
          <Button href={NAV_CTA.href}>{NAV_CTA.label}</Button>
        </div>
      </section>
    </main>
  );
}
