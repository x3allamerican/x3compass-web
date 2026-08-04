import { expect, test } from "@playwright/test";
import { PDFDocument } from "pdf-lib";
import { onRequestGet } from "../functions/api/audit/pdf";

const CARRIER = "00000000-0000-4000-8000-000000000001";
const USER = "10000000-0000-4000-8000-000000000001";
const DRIVER = "20000000-0000-4000-8000-000000000001";

function context(request: Request, env: Record<string, string> = {}) {
  return { request, env, params: {}, data: {}, waitUntil() {}, passThroughOnException() {} } as never;
}

test("audit PDF rejects unauthenticated and invalid document requests", async () => {
  expect((await onRequestGet(context(new Request("https://x3compass.com/api/audit/pdf?type=drug-alcohol")))).status).toBe(401);

  const original = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/auth/v1/user")) return Response.json({ id: USER });
    if (url.includes("compass_carrier_users")) return Response.json([{ carrier_id: CARRIER }]);
    throw new Error(`unexpected ${url}`);
  }) as typeof fetch;
  try {
    const response = await onRequestGet(context(new Request("https://x3compass.com/api/audit/pdf?type=unknown", { headers: { Authorization: "Bearer token" } }), { SUPABASE_URL: "https://database.example.test", SUPABASE_SERVICE_ROLE: "role" }));
    expect(response.status).toBe(400);
  } finally { globalThis.fetch = original; }
});

test("DQ PDF rejects a driver outside the tenant before related evidence reads", async () => {
  const calls: string[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input); calls.push(url);
    if (url.includes("/auth/v1/user")) return Response.json({ id: USER });
    if (url.includes("compass_carrier_users")) return Response.json([{ carrier_id: CARRIER }]);
    if (url.includes("compass_carriers")) return Response.json([{ id: CARRIER, name: "Tenant", usdot_number: "123" }]);
    if (url.includes("compass_drivers")) return Response.json([]);
    throw new Error(`related evidence must not load: ${url}`);
  }) as typeof fetch;
  try {
    const response = await onRequestGet(context(new Request(`https://x3compass.com/api/audit/pdf?type=dq-file&driver_id=${DRIVER}`, { headers: { Authorization: "Bearer token" } }), { SUPABASE_URL: "https://database.example.test", SUPABASE_SERVICE_ROLE: "role" }));
    expect(response.status).toBe(404);
    expect(calls.some((url) => url.includes("compass_dq_documents"))).toBe(false);
  } finally { globalThis.fetch = original; }
});

test("all three export types return tenant-scoped PDFs and minimal audit events", async () => {
  const original = globalThis.fetch;
  for (const type of ["dq-file", "drug-alcohol", "accident-register"] as const) {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input); calls.push({ url, init });
      if (url.includes("/auth/v1/user")) return Response.json({ id: USER });
      if (url.includes("compass_carrier_users")) return Response.json([{ carrier_id: CARRIER }]);
      if (url.includes("compass_carriers")) return Response.json([{ id: CARRIER, name: "Tenant A", usdot_number: "1234567" }]);
      if (url.includes("compass_drivers")) return Response.json([{ id: DRIVER, first_name: "Ada", last_name: "Lovelace", status: "active", cdl_state: "MI", cdl_number: "X123", cdl_class: "A", cdl_expires_on: "2027-01-01", medical_card_expires_on: "2026-12-01" }]);
      if (url.includes("compass_dq_documents")) return Response.json([{ id: "q1", driver_id: DRIVER, doc_type: "medical_certificate", label: "MEC", expires_on: "2026-12-01", created_at: "2026-01-01" }]);
      if (url.includes("compass_mvr_records")) return Response.json([{ id: "m1", driver_id: DRIVER, pulled_on: "2026-01-01", license_status: "valid", violations_count: 0 }]);
      if (url.includes("compass_training_records")) return Response.json([{ id: "t1", driver_id: DRIVER, course_name: "Defensive driving", completed_on: "2026-01-01", expires_on: null }]);
      if (url.includes("compass_da_tests")) return Response.json([{ id: "da1", driver_id: DRIVER, driver_name: "Ada Lovelace", test_date: "2026-01-01", test_type: "Random", panel: "DOT 5-panel", mro: "MRO", result: "Negative" }]);
      if (url.includes("compass_accidents")) return Response.json([{ id: "a1", accident_date: "2026-01-01", city: "Detroit", state: "MI", driver_id: DRIVER, fatalities: 0, injuries: 0, hazmat_released: false }]);
      if (url.includes("/rest/v1/audit_log")) return Response.json([{ id: "log-1" }]);
      throw new Error(`unexpected ${url}`);
    }) as typeof fetch;

    const driver = type === "dq-file" ? `&driver_id=${DRIVER}` : "";
    const response = await onRequestGet(context(new Request(`https://x3compass.com/api/audit/pdf?type=${type}${driver}`, { headers: { Authorization: "Bearer token" } }), { SUPABASE_URL: "https://database.example.test", SUPABASE_SERVICE_ROLE: "role" }));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect((await PDFDocument.load(await response.arrayBuffer())).getPageCount()).toBeGreaterThan(0);

    const operational = calls.filter(({ url }) => /compass_(carriers|drivers|dq_documents|mvr_records|training_records|da_tests|accidents)/.test(url) && !url.includes("carrier_users"));
    for (const { url } of operational) { expect(decodeURIComponent(url)).toContain(CARRIER); expect(url).not.toContain("select=*"); }
    const audit = calls.find(({ url }) => url.includes("/rest/v1/audit_log"));
    expect(audit).toBeTruthy();
    const payload = JSON.parse(String(audit?.init?.body));
    expect(payload).toMatchObject({ carrier_id: CARRIER, user_id: USER, action: "audit_pdf_generated", entity_type: "audit_export" });
    expect(JSON.stringify(payload)).not.toContain("X123");
    expect(JSON.stringify(payload)).not.toContain("Negative");
  }
  globalThis.fetch = original;
});
