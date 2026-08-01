"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { SkeletonShell, SkeletonChart } from "@/components/Skeleton";
import { X3AdminHero, X3KPITile, X3AdminTabs } from "@/components/X3AdminHero";
import { useIsSuperAdmin } from "@/lib/superAdmin";
import { useFinance, type FinanceEntry } from "@/lib/useFinance";
import { getSupabase } from "@/lib/supabase";

// ---------------- Helpers ----------------
const TIER_LABEL: Record<string, string> = { compass: "X3 Compass", diy: "X3 Compass", dfy: "X3 Compass", enterprise: "X3 Compass" };

function fmt(cents: number) {
  return (cents / 100).toLocaleString(undefined, { style: "currency", currency: "USD" });
}
function relTime(iso: string | null): string {
  if (!iso) return "never";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(iso).toLocaleString();
}
function lastTwelveMonths(): string[] {
  const out: string[] = []; const d = new Date();
  for (let i = 0; i < 12; i++) { out.push(d.toISOString().slice(0, 7)); d.setMonth(d.getMonth() - 1); }
  return out;
}

// ---------------- Theme-aware pills (light + dark legible) ----------------
const TYPE_PILL: Record<string, string> = {
  money_in: "bg-emerald-100 dark:bg-emerald-500/45 text-emerald-900 dark:text-emerald-50 border-emerald-700 dark:border-emerald-300/80",
  vendor:   "bg-amber-100   dark:bg-amber-500/45   text-amber-900   dark:text-amber-50   border-amber-700   dark:border-amber-300/80",
  overhead: "bg-cyan-100    dark:bg-cyan-500/45    text-cyan-900    dark:text-cyan-50    border-cyan-700    dark:border-cyan-300/80",
  refund:   "bg-rose-100    dark:bg-rose-500/45    text-rose-900    dark:text-rose-50    border-rose-700    dark:border-rose-300/80",
  owed:     "bg-violet-100  dark:bg-violet-500/45  text-violet-900  dark:text-violet-50  border-violet-700  dark:border-violet-300/80",
};
function TypePill({ type }: { type: string }) {
  const cls = TYPE_PILL[type] || TYPE_PILL.overhead;
  return <span role="status" aria-label={`Entry type: ${type}`} className={`inline-block min-w-[80px] px-2 py-0.5 rounded-full text-[10px] font-extrabold border whitespace-nowrap text-center tracking-wider uppercase ${cls}`}>{type.replace("_", " ")}</span>;
}

const STATUS_PILL: Record<string, { label: string; cls: string }> = {
  on_track:   { label: "ON TRACK",  cls: "bg-emerald-100 dark:bg-emerald-500/45 text-emerald-900 dark:text-emerald-50 border-emerald-700 dark:border-emerald-300/80" },
  owed:       { label: "OWED",      cls: "bg-rose-100    dark:bg-rose-500/45    text-rose-900    dark:text-rose-50    border-rose-700    dark:border-rose-300/80" },
  overpaid:   { label: "OVERPAID",  cls: "bg-cyan-100    dark:bg-cyan-500/45    text-cyan-900    dark:text-cyan-50    border-cyan-700    dark:border-cyan-300/80" },
  no_revenue: { label: "NO REVENUE",cls: "bg-amber-100   dark:bg-amber-500/45   text-amber-900   dark:text-amber-50   border-amber-700   dark:border-amber-300/80" },
  trial:      { label: "TRIAL",     cls: "bg-violet-100  dark:bg-violet-500/45  text-violet-900  dark:text-violet-50  border-violet-700  dark:border-violet-300/80" },
};
function StatusPill({ status }: { status: string }) {
  const s = STATUS_PILL[status] || { label: status.toUpperCase(), cls: STATUS_PILL.on_track.cls };
  return <span className={`inline-block min-w-[100px] px-2 py-0.5 rounded-full text-[10px] font-extrabold border whitespace-nowrap text-center tracking-wider uppercase ${s.cls}`}>{s.label}</span>;
}

