/**
 * POST /api/screenings/continuous-mvr/enroll
 *
 * Enroll a candidate in Checkr Continuous Checks (type: "mvr").
 * Per Checkr support (May 19, 2026): the API endpoint is
 *   POST /v1/continuous_checks   { candidate_id, type: "mvr" }
 *
 * Per Checkr policy doc (May 19, 2026):
 *  - Continuous MVR must be ENABLED ON THE ACCOUNT before any enrollment
 *    will succeed (see "Enable continuous MVR for your account" section
 *    of Checkr's help center). Joshua has submitted that request; this
 *    endpoint will start returning 200s once the request is approved.
 *  - A baseline MVR (vendor_orders row, result=clear) must exist for the
 *    driver before enrollment.
 *  - US-only (work_location.country = "US").
 *
 * Body:
 *   {
 *     "driver_id": "uuid",
 *     "carrier_id": "uuid"  (optional, derived from JWT if omitted)
 *   }
 *
 * Returns:
 *   { ok: true, continuous_check_id: "uuid", checkr_continuous_check_id: "..." }
 *   { ok: false, error: "...", code: "NEEDS_BASELINE" | "ACCOUNT_NOT_APPROVED" | ... }
 *
 * Required Pages env vars:
 *  - SUPABASE_URL, SUPABASE_SERVICE_ROLE
 *  - CHECKR_STAGING_API_KEY | CHECKR_LIVE_API_KEY (based on CHECKR_ENV)
 */

import { bearerFromRequest, verifySupabaseJwt, supaFetch } from "../../../_shared/supabase-admin";
import { rateLimit } from "../../../_shared/rate-limit";

interface Env {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE?: string;
  CHECKR_ENV?: "staging" | "live";
  CHECKR_STAGING_API_KEY?: string;
  CHECKR_LIVE_API_KEY?: string;
  CHECKR_API_BASE?: string;
  RATE_LIMIT?: KVNamespace;
}

