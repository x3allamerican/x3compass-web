import { bearerFromRequest, supaFetch, verifySupabaseJwt } from "../../_shared/supabase-admin";

interface Env {
  SUPABASE_URL?: string; SUPABASE_SERVICE_ROLE?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_PRICE_DIY_DRIVER?: string; STRIPE_PRICE_DFY_DRIVER?: string; STRIPE_PRICE_HAZMAT_ADDON?: string;
  NEXT_PUBLIC_SITE_URL?: string;
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const token = bearerFromRequest(ctx.request);
  const user = await verifySupabaseJwt(ctx.env, token);
  if (!user) return json({ ok: false, error: "Unauthorized" }, 401);

  let body: { plan?: string; drivers?: number; hazmat?: boolean; success_path?: string; cancel_path?: string };
  try { body = await ctx.request.json(); } catch { return json({ ok: false, error: "Invalid JSON" }, 400); }

  const plan = (body.plan || "diy").toLowerCase();
  const drivers = Math.max(1, Math.floor(Number(body.drivers || 1)));
  const hazmat = !!body.hazmat;

  if (!ctx.env.STRIPE_SECRET_KEY) return json({ ok: false, error: "Stripe not configured" }, 500);
  if (plan === "diy" && !ctx.env.STRIPE_PRICE_DIY_DRIVER) return json({ ok: false, error: "DIY price not configured" }, 500);
  if (plan === "dfy" && !ctx.env.STRIPE_PRICE_DFY_DRIVER) return json({ ok: false, error: "DFY price not configured" }, 500);

  const supa = supaFetch(ctx.env);
  const rows = (await supa.select("carrier_users", `user_id=eq.${user.id}&select=carrier_id,carriers(id,name,stripe_customer_id,trial_ends_at)`)) as Array<{ carrier_id: string; carriers: { id: string; name: string; stripe_customer_id: string | null; trial_ends_at: string | null } }>;
  if (rows.length === 0) return json({ ok: false, error: "No carrier for user" }, 400);
  const carrier = rows[0].carriers;

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

  const priceDriver = plan === "dfy" ? ctx.env.STRIPE_PRICE_DFY_DRIVER : ctx.env.STRIPE_PRICE_DIY_DRIVER;
  params.append("line_items[0][price]", priceDriver!);
  params.append("line_items[0][quantity]", String(drivers));
  params.append("line_items[0][adjustable_quantity][enabled]", "true");
  params.append("line_items[0][adjustable_quantity][minimum]", "1");
  if (hazmat && ctx.env.STRIPE_PRICE_HAZMAT_ADDON) {
    params.append("line_items[1][price]", ctx.env.STRIPE_PRICE_HAZMAT_ADDON);
    params.append("line_items[1][quantity]", "1");
  }
  if (carrier.trial_ends_at && new Date(carrier.trial_ends_at) > new Date()) {
    const trialDays = Math.ceil((new Date(carrier.trial_ends_at).getTime() - Date.now()) / 86400000);
    if (trialDays > 0) params.set("subscription_data[trial_period_days]", String(Math.min(trialDays, 7)));
  }
  params.set("metadata[carrier_id]", carrier.id);
  params.set("metadata[plan]", plan);
  params.set("metadata[hazmat]", hazmat ? "true" : "false");
  params.set("allow_promotion_codes", "true");

  const r = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${ctx.env.STRIPE_SECRET_KEY}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  if (!r.ok) return json({ ok: false, error: `Stripe HTTP ${r.status}`, detail: await r.text() }, 502);
  const sess = (await r.json()) as { url?: string; id?: string };
  return json({ ok: true, url: sess.url, id: sess.id });
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization" } });
