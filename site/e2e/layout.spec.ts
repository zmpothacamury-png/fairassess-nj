import { expect, test } from "@playwright/test";

/** Every page must fit its screen: no sideways scrolling on phones, iPads, or desktops. */
const PAGES = ["/", "/towns", "/check", "/methodology", "/appeal-guide", "/about", "/contact", "/privacy", "/design", "/no-such-page"];
const SCREENS = [
  { name: "small phone", width: 375, height: 667 },
  { name: "phone", width: 390, height: 844 },
  { name: "iPad portrait", width: 768, height: 1024 },
  { name: "iPad landscape", width: 1024, height: 768 },
  { name: "laptop", width: 1280, height: 800 },
  { name: "desktop", width: 1440, height: 900 },
];

for (const screen of SCREENS) {
  test.describe(`${screen.name} (${screen.width}px)`, () => {
    test.use({ viewport: { width: screen.width, height: screen.height } });

    for (const path of PAGES) {
      test(`${path} has no sideways scrolling`, async ({ page }) => {
        await page.goto(path);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow).toBeLessThanOrEqual(0);
      });
    }

    test("header shows the right navigation for this width", async ({ page }) => {
      await page.goto("/");
      const menuButton = page.getByRole("button", { name: "Open menu" });
      if (screen.width >= 1280) {
        await expect(menuButton).toBeHidden();
        await expect(page.getByRole("link", { name: "Check My Assessment" }).first()).toBeVisible();
      } else {
        await expect(menuButton).toBeVisible();
        await menuButton.click();
        await expect(page.locator("#mobile-menu").getByRole("link", { name: "Town Rankings" })).toBeVisible();
      }
    });
  });
}
