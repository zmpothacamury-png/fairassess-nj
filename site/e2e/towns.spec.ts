import { expect, test } from "@playwright/test";

/** Town Rankings and town pages (Prompt 10A): keyboard access, sorting, filters, and page basics. */

test.describe("Town Rankings page", () => {
  test("every forest-plot dot is a link reachable with Tab, and focus shows its details", async ({ page }) => {
    await page.goto("/towns");
    const dots = page.locator("#forest-plot svg a");
    await expect(dots).toHaveCount(48);
    const first = dots.first();
    await expect(first).toHaveAttribute("href", "/towns/ridgefield-park");
    await first.focus();
    await expect(page.locator("#forest-plot")).toContainText("#1 Ridgefield Park");
    // Showing details must not re-draw the chart and drop focus.
    await expect(first).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(dots.nth(1)).toBeFocused();
    await expect(page.locator("#forest-plot")).toContainText("#2 Cliffside Park");
  });

  test("sort buttons update aria-sort and the row order", async ({ page }) => {
    await page.goto("/towns");
    const table = page.getByRole("region", { name: "Town rankings table" });
    await expect(table.locator('th[aria-sort="ascending"]')).toContainText("PRB");
    await table.getByRole("button", { name: "Town" }).click();
    await expect(table.locator('th[aria-sort="ascending"]')).toContainText("Town");
    await expect(table.locator("tbody tr").first()).toContainText("Bergenfield");
    await table.getByRole("button", { name: "Town" }).click();
    await expect(table.locator('th[aria-sort="descending"]')).toContainText("Town");
    await expect(table.locator("tbody tr").first()).toContainText("Wyckoff");
  });

  test("search, label filter, and limited-data toggle", async ({ page }) => {
    await page.goto("/towns");
    const table = page.getByRole("region", { name: "Town rankings table" });
    await page.getByLabel("Search by town name").fill("teaneck");
    await expect(table.locator("tbody tr")).toHaveCount(1);
    await page.getByLabel("Search by town name").fill("");
    await page.getByLabel("Pattern", { exact: true }).selectOption("Regressive pattern");
    await expect(table.locator("tbody tr")).toHaveCount(2);
    await page.getByLabel("Include towns with limited data (20 to 39 sales)").uncheck();
    await expect(table.locator("tbody tr")).toHaveCount(1);
    await expect(table.locator("tbody tr").first()).toContainText("Bergenfield");
  });

  test("phones: 12 town cards, then Show all moves focus to town 13; a search shows every match", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/towns");
    const cards = page.getByRole("list", { name: "Town cards" }).getByRole("listitem");
    await expect(cards).toHaveCount(12);
    await page.getByRole("button", { name: /Show all 48 towns/ }).click();
    await expect(cards).toHaveCount(48);
    await expect(cards.nth(12).getByRole("link").first()).toBeFocused();
    await page.reload();
    await page.getByLabel("Search by town name").fill("park");
    await expect(page.getByRole("button", { name: /Show all/ })).toHaveCount(0);
    await expect(cards.first()).toBeVisible();
  });

  test("towns without enough sales are listed, not hidden", async ({ page }) => {
    await page.goto("/towns");
    const list = page.locator("section[aria-labelledby='thin-towns']");
    await expect(list.getByRole("heading")).toContainText("(22)");
    await expect(list.getByRole("link", { name: "Alpine" })).toHaveAttribute("href", "/towns/alpine");
  });

  test("the chart's table view opens with its button", async ({ page }) => {
    await page.goto("/towns");
    await page.locator("#forest-plot").getByRole("button", { name: "View as table" }).click();
    await expect(page.getByRole("region", { name: "PRB by town, as a table" })).toBeVisible();
  });

  test("links to the CSV download", async ({ page }) => {
    await page.goto("/towns");
    const res = await page.request.get("/downloads/fairassess-nj-town-stats.csv");
    expect(res.ok()).toBe(true);
    await expect(page.getByRole("link", { name: "Download the data (CSV)" })).toHaveAttribute(
      "href",
      "/downloads/fairassess-nj-town-stats.csv",
    );
  });
});

test.describe("Town pages", () => {
  test("a ranked town has its title, summary, charts, checker link, and disclaimer", async ({ page }) => {
    await page.goto("/towns/bergenfield");
    await expect(page).toHaveTitle("Bergenfield property assessment fairness | Fair Assess NJ");
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /lowest value quarter/);
    await expect(page.getByRole("heading", { name: "Assessment ratio by home value" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Every sale" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Check my assessment in Bergenfield" })).toHaveAttribute(
      "href",
      "/check?town=bergenfield",
    );
    await expect(page.getByText("Appeal deadline: May 1, 2027")).toBeVisible();
    await expect(page.getByText("is an independent student research project").first()).toBeVisible();
  });

  test("a town without enough sales explains why and still links to the checker", async ({ page }) => {
    await page.goto("/towns/allendale");
    await expect(page.getByText("Why there are so few sales")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Four standard measures" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Check my assessment in Allendale" })).toBeVisible();
  });

  test("an unknown town is a 404", async ({ page }) => {
    const res = await page.goto("/towns/not-a-town");
    expect(res?.status()).toBe(404);
  });
});
