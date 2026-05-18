"use client";
import { useState } from "react";
import AppShell from "@/components/AppShell";
import { X3AdminHero, X3KPITile, X3AdminTabs } from "@/components/X3AdminHero";

const MONTHS = ["May 2026", "Apr 2026", "Mar 2026", "Feb 2026", "Jan 2026"];

type Entry = { month: string; type: "money_in" | "vendor" | "overhead" | "refund" | "owed"; carrier: string; category: string; desc: string; vendor: string; amount: number; paid: boolean };

const ENTRIES: Entry[] = [
  { month: "May 2026", type: "money_in", carrier: "Apex Logistics LLC",     category: "Subscription",     desc: "May 2026 monthly · DFY 72 drivers",            vendor: "Stripe",     amount:  3_600, paid: true  },
  { month: "May 2026", type: "money_in", carrier: "Heartland Freight",       category: "Subscription",     desc: "May 2026 monthly · DIY 28 drivers",            vendor: "Stripe",     amount:    700, paid: true  },
  { month: "May 2026", type: "vendor",   carrier: "Apex Logistics LLC",     category: "Background check", desc: "Driver Basic Plus · Margaret Rodriguez",       vendor: "Checkr",     amount:   -42, paid: true  },
  { month: "May 2026", type: "vendor",   carrier: "Heartland Freight",       category: "MVR pull",         desc: "TX annual MVR · Anthony Green",                vendor: "SambaSafety",amount:   -18, paid: true  },
  { month: "May 2026", type: "overhead", carrier: "X3 Internal",             category: "Hosting",          desc: "Cloudflare Pages + R2",                        vendor: "Cloudflare", amount:   -45, paid: true  },
  { month: "May 2026", type: "overhead", carrier: "X3 Internal",             category: "AI inference",     desc: "Anthropic Claude API",                         vendor: "Anthropic",  amount:  -220, paid: true  },
  { month: "May 2026", type: "overhead", carrier: "X3 Internal",             category: "Database",         desc: "Supabase Pro",                                 vendor: "Supabase",   amount:   -25, paid: true  },
  { month: "May 2026", type: "owed",     carrier: "Apex Logistics LLC",     category: "Drug test",        desc: "Quest random panel · Eric Martinez",           vendor: "Quest",      amount:    62, paid: false },
];

const TYPE_LABEL: Record<Entry["type"], string> = { money_in: "Money in", vendor: "Vendor cost", overhead: "Software & overhead", refund: "Refund", owed: "Owed to us" };

