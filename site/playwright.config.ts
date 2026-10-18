import { defineConfig, devices } from "@playwright/test";

/**
 * Browser tests (npm run test:e2e). They run against the production build,
 * so run `npm run build` first. 2 workers: the default count timed out on page
 * loads once on Zaden's PC. On GitHub (CI), a failed test gets one retry and
 * a stopped-early `.only` fails the run.
 */
const CI = !!process.env.CI;

export default defineConfig({
  testDir: "e2e",
  workers: 2,
  retries: CI ? 1 : 0,
  forbidOnly: CI,
  reporter: CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: { baseURL: "http://localhost:3100", ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
  webServer: {
    command: "npm run start -- -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: !CI,
    timeout: 60_000,
  },
});
