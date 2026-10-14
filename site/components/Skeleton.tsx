/**
 * Gray placeholder block shown while data loads. Pulses only when the
 * visitor has not asked for reduced motion. Screen readers hear the label.
 */
export function Skeleton({
  className = "h-6 w-full",
  label = "Loading",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div role="status" aria-label={label} className={`rounded-control bg-gray-100 motion-safe:animate-pulse ${className}`} />
  );
}
