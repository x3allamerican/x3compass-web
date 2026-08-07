/**
 * POST /api/ifta-returns/create — record / file an IFTA quarterly return.
 * Body: { carrier_id, quarter, status, due_date?, filed_date?, tax_owed?, refund? }  (dollars in, cents stored)
 * Tenant-scoped. Update-or-insert on (carrier_id, quarter) so re-filing a quarter overwrites.
 */
import { correlationId, requireTenant, securityError, type SecurityEnv } from "../../_shared/request-security";
type Env = SecurityEnv;
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
const validDate = (v: unknown) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`));
const STATUSES = new Set(["Awaiting data", "Ready to submit", "Filed", "Overdue"]);
const cents = (v: unknown): number | null => {
  if (v === "" || v == null) return null;
  const n = Number(v); return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
};

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
  const quarter = typeof body.quarter === "string" ? body.quarter.trim().slice(0, 16) : "";
  const status = typeof body.status === "string" ? body.status.trim() : "";
  const dueDate = String(body.due_date || "");
  const filedDate = String(body.filed_date || "");
  if (!/^Q[1-4]\s+\d{4}$/.test(quarter)) return json({ ok: false, error: "Quarter must look like 'Q2 2026'" }, 400);
  if (!STATUSES.has(status)) return json({ ok: false, error: "Invalid status" }, 400);
  if (dueDate && !validDate(dueDate)) return json({ ok: false, error: "due_date must be YYYY-MM-DD" }, 400);
  if (filedDate && !validDate(filedDate)) return json({ ok: false, error: "filed_date must be YYYY-MM-DD" }, 400);

  const record = {
    carrier_id: carrierId, quarter, status,
    due_date: dueDate || null, filed_date: filedDate || null,
    tax_owed_cents: cents(body.tax_owed), refund_cents: cents(body.refund),
  };
  const base = ctx.env.SUPABASE_URL.replace(/\/$/, ""); const sr = ctx.env.SUPABASE_SERVICE_ROLE;
  const h = { apikey: sr, Authorization: `Bearer ${sr}`, "Content-Type": "application/json", Accept: "application/json" };
  const q = `carrier_id=eq.${encodeURIComponent(carrierId)}&quarter=eq.${encodeURIComponent(quarter)}`;
  const existing = await fetch(`${base}/rest/v1/compass_ifta_returns?select=id&${q}&limit=1`, { headers: h });
  const rows = existing.ok ? (await existing.json()) as Array<{ id: string }> : [];

  let res: Response;
  if (rows.length) {
    res = await fetch(`${base}/rest/v1/compass_ifta_returns?${q}`, { method: "PATCH", headers: { ...h, Prefer: "return=representation" }, body: JSON.stringify(record) });
  } else {
    res = await fetch(`${base}/rest/v1/compass_ifta_returns`, { method: "POST", headers: { ...h, Prefer: "return=representation" }, body: JSON.stringify(record) });
  }
  if (!res.ok) return json({ ok: false, error: `Save failed (${res.status}): ${(await res.text()).slice(0, 200)}` }, 502);
  return json({ ok: true, updated: rows.length > 0, id: ((await res.json()) as Array<{ id: string }>)[0]?.id });
};

export const onRequestOptions: PagesFunction<Env> = async () => new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
