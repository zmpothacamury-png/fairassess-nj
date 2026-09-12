const NAV_LINKS = [
  { href: "#problem", label: "The problem" },
  { href: "#roadmap", label: "What we're building" },
  { href: "#methodology", label: "Methodology" },
];

/**
 * Sticky top bar: wordmark + monogram on the left, in-page nav in the
 * middle (hidden on small screens), and a waitlist link on the right that
 * stays visible at every width.
 */
export function TopBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate/15 bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-4">
        <a
          href="#top"
          className="flex items-center gap-2 font-serif text-lg font-semibold text-ink"
        >
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-ink font-serif text-sm font-semibold text-paper"
            aria-hidden="true"
          >
            FA
          </span>
          <span className="hidden sm:inline">FairAssess NJ</span>
        </a>

        <nav
          aria-label="Section"
          className="hidden flex-1 items-center gap-6 md:flex"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-slate transition hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <a
          href="#waitlist"
          className="ml-auto whitespace-nowrap rounded-sm border border-gold bg-gold px-4 py-2 text-sm font-semibold text-ink transition hover:brightness-90 md:ml-0"
        >
          Get notified
        </a>
      </div>
    </header>
  );
}
