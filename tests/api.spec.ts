import { test, expect } from "@playwright/test";

test("/api/health returns a redacted liveness response", async ({ request }) => {
  const r = await request.get("/api/health");
  expect(r.status()).toBe(200);
  const body = await r.json();
  expect(typeof body.ok).toBe("boolean");
  expect(["operational", "degraded"]).toContain(body.status);
  expect(body).not.toHaveProperty("services");
});

test("/api/health detail diagnostics expose only boolean dependency state", async ({ request }) => {
  const r = await request.get("/api/health?detail=1");
  expect(r.status()).toBe(200);
  const body = await r.json();
  expect(["operational", "degraded"]).toContain(body.status);
  expect(typeof body.services.supabase.ok).toBe("boolean");
  expect(typeof body.services.stripe.ok).toBe("boolean");
  expect(body.services.supabase).not.toHaveProperty("url");
  expect(body.services.stripe).not.toHaveProperty("key");
});

test("/api/auth/post-signup returns 401 without token", async ({ request }) => {
  const r = await request.post("/api/auth/post-signup", { data: { carrier_name: "x" } });
  expect(r.status()).toBe(401);
  const body = await r.json();
  expect(body.error).toBe("request denied");
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
  expect([401, 400, 503]).toContain(r.status());
});

test("/api/stripe/webhook rejects an invalid signature", async ({ request }) => {
  const r = await request.post("/api/stripe/webhook", {
    headers: { "Stripe-Signature": `t=${Math.floor(Date.now() / 1000)},v1=deadbeef`, "Content-Type": "application/json" },
    data: JSON.stringify({ id: "evt_test", type: "checkout.session.completed", data: { object: {} } }),
  });
  expect([400, 401, 500, 503]).toContain(r.status());
  const body = await r.json().catch(() => ({}));
  // Must never process an unverified event.
  expect(body.ok).not.toBe(true);
});

test("/api/stripe/create-checkout-session never leaks upstream error detail", async ({ request }) => {
  // Unauthenticated → 401; but ensure no response body carries a `detail` field anywhere.
  const r = await request.post("/api/stripe/create-checkout-session", { data: { drivers: 5 } });
  const body = await r.json().catch(() => ({}));
  expect(body).not.toHaveProperty("detail");
});

test("/api/partners/apply validates required fields", async ({ request }) => {
  const r = await request.post("/api/partners/apply", { data: {} });
  expect(r.status()).toBe(400);
  const body = await r.json();
  expect(body.error).toContain("Missing");
});
