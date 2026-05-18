"use client";
import { useEffect, useState, useCallback } from "react";
import { getSupabase } from "./supabase";

export type Entry = { id: string; entry_date: string; type: "money_in"|"vendor"|"overhead"|"refund"|"owed"; carrier_name: string|null; vendor: string|null; category: string|null; description: string|null; amount_cents: number; paid: boolean; stripe_id?: string|null };
export type Kpis = { money_in_cents: number; paid_vendors_cents: number; overhead_cents: number; refunds_cents: number; whats_left_cents: number; owed_to_us_cents: number };

async function authHeaders(): Promise<HeadersInit> {
  try { const tok = (await getSupabase().auth.getSession()).data.session?.access_token; return tok ? { Authorization: `Bearer ${tok}` } : {}; } catch { return {}; }
}

export function useFinance(month: string) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [kpis, setKpis]       = useState<Kpis>({ money_in_cents: 0, paid_vendors_cents: 0, overhead_cents: 0, refunds_cents: 0, whats_left_cents: 0, owed_to_us_cents: 0 });
  const [vendors,  setVendors]  = useState<string[]>([]);
  const [carriers, setCarriers] = useState<string[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const h = await authHeaders();
      const r = await fetch(`/api/admin/finance?month=${encodeURIComponent(month)}`, { headers: h });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json() as { ok: boolean; entries: Entry[]; kpis: Kpis; vendors: string[]; carriers: string[]; error?: string };
      if (!j.ok) throw new Error(j.error || "API returned ok=false");
      setEntries(j.entries); setKpis(j.kpis); setVendors(j.vendors); setCarriers(j.carriers);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    setLoading(false);
  }, [month]);

  useEffect(() => { refresh(); }, [refresh]);

  const addEntry = useCallback(async (entry: Omit<Entry, "id"|"stripe_id"> & { stripe_id?: string }) => {
    const h = await authHeaders();
    const r = await fetch("/api/admin/finance", { method: "POST", headers: { ...h, "Content-Type": "application/json" }, body: JSON.stringify(entry) });
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
    await refresh();
  }, [refresh]);

  const syncStripe = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const h = await authHeaders();
      const r = await fetch(`/api/admin/finance/sync-stripe?month=${encodeURIComponent(month)}`, { method: "POST", headers: h });
      const j = await r.json() as { ok: boolean; inserted?: number; skipped?: number; considered?: number; error?: string };
      if (!j.ok) throw new Error(j.error || "Sync failed");
      await refresh();
      return j as { inserted: number; skipped: number; considered: number };
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); throw e; }
    finally { setLoading(false); }
  }, [month, refresh]);

  const exportCsv = useCallback(async () => {
    const h = await authHeaders();
    const r = await fetch(`/api/admin/finance/export?month=${encodeURIComponent(month)}`, { headers: h });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `x3-finance-${month}.csv`; a.click(); URL.revokeObjectURL(url);
  }, [month]);

  return { entries, kpis, vendors, carriers, loading, error, refresh, addEntry, syncStripe, exportCsv };
}

export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map((n) => parseInt(n, 10));
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

export function listMonths(count = 12): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    out.push(d.toISOString().slice(0, 7));
  }
  return out;
}
