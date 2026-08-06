/**
 * GET /api/agents/heartbeat  (public health signal)
 * Reports minutes since the last agent run. Returns 503 when the fleet has been
 * silent > 30 min, so the Hospital (or any uptime monitor) catches a dead dispatcher.
 */
import { supaFetch } from "../../_shared/supabase-admin";

export const onRequestGet: PagesFunction = async (ctx) => {
  try {
    const supa = supaFetch(ctx.env as unknown as Parameters<typeof supaFetch>[0]);
    const rows = (await supa.select("compass_agent_runs", "select=started_at&order=started_at.desc&limit=1")) as Array<{ started_at: string }>;
    const last = rows[0]?.started_at ?? null;
    const minutesAgo = last ? Math.round((Date.now() - new Date(last).getTime()) / 60000) : 999999;
    const stale = minutesAgo > 30;
    return new Response(JSON.stringify({ ok: !stale, last_run_at: last, minutes_ago: minutesAgo, stale }), {
      status: stale ? 503 : 200,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
  }
};
