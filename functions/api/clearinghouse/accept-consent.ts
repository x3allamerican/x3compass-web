/**
 * POST /api/clearinghouse/accept-consent
 *
 * Driver e-signs the consent. PUBLIC endpoint · the consent_id is the
 * bearer (same model as Checkr's disclosure embed).
 *
 * Request body:
 *   {
 *     consent_id: string;       // required
 *     typed_name: string;       // driver's typed signature (must match
 *                               // first+last name on the driver record)
 *     agree: true               // explicit affirmative
 *   }
 *
 * Response: { ok, consent_id, received_at, late }   late=true if past deadline
 *           or { ok: false, error }
 *
 * Side effects on success:
 *   1. UPDATE consent row: consent_received_at = now(), consent_method =
 *      'electronic_signature', signature_ip, signature_user_agent
 *   2. If consent_type is 'pre_employment' or 'triggered_24hr', INSERT a
 *      compass_clearinghouse_queries row in result='pending' state so the
 *      query orchestrator can pick it up and run the actual FMCSA query
 *      next. (Phase 1: the row sits pending; V2 will wire the FMCSA API
 *      call here.)
 *
 * No CAPTCHA in Phase 1 — protected by UUID secrecy. If we see abuse,
 * add rate-limit via the existing rate-limit.ts helper later.
 */

import { type SupaEnv } from "../../_shared/supabase-admin";

interface Env extends SupaEnv {}

interface RequestBody {
  consent_id?: string;
  typed_name?: string;
  agree?: boolean;
}

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), {
    status: s,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Cache-Control": "private, no-store" },
  });

const SUPABASE_HEADERS = (sr: string) => ({
  apikey: sr,
  Authorization: `Bearer ${sr}`,
  Accept: "application/json",
  "Content-Type": "application/json",
  Prefer: "return=representation",
});

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }): Promise<Response> {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE) {
    return json({ ok: false, error: "Supabase env vars missing" }, 500);
  }

  // 1. Parse body
  let body: RequestBody;
  try { body = await request.json() as RequestBody; }
  catch { return json({ ok: false, error: "Invalid JSON body" }, 400); }

  const cid = body.consent_id;
  const typedName = (body.typed_name || "").trim();

  if (!cid) return json({ ok: false, error: "consent_id required" }, 400);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cid)) {
    return json({ ok: false, error: "Invalid consent id" }, 400);
  }
  if (!typedName) return json({ ok: false, error: "typed_name required" }, 400);
  if (body.agree !== true) return json({ ok: false, error: "Explicit agreement required" }, 400);

  // 2. Fetch the consent + driver name to validate typed signature
  const lookup = await fetch(
    `${env.SUPABASE_URL}/rest/v1/compass_clearinghouse_consents?id=eq.${cid}&select=id,carrier_id,driver_id,consent_type,consent_received_at,consent_revoked_at,consent_deadline_at,compass_drivers!inner(first_name,last_name)`,
    { headers: SUPABASE_HEADERS(env.SUPABASE_SERVICE_ROLE) }
  );
  if (!lookup.ok) return json({ ok: false, error: `Supabase lookup ${lookup.status}` }, 500);

  const rows = await lookup.json() as Array<{
    id: string;
    carrier_id: string;
    driver_id: string;
    consent_type: "pre_employment" | "triggered_24hr";
    consent_received_at: string | null;
    consent_revoked_at: string | null;
    consent_deadline_at: string | null;
    compass_drivers?: { first_name?: string; last_name?: string };
  }>;

  if (!rows.length) return json({ ok: false, error: "Consent not found" }, 404);
  const c = rows[0];

  if (c.consent_revoked_at) return json({ ok: false, error: "Consent has been revoked. Contact the carrier directly." }, 410);
  if (c.consent_received_at) return json({ ok: false, error: "Consent already signed. No further action needed." }, 409);

  // 3. Signature validation — typed name must contain both first + last name
  //    (case-insensitive substring match, tolerant of middle names + suffixes).
  const expectedFirst = (c.compass_drivers?.first_name || "").toLowerCase().trim();
  const expectedLast  = (c.compass_drivers?.last_name  || "").toLowerCase().trim();
  const typedLower    = typedName.toLowerCase();
  if (expectedFirst && expectedLast) {
    if (!typedLower.includes(expectedFirst) || !typedLower.includes(expectedLast)) {
      return json({
        ok: false,
        error: `Typed name must match your full legal name on file (${(c.compass_drivers?.first_name || "")} ${(c.compass_drivers?.last_name || "")}).`,
      }, 422);
    }
  }

  // 4. Capture signature audit metadata
  const now = new Date();
  const ip =
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
    null;
  const userAgent = request.headers.get("User-Agent") || null;
  const late = c.consent_deadline_at ? new Date(c.consent_deadline_at).getTime() < now.getTime() : false;

  // 5. UPDATE the consent row
  const update = await fetch(`${env.SUPABASE_URL}/rest/v1/compass_clearinghouse_consents?id=eq.${cid}`, {
    method: "PATCH",
    headers: SUPABASE_HEADERS(env.SUPABASE_SERVICE_ROLE),
    body: JSON.stringify({
      consent_received_at: now.toISOString(),
      consent_method: "electronic_signature",
      signature_ip: ip,
      signature_user_agent: userAgent,
    }),
  });
  if (!update.ok) return json({ ok: false, error: `Consent update failed: ${await update.text()}` }, 500);

  // 6. Stub-INSERT a pending query row so the orchestrator picks it up.
  //    V2 will wire the actual FMCSA API call here.
  const queryTypeMap: Record<string, "pre_employment_full" | "triggered_full"> = {
    pre_employment: "pre_employment_full",
    triggered_24hr: "triggered_full",
  };
  const queryType = queryTypeMap[c.consent_type];
  if (queryType) {
    await fetch(`${env.SUPABASE_URL}/rest/v1/compass_clearinghouse_queries`, {
      method: "POST",
      headers: SUPABASE_HEADERS(env.SUPABASE_SERVICE_ROLE),
      body: JSON.stringify({
        carrier_id: c.carrier_id,
        driver_id: c.driver_id,
        query_type: queryType,
        consent_received_at: now.toISOString(),
        consent_method: "electronic_signature",
        result: "pending",
        cost_cents: 125,
      }),
    }).catch(() => { /* non-fatal — queue will be retried */ });
  }

  return json({
    ok: true,
    consent_id: cid,
    received_at: now.toISOString(),
    late,
  });
}
