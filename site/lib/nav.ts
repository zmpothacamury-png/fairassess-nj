/**
 * Site navigation, shaped like Trust & Transition's (docs/site-format.md).
 * "Learn" groups How It Works and Appeal Guide so the header fits at 1280px
 * (Zaden's choice). Contact is not a header tab; it lives in the footer's
 * link row with Methodology, Privacy, About, and GitHub (Zaden's choice).
 */
import { GITHUB_URL } from "./site";

export type NavLink = { href: string; label: string; external?: boolean };
export type NavItem = NavLink | { label: string; children: NavLink[] };

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/towns", label: "Town Rankings" },
  { href: "/check", label: "Appeal Checker" },
  {
    label: "Learn",
    children: [
      { href: "/methodology", label: "How It Works" },
      { href: "/appeal-guide", label: "Appeal Guide" },
    ],
  },
  { href: "/about", label: "About" },
];

/** Header button, in the spot where T&T has "Sign Up". */
export const NAV_CTA: NavLink = { href: "/check", label: "Check My Assessment" };

/** GitHub issue form for reporting a data problem (.github/ISSUE_TEMPLATE/data-problem.md). */
export const REPORT_PROBLEM_URL = `${GITHUB_URL}/issues/new?template=data-problem.md`;

/** Footer link columns. Zaden removed the "Get Involved" column on 2026-10-14. */
export const FOOTER_COLUMNS: { title: string; links: NavLink[] }[] = [
  {
    title: "Site",
    links: [
      { href: "/", label: "Home" },
      { href: "/towns", label: "Town Rankings" },
      { href: "/check", label: "Appeal Checker" },
      { href: "/methodology", label: "How It Works" },
      { href: "/appeal-guide", label: "Appeal Guide" },
      { href: "/about", label: "About" },
    ],
  },
  {
    title: "Tools",
    links: [
      { href: "/towns", label: "Town Rankings" },
      { href: "/check", label: "Appeal Checker" },
      { href: `${GITHUB_URL}/tree/main/data/processed`, label: "Download the data", external: true },
    ],
  },
  {
    // Zaden: Contact belongs with Methodology, Privacy, About, and GitHub, not in the header.
    title: "Project",
    links: [
      { href: "/methodology", label: "Methodology" },
      { href: "/privacy", label: "Privacy" },
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: GITHUB_URL, label: "GitHub", external: true },
    ],
  },
];

/**
 * True when `href` is the current page or a page inside it.
 * "/" only matches the home page itself, so it is not active everywhere.
 * Example: "/towns" is active on "/towns/ridgewood".
 */
export function isActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
