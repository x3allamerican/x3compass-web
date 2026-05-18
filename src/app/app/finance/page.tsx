"use client";
import { useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { X3AdminHero, X3KPITile, X3AdminTabs } from "@/components/X3AdminHero";
import { Toast } from "@/components/AdminModals";
import { useFinance, monthLabel, listMonths, type Entry } from "@/lib/useFinance";

const MONTHS = listMonths(12);
const TYPE_LABEL: Record<Entry["type"], string> = { money_in: "Money in", vendor: "Vendor cost", overhead: "Software & overhead", refund: "Refund", owed: "Owed to us" };
const TYPE_TONE:  Record<Entry["type"], string> = { money_in: "bg-[var(--success)]/15 text-[var(--success)]", vendor: "bg-[var(--danger)]/15 text-[var(--danger)]", overhead: "bg-[var(--danger)]/15 text-[var(--danger)]", refund: "bg-[var(--warning)]/15 text-[var(--warning)]", owed: "bg-[#FACC15]/15 text-[#B45309]" };

function fmt(cents: number): string {
  const dollars = cents / 100;
  const sign = dollars < 0 ? "-" : "";
  return `${sign}$${Math.abs(dollars).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function FinancePage() {
  const [month, setMonth] = useState(MONTHS[0]);
  const [tab, setTab] = useState("all");
  const [toast, setToast] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<"all" | Entry["type"]>("all");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [carrierFilter, setCarrierFilter] = useState("all");

  // Add-entry form state
  const [draftType,   setDraftType]   = useState<Entry["type"]>("money_in");
  const [draftCarrier,setDraftCarrier]= useState("");
  const [draftCategory,setDraftCategory]= useState("");
  const [draftVendor, setDraftVendor] = useState("");
  const [draftDesc,   setDraftDesc]   = useState("");
  const [draftAmount, setDraftAmount] = useState("");
  const [draftPaid,   setDraftPaid]   = useState(false);

  const { entries, kpis, loading, error, refresh, addEntry, syncStripe, exportCsv } = useFinance(month);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (tab === "owed" && e.type !== "owed") return false;
      if (typeFilter !== "all" && e.type !== typeFilter) return false;
      if (vendorFilter !== "all" && e.vendor !== vendorFilter) return false;
      if (carrierFilter !== "all" && e.carrier_name !== carrierFilter) return false;
      return true;
    });
  }, [entries, tab, typeFilter, vendorFilter, carrierFilter]);

  const vendorList  = useMemo(() => Array.from(new Set(entries.map((e) => e.vendor).filter(Boolean))) as string[], [entries]);
  const carrierList = useMemo(() => Array.from(new Set(entries.map((e) => e.carrier_name).filter(Boolean))) as string[], [entries]);

  async function handleAddEntry() {
    const amt = Math.round(parseFloat(draftAmount) * 100);
    if (!amt || isNaN(amt)) { setToast("Enter a non-zero amount"); return; }
    try {
      await addEntry({ entry_date: new Date().toISOString().slice(0, 10), type: draftType, carrier_name: draftCarrier || null, vendor: draftVendor || null, category: draftCategory || null, description: draftDesc || null, amount_cents: amt, paid: draftPaid });
      setToast("Entry saved");
      setDraftCarrier(""); setDraftCategory(""); setDraftVendor(""); setDraftDesc(""); setDraftAmount(""); setDraftPaid(false);
      setTab("all");
    } catch (e) { setToast("Save failed: " + (e instanceof Error ? e.message : String(e))); }
  }

  async function handleSyncStripe() {
    try {
      const r = await syncStripe();
      setToast(`Stripe sync: ${r.inserted} new · ${r.skipped} already imported · ${r.considered} considered`);
    } catch (e) { setToast("Sync failed: " + (e instanceof Error ? e.message : String(e))); }
  }

  return (
    <AppShell title="Finance Tracker" crumbs="X3 Admin · Internal ledger">
      <div className="px-6 py-6 space-y-6 bg-[var(--bg)] min-h-screen">
        <X3AdminHero eyebrow="Finance" title="Every dollar in, every dollar out." intro="X3's internal ledger. Subscriptions + vendor pass-through + software overhead — across every carrier." />

        {/* Month picker + sync button */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="text-[20px] font-extrabold text-[var(--fg)]">{monthLabel(month)}{loading && <span className="text-[12px] text-[var(--fg-muted)] ml-2">loading…</span>}</div>
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-[var(--fg-muted)]">Showing month:</span>
            <select value={month} onChange={(e) => setMonth(e.target.value)} className="px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[13px] font-bold text-[var(--fg)]">
              {MONTHS.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
            </select>
            <button onClick={refresh} className="px-3 py-1.5 rounded-lg font-bold text-[12px] text-[var(--fg)] border border-[var(--border)] hover:bg-[var(--surface-2)]">↻ Refresh</button>
            <button onClick={handleSyncStripe} className="px-3 py-1.5 rounded-lg font-extrabold text-[12px] text-[var(--accent-fg)]" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>⇣ Sync Stripe</button>
          </div>
        </div>

        {error && <div className="rounded-lg border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-3 text-[12px] text-[var(--danger)] font-semibold">⚠ {error}</div>}

        {/* 5 KPI tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <X3KPITile label="Money in"            value={fmt(kpis.money_in_cents)}      sub="Subscriptions + add-ons" tone="green" />
          <X3KPITile label="Paid to vendors"     value={fmt(kpis.paid_vendors_cents)}  sub="MVR · D&A · Checkr"      tone="red"   />
          <X3KPITile label="Software & overhead" value={fmt(kpis.overhead_cents)}      sub="Hosting · AI · DB"        tone="red"   />
          <X3KPITile label="What's left"         value={fmt(kpis.whats_left_cents)}    sub="in – costs – overhead"    tone="navy"  />
          <X3KPITile label="Customers owe us"    value={fmt(kpis.owed_to_us_cents)}    sub="Invoiced, not paid yet"   tone="navy"  />
        </div>

        <X3AdminTabs active={tab} onChange={setTab} tabs={[
          { key: "all",   label: "📂 All transactions" },
          { key: "trend", label: "📊 12-month trend"  },
          { key: "owed",  label: "📔 Owed to us (pass-throughs)" },
          { key: "add",   label: "+ Add entry" },
        ]} />

        {(tab === "all" || tab === "owed") && (
          <div className="x3-card overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] flex-wrap">
              <label className="text-[11px] font-bold text-[var(--fg-muted)] tracking-[.12em] uppercase">Type</label>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)} className="px-2 py-1 rounded bg-[var(--surface-2)] border border-[var(--border)] text-[12px]">
                <option value="all">All types</option>
                {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <label className="text-[11px] font-bold text-[var(--fg-muted)] tracking-[.12em] uppercase">Vendor</label>
              <select value={vendorFilter} onChange={(e) => setVendorFilter(e.target.value)} className="px-2 py-1 rounded bg-[var(--surface-2)] border border-[var(--border)] text-[12px]">
                <option value="all">All vendors</option>
                {vendorList.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
              <label className="text-[11px] font-bold text-[var(--fg-muted)] tracking-[.12em] uppercase">Carrier</label>
              <select value={carrierFilter} onChange={(e) => setCarrierFilter(e.target.value)} className="px-2 py-1 rounded bg-[var(--surface-2)] border border-[var(--border)] text-[12px]">
                <option value="all">All carriers</option>
                {carrierList.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <span className="ml-auto text-[11px] text-[var(--fg-muted)]">{filtered.length} of {entries.length}</span>
              <button onClick={exportCsv} className="px-3 py-1.5 rounded-lg font-bold text-[12px] text-[var(--fg)] border border-[var(--border)] hover:bg-[var(--surface-2)]">↓ Export CSV</button>
            </div>
            <table className="w-full text-[13px]">
              <thead className="bg-[var(--surface-2)] text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)]">
                <tr><th className="text-left px-4 py-2 font-bold">Date</th><th className="text-left px-4 py-2 font-bold">Type</th><th className="text-left px-4 py-2 font-bold">Carrier</th><th className="text-left px-4 py-2 font-bold">Category</th><th className="text-left px-4 py-2 font-bold">Description</th><th className="text-left px-4 py-2 font-bold">Vendor</th><th className="text-right px-4 py-2 font-bold">Amount</th><th className="text-left px-4 py-2 font-bold">Paid</th></tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-6 text-center text-[var(--fg-faint)]">{loading ? "Loading…" : "No entries for this filter. Use the + Add entry tab or click ⇣ Sync Stripe to import this month's revenue."}</td></tr>
                ) : filtered.map((e) => {
                  const display = (e.type === "money_in" || e.type === "owed") ? e.amount_cents : -e.amount_cents;
                  return (
                    <tr key={e.id} className="border-t border-[var(--border)]">
                      <td className="px-4 py-2.5 text-[var(--fg-muted)] whitespace-nowrap">{e.entry_date}</td>
                      <td className="px-4 py-2.5"><span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${TYPE_TONE[e.type]}`}>{TYPE_LABEL[e.type]}</span></td>
                      <td className="px-4 py-2.5 text-[var(--fg)] font-semibold">{e.carrier_name || "—"}</td>
                      <td className="px-4 py-2.5 text-[var(--fg-muted)]">{e.category || "—"}</td>
                      <td className="px-4 py-2.5 text-[var(--fg-muted)]">{e.description || "—"}</td>
                      <td className="px-4 py-2.5 text-[var(--fg-muted)]">{e.vendor || "—"}</td>
                      <td className={`px-4 py-2.5 text-right tabular-nums font-bold ${display >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>{fmt(display)}</td>
                      <td className="px-4 py-2.5">{e.paid ? <span className="text-[var(--success)] text-[12px]">✓</span> : <span className="text-[var(--warning)] text-[11px] font-bold">PENDING</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {tab === "trend" && (
          <div className="x3-card p-5 text-[13px] text-[var(--fg-muted)]">12-month trend will land here once we have ≥3 months of data. The query is a simple group-by-month over compass_finance_entries.</div>
        )}

        {tab === "add" && (
          <div className="x3-card p-5 space-y-3">
            <div className="text-[15px] font-extrabold text-[var(--fg)]">Add new transaction</div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)] mb-1">Type</div>
                <select value={draftType} onChange={(e) => setDraftType(e.target.value as Entry["type"])} className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[13px]">
                  {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)] mb-1">Carrier</div>
                <input value={draftCarrier} onChange={(e) => setDraftCarrier(e.target.value)} placeholder="e.g. Apex Logistics" className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[13px]" />
              </div>
              <div>
                <div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)] mb-1">Category</div>
                <input value={draftCategory} onChange={(e) => setDraftCategory(e.target.value)} placeholder="e.g. Subscription, Background check, Hosting" className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[13px]" />
              </div>
              <div>
                <div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)] mb-1">Vendor</div>
                <input value={draftVendor} onChange={(e) => setDraftVendor(e.target.value)} placeholder="e.g. Stripe, Checkr, Anthropic" className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[13px]" />
              </div>
              <div className="sm:col-span-2">
                <div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)] mb-1">Description</div>
                <input value={draftDesc} onChange={(e) => setDraftDesc(e.target.value)} placeholder="One-line context" className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[13px]" />
              </div>
              <div>
                <div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)] mb-1">Amount (USD)</div>
                <input type="number" step="0.01" value={draftAmount} onChange={(e) => setDraftAmount(e.target.value)} placeholder="0.00" className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[13px]" />
              </div>
              <label className="flex items-center gap-2 text-[13px] text-[var(--fg-muted)] pt-7">
                <input type="checkbox" checked={draftPaid} onChange={(e) => setDraftPaid(e.target.checked)} /> Mark as paid
              </label>
            </div>
            <button onClick={handleAddEntry} className="px-4 py-2 rounded-lg font-extrabold text-[13px] text-[var(--accent-fg)]" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>Save entry</button>
          </div>
        )}

        <Toast message={toast} onDismiss={() => setToast(null)} />
      </div>
    </AppShell>
  );
}