// ---------------- 12-month trend ----------------
type TrendRow = { period_month: string; revenue_cents: number; cost_cents: number; net_cents: number; subscription_count: number };
function useTrend() {
  const [rows, setRows] = useState<TrendRow[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const { data } = await getSupabase().from("finance_monthly_summary").select("*").order("period_month", { ascending: false }).limit(12);
        setRows((data as TrendRow[]) || []);
      } catch { setRows([]); }
      finally { setLoading(false); }
    })();
  }, []);
  return { rows, loading };
}

// ---------------- Page ----------------
export default function FinancePage() {
  const isSuperAdmin = useIsSuperAdmin();
  const months = lastTwelveMonths();
  const [month, setMonth] = useState(months[0]);
  const [tab, setTab] = useState<"clients" | "ledger" | "owed" | "trend" | "add">("clients");

  const { entries, kpis, vendors, carriers, clientRows, clientTotals, lastSyncAt, syncedNow, loading, error, refresh, addEntry, exportCsv } = useFinance(month);
  const { rows: trendRows, loading: trendLoading } = useTrend();

  // Ledger filters (X3FS classic feature)
  const [typeFilter,    setTypeFilter]    = useState<string>("all");
  const [vendorFilter,  setVendorFilter]  = useState<string>("all");
  const [carrierFilter, setCarrierFilter] = useState<string>("all");

  // Add-entry form
  const [form, setForm] = useState({ entry_date: new Date().toISOString().slice(0, 10), type: "overhead", carrier_name: "", vendor: "", category: "", description: "", amount: "", paid: true });
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<{ ok: boolean; msg: string } | null>(null);
  const [syncing, setSyncing] = useState(false);

  async function submit() {
    const cents = Math.round(parseFloat(form.amount || "0") * 100);
    if (!cents) { setFlash({ ok: false, msg: "Amount must be > 0" }); return; }
    setBusy(true); setFlash(null);
    try {
      await addEntry({
        entry_date: form.entry_date,
        type: form.type as FinanceEntry["type"],
        carrier_name: form.carrier_name || null,
        vendor: form.vendor || null,
        category: form.category || null,
        description: form.description || null,
        amount_cents: cents,
        paid: form.paid,
      });
      setForm({ ...form, amount: "", description: "" });
      setFlash({ ok: true, msg: "✓ Entry saved." });
      setTab("ledger");
    } catch (e) {
      setFlash({ ok: false, msg: e instanceof Error ? e.message : String(e) });
    } finally { setBusy(false); }
  }

  async function manualSync() {
    setSyncing(true); setFlash(null);
    try {
      await refresh(); // useFinance calls sync=auto by default
      setFlash({ ok: true, msg: "✓ Stripe re-synced." });
    } catch (e) {
      setFlash({ ok: false, msg: e instanceof Error ? e.message : String(e) });
    } finally { setSyncing(false); }
  }

  const sortedClients = useMemo(() => [...clientRows].sort((a, b) => b.actual_revenue_cents - a.actual_revenue_cents), [clientRows]);

  const filteredEntries = useMemo(() =>
    entries.filter(e =>
      (typeFilter    === "all" || e.type           === typeFilter) &&
      (vendorFilter  === "all" || (e.vendor       || "") === vendorFilter) &&
      (carrierFilter === "all" || (e.carrier_name || "") === carrierFilter)
    ),
  [entries, typeFilter, vendorFilter, carrierFilter]);

  function exportJson() {
    const blob = new Blob([JSON.stringify({ month, kpis, client_totals: clientTotals, entries: filteredEntries, client_rows: sortedClients }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = `finance_${month}.json`; a.click();
    URL.revokeObjectURL(url);
  }

  if (!isSuperAdmin) {
    return (
      <AppShell title="Finance">
        <div className="p-10 max-w-md mx-auto text-center bg-[var(--bg)] min-h-screen">
          <div className="text-5xl mb-3">🔒</div>
          <h1 className="text-2xl font-bold mb-2 text-[var(--fg)]">Restricted</h1>
          <p className="text-[var(--fg-muted)] mb-4">This page is for X3 super-admins only.</p>
          <Link href="/app" className="text-[var(--accent)] hover:underline font-bold">← Back to dashboard</Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Finance Tracker" crumbs="X3 Admin · Every dollar in, every dollar out">
      <div className="px-6 py-6 space-y-6 bg-[var(--bg)] min-h-screen">

        <X3AdminHero
          eyebrow="Finance Tracker"
          title={<>Every dollar in. Every dollar out. <span className="text-amber-700 dark:text-amber-400">Auto-synced with Stripe.</span></>}
          intro={<>Per-client revenue + expected MRR delta + vendor pass-throughs + outstanding invoices. Stripe charges auto-sync on page load. Manual entries (overhead, refunds, vendor costs) land in <code className="font-mono">compass_finance_entries</code>. Money the SaaS earns versus money it spends · the truth-of-record for the business.</>}
          dataSource={{
            items: [
              <span key="f1"><strong className="text-[var(--fg)]">Stripe charges</strong> auto-pulled per month via <code className="font-mono text-[var(--accent)]">/api/admin/finance?sync=auto</code>. New rows inserted to <code className="font-mono text-[var(--accent)]">compass_finance_entries</code> with <code className="font-mono">type=&apos;money_in&apos;</code>.</span>,
              <span key="f2"><strong className="text-[var(--fg)]">Expected MRR</strong> = graduated per-driver ($50→$25 bands, $100/mo min, every product included). Per-client view compares actual revenue vs expected · flags <em>OWED</em> when behind, <em>OVERPAID</em> when ahead.</span>,
              <span key="f3"><strong className="text-[var(--fg)]">Vendor pass-throughs</strong> = costs we incur (MVR, PSP, drug tests, background checks) on behalf of carriers. Tab 3 shows which carriers still owe us reimbursement.</span>,
              <span key="f4"><strong className="text-[var(--fg)]">12-Month Trend</strong> pulls from <code className="font-mono text-[var(--accent)]">finance_monthly_summary</code> view · revenue, costs, net per month for the last 12.</span>,
            ],
            footnote: <>Stripe fees estimated at 2.9% + $0.30/charge. Manual ledger entries get a custom <em>type</em>; CSV + JSON exports include everything visible after filters.</>,
          }}
        />

        {/* Status bar: sync state + month picker + actions */}
        <div className="flex items-center justify-between flex-wrap gap-3 bg-[var(--surface-3)] border border-[var(--border)] rounded-xl px-4 py-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[11px] uppercase tracking-[.14em] font-bold text-[var(--fg-muted)]">Stripe sync</span>
            <span className="text-[12px] text-[var(--fg)] font-mono">last <strong>{relTime(lastSyncAt)}</strong></span>
            {syncedNow ? <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-500/40 rounded-full px-2 py-0.5">+{syncedNow.inserted} new</span> : null}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <label className="text-[11px] uppercase tracking-[.14em] font-bold text-[var(--fg-muted)]">Month</label>
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="px-2 py-1.5 rounded bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)] text-[12px]" />
            <button onClick={manualSync} disabled={syncing || loading} className="px-3 py-1.5 rounded-lg font-bold text-[12px] text-[var(--fg)] border border-[var(--border)] hover:bg-[var(--surface-2)] disabled:opacity-50">
              {syncing ? "↻ Syncing…" : "↻ Refresh + sync"}
            </button>
            <button onClick={exportCsv} className="px-3 py-1.5 rounded-lg font-bold text-[12px] text-[var(--fg)] border border-[var(--border)] hover:bg-[var(--surface-2)]">↓ CSV</button>
            <button onClick={exportJson} className="px-3 py-1.5 rounded-lg font-bold text-[12px] text-[var(--fg)] border border-[var(--border)] hover:bg-[var(--surface-2)]">↓ JSON</button>
          </div>
        </div>

        {error && <div className="rounded-lg border border-rose-700/40 bg-rose-100 dark:bg-rose-900/20 text-rose-900 dark:text-rose-300 px-3 py-2 text-[13px]">{error}</div>}
        {flash && <div className={`rounded-lg border px-3 py-2 text-[13px] ${flash.ok ? "border-emerald-700/40 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-300" : "border-rose-700/40 bg-rose-100 dark:bg-rose-900/20 text-rose-900 dark:text-rose-300"}`}>{flash.msg}</div>}

        {/* 6 KPI tiles · X3FS classic 5 + Active clients (SaaS angle) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <X3KPITile label="Money in"           value={fmt(kpis.money_in_cents)}                   sub={`${clientTotals.active_carriers} paying · ${clientTotals.trialing_carriers} trialing`} tone="green" />
          <X3KPITile label="Vendor pass-thrus"  value={fmt(kpis.paid_vendors_cents)}               sub="billed back to carriers"                                                              tone="navy" />
          <X3KPITile label="Software + overhead" value={fmt(kpis.overhead_cents)}                  sub="hosting, AI, email, infra"                                                            tone="navy" />
          <X3KPITile label="What's left"        value={fmt(kpis.whats_left_cents)}                 sub="money in − costs − refunds"                                                           tone={kpis.whats_left_cents >= 0 ? "green" : "red"} />
          <X3KPITile label="Customers owe us"   value={fmt(clientTotals.owed_cents)}               sub="below expected MRR"                                                                   tone={clientTotals.owed_cents > 0 ? "red" : "navy"} />
          <X3KPITile label="Expected MRR"       value={fmt(clientTotals.expected_mrr_cents)}       sub={`${clientTotals.drivers} drivers · graduated`}                                        tone="navy" />
        </div>

        {/* 5 Tabs via X3AdminTabs */}
        <X3AdminTabs
          active={tab}
          onChange={(k) => setTab(k as typeof tab)}
          tabs={[
            { key: "clients", label: "💼 By Client" },
            { key: "ledger",  label: `📒 All Transactions${entries.length > 0 ? ` (${entries.length})` : ""}` },
            { key: "owed",    label: `💵 Owed (${clientRows.filter(r => r.status === "owed").length})` },
            { key: "trend",   label: "📈 12-Month Trend" },
            { key: "add",     label: "➕ Add Entry" },
          ]}
        />

        {loading && <SkeletonShell kpis={6} rows={6} />}

        {/* TAB: By Client */}
        {!loading && tab === "clients" && (
          <div className="x3-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead className="bg-[var(--surface-2)] text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)]">
                  <tr>
                    <th className="text-left px-3 py-2 font-bold">Client</th>
                    <th className="text-left px-3 py-2 font-bold">Tier</th>
                    <th className="text-right px-3 py-2 font-bold">Drivers</th>
                    <th className="text-right px-3 py-2 font-bold">Expected MRR</th>
                    <th className="text-right px-3 py-2 font-bold">Actual revenue</th>
                    <th className="text-right px-3 py-2 font-bold">Stripe fees</th>
                    <th className="text-right px-3 py-2 font-bold">Net</th>
                    <th className="text-right px-3 py-2 font-bold">Δ vs expected</th>
                    <th className="text-left px-3 py-2 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedClients.length === 0 ? (
                    <tr><td colSpan={9} className="px-3 py-8 text-center text-[var(--fg-muted)]">No carriers in this month. Once a customer signs up they appear here automatically.</td></tr>
                  ) : sortedClients.map(r => (
                    <tr key={r.carrier_id} className="border-t border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors">
                      <td className="px-3 py-2.5">
                        <div className="text-[var(--fg)] font-semibold">{r.name}</div>
                        <div className="text-[10px] text-[var(--fg-faint)] font-mono">{r.primary_contact_email || "—"}</div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="text-[var(--fg)]">{TIER_LABEL[r.tier] || r.tier}</div>
                        
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-[var(--fg)]">{r.drivers}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-[var(--fg-muted)]">{fmt(r.expected_mrr_cents)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-[var(--fg)] font-bold">{fmt(r.actual_revenue_cents)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-[var(--fg-muted)]">{fmt(r.est_fees_cents)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-[var(--fg)] font-bold">{fmt(r.net_cents)}</td>
                      <td className={`px-3 py-2.5 text-right tabular-nums ${r.delta_cents < -500 ? "text-rose-700 dark:text-rose-300 font-extrabold" : r.delta_cents > 500 ? "text-emerald-700 dark:text-emerald-300 font-extrabold" : "text-[var(--fg-muted)]"}`}>{r.delta_cents === 0 ? "—" : fmt(r.delta_cents)}</td>
                      <td className="px-3 py-2.5"><StatusPill status={r.status} /></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-[var(--surface-2)] font-bold">
                  <tr className="border-t-2 border-[var(--border-strong)]">
                    <td className="px-3 py-2.5 text-[var(--fg)]" colSpan={2}>TOTALS · {clientTotals.carriers} carriers</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-[var(--fg)]">{clientTotals.drivers}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-[var(--fg)]">{fmt(clientTotals.expected_mrr_cents)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-[var(--fg)]">{fmt(clientTotals.actual_revenue_cents)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-[var(--fg)]">{fmt(clientTotals.est_fees_cents)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-[var(--fg)]">{fmt(clientTotals.net_cents)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-[var(--fg)]">{fmt(clientTotals.actual_revenue_cents - clientTotals.expected_mrr_cents)}</td>
                    <td className="px-3 py-2.5"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="px-4 py-2 text-[11px] text-[var(--fg-muted)] border-t border-[var(--border)] bg-[var(--surface-3)]">
              Sorted by actual revenue (highest first). Stripe fees: 2.9% + $0.30/charge.
            </div>
          </div>
        )}

        {/* TAB: All Transactions (Ledger) with filters */}
        {!loading && tab === "ledger" && (
          <div className="x3-card overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--surface-3)] flex items-center gap-2 flex-wrap">
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-2 py-1.5 rounded bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)] text-[12px]">
                <option value="all">All types</option>
                <option value="money_in">Money in</option>
                <option value="vendor">Vendor</option>
                <option value="overhead">Overhead</option>
                <option value="refund">Refund</option>
                <option value="owed">Owed</option>
              </select>
              <select value={vendorFilter} onChange={(e) => setVendorFilter(e.target.value)} className="px-2 py-1.5 rounded bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)] text-[12px]">
                <option value="all">All vendors</option>
                {vendors.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              <select value={carrierFilter} onChange={(e) => setCarrierFilter(e.target.value)} className="px-2 py-1.5 rounded bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)] text-[12px]">
                <option value="all">All carriers</option>
                {carriers.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <span className="text-[11px] text-[var(--fg-muted)] ml-auto">{filteredEntries.length} of {entries.length} {filteredEntries.length !== entries.length && "(filtered)"}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead className="bg-[var(--surface-2)] text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)]">
                  <tr>
                    <th className="text-left px-3 py-2 font-bold whitespace-nowrap">Date</th>
                    <th className="text-left px-3 py-2 font-bold">Type</th>
                    <th className="text-left px-3 py-2 font-bold">Carrier / Vendor</th>
                    <th className="text-left px-3 py-2 font-bold">Description</th>
                    <th className="text-right px-3 py-2 font-bold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.length === 0 ? (
                    <tr><td colSpan={5} className="px-3 py-8 text-center text-[var(--fg-muted)]">{entries.length === 0 ? "No entries this month." : "No entries match these filters."}</td></tr>
                  ) : filteredEntries.map(e => (
                    <tr key={e.id} className="border-t border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors">
                      <td className="px-3 py-2.5 text-[var(--fg-muted)] tabular-nums whitespace-nowrap">{e.entry_date}</td>
                      <td className="px-3 py-2.5"><TypePill type={e.type} /></td>
                      <td className="px-3 py-2.5 text-[var(--fg)]">{e.carrier_name || e.vendor || <span className="text-[var(--fg-muted)]">—</span>}</td>
                      <td className="px-3 py-2.5 text-[var(--fg-muted)]">{e.description || e.category || ""}</td>
                      <td className={`px-3 py-2.5 text-right tabular-nums font-bold ${e.type === "money_in" ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}`}>{e.type === "money_in" ? "+" : "−"}{fmt(e.amount_cents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 px-4 py-3 border-t border-[var(--border)] bg-[var(--surface-3)]">
              <Mini label="Money in"   value={fmt(kpis.money_in_cents)} tone="emerald" />
              <Mini label="Vendors"    value={fmt(kpis.paid_vendors_cents)} tone="amber" />
              <Mini label="Overhead"   value={fmt(kpis.overhead_cents)} tone="cyan" />
              <Mini label="Refunds"    value={fmt(kpis.refunds_cents)} tone="rose" />
              <Mini label="What's left" value={fmt(kpis.whats_left_cents)} tone="emerald" emphasis />
            </div>
          </div>
        )}

        {/* TAB: Owed */}
        {!loading && tab === "owed" && (
          <div className="space-y-3">
            {sortedClients.filter(r => r.status === "owed").length === 0 ? (
              <div className="x3-card p-12 text-center">
                <div className="text-4xl mb-2">✓</div>
                <div className="text-[15px] font-extrabold text-[var(--fg)] mb-1">No clients owe money this month.</div>
                <div className="text-[12px] text-[var(--fg-muted)]">Every paying carrier is at or above their expected MRR for {month}.</div>
              </div>
            ) : sortedClients.filter(r => r.status === "owed").map(r => (
              <div key={r.carrier_id} className="x3-card border-rose-700/40 dark:border-rose-300/40 p-4 flex items-center justify-between flex-wrap gap-3">
                <div className="min-w-0">
                  <div className="text-[14px] font-extrabold text-[var(--fg)]">{r.name}</div>
                  <div className="text-[11px] text-[var(--fg-muted)]">
                    {r.drivers} driver{r.drivers === 1 ? "" : "s"} × {fmt(r.tier_rate_cents)}/mo = <strong className="text-[var(--fg)]">{fmt(r.expected_mrr_cents)}</strong> expected · actual <strong className="text-[var(--fg)]">{fmt(r.actual_revenue_cents)}</strong>
                  </div>
                  {r.primary_contact_email && (
                    <div className="text-[10px] text-[var(--fg-faint)] mt-0.5">
                      Contact: <a href={`mailto:${r.primary_contact_email}?subject=X3%20Compass%20—%20${encodeURIComponent(r.name)}%20account%20review`} className="text-[var(--accent)] hover:underline font-mono">{r.primary_contact_email}</a>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-rose-700 dark:text-rose-300 font-extrabold text-[20px]">{fmt(-r.delta_cents)}</div>
                  <div className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)]">owed</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB: 12-Month Trend */}
        {!loading && tab === "trend" && (
          <div className="x3-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[15px] font-extrabold text-[var(--fg)]">📈 12-Month Trend</div>
                <div className="text-[11px] text-[var(--fg-muted)]">From <code className="font-mono">finance_monthly_summary</code> view · revenue, cost, net per month.</div>
              </div>
            </div>
            {trendLoading ? (
              <SkeletonChart h={180} />
            ) : trendRows.length === 0 ? (
              <div className="py-10 text-center text-[var(--fg-muted)]">No monthly history yet. Once you have at least one closed month, the chart appears here.</div>
            ) : (
              <>
                {/* Bar chart: revenue (emerald) + cost (amber) overlay, net line on top */}
                <div className="flex gap-2 items-end h-[180px] mb-3">
                  {[...trendRows].reverse().map(r => {
                    const max = Math.max(...trendRows.map(x => Math.max(x.revenue_cents || 0, x.cost_cents || 0))) || 1;
                    const revH = ((r.revenue_cents || 0) / max) * 100;
                    const costH = ((r.cost_cents || 0) / max) * 100;
                    return (
                      <div key={r.period_month} className="flex-1 flex flex-col items-center gap-1">
                        <div className="text-[10px] font-extrabold text-[var(--fg)] tabular-nums">{fmt(r.net_cents || 0)}</div>
                        <div className="flex-1 w-full flex gap-1 items-end">
                          <div className="flex-1 rounded-t bg-emerald-500 dark:bg-emerald-400" style={{ height: `${revH}%`, minHeight: 2 }} title={`Revenue: ${fmt(r.revenue_cents || 0)}`} />
                          <div className="flex-1 rounded-t bg-amber-500 dark:bg-amber-400" style={{ height: `${costH}%`, minHeight: 2 }} title={`Cost: ${fmt(r.cost_cents || 0)}`} />
                        </div>
                        <div className="text-[9px] text-[var(--fg-muted)] font-mono">{r.period_month.slice(0, 7)}</div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-4 text-[11px] text-[var(--fg-muted)] mb-3">
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-emerald-500 dark:bg-emerald-400" /> Revenue</div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-amber-500 dark:bg-amber-400" /> Cost</div>
                  <div className="ml-auto">Net per month shown above each bar pair.</div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px]">
                    <thead className="bg-[var(--surface-2)] text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)]">
                      <tr>
                        <th className="text-left px-3 py-2 font-bold">Month</th>
                        <th className="text-right px-3 py-2 font-bold">Revenue</th>
                        <th className="text-right px-3 py-2 font-bold">Cost</th>
                        <th className="text-right px-3 py-2 font-bold">Net</th>
                        <th className="text-right px-3 py-2 font-bold">Paying carriers</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trendRows.map(r => (
                        <tr key={r.period_month} className="border-t border-[var(--border)] hover:bg-[var(--surface-2)]">
                          <td className="px-3 py-2.5 text-[var(--fg)] font-semibold tabular-nums">{r.period_month.slice(0, 7)}</td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-emerald-700 dark:text-emerald-300 font-bold">{fmt(r.revenue_cents || 0)}</td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-amber-700 dark:text-amber-300">{fmt(r.cost_cents || 0)}</td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-[var(--fg)] font-extrabold">{fmt(r.net_cents || 0)}</td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-[var(--fg-muted)]">{r.subscription_count || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB: Add Entry */}
        {!loading && tab === "add" && (
          <div className="x3-card p-6 max-w-2xl">
            <h2 className="text-[16px] font-extrabold text-[var(--fg)] mb-1">Add a manual entry</h2>
            <p className="text-[12px] text-[var(--fg-muted)] mb-4">Vendor cost, overhead, refund, or manual money-in (e.g. wire transfer). Stripe charges sync automatically · don&apos;t use this form for those.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Date"><input type="date" value={form.entry_date} onChange={(e) => setForm({ ...form, entry_date: e.target.value })} className="finance-input" /></Field>
              <Field label="Type">
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="finance-input">
                  <option value="overhead">Overhead</option>
                  <option value="vendor">Vendor cost</option>
                  <option value="refund">Refund</option>
                  <option value="owed">Owed</option>
                  <option value="money_in">Money in (manual)</option>
                </select>
              </Field>
              <Field label="Carrier name (if customer-related)"><input value={form.carrier_name} onChange={(e) => setForm({ ...form, carrier_name: e.target.value })} className="finance-input" placeholder="Carrier name…" /></Field>
              <Field label="Vendor"><input value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} className="finance-input" placeholder="Cloudflare, Supabase, …" /></Field>
              <Field label="Category"><input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="finance-input" placeholder="Hosting, AI, Email…" /></Field>
              <Field label="Amount (USD)"><input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="finance-input" placeholder="0.00" /></Field>
              <Field label="Description" className="sm:col-span-2"><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="finance-input" placeholder="Optional note" /></Field>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setTab("clients")} className="px-4 py-2 text-[13px] rounded-lg border border-[var(--border)] text-[var(--fg)] hover:bg-[var(--surface-2)]">Cancel</button>
              <button onClick={submit} disabled={busy} className="px-4 py-2 text-[13px] rounded-lg font-extrabold text-[var(--bg)] disabled:opacity-40" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>{busy ? "Saving…" : "Save entry"}</button>
            </div>
          </div>
        )}
      </div>
      <style jsx>{`.finance-input { width: 100%; padding: 8px 10px; background: var(--bg); border: 1px solid var(--border); border-radius: 6px; font-size: 13px; color: var(--fg); } .finance-input:focus { outline: none; border-color: var(--accent); }`}</style>
    </AppShell>
  );
}

function Mini({ label, value, tone, emphasis }: { label: string; value: string; tone: "emerald" | "amber" | "cyan" | "rose"; emphasis?: boolean }) {
  const toneClasses: Record<string, string> = {
    emerald: "text-emerald-700 dark:text-emerald-300",
    amber:   "text-amber-700   dark:text-amber-300",
    cyan:    "text-cyan-700    dark:text-cyan-300",
    rose:    "text-rose-700    dark:text-rose-300",
  };
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[.14em] text-[var(--fg-muted)] font-bold">{label}</div>
      <div className={`tabular-nums text-[14px] ${emphasis ? "font-extrabold" : "font-bold"} ${toneClasses[tone]}`}>{value}</div>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return <label className={`block ${className || ""}`}><div className="text-[10px] uppercase tracking-[.14em] text-[var(--fg-muted)] font-bold mb-1">{label}</div>{children}</label>;
}
