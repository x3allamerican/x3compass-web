import { bearerFromRequest, supaFetch, verifySupabaseJwt } from "../../_shared/supabase-admin";
import { sendEmail, welcomeEmail } from "../../_shared/emails";

interface Env {
  SUPABASE_URL?: string; SUPABASE_SERVICE_ROLE?: string;
  STRIPE_SECRET_KEY?: string;
  RESEND_API_KEY?: string; EMAIL_FROM_NO_REPLY?: string; EMAIL_FROM_SUPPORT?: string;
  NEXT_PUBLIC_SITE_URL?: string;
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const token = bearerFromRequest(ctx.request);
  const user = await verifySupabaseJwt(ctx.env, token);
  if (!user) return json({ ok: false, error: "Unauthorized" }, 401);

  let body: { carrier_name?: string; usdot_number?: string; plan?: string };
  try { body = await ctx.request.json(); } catch { return json({ ok: false, error: "Invalid JSON" }, 400); }

  const carrierName = (body.carrier_name || "").trim();
  if (!carrierName) return json({ ok: false, error: "carrier_name required" }, 400);
  const plan = (body.plan || "diy").toLowerCase();
  const usdot = (body.usdot_number || "").trim() || null;
  const supa = supaFetch(ctx.env);

  const existing = (await supa.select("carrier_users", `user_id=eq.${user.id}&select=carrier_id,carriers(id,name,stripe_customer_id)`)) as Array<{ carrier_id: string; carriers?: { id: string; name: string; stripe_customer_id: string | null } }>;
  if (existing.length > 0) return json({ ok: true, carrier_id: existing[0].carrier_id, already_existed: true });

  const carrierRows = (await supa.insert("carriers", {
    name: carrierName, usdot_number: usdot,
    service_tier: plan === "dfy" ? "dfy" : plan === "enterprise" ? "enterprise" : "diy",
    primary_contact_email: user.email || null,
    subscription_status: "trialing",
    trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  })) as Array<{ id: string; name: string }>;
  const carrier = carrierRows[0];
  await supa.insert("carrier_users", { carrier_id: carrier.id, user_id: user.id, role: "owner" }, "minimal");

  let stripeCustomerId: string | null = null;
  if (ctx.env.STRIPE_SECRET_KEY) {
    try {
      const r = await fetch("https://api.stripe.com/v1/customers", {
        method: "POST",
        headers: { Authorization: `Bearer ${ctx.env.STRIPE_SECRET_KEY}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ email: user.email || "", name: carrierName, "metadata[carrier_id]": carrier.id, "metadata[plan]": plan, "metadata[usdot_number]": usdot || "" }).toString(),
      });
      if (r.ok) {
        const c = (await r.json()) as { id?: string };
        stripeCustomerId = c.id || null;
        if (stripeCustomerId) await supa.update("carriers", `id=eq.${carrier.id}`, { stripe_customer_id: stripeCustomerId });
      } else { console.error("[post-signup] Stripe customer create failed:", r.status); }
    } catch (err) { console.error("[post-signup] Stripe error:", err); }
  }

  if (ctx.env.RESEND_API_KEY && user.email) {
    const site = ctx.env.NEXT_PUBLIC_SITE_URL || "https://x3compass.com";
    const tpl = welcomeEmail(carrierName, null, site);
    try { await sendEmail(ctx.env, { to: user.email, subject: tpl.subject, html: tpl.html, text: tpl.text }); }
    catch (err) { console.error("[post-signup] welcome email failed:", err); }
  }

  return json({ ok: true, carrier_id: carrier.id, stripe_customer_id: stripeCustomerId, plan });
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization" } });
