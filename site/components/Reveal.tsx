import type { ReactNode } from "react";

/**
 * Marks content for the scroll-linked reveal (Trust & Transition's text
 * transition; numbers in lib/motion.ts). It only adds a data attribute;
 * RevealController (in the root layout) does the animating.
 *
 * - <Reveal> animates this block as one piece (T&T `data-reveal`).
 * - <Reveal group> animates each direct child in turn, each starting 34px of
 *   scroll after the one before (T&T `data-reveal-group`).
 *
 * Content is always in the HTML, so search engines and no-JavaScript visitors
 * see it. Never wrap checker results in Reveal: results must show at once.
 * Don't nest one Reveal inside another.
 */
export function Reveal({
  children,
  className = "",
  group = false,
}: {
  children: ReactNode;
  className?: string;
  group?: boolean;
}) {
  return group ? (
    <div data-reveal-group="" className={className}>
      {children}
    </div>
  ) : (
    <div data-reveal="" className={className}>
      {children}
    </div>
  );
}
