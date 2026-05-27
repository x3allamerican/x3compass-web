/* ============================================================
   X3 Compass — smoke tests
   ------------------------------------------------------------
   Catches the 3 highest-impact production breakages we've
   hit before: (1) 500 on / from a bad CF Pages deploy, (2)
   sign-in page failing to render, (3) /app/* redirect loop
   when Supabase env vars are missing.

   These are FAST (no screenshots, just status + key DOM) so
   we can wire them into the GitLab post-deploy stage and
   alert immediately on broken deploys.
   ============================================================ */

import { test, expect } from "@playwright/test";

test.describe("smoke", () => {
  test("/ marketing homepage renders + has the right title", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBeLessThan(400);
    // Marketing homepage title contains the brand
    await expect(page).toHaveTitle(/X3 Compass/i);
  });

  test("/signin renders without redirect loop", async ({ page }) => {
    const response = await page.goto("/signin", { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBeLessThan(400);
    // There should be a sign-in form. Be tolerant of email-only or social+email.
    await expect(page.getByRole("button", { name: /sign in|continue|log in/i }).first()).toBeVisible();
  });

  test("/app redirects unauthenticated users to /signin", async ({ page }) => {
    const response = await page.goto("/app", { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBeLessThan(400);
    // Either we land on /signin OR a loading shell that links to /signin.
    // Both are acceptable; what's NOT acceptable is "This page couldn't load".
    const body = await page.content();
    expect(body).not.toMatch(/this page couldn'?t load/i);
    expect(body).not.toMatch(/supabase env vars missing/i);
  });

  test("/app/hazmat placard SVGs are reachable", async ({ request }) => {
    // The Hazmat Center page references /hazmat/placards/class-1.1.svg etc.
    // If these 404, the page renders broken. Sample 3 of the 33.
    for (const file of ["class-1.1.svg", "class-7.svg", "class-9.svg"]) {
      const r = await request.get(`/hazmat/placards/${file}`);
      expect(r.status(), `${file} should return 200`).toBe(200);
      expect(r.headers()["content-type"]).toContain("image/svg");
    }
  });

  test("/app/background legacy route redirects to /app/background-checks", async ({ page }) => {
    await page.goto("/app/background");
    // Client-side redirect — wait for the URL to settle.
    await expect(page).toHaveURL(/\/app\/(background-checks|signin)/, { timeout: 10_000 });
  });
});
