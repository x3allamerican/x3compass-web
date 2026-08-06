/**
 * POST /api/hos/import — bulk import Hours-of-Service daily logs (49 CFR Part 395).
 * Body: { carrier_id, csv }
 * Columns: driver_id (UUID) OR driver_first_name+driver_last_name, log_date (YYYY-MM-DD),
 *   drive_min, on_duty_min, hours_70_8 (cycle hrs, optional), cycle (70_8|60_7, optional),
 *   break_min (optional), eld_source (optional), certified (bool, optional).
 * Violations are computed server-side per §395.3 and stored; re-import is idempotent per (driver, date).
 */
import { computeHosViolations } from "../../../src/lib/hosViolations.mjs";
import { correlationId, requireTenant, securityError, type SecurityEnv } from "../../_shared/request-security";
type Env = SecurityEnv;
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

function parseCsv(text: string): string[][] {
  const rows: string[][] = []; let cur: string[] = []; let f = ""; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i+1] === '"') { f += '"'; i++; continue; } if (c === '"') { q = false; continue; } f += c; }
    else { if (c === '"') { q = true; continue; } if (c === ",") { cur.push(f); f = ""; continue; } if (c === "\r") continue; if (c === "\n") { cur.push(f); rows.push(cur); cur = []; f = ""; continue; } f += c; }
  }
  if (f.length || cur.length) { cur.push(f); rows.push(cur); }
  return rows.filter(r => (r.length > 1 || (r.length === 1 && r[0] !== "")) && !String(r[0]).trim().startsWith("#"));
}
const num = (v: string) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
const bool = (v: string) => /^(true|t|yes|y|1)$/i.test((v || "").trim());
const validDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`));

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
  if (parsed.length < 2) return json({ ok: false, error: "CSV must include a header row plus at least one data row" }, 400);
  const headers = parsed[0].map(h => h.trim().toLowerCase());
  const col = (n: string) => headers.indexOf(n);
  const ci = { did: col("driver_id"), fn: col("driver_first_name"), ln: col("driver_last_name"), date: col("log_date"),
    drive: col("drive_min"), duty: col("on_duty_min"), cyc: col("hours_70_8"), cycle: col("cycle"), brk: col("break_min"),
    eld: col("eld_source"), cert: col("certified") };
  if (ci.date < 0 || (ci.did < 0 && (ci.fn < 0 || ci.ln < 0))) return json({ ok: false, error: "CSV needs log_date and either driver_id or driver_first_name+driver_last_name" }, 400);

  const baseUrl = ctx.env.SUPABASE_URL.replace(/\/$/, ""); const sr = ctx.env.SUPABASE_SERVICE_ROLE;
  const carrierId = authority.carrierId; const cEnc = encodeURIComponent(carrierId);
  const supaH = { apikey: sr, Authorization: `Bearer ${sr}`, Accept: "application/json" };
  const drvR = await fetch(`${baseUrl}/rest/v1/compass_drivers?select=id,first_name,last_name&carrier_id=eq.${cEnc}&limit=20000`, { headers: supaH });
  const drivers = (await drvR.json()) as { id: string; first_name?: string; last_name?: string }[];
  const byId = new Set(drivers.map(d => d.id));
  const byName = new Map(drivers.map(d => [`${(d.first_name||"").toLowerCase()} ${(d.last_name||"").toLowerCase()}`.trim(), d.id]));

  const out: Record<string, unknown>[] = [];
  const errors: { row: number; reason: string }[] = [];
  for (let i = 1; i < parsed.length; i++) {
    const r = parsed[i]; const rowNo = i + 1;
    let driverId = ci.did >= 0 ? (r[ci.did] || "").trim() : "";
    if (driverId && !byId.has(driverId)) { errors.push({ row: rowNo, reason: "driver_id not in your fleet" }); continue; }
    if (!driverId && ci.fn >= 0 && ci.ln >= 0) {
      driverId = byName.get(`${(r[ci.fn]||"").toLowerCase().trim()} ${(r[ci.ln]||"").toLowerCase().trim()}`.trim()) || "";
      if (!driverId) { errors.push({ row: rowNo, reason: "driver name not found in your fleet" }); continue; }
    }
    if (!driverId) { errors.push({ row: rowNo, reason: "missing driver" }); continue; }
    const logDate = (r[ci.date] || "").trim();
    if (!validDate(logDate)) { errors.push({ row: rowNo, reason: "log_date must be YYYY-MM-DD" }); continue; }
    const rowObj = {
      drive_min: ci.drive >= 0 ? num(r[ci.drive]) : 0,
      on_duty_min: ci.duty >= 0 ? num(r[ci.duty]) : 0,
      hours_70_8: ci.cyc >= 0 ? num(r[ci.cyc]) : 0,
      cycle: ci.cycle >= 0 ? (r[ci.cycle] || "70_8").trim() : "70_8",
      break_min: ci.brk >= 0 ? num(r[ci.brk]) : null,
    };
    const { violations } = computeHosViolations(rowObj);
    out.push({
      carrier_id: carrierId, driver_id: driverId, log_date: logDate,
      total_drive_minutes: Math.round(rowObj.drive_min), total_on_duty_minutes: Math.round(rowObj.on_duty_min),
      violations, eld_source: (ci.eld >= 0 && r[ci.eld] ? r[ci.eld].trim() : "csv-import"),
      certified: ci.cert >= 0 ? bool(r[ci.cert]) : false,
    });
  }
  if (!out.length) return json({ ok: false, submitted: parsed.length - 1, inserted: 0, updated: 0, skipped: errors.length, errors });

  // idempotent: remove existing rows for these (driver,date) pairs, then insert.
  const dids = [...new Set(out.map(o => o.driver_id as string))];
  const dates = [...new Set(out.map(o => o.log_date as string))];
  try {
    await fetch(`${baseUrl}/rest/v1/compass_hos_logs?carrier_id=eq.${cEnc}&driver_id=in.(${dids.join(",")})&log_date=in.(${dates.map(d => `"${d}"`).join(",")})`, { method: "DELETE", headers: supaH });
  } catch { /* best effort */ }
  const ins = await fetch(`${baseUrl}/rest/v1/compass_hos_logs`, { method: "POST", headers: { ...supaH, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify(out) });
  if (!ins.ok) return json({ ok: false, error: `Insert failed ${ins.status}: ${(await ins.text()).slice(0, 200)}`, submitted: parsed.length - 1, inserted: 0, updated: 0, skipped: errors.length, errors }, 502);

  const flagged = out.filter(o => Array.isArray(o.violations) && (o.violations as unknown[]).length > 0).length;
  return json({ ok: true, submitted: parsed.length - 1, inserted: out.length, updated: 0, skipped: errors.length, flagged, errors });
};
