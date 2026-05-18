"use client";
import { useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { X3AdminHero, X3KPITile, X3AdminTabs } from "@/components/X3AdminHero";
import { STUB_AGENTS, ADMIN_KPIS, SCHEDULED_AGENTS, ONDEMAND_AGENTS } from "@/lib/demoData";
import { useAgentState } from "@/lib/useAgentState";
import { AgentLogsModal, AgentEditModal, AgentRunNowModal, Toast } from "@/components/AdminModals";

function StatusDot({ result }: { result: string }) {
  const color = result === "ok" ? "#10B981" : result === "partial" ? "#F59E0B" : result === "error" ? "#EF4444" : result === "never" ? "#E5E7EB" : "#94A3B8";
  return <span className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />;
}

function Toggle({ on, onChange, disabled }: { on: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button onClick={(e) => { e.stopPropagation(); if (!disabled) onChange(); }} disabled={disabled} aria-pressed={on} className={`relative inline-block w-9 h-5 rounded-full transition-colors ${on ? "bg-[var(--accent)]" : "bg-[var(--surface-2)] border border-[var(--border)]"} ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${on ? "translate-x-4" : ""}`} />
    </button>
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
  const [toast, setToast] = useState<string | null>(null);
  const [logsFor, setLogsFor] = useState<string | null>(null);
  const [editFor, setEditFor] = useState<string | null>(null);
  const [runFor, setRunFor] = useState<string | null>(null);
  const [activityAgent, setActivityAgent] = useState("all");
  const [activityStatus, setActivityStatus] = useState("all");
  const [activityWindow, setActivityWindow] = useState("48h");

  const { scheduledAgents, onDemandAgents, carrierPrefs, activity, runs24h, runsOk, runsErr, toggleAgent, editAgent, runAgentNow, updateCarrierPref, resetEverything, hydrated } = useAgentState();

  // Look up current state of the agent we have a modal open for
  const findAgent = (name: string | null) => {
    if (!name) return null;
    return scheduledAgents.find((a) => a.name === name) || onDemandAgents.find((a) => a.name === name) || null;
  };
  const editTarget = findAgent(editFor);

  // Activity tab filtering
  const filteredActivity = useMemo(() => {
    return activity.filter((r) => {
      if (activityAgent !== "all" && r.agent !== activityAgent) return false;
      if (activityStatus !== "all" && r.status !== activityStatus) return false;
      // (date filtering is cosmetic in this prototype — all dummy data is recent)
      return true;
    });
  }, [activity, activityAgent, activityStatus]);

  const handleToggle = (name: string, currentEnabled: boolean) => {
    toggleAgent(name, !currentEnabled);
    setToast(`${name} ${!currentEnabled ? "enabled" : "paused"}`);
  };

  const handleRunConfirm = (name: string, mode: "ok" | "skipped" | "error") => {
    runAgentNow(name, mode);
    setToast(`${name} ran — see Activity tab`);
  };

  const handleEditSave = (name: string, patch: { cadence?: string; enabled?: boolean }) => {
    if (patch.cadence) editAgent(name, patch.cadence);
    if (patch.enabled !== undefined) toggleAgent(name, patch.enabled);
    setToast(`${name} saved`);
  };

  const handlePrefChange = (dot: string, field: string, value: unknown) => {
    updateCarrierPref(dot, { [field]: value } as never);
    setToast(`Preferences saved`);
  };

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
              <X3KPITile label="Agents"      value={scheduledAgents.filter((a) => a.enabled).length + onDemandAgents.filter((a) => a.enabled).length} sub={`${SCHEDULED_AGENTS.length + ONDEMAND_AGENTS.length + STUB_AGENTS.length} total · ${STUB_AGENTS.length} stubs`} tone="navy" />
              <X3KPITile label="Runs · 24h"  value={runs24h.toLocaleString()} sub={`${runsOk.toLocaleString()} ok · ${runsErr} err`} tone="navy" />
              <X3KPITile label="Open alerts" value={ADMIN_KPIS.open_alerts} sub={`${ADMIN_KPIS.open_blocker} blocker · ${ADMIN_KPIS.open_urgent} urgent`} tone="red" />
              <X3KPITile label="Last close"  value={ADMIN_KPIS.last_close} sub={`next: ${ADMIN_KPIS.last_close_next}`} tone="navy" />
            </div>

            <div className="flex items-center justify-between">
              <div className="text-[11px] tracking-[.18em] uppercase font-extrabold text-[var(--fg-muted)]">Scheduled Agents</div>
              <div className="flex gap-2">
                <button onClick={() => setShowLegend(!showLegend)} className="px-3 py-1.5 rounded-lg font-bold text-[12px] text-[var(--fg)] border border-[var(--border)] hover:bg-[var(--surface-2)]">📖 What does each agent do?</button>
                <button onClick={() => { if (confirm("Reset all your local changes (toggles, cadence edits, simulated runs, carrier prefs) back to defaults?")) { resetEverything(); setToast("All local changes reset"); } }} className="px-3 py-1.5 rounded-lg font-bold text-[12px] text-[var(--fg-muted)] border border-[var(--border)] hover:bg-[var(--surface-2)]" title="Wipe local prototype state">↺ Reset</button>
              </div>
            </div>

            {showLegend && (
              <div className="x3-card p-5 space-y-3">
                <div className="text-[13px] text-[var(--fg-muted)]">Every X3 agent is a scheduled or queue-triggered worker that runs against the production database with a scoped service-role JWT. Source lives in <code className="font-mono text-[var(--accent)]">agents/</code> in <code className="font-mono text-[var(--accent)]">x3fleetsafety/x3compass-web</code>. Click <strong className="text-[var(--fg)]">Edit</strong> to change cadence/pause; <strong className="text-[var(--fg)]">Logs</strong> for the last 50 runs; <strong className="text-[var(--fg)]">Run now</strong> to fire ad-hoc.</div>
                <div className="rounded-lg border border-[#FACC15]/40 bg-[#FACC15]/5 p-3 text-[12px] text-[var(--fg-muted)]"><strong className="text-[#B45309]">⚠ Prototype state</strong> — toggles, edits, and Run-now actions persist to <code className="font-mono">localStorage</code> only. Phase 2 wires them to Pages Functions + Supabase + Cloudflare Cron Triggers. The Reset button clears your local overrides.</div>
              </div>
            )}

            <div className="x3-card overflow-hidden">
              <table className="w-full text-[13px]">
                <thead className="bg-[var(--surface-2)] text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)]">
                  <tr><th className="text-left px-4 py-2 font-bold w-6"></th><th className="text-left px-4 py-2 font-bold">Agent</th><th className="text-left px-4 py-2 font-bold">Cadence</th><th className="text-left px-4 py-2 font-bold">Last run</th><th className="text-left px-4 py-2 font-bold">Last result</th><th className="text-left px-4 py-2 font-bold">Enabled</th><th className="text-left px-4 py-2 font-bold">Actions</th></tr>
                </thead>
                <tbody>{scheduledAgents.map((a) => (
                  <tr key={a.name} className="border-t border-[var(--border)]" title={a.description}>
                    <td className="px-4 py-2.5"><StatusDot result={a.result} /></td>
                    <td className="px-4 py-2.5"><button onClick={() => setLogsFor(a.name)} className="text-[var(--accent)] font-mono font-semibold hover:underline">{a.name}</button></td>
                    <td className="px-4 py-2.5 text-[var(--fg-muted)]">{a.cadence}</td>
                    <td className="px-4 py-2.5 text-[var(--fg-muted)]">{a.last_run}</td>
                    <td className="px-4 py-2.5">{a.result === "never" ? <span className="text-[var(--fg-faint)]">—</span> : <StatusPill status={a.result} />}</td>
                    <td className="px-4 py-2.5"><Toggle on={a.enabled} onChange={() => handleToggle(a.name, a.enabled)} disabled={!hydrated} /></td>
                    <td className="px-4 py-2.5 flex items-center gap-1.5">
                      <button onClick={() => setRunFor(a.name)} disabled={!a.enabled} className={`px-2.5 py-1 rounded font-bold text-[11px] ${a.enabled ? "text-[var(--accent-fg)] bg-[var(--accent)] hover:opacity-90" : "text-[var(--fg-muted)] bg-[var(--surface-2)] cursor-not-allowed"}`}>Run now</button>
                      <button onClick={() => setLogsFor(a.name)} className="px-2.5 py-1 rounded font-bold text-[11px] text-[var(--fg)] border border-[var(--border)] hover:bg-[var(--surface-2)]">Logs</button>
                      <button onClick={() => setEditFor(a.name)} className="px-2.5 py-1 rounded font-bold text-[11px] text-[var(--fg)] border border-[var(--border)] hover:bg-[var(--surface-2)]">Edit</button>
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
                <tbody>{onDemandAgents.map((a) => (
                  <tr key={a.name} className="border-t border-[var(--border)]" title={a.description}>
                    <td className="px-4 py-2.5"><StatusDot result={a.result} /></td>
                    <td className="px-4 py-2.5"><button onClick={() => setLogsFor(a.name)} className="text-[var(--accent)] font-mono font-semibold hover:underline">{a.name}</button></td>
                    <td className="px-4 py-2.5 text-[var(--fg-muted)]">{a.trigger}</td>
                    <td className="px-4 py-2.5 text-[var(--fg-muted)]">{a.last_run}</td>
                    <td className="px-4 py-2.5"><StatusPill status={a.result} /></td>
                    <td className="px-4 py-2.5"><Toggle on={a.enabled} onChange={() => handleToggle(a.name, a.enabled)} disabled={!hydrated} /></td>
                    <td className="px-4 py-2.5 flex items-center gap-1.5">
                      <button onClick={() => setRunFor(a.name)} disabled={!a.enabled} className={`px-2.5 py-1 rounded font-bold text-[11px] ${a.enabled ? "text-[var(--accent-fg)] bg-[var(--accent)] hover:opacity-90" : "text-[var(--fg-muted)] bg-[var(--surface-2)] cursor-not-allowed"}`}>Queue</button>
                      <button onClick={() => setLogsFor(a.name)} className="px-2.5 py-1 rounded font-bold text-[11px] text-[var(--fg)] border border-[var(--border)] hover:bg-[var(--surface-2)]">Logs</button>
                    </td>
                  </tr>))}</tbody>
              </table>
            </div>

            <div className="text-[11px] tracking-[.18em] uppercase font-extrabold text-[var(--fg-muted)]">Agents Blocked on Setup</div>
            <div className="x3-card overflow-hidden">
              <table className="w-full text-[13px]">
                <tbody>{STUB_AGENTS.map((a) => (
                  <tr key={a.name} className="border-t border-[var(--border)] first:border-t-0">
                    <td className="px-4 py-3 w-6"><StatusDot result="never" /></td>
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><span className="text-[var(--fg)] font-mono font-semibold">{a.name}</span><span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-[#FACC15]/20 text-[#B45309]">STUB</span></div><div className="text-[11px] text-[var(--fg-muted)] mt-1">{a.reason}</div></td>
                    <td className="px-4 py-3 text-right"><button onClick={() => setLogsFor(a.name)} className="px-2.5 py-1 rounded font-bold text-[11px] text-[var(--fg)] border border-[var(--border)] hover:bg-[var(--surface-2)]">Logs</button></td>
                  </tr>))}</tbody>
              </table>
            </div>
          </>
        )}

        {tab === "prefs" && (
          <>
            <div className="flex items-center gap-3 flex-wrap">
              <label className="text-[11px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)]">Carrier</label>
              <select className="px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[13px] font-bold text-[var(--fg)]"><option>All carriers</option>{carrierPrefs.map((c) => <option key={c.dot}>{c.name}</option>)}</select>
              <span className="text-[12px] text-[var(--fg-muted)]">{carrierPrefs.length} carriers</span>
              <span className="ml-auto text-[11px] text-[var(--fg-faint)]">Changes save automatically</span>
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
                  </tr>
                </thead>
                <tbody>{carrierPrefs.map((c) => (
                  <tr key={c.dot} className="border-t border-[var(--border)]">
                    <td className="px-3 py-2.5"><div className="text-[var(--fg)] font-semibold">{c.name}</div><div className="text-[10px] text-[var(--fg-faint)] font-mono">DOT {c.dot}</div></td>
                    <td className="px-3 py-2.5"><select value={c.mode} onChange={(e) => handlePrefChange(c.dot, "mode", e.target.value)} className="px-2 py-1 rounded bg-[var(--surface-2)] border border-[var(--border)] text-[12px]"><option>Realtime</option><option>Digest</option></select></td>
                    <td className="px-3 py-2.5"><select value={c.send_hour} onChange={(e) => handlePrefChange(c.dot, "send_hour", e.target.value)} className="px-2 py-1 rounded bg-[var(--surface-2)] border border-[var(--border)] text-[12px]"><option>6am</option><option>7am</option><option>8am</option><option>9am</option><option>10am</option></select></td>
                    {(["monthly","reg","qbr","expiry","csa","ifta","inspect"] as const).map((field) => (
                      <td key={field} className="px-2 py-2.5 text-center"><input type="checkbox" checked={c[field]} onChange={(e) => handlePrefChange(c.dot, field, e.target.checked)} className="w-4 h-4" /></td>
                    ))}
                  </tr>))}</tbody>
              </table>
            </div>
          </>
        )}

        {tab === "activity" && (
          <>
            <div className="flex items-center gap-3 flex-wrap">
              <select value={activityAgent} onChange={(e) => setActivityAgent(e.target.value)} className="px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[13px]">
                <option value="all">All agents</option>
                {[...scheduledAgents, ...onDemandAgents].map((a) => <option key={a.name} value={a.name}>{a.name}</option>)}
              </select>
              <select value={activityStatus} onChange={(e) => setActivityStatus(e.target.value)} className="px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[13px]">
                <option value="all">All statuses</option><option value="ok">ok</option><option value="partial">partial</option><option value="skipped">skipped</option><option value="error">error</option>
              </select>
              <select value={activityWindow} onChange={(e) => setActivityWindow(e.target.value)} className="px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[13px]">
                <option value="48h">Last 48 hours</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option>
              </select>
              <button onClick={() => setToast(`Refreshed at ${new Date().toLocaleTimeString()}`)} className="px-3 py-1.5 rounded-lg font-bold text-[13px] text-[var(--fg)] border border-[var(--border)] hover:bg-[var(--surface-2)]">↻ Refresh</button>
              <span className="ml-auto text-[11px] text-[var(--fg-muted)]">{filteredActivity.length} of {activity.length} rows</span>
            </div>
            <div className="x3-card overflow-hidden">
              <table className="w-full text-[13px]">
                <thead className="bg-[var(--surface-2)] text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)]">
                  <tr><th className="text-left px-4 py-2 font-bold">When</th><th className="text-left px-4 py-2 font-bold">Agent</th><th className="text-left px-4 py-2 font-bold">Status</th><th className="text-right px-4 py-2 font-bold">Duration</th><th className="text-left px-4 py-2 font-bold">Summary</th></tr>
                </thead>
                <tbody>{filteredActivity.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-[var(--fg-faint)]">No runs match this filter.</td></tr>
                ) : filteredActivity.map((r, i) => (
                  <tr key={i} className="border-t border-[var(--border)]">
                    <td className="px-4 py-2.5 text-[var(--fg-muted)] tabular-nums whitespace-nowrap">{r.when}</td>
                    <td className="px-4 py-2.5"><button onClick={() => setLogsFor(r.agent)} className="text-[var(--accent)] font-mono font-semibold hover:underline">{r.agent}</button></td>
                    <td className="px-4 py-2.5"><StatusPill status={r.status} /></td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-[var(--fg-muted)]">{r.duration}</td>
                    <td className="px-4 py-2.5 text-[var(--fg-muted)]">{r.summary}</td>
                  </tr>))}</tbody>
              </table>
            </div>
          </>
        )}

        {/* Modals */}
        <AgentLogsModal open={!!logsFor} onClose={() => setLogsFor(null)} agentName={logsFor || ""} />
        <AgentEditModal open={!!editFor && !!editTarget} onClose={() => setEditFor(null)} agentName={editFor || ""} currentCadence={(editTarget && "cadence" in editTarget ? editTarget.cadence : "Every hour")} currentEnabled={editTarget?.enabled ?? true} onSave={(patch) => editFor && handleEditSave(editFor, patch)} />
        <AgentRunNowModal open={!!runFor} onClose={() => setRunFor(null)} agentName={runFor || ""} onConfirm={(mode) => runFor && handleRunConfirm(runFor, mode)} />
        <Toast message={toast} onDismiss={() => setToast(null)} />
      </div>
    </AppShell>
  );
}
