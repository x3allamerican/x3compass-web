/**
 * POST /api/admin/dispatch  (internal-only, called by GitHub Actions cron every minute)
 *
 * Selects every scheduled+enabled agent whose next_run_at has passed and fires it.
 * Each fire is just a HTTP call to /api/admin/agents/[name]/run with the same
 * X-X3-Internal-Secret header. Cron schedules per-agent are seeded from the
 * cron_expr column on compass_agents and updated after each successful run.
 *
 * This pattern lets us use a SINGLE GitHub Actions workflow instead of 19
 * separate workflows, and keeps all agent timing logic in one Pages Function.
 *
 * Required: X-X3-Internal-Secret header matching env.X3_INTERNAL_SECRET.
 */
import { requireSuperAdmin, unauthorized, ok, serverError, type AdminEnv } from "../../_shared/admin-auth";
import { supaFetch } from "../../_shared/supabase-admin";
import { computeNextRun } from "../../_shared/cron";
import { rateLimit } from "../../_shared/rate-limit";

export const onRequestPost: PagesFunction<AdminEnv> = async (ctx) => {
  const _rl = rateLimit(ctx.request, { key: "admin-dispatch", max: 10, windowSec: 60 });
  if (_rl) return _rl;

  const who = await requireSuperAdmin(ctx);
  if (!who || who.type !== "internal") return unauthorized();

  try {
    const supa = supaFetch(ctx.env);
    // pick all scheduled+enabled agents whose next_run_at has passed (or is null = never scheduled yet)
    const due = await supa.select(
      "compass_agents",
      `select=name,cron_expr,next_run_at&kind=eq.scheduled&enabled=eq.true&or=(next_run_at.is.null,next_run_at.lte.${encodeURIComponent(new Date().toISOString())})`,
    ) as Array<{ name: string; cron_expr: string | null; next_run_at: string | null }>;

    const origin = new URL(ctx.request.url).origin;
    const fired: Array<{ agent: string; status: number }> = [];

    for (const a of due) {
      try {
        const r = await fetch(`${origin}/api/admin/agents/${encodeURIComponent(a.name)}/run`, {
          method: "POST",
          headers: { "X-X3-Internal-Secret": ctx.env.X3_INTERNAL_SECRET || "", "Content-Type": "application/json" },
        });
        fired.push({ agent: a.name, status: r.status });
      } catch (e) {
        fired.push({ agent: a.name, status: 0 });
      }
      // schedule the next run no matter what — cron_expr is the source of truth
      if (a.cron_expr) {
        const next = computeNextRun(a.cron_expr);
        if (next) await supa.update("compass_agents", `name=eq.${encodeURIComponent(a.name)}`, { next_run_at: next.toISOString() });
      }
    }

    return ok({ fired, checked: due.length, at: new Date().toISOString() });
  } catch (e) {
    return serverError(e instanceof Error ? e.message : String(e));
  }
};
