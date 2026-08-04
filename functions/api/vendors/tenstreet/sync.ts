/**
 * POST /api/vendors/tenstreet/sync
 *
 * Pulls applicants from TenStreet's Driver Applicant Export API and upserts
 * them into compass_drivers via the shared vendor-mapper. Updates
 * compass_vendor_integrations with the run result.
 *
 * Body: { carrier_id: string }
 *
 * Required Pages env vars (per-carrier secrets — these need to come from
 * compass_vendor_integrations.encrypted_api_key once we've onboarded our
 * first TenStreet customer; for v1 we accept org-wide fallback env vars):
 *   - TENSTREET_API_KEY
 *   - TENSTREET_SUBDOMAIN  (e.g. 'acme' → https://acme.tenstreetapp.com)
 *
 * Returns 503 with a clear "not configured" message when env is missing —
 * the UI uses that signal to show the "Connect TenStreet" config prompt
 * instead of a generic error.
 */

import { mapTenStreet, upsertDrivers, markVendorSync } from "../../../_shared/vendor-mapper";
import { correlationId, requireTenant, securityError, type SecurityEnv } from "../../../_shared/request-security";

interface Env extends SecurityEnv {
  TENSTREET_API_KEY?: string;
  TENSTREET_SUBDOMAIN?: string;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const { TENSTREET_API_KEY, TENSTREET_SUBDOMAIN, SUPABASE_URL, SUPABASE_SERVICE_ROLE } = ctx.env;

  let body: { carrier_id?: string };
  try { body = await ctx.request.json(); } catch { return json({ ok: false, error: "Invalid JSON" }, 400); }
  const requestId = correlationId(ctx.request);
  let authority;
  try { authority = await requireTenant(ctx.request, ctx.env, body.carrier_id); }
  catch { return securityError(503, "authorization_unavailable", requestId); }
  if (!authority.ok) return securityError(authority.status, authority.code, requestId);
  const carrierId = authority.carrierId;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) return json({ ok: false, error: "Server missing Supabase env" }, 500);

  if (!TENSTREET_API_KEY || !TENSTREET_SUBDOMAIN) {
    return json({
      ok: false,
      configured: false,
      vendor: "tenstreet",
      error: "TenStreet not configured. Set TENSTREET_API_KEY and TENSTREET_SUBDOMAIN on Cloudflare Pages (Settings → Environment variables) and redeploy.",
      help_url: "https://tenstreet.com/api",
    }, 503);
  }

  try {
    // TenStreet's "Driver Applicant Export" endpoint. The exact path depends on
    // their contract — most accounts use the JSON variant at
    // https://<subdomain>.tenstreetapp.com/api/v1/applicants
    // We let it 404/401 if the path is wrong rather than silently faking results.
    const apiUrl = `https://${TENSTREET_SUBDOMAIN}.tenstreetapp.com/api/v1/applicants?status=submitted`;
    const r = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${TENSTREET_API_KEY}`, Accept: "application/json" },
    });
    if (!r.ok) {
      const text = (await r.text()).slice(0, 500);
      await markVendorSync(ctx.env, carrierId, "tenstreet", { success: false, count: 0, error: `TenStreet ${r.status}: ${text}` });
      return securityError(502, "upstream_failed", requestId);
    }
    const payload = (await r.json()) as { applicants?: unknown[] };
    const applicants = Array.isArray(payload.applicants) ? payload.applicants : [];

    const normalized = mapTenStreet(applicants as Parameters<typeof mapTenStreet>[0]);
    const upsert = await upsertDrivers(ctx.env, carrierId, normalized);
    const success = upsert.errors.length === 0;
    await markVendorSync(ctx.env, carrierId, "tenstreet", {
      success,
      count: upsert.inserted + upsert.updated,
      error: success ? undefined : upsert.errors.slice(0, 3).map(e => e.reason).join("; "),
    });
    return json({
      ok: success,
      vendor: "tenstreet",
      fetched: normalized.length,
      inserted: upsert.inserted,
      updated: upsert.updated,
      skipped: upsert.skipped,
      errors: upsert.errors,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await markVendorSync(ctx.env, carrierId, "tenstreet", { success: false, count: 0, error: msg });
    return securityError(500, "request_failed", requestId);
  }
};
