/**
 * PATCH  /api/admin/agents/[name]      — toggle enabled, change cadence/cron
 * Body: { enabled?: boolean, cadence?: string, cron_expr?: string }
 */
import { requireSuperAdmin, unauthorized, ok, serverError, type AdminEnv } from "../../../_shared/admin-auth";
import { supaFetch } from "../../../_shared/supabase-admin";

export const onRequestPatch: PagesFunction<AdminEnv> = async (ctx) => {
  const who = await requireSuperAdmin(ctx); if (!who) return unauthorized();
  const name = ctx.params.name as string;
  if (!name) return serverError("Missing agent name", 400);

  let patch: { enabled?: boolean; cadence?: string; cron_expr?: string };
  try { patch = await ctx.request.json(); } catch { return serverError("Invalid JSON body", 400); }

  const allowed: Record<string, unknown> = {};
  if (typeof patch.enabled === "boolean") allowed.enabled = patch.enabled;
  if (typeof patch.cadence === "string")  allowed.cadence = patch.cadence;
  if (typeof patch.cron_expr === "string") allowed.cron_expr = patch.cron_expr;
  if (Object.keys(allowed).length === 0)  return serverError("No editable fields in body", 400);

  try {
    const supa = supaFetch(ctx.env);
    const updated = await supa.update("compass_agents", `name=eq.${encodeURIComponent(name)}`, allowed);
    return ok({ agent: (updated as unknown[])[0] || null, patched_by: who.type === "user" ? who.email : "internal" });
  } catch (e) {
    return serverError(e instanceof Error ? e.message : String(e));
  }
};
