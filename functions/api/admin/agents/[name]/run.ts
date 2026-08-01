/**
 * POST /api/admin/agents/[name]/run    — fire an agent immediately
 *
 * This is the heart of the agent execution layer. The function:
 *  1. Authorizes the caller (super-admin or internal-cron)
 *  2. Verifies the agent exists and is enabled
 *  3. Inserts a 'running' row in compass_agent_runs
 *  4. Calls the agent implementation (registry below)
 *  5. Updates the row with the final status + duration + summary
 *  6. Updates compass_agents.last_run_at / last_result
 *
 * The "Run now" button in /app/control-center hits this. The GitHub Actions
 * cron dispatcher also hits this (with X-X3-Internal-Secret) for scheduled runs.
 */
import { requireSuperAdmin, unauthorized, ok, serverError, type AdminEnv } from "../../../../_shared/admin-auth";
import { supaFetch } from "../../../../_shared/supabase-admin";
import { runAgent, type AgentResult } from "../../../../_shared/agent-registry";

export const onRequestPost: PagesFunction<AdminEnv> = async (ctx) => {
  const who = await requireSuperAdmin(ctx); if (!who) return unauthorized();
  const name = ctx.params.name as string;
  if (!name) return serverError("Missing agent name", 400);

  const supa = supaFetch(ctx.env);

  // 1. confirm agent exists
  const rows = await supa.select("compass_agents", `select=*&name=eq.${encodeURIComponent(name)}`) as Array<{ name: string; enabled: boolean; kind: string }>;
  const agent = rows[0];
  if (!agent) return serverError(`Agent '${name}' not found`, 404);
  if (!agent.enabled) return serverError(`Agent '${name}' is disabled`, 409);

  // 2. insert running row
  const started = new Date();
  const runRow = (await supa.insert("compass_agent_runs", {
    agent_name:        name,
    started_at:        started.toISOString(),
    status:            "running",
    triggered_by:      who.type === "internal" ? "cron" : "manual",
    triggered_by_user: who.type === "user" ? who.id : null,
  })) as Array<{ id: string }>;
  const runId = runRow[0]?.id;

  // 3. parse optional inputs body for on-demand agents
  let inputs: Record<string, unknown> | undefined;
  try { inputs = await ctx.request.json() as Record<string, unknown>; } catch { /* empty body is fine */ }

  // 4. execute
  let result: AgentResult;
  const t0 = Date.now();
  try {
    result = await runAgent(name, ctx.env, inputs);
  } catch (e) {
    result = { status: "error", summary: e instanceof Error ? e.message : String(e) };
  }
  const ended = new Date();
  const durationMs = Date.now() - t0;

  // 4. finalize run row
  if (runId) {
    await supa.update("compass_agent_runs", `id=eq.${runId}`, {
      ended_at: ended.toISOString(),
      duration_ms: durationMs,
      status: result.status,
      summary: result.summary,
      log: result.log,
    });
  }

  // 5. update agent.last_run_at / last_result
  await supa.update("compass_agents", `name=eq.${encodeURIComponent(name)}`, {
    last_run_at: ended.toISOString(),
    last_result: result.status === "running" ? "ok" : result.status,
  });

  return ok({ run_id: runId, status: result.status, duration_ms: durationMs, summary: result.summary });
};
