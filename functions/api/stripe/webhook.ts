import { supaFetch } from "../../_shared/supabase-admin";
import { paymentFailedEmail, sendEmail } from "../../_shared/emails";
import { correlationId, isUuid, securityError } from "../../_shared/request-security";

interface Env {
  SUPABASE_URL?: string; SUPABASE_SERVICE_ROLE?: string;
  STRIPE_SECRET_KEY?: string; STRIPE_WEBHOOK_SECRET?: string;
  RESEND_API_KEY?: string; EMAIL_FROM_NO_REPLY?: string;
  NEXT_PUBLIC_SITE_URL?: string;
}

const json = (d: unknown, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { "Content-Type": "application/json" } });

interface StripeEvent { id: string; type: string; data: { object: Record<string, unknown> }; }

interface StripeEventStore {
  insert(table: string, row: Record<string, unknown>, returning?: string): Promise<unknown[]>;
  select(table: string, query: string): Promise<unknown[]>;
}

export async function reserveStripeEvent(store: StripeEventStore, event: StripeEvent): Promise<"new" | "retry" | "processed"> {
  try {
    await store.insert("compass_stripe_events", { id: event.id, type: event.type, payload: event }, "minimal");
    return "new";
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes("409") && !message.toLowerCase().includes("duplicate")) throw error;
    const rows = await store.select(
      "compass_stripe_events",
      `id=eq.${encodeURIComponent(event.id)}&select=processed_at`,
    ) as Array<{ processed_at?: string | null }>;
    if (rows.length === 0) throw error;
    return rows[0].processed_at ? "processed" : "retry";
  }
}

export async function verifyStripeSignature(payload: string, sigHeader: string, secret: string, now = Date.now() / 1000): Promise<boolean> {
  const parts = sigHeader.split(",");
  const timestamp = parts.find((p) => p.startsWith("t="))?.slice(2);
  const v1Sig = parts.find((p) => p.startsWith("v1="))?.slice(3);
  if (!timestamp || !v1Sig) return false;
  if (!Number.isFinite(Number(timestamp)) || Math.abs(now - Number(timestamp)) > 300) return false;
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
  const requestId = correlationId(ctx.request);
  const rawBody = await ctx.request.text();
  const sig = ctx.request.headers.get("Stripe-Signature") || "";
  if (!ctx.env.STRIPE_WEBHOOK_SECRET) return securityError(503, "service_unavailable", requestId);
  const verified = await verifyStripeSignature(rawBody, sig, ctx.env.STRIPE_WEBHOOK_SECRET);
  if (!verified) return securityError(401, "invalid_signature", requestId);

  let event: StripeEvent;
  try { event = JSON.parse(rawBody) as StripeEvent; } catch { return json({ ok: false, error: "Invalid JSON" }, 400); }

  const supa = supaFetch(ctx.env);
  try {
    const reservation = await reserveStripeEvent(supa, event);
    if (reservation === "processed") return json({ ok: true, duplicate: true });
  } catch {
    return securityError(500, "request_failed", requestId);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const sess = event.data.object;
        const carrierId = (sess.client_reference_id as string) || (sess.metadata as Record<string, string>)?.carrier_id;
        const customer = sess.customer as string;
        const subscription = sess.subscription as string;
        if (carrierId && !isUuid(carrierId)) return securityError(400, "invalid_event", requestId);
        if (carrierId && customer && subscription) {
          await supa.update("compass_carriers", `id=eq.${encodeURIComponent(carrierId)}`, { stripe_customer_id: customer, stripe_subscription_id: subscription, subscription_status: "active" });
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
        // Single plan — service_tier is always "compass" now.
        const carrierMeta = (sub.metadata as Record<string, string>)?.carrier_id;
        if (carrierMeta && !isUuid(carrierMeta)) return securityError(400, "invalid_event", requestId);
        const query = carrierMeta ? `id=eq.${encodeURIComponent(carrierMeta)}` : `stripe_subscription_id=eq.${encodeURIComponent(subId)}`;
        const updates: Record<string, unknown> = { subscription_status: status, current_period_end: currentPeriodEnd, stripe_subscription_id: subId };
        updates.service_tier = "compass";
        await supa.update("compass_carriers", query, updates);
        break;
      }
      case "invoice.payment_failed": {
        const inv = event.data.object;
        const customer = inv.customer as string;
        await supa.update("compass_carriers", `stripe_customer_id=eq.${encodeURIComponent(customer)}`, { subscription_status: "past_due" });
        if (ctx.env.RESEND_API_KEY) {
          const carriers = (await supa.select("compass_carriers", `stripe_customer_id=eq.${encodeURIComponent(customer)}&select=name,primary_contact_email`)) as Array<{ name: string; primary_contact_email: string | null }>;
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
        await supa.update("compass_carriers", `stripe_customer_id=eq.${encodeURIComponent(customer)}`, { subscription_status: "active" });
        break;
      }
    }
    await supa.update("compass_stripe_events", `id=eq.${encodeURIComponent(event.id)}`, { processed_at: new Date().toISOString() });
    return json({ ok: true });
  } catch {
    return securityError(500, "request_failed", requestId);
  }
};
