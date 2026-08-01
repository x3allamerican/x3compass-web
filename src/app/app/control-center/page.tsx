"use client";

/* ============================================================
   X3 COMPASS · CONTROL CENTER
   ------------------------------------------------------------
   Three-tab super-admin agent management console.
   - Agents: list + toggle + run-now for all 35 agents
   - Activity: filterable feed of compass_agent_runs
   - Carrier Prefs: per-tenant overrides
   ============================================================ */

import { useCallback, useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { useUser } from "@/lib/useUser";
import { getSupabase } from "@/lib/supabase";

/* Allowlist for the Control Center super-admin gate.
 * Same list as src/lib/superAdmin.ts but checked synchronously against the
 * useUser() user so the gate resolves on the same tick — `useIsSuperAdmin`
 * has its own internal getUser() call that lags one render behind and was
 * showing the "locked" screen even when the user IS on the allowlist. */
const SUPER_ADMIN_EMAILS = new Set([
  "joshua@x3compass.com",
  "joshua@x3fleetsafety.com",
  "joshuakovarik@yahoo.com",
]);

type AgentKind = "scheduled" | "on-demand" | "event";
type Agent = {
  name: string;
  kind: AgentKind;
  enabled: boolean;
  cron_expr: string | null;
  next_run_at: string | null;
  last_run_at: string | null;
  description: string | null;
  category: string | null;
  takes_inputs: boolean;
  last_run: { status: string; started_at: string; duration_ms: number | null; summary: string | null } | null;
};

type Run = {
  id: string;
  agent_name: string;
  status: "ok" | "partial" | "error" | "skipped" | "running";
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  summary: string | null;
  log: string | null;
  error: string | null;
  triggered_by: string | null;
  cost_cents: number;
  carrier_id: string | null;
};

const STATUS_COLOR: Record<string, string> = {
  ok:       "#22C55E",
  partial:  "#FBBF24",
  error:    "#F87171",
  skipped:  "#94A3B8",
  running:  "#16C7FF",
};
const STATUS_BG: Record<string, string> = {
  ok:       "rgba(34,197,94,0.15)",
  partial:  "rgba(251,191,36,0.15)",
  error:    "rgba(248,113,113,0.15)",
  skipped:  "rgba(148,163,184,0.15)",
  running:  "rgba(22,199,255,0.15)",
};

function fmtRel(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const dd = Math.floor(h / 24);
  return `${dd}d ago`;
}
function fmtDur(ms: number | null) {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

type Tab = "agents" | "activity" | "prefs";

export default function ControlCenterPage() {
  const { user, loading: userLoading } = useUser();
  const isSuperAdmin = !!(user?.email && SUPER_ADMIN_EMAILS.has(user.email.toLowerCase()));
  const [tab, setTab] = useState<Tab>("agents");
  const [authToken, setAuthToken] = useState<string>("");

  /* The /api/admin/* endpoints expect a Supabase JWT in Authorization,
   * NOT the user id. Pull the live session.access_token from supabase-js
   * and refresh whenever the user changes. */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await getSupabase().auth.getSession();
      if (!cancelled) setAuthToken(session?.access_token ? `Bearer ${session.access_token}` : "");
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (userLoading) {
    return (
      <AppShell title="Control Center" crumbs="X3 COMPASS · SUPER ADMIN">
        <div className="px-6 py-10 text-center text-white/60">Loading…</div>
      </AppShell>
    );
  }

  if (!isSuperAdmin) {
    return (
      <AppShell title="Control Center" crumbs="X3 COMPASS · SUPER ADMIN">
        <div className="px-6 py-10 max-w-2xl mx-auto">
          <div className="rounded-2xl p-8 border border-rose-500/30 bg-rose-500/5 text-center">
            <div className="text-[44px] mb-3">🔒</div>
            <h2 className="text-[20px] font-extrabold text-white mb-2">Super-admin only</h2>
            <p className="text-[14px] text-white/70">The Control Center manages cron schedules and live agent execution across every tenant. Reach out to Joshua if you need access.</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Control Center" crumbs="X3 COMPASS · 35 AI AGENTS · LIVE CRON">
      <div className="px-6 py-6 max-w-7xl mx-auto space-y-5">
        {/* Tab nav */}
        <div className="flex gap-1 border-b border-[#1E3556]">
          {([
            { key: "agents",   label: "Agents",            icon: "🎛" },
            { key: "activity", label: "Activity",          icon: "📋" },
            { key: "prefs",    label: "Carrier Preferences", icon: "⚙" },
          ] as Array<{ key: Tab; label: string; icon: string }>).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-3 text-[14px] font-bold border-b-2 transition-colors ${
                tab === t.key ? "text-[#16C7FF] border-[#16C7FF]" : "text-white/55 border-transparent hover:text-white"
              }`}
            >
              <span className="mr-2">{t.icon}</span>{t.label}
            </button>
          ))}
        </div>

        {tab === "agents"   && <AgentsTab authToken={authToken} />}
        {tab === "activity" && <ActivityTab authToken={authToken} />}
        {tab === "prefs"    && <CarrierPrefsTab authToken={authToken} />}
      </div>
    </AppShell>
  );
}

/* ============================================================
   AGENTS TAB
   ============================================================ */
function AgentsTab({ authToken }: { authToken: string }) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const r = await fetch("/api/admin/agents", { headers: { Authorization: authToken } });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error || `${r.status}`);
      setAgents(body.agents as Agent[]);
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }, [authToken]);
  useEffect(() => { fetchAgents(); }, [fetchAgents]);

  async function toggle(name: string, enabled: boolean) {
    setBusy(name);
    try {
      await fetch(`/api/admin/agents/${encodeURIComponent(name)}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: authToken },
        body: JSON.stringify({ enabled }),
      });
      setAgents((prev) => prev.map((a) => (a.name === name ? { ...a, enabled } : a)));
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(null); }
  }

  async function runNow(name: string) {
    setBusy(name);
    try {
      const r = await fetch(`/api/admin/agents/${encodeURIComponent(name)}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: authToken },
        body: JSON.stringify({}),
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error || `${r.status}`);
      await fetchAgents();
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(null); }
  }

  const byCategory = useMemo(() => {
    const m = new Map<string, Agent[]>();
    for (const a of agents) {
      const k = a.category || "other";
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(a);
    }
    return Array.from(m.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [agents]);

  if (loading) return <div className="text-white/60 py-8 text-center">Loading 35 agents…</div>;
  if (err) return <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 text-rose-300">Error: {err}</div>;

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Total agents" value={agents.length} />
        <Stat label="Enabled" value={agents.filter((a) => a.enabled).length} color="#22C55E" />
        <Stat label="Scheduled" value={agents.filter((a) => a.kind === "scheduled").length} color="#16C7FF" />
        <Stat label="On-demand / event" value={agents.filter((a) => a.kind !== "scheduled").length} color="#A78BFA" />
      </div>

      {/* Category groups */}
      {byCategory.map(([cat, items]) => (
        <div key={cat} className="rounded-xl border border-[#1E3556] bg-[#0C1A30] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#1E3556] flex items-center gap-2">
            <h3 className="text-[14px] font-extrabold uppercase tracking-[.14em] text-[#16C7FF]">{cat}</h3>
            <span className="text-[11px] text-white/50">· {items.length}</span>
          </div>
          <table className="w-full text-[14px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-[.12em] text-white/55 font-bold border-b border-[#1E3556]/60">
                <th className="px-4 py-2">Agent</th>
                <th>Kind</th>
                <th>Schedule</th>
                <th>Last run</th>
                <th>Status</th>
                <th className="text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.name} className="border-b border-[#1E3556]/40 hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <div className="font-bold text-white">{a.name.replace("agent-", "")}</div>
                    {a.description && <div className="text-[12px] text-white/55 max-w-xl">{a.description}</div>}
                  </td>
                  <td>
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                      a.kind === "scheduled" ? "text-[#16C7FF] bg-[#16C7FF]/10 border border-[#16C7FF]/30"
                      : a.kind === "on-demand" ? "text-[#A78BFA] bg-[#A78BFA]/10 border border-[#A78BFA]/30"
                      : "text-[#FBBF24] bg-[#FBBF24]/10 border border-[#FBBF24]/30"
                    }`}>{a.kind}</span>
                  </td>
                  <td className="font-mono text-[12px] text-white/70">{a.cron_expr || "—"}</td>
                  <td className="text-white/70 text-[12px]">{fmtRel(a.last_run_at)}</td>
                  <td>
                    {a.last_run ? (
                      <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase" style={{
                        color: STATUS_COLOR[a.last_run.status] || STATUS_COLOR.skipped,
                        background: STATUS_BG[a.last_run.status] || STATUS_BG.skipped,
                        border: `1px solid ${STATUS_COLOR[a.last_run.status] || STATUS_COLOR.skipped}55`,
                      }}>{a.last_run.status} · {fmtDur(a.last_run.duration_ms)}</span>
                    ) : (
                      <span className="text-white/40 text-[11px]">never run</span>
                    )}
                  </td>
                  <td className="text-right pr-4">
                    <div className="flex gap-2 justify-end items-center">
                      <button
                        onClick={() => toggle(a.name, !a.enabled)}
                        disabled={busy === a.name}
                        className={`text-[11px] font-bold px-3 py-1.5 rounded-full ${
                          a.enabled ? "text-emerald-300 bg-emerald-500/10 border border-emerald-500/30" : "text-white/55 bg-white/5 border border-white/15"
                        } disabled:opacity-50`}
                      >
                        {a.enabled ? "ON" : "OFF"}
                      </button>
                      <button
                        onClick={() => runNow(a.name)}
                        disabled={busy === a.name || !a.enabled}
                        className="text-[11px] font-bold px-3 py-1.5 rounded-full text-[#000000] disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg, #16C7FF, #16C7FF)" }}
                      >
                        {busy === a.name ? "…" : "Run now"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   ACTIVITY TAB
   ============================================================ */
function ActivityTab({ authToken }: { authToken: string }) {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAgent, setFilterAgent] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedRun, setSelectedRun] = useState<Run | null>(null);

  const fetchRuns = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (filterAgent) qs.set("agent", filterAgent);
      if (filterStatus) qs.set("status", filterStatus);
      qs.set("limit", "100");
      const r = await fetch(`/api/admin/agent-runs?${qs.toString()}`, { headers: { Authorization: authToken } });
      const body = await r.json();
      setRuns(body.runs || []);
    } catch {} finally { setLoading(false); }
  }, [authToken, filterAgent, filterStatus]);
  useEffect(() => { fetchRuns(); }, [fetchRuns]);

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <input
          placeholder="Filter by agent name (substring)…"
          value={filterAgent}
          onChange={(e) => setFilterAgent(e.target.value)}
          className="flex-1 min-w-[220px] bg-[#000000] border border-[#1E3556] rounded-lg px-3 py-2 text-[13px] text-white placeholder:text-white/40"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-[#000000] border border-[#1E3556] rounded-lg px-3 py-2 text-[13px] text-white"
        >
          <option value="">All statuses</option>
          <option value="ok">ok</option>
          <option value="partial">partial</option>
          <option value="error">error</option>
          <option value="skipped">skipped</option>
          <option value="running">running</option>
        </select>
        <button onClick={fetchRuns} className="px-4 py-2 rounded-lg text-[13px] font-bold text-white bg-white/5 border border-white/15 hover:bg-white/10">
          Refresh
        </button>
      </div>

      <div className="rounded-xl border border-[#1E3556] bg-[#0C1A30] overflow-hidden">
        <table className="w-full text-[14px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-[.12em] text-white/55 font-bold border-b border-[#1E3556]">
              <th className="px-4 py-2">Started</th>
              <th>Agent</th>
              <th>Status</th>
              <th>Duration</th>
              <th>Trigger</th>
              <th>Summary</th>
              <th className="pr-4">Logs</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} className="px-4 py-6 text-center text-white/55">Loading runs…</td></tr>}
            {!loading && runs.length === 0 && <tr><td colSpan={7} className="px-4 py-6 text-center text-white/55">No runs yet.</td></tr>}
            {runs.map((r) => (
              <tr key={r.id} className="border-b border-[#1E3556]/40 hover:bg-white/[0.02]">
                <td className="px-4 py-3 tabular-nums text-white/75">{new Date(r.started_at).toLocaleString()}</td>
                <td className="font-mono text-[12px] text-white">{r.agent_name.replace("agent-", "")}</td>
                <td>
                  <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase" style={{
                    color: STATUS_COLOR[r.status] || STATUS_COLOR.skipped,
                    background: STATUS_BG[r.status] || STATUS_BG.skipped,
                    border: `1px solid ${STATUS_COLOR[r.status] || STATUS_COLOR.skipped}55`,
                  }}>{r.status}</span>
                </td>
                <td className="tabular-nums text-white/70">{fmtDur(r.duration_ms)}</td>
                <td className="text-white/55 text-[12px]">{r.triggered_by || "—"}</td>
                <td className="text-white/75 max-w-[400px] truncate">{r.summary || "—"}</td>
                <td className="pr-4">
                  <button onClick={() => setSelectedRun(r)} className="text-[11px] font-bold text-[#16C7FF] hover:underline">
                    View →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedRun && <RunLogsModal run={selectedRun} onClose={() => setSelectedRun(null)} />}
    </div>
  );
}

