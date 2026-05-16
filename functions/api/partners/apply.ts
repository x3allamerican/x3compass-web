/**
 * POST /api/partners/apply
 *
 * Cloudflare Pages Function that receives Partner application form submissions.
 *  - Validates input
 *  - Sends notification email to partners@x3compass.com via Resend
 *  - Writes the application to Supabase (table: partner_applications)
 *  - Returns { ok: true } on success
 *
 * Required Pages env vars:
 *  - RESEND_API_KEY        — Resend API key
 *  - SUPABASE_URL          — e.g., https://your-project.supabase.co
 *  - SUPABASE_SERVICE_ROLE — Supabase service-role key
 *
 * Optional:
 *  - PARTNERS_NOTIFY_EMAIL — defaults to partners@x3compass.com
 *  - PARTNERS_FROM_EMAIL   — defaults to noreply@x3compass.com (must be verified on Resend)
 */

interface Env {
  RESEND_API_KEY: string;
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE?: string;
  PARTNERS_NOTIFY_EMAIL?: string;
  PARTNERS_FROM_EMAIL?: string;
}

type Submission = {
  name: string;
  email: string;
  phone?: string;
  linkedin?: string;
  company: string;
  state: string;
  years?: string;
  clients?: string;
  services: string;
  fee?: string;
  why: string;
  tools?: string;
  timeline?: string;
  credentials?: string;
  reference?: string;
};

