"use client";
import { useState, useEffect, useCallback } from "react";
import { getSupabase } from "@/lib/supabase";

export type FinanceEntry = {
  id: string;
  entry_date: string;
  type: "money_in" | "vendor" | "overhead" | "refund" | "owed";
  carrier_name: string | null;
  vendor: string | null;
  category: string | null;
  description: string | null;
  amount_cents: number;
  paid: boolean;
};

export type FinanceKpis = {
  money_in_cents: number;
  paid_vendors_cents: number;
  overhead_cents: number;
  refunds_cents: number;
  whats_left_cents: number;
};

export type ClientRow = {
  carrier_id: string;
  name: string;
  tier: string;
  primary_contact_email: string | null;
  hazmat_addon: boolean;
  drivers: number;
  tier_rate_cents: number;
  expected_mrr_cents: number;
  actual_revenue_cents: number;
  est_fees_cents: number;
  net_cents: number;
  delta_cents: number;
  status: "on_track" | "owed" | "overpaid" | "no_revenue" | "trial";
};

export type ClientTotals = {
  carriers: number;
  active_carriers: number;
  trialing_carriers: number;
  drivers: number;
  expected_mrr_cents: number;
  actual_revenue_cents: number;
  est_fees_cents: number;
  net_cents: number;
  owed_cents: number;
};

export type FinanceData = {
  entries: FinanceEntry[];
  kpis: FinanceKpis;
  vendors: string[];
  carriers: string[];
  clientRows: ClientRow[];
  clientTotals: ClientTotals;
  lastSyncAt: string | null;
  syncedNow: { inserted: number } | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addEntry: (e: Omit<FinanceEntry, "id">) => Promise<void>;
  exportCsv: () => void;
};

const EMPTY_KPIS: FinanceKpis = {
  money_in_cents: 0,
  paid_vendors_cents: 0,
  overhead_cents: 0,
  refunds_cents: 0,
  whats_left_cents: 0,
};

const EMPTY_TOTALS: ClientTotals = {
  carriers: 0,
  active_carriers: 0,
  trialing_carriers: 0,
  drivers: 0,
  expected_mrr_cents: 0,
  actual_revenue_cents: 0,
  est_fees_cents: 0,
  net_cents: 0,
  owed_cents: 0,
};

export function useFinance(_month?: string): FinanceData {
  const month = _month || new Date().toISOString().slice(0, 7);
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [kpis, setKpis] = useState<FinanceKpis>(EMPTY_KPIS);
  const [vendors, setVendors] = useState<string[]>([]);
  const [carriers, setCarriers] = useState<string[]>([]);
  const [clientRows, setClientRows] = useState<ClientRow[]>([]);
  const [clientTotals, setClientTotals] = useState<ClientTotals>(EMPTY_TOTALS);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [syncedNow, setSyncedNow] = useState<{ inserted: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const { data: { session } } = await getSupabase().auth.getSession();
    if (!session?.access_token) throw new Error("Authentication required");
    return { Authorization: `Bearer ${session.access_token}` };
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const headers = await authHeaders();
      const encodedMonth = encodeURIComponent(month);
      const [ledgerResponse, clientResponse] = await Promise.all([
        fetch(`/api/admin/finance?month=${encodedMonth}&view=ledger&sync=auto`, { cache: "no-store", headers }),
        fetch(`/api/admin/finance?month=${encodedMonth}&view=by-client&sync=skip`, { cache: "no-store", headers }),
      ]);
      const ledger = await ledgerResponse.json() as Partial<FinanceData> & { ok?: boolean; error?: string; last_sync_at?: string | null; synced_now?: { inserted: number } | null };
      const clients = await clientResponse.json() as { ok?: boolean; error?: string; rows?: ClientRow[]; totals?: ClientTotals };
      if (!ledgerResponse.ok || ledger.ok === false) throw new Error(ledger.error || `Finance ledger HTTP ${ledgerResponse.status}`);
      if (!clientResponse.ok || clients.ok === false) throw new Error(clients.error || `Finance clients HTTP ${clientResponse.status}`);
      setEntries(ledger.entries || []);
      setKpis(ledger.kpis || EMPTY_KPIS);
      setVendors(ledger.vendors || []);
      setCarriers(ledger.carriers || []);
      setClientRows(clients.rows || []);
      setClientTotals(clients.totals || EMPTY_TOTALS);
      setLastSyncAt(ledger.last_sync_at || null);
      setSyncedNow(ledger.synced_now || null);
    } catch (e) {
      setEntries([]); setKpis(EMPTY_KPIS); setVendors([]); setCarriers([]);
      setClientRows([]); setClientTotals(EMPTY_TOTALS);
      setError(e instanceof Error ? e.message : "Finance data could not be loaded");
    } finally { setLoading(false); }
  }, [authHeaders, month]);

  useEffect(() => { void refresh(); }, [refresh]);

  const addEntry = useCallback(async (entry: Omit<FinanceEntry, "id">) => {
    const headers = await authHeaders();
    const response = await fetch("/api/admin/finance", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });
    const body = await response.json() as { ok?: boolean; error?: string };
    if (!response.ok || body.ok === false) throw new Error(body.error || `Finance entry HTTP ${response.status}`);
    await refresh();
  }, [authHeaders, refresh]);

  const exportCsv = useCallback(() => {
    const quote = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const headings = ["entry_date", "type", "carrier_name", "vendor", "category", "description", "amount_cents", "paid"];
    const rows = entries.map((entry) => headings.map((key) => quote(entry[key as keyof FinanceEntry])).join(","));
    const blob = new Blob([[headings.join(","), ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a");
    anchor.href = url; anchor.download = `finance_${month}.csv`; anchor.click(); URL.revokeObjectURL(url);
  }, [entries, month]);

  return {
    entries,
    kpis,
    vendors,
    carriers,
    clientRows,
    clientTotals,
    lastSyncAt,
    syncedNow,
    loading,
    error,
    refresh,
    addEntry,
    exportCsv,
  };
}
