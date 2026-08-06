/** Shared ELD HOS sync: normalize vendor daily-logs, §395.3-score, link drivers, upsert compass_hos_logs. */
import { computeHosViolations } from "../../src/lib/hosViolations.mjs";
import { markVendorSync } from "./vendor-mapper";

export interface EldSupaEnv { SUPABASE_URL?: string; SUPABASE_SERVICE_ROLE?: string; }
export interface EldVendorEnv extends EldSupaEnv {
  VERIZON_CONNECT_API_KEY?: string; VERIZON_CONNECT_API_BASE?: string;
  OMNITRACS_API_KEY?: string; OMNITRACS_API_BASE?: string;
  TRIMBLE_API_KEY?: string; TRIMBLE_API_BASE?: string;
}
export interface EldHosRow { source_driver_id: string; log_date: string; total_drive_minutes: number | null; total_on_duty_minutes: number | null; eld_source: string; certified: boolean; }
export type EldConfig = { vendor: string; url: string; headers: HeadersInit; extract: (p: unknown) => unknown[]; mapRow: (r: Record<string, unknown>) => EldHosRow | null };

const numOr = (v: unknown): number | null => (v == null || v === "" ? null : (Number.isFinite(Number(v)) ? Number(v) : null));
const str = (v: unknown): string | null => (typeof v === "string" && v ? v : (typeof v === "number" ? String(v) : null));
const first = (r: Record<string, unknown>, keys: string[]): unknown => { for (const k of keys) if (r[k] != null) return r[k]; return null; };
/** Return minutes from candidate min/sec/hr fields. */
function durationMin(r: Record<string, unknown>, minKeys: string[], secKeys: string[], hrKeys: string[]): number | null {
  const m = numOr(first(r, minKeys)); if (m != null) return Math.round(m);
  const s = numOr(first(r, secKeys)); if (s != null) return Math.round(s / 60);
  const h = numOr(first(r, hrKeys)); if (h != null) return Math.round(h * 60);
  return null;
}
function isoDate(v: unknown): string | null { const s = str(v); if (!s) return null; return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : null; }

/** Link drivers by source_id and upsert §395.3-scored HOS logs. */
export async function upsertEldHos(env: EldSupaEnv, carrierId: string, vendor: string, rows: EldHosRow[]): Promise<{ reconciled: number; unlinked: number }> {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE || !rows.length) return { reconciled: 0, unlinked: rows.length };
  const base = env.SUPABASE_URL.replace(/\/$/, ""); const sr = env.SUPABASE_SERVICE_ROLE;
  const h = { apikey: sr, Authorization: `Bearer ${sr}`, Accept: "application/json" };
  const dr = await fetch(`${base}/rest/v1/compass_drivers?select=id,source_id&carrier_id=eq.${carrierId}&source_vendor=eq.${vendor}&limit=50000`, { headers: h });
  const links = dr.ok ? (await dr.json()) as Array<{ id: string; source_id: string }> : [];
  const bySource = new Map(links.map((l) => [l.source_id, l.id]));
  const records = rows.flatMap((r) => {
    const driver_id = bySource.get(r.source_driver_id); if (!driver_id) return [];
    const { violations } = computeHosViolations({ drive_min: r.total_drive_minutes || 0, on_duty_min: r.total_on_duty_minutes || 0 });
    return [{ carrier_id: carrierId, driver_id, log_date: r.log_date, total_drive_minutes: r.total_drive_minutes, total_on_duty_minutes: r.total_on_duty_minutes, violations, eld_source: r.eld_source, certified: r.certified, source_vendor: vendor, source_id: `${r.source_driver_id}:${r.log_date}` }];
  });
  if (!records.length) return { reconciled: 0, unlinked: rows.length };
  const resp = await fetch(`${base}/rest/v1/compass_hos_logs?on_conflict=carrier_id,source_vendor,source_id`, { method: "POST", headers: { ...h, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(records) });
  return { reconciled: resp.ok ? records.length : 0, unlinked: rows.length - records.length };
}

