"use client";

import { Info } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";

/**
 * Open/close state for a small definition pop-up.
 * Closes on Escape (and returns focus to the button) or on a click outside.
 */
function useExplainer() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    function onClick(event: MouseEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return { open, setOpen, wrapRef, buttonRef, id };
}

function Panel({ id, children }: { id: string; children: ReactNode }) {
  return (
    <span
      id={id}
      role="note"
      className="absolute left-1/2 top-full z-20 mt-2 block w-72 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-card border border-outline-200 bg-white p-4 text-left text-sm font-normal normal-case tracking-normal text-ink-800 shadow-raised"
    >
      {children}
    </span>
  );
}

/**
 * A word with a dotted underline. Click it, or press Enter or Space on it,
 * to show a short plain-English definition. Use for terms like "COD" or
 * "common level range" the first time they appear on a page.
 */
export function Term({ children, definition }: { children: string; definition: ReactNode }) {
  const { open, setOpen, wrapRef, buttonRef, id } = useExplainer();
  return (
    <span ref={wrapRef} className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
        className="focus-ring cursor-help underline decoration-blue-600 decoration-dotted decoration-2 underline-offset-4"
      >
        {children}
      </button>
      {open && <Panel id={id}>{definition}</Panel>}
    </span>
  );
}

/** Small "i" button that shows an explanation. `label` names what it explains. */
export function InfoButton({ label, children }: { label: string; children: ReactNode }) {
  const { open, setOpen, wrapRef, buttonRef, id } = useExplainer();
  return (
    <span ref={wrapRef} className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={id}
        aria-label={`What does "${label}" mean?`}
        onClick={() => setOpen(!open)}
        className="focus-ring inline-flex h-8 w-8 items-center justify-center rounded-full text-blue-600 hover:bg-blue-100"
      >
        <Info aria-hidden="true" className="h-5 w-5" strokeWidth={2} />
      </button>
      {open && <Panel id={id}>{children}</Panel>}
    </span>
  );
}
