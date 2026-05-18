"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";

export interface FinanceEntry {
  id: string;
  entry_date: string;
  type: "money_in" | "vendor" | "overhead" | "refund" | "owed";
  carrier_id: string | null;
  carrier_name: string | null;
  vendor: string | null;
  category: string | null;
  description: string | null;
  amount_cents: number;
  paid: boolean;
  stripe_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface FinanceKpis {
  money_in_cents:     number;
  paid_vendors_cents: number;
  overhead_cents:     number;
  refunds_cents:      number;
  whats_left_cents:   number;
  owed_to_us_cents:   number;
}

export interface ClientRow {
  carrier_id: string;
  name: string;
  tier: string;
  hazmat_addon: boolean;
  drivers: number;
  tier_rate_cents: number;
  expected_mrr_cents: number;
  actual_revenue_cents: number;
  est_fees_cents: number;
  net_cents: number;
  delta_cents: number;
  charge_count: number;
  subscription_status: string | null;
  stripe_customer_id: string | null;
  primary_contact_email: string | null;
  status: "on_track" | "owed" | "overpaid" | "no_revenue" | "trial";
}

export interface ClientTotals {
  drivers: number;
  expected_mrr_cents: number;
  actual_revenue_cents: number;
  est_fees_cents: number;
  net_cents: number;
  owed_cents: number;
  carriers: number;
  active_carriers: number;
  trialing_carriers: number;
}

const EMPTY_KPIS: FinanceKpis = { money_in_cents: 0, paid_vendors_cents: 0, overhead_cents: 0, refunds_cents: 0, whats_left_cents: 0, owed_to_us_cents: 0 };
const EMPTY_TOTALS: ClientTotals = { drivers: 0, expected_mrr_cents: 0, actual_revenue_cents: 0, est_fees_cents: 0, net_cents: 0, owed_cents: 0, carriers: 0, active_carriers: 0, trialing_carriers: 0 };

async function authHeader(): Promise<Record<string, string>> {
  const { data: { session } } = await getSupabase().auth.getSession();
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
}

export function useFinance(month: string) {
  const [entries, setEntries]   = useState<FinanceEntry[]>([]);
  const [kpis, setKpis]         = useState<FinanceKpis>(EMPTY_KPIS);
  const [vendors, setVendors]   = useState<string[]>([]);
  const [carriers, setCarriers] = useState<string[]>([]);
  const [clientRows, setClientRows]   = useState<ClientRow[]>([]);
  const [clientTotals, setClientTotals] = useState<ClientTotals>(EMPTY_TOTALS);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [syncedNow, setSyncedNow]   = useState<{ inserted: number; skipped: number; errors: number; carriersResolved: number } | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const refresh = useCallback(async (opts?: { skipSync?: boolean }) => {
    setLoading(true); setError(null);
    try {
      const auth = await authHeader();
      const sync = opts?.skipSync ? "&sync=skip" : "";
      // Run ledger fetch + by-client in parallel
      const [r1, r2] = await Promise.all([
        fetch(`/api/admin/finance?month=${month}${sync}`,           { headers: auth, cache: "no-store" }),
        fetch(`/api/admin/finance?view=by-client&month=${month}`,        { headers: auth, cache: "no-store" }),
      ]);
      if (!r1.ok) throw new Error(`Finance GET HTTP ${r1.status}: ${await r1.text()}`);
      if (!r2.ok) throw new Error(`By-client GET HTTP ${r2.status}: ${await r2.text()}`);
      const j1 = await r1.json(); const j2 = await r2.json();
      setEntries(j1.entries || []);
      setKpis(j1.kpis || EMPTY_KPIS);
      setVendors(j1.vendors || []);
      setCarriers(j1.carriers || []);
      setLastSyncAt(j1.last_sync_at || null);
      setSyncedNow(j1.synced_now || null);
      setClientRows(j2.rows || []);
      setClientTotals(j2.totals || EMPTY_TOTALS);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [month]);

  const addEntry = useCallback(async (row: Partial<FinanceEntry>) => {
    const auth = await authHeader();
    const r = await fetch("/api/admin/finance", { method: "POST", headers: { ...auth, "Content-Type": "application/json" }, body: JSON.stringify(row) });
    if (!r.ok) throw new Error(`POST HTTP ${r.status}: ${await r.text()}`);
    await refresh({ skipSync: true });
  }, [refresh]);

  const exportCsv = useCallback(async () => {
    const auth = await authHeader();
    const r = await fetch(`/api/admin/finance/export?month=${month}`, { headers: auth });
    if (!r.ok) throw new Error(`Export HTTP ${r.status}`);
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `compass-finance-${month}.csv`; a.click();
    URL.revokeObjectURL(url);
  }, [month]);

  useEffect(() => { void refresh(); }, [refresh]);

  return { entries, kpis, vendors, carriers, clientRows, clientTotals, lastSyncAt, syncedNow, loading, error, refresh, addEntry, exportCsv };
}
