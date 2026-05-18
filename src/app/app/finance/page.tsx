"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useIsSuperAdmin } from "@/lib/superAdmin";
import { useFinance } from "@/lib/useFinance";

const TIER_LABEL: Record<string, string> = { diy: "DIY $25/driver", dfy: "DFY $50/driver", enterprise: "Enterprise" };

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

export default function FinancePage() {
  const isSuperAdmin = useIsSuperAdmin();
  const months = lastTwelveMonths();
  const [month, setMonth] = useState(months[0]);
  const [tab, setTab] = useState<"clients" | "ledger" | "owed" | "add">("clients");
  const { entries, kpis, clientRows, clientTotals, lastSyncAt, syncedNow, loading, error, refresh, addEntry, exportCsv } = useFinance(month);

  // Add-entry form
  const [form, setForm] = useState({ entry_date: new Date().toISOString().slice(0, 10), type: "overhead", carrier_name: "", vendor: "", category: "", description: "", amount: "", paid: true });
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const submit = async () => {
    const cents = Math.round(parseFloat(form.amount || "0") * 100);
    if (!cents) { setFlash("Amount must be > 0"); return; }
    setBusy(true);
    try {
      await addEntry({ entry_date: form.entry_date, type: form.type as "money_in" | "vendor" | "overhead" | "refund" | "owed", carrier_name: form.carrier_name || null, vendor: form.vendor || null, category: form.category || null, description: form.description || null, amount_cents: cents, paid: form.paid });
      setForm({ ...form, amount: "", description: "" }); setFlash("Saved."); setTab("ledger");
    } catch (e) { setFlash(e instanceof Error ? e.message : String(e)); } finally { setBusy(false); }
  };

  const sortedClients = useMemo(() => {
    const arr = [...clientRows];
    arr.sort((a, b) => b.actual_revenue_cents - a.actual_revenue_cents);
    return arr;
  }, [clientRows]);

  if (!isSuperAdmin) {
    return (
      <div className="p-10 text-center">
        <h1 className="text-2xl font-bold mb-2">Restricted</h1>
        <p className="text-[var(--fg-muted)]">This page is for X3 super-admins only.</p>
        <Link href="/app" className="text-[var(--accent)] hover:underline mt-4 inline-block">← Back to dashboard</Link>
      </div>
    );
  }
  return (
    <>
      <div className="p-6 lg:p-10 max-w-[1400px] mx-auto">
        <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
          <div>
            <Link href="/app/admin" className="text-[12px] text-[var(--accent)] hover:underline">← Admin home</Link>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Finance</h1>
            <p className="text-[14px] text-[var(--fg-muted)] mt-1">
              Per-client revenue, fees, and owed. Stripe auto-syncs · last sync <strong>{relTime(lastSyncAt)}</strong>
              {syncedNow ? <span> · pulled <strong>{syncedNow.inserted}</strong> new charge{syncedNow.inserted === 1 ? "" : "s"}</span> : null}
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <select value={month} onChange={(e) => setMonth(e.target.value)} className="px-3 py-2 rounded bg-[var(--bg-elev-1)] border border-[var(--border)] text-sm">
              {months.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <button onClick={() => refresh()} className="px-3 py-2 text-sm rounded border border-[var(--border)] hover:bg-[var(--bg-elev-1)]">Refresh</button>
            <button onClick={exportCsv} className="px-3 py-2 text-sm rounded bg-[var(--accent)] text-black font-medium">Export CSV</button>
          </div>
        </div>

        {error ? <div className="mb-4 p-3 rounded border border-red-500/40 bg-red-500/10 text-sm">{error}</div> : null}
        {flash ? <div className="mb-4 p-3 rounded border border-[var(--accent)]/40 bg-[var(--accent)]/10 text-sm">{flash}</div> : null}

        {/* KPI tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Tile label="Active clients"     value={`${clientTotals.active_carriers}`} sub={`${clientTotals.trialing_carriers} trialing`} />
          <Tile label="Total drivers"      value={clientTotals.drivers.toLocaleString()} sub={`across ${clientTotals.carriers} carriers`} />
          <Tile label="Expected MRR"       value={fmt(clientTotals.expected_mrr_cents)} sub="drivers × tier rate" />
          <Tile label="Actual revenue"     value={fmt(clientTotals.actual_revenue_cents)} sub={`fees ${fmt(clientTotals.est_fees_cents)}`} />
          <Tile label="Owed to us"         value={fmt(clientTotals.owed_cents)} sub="below expected MRR" emphasis={clientTotals.owed_cents > 0 ? "warn" : undefined} />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-[var(--border)] mb-4">
          {(["clients","ledger","owed","add"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm border-b-2 -mb-px ${tab === t ? "border-[var(--accent)] text-[var(--fg)]" : "border-transparent text-[var(--fg-muted)] hover:text-[var(--fg)]"}`}>
              {t === "clients" ? "By Client" : t === "ledger" ? "All Entries" : t === "owed" ? `Owed (${clientRows.filter((r) => r.status === "owed").length})` : "Add Entry"}
            </button>
          ))}
        </div>

        {loading ? <div className="py-10 text-center text-[var(--fg-muted)]">Loading + syncing Stripe…</div> : null}

        {!loading && tab === "clients" ? (
          <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg-elev-1)] text-[var(--fg-muted)]">
                <tr>
                  <th className="text-left p-3">Client</th>
                  <th className="text-left p-3">Tier</th>
                  <th className="text-right p-3">Drivers</th>
                  <th className="text-right p-3">Expected MRR</th>
                  <th className="text-right p-3">Actual revenue</th>
                  <th className="text-right p-3">Stripe fees</th>
                  <th className="text-right p-3">Net</th>
                  <th className="text-right p-3">Δ</th>
                  <th className="text-left p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedClients.map((r) => (
                  <tr key={r.carrier_id} className="border-t border-[var(--border)]">
                    <td className="p-3">
                      <div className="font-medium">{r.name}</div>
                      <div className="text-[11px] text-[var(--fg-muted)]">{r.primary_contact_email || "—"}</div>
                    </td>
                    <td className="p-3">
                      <div>{TIER_LABEL[r.tier] || r.tier}</div>
                      {r.hazmat_addon ? <div className="text-[11px] text-[var(--accent)]">+ Hazmat $99</div> : null}
                    </td>
                    <td className="p-3 text-right tabular-nums">{r.drivers}</td>
                    <td className="p-3 text-right tabular-nums">{fmt(r.expected_mrr_cents)}</td>
                    <td className="p-3 text-right tabular-nums font-medium">{fmt(r.actual_revenue_cents)}</td>
                    <td className="p-3 text-right tabular-nums text-[var(--fg-muted)]">{fmt(r.est_fees_cents)}</td>
                    <td className="p-3 text-right tabular-nums font-semibold">{fmt(r.net_cents)}</td>
                    <td className={`p-3 text-right tabular-nums ${r.delta_cents < -500 ? "text-red-400" : r.delta_cents > 500 ? "text-emerald-400" : ""}`}>{r.delta_cents === 0 ? "—" : fmt(r.delta_cents)}</td>
                    <td className="p-3"><StatusPill status={r.status} /></td>
                  </tr>
                ))}
                {sortedClients.length === 0 ? <tr><td colSpan={9} className="p-6 text-center text-[var(--fg-muted)]">No carriers in this month — once a customer signs up they'll appear here automatically.</td></tr> : null}
              </tbody>
              <tfoot className="bg-[var(--bg-elev-1)] font-semibold">
                <tr className="border-t-2 border-[var(--border)]">
                  <td className="p-3" colSpan={2}>Totals</td>
                  <td className="p-3 text-right tabular-nums">{clientTotals.drivers}</td>
                  <td className="p-3 text-right tabular-nums">{fmt(clientTotals.expected_mrr_cents)}</td>
                  <td className="p-3 text-right tabular-nums">{fmt(clientTotals.actual_revenue_cents)}</td>
                  <td className="p-3 text-right tabular-nums">{fmt(clientTotals.est_fees_cents)}</td>
                  <td className="p-3 text-right tabular-nums">{fmt(clientTotals.net_cents)}</td>
                  <td className="p-3 text-right tabular-nums">{fmt(clientTotals.actual_revenue_cents - clientTotals.expected_mrr_cents)}</td>
                  <td className="p-3"></td>
                </tr>
              </tfoot>
            </table>
            <div className="p-3 text-[11px] text-[var(--fg-muted)] border-t border-[var(--border)]">
              Stripe fees estimated at 2.9% + $0.30/charge. KPI tiles above (Money In, Vendor Costs, Overhead, Refunds) are also tracked — see <em>All Entries</em>.
            </div>
          </div>
        ) : null}

        {!loading && tab === "ledger" ? (
          <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg-elev-1)] text-[var(--fg-muted)]">
                <tr><th className="text-left p-3">Date</th><th className="text-left p-3">Type</th><th className="text-left p-3">Carrier / Vendor</th><th className="text-left p-3">Description</th><th className="text-right p-3">Amount</th></tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} className="border-t border-[var(--border)]">
                    <td className="p-3 tabular-nums">{e.entry_date}</td>
                    <td className="p-3"><TypePill type={e.type} /></td>
                    <td className="p-3">{e.carrier_name || e.vendor || "—"}</td>
                    <td className="p-3 text-[var(--fg-muted)]">{e.description || e.category || ""}</td>
                    <td className={`p-3 text-right tabular-nums ${e.type === "money_in" ? "text-emerald-400" : "text-red-400"}`}>{e.type === "money_in" ? "+" : "−"}{fmt(e.amount_cents)}</td>
                  </tr>
                ))}
                {entries.length === 0 ? <tr><td colSpan={5} className="p-6 text-center text-[var(--fg-muted)]">No entries this month.</td></tr> : null}
              </tbody>
            </table>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 p-3 bg-[var(--bg-elev-1)] text-sm border-t border-[var(--border)]">
              <Mini label="Money in"   value={fmt(kpis.money_in_cents)} />
              <Mini label="Vendors"    value={fmt(kpis.paid_vendors_cents)} />
              <Mini label="Overhead"   value={fmt(kpis.overhead_cents)} />
              <Mini label="Refunds"    value={fmt(kpis.refunds_cents)} />
              <Mini label="What's left" value={fmt(kpis.whats_left_cents)} emphasis />
            </div>
          </div>
        ) : null}

        {!loading && tab === "owed" ? (
          <div className="space-y-3">
            {sortedClients.filter((r) => r.status === "owed").map((r) => (
              <div key={r.carrier_id} className="p-4 rounded border border-red-500/40 bg-red-500/5 flex items-center justify-between">
                <div>
                  <div className="font-medium">{r.name}</div>
                  <div className="text-[12px] text-[var(--fg-muted)]">{r.drivers} drivers × {fmt(r.tier_rate_cents)}/mo = {fmt(r.expected_mrr_cents)} expected · actual {fmt(r.actual_revenue_cents)}</div>
                </div>
                <div className="text-right">
                  <div className="text-red-400 font-semibold">{fmt(-r.delta_cents)} owed</div>
                  <div className="text-[11px] text-[var(--fg-muted)]">{r.primary_contact_email || "no contact"}</div>
                </div>
              </div>
            ))}
            {sortedClients.filter((r) => r.status === "owed").length === 0 ? (
              <div className="p-6 text-center text-[var(--fg-muted)]">No clients owe money this month. ✓</div>
            ) : null}
          </div>
        ) : null}

        {!loading && tab === "add" ? (
          <div className="rounded-lg border border-[var(--border)] p-5 max-w-2xl">
            <h2 className="font-semibold mb-4">Add a manual entry (vendor cost, overhead, refund, etc.)</h2>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date"><input type="date" value={form.entry_date} onChange={(e) => setForm({ ...form, entry_date: e.target.value })} className="input" /></Field>
              <Field label="Type">
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input">
                  <option value="overhead">Overhead</option><option value="vendor">Vendor cost</option><option value="refund">Refund</option><option value="owed">Owed</option><option value="money_in">Money in (manual)</option>
                </select>
              </Field>
              <Field label="Carrier (if customer-related)"><input value={form.carrier_name} onChange={(e) => setForm({ ...form, carrier_name: e.target.value })} className="input" placeholder="Carrier name…" /></Field>
              <Field label="Vendor"><input value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} className="input" placeholder="Cloudflare, Supabase, …" /></Field>
              <Field label="Category"><input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input" placeholder="Hosting, AI, Email…" /></Field>
              <Field label="Amount (USD)"><input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="input" placeholder="0.00" /></Field>
              <Field label="Description" className="col-span-2"><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" placeholder="Optional note" /></Field>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setTab("clients")} className="px-4 py-2 text-sm rounded border border-[var(--border)]">Cancel</button>
              <button disabled={busy} onClick={submit} className="px-4 py-2 text-sm rounded bg-[var(--accent)] text-black font-medium disabled:opacity-50">{busy ? "Saving…" : "Save entry"}</button>
            </div>
          </div>
        ) : null}
        <style jsx>{`.input { width: 100%; padding: 8px 10px; background: var(--bg-elev-1); border: 1px solid var(--border); border-radius: 6px; font-size: 14px; color: var(--fg); }`}</style>
      </div>
    </>
  );
}

function Tile({ label, value, sub, emphasis }: { label: string; value: string; sub?: string; emphasis?: "warn" }) {
  return (
    <div className={`rounded-lg border p-4 ${emphasis === "warn" ? "border-red-500/40 bg-red-500/5" : "border-[var(--border)] bg-[var(--bg-elev-1)]"}`}>
      <div className="text-[11px] uppercase tracking-wide text-[var(--fg-muted)]">{label}</div>
      <div className="text-2xl font-extrabold mt-1 tabular-nums">{value}</div>
      {sub ? <div className="text-[11px] text-[var(--fg-muted)] mt-1">{sub}</div> : null}
    </div>
  );
}
function Mini({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-[var(--fg-muted)]">{label}</div>
      <div className={`tabular-nums ${emphasis ? "font-bold" : ""}`}>{value}</div>
    </div>
  );
}
function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return <label className={`block ${className || ""}`}><div className="text-[11px] uppercase tracking-wide text-[var(--fg-muted)] mb-1">{label}</div>{children}</label>;
}
function TypePill({ type }: { type: string }) {
  const map: Record<string, string> = { money_in: "bg-emerald-500/20 text-emerald-300", vendor: "bg-orange-500/20 text-orange-300", overhead: "bg-blue-500/20 text-blue-300", refund: "bg-red-500/20 text-red-300", owed: "bg-yellow-500/20 text-yellow-300" };
  return <span className={`px-2 py-0.5 rounded text-[11px] ${map[type] || "bg-gray-500/20 text-gray-300"}`}>{type.replace("_", " ")}</span>;
}
function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    on_track:    { label: "On track",    cls: "bg-emerald-500/20 text-emerald-300" },
    owed:        { label: "Owed",        cls: "bg-red-500/20 text-red-300" },
    overpaid:    { label: "Overpaid",    cls: "bg-blue-500/20 text-blue-300" },
    no_revenue:  { label: "No revenue",  cls: "bg-yellow-500/20 text-yellow-300" },
    trial:       { label: "Trial",       cls: "bg-cyan-500/20 text-cyan-300" },
  };
  const s = map[status] || { label: status, cls: "bg-gray-500/20 text-gray-300" };
  return <span className={`px-2 py-0.5 rounded text-[11px] ${s.cls}`}>{s.label}</span>;
}