/** Fetch + normalize + upsert for one vendor. */
export async function syncEldVendor(env: EldVendorEnv, carrierId: string, cfg: EldConfig): Promise<{ ok: boolean; vendor: string; reconciled?: number; unlinked?: number; error?: string; status?: number }> {
  let payload: unknown;
  try {
    const r = await fetch(cfg.url, { headers: cfg.headers });
    if (!r.ok) { await markVendorSync(env as never, carrierId, cfg.vendor, { success: false, count: 0, error: `${cfg.vendor} ${r.status}: ${(await r.text()).slice(0, 200)}` }); return { ok: false, vendor: cfg.vendor, error: `upstream ${r.status}`, status: r.status }; }
    payload = await r.json();
  } catch (e) { await markVendorSync(env as never, carrierId, cfg.vendor, { success: false, count: 0, error: e instanceof Error ? e.message : "fetch failed" }); return { ok: false, vendor: cfg.vendor, error: "unreachable" }; }
  const rows = (cfg.extract(payload) || []).map((r) => cfg.mapRow(r as Record<string, unknown>)).filter((r): r is EldHosRow => !!r && !!r.source_driver_id && !!r.log_date);
  const { reconciled, unlinked } = await upsertEldHos(env, carrierId, cfg.vendor, rows);
  await markVendorSync(env as never, carrierId, cfg.vendor, { success: true, count: reconciled });
  return { ok: true, vendor: cfg.vendor, reconciled, unlinked };
}

const commonExtract = (p: unknown): unknown[] => { const o = p as Record<string, unknown>; return (o?.data as unknown[]) || (o?.logs as unknown[]) || (o?.dailyLogs as unknown[]) || (o?.records as unknown[]) || (o?.hosLogs as unknown[]) || (Array.isArray(p) ? (p as unknown[]) : []); };
const commonMap = (vendor: string) => (r: Record<string, unknown>): EldHosRow | null => {
  const sid = str(first(r, ["driverId", "driver_id", "driverNumber", "driver_number", "driverRef", "employeeId"])); 
  const date = isoDate(first(r, ["logDate", "log_date", "date", "day", "startDate", "startTime"]));
  if (!sid || !date) return null;
  return {
    source_driver_id: sid, log_date: date,
    total_drive_minutes: durationMin(r, ["driveMinutes", "drivingMinutes", "drive_min", "driveTime"], ["driveSeconds", "drivingSeconds"], ["driveHours", "drivingHours"]),
    total_on_duty_minutes: durationMin(r, ["onDutyMinutes", "on_duty_minutes", "onDutyTime", "dutyMinutes"], ["onDutySeconds"], ["onDutyHours"]),
    eld_source: vendor, certified: Boolean(first(r, ["certified", "isCertified", "logCertified"])),
  };
};

export function verizonConfig(env: EldVendorEnv): EldConfig | null {
  if (!env.VERIZON_CONNECT_API_KEY) return null;
  const base = (env.VERIZON_CONNECT_API_BASE || "https://fim.api.us.fleetmatics.com").replace(/\/$/, "");
  return { vendor: "verizon_connect", url: `${base}/cmp/v1/hos/dailylogs?limit=500`, headers: { Authorization: `Bearer ${env.VERIZON_CONNECT_API_KEY}`, Accept: "application/json" }, extract: commonExtract, mapRow: commonMap("verizon_connect") };
}
export function omnitracsConfig(env: EldVendorEnv): EldConfig | null {
  if (!env.OMNITRACS_API_KEY) return null;
  const base = (env.OMNITRACS_API_BASE || "https://api.omnitracs.com").replace(/\/$/, "");
  return { vendor: "omnitracs", url: `${base}/hos/v1/dailylogs?limit=500`, headers: { Authorization: `Bearer ${env.OMNITRACS_API_KEY}`, Accept: "application/json" }, extract: commonExtract, mapRow: commonMap("omnitracs") };
}
export function trimbleConfig(env: EldVendorEnv): EldConfig | null {
  if (!env.TRIMBLE_API_KEY) return null;
  const base = (env.TRIMBLE_API_BASE || "https://api.trimblemaps.com").replace(/\/$/, "");
  return { vendor: "trimble", url: `${base}/eld/v1/hos/dailylogs?limit=500`, headers: { Authorization: `Bearer ${env.TRIMBLE_API_KEY}`, Accept: "application/json" }, extract: commonExtract, mapRow: commonMap("trimble") };
}
