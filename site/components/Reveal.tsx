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
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  group?: boolean;
  /** The element to render (Prompt 10B): "ol" or "ul" lets a list be the group, so each item reveals in turn. */
  as?: "div" | "ol" | "ul";
}) {
  return group ? (
    <Tag data-reveal-group="" className={className}>
      {children}
    </Tag>
  ) : (
    <Tag data-reveal="" className={className}>
      {children}
    </Tag>
  );
}
