/**
 * GET  /api/admin/finance?month=YYYY-MM
 *   Returns:
 *     - kpis: { money_in_cents, paid_vendors_cents, overhead_cents, refunds_cents,
 *               whats_left_cents, owed_to_us_cents }
 *     - entries: full list for the month, ordered desc
 *     - vendors: distinct vendors seen
 *     - carriers: distinct carriers seen
 *
 * POST /api/admin/finance
 *   Body: { entry_date?, type, carrier_name?, vendor?, category?, description?, amount_cents, paid? }
 *   Inserts a new ledger row.
 */
import { requireSuperAdmin, unauthorized, ok, serverError, type AdminEnv } from "../../../_shared/admin-auth";
import { supaFetch } from "../../../_shared/supabase-admin";

function monthRange(month: string): { start: string; end: string } {
  // month = "2026-05"; return ISO dates for start of month and start of next month
  const [y, m] = month.split("-").map((n) => parseInt(n, 10));
  const start = new Date(Date.UTC(y, m - 1, 1)).toISOString().slice(0, 10);
  const end   = new Date(Date.UTC(y, m,     1)).toISOString().slice(0, 10);
  return { start, end };
}

export const onRequestGet: PagesFunction<AdminEnv> = async (ctx) => {
  const who = await requireSuperAdmin(ctx); if (!who) return unauthorized();
  const url = new URL(ctx.request.url);
  const month = url.searchParams.get("month") || new Date().toISOString().slice(0, 7);
  try {
    const supa = supaFetch(ctx.env);
    const { start, end } = monthRange(month);
    const entries = await supa.select("compass_finance_entries", `select=*&entry_date=gte.${start}&entry_date=lt.${end}&order=entry_date.desc,created_at.desc&limit=500`) as Array<{ type: string; amount_cents: number; carrier_name: string | null; vendor: string | null }>;
    const sumOf = (t: string) => entries.filter((e) => e.type === t).reduce((a, b) => a + Number(b.amount_cents || 0), 0);
    const moneyIn  = sumOf("money_in");
    const vendors  = sumOf("vendor");
    const overhead = sumOf("overhead");
    const refunds  = sumOf("refund");
    const owed     = sumOf("owed");
    const left     = moneyIn - vendors - overhead - refunds;
    const distinctVendors  = Array.from(new Set(entries.map((e) => e.vendor).filter(Boolean))) as string[];
    const distinctCarriers = Array.from(new Set(entries.map((e) => e.carrier_name).filter(Boolean))) as string[];
    return ok({
      month,
      kpis: { money_in_cents: moneyIn, paid_vendors_cents: vendors, overhead_cents: overhead, refunds_cents: refunds, whats_left_cents: left, owed_to_us_cents: owed },
      entries,
      vendors:  distinctVendors,
      carriers: distinctCarriers,
    });
  } catch (e) { return serverError(e instanceof Error ? e.message : String(e)); }
};

export const onRequestPost: PagesFunction<AdminEnv> = async (ctx) => {
  const who = await requireSuperAdmin(ctx); if (!who) return unauthorized();
  let body: Record<string, unknown>;
  try { body = await ctx.request.json(); } catch { return serverError("Invalid JSON body", 400); }
  const ALLOWED = new Set(["entry_date","type","carrier_id","carrier_name","vendor","category","description","amount_cents","paid","stripe_id","notes"]);
  const row: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) if (ALLOWED.has(k)) row[k] = v;
  if (!row.type || !row.amount_cents) return serverError("type and amount_cents are required", 400);
  try {
    const supa = supaFetch(ctx.env);
    const inserted = await supa.insert("compass_finance_entries", row);
    return ok({ entry: (inserted as unknown[])[0] || null });
  } catch (e) { return serverError(e instanceof Error ? e.message : String(e)); }
};
