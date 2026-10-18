import { expect, test, type Page } from "@playwright/test";

/**
 * Search, sharing, and security headers (Prompt 14). Runs against the
 * production build (npm run build first).
 */
/** Collects every Content-Security-Policy violation the browser reports (even ones code catches, like a try/catch around eval). */
async function watchCsp(page: Page): Promise<string[]> {
  const violations: string[] = [];
  await page.addInitScript(() => {
    document.addEventListener("securitypolicyviolation", (e) => console.log(`CSP-VIOLATION ${e.violatedDirective} ${e.blockedURI}`));
  });
  page.on("console", (m) => {
    if (m.text().startsWith("CSP-VIOLATION") || /Content Security Policy/i.test(m.text())) violations.push(m.text());
  });
  return violations;
}

const PAGES = ["/", "/towns", "/towns/teaneck", "/check", "/methodology", "/appeal-guide", "/about", "/contact", "/privacy"];

test.describe("Search and sharing", () => {
  test("sitemap lists every public page and all 70 town pages, not /design", async ({ request }) => {
    const xml = await (await request.get("/sitemap.xml")).text();
    const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
    expect(urls.filter((u) => u.startsWith("/towns/"))).toHaveLength(70);
    for (const p of PAGES.filter((p) => !p.startsWith("/towns/"))) expect(urls).toContain(p);
    expect(urls).not.toContain("/design");
  });

  test("robots.txt allows everything except /design and names the sitemap", async ({ request }) => {
    const txt = await (await request.get("/robots.txt")).text();
    expect(txt).toMatch(/Allow: \/\n/);
    expect(txt).toMatch(/Disallow: \/design/);
    expect(txt).toMatch(/Sitemap: https:\/\/.+\/sitemap\.xml/);
  });

  test("every page: tab title, description, canonical link, share image", async ({ page }) => {
    for (const p of PAGES) {
      await page.goto(p);
      await expect(page).toHaveTitle("Fair Assess NJ");
      expect(await page.locator('meta[name="description"]').getAttribute("content")).toBeTruthy();
      expect(new URL((await page.locator('link[rel="canonical"]').getAttribute("href"))!).pathname).toBe(p);
      expect(await page.locator('meta[property="og:image"]').first().getAttribute("content")).toBeTruthy();
      expect(await page.locator('meta[name="twitter:image"]').first().getAttribute("content")).toBeTruthy();
      expect(await page.locator('meta[name="twitter:card"]').getAttribute("content")).toBe("summary_large_image");
    }
  });

  test("a town page has its own generated share image", async ({ page, request }) => {
    await page.goto("/towns/teaneck");
    const og = (await page.locator('meta[property="og:image"]').first().getAttribute("content"))!;
    expect(og).toContain("/towns/teaneck/opengraph-image");
    const res = await request.get(new URL(og).pathname + new URL(og).search);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toBe("image/png");
  });

  test("JSON-LD: WebApplication on every page, Dataset on /towns", async ({ page }) => {
    const types = async () =>
      (await page.locator('script[type="application/ld+json"]').allTextContents()).map((t) => JSON.parse(t)["@type"]);
    await page.goto("/");
    expect(await types()).toEqual(["WebApplication"]);
    await page.goto("/towns");
    expect(await types()).toEqual(["WebApplication", "Dataset"]);
  });

  test("icons are linked", async ({ page, request }) => {
    await page.goto("/");
    for (const sel of ['link[rel="icon"][type="image/x-icon"]', 'link[rel="icon"][type="image/png"]', 'link[rel="apple-touch-icon"]']) {
      const href = (await page.locator(sel).first().getAttribute("href"))!;
      expect((await request.get(href)).status()).toBe(200);
    }
  });
});

test.describe("Security", () => {
  test("headers are set on pages", async ({ request }) => {
    const h = (await request.get("/")).headers();
    expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(h["content-security-policy"]).toContain("default-src 'self'");
    expect(h["content-security-policy"]).not.toContain("unsafe-eval");
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(h["permissions-policy"]).toContain("camera=()");
  });

  test("data files get a cache header", async ({ request }) => {
    expect((await request.get("/data/towns.json")).headers()["cache-control"]).toContain("max-age=600");
  });

  test("no page breaks the Content-Security-Policy", async ({ page }) => {
    const violations = await watchCsp(page);
    for (const p of PAGES) await page.goto(p, { waitUntil: "networkidle" });
    // The checker loads a town file after a result.
    await page.goto("/check");
    await page.getByRole("combobox", { name: "Your town" }).fill("Teaneck");
    await page.getByLabel("Your assessed value").fill("450000");
    await page.getByRole("button", { name: "Check my assessment" }).click();
    await expect(page.getByRole("heading", { level: 2, name: /Your result for Teaneck/ })).toBeVisible();
    expect(violations).toEqual([]);
  });

  test("the waitlist can still reach Supabase (request faked, nothing saved)", async ({ page }) => {
    const violations = await watchCsp(page);
    let reached = "";
    // A request only gets here if the CSP allowed it. It is answered locally and never reaches Supabase.
    await page.route(/supabase\.co\/rest\/v1\/waitlist/, async (route) => {
      reached = route.request().url();
      await route.fulfill({ status: 201, body: "" });
    });
    await page.goto("/contact");
    await page.locator("#updates").getByLabel("Email address").fill("csp-test@example.com");
    await page.locator("#updates").getByRole("button", { name: "Get updates" }).click();
    await expect(page.getByText(/You.re signed up/)).toBeVisible();
    expect(reached).toMatch(/^https:\/\/[a-z0-9]+\.supabase\.co\//);
    expect(violations).toEqual([]);
  });
});
