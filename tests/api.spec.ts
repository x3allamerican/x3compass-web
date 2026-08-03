import { test, expect } from "@playwright/test";

test("/api/health returns operational", async ({ request }) => {
  const r = await request.get("/api/health");
  expect(r.status()).toBe(200);
  const body = await r.json();
  expect(body.ok).toBe(true);
  expect(body.status).toBe("operational");
  expect(body.services.supabase.ok).toBe(true);
  expect(body.services.stripe.ok).toBe(true);
});

test("/api/auth/post-signup returns 401 without token", async ({ request }) => {
  const r = await request.post("/api/auth/post-signup", { data: { carrier_name: "x" } });
  expect(r.status()).toBe(401);
  const body = await r.json();
  expect(body.error).toBe("Unauthorized");
});

test("/api/stripe/create-checkout-session returns 401 without token", async ({ request }) => {
  const r = await request.post("/api/stripe/create-checkout-session", { data: { drivers: 1 } });
  expect(r.status()).toBe(401);
});

test("/api/stripe/portal-session returns 401 without token", async ({ request }) => {
  const r = await request.post("/api/stripe/portal-session", { data: {} });
  expect(r.status()).toBe(401);
});

test("/api/stripe/webhook returns 401 without signature", async ({ request }) => {
  const r = await request.post("/api/stripe/webhook", { data: {} });
  expect([401, 400]).toContain(r.status());
});

test("/api/partners/apply validates required fields", async ({ request }) => {
  const r = await request.post("/api/partners/apply", { data: {} });
  expect(r.status()).toBe(400);
  const body = await r.json();
  expect(body.error).toContain("Missing");
});
