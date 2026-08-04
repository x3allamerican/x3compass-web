/**
 * POST /api/vendors/motive/sync — Motive fleet vehicles → compass_vehicles.
 * Gated by MOTIVE_API_KEY.
 */

import { mapMotive, upsertVehicles, markVendorSync } from "../../../_shared/vendor-mapper";
import { correlationId, requireTenant, securityError, type SecurityEnv } from "../../../_shared/request-security";

interface Env extends SecurityEnv { MOTIVE_API_KEY?: string; }

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  let body: { carrier_id?: string };
  try { body = await ctx.request.json(); } catch { return json({ ok: false, error: "Invalid JSON" }, 400); }
  const requestId = correlationId(ctx.request);
  let authority;
  try { authority = await requireTenant(ctx.request, ctx.env, body.carrier_id); }
  catch { return securityError(503, "authorization_unavailable", requestId); }
  if (!authority.ok) return securityError(authority.status, authority.code, requestId);
  const carrierId = authority.carrierId;
  if (!ctx.env.MOTIVE_API_KEY) {
    return json({ ok: false, configured: false, vendor: "motive", error: "Motive not configured. Set MOTIVE_API_KEY on Cloudflare Pages and redeploy.", help_url: "https://developer.gomotive.com/" }, 503);
  }
  try {
    const r = await fetch("https://api.gomotive.com/v1/vehicles?per_page=100", {
      headers: { "X-Api-Key": ctx.env.MOTIVE_API_KEY, Accept: "application/json" },
    });
    if (!r.ok) {
      const text = (await r.text()).slice(0, 500);
      await markVendorSync(ctx.env, carrierId, "motive", { success: false, count: 0, error: `Motive ${r.status}: ${text}` });
      return securityError(502, "upstream_failed", requestId);
    }
    const payload = (await r.json()) as { vehicles?: unknown[] };
    const vehicles = Array.isArray(payload.vehicles) ? payload.vehicles : [];
    const normalized = mapMotive(vehicles as Parameters<typeof mapMotive>[0]);
    const upsert = await upsertVehicles(ctx.env, carrierId, normalized);
    const success = upsert.errors.length === 0;
    await markVendorSync(ctx.env, carrierId, "motive", { success, count: upsert.inserted + upsert.updated, error: success ? undefined : upsert.errors.slice(0,3).map(e=>e.reason).join("; ") });
    return json({ ok: success, vendor: "motive", fetched: normalized.length, inserted: upsert.inserted, updated: upsert.updated, skipped: upsert.skipped, errors: upsert.errors });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await markVendorSync(ctx.env, carrierId, "motive", { success: false, count: 0, error: msg });
    return securityError(500, "request_failed", requestId);
  }
};
