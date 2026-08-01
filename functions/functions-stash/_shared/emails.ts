/**
 * Email helpers — send transactional emails via Resend API.
 * Requires RESEND_API_KEY env var.
 */
export interface EmailEnv {
  RESEND_API_KEY?: string;
  EMAIL_FROM_NO_REPLY?: string;
  EMAIL_FROM_SUPPORT?: string;
}

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

export interface SendEmailResult {
  ok: boolean;
  id?: string;
  error?: string;
}

export async function sendEmail(env: EmailEnv, params: SendEmailParams): Promise<SendEmailResult> {
  if (!env.RESEND_API_KEY) return { ok: false, error: "RESEND_API_KEY not set" };
  const from = params.from || env.EMAIL_FROM_NO_REPLY || "no-reply@x3compass.com";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: Array.isArray(params.to) ? params.to : [params.to],
        subject: params.subject,
        html: params.html,
        text: params.text,
        reply_to: params.replyTo,
        cc: params.cc,
        bcc: params.bcc,
      }),
    });
    if (!res.ok) return { ok: false, error: `Resend ${res.status}: ${await res.text()}` };
    const data = await res.json() as { id?: string };
    return { ok: true, id: data.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
