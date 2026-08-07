/**
 * POST /api/training-records/create — record a driver training completion.
 * Body: { carrier_id, driver_id, course_name, course_category?, provider?, completed_on, expires_on? }
 * Tenant-scoped; validates the driver belongs to the carrier.
 */
import { correlationId, requireTenant, securityError, type SecurityEnv } from "../../_shared/request-security";
type Env = SecurityEnv;
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
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
  const courseName = str(body.course_name, 160);
  const courseCategory = str(body.course_category, 80);
  const provider = str(body.provider, 120);
  const completedOn = String(body.completed_on || "");
  const expiresOn = str(body.expires_on, 12);

  if (!driverId) return json({ ok: false, error: "Pick a driver" }, 400);
  if (!courseName) return json({ ok: false, error: "Course name is required" }, 400);
  if (!validDate(completedOn)) return json({ ok: false, error: "completed_on must be YYYY-MM-DD" }, 400);
  if (expiresOn && !validDate(expiresOn)) return json({ ok: false, error: "expires_on must be YYYY-MM-DD" }, 400);

  const base = ctx.env.SUPABASE_URL.replace(/\/$/, ""); const sr = ctx.env.SUPABASE_SERVICE_ROLE;
  const h = { apikey: sr, Authorization: `Bearer ${sr}`, "Content-Type": "application/json", Accept: "application/json" };
  const dr = await fetch(`${base}/rest/v1/compass_drivers?select=id&carrier_id=eq.${encodeURIComponent(carrierId)}&id=eq.${encodeURIComponent(driverId)}&limit=1`, { headers: h });
  if (!((dr.ok ? (await dr.json()) as unknown[] : []).length)) return json({ ok: false, error: "That driver is not in your fleet" }, 400);

  const ins = await fetch(`${base}/rest/v1/compass_training_records`, {
    method: "POST", headers: { ...h, Prefer: "return=representation" },
    body: JSON.stringify({ carrier_id: carrierId, driver_id: driverId, course_name: courseName, course_category: courseCategory || null, provider: provider || null, completed_on: completedOn, expires_on: expiresOn || null }),
  });
  if (!ins.ok) return json({ ok: false, error: `Save failed (${ins.status}): ${(await ins.text()).slice(0, 200)}` }, 502);
  return json({ ok: true, id: ((await ins.json()) as Array<{ id: string }>)[0]?.id });
};

export const onRequestOptions: PagesFunction<Env> = async () => new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
