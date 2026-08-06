/** POST /api/vendors/hireright/sync — pull HireRight screening results into vendor_orders. Body: { carrier_id }. */
import { correlationId, requireTenant, securityError, type SecurityEnv } from "../../../_shared/request-security";
import { syncScreeningVendor, hireRightConfig, type ScreeningVendorEnv } from "../../../_shared/screening-sync";
type Env = SecurityEnv & ScreeningVendorEnv;
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  let body: { carrier_id?: string }; try { body = await ctx.request.json(); } catch { return json({ ok: false, error: "Invalid JSON" }, 400); }
  const requestId = correlationId(ctx.request);
  let authority; try { authority = await requireTenant(ctx.request, ctx.env, body.carrier_id); } catch { return securityError(503, "authorization_unavailable", requestId); }
  if (!authority.ok) return securityError(authority.status, authority.code, requestId);
  if (!ctx.env.SUPABASE_URL || !ctx.env.SUPABASE_SERVICE_ROLE) return json({ ok: false, error: "Server missing Supabase env" }, 500);
  const cfg = hireRightConfig(ctx.env);
  if (!cfg) return json({ ok: false, configured: false, vendor: "hireright", error: "HireRight not configured. Set HIRERIGHT_API_KEY on Cloudflare Pages and redeploy.", help_url: "https://developer.hireright.com" }, 503);
  const out = await syncScreeningVendor(ctx.env, authority.carrierId, cfg);
  if (!out.ok) return securityError(502, "upstream_failed", requestId);
  return json(out);
};
