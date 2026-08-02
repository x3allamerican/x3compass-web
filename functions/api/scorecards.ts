/**
 * GET /api/scorecards?carrier_id=<uuid>
 *
 * Per-driver safety scorecard rollup over the last 90 days.
 *
 * Composite score (0-100):
 *   100 base
 *   -20 per preventable accident (capped at 60)
 *   -2 per inspection violation (capped at 30)
 *   -15 if OOS driver event in window
 *   -10 if any HOS violation in window
 *   floor 0
 *
 * Tier: A+ ≥95, A ≥90, B+ ≥85, B ≥80, C+ ≥70, C ≥60, D <60
 */
import { correlationId, requireTenant, securityError, tenantJson, tenantPreflight, type SecurityEnv } from "../_shared/request-security";

type Env = SecurityEnv;

const SUPABASE_HEADERS = (sr: string) => ({
  apikey: sr,
  Authorization: `Bearer ${sr}`,
  Accept: "application/json",
  Prefer: "count=exact",
});

async function pgSelect(url: string, sr: string, table: string, query: string): Promise<unknown[]> {
  try {
    const r = await fetch(`${url}/rest/v1/${table}?${query}`, { headers: SUPABASE_HEADERS(sr) });
    if (!r.ok) return [];
    const rows = await r.json();
    return Array.isArray(rows) ? rows : [];
  } catch { return []; }
}

type Driver = { id: string; first_name: string; last_name: string; status: string };
type Inspection = { driver_id: string | null; violation_count: number | null; oos_driver: boolean | null; inspection_date: string };
type Accident = { driver_id: string | null; preventability: string | null; occurred_at: string };
type HosLog = { driver_id: string | null; status: string | null; log_date: string };

function tierFor(score: number): string {
  if (score >= 95) return "A+";
  if (score >= 90) return "A";
  if (score >= 85) return "B+";
  if (score >= 80) return "B";
  if (score >= 70) return "C+";
  if (score >= 60) return "C";
  return "D";
}

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const url = new URL(ctx.request.url);
  const requestId = correlationId(ctx.request);
  let authority;
  try { authority = await requireTenant(ctx.request, ctx.env, url.searchParams.get("carrier_id")); }
  catch { return securityError(503, "authorization_unavailable", requestId); }
  if (!authority.ok) return securityError(authority.status, authority.code, requestId);
  const carrierId = authority.carrierId;
  if (!ctx.env.SUPABASE_URL || !ctx.env.SUPABASE_SERVICE_ROLE) {
    return securityError(503, "service_unavailable", requestId);
  }

  const sb = ctx.env.SUPABASE_URL.replace(/\/$/, "");
  const sr = ctx.env.SUPABASE_SERVICE_ROLE;
  const cutoff90 = new Date(Date.now() - 90 * 86_400_000).toISOString();
  const cutoff24mo = new Date(Date.now() - 730 * 86_400_000).toISOString();

  const [drivers, inspections, accidents, accidents24mo, hosLogs] = await Promise.all([
    pgSelect(sb, sr, "compass_drivers", `select=id,first_name,last_name,status&carrier_id=eq.${carrierId}&status=eq.active&limit=500`) as Promise<Driver[]>,
    pgSelect(sb, sr, "compass_inspections", `select=driver_id,violation_count,oos_driver,inspection_date&carrier_id=eq.${carrierId}&inspection_date=gte.${cutoff90}`) as Promise<Inspection[]>,
    pgSelect(sb, sr, "compass_accidents", `select=driver_id,preventability,occurred_at&carrier_id=eq.${carrierId}&occurred_at=gte.${cutoff90}`) as Promise<Accident[]>,
    pgSelect(sb, sr, "compass_accidents", `select=driver_id,occurred_at&carrier_id=eq.${carrierId}&occurred_at=gte.${cutoff24mo}`) as Promise<{ driver_id: string | null; occurred_at: string }[]>,
    pgSelect(sb, sr, "compass_hos_logs", `select=driver_id,status,log_date&carrier_id=eq.${carrierId}&log_date=gte.${cutoff90}`) as Promise<HosLog[]>,
  ]);

  // Index by driver_id
  const inspByDriver = new Map<string, Inspection[]>();
  for (const i of inspections) { if (!i.driver_id) continue; (inspByDriver.get(i.driver_id) || inspByDriver.set(i.driver_id, []).get(i.driver_id)!).push(i); }
  const accByDriver = new Map<string, Accident[]>();
  for (const a of accidents) { if (!a.driver_id) continue; (accByDriver.get(a.driver_id) || accByDriver.set(a.driver_id, []).get(a.driver_id)!).push(a); }
  const hosByDriver = new Map<string, HosLog[]>();
  for (const h of hosLogs) { if (!h.driver_id) continue; (hosByDriver.get(h.driver_id) || hosByDriver.set(h.driver_id, []).get(h.driver_id)!).push(h); }
  const driverIds24mo = new Set(accidents24mo.map(a => a.driver_id).filter(Boolean));

  const scorecards = drivers.map(d => {
    const insp = inspByDriver.get(d.id) || [];
    const accs = accByDriver.get(d.id) || [];
    const hos = hosByDriver.get(d.id) || [];
    const violations = insp.reduce((s, i) => s + (i.violation_count || 0), 0);
    const oosD = insp.some(i => i.oos_driver === true);
    const crashes = accs.length;
    const preventable = accs.filter(a => a.preventability === "preventable").length;
    const hosViolations = hos.filter(h => h.status === "violation").length;
    const hosClean = hos.length > 0 ? Math.round(((hos.length - hosViolations) / hos.length) * 100) : 100;
    let score = 100;
    score -= Math.min(60, preventable * 20);
    score -= Math.min(30, violations * 2);
    if (oosD) score -= 15;
    if (hosViolations > 0) score -= 10;
    score = Math.max(0, score);
    return {
      driver_id: d.id,
      name: `${d.first_name || ""} ${d.last_name || ""}`.trim() || "Unnamed",
      tier: tierFor(score),
      score,
      crashes,
      violations,
      hard_brakes: 0, // wired when telematics lands
      hos_clean_pct: hosClean,
    };
  }).sort((a, b) => b.score - a.score);

  const fleetAvg = scorecards.length > 0 ? Math.round(scorecards.reduce((s, x) => s + x.score, 0) / scorecards.length) : 0;
  const aTier = scorecards.filter(s => s.tier === "A+" || s.tier === "A").length;
  const watchlist = scorecards.filter(s => s.tier === "D").length;
  const pctCrash24mo = drivers.length > 0 ? Math.round((driverIds24mo.size / drivers.length) * 1000) / 10 : 0;

  return tenantJson(ctx.request, ctx.env, {
    ok: true,
    demo: scorecards.length === 0,
    fleet: { avg_score: fleetAvg, a_tier_count: aTier, watchlist_count: watchlist, pct_crash_24mo: pctCrash24mo, total_drivers: drivers.length },
    scorecards,
    window_days: 90,
  });
};

export const onRequestOptions: PagesFunction<Env> = async (ctx) =>
  tenantPreflight(ctx.request, ctx.env, "GET, OPTIONS");
