/**
 * POST /api/vendors/samsara/sync — pulls /fleet/vehicles from Samsara and
 * upserts to compass_vehicles. Gated by SAMSARA_API_TOKEN env var.
 */

import { mapSamsara, upsertVehicles, markVendorSync } from "../../../_shared/vendor-mapper";
import { correlationId, requireTenant, securityError, type SecurityEnv } from "../../../_shared/request-security";

interface Env extends SecurityEnv {
  SAMSARA_API_TOKEN?: string;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  let body: { carrier_id?: string };
  try { body = await ctx.request.json(); } catch { return json({ ok: false, error: "Invalid JSON" }, 400); }
  const requestId = correlationId(ctx.request);
  let authority;
  try { authority = await requireTenant(ctx.request, ctx.env, body.carrier_id); }
  catch { return securityError(503, "authorization_unavailable", requestId); }
  if (!authority.ok) return securityError(authority.status, authority.code, requestId);
  const carrierId = authority.carrierId;

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
      await markVendorSync(ctx.env, carrierId, "samsara", { success: false, count: 0, error: `Samsara ${r.status}: ${text}` });
      return securityError(502, "upstream_failed", requestId);
    }
    const payload = (await r.json()) as { data?: unknown[] };
    const vehicles = Array.isArray(payload.data) ? payload.data : [];
    const normalized = mapSamsara(vehicles as Parameters<typeof mapSamsara>[0]);
    const upsert = await upsertVehicles(ctx.env, carrierId, normalized);
    const success = upsert.errors.length === 0;
    await markVendorSync(ctx.env, carrierId, "samsara", {
      success,
      count: upsert.inserted + upsert.updated,
      error: success ? undefined : upsert.errors.slice(0, 3).map(e => e.reason).join("; "),
    });
    return json({ ok: success, vendor: "samsara", fetched: normalized.length, inserted: upsert.inserted, updated: upsert.updated, skipped: upsert.skipped, errors: upsert.errors });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await markVendorSync(ctx.env, carrierId, "samsara", { success: false, count: 0, error: msg });
    return securityError(500, "request_failed", requestId);
  }
};
