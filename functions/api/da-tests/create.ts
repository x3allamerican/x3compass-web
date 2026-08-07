/**
 * POST /api/da-tests/create — record a DOT drug/alcohol test (49 CFR Part 382).
 * Body: { carrier_id, driver_id, collected_on, test_type, result, lab?, mro_notes? }
 * Tenant-scoped; validates the driver belongs to the carrier and the enum values.
 */
import { correlationId, requireTenant, securityError, type SecurityEnv } from "../../_shared/request-security";
type Env = SecurityEnv;
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

const TEST_TYPES = new Set(["Pre-employment", "Random", "Post-accident", "Reasonable suspicion", "Return-to-duty", "Follow-up"]);
const RESULTS = new Set(["Negative", "Negative-dilute", "Positive", "Refusal", "Pending"]);
const validDate = (v: unknown) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`));
const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  let body: Record<string, unknown>;
  try { body = await ctx.request.json(); } catch { return json({ ok: false, error: "Invalid JSON" }, 400); }
  const requestId = correlationId(ctx.request);
  let authority;
  try { authority = await requireTenant(ctx.request, ctx.env, body.carrier_id as string | undefined); }
  catch { return securityError(503, "authorization_unavailable", requestId); }
  if (!authority.ok) return securityError(authority.status, authority.code, requestId);
  if (!ctx.env.SUPABASE_URL || !ctx.env.SUPABASE_SERVICE_ROLE) return json({ ok: false, error: "Server missing Supabase env" }, 500);

  const carrierId = authority.carrierId;
  const driverId = str(body.driver_id, 64);
  const collectedOn = String(body.collected_on || "");
  const testType = str(body.test_type, 40);
  const result = str(body.result, 40) || "Pending";
  const lab = str(body.lab, 120);
  const mroNotes = str(body.mro_notes, 1000);

  if (!driverId) return json({ ok: false, error: "Pick a driver" }, 400);
  if (!validDate(collectedOn)) return json({ ok: false, error: "collected_on must be YYYY-MM-DD" }, 400);
  if (!TEST_TYPES.has(testType)) return json({ ok: false, error: "Invalid test_type" }, 400);
  if (!RESULTS.has(result)) return json({ ok: false, error: "Invalid result" }, 400);

  const base = ctx.env.SUPABASE_URL.replace(/\/$/, ""); const sr = ctx.env.SUPABASE_SERVICE_ROLE;
  const h = { apikey: sr, Authorization: `Bearer ${sr}`, "Content-Type": "application/json", Accept: "application/json" };

  // driver must belong to this carrier
  const dr = await fetch(`${base}/rest/v1/compass_drivers?select=id&carrier_id=eq.${encodeURIComponent(carrierId)}&id=eq.${encodeURIComponent(driverId)}&limit=1`, { headers: h });
  const drivers = dr.ok ? (await dr.json()) as unknown[] : [];
  if (!drivers.length) return json({ ok: false, error: "That driver is not in your fleet" }, 400);

  const ins = await fetch(`${base}/rest/v1/compass_da_tests`, {
    method: "POST", headers: { ...h, Prefer: "return=representation" },
    body: JSON.stringify({ carrier_id: carrierId, driver_id: driverId, collected_on: collectedOn, test_type: testType, result, lab: lab || null, mro_notes: mroNotes || null }),
  });
  if (!ins.ok) return json({ ok: false, error: `Save failed (${ins.status}): ${(await ins.text()).slice(0, 200)}` }, 502);
  const rows = (await ins.json()) as Array<{ id: string }>;
  return json({ ok: true, id: rows[0]?.id });
};

export const onRequestOptions: PagesFunction<Env> = async () => new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
