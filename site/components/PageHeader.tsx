import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

/**
 * Top band of every inner page, in the place of T&T's dark "page hero":
 * eyebrow + main heading + one intro paragraph, revealed as a group.
 * It is a <header>, not a <section>, so the scroll cue skips it (as on T&T).
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
    <header className="bg-navy-900">
      <Reveal group className="mx-auto max-w-content px-6 pb-14 pt-16">
        <p className="eyebrow text-gold-400">{eyebrow}</p>
        <h1 className="mt-4 max-w-[24ch] font-heading text-3xl font-bold text-white">{title}</h1>
        <p className="mt-4 max-w-prose text-lg text-outline-200">{intro}</p>
      </Reveal>
    </header>
  );
}
