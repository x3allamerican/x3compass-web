/**
 * POST /api/vendors/samsara/sync — pulls /fleet/vehicles from Samsara and
 * upserts to compass_vehicles. Gated by SAMSARA_API_TOKEN env var.
 */

import { mapSamsara, upsertVehicles, markVendorSync } from "../../../_shared/vendor-mapper";
import { rateLimit } from "../../../_shared/rate-limit";

interface Env {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE?: string;
  SAMSARA_API_TOKEN?: string;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const _rl = rateLimit(ctx.request, { key: "samsara-sync", max: 10, windowSec: 60 });
  if (_rl) return _rl;

  let body: { carrier_id?: string };
  try { body = await ctx.request.json(); } catch { return json({ ok: false, error: "Invalid JSON" }, 400); }
  if (!body.carrier_id) return json({ ok: false, error: "Missing carrier_id" }, 400);

  if (!ctx.env.SAMSARA_API_TOKEN) {
    return json({
      ok: false,
      configured: false,
      vendor: "samsara",
      error: "Samsara not configured. Set SAMSARA_API_TOKEN on Cloudflare Pages and redeploy.",
      help_url: "https://developers.samsara.com/reference/listvehicles",
    }, 503);
  }

  try {
    const r = await fetch("https://api.samsara.com/fleet/vehicles?limit=512", {
      headers: { Authorization: `Bearer ${ctx.env.SAMSARA_API_TOKEN}`, Accept: "application/json" },
    });
    if (!r.ok) {
      const text = (await r.text()).slice(0, 500);
      await markVendorSync(ctx.env, body.carrier_id, "samsara", { success: false, count: 0, error: `Samsara ${r.status}: ${text}` });
      return json({ ok: false, vendor: "samsara", error: `Samsara API ${r.status}`, detail: text }, 502);
    }
    const payload = (await r.json()) as { data?: unknown[] };
    const vehicles = Array.isArray(payload.data) ? payload.data : [];
    const normalized = mapSamsara(vehicles as Parameters<typeof mapSamsara>[0]);
    const upsert = await upsertVehicles(ctx.env, body.carrier_id, normalized);
    const success = upsert.errors.length === 0;
    await markVendorSync(ctx.env, body.carrier_id, "samsara", {
      success,
      count: upsert.inserted + upsert.updated,
      error: success ? undefined : upsert.errors.slice(0, 3).map(e => e.reason).join("; "),
    });
    return json({ ok: success, vendor: "samsara", fetched: normalized.length, inserted: upsert.inserted, updated: upsert.updated, skipped: upsert.skipped, errors: upsert.errors });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await markVendorSync(ctx.env, body.carrier_id, "samsara", { success: false, count: 0, error: msg });
    return json({ ok: false, vendor: "samsara", error: msg }, 500);
  }
};
