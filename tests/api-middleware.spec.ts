import { expect, test } from "@playwright/test";
import { onRequest } from "../functions/api/_middleware";

function context(request: Request) {
  let reachedHandler = false;
  const ctx = {
    request,
    env: {},
    params: {},
    data: {},
    waitUntil() {},
    passThroughOnException() {},
    next: async () => { reachedHandler = true; return new Response("handler"); },
  };
  return { ctx: ctx as never, reachedHandler: () => reachedHandler };
}

test("default-deny middleware blocks every unauthenticated protected route", async () => {
  const routes = [
    "/api/scorecards", "/api/dashboard", "/api/notifications", "/api/drivers/import",
    "/api/vehicles/import", "/api/accidents/import", "/api/inspections/import",
    "/api/vendors/list", "/api/vendors/motive/sync", "/api/vendors/samsara/sync",
    "/api/vendors/tenstreet/sync", "/api/screenings/order", "/api/checkr/session-token",
    "/api/uploads/get", "/api/uploads/sign", "/api/stripe/create-checkout-session",
    "/api/admin/partners", "/api/admin/v1/partners", "/api/marketing", "/api/prospects",
  ];

  for (const path of routes) {
    const { ctx, reachedHandler } = context(new Request(`https://x3compass.com${path}`));
    const response = await onRequest(ctx);
    expect(response.status, path).toBe(401);
    expect(reachedHandler(), path).toBe(false);
    expect(await response.text(), path).not.toMatch(/driver|carrier_id|supabase/i);
  }
});

test("middleware rejects disallowed preflight origins without reaching a handler", async () => {
  const { ctx, reachedHandler } = context(new Request("https://x3compass.com/api/scorecards", {
    method: "OPTIONS",
    headers: { Origin: "https://evil.example" },
  }));
  const response = await onRequest(ctx);
  expect(response.status).toBe(403);
  expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
  expect(reachedHandler()).toBe(false);
});

test("middleware permits documented public routes only", async () => {
  const { ctx, reachedHandler } = context(new Request("https://x3compass.com/api/health"));
  const response = await onRequest(ctx);
  expect(response.status).toBe(200);
  expect(reachedHandler()).toBe(true);
});
