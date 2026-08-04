import { buildAccidentRegister } from "../../src/lib/accidentRegister.mjs";
import { supaFetch } from "../_shared/supabase-admin";
import {
  correlationId, requireTenant, securityError, tenantJson, tenantPreflight, type SecurityEnv,
} from "../_shared/request-security";

type Env = SecurityEnv;

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const requestId = correlationId(ctx.request);
  let authority;
  try { authority = await requireTenant(ctx.request, ctx.env); }
  catch { return securityError(503, "authorization_unavailable", requestId); }
  if (!authority.ok) return securityError(authority.status, authority.code, requestId);
  if (!ctx.env.SUPABASE_URL || !ctx.env.SUPABASE_SERVICE_ROLE) return securityError(503, "service_unavailable", requestId);

  const carrierId = authority.carrierId;
  const supa = supaFetch(ctx.env);
  try {
    const [accidents, drivers] = await Promise.all([
      supa.select("compass_accidents", `select=id,accident_date,city,state,driver_id,fatalities,injuries,hazmat_released&carrier_id=eq.${carrierId}&order=accident_date.desc&limit=5000`),
      supa.select("compass_drivers", `select=id,first_name,last_name&carrier_id=eq.${carrierId}&limit=5000`),
    ]);
    const register = buildAccidentRegister({ asOf: new Date().toISOString().slice(0, 10), accidents, drivers });
    return tenantJson(ctx.request, ctx.env, { ok: true, ...register });
  } catch {
    return securityError(503, "register_unavailable", requestId);
  }
};

export const onRequestOptions: PagesFunction<Env> = async (ctx) => tenantPreflight(ctx.request, ctx.env, "GET, OPTIONS");
