/**
 * GET /api/screenings/continuous-mvr/list   (Bearer Supabase JWT)
 *
 * List this carrier's Continuous MVR enrollments with rollup KPIs.
 * Returns: { ok:true, kpis:{ total, active, pending, canceled, failed, paused }, monitors:[...] }
 */
import { correlationId, requireTenant, securityError, type SecurityEnv } from "../../../_shared/request-security";
import { supaFetch } from "../../../_shared/supabase-admin";

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

type Monitor = { id: string; driver_id: string; status: string; checkr_continuous_check_id: string | null; last_change_at: string | null; last_report_id: string | null; enrolled_at: string };

export const onRequestGet: PagesFunction<SecurityEnv> = async (ctx) => {
  const requestId = correlationId(ctx.request);
  let authority;
  try { authority = await requireTenant(ctx.request, ctx.env, null); }
  catch { return securityError(503, "authorization_unavailable", requestId); }
  if (!authority.ok) return securityError(authority.status, authority.code, requestId);

  const supa = supaFetch(ctx.env);
  const monitors = (await supa.select("compass_mvr_monitors",
    `carrier_id=eq.${authority.carrierId}&select=id,driver_id,status,checkr_continuous_check_id,last_change_at,last_report_id,enrolled_at&order=enrolled_at.desc`)) as Monitor[];

  const kpis = { total: monitors.length, active: 0, pending: 0, canceled: 0, failed: 0, paused: 0 };
  for (const m of monitors) {
    if (m.status in kpis) (kpis as Record<string, number>)[m.status]++;
  }
  return json({ ok: true, kpis, monitors });
};

export const onRequestOptions: PagesFunction = async () => new Response(null, { status: 204 });
