import { test, expect } from "@playwright/test";

const MARKETING_PAGES = [
  ["/",          "X3 Compass"],
  ["/pricing",   "Pricing"],
  ["/faq",       "X3 Compass"],
  ["/hazmat",    "X3 Compass"],
  ["/partners",  "X3 Compass"],
  ["/skills",    "X3 Compass"],
  ["/signin",    "Sign In"],
  ["/signup",    "Start"],
  ["/forgot-password", "Reset"],
];

for (const [path, expectedText] of MARKETING_PAGES) {
  test(`marketing page ${path} renders + has "${expectedText}"`, async ({ page }) => {
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.locator("body")).toContainText(expectedText, { timeout: 8000 });
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
