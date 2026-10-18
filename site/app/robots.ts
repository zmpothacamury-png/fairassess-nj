import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

/** Search engines may read everything except the style guide (/design). */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/design" },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
