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
import { sendEmail, type EmailEnv } from "../../_shared/emails";

interface Env extends SupaEnv, EmailEnv {
  PUBLIC_APP_URL?: string;
}

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

  // 2. Fetch the consent + driver name + email + carrier name to validate
  //    the typed signature and to send the driver confirmation email after.
  const lookup = await fetch(
    `${env.SUPABASE_URL}/rest/v1/compass_clearinghouse_consents?id=eq.${cid}&select=id,carrier_id,driver_id,consent_type,consent_received_at,consent_revoked_at,consent_deadline_at,carriers!inner(name),compass_drivers!inner(first_name,last_name,email)`,
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
    carriers?: { name?: string };
    compass_drivers?: { first_name?: string; last_name?: string; email?: string };
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

  // 7. Send driver confirmation email (best-effort · non-fatal if it fails).
  //    Gives the driver immediate proof of what they signed, when, for whom.
  const driverEmail = c.compass_drivers?.email;
  const driverFirst = c.compass_drivers?.first_name || "Driver";
  const carrierName = c.carriers?.name || "your motor carrier";
  if (driverEmail && env.RESEND_API_KEY) {
    const queryTypeLabel = c.consent_type === "triggered_24hr" ? "triggered full" : "pre-employment full";
    const subject = `Confirmation · your FMCSA Clearinghouse consent was received`;
    const text = `Hi ${driverFirst},

This confirms ${carrierName} received your electronic consent to run an FMCSA Clearinghouse ${queryTypeLabel} query on your record.

Signed at: ${now.toUTCString()}
Consent type: ${queryTypeLabel}
Requested by: ${carrierName}

What happens next:
- ${carrierName} will run the full query through the FMCSA Clearinghouse.
- If your record is clean, no further action is needed.
- If there is information on file, ${carrierName} will follow up with you directly.

You have the right to review your own FMCSA Clearinghouse record at any time, free of charge:
https://clearinghouse.fmcsa.dot.gov

If you did NOT authorize this query or have questions, contact ${carrierName} immediately. You may also revoke consent through your carrier.

Keep this email for your records.

X3 Compass · on behalf of ${carrierName}`;
    const html = `<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0F172A;line-height:1.55;max-width:560px;margin:0 auto;padding:24px;">
      <div style="display:inline-block;background:#D1FAE5;border:1px solid #4ADE80;color:#047857;font-size:11px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;padding:5px 12px;border-radius:999px;margin-bottom:16px;">✓ Consent received</div>
      <h1 style="font-size:22px;font-weight:800;margin:0 0 16px;">Your consent was received</h1>
      <p>Hi <strong>${driverFirst}</strong>,</p>
      <p>This confirms <strong>${carrierName}</strong> received your electronic consent to run an FMCSA Clearinghouse <strong>${queryTypeLabel}</strong> query on your record.</p>
      <table style="width:100%;margin:18px 0;border-collapse:collapse;font-size:13px;">
        <tr><td style="padding:6px 0;color:#475569;width:140px;">Signed at</td><td style="padding:6px 0;color:#0F172A;font-weight:600;">${now.toLocaleString("en-US",{dateStyle:"long",timeStyle:"short"})}</td></tr>
        <tr><td style="padding:6px 0;color:#475569;">Consent type</td><td style="padding:6px 0;color:#0F172A;font-weight:600;">${queryTypeLabel}</td></tr>
        <tr><td style="padding:6px 0;color:#475569;">Requested by</td><td style="padding:6px 0;color:#0F172A;font-weight:600;">${carrierName}</td></tr>
      </table>
      <h3 style="font-size:14px;font-weight:800;margin:20px 0 8px;">What happens next</h3>
      <ol style="margin:0 0 16px 18px;padding:0;font-size:13px;color:#334155;line-height:1.6;">
        <li>${carrierName} runs the full query through the FMCSA Clearinghouse.</li>
        <li>If your record is clean, no further action is needed.</li>
        <li>If there is information on file, ${carrierName} will follow up with you directly.</li>
      </ol>
      <p style="background:#F1F5F9;border-left:3px solid #0E7490;padding:10px 14px;margin:18px 0;border-radius:4px;font-size:12.5px;line-height:1.55;">
        <strong>Review your own record (free):</strong><br>
        <a href="https://clearinghouse.fmcsa.dot.gov" style="color:#0E7490;">clearinghouse.fmcsa.dot.gov</a>
      </p>
      <p style="font-size:12px;color:#64748B;">If you did NOT authorize this query, contact ${carrierName} immediately. Keep this email for your records.</p>
      <hr style="border:none;border-top:1px solid #CBD5E1;margin:24px 0;">
      <p style="font-size:11px;color:#94A3B8;">X3 Compass · on behalf of ${carrierName} · 49 CFR §382.711 retention applies</p>
    </body></html>`;

    // Fire and forget · non-fatal
    sendEmail(env, {
      to: driverEmail,
      subject,
      html,
      text,
      replyTo: env.EMAIL_FROM_SUPPORT,
    }).catch(() => { /* swallow · audit row already persisted */ });
  }

  return json({
    ok: true,
    consent_id: cid,
    received_at: now.toISOString(),
    late,
    driver_email_sent: !!(driverEmail && env.RESEND_API_KEY),
  });
}
