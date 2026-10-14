"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { revealProgress, revealStyle } from "@/lib/motion";

/**
 * Drives every <Reveal> on the page, the same way T&T's site.js:19-53 does:
 * on each scroll frame, each element's opacity and position follow how far
 * its top has travelled from 94% to 50% of the viewport height. It reverses
 * when scrolling back. With reduced motion it does nothing, and the CSS shows
 * everything in place. Mounted once in the root layout; re-scans on each page.
 */
export function RevealController() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const items: { el: HTMLElement; index: number }[] = [];
    document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => items.push({ el, index: 0 }));
    document.querySelectorAll<HTMLElement>("[data-reveal-group]").forEach((group) => {
      Array.from(group.children).forEach((child, index) => items.push({ el: child as HTMLElement, index }));
    });

    let ticking = false;
    const update = () => {
      ticking = false;
      const vh = window.innerHeight;
      for (const { el, index } of items) {
        const { opacity, transform } = revealStyle(revealProgress(el.getBoundingClientRect().top, vh, index));
        el.style.opacity = opacity;
        el.style.transform = transform;
      }
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      for (const { el } of items) {
        el.style.opacity = "";
        el.style.transform = "";
      }
    };
  }, [pathname]);

  return null;
}
