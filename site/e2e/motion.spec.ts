import { expect, test } from "@playwright/test";

const CUE = { name: "Scroll to explore and go to the next section" };

test.describe("Scroll to explore button", () => {
  test("jumps to the next section, just under the header, and moves focus there", async ({ page }) => {
    await page.goto("/");
    const cue = page.getByRole("button", CUE);
    await expect(cue).toBeVisible();

    await cue.click();
    // Wait for the smooth scroll to settle on the second section (#problem).
    await expect
      .poll(async () =>
        page.evaluate(() => {
          const header = document.querySelector<HTMLElement>(".site-header")!.offsetHeight;
          const top = document.getElementById("problem")!.getBoundingClientRect().top;
          return Math.round(top - header);
        }),
      )
      .toBe(-4); // T&T lands 4px past the header line (site.js:234).

    await expect(page.locator("#problem")).toBeFocused();
  });

  test("hides when the footer comes into view", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.locator(".scroll-cue")).toHaveAttribute("data-hidden", "true");
  });
});

test.describe("Text transitions", () => {
  test("content below the fold starts hidden and appears when scrolled to", async ({ page }) => {
    await page.goto("/");
    const block = page.locator("#methodology [data-reveal]").first();
    await expect.poll(() => block.evaluate((el) => Number(getComputedStyle(el).opacity))).toBeLessThan(0.05);

    await block.evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 200));
    await expect.poll(() => block.evaluate((el) => Number(getComputedStyle(el).opacity))).toBeGreaterThan(0.99);
  });

  test("reduced motion: everything shows in place and nothing moves", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    const states = await page.locator("[data-reveal], [data-reveal-group] > *").evaluateAll((els) =>
      els.map((el) => {
        const style = getComputedStyle(el);
        return { opacity: style.opacity, transform: style.transform };
      }),
    );
    expect(states.length).toBeGreaterThan(5);
    for (const state of states) {
      expect(state).toEqual({ opacity: "1", transform: "none" });
    }

    const bob = await page.locator(".scroll-cue-chev").evaluate((el) => getComputedStyle(el).animationName);
    expect(bob).toBe("none");
  });

  test("without JavaScript, all content is visible", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/");
    const opacities = await page
      .locator("[data-reveal], [data-reveal-group] > *")
      .evaluateAll((els) => els.map((el) => getComputedStyle(el).opacity));
    expect(opacities.every((o) => o === "1")).toBe(true);
    await context.close();
  });
});
