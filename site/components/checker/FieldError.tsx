import { CircleAlert } from "lucide-react";

/** Form-control look shared by the checker fields (same as the /towns search box). */
export const FIELD =
  "focus-ring min-h-12 w-full scroll-mt-32 rounded-control border border-ink-600 bg-white px-3 text-base text-ink-800 placeholder:text-ink-600";

/**
 * Inline error under a field: navy text with a gold-700 alert icon (design
 * system: no red). The field points at it with aria-describedby.
 */
export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-2 flex max-w-prose gap-2 text-base text-navy-900">
      <CircleAlert aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-gold-700" strokeWidth={2} />
      <span>{message}</span>
    </p>
  );
}
