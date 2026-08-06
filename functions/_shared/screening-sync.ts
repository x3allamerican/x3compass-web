/** Shared screening-provider sync: reconcile results into vendor_orders (update-or-insert). */
import { markVendorSync } from "./vendor-mapper";

export interface ScreeningSupaEnv { SUPABASE_URL?: string; SUPABASE_SERVICE_ROLE?: string; }
export interface ScreeningRow {
  vendor_ref_id: string; service: string; status: string;
  ordered_at?: string | null; completed_at?: string | null; driver_id?: string | null; raw?: unknown;
}

/** Normalize a provider status string to the vendor_orders lifecycle. */
export function normStatus(s: unknown): string {
  const v = String(s || "").toLowerCase();
  if (/(complete|clear|closed|done|pass|negative|final)/.test(v)) return "completed";
  if (/(consider|review|flag|positive|adverse|fail|dispute)/.test(v)) return "review";
  if (/(cancel|expire|withdraw|void)/.test(v)) return "canceled";
  if (/(progress|processing|pending|open|submitted|invited|in_review)/.test(v)) return "pending";
  return v ? "pending" : "unknown";
}

export async function reconcileVendorOrders(env: ScreeningSupaEnv, carrierId: string, vendor: string, rows: ScreeningRow[]): Promise<{ inserted: number; updated: number }> {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE || !rows.length) return { inserted: 0, updated: 0 };
  const base = env.SUPABASE_URL.replace(/\/$/, ""); const sr = env.SUPABASE_SERVICE_ROLE;
  const h = { apikey: sr, Authorization: `Bearer ${sr}`, "Content-Type": "application/json" };
  const refs = rows.map((r) => r.vendor_ref_id).filter(Boolean);
  const existing = new Map<string, string>();
  if (refs.length) {
    const q = `${base}/rest/v1/vendor_orders?vendor=eq.${vendor}&carrier_id=eq.${carrierId}&vendor_ref_id=in.(${refs.map((r) => `"${r}"`).join(",")})&select=id,vendor_ref_id`;
    const r = await fetch(q, { headers: h });
    if (r.ok) for (const row of (await r.json()) as Array<{ id: string; vendor_ref_id: string }>) existing.set(row.vendor_ref_id, row.id);
  }
  const now = new Date().toISOString();
  const toInsert: Record<string, unknown>[] = []; let updated = 0;
  for (const row of rows) {
    const id = existing.get(row.vendor_ref_id);
    if (id) {
      await fetch(`${base}/rest/v1/vendor_orders?id=eq.${id}`, { method: "PATCH", headers: { ...h, Prefer: "return=minimal" }, body: JSON.stringify({ status: row.status, completed_at: row.completed_at ?? null, raw: row.raw ?? null, updated_at: now }) });
      updated++;
    } else {
      toInsert.push({ vendor, service: row.service, carrier_id: carrierId, driver_id: row.driver_id ?? null, vendor_ref_id: row.vendor_ref_id, status: row.status, ordered_at: row.ordered_at ?? null, completed_at: row.completed_at ?? null, raw: row.raw ?? null, updated_at: now });
    }
  }
  let inserted = 0;
  if (toInsert.length) { const r = await fetch(`${base}/rest/v1/vendor_orders`, { method: "POST", headers: { ...h, Prefer: "return=minimal" }, body: JSON.stringify(toInsert) }); if (r.ok) inserted = toInsert.length; }
  return { inserted, updated };
}

/** Generic pull+reconcile used by hireright & disa sync endpoints and the agent. */
export async function syncScreeningVendor(env: ScreeningSupaEnv, carrierId: string, opts: {
  vendor: string; url: string; headers: HeadersInit; extract: (payload: unknown) => unknown[]; mapRow: (row: Record<string, unknown>) => ScreeningRow | null;
}): Promise<{ ok: boolean; vendor: string; synced?: number; inserted?: number; updated?: number; error?: string; status?: number }> {
  let payload: unknown;
  try {
    const r = await fetch(opts.url, { headers: opts.headers });
    if (!r.ok) { await markVendorSync(env as never, carrierId, opts.vendor, { success: false, count: 0, error: `${opts.vendor} ${r.status}: ${(await r.text()).slice(0, 200)}` }); return { ok: false, vendor: opts.vendor, error: `upstream ${r.status}`, status: r.status }; }
    payload = await r.json();
  } catch (e) { await markVendorSync(env as never, carrierId, opts.vendor, { success: false, count: 0, error: e instanceof Error ? e.message : "fetch failed" }); return { ok: false, vendor: opts.vendor, error: "unreachable" }; }
  const rows = (opts.extract(payload) || []).map((r) => opts.mapRow(r as Record<string, unknown>)).filter((r): r is ScreeningRow => !!r && !!r.vendor_ref_id);
  const { inserted, updated } = await reconcileVendorOrders(env, carrierId, opts.vendor, rows);
  await markVendorSync(env as never, carrierId, opts.vendor, { success: true, count: inserted + updated });
  return { ok: true, vendor: opts.vendor, synced: rows.length, inserted, updated };
}

