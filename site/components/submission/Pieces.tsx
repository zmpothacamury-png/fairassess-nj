import Image from "next/image";
import { CircleCheck } from "lucide-react";
import { formatCount } from "@/lib/home";
import { meterScale, qrModules } from "@/lib/submission";
import type { CheckerResult } from "@/lib/checker";

/** The logo icon over the wordmark and tagline, sized for print and thumbnails. */
export function LogoLockup({ iconHeight, wordSize, onDark = false }: { iconHeight: number; wordSize: number; onDark?: boolean }) {
  return (
    <div className="flex flex-col items-center text-center">
      <Image
        src="/logo-icon.png"
        alt=""
        width={394}
        height={698}
        loading="eager"
        style={{ height: iconHeight, width: "auto" }}
      />
      <p
        className={`mt-3 font-heading font-extrabold tracking-wide ${onDark ? "text-white" : "text-navy-700"}`}
        style={{ fontSize: wordSize, lineHeight: 1.05 }}
      >
        FAIR ASSESS NJ
      </p>
      <p
        className={`mt-1.5 font-heading font-bold tracking-[0.14em] ${onDark ? "text-outline-200" : "text-ink-600"}`}
        style={{ fontSize: Math.round(wordSize * 0.36) }}
      >
        PUBLIC ASSESSMENT EQUITY
      </p>
    </div>
  );
}

/**
 * A big, simple balance meter for the cover: thick zones (below / the town's common level range /
 * above), the gold town-average dot, and a navy bar for the example home with its likely range.
 * Real numbers from the checker result; no small labels, so it still reads as a thumbnail.
 */
export function BigMeter({ result }: { result: CheckerResult }) {
  const c = result.chapter123;
  const e = result.estimate;
  if (!c || !e) return null;
  const low = 100 * e.ratioP25;
  const high = 100 * e.ratioP75;
  const pos = meterScale(c.lowerTrigger, c.upperTrigger, [c.homeownerRatio, low, high]);
  const L = pos(c.lowerTrigger);
  const U = pos(c.upperTrigger);
  return (
    <div aria-hidden="true" className="relative h-14">
      <div className="absolute inset-x-0 top-1/2 h-6 -translate-y-1/2 overflow-hidden rounded-full">
        <span className="absolute inset-y-0 left-0 bg-sky-400" style={{ width: `${L}%` }} />
        <span className="absolute inset-y-0 bg-green-600" style={{ left: `${L}%`, width: `${U - L}%` }} />
        <span className="absolute inset-y-0 right-0 bg-gold-400" style={{ left: `${U}%` }} />
      </div>
      <span
        className="absolute top-1/2 h-1 -translate-y-1/2 bg-navy-900"
        style={{ left: `${pos(low)}%`, width: `${pos(high) - pos(low)}%` }}
      />
      <span
        className="absolute top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-gold-400"
        style={{ left: `${pos(c.averageRatio)}%` }}
      />
      <span
        className="absolute top-0 h-14 w-3 -translate-x-1/2 rounded-full bg-navy-900 ring-4 ring-white"
        style={{ left: `${pos(c.homeownerRatio)}%` }}
      />
    </div>
  );
}

/** A phone-sized checker result: town, verdict, estimated value, and the big meter. */
export function PhoneResult({ result, townName, width = 300 }: { result: CheckerResult; townName: string; width?: number }) {
  const mid = result.estimate?.marketValueMid;
  return (
    <div className="rounded-[44px] bg-navy-900 p-3" style={{ width }}>
      <div className="overflow-hidden rounded-[34px] bg-white">
        <div className="split-accent h-1" />
        <div className="px-6 pb-7 pt-6">
          <p className="text-[15px] font-semibold text-ink-600">
            {townName} &middot; assessed ${formatCount(result.assessedValue)}
          </p>
          <p className="mt-4 flex items-center gap-2 rounded-card bg-green-100 px-4 py-3 font-heading text-[19px] font-bold leading-tight text-navy-900">
            <CircleCheck aria-hidden="true" className="h-7 w-7 shrink-0 text-green-700" strokeWidth={2.5} />
            Within the normal range
          </p>
          {mid !== undefined && (
            <>
              <p className="mt-5 text-[14px] text-ink-600">Estimated market value</p>
              <p className="font-heading text-[38px] font-extrabold leading-none tabular-nums text-navy-900">
                ${formatCount(mid)}
              </p>
            </>
          )}
          <div className="mt-6">
            <BigMeter result={result} />
          </div>
          <p className="mt-4 text-[13px] text-ink-600">Example home, not a real address</p>
        </div>
      </div>
    </div>
  );
}

/** A QR code drawn as squares with token colors (so it prints in navy on white). */
export function QrCode({ text, size }: { text: string; size: number }) {
  const { size: n, dark } = qrModules(text);
  const quiet = 4; // the light border QR readers need
  const total = n + 2 * quiet;
  return (
    <svg viewBox={`0 0 ${total} ${total}`} width={size} height={size} role="img" aria-label={`QR code for ${text}`} shapeRendering="crispEdges">
      <rect width={total} height={total} className="fill-white" />
      {dark.map((on, i) =>
        on ? <rect key={i} x={quiet + (i % n)} y={quiet + Math.floor(i / n)} width={1} height={1} className="fill-navy-900" /> : null,
      )}
    </svg>
  );
}
