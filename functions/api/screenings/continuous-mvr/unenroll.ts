/**
 * POST /api/screenings/continuous-mvr/unenroll   (Bearer Supabase JWT)
 *
 * Stop Continuous MVR monitoring for a driver (cost control — Checkr bills a
 * recurring monthly fee per enrolled candidate until unenrolled). Cancels the
 * Checkr continuous check and marks the local monitor canceled.
 *
 * Body: { driver_id: uuid, carrier_id?: uuid }
 * Cancel call is env-overridable (varies by account/product):
 *   CHECKR_CONTINUOUS_MVR_CANCEL_PATH  default "/v1/continuous_checks/{id}/cancel"
 *   CHECKR_CONTINUOUS_MVR_CANCEL_METHOD default "POST"
 */
import { correlationId, isUuid, requireTenant, securityError, type SecurityEnv } from "../../../_shared/request-security";
import { supaFetch } from "../../../_shared/supabase-admin";

interface Env extends SecurityEnv {
  CHECKR_STAGING_API_KEY?: string;
  CHECKR_LIVE_API_KEY?: string;
  CHECKR_ENV?: "staging" | "live";
  CHECKR_API_BASE?: string;
  CHECKR_CONTINUOUS_MVR_CANCEL_PATH?: string;
  CHECKR_CONTINUOUS_MVR_CANCEL_METHOD?: string;
}

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const requestId = correlationId(ctx.request);
  let body: { driver_id?: string; carrier_id?: string };
  try { body = (await ctx.request.json()) as typeof body; } catch { return json({ ok: false, error: "Invalid JSON" }, 400); }

  let authority;
  try { authority = await requireTenant(ctx.request, ctx.env, body.carrier_id); }
  catch { return securityError(503, "authorization_unavailable", requestId); }
  if (!authority.ok) return securityError(authority.status, authority.code, requestId);
  if (!isUuid(body.driver_id)) return json({ ok: false, error: "driver_id must be a UUID" }, 400);

  const supa = supaFetch(ctx.env);
  const rows = (await supa.select("compass_mvr_monitors",
    `carrier_id=eq.${authority.carrierId}&driver_id=eq.${body.driver_id}&select=id,status,checkr_continuous_check_id&limit=1`)) as Array<{ id: string; status: string; checkr_continuous_check_id: string | null }>;
  const mon = rows[0];
  if (!mon) return json({ ok: false, error: "No enrollment found for this driver" }, 404);
  if (mon.status === "canceled") return json({ ok: true, monitor: mon, already: true });

  // Best-effort cancel at Checkr.
  let checkrCanceled = false; let warning: string | undefined;
  if (mon.checkr_continuous_check_id) {
    const cenv = ctx.env.CHECKR_ENV === "live" ? "live" : "staging";
    const apiKey = cenv === "live" ? ctx.env.CHECKR_LIVE_API_KEY : ctx.env.CHECKR_STAGING_API_KEY;
    if (apiKey) {
      const apiBase = ctx.env.CHECKR_API_BASE || "https://api.checkr.com";
      const path = (ctx.env.CHECKR_CONTINUOUS_MVR_CANCEL_PATH || "/v1/continuous_checks/{id}/cancel").replace("{id}", encodeURIComponent(mon.checkr_continuous_check_id));
      const method = (ctx.env.CHECKR_CONTINUOUS_MVR_CANCEL_METHOD || "POST").toUpperCase();
      try {
        const r = await fetch(`${apiBase}${path}`, { method, headers: { Authorization: `Basic ${btoa(apiKey + ":")}`, "Content-Type": "application/json" } });
        if (r.ok || r.status === 404) checkrCanceled = true;
        else warning = `Checkr cancel returned ${r.status}; verify in dashboard`;
      } catch (e) { warning = `Checkr cancel failed: ${e instanceof Error ? e.message : String(e)}`; }
    } else { warning = `CHECKR_${cenv.toUpperCase()}_API_KEY not set; cancel in dashboard`; }
  } else { checkrCanceled = true; }

  const monitor = (await supa.update("compass_mvr_monitors", `id=eq.${mon.id}`,
    { status: "canceled", canceled_at: new Date().toISOString(), updated_at: new Date().toISOString() }))[0];
  return json({ ok: true, monitor, checkr_canceled: checkrCanceled, ...(warning ? { warning } : {}) });
};

export const onRequestOptions: PagesFunction = async () => new Response(null, { status: 204 });
