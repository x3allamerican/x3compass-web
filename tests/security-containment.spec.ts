import { expect, test } from "@playwright/test";
import { onRequestGet as scorecards } from "../functions/api/scorecards";
import { onRequestPost as importDrivers } from "../functions/api/drivers/import";

function context(request: Request, env: Record<string, string> = {}) {
  return { request, env, params: {}, data: {}, waitUntil() {}, passThroughOnException() {} } as never;
}

const CARRIER_A = "00000000-0000-4000-8000-000000000001";
const CARRIER_B = "00000000-0000-4000-8000-000000000002";

test("scorecards reject unauthenticated access without exposing tenant data", async () => {
  const response = await scorecards(context(new Request("https://x3compass.com/api/scorecards?carrier_id=00000000-0000-4000-8000-000000000001")));
  expect(response.status).toBe(401);
  expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
  expect(await response.text()).not.toContain("driver");
});

test("driver import rejects unauthenticated writes without accepting tenant data", async () => {
  const response = await importDrivers(context(new Request("https://x3compass.com/api/drivers/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ carrier_id: "00000000-0000-4000-8000-000000000001", rows: [{ first_name: "Test", last_name: "Driver" }] }),
  })));
  expect(response.status).toBe(401);
  expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
  expect(await response.text()).not.toContain("Test");
});

test.describe("tenant route integration", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(() => {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/auth/v1/user")) return Response.json({ id: "10000000-0000-4000-8000-000000000001", email: "member@example.test" });
      if (url.includes("compass_carrier_users")) return Response.json([{ carrier_id: CARRIER_A }]);
      throw new Error(`tenant data query should not occur: ${new URL(url).pathname}`);
    }) as typeof fetch;
  });

  test("scorecards reject cross-tenant reads before querying tenant data", async () => {
    const response = await scorecards(context(new Request(`https://x3compass.com/api/scorecards?carrier_id=${CARRIER_B}`, {
      headers: { Authorization: "Bearer valid-token" },
    }), { SUPABASE_URL: "https://database.example.test", SUPABASE_SERVICE_ROLE: "test-role" }));
    expect(response.status).toBe(403);
    expect(await response.text()).not.toContain(CARRIER_A);
  });

  test("driver import rejects cross-tenant writes before any upsert", async () => {
    const response = await importDrivers(context(new Request("https://x3compass.com/api/drivers/import", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer valid-token" },
      body: JSON.stringify({ carrier_id: CARRIER_B, rows: [{ first_name: "Test", last_name: "Driver" }] }),
    }), { SUPABASE_URL: "https://database.example.test", SUPABASE_SERVICE_ROLE: "test-role" }));
    expect(response.status).toBe(403);
    expect(await response.text()).not.toContain("Test");
  });

  test("scorecards reject malformed tenant ids before any external query", async () => {
    let calls = 0;
    globalThis.fetch = (async () => { calls++; throw new Error("must not query"); }) as typeof fetch;
    const response = await scorecards(context(new Request("https://x3compass.com/api/scorecards?carrier_id=malformed", {
      headers: { Authorization: "Bearer valid-token" },
    }), { SUPABASE_URL: "https://database.example.test", SUPABASE_SERVICE_ROLE: "test-role" }));
    expect(response.status).toBe(400);
    expect(calls).toBe(0);
  });
});
