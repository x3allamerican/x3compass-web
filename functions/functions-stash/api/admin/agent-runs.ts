/**
 * GET /api/admin/agent-runs
 *
 * Recent agent runs for the Activity tab on /app/control-center. Super-admin only.
 * Supports filters: ?agent=<name>&status=<ok|partial|error|skipped|running>&since=<ISO>&limit=<n>
 */
import { requireSuperAdmin, unauthorized, ok, serverError, type AdminEnv } from "../../_shared/admin-auth";
import { supaFetch } from "../../_shared/supabase-admin";
import { rateLimit } from "../../_shared/rate-limit";

export const onRequestGet: PagesFunction<AdminEnv> = async (ctx) => {
  const _rl = rateLimit(ctx.request, { key: "agent-runs-list", max: 120, windowSec: 60 });
  if (_rl) return _rl;

  const gate = await requireSuperAdmin(ctx);
  if (!gate.ok) return unauthorized(gate.reason);

  try {
    const url = new URL(ctx.request.url);
    const agent = url.searchParams.get("agent");
    const status = url.searchParams.get("status");
    const since = url.searchParams.get("since");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10) || 50, 500);

    const filters: string[] = [];
    if (agent) filters.push(`agent_name=eq.${encodeURIComponent(agent)}`);
    if (status) filters.push(`status=eq.${encodeURIComponent(status)}`);
    if (since) filters.push(`started_at=gte.${encodeURIComponent(since)}`);
    const query = `select=*&${filters.length ? filters.join("&") + "&" : ""}order=started_at.desc&limit=${limit}`;

    const supa = supaFetch(ctx.env);
    const runs = await supa.select("compass_agent_runs", query);

    return ok({ runs });
  } catch (e) {
    return serverError(e instanceof Error ? e.message : String(e));
  }
};