function RunLogsModal({ run, onClose }: { run: Run; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 grid place-items-center p-4" onClick={onClose}>
      <div className="bg-[#0F1C32] rounded-2xl border border-[#1E3556] max-w-4xl w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[#1E3556]">
          <div>
            <div className="text-[11px] text-white/55 font-mono">{run.agent_name}</div>
            <h3 className="text-[18px] font-extrabold text-white">{new Date(run.started_at).toLocaleString()} · {run.status}</h3>
          </div>
          <button onClick={onClose} className="text-white/55 hover:text-white text-xl">×</button>
        </div>
        <div className="p-5 space-y-4">
          {run.summary && (
            <div>
              <div className="text-[11px] uppercase tracking-[.12em] font-bold text-white/55 mb-1">Summary</div>
              <div className="text-[14px] text-white">{run.summary}</div>
            </div>
          )}
          {run.error && (
            <div>
              <div className="text-[11px] uppercase tracking-[.12em] font-bold text-rose-300 mb-1">Error</div>
              <pre className="text-[12px] text-rose-200 font-mono whitespace-pre-wrap bg-rose-500/5 border border-rose-500/30 rounded-lg p-3">{run.error}</pre>
            </div>
          )}
          {run.log && (
            <div>
              <div className="text-[11px] uppercase tracking-[.12em] font-bold text-white/55 mb-1">Log</div>
              <pre className="text-[12px] text-white/75 font-mono whitespace-pre-wrap bg-black/40 border border-[#1E3556] rounded-lg p-3 max-h-[400px] overflow-y-auto">{run.log}</pre>
            </div>
          )}
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[#1E3556]">
            <Stat label="Duration" value={fmtDur(run.duration_ms)} small />
            <Stat label="Triggered by" value={run.triggered_by || "—"} small />
            <Stat label="Cost" value={`$${(run.cost_cents / 100).toFixed(4)}`} small />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   CARRIER PREFS TAB
   ============================================================ */
type Carrier = { id: string; name: string };
type Pref = { carrier_id: string; agent_name: string; enabled: boolean; cron_expr_override: string | null; notify_email: string | null; paused_until: string | null };

function CarrierPrefsTab({ authToken }: { authToken: string }) {
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [prefs, setPrefs] = useState<Pref[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingFor, setSavingFor] = useState<string | null>(null);

  // Pull all carriers via Supabase (using the same RLS-enforced session)
  useEffect(() => {
    (async () => {
      try {
        const { getSupabase } = await import("@/lib/supabase");
        const { data } = await getSupabase().from("compass_carriers").select("id,name").order("name");
        setCarriers((data as Carrier[]) || []);
      } catch {}
    })();
  }, []);

  // Pull agents once (for the union list)
  useEffect(() => {
    (async () => {
      const r = await fetch("/api/admin/agents", { headers: { Authorization: authToken } });
      const body = await r.json().catch(() => ({ agents: [] }));
      setAgents(body.agents || []);
    })();
  }, [authToken]);

  useEffect(() => {
    if (!selected) { setPrefs([]); return; }
    setLoading(true);
    (async () => {
      const r = await fetch(`/api/admin/carrier-agent-prefs?carrier_id=${encodeURIComponent(selected)}`, { headers: { Authorization: authToken } });
      const body = await r.json().catch(() => ({ prefs: [] }));
      setPrefs(body.prefs || []);
      setLoading(false);
    })();
  }, [selected, authToken]);

  async function savePref(agent: string, patch: Partial<Pref>) {
    if (!selected) return;
    setSavingFor(agent);
    const existing = prefs.find((p) => p.agent_name === agent) || { carrier_id: selected, agent_name: agent, enabled: true, cron_expr_override: null, notify_email: null, paused_until: null };
    const next = { ...existing, ...patch };
    try {
      await fetch("/api/admin/carrier-agent-prefs", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: authToken },
        body: JSON.stringify(next),
      });
      setPrefs((prev) => {
        const idx = prev.findIndex((p) => p.agent_name === agent);
        if (idx < 0) return [...prev, next];
        return prev.map((p, i) => (i === idx ? next : p));
      });
    } finally { setSavingFor(null); }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center flex-wrap">
        <label className="text-[12px] uppercase tracking-[.12em] font-bold text-white/55">Carrier</label>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="flex-1 min-w-[300px] bg-[#000000] border border-[#1E3556] rounded-lg px-3 py-2 text-[14px] text-white"
        >
          <option value="">Select a carrier to view per-tenant overrides…</option>
          {carriers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {!selected && (
        <div className="rounded-xl border border-[#1E3556] bg-[#0C1A30] p-8 text-center text-white/55">
          Pick a carrier to surface per-tenant agent preferences. Defaults apply when no override is set.
        </div>
      )}

      {selected && loading && <div className="text-center text-white/55 py-6">Loading prefs…</div>}

      {selected && !loading && (
        <div className="rounded-xl border border-[#1E3556] bg-[#0C1A30] overflow-hidden">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-[.12em] text-white/55 font-bold border-b border-[#1E3556]">
                <th className="px-4 py-2">Agent</th>
                <th>Override enabled</th>
                <th>Cron override</th>
                <th>Notify email</th>
                <th className="pr-4">Save</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((a) => {
                const p = prefs.find((x) => x.agent_name === a.name) || { carrier_id: selected, agent_name: a.name, enabled: true, cron_expr_override: null, notify_email: null, paused_until: null };
                return (
                  <tr key={a.name} className="border-b border-[#1E3556]/40">
                    <td className="px-4 py-2 font-mono text-[12px] text-white">{a.name.replace("agent-", "")}</td>
                    <td>
                      <input
                        type="checkbox"
                        checked={p.enabled}
                        onChange={(e) => savePref(a.name, { enabled: e.target.checked })}
                        className="accent-[#16C7FF]"
                      />
                    </td>
                    <td>
                      <input
                        defaultValue={p.cron_expr_override || ""}
                        placeholder={a.cron_expr || "n/a"}
                        onBlur={(e) => savePref(a.name, { cron_expr_override: e.target.value || null })}
                        className="bg-[#000000] border border-[#1E3556] rounded px-2 py-1 text-[12px] font-mono text-white w-32"
                      />
                    </td>
                    <td>
                      <input
                        defaultValue={p.notify_email || ""}
                        placeholder="(default)"
                        onBlur={(e) => savePref(a.name, { notify_email: e.target.value || null })}
                        className="bg-[#000000] border border-[#1E3556] rounded px-2 py-1 text-[12px] text-white w-48"
                      />
                    </td>
                    <td className="pr-4 text-[11px] text-white/55">
                      {savingFor === a.name ? "Saving…" : "auto-save on blur"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color, small }: { label: string; value: number | string; color?: string; small?: boolean }) {
  return (
    <div className={`rounded-xl border border-[#1E3556] bg-[#0C1A30] ${small ? "p-3" : "p-4"}`}>
      <div className="text-[10px] uppercase tracking-[.12em] font-bold text-white/55">{label}</div>
      <div className={`tabular-nums font-black ${small ? "text-[16px]" : "text-[26px]"}`} style={{ color: color || "#FFFFFF" }}>
        {value}
      </div>
    </div>
  );
}
