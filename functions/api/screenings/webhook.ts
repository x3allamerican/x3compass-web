/**
 * POST /api/screenings/webhook
 *
 * Unified inbound webhook receiver for background-check / screening vendors.
 * For now: Checkr only. Future: Health Street, SambaSafety, HireRight.
 *
 * URL pattern Checkr should be configured with:
 *   https://x3compass-web.pages.dev/api/screenings/webhook?vendor=checkr
 *   (or, once x3compass.com DNS points at this Pages project:
 *    https://x3compass.com/api/screenings/webhook?vendor=checkr)
 *
 * Per Checkr API Integration Guidance v3.0 (Feb 18, 2025):
 *  - HMAC-SHA256 signature in `X-Checkr-Signature` header, secret is webhook
 *    signing secret shown in Checkr Dashboard when the webhook is created
 *  - We listen for: invitation.created/completed/expired/deleted,
 *    report.created/updated/completed/canceled/suspended/resumed/disputed/engaged,
 *    report.pre_adverse_action, report.post_adverse_action
 *  - Continuous MVR: continuous_check.created/canceled and change-triggered
 *    report.completed (obj.continuous_check_id) -> compass_mvr_records
 *  - report.completed handling: first check `assessment` field (Assess output),
 *    fall back to `result` field. Honor `includes_canceled` boolean for
 *    partial-completion display logic.
 *
 * Required Pages env vars:
 *  - SUPABASE_URL
 *  - SUPABASE_SERVICE_ROLE
 *  - CHECKR_STAGING_WEBHOOK_SECRET (used when ?vendor=checkr and env CHECKR_ENV=staging)
 *  - CHECKR_LIVE_WEBHOOK_SECRET    (used when CHECKR_ENV=live or unset)
 *
 */
import { correlationId, securityError } from "../../_shared/request-security";

