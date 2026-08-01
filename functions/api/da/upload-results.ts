/**
 * POST /api/da/upload-results
 *
 * Carrier uploads D&A test results from their byo_manual C/TPA. Same
 * tolerant-CSV + idempotent-upsert shape as /api/hos/upload-log.
 *
 * CSV columns (case-insensitive, in any order):
 *   driver_id        · UUID from compass_drivers
 *   test_date        · YYYY-MM-DD
 *   test_type        · pre_employment | random | reasonable_suspicion |
 *                      post_accident | return_to_duty | follow_up
 *   panel            · DOT_5_panel | DOT_BAT | non_DOT_panel | other (default DOT_5_panel)
 *   result           · negative | negative_dilute | positive | adulterated |
 *                      substituted | refusal | cancelled | pending
 *   result_detail    · optional · e.g., "amphetamines + cocaine"
 *   mro_verified_at  · optional · YYYY-MM-DD or ISO-8601
 *   ccf_specimen_id  · optional · chain-of-custody form #
 *
 * Form fields: file, carrier_id
 * Response: { ok, rows_inserted, rows_skipped, errors }
 *
 * Auth: Bearer JWT · carrier membership required.
 *
 * Side effect: every positive | refusal | adulterated | substituted row
 * auto-creates a TODO marker in compass_clearinghouse_violations queue
 * (V2 will wire that hook · for now we surface the count in the response
 * so the UI can prompt the carrier to report to FMCSA Clearinghouse).
 *
 * See: 49 CFR §382.601 · §382.605 · §382.705
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

const VALID_TEST_TYPES = [
  "pre_employment","random","reasonable_suspicion","post_accident","return_to_duty","follow_up",
];
const VALID_RESULTS = [
  "negative","negative_dilute","positive","adulterated","substituted","refusal","cancelled","pending",
];

type ParsedRow = {
  driver_id: string;
  test_date: string;
  test_type: string;
  panel: string;
  result: string;
  result_detail: string | null;
  mro_verified_at: string | null;
  ccf_specimen_id: string | null;
};

function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const out: string[][] = [];
  let cur = ""; let row: string[] = []; let inQuotes = false;
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
      else if (c === "\r") { /* skip */ }
      else { cur += c; }
    }
  }
  if (cur.length || row.length) { row.push(cur); out.push(row); }
  // Strip comment lines + empty rows.
  const filtered = out.filter((r) => r.length && !(r[0] || "").trim().startsWith("#"));
  const headers = (filtered.shift() || []).map((h) => h.trim().toLowerCase());
  return { headers, rows: filtered.filter((r) => r.some((c) => c && c.trim())) };
}

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

  // Carrier membership + read which C/TPA they have configured (so we can
  // stamp ctpa_id onto every result row · audit lineage for free).
  const memberCheck = await fetch(
    `${env.SUPABASE_URL}/rest/v1/carrier_members?user_id=eq.${user.sub}&carrier_id=eq.${carrier_id}&select=carrier_id`,
    { headers: SUPABASE_HEADERS(env.SUPABASE_SERVICE_ROLE, "return=representation") }
  );
  const members = memberCheck.ok ? (await memberCheck.json()) as unknown[] : [];
  if (!members.length) return json({ ok: false, error: "Not a member of this carrier" }, 403);

  const carrierLookup = await fetch(
    `${env.SUPABASE_URL}/rest/v1/carriers?id=eq.${carrier_id}&select=ctpa_id`,
    { headers: SUPABASE_HEADERS(env.SUPABASE_SERVICE_ROLE, "return=representation") }
  );
  const carrierRows = carrierLookup.ok ? await carrierLookup.json() as Array<{ ctpa_id: string | null }> : [];
  const ctpaId = carrierRows[0]?.ctpa_id || null;

  // Parse + validate
  const text = await file.text();
  const { headers, rows } = parseCsv(text);
  const idx = (n: string) => headers.indexOf(n);
  const iDriver = idx("driver_id");
  const iDate = idx("test_date");
  const iType = idx("test_type");
  const iPanel = idx("panel");
  const iResult = idx("result");
  const iDetail = idx("result_detail");
  const iMro = idx("mro_verified_at");
  const iCcf = idx("ccf_specimen_id");

  if (iDriver < 0 || iDate < 0 || iType < 0 || iResult < 0) {
    return json({ ok: false, error: "CSV missing required columns: driver_id, test_date, test_type, result" }, 400);
  }

  const parsed: ParsedRow[] = [];
  const errors: Array<{ row: number; reason: string }> = [];
  rows.forEach((r, idx0) => {
    const rowNum = idx0 + 2;
    const driverId = (r[iDriver] || "").trim();
    const testDate = (r[iDate] || "").trim();
    const testType = (r[iType] || "").trim().toLowerCase();
    const result = (r[iResult] || "").trim().toLowerCase();
    const panel = iPanel >= 0 ? (r[iPanel] || "").trim() || "DOT_5_panel" : "DOT_5_panel";
    const detail = iDetail >= 0 ? (r[iDetail] || "").trim() || null : null;
    const mro = iMro >= 0 ? (r[iMro] || "").trim() : "";
    const ccf = iCcf >= 0 ? (r[iCcf] || "").trim() || null : null;

    if (!driverId) { errors.push({ row: rowNum, reason: "Missing driver_id" }); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(testDate)) { errors.push({ row: rowNum, reason: "Invalid test_date (need YYYY-MM-DD)" }); return; }
    if (!VALID_TEST_TYPES.includes(testType)) { errors.push({ row: rowNum, reason: `Invalid test_type · must be one of ${VALID_TEST_TYPES.join(", ")}` }); return; }
    if (!VALID_RESULTS.includes(result)) { errors.push({ row: rowNum, reason: `Invalid result · must be one of ${VALID_RESULTS.join(", ")}` }); return; }

    let mroIso: string | null = null;
    if (mro) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(mro)) mroIso = `${mro}T00:00:00Z`;
      else if (/^\d{4}-\d{2}-\d{2}T/.test(mro)) mroIso = mro;
      else { errors.push({ row: rowNum, reason: "mro_verified_at must be YYYY-MM-DD or ISO-8601" }); return; }
    }

    parsed.push({
      driver_id: driverId,
      test_date: testDate,
      test_type: testType,
      panel,
      result,
      result_detail: detail,
      mro_verified_at: mroIso,
      ccf_specimen_id: ccf,
    });
  });

  if (!parsed.length) {
    return json({ ok: false, error: "No valid rows in file", errors }, 422);
  }

  // Upsert in batches.
  let inserted = 0;
  let reportableToClearinghouse = 0;
  for (let i = 0; i < parsed.length; i += 100) {
    const slice = parsed.slice(i, i + 100).map((p) => ({
      carrier_id,
      driver_id: p.driver_id,
      test_date: p.test_date,
      test_type: p.test_type,
      panel: p.panel,
      result: p.result,
      result_detail: p.result_detail,
      mro_verified_at: p.mro_verified_at,
      ccf_specimen_id: p.ccf_specimen_id,
      ctpa_id: ctpaId,
      ingested_via: "csv_upload",
    }));
    const ups = await fetch(
      `${env.SUPABASE_URL}/rest/v1/compass_drug_tests?on_conflict=carrier_id,driver_id,test_date,test_type`,
      {
        method: "POST",
        headers: SUPABASE_HEADERS(env.SUPABASE_SERVICE_ROLE, "return=minimal,resolution=merge-duplicates"),
        body: JSON.stringify(slice),
      }
    );
    if (!ups.ok) {
      errors.push({ row: -1, reason: `Batch ${Math.floor(i / 100) + 1} failed: ${(await ups.text()).slice(0, 160)}` });
    } else {
      inserted += slice.length;
      reportableToClearinghouse += slice.filter((s) => ["positive","adulterated","substituted","refusal"].includes(s.result)).length;
    }
  }

  return json({
    ok: true,
    rows_inserted: inserted,
    rows_skipped: errors.length,
    reportable_to_clearinghouse: reportableToClearinghouse,
    note: reportableToClearinghouse > 0
      ? `${reportableToClearinghouse} reportable result(s) detected · these must be reported to the FMCSA Clearinghouse within 3 business days (§382.705(b)(1)). Visit /app/clearinghouse to file.`
      : undefined,
    errors: errors.slice(0, 25),
  });
}
