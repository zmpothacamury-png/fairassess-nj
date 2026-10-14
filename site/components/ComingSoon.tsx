import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

/**
 * Placeholder body for a tab whose content comes in a later prompt.
 * `children` (for example the deadline and fee box) get the full content
 * width, not the narrow text column.
 */
export function ComingSoon({ children }: { children?: ReactNode }) {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-content px-6 py-20 sm:py-24">
        <Reveal group className="max-w-prose">
          <p className="eyebrow text-blue-600">Coming soon</p>
          <p className="mt-4 text-lg text-ink-800">
            This page is being built. It will be ready before launch.
          </p>
        </Reveal>
        {children && <Reveal className="mt-10">{children}</Reveal>}
      </div>
    </section>
  );
}
