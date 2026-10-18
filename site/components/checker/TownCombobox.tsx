"use client";

import { ChevronDown } from "lucide-react";
import { forwardRef, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { matchesQuery, normalizeName } from "@/lib/towns";
import { FieldError, FIELD } from "./FieldError";

export type TownOption = { slug: string; name: string };

/**
 * Searchable town list (WAI-ARIA combobox with a list popup). Type to filter;
 * Down/Up move through the list, Enter picks, Escape closes (a second Escape
 * clears). Typing a town's full name also picks it. The list opens instantly:
 * people open it often, so it does not animate (design system section 4).
 */
export const TownCombobox = forwardRef<
  HTMLInputElement,
  {
    id: string;
    label: ReactNode;
    towns: TownOption[];
    text: string;
    selected: string;
    onChange: (text: string, slug: string) => void;
    error?: string;
  }
>(function TownCombobox({ id, label, towns, text, selected, onChange, error }, ref) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  const errorId = `${id}-error`;

  // When the box shows the picked town's name, opening the list shows every town.
  const selectedName = towns.find((t) => t.slug === selected)?.name ?? "";
  const options = useMemo(
    () => (text === selectedName ? towns : towns.filter((t) => matchesQuery(t.name, text))),
    [towns, text, selectedName],
  );

  useEffect(() => {
    if (!open || active < 0) return;
    listRef.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  function pick(t: TownOption) {
    onChange(t.name, t.slug);
    setOpen(false);
    setActive(-1);
  }

  function type(value: string) {
    const exact = towns.find((t) => normalizeName(t.name) === normalizeName(value) && value.trim() !== "");
    onChange(value, exact?.slug ?? "");
    setOpen(true);
    setActive(-1);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        const at = options.findIndex((t) => t.slug === selected);
        setActive(at >= 0 ? at : e.key === "ArrowDown" ? 0 : options.length - 1);
        return;
      }
      if (options.length === 0) return;
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((a) => (a + step + options.length) % options.length);
    } else if (e.key === "Home" && open) {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End" && open) {
      e.preventDefault();
      setActive(options.length - 1);
    } else if (e.key === "Enter" && open && active >= 0 && options[active]) {
      e.preventDefault(); // pick the town; don't submit the form yet
      pick(options[active]);
    } else if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        setOpen(false);
        setActive(-1);
      } else if (text !== "") {
        e.preventDefault();
        onChange("", "");
      }
    }
  }

  const activeId = open && active >= 0 && options[active] ? `${listId}-${options[active].slug}` : undefined;

  return (
    <div>
      <label htmlFor={id} className="text-base font-semibold text-navy-900">
        {label}
      </label>
      <div className="relative mt-2 max-w-md">
        <input
          ref={ref}
          id={id}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={activeId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          autoComplete="off"
          spellCheck={false}
          placeholder="Start typing, for example Teaneck"
          value={text}
          onChange={(e) => type(e.target.value)}
          onKeyDown={onKeyDown}
          onClick={() => setOpen(true)}
          onBlur={() => {
            setOpen(false);
            setActive(-1);
          }}
          className={`${FIELD} pr-12 ${error ? "border-2 border-gold-700" : ""}`}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={open ? "Hide the town list" : "Show all towns"}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            setOpen(!open);
            (ref && typeof ref !== "function" ? ref.current : null)?.focus();
          }}
          className="pressable absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-control text-ink-600 hover:text-navy-900"
        >
          <ChevronDown
            aria-hidden="true"
            className={`h-5 w-5 transition-transform duration-[var(--duration-pop)] ease-[var(--ease-out)] motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
            strokeWidth={2}
          />
        </button>
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label="Bergen County towns"
          hidden={!open}
          className="absolute left-0 right-0 top-full z-30 mt-1 max-h-72 overflow-auto rounded-control border border-outline-200 bg-white py-1 shadow-raised"
        >
          {options.map((t, i) => (
            <li
              key={t.slug}
              id={`${listId}-${t.slug}`}
              role="option"
              aria-selected={t.slug === selected}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(t)}
              onMouseMove={() => setActive(i)}
              className={`flex min-h-11 cursor-pointer items-center justify-between gap-2 px-3 text-base ${
                i === active ? "bg-blue-100 text-navy-900" : "text-ink-800"
              } ${t.slug === selected ? "font-semibold" : ""}`}
            >
              {t.name}
              {t.slug === selected && <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-gold-400" />}
            </li>
          ))}
          {options.length === 0 && (
            <li role="option" aria-disabled="true" aria-selected={false} className="px-3 py-2 text-base text-ink-600">
              No Bergen County town matches &ldquo;{text}&rdquo;.
            </li>
          )}
        </ul>
      </div>
      <FieldError id={errorId} message={error} />
    </div>
  );
});
