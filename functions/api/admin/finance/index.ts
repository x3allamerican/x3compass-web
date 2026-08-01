/**
 * GET  /api/admin/finance?month=YYYY-MM[&sync=auto|skip][&view=ledger|by-client]
 *
 *   view=ledger     (default): returns kpis, entries, vendors, carriers
 *   view=by-client            : returns per-carrier rows + totals
 *   Auto-syncs Stripe if last sync > 5 min ago, unless sync=skip.
 *
 * POST /api/admin/finance
 *   Inserts a manual ledger row.
 */
import { requireSuperAdmin, unauthorized, ok, serverError, type AdminEnv } from "../../../_shared/admin-auth";
import { supaFetch } from "../../../_shared/supabase-admin";

interface Env extends AdminEnv { STRIPE_SECRET_KEY?: string; }

const TIER_RATE_CENTS: Record<string, number> = { diy: 2500, dfy: 5000, enterprise: 0 };
const HAZMAT_ADDON_CENTS = 9900;

function monthRange(month: string): { start: string; end: string; startSec: number; endSec: number } {
  const [y, m] = month.split("-").map((n) => parseInt(n, 10));
  return {
    start:    new Date(Date.UTC(y, m - 1, 1)).toISOString().slice(0, 10),
    end:      new Date(Date.UTC(y, m,     1)).toISOString().slice(0, 10),
    startSec: Math.floor(Date.UTC(y, m - 1, 1) / 1000),
    endSec:   Math.floor(Date.UTC(y, m,     1) / 1000),
  };
}

