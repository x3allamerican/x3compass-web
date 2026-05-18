"use client";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { ACTION_ITEMS, DEMO_FLEET } from "@/lib/demoData";

const TASKS = [
  { who: "Christine Wilson",    task: "Report positive D&A to Clearinghouse",      due: "due today",     priority: "P1" },
  { who: "Margaret Rodriguez",  task: "Renew CDL — expired 5430 days",             due: "blocking ops",  priority: "P1" },
  { who: "Unit 156A",            task: "Preventive maintenance 138 days overdue",   due: "blocking ops",  priority: "P1" },
  { who: "Nancy Walker",         task: "Pull annual MVR — 365 days overdue",        due: "in 1 day",      priority: "P2" },
  { who: "Zachary Mitchell",     task: "Upload renewed medical examiner cert",      due: "in 2 days",     priority: "P2" },
  { who: "Joshua Lee",           task: "Classify Mar 22 incident (severe)",         due: "in 3 days",     priority: "P2" },
  { who: "Michael Patel",        task: "Log ELDT theory + behind-the-wheel",        due: "in 5 days",     priority: "P3" },
];

export default function ControlCenterPage() {
  return (
    <AppShell title="Control Center" crumbs="Today · Triaged action queue">
      <div className="px-6 py-6 space-y-6 bg-[var(--bg)] min-h-screen">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="x3-card p-4"><div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)]">Open tasks today</div><div className="text-[28px] font-black text-[var(--fg)]">{DEMO_FLEET.open_alerts}</div></div>
          <div className="x3-card p-4"><div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)]">P1 · blocking</div><div className="text-[28px] font-black text-[var(--danger)]">3</div></div>
          <div className="x3-card p-4"><div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)]">P2 · this week</div><div className="text-[28px] font-black text-[var(--warning)]">3</div></div>
          <div className="x3-card p-4"><div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)]">P3 · next sprint</div><div className="text-[28px] font-black text-[var(--accent)]">1</div></div>
        </div>
        <div className="x3-card overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--border)]">
            <div className="text-[15px] font-extrabold text-[var(--fg)]">Today&apos;s queue</div>
            <div className="text-[11px] text-[var(--fg-muted)]">Sorted by priority. Each item routes to the brain that owns it.</div>
          </div>
          <table className="w-full text-[13px]">
            <thead className="bg-[var(--surface-2)] text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)]">
              <tr><th className="text-left px-4 py-2 font-bold">Priority</th><th className="text-left px-4 py-2 font-bold">Who / What</th><th className="text-left px-4 py-2 font-bold">Task</th><th className="text-left px-4 py-2 font-bold">Due</th><th className="text-right px-4 py-2 font-bold">Action</th></tr>
            </thead>
            <tbody>{TASKS.map((t, i) => (
              <tr key={i} className="border-t border-[var(--border)]">
                <td className="px-4 py-2.5"><span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${t.priority === "P1" ? "bg-[var(--danger)]/15 text-[var(--danger)]" : t.priority === "P2" ? "bg-[var(--warning)]/15 text-[var(--warning)]" : "bg-[var(--accent)]/15 text-[var(--accent)]"}`}>{t.priority}</span></td>
                <td className="px-4 py-2.5 text-[var(--fg)] font-semibold">{t.who}</td>
                <td className="px-4 py-2.5 text-[var(--fg-muted)]">{t.task}</td>
                <td className="px-4 py-2.5 text-[var(--fg-muted)]">{t.due}</td>
                <td className="px-4 py-2.5 text-right"><Link href="/app/ask" className="text-[12px] text-[var(--accent)] font-bold hover:underline">Ask Compass →</Link></td>
              </tr>))}</tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
