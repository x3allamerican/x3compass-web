import { expect, test } from "@playwright/test";
import { onRequestGet, onRequestPost } from "../functions/api/clearinghouse/status";

const CARRIER = "00000000-0000-4000-8000-000000000001";
const USER = "10000000-0000-4000-8000-000000000001";
const DRIVER = "20000000-0000-4000-8000-000000000001";
const ENV = { SUPABASE_URL: "https://database.example.test", SUPABASE_SERVICE_ROLE: "role" };
function context(request: Request) { return { request, env: ENV, params: {}, data: {}, waitUntil() {}, passThroughOnException() {} } as never; }
function authFetch(handler: (url: string, init?: RequestInit) => Response | Promise<Response>) {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.includes("/auth/v1/user")) return Response.json({ id: USER });
    if (url.includes("compass_carrier_users")) return Response.json([{ carrier_id: CARRIER }]);
    return handler(url, init);
  }) as typeof fetch;
}

test("Clearinghouse status rejects unauthenticated access and cross-tenant drivers", async () => {
  expect((await onRequestGet(context(new Request("https://x3compass.com/api/clearinghouse/status")))).status).toBe(401);
  const original = globalThis.fetch;
  globalThis.fetch = authFetch((url) => {
    if (url.includes("compass_drivers")) return Response.json([]);
    throw new Error(`unexpected ${url}`);
  });
  try {
    const response = await onRequestPost(context(new Request("https://x3compass.com/api/clearinghouse/status", { method: "POST", headers: { Authorization: "Bearer token" }, body: JSON.stringify({ driver_id: DRIVER, query_type: "annual_limited", requested_at: "2026-08-04T12:00:00Z", query_run_at: "2026-08-04T12:05:00Z", result: "no_information" }) })));
    expect(response.status).toBe(404);
  } finally { globalThis.fetch = original; }
});

test("GET loads bounded tenant projections and returns a truthful per-driver rollup", async () => {
  const calls: string[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = authFetch((url) => {
    calls.push(url);
    if (url.includes("compass_drivers")) return Response.json([{ id: DRIVER, first_name: "Ada", last_name: "Lovelace", status: "active", hire_date: "2025-01-01" }]);
    if (url.includes("compass_clearinghouse_queries")) return Response.json([]);
    if (url.includes("compass_clearinghouse_consents")) return Response.json([]);
    if (url.includes("compass_clearinghouse_violations")) return Response.json([]);
    throw new Error(`unexpected ${url}`);
  });
  try {
    const response = await onRequestGet(context(new Request("https://x3compass.com/api/clearinghouse/status", { headers: { Authorization: "Bearer token" } })));
    expect(response.status).toBe(200);
    const body = await response.json() as { summary: { missingEvidence: number }; drivers: Array<{ annualStatus: string }> };
    expect(body.summary.missingEvidence).toBe(1);
    expect(body.drivers[0].annualStatus).toBe("missing_evidence");
    for (const url of calls) { expect(decodeURIComponent(url)).toContain(CARRIER); expect(url).not.toContain("select=*"); }
  } finally { globalThis.fetch = original; }
});

test("POST validates and records a query for a tenant-owned driver without an FMCSA call", async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const original = globalThis.fetch;
  globalThis.fetch = authFetch((url, init) => {
    calls.push({ url, init });
    if (url.includes("compass_drivers")) return Response.json([{ id: DRIVER }]);
    if (url.endsWith("/rest/v1/compass_clearinghouse_queries")) return Response.json([{ id: "query-1", driver_id: DRIVER, result: "no_information" }]);
    throw new Error(`unexpected ${url}`);
  });
  try {
    const response = await onRequestPost(context(new Request("https://x3compass.com/api/clearinghouse/status", { method: "POST", headers: { Authorization: "Bearer token" }, body: JSON.stringify({ driver_id: DRIVER, query_type: "pre_employment_full", requested_at: "2026-08-04T12:00:00Z", query_run_at: "2026-08-04T12:05:00Z", result: "no_information", consent_received_at: "2026-08-04T11:00:00Z", fmcsa_query_id: "CH-123" }) })));
    expect(response.status).toBe(201);
    const insert = calls.find(({ url }) => url.endsWith("compass_clearinghouse_queries"));
    expect(JSON.parse(String(insert?.init?.body))).toMatchObject({ carrier_id: CARRIER, driver_id: DRIVER, recorded_by: USER, query_type: "pre_employment_full", result: "no_information" });
    expect(calls.some(({ url }) => !url.startsWith("https://database.example.test"))).toBe(false);
  } finally { globalThis.fetch = original; }
});

test("POST rejects completed queries without a run date and unsupported values", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = authFetch(() => { throw new Error("validation must precede operational reads"); });
  try {
    for (const body of [
      { driver_id: DRIVER, query_type: "annual_limited", requested_at: "2026-08-04T12:00:00Z", result: "no_information" },
      { driver_id: DRIVER, query_type: "annual_full", requested_at: "2026-08-04T12:00:00Z", result: "pending" },
    ]) expect((await onRequestPost(context(new Request("https://x3compass.com/api/clearinghouse/status", { method: "POST", headers: { Authorization: "Bearer token" }, body: JSON.stringify(body) })))).status).toBe(400);
  } finally { globalThis.fetch = original; }
});
