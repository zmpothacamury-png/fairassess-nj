import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * Accessibility scan: axe-core on every main page, plus /check
 * before and after a result. The test fails on any serious or critical issue
 * (WCAG 2.0/2.1 A and AA rules). Minor and moderate issues are printed.
 */
const PAGES = [
  { name: "home", path: "/" },
  { name: "towns", path: "/towns" },
  { name: "town page", path: "/towns/teaneck" },
  { name: "check (empty)", path: "/check" },
  { name: "methodology", path: "/methodology" },
  { name: "appeal guide", path: "/appeal-guide" },
  { name: "about", path: "/about" },
  { name: "privacy", path: "/privacy" },
  { name: "contact", path: "/contact" },
];

async function scan(page: Page) {
  // Reveal animations start content at opacity 0; wait for them to finish so axe sees final colors.
  await page.emulateMedia({ reducedMotion: "reduce" });
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const blocking = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  for (const v of results.violations) {
    console.log(`[axe] ${v.impact} ${v.id}: ${v.help} (${v.nodes.length}) ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`);
  }
  expect(blocking.map((v) => `${v.id} (${v.nodes.length})`)).toEqual([]);
}

test.describe("Accessibility (axe)", () => {
  for (const p of PAGES) {
    test(p.name, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(p.path);
      await scan(page);
    });
  }

  test("every page says lang=\"en\"", async ({ page }) => {
    for (const p of PAGES) {
      await page.goto(p.path);
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
    }
  });

  test("every chart has a table you can open", async ({ page }) => {
    for (const p of ["/towns", "/towns/teaneck", "/methodology"]) {
      await page.goto(p);
      const charts = page.locator(".recharts-responsive-container");
      await expect(charts.first()).toBeVisible();
      const n = await charts.count();
      for (let i = 0; i < n; i++) {
        const figure = charts.nth(i).locator("xpath=ancestor::figure[1]");
        await expect(figure.getByRole("button", { name: "View as table" })).toBeVisible();
        await expect(figure.locator("table")).toHaveCount(1);
      }
    }
  });

  test("keyboard focus is always visible", async ({ page }) => {
    for (const p of [...PAGES.map((x) => x.path), "/no-such-page"]) {
      await page.goto(p);
      for (let i = 0; i < 25; i++) {
        await page.keyboard.press("Tab");
        const bad = await page.evaluate(() => {
          const el = document.activeElement as HTMLElement | null;
          if (!el || el === document.body) return null;
          const s = getComputedStyle(el);
          const ringed = (s.outlineStyle !== "none" && parseFloat(s.outlineWidth) >= 2) || s.boxShadow !== "none";
          return ringed ? null : `${el.tagName} ${el.textContent?.trim().slice(0, 40)}`;
        });
        expect(bad, `${p}: tab stop ${i + 1}`).toBeNull();
      }
    }
  });

  test("rankings table sorts with the keyboard", async ({ page }) => {
    await page.goto("/towns");
    const table = page.getByRole("region", { name: "Town rankings table" });
    await table.getByRole("button", { name: "Town" }).focus();
    await page.keyboard.press("Enter");
    await expect(table.locator('th[aria-sort="ascending"]')).toContainText("Town");
    await page.keyboard.press("Space");
    await expect(table.locator('th[aria-sort="descending"]')).toContainText("Town");
    await page.keyboard.press("Tab");
    await expect(page.locator(":focus")).toBeVisible();
  });

  test.describe("200% browser zoom (1280px window)", () => {
    test.use({ viewport: { width: 640, height: 400 }, deviceScaleFactor: 2 });
    for (const p of PAGES) {
      test(`${p.name}: no sideways scrolling`, async ({ page }) => {
        await page.goto(p.path);
        expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
      });
    }
  });

  test("check (with a result and the math open)", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/check");
    await page.getByRole("combobox", { name: "Your town" }).fill("Teaneck");
    await page.getByLabel("Your assessed value").fill("450000");
    await page.getByRole("button", { name: "Check my assessment" }).click();
    await expect(page.getByRole("heading", { level: 2, name: /Your result for Teaneck/ })).toBeVisible();
    await page.getByRole("button", { name: "Show the math" }).click();
    await scan(page);
  });
});
