/** POST /api/admin/social/bulk · Body: { ids: string[], status: string } */
import { correlationId, isUuid, securityError } from "../../../_shared/request-security";
interface Env { SUPABASE_URL?: string; SUPABASE_SERVICE_ROLE?: string; }
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });
export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  let body: { ids?: string[]; status?: string };
  try { body = await ctx.request.json(); } catch { return json({ ok: false, error: "Invalid JSON" }, 400); }
  if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) return json({ ok: false, error: "Missing ids" }, 400);
  if (!body.ids.every(isUuid)) return json({ ok: false, error: "Invalid id" }, 400);
  if (!body.status) return json({ ok: false, error: "Missing status" }, 400);
  if (!ctx.env.SUPABASE_URL || !ctx.env.SUPABASE_SERVICE_ROLE) return json({ ok: false, error: "Server missing env" }, 500);
  const idsCsv = body.ids.join(",");
  const r = await fetch(`${ctx.env.SUPABASE_URL}/rest/v1/compass_social_posts?id=in.(${idsCsv})`, {
    method: "PATCH",
    headers: { apikey: ctx.env.SUPABASE_SERVICE_ROLE, Authorization: `Bearer ${ctx.env.SUPABASE_SERVICE_ROLE}`, "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify({ status: body.status, updated_at: new Date().toISOString() }),
  });
  if (!r.ok) return securityError(500, "request_failed", correlationId(ctx.request));
  const rows = (await r.json()) as unknown[];
  return json({ ok: true, updated: rows.length });
};
