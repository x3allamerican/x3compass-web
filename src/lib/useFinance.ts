"use client";
import { useState, useEffect, useCallback } from "react";

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
  const [loading, setLoading] = useState(false);
  const [error] = useState<string | null>(null);

  useEffect(() => { /* TODO: fetch /api/admin/finance?sync=auto */ }, [_month]);

  const refresh = useCallback(async () => { setLoading(false); }, []);
  const addEntry = useCallback(async (_e: Omit<FinanceEntry, "id">) => { /* TODO */ }, []);
  const exportCsv = useCallback(() => { /* TODO */ }, []);

  return {
    entries: [],
    kpis: EMPTY_KPIS,
    vendors: [],
    carriers: [],
    clientRows: [],
    clientTotals: EMPTY_TOTALS,
    lastSyncAt: null,
    syncedNow: null,
    loading,
    error,
    refresh,
    addEntry,
    exportCsv,
  };
}
