import type { ReactNode } from "react";

/**
 * White card with a thin outline border and a soft shadow.
 * `accent` adds the split blue | green top border (Motif C). Use it on a few
 * key cards per page, not on every card.
 */
export function Card({
  children,
  accent = false,
  className = "",
}: {
  children: ReactNode;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-card border border-outline-200 bg-white p-6 shadow-soft sm:p-8 ${
        accent ? "split-accent" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
