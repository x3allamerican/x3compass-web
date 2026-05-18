"use client";
import Link from "next/link";
import AppShell from "@/components/AppShell";

const INVOICES = [
  { num: "INV-1042", date: "May 1, 2026",  amount: 1_800, status: "Paid",    desc: "Monthly · 72 drivers · DFY" },
  { num: "INV-1031", date: "Apr 1, 2026",  amount: 1_775, status: "Paid",    desc: "Monthly · 71 drivers · DFY" },
  { num: "INV-1020", date: "Mar 1, 2026",  amount: 1_750, status: "Paid",    desc: "Monthly · 70 drivers · DFY" },
  { num: "INV-1009", date: "Feb 1, 2026",  amount: 1_750, status: "Paid",    desc: "Monthly · 70 drivers · DFY" },
];

export default function FinancePage() {
  return (
    <AppShell title="Finance" crumbs="Billing · Invoices · Vendor spend">
      <div className="px-6 py-6 space-y-6 bg-[var(--bg)] min-h-screen">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="x3-card p-4"><div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)]">Subscription</div><div className="text-[20px] font-extrabold text-[var(--fg)]">$1,800 / mo</div><div className="text-[11px] text-[var(--success)]">Active · billed monthly</div></div>
          <div className="x3-card p-4"><div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)]">YTD Compass spend</div><div className="text-[20px] font-extrabold text-[var(--fg)]">$8,875</div></div>
          <div className="x3-card p-4"><div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)]">YTD vendor pass-thru</div><div className="text-[20px] font-extrabold text-[var(--fg)]">$3,420</div><div className="text-[11px] text-[var(--fg-muted)]">Checkr · MVR · D&A</div></div>
          <div className="x3-card p-4"><div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)]">Next invoice</div><div className="text-[20px] font-extrabold text-[var(--fg)]">Jun 1</div><div className="text-[11px] text-[var(--fg-muted)]">Visa ending 4242</div></div>
        </div>
        <div className="x3-card overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--border)] flex items-center justify-between">
            <div className="text-[15px] font-extrabold text-[var(--fg)]">Invoices</div>
            <Link href="/app/settings/billing" className="text-[12px] text-[var(--accent)] font-bold hover:underline">Manage billing →</Link>
          </div>
          <table className="w-full text-[13px]">
            <thead className="bg-[var(--surface-2)] text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)]">
              <tr><th className="text-left px-4 py-2 font-bold">Invoice</th><th className="text-left px-4 py-2 font-bold">Date</th><th className="text-left px-4 py-2 font-bold">Description</th><th className="text-right px-4 py-2 font-bold">Amount</th><th className="text-left px-4 py-2 font-bold">Status</th></tr>
            </thead>
            <tbody>{INVOICES.map((iv, i) => (
              <tr key={i} className="border-t border-[var(--border)]">
                <td className="px-4 py-2.5 text-[var(--fg)] font-semibold font-mono">{iv.num}</td>
                <td className="px-4 py-2.5 text-[var(--fg-muted)]">{iv.date}</td>
                <td className="px-4 py-2.5 text-[var(--fg-muted)]">{iv.desc}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-[var(--fg)] font-bold">${iv.amount.toLocaleString()}</td>
                <td className="px-4 py-2.5"><span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-[var(--success)]/15 text-[var(--success)]">{iv.status}</span></td>
              </tr>))}</tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
