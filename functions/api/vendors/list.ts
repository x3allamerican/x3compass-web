/**
 * GET /api/vendors/list?carrier_id=<uuid>
 *
 * Returns the list of vendor integrations for a carrier, with current status.
 * Used by the Drivers page (and eventually the dedicated /app/integrations page)
 * to render the "Sync vendor" dropdown.
 *
 * If env is missing, returns a curated default list so the UI still has
 * something to show in dev / unconfigured environments.
 */
import { correlationId, requireTenant, securityError, type SecurityEnv } from "../../_shared/request-security";

interface Env extends SecurityEnv {
  TENSTREET_API_KEY?: string;
  TENSTREET_SUBDOMAIN?: string;
  SAMSARA_API_TOKEN?: string;
}

type Vendor = {
  vendor: string;
  category: string;
  status: "available" | "configured" | "connected" | "syncing" | "error";
  last_sync_at?: string | null;
  last_sync_count?: number | null;
  last_error_text?: string | null;
  env_configured?: boolean;  // true if org-wide env vars are present
};

const FALLBACK: Vendor[] = [
  { vendor: "tenstreet",    category: "ats",        status: "available" },
  { vendor: "driverreach",  category: "ats",        status: "available" },
  { vendor: "hireright",    category: "mvr",        status: "available" },
  { vendor: "samba_safety", category: "mvr",        status: "available" },
  { vendor: "checkr",       category: "background", status: "available" },
  { vendor: "samsara",      category: "eld",        status: "available" },
  { vendor: "manual_api",   category: "other",      status: "available" },
];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const url = new URL(ctx.request.url);
  const requestId = correlationId(ctx.request);
  let authority;
  try { authority = await requireTenant(ctx.request, ctx.env, url.searchParams.get("carrier_id")); }
  catch { return securityError(503, "authorization_unavailable", requestId); }
  if (!authority.ok) return securityError(authority.status, authority.code, requestId);
  const carrierId = encodeURIComponent(authority.carrierId);
  const env = ctx.env;
  const envFlags = {
    tenstreet: !!(env.TENSTREET_API_KEY && env.TENSTREET_SUBDOMAIN),
    samsara: !!env.SAMSARA_API_TOKEN,
    verizon_connect: !!(env as Record<string,unknown>).VERIZON_CONNECT_API_KEY,
    omnitracs: !!(env as Record<string,unknown>).OMNITRACS_API_KEY,
    trimble: !!(env as Record<string,unknown>).TRIMBLE_API_KEY,
  };

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE) return securityError(503, "service_unavailable", requestId);

  const base = env.SUPABASE_URL.replace(/\/$/, "");
  const sr = env.SUPABASE_SERVICE_ROLE;

  try {
    const r = await fetch(
      `${base}/rest/v1/compass_vendor_integrations?select=vendor,category,status,last_sync_at,last_sync_count,last_error_text&carrier_id=eq.${carrierId}`,
      { headers: { apikey: sr, Authorization: `Bearer ${sr}`, Accept: "application/json" } },
    );
    if (!r.ok) return json({ ok: true, demo: true, vendors: FALLBACK });
    const rows = (await r.json()) as Vendor[];
    // If table is empty for this carrier, fall back to defaults
    const vendors = rows.length > 0
      ? rows.map(v => ({ ...v, env_configured: envFlags[v.vendor as keyof typeof envFlags] || false }))
      : FALLBACK.map(v => ({ ...v, env_configured: envFlags[v.vendor as keyof typeof envFlags] || false }));
    return json({ ok: true, demo: false, vendors });
  } catch {
    return json({ ok: true, demo: true, vendors: FALLBACK });
  }
};
