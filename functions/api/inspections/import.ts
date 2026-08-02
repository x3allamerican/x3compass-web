/**
 * POST /api/inspections/import — bulk import roadside / DOT inspections.
 * Body: { carrier_id, csv }
 * Accepted columns: inspection_date, driver_first_name, driver_last_name, license_plate,
 *   level (1-6), state, inspector, report_number, oos_driver (bool), oos_vehicle (bool),
 *   violation_count (int), report_url.
 */
import { correlationId, requireTenant, securityError, type SecurityEnv } from "../../_shared/request-security";
interface Env extends SecurityEnv {}
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

function parseCsv(text: string): string[][] {
  const rows: string[][] = []; let cur: string[] = []; let f = ""; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i+1] === '"') { f += '"'; i++; continue; } if (c === '"') { q = false; continue; } f += c; }
    else { if (c === '"') { q = true; continue; } if (c === ",") { cur.push(f); f = ""; continue; } if (c === "\r") continue; if (c === "\n") { cur.push(f); rows.push(cur); cur = []; f = ""; continue; } f += c; }
  }
  if (f.length || cur.length) { cur.push(f); rows.push(cur); }
  return rows.filter(r => r.length > 1 || (r.length === 1 && r[0] !== ""));
}
function bool(v: string): boolean { return /^(true|t|yes|y|1)$/i.test(v.trim()); }
function intOr(v: string, d = 0): number { const n = parseInt(v, 10); return Number.isFinite(n) ? n : d; }

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  let body: { carrier_id?: string; csv?: string };
  try { body = await ctx.request.json(); } catch { return json({ ok: false, error: "Invalid JSON" }, 400); }
  const requestId = correlationId(ctx.request);
  let authority;
  try { authority = await requireTenant(ctx.request, ctx.env, body.carrier_id); }
  catch { return securityError(503, "authorization_unavailable", requestId); }
  if (!authority.ok) return securityError(authority.status, authority.code, requestId);
  if (!body.csv) return json({ ok: false, error: "Missing csv" }, 400);
  if (!ctx.env.SUPABASE_URL || !ctx.env.SUPABASE_SERVICE_ROLE) return json({ ok: false, error: "Server missing Supabase env" }, 500);

  const parsed = parseCsv(body.csv);
  if (parsed.length < 2) return json({ ok: false, error: "CSV must include header + at least one row" }, 400);
  const headers = parsed[0].map(h => h.trim().toLowerCase());
  const col = (n: string) => headers.indexOf(n);

  const baseUrl = ctx.env.SUPABASE_URL.replace(/\/$/, "");
  const sr = ctx.env.SUPABASE_SERVICE_ROLE;
  const carrierId = encodeURIComponent(authority.carrierId);
  const supaH = { apikey: sr, Authorization: `Bearer ${sr}`, Accept: "application/json" };
  const [drvR, vehR] = await Promise.all([
    fetch(`${baseUrl}/rest/v1/compass_drivers?select=id,first_name,last_name&carrier_id=eq.${carrierId}&limit=1000`, { headers: supaH }),
    fetch(`${baseUrl}/rest/v1/compass_vehicles?select=id,license_plate&carrier_id=eq.${carrierId}&limit=1000`, { headers: supaH }),
  ]);
  const drivers = (await drvR.json()) as { id: string; first_name?: string; last_name?: string }[];
  const vehicles = (await vehR.json()) as { id: string; license_plate?: string }[];
  const drvByName = new Map<string, string>(drivers.map(d => [`${(d.first_name||"").toLowerCase()} ${(d.last_name||"").toLowerCase()}`.trim(), d.id]));
  const vehByPlate = new Map<string, string>(vehicles.map(v => [(v.license_plate || "").toUpperCase(), v.id]));

  const out: Record<string, unknown>[] = [];
  const errors: { row: number; reason: string }[] = [];
  for (let i = 1; i < parsed.length; i++) {
    const r = parsed[i];
    const get = (n: string) => { const c = col(n); return c >= 0 ? (r[c] || "").trim() : ""; };
    const date = get("inspection_date") || get("date");
    if (!date) { errors.push({ row: i, reason: "missing inspection_date" }); continue; }
    const lev = intOr(get("level"), 0);
    if (lev < 1 || lev > 6) { errors.push({ row: i, reason: "level must be 1-6" }); continue; }

    out.push({
      carrier_id: authority.carrierId,
      driver_id: drvByName.get(`${get("driver_first_name").toLowerCase()} ${get("driver_last_name").toLowerCase()}`.trim()) || null,
      vehicle_id: vehByPlate.get(get("license_plate").toUpperCase()) || null,
      inspection_date: date,
      level: lev,
      state: get("state").toUpperCase().slice(0, 2) || null,
      inspector: get("inspector") || null,
      report_number: get("report_number") || null,
      oos_driver: bool(get("oos_driver")),
      oos_vehicle: bool(get("oos_vehicle")),
      violation_count: intOr(get("violation_count"), 0),
      report_url: get("report_url") || null,
    });
  }
  if (out.length === 0) return json({ ok: false, submitted: 0, errors, error: "No valid rows" }, 400);
  const r = await fetch(`${baseUrl}/rest/v1/compass_inspections`, {
    method: "POST",
    headers: { ...supaH, "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify(out),
  });
  if (!r.ok) {
    console.error("inspection import failed", { correlation_id: requestId, status: r.status });
    return securityError(500, "request_failed", requestId);
  }
  const inserted = await r.json() as unknown[];
  return json({ ok: errors.length === 0, submitted: out.length, inserted: inserted.length, skipped: 0, updated: 0, errors });
};
