"use client";

import { useSyncExternalStore } from "react";

const NARROW_QUERY = "(max-width: 639px)";

/**
 * True on phone-width screens (under Tailwind's sm breakpoint), so charts can
 * use shorter labels. The server and the first render assume a wide screen.
 */
export function useNarrow(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(NARROW_QUERY);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(NARROW_QUERY).matches,
    () => false,
  );
}
