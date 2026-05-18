"use client";
import AppShell from "@/components/AppShell";

const NOTIFICATIONS = [
  { ts: "2026-05-17 14:22", brain: "Drug & Alcohol", body: "Christine Wilson — positive drug test logged. Clearinghouse report due in 3 business days.", read: false, severity: "high" },
  { ts: "2026-05-17 12:08", brain: "DQ Files",       body: "Nancy Walker — annual MVR pull window opened. SambaSafety run scheduled for tomorrow 6am.", read: false, severity: "med"  },
  { ts: "2026-05-17 09:45", brain: "Vehicles & PM",  body: "Unit 156A is 138 days past PM. Recommend pulling from service until inspected.",            read: false, severity: "high" },
  { ts: "2026-05-17 08:00", brain: "Daily Digest",   body: "42 open items today. 15 urgent. Compliance health: 85%.",                                    read: true,  severity: "info" },
  { ts: "2026-05-16 16:30", brain: "Background",     body: "Checkr report cleared for new hire Sarah Pena. Ready to onboard.",                            read: true,  severity: "info" },
  { ts: "2026-05-16 11:14", brain: "Inspections",    body: "Roadside inspection logged for Eric Martinez — Level 1 clean.",                              read: true,  severity: "info" },
  { ts: "2026-05-15 20:02", brain: "CSA · DataQ",    body: "Vehicle Maint BASIC jumped to 1.92 MSR. Recommend reviewing 3 recent inspections for DataQ challenge.", read: true, severity: "med" },
];

export default function NotificationsPage() {
  return (
    <AppShell title="Notifications" crumbs="Cross-brain alert feed">
      <div className="px-6 py-6 space-y-4 bg-[var(--bg)] min-h-screen">
        <div className="x3-card divide-y divide-[var(--border)]">
          {NOTIFICATIONS.map((n, i) => (
            <div key={i} className={`p-4 flex items-start gap-3 ${!n.read ? "bg-[var(--accent)]/5" : ""}`}>
              <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${n.severity === "high" ? "bg-[var(--danger)]" : n.severity === "med" ? "bg-[var(--warning)]" : "bg-[var(--accent)]"}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <div className="text-[12px] text-[var(--accent)] tracking-[.14em] uppercase font-bold">{n.brain}</div>
                  <div className="text-[11px] text-[var(--fg-faint)]">{n.ts}</div>
                </div>
                <div className="text-[13px] text-[var(--fg)]">{n.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
