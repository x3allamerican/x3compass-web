"use client";
import { useState } from "react";
import AppShell from "@/components/AppShell";
import { X3AdminHero, X3KPITile, X3AdminTabs } from "@/components/X3AdminHero";
import { SCHEDULED_AGENTS, ONDEMAND_AGENTS, STUB_AGENTS, ADMIN_KPIS, CARRIER_PREFS, ACTIVITY_LOG } from "@/lib/demoData";

function StatusDot({ result }: { result: string }) {
  const color = result === "ok" ? "#10B981" : result === "partial" ? "#F59E0B" : result === "error" ? "#EF4444" : result === "never" ? "#E5E7EB" : "#94A3B8";
  return <span className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />;
}

function Toggle({ on }: { on: boolean }) {
  return (
    <span className={`relative inline-block w-9 h-5 rounded-full transition-colors ${on ? "bg-[var(--accent)]" : "bg-[var(--surface-2)]"}`}>
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${on ? "translate-x-4" : ""}`} />
    </span>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    ok:      "bg-[var(--success)] text-white",
    partial: "bg-[var(--warning)] text-white",
    error:   "bg-[var(--danger)] text-white",
    skipped: "bg-[#94A3B8] text-white",
    never:   "bg-[var(--surface-2)] text-[var(--fg-muted)]",
  };
  return <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold tracking-[.08em] uppercase ${map[status] || "bg-[var(--surface-2)] text-[var(--fg-muted)]"}`}>{status}</span>;
}

