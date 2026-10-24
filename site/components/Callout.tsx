import { CircleAlert, CircleCheck, Info } from "lucide-react";
import type { ReactNode } from "react";

type Tone = "info" | "caution" | "success";

const TONES = {
  info: { box: "bg-blue-100", icon: "text-blue-600", Icon: Info },
  caution: { box: "bg-gold-100", icon: "text-gold-700", Icon: CircleAlert },
  success: { box: "bg-green-100", icon: "text-green-700", Icon: CircleCheck },
} as const;

/**
 * Note on a tinted surface with an icon. Text stays navy so it is easy to
 * read; the tint and the icon mark the kind of note (never color alone).
 * The thick colored left edge was removed (a stock
 * template look); the tinted surface carries the meaning on its own.
 */
export function Callout({
  tone = "info",
  title,
  children,
  className = "",
}: {
  tone?: Tone;
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  const { box, icon, Icon } = TONES[tone];
  return (
    <div className={`flex gap-3 rounded-card p-5 text-navy-900 sm:p-6 ${box} ${className}`}>
      <Icon aria-hidden="true" className={`mt-1 h-5 w-5 shrink-0 ${icon}`} strokeWidth={2} />
      <div className="min-w-0 text-base">
        {title && <p className="font-semibold">{title}</p>}
        <div className={title ? "mt-1" : ""}>{children}</div>
      </div>
    </div>
  );
}
