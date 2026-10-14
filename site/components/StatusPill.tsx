import { CircleAlert, CircleCheck, CircleHelp, Info } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * The four checker results, plus "neutral" for plain labels like
 * "In development". Each status has its own icon AND words, so color is
 * never the only signal. No red anywhere: we inform, we don't alarm.
 */
export type Status =
  | "within-range"
  | "may-have-grounds"
  | "under-assessed"
  | "not-enough-data"
  | "neutral";

export const STATUS_STYLES: Record<
  Status,
  { box: string; icon: string; Icon: LucideIcon | null }
> = {
  "within-range": { box: "bg-green-100 text-navy-900", icon: "text-green-700", Icon: CircleCheck },
  "may-have-grounds": { box: "bg-gold-100 text-navy-900", icon: "text-gold-700", Icon: CircleAlert },
  "under-assessed": { box: "bg-blue-100 text-navy-900", icon: "text-blue-600", Icon: Info },
  "not-enough-data": { box: "bg-gray-100 text-ink-800", icon: "text-ink-600", Icon: CircleHelp },
  neutral: { box: "border border-ink-600 text-ink-600", icon: "", Icon: null },
};

/** Small rounded label with an icon, e.g. "Within the normal range". */
export function StatusPill({ status, children }: { status: Status; children: string }) {
  const { box, icon, Icon } = STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${box}`}
    >
      {Icon && <Icon aria-hidden="true" className={`h-4 w-4 shrink-0 ${icon}`} strokeWidth={2} />}
      {children}
    </span>
  );
}
