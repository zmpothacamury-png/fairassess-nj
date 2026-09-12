// Required on every page. See CLAUDE.md rule 3. Do not shorten or reword this.
const DISCLAIMER =
  "FairAssess NJ provides public-data analysis for educational purposes. It is not legal advice, tax advice, or an appraisal. Homeowners file and present their own appeals. Check your county board for current deadlines, fees, and forms.";

const FOOTER_LINKS = [
  { href: "#problem", label: "The problem" },
  { href: "#roadmap", label: "What we're building" },
  { href: "#methodology", label: "Methodology" },
  { href: "#waitlist", label: "Get notified" },
];

/** Site footer. Lives in the root layout so it shows up on every page. */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-ink text-mist">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-8 border-b border-paper/15 pb-8 sm:flex-row sm:items-start sm:justify-between">
          <p className="font-serif text-lg text-paper">FairAssess NJ</p>

          <nav
            aria-label="Footer"
            className="flex flex-wrap gap-x-6 gap-y-2 text-sm"
          >
            {FOOTER_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="underline-offset-2 hover:text-paper hover:underline"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <p className="mt-6 max-w-[68ch] text-sm">{DISCLAIMER}</p>

        <p className="mt-4 max-w-[68ch] text-sm">
          FairAssess NJ is an independent student research project. It is not
          affiliated with any municipality, county, or the State of New
          Jersey.
        </p>

        <p className="mt-6 text-sm">© {year} FairAssess NJ</p>
      </div>
    </footer>
  );
}
