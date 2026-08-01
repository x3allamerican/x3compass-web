/**
 * POST /api/admin/agents/[name]/toggle
 *
 * Flip the enabled flag on compass_agents. Super-admin only.
 * Body: { enabled: boolean }
 *
 * Response: { ok: true, name, enabled }
 */
import { requireSuperAdmin, unauthorized, ok, badRequest, serverError, type AdminEnv } from "../../../../_shared/admin-auth";
import { supaFetch } from "../../../../_shared/supabase-admin";
import { rateLimit } from "../../../../_shared/rate-limit";

export const onRequestPost: PagesFunction<AdminEnv> = async (ctx) => {
  const _rl = rateLimit(ctx.request, { key: "agents-toggle", max: 60, windowSec: 60 });
  if (_rl) return _rl;

  const gate = await requireSuperAdmin(ctx);
  if (!gate.ok) return unauthorized(gate.reason);

  const name = (ctx.params as { name: string }).name;
  if (!name) return badRequest("missing agent name");

  let body: { enabled?: boolean } = {};
  try { body = await ctx.request.json(); } catch { return badRequest("invalid JSON"); }
  if (typeof body.enabled !== "boolean") return badRequest("enabled must be a boolean");

  try {
    const supa = supaFetch(ctx.env);
    await supa.update("compass_agents", `name=eq.${encodeURIComponent(name)}`, {
      enabled: body.enabled,
      updated_at: new Date().toISOString(),
    });
    return ok({ ok: true, name, enabled: body.enabled });
  } catch (e) {
    return serverError(e instanceof Error ? e.message : String(e));
  }
};
