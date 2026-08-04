import { expect, test } from "@playwright/test";
import { onRequestGet, onRequestPatch, onRequestPost } from "../functions/api/dataq/challenges";

const CARRIER = "00000000-0000-4000-8000-000000000001";
const USER = "10000000-0000-4000-8000-000000000001";
const INSPECTION = "20000000-0000-4000-8000-000000000001";
const CHALLENGE = "30000000-0000-4000-8000-000000000001";
const ENV = { SUPABASE_URL: "https://database.example.test", SUPABASE_SERVICE_ROLE: "role" };

function context(request: Request) {
  return { request, env: ENV, params: {}, data: {}, waitUntil() {}, passThroughOnException() {} } as never;
}

function authFetch(handler: (url: string, init?: RequestInit) => Response | Promise<Response>) {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.includes("/auth/v1/user")) return Response.json({ id: USER });
    if (url.includes("compass_carrier_users")) return Response.json([{ carrier_id: CARRIER }]);
    return handler(url, init);
  }) as typeof fetch;
}

test("DataQ handler rejects unauthenticated access and a cross-tenant target", async () => {
  expect((await onRequestGet(context(new Request("https://x3compass.com/api/dataq/challenges")))).status).toBe(401);
  const original = globalThis.fetch;
  globalThis.fetch = authFetch((url) => {
    if (url.includes("compass_inspections")) return Response.json([]);
    throw new Error(`unexpected ${url}`);
  });
  try {
    const response = await onRequestPost(context(new Request("https://x3compass.com/api/dataq/challenges", {
      method: "POST", headers: { Authorization: "Bearer token" }, body: JSON.stringify({
        target_type: "inspection", target_id: INSPECTION, issue_summary: "Incorrect vehicle association.",
        requested_correction: "Correct the vehicle association.", submitted_on: "2026-08-04",
      }),
    })));
    expect(response.status).toBe(404);
  } finally { globalThis.fetch = original; }
});

test("creates an inspection-linked challenge and carrier-owned evidence", async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const original = globalThis.fetch;
  globalThis.fetch = authFetch((url, init) => {
    calls.push({ url, init });
    if (url.includes("compass_inspections")) return Response.json([{ id: INSPECTION }]);
    if (url.endsWith("/rest/v1/compass_dataq_challenges")) return Response.json([{ id: CHALLENGE, status: "submitted", version: 1 }]);
    if (url.endsWith("/rest/v1/compass_dataq_evidence")) return Response.json([{ id: "evidence-1" }]);
    throw new Error(`unexpected ${url}`);
  });
  try {
    const response = await onRequestPost(context(new Request("https://x3compass.com/api/dataq/challenges", {
      method: "POST", headers: { Authorization: "Bearer token" }, body: JSON.stringify({
        target_type: "inspection", target_id: INSPECTION, issue_summary: "Incorrect vehicle association.",
        requested_correction: "Correct the vehicle association.", submitted_on: "2026-08-04",
        evidence: [{ label: "Dispatch record", file_name: "dispatch.pdf", object_key: `carriers/${CARRIER}/dataq/evidence.pdf`, content_type: "application/pdf", size_bytes: 1024 }],
      }),
    })));
    expect(response.status).toBe(201);
    const targetRead = calls.find(({ url }) => url.includes("compass_inspections"));
    expect(decodeURIComponent(targetRead!.url)).toContain(CARRIER);
    const challengeBody = JSON.parse(String(calls.find(({ url }) => url.endsWith("compass_dataq_challenges"))?.init?.body));
    expect(challengeBody).toMatchObject({ carrier_id: CARRIER, target_id: INSPECTION, created_by: USER, status: "submitted" });
    const evidenceBody = JSON.parse(String(calls.find(({ url }) => url.endsWith("compass_dataq_evidence"))?.init?.body));
    expect(evidenceBody).toMatchObject({ carrier_id: CARRIER, challenge_id: CHALLENGE, created_by: USER });
  } finally { globalThis.fetch = original; }
});

