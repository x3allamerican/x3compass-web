/** POST /api/vendors/verizon/sync — pull Verizon Connect HOS daily-logs into compass_hos_logs (§395.3-scored). Body: { carrier_id }. */
import { correlationId, requireTenant, securityError, type SecurityEnv } from "../../../_shared/request-security";
import { syncEldVendor, verizonConfig, type EldVendorEnv } from "../../../_shared/eld-hos-sync";
type Env = SecurityEnv & EldVendorEnv;
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  let body: { carrier_id?: string }; try { body = await ctx.request.json(); } catch { return json({ ok: false, error: "Invalid JSON" }, 400); }
  const requestId = correlationId(ctx.request);
  let authority; try { authority = await requireTenant(ctx.request, ctx.env, body.carrier_id); } catch { return securityError(503, "authorization_unavailable", requestId); }
  if (!authority.ok) return securityError(authority.status, authority.code, requestId);
  if (!ctx.env.SUPABASE_URL || !ctx.env.SUPABASE_SERVICE_ROLE) return json({ ok: false, error: "Server missing Supabase env" }, 500);
  const cfg = verizonConfig(ctx.env);
  if (!cfg) return json({ ok: false, configured: false, vendor: "verizon_connect", error: "Verizon Connect not configured. Set VERIZON_CONNECT_API_KEY on Cloudflare Pages and redeploy.", help_url: "https://www.verizonconnect.com/integrations/" }, 503);
  const out = await syncEldVendor(ctx.env, authority.carrierId, cfg);
  if (!out.ok) return securityError(502, "upstream_failed", requestId);
  return json(out);
};
