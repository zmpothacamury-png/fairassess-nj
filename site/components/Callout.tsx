import { CircleAlert, CircleCheck, Info } from "lucide-react";
import type { ReactNode } from "react";

type Tone = "info" | "caution" | "success";

const TONES = {
  info: { box: "bg-blue-100 border-blue-600", icon: "text-blue-600", Icon: Info },
  caution: { box: "bg-gold-100 border-gold-400", icon: "text-gold-700", Icon: CircleAlert },
  success: { box: "bg-green-100 border-green-600", icon: "text-green-700", Icon: CircleCheck },
} as const;

/**
 * Boxed note with a colored left edge and icon. Text stays navy so it is
 * easy to read; the color only marks the kind of note.
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
    <div className={`flex gap-3 rounded-card border-l-4 p-4 text-navy-900 sm:p-6 ${box} ${className}`}>
      <Icon aria-hidden="true" className={`mt-0.5 h-5 w-5 shrink-0 ${icon}`} strokeWidth={2} />
      <div className="text-base">
        {title && <p className="font-semibold">{title}</p>}
        <div className={title ? "mt-1" : ""}>{children}</div>
      </div>
    </div>
  );
}
