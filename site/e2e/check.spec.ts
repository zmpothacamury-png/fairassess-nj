import { expect, test, type Page } from "@playwright/test";

/**
 * Appeal checker (Prompt 12): every verdict in a real browser, keyboard use,
 * 375px phones, and privacy (nothing typed reaches a request or the URL).
 * Inputs are real examples from the data (checked against the engine).
 */
const CASES = [
  { verdict: "within", town: "Teaneck", value: "450000", headline: "Your assessment is within the normal range." },
  { verdict: "grounds", town: "Old Tappan", value: "1775000", headline: "You may have grounds to appeal." },
  { verdict: "under", town: "Teaneck", value: "400000", headline: "Your assessment may be lower than typical." },
  { verdict: "thin", town: "Alpine", value: "487300", headline: "Not enough data to check your home." },
  { verdict: "reval", town: "Bergenfield", value: "302200", headline: "Chapter 123 does not apply in your town this year." },
] as const;

async function fill(page: Page, town: string, value: string) {
  await page.getByRole("combobox", { name: "Your town" }).fill(town);
  await page.getByLabel("Your assessed value").fill(value);
}

async function noSidewaysScroll(page: Page) {
  const extra = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(extra).toBeLessThanOrEqual(0);
}

test.describe("Appeal checker", () => {
  for (const c of CASES) {
    test(`${c.verdict}: result, deadline, fee, and disclaimer; fits a 375px phone`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto("/check");
      await fill(page, c.town, c.value);
      await page.getByRole("button", { name: "Check my assessment" }).click();
      const heading = page.getByRole("heading", { level: 2, name: new RegExp(`Your result for ${c.town}`) });
      await expect(heading).toBeFocused();
      await expect(heading).toContainText(c.headline);
      await expect(page.getByText("Appeal deadline, tax year 2027")).toBeVisible();
      await expect(page.getByText("Filing fee for your assessed value")).toBeVisible();
      await expect(page.locator("main").getByText(/independent student research project/)).toBeVisible();
      await page.getByRole("button", { name: "Show the math" }).click();
      await noSidewaysScroll(page);
    });
  }

  test("an own estimate far from ours fits a phone and shows both tests", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/check");
    await fill(page, "Teaneck", "400000");
    await page.getByRole("button", { name: /own estimate of your home/ }).click();
    await page.getByLabel("Your estimate of its market value").fill("350000");
    await page.getByRole("button", { name: "Check my assessment" }).click();
    await expect(page.getByText(/Using your estimate of/)).toBeVisible();
    await expect(page.getByText("Your estimate and ours are far apart")).toBeVisible();
    await noSidewaysScroll(page);
  });

  test("works with the keyboard alone, and errors are linked to their fields", async ({ page }) => {
    await page.goto("/check");
    const town = page.getByRole("combobox", { name: "Your town" });
    await town.focus();
    await page.keyboard.type("old t");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(town).toHaveValue("Old Tappan");
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Your assessed value")).toBeFocused();
    await page.keyboard.type("12x");
    await page.keyboard.press("Enter");
    const assessed = page.getByLabel("Your assessed value");
    await expect(assessed).toHaveAttribute("aria-invalid", "true");
    await expect(assessed).toHaveAccessibleDescription(/should be a number in dollars/);
    await assessed.fill("");
    await page.keyboard.type("1775000");
    await expect(assessed).toHaveValue("1,775,000");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { level: 2, name: /Your result for Old Tappan/ })).toBeFocused();
  });

  const INVALID = [
    { value: "", message: /Please enter your assessed value/ },
    { value: "abc", message: /should be a number in dollars/ },
    { value: "-450000", message: /can't be a negative number/ },
    { value: "450000.50", message: /in whole dollars, with no cents/ },
    { value: "5000", message: /must be at least \$10,000/ },
    { value: "25000000", message: /must be \$20,000,000 or less/ },
  ];
  test("invalid inputs show a clear error on the right field and no result", async ({ page }) => {
    await page.goto("/check");
    const assessed = page.getByLabel("Your assessed value");
    const submit = page.getByRole("button", { name: "Check my assessment" });
    // No town: the town field gets the error.
    await assessed.fill("450000");
    await submit.click();
    const town = page.getByRole("combobox", { name: "Your town" });
    await expect(town).toHaveAttribute("aria-invalid", "true");
    await expect(town).toHaveAccessibleDescription(/Please choose your town/);
    await town.fill("Teaneck");
    for (const c of INVALID) {
      await assessed.fill(c.value);
      await submit.click();
      await expect(assessed, `assessed value "${c.value}"`).toHaveAttribute("aria-invalid", "true");
      await expect(assessed).toHaveAccessibleDescription(c.message);
    }
    // Letters in the optional estimate are caught too.
    await assessed.fill("450000");
    await page.getByRole("button", { name: /own estimate of your home/ }).click();
    const own = page.getByLabel("Your estimate of its market value");
    await own.fill("about 500k");
    await submit.click();
    await expect(own).toHaveAccessibleDescription(/market value estimate should be a number/);
    await expect(page.getByRole("heading", { level: 2, name: /Your result/ })).toHaveCount(0);
  });

  test("/check?town=<slug> picks the town; an unknown slug leaves it empty", async ({ page }) => {
    await page.goto("/check?town=old-tappan");
    await expect(page.getByRole("combobox", { name: "Your town" })).toHaveValue("Old Tappan");
    await page.getByLabel("Your assessed value").fill("1775000");
    await page.getByRole("button", { name: "Check my assessment" }).click();
    await expect(page.getByRole("heading", { level: 2, name: /Your result for Old Tappan/ })).toBeVisible();
    await page.goto("/check?town=not-a-town");
    await expect(page.getByRole("combobox", { name: "Your town" })).toHaveValue("");
  });

  test("privacy: no typed amount reaches any request, header, body, or storage, and nothing leaves the site", async ({ page, baseURL }) => {
    const site = new URL(baseURL!).host;
    const typed = [/450000/, /450,000/, /512345/, /512,345/];
    const seen: { url: string; host: string; body: string; headers: string }[] = [];
    page.on("request", (r) =>
      seen.push({ url: r.url(), host: new URL(r.url()).host, body: r.postData() ?? "", headers: JSON.stringify(r.headers()) }),
    );
    await page.goto("/check?town=teaneck");
    await expect(page.getByRole("combobox", { name: "Your town" })).toHaveValue("Teaneck");
    await page.getByLabel("Your assessed value").fill("450000");
    await page.getByRole("button", { name: /own estimate of your home/ }).click();
    await page.getByLabel("Your estimate of its market value").fill("512345");
    await page.getByRole("button", { name: "Check my assessment" }).click();
    await expect(page.getByRole("heading", { level: 2, name: /Your result/ })).toBeVisible();
    await page.getByRole("button", { name: "Show the math" }).click();
    await page.getByRole("button", { name: "Check another home" }).click();

    expect(seen.length).toBeGreaterThan(0);
    for (const r of seen) {
      // Only this site. (Vercel Web Analytics loads only on Vercel and also posts to the site's own address.)
      expect(r.host, r.url).toBe(site);
      for (const t of typed) {
        expect(r.url).not.toMatch(t);
        expect(r.body).not.toMatch(t);
        expect(r.headers).not.toMatch(t);
      }
    }
    const stored = await page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage }, cookie: document.cookie }));
    for (const t of typed) expect(stored).not.toMatch(t);
  });

  test("privacy: the only request is the town file, and nothing typed reaches a URL", async ({ page }) => {
    const urls: string[] = [];
    page.on("request", (r) => urls.push(r.url()));
    await page.goto("/check?town=teaneck");
    await expect(page.getByRole("combobox", { name: "Your town" })).toHaveValue("Teaneck");
    const before = urls.length;
    await page.getByLabel("Your assessed value").fill("450000");
    await page.getByRole("button", { name: /own estimate of your home/ }).click();
    await page.getByLabel("Your estimate of its market value").fill("512345");
    await page.getByRole("button", { name: "Check my assessment" }).click();
    await expect(page.getByRole("heading", { level: 2, name: /Your result/ })).toBeVisible();
    // Next.js prefetches other pages for the links in the result (/_next/ files and "?_rsc=" requests).
    // Those carry nothing typed. Every other request after typing must be the public town file.
    const after = urls.slice(before).filter((u) => !u.includes("/_next/") && !/[?&]_rsc=/.test(u));
    for (const u of after) expect(u).toMatch(/\/data\/towns\/teaneck\.json$/);
    expect(urls.some((u) => u.endsWith("/data/towns/teaneck.json"))).toBe(true);
    for (const u of urls) expect(u).not.toMatch(/450000|450,000|512345|512,345/);
    expect(page.url()).not.toMatch(/450|512/);
  });

  test("Check another home clears everything; the print view leaves out the site chrome", async ({ page }) => {
    await page.goto("/check?town=teaneck");
    await page.getByLabel("Your assessed value").fill("450000");
    await page.getByRole("button", { name: "Check my assessment" }).click();
    await expect(page.getByRole("heading", { level: 2, name: /Your result/ })).toBeVisible();
    await page.emulateMedia({ media: "print" });
    await expect(page.locator(".site-header")).toBeHidden();
    await expect(page.getByRole("button", { name: "Check my assessment" })).toBeHidden();
    await expect(page.getByText("Appeal checker result, printed")).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: /Your result/ })).toBeVisible();
    await page.emulateMedia({ media: "screen" });
    await page.getByRole("button", { name: "Check another home" }).click();
    await expect(page.getByRole("heading", { level: 2, name: /Your result/ })).toHaveCount(0);
    await expect(page.getByRole("combobox", { name: "Your town" })).toHaveValue("");
    await expect(page.getByRole("combobox", { name: "Your town" })).toBeFocused();
    expect(page.url()).toMatch(/\/check$/);
  });

  test("a town file that fails to load shows a friendly retry", async ({ page }) => {
    let fail = true;
    await page.route("**/data/towns/teaneck.json", (route) => (fail ? route.abort() : route.continue()));
    await page.goto("/check");
    await fill(page, "Teaneck", "450000");
    await page.getByRole("button", { name: "Check my assessment" }).click();
    await expect(page.getByText("We couldn't load the sales for Teaneck", { exact: true })).toBeVisible();
    fail = false;
    await page.getByRole("button", { name: "Try again" }).click();
    await expect(page.getByRole("heading", { level: 2, name: /Your result for Teaneck/ })).toBeVisible();
  });
});
