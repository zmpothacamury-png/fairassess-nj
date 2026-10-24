import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

/** Search engines may read everything except the style guide (/design) and the hidden
 *  App Challenge pages (/cover, /handout). */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/design", "/cover", "/handout"] },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