interface Env {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE?: string;
  CHECKR_STAGING_WEBHOOK_SECRET?: string;
  CHECKR_LIVE_WEBHOOK_SECRET?: string;
  CHECKR_ENV?: "staging" | "live";
}

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const url = new URL(ctx.request.url);
  const vendor = (url.searchParams.get("vendor") || "checkr").toLowerCase();

  if (vendor !== "checkr") {
    return json({ ok: false, error: `Vendor not yet implemented: ${vendor}` }, 400);
  }

  const rawBody = await ctx.request.text();
  const sigHeader =
    ctx.request.headers.get("X-Checkr-Signature") ||
    ctx.request.headers.get("x-checkr-signature") ||
    "";

  // === Signature verification ===
  const env = ctx.env.CHECKR_ENV === "live" ? "live" : "staging";
  const secret =
    env === "live"
      ? ctx.env.CHECKR_LIVE_WEBHOOK_SECRET
      : ctx.env.CHECKR_STAGING_WEBHOOK_SECRET;

  let sigOk = false;
  if (!secret) {
    return securityError(503, "service_unavailable", correlationId(ctx.request));
  } else if (!sigHeader) {
    return json({ ok: false, error: "Missing X-Checkr-Signature header" }, 401);
  } else {
    sigOk = await verifyHmacSha256(rawBody, secret, sigHeader);
  }

  if (!sigOk) {
    return securityError(401, "invalid_signature", correlationId(ctx.request));
  }

  // === Parse payload ===
  let payload: CheckrEvent;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return json({ ok: false, error: "Invalid JSON" }, 400);
  }

  const eventId: string = payload.id || crypto.randomUUID();
  const eventType: string = payload.type || "unknown";
  const obj = payload.data?.object || ({} as Record<string, unknown>);

  // === Record event in Supabase (idempotency via unique vendor+event_id) ===
  if (!ctx.env.SUPABASE_URL || !ctx.env.SUPABASE_SERVICE_ROLE) {
    // Without Supabase, ack the event but log only
    console.log("[checkr-webhook] no Supabase configured; event logged only", {
      eventId,
      eventType,
    });
    return json({ ok: true, persisted: false, eventId, eventType });
  }

  const sbHeaders = {
    apikey: ctx.env.SUPABASE_SERVICE_ROLE,
    Authorization: `Bearer ${ctx.env.SUPABASE_SERVICE_ROLE}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };

  // Insert event (will conflict on unique vendor+event_id; treat as success)
  const insertRes = await fetch(`${ctx.env.SUPABASE_URL}/rest/v1/vendor_webhook_events`, {
    method: "POST",
    headers: sbHeaders,
    body: JSON.stringify({
      vendor: "checkr",
      event_id: eventId,
      event_type: eventType,
      signature_verified: true,
      payload,
    }),
  });

  if (insertRes.status === 409) {
    // Duplicate event — Checkr will keep retrying until we 2xx, so ack
    return json({ ok: true, duplicate: true, eventId });
  }

  if (!insertRes.ok && insertRes.status !== 201) {
    const text = await insertRes.text();
    console.error("[checkr-webhook] failed to insert event:", insertRes.status, text);
    return securityError(500, "request_failed", correlationId(ctx.request));
  }

  // === Apply state transition to vendor_orders ===
  await applyCheckrEventToOrder(ctx.env, sbHeaders, eventType, obj, payload);

  // Continuous MVR monitoring: enrollment lifecycle + change-triggered MVR reports
  await applyContinuousMvr(ctx.env, sbHeaders, eventType, obj);

  // Mark event as processed
  await fetch(
    `${ctx.env.SUPABASE_URL}/rest/v1/vendor_webhook_events?event_id=eq.${encodeURIComponent(eventId)}`,
    {
      method: "PATCH",
      headers: sbHeaders,
      body: JSON.stringify({ processed_at: new Date().toISOString() }),
    }
  );

  return json({ ok: true, eventId, eventType, persisted: true });
};

// =============================================================================
// Helpers
// =============================================================================

interface CheckrEvent {
  id?: string;
  type?: string;
  data?: { object?: Record<string, unknown> };
}

export async function verifyHmacSha256(
  body: string,
  secret: string,
  expectedHex: string
): Promise<boolean> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(body));
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  // Checkr may send the signature with or without a "sha256=" prefix
  const cleanExpected = expectedHex.replace(/^sha256=/i, "").toLowerCase();
  if (hex.length !== cleanExpected.length) return false;
  // Timing-safe compare
  let diff = 0;
  for (let i = 0; i < hex.length; i++) {
    diff |= hex.charCodeAt(i) ^ cleanExpected.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Map a Checkr event to the X3 Compass vendor_orders row state.
 * Lookup pattern: the order has vendor_ref_id = the Checkr invitation_id (set
 * when we created the invitation) OR the report_id (set on report.created).
 * For invitation events we update by invitation_id; for report events we may
 * need to set report_id on the first report.created event and then update by
 * report_id thereafter.
 */
async function applyCheckrEventToOrder(
  env: Env,
  sbHeaders: Record<string, string>,
  eventType: string,
  obj: Record<string, unknown>,
  fullPayload: CheckrEvent
): Promise<void> {
  const invitationId = (obj.invitation_id as string) || (eventType.startsWith("invitation.") ? (obj.id as string) : undefined);
  const reportId =
    (obj.report_id as string) ||
    (eventType.startsWith("report.") ? (obj.id as string) : undefined);

  const update: Record<string, unknown> = {
    raw_last_event: fullPayload,
    last_event_at: new Date().toISOString(),
  };

  switch (eventType) {
    case "invitation.created":
      update.status = "invited";
      break;
    case "invitation.completed":
      update.status = "in_progress";
      break;
    case "invitation.expired":
      update.status = "invitation_expired";
      break;
    case "invitation.deleted":
      update.status = "invitation_canceled";
      break;

    case "report.created":
      // First time we learn the report_id; cache it on the order row
      if (reportId) update.report_id = reportId;
      update.status = "in_progress";
      break;
    case "report.updated":
      // Only meaningful when previous_attributes contains estimated_completion_time
      if (typeof obj.estimated_completion_time === "string") {
        update.eta_completion_at = obj.estimated_completion_time;
      }
      break;

    case "report.completed": {
      // Per Checkr v3.0 docs: first check `assessment` (Assess), fall back to `result`
      const result = (obj.result as string) || "";
      const assessment = (obj.assessment as string) || "";
      const includesCanceled = (obj.includes_canceled as boolean) === true;
      update.status = "completed";
      update.completed_at = new Date().toISOString();
      update.checkr_result = result;
      update.checkr_assessment = assessment;
      update.includes_canceled = includesCanceled;
      // Effective status for display: assessment first, then result
      update.effective_status = assessment || result || "complete";
      break;
    }

    case "report.engaged":
      update.status = "engaged"; // Adjudicator clicked Engaged
      break;
    case "report.pre_adverse_action":
      update.status = "pre_adverse_action";
      break;
    case "report.post_adverse_action":
      update.status = "post_adverse_action";
      update.adverse_action_at = new Date().toISOString();
      break;
    case "report.suspended":
      update.status = "suspended";
      break;
    case "report.resumed":
      update.status = "in_progress";
      break;
    case "report.disputed":
      update.status = "disputed";
      break;
    case "report.canceled":
      update.status = "canceled";
      update.canceled_at = new Date().toISOString();
      break;
  }

  // Look up by report_id first (more specific), then invitation_id
  if (Object.keys(update).length <= 2) {
    // Only metadata changed; still persist
  }

  const filters: string[] = [];
  if (reportId) filters.push(`report_id.eq.${encodeURIComponent(reportId)}`);
  if (invitationId) filters.push(`vendor_ref_id.eq.${encodeURIComponent(invitationId)}`);
  if (filters.length === 0) return;
  // Use OR for either match
  const orFilter = filters.join(",");

  const patchUrl = `${env.SUPABASE_URL}/rest/v1/vendor_orders?or=(${orFilter})&vendor=eq.checkr`;
  await fetch(patchUrl, {
    method: "PATCH",
    headers: { ...sbHeaders, Prefer: "return=minimal" },
    body: JSON.stringify(update),
  });
}

/**
 * Continuous MVR monitoring side-effects. Non-breaking: only acts when the
 * event maps to a row in compass_mvr_monitors. Regular one-off reports (no
 * continuous_check_id / unmonitored candidate) are ignored here.
 */
export async function applyContinuousMvr(
  env: Env,
  sbHeaders: Record<string, string>,
  eventType: string,
  obj: Record<string, unknown>,
): Promise<void> {
  const base = env.SUPABASE_URL;
  if (!base) return;
  const nowIso = new Date().toISOString();
  const str = (v: unknown): string | undefined => (typeof v === "string" && v ? v : undefined);

  async function findMonitor(filter: string): Promise<{ id: string; carrier_id: string; driver_id: string } | null> {
    const r = await fetch(`${base}/rest/v1/compass_mvr_monitors?${filter}&select=id,carrier_id,driver_id&limit=1`, { headers: sbHeaders });
    if (!r.ok) return null;
    const rows = (await r.json()) as Array<{ id: string; carrier_id: string; driver_id: string }>;
    return rows[0] || null;
  }
  async function findDriverByCandidate(candidateId: string): Promise<{ carrier_id: string; driver_id: string } | null> {
    const r = await fetch(`${base}/rest/v1/vendor_orders?vendor=eq.checkr&checkr_candidate_id=eq.${encodeURIComponent(candidateId)}&driver_id=not.is.null&select=carrier_id,driver_id&order=completed_at.desc&limit=1`, { headers: sbHeaders });
    if (!r.ok) return null;
    const rows = (await r.json()) as Array<{ carrier_id: string; driver_id: string }>;
    return rows[0] || null;
  }
  async function patchMonitor(id: string, patch: Record<string, unknown>): Promise<void> {
    await fetch(`${base}/rest/v1/compass_mvr_monitors?id=eq.${id}`, {
      method: "PATCH", headers: { ...sbHeaders, Prefer: "return=minimal" },
      body: JSON.stringify({ ...patch, updated_at: nowIso }),
    });
  }

  // --- continuous_check.* lifecycle events ---
  // Enrollment can happen in the Checkr Dashboard (Post Hire -> toggle C-MVR)
  // OR via our enroll API. Either way Checkr emits continuous_check.created, so
  // we upsert a monitor row — backfilling one for dashboard enrollments by
  // mapping the candidate back to a driver via a prior order.
  if (eventType.startsWith("continuous_check.")) {
    const ccId = str(obj.id);
    const candId = str(obj.candidate_id);
    let mon = ccId ? await findMonitor(`checkr_continuous_check_id=eq.${encodeURIComponent(ccId)}`) : null;
    if (!mon && candId) mon = await findMonitor(`checkr_candidate_id=eq.${encodeURIComponent(candId)}`);

    const isCreate = eventType === "continuous_check.created" || eventType === "continuous_check.resumed";
    const isCancel = /cancel|complete|delete|clear|suspend/.test(eventType);

    if (isCreate) {
      if (mon) {
        await patchMonitor(mon.id, { status: "active", ...(ccId ? { checkr_continuous_check_id: ccId } : {}), raw: obj });
      } else if (candId) {
        const link = await findDriverByCandidate(candId);
        if (link) {
          await fetch(`${base}/rest/v1/compass_mvr_monitors?on_conflict=carrier_id,driver_id`, {
            method: "POST",
            headers: { ...sbHeaders, Prefer: "resolution=merge-duplicates,return=minimal" },
            body: JSON.stringify({
              carrier_id: link.carrier_id,
              driver_id: link.driver_id,
              checkr_candidate_id: candId,
              checkr_continuous_check_id: ccId || null,
              type: str(obj.type) || "mvr",
              status: "active",
              enrolled_at: nowIso,
              raw: obj,
              updated_at: nowIso,
            }),
          });
        }
      }
    } else if (isCancel && mon) {
      await patchMonitor(mon.id, { status: "canceled", canceled_at: nowIso, raw: obj });
    }
    return;
  }

  // --- change-triggered MVR report on a monitored candidate ---
  if (eventType.startsWith("report.")) {
    const ccId = str(obj.continuous_check_id);
    const candId = str(obj.candidate_id);
    if (!ccId && !candId) return;
    let mon = ccId ? await findMonitor(`checkr_continuous_check_id=eq.${encodeURIComponent(ccId)}`) : null;
    if (!mon && candId) mon = await findMonitor(`checkr_candidate_id=eq.${encodeURIComponent(candId)}`);
    if (!mon) return; // not a monitored driver

    const reportId = str(obj.id);
    if (eventType !== "report.completed") {
      if (reportId) await patchMonitor(mon.id, { last_report_id: reportId });
      return;
    }
    const result = str(obj.assessment) || str(obj.result) || "updated";
    const mvr = (obj.motor_vehicle_report || obj.mvr) as Record<string, unknown> | undefined;
    let violationsCount: number | null = null;
    if (mvr && Array.isArray((mvr as { violations?: unknown[] }).violations)) violationsCount = ((mvr as { violations: unknown[] }).violations).length;
    else if (Array.isArray((obj as { records?: unknown[] }).records)) violationsCount = ((obj as { records: unknown[] }).records).length;
    const state = str(mvr?.state) || str(obj.state) || null;

    await fetch(`${base}/rest/v1/compass_mvr_records`, {
      method: "POST", headers: { ...sbHeaders, Prefer: "return=minimal" },
      body: JSON.stringify({
        carrier_id: mon.carrier_id,
        driver_id: mon.driver_id,
        pulled_on: nowIso.slice(0, 10),
        state,
        result,
        violations_count: violationsCount,
        source: "checkr_continuous",
        notes: `Continuous MVR change detected${reportId ? ` · report ${reportId}` : ""}`,
      }),
    });
    await patchMonitor(mon.id, { ...(reportId ? { last_report_id: reportId } : {}), last_change_at: nowIso });
    await fetch(`${base}/rest/v1/notification_log?on_conflict=carrier_id,dedupe_key`, {
      method: "POST", headers: { ...sbHeaders, Prefer: "resolution=ignore-duplicates,return=minimal" },
      body: JSON.stringify({ carrier_id: mon.carrier_id, event_type: "mvr_change_detected", severity: "warning", title: "Continuous MVR change detected", body: `A completed monitoring report requires review${reportId ? ` · report ${reportId}` : ""}.`, channels_attempted: ["in_app"], related_driver_id: mon.driver_id, dedupe_key: `mvr-change:${reportId || ccId || candId}`, created_at: nowIso }),
    });
  }
}

// OPTIONS for CORS preflight (Checkr does not send OPTIONS but harmless)
export const onRequestOptions: PagesFunction = async () => new Response(null, { status: 204 });
