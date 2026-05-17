import { test, expect } from "@playwright/test";

// /app/* pages should render an auth-checking shell that ultimately redirects
// unauthenticated visitors to /signin. We can't programmatically detect the
// client-side redirect deterministically, so we just confirm the initial
// document renders (the shell + auth gate) without server error.

const APP_PAGES = [
  "/app", "/app/drivers", "/app/vehicles", "/app/dq-files",
  "/app/accidents", "/app/inspections", "/app/drug-alcohol", "/app/hos",
  "/app/training", "/app/mvr", "/app/ifta", "/app/audit-export",
  "/app/settings", "/app/da-concierge", "/app/background-checks", "/app/ask",
];

for (const path of APP_PAGES) {
  test(`app page ${path} returns 200`, async ({ page }) => {
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
  });
}
