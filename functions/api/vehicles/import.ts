/**
 * POST /api/vehicles/import
 *
 * Body: { carrier_id: string, csv: string }
 *   OR: { carrier_id: string, rows: NormalizedVehicle[] }
 *
 * Same architecture as /api/drivers/import — alias-aware CSV parsing,
 * batched upsert, structured errors.
 */

import { mapCsvVehicleRow, upsertVehicles, type NormalizedVehicle } from "../../_shared/vendor-mapper";
import { correlationId, requireTenant, securityError, tenantPreflight, type SecurityEnv } from "../../_shared/request-security";

interface Env extends SecurityEnv {}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; continue; }
      if (c === '"') { inQuotes = false; continue; }
      field += c;
    } else {
      if (c === '"') { inQuotes = true; continue; }
      if (c === ",") { cur.push(field); field = ""; continue; }
      if (c === "\r") continue;
      if (c === "\n") { cur.push(field); rows.push(cur); cur = []; field = ""; continue; }
      field += c;
    }
  }
  if (field.length > 0 || cur.length > 0) { cur.push(field); rows.push(cur); }
  return rows.filter(r => r.length > 1 || (r.length === 1 && r[0] !== ""));
}

export const onRequestOptions: PagesFunction<Env> = async (ctx) =>
  tenantPreflight(ctx.request, ctx.env, "POST, OPTIONS");

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  let body: { carrier_id?: string; csv?: string; rows?: NormalizedVehicle[] };
  try { body = await ctx.request.json(); }
  catch { return json({ ok: false, error: "Invalid JSON" }, 400); }

  const requestId = correlationId(ctx.request);
  let authority;
  try { authority = await requireTenant(ctx.request, ctx.env, body.carrier_id); }
  catch { return securityError(503, "authorization_unavailable", requestId); }
  if (!authority.ok) return securityError(authority.status, authority.code, requestId);

  if (!body.carrier_id || typeof body.carrier_id !== "string") return json({ ok: false, error: "Missing carrier_id" }, 400);

  let rows: NormalizedVehicle[] = [];
  if (body.rows && Array.isArray(body.rows)) {
    rows = body.rows;
  } else if (typeof body.csv === "string" && body.csv.length > 0) {
    const parsed = parseCsv(body.csv);
    if (parsed.length < 2) return json({ ok: false, error: "CSV must include a header row and at least one data row" }, 400);
    const headers = parsed[0].map(h => h.trim().toLowerCase());
    for (let i = 1; i < parsed.length; i++) {
      const mapped = mapCsvVehicleRow(headers, parsed[i]);
      if (mapped) rows.push(mapped);
    }
  } else {
    return json({ ok: false, error: "Body must include either csv (string) or rows (array)" }, 400);
  }

  if (rows.length === 0) return json({ ok: false, error: "No valid rows found — every row must include vin or license_plate" }, 400);
  if (rows.length > 10_000) return json({ ok: false, error: `Too many rows (${rows.length}). Split into batches of 10,000 or fewer.` }, 413);

  const result = await upsertVehicles(ctx.env, authority.carrierId, rows);
  return json({
    ok: result.errors.length === 0,
    submitted: rows.length,
    inserted: result.inserted,
    updated: result.updated,
    skipped: result.skipped,
    errors: result.errors,
  });
};
