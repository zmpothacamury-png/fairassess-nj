import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

/**
 * Home page, navigation, and the 404 page (Prompt 15). The headline numbers are read
 * from the same pipeline files the page uses, so the test fails if the page shows
 * anything else. (Scroll-to-explore and reduced motion are in motion.spec.ts.)
 */
const data = (file: string) => JSON.parse(readFileSync(path.join(__dirname, "..", "public", "data", file), "utf8"));
const meta = data("meta.json");
const county = data("county.json");
const count = (n: number) => n.toLocaleString("en-US");

test("home page shows the real headline numbers from the pipeline", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const numbers = page.locator("#numbers");
  const cards: [string, number][] = [
    ["Towns analyzed", meta.n_towns],
    ["Towns showing a regressive pattern", county.towns_by_label["Regressive pattern"]],
    ["Towns leaning regressive", county.ranked_towns_prb_range_below_zero],
  ];
  for (const [label, value] of cards) {
    const card = numbers.locator("div.rounded-card").filter({ has: page.getByText(label, { exact: true }) });
    await expect(card.locator("p").first()).toHaveText(count(value));
  }
  await expect(numbers).toContainText(`using ${count(county.n_sales)} home sales`);
  await expect(numbers).toContainText(`Out of ${count(county.ranked_towns)} towns with enough sales`);
  await expect(page.locator("main").getByText(/independent student research project/)).toBeVisible();
});

const TABS = [
  { name: "Town Rankings", path: "/towns" },
  { name: "Appeal Checker", path: "/check" },
  { name: "How It Works", path: "/methodology", inLearn: true },
  { name: "Appeal Guide", path: "/appeal-guide", inLearn: true },
  { name: "About", path: "/about" },
  { name: "Home", path: "/" },
];

test("every nav tab opens its page, and only that tab is marked as current", async ({ page }) => {
  await page.goto("/");
  const nav = page.locator("header nav");
  for (const tab of TABS) {
    if (tab.inLearn) await nav.getByRole("button", { name: "Learn" }).click();
    await nav.getByRole("link", { name: tab.name, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${tab.path === "/" ? "/$" : `${tab.path}$`}`));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    if (tab.inLearn) {
      await expect(nav.getByRole("button", { name: "Learn" })).toHaveAttribute("data-active", "true");
      await nav.getByRole("button", { name: "Learn" }).click();
    }
    const current = nav.locator('a[aria-current="page"]');
    await expect(current).toHaveCount(1);
    await expect(current).toHaveText(tab.name);
    if (tab.inLearn) await page.keyboard.press("Escape");
  }
});

test("the phone menu marks the current page too", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/towns/teaneck");
  await page.getByRole("button", { name: "Open menu" }).click();
  const menu = page.locator("#mobile-menu");
  await expect(menu.locator('a[aria-current="page"]')).toHaveText("Town Rankings");
  await menu.getByRole("link", { name: "Appeal Guide" }).click();
  await expect(page).toHaveURL(/\/appeal-guide$/);
  await expect(menu).toHaveAttribute("data-open", "false");
});

test("the 404 page explains itself and links back", async ({ page }) => {
  const res = await page.goto("/no-such-page");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible();
  await page.locator("main").getByRole("link", { name: "Home" }).click();
  await expect(page).toHaveURL(/\/$/);
});
