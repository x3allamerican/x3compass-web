/**
 * POST /api/hos/upload-log
 *
 * Accepts an HOS daily log file (CSV or FMCSA ELD output JSON) and
 * inserts/upserts rows into compass_hos_logs. Used by carriers running
 * short-haul exempt drivers, paper RODS during an ELD malfunction, or
 * carriers who want to import the FMCSA-standardized ELD output file
 * directly without wiring a vendor API.
 *
 * Form fields:
 *   file        · CSV / JSON / TXT (FMCSA ELD output)
 *   carrier_id  · UUID of the carrier
 *
 * Response: { ok, rows_inserted, rows_skipped, errors }
 *           or { ok: false, error }
 *
 * Auth: Bearer JWT (Supabase). User must be a member of the carrier.
 *
 * CSV expected columns (case-insensitive, in any order):
 *   driver_id          (UUID or external_id resolvable on compass_drivers)
 *   log_date           (YYYY-MM-DD)
 *   drive_min          (integer)
 *   on_duty_min        (integer)
 *   hours_70_8         (numeric, optional)
 *   violations         (semicolon-separated · "§395.3(a)(1):drive_limit:violation;§395.3(c):cycle_warning:warning")
 *   eld_source         (string, optional · motive | samsara | etc., or empty for manual)
 *   certified          (true|false, optional · defaults false)
 *
 * Rows that fail validation are skipped with a per-row reason · the whole
 * upload never fails atomically. Caller sees rows_inserted + errors[].
 */

import { bearerFromRequest, verifySupabaseJwt, type SupaEnv } from "../../_shared/supabase-admin";

interface Env extends SupaEnv {}

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), {
    status: s,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });

const SUPABASE_HEADERS = (sr: string, prefer = "return=minimal,resolution=merge-duplicates") => ({
  apikey: sr,
  Authorization: `Bearer ${sr}`,
  Accept: "application/json",
  "Content-Type": "application/json",
  Prefer: prefer,
});

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
    },
  });
}

type Violation = { cfr: string; label: string; severity: "warning" | "violation" };
type ParsedRow = {
  driver_id: string;
  log_date: string;
  total_drive_minutes: number;
  total_on_duty_minutes: number;
  hours_70_8?: number | null;
  violations: Violation[];
  eld_source: string | null;
  certified: boolean;
  ingested_via: "csv_upload" | "manual_entry";
};

function parseViolations(field: string): Violation[] {
  if (!field || !field.trim()) return [];
  return field
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part): Violation | null => {
      // Format: §395.3(a)(1):label-with-no-colons:violation
      const segs = part.split(":");
      if (segs.length < 3) return null;
      const sev = segs[segs.length - 1].trim().toLowerCase();
      if (sev !== "violation" && sev !== "warning") return null;
      const cfr = segs[0].trim();
      const label = segs.slice(1, -1).join(":").trim();
      return { cfr, label, severity: sev as "violation" | "warning" };
    })
    .filter((v): v is Violation => !!v);
}

