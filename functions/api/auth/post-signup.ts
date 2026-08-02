import { bearerFromRequest, supaFetch, verifySupabaseJwt } from "../../_shared/supabase-admin";
import { rateLimit } from "../../_shared/rate-limit";
import { sendEmail, welcomeEmail } from "../../_shared/emails";
import { correlationId, securityError } from "../../_shared/request-security";

interface Env {
  SUPABASE_URL?: string; SUPABASE_SERVICE_ROLE?: string;
  STRIPE_SECRET_KEY?: string;
  RESEND_API_KEY?: string; EMAIL_FROM_NO_REPLY?: string; EMAIL_FROM_SUPPORT?: string;
  NEXT_PUBLIC_SITE_URL?: string;
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  // Master try/catch — guarantees JSON response even if something unexpected throws.
  try {
    const _rl = rateLimit(ctx.request, { key: "post-signup", max: 10, windowSec: 60 });
    if (_rl) return _rl;
    const token = bearerFromRequest(ctx.request);
    const user = await verifySupabaseJwt(ctx.env, token);
    if (!user) return json({ ok: false, error: "Unauthorized" }, 401);

    let body: { carrier_name?: string; usdot_number?: string; plan?: string };
    try { body = await ctx.request.json(); } catch { return json({ ok: false, error: "Invalid JSON" }, 400); }

    const carrierName = (body.carrier_name || "").trim();
    if (!carrierName) return json({ ok: false, error: "carrier_name required" }, 400);
    // Single plan — DIY/DFY retired 2026-07-31.
    const usdot = (body.usdot_number || "").trim() || null;
    const supa = supaFetch(ctx.env);

    // Idempotency — if user already linked to a carrier, return that carrier
    const existing = (await supa.select(
      "compass_carrier_users",
      `user_id=eq.${user.id}&select=carrier_id,compass_carriers(id,name,stripe_customer_id)`
    )) as Array<{ carrier_id: string; compass_carriers?: { id: string; name: string; stripe_customer_id: string | null } }>;
    if (existing.length > 0) return json({ ok: true, carrier_id: existing[0].carrier_id, already_existed: true });

    // Create carrier
    const carrierRows = (await supa.insert("compass_carriers", {
      name: carrierName,
      usdot_number: usdot,
      service_tier: "compass",
      primary_contact_email: user.email || null,
      subscription_status: "trialing",
      trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })) as Array<{ id: string; name: string }>;
    const carrier = carrierRows[0];

    // Link user to carrier as owner
    try {
      await supa.insert("compass_carrier_users", { carrier_id: carrier.id, user_id: user.id, role: "owner" }, "minimal");
    } catch (err) {
      console.error("[post-signup] carrier_users insert failed:", err);
    }

    // Stripe customer create (best-effort)
    let stripeCustomerId: string | null = null;
    if (ctx.env.STRIPE_SECRET_KEY) {
      try {
        const r = await fetch("https://api.stripe.com/v1/customers", {
          method: "POST",
          headers: { Authorization: `Bearer ${ctx.env.STRIPE_SECRET_KEY}`, "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            email: user.email || "", name: carrierName,
            "metadata[carrier_id]": carrier.id,
            "metadata[plan]": "compass",
            "metadata[usdot_number]": usdot || "",
          }).toString(),
        });
        if (r.ok) {
          const c = (await r.json()) as { id?: string };
          stripeCustomerId = c.id || null;
          if (stripeCustomerId) {
            try { await supa.update("compass_carriers", `id=eq.${carrier.id}`, { stripe_customer_id: stripeCustomerId }); }
            catch (err) { console.error("[post-signup] carriers update failed:", err); }
          }
        } else {
          console.error("[post-signup] Stripe customer create failed:", r.status, await r.text());
        }
      } catch (err) {
        console.error("[post-signup] Stripe error:", err);
      }
    }

    // Welcome email (best-effort, fire-and-forget so it cannot break the response)
    if (ctx.env.RESEND_API_KEY && user.email) {
      const site = ctx.env.NEXT_PUBLIC_SITE_URL || "https://x3compass.com";
      try {
        const tpl = welcomeEmail(carrierName, null, site);
        // ctx.waitUntil lets the email send continue after we return — avoids blocking + avoids
        // any throw from sendEmail propagating into our response path
        const p = sendEmail(ctx.env, { to: user.email, subject: tpl.subject, html: tpl.html, text: tpl.text })
          .catch((err) => console.error("[post-signup] welcome email failed:", err));
        ctx.waitUntil(p);
      } catch (err) {
        console.error("[post-signup] welcome email template failed:", err);
      }
    }

    return json({ ok: true, carrier_id: carrier.id, stripe_customer_id: stripeCustomerId, plan });
  } catch (err) {
    console.error("[post-signup] unexpected error:", err);
    return securityError(500, "request_failed", correlationId(ctx.request));
  }
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
