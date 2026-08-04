import { expect, test } from "@playwright/test";
import { onRequestPost as enroll } from "../functions/api/screenings/continuous-mvr/enroll";
import { onRequestPost as unenroll } from "../functions/api/screenings/continuous-mvr/unenroll";
import { onRequestGet as list } from "../functions/api/screenings/continuous-mvr/list";
import { onRequestPost as parse } from "../functions/api/screenings/mvr/parse";
import { applyContinuousMvr, verifyHmacSha256 } from "../functions/api/screenings/webhook";

const CARRIER_A = "00000000-0000-4000-8000-000000000001";
const CARRIER_B = "00000000-0000-4000-8000-000000000002";
const USER = "00000000-0000-4000-8000-000000000003";
const DRIVER = "00000000-0000-4000-8000-000000000004";
const ENV = { SUPABASE_URL: "https://database.invalid", SUPABASE_SERVICE_ROLE: "test-service-role" };

function context(request: Request) {
  return { request, env: ENV, params: {}, data: {}, next: async () => new Response() } as never;
}

function post(path: string, body: Record<string, unknown>, authorized = true) {
  return new Request(`https://app.invalid${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(authorized ? { Authorization: "Bearer test-user-token" } : {}) },
    body: JSON.stringify(body),
  });
}

test("every tenant screenings endpoint rejects a missing bearer token", async () => {
  const responses = await Promise.all([
    enroll(context(post("/api/screenings/continuous-mvr/enroll", { driver_id: DRIVER }, false))),
    unenroll(context(post("/api/screenings/continuous-mvr/unenroll", { driver_id: DRIVER }, false))),
    list(context(new Request("https://app.invalid/api/screenings/continuous-mvr/list"))),
    parse(context(post("/api/screenings/mvr/parse", { filename: "mvr.pdf", file_base64: "Zml4dHVyZQ==" }, false))),
  ]);
  for (const response of responses) {
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ ok: false, code: "unauthorized" });
  }
});

test("enroll, unenroll, and parse reject a carrier outside the user's memberships", async () => {
  const originalFetch = globalThis.fetch;
  const calls: string[] = [];
  globalThis.fetch = async (input) => {
    const url = String(input);
    calls.push(url);
    if (url.endsWith("/auth/v1/user")) return Response.json({ id: USER });
    if (url.includes("/rest/v1/compass_carrier_users?")) return Response.json([{ carrier_id: CARRIER_A }]);
    throw new Error(`unexpected operational request: ${url}`);
  };
  try {
    const responses = await Promise.all([
      enroll(context(post("/api/screenings/continuous-mvr/enroll", { driver_id: DRIVER, carrier_id: CARRIER_B }))),
      unenroll(context(post("/api/screenings/continuous-mvr/unenroll", { driver_id: DRIVER, carrier_id: CARRIER_B }))),
      parse(context(post("/api/screenings/mvr/parse", { carrier_id: CARRIER_B, filename: "mvr.pdf", file_base64: "Zml4dHVyZQ==" }))),
    ]);
    for (const response of responses) {
      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toMatchObject({ ok: false, code: "tenant_forbidden" });
    }
    expect(calls.some((url) => /compass_mvr_monitors|mvr_uploads|vendor_orders/.test(url))).toBe(false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("list derives KPI counts from only the authenticated carrier's monitor rows", async () => {
  const originalFetch = globalThis.fetch;
  const calls: string[] = [];
  globalThis.fetch = async (input) => {
    const url = String(input);
    calls.push(url);
    if (url.endsWith("/auth/v1/user")) return Response.json({ id: USER });
    if (url.includes("/rest/v1/compass_carrier_users?")) return Response.json([{ carrier_id: CARRIER_A }]);
    if (url.includes("/rest/v1/compass_mvr_monitors?")) return Response.json([
      { id: "m1", driver_id: DRIVER, status: "active" },
      { id: "m2", driver_id: DRIVER, status: "pending" },
      { id: "m3", driver_id: DRIVER, status: "canceled" },
    ]);
    throw new Error(`unexpected request: ${url}`);
  };
  try {
    const response = await list(context(new Request("https://app.invalid/api/screenings/continuous-mvr/list", { headers: { Authorization: "Bearer test-user-token" } })));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true, kpis: { total: 3, active: 1, pending: 1, canceled: 1, failed: 0, paused: 0 } });
    expect(calls.some((url) => url.includes(`carrier_id=eq.${CARRIER_A}`))).toBe(true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Checkr webhook signature verification rejects tampering", async () => {
  const body = JSON.stringify({ id: "evt_1", type: "report.completed" });
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode("webhook-secret"), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  const hex = Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
  await expect(verifyHmacSha256(body, "webhook-secret", `sha256=${hex}`)).resolves.toBe(true);
  await expect(verifyHmacSha256(`${body} `, "webhook-secret", `sha256=${hex}`)).resolves.toBe(false);
});

test("continuous_check.created backfills a monitor from the carrier-scoped vendor order", async () => {
  const originalFetch = globalThis.fetch;
  const writes: Array<{ url: string; method: string; body: Record<string, unknown> }> = [];
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (url.includes("/compass_mvr_monitors?") && !init?.method) return Response.json([]);
    if (url.includes("/vendor_orders?")) return Response.json([{ carrier_id: CARRIER_A, driver_id: DRIVER }]);
    if (url.includes("/compass_mvr_monitors?on_conflict=")) {
      writes.push({ url, method: init?.method || "GET", body: JSON.parse(String(init?.body)) });
      return new Response(null, { status: 201 });
    }
    throw new Error(`unexpected request: ${url}`);
  };
  try {
    await applyContinuousMvr(ENV, {}, "continuous_check.created", { id: "cc_1", candidate_id: "candidate_1", type: "mvr" });
    expect(writes).toHaveLength(1);
    expect(writes[0]).toMatchObject({ method: "POST", body: { carrier_id: CARRIER_A, driver_id: DRIVER, checkr_continuous_check_id: "cc_1", status: "active" } });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("report.completed writes an MVR only for a monitored candidate", async () => {
  const originalFetch = globalThis.fetch;
  const writes: string[] = [];
  let monitored = false;
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (url.includes("/compass_mvr_monitors?") && !init?.method) {
      return Response.json(monitored ? [{ id: "monitor-1", carrier_id: CARRIER_A, driver_id: DRIVER }] : []);
    }
    if (init?.method) {
      writes.push(`${init.method} ${url}`);
      return new Response(null, { status: 201 });
    }
    throw new Error(`unexpected request: ${url}`);
  };
  try {
    const event = { id: "report-1", candidate_id: "candidate-1", result: "consider", motor_vehicle_report: { state: "MI", violations: [{ id: "v1" }] } };
    await applyContinuousMvr(ENV, {}, "report.completed", event);
    expect(writes).toEqual([]);
    monitored = true;
    await applyContinuousMvr(ENV, {}, "report.completed", event);
    expect(writes.filter((write) => write.includes("/compass_mvr_records"))).toHaveLength(1);
    expect(writes.filter((write) => write.includes("/compass_mvr_monitors?id=eq.monitor-1"))).toHaveLength(1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