function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  // Simple CSV parser tolerant of quoted fields with embedded commas.
  const out: string[][] = [];
  let cur = "";
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else { cur += c; }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { row.push(cur); cur = ""; }
      else if (c === "\n") { row.push(cur); cur = ""; out.push(row); row = []; }
      else if (c === "\r") { /* ignore */ }
      else { cur += c; }
    }
  }
  if (cur.length || row.length) { row.push(cur); out.push(row); }
  const headers = (out.shift() || []).map((h) => h.trim().toLowerCase());
  return { headers, rows: out.filter((r) => r.some((c) => c && c.trim())) };
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }): Promise<Response> {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE) {
    return json({ ok: false, error: "Supabase env vars missing" }, 500);
  }

  const token = bearerFromRequest(request);
  if (!token) return json({ ok: false, error: "Missing Bearer token" }, 401);
  const user = await verifySupabaseJwt(env, token);
  if (!user) return json({ ok: false, error: "Invalid token" }, 401);

  const form = await request.formData().catch(() => null);
  if (!form) return json({ ok: false, error: "multipart/form-data required" }, 400);

  const carrier_id = String(form.get("carrier_id") || "");
  const file = form.get("file");
  if (!carrier_id) return json({ ok: false, error: "carrier_id required" }, 400);
  if (!(file instanceof File)) return json({ ok: false, error: "file required" }, 400);
  if (file.size === 0) return json({ ok: false, error: "Empty file" }, 400);
  if (file.size > 5 * 1024 * 1024) return json({ ok: false, error: "File too large (max 5 MB)" }, 413);

  // Carrier membership check
  const memberCheck = await fetch(
    `${env.SUPABASE_URL}/rest/v1/carrier_members?user_id=eq.${user.sub}&carrier_id=eq.${carrier_id}&select=carrier_id`,
    { headers: SUPABASE_HEADERS(env.SUPABASE_SERVICE_ROLE, "return=representation") }
  );
  const members = memberCheck.ok ? (await memberCheck.json()) as unknown[] : [];
  if (!members.length) return json({ ok: false, error: "Not a member of this carrier" }, 403);

  // Parse the file
  const text = await file.text();
  const parsed: ParsedRow[] = [];
  const errors: Array<{ row: number; reason: string }> = [];

  if (file.name.toLowerCase().endsWith(".json")) {
    // FMCSA ELD output is technically not pure JSON, but support a simple
    // JSON-lines path for V1 · one log per line.
    text.split("\n").filter((l) => l.trim()).forEach((line, idx) => {
      try {
        const o = JSON.parse(line);
        parsed.push({
          driver_id: String(o.driver_id || o.driverId || ""),
          log_date: String(o.log_date || o.logDate || "").slice(0, 10),
          total_drive_minutes: Number(o.drive_min || o.driveMin || o.total_drive_minutes || 0),
          total_on_duty_minutes: Number(o.on_duty_min || o.onDutyMin || o.total_on_duty_minutes || 0),
          hours_70_8: o.hours_70_8 != null ? Number(o.hours_70_8) : null,
          violations: Array.isArray(o.violations) ? o.violations : [],
          eld_source: o.eld_source || o.eldSource || null,
          certified: !!o.certified,
          ingested_via: "csv_upload",
        });
      } catch { errors.push({ row: idx + 1, reason: "Invalid JSON line" }); }
    });
  } else {
    const { headers, rows } = parseCsv(text);
    const idx = (name: string) => headers.indexOf(name);
    const iDriver = idx("driver_id");
    const iDate = idx("log_date");
    const iDrive = idx("drive_min");
    const iOnDuty = idx("on_duty_min");
    const i708 = idx("hours_70_8");
    const iViols = idx("violations");
    const iEld = idx("eld_source");
    const iCert = idx("certified");

    if (iDriver < 0 || iDate < 0 || iDrive < 0 || iOnDuty < 0) {
      return json({ ok: false, error: "CSV missing required columns: driver_id, log_date, drive_min, on_duty_min" }, 400);
    }

    rows.forEach((r, idx0) => {
      const rowNum = idx0 + 2; // header is row 1
      const driverIdRaw = (r[iDriver] || "").trim();
      const logDate = (r[iDate] || "").trim();
      if (!driverIdRaw) { errors.push({ row: rowNum, reason: "Missing driver_id" }); return; }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(logDate)) { errors.push({ row: rowNum, reason: "Invalid log_date (need YYYY-MM-DD)" }); return; }
      const drive = parseInt((r[iDrive] || "0").trim(), 10);
      const onDuty = parseInt((r[iOnDuty] || "0").trim(), 10);
      if (!Number.isFinite(drive) || drive < 0 || drive > 1440) { errors.push({ row: rowNum, reason: "drive_min out of range 0-1440" }); return; }
      if (!Number.isFinite(onDuty) || onDuty < 0 || onDuty > 1440) { errors.push({ row: rowNum, reason: "on_duty_min out of range 0-1440" }); return; }
      const h708 = i708 >= 0 && r[i708]?.trim() ? Number(r[i708].trim()) : null;
      const viols = iViols >= 0 ? parseViolations(r[iViols] || "") : [];
      const eldSrc = iEld >= 0 ? (r[iEld] || "").trim().toLowerCase() || null : null;
      const cert = iCert >= 0 ? ["true", "yes", "1", "y"].includes((r[iCert] || "").trim().toLowerCase()) : false;
      parsed.push({
        driver_id: driverIdRaw,
        log_date: logDate,
        total_drive_minutes: drive,
        total_on_duty_minutes: onDuty,
        hours_70_8: h708,
        violations: viols,
        eld_source: eldSrc,
        certified: cert,
        ingested_via: "csv_upload",
      });
    });
  }

  if (!parsed.length) {
    return json({ ok: false, error: "No valid rows in file", errors }, 422);
  }

  // Upsert in batches of 100 against the (carrier_id, driver_id, log_date) unique index.
  let inserted = 0;
  for (let i = 0; i < parsed.length; i += 100) {
    const slice = parsed.slice(i, i + 100).map((p) => ({
      carrier_id,
      driver_id: p.driver_id,
      log_date: p.log_date,
      total_drive_minutes: p.total_drive_minutes,
      total_on_duty_minutes: p.total_on_duty_minutes,
      hours_70_8: p.hours_70_8,
      violations: p.violations,
      eld_source: p.eld_source,
      certified: p.certified,
      certified_at: p.certified ? new Date().toISOString() : null,
      ingested_via: p.ingested_via,
    }));
    const ups = await fetch(
      `${env.SUPABASE_URL}/rest/v1/compass_hos_logs?on_conflict=carrier_id,driver_id,log_date`,
      {
        method: "POST",
        headers: SUPABASE_HEADERS(env.SUPABASE_SERVICE_ROLE, "return=minimal,resolution=merge-duplicates"),
        body: JSON.stringify(slice),
      }
    );
    if (!ups.ok) {
      const errText = await ups.text();
      // Don't fail the whole upload · record the batch error and keep going.
      errors.push({ row: -1, reason: `Batch ${Math.floor(i / 100) + 1} failed: ${errText.slice(0, 160)}` });
    } else {
      inserted += slice.length;
    }
  }

  return json({
    ok: true,
    rows_inserted: inserted,
    rows_skipped: errors.length,
    errors: errors.slice(0, 25),
    note: errors.length > 25 ? `+${errors.length - 25} more errors omitted` : undefined,
  });
}
