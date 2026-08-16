/**
 * GET /api/health
 *
 * Health check endpoint that verifies all critical dependencies are reachable.
 * Returns 200 whenever the Worker is alive. Dependency state is reported in
 * the redacted JSON status so uptime monitors do not turn an upstream outage
 * into a false origin outage; dependency-specific alerts remain actionable.
 *
 * Use this for:
 *  - Uptime monitoring (UptimeRobot, BetterUptime, Cloudflare Healthchecks)
 *  - Post-deploy smoke tests
 *  - Status page integration
 */

interface Env {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE?: string;
  STRIPE_SECRET_KEY?: string;
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" },
  });

async function pingSupabase(env: Env): Promise<{ ok: boolean; ms: number; err?: string }> {
  if (!env.SUPABASE_URL) return { ok: false, ms: 0, err: "SUPABASE_URL not set" };
  const t0 = Date.now();
  try {
    const r = await fetch(`${env.SUPABASE_URL}/rest/v1/compass_carriers?limit=0&select=id`, {
      headers: { apikey: env.SUPABASE_SERVICE_ROLE || "", Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE || ""}` },
      signal: AbortSignal.timeout(5000),
    });
    return { ok: r.ok, ms: Date.now() - t0, err: r.ok ? undefined : `HTTP ${r.status}` };
  } catch (err) { return { ok: false, ms: Date.now() - t0, err: String(err) }; }
}

async function pingStripe(env: Env): Promise<{ ok: boolean; ms: number; err?: string }> {
  if (!env.STRIPE_SECRET_KEY) return { ok: false, ms: 0, err: "STRIPE_SECRET_KEY not set" };
  const t0 = Date.now();
  try {
    // Restricted read-only keys may not access /v1/account. Products are
    // readable with the same least-privilege key and still prove Stripe is
    // reachable and authenticated.
    const r = await fetch("https://api.stripe.com/v1/products?limit=1", {
      headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` },
      signal: AbortSignal.timeout(5000),
    });
    return { ok: r.ok, ms: Date.now() - t0, err: r.ok ? undefined : `HTTP ${r.status}` };
  } catch (err) { return { ok: false, ms: Date.now() - t0, err: String(err) }; }
}

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const [supa, stripe] = await Promise.all([pingSupabase(ctx.env), pingStripe(ctx.env)]);
  const all_ok = supa.ok && stripe.ok;
  const response: Record<string, unknown> = {
    ok: all_ok,
    status: all_ok ? "operational" : "degraded",
    checked_at: new Date().toISOString(),
  };
  if (ctx.request && new URL(ctx.request.url).searchParams.get("detail") === "1") {
    response.services = { supabase: supa, stripe };
  }
  return json(response, 200);
};
