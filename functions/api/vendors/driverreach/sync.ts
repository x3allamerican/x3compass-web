/** POST /api/vendors/driverreach/sync — pull DriverReach candidates into compass_drivers. Body: { carrier_id }. */
import { correlationId, requireTenant, securityError, type SecurityEnv } from "../../../_shared/request-security";
import { mapDriverReach, upsertDrivers, markVendorSync } from "../../../_shared/vendor-mapper";
interface Env extends SecurityEnv { DRIVERREACH_API_KEY?: string; DRIVERREACH_API_BASE?: string; }
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  let body: { carrier_id?: string }; try { body = await ctx.request.json(); } catch { return json({ ok: false, error: "Invalid JSON" }, 400); }
  const requestId = correlationId(ctx.request);
  let authority; try { authority = await requireTenant(ctx.request, ctx.env, body.carrier_id); } catch { return securityError(503, "authorization_unavailable", requestId); }
  if (!authority.ok) return securityError(authority.status, authority.code, requestId);
  if (!ctx.env.SUPABASE_URL || !ctx.env.SUPABASE_SERVICE_ROLE) return json({ ok: false, error: "Server missing Supabase env" }, 500);
  if (!ctx.env.DRIVERREACH_API_KEY) return json({ ok: false, configured: false, vendor: "driverreach", error: "DriverReach not configured. Set DRIVERREACH_API_KEY on Cloudflare Pages and redeploy.", help_url: "https://driverreach.com/api" }, 503);
  const base = (ctx.env.DRIVERREACH_API_BASE || "https://api.driverreach.com").replace(/\/$/, "");
  try {
    const r = await fetch(`${base}/v1/candidates?status=hired&limit=500`, { headers: { Authorization: `Bearer ${ctx.env.DRIVERREACH_API_KEY}`, Accept: "application/json" } });
    if (!r.ok) { await markVendorSync(ctx.env, authority.carrierId, "driverreach", { success: false, count: 0, error: `DriverReach ${r.status}: ${(await r.text()).slice(0, 200)}` }); return securityError(502, "upstream_failed", requestId); }
    const payload = await r.json() as { candidates?: unknown[]; data?: unknown[] };
    const candidates = (payload.candidates || payload.data || []) as unknown[];
    const normalized = mapDriverReach(candidates as Parameters<typeof mapDriverReach>[0]);
    const up = await upsertDrivers(ctx.env, authority.carrierId, normalized);
    const success = up.errors.length === 0;
    await markVendorSync(ctx.env, authority.carrierId, "driverreach", { success, count: up.inserted + up.updated, error: success ? undefined : up.errors.slice(0, 3).map((e) => e.reason).join("; ") });
    return json({ ok: success, vendor: "driverreach", inserted: up.inserted, updated: up.updated, errors: up.errors.length });
  } catch (e) { await markVendorSync(ctx.env, authority.carrierId, "driverreach", { success: false, count: 0, error: e instanceof Error ? e.message : "sync failed" }); return securityError(502, "upstream_failed", requestId); }
};
