import { expect, test } from "@playwright/test";
import { onRequestGet } from "../functions/api/csa/snapshots";

const CARRIER = "00000000-0000-4000-8000-000000000001";
const USER = "00000000-0000-4000-8000-000000000002";
const ENV = { SUPABASE_URL: "https://database.invalid", SUPABASE_SERVICE_ROLE: "test-service-role" };
const context = (request: Request) => ({ request, env: ENV, params: {}, data: {}, next: async () => new Response() }) as never;

test("CSA snapshots rejects unauthenticated reads", async () => {
  const response = await onRequestGet(context(new Request("https://app.invalid/api/csa/snapshots")));
  expect(response.status).toBe(401);
  await expect(response.json()).resolves.toMatchObject({ ok: false, code: "unauthorized" });
});

test("CSA snapshots derives the carrier filter from authenticated membership", async () => {
  const originalFetch = globalThis.fetch;
  const calls: string[] = [];
  globalThis.fetch = async (input) => {
    const url = String(input); calls.push(url);
    if (url.endsWith("/auth/v1/user")) return Response.json({ id: USER });
    if (url.includes("/compass_carrier_users?")) return Response.json([{ carrier_id: CARRIER }]);
    if (url.includes("/compass_csa_snapshots?")) return Response.json([{ taken_at: "2026-08-01T00:00:00Z", unsafe_driving: 42 }]);
    throw new Error(`unexpected request: ${url}`);
  };
  try {
    const response = await onRequestGet(context(new Request("https://app.invalid/api/csa/snapshots", { headers: { Authorization: "Bearer test-token" } })));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true, snapshots: [{ unsafe_driving: 42 }] });
    expect(calls.some((url) => url.includes(`carrier_id=eq.${CARRIER}`))).toBe(true);
  } finally { globalThis.fetch = originalFetch; }
});
