import type { Metadata } from "next";
import type { Meta } from "@/lib/data/schema";
import { GITHUB_URL, SITE_NAME, SITE_URL } from "@/lib/site";
import { SOURCES } from "@/lib/sources";

/**
 * Search and sharing helpers (Prompt 14). Every title is SITE_NAME: the browser
 * tab reads "Fair Assess NJ" on every page (Zaden, 2026-10-15 and 2026-10-18).
 * Each page gets its own description and canonical link instead.
 */

/** The public town-statistics download (the Dataset in JSON-LD). */
export const CSV_PATH = "/downloads/fairassess-nj-town-stats.csv";

/** Data license (README "License": reports and data are CC-BY 4.0). */
export const DATA_LICENSE_URL = "https://creativecommons.org/licenses/by/4.0/";

/**
 * The site-wide share image (app/opengraph-image.png, app/twitter-image.png).
 * A page that sets its own openGraph stops inheriting the file, so it is named
 * here. Town pages pass ownImage, so their generated opengraph-image applies.
 * The alt text matches app/opengraph-image.alt.txt (lib/seo.test.ts checks).
 */
export const SHARE_IMAGE_ALT =
  "The Fair Assess NJ logo shows a house on balance scales over an outline of New Jersey. The left side is blue and the right side is green. The tagline reads Public Assessment Equity.";
const OG_IMAGE = { url: "/opengraph-image.png", width: 1200, height: 630, alt: SHARE_IMAGE_ALT };
const TWITTER_IMAGE = { url: "/twitter-image.png", width: 1200, height: 630, alt: SHARE_IMAGE_ALT };

/**
 * Title, description, canonical link, Open Graph, and Twitter card for one page.
 * ownImage: the page has its own opengraph-image file (town pages), so the
 * site-wide image is left out; naming it here would replace the page's own.
 */
export function pageMetadata({
  path,
  description,
  ownImage = false,
}: {
  path: string;
  description: string;
  ownImage?: boolean;
}): Metadata {
  const og = ownImage ? {} : { images: [OG_IMAGE] };
  const tw = ownImage ? {} : { images: [TWITTER_IMAGE] };
  return {
    title: SITE_NAME,
    description,
    alternates: { canonical: path },
    openGraph: { siteName: SITE_NAME, type: "website", title: SITE_NAME, description, url: path, ...og },
    twitter: { card: "summary_large_image", title: SITE_NAME, description, ...tw },
  };
}

/** A full URL on this site, from a path like "/towns". */
export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

/** JSON-LD: the site as a free web application. */
export function webApplicationJsonLd(description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_NAME,
    url: absoluteUrl("/"),
    description,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Any (runs in a web browser)",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    inLanguage: "en-US",
    sameAs: [GITHUB_URL],
  };
}

/** JSON-LD: the downloadable town statistics CSV. Dates come from meta.json. */
export function datasetJsonLd(meta: Meta) {
  const sales = meta.town_stats_sales;
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: `${SITE_NAME} town assessment statistics, ${meta.county} County`,
    description: `Assessment ratio statistics (median ratio, COD, PRD, PRB) for single-family home sales in each of the ${meta.n_towns} towns in ${meta.county} County, New Jersey, recorded ${sales.recorded_from} to ${sales.recorded_to}.`,
    url: absoluteUrl("/towns"),
    license: DATA_LICENSE_URL,
    isAccessibleForFree: true,
    dateModified: meta.generated_at.slice(0, 10),
    temporalCoverage: `${sales.recorded_from}/${sales.recorded_to}`,
    spatialCoverage: { "@type": "Place", name: `${meta.county} County, New Jersey` },
    creator: { "@type": "Organization", name: SITE_NAME, url: absoluteUrl("/") },
    isBasedOn: { "@type": "Dataset", name: SOURCES.sr1a.label, url: SOURCES.sr1a.url },
    distribution: [{ "@type": "DataDownload", encodingFormat: "text/csv", contentUrl: absoluteUrl(CSV_PATH) }],
  };
}

/** Turns an object into a JSON-LD script body. "<" is escaped so the text can't close the script tag. */
export function jsonLdScript(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
