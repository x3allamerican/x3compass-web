/**
 * POST /api/clearinghouse/revoke-consent
 *
 * Carrier admin cancels a pending consent request. Driver landing page
 * will then show "consent revoked, contact carrier" instead of the form.
 *
 * Request body: { consent_id, reason? }
 * Response:     { ok, consent_id, revoked_at }
 *               or { ok: false, error }
 *
 * Auth: Bearer JWT (Supabase). User must be a member of the carrier.
 *
 * Side effects:
 *   1. UPDATE compass_clearinghouse_consents
 *      sets consent_revoked_at = now()
 *      sets revocation_reason = body.reason (optional)
 *
 * Use cases:
 *   - Carrier emailed wrong driver
 *   - Driver withdrew from hiring process
 *   - Carrier needs to re-issue consent with corrected info
 *
 * Note: this does NOT delete the row · the audit trail (the original
 * request timestamp + requester) is preserved for 49 CFR §382.711
 * 3-year retention.
 */

import { bearerFromRequest, verifySupabaseJwt, type SupaEnv } from "../../_shared/supabase-admin";

interface Env extends SupaEnv {}

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), {
    status: s,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
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

  let body: { consent_id?: string; reason?: string };
  try { body = await request.json() as typeof body; }
  catch { return json({ ok: false, error: "Invalid JSON body" }, 400); }
  if (!body.consent_id) return json({ ok: false, error: "consent_id required" }, 400);

  // Fetch + verify carrier membership
  const lookup = await fetch(
    `${env.SUPABASE_URL}/rest/v1/compass_clearinghouse_consents?id=eq.${body.consent_id}&select=id,carrier_id,consent_received_at,consent_revoked_at`,
    { headers: SUPABASE_HEADERS(env.SUPABASE_SERVICE_ROLE) }
  );
  if (!lookup.ok) return json({ ok: false, error: `Supabase lookup ${lookup.status}` }, 500);
  const rows = await lookup.json() as Array<{ id: string; carrier_id: string; consent_received_at: string | null; consent_revoked_at: string | null }>;
  if (!rows.length) return json({ ok: false, error: "Consent not found" }, 404);
  const c = rows[0];
  if (c.consent_revoked_at) return json({ ok: false, error: "Consent already revoked" }, 409);
  if (c.consent_received_at) return json({ ok: false, error: "Consent already signed; cannot revoke after signing" }, 409);

  const memberCheck = await fetch(
    `${env.SUPABASE_URL}/rest/v1/carrier_members?user_id=eq.${user.sub}&carrier_id=eq.${c.carrier_id}&select=carrier_id`,
    { headers: SUPABASE_HEADERS(env.SUPABASE_SERVICE_ROLE) }
  );
  const members = memberCheck.ok ? await memberCheck.json() as unknown[] : [];
  if (!members.length) return json({ ok: false, error: "Not a member of this carrier" }, 403);

  // Revoke
  const now = new Date();
  const update = await fetch(
    `${env.SUPABASE_URL}/rest/v1/compass_clearinghouse_consents?id=eq.${body.consent_id}`,
    {
      method: "PATCH",
      headers: SUPABASE_HEADERS(env.SUPABASE_SERVICE_ROLE),
      body: JSON.stringify({
        consent_revoked_at: now.toISOString(),
        revocation_reason: (body.reason || "").trim() || null,
      }),
    }
  );
  if (!update.ok) return json({ ok: false, error: `Revoke failed: ${await update.text()}` }, 500);

  return json({ ok: true, consent_id: body.consent_id, revoked_at: now.toISOString() });
}
