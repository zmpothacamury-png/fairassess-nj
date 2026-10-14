/**
 * Motif A, "balance divider": a thin line, blue on the left half and green on
 * the right, with a small gold dot at the center (the logo's pivot point).
 * Use it between major sections. Decorative only, so screen readers skip it.
 */
export function BalanceDivider({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`relative mx-auto flex max-w-content items-center px-6 ${className}`}
    >
      <span className="h-px flex-1 bg-blue-600" />
      <span className="h-px flex-1 bg-green-600" />
      <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-400" />
    </div>
  );
}
