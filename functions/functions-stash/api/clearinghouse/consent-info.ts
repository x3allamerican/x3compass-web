/**
 * GET /api/clearinghouse/consent-info?cid=<consent_id>
 *
 * PUBLIC endpoint · the consent_id IS the bearer.
 * Returns the minimum info needed for the driver to confirm + e-sign.
 *
 * Response shape:
 *   {
 *     ok: true,
 *     consent: {
 *       id,
 *       consent_type,                  // 'pre_employment' | 'triggered_24hr'
 *       consent_requested_at,
 *       consent_deadline_at,           // null for pre_employment
 *       consent_received_at,           // non-null = already signed
 *       carrier_name,
 *       driver_name
 *     }
 *   }
 *   or { ok: false, error: '...' } with appropriate status (404 if not found)
 *
 * The consent_id is a UUID v4 (cryptographically infeasible to guess) so
 * we can treat it as the bearer. No additional auth is required because
 * the email link is the access vector — same model as FCRA Checkr embeds.
 *
 * No PII beyond what's already in the email is returned: no SSN, no
 * driver phone, no carrier billing info.
 */

import { type SupaEnv } from "../../_shared/supabase-admin";

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), {
    status: s,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Cache-Control": "private, no-store" },
  });

const SUPABASE_HEADERS = (sr: string) => ({
  apikey: sr,
  Authorization: `Bearer ${sr}`,
  Accept: "application/json",
});

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function onRequestGet({ request, env }: { request: Request; env: SupaEnv }): Promise<Response> {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE) {
    return json({ ok: false, error: "Supabase env vars missing" }, 500);
  }

  const url = new URL(request.url);
  const cid = url.searchParams.get("cid");
  if (!cid) return json({ ok: false, error: "Missing ?cid=<consent_id>" }, 400);

  // Light validation — must look like a UUID
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cid)) {
    return json({ ok: false, error: "Invalid consent id" }, 400);
  }

  // Fetch the consent + nested carrier + driver names
  const url1 = `${env.SUPABASE_URL}/rest/v1/compass_clearinghouse_consents?id=eq.${cid}&select=id,consent_type,consent_requested_at,consent_deadline_at,consent_received_at,consent_revoked_at,carrier_id,driver_id,carriers!inner(name),compass_drivers!inner(first_name,last_name)`;
  const res = await fetch(url1, { headers: SUPABASE_HEADERS(env.SUPABASE_SERVICE_ROLE) });
  if (!res.ok) return json({ ok: false, error: `Supabase ${res.status}` }, 500);

  const rows = await res.json() as Array<{
    id: string;
    consent_type: "pre_employment" | "triggered_24hr";
    consent_requested_at: string;
    consent_deadline_at: string | null;
    consent_received_at: string | null;
    consent_revoked_at: string | null;
    carriers?: { name?: string };
    compass_drivers?: { first_name?: string; last_name?: string };
  }>;

  if (!rows.length) return json({ ok: false, error: "Consent not found" }, 404);
  const c = rows[0];

  if (c.consent_revoked_at) {
    return json({ ok: false, error: "This consent request has been revoked. Contact the carrier directly." }, 410);
  }

  const carrier_name = c.carriers?.name || "your motor carrier";
  const driver_first = c.compass_drivers?.first_name || "";
  const driver_last  = c.compass_drivers?.last_name  || "";
  const driver_name  = [driver_first, driver_last].filter(Boolean).join(" ") || "Driver";

  return json({
    ok: true,
    consent: {
      id: c.id,
      consent_type: c.consent_type,
      consent_requested_at: c.consent_requested_at,
      consent_deadline_at: c.consent_deadline_at,
      consent_received_at: c.consent_received_at,
      carrier_name,
      driver_name,
    },
  });
}
