import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { stripQueryAndHash } from "./analytics";
import { loadMeta } from "./data/load";
import { absoluteUrl, CSV_PATH, SHARE_IMAGE_ALT, datasetJsonLd, jsonLdScript, pageMetadata, webApplicationJsonLd } from "./seo";
import { SITE_NAME, SITE_URL } from "./site";

describe("pageMetadata", () => {
  it("keeps the site name as the title and sets the canonical link", () => {
    const m = pageMetadata({ path: "/towns", description: "Rankings." });
    expect(m.title).toBe(SITE_NAME);
    expect(m.description).toBe("Rankings.");
    expect(m.alternates?.canonical).toBe("/towns");
    expect(m.openGraph).toMatchObject({ siteName: SITE_NAME, title: SITE_NAME, url: "/towns", description: "Rankings." });
    expect(m.twitter).toMatchObject({ card: "summary_large_image", title: SITE_NAME });
    expect(m.openGraph?.images).toEqual([expect.objectContaining({ url: "/opengraph-image.png", width: 1200, height: 630 })]);
  });

  it("leaves the site image out when the page has its own", () => {
    const m = pageMetadata({ path: "/towns/teaneck", description: "Teaneck.", ownImage: true });
    expect(m.openGraph?.images).toBeUndefined();
    expect(m.twitter && "images" in m.twitter).toBe(false);
  });
});

describe("share image", () => {
  it("alt text matches the .alt.txt files", () => {
    for (const f of ["opengraph-image.alt.txt", "twitter-image.alt.txt"]) {
      expect(readFileSync(path.join(process.cwd(), "app", f), "utf8").trim()).toBe(SHARE_IMAGE_ALT);
    }
  });
});

describe("JSON-LD", () => {
  it("absoluteUrl joins the production URL and a path", () => {
    expect(absoluteUrl("/towns")).toBe(`${SITE_URL}/towns`);
  });

  it("WebApplication is free and points at the site", () => {
    const j = webApplicationJsonLd("About the site.");
    expect(j["@type"]).toBe("WebApplication");
    expect(j.url).toBe(`${SITE_URL}/`);
    expect(j.isAccessibleForFree).toBe(true);
    expect(j.offers.price).toBe("0");
  });

  it("Dataset takes its dates from meta.json and links the CSV and the SR1A source", async () => {
    const meta = await loadMeta();
    const j = datasetJsonLd(meta);
    expect(j.dateModified).toBe(meta.generated_at.slice(0, 10));
    expect(j.temporalCoverage).toBe(`${meta.town_stats_sales.recorded_from}/${meta.town_stats_sales.recorded_to}`);
    expect(j.distribution[0].contentUrl).toBe(`${SITE_URL}${CSV_PATH}`);
    expect(j.license).toBe("https://creativecommons.org/licenses/by/4.0/");
    expect(j.isBasedOn.url).toBe("https://www.nj.gov/treasury/taxation/lpt/statdata.shtml");
  });

  it("the CSV the Dataset points to exists", () => {
    expect(statSync(path.join(process.cwd(), "public", CSV_PATH)).size).toBeGreaterThan(0);
  });

  it("escapes < so the text can't end the script tag", () => {
    expect(jsonLdScript({ a: "</script><b>" })).toBe('{"a":"\\u003c/script>\\u003cb>"}');
  });
});

describe("analytics", () => {
  it("sends only the page path: no query or hash", () => {
    const e = stripQueryAndHash({ type: "pageview" as const, url: "https://fairassessnj.vercel.app/check?value=450000#result" });
    expect(e.url).toBe("https://fairassessnj.vercel.app/check");
    expect(e.type).toBe("pageview");
  });

  it("only SiteAnalytics imports analytics, and no custom events exist (rule 3)", () => {
    const hits: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const p = path.join(dir, name);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.tsx?$/.test(name) && !name.endsWith(".test.ts") && !name.endsWith(".test.tsx")) {
          const src = readFileSync(p, "utf8");
          if (/@vercel\/analytics/.test(src) || /\btrack\(/.test(src)) hits.push(path.relative(process.cwd(), p));
        }
      }
    };
    for (const d of ["app", "components", "lib"]) walk(path.join(process.cwd(), d));
    expect(hits.map((h) => h.replaceAll("\\", "/"))).toEqual(["components/SiteAnalytics.tsx"]);
  });
});
