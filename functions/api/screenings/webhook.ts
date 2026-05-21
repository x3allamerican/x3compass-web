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
 * Optional:
 *  - CHECKR_SKIP_SIGNATURE=1  (dev-only escape hatch, never set in production)
 */

interface Env {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE?: string;
  CHECKR_STAGING_WEBHOOK_SECRET?: string;
  CHECKR_LIVE_WEBHOOK_SECRET?: string;
  CHECKR_ENV?: "staging" | "live";
  CHECKR_SKIP_SIGNATURE?: string;
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
  if (ctx.env.CHECKR_SKIP_SIGNATURE === "1") {
    sigOk = true; // dev only
  } else if (!secret) {
    return json({ ok: false, error: `Webhook secret not configured for ${env}` }, 500);
  } else if (!sigHeader) {
    return json({ ok: false, error: "Missing X-Checkr-Signature header" }, 401);
  } else {
    sigOk = await verifyHmacSha256(rawBody, secret, sigHeader);
  }

  if (!sigOk) {
    return json({ ok: false, error: "Invalid signature" }, 401);
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
    return json(
      { ok: false, error: `Supabase insert HTTP ${insertRes.status}: ${text}` },
      500
    );
  }

  // === Apply state transition to vendor_orders ===
  await applyCheckrEventToOrder(ctx.env, sbHeaders, eventType, obj, payload);

