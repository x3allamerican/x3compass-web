/**
 * POST /api/screenings/continuous-mvr/enroll
 *
 * Enroll a driver in Checkr Continuous MVR monitoring. Checkr generates a new
 * MVR report only when a state DMV record changes (event-driven), which the
 * screenings webhook writes back into compass_mvr_records + compass_mvr_monitors.
 *
 * Body: { driver_id: uuid, carrier_id?: uuid }   (Bearer Supabase JWT)
 * Returns: { ok: true, monitor } | { ok: false, code?, error }
 *   code = "NEEDS_BASELINE"        -> no completed clear Checkr MVR for driver
 *   code = "ACCOUNT_NOT_APPROVED"  -> Checkr account not enabled for Continuous MVR
 *
 * Checkr endpoint is env-overridable (product slugs vary by account):
 *   CHECKR_CONTINUOUS_MVR_PATH  default "/v1/continuous_checks"
 *   CHECKR_CONTINUOUS_MVR_TYPE  default "mvr"
 *   CHECKR_DEFAULT_NODE         optional account-hierarchy node
 */
import { correlationId, isUuid, requireTenant, securityError, type SecurityEnv } from "../../../_shared/request-security";
import { supaFetch } from "../../../_shared/supabase-admin";

interface Env extends SecurityEnv {
  CHECKR_STAGING_API_KEY?: string;
  CHECKR_LIVE_API_KEY?: string;
  CHECKR_ENV?: "staging" | "live";
  CHECKR_API_BASE?: string;
  CHECKR_CONTINUOUS_MVR_PATH?: string;
  CHECKR_CONTINUOUS_MVR_TYPE?: string;
  CHECKR_DEFAULT_NODE?: string;
}

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

type Baseline = { checkr_candidate_id: string | null; package: string | null; service: string | null; report_id: string | null };

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const requestId = correlationId(ctx.request);
  let body: { driver_id?: string; carrier_id?: string };
  try { body = (await ctx.request.json()) as typeof body; } catch { return json({ ok: false, error: "Invalid JSON" }, 400); }

  let authority;
  try { authority = await requireTenant(ctx.request, ctx.env, body.carrier_id); }
  catch { return securityError(503, "authorization_unavailable", requestId); }
  if (!authority.ok) return securityError(authority.status, authority.code, requestId);
  const carrierId = authority.carrierId;

  if (!isUuid(body.driver_id)) return json({ ok: false, error: "driver_id must be a UUID" }, 400);
  const driverId = body.driver_id as string;

  const supa = supaFetch(ctx.env);

  // Idempotency: an active monitor already exists for this driver.
  const existing = (await supa.select("compass_mvr_monitors",
    `carrier_id=eq.${carrierId}&driver_id=eq.${driverId}&select=id,status,checkr_continuous_check_id`)) as Array<{ id: string; status: string }>;
  if (existing[0] && ["active", "pending"].includes(existing[0].status)) {
    return json({ ok: true, monitor: existing[0], already: true });
  }

  // Baseline gate: a completed, clear Checkr MVR must exist for this driver.
  const rows = (await supa.select("vendor_orders",
    `carrier_id=eq.${carrierId}&driver_id=eq.${driverId}&vendor=eq.checkr&checkr_candidate_id=not.is.null` +
    `&select=checkr_candidate_id,package,service,report_id,checkr_result,checkr_assessment,effective_status,completed_at&order=completed_at.desc`)) as Array<Baseline & { checkr_result: string | null; checkr_assessment: string | null; effective_status: string | null }>;
  const isMvr = (s: string | null) => !!s && /mvr|motor[_ ]?vehicle/i.test(s);
  const isClear = (r: Baseline & { checkr_result: string | null; checkr_assessment: string | null; effective_status: string | null }) =>
    [r.checkr_result, r.checkr_assessment, r.effective_status].some((v) => (v || "").toLowerCase() === "clear");
  const baseline = rows.find((r) => (isMvr(r.package) || isMvr(r.service)) && isClear(r));
  if (!baseline || !baseline.checkr_candidate_id) {
    return json({ ok: false, code: "NEEDS_BASELINE", error: "No completed clear Checkr MVR on file for this driver" }, 409);
  }

  // Call Checkr to open the continuous MVR check.
  const cenv = ctx.env.CHECKR_ENV === "live" ? "live" : "staging";
  const apiKey = cenv === "live" ? ctx.env.CHECKR_LIVE_API_KEY : ctx.env.CHECKR_STAGING_API_KEY;
  if (!apiKey) return json({ ok: false, error: `CHECKR_${cenv.toUpperCase()}_API_KEY not set` }, 500);
  const apiBase = ctx.env.CHECKR_API_BASE || "https://api.checkr.com";
  const path = ctx.env.CHECKR_CONTINUOUS_MVR_PATH || "/v1/continuous_checks";
  const ccType = ctx.env.CHECKR_CONTINUOUS_MVR_TYPE || "mvr";
  const authHeader = `Basic ${btoa(apiKey + ":")}`;

  const ccPayload: Record<string, unknown> = { candidate_id: baseline.checkr_candidate_id, type: ccType };
  if (ctx.env.CHECKR_DEFAULT_NODE) ccPayload.node = ctx.env.CHECKR_DEFAULT_NODE;

  let checkr: { id?: string; status?: string } = {};
  try {
    const r = await fetch(`${apiBase}${path}`, {
      method: "POST",
      headers: { Authorization: authHeader, "Content-Type": "application/json" },
      body: JSON.stringify(ccPayload),
    });
    const text = await r.text();
    if (!r.ok) {
      const notApproved = r.status === 402 || r.status === 403 ||
        /not\s*(authorized|enabled|permitted)|permission|credential|not\s*eligible|unauthorized/i.test(text);
      if (notApproved) return json({ ok: false, code: "ACCOUNT_NOT_APPROVED", error: "Checkr account not enabled for Continuous MVR" }, 200);
      return json({ ok: false, error: `Checkr ${r.status}: ${text.slice(0, 200)}` }, 502);
    }
    try { checkr = JSON.parse(text); } catch { checkr = {}; }
  } catch (e) {
    return json({ ok: false, error: `Checkr request failed: ${e instanceof Error ? e.message : String(e)}` }, 502);
  }

  const row = {
    carrier_id: carrierId,
    driver_id: driverId,
    checkr_candidate_id: baseline.checkr_candidate_id,
    checkr_continuous_check_id: checkr.id || null,
    type: ccType,
    status: (checkr.status as string) || "active",
    baseline_report_id: baseline.report_id || null,
    enrolled_by: authority.userId,
    enrolled_at: new Date().toISOString(),
    canceled_at: null,
    raw: checkr,
    updated_at: new Date().toISOString(),
  };
  let monitor: unknown;
  if (existing[0]) {
    monitor = (await supa.update("compass_mvr_monitors", `id=eq.${existing[0].id}`, row))[0];
  } else {
    monitor = (await supa.insert("compass_mvr_monitors", row))[0];
  }
  return json({ ok: true, monitor });
};

export const onRequestOptions: PagesFunction = async () => new Response(null, { status: 204 });
