/**
 * Motion values copied exactly from Zaden's other site, Trust & Transition
 * ("T&T"), so both sites move the same way. Source files (identical to the
 * live trustandtransition.org, checked 2026-10-14):
 *   C:\Users\sxp15\trustAndTransition\TrustAndTransition\site.js
 *   C:\Users\sxp15\trustAndTransition\TrustAndTransition\site.css
 * Every value cites its line. Only colors and fonts differ (FairAssess tokens).
 * Full table: docs/site-format.md.
 *
 * app/layout.tsx turns these into CSS variables (motionCssVars), so
 * app/globals.css and the components read the same numbers.
 */

/** T&T's one easing curve for every UI transition. site.css:13 (--ease). */
export const EASE = "cubic-bezier(.16,.84,.44,1)";

/**
 * Scroll-linked text reveal. Progress follows scroll position, not a timer.
 * site.js:19-53, site.css:158-169.
 */
export const REVEAL = {
  /** An element starts revealing when its top is at 94% of the viewport height. site.js:40 */
  startAt: 0.94,
  /** ...and is fully revealed when its top reaches 50%. site.js:41 */
  endAt: 0.5,
  /** Each sibling in a group starts this many px of scroll later. site.js:32 */
  staggerPx: 34,
  /** Rise distance while hidden. site.js:33, site.css:162 */
  travelPx: 54,
  /** Scale while hidden (grows to 1). site.js:46, site.css:162 */
  scaleFrom: 0.972,
  /** Linear smoothing between scroll frames. site.css:163 */
  smoothingMs: 130,
} as const;

/** Cubic ease-out applied to reveal progress. site.js:31 */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Reveal progress (0 hidden ... 1 shown) for an element whose top edge is at
 * `top` px from the viewport top, in a viewport `vh` px tall, as sibling
 * number `index` in its group. Same formula as site.js:39-44.
 */
export function revealProgress(top: number, vh: number, index = 0): number {
  const startY = vh * REVEAL.startAt - index * REVEAL.staggerPx;
  const endY = vh * REVEAL.endAt - index * REVEAL.staggerPx;
  const raw = Math.min(1, Math.max(0, (startY - top) / (startY - endY)));
  return easeOutCubic(raw);
}

/** Inline style values for a given progress. site.js:45-46 */
export function revealStyle(p: number): { opacity: string; transform: string } {
  return {
    opacity: p.toFixed(3),
    transform: `translateY(${((1 - p) * REVEAL.travelPx).toFixed(1)}px) scale(${(
      REVEAL.scaleFrom +
      p * (1 - REVEAL.scaleFrom)
    ).toFixed(4)})`,
  };
}

/** "Scroll to explore" button. site.js:218-249, site.css:120-135. */
export const SCROLL_CUE = {
  /** Visible text. site.js:225 */
  label: "Scroll to explore",
  /**
   * Accessible name. T&T uses "Scroll to see more" (site.js:224), but WCAG 2.5.3
   * (label in name) needs the spoken name to contain the visible words.
   */
  ariaLabel: "Scroll to explore: go to the next section",
  /** Next stop must be at least this far below the current scroll. site.js:235 */
  minJumpPx: 40,
  /** Land this many px below the header line. site.js:234 ("- navH + 4") */
  landingOffsetPx: 4,
  /** Hide when the footer's top is above 92% of the viewport. site.js:244 */
  hideWhenFooterAbove: 0.92,
  /** Also hide within this many px of the page end. site.js:243 */
  endTolerancePx: 4,
  /** Hide/show fade and slide. site.css:127, 133 */
  hideMs: 450,
  hideDropPx: 16,
  /** Hover lift. site.css:128 */
  hoverLiftPx: 2,
  /** Chevron bob loop: 1.7s, -2px to +2px, opacity .5 to 1. site.css:131-132 */
  bobMs: 1700,
  bobPx: 2,
  bobMinOpacity: 0.5,
  /** Position from the bottom: 26px, 18px at <=600px wide. site.css:121, 135 */
  bottomPx: 26,
  bottomPxSmall: 18,
} as const;

/** Header. site.js:11-17, site.css:28-53. */
export const NAV = {
  /** Header gets its border and shadow once the page scrolls past 8px. site.js:14 */
  scrolledAfterPx: 8,
  /** Border/shadow/background transition. site.css:29 */
  elevateMs: 300,
  /** Gold underline grows left to right on hover/active. site.css:37-40 */
  underlineMs: 300,
  /** Mobile menu slides in from the right. site.css:47 */
  menuSlideMs: 300,
} as const;

/** Small hover motions. site.css:58-64 (buttons), 85-87 (cards). */
export const HOVER = {
  buttonLiftPx: 2,
  buttonMs: 250,
  cardLiftPx: 5,
  cardMs: 320,
} as const;

/** All motion values as CSS custom properties, set on <html> by the root layout. */
export const motionCssVars: Record<string, string> = {
  "--motion-ease": EASE,
  "--reveal-travel": `${REVEAL.travelPx}px`,
  "--reveal-scale": String(REVEAL.scaleFrom),
  "--reveal-smoothing": `${REVEAL.smoothingMs}ms`,
  "--cue-hide": `${SCROLL_CUE.hideMs}ms`,
  "--cue-drop": `${SCROLL_CUE.hideDropPx}px`,
  "--cue-lift": `${SCROLL_CUE.hoverLiftPx}px`,
  "--cue-bob": `${SCROLL_CUE.bobMs}ms`,
  "--cue-bob-px": `${SCROLL_CUE.bobPx}px`,
  "--cue-bob-min": String(SCROLL_CUE.bobMinOpacity),
  "--cue-bottom": `${SCROLL_CUE.bottomPx}px`,
  "--cue-bottom-sm": `${SCROLL_CUE.bottomPxSmall}px`,
  "--nav-elevate": `${NAV.elevateMs}ms`,
  "--nav-underline": `${NAV.underlineMs}ms`,
  "--nav-menu": `${NAV.menuSlideMs}ms`,
  "--hover-button-lift": `${HOVER.buttonLiftPx}px`,
  "--hover-button": `${HOVER.buttonMs}ms`,
  "--hover-card-lift": `${HOVER.cardLiftPx}px`,
  "--hover-card": `${HOVER.cardMs}ms`,
};