async function autoSyncStripe(env: Env, month: string) {
  if (!env.STRIPE_SECRET_KEY) return { inserted: 0, skipped: 0, errors: 1, carriersResolved: 0 };
  const { startSec, endSec } = monthRange(month);
  const supa = supaFetch(env);
  const carriers = await supa.select("compass_carriers", "select=id,name,stripe_customer_id&stripe_customer_id=not.is.null") as Array<{ id: string; name: string; stripe_customer_id: string }>;
  const byCust = new Map(carriers.map((c) => [c.stripe_customer_id, c]));
  let inserted = 0, skipped = 0, errors = 0, carriersResolved = 0;
  let startingAfter: string | undefined;
  for (let page = 0; page < 5; page++) {
    const params = new URLSearchParams({ [`created[gte]`]: String(startSec), [`created[lt]`]: String(endSec), limit: "100" });
    if (startingAfter) params.set("starting_after", startingAfter);
    const r = await fetch(`https://api.stripe.com/v1/charges?${params}`, { headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` } });
    if (!r.ok) { errors++; break; }
    const j = await r.json() as { data: Array<{ id: string; amount: number; status: string; created: number; description: string | null; customer: string | null; billing_details: { name?: string; email?: string }; receipt_email: string | null }>; has_more: boolean };
    for (const c of j.data) {
      if (c.status !== "succeeded") continue;
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
          stripe_id:    `charge:${c.id}`,
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

async function buildByClientView(env: Env, month: string) {
  const supa = supaFetch(env);
  const { start, end } = monthRange(month);

  const carriers = await supa.select(
    "compass_carriers",
    "select=id,name,service_tier,hazmat_addon,subscription_status,stripe_customer_id,primary_contact_email,created_at&order=name.asc",
  ) as Array<{ id: string; name: string; service_tier: string | null; hazmat_addon: boolean | null; subscription_status: string | null; stripe_customer_id: string | null; primary_contact_email: string | null; created_at: string }>;

  const drivers = await supa.select("compass_drivers", "select=carrier_id,status") as Array<{ carrier_id: string; status: string | null }>;
  const driversByCarrier = new Map<string, number>();
  for (const d of drivers) {
    const status = (d.status || "active").toLowerCase();
    if (status === "active") driversByCarrier.set(d.carrier_id, (driversByCarrier.get(d.carrier_id) || 0) + 1);
  }

  const entries = await supa.select(
    "compass_finance_entries",
    `select=carrier_id,carrier_name,amount_cents,type,stripe_id&entry_date=gte.${start}&entry_date=lt.${end}&type=eq.money_in&limit=2000`,
  ) as Array<{ carrier_id: string | null; carrier_name: string | null; amount_cents: number; type: string; stripe_id: string | null }>;

  const revById = new Map<string, number>();
  const revByName = new Map<string, number>();
  const chargesById = new Map<string, number>();
  for (const e of entries) {
    const amt = Number(e.amount_cents || 0);
    if (e.carrier_id) {
      revById.set(e.carrier_id, (revById.get(e.carrier_id) || 0) + amt);
      chargesById.set(e.carrier_id, (chargesById.get(e.carrier_id) || 0) + 1);
    } else if (e.carrier_name) {
      const k = e.carrier_name.trim().toLowerCase();
      revByName.set(k, (revByName.get(k) || 0) + amt);
    }
  }

  const rows = carriers.map((c) => {
    const driverCount = driversByCarrier.get(c.id) || 0;
    const tier = (c.service_tier || "diy").toLowerCase();
    const tierRate = TIER_RATE_CENTS[tier] || 0;
    const hazmatAddon = c.hazmat_addon ? HAZMAT_ADDON_CENTS : 0;
    const expectedMrr = driverCount * tierRate + hazmatAddon;
    let actual = revById.get(c.id) || 0;
    if (!actual) actual = revByName.get(c.name.trim().toLowerCase()) || 0;
    const charges = chargesById.get(c.id) || 0;
    const estFees = Math.round(actual * 0.029 + charges * 30);
    const delta = actual - expectedMrr;
    const subStatus = (c.subscription_status || "").toLowerCase();
    let status: string;
    if (subStatus === "trialing") status = "trial";
    else if (actual === 0 && expectedMrr > 0) status = "owed";
    else if (Math.abs(delta) <= 500) status = "on_track";
    else if (delta < 0) status = "owed";
    else status = "overpaid";
    return {
      carrier_id: c.id, name: c.name, tier, hazmat_addon: !!c.hazmat_addon,
      drivers: driverCount, tier_rate_cents: tierRate,
      expected_mrr_cents: expectedMrr, actual_revenue_cents: actual,
      est_fees_cents: estFees, net_cents: actual - estFees, delta_cents: delta,
      charge_count: charges, subscription_status: c.subscription_status,
      stripe_customer_id: c.stripe_customer_id,
      primary_contact_email: c.primary_contact_email, status,
    };
  });

  const totals = { drivers: 0, expected_mrr_cents: 0, actual_revenue_cents: 0, est_fees_cents: 0, net_cents: 0, owed_cents: 0, carriers: rows.length, active_carriers: 0, trialing_carriers: 0 };
  for (const r of rows) {
    totals.drivers              += r.drivers;
    totals.expected_mrr_cents   += r.expected_mrr_cents;
    totals.actual_revenue_cents += r.actual_revenue_cents;
    totals.est_fees_cents       += r.est_fees_cents;
    totals.net_cents            += r.net_cents;
    if (r.delta_cents < 0)                       totals.owed_cents += -r.delta_cents;
    if (r.subscription_status === "active")      totals.active_carriers++;
    if (r.subscription_status === "trialing")    totals.trialing_carriers++;
  }
  return { rows, totals };
}

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const who = await requireSuperAdmin(ctx); if (!who) return unauthorized();
  const url = new URL(ctx.request.url);
  const month = url.searchParams.get("month") || new Date().toISOString().slice(0, 7);
  const view  = url.searchParams.get("view")  || "ledger";
  const syncMode = url.searchParams.get("sync") || "auto";

  try {
    const supa = supaFetch(ctx.env);
    const { start, end } = monthRange(month);

    // Last-sync check for auto-sync
    const lastSyncRows = await supa.select(
      "compass_finance_entries",
      `select=created_at&type=eq.money_in&entry_date=gte.${start}&entry_date=lt.${end}&vendor=eq.Stripe&order=created_at.desc&limit=1`,
    ) as Array<{ created_at: string }>;
    const lastSyncAt = lastSyncRows[0]?.created_at || null;
    const needsSync = syncMode !== "skip" && (!lastSyncAt || (Date.now() - new Date(lastSyncAt).getTime() > 5 * 60 * 1000));
    let syncResult = null;
    if (needsSync) syncResult = await autoSyncStripe(ctx.env, month);

    if (view === "by-client" || view === "byclient" || view === "clients") {
      const byClient = await buildByClientView(ctx.env, month);
      return ok({ month, view: "by-client", ...byClient, last_sync_at: lastSyncAt, synced_now: syncResult });
    }

    // default: ledger view
    const entries = await supa.select(
      "compass_finance_entries",
      `select=*&entry_date=gte.${start}&entry_date=lt.${end}&order=entry_date.desc,created_at.desc&limit=500`,
    ) as Array<{ type: string; amount_cents: number; carrier_name: string | null; vendor: string | null }>;
    const sumOf = (t: string) => entries.filter((e) => e.type === t).reduce((a, b) => a + Number(b.amount_cents || 0), 0);
    const moneyIn = sumOf("money_in"), vendors = sumOf("vendor"), overhead = sumOf("overhead"), refunds = sumOf("refund"), owed = sumOf("owed");
    const left = moneyIn - vendors - overhead - refunds;
    const distinctVendors  = Array.from(new Set(entries.map((e) => e.vendor).filter(Boolean))) as string[];
    const distinctCarriers = Array.from(new Set(entries.map((e) => e.carrier_name).filter(Boolean))) as string[];
    return ok({ month, view: "ledger", kpis: { money_in_cents: moneyIn, paid_vendors_cents: vendors, overhead_cents: overhead, refunds_cents: refunds, whats_left_cents: left, owed_to_us_cents: owed }, entries, vendors: distinctVendors, carriers: distinctCarriers, last_sync_at: lastSyncAt, synced_now: syncResult });
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
