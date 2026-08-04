import { expect, test } from "@playwright/test";
import { runAgent } from "../functions/_shared/agent-registry";

const CARRIER = "00000000-0000-4000-8000-000000000001";
const env = { SUPABASE_URL: "https://database.example.test", SUPABASE_SERVICE_ROLE: "test-role", RESEND_API_KEY: "test-resend" };

function fixtureFetch(calls: string[]) {
  return (async (input: RequestInfo | URL) => {
    const url = String(input);
    calls.push(url);
    if (url.includes("compass_carriers")) return Response.json([{ id: CARRIER, name: "Tenant A", primary_contact_email: "safety@example.test", subscription_status: "active" }]);
    if (url.includes("compass_drivers")) return Response.json([
      { id: "d1", first_name: "Ada", last_name: "Lovelace", status: "active", cdl_expires_on: "2026-08-20", medical_card_expires_on: "2026-09-10" },
    ]);
    if (url.includes("compass_mvr_records")) return Response.json([{ id: "m1", driver_id: "d1", pulled_on: "2025-08-15" }]);
    if (url.includes("compass_dq_documents")) return Response.json([{ id: "i1", driver_id: null, doc_type: "commercial_insurance", expires_on: "2026-08-25" }]);
    if (url.includes("notification_log")) return Response.json([{ id: "n1" }]);
    if (url.includes("api.resend.com")) return Response.json({ id: "email-1" });
    throw new Error(`unexpected request: ${url}`);
  }) as typeof fetch;
}

test.describe("expiration sweep agent", () => {
  test.describe.configure({ mode: "serial" });
  const originalFetch = globalThis.fetch;
  test.afterEach(() => { globalThis.fetch = originalFetch; });

  test("dry run returns exact grouped evidence without sending email", async () => {
    const calls: string[] = [];
    globalThis.fetch = fixtureFetch(calls);
    const result = await runAgent("agent-expiration-sweep", env, { carrier_id: CARRIER, dry_run: true, as_of: "2026-08-04" });

    expect(result.status).toBe("ok");
    expect(result.summary).toContain("dry run");
    expect(result.log).toContain("Ada Lovelace|cdl|2026-08-20|due_30");
    expect(result.log).toContain("Ada Lovelace|mvr|2026-08-15|due_30");
    expect(result.log).toContain("Carrier insurance|insurance|2026-08-25|due_30");
    expect(calls.some((url) => url.includes("api.resend.com"))).toBe(false);
  });

  test("scopes every evidence read and sends one digest for multiple items", async () => {
    const calls: string[] = [];
    globalThis.fetch = fixtureFetch(calls);
    const result = await runAgent("agent-expiration-sweep", env, { carrier_id: CARRIER, as_of: "2026-08-04" });

    expect(result.status).toBe("ok");
    expect(result.summary).toContain("1 sent");
    expect(calls.filter((url) => url.includes("api.resend.com"))).toHaveLength(1);
    expect(calls.filter((url) => url.includes("notification_log"))).toHaveLength(1);
    const evidenceReads = calls.filter((url) => /compass_(drivers|mvr_records|dq_documents)/.test(url));
    expect(evidenceReads).toHaveLength(3);
    for (const url of evidenceReads) {
      expect(decodeURIComponent(url)).toContain(CARRIER);
      expect(url).not.toContain("select=*");
    }
  });
});
