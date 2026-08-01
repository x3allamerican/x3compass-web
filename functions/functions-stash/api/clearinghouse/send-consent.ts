/**
 * POST /api/clearinghouse/send-consent
 *
 * Sends (or resends) an FMCSA Clearinghouse driver consent request email.
 * Two flavors:
 *   - consent_type=pre_employment:   request consent BEFORE running pre-emp full query
 *   - consent_type=triggered_24hr:   request consent AFTER limited query returned 'information'
 *                                    (24-hour FMCSA deadline applies)
 *
 * Request body:
 *   {
 *     consent_id?: string;            // optional · resend existing consent
 *     driver_id?: string;             // required when creating new consent
 *     driver_email: string;           // required · where to send the consent request
 *     consent_type: 'pre_employment' | 'triggered_24hr';
 *     limited_query_id?: string;      // optional · the limited query that triggered this
 *   }
 *
 * Response: { ok, consent_id, sent_to, sent_at, deadline_at }
 *   or       { ok: false, error }
 *
 * Auth: Bearer JWT (Supabase). The user must be a member of the carrier.
 *
 * Side effects:
 *   1. INSERT or UPDATE on public.compass_clearinghouse_consents
 *      (sets consent_requested_at = now(); for triggered_24hr also sets
 *      consent_deadline_at = now() + 24h)
 *   2. Email dispatched via Resend (graceful degrade — record still
 *      persists even if email fails)
 *
 * See: /clearinghouse-vertical-memo.md · 49 CFR §382.701(a)(2)
 */

import { bearerFromRequest, verifySupabaseJwt, type SupaEnv } from "../../_shared/supabase-admin";
import { sendEmail, type EmailEnv } from "../../_shared/emails";

interface Env extends SupaEnv, EmailEnv {
  PUBLIC_APP_URL?: string;
}

interface RequestBody {
  consent_id?: string;
  driver_id?: string;
  driver_email?: string;
  driver_name?: string;
  consent_type?: "pre_employment" | "triggered_24hr";
  limited_query_id?: string;
}

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

/* ============================================================
   Email templates
   ============================================================ */

function emailPreEmployment(opts: { driverName: string; carrierName: string; consentUrl: string }): { subject: string; html: string; text: string } {
  const subject = `Action required — driver consent for FMCSA Clearinghouse pre-employment query`;
  const text = `Hi ${opts.driverName},

${opts.carrierName} would like to run an FMCSA Clearinghouse pre-employment full query as part of your hiring process. Federal regulation 49 CFR §382.701(a) requires your electronic consent before this query can be run.

Please complete your consent at:
${opts.consentUrl}

This consent is one-time and applies only to this pre-employment query. You can review the FMCSA Clearinghouse and your own record (free) at https://clearinghouse.fmcsa.dot.gov

Questions? Reply to this email or contact ${opts.carrierName} directly.

X3 Compass · on behalf of ${opts.carrierName}`;
  const html = `<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0F172A;line-height:1.55;max-width:560px;margin:0 auto;padding:24px;">
    <h1 style="font-size:22px;font-weight:800;margin:0 0 16px;">Action required</h1>
    <p>Hi <strong>${opts.driverName}</strong>,</p>
    <p><strong>${opts.carrierName}</strong> would like to run an FMCSA Clearinghouse <strong>pre-employment full query</strong> as part of your hiring process. Federal regulation <a href="https://www.ecfr.gov/current/title-49/section-382.701" style="color:#0E7490;">49 CFR §382.701(a)</a> requires your electronic consent before this query can be run.</p>
    <p style="margin:24px 0;"><a href="${opts.consentUrl}" style="display:inline-block;background:linear-gradient(135deg,#22D3EE,#06B6D4);color:#0A1929;font-weight:800;padding:14px 28px;border-radius:10px;text-decoration:none;">Complete consent →</a></p>
    <p style="font-size:13px;color:#475569;">This consent is one-time and applies only to this pre-employment query. You can review the FMCSA Clearinghouse and your own record (free) at <a href="https://clearinghouse.fmcsa.dot.gov" style="color:#0E7490;">clearinghouse.fmcsa.dot.gov</a></p>
    <hr style="border:none;border-top:1px solid #CBD5E1;margin:24px 0;">
    <p style="font-size:12px;color:#64748B;">Questions? Reply to this email or contact ${opts.carrierName} directly.<br>X3 Compass · on behalf of ${opts.carrierName}</p>
  </body></html>`;
  return { subject, html, text };
}

