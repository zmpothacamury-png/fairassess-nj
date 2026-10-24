import Image from "next/image";
import Link from "next/link";
import { loadMeta } from "@/lib/data/load";
import { formatLongDate } from "@/lib/home";
import { FOOTER_COLUMNS } from "@/lib/nav";
import type { NavLink } from "@/lib/nav";
import { Disclaimer } from "./Disclaimer";

const LINK = "focus-ring text-ink-800 underline-offset-4 transition-colors hover:text-blue-600 hover:underline";

function FooterLink({ link }: { link: NavLink }) {
  return link.external ? (
    <a href={link.href} className={LINK} rel="noopener noreferrer">
      {link.label}
    </a>
  ) : (
    <Link href={link.href} className={LINK}>
      {link.label}
    </Link>
  );
}

/**
 * The logo's balance, drawn as a line: blue on the left half, green on the
 * right, with the gold pivot dot in the middle. Decorative only.
 */
function BalanceLine({ thick = false }: { thick?: boolean }) {
  const h = thick ? "h-1.5" : "h-px";
  return (
    <div aria-hidden="true" className="relative flex items-center">
      <span className={`${h} flex-1 bg-blue-600`} />
      <span className={`${h} flex-1 bg-green-600`} />
      <span
        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-400 ring-4 ring-blue-100 ${
          thick ? "h-4 w-4" : "h-2 w-2"
        }`}
      />
    </div>
  );
}

/**
 * Site footer, on every page (disclaimer rule). Three bands on the site grid:
 * 1. Brand + disclaimer (left), link columns (right).
 * 2. Data trust lines: data date, source, independence.
 * 3. Bottom bar: credit and the tagline (T&T's tagline spot).
 * Stacks to one column on phones; link columns sit two across, then three.
 *
 * Colors follow the logo, not T&T's navy-and-gold footer: a light blue tint
 * (like the logo's background), navy text, the full-color logo icon, and the
 * logo's blue/green balance with its gold pivot dot as the dividers.
 */
export async function Footer() {
  const year = new Date().getFullYear();
  // "Data as of" comes from meta.json (pipeline export; never hand-edited), checked by the loader.
  const meta = await loadMeta();

  return (
    <footer className="bg-blue-100 text-ink-800">
      <BalanceLine thick />
      <div className="mx-auto max-w-content px-6 pb-8 pt-16">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <p className="flex items-center gap-2 font-heading text-lg font-extrabold tracking-wide text-navy-700">
              <Image src="/logo-icon.png" alt="" width={23} height={40} className="h-10 w-auto" />
              FAIR ASSESS NJ
            </p>
            <Disclaimer className="mt-6 max-w-md" />
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:col-span-6 lg:col-start-7">
            {FOOTER_COLUMNS.map((column) => (
              <div key={column.title}>
                <h2 className="eyebrow text-navy-900">{column.title}</h2>
                <span aria-hidden="true" className="mt-2 flex h-0.5 w-10">
                  <span className="flex-1 bg-blue-600" />
                  <span className="flex-1 bg-green-600" />
                </span>
                <ul className="mt-4 flex flex-col gap-3 text-sm">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <FooterLink link={link} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-12">
          <BalanceLine />
        </div>
        <div className="pt-8">
          <div className="grid max-w-prose gap-4 text-sm lg:max-w-none lg:grid-cols-3 lg:gap-8">
            <p>
              <span className="font-semibold text-navy-900">Data as of: </span>
              <span className="tabular-nums">{formatLongDate(meta.data_as_of)}</span>
              <span className="block text-ink-600">Methodology version {meta.methodology_version}</span>
            </p>
            <p>
              <span className="font-semibold text-navy-900">Source: </span>
              New Jersey Division of Taxation SR-1A sales files, Chapter 123 average ratios, and
              Director&rsquo;s ratios.
            </p>
            <p>
              Fair Assess NJ is an independent student research project. It is not affiliated with any
              municipality, county, or the State of New Jersey.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-outline-200 pt-6 text-sm text-ink-600 lg:flex-row lg:items-center lg:justify-between">
          <span>Built by Zaden Pothacamury, Ramapo High School. &copy; {year} Fair Assess NJ</span>
          <span className="eyebrow flex items-center gap-2 whitespace-nowrap text-navy-700">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-gold-400" />
            Public Assessment Equity.
          </span>
        </div>
      </div>
    </footer>
  );
}