const REQUIRED = ["name", "email", "company", "state", "services", "why"] as const;

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  let body: Partial<Submission>;
  try {
    body = await ctx.request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...cors },
    });
  }

  // Validate required fields
  for (const f of REQUIRED) {
    if (!body[f] || String(body[f]).trim().length === 0) {
      return new Response(
        JSON.stringify({ ok: false, error: `Missing required field: ${f}` }),
        { status: 400, headers: { "Content-Type": "application/json", ...cors } }
      );
    }
  }

  // Basic email sanity check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email!)) {
    return new Response(JSON.stringify({ ok: false, error: "Invalid email" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...cors },
    });
  }

  const submission = body as Submission;
  const now = new Date().toISOString();
  const notifyTo = ctx.env.PARTNERS_NOTIFY_EMAIL || "partners@x3compass.com";
  const fromAddr = ctx.env.PARTNERS_FROM_EMAIL || "Compass Partner Applications <noreply@x3compass.com>";

  // === Send notification email via Resend ===
  let emailOk = false;
  let emailId: string | null = null;
  let emailError: string | null = null;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ctx.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddr,
        to: [notifyTo],
        reply_to: submission.email,
        subject: `New Partner application · ${submission.name} (${submission.company})`,
        html: renderEmailHtml(submission, now),
        text: renderEmailText(submission, now),
      }),
    });
    const j = await r.json() as { id?: string; message?: string };
    if (r.ok && j.id) {
      emailOk = true;
      emailId = j.id;
    } else {
      emailError = j.message || `Resend HTTP ${r.status}`;
    }
  } catch (err: unknown) {
    emailError = err instanceof Error ? err.message : "unknown email error";
  }

  // === Write to Supabase (best-effort) ===
  let supabaseOk = false;
  let supabaseError: string | null = null;
  if (ctx.env.SUPABASE_URL && ctx.env.SUPABASE_SERVICE_ROLE) {
    try {
      const r = await fetch(`${ctx.env.SUPABASE_URL}/rest/v1/partner_applications`, {
        method: "POST",
        headers: {
          apikey: ctx.env.SUPABASE_SERVICE_ROLE,
          Authorization: `Bearer ${ctx.env.SUPABASE_SERVICE_ROLE}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          submitted_at: now,
          name: submission.name,
          email: submission.email,
          phone: submission.phone ?? null,
          linkedin: submission.linkedin ?? null,
          company: submission.company,
          state: submission.state,
          years: submission.years ?? null,
          client_count: submission.clients ?? null,
          services: submission.services,
          fee_range: submission.fee ?? null,
          why_compass: submission.why,
          current_tools: submission.tools ?? null,
          timeline: submission.timeline ?? null,
          credentials: submission.credentials ?? null,
          reference_carrier: submission.reference ?? null,
          email_id: emailId,
        }),
      });
      if (r.ok) supabaseOk = true;
      else supabaseError = `Supabase HTTP ${r.status}: ${await r.text()}`;
    } catch (err: unknown) {
      supabaseError = err instanceof Error ? err.message : "unknown supabase error";
    }
  }

  // Email-or-DB failure is logged but doesn't fail the user request unless both fail
  if (!emailOk && !supabaseOk) {
    return new Response(
      JSON.stringify({ ok: false, error: "All delivery channels failed", emailError, supabaseError }),
      { status: 500, headers: { "Content-Type": "application/json", ...cors } }
    );
  }

  return new Response(
    JSON.stringify({ ok: true, emailSent: emailOk, dbWritten: supabaseOk }),
    { status: 200, headers: { "Content-Type": "application/json", ...cors } }
  );
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
};

// === HTML email body ===
function renderEmailHtml(s: Submission, now: string): string {
  const esc = (v?: string) =>
    (v ?? "—").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<!doctype html>
<html><body style="font-family: system-ui, -apple-system, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; color: #0A1929;">
<div style="background: linear-gradient(135deg, #22D3EE, #06B6D4); color: #0A1929; padding: 18px 22px; border-radius: 12px; margin-bottom: 20px;">
  <div style="font-size: 11px; font-weight: 800; letter-spacing: 3px; text-transform: uppercase; opacity: 0.7;">COMPASS PARTNER · NEW APPLICATION</div>
  <h1 style="margin: 6px 0 0 0; font-size: 22px;">${esc(s.name)}</h1>
  <div style="opacity: 0.85; font-size: 14px;">${esc(s.company)} · ${esc(s.state)}</div>
</div>
<table style="width: 100%; border-collapse: collapse; font-size: 14px;">
  <tr><td style="padding: 8px; color: #555; width: 180px;">Email</td><td style="padding: 8px;"><a href="mailto:${esc(s.email)}">${esc(s.email)}</a></td></tr>
  <tr style="background: #f5f7fa;"><td style="padding: 8px; color: #555;">Phone</td><td style="padding: 8px;">${esc(s.phone)}</td></tr>
  <tr><td style="padding: 8px; color: #555;">LinkedIn</td><td style="padding: 8px;">${s.linkedin ? `<a href="${esc(s.linkedin)}">${esc(s.linkedin)}</a>` : "—"}</td></tr>
  <tr style="background: #f5f7fa;"><td style="padding: 8px; color: #555;">Years in business</td><td style="padding: 8px;">${esc(s.years)}</td></tr>
  <tr><td style="padding: 8px; color: #555;">Current carrier clients</td><td style="padding: 8px;">${esc(s.clients)}</td></tr>
  <tr style="background: #f5f7fa;"><td style="padding: 8px; color: #555;">Services offered</td><td style="padding: 8px;">${esc(s.services)}</td></tr>
  <tr><td style="padding: 8px; color: #555;">Typical monthly fee</td><td style="padding: 8px;">${esc(s.fee)}</td></tr>
  <tr style="background: #f5f7fa;"><td style="padding: 8px; color: #555;">Onboarding timeline</td><td style="padding: 8px;">${esc(s.timeline)}</td></tr>
</table>
<h3 style="margin-top: 22px; font-size: 15px; color: #06B6D4;">Why Compass Partner</h3>
<p style="font-size: 14px; background: #f5f7fa; padding: 12px; border-radius: 8px;">${esc(s.why).replace(/\n/g, "<br>")}</p>
${s.tools ? `<h3 style="font-size: 15px; color: #06B6D4;">Current tools</h3><p style="font-size: 14px; background: #f5f7fa; padding: 12px; border-radius: 8px;">${esc(s.tools).replace(/\n/g, "<br>")}</p>` : ""}
${s.credentials ? `<h3 style="font-size: 15px; color: #06B6D4;">Credentials</h3><p style="font-size: 14px; background: #f5f7fa; padding: 12px; border-radius: 8px;">${esc(s.credentials).replace(/\n/g, "<br>")}</p>` : ""}
${s.reference ? `<h3 style="font-size: 15px; color: #06B6D4;">Reference carrier</h3><p style="font-size: 14px; background: #f5f7fa; padding: 12px; border-radius: 8px;">${esc(s.reference).replace(/\n/g, "<br>")}</p>` : ""}
<p style="font-size: 11px; color: #888; margin-top: 30px; padding-top: 16px; border-top: 1px solid #ddd;">
  Submitted ${esc(now)} from the Compass Partner application form (x3compass.com/partners/apply).
  Reply to this email to respond directly to the applicant.
</p>
</body></html>`;
}

function renderEmailText(s: Submission, now: string): string {
  return `COMPASS PARTNER — New Application

Name: ${s.name}
Company: ${s.company} (${s.state})
Email: ${s.email}
Phone: ${s.phone ?? "—"}
LinkedIn: ${s.linkedin ?? "—"}

Years in business: ${s.years ?? "—"}
Carrier clients: ${s.clients ?? "—"}
Services: ${s.services}
Typical fee: ${s.fee ?? "—"}
Onboarding timeline: ${s.timeline ?? "—"}

Why Compass Partner:
${s.why}

${s.tools ? `Current tools:\n${s.tools}\n\n` : ""}${s.credentials ? `Credentials:\n${s.credentials}\n\n` : ""}${s.reference ? `Reference carrier:\n${s.reference}\n\n` : ""}---
Submitted ${now} from x3compass.com/partners/apply
Reply to this email to respond to the applicant.`;
}
