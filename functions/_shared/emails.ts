export interface EmailEnv {
  RESEND_API_KEY?: string;
  EMAIL_FROM_NO_REPLY?: string;
  EMAIL_FROM_SUPPORT?: string;
  NEXT_PUBLIC_SITE_URL?: string;
}

export async function sendEmail(env: EmailEnv, opts: { to: string; subject: string; html: string; text?: string; from?: string }): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!env.RESEND_API_KEY) { console.warn("[emails] RESEND_API_KEY not set"); return { ok: false, error: "RESEND_API_KEY not configured" }; }
  const from = opts.from || env.EMAIL_FROM_NO_REPLY || "no-reply@x3compass.com";
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: `X3 Compass <${from}>`, to: [opts.to], subject: opts.subject, html: opts.html, text: opts.text }),
  });
  if (!r.ok) { console.error("[emails] Resend HTTP", r.status); return { ok: false, error: `Resend HTTP ${r.status}` }; }
  const data = (await r.json()) as { id?: string };
  return { ok: true, id: data.id };
}

const BASE_STYLES = `body{font-family:-apple-system,sans-serif;background:#f5f5f5;margin:0;padding:0;color:#1f2937}.wrap{max-width:560px;margin:0 auto;padding:32px 16px}.card{background:white;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,.04)}.brand{display:inline-flex;align-items:center;gap:10px;margin-bottom:24px}.brand .mark{background:linear-gradient(135deg,#22D3EE,#06B6D4);color:#0A1929;font-weight:900;padding:8px 12px;border-radius:8px;font-size:14px}.brand .name{font-weight:800;font-size:16px;color:#0A1929}h1{font-size:22px;margin:0 0 16px;color:#0A1929}p{line-height:1.55;margin:0 0 14px}.btn{display:inline-block;background:linear-gradient(135deg,#22D3EE,#06B6D4);color:#0A1929!important;font-weight:800;padding:12px 24px;border-radius:8px;text-decoration:none}.muted{color:#6b7280;font-size:12px}.divider{height:1px;background:#e5e7eb;margin:24px 0}`;

function shell(title: string, body: string, siteUrl: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>${BASE_STYLES}</style></head><body><div class="wrap"><div class="card"><div class="brand"><span class="mark">X3</span><span class="name">X3 Compass</span></div>${body}<div class="divider"></div><p class="muted">X3 Fleet Safety LLC · <a href="${siteUrl}">x3compass.com</a></p></div></div></body></html>`;
}

export function welcomeEmail(carrierName: string, userName: string | null, siteUrl: string) {
  const greeting = userName ? `Welcome, ${userName}` : "Welcome to X3 Compass";
  const body = `<h1>${greeting} 👋</h1><p>Your 7-day trial of X3 Compass starts now for <strong>${carrierName}</strong>. No credit card required.</p><p>In the next 5 minutes you can:</p><ul><li>Add your first driver</li><li>Ask the AI Safety Director any FMCSA question</li><li>Order a Checkr background check</li></ul><p style="margin:24px 0;"><a class="btn" href="${siteUrl}/app">Open my dashboard →</a></p><p>Reply to this email with any questions — a real person reads them.</p><p>— Joshua, X3 Compass</p>`;
  return { subject: "Welcome to X3 Compass — your 7-day trial just started", html: shell("Welcome", body, siteUrl), text: `Welcome to X3 Compass! Open: ${siteUrl}/app` };
}

export function trialEndingEmail(carrierName: string, daysLeft: number, siteUrl: string) {
  const body = `<h1>Your X3 Compass trial ends in ${daysLeft} day${daysLeft === 1 ? "" : "s"}</h1><p>Your trial for <strong>${carrierName}</strong> ends soon. Add a payment method to keep your access.</p><p style="margin:24px 0;"><a class="btn" href="${siteUrl}/app/settings/billing">Add payment method →</a></p>`;
  return { subject: daysLeft <= 1 ? "Your trial ends tomorrow" : `Your trial ends in ${daysLeft} days`, html: shell("Trial ending", body, siteUrl), text: `Trial ends in ${daysLeft} days. Update: ${siteUrl}/app/settings/billing` };
}

export function paymentFailedEmail(carrierName: string, siteUrl: string) {
  const body = `<h1>Payment failed — let&apos;s fix it</h1><p>We couldn&apos;t charge your card for <strong>${carrierName}</strong>.</p><p style="margin:24px 0;"><a class="btn" href="${siteUrl}/app/settings/billing">Update payment method →</a></p>`;
  return { subject: "Payment failed — update your card to keep X3 Compass", html: shell("Payment failed", body, siteUrl), text: `Payment failed for ${carrierName}. Update: ${siteUrl}/app/settings/billing` };
}