export default function ControlCenterPage() {
  const [tab, setTab] = useState("agents");
  const [showLegend, setShowLegend] = useState(false);

  return (
    <AppShell title="Admin Control Center" crumbs="X3 Admin · Cross-tenant operations console">
      <div className="px-6 py-6 space-y-6 bg-[var(--bg)] min-h-screen">
        <X3AdminHero
          eyebrow="X3 Internal Admin"
          title="Cross-tenant operations console."
          intro="Agents · Carrier Preferences · Activity — visible to super-admins only."
        />

        <X3AdminTabs active={tab} onChange={setTab} tabs={[
          { key: "agents",   label: "Agents" },
          { key: "prefs",    label: "Carrier Preferences" },
          { key: "activity", label: "Activity" },
        ]} />

        {tab === "agents" && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <X3KPITile label="Agents"        value={ADMIN_KPIS.agents_active} sub={`${ADMIN_KPIS.agents_total} total · ${ADMIN_KPIS.agents_stubs} stubs`} tone="navy" />
              <X3KPITile label="Runs · 24h"    value={ADMIN_KPIS.runs_24h}      sub={`${ADMIN_KPIS.runs_ok} ok · ${ADMIN_KPIS.runs_err} err`}             tone="navy" />
              <X3KPITile label="Open alerts"   value={ADMIN_KPIS.open_alerts}   sub={`${ADMIN_KPIS.open_blocker} blocker · ${ADMIN_KPIS.open_urgent} urgent`} tone="red"  />
              <X3KPITile label="Last close"    value={ADMIN_KPIS.last_close}    sub={`next: ${ADMIN_KPIS.last_close_next}`}                              tone="navy" />
            </div>

            <div className="flex items-center justify-between">
              <div className="text-[11px] tracking-[.18em] uppercase font-extrabold text-[var(--fg-muted)]">Scheduled Agents</div>
              <button onClick={() => setShowLegend(!showLegend)} className="px-3 py-1.5 rounded-lg font-bold text-[12px] text-[var(--fg)] border border-[var(--border)] hover:bg-[var(--surface-2)]">📖 What does each agent do?</button>
            </div>

            {showLegend && (
              <div className="x3-card p-5 space-y-3">
                <div className="text-[13px] text-[var(--fg-muted)]">Every X3 agent is a scheduled or queue-triggered worker that runs against the production database with a scoped service-role JWT. Source lives in the <code className="font-mono text-[var(--accent)]">agents/</code> directory of <code className="font-mono text-[var(--accent)]">x3fleetsafety/x3compass-web</code>. Click <strong className="text-[var(--fg)]">Edit</strong> to change cadence or pause; <strong className="text-[var(--fg)]">Logs</strong> for the last 50 runs; <strong className="text-[var(--fg)]">Run now</strong> to fire ad-hoc.</div>
              </div>
            )}

            <div className="x3-card overflow-hidden">
              <table className="w-full text-[13px]">
                <thead className="bg-[var(--surface-2)] text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)]">
                  <tr><th className="text-left px-4 py-2 font-bold w-6"></th><th className="text-left px-4 py-2 font-bold">Agent</th><th className="text-left px-4 py-2 font-bold">Cadence</th><th className="text-left px-4 py-2 font-bold">Last run</th><th className="text-left px-4 py-2 font-bold">Last result</th><th className="text-left px-4 py-2 font-bold">Enabled</th><th className="text-left px-4 py-2 font-bold">Actions</th></tr>
                </thead>
                <tbody>{SCHEDULED_AGENTS.map((a, i) => (
                  <tr key={i} className="border-t border-[var(--border)]" title={a.description}>
                    <td className="px-4 py-2.5"><StatusDot result={a.result} /></td>
                    <td className="px-4 py-2.5"><span className="text-[var(--accent)] font-mono font-semibold cursor-pointer hover:underline">{a.name}</span></td>
                    <td className="px-4 py-2.5 text-[var(--fg-muted)]">{a.cadence}</td>
                    <td className="px-4 py-2.5 text-[var(--fg-muted)]">{a.last_run}</td>
                    <td className="px-4 py-2.5">{a.result === "never" ? <span className="text-[var(--fg-faint)]">—</span> : <StatusPill status={a.result} />}</td>
                    <td className="px-4 py-2.5"><Toggle on={a.enabled} /></td>
                    <td className="px-4 py-2.5 flex items-center gap-1.5">
                      <button className="px-2.5 py-1 rounded font-bold text-[11px] text-[var(--accent-fg)] bg-[var(--accent)] hover:opacity-90">Run now</button>
                      <button className="px-2.5 py-1 rounded font-bold text-[11px] text-[var(--fg)] border border-[var(--border)] hover:bg-[var(--surface-2)]">Logs</button>
                      <button className="px-2.5 py-1 rounded font-bold text-[11px] text-[var(--fg)] border border-[var(--border)] hover:bg-[var(--surface-2)]">Edit</button>
                    </td>
                  </tr>))}</tbody>
              </table>
            </div>

            <div className="text-[11px] tracking-[.18em] uppercase font-extrabold text-[var(--fg-muted)]">On-Demand Agents</div>
            <div className="x3-card overflow-hidden">
              <table className="w-full text-[13px]">
                <thead className="bg-[var(--surface-2)] text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)]">
                  <tr><th className="text-left px-4 py-2 font-bold w-6"></th><th className="text-left px-4 py-2 font-bold">Agent</th><th className="text-left px-4 py-2 font-bold">Trigger</th><th className="text-left px-4 py-2 font-bold">Last run</th><th className="text-left px-4 py-2 font-bold">Last result</th><th className="text-left px-4 py-2 font-bold">Enabled</th><th className="text-left px-4 py-2 font-bold">Actions</th></tr>
                </thead>
                <tbody>{ONDEMAND_AGENTS.map((a, i) => (
                  <tr key={i} className="border-t border-[var(--border)]" title={a.description}>
                    <td className="px-4 py-2.5"><StatusDot result={a.result} /></td>
                    <td className="px-4 py-2.5"><span className="text-[var(--accent)] font-mono font-semibold cursor-pointer hover:underline">{a.name}</span></td>
                    <td className="px-4 py-2.5 text-[var(--fg-muted)]">{a.trigger}</td>
                    <td className="px-4 py-2.5 text-[var(--fg-muted)]">{a.last_run}</td>
                    <td className="px-4 py-2.5"><StatusPill status={a.result} /></td>
                    <td className="px-4 py-2.5"><Toggle on={a.enabled} /></td>
                    <td className="px-4 py-2.5 flex items-center gap-1.5">
                      <button className="px-2.5 py-1 rounded font-bold text-[11px] text-[var(--fg-muted)] border border-[var(--border)] cursor-not-allowed opacity-50">Queue</button>
                      <button className="px-2.5 py-1 rounded font-bold text-[11px] text-[var(--fg)] border border-[var(--border)] hover:bg-[var(--surface-2)]">Logs</button>
                    </td>
                  </tr>))}</tbody>
              </table>
            </div>

            <div className="text-[11px] tracking-[.18em] uppercase font-extrabold text-[var(--fg-muted)]">Agents Blocked on Setup</div>
            <div className="x3-card overflow-hidden">
              <table className="w-full text-[13px]">
                <tbody>{STUB_AGENTS.map((a, i) => (
                  <tr key={i} className="border-t border-[var(--border)] first:border-t-0">
                    <td className="px-4 py-3 w-6"><StatusDot result="never" /></td>
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><span className="text-[var(--fg)] font-mono font-semibold">{a.name}</span><span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-[#FACC15]/20 text-[#B45309]">STUB</span></div><div className="text-[11px] text-[var(--fg-muted)] mt-1">{a.reason}</div></td>
                    <td className="px-4 py-3 text-right"><button className="px-2.5 py-1 rounded font-bold text-[11px] text-[var(--fg)] border border-[var(--border)] hover:bg-[var(--surface-2)]">Logs</button></td>
                  </tr>))}</tbody>
              </table>
            </div>
          </>
        )}

        {tab === "prefs" && (
          <>
            <div className="flex items-center gap-3">
              <label className="text-[11px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)]">Carrier</label>
              <select className="px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[13px] font-bold text-[var(--fg)]"><option>All carriers</option>{CARRIER_PREFS.map((c) => <option key={c.dot}>{c.name}</option>)}</select>
              <span className="text-[12px] text-[var(--fg-muted)]">{CARRIER_PREFS.length} carriers</span>
            </div>
            <div className="x3-card overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead className="bg-[var(--surface-2)] text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)]">
                  <tr>
                    <th className="text-left px-3 py-2 font-bold">Carrier</th>
                    <th className="text-left px-3 py-2 font-bold">Mode</th>
                    <th className="text-left px-3 py-2 font-bold">Send hour</th>
                    <th className="text-center px-2 py-2 font-bold">📊 Monthly</th>
                    <th className="text-center px-2 py-2 font-bold">🏥 REG</th>
                    <th className="text-center px-2 py-2 font-bold">🤝 QBR</th>
                    <th className="text-center px-2 py-2 font-bold">⏰ Expiry</th>
                    <th className="text-center px-2 py-2 font-bold">🛡 CSA</th>
                    <th className="text-center px-2 py-2 font-bold">⛽ IFTA</th>
                    <th className="text-center px-2 py-2 font-bold">🔧 Inspect</th>
                    <th className="text-left px-3 py-2 font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>{CARRIER_PREFS.map((c, i) => (
                  <tr key={i} className="border-t border-[var(--border)]">
                    <td className="px-3 py-2.5"><div className="text-[var(--fg)] font-semibold">{c.name}</div><div className="text-[10px] text-[var(--fg-faint)] font-mono">DOT {c.dot}</div></td>
                    <td className="px-3 py-2.5"><select defaultValue={c.mode} className="px-2 py-1 rounded bg-[var(--surface-2)] border border-[var(--border)] text-[12px]"><option>Realtime</option><option>Digest</option></select></td>
                    <td className="px-3 py-2.5"><select defaultValue={c.send_hour} className="px-2 py-1 rounded bg-[var(--surface-2)] border border-[var(--border)] text-[12px]"><option>6am</option><option>7am</option><option>8am</option><option>9am</option><option>10am</option></select></td>
                    {([c.monthly, c.reg, c.qbr, c.expiry, c.csa, c.ifta, c.inspect] as const).map((v, j) => (
                      <td key={j} className="px-2 py-2.5 text-center"><input type="checkbox" defaultChecked={v} className="w-4 h-4" /></td>
                    ))}
                    <td className="px-3 py-2.5"><button className="px-2.5 py-1 rounded font-bold text-[11px] text-[var(--fg)] border border-[var(--border)] hover:bg-[var(--surface-2)]">Edit</button></td>
                  </tr>))}</tbody>
              </table>
            </div>
          </>
        )}

        {tab === "activity" && (
          <>
            <div className="flex items-center gap-3 flex-wrap">
              <select className="px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[13px]"><option>All agents</option>{SCHEDULED_AGENTS.concat(ONDEMAND_AGENTS as never).map((a) => <option key={a.name}>{a.name}</option>)}</select>
              <select className="px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[13px]"><option>All statuses</option><option>ok</option><option>partial</option><option>skipped</option><option>error</option></select>
              <select className="px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[13px]"><option>Last 48 hours</option><option>Last 7 days</option><option>Last 30 days</option></select>
              <button className="px-3 py-1.5 rounded-lg font-bold text-[13px] text-[var(--fg)] border border-[var(--border)] hover:bg-[var(--surface-2)]">↻ Refresh</button>
            </div>
            <div className="x3-card overflow-hidden">
              <table className="w-full text-[13px]">
                <thead className="bg-[var(--surface-2)] text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)]">
                  <tr><th className="text-left px-4 py-2 font-bold">When</th><th className="text-left px-4 py-2 font-bold">Agent</th><th className="text-left px-4 py-2 font-bold">Status</th><th className="text-right px-4 py-2 font-bold">Duration</th><th className="text-left px-4 py-2 font-bold">Summary</th></tr>
                </thead>
                <tbody>{ACTIVITY_LOG.map((r, i) => (
                  <tr key={i} className="border-t border-[var(--border)]">
                    <td className="px-4 py-2.5 text-[var(--fg-muted)] tabular-nums whitespace-nowrap">{r.when}</td>
                    <td className="px-4 py-2.5 text-[var(--accent)] font-mono font-semibold">{r.agent}</td>
                    <td className="px-4 py-2.5"><StatusPill status={r.status} /></td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-[var(--fg-muted)]">{r.duration}</td>
                    <td className="px-4 py-2.5 text-[var(--fg-muted)]">{r.summary}</td>
                  </tr>))}</tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
