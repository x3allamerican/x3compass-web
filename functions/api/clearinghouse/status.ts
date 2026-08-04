import { buildClearinghouseStatus } from "../../../src/lib/clearinghouseStatus.mjs";
import { correlationId, isUuid, requireTenant, securityError, tenantJson, tenantPreflight, type SecurityEnv } from "../../_shared/request-security";
import { supaFetch } from "../../_shared/supabase-admin";

type Env = SecurityEnv;
type Row = Record<string, unknown>;
const QUERY_TYPES = new Set(["annual_limited", "pre_employment_full", "triggered_full"]);
const RESULTS = new Set(["pending", "no_information", "information", "error"]);
const COMPLETE = new Set(["no_information", "information"]);
const timestamp = (value: unknown) => typeof value === "string" && !Number.isNaN(new Date(value).valueOf());

async function tenant(ctx: EventContext<Env, string, unknown>, requestId: string) {
  try { return await requireTenant(ctx.request, ctx.env); }
  catch { return { ok: false as const, status: 503, code: "authorization_unavailable" }; }
}

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const requestId = correlationId(ctx.request);
  const authority = await tenant(ctx, requestId);
  if (!authority.ok) return securityError(authority.status, authority.code, requestId);
  if (!ctx.env.SUPABASE_URL || !ctx.env.SUPABASE_SERVICE_ROLE) return securityError(503, "service_unavailable", requestId);
  const carrierId = authority.carrierId;
  try {
    const supa = supaFetch(ctx.env);
    const [drivers, queries, consents, violations] = await Promise.all([
      supa.select("compass_drivers", `select=id,first_name,last_name,status,hire_date&carrier_id=eq.${carrierId}&status=in.(active,pending_hire)&order=last_name.asc&limit=5000`),
      supa.select("compass_clearinghouse_queries", `select=id,driver_id,query_type,requested_at,query_run_at,result,consent_received_at,fmcsa_query_id&carrier_id=eq.${carrierId}&order=query_run_at.desc.nullslast&limit=10000`),
      supa.select("compass_clearinghouse_consents", `select=id,driver_id,consent_type,consent_requested_at,consent_received_at,consent_expires_on,consent_revoked_at&carrier_id=eq.${carrierId}&order=consent_requested_at.desc&limit=10000`),
      supa.select("compass_clearinghouse_violations", `select=id,driver_id,violation_type,violation_date,prohibited_status_active,sap_evaluation_complete,return_to_duty_complete&carrier_id=eq.${carrierId}&limit=10000`),
    ]);
    const status = buildClearinghouseStatus({
      asOf: new Date().toISOString().slice(0, 10),
      drivers: drivers as Row[], queries: queries as Row[], consents: consents as Row[], violations: violations as Row[],
    });
    return tenantJson(ctx.request, ctx.env, { ok: true, ...status });
  } catch { return securityError(503, "clearinghouse_unavailable", requestId); }
};

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const requestId = correlationId(ctx.request);
  const authority = await tenant(ctx, requestId);
  if (!authority.ok) return securityError(authority.status, authority.code, requestId);
  if (!ctx.env.SUPABASE_URL || !ctx.env.SUPABASE_SERVICE_ROLE) return securityError(503, "service_unavailable", requestId);
  let body: Row;
  try { body = await ctx.request.json(); } catch { return securityError(400, "invalid_json", requestId); }
  const driverId = typeof body.driver_id === "string" ? body.driver_id : "";
  const queryType = String(body.query_type || "");
  const result = String(body.result || "");
  const runAt = body.query_run_at == null || body.query_run_at === "" ? null : body.query_run_at;
  const consentAt = body.consent_received_at == null || body.consent_received_at === "" ? null : body.consent_received_at;
  const queryId = body.fmcsa_query_id == null || body.fmcsa_query_id === "" ? null : String(body.fmcsa_query_id).trim();
  if (!isUuid(driverId) || !QUERY_TYPES.has(queryType) || !RESULTS.has(result) || !timestamp(body.requested_at) || (runAt !== null && !timestamp(runAt)) || (consentAt !== null && !timestamp(consentAt)) || (COMPLETE.has(result) && runAt === null) || (queryId !== null && (!queryId || queryId.length > 160))) {
    return securityError(400, "invalid_query_record", requestId);
  }
  const carrierId = authority.carrierId;
  try {
    const supa = supaFetch(ctx.env);
    const driver = await supa.select("compass_drivers", `select=id&id=eq.${driverId}&carrier_id=eq.${carrierId}&limit=1`);
    if (!driver[0]) return securityError(404, "resource_not_found", requestId);
    const inserted = await supa.insert("compass_clearinghouse_queries", {
      carrier_id: carrierId,
      driver_id: driverId,
      query_type: queryType,
      requested_at: body.requested_at,
      query_run_at: runAt,
      result,
      consent_received_at: consentAt,
      fmcsa_query_id: queryId,
      recorded_by: authority.userId,
    }) as Row[];
    return tenantJson(ctx.request, ctx.env, { ok: true, query: inserted[0] }, 201);
  } catch { return securityError(503, "clearinghouse_unavailable", requestId); }
};

export const onRequestOptions: PagesFunction<Env> = async (ctx) => tenantPreflight(ctx.request, ctx.env, "GET, POST, OPTIONS");
