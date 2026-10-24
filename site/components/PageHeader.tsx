import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

/**
 * Top band of every inner page: eyebrow + main heading + one intro
 * paragraph, revealed as a group. Fair Assess NJ colors, not T&T's dark band:
 * the logo's light blue tint, a faint New Jersey outline (Motif B), navy
 * text, and the logo's blue | green balance line with its gold pivot along
 * the bottom. It is a <header>, not a <section>, so the scroll cue skips it.
 *
 * Optional: `back` puts a small "back" link above the eyebrow,
 * and `meta` adds a row under the intro (a town page's label, rank, and
 * sales), so the facts a visitor came for are in the first screen.
 */
export function PageHeader({
  eyebrow,
  title,
  intro,
  back,
  meta,
}: {
  eyebrow: string;
  title: string;
  intro: ReactNode;
  back?: { href: string; label: string };
  meta?: ReactNode;
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
          // Often the largest thing in the first screen, so it loads right away at about its shown size.
          sizes="(min-width: 640px) 360px, 300px"
          preload
          className="absolute -right-24 -top-10 h-[160%] w-auto max-w-none opacity-60 select-none sm:right-[6%]"
        />
      </div>
      <div className="relative mx-auto max-w-content px-6 pb-12 pt-10 sm:pb-14 sm:pt-12">
        {back && (
          <Link
            href={back.href}
            className="focus-ring group -ml-1 mb-4 inline-flex min-h-11 items-center gap-1 rounded-control px-1 text-sm font-semibold text-blue-600 hover:text-navy-700"
          >
            <ArrowLeft
              aria-hidden="true"
              className="h-4 w-4 transition-transform duration-[var(--duration-press)] ease-[var(--ease-out)] motion-safe:group-hover:-translate-x-0.5"
              strokeWidth={2}
            />
            {back.label}
          </Link>
        )}
        <Reveal group className={back ? "" : "pt-4"}>
          <p className="eyebrow flex items-center gap-2 text-blue-600">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-gold-400" />
            {eyebrow}
          </p>
          <h1 className="mt-4 max-w-[24ch] font-heading text-3xl font-bold text-navy-900">{title}</h1>
          <p className="mt-4 max-w-prose text-lg text-ink-800">{intro}</p>
          {meta && <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">{meta}</div>}
        </Reveal>
      </div>
      {/* The logo's balance: blue | green with the gold pivot dot, drawn whole over both bands. Decorative. */}
      <div aria-hidden="true" className="relative z-10 flex items-center">
        <span className="h-1 flex-1 bg-blue-600" />
        <span className="h-1 flex-1 bg-green-600" />
        <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-400" />
      </div>
    </header>
  );
}
