import type { MetadataRoute } from "next";
import { loadMeta, loadTowns } from "@/lib/data/load";
import { absoluteUrl } from "@/lib/seo";

/** Every public page (not /design) and all 70 town pages. Data pages use the pipeline's export date. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [meta, towns] = await Promise.all([loadMeta(), loadTowns()]);
  const dataDate = new Date(meta.generated_at);
  const pages = ["/", "/towns", "/check", "/methodology", "/appeal-guide", "/about", "/contact", "/privacy"];
  return [
    ...pages.map((p) => ({ url: absoluteUrl(p), lastModified: dataDate })),
    ...towns.map((t) => ({ url: absoluteUrl(`/towns/${t.slug}`), lastModified: dataDate })),
  ];
}
