import { correlationId, requireTenant, securityError, tenantJson, tenantPreflight, type SecurityEnv } from "../../_shared/request-security";
import { supaFetch } from "../../_shared/supabase-admin";

export const onRequestGet: PagesFunction<SecurityEnv> = async (ctx) => {
  const requestId = correlationId(ctx.request);
  let authority;
  try { authority = await requireTenant(ctx.request, ctx.env, null); }
  catch { return securityError(503, "authorization_unavailable", requestId); }
  if (!authority.ok) return securityError(authority.status, authority.code, requestId);

  const snapshots = await supaFetch(ctx.env).select(
    "compass_csa_snapshots",
    `carrier_id=eq.${authority.carrierId}&select=taken_at,unsafe_driving,crash_indicator,hos_compliance,vehicle_maint,hazmat,driver_fitness,ctrl_substances,source&order=taken_at.desc&limit=24`,
  );
  return tenantJson(ctx.request, ctx.env, { ok: true, snapshots });
};

export const onRequestOptions: PagesFunction<SecurityEnv> = async (ctx) => tenantPreflight(ctx.request, ctx.env, "GET, OPTIONS");
