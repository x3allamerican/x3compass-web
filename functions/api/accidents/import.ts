/**
 * POST /api/accidents/import — bulk import accident records from CSV.
 * Body: { carrier_id, csv }
 * Columns accepted: accident_date, driver_first_name, driver_last_name, license_plate,
 *   location, recordable, fatalities, injuries, tow_required, preventable
 *   (preventable|non_preventable|undetermined), description, cause_category.
 */

interface Env { SUPABASE_URL?: string; SUPABASE_SERVICE_ROLE?: string; }
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });

function parseCsv(text: string): string[][] {
  const rows: string[][] = []; let cur: string[] = []; let f = ""; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { f += '"'; i++; continue; }
      if (c === '"') { q = false; continue; }
      f += c;
    } else {
      if (c === '"') { q = true; continue; }
      if (c === ",") { cur.push(f); f = ""; continue; }
      if (c === "\r") continue;
      if (c === "\n") { cur.push(f); rows.push(cur); cur = []; f = ""; continue; }
      f += c;
    }
  }
  if (f.length || cur.length) { cur.push(f); rows.push(cur); }
  return rows.filter(r => r.length > 1 || (r.length === 1 && r[0] !== ""));
}

function bool(v: string): boolean { return /^(true|t|yes|y|1)$/i.test(v.trim()); }
function intOr(v: string, d = 0): number { const n = parseInt(v, 10); return Number.isFinite(n) ? n : d; }
const ALLOWED_PREVENT = new Set(["preventable", "non_preventable", "undetermined"]);

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  let body: { carrier_id?: string; csv?: string };
  try { body = await ctx.request.json(); } catch { return json({ ok: false, error: "Invalid JSON" }, 400); }
  if (!body.carrier_id) return json({ ok: false, error: "Missing carrier_id" }, 400);
  if (!body.csv) return json({ ok: false, error: "Missing csv" }, 400);
  if (!ctx.env.SUPABASE_URL || !ctx.env.SUPABASE_SERVICE_ROLE) return json({ ok: false, error: "Server missing Supabase env" }, 500);

  const parsed = parseCsv(body.csv);
  if (parsed.length < 2) return json({ ok: false, error: "CSV must include header + at least one row" }, 400);
  const headers = parsed[0].map(h => h.trim().toLowerCase());
  const col = (name: string) => headers.indexOf(name);

  // Look up drivers + vehicles for name/plate matching
  const baseUrl = ctx.env.SUPABASE_URL.replace(/\/$/, "");
  const sr = ctx.env.SUPABASE_SERVICE_ROLE;
  const supaH = { apikey: sr, Authorization: `Bearer ${sr}`, Accept: "application/json" };
  const [drvR, vehR] = await Promise.all([
    fetch(`${baseUrl}/rest/v1/compass_drivers?select=id,first_name,last_name&carrier_id=eq.${body.carrier_id}&limit=1000`, { headers: supaH }),
    fetch(`${baseUrl}/rest/v1/compass_vehicles?select=id,license_plate&carrier_id=eq.${body.carrier_id}&limit=1000`, { headers: supaH }),
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
    const acc = get("accident_date") || get("date");
    if (!acc) { errors.push({ row: i, reason: "missing accident_date" }); continue; }

    const fname = get("driver_first_name").toLowerCase();
    const lname = get("driver_last_name").toLowerCase();
    const driverId = drvByName.get(`${fname} ${lname}`.trim()) || null;
    const plate = get("license_plate").toUpperCase();
    const vehicleId = plate ? (vehByPlate.get(plate) || null) : null;

    let preventable: string | null = get("preventable").toLowerCase().replace(/\s+/g, "_");
    if (preventable === "not_preventable") preventable = "non_preventable";
    if (!preventable || !ALLOWED_PREVENT.has(preventable)) preventable = null;

    out.push({
      carrier_id: body.carrier_id,
      driver_id: driverId,
      vehicle_id: vehicleId,
      accident_date: acc,
      location: get("location") || null,
      recordable: bool(get("recordable")),
      fatalities: intOr(get("fatalities"), 0),
      injuries: intOr(get("injuries"), 0),
      tow_required: bool(get("tow_required")),
      preventable,
      description: get("description") || null,
      cause_category: get("cause_category") || null,
    });
  }
  if (out.length === 0) return json({ ok: false, submitted: 0, errors, error: "No valid rows" }, 400);

  try {
    const r = await fetch(`${baseUrl}/rest/v1/compass_accidents`, {
      method: "POST",
      headers: { ...supaH, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(out),
    });
    if (!r.ok) {
      const text = (await r.text()).slice(0, 300);
      return json({ ok: false, submitted: out.length, error: `Supabase ${r.status}: ${text}`, errors }, 500);
    }
    const inserted = await r.json() as unknown[];
    return json({ ok: errors.length === 0, submitted: out.length, inserted: inserted.length, skipped: 0, updated: 0, errors });
  } catch (err) {
    return json({ ok: false, error: err instanceof Error ? err.message : String(err) }, 500);
  }
};