function email24hrTriggered(opts: { driverName: string; carrierName: string; consentUrl: string; deadlineAt: Date }): { subject: string; html: string; text: string } {
  const deadlineStr = opts.deadlineAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
  const subject = `URGENT · 24-hour FMCSA Clearinghouse consent · deadline ${deadlineStr}`;
  const text = `Hi ${opts.driverName},

${opts.carrierName} ran an annual limited query against the FMCSA Clearinghouse and the result returned information that requires a full query. Federal regulation 49 CFR §382.701(a)(2) gives you 24 hours to provide consent.

Deadline: ${deadlineStr}

Please complete your consent at:
${opts.consentUrl}

If consent is not provided within 24 hours, federal regulation requires ${opts.carrierName} to remove you from safety-sensitive functions until the query is completed.

You can review the FMCSA Clearinghouse and your own record (free) at https://clearinghouse.fmcsa.dot.gov to see what information may be on file.

X3 Compass · on behalf of ${opts.carrierName}`;
  const html = `<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0F172A;line-height:1.55;max-width:560px;margin:0 auto;padding:24px;">
    <div style="background:#FEF3C7;border:1px solid #FBBF24;border-radius:8px;padding:10px 14px;font-size:12px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;color:#B45309;margin-bottom:16px;">⏱ 24-hour deadline</div>
    <h1 style="font-size:22px;font-weight:800;margin:0 0 16px;">Time-sensitive consent required</h1>
    <p>Hi <strong>${opts.driverName}</strong>,</p>
    <p><strong>${opts.carrierName}</strong> ran an annual limited query against the FMCSA Clearinghouse and the result returned <strong>information</strong> that requires a full query. Federal regulation <a href="https://www.ecfr.gov/current/title-49/section-382.701" style="color:#0E7490;">49 CFR §382.701(a)(2)</a> gives you <strong>24 hours</strong> to provide consent.</p>
    <p style="background:#FEF3C7;padding:12px 16px;border-radius:8px;margin:16px 0;"><strong>Deadline:</strong> ${deadlineStr}</p>
    <p style="margin:24px 0;"><a href="${opts.consentUrl}" style="display:inline-block;background:linear-gradient(135deg,#22D3EE,#06B6D4);color:#0A1929;font-weight:800;padding:14px 28px;border-radius:10px;text-decoration:none;">Complete consent →</a></p>
    <p style="font-size:13px;color:#475569;">If consent is not provided within 24 hours, federal regulation requires ${opts.carrierName} to remove you from safety-sensitive functions until the query is completed.</p>
    <p style="font-size:13px;color:#475569;">You can review the FMCSA Clearinghouse and your own record (free) at <a href="https://clearinghouse.fmcsa.dot.gov" style="color:#0E7490;">clearinghouse.fmcsa.dot.gov</a> to see what information may be on file.</p>
    <hr style="border:none;border-top:1px solid #CBD5E1;margin:24px 0;">
    <p style="font-size:12px;color:#64748B;">X3 Compass · on behalf of ${opts.carrierName}</p>
  </body></html>`;
  return { subject, html, text };
}

