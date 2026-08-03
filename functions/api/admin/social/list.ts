/**
 * GET /api/admin/social/list?carrier_id=<uuid>&status=<status>&platform=<platform>
 * Returns posts ordered by scheduled_at then created_at. status/platform optional filters.
 */
import { correlationId, isUuid, securityError } from "../../../_shared/request-security";
interface Env { SUPABASE_URL?: string; SUPABASE_SERVICE_ROLE?: string; }
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  if (!ctx.env.SUPABASE_URL || !ctx.env.SUPABASE_SERVICE_ROLE) return json({ ok: false, error: "Server missing Supabase env" }, 500);
  const u = new URL(ctx.request.url);
  const carrier_id = u.searchParams.get("carrier_id");
  const status = u.searchParams.get("status");
  const platform = u.searchParams.get("platform");
  if (carrier_id && !isUuid(carrier_id)) return json({ ok: false, error: "Invalid carrier_id" }, 400);
  let q = "select=*&order=scheduled_at.asc.nullslast,created_at.desc&limit=500";
  if (carrier_id) q += `&carrier_id=eq.${encodeURIComponent(carrier_id)}`;
  if (status && status !== "all") q += `&status=eq.${encodeURIComponent(status)}`;
  if (platform && platform !== "all") q += `&platform=eq.${encodeURIComponent(platform)}`;
  const r = await fetch(`${ctx.env.SUPABASE_URL}/rest/v1/compass_social_posts?${q}`, { headers: { apikey: ctx.env.SUPABASE_SERVICE_ROLE, Authorization: `Bearer ${ctx.env.SUPABASE_SERVICE_ROLE}`, Accept: "application/json" } });
  if (!r.ok) return securityError(500, "request_failed", correlationId(ctx.request));
  const rows = await r.json();
  // Status counts in one shot
  const countsR = await fetch(`${ctx.env.SUPABASE_URL}/rest/v1/compass_social_posts?select=status,platform${carrier_id ? `&carrier_id=eq.${encodeURIComponent(carrier_id)}` : ""}&limit=10000`, { headers: { apikey: ctx.env.SUPABASE_SERVICE_ROLE, Authorization: `Bearer ${ctx.env.SUPABASE_SERVICE_ROLE}`, Accept: "application/json" } });
  const all = (await countsR.json()) as { status: string; platform: string }[];
  const counts = { pending: 0, approved: 0, rejected: 0, posted: 0, failed: 0, total: all.length };
  for (const r of all) (counts as Record<string, number>)[r.status]++;
  return json({ ok: true, rows, counts });
};
