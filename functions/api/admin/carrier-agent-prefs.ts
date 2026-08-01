/**
 * GET /api/admin/carrier-agent-prefs?carrier_id=<uuid>
 *   → returns prefs for that carrier
 * POST /api/admin/carrier-agent-prefs
 *   body: { carrier_id, agent_name, enabled?, cron_expr_override?, notify_email?, notify_slack?, paused_until? }
 *   → upserts the row
 *
 * Super-admin only. Backs the Carrier Preferences tab on /app/control-center.
 */
import { requireSuperAdmin, unauthorized, ok, badRequest, serverError, type AdminEnv } from "../../_shared/admin-auth";
import { supaFetch } from "../../_shared/supabase-admin";
import { rateLimit } from "../../_shared/rate-limit";

export const onRequestGet: PagesFunction<AdminEnv> = async (ctx) => {
  const _rl = rateLimit(ctx.request, { key: "carrier-prefs-list", max: 60, windowSec: 60 });
  if (_rl) return _rl;
  const gate = await requireSuperAdmin(ctx);
  if (!gate.ok) return unauthorized(gate.reason);

  try {
    const url = new URL(ctx.request.url);
    const carrierId = url.searchParams.get("carrier_id");
    if (!carrierId) return badRequest("carrier_id required");
    const supa = supaFetch(ctx.env);
    const prefs = await supa.select(
      "compass_carrier_agent_prefs",
      `select=*&carrier_id=eq.${encodeURIComponent(carrierId)}&order=agent_name.asc`,
    );
    return ok({ prefs });
  } catch (e) {
    return serverError(e instanceof Error ? e.message : String(e));
  }
};

export const onRequestPost: PagesFunction<AdminEnv> = async (ctx) => {
  const _rl = rateLimit(ctx.request, { key: "carrier-prefs-upsert", max: 60, windowSec: 60 });
  if (_rl) return _rl;
  const gate = await requireSuperAdmin(ctx);
  if (!gate.ok) return unauthorized(gate.reason);

  let body: {
    carrier_id?: string; agent_name?: string;
    enabled?: boolean; cron_expr_override?: string | null;
    notify_email?: string | null; notify_slack?: string | null; paused_until?: string | null;
  } = {};
  try { body = await ctx.request.json(); } catch { return badRequest("invalid JSON"); }
  if (!body.carrier_id || !body.agent_name) return badRequest("carrier_id and agent_name required");

  try {
    const supa = supaFetch(ctx.env);
    // Postgrest upsert on the composite PK (carrier_id, agent_name)
    await supa.upsert("compass_carrier_agent_prefs", {
      carrier_id: body.carrier_id,
      agent_name: body.agent_name,
      enabled: body.enabled ?? true,
      cron_expr_override: body.cron_expr_override ?? null,
      notify_email: body.notify_email ?? null,
      notify_slack: body.notify_slack ?? null,
      paused_until: body.paused_until ?? null,
      updated_at: new Date().toISOString(),
    });
    return ok({ ok: true });
  } catch (e) {
    return serverError(e instanceof Error ? e.message : String(e));
  }
};
