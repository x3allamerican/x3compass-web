/**
 * POST /api/drivers/import
 *
 * Body: { carrier_id: string, csv: string }
 *   OR: { carrier_id: string, rows: NormalizedDriver[] }
 *
 * Parses CSV (RFC 4180 with quoted fields + commas inside quotes) OR accepts
 * a pre-normalized rows array (used by vendor sync paths). Upserts to
 * compass_drivers via the shared vendor-mapper.
 *
 * Required env: SUPABASE_URL, SUPABASE_SERVICE_ROLE
 * Auth: v1 open (will gate on JWT when Supabase auth is wired into the app).
 */

import { mapCsvRow, upsertDrivers, type NormalizedDriver } from "../../_shared/vendor-mapper";

interface Env {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE?: string;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });

// Minimal RFC 4180 CSV parser (handles quoted fields with embedded commas / newlines)
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

export const onRequestOptions: PagesFunction<Env> = async () =>
  new Response(null, { status: 503, headers: { "Cache-Control": "no-store" } });

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  // P0 containment: this endpoint previously accepted an arbitrary carrier_id
  // and wrote with the service role. Keep it unavailable until tenant
  // membership is verified server-side.
  return json({ ok: false, error: "temporarily unavailable" }, 503);

  /* c8 ignore start -- retained for the authenticated follow-up commit */
  let body: { carrier_id?: string; csv?: string; rows?: NormalizedDriver[] };
  try {
    body = await ctx.request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON" }, 400);
  }

  if (!body.carrier_id || typeof body.carrier_id !== "string") {
    return json({ ok: false, error: "Missing carrier_id" }, 400);
  }

  let rows: NormalizedDriver[] = [];

  if (body.rows && Array.isArray(body.rows)) {
    rows = body.rows;
  } else if (typeof body.csv === "string" && body.csv.length > 0) {
    const parsed = parseCsv(body.csv);
    if (parsed.length < 2) {
      return json({ ok: false, error: "CSV must include a header row and at least one data row" }, 400);
    }
    const headers = parsed[0].map(h => h.trim().toLowerCase());
    for (let i = 1; i < parsed.length; i++) {
      const mapped = mapCsvRow(headers, parsed[i]);
      if (mapped) rows.push(mapped);
    }
  } else {
    return json({ ok: false, error: "Body must include either csv (string) or rows (array)" }, 400);
  }

  if (rows.length === 0) {
    return json({ ok: false, error: "No valid rows found — every row must include first_name + last_name" }, 400);
  }

  if (rows.length > 10_000) {
    return json({ ok: false, error: `Too many rows (${rows.length}). Split into batches of 10,000 or fewer.` }, 413);
  }

  const result = await upsertDrivers(ctx.env, body.carrier_id, rows);
  return json({
    ok: result.errors.length === 0,
    submitted: rows.length,
    inserted: result.inserted,
    updated: result.updated,
    skipped: result.skipped,
    errors: result.errors,
  });
  /* c8 ignore stop */
};
