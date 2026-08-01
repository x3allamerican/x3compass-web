/**
 * GET /api/admin/finance-team
 *
 * Returns status + last-run for all 9 Finance Team agents. Used by the
 * /app/finance-team page. Super-admin only.
 *
 * 5 agents LIVE (Sprint #16-20): agent-fpa-manager, agent-control-manager,
 *   agent-reporting-manager, agent-finance-workflow, agent-revenue-manager.
 * 4 agents PROPOSED (Sprint #21+): agent-partner-settlement,
 *   agent-ap-manager, agent-tax-manager, agent-pricing-margin.
 *
 * For LIVE agents, joins compass_agent_runs to surface most-recent run
 * (status, started_at, duration_ms, summary).
 */
import { requireSuperAdmin, unauthorized, ok, type AdminEnv } from "../../_shared/admin-auth";
import { supaFetch } from "../../_shared/supabase-admin";

interface Env extends AdminEnv {}

type LastRun = { status: string; started_at: string; duration_ms: number | null; summary: string | null } | null;

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const gate = await requireSuperAdmin(ctx);
  if (!gate.ok) return unauthorized(gate.reason);

  const LIVE_AGENTS = [
    "agent-fpa-manager", "agent-control-manager", "agent-reporting-manager",
    "agent-finance-workflow", "agent-revenue-manager",
  ];
  const PROPOSED_AGENTS = [
    "agent-partner-settlement", "agent-ap-manager",
    "agent-tax-manager", "agent-pricing-margin",
  ];

  const supa = supaFetch(ctx.env);

  // Pull most-recent run per LIVE agent
  const lastRunByAgent = new Map<string, LastRun>();
  try {
    // We get up to 50 most-recent runs across all live agents, then pick first per agent
    const runs = (await supa.select("compass_agent_runs", `select=agent_name,status,started_at,duration_ms,summary&agent_name=in.(${LIVE_AGENTS.join(",")})&order=started_at.desc&limit=200`)) as Array<{ agent_name: string; status: string; started_at: string; duration_ms: number | null; summary: string | null }>;
    for (const r of runs) {
      if (!lastRunByAgent.has(r.agent_name)) {
        lastRunByAgent.set(r.agent_name, { status: r.status, started_at: r.started_at, duration_ms: r.duration_ms, summary: r.summary });
      }
    }
  } catch { /* table might not be populated yet — page handles null gracefully */ }

  // 30-day run health per LIVE agent: success/fail counts
  const healthByAgent: Record<string, { success: number; failed: number; running: number; total: number }> = {};
  try {
    const cutoff = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const recent = (await supa.select("compass_agent_runs", `select=agent_name,status&agent_name=in.(${LIVE_AGENTS.join(",")})&started_at=gte.${cutoff}&limit=5000`)) as Array<{ agent_name: string; status: string }>;
    for (const a of LIVE_AGENTS) healthByAgent[a] = { success: 0, failed: 0, running: 0, total: 0 };
    for (const r of recent) {
      const h = healthByAgent[r.agent_name];
      if (!h) continue;
      h.total++;
      if (r.status === "succeeded" || r.status === "success" || r.status === "ok") h.success++;
      else if (r.status === "failed" || r.status === "error") h.failed++;
      else if (r.status === "running" || r.status === "started") h.running++;
    }
  } catch { /* no-op */ }

  return ok({
    live_count: LIVE_AGENTS.length,
    proposed_count: PROPOSED_AGENTS.length,
    last_run: Object.fromEntries(lastRunByAgent),
    health_30d: healthByAgent,
  });
};
