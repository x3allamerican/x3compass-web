"use client";
import AppShell from "@/components/AppShell";

const EVENTS = [
  { ts: "2026-05-17 14:22:08", actor: "system",                action: "compass_drug_alcohol_tests.insert",         target: "Wilson, Christine · positive",      ip: "10.0.0.4" },
  { ts: "2026-05-17 13:55:11", actor: "joshua@x3compass.com",  action: "compass_drivers.update",                    target: "Sanchez, Lawrence · status=active",  ip: "73.85.22.4" },
  { ts: "2026-05-17 13:51:39", actor: "joshua@x3compass.com",  action: "compass_vehicles.insert",                   target: "Unit 168",                            ip: "73.85.22.4" },
  { ts: "2026-05-17 12:08:00", actor: "agent:mvr-puller",      action: "compass_mvr.scheduled",                     target: "Walker, Nancy · 2026-05-18T06:00",   ip: "—"          },
  { ts: "2026-05-17 09:45:21", actor: "agent:pm-watch",        action: "compass_vehicles.flag_oos",                 target: "Unit 156A · PM 138d overdue",        ip: "—"          },
  { ts: "2026-05-17 08:00:00", actor: "agent:daily-digest",    action: "compass_notifications.bulk_send",           target: "1 carrier · 42 items",                ip: "—"          },
  { ts: "2026-05-16 21:14:02", actor: "joshua@x3compass.com",  action: "auth.login.success",                        target: "joshua@x3compass.com",                ip: "73.85.22.4" },
  { ts: "2026-05-16 16:30:00", actor: "agent:checkr-poller",   action: "compass_background_checks.update_status",   target: "Pena, Sarah · cleared",               ip: "—"          },
];

export default function AuditLogPage() {
  return (
    <AppShell title="Audit Log" crumbs="Every change · every actor · every timestamp">
      <div className="px-6 py-6 space-y-4 bg-[var(--bg)] min-h-screen">
        <div className="x3-card p-5">
          <div className="text-[13px] text-[var(--fg-muted)]">
            Immutable record of every state change in your account — human edits, agent actions, system events. Retained 7 years. Exportable as CSV or JSON for any FMCSA, SOC 2, or insurance audit.
          </div>
        </div>
        <div className="x3-card overflow-hidden">
          <table className="w-full text-[12px] font-mono">
            <thead className="bg-[var(--surface-2)] text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)]">
              <tr><th className="text-left px-4 py-2 font-bold">Timestamp (UTC)</th><th className="text-left px-4 py-2 font-bold">Actor</th><th className="text-left px-4 py-2 font-bold">Action</th><th className="text-left px-4 py-2 font-bold">Target</th><th className="text-left px-4 py-2 font-bold">IP</th></tr>
            </thead>
            <tbody>{EVENTS.map((e, i) => (
              <tr key={i} className="border-t border-[var(--border)]">
                <td className="px-4 py-2.5 text-[var(--fg-muted)] tabular-nums">{e.ts}</td>
                <td className="px-4 py-2.5 text-[var(--fg)]">{e.actor}</td>
                <td className="px-4 py-2.5 text-[var(--accent)]">{e.action}</td>
                <td className="px-4 py-2.5 text-[var(--fg-muted)]">{e.target}</td>
                <td className="px-4 py-2.5 text-[var(--fg-faint)]">{e.ip}</td>
              </tr>))}</tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
