import { test, expect } from "@playwright/test";

// Pages and the text we expect to find on them. Matched case-insensitively
// because the brand renders as "X3 COMPASS" in the topbar but specs were
// written with "X3 Compass". Either spelling should match.
const MARKETING_PAGES: Array<[string, RegExp]> = [
  ["/",                 /x3\s*compass/i],
  ["/pricing",          /pricing/i],
  ["/faq",              /x3\s*compass/i],
  ["/hazmat",           /x3\s*compass/i],
  ["/partners",         /x3\s*compass/i],
  ["/skills",           /x3\s*compass/i],
  ["/signin",           /sign\s*in/i],
  ["/signup",           /start/i],
  ["/forgot-password",  /reset/i],
];

for (const [path, expected] of MARKETING_PAGES) {
  test(`marketing page ${path} renders + has ${expected}`, async ({ page }) => {
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.locator("body")).toContainText(expected, { timeout: 8000 });
  });
}

test("sitemap.xml lists at least 5 URLs", async ({ request }) => {
  const r = await request.get("/sitemap.xml");
  expect(r.status()).toBe(200);
  const body = await r.text();
  const count = (body.match(/<url>/g) || []).length;
  expect(count).toBeGreaterThanOrEqual(5);
});

test("robots.txt has Sitemap line", async ({ request }) => {
  const r = await request.get("/robots.txt");
  expect(r.status()).toBe(200);
  expect(await r.text()).toContain("Sitemap:");
});

test("security headers are set", async ({ request }) => {
  const r = await request.get("/");
  const h = r.headers();
  expect(h["strict-transport-security"]).toContain("max-age=");
  expect(h["x-frame-options"]).toMatch(/SAMEORIGIN|DENY/i);
  expect(h["x-content-type-options"]).toBe("nosniff");
});
