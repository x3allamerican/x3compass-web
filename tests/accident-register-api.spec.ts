import { expect, test } from "@playwright/test";
import { onRequestGet } from "../functions/api/accident-register";

const CARRIER = "00000000-0000-4000-8000-000000000001";
const USER = "10000000-0000-4000-8000-000000000001";

function context(request: Request, env: Record<string, string> = {}) {
  return { request, env, params: {}, data: {}, waitUntil() {}, passThroughOnException() {} } as never;
}

test("accident register rejects unauthenticated reads", async () => {
  const response = await onRequestGet(context(new Request("https://x3compass.com/api/accident-register")));
  expect(response.status).toBe(401);
  expect(response.headers.get("cache-control")).toBe("no-store");
});

test("accident register scopes explicit evidence reads and returns normalized records", async () => {
  const calls: string[] = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input); calls.push(url);
    if (url.includes("/auth/v1/user")) return Response.json({ id: USER });
    if (url.includes("compass_carrier_users")) return Response.json([{ carrier_id: CARRIER }]);
    if (url.includes("compass_accidents")) return Response.json([{ id: "a1", accident_date: "2026-01-01", city: "Detroit", state: "MI", driver_id: "d1", fatalities: 0, injuries: 1, hazmat_released: false }]);
    if (url.includes("compass_drivers")) return Response.json([{ id: "d1", first_name: "Ada", last_name: "Lovelace" }]);
    throw new Error(`unexpected request ${url}`);
  }) as typeof fetch;
  try {
    const response = await onRequestGet(context(new Request("https://x3compass.com/api/accident-register", { headers: { Authorization: "Bearer valid-token" } }), { SUPABASE_URL: "https://database.example.test", SUPABASE_SERVICE_ROLE: "test-role" }));
    expect(response.status).toBe(200);
    const body = await response.json() as { ok: boolean; records: Array<Record<string, unknown>>; counts: Record<string, number> };
    expect(body.ok).toBe(true);
    expect(body.records[0]).toMatchObject({ id: "a1", city: "Detroit", state: "MI", driverName: "Ada Lovelace", fatalities: 0, injuries: 1, hazmatReleased: false });
    expect(body.counts.complete).toBe(1);
    const operational = calls.filter((url) => /compass_(accidents|drivers)/.test(url));
    expect(operational).toHaveLength(2);
    for (const url of operational) {
      expect(decodeURIComponent(url)).toContain(CARRIER);
      expect(url).not.toContain("select=*");
    }
  } finally { globalThis.fetch = originalFetch; }
});
