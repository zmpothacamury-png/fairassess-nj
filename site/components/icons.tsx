/**
 * Small hand-drawn line icons used across the site. Kept as plain inline SVG
 * (no icon library) so every icon matches the navy/gold palette and stroke
 * weight exactly. Each one is 24x24 and inherits color via currentColor.
 */

type IconProps = {
  className?: string;
};

export function HouseIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3.5 11.5 12 4l8.5 7.5" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1H9v-5.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V20h2.5a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

export function ScaleIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 3v17M8 20h8" />
      <path d="M5 7h14" />
      <path d="M5 7 2.5 12.5a2.5 2.5 0 0 0 5 0Z" />
      <path d="M19 7l-2.5 5.5a2.5 2.5 0 0 0 5 0Z" />
    </svg>
  );
}

export function MapIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M9 4 4 6v14l5-2 6 2 5-2V4l-5 2-6-2Z" />
      <path d="M9 4v14M15 6v14" />
    </svg>
  );
}

export function SearchCheckIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m20 20-3.8-3.8M8 10.5l1.6 1.6L13 8.6" />
    </svg>
  );
}

export function DocumentIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M7 3.5h7L18.5 8V20a.5.5 0 0 1-.5.5H7a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5Z" />
      <path d="M14 3.5V8h4.5" />
      <path d="M9 12.5h6M9 15.5h6M9 9.5h2" />
    </svg>
  );
}

export function CalendarIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3.5" y="5" width="17" height="15" rx="1.5" />
      <path d="M3.5 9.5h17M8 3v3.5M16 3v3.5" />
    </svg>
  );
}

export function ReceiptIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M6 3.5h12v17l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3Z" />
      <path d="M8.5 8h7M8.5 11.5h7M8.5 15h4.5" />
    </svg>
  );
}
