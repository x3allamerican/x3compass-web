import { bearerFromRequest, supaFetch, verifySupabaseJwt } from "../../_shared/supabase-admin";

interface Env {
  SUPABASE_URL?: string; SUPABASE_SERVICE_ROLE?: string;
  STRIPE_SECRET_KEY?: string; NEXT_PUBLIC_SITE_URL?: string;
}

const json = (d: unknown, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { "Content-Type": "application/json" } });

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const token = bearerFromRequest(ctx.request);
  const user = await verifySupabaseJwt(ctx.env, token);
  if (!user) return json({ ok: false, error: "Unauthorized" }, 401);
  if (!ctx.env.STRIPE_SECRET_KEY) return json({ ok: false, error: "Stripe not configured" }, 500);

  const supa = supaFetch(ctx.env);
  const rows = (await supa.select("carrier_users", `user_id=eq.${user.id}&select=carriers(id,stripe_customer_id)`)) as Array<{ carriers: { id: string; stripe_customer_id: string | null } }>;
  if (rows.length === 0) return json({ ok: false, error: "No carrier for user" }, 400);
  const customer = rows[0].carriers?.stripe_customer_id;
  if (!customer) return json({ ok: false, error: "No Stripe customer yet — start a checkout first" }, 400);

  const site = ctx.env.NEXT_PUBLIC_SITE_URL || new URL(ctx.request.url).origin;
  const r = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${ctx.env.STRIPE_SECRET_KEY}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ customer, return_url: `${site}/app/settings/billing` }).toString(),
  });
  if (!r.ok) return json({ ok: false, error: `Stripe HTTP ${r.status}`, detail: await r.text() }, 502);
  const sess = (await r.json()) as { url?: string };
  return json({ ok: true, url: sess.url });
};