const _str = (v: unknown) => (typeof v === "string" && v ? v : (typeof v === "number" ? String(v) : null));
export interface ScreeningVendorEnv extends ScreeningSupaEnv { HIRERIGHT_API_KEY?: string; HIRERIGHT_API_BASE?: string; HIRERIGHT_ACCOUNT_ID?: string; DISA_API_KEY?: string; DISA_API_BASE?: string; SAMBASAFETY_API_KEY?: string; SAMBASAFETY_API_BASE?: string; }
type PullConfig = { vendor: string; url: string; headers: HeadersInit; extract: (p: unknown) => unknown[]; mapRow: (r: Record<string, unknown>) => ScreeningRow | null };

export function hireRightConfig(env: ScreeningVendorEnv): PullConfig | null {
  if (!env.HIRERIGHT_API_KEY) return null;
  const base = (env.HIRERIGHT_API_BASE || "https://api.hireright.com").replace(/\/$/, "");
  const acct = env.HIRERIGHT_ACCOUNT_ID ? `&accountId=${encodeURIComponent(env.HIRERIGHT_ACCOUNT_ID)}` : "";
  return {
    vendor: "hireright",
    url: `${base}/v2/reports?status=completed&limit=500${acct}`,
    headers: { Authorization: `Bearer ${env.HIRERIGHT_API_KEY}`, Accept: "application/json" },
    extract: (p) => { const o = p as Record<string, unknown>; return (o?.reports as unknown[]) || (o?.data as unknown[]) || (o?.results as unknown[]) || []; },
    mapRow: (r) => { const id = _str(r.id) || _str(r.reportId) || _str(r.orderId); return id ? { vendor_ref_id: id, service: `hireright_${_str(r.type) || _str(r.package) || "screening"}`, status: normStatus(r.status || r.adjudication || r.result), ordered_at: _str(r.orderedAt) || _str(r.createdAt), completed_at: _str(r.completedAt) || _str(r.resultDate), raw: r } : null; },
  };
}
export function disaConfig(env: ScreeningVendorEnv): PullConfig | null {
  if (!env.DISA_API_KEY) return null;
  const base = (env.DISA_API_BASE || "https://api.disa.com").replace(/\/$/, "");
  return {
    vendor: "disa",
    url: `${base}/v1/results?status=complete&limit=500`,
    headers: { Authorization: `Bearer ${env.DISA_API_KEY}`, Accept: "application/json" },
    extract: (p) => { const o = p as Record<string, unknown>; return (o?.results as unknown[]) || (o?.data as unknown[]) || (o?.records as unknown[]) || []; },
    mapRow: (r) => { const id = _str(r.id) || _str(r.resultId) || _str(r.orderId); return id ? { vendor_ref_id: id, service: `disa_${_str(r.type) || _str(r.testType) || "screening"}`, status: normStatus(r.status || r.result), ordered_at: _str(r.collectedAt) || _str(r.createdAt), completed_at: _str(r.resultDate) || _str(r.completedAt), raw: r } : null; },
  };
}

export function sambaConfig(env: ScreeningVendorEnv): PullConfig | null {
  if (!env.SAMBASAFETY_API_KEY) return null;
  const base = (env.SAMBASAFETY_API_BASE || "https://api.sambasafety.io").replace(/\/$/, "");
  return {
    vendor: "sambasafety",
    url: `${base}/v1/mvr/reports?status=completed&limit=500`,
    headers: { Authorization: `Bearer ${env.SAMBASAFETY_API_KEY}`, Accept: "application/json" },
    extract: (p) => { const o = p as Record<string, unknown>; return (o?.reports as unknown[]) || (o?.data as unknown[]) || (o?.results as unknown[]) || []; },
    mapRow: (r) => { const id = _str(r.id) || _str(r.reportId) || _str(r.orderId); return id ? { vendor_ref_id: id, service: `sambasafety_${_str(r.type) || _str(r.product) || "mvr"}`, status: normStatus(r.status || r.result), ordered_at: _str(r.orderedAt) || _str(r.createdAt), completed_at: _str(r.completedAt) || _str(r.reportDate), raw: r } : null; },
  };
}
