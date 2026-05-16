import { supaFetch } from "../../_shared/supabase-admin";
import { paymentFailedEmail, sendEmail } from "../../_shared/emails";

interface Env {
  SUPABASE_URL?: string; SUPABASE_SERVICE_ROLE?: string;
  STRIPE_SECRET_KEY?: string; STRIPE_WEBHOOK_SECRET?: string;
  RESEND_API_KEY?: string; EMAIL_FROM_NO_REPLY?: string;
  NEXT_PUBLIC_SITE_URL?: string;
}

const json = (d: unknown, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { "Content-Type": "application/json" } });

interface StripeEvent { id: string; type: string; data: { object: Record<string, unknown> }; }

async function verifyStripeSignature(payload: string, sigHeader: string, secret: string): Promise<boolean> {
  const parts = sigHeader.split(",");
  const timestamp = parts.find((p) => p.startsWith("t="))?.slice(2);
  const v1Sig = parts.find((p) => p.startsWith("v1="))?.slice(3);
  if (!timestamp || !v1Sig) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const signedPayload = `${timestamp}.${payload}`;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(signedPayload));
  const hex = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
  if (hex.length !== v1Sig.length) return false;
  let diff = 0;
  for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ v1Sig.charCodeAt(i);
  return diff === 0;
}

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const rawBody = await ctx.request.text();
  const sig = ctx.request.headers.get("Stripe-Signature") || "";
  if (!ctx.env.STRIPE_WEBHOOK_SECRET) return json({ ok: false, error: "Webhook secret not configured" }, 500);
  const verified = await verifyStripeSignature(rawBody, sig, ctx.env.STRIPE_WEBHOOK_SECRET);
  if (!verified) return json({ ok: false, error: "Invalid signature" }, 401);

  let event: StripeEvent;
  try { event = JSON.parse(rawBody) as StripeEvent; } catch { return json({ ok: false, error: "Invalid JSON" }, 400); }

  const supa = supaFetch(ctx.env);
  try { await supa.insert("compass_stripe_events", { id: event.id, type: event.type, payload: event }, "minimal"); }
  catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("409") || msg.includes("duplicate")) return json({ ok: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const sess = event.data.object;
        const carrierId = (sess.client_reference_id as string) || (sess.metadata as Record<string, string>)?.carrier_id;
        const customer = sess.customer as string;
        const subscription = sess.subscription as string;
        if (carrierId && customer && subscription) {
          await supa.update("compass_carriers", `id=eq.${carrierId}`, { stripe_customer_id: customer, stripe_subscription_id: subscription, subscription_status: "active" });
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const subId = sub.id as string;
        const status = sub.status as string;
        const currentPeriodEnd = sub.current_period_end ? new Date(((sub.current_period_end as number) || 0) * 1000).toISOString() : null;
        const planMeta = (sub.metadata as Record<string, string>)?.plan;
        const carrierMeta = (sub.metadata as Record<string, string>)?.carrier_id;
        const query = carrierMeta ? `id=eq.${carrierMeta}` : `stripe_subscription_id=eq.${subId}`;
        const updates: Record<string, unknown> = { subscription_status: status, current_period_end: currentPeriodEnd, stripe_subscription_id: subId };
        if (planMeta) updates.service_tier = planMeta;
        await supa.update("compass_carriers", query, updates);
        break;
      }
      case "invoice.payment_failed": {
        const inv = event.data.object;
        const customer = inv.customer as string;
        await supa.update("compass_carriers", `stripe_customer_id=eq.${customer}`, { subscription_status: "past_due" });
        if (ctx.env.RESEND_API_KEY) {
          const carriers = (await supa.select("compass_carriers", `stripe_customer_id=eq.${customer}&select=name,primary_contact_email`)) as Array<{ name: string; primary_contact_email: string | null }>;
          const c = carriers[0];
          if (c?.primary_contact_email) {
            const site = ctx.env.NEXT_PUBLIC_SITE_URL || "https://x3compass.com";
            const tpl = paymentFailedEmail(c.name, site);
            await sendEmail(ctx.env, { to: c.primary_contact_email, subject: tpl.subject, html: tpl.html, text: tpl.text });
          }
        }
        break;
      }
      case "invoice.payment_succeeded": {
        const inv = event.data.object;
        const customer = inv.customer as string;
        await supa.update("compass_carriers", `stripe_customer_id=eq.${customer}`, { subscription_status: "active" });
        break;
      }
    }
    await supa.update("compass_stripe_events", `id=eq.${encodeURIComponent(event.id)}`, { processed_at: new Date().toISOString() });
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) }, 500);
  }
};