export default function FinancePage() {
  const [month, setMonth] = useState(MONTHS[0]);
  const [tab, setTab] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [carrierFilter, setCarrierFilter] = useState("all");

  const monthEntries = ENTRIES.filter((e) => e.month === month);
  const moneyIn       = monthEntries.filter((e) => e.type === "money_in").reduce((a, b) => a + b.amount, 0);
  const paidVendors   = monthEntries.filter((e) => e.type === "vendor").reduce((a, b) => a + b.amount, 0);
  const overhead      = monthEntries.filter((e) => e.type === "overhead").reduce((a, b) => a + b.amount, 0);
  const refunds       = monthEntries.filter((e) => e.type === "refund").reduce((a, b) => a + b.amount, 0);
  const whatsLeft     = moneyIn + paidVendors + overhead + refunds;
  const owedToUs      = monthEntries.filter((e) => e.type === "owed").reduce((a, b) => a + b.amount, 0);

  const filtered = (tab === "owed" ? monthEntries.filter((e) => e.type === "owed") : monthEntries).filter((e) => {
    if (typeFilter !== "all" && e.type !== typeFilter) return false;
    if (vendorFilter !== "all" && e.vendor !== vendorFilter) return false;
    if (carrierFilter !== "all" && e.carrier !== carrierFilter) return false;
    return true;
  });

  const fmt = (n: number) => `${n < 0 ? "-" : ""}$${Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <AppShell title="Finance Tracker" crumbs="X3 Admin · Internal ledger">
      <div className="px-6 py-6 space-y-6 bg-[var(--bg)] min-h-screen">
        <X3AdminHero
          eyebrow="Finance"
          title="Every dollar in, every dollar out."
          intro={<>X3&apos;s internal ledger — visible only to Joshua. Use this page to log transactions, track what carriers owe us, and watch the trend.</>}
        />

        <ol className="text-[13px] text-[var(--fg-muted)] space-y-1.5 leading-relaxed list-decimal list-inside px-6 py-4 rounded-xl border border-[#FACC15]/40 bg-[#FACC15]/5">
          <li><strong className="text-[var(--fg)]">Pick a month</strong> — the picker on the right. The five summary tiles update for that month.</li>
          <li><strong className="text-[var(--fg)]">Read the tiles</strong> — green = money in, red = money out, navy = what&apos;s left.</li>
          <li><strong className="text-[var(--fg)]">All transactions</strong> — line-by-line ledger. Filter by type, vendor, or carrier.</li>
          <li><strong className="text-[var(--fg)]">+ Add entry</strong> — log a new transaction; sign auto-adjusts based on type.</li>
          <li><strong className="text-[var(--fg)]">Owed to us</strong> — money X3 paid a vendor on a customer&apos;s behalf and hasn&apos;t billed back yet.</li>
        </ol>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="text-[20px] font-extrabold text-[var(--fg)]">{month}</div>
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-[var(--fg-muted)]">Showing month:</span>
            <select value={month} onChange={(e) => setMonth(e.target.value)} className="px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[13px] font-bold text-[var(--fg)]">
              {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <X3KPITile label="Money in"          value={fmt(moneyIn)}     sub="Subscriptions + add-ons"            tone="green" />
          <X3KPITile label="Paid to vendors"   value={fmt(paidVendors)} sub="MVRs · PSP · drug tests · BG checks — billed back" tone="red" />
          <X3KPITile label="Software & overhead" value={fmt(overhead)}  sub="Hosting · software · infrastructure" tone="red" />
          <X3KPITile label="What's left"       value={fmt(whatsLeft)}   sub="Money in – costs – overhead"        tone="navy" />
          <X3KPITile label="Customers owe us"  value={fmt(owedToUs)}    sub="Invoices created but not paid yet" tone="navy" />
        </div>

        <div>
          <X3AdminTabs
            active={tab}
            onChange={setTab}
            tabs={[
              { key: "all",    label: "📂 All transactions" },
              { key: "trend",  label: "📊 12-month trend"  },
              { key: "owed",   label: "📔 Owed to us (pass-throughs)" },
              { key: "add",    label: "+ Add entry" },
            ]}
          />
          {(tab === "all" || tab === "owed") && (
            <div className="x3-card overflow-hidden mt-4">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] flex-wrap">
                <label className="text-[11px] font-bold text-[var(--fg-muted)] tracking-[.12em] uppercase">Type</label>
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-2 py-1 rounded bg-[var(--surface-2)] border border-[var(--border)] text-[12px]"><option value="all">All types</option><option value="money_in">Money in</option><option value="vendor">Vendor cost</option><option value="overhead">Overhead</option><option value="owed">Owed</option></select>
                <label className="text-[11px] font-bold text-[var(--fg-muted)] tracking-[.12em] uppercase">Vendor</label>
                <select value={vendorFilter} onChange={(e) => setVendorFilter(e.target.value)} className="px-2 py-1 rounded bg-[var(--surface-2)] border border-[var(--border)] text-[12px]"><option value="all">All vendors</option><option>Stripe</option><option>Checkr</option><option>SambaSafety</option><option>Quest</option><option>Anthropic</option><option>Cloudflare</option><option>Supabase</option></select>
                <label className="text-[11px] font-bold text-[var(--fg-muted)] tracking-[.12em] uppercase">Carrier</label>
                <select value={carrierFilter} onChange={(e) => setCarrierFilter(e.target.value)} className="px-2 py-1 rounded bg-[var(--surface-2)] border border-[var(--border)] text-[12px]"><option value="all">All carriers</option><option>Apex Logistics LLC</option><option>Heartland Freight</option><option>X3 Internal</option></select>
                <button className="ml-auto px-3 py-1.5 rounded-lg font-bold text-[12px] text-[var(--fg)] border border-[var(--border)] hover:bg-[var(--surface-2)]">↓ Export CSV</button>
              </div>
              <table className="w-full text-[13px]">
                <thead className="bg-[var(--surface-2)] text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)]">
                  <tr><th className="text-left px-4 py-2 font-bold">Month</th><th className="text-left px-4 py-2 font-bold">Type</th><th className="text-left px-4 py-2 font-bold">Carrier</th><th className="text-left px-4 py-2 font-bold">Category</th><th className="text-left px-4 py-2 font-bold">Description</th><th className="text-left px-4 py-2 font-bold">Vendor</th><th className="text-right px-4 py-2 font-bold">Amount</th><th className="text-left px-4 py-2 font-bold">Paid</th></tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-6 text-center text-[var(--fg-faint)]">No entries for this filter. Use the + Add entry tab to log one.</td></tr>
                  ) : filtered.map((e, i) => (
                    <tr key={i} className="border-t border-[var(--border)]">
                      <td className="px-4 py-2.5 text-[var(--fg-muted)]">{e.month}</td>
                      <td className="px-4 py-2.5"><span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${e.type === "money_in" ? "bg-[var(--success)]/15 text-[var(--success)]" : e.type === "owed" ? "bg-[#FACC15]/15 text-[#B45309]" : "bg-[var(--danger)]/15 text-[var(--danger)]"}`}>{TYPE_LABEL[e.type]}</span></td>
                      <td className="px-4 py-2.5 text-[var(--fg)] font-semibold">{e.carrier}</td>
                      <td className="px-4 py-2.5 text-[var(--fg-muted)]">{e.category}</td>
                      <td className="px-4 py-2.5 text-[var(--fg-muted)]">{e.desc}</td>
                      <td className="px-4 py-2.5 text-[var(--fg-muted)]">{e.vendor}</td>
                      <td className={`px-4 py-2.5 text-right tabular-nums font-bold ${e.amount >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>{fmt(e.amount)}</td>
                      <td className="px-4 py-2.5">{e.paid ? <span className="text-[var(--success)] text-[12px]">✓</span> : <span className="text-[var(--warning)] text-[11px] font-bold">PENDING</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {tab === "trend" && (
            <div className="x3-card p-5 mt-4">
              <div className="text-[13px] text-[var(--fg-muted)]">12-month revenue trend chart (placeholder — wire to crdb_internal.finance_monthly_view).</div>
            </div>
          )}
          {tab === "add" && (
            <div className="x3-card p-5 mt-4 space-y-3">
              <div className="text-[15px] font-extrabold text-[var(--fg)]">Add new transaction</div>
              <div className="grid sm:grid-cols-2 gap-3">
                <select className="px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[13px]"><option>Type — Money in</option><option>Type — Vendor cost</option><option>Type — Overhead</option><option>Type — Refund</option><option>Type — Owed to us</option></select>
                <input placeholder="Carrier" className="px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[13px]" />
                <input placeholder="Category" className="px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[13px]" />
                <input placeholder="Vendor" className="px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[13px]" />
                <input placeholder="Description" className="px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[13px] sm:col-span-2" />
                <input placeholder="Amount (USD)" type="number" className="px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[13px]" />
                <label className="flex items-center gap-2 text-[13px] text-[var(--fg-muted)]"><input type="checkbox" /> Mark as paid</label>
              </div>
              <button className="px-4 py-2 rounded-lg font-extrabold text-[13px] text-[var(--accent-fg)]" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>Save entry</button>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
