/**
 * POST /api/carrier/set-ctpa
 *
 * Carrier admin picks (or changes) the C/TPA that manages their DOT
 * D&A program. Drives the methodology choice:
 *
 *   procom_referral   · X3 referred them to Procom (the recommended
 *                       default per task #304 · Option 3)
 *   byo_connected     · They have an existing C/TPA we have an API
 *                       connector for (DISA, Quest, LabCorp, etc.)
 *   byo_manual        · They have an existing C/TPA · no integration ·
 *                       carrier uploads results CSVs themselves via
 *                       /api/da/upload-results
 *
 * Request body:
 *   { ctpa_slug?: string,        // pick from compass_ctpas seed list
 *     ctpa_id?:   string,        // OR pick by UUID
 *     custom_name?: string,      // only when ctpa_slug = 'other'
 *     mode: 'procom_referral' | 'byo_connected' | 'byo_manual' }
 *
 * Response: { ok, ctpa: {...}, mode }
 *           or { ok: false, error }
 *
 * Auth: Bearer JWT (Supabase) · user must be a member of the carrier.
 *
 * Side effects:
 *   - UPDATE carriers SET ctpa_id, ctpa_mode, ctpa_custom_name, ctpa_selected_at
 *   - If mode = procom_referral and ctpa_slug omitted, defaults to Procom
 *   - Writes audit row (handled downstream by the same auditEvent helper
 *     other endpoints use · TODO once auditEvent lands here)
 */

import { bearerFromRequest, verifySupabaseJwt, type SupaEnv } from "../../_shared/supabase-admin";

interface Env extends SupaEnv {}

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), {
    status: s,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });

const SUPABASE_HEADERS = (sr: string, prefer = "return=representation") => ({
  apikey: sr,
  Authorization: `Bearer ${sr}`,
  Accept: "application/json",
  "Content-Type": "application/json",
  Prefer: prefer,
});

