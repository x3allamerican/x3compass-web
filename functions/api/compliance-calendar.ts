/**
 * GET /api/compliance-calendar
 *
 * Returns tenant-scoped source evidence for the client-side compliance calendar
 * engine. It intentionally returns no inferred compliance determination.
 */
import {
  correlationId,
  requireTenant,
  securityError,
  tenantJson,
  tenantPreflight,
  type SecurityEnv,
} from "../_shared/request-security";

type Env = SecurityEnv;

const headers = (serviceRole: string) => ({
  apikey: serviceRole,
  Authorization: `Bearer ${serviceRole}`,
  Accept: "application/json",
});

async function selectRows(base: string, serviceRole: string, table: string, query: string): Promise<unknown[]> {
  const response = await fetch(`${base}/rest/v1/${table}?${query}`, { headers: headers(serviceRole) });
  if (!response.ok) throw new Error(`evidence query unavailable: ${table}`);
  const body = await response.json();
  return Array.isArray(body) ? body : [];
}

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const requestId = correlationId(ctx.request);
  let authority;
  try { authority = await requireTenant(ctx.request, ctx.env); }
  catch { return securityError(503, "authorization_unavailable", requestId); }
  if (!authority.ok) return securityError(authority.status, authority.code, requestId);

  if (!ctx.env.SUPABASE_URL || !ctx.env.SUPABASE_SERVICE_ROLE) {
    return securityError(503, "service_unavailable", requestId);
  }

  const base = ctx.env.SUPABASE_URL.replace(/\/$/, "");
  const role = ctx.env.SUPABASE_SERVICE_ROLE;
  const carrierId = authority.carrierId;
  const carrierFilter = encodeURIComponent(carrierId);

  try {
    const [carrierRows, drivers, mvrRecords, daTests, vehicles, iftaReturns, saferRows] = await Promise.all([
      selectRows(base, role, "compass_carriers", `select=id,name,usdot_number&id=eq.${carrierFilter}&limit=1`),
      selectRows(base, role, "compass_drivers", `select=id,first_name,last_name,status,medical_card_expires_on&carrier_id=eq.${carrierFilter}&limit=1000`),
      selectRows(base, role, "compass_mvr_records", `select=id,driver_id,pulled_on&carrier_id=eq.${carrierFilter}&order=pulled_on.desc&limit=5000`),
      selectRows(base, role, "compass_da_tests", `select=id,driver_id,test_date,test_type,result&carrier_id=eq.${carrierFilter}&order=test_date.desc&limit=5000`),
      selectRows(base, role, "compass_vehicles", `select=id,vin,license_plate,status,next_dot_inspection_due&carrier_id=eq.${carrierFilter}&limit=2500`),
      selectRows(base, role, "compass_ifta_returns", `select=id,quarter,due_date,filed_date,status&carrier_id=eq.${carrierFilter}&order=due_date.desc&limit=40`),
      selectRows(base, role, "compass_carrier_safer", `select=last_mcs150_filed&carrier_id=eq.${carrierFilter}&limit=1`),
    ]);

    return tenantJson(ctx.request, ctx.env, {
      ok: true,
      evidence: {
        carrier: carrierRows[0] || { id: carrierId, name: null, usdot_number: null },
        drivers,
        mvrRecords,
        daTests,
        vehicles,
        iftaReturns,
        safer: saferRows[0] || null,
      },
    });
  } catch {
    return securityError(503, "evidence_unavailable", requestId);
  }
};

export const onRequestOptions: PagesFunction<Env> = async (ctx) =>
  tenantPreflight(ctx.request, ctx.env, "GET, OPTIONS");
