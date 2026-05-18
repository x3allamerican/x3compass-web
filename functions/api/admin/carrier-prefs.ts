/**
 * GET   /api/admin/carrier-prefs                — list every carrier's notification prefs
 * PATCH /api/admin/carrier-prefs?dot=<dot>       — update one carrier's prefs
 *   Body: { mode?, send_hour?, monthly?, reg?, qbr?, expiry?, csa?, ifta?, inspect? }
 */
import { requireSuperAdmin, unauthorized, ok, serverError, type AdminEnv } from "../../_shared/admin-auth";
import { supaFetch } from "../../_shared/supabase-admin";

export const onRequestGet: PagesFunction<AdminEnv> = async (ctx) => {
  const who = await requireSuperAdmin(ctx); if (!who) return unauthorized();
  try {
    const supa = supaFetch(ctx.env);
    const rows = await supa.select("compass_carrier_prefs", "select=*&order=carrier_name.asc");
    return ok({ prefs: rows });
  } catch (e) {
    return serverError(e instanceof Error ? e.message : String(e));
  }
};

export const onRequestPatch: PagesFunction<AdminEnv> = async (ctx) => {
  const who = await requireSuperAdmin(ctx); if (!who) return unauthorized();
  const dot = new URL(ctx.request.url).searchParams.get("dot");
  if (!dot) return serverError("Missing ?dot=", 400);

  let body: Record<string, unknown>;
  try { body = await ctx.request.json(); } catch { return serverError("Invalid JSON body", 400); }

  const ALLOWED = new Set(["mode","send_hour","monthly","reg","qbr","expiry","csa","ifta","inspect"]);
  const patch: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) if (ALLOWED.has(k)) patch[k] = v;
  if (Object.keys(patch).length === 0) return serverError("No editable fields in body", 400);

  try {
    const supa = supaFetch(ctx.env);
    const updated = await supa.update("compass_carrier_prefs", `dot_number=eq.${encodeURIComponent(dot)}`, patch);
    return ok({ pref: (updated as unknown[])[0] || null });
  } catch (e) {
    return serverError(e instanceof Error ? e.message : String(e));
  }
};
