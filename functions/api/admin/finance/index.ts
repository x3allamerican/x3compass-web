/**
 * GET  /api/admin/finance?month=YYYY-MM[&sync=auto|skip]
 *   - Default: AUTO-syncs Stripe for the requested month if last sync > 5 min ago.
 *   - Returns: { kpis, entries, vendors, carriers, last_sync_at, synced_now }
 *
 * POST /api/admin/finance
 *   - Inserts a manual ledger row (overhead, vendor cost, refund, owed, etc.)
 */
import { requireSuperAdmin, unauthorized, ok, serverError, type AdminEnv } from "../../../_shared/admin-auth";
import { supaFetch } from "../../../_shared/supabase-admin";

interface Env extends AdminEnv { STRIPE_SECRET_KEY?: string; }

function monthRange(month: string): { start: string; end: string; startSec: number; endSec: number } {
  const [y, m] = month.split("-").map((n) => parseInt(n, 10));
  return {
    start:    new Date(Date.UTC(y, m - 1, 1)).toISOString().slice(0, 10),
    end:      new Date(Date.UTC(y, m,     1)).toISOString().slice(0, 10),
    startSec: Math.floor(Date.UTC(y, m - 1, 1) / 1000),
    endSec:   Math.floor(Date.UTC(y, m,     1) / 1000),
  };
}

/**
 * Pull Stripe charges for the window and seed compass_finance_entries.
 * Deduped via stripe_id unique constraint. Returns insert count.
 */
async function autoSyncStripe(env: Env, month: string): Promise<{ inserted: number; skipped: number; errors: number; carriersResolved: number }> {
  if (!env.STRIPE_SECRET_KEY) return { inserted: 0, skipped: 0, errors: 1, carriersResolved: 0 };
  const { startSec, endSec } = monthRange(month);
  const supa = supaFetch(env);

  // Pre-load carriers indexed by stripe_customer_id so each charge can be tagged
  const carriers = await supa.select(
    "compass_carriers",
    "select=id,name,stripe_customer_id&stripe_customer_id=not.is.null",
  ) as Array<{ id: string; name: string; stripe_customer_id: string }>;
  const byCust = new Map(carriers.map((c) => [c.stripe_customer_id, c]));

  let inserted = 0, skipped = 0, errors = 0, carriersResolved = 0;
  let startingAfter: string | undefined;
  // Page through up to 5 pages (500 charges) per sync — covers virtually any small fleet
  for (let page = 0; page < 5; page++) {
    const params = new URLSearchParams({
      [`created[gte]`]: String(startSec),
      [`created[lt]`]:  String(endSec),
      limit: "100",
    });
    if (startingAfter) params.set("starting_after", startingAfter);
    const r = await fetch(`https://api.stripe.com/v1/charges?${params}`, {
      headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` },
    });
    if (!r.ok) { errors++; break; }
    const j = await r.json() as { data: Array<{ id: string; amount: number; status: string; created: number; description: string | null; customer: string | null; billing_details: { name?: string; email?: string }; receipt_email: string | null }>; has_more: boolean };
    for (const c of j.data) {
      if (c.status !== "succeeded") continue;
      const stripeId = `charge:${c.id}`;
      const carrier = c.customer ? byCust.get(c.customer) : undefined;
      if (carrier) carriersResolved++;
      try {
        await supa.insert("compass_finance_entries", {
          entry_date:   new Date(c.created * 1000).toISOString().slice(0, 10),
          type:         "money_in",
          carrier_id:   carrier?.id || null,
          carrier_name: carrier?.name || c.billing_details?.name || c.receipt_email || "(unknown)",
          vendor:       "Stripe",
          category:     "Subscription",
          description:  c.description || `Stripe charge ${c.id}`,
          amount_cents: c.amount,
          paid:         true,
          stripe_id:    stripeId,
        });
        inserted++;
      } catch (e) {
        if (String(e).includes("duplicate key")) skipped++; else errors++;
      }
    }
    if (!j.has_more || j.data.length === 0) break;
    startingAfter = j.data[j.data.length - 1].id;
  }
  return { inserted, skipped, errors, carriersResolved };
}

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const who = await requireSuperAdmin(ctx); if (!who) return unauthorized();
  const url = new URL(ctx.request.url);
  const month = url.searchParams.get("month") || new Date().toISOString().slice(0, 7);
  const syncMode = url.searchParams.get("sync") || "auto";

  try {
    const supa = supaFetch(ctx.env);
    const { start, end } = monthRange(month);

    // Check last sync for this month
    const lastSyncRows = await supa.select(
      "compass_finance_entries",
      `select=created_at&type=eq.money_in&entry_date=gte.${start}&entry_date=lt.${end}&vendor=eq.Stripe&order=created_at.desc&limit=1`,
    ) as Array<{ created_at: string }>;
    const lastSyncAt = lastSyncRows[0]?.created_at || null;
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;
    const needsSync = syncMode !== "skip" && (!lastSyncAt || new Date(lastSyncAt).getTime() < fiveMinAgo);

    let syncResult = null;
    if (needsSync) {
      syncResult = await autoSyncStripe(ctx.env, month);
    }

    const entries = await supa.select(
      "compass_finance_entries",
      `select=*&entry_date=gte.${start}&entry_date=lt.${end}&order=entry_date.desc,created_at.desc&limit=500`,
    ) as Array<{ type: string; amount_cents: number; carrier_name: string | null; vendor: string | null }>;

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
      last_sync_at: lastSyncAt,
      synced_now:   syncResult,
    });
  } catch (e) { return serverError(e instanceof Error ? e.message : String(e)); }
};

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
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
