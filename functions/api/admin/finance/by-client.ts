/**
 * GET /api/admin/finance/by-client?month=YYYY-MM
 *
 * Per-carrier financial breakdown for the month:
 *   - active driver count (compass_drivers)
 *   - service tier + hazmat addon
 *   - expected MRR (tier rate × drivers + hazmat addon)
 *   - actual Stripe revenue MTD (from compass_finance_entries seeded by sync)
 *   - Stripe fees (estimated 2.9% + $0.30 per charge — until we pull balance_transaction)
 *   - delta / owed
 *
 * This is the "central place to capture how much money coming in from each
 * client and total" — Joshua's words.
 */
import { requireSuperAdmin, unauthorized, ok, serverError, type AdminEnv } from "../../../_shared/admin-auth";
import { supaFetch } from "../../../_shared/supabase-admin";

interface Env extends AdminEnv { STRIPE_SECRET_KEY?: string; }

const TIER_RATE_CENTS: Record<string, number> = {
  diy:        2500,   // $25/driver/mo
  dfy:        5000,   // $50/driver/mo
  enterprise:    0,   // negotiated — show actual Stripe revenue instead
};
const HAZMAT_ADDON_CENTS = 9900; // $99/mo flat

function monthRange(month: string) {
  const [y, m] = month.split("-").map((n) => parseInt(n, 10));
  return {
    startSec: Math.floor(Date.UTC(y, m - 1, 1) / 1000),
    endSec:   Math.floor(Date.UTC(y, m,     1) / 1000),
    startIso: new Date(Date.UTC(y, m - 1, 1)).toISOString().slice(0, 10),
    endIso:   new Date(Date.UTC(y, m,     1)).toISOString().slice(0, 10),
  };
}

interface CarrierRow {
  id: string;
  name: string;
  service_tier: string | null;
  hazmat_addon: boolean | null;
  subscription_status: string | null;
  stripe_customer_id: string | null;
  primary_contact_email: string | null;
  created_at: string;
}

interface DriverRow {
  carrier_id: string;
  status: string | null;
}

interface EntryRow {
  carrier_id: string | null;
  carrier_name: string | null;
  amount_cents: number;
  type: string;
  stripe_id: string | null;
}

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const who = await requireSuperAdmin(ctx); if (!who) return unauthorized();
  const url = new URL(ctx.request.url);
  const month = url.searchParams.get("month") || new Date().toISOString().slice(0, 7);
  const { startIso, endIso } = monthRange(month);

  try {
    const supa = supaFetch(ctx.env);

    // 1. All carriers
    const carriers = await supa.select(
      "compass_carriers",
      "select=id,name,service_tier,hazmat_addon,subscription_status,stripe_customer_id,primary_contact_email,created_at&order=name.asc",
    ) as CarrierRow[];

    // 2. Active driver counts by carrier
    const drivers = await supa.select(
      "compass_drivers",
      "select=carrier_id,status",
    ) as DriverRow[];
    const driversByCarrier = new Map<string, number>();
    for (const d of drivers) {
      const status = (d.status || "").toLowerCase();
      if (status === "active" || status === "" || status === null) {
        driversByCarrier.set(d.carrier_id, (driversByCarrier.get(d.carrier_id) || 0) + 1);
      }
    }

    // 3. Stripe revenue MTD per carrier (from our ledger, which is seeded by sync)
    const entries = await supa.select(
      "compass_finance_entries",
      `select=carrier_id,carrier_name,amount_cents,type,stripe_id&entry_date=gte.${startIso}&entry_date=lt.${endIso}&type=eq.money_in&limit=2000`,
    ) as EntryRow[];

    const revByCarrierId    = new Map<string, number>();
    const revByCarrierName  = new Map<string, number>();
    const chargesByCarrier  = new Map<string, number>();
    for (const e of entries) {
      const amt = Number(e.amount_cents || 0);
      if (e.carrier_id) {
        revByCarrierId.set(e.carrier_id, (revByCarrierId.get(e.carrier_id) || 0) + amt);
        chargesByCarrier.set(e.carrier_id, (chargesByCarrier.get(e.carrier_id) || 0) + 1);
      } else if (e.carrier_name) {
        const k = e.carrier_name.trim().toLowerCase();
        revByCarrierName.set(k, (revByCarrierName.get(k) || 0) + amt);
      }
    }

    // 4. Build per-client rows
    const rows = carriers.map((c) => {
      const drivers = driversByCarrier.get(c.id) || 0;
      const tier = (c.service_tier || "diy").toLowerCase();
      const tierRate = TIER_RATE_CENTS[tier] ?? 0;
      const hazmatAddon = c.hazmat_addon ? HAZMAT_ADDON_CENTS : 0;
      const expectedMrrCents = drivers * tierRate + hazmatAddon;

      // Find actual revenue: prefer carrier_id match, fall back to name match
      let actualCents = revByCarrierId.get(c.id) || 0;
      if (!actualCents) {
        actualCents = revByCarrierName.get(c.name.trim().toLowerCase()) || 0;
      }
      const chargeCount = chargesByCarrier.get(c.id) || 0;

      // Stripe fee estimate: 2.9% + $0.30 per charge
      const estFeesCents = Math.round(actualCents * 0.029 + chargeCount * 30);
      const netCents = actualCents - estFeesCents;

      const deltaCents = actualCents - expectedMrrCents;
      let status: "on_track" | "owed" | "overpaid" | "no_revenue" | "trial";
      if ((c.subscription_status || "").toLowerCase() === "trialing") status = "trial";
      else if (actualCents === 0 && expectedMrrCents > 0) status = "owed";
      else if (Math.abs(deltaCents) <= 500) status = "on_track";  // within $5
      else if (deltaCents < 0) status = "owed";
      else status = "overpaid";

      return {
        carrier_id: c.id,
        name: c.name,
        tier,
        hazmat_addon: !!c.hazmat_addon,
        drivers,
        tier_rate_cents: tierRate,
        expected_mrr_cents: expectedMrrCents,
        actual_revenue_cents: actualCents,
        est_fees_cents: estFeesCents,
        net_cents: netCents,
        delta_cents: deltaCents,
        charge_count: chargeCount,
        subscription_status: c.subscription_status,
        stripe_customer_id: c.stripe_customer_id,
        primary_contact_email: c.primary_contact_email,
        status,
      };
    });

    // 5. Totals
    const totals = rows.reduce((acc, r) => ({
      drivers:               acc.drivers               + r.drivers,
      expected_mrr_cents:    acc.expected_mrr_cents    + r.expected_mrr_cents,
      actual_revenue_cents:  acc.actual_revenue_cents  + r.actual_revenue_cents,
      est_fees_cents:        acc.est_fees_cents        + r.est_fees_cents,
      net_cents:             acc.net_cents             + r.net_cents,
      owed_cents:            acc.owed_cents            + Math.max(0, -r.delta_cents),
      carriers:              acc.carriers              + 1,
      active_carriers:       acc.active_carriers       + ((r.subscription_status === "active") ? 1 : 0),
      trialing_carriers:     acc.trialing_carriers     + ((r.subscription_status === "trialing") ? 1 : 0),
    }), { drivers: 0, expected_mrr_cents: 0, actual_revenue_cents: 0, est_fees_cents: 0, net_cents: 0, owed_cents: 0, carriers: 0, active_carriers: 0, trialing_carriers: 0 });

    return ok({ month, rows, totals });
  } catch (e) {
    return serverError(e instanceof Error ? e.message : String(e));
  }
};
