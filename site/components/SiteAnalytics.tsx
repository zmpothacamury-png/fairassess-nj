"use client";

import { Analytics } from "@vercel/analytics/next";
import { stripQueryAndHash } from "@/lib/analytics";

/**
 * Vercel Web Analytics, page views only (Zaden approved). No
 * custom events anywhere, and each URL is sent without its ?query or #hash.
 * This is the only file that may import @vercel/analytics (lib/seo.test.ts).
 */
export function SiteAnalytics() {
  return <Analytics beforeSend={stripQueryAndHash} />;
}
