/* ============================================================
   X3 Compass — Playwright config
   ------------------------------------------------------------
   Two modes:
   1. CI / local default — point at https://x3compass.com (the
      live Cloudflare Pages production deploy). Smoke + visual
      regression run against real production.
   2. Local with PLAYWRIGHT_BASE_URL=http://localhost:3000 set —
      runs against `npm run dev` for pre-push verification.

   Visual diffs are stored under tests/__screenshots__/ and
   checked into Git so the suite is self-contained.
   ============================================================ */

import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "https://x3compass.com";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  timeout: 30_000,
  expect: {
    // Allow a small fraction of pixel diff for font hinting, CDN
    // image re-encodes, anti-aliasing across OS. Tighten over time.
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
      threshold: 0.2,
    },
  },
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
  },
  projects: [
    {
      name: "chromium-desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      name: "webkit-mobile",
      use: { ...devices["iPhone 14"] },
    },
  ],
});
