/**
 * GET /api/screenings/continuous-mvr/list
 *
 * Returns the calling carrier's continuous MVR enrollments + 4 KPI rollups.
 * RLS-safe (uses service role only to look up the user's carrier membership;
 * results are filtered by that carrier_id).
 *
 * Response:
 *   {
 *     ok: true,
 *     carrier_id: "...",
 *     enrollments: [{ id, driver_id, driver_name, status, enrolled_at, last_hit_at, last_hit_assessment, hit_count_total, hit_count_30d, monthly_fee_cents, ... }],
 *     kpis: { total_enrolled, active, hits_30d, hits_total }
 *   }
 */

import { bearerFromRequest, verifySupabaseJwt, supaFetch } from "../../../_shared/supabase-admin";
import { rateLimit } from "../../../_shared/rate-limit";

interface Env {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE?: string;
  RATE_LIMIT?: KVNamespace;
}

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });

interface Enrollment {
  id: string;
  driver_id: string | null;
  status: string;
  enrolled_at: string | null;
  canceled_at: string | null;
  failed_reason: string | null;
  last_hit_at: string | null;
  last_hit_assessment: string | null;
  last_hit_report_id: string | null;
  hit_count_total: number;
  hit_count_30d: number;
  monthly_fee_cents: number;
  work_state: string | null;
  checkr_continuous_check_id: string | null;
}

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const token = bearerFromRequest(ctx.request);
  if (!token) return json({ ok: false, error: "Unauthorized" }, 401);
  const user = await verifySupabaseJwt(ctx.env, token);
  if (!user) return json({ ok: false, error: "Invalid token" }, 401);

  const rl = await rateLimit(ctx.env, `cc-list:${user.sub}`, 60, 60);
  if (!rl.ok) return json({ ok: false, error: "Rate limited" }, 429);

  const sb = supaFetch(ctx.env);

  // Find the user's carrier (first one — single-carrier model for now)
  const userCarriers = (await sb.select(
    "compass_user_carriers",
    `select=carrier_id&user_id=eq.${user.sub}&limit=1`
  )) as Array<{ carrier_id: string }>;
  if (userCarriers.length === 0) {
    return json({ ok: false, error: "No carrier membership" }, 403);
  }
  const carrierId = userCarriers[0].carrier_id;

  // Pull enrollments + join driver name in two queries
  const enrollments = (await sb.select(
    "compass_continuous_checks",
    `select=id,driver_id,status,enrolled_at,canceled_at,failed_reason,last_hit_at,last_hit_assessment,last_hit_report_id,hit_count_total,hit_count_30d,monthly_fee_cents,work_state,checkr_continuous_check_id&carrier_id=eq.${carrierId}&order=enrolled_at.desc.nullslast`
  )) as Enrollment[];

  // Resolve driver names
  const driverIds = Array.from(new Set(enrollments.map((e) => e.driver_id).filter((d): d is string => !!d)));
  const driverMap = new Map<string, string>();
  if (driverIds.length > 0) {
    const drivers = (await sb.select(
      "compass_drivers",
      `select=id,first_name,last_name&id=in.(${driverIds.join(",")})`
    )) as Array<{ id: string; first_name: string; last_name: string }>;
    for (const d of drivers) {
      driverMap.set(d.id, `${d.first_name} ${d.last_name}`.trim());
    }
  }

  const enriched = enrollments.map((e) => ({
    ...e,
    driver_name: e.driver_id ? driverMap.get(e.driver_id) || "—" : "—",
  }));

  const kpis = {
    total_enrolled: enrollments.length,
    active: enrollments.filter((e) => e.status === "active").length,
    pending: enrollments.filter((e) => e.status === "pending").length,
    hits_30d: enrollments.reduce((sum, e) => sum + (e.hit_count_30d || 0), 0),
    hits_total: enrollments.reduce((sum, e) => sum + (e.hit_count_total || 0), 0),
  };

  return json({ ok: true, carrier_id: carrierId, enrollments: enriched, kpis });
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization",
    },
  });
