"use client";

import { ChevronDown, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { NAV_CTA, NAV_ITEMS, isActive } from "@/lib/nav";
import type { NavLink } from "@/lib/nav";
import { NAV } from "@/lib/motion";
import { buttonClasses } from "./Button";

// .nav-link (app/globals.css) draws T&T's gold underline that grows on hover and on the current page.
const TAB =
  "nav-link focus-ring relative inline-flex min-h-12 items-center gap-1 whitespace-nowrap px-1 text-sm font-semibold transition-colors";

/** Closes a menu on Escape (returning focus to its button) or on a click outside `area`. */
function useDismiss(
  open: boolean,
  close: () => void,
  area: RefObject<HTMLElement | null>,
  button: RefObject<HTMLButtonElement | null>,
) {
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        close();
        button.current?.focus();
      }
    }
    function onClick(event: MouseEvent) {
      const target = event.target as Node;
      if (!area.current?.contains(target) && !button.current?.contains(target)) close();
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open, close, area, button]);
}

function TabLink({ link, pathname }: { link: NavLink; pathname: string }) {
  const active = isActive(link.href, pathname);
  return (
    <Link
      href={link.href}
      aria-current={active ? "page" : undefined}
      data-active={active}
      className={`${TAB} ${active ? "text-navy-900" : "text-ink-600 hover:text-navy-900"}`}
    >
      {link.label}
    </Link>
  );
}

/** "Learn" dropdown: How It Works and Appeal Guide. */
function LearnMenu({ label, items, pathname }: { label: string; items: NavLink[]; pathname: string }) {
  const [open, setOpen] = useState(false);
  const areaRef = useRef<HTMLUListElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const active = items.some((item) => isActive(item.href, pathname));
  useDismiss(open, () => setOpen(false), areaRef, buttonRef);

  return (
    <li className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls="learn-menu"
        data-active={active}
        onClick={() => setOpen(!open)}
        className={`${TAB} ${active ? "text-navy-900" : "text-ink-600 hover:text-navy-900"}`}
      >
        {label}
        <ChevronDown aria-hidden="true" className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} strokeWidth={2} />
      </button>
      {open && (
        <ul
          ref={areaRef}
          id="learn-menu"
          className="absolute left-0 top-full z-50 mt-1 w-56 rounded-card border border-outline-200 bg-white p-2 shadow-raised"
        >
          {items.map((item) => {
            const current = isActive(item.href, pathname);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={current ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={`focus-ring block rounded-control px-4 py-2 text-sm font-semibold hover:bg-blue-100 ${
                    current ? "bg-blue-100 text-navy-900" : "text-ink-800"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}

/**
 * Site header in Trust & Transition's format: logo + name on the left, tabs,
 * and the "Check My Assessment" button on the right (where T&T has "Sign Up").
 * Sticky; gains a border and shadow after 8px of scroll. Below 1280px the tabs
 * move into a menu that slides in from the right (T&T does this at 860px; we
 * have more tabs).
 */
export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const allLinks = NAV_ITEMS.flatMap((item) => ("children" in item ? item.children : [item]));
  useDismiss(menuOpen, () => setMenuOpen(false), menuRef, toggleRef);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > NAV.scrolledAfterPx);
    const frame = requestAnimationFrame(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <>
      <header data-scrolled={scrolled} className="site-header sticky top-0 z-40 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-18 max-w-content items-center gap-6 px-6">
          <Link href="/" className="focus-ring flex shrink-0 items-center gap-2" aria-label="Fair Assess NJ home">
            <Image src="/logo-icon.png" alt="" width={394} height={698} priority className="h-11 w-auto" />
            <span className="font-heading text-lg font-extrabold tracking-wide text-navy-700">FAIR ASSESS NJ</span>
          </Link>

          <nav aria-label="Main" className="ml-auto hidden xl:block">
            <ul className="flex items-center gap-6">
              {NAV_ITEMS.map((item) =>
                "children" in item ? (
                  <LearnMenu key={item.label} label={item.label} items={item.children} pathname={pathname} />
                ) : (
                  <li key={item.href}>
                    <TabLink link={item} pathname={pathname} />
                  </li>
                ),
              )}
            </ul>
          </nav>

          <div className="hidden shrink-0 xl:block">
            <Link href={NAV_CTA.href} className={`${buttonClasses("primary", "md")} whitespace-nowrap`}>
              {NAV_CTA.label}
            </Link>
          </div>

          <button
            ref={toggleRef}
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen(!menuOpen)}
            className="focus-ring ml-auto inline-flex h-12 w-12 items-center justify-center rounded-control border border-ink-600 text-navy-900 xl:hidden"
          >
            {menuOpen ? <X aria-hidden="true" className="h-6 w-6" /> : <Menu aria-hidden="true" className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* Outside <header>: its backdrop blur would trap this fixed panel inside the header box. */}
      <nav
        ref={menuRef}
        id="mobile-menu"
        aria-label="Main"
        data-open={menuOpen}
        inert={!menuOpen}
        className="mobile-menu fixed inset-x-0 bottom-0 top-18 z-50 overflow-y-auto bg-mist-50 xl:hidden"
      >
        <ul className="mx-auto flex max-w-content flex-col gap-2 px-6 py-8">
          {allLinks.map((link) => {
            const active = isActive(link.href, pathname);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                  className={`focus-ring flex min-h-12 items-center border-l-4 pl-4 text-lg font-semibold ${
                    active ? "border-gold-400 text-navy-900" : "border-transparent text-ink-800"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
          <li className="mt-6">
            <Link
              href={NAV_CTA.href}
              onClick={() => setMenuOpen(false)}
              className={`${buttonClasses("primary", "lg")} w-full`}
            >
              {NAV_CTA.label}
            </Link>
          </li>
        </ul>
      </nav>
    </>
  );
}