const VALID_MODES = ["procom_referral", "byo_connected", "byo_manual"] as const;
type Mode = typeof VALID_MODES[number];

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
    },
  });
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }): Promise<Response> {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE) {
    return json({ ok: false, error: "Supabase env vars missing" }, 500);
  }

  const token = bearerFromRequest(request);
  if (!token) return json({ ok: false, error: "Missing Bearer token" }, 401);
  const user = await verifySupabaseJwt(env, token);
  if (!user) return json({ ok: false, error: "Invalid token" }, 401);

  let body: {
    ctpa_slug?: string;
    ctpa_id?: string;
    custom_name?: string;
    mode?: string;
    /** Required when mode = 'procom_referral'. Carrier must have ack'd the
     *  Procom program disclosure modal in /app/drug-alcohol before reaching
     *  here. */
    disclosure_acked?: boolean;
    disclosure_version?: string;
  };
  try { body = await request.json() as typeof body; }
  catch { return json({ ok: false, error: "Invalid JSON body" }, 400); }

  if (!body.mode || !(VALID_MODES as readonly string[]).includes(body.mode)) {
    return json({ ok: false, error: `mode must be one of ${VALID_MODES.join(", ")}` }, 400);
  }
  const mode = body.mode as Mode;

  // Procom referral is the only path that REQUIRES the formal disclosure ack.
  // BYO_connected and BYO_manual modes are operational selections from the
  // marketplace, not enrollments in a referred consortium program · no ack needed.
  if (mode === "procom_referral" && body.disclosure_acked !== true) {
    return json({
      ok: false,
      error: "Procom requires disclosure acknowledgment · open the program details modal at /app/drug-alcohol and tick the confirmation box first.",
    }, 412);
  }
  if (mode === "procom_referral" && !body.disclosure_version) {
    return json({ ok: false, error: "disclosure_version required for Procom referral" }, 400);
  }

  // Determine carrier_id from the caller's membership (single-carrier
  // path is fine for now; multi-carrier users would scope by header).
  const memberLookup = await fetch(
    `${env.SUPABASE_URL}/rest/v1/carrier_members?user_id=eq.${user.sub}&select=carrier_id&limit=1`,
    { headers: SUPABASE_HEADERS(env.SUPABASE_SERVICE_ROLE) }
  );
  const members = memberLookup.ok ? await memberLookup.json() as Array<{ carrier_id: string }> : [];
  if (!members.length) return json({ ok: false, error: "User is not a member of any carrier" }, 403);
  const carrier_id = members[0].carrier_id;

  // Resolve the C/TPA from slug or id. If procom_referral and neither
  // provided, default to the procom slug.
  let ctpaQuery = "";
  if (body.ctpa_id) {
    ctpaQuery = `id=eq.${body.ctpa_id}`;
  } else if (body.ctpa_slug) {
    ctpaQuery = `slug=eq.${encodeURIComponent(body.ctpa_slug)}`;
  } else if (mode === "procom_referral") {
    ctpaQuery = `slug=eq.procom`;
  } else {
    return json({ ok: false, error: "ctpa_slug or ctpa_id required for non-procom modes" }, 400);
  }
  const ctpaLookup = await fetch(
    `${env.SUPABASE_URL}/rest/v1/compass_ctpas?${ctpaQuery}&select=id,slug,legal_name,fmcsa_clearinghouse_name,primary_phone,primary_email,website_url,api_capable,api_connector_status,is_recommended`,
    { headers: SUPABASE_HEADERS(env.SUPABASE_SERVICE_ROLE) }
  );
  if (!ctpaLookup.ok) return json({ ok: false, error: `C/TPA lookup ${ctpaLookup.status}` }, 500);
  const ctpas = await ctpaLookup.json() as Array<{ id: string; slug: string; legal_name: string }>;
  if (!ctpas.length) return json({ ok: false, error: "C/TPA not found in marketplace" }, 404);
  const ctpa = ctpas[0];

  // Guardrails: byo_manual w/ a non-other slug is fine (carrier has DISA but
  // we don't have a connector yet · they upload CSVs). byo_connected w/ a
  // C/TPA whose api_connector_status is 'none' is invalid · catch it.
  if (mode === "byo_connected") {
    const apiStatus = (ctpas[0] as { api_connector_status?: string }).api_connector_status;
    if (apiStatus === "none") {
      return json({ ok: false, error: `${ctpa.legal_name} doesn't have an X3 API connector yet · pick 'byo_manual' to track via CSV upload instead.` }, 409);
    }
  }

  // If they picked 'other', custom_name is required.
  const customName = ctpa.slug === "other" ? (body.custom_name || "").trim() : null;
  if (ctpa.slug === "other" && !customName) {
    return json({ ok: false, error: "custom_name required when picking 'Other'" }, 400);
  }

  // Capture acknowledgment audit fields when Procom path · IP from CF edge headers.
  const nowIso = new Date().toISOString();
  const ackIp =
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
    null;
  const ackFields = mode === "procom_referral"
    ? {
        ctpa_disclosure_acked_at: nowIso,
        ctpa_disclosure_acked_ip: ackIp,
        ctpa_disclosure_version: body.disclosure_version,
      }
    : {
        // Switching AWAY from Procom · clear the ack fields so a future
        // re-enrollment with updated terms forces a fresh ack.
        ctpa_disclosure_acked_at: null,
        ctpa_disclosure_acked_ip: null,
        ctpa_disclosure_version: null,
      };

  // Update the carrier row.
  const update = await fetch(
    `${env.SUPABASE_URL}/rest/v1/carriers?id=eq.${carrier_id}`,
    {
      method: "PATCH",
      headers: SUPABASE_HEADERS(env.SUPABASE_SERVICE_ROLE),
      body: JSON.stringify({
        ctpa_id: ctpa.id,
        ctpa_mode: mode,
        ctpa_custom_name: customName,
        ctpa_selected_at: nowIso,
        ...ackFields,
      }),
    }
  );
  if (!update.ok) return json({ ok: false, error: `Update failed: ${await update.text()}` }, 500);

  return json({
    ok: true,
    carrier_id,
    mode,
    ctpa,
    custom_name: customName,
    note: mode === "procom_referral"
      ? "Procom is now your C/TPA · Joshua will introduce you to Martin Sena (admin@procomtesting.com) for enrollment."
      : mode === "byo_connected"
        ? `${ctpa.legal_name} marked as your C/TPA · API connector status: planned. Until live, use CSV upload at /app/drug-alcohol.`
        : `${customName || ctpa.legal_name} marked as your C/TPA · upload test results via /app/drug-alcohol whenever your TPA emails them.`,
  });
}
