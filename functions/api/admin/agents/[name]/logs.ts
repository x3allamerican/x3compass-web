/**
 * GET /api/admin/agents/[name]/logs?limit=50  — recent runs for one agent
 */
import { requireSuperAdmin, unauthorized, ok, serverError, type AdminEnv } from "../../../../_shared/admin-auth";
import { supaFetch } from "../../../../_shared/supabase-admin";

export const onRequestGet: PagesFunction<AdminEnv> = async (ctx) => {
  const who = await requireSuperAdmin(ctx); if (!who) return unauthorized();
  const name = ctx.params.name as string;
  const limit = Math.min(200, Number(new URL(ctx.request.url).searchParams.get("limit") || 50));
  try {
    const supa = supaFetch(ctx.env);
    const runs = await supa.select("compass_agent_runs", `select=*&agent_name=eq.${encodeURIComponent(name)}&order=started_at.desc&limit=${limit}`);
    return ok({ runs });
  } catch (e) {
    return serverError(e instanceof Error ? e.message : String(e));
  }
};
