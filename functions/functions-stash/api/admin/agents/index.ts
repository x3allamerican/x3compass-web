/**
 * GET /api/admin/agents
 *
 * Returns every row in compass_agents joined with its most-recent run.
 * Used by the Control Center page on /app/control-center. Super-admin only.
 *
 * Response shape:
 *   { agents: Array<{ name, kind, enabled, cron_expr, next_run_at, last_run_at,
 *     description, category, takes_inputs, last_run: { status, started_at,
 *     duration_ms, summary } | null }> }
 */
import { requireSuperAdmin, unauthorized, ok, serverError, type AdminEnv } from "../../../_shared/admin-auth";
import { supaFetch } from "../../../_shared/supabase-admin";
import { rateLimit } from "../../../_shared/rate-limit";

type AgentRow = {
  name: string;
  kind: "scheduled" | "on-demand" | "event";
  enabled: boolean;
  cron_expr: string | null;
  next_run_at: string | null;
  last_run_at: string | null;
  description: string | null;
  category: string | null;
  takes_inputs: boolean;
};

type LastRun = { status: string; started_at: string; duration_ms: number | null; summary: string | null };

export const onRequestGet: PagesFunction<AdminEnv> = async (ctx) => {
  const _rl = rateLimit(ctx.request, { key: "agents-list", max: 60, windowSec: 60 });
  if (_rl) return _rl;

  const gate = await requireSuperAdmin(ctx);
  if (!gate.ok) return unauthorized(gate.reason);

  try {
    const supa = supaFetch(ctx.env);
    const agents = (await supa.select("compass_agents", "select=*&order=category.asc,name.asc")) as AgentRow[];
    if (agents.length === 0) return ok({ agents: [] });

    // Pull the most-recent 100 runs and pick first per agent_name. Sufficient
    // for the dashboard view; the Activity tab uses /agent-runs for the full feed.
    const recent = (await supa.select(
      "compass_agent_runs",
      "select=agent_name,status,started_at,duration_ms,summary&order=started_at.desc&limit=200",
    )) as Array<{ agent_name: string; status: string; started_at: string; duration_ms: number | null; summary: string | null }>;

    const lastByAgent = new Map<string, LastRun>();
    for (const r of recent) {
      if (!lastByAgent.has(r.agent_name)) {
        lastByAgent.set(r.agent_name, { status: r.status, started_at: r.started_at, duration_ms: r.duration_ms, summary: r.summary });
      }
    }

    return ok({
      agents: agents.map((a) => ({ ...a, last_run: lastByAgent.get(a.name) ?? null })),
    });
  } catch (e) {
    return serverError(e instanceof Error ? e.message : String(e));
  }
};
