import { bearerFromRequest, supaFetch, verifySupabaseJwt } from "../../_shared/supabase-admin";
import { correlationId, securityError } from "../../_shared/request-security";

interface Env {
  SUPABASE_URL?: string; SUPABASE_SERVICE_ROLE?: string;
  STRIPE_SECRET_KEY?: string;
  // One graduated per-driver price (configure Stripe tiers to match src/lib/pricing.ts BANDS).
  STRIPE_PRICE_COMPASS_DRIVER?: string;
  NEXT_PUBLIC_SITE_URL?: string;
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

export function parseDriverQuantity(value: unknown): number | null {
  const quantity = typeof value === "string" && value.trim() ? Number(value) : value;
  return typeof quantity === "number"
    && Number.isSafeInteger(quantity)
    && quantity >= 1
    && quantity <= 100_000
    ? quantity
    : null;
}

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  try {
    const token = bearerFromRequest(ctx.request);
    const user = await verifySupabaseJwt(ctx.env, token);
    if (!user) return json({ ok: false, error: "Unauthorized" }, 401);

    let body: { drivers?: number; success_path?: string; cancel_path?: string };
    try { body = await ctx.request.json(); } catch { return json({ ok: false, error: "Invalid JSON" }, 400); }

    const drivers = parseDriverQuantity(body.drivers);
    if (drivers === null) return json({ ok: false, error: "drivers must be a whole number from 1 to 100000" }, 400);

    if (!ctx.env.STRIPE_SECRET_KEY || !ctx.env.STRIPE_PRICE_COMPASS_DRIVER) {
      return securityError(503, "service_unavailable", correlationId(ctx.request));
    }

    const supa = supaFetch(ctx.env);
    const rows = (await supa.select("compass_carrier_users", `user_id=eq.${user.id}&select=carrier_id,compass_carriers(id,name,stripe_customer_id,trial_ends_at)`)) as Array<{ carrier_id: string; compass_carriers: { id: string; name: string; stripe_customer_id: string | null; trial_ends_at: string | null } }>;
    if (rows.length === 0) return json({ ok: false, error: "No carrier for user" }, 400);
    const carrier = rows[0].compass_carriers;

    const site = ctx.env.NEXT_PUBLIC_SITE_URL || new URL(ctx.request.url).origin;
    const successPath = body.success_path || "/app/settings/billing?checkout=success";
    const cancelPath = body.cancel_path || "/app/settings/billing?checkout=cancel";

    const params = new URLSearchParams();
    params.set("mode", "subscription");
    params.set("success_url", `${site}${successPath}`);
    params.set("cancel_url", `${site}${cancelPath}`);
    params.set("client_reference_id", carrier.id);
    if (carrier.stripe_customer_id) params.set("customer", carrier.stripe_customer_id);
    else if (user.email) params.set("customer_email", user.email);

    // Single line item, quantity = drivers. The Stripe Price itself must be a graduated
    // tiered price mirroring src/lib/pricing.ts (50/40/30/25 bands). Every X3 product incl.
    params.append("line_items[0][price]", ctx.env.STRIPE_PRICE_COMPASS_DRIVER!);
    params.append("line_items[0][quantity]", String(drivers));
    params.append("line_items[0][adjustable_quantity][enabled]", "true");
    params.append("line_items[0][adjustable_quantity][minimum]", "1");
    params.append("line_items[0][adjustable_quantity][maximum]", "100000"); // Stripe defaults max to 99 — set high so 100+ driver fleets can check out
    if (carrier.trial_ends_at && new Date(carrier.trial_ends_at) > new Date()) {
      const trialDays = Math.ceil((new Date(carrier.trial_ends_at).getTime() - Date.now()) / 86400000);
      if (trialDays > 0) params.set("subscription_data[trial_period_days]", String(Math.min(trialDays, 7)));
    }
    params.set("metadata[carrier_id]", carrier.id);
    params.set("metadata[plan]", "compass");
    // Checkout Session metadata is not copied to the Subscription by Stripe.
    // Duplicate it so subscription events can resolve the carrier even if they
    // arrive before checkout.session.completed stores the subscription id.
    params.set("subscription_data[metadata][carrier_id]", carrier.id);
    params.set("subscription_data[metadata][plan]", "compass");
    params.set("allow_promotion_codes", "true");

    const r = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: { Authorization: `Bearer ${ctx.env.STRIPE_SECRET_KEY}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    if (!r.ok) {
      console.error("Stripe checkout request failed", { correlation_id: correlationId(ctx.request), status: r.status });
      return securityError(502, "upstream_failed", correlationId(ctx.request));
    }
    const sess = (await r.json()) as { url?: string; id?: string };
    return json({ ok: true, url: sess.url, id: sess.id });
  } catch {
    console.error("Stripe checkout request failed", { correlation_id: correlationId(ctx.request) });
    return securityError(500, "request_failed", correlationId(ctx.request));
  }
};

export const onRequestOptions: PagesFunction = async () => new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
