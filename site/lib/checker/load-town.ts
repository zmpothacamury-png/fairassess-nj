// The checker's only network call: load one town's public data file.
//
// Privacy (privacy rule): the request is a plain GET for a static file,
// /data/towns/<slug>.json. It carries no body, no query string, and no
// cookies, so the assessed value and the market value estimate never leave
// the browser. The price index and the town list are built into the page at
// build time, so they need no request. checker.test.ts checks all of this.
import { TownFileSchema, type TownFile } from "../data/schema";

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Path of a town's data file on the site. Throws for anything that is not a plain town slug. */
export function townFileUrl(slug: string): string {
  if (!SLUG.test(slug)) throw new Error(`"${slug}" is not a valid town slug`);
  return `/data/towns/${slug}.json`;
}

/** Fetch one town's file and check it against the data contract (docs/data-contract.md). */
export async function fetchTownFile(slug: string, fetchFn: typeof fetch = fetch): Promise<TownFile> {
  const response = await fetchFn(townFileUrl(slug), { method: "GET", credentials: "omit" });
  if (!response.ok) throw new Error(`Could not load the data for this town (HTTP ${response.status}).`);
  return TownFileSchema.parse(await response.json());
}
