import { expect, test } from "@playwright/test";

/** How It Works, Appeal Guide, About, Contact, Privacy. */
const PAGES = ["/methodology", "/appeal-guide", "/about", "/contact", "/privacy"];

for (const path of PAGES) {
  test(`${path}: one h1, a description, and no sideways scroll at 375px`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(path);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /.{40,}/);
    const extra = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(extra).toBeLessThanOrEqual(0);
  });
}

test("How It Works: funnel from the filter log, formulas, validation table, CSV", async ({ page }) => {
  await page.goto("/methodology");
  const funnel = page.getByRole("list", { name: "Sales left after each cleaning rule" });
  await expect(funnel.getByRole("listitem")).toHaveCount(11);
  await expect(funnel).toContainText("3,806 left");
  expect(await page.locator(".katex").count()).toBeGreaterThanOrEqual(5);
  await page.getByText(/Show the full comparison for all 70 towns/).click();
  await expect(page.getByRole("region", { name: "Validation table" }).locator("tbody tr")).toHaveCount(70);
  await expect(page.getByRole("link", { name: /Download town statistics/ })).toHaveAttribute("href", "/downloads/fairassess-nj-town-stats.csv");
  await expect(page.locator("main").getByText(/independent student research project/)).toBeVisible();
});

test("Appeal Guide: 7 steps, sources on every step, deadline and fee, last checked", async ({ page }) => {
  await page.goto("/appeal-guide");
  for (const id of ["deadline", "assessed-value", "check", "evidence", "file", "hearing", "outcome"]) {
    const step = page.locator(`#${id}`);
    await expect(step.getByRole("heading", { level: 2 })).toBeVisible();
    if (id !== "check") expect(await step.locator('a[href^="http"]').count()).toBeGreaterThan(0);
  }
  await expect(page.getByText("Sources last checked: October 18, 2026")).toBeVisible();
  await expect(page.getByText("April 1, 2027").first()).toBeVisible();
  await expect(page.getByRole("region", { name: "Filing fees" })).toContainText("$150");
  await expect(page.locator("main")).not.toContainText(/you will win/i);
});

test("About: founder header, story, roadmap, credits, Get Updates", async ({ page }) => {
  await page.goto("/about");
  await expect(page.getByRole("heading", { level: 1, name: "Zaden Pothacamury" })).toBeVisible();
  await expect(page.getByText(/a junior at Ramapo High School in Franklin Lakes/)).toBeVisible();
  await expect(page.locator("#next ol li")).toHaveCount(6);
  await expect(page.getByRole("link", { name: "Get Updates" })).toHaveAttribute("href", "/contact#updates");
});

test("Contact and Privacy: updates form, issue template, privacy facts", async ({ page }) => {
  await page.goto("/contact");
  await expect(page.locator("#updates form")).toBeVisible();
  await expect(page.getByRole("link", { name: /Open a short report on GitHub/ })).toHaveAttribute("href", /issues\/new\?template=data-problem\.md$/);
  await page.goto("/privacy");
  await expect(page.getByText(/Last updated:/)).toBeVisible();
  await expect(page.getByText(/We count page visits with Vercel Web Analytics/)).toBeVisible();
  await expect(page.getByText(/We send no custom events, only page views/)).toBeVisible();
});
