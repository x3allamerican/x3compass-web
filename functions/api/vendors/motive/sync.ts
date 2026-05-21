/**
 * POST /api/vendors/motive/sync — Motive fleet vehicles → compass_vehicles.
 * Gated by MOTIVE_API_KEY.
 */

import { mapMotive, upsertVehicles, markVendorSync } from "../../../_shared/vendor-mapper";
import { rateLimit } from "../../../_shared/rate-limit";

interface Env { SUPABASE_URL?: string; SUPABASE_SERVICE_ROLE?: string; MOTIVE_API_KEY?: string; }

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const _rl = rateLimit(ctx.request, { key: "motive-sync", max: 10, windowSec: 60 });
  if (_rl) return _rl;

  let body: { carrier_id?: string };
  try { body = await ctx.request.json(); } catch { return json({ ok: false, error: "Invalid JSON" }, 400); }
  if (!body.carrier_id) return json({ ok: false, error: "Missing carrier_id" }, 400);
  if (!ctx.env.MOTIVE_API_KEY) {
    return json({ ok: false, configured: false, vendor: "motive", error: "Motive not configured. Set MOTIVE_API_KEY on Cloudflare Pages and redeploy.", help_url: "https://developer.gomotive.com/" }, 503);
  }
  try {
    const r = await fetch("https://api.gomotive.com/v1/vehicles?per_page=100", {
      headers: { "X-Api-Key": ctx.env.MOTIVE_API_KEY, Accept: "application/json" },
    });
    if (!r.ok) {
      const text = (await r.text()).slice(0, 500);
      await markVendorSync(ctx.env, body.carrier_id, "motive", { success: false, count: 0, error: `Motive ${r.status}: ${text}` });
      return json({ ok: false, vendor: "motive", error: `Motive API ${r.status}`, detail: text }, 502);
    }
    const payload = (await r.json()) as { vehicles?: unknown[] };
    const vehicles = Array.isArray(payload.vehicles) ? payload.vehicles : [];
    const normalized = mapMotive(vehicles as Parameters<typeof mapMotive>[0]);
    const upsert = await upsertVehicles(ctx.env, body.carrier_id, normalized);
    const success = upsert.errors.length === 0;
    await markVendorSync(ctx.env, body.carrier_id, "motive", { success, count: upsert.inserted + upsert.updated, error: success ? undefined : upsert.errors.slice(0,3).map(e=>e.reason).join("; ") });
    return json({ ok: success, vendor: "motive", fetched: normalized.length, inserted: upsert.inserted, updated: upsert.updated, skipped: upsert.skipped, errors: upsert.errors });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await markVendorSync(ctx.env, body.carrier_id, "motive", { success: false, count: 0, error: msg });
    return json({ ok: false, vendor: "motive", error: msg }, 500);
  }
};
