import { defineConfig, devices } from "@playwright/test";

/**
 * Browser tests (npm run test:e2e). They run against the production build,
 * so run `npm run build` first. Prompt 15's full suite will join these.
 */
export default defineConfig({
  testDir: "e2e",
  use: { baseURL: "http://localhost:3100", ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
  webServer: {
    command: "npm run start -- -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