interface EnrollBody {
  driver_id?: string;
  carrier_id?: string;
}

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  // === Auth: Supabase user JWT required ===
  const token = bearerFromRequest(ctx.request);
  if (!token) return json({ ok: false, error: "Unauthorized" }, 401);
  const user = await verifySupabaseJwt(ctx.env, token);
  if (!user) return json({ ok: false, error: "Invalid token" }, 401);

  // === Rate limit: 10 enrollments per minute per user ===
  const rl = await rateLimit(ctx.env, `cc-enroll:${user.sub}`, 10, 60);
  if (!rl.ok) return json({ ok: false, error: "Rate limited", retry_after: rl.retryAfter }, 429);

  // === Parse body ===
  let body: EnrollBody;
  try {
    body = (await ctx.request.json()) as EnrollBody;
  } catch {
    return json({ ok: false, error: "Invalid JSON" }, 400);
  }

  if (!body.driver_id) return json({ ok: false, error: "driver_id required" }, 400);

  // === Derive carrier_id (from JWT membership if not provided) ===
  const sb = supaFetch(ctx.env);
  let carrierId = body.carrier_id;
  if (!carrierId) {
    const userCarriers = (await sb.select(
      "compass_user_carriers",
      `select=carrier_id&user_id=eq.${user.sub}&limit=1`
    )) as Array<{ carrier_id: string }>;
    if (userCarriers.length === 0) {
      return json({ ok: false, error: "No carrier membership for user" }, 403);
    }
    carrierId = userCarriers[0].carrier_id;
  } else {
    // Verify user belongs to this carrier
    const membership = (await sb.select(
      "compass_user_carriers",
      `select=user_id&user_id=eq.${user.sub}&carrier_id=eq.${carrierId}&limit=1`
    )) as Array<{ user_id: string }>;
    if (membership.length === 0) {
      return json({ ok: false, error: "Not authorized for this carrier" }, 403);
    }
  }

  // === Look up driver + verify baseline MVR exists ===
  const drivers = (await sb.select(
    "compass_drivers",
    `select=id,first_name,last_name,email,work_state&id=eq.${body.driver_id}&carrier_id=eq.${carrierId}&limit=1`
  )) as Array<{ id: string; first_name: string; last_name: string; email: string; work_state: string | null }>;
  if (drivers.length === 0) {
    return json({ ok: false, error: "Driver not found or not in your carrier" }, 404);
  }
  const driver = drivers[0];

  // Find baseline MVR — a completed Checkr vendor_orders row with clear result for THIS driver
  const baselines = (await sb.select(
    "vendor_orders",
    `select=id,checkr_candidate_id,checkr_result,checkr_assessment,status,package&driver_id=eq.${driver.id}&vendor=eq.checkr&status=eq.completed&order=last_event_at.desc&limit=5`
  )) as Array<{ id: string; checkr_candidate_id: string | null; checkr_result: string | null; checkr_assessment: string | null; status: string; package: string | null }>;

  const baseline = baselines.find(
    (b) => b.checkr_candidate_id && (b.checkr_result === "clear" || b.checkr_assessment === "eligible")
  );
  if (!baseline) {
    return json(
      {
        ok: false,
        code: "NEEDS_BASELINE",
        error:
          "Driver needs a completed baseline MVR (status=completed, result=clear or assessment=eligible) before continuous monitoring can be enrolled.",
      },
      400
    );
  }

  const candidateId = baseline.checkr_candidate_id!;

  // === Idempotency: don't double-enroll ===
  const existing = (await sb.select(
    "compass_continuous_checks",
    `select=id,status,checkr_continuous_check_id&carrier_id=eq.${carrierId}&driver_id=eq.${driver.id}&type=eq.mvr&status=in.(pending,active)&limit=1`
  )) as Array<{ id: string; status: string; checkr_continuous_check_id: string | null }>;
  if (existing.length > 0) {
    return json({
      ok: true,
      already_enrolled: true,
      continuous_check_id: existing[0].id,
      checkr_continuous_check_id: existing[0].checkr_continuous_check_id,
      status: existing[0].status,
    });
  }

  // === Pre-insert: create pending row so webhooks can attach if Checkr returns async ===
  const inserted = (await sb.insert("compass_continuous_checks", {
    carrier_id: carrierId,
    driver_id: driver.id,
    vendor: "checkr",
    type: "mvr",
    checkr_candidate_id: candidateId,
    baseline_vendor_order_id: baseline.id,
    status: "pending",
    work_state: driver.work_state,
    package: baseline.package,
  })) as Array<{ id: string }>;
  const continuousCheckRowId = inserted[0].id;

  // === Call Checkr Continuous Checks API ===
  const env = ctx.env.CHECKR_ENV === "live" ? "live" : "staging";
  const apiKey = env === "live" ? ctx.env.CHECKR_LIVE_API_KEY : ctx.env.CHECKR_STAGING_API_KEY;
  if (!apiKey) {
    await sb.update("compass_continuous_checks", `id=eq.${continuousCheckRowId}`, {
      status: "failed",
      failed_reason: `CHECKR_${env.toUpperCase()}_API_KEY env var not set`,
    });
    return json({ ok: false, error: `CHECKR_${env.toUpperCase()}_API_KEY not set` }, 500);
  }
  const apiBase = ctx.env.CHECKR_API_BASE || (env === "live" ? "https://api.checkr.com" : "https://api.checkr-staging.com");

  const checkrRes = await fetch(`${apiBase}/v1/continuous_checks`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(apiKey + ":")}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `compass-cc-${continuousCheckRowId}`,
    },
    body: JSON.stringify({
      candidate_id: candidateId,
      type: "mvr",
    }),
  });

  const responseText = await checkrRes.text();
  let responseJson: Record<string, unknown> = {};
  try {
    responseJson = JSON.parse(responseText) as Record<string, unknown>;
  } catch {
    /* keep as text */
  }

  if (!checkrRes.ok) {
    // Account-not-approved is the expected error until Checkr enables the feature
    const errStr = (responseJson.error as string) || responseText || `HTTP ${checkrRes.status}`;
    const code =
      checkrRes.status === 403 || errStr.toLowerCase().includes("not enabled")
        ? "ACCOUNT_NOT_APPROVED"
        : checkrRes.status === 422
          ? "VALIDATION"
          : "CHECKR_ERROR";

    await sb.update("compass_continuous_checks", `id=eq.${continuousCheckRowId}`, {
      status: "failed",
      failed_reason: errStr,
    });

    return json(
      {
        ok: false,
        code,
        error: errStr,
        detail: responseJson,
        hint:
          code === "ACCOUNT_NOT_APPROVED"
            ? "Continuous MVR is not yet enabled on this Checkr account. Submit the Add-On Request via Checkr Support and try again after approval."
            : undefined,
      },
      checkrRes.status === 403 || checkrRes.status === 422 ? checkrRes.status : 502
    );
  }

  const checkrId = responseJson.id as string | undefined;

  // === Flip our row to active + store Checkr's id ===
  await sb.update("compass_continuous_checks", `id=eq.${continuousCheckRowId}`, {
    status: "active",
    checkr_continuous_check_id: checkrId,
    enrolled_at: new Date().toISOString(),
    metadata: responseJson,
  });

  return json({
    ok: true,
    continuous_check_id: continuousCheckRowId,
    checkr_continuous_check_id: checkrId,
    status: "active",
    driver: { id: driver.id, name: `${driver.first_name} ${driver.last_name}` },
  });
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
