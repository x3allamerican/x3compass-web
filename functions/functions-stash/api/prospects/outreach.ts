import { rateLimit } from "../../_shared/rate-limit";
/**
 * POST /api/prospects/outreach
 * Body: { dot_numbers: string[], template_id: string }
 *
 * Queues outreach rows in fmcsa_outreach_log with status='queued' for each DOT.
 * The agent-fmcsa-outreach cron then picks them up Tue/Wed/Thu at 9am ET,
 * subject to the 50/day cap. Below-satisfactory carriers are skipped at queue
 * time — caller can override by passing skip_below_sat=false.
 *
 * Idempotent: if a (dot_number, template_id) already exists in any non-failed
 * status, the row is left alone.
 */

interface Env { SUPABASE_URL?: string; SUPABASE_SERVICE_ROLE?: string; }

const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });

type CarrierLite = { id: string; dot_number: string; legal_name: string; email: string | null; safety_rating: string | null };

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const _rl = rateLimit(ctx.request, { key: "bulk-outreach", max: 5, windowSec: 60 });
  if (_rl) return _rl;

  if (!ctx.env.SUPABASE_URL || !ctx.env.SUPABASE_SERVICE_ROLE) {
    return json({ ok: false, error: "Server missing Supabase env" }, 500);
  }
  let body: { dot_numbers?: string[]; template_id?: string; skip_below_sat?: boolean };
  try { body = await ctx.request.json(); } catch { return json({ ok: false, error: "Invalid JSON" }, 400); }

  const dots = (body.dot_numbers || []).filter(d => typeof d === "string" && d.length > 0);
  const templateId = (body.template_id || "").trim();
  const skipBelowSat = body.skip_below_sat !== false;

  if (dots.length === 0) return json({ ok: false, error: "dot_numbers required" }, 400);
  if (!templateId) return json({ ok: false, error: "template_id required" }, 400);

  const sb = ctx.env.SUPABASE_URL.replace(/\/$/, "");
  const sr = ctx.env.SUPABASE_SERVICE_ROLE;
  const hdr = { apikey: sr, Authorization: `Bearer ${sr}`, "Content-Type": "application/json", Prefer: "return=minimal" };

  // Hydrate carrier rows so we know email + safety_rating
  const carriersResp = await fetch(`${sb}/rest/v1/fmcsa_carriers?dot_number=in.(${dots.map(d => encodeURIComponent(d)).join(",")})&select=id,dot_number,legal_name,email,safety_rating`, { headers: hdr });
  const carriers = (await carriersResp.json()) as CarrierLite[];
  if (!Array.isArray(carriers) || carriers.length === 0) return json({ ok: false, error: "No matching carriers found" }, 404);

  // Pull existing outreach rows so we don't double-queue
  const existingResp = await fetch(`${sb}/rest/v1/fmcsa_outreach_log?dot_number=in.(${dots.map(d => encodeURIComponent(d)).join(",")})&template_id=eq.${encodeURIComponent(templateId)}&select=dot_number,status`, { headers: hdr });
  const existing = await existingResp.json() as { dot_number: string; status: string }[];
  const existingByDot = new Set(existing.filter(e => (e.status || "").toLowerCase() !== "failed").map(e => e.dot_number));

  let queued = 0, skipped = 0, skippedBelowSat = 0, skippedNoEmail = 0, skippedExisting = 0;
  const toInsert: Array<Record<string, unknown>> = [];

  for (const c of carriers) {
    if (existingByDot.has(c.dot_number)) { skippedExisting++; continue; }
    if (!c.email) { skippedNoEmail++; continue; }
    const r = (c.safety_rating || "").toUpperCase();
    if (skipBelowSat && (r === "CONDITIONAL" || r === "UNSATISFACTORY")) { skippedBelowSat++; continue; }
    toInsert.push({
      carrier_id: c.id, dot_number: c.dot_number, recipient_email: c.email,
      template_id: templateId, status: "queued", created_at: new Date().toISOString(),
    });
    queued++;
  }
  skipped = skippedBelowSat + skippedNoEmail + skippedExisting;

  if (toInsert.length > 0) {
    const insertResp = await fetch(`${sb}/rest/v1/fmcsa_outreach_log`, {
      method: "POST", headers: hdr, body: JSON.stringify(toInsert),
    });
    if (!insertResp.ok) {
      const errText = (await insertResp.text()).slice(0, 400);
      return json({ ok: false, error: `Insert failed: ${insertResp.status} ${errText}` }, 502);
    }
  }

  return json({ ok: true, queued, skipped, breakdown: { below_satisfactory: skippedBelowSat, no_email: skippedNoEmail, already_queued: skippedExisting } });
};
