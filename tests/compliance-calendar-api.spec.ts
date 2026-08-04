import { expect, test } from "@playwright/test";
import { onRequestGet } from "../functions/api/compliance-calendar";

const CARRIER = "00000000-0000-4000-8000-000000000001";
const USER = "10000000-0000-4000-8000-000000000001";

function context(request: Request, env: Record<string, string> = {}) {
  return { request, env, params: {}, data: {}, waitUntil() {}, passThroughOnException() {} } as never;
}

test("compliance calendar rejects requests without a verified session", async () => {
  const response = await onRequestGet(context(new Request("https://x3compass.com/api/compliance-calendar")));
  expect(response.status).toBe(401);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(await response.text()).not.toContain("driver");
});

test("compliance calendar scopes every evidence query to the authenticated membership", async () => {
  const calls: string[] = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    calls.push(url);
    if (url.includes("/auth/v1/user")) return Response.json({ id: USER });
    if (url.includes("compass_carrier_users")) return Response.json([{ carrier_id: CARRIER }]);
    if (url.includes("compass_carriers")) return Response.json([{ id: CARRIER, name: "Tenant A", usdot_number: "123426" }]);
    if (url.includes("compass_drivers")) return Response.json([{ id: "d1", first_name: "Ada", last_name: "Lovelace", status: "active", medical_card_expires_on: "2026-08-20" }]);
    return Response.json([]);
  }) as typeof fetch;

  try {
    const response = await onRequestGet(context(new Request("https://x3compass.com/api/compliance-calendar", {
      headers: { Authorization: "Bearer valid-token" },
    }), { SUPABASE_URL: "https://database.example.test", SUPABASE_SERVICE_ROLE: "test-role" }));
    expect(response.status).toBe(200);
    const body = await response.json() as { ok: boolean; evidence: Record<string, unknown[]> };
    expect(body.ok).toBe(true);
    expect(body.evidence.carrier).toMatchObject({ id: CARRIER, name: "Tenant A" });

    const operational = calls.filter((url) => url.includes("/rest/v1/") && !url.includes("compass_carrier_users"));
    expect(operational.length).toBe(7);
    for (const url of operational) expect(decodeURIComponent(url)).toContain(CARRIER);
    for (const url of operational) expect(url).not.toContain("select=*");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
