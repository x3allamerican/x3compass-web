/**
 * GET /api/admin/finance/by-client?month=YYYY-MM
 *
 * Per-carrier financial breakdown for the month. Joins:
 *   - compass_carriers (tier, hazmat addon, Stripe customer)
 *   - compass_drivers (active head count)
 *   - compass_finance_entries (Stripe-seeded money_in rows for the month)
 *
 * Computes per-carrier expected MRR, actual revenue, Stripe fees, and owed delta.
 */
import { requireSuperAdmin, unauthorized, ok, serverError, type AdminEnv } from "../../../_shared/admin-auth";
import { supaFetch } from "../../../_shared/supabase-admin";

const TIER_RATE_CENTS: Record<string, number> = { diy: 2500, dfy: 5000, enterprise: 0 };
const HAZMAT_ADDON_CENTS = 9900;

export const onRequestGet: PagesFunction<AdminEnv> = async (ctx) => {
  const who = await requireSuperAdmin(ctx);
  if (!who) return unauthorized();

  try {
    const url = new URL(ctx.request.url);
    const month = url.searchParams.get("month") || new Date().toISOString().slice(0, 7);
    const parts = month.split("-");
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const startIso = new Date(Date.UTC(y, m - 1, 1)).toISOString().slice(0, 10);
    const endIso   = new Date(Date.UTC(y, m,     1)).toISOString().slice(0, 10);

    const supa = supaFetch(ctx.env);

    const carriers = await supa.select(
      "compass_carriers",
      "select=id,name,service_tier,hazmat_addon,subscription_status,stripe_customer_id,primary_contact_email,created_at&order=name.asc",
    ) as Array<{ id: string; name: string; service_tier: string | null; hazmat_addon: boolean | null; subscription_status: string | null; stripe_customer_id: string | null; primary_contact_email: string | null; created_at: string }>;

    const drivers = await supa.select("compass_drivers", "select=carrier_id,status") as Array<{ carrier_id: string; status: string | null }>;
    const driversByCarrier = new Map<string, number>();
    for (const d of drivers) {
      const status = (d.status || "active").toLowerCase();
      if (status === "active") {
        driversByCarrier.set(d.carrier_id, (driversByCarrier.get(d.carrier_id) || 0) + 1);
      }
    }

    const entries = await supa.select(
      "compass_finance_entries",
      `select=carrier_id,carrier_name,amount_cents,type,stripe_id&entry_date=gte.${startIso}&entry_date=lt.${endIso}&type=eq.money_in&limit=2000`,
    ) as Array<{ carrier_id: string | null; carrier_name: string | null; amount_cents: number; type: string; stripe_id: string | null }>;

    const revByCarrierId   = new Map<string, number>();
    const revByCarrierName = new Map<string, number>();
    const chargesByCarrier = new Map<string, number>();
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

    const rows = carriers.map((c) => {
      const driverCount = driversByCarrier.get(c.id) || 0;
      const tier = (c.service_tier || "diy").toLowerCase();
      const tierRate = TIER_RATE_CENTS[tier] || 0;
      const hazmatAddon = c.hazmat_addon ? HAZMAT_ADDON_CENTS : 0;
      const expectedMrrCents = driverCount * tierRate + hazmatAddon;
      let actualCents = revByCarrierId.get(c.id) || 0;
      if (!actualCents) actualCents = revByCarrierName.get(c.name.trim().toLowerCase()) || 0;
      const chargeCount = chargesByCarrier.get(c.id) || 0;
      const estFeesCents = Math.round(actualCents * 0.029 + chargeCount * 30);
      const netCents = actualCents - estFeesCents;
      const deltaCents = actualCents - expectedMrrCents;

      let status: string;
      const subStatus = (c.subscription_status || "").toLowerCase();
      if (subStatus === "trialing") status = "trial";
      else if (actualCents === 0 && expectedMrrCents > 0) status = "owed";
      else if (Math.abs(deltaCents) <= 500) status = "on_track";
      else if (deltaCents < 0) status = "owed";
      else status = "overpaid";

      return {
        carrier_id: c.id,
        name: c.name,
        tier: tier,
        hazmat_addon: !!c.hazmat_addon,
        drivers: driverCount,
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
        status: status,
      };
    });

    const totals = {
      drivers: 0,
      expected_mrr_cents: 0,
      actual_revenue_cents: 0,
      est_fees_cents: 0,
      net_cents: 0,
      owed_cents: 0,
      carriers: rows.length,
      active_carriers: 0,
      trialing_carriers: 0,
    };
    for (const r of rows) {
      totals.drivers              += r.drivers;
      totals.expected_mrr_cents   += r.expected_mrr_cents;
      totals.actual_revenue_cents += r.actual_revenue_cents;
      totals.est_fees_cents       += r.est_fees_cents;
      totals.net_cents            += r.net_cents;
      if (r.delta_cents < 0)      totals.owed_cents += -r.delta_cents;
      if (r.subscription_status === "active")   totals.active_carriers++;
      if (r.subscription_status === "trialing") totals.trialing_carriers++;
    }

    return ok({ month: month, rows: rows, totals: totals });
  } catch (e) {
    return serverError(e instanceof Error ? e.message : String(e));
  }
};
