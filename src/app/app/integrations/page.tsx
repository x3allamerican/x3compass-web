"use client";
import AppShell from "@/components/AppShell";
import { INTEGRATIONS } from "@/lib/demoData";

export default function IntegrationsPage() {
  return (
    <AppShell title="Integrations" crumbs="Vendors wired into your compliance brains">
      <div className="px-6 py-6 space-y-6 bg-[var(--bg)] min-h-screen">
        <div className="x3-card p-5">
          <div className="text-[13px] text-[var(--fg-muted)]">
            X3 Compass is a thin layer over a small set of audited vendors. Connected vendors flow data through your brains automatically. Available vendors can be turned on with a click + their setup. Anything &quot;awaiting API&quot; means we&apos;ll add it the moment the vendor opens public access.
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {INTEGRATIONS.map((v) => (
            <div key={v.vendor} className="x3-card p-5">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="text-[15px] font-extrabold text-[var(--fg)]">{v.vendor}</div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${v.status === "Connected" ? "bg-[var(--success)]/15 text-[var(--success)]" : v.status === "Available" ? "bg-[var(--accent)]/15 text-[var(--accent)]" : v.status === "In trial" ? "bg-[var(--warning)]/15 text-[var(--warning)]" : "bg-[var(--fg-muted)]/15 text-[var(--fg-muted)]"}`}>{v.status}</span>
              </div>
              <div className="text-[12px] text-[var(--fg-muted)] mb-3">{v.purpose}</div>
              <div className="text-[10px] tracking-[.12em] uppercase font-bold text-[var(--fg-faint)]">{v.badge}</div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
