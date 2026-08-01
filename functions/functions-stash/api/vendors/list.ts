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

interface Env {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE?: string;
  TENSTREET_API_KEY?: string;
  TENSTREET_SUBDOMAIN?: string;
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
  { vendor: "manual_api",   category: "other",      status: "available" },
];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const url = new URL(ctx.request.url);
  const carrierId = url.searchParams.get("carrier_id");
  const env = ctx.env;
  const envFlags = {
    tenstreet: !!(env.TENSTREET_API_KEY && env.TENSTREET_SUBDOMAIN),
  };

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE || !carrierId) {
    return json({ ok: true, demo: true, vendors: FALLBACK.map(v => ({ ...v, env_configured: envFlags[v.vendor as keyof typeof envFlags] || false })) });
  }

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
