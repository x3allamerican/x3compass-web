/**
 * POST /api/admin/finance/sync-stripe?month=YYYY-MM
 *
 * Pulls every successful Stripe charge for the given month and inserts a
 * 'money_in' row in compass_finance_entries (deduped on stripe_id).
 * Returns counts of rows inserted vs. skipped (already existed).
 */
import { requireSuperAdmin, unauthorized, ok, serverError, type AdminEnv } from "../../../_shared/admin-auth";
import { supaFetch } from "../../../_shared/supabase-admin";
import { rateLimit } from "../../../_shared/rate-limit";

interface Env extends AdminEnv { STRIPE_SECRET_KEY?: string; }

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const _rl = rateLimit(ctx.request, { key: "finance-sync", max: 10, windowSec: 60 });
  if (_rl) return _rl;

  const who = await requireSuperAdmin(ctx); if (!who) return unauthorized();
  if (!ctx.env.STRIPE_SECRET_KEY) return serverError("STRIPE_SECRET_KEY not set", 500);
  const url = new URL(ctx.request.url);
  const month = url.searchParams.get("month") || new Date().toISOString().slice(0, 7);
  const [y, m] = month.split("-").map((n) => parseInt(n, 10));
  const startSec = Math.floor(Date.UTC(y, m - 1, 1) / 1000);
  const endSec   = Math.floor(Date.UTC(y, m,     1) / 1000);

  try {
    // Pull up to 100 succeeded charges in the window
    const r = await fetch(`https://api.stripe.com/v1/charges?created[gte]=${startSec}&created[lt]=${endSec}&limit=100`, { headers: { Authorization: `Bearer ${ctx.env.STRIPE_SECRET_KEY}` } });
    if (!r.ok) return serverError(`Stripe HTTP ${r.status}: ${await r.text()}`);
    const j = await r.json() as { data: Array<{ id: string; amount: number; status: string; created: number; description: string | null; billing_details: { name?: string; email?: string }; receipt_email: string | null }> };
    const supa = supaFetch(ctx.env);
    let inserted = 0, skipped = 0;
    for (const c of j.data) {
      if (c.status !== "succeeded") continue;
      const stripeId = `charge:${c.id}`;
      try {
        await supa.insert("compass_finance_entries", {
          entry_date:   new Date(c.created * 1000).toISOString().slice(0, 10),
          type:         "money_in",
          carrier_name: c.billing_details?.name || c.receipt_email || "(unknown)",
          vendor:       "Stripe",
          category:     "Subscription",
          description:  c.description || `Stripe charge ${c.id}`,
          amount_cents: c.amount,
          paid:         true,
          stripe_id:    stripeId,
        });
        inserted++;
      } catch (e) {
        if (String(e).includes("duplicate key")) skipped++;
        else throw e;
      }
    }
    return ok({ month, considered: j.data.length, inserted, skipped, note: skipped > 0 ? "Skipped rows were already imported from a prior sync" : undefined });
  } catch (e) { return serverError(e instanceof Error ? e.message : String(e)); }
};
