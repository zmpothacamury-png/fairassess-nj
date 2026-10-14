import type { ReactNode } from "react";

/**
 * Wrapper for a data table (styles: .data-table in app/globals.css).
 * The scroll box can be focused with Tab, so keyboard users can scroll wide
 * or tall tables with the arrow keys. Put class="num" on number cells to
 * right-align them with tabular figures.
 */
export function DataTable({
  label,
  caption,
  children,
  maxHeight = "max-h-[32rem]",
}: {
  label: string;
  caption?: string;
  children: ReactNode;
  maxHeight?: string;
}) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className={`focus-ring overflow-auto rounded-card border border-outline-200 bg-white ${maxHeight}`}
    >
      <table className="data-table">
        {caption && <caption className="sr-only">{caption}</caption>}
        {children}
      </table>
    </div>
  );
}
