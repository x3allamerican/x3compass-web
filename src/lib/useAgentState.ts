"use client";
import { useEffect, useState, useCallback } from "react";
import { SCHEDULED_AGENTS, ONDEMAND_AGENTS, ACTIVITY_LOG, type ScheduledAgent, type OnDemandAgent, type ActivityRow, ADMIN_KPIS, CARRIER_PREFS, type CarrierPref } from "./demoData";

const LS_AGENTS_KEY = "x3-agent-state-v1";
const LS_PREFS_KEY  = "x3-carrier-prefs-v1";
const LS_ACTIVITY_KEY = "x3-activity-log-v1";

type AgentOverride = { enabled?: boolean; cadence?: string; last_run?: string; result?: string };
type AgentStateMap = Record<string, AgentOverride>;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
}
function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export function useAgentState() {
  const [overrides, setOverrides] = useState<AgentStateMap>({});
  const [carrierPrefs, setCarrierPrefs] = useState<CarrierPref[]>(CARRIER_PREFS);
  const [extraActivity, setExtraActivity] = useState<ActivityRow[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setOverrides(read<AgentStateMap>(LS_AGENTS_KEY, {}));
    setCarrierPrefs(read<CarrierPref[]>(LS_PREFS_KEY, CARRIER_PREFS));
    setExtraActivity(read<ActivityRow[]>(LS_ACTIVITY_KEY, []));
    setHydrated(true);
  }, []);

  // Persist on change
  useEffect(() => { if (hydrated) write(LS_AGENTS_KEY, overrides); }, [overrides, hydrated]);
  useEffect(() => { if (hydrated) write(LS_PREFS_KEY, carrierPrefs); }, [carrierPrefs, hydrated]);
  useEffect(() => { if (hydrated) write(LS_ACTIVITY_KEY, extraActivity.slice(0, 50)); }, [extraActivity, hydrated]);

  // Merge overrides into base agent lists
  const scheduledAgents = SCHEDULED_AGENTS.map((a) => ({ ...a, ...overrides[a.name] })) as ScheduledAgent[];
  const onDemandAgents  = ONDEMAND_AGENTS.map((a)  => ({ ...a, ...overrides[a.name] })) as OnDemandAgent[];

  // Merged activity log: extra (most recent runs) + baseline demo log
  const activity = [...extraActivity, ...ACTIVITY_LOG].slice(0, 200);

  // Derived KPI tile counters
  const runs24h = ADMIN_KPIS.runs_24h + extraActivity.length;
  const runsOk  = ADMIN_KPIS.runs_ok  + extraActivity.filter((a) => a.status === "ok").length;
  const runsErr = ADMIN_KPIS.runs_err + extraActivity.filter((a) => a.status === "error").length;

  const toggleAgent = useCallback((name: string, enabled: boolean) => {
    setOverrides((prev) => ({ ...prev, [name]: { ...(prev[name] || {}), enabled } }));
  }, []);

  const editAgent = useCallback((name: string, cadence: string) => {
    setOverrides((prev) => ({ ...prev, [name]: { ...(prev[name] || {}), cadence } }));
  }, []);

  const runAgentNow = useCallback((name: string, simulatedResult: "ok" | "skipped" | "error" = "ok", summary?: string) => {
    const now = new Date();
    const ts = `${now.toLocaleDateString("en-US")}, ${now.toLocaleTimeString("en-US")}`;
    const row: ActivityRow = {
      when: ts,
      agent: name,
      status: simulatedResult,
      duration: (Math.random() * 3 + 0.5).toFixed(1) + "s",
      summary: summary || (simulatedResult === "ok" ? `Manual run by Joshua. Ran cleanly.` : simulatedResult === "skipped" ? "Manual run. Nothing to process." : "Manual run failed — see logs."),
    };
    setExtraActivity((prev) => [row, ...prev].slice(0, 50));
    setOverrides((prev) => ({ ...prev, [name]: { ...(prev[name] || {}), last_run: "just now", result: simulatedResult === "skipped" ? "skipped" : simulatedResult } }));
    return row;
  }, []);

  const updateCarrierPref = useCallback((dot: string, patch: Partial<CarrierPref>) => {
    setCarrierPrefs((prev) => prev.map((c) => (c.dot === dot ? { ...c, ...patch } : c)));
  }, []);

  const resetEverything = useCallback(() => {
    setOverrides({}); setExtraActivity([]); setCarrierPrefs(CARRIER_PREFS);
    if (typeof window !== "undefined") {
      localStorage.removeItem(LS_AGENTS_KEY); localStorage.removeItem(LS_PREFS_KEY); localStorage.removeItem(LS_ACTIVITY_KEY);
    }
  }, []);

  return { scheduledAgents, onDemandAgents, carrierPrefs, activity, runs24h, runsOk, runsErr, toggleAgent, editAgent, runAgentNow, updateCarrierPref, resetEverything, hydrated };
}