/* ============================================================
   Handler
   ============================================================ */

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

  // 1. Auth
  const token = bearerFromRequest(request);
  if (!token) return json({ ok: false, error: "Missing Bearer token" }, 401);
  const user = await verifySupabaseJwt(env, token);
  if (!user) return json({ ok: false, error: "Invalid token" }, 401);

  // 2. Parse body
  let body: RequestBody;
  try {
    body = await request.json() as RequestBody;
  } catch {
    return json({ ok: false, error: "Invalid JSON body" }, 400);
  }

  if (!body.driver_email || !body.consent_type) {
    return json({ ok: false, error: "driver_email + consent_type required" }, 400);
  }
  if (body.consent_type !== "pre_employment" && body.consent_type !== "triggered_24hr") {
    return json({ ok: false, error: "consent_type must be 'pre_employment' or 'triggered_24hr'" }, 400);
  }

  // 3. Resolve carrier from JWT → carrier_members
  const carrierRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/carrier_members?user_id=eq.${user.sub}&select=carrier_id,carriers(id,name)`,
    { headers: SUPABASE_HEADERS(env.SUPABASE_SERVICE_ROLE) }
  );
  const carrierRows = carrierRes.ok ? await carrierRes.json() as Array<{ carrier_id: string; carriers?: { name?: string } }> : [];
  if (!carrierRows.length) return json({ ok: false, error: "No carrier membership found for this user" }, 403);
  const carrierId = carrierRows[0].carrier_id;
  const carrierName = carrierRows[0].carriers?.name || "your motor carrier";

  // 4. Upsert the consent record
  const now = new Date();
  const deadlineAt = body.consent_type === "triggered_24hr"
    ? new Date(now.getTime() + 24 * 60 * 60 * 1000)
    : null;

  let consentId = body.consent_id;
  if (consentId) {
    // RESEND: update existing
    const upd = await fetch(`${env.SUPABASE_URL}/rest/v1/compass_clearinghouse_consents?id=eq.${consentId}&carrier_id=eq.${carrierId}`, {
      method: "PATCH",
      headers: SUPABASE_HEADERS(env.SUPABASE_SERVICE_ROLE),
      body: JSON.stringify({
        consent_requested_at: now.toISOString(),
        consent_requested_by: user.sub,
        ...(deadlineAt ? { consent_deadline_at: deadlineAt.toISOString() } : {}),
      }),
    });
    if (!upd.ok) return json({ ok: false, error: `Consent update failed: ${await upd.text()}` }, 500);
  } else {
    // NEW: insert
    if (!body.driver_id) return json({ ok: false, error: "driver_id required for new consent" }, 400);
    const ins = await fetch(`${env.SUPABASE_URL}/rest/v1/compass_clearinghouse_consents`, {
      method: "POST",
      headers: SUPABASE_HEADERS(env.SUPABASE_SERVICE_ROLE),
      body: JSON.stringify({
        carrier_id: carrierId,
        driver_id: body.driver_id,
        consent_type: body.consent_type,
        consent_requested_at: now.toISOString(),
        consent_requested_by: user.sub,
        consent_deadline_at: deadlineAt ? deadlineAt.toISOString() : null,
      }),
    });
    if (!ins.ok) return json({ ok: false, error: `Consent insert failed: ${await ins.text()}` }, 500);
    const inserted = await ins.json() as Array<{ id: string }>;
    consentId = inserted[0]?.id;
  }

  // 5. Compose + send email
  const appUrl = env.PUBLIC_APP_URL || "https://x3compass.com";
  const consentUrl = `${appUrl}/driver/clearinghouse-consent?cid=${encodeURIComponent(consentId || "")}`;
  const driverName = body.driver_name || "Driver";

  const tpl = body.consent_type === "triggered_24hr"
    ? email24hrTriggered({ driverName, carrierName, consentUrl, deadlineAt: deadlineAt! })
    : emailPreEmployment({ driverName, carrierName, consentUrl });

  const emailResult = await sendEmail(env, {
    to: body.driver_email,
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    replyTo: env.EMAIL_FROM_SUPPORT,
  });

  // 6. Respond. Note: email failure does NOT roll back the consent record —
  //    the consent_requested_at timestamp is still useful audit evidence
  //    that the carrier kicked off the workflow. Joshua / customer can
  //    resend manually if the email failed.
  return json({
    ok: true,
    consent_id: consentId,
    sent_to: body.driver_email,
    sent_at: now.toISOString(),
    deadline_at: deadlineAt?.toISOString() || null,
    email: emailResult.ok ? { delivered: true, id: emailResult.id } : { delivered: false, error: emailResult.error },
  });
}
