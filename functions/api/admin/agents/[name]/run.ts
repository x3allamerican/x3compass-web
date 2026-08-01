/**
 * POST /api/admin/agents/[name]/run
 *
 * Manually fire an agent — either super-admin Bearer or the internal cron secret
 * (X-X3-Internal-Secret used by /api/admin/dispatch).
 *
 * Body (optional): { inputs?: object } for on-demand agents.
 *
 * Persists a row in compass_agent_runs with status, summary, log, duration,
 * triggered_by. Returns the run record.
 */
import { requireSuperAdmin, unauthorized, ok, badRequest, serverError, type AdminEnv } from "../../../../_shared/admin-auth";
import { supaFetch } from "../../../../_shared/supabase-admin";
import { runAgent } from "../../../../_shared/agent-registry";

interface Env extends AdminEnv {
  X3_INTERNAL_SECRET?: string;
}

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  // rate-limit intentionally skipped — agents are fired by the trusted Compass
  // cron Worker (with X3_INTERNAL_SECRET) or by super-admins via UI. Callers
  // outside those two paths get unauthorized() below.

  const name = (ctx.params as { name: string }).name;
  if (!name) return badRequest("missing agent name");

  // Allow EITHER super-admin Bearer OR the internal cron secret
  let triggered_by = "manual";
  const internalSecret = ctx.request.headers.get("X-X3-Internal-Secret");
  if (internalSecret && ctx.env.X3_INTERNAL_SECRET && internalSecret === ctx.env.X3_INTERNAL_SECRET) {
    triggered_by = "cron";
  } else {
    const gate = await requireSuperAdmin(ctx);
    if (!gate.ok) return unauthorized(gate.reason);
    triggered_by = gate.user.email || gate.user.sub || "manual";
  }

  let body: { inputs?: Record<string, unknown> } = {};
  try { body = await ctx.request.json(); } catch { /* no body is fine */ }

  const supa = supaFetch(ctx.env);

  // Pre-flight: confirm the agent exists + is enabled
  const rows = (await supa.select("compass_agents", `select=name,enabled&name=eq.${encodeURIComponent(name)}&limit=1`)) as Array<{ name: string; enabled: boolean }>;
  if (rows.length === 0) return badRequest(`agent '${name}' not in registry`);
  if (!rows[0].enabled) return badRequest(`agent '${name}' is disabled — toggle it on first`);

  const started = Date.now();
  const started_at = new Date().toISOString();

  // Insert a "running" placeholder so the UI can show in-progress state.
  // supa.insert returns Row[] (PostgREST always returns an array); take [0].
  const insertedRows = await supa.insert("compass_agent_runs", {
    agent_name: name,
    status: "running",
    started_at,
    triggered_by,
  });
  const placeholderId = (insertedRows[0] as { id: string }).id;

  try {
    const result = await runAgent(name, ctx.env as Env, body.inputs);
    const finished_at = new Date().toISOString();
    const duration_ms = Date.now() - started;

    await supa.update("compass_agent_runs", `id=eq.${placeholderId}`, {
      status: result.status,
      finished_at,
      duration_ms,
      summary: result.summary,
      log: result.log || null,
    });

    // Also update last_run_at on the agent row so the dashboard "Last run" is fresh
    await supa.update("compass_agents", `name=eq.${encodeURIComponent(name)}`, {
      last_run_at: finished_at,
      updated_at: finished_at,
    });

    return ok({ ok: true, run_id: placeholderId, status: result.status, duration_ms, summary: result.summary });
  } catch (e) {
    const finished_at = new Date().toISOString();
    const duration_ms = Date.now() - started;
    const msg = e instanceof Error ? e.message : String(e);
    await supa.update("compass_agent_runs", `id=eq.${placeholderId}`, {
      status: "error",
      finished_at,
      duration_ms,
      error: msg,
    });
    return serverError(msg);
  }
};