  // === Apply state transition to continuous MVR enrollments ===
  // Handles: continuous_check.created, continuous_check.canceled, continuous_check.completed,
  //          mvr_report.created, report.created (when triggered from a continuous_check)
  if (eventType.startsWith("continuous_check.") || eventType === "mvr_report.created") {
    await applyCheckrContinuousEvent(ctx.env, sbHeaders, eventType, obj, payload);
  } else if (eventType === "report.created" || eventType === "report.completed") {
    // A report.created/completed *may* be triggered by a continuous enrollment.
    // Checkr includes `continuous_check_id` on the report object when it is.
    if (typeof obj.continuous_check_id === "string" && obj.continuous_check_id) {
      await applyCheckrContinuousEvent(ctx.env, sbHeaders, eventType, obj, payload);
    }
  }

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

async function verifyHmacSha256(
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
  // Bug fix 2026-05-19: report.created events arrive BEFORE we've cached the
  // report_id on the order row, so report_id.eq doesn't match. Match by
  // candidate_id instead (set on invitation creation, stable for all events).
  const candidateId = (obj.candidate_id as string) || (obj.id as string && eventType === "candidate.created" ? (obj.id as string) : undefined);

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
  if (reportId)     filters.push(`report_id.eq.${encodeURIComponent(reportId)}`);
  if (invitationId) filters.push(`vendor_ref_id.eq.${encodeURIComponent(invitationId)}`);
  if (candidateId)  filters.push(`checkr_candidate_id.eq.${encodeURIComponent(candidateId)}`);
  if (filters.length === 0) return;
  // Use OR for either match
  const orFilter = filters.join(",");

  const patchUrl = `${env.SUPABASE_URL}/rest/v1/vendor_orders?or=(${orFilter})&vendor=eq.checkr`;
  const patchRes = await fetch(patchUrl, {
    method: "PATCH",
    headers: { ...sbHeaders, Prefer: "return=representation" },
    body: JSON.stringify(update),
  });
  // Bug fix 2026-05-19: link the just-processed event back to the order via
  // vendor_order_id so we can build a per-order timeline view.
  if (patchRes.ok) {
    try {
      const rows = (await patchRes.json()) as Array<{ id?: string }>;
      const orderId = Array.isArray(rows) && rows.length > 0 ? rows[0].id : null;
      if (orderId && fullPayload?.id) {
        await fetch(
          `${env.SUPABASE_URL}/rest/v1/vendor_webhook_events?event_id=eq.${encodeURIComponent(fullPayload.id)}`,
          { method: "PATCH", headers: { ...sbHeaders, Prefer: "return=minimal" }, body: JSON.stringify({ vendor_order_id: orderId }) }
        );
      }
    } catch { /* no-op */ }
  }
}

/**
 * applyCheckrContinuousEvent — handles continuous_check.* and continuous-triggered
 * report.* events. Updates compass_continuous_checks and logs to
 * compass_continuous_check_events. Also creates a compass_notifications row
 * when a hit fires.
 */
async function applyCheckrContinuousEvent(
  env: Env,
  sbHeaders: Record<string, string>,
  eventType: string,
  obj: Record<string, unknown>,
  fullPayload: Record<string, unknown>
): Promise<void> {
  const continuousCheckId = (obj.continuous_check_id as string) || (eventType.startsWith("continuous_check.") ? (obj.id as string) : undefined);
  const candidateId = obj.candidate_id as string | undefined;
  const reportId = eventType.startsWith("report.") || eventType === "mvr_report.created" ? (obj.id as string) : undefined;
  const assessment = (obj.assessment as string) || null;
  const result = (obj.result as string) || null;

  // 1. Log the event to compass_continuous_check_events (idempotent on event_id)
  const eventInsert = {
    checkr_continuous_check_id: continuousCheckId,
    checkr_candidate_id: candidateId,
    event_type: eventType,
    event_id: fullPayload?.id || null,
    report_id: reportId,
    assessment,
    result,
    payload: obj,
    raw_event: fullPayload,
  };
  await fetch(`${env.SUPABASE_URL}/rest/v1/compass_continuous_check_events`, {
    method: "POST",
    headers: { ...sbHeaders, Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(eventInsert),
  }).catch(() => { /* idempotent dup — ok */ });

  // 2. Update the corresponding enrollment row
  if (!continuousCheckId && !candidateId) return;

  const update: Record<string, unknown> = {};
  switch (eventType) {
    case "continuous_check.created":
      update.status = "active";
      update.enrolled_at = new Date().toISOString();
      break;
    case "continuous_check.canceled":
      update.status = "canceled";
      update.canceled_at = new Date().toISOString();
      break;
    case "continuous_check.completed":
      // Some accounts get a "completed" event when a baseline/initial enrollment finishes
      update.status = "active";
      break;
    case "mvr_report.created":
    case "report.created":
    case "report.completed":
      // A HIT — Checkr generated a new MVR report because a state reported a change
      update.last_hit_at = new Date().toISOString();
      update.last_hit_report_id = reportId;
      update.last_hit_assessment = assessment;
      // Postgres-side increment via RPC would be cleaner; here we re-read + write.
      // Cheap because we filter by id below.
      break;
  }

  if (Object.keys(update).length === 0) return;

  // Build filter — match on checkr_continuous_check_id first, fall back to candidate_id
  const filters: string[] = [];
  if (continuousCheckId) filters.push(`checkr_continuous_check_id.eq.${encodeURIComponent(continuousCheckId)}`);
  if (candidateId) filters.push(`checkr_candidate_id.eq.${encodeURIComponent(candidateId)}`);
  if (filters.length === 0) return;
  const orFilter = filters.join(",");

  const patchUrl = `${env.SUPABASE_URL}/rest/v1/compass_continuous_checks?or=(${orFilter})&status=in.(pending,active)`;
  const patchRes = await fetch(patchUrl, {
    method: "PATCH",
    headers: { ...sbHeaders, Prefer: "return=representation" },
    body: JSON.stringify(update),
  });

  // 3. If a hit fired, bump hit_count_total + hit_count_30d AND drop a compass_notifications row
  if (update.last_hit_at && patchRes.ok) {
    try {
      const rows = (await patchRes.json()) as Array<{
        id: string;
        carrier_id: string;
        driver_id: string | null;
        hit_count_total: number | null;
        hit_count_30d: number | null;
      }>;
      for (const r of rows) {
        // Increment counters
        await fetch(`${env.SUPABASE_URL}/rest/v1/compass_continuous_checks?id=eq.${r.id}`, {
          method: "PATCH",
          headers: { ...sbHeaders, Prefer: "return=minimal" },
          body: JSON.stringify({
            hit_count_total: (r.hit_count_total || 0) + 1,
            hit_count_30d: (r.hit_count_30d || 0) + 1,
          }),
        });
        // Create notification for the carrier
        await fetch(`${env.SUPABASE_URL}/rest/v1/compass_notifications`, {
          method: "POST",
          headers: { ...sbHeaders, Prefer: "return=minimal" },
          body: JSON.stringify({
            carrier_id: r.carrier_id,
            kind: "continuous_mvr_hit",
            severity: assessment === "review" ? "warn" : assessment === "eligible" ? "info" : "warn",
            title: "Continuous MVR alert",
            body: `Checkr detected a new MVR change for one of your drivers.${assessment ? ` Assessment: ${assessment}.` : ""}`,
            metadata: {
              continuous_check_id: r.id,
              driver_id: r.driver_id,
              report_id: reportId,
              assessment,
            },
          }),
        }).catch(() => { /* notifications table may not exist on all envs — non-fatal */ });
      }
    } catch { /* no-op */ }
  }
}

// OPTIONS for CORS preflight (Checkr does not send OPTIONS but harmless)
export const onRequestOptions: PagesFunction = async () =>
  new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Checkr-Signature",
    },
  });
