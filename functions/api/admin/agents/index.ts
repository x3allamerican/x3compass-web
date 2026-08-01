/**
 * GET    /api/admin/agents             — list every agent (scheduled, on-demand, stub)
 * Auth: super-admin via JWT (Path 1) OR X-X3-Internal-Secret (Path 2)
 */
import { requireSuperAdmin, unauthorized, ok, serverError, type AdminEnv } from "../../../_shared/admin-auth";
import { supaFetch } from "../../../_shared/supabase-admin";

export const onRequestGet: PagesFunction<AdminEnv> = async (ctx) => {
  const who = await requireSuperAdmin(ctx); if (!who) return unauthorized();
  try {
    const supa = supaFetch(ctx.env);
    const agents = await supa.select("compass_agents", "select=*&order=kind.asc,name.asc");
    return ok({ agents, requested_by: who.type === "user" ? who.email : "internal" });
  } catch (e) {
    return serverError(e instanceof Error ? e.message : String(e));
  }
};
