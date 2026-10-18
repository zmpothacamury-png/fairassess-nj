import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { SOURCES, type SourceKey } from "@/lib/sources";

/** Link style for links inside running text. */
export const LINK = "focus-ring font-semibold text-blue-600 underline underline-offset-4 hover:text-navy-700";

/**
 * One section with the site's standard padding (docs/design-system.md, section 4).
 * Sections alternate white | mist. `tight` is for the short band right under a page header.
 */
export function Band({
  id,
  tone = "white",
  tight = false,
  children,
}: {
  id?: string;
  tone?: "white" | "mist";
  tight?: boolean;
  children: ReactNode;
}) {
  return (
    <section id={id} className={`scroll-mt-20 ${tone === "white" ? "bg-white" : "bg-mist-50"}`}>
      <div className={`mx-auto max-w-content px-6 ${tight ? "py-12 sm:py-16" : "py-20 sm:py-24"}`}>{children}</div>
    </section>
  );
}

/** A link to one outside source, by key (lib/sources.ts). CLAUDE.md rule 5: every outside fact shows its link. */
export function Source({ k, children }: { k: SourceKey; children?: ReactNode }) {
  return (
    <a href={SOURCES[k].url} className={LINK} rel="noopener noreferrer">
      {children ?? SOURCES[k].label}
    </a>
  );
}

/** "Source: ..." line under a fact, table, or chart. */
export function SourceLine({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`max-w-prose text-sm text-ink-600 ${className}`}>{children}</p>;
}

/**
 * A disclosure that opens instantly (design system: things opened often don't
 * animate). Native <details>, so it works without JavaScript, with the
 * keyboard, and opens itself when printed or searched with Ctrl+F.
 */
export function Disclosure({ summary, children }: { summary: ReactNode; children: ReactNode }) {
  return (
    <details className="group rounded-card border border-outline-200 bg-white">
      <summary className="focus-ring flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-card px-6 py-3 font-semibold text-navy-900 hover:text-blue-600 [&::-webkit-details-marker]:hidden">
        {summary}
        <ChevronDown
          aria-hidden="true"
          className="h-5 w-5 shrink-0 text-blue-600 transition-transform duration-[var(--duration-pop)] ease-[var(--ease-out)] group-open:rotate-180 motion-reduce:transition-none"
          strokeWidth={2}
        />
      </summary>
      <div className="border-t border-outline-200 p-4 sm:p-6">{children}</div>
    </details>
  );
}

/** One figure in a row of figures: a small label over a big number (design system "Figures"). */
export function Figure({ label, value, note }: { label: ReactNode; value: ReactNode; note?: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-sm text-ink-600">{label}</dt>
      <dd className="mt-1 font-heading text-2xl font-bold tabular-nums text-navy-900">{value}</dd>
      {note && <dd className="mt-1 text-sm text-ink-600">{note}</dd>}
    </div>
  );
}
