/**
 * POST /api/carrier/set-ctpa — persist the carrier's C/TPA selection.
 * JWT-gated. The carrier is derived server-side from the caller's membership
 * (never trusted from the client). Body: { ctpa_slug, custom_name, mode,
 * disclosure_acked?, disclosure_version? }.
 */
import { bearerFromRequest, supaFetch, verifySupabaseJwt } from "../../_shared/supabase-admin";

interface Env { SUPABASE_URL?: string; SUPABASE_SERVICE_ROLE?: string; }

const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  try {
    const user = await verifySupabaseJwt(ctx.env, bearerFromRequest(ctx.request));
    if (!user) return json({ ok: false, error: "Unauthorized" }, 401);

    let body: { ctpa_slug?: string | null; custom_name?: string | null; mode?: string | null };
    try { body = await ctx.request.json(); } catch { return json({ ok: false, error: "Invalid JSON" }, 400); }

    const mode = (body.mode || "").toString().slice(0, 32) || null;
    const custom = body.custom_name ? String(body.custom_name).slice(0, 200) : null;

    const supa = supaFetch(ctx.env);
    // Server-derived carrier — never trust a carrier id from the client.
    const rows = (await supa.select("compass_carrier_users", `user_id=eq.${user.id}&select=carrier_id`)) as Array<{ carrier_id: string }>;
    if (rows.length === 0) return json({ ok: false, error: "No carrier for user" }, 400);
    const carrier_id = rows[0].carrier_id;

    // Resolve ctpa_id from slug (null for BYO/custom or unknown slug).
    let ctpa_id: string | null = null;
    if (body.ctpa_slug) {
      const c = (await supa.select("compass_ctpas", `slug=eq.${encodeURIComponent(String(body.ctpa_slug))}&select=id`)) as Array<{ id: string }>;
      ctpa_id = c.length ? c[0].id : null;
    }

    await supa.update("compass_carriers", `id=eq.${carrier_id}`, {
      ctpa_mode: mode,
      ctpa_custom_name: custom,
      ctpa_id,
    });

    return json({ ok: true, note: "C/TPA saved." });
  } catch (err) {
    const ref = crypto.randomUUID();
    console.error("[set-ctpa] error ref=%s:", ref, err);
    return json({ ok: false, error: "Could not save. Please try again.", ref }, 500);
  }
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization" } });
