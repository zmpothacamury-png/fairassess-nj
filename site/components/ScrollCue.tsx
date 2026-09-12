"use client";

import { useEffect, useState } from "react";

/**
 * "Scroll to explore" button that stays pinned to the bottom of the screen
 * as you scroll — like the one on trustandtransition.org — instead of
 * scrolling away with the hero. Each click jumps to the next section
 * (using the page's own <section id> landmarks), and the button hides
 * itself once the footer comes into view, since there's nothing left to
 * explore at that point.
 */
export function ScrollCue() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const footer = document.querySelector("footer");
    if (!footer) return;

    // Start hiding a little before the footer is actually on screen so the
    // button doesn't sit on top of it for a stretch of scrolling.
    const observer = new IntersectionObserver(
      ([entry]) => setHidden(entry.isIntersecting),
      { rootMargin: "0px 0px -30% 0px" },
    );
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  function handleClick() {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("main section[id]"),
    );
    const scrollMarginTop = 90; // clears the sticky top bar; matches scroll-mt-20
    const here = window.scrollY + scrollMarginTop + 10;
    const next = sections.find((section) => section.offsetTop > here);
    next?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Scroll to explore"
      className={`fixed bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-paper shadow-lg transition-all duration-300 hover:bg-slate sm:bottom-6 sm:gap-2 sm:px-5 sm:py-2.5 sm:text-xs ${
        hidden
          ? "pointer-events-none translate-y-4 opacity-0"
          : "opacity-100"
      }`}
    >
      Scroll to explore
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="scroll-cue-arrow h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4"
        aria-hidden="true"
      >
        <path d="M5.5 9 12 15.5 18.5 9" />
      </svg>
    </button>
  );
}
