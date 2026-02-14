import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for browser testing
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    // Increase timeout for production tests (AI responses can be slow)
    actionTimeout: 60000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],

  webServer:
    process.env.PLAYWRIGHT_BASE_URL?.includes("localhost") ||
    !process.env.PLAYWRIGHT_BASE_URL
      ? {
          command: "npm run dev:frontend",
          url: "http://localhost:5173",
          reuseExistingServer: !process.env.CI,
          timeout: 120 * 1000,
        }
      : undefined,
});