test("lists bounded tenant rows and joins evidence without public URLs", async () => {
  const calls: string[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = authFetch((url) => {
    calls.push(url);
    if (url.includes("compass_dataq_challenges")) return Response.json([{ id: CHALLENGE, target_type: "inspection", target_id: INSPECTION, status: "submitted", version: 1 }]);
    if (url.includes("compass_dataq_evidence")) return Response.json([{ id: "e1", challenge_id: CHALLENGE, label: "Dispatch", file_name: "dispatch.pdf", content_type: "application/pdf", size_bytes: 100 }]);
    throw new Error(`unexpected ${url}`);
  });
  try {
    const response = await onRequestGet(context(new Request("https://x3compass.com/api/dataq/challenges", { headers: { Authorization: "Bearer token" } })));
    expect(response.status).toBe(200);
    const body = await response.json() as { challenges: Array<{ evidence: unknown[] }> };
    expect(body.challenges[0].evidence).toHaveLength(1);
    for (const url of calls) { expect(decodeURIComponent(url)).toContain(CARRIER); expect(url).not.toContain("select=*"); }
    expect(JSON.stringify(body)).not.toContain("object_key");
  } finally { globalThis.fetch = original; }
});

test("updates only an allowed tenant-owned status with optimistic versioning", async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const original = globalThis.fetch;
  globalThis.fetch = authFetch((url, init) => {
    calls.push({ url, init });
    if (url.includes("compass_dataq_challenges") && !init?.method) return Response.json([{ id: CHALLENGE, status: "under_review", version: 3 }]);
    if (url.includes("compass_dataq_challenges") && init?.method === "PATCH") return Response.json([{ id: CHALLENGE, status: "approved", version: 4 }]);
    throw new Error(`unexpected ${url}`);
  });
  try {
    const response = await onRequestPatch(context(new Request("https://x3compass.com/api/dataq/challenges", {
      method: "PATCH", headers: { Authorization: "Bearer token" }, body: JSON.stringify({
        id: CHALLENGE, version: 3, status: "approved", agency_response_on: "2026-08-04", agency_response_notes: "Agency corrected the record.",
      }),
    })));
    expect(response.status).toBe(200);
    const update = calls.find(({ init }) => init?.method === "PATCH");
    expect(decodeURIComponent(update!.url)).toContain(`carrier_id=eq.${CARRIER}`);
    expect(decodeURIComponent(update!.url)).toContain("version=eq.3");
    expect(JSON.parse(String(update!.init?.body))).toMatchObject({ status: "approved", version: 4 });
  } finally { globalThis.fetch = original; }
});

test("rejects illegal transitions and stale writes", async () => {
  const original = globalThis.fetch;
  let stale = false;
  globalThis.fetch = authFetch((url, init) => {
    if (url.includes("compass_dataq_challenges") && !init?.method) return Response.json([{ id: CHALLENGE, status: "approved", version: 2 }]);
    if (url.includes("compass_dataq_challenges") && init?.method === "PATCH") return Response.json(stale ? [] : [{ id: CHALLENGE }]);
    throw new Error(`unexpected ${url}`);
  });
  try {
    const illegal = await onRequestPatch(context(new Request("https://x3compass.com/api/dataq/challenges", { method: "PATCH", headers: { Authorization: "Bearer token" }, body: JSON.stringify({ id: CHALLENGE, version: 2, status: "denied", agency_response_on: "2026-08-04", agency_response_notes: "Changed." }) })));
    expect(illegal.status).toBe(409);

    stale = true;
    globalThis.fetch = authFetch((url, init) => {
      if (url.includes("compass_dataq_challenges") && !init?.method) return Response.json([{ id: CHALLENGE, status: "submitted", version: 2 }]);
      if (url.includes("compass_dataq_challenges") && init?.method === "PATCH") return Response.json([]);
      throw new Error(`unexpected ${url}`);
    });
    const conflict = await onRequestPatch(context(new Request("https://x3compass.com/api/dataq/challenges", { method: "PATCH", headers: { Authorization: "Bearer token" }, body: JSON.stringify({ id: CHALLENGE, version: 1, status: "under_review" }) })));
    expect(conflict.status).toBe(409);
  } finally { globalThis.fetch = original; }
});
