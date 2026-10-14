import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import Image from "next/image";
import Link from "next/link";
import { FOOTER_COLUMNS } from "@/lib/nav";
import type { NavLink } from "@/lib/nav";
import { Disclaimer } from "./Disclaimer";

/**
 * "Data as of" date, read at build time from site/public/data/meta.json
 * (written by the pipeline's export step; never hand-edited). Until the
 * pipeline has run, the footer says so instead of showing a made-up date.
 */
function readDataAsOf(): string | null {
  const file = join(process.cwd(), "public", "data", "meta.json");
  if (!existsSync(file)) return null;
  const meta = JSON.parse(readFileSync(file, "utf8")) as { data_as_of?: string };
  return meta.data_as_of ?? null;
}

const LINK = "focus-ring-dark text-outline-200 underline-offset-4 transition-colors hover:text-white hover:underline";

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
 * Site footer, on every page (CLAUDE.md rule 4). Three bands on the site grid:
 * 1. Brand + disclaimer (left), link columns (right).
 * 2. Data trust lines: data date, source, independence.
 * 3. Bottom bar: credit and the tagline (T&T's tagline spot).
 * Stacks to one column on phones; link columns sit two across, then three.
 */
export function Footer() {
  const year = new Date().getFullYear();
  const dataAsOf = readDataAsOf();

  return (
    <footer className="bg-navy-900 text-outline-200">
      <div className="mx-auto max-w-content px-6 pb-8 pt-16">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <p className="flex items-center gap-2 font-heading text-lg font-extrabold tracking-wide text-white">
              <Image src="/logo-icon-light.png" alt="" width={394} height={698} className="h-10 w-auto" />
              FAIRASSESS NJ
            </p>
            <Disclaimer tone="dark" className="mt-6 max-w-md" />
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:col-span-6 lg:col-start-7">
            {FOOTER_COLUMNS.map((column) => (
              <div key={column.title}>
                <h2 className="eyebrow text-gold-400">{column.title}</h2>
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

        <div className="mt-12 border-t border-white/15 pt-8">
          <div className="grid max-w-prose gap-4 text-sm lg:max-w-none lg:grid-cols-3 lg:gap-8">
            <p>
              <span className="font-semibold text-white">Data as of: </span>
              {dataAsOf ?? "Not yet published. The first results are coming soon."}
            </p>
            <p>
              <span className="font-semibold text-white">Source: </span>
              New Jersey Division of Taxation SR-1A sales files, Chapter 123 average ratios, and
              Director&rsquo;s ratios.
            </p>
            <p>
              FairAssess NJ is an independent student research project. It is not affiliated with any
              municipality, county, or the State of New Jersey.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-white/15 pt-6 text-sm lg:flex-row lg:items-center lg:justify-between">
          <span>Built by Zaden Pothacamury, Ramapo High School. &copy; {year} FairAssess NJ</span>
          <span className="eyebrow whitespace-nowrap text-gold-400">Public Assessment Equity.</span>
        </div>
      </div>
    </footer>
  );
}
