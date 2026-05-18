"use client";
import { useState } from "react";
import AppShell from "@/components/AppShell";

const INVITES = [
  { name: "Sarah Pena",       email: "sarah.pena@example.com",       sent: "2026-05-15", status: "pending",   note: "DQ file 40% complete" },
  { name: "Marcus Hill",      email: "marcus.hill@example.com",      sent: "2026-05-12", status: "completed", note: "Onboarded · ready to drive" },
  { name: "Diana Castillo",   email: "diana.castillo@example.com",   sent: "2026-05-10", status: "pending",   note: "Awaiting CDL upload" },
  { name: "Robert Tran",      email: "robert.tran@example.com",      sent: "2026-05-08", status: "expired",   note: "7-day link expired — resend" },
  { name: "Olivia Park",      email: "olivia.park@example.com",      sent: "2026-05-04", status: "completed", note: "Onboarded · ready to drive" },
];

export default function DriverInvitesPage() {
  const [showCompose, setShowCompose] = useState(false);
  return (
    <AppShell title="Driver Invites" crumbs="Client Admin · Onboarding queue" actions={<button onClick={() => setShowCompose(true)} className="px-3 py-1.5 rounded-lg font-extrabold text-[12px] text-[var(--accent-fg)]" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>+ Invite driver</button>}>
      <div className="px-6 py-6 space-y-6 bg-[var(--bg)] min-h-screen">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="x3-card p-4"><div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)]">Pending</div><div className="text-[28px] font-black text-[var(--warning)]">2</div></div>
          <div className="x3-card p-4"><div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)]">Completed (30d)</div><div className="text-[28px] font-black text-[var(--success)]">2</div></div>
          <div className="x3-card p-4"><div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)]">Expired</div><div className="text-[28px] font-black text-[var(--danger)]">1</div></div>
          <div className="x3-card p-4"><div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)]">Avg time to complete</div><div className="text-[28px] font-black text-[var(--fg)]">2.4d</div></div>
        </div>
        {showCompose && (
          <div className="x3-card p-5">
            <div className="text-[15px] font-extrabold text-[var(--fg)] mb-3">Invite a new driver</div>
            <div className="grid sm:grid-cols-2 gap-3">
              <input placeholder="First name" className="px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--fg)] text-[13px]" />
              <input placeholder="Last name"  className="px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--fg)] text-[13px]" />
              <input placeholder="Email"      className="px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--fg)] text-[13px]" />
              <input placeholder="Mobile (for SMS)" className="px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--fg)] text-[13px]" />
            </div>
            <div className="flex gap-2 mt-3">
              <button className="px-4 py-2 rounded-lg font-extrabold text-[13px] text-[var(--accent-fg)]" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>Send invite</button>
              <button onClick={() => setShowCompose(false)} className="px-4 py-2 rounded-lg font-bold text-[13px] text-[var(--fg-muted)] border border-[var(--border)]">Cancel</button>
            </div>
          </div>
        )}
        <div className="x3-card overflow-hidden">
          <table className="w-full text-[13px]">
            <thead className="bg-[var(--surface-2)] text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)]">
              <tr><th className="text-left px-4 py-2 font-bold">Driver</th><th className="text-left px-4 py-2 font-bold">Email</th><th className="text-left px-4 py-2 font-bold">Sent</th><th className="text-left px-4 py-2 font-bold">Status</th><th className="text-left px-4 py-2 font-bold">Note</th><th className="text-right px-4 py-2 font-bold">Action</th></tr>
            </thead>
            <tbody>{INVITES.map((iv, i) => (
              <tr key={i} className="border-t border-[var(--border)]">
                <td className="px-4 py-2.5 text-[var(--fg)] font-semibold">{iv.name}</td>
                <td className="px-4 py-2.5 text-[var(--fg-muted)] font-mono text-[12px]">{iv.email}</td>
                <td className="px-4 py-2.5 text-[var(--fg-muted)]">{iv.sent}</td>
                <td className="px-4 py-2.5"><span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${iv.status === "completed" ? "bg-[var(--success)]/15 text-[var(--success)]" : iv.status === "pending" ? "bg-[var(--warning)]/15 text-[var(--warning)]" : "bg-[var(--danger)]/15 text-[var(--danger)]"}`}>{iv.status.toUpperCase()}</span></td>
                <td className="px-4 py-2.5 text-[var(--fg-muted)]">{iv.note}</td>
                <td className="px-4 py-2.5 text-right">{iv.status === "expired" ? <button className="text-[12px] text-[var(--accent)] font-bold hover:underline">Resend →</button> : iv.status === "pending" ? <button className="text-[12px] text-[var(--fg-muted)] hover:text-[var(--fg)]">Remind →</button> : <span className="text-[12px] text-[var(--fg-faint)]">Done</span>}</td>
              </tr>))}</tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
