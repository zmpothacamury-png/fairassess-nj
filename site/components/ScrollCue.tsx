"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SCROLL_CUE } from "@/lib/motion";

/**
 * "Scroll to explore" button, pinned to the bottom center of every page like
 * T&T's (site.js:218-249; look in app/globals.css .scroll-cue). Each click
 * jumps to the next section and moves keyboard focus there. It hides once the
 * footer comes into view or the page ends, and starts hidden until it has
 * measured the page (so it never flashes on short pages).
 */
export function ScrollCue() {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    const update = () => {
      const footer = document.querySelector("footer");
      const footerTop = footer ? footer.getBoundingClientRect().top : Infinity;
      const atEnd =
        window.innerHeight + window.scrollY >= document.body.scrollHeight - SCROLL_CUE.endTolerancePx;
      setHidden(footerTop < window.innerHeight * SCROLL_CUE.hideWhenFooterAbove || atEnd);
    };
    const frame = requestAnimationFrame(update);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [pathname]);

  function goToNextSection() {
    const headerHeight = document.querySelector<HTMLElement>(".site-header")?.offsetHeight ?? 0;
    const current = window.scrollY;
    const stops = Array.from(document.querySelectorAll<HTMLElement>("main section, footer"));
    let target: HTMLElement | null = null;
    let top = document.body.scrollHeight;
    for (const stop of stops) {
      const stopTop = stop.getBoundingClientRect().top + window.scrollY - headerHeight + SCROLL_CUE.landingOffsetPx;
      if (stopTop > current + SCROLL_CUE.minJumpPx) {
        target = stop;
        top = stopTop;
        break;
      }
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
    if (target) {
      if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    }
  }

  return (
    <button
      type="button"
      className="scroll-cue"
      data-hidden={hidden}
      aria-label={SCROLL_CUE.ariaLabel}
      aria-hidden={hidden || undefined}
      tabIndex={hidden ? -1 : undefined}
      onClick={goToNextSection}
    >
      <span>{SCROLL_CUE.label}</span>
      <span className="scroll-cue-chev" aria-hidden="true" />
    </button>
  );
}
