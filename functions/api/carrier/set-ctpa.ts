/**
 * POST /api/carrier/set-ctpa — persist the carrier's C/TPA selection.
 * JWT-gated. The carrier is derived server-side from the caller's membership
 * (never trusted from the client). Body: { ctpa_slug, custom_name, mode,
 * disclosure_acked?, disclosure_version? }.
 */
import { correlationId, requireTenant, securityError, tenantJson, tenantPreflight, type SecurityEnv } from "../../_shared/request-security";
import { supaFetch } from "../../_shared/supabase-admin";

type Env = SecurityEnv;

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  try {
    const authority = await requireTenant(ctx.request, ctx.env, null);
    if (!authority.ok) return securityError(authority.status, authority.code, correlationId(ctx.request));

    let body: { ctpa_slug?: string | null; custom_name?: string | null; mode?: string | null };
    try { body = await ctx.request.json(); } catch { return tenantJson(ctx.request, ctx.env, { ok: false, error: "Invalid JSON" }, 400); }

    const mode = (body.mode || "").toString().slice(0, 32) || null;
    const custom = body.custom_name ? String(body.custom_name).slice(0, 200) : null;

    const supa = supaFetch(ctx.env);
    const carrier_id = authority.carrierId;

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

    return tenantJson(ctx.request, ctx.env, { ok: true, note: "C/TPA saved." });
  } catch (err) {
    const ref = crypto.randomUUID();
    console.error("[set-ctpa] error ref=%s:", ref, err);
    return tenantJson(ctx.request, ctx.env, { ok: false, error: "Could not save. Please try again.", ref }, 500);
  }
};

export const onRequestOptions: PagesFunction<Env> = async (ctx) => tenantPreflight(ctx.request, ctx.env, "POST, OPTIONS");
