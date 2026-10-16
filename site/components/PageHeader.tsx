import Image from "next/image";
import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

/**
 * Top band of every inner page: eyebrow + main heading + one intro
 * paragraph, revealed as a group. Fair Assess NJ colors, not T&T's dark band:
 * the logo's light blue tint, a faint New Jersey outline (Motif B), navy
 * text, and the logo's blue | green balance line with its gold pivot along
 * the bottom. It is a <header>, not a <section>, so the scroll cue skips it.
 */
export function PageHeader({
  eyebrow,
  title,
  intro,
}: {
  eyebrow: string;
  title: string;
  intro: ReactNode;
}) {
  return (
    <header className="relative bg-blue-100">
      {/* Only the watermark is clipped, so the pivot dot below can hang past the header's edge. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <Image
          src="/nj-outline.png"
          alt=""
          width={1179}
          height={2091}
          className="absolute -right-10 -top-10 h-[160%] w-auto opacity-60 select-none sm:right-[6%]"
        />
      </div>
      <Reveal group className="relative mx-auto max-w-content px-6 pb-14 pt-16">
        <p className="eyebrow flex items-center gap-2 text-blue-600">
          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-gold-400" />
          {eyebrow}
        </p>
        <h1 className="mt-4 max-w-[24ch] font-heading text-3xl font-bold text-navy-900">{title}</h1>
        <p className="mt-4 max-w-prose text-lg text-ink-600">{intro}</p>
      </Reveal>
      {/* The logo's balance: blue | green with the gold pivot dot, drawn whole over both bands. Decorative. */}
      <div aria-hidden="true" className="relative z-10 flex items-center">
        <span className="h-1 flex-1 bg-blue-600" />
        <span className="h-1 flex-1 bg-green-600" />
        <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-400" />
      </div>
    </header>
  );
}
