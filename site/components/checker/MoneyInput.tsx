"use client";

import { forwardRef, useRef, type ReactNode } from "react";
import { caretAfterDigits, digitsBefore, formatMoneyTyping } from "./copy";
import { FieldError, FIELD } from "./FieldError";

/**
 * Dollar amount field. Adds commas as you type and keeps the cursor where it
 * was. Uses a text input with a number keypad (inputMode) because
 * type="number" drops commas and lets the mouse wheel change the value.
 * The value never leaves the browser (CLAUDE.md rule 3).
 */
export const MoneyInput = forwardRef<
  HTMLInputElement,
  {
    id: string;
    label: ReactNode;
    help?: ReactNode;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    required?: boolean;
  }
>(function MoneyInput({ id, label, help, value, onChange, error, required }, ref) {
  const local = useRef<HTMLInputElement | null>(null);
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  const describedBy = [error ? errorId : null, help ? helpId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div>
      <label htmlFor={id} className="text-base font-semibold text-navy-900">
        {label}
      </label>
      {help && (
        <p id={helpId} className="mt-1 max-w-prose text-sm text-ink-600">
          {help}
        </p>
      )}
      <div className="relative mt-2 max-w-sm">
        <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-base text-ink-600">
          $
        </span>
        <input
          ref={(el) => {
            local.current = el;
            if (typeof ref === "function") ref(el);
            else if (ref) ref.current = el;
          }}
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          spellCheck={false}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          value={value}
          onChange={(e) => {
            const el = e.target;
            const typed = el.value;
            const keep = digitsBefore(typed, el.selectionStart ?? typed.length);
            const next = formatMoneyTyping(typed);
            onChange(next);
            if (next !== typed) {
              // Put the cursor back after the same digit once React has drawn the new text.
              requestAnimationFrame(() => {
                const pos = caretAfterDigits(next, keep);
                local.current?.setSelectionRange(pos, pos);
              });
            }
          }}
          className={`${FIELD} pl-7 tabular-nums ${error ? "border-2 border-gold-700" : ""}`}
        />
      </div>
      <FieldError id={errorId} message={error} />
    </div>
  );
});
