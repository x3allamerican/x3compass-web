"use client";
import { useEffect, useState, useCallback } from "react";
import { SCHEDULED_AGENTS, ONDEMAND_AGENTS, ACTIVITY_LOG, type ScheduledAgent, type OnDemandAgent, type ActivityRow, ADMIN_KPIS, CARRIER_PREFS, type CarrierPref } from "./demoData";
import { getSupabase } from "./supabase";

const LS_AGENTS_KEY    = "x3-agent-state-v2";   // bumped to v2 — API-backed now
const LS_PREFS_KEY     = "x3-carrier-prefs-v2";
const LS_ACTIVITY_KEY  = "x3-activity-log-v2";

type DbAgent = { name: string; cadence: string | null; enabled: boolean; last_run_at: string | null; last_result: string };
type DbRun   = { agent_name: string; started_at: string; duration_ms: number | null; status: string; summary: string | null };
type DbPref  = { dot_number: string; carrier_name: string; mode: string; send_hour: string; monthly: boolean; reg: boolean; qbr: boolean; expiry: boolean; csa: boolean; ifta: boolean; inspect: boolean };

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
}
function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

async function getAuthHeader(): Promise<HeadersInit> {
  try {
    const supa = getSupabase();
    const { data } = await supa.auth.getSession();
    const tok = data.session?.access_token;
    return tok ? { Authorization: `Bearer ${tok}` } : {};
  } catch { return {}; }
}

function fmtRelative(iso: string | null): string {
  if (!iso) return "Never";
  const d = new Date(iso); const diff = Date.now() - d.getTime();
  if (diff < 60_000)     return "just now";
  if (diff < 3_600_000)  return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 30 * 86_400_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return d.toLocaleDateString();
}

export function useAgentState() {
  const [agentsByName, setAgentsByName] = useState<Record<string, DbAgent>>({});
  const [carrierPrefs, setCarrierPrefs] = useState<CarrierPref[]>(CARRIER_PREFS);
  const [activity, setActivity]         = useState<ActivityRow[]>(ACTIVITY_LOG);
  const [hydrated, setHydrated]         = useState(false);
  const [usingApi, setUsingApi]         = useState(false);
  const [lastError, setLastError]       = useState<string | null>(null);

  // Initial hydration: try API first, fall back to localStorage cache, fall back to demo data
  useEffect(() => {
    (async () => {
      // 1. quick paint from local cache
      const cachedAgents   = read<Record<string, DbAgent>>(LS_AGENTS_KEY, {});
      const cachedPrefs    = read<CarrierPref[]>(LS_PREFS_KEY, CARRIER_PREFS);
      const cachedActivity = read<ActivityRow[]>(LS_ACTIVITY_KEY, ACTIVITY_LOG);
      if (Object.keys(cachedAgents).length) setAgentsByName(cachedAgents);
      setCarrierPrefs(cachedPrefs);
      setActivity(cachedActivity);

      // 2. try API
      try {
        const h = await getAuthHeader();
        const [aRes, pRes] = await Promise.all([
          fetch("/api/admin/agents",        { headers: h }),
          fetch("/api/admin/carrier-prefs", { headers: h }),
        ]);
        if (aRes.ok) {
          const j = await aRes.json() as { agents: DbAgent[] };
          const m: Record<string, DbAgent> = {};
          for (const a of j.agents) m[a.name] = a;
          setAgentsByName(m);
          write(LS_AGENTS_KEY, m);
          setUsingApi(true);
        }
        if (pRes.ok) {
          const j = await pRes.json() as { prefs: DbPref[] };
          // map db rows back to the demoData shape
          const mapped: CarrierPref[] = j.prefs.map((r) => ({ name: r.carrier_name, dot: r.dot_number, mode: r.mode as "Realtime" | "Digest", send_hour: r.send_hour, monthly: r.monthly, reg: r.reg, qbr: r.qbr, expiry: r.expiry, csa: r.csa, ifta: r.ifta, inspect: r.inspect }));
          if (mapped.length > 0) { setCarrierPrefs(mapped); write(LS_PREFS_KEY, mapped); }
        }
      } catch (e) {
        setLastError(e instanceof Error ? e.message : String(e));
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  // Merge DB state with demoData for any agents not yet in DB
  const scheduledAgents: ScheduledAgent[] = SCHEDULED_AGENTS.map((base) => {
    const db = agentsByName[base.name];
    if (!db) return base;
    return { ...base, enabled: db.enabled, cadence: db.cadence ?? base.cadence, last_run: fmtRelative(db.last_run_at), result: (db.last_result || base.result) as ScheduledAgent["result"] };
  });
  const onDemandAgents: OnDemandAgent[] = ONDEMAND_AGENTS.map((base) => {
    const db = agentsByName[base.name];
    if (!db) return base;
    return { ...base, enabled: db.enabled, last_run: fmtRelative(db.last_run_at), result: (db.last_result || base.result) as OnDemandAgent["result"] };
  });

  const runs24h = ADMIN_KPIS.runs_24h + activity.filter((a) => a.summary?.includes("Manual run")).length;
  const runsOk  = ADMIN_KPIS.runs_ok  + activity.filter((a) => a.status === "ok" && a.summary?.includes("Manual run")).length;
  const runsErr = ADMIN_KPIS.runs_err + activity.filter((a) => a.status === "error" && a.summary?.includes("Manual run")).length;

  // ---------- mutators ----------
  const toggleAgent = useCallback(async (name: string, enabled: boolean) => {
    setAgentsByName((prev) => {
      const next = { ...prev, [name]: { ...(prev[name] || { name, cadence: null, last_run_at: null, last_result: "never" }), enabled } };
      write(LS_AGENTS_KEY, next); return next;
    });
    try {
      const h = await getAuthHeader();
      await fetch(`/api/admin/agents/${encodeURIComponent(name)}`, { method: "PATCH", headers: { ...h, "Content-Type": "application/json" }, body: JSON.stringify({ enabled }) });
    } catch (e) { setLastError(e instanceof Error ? e.message : String(e)); }
  }, []);

  const editAgent = useCallback(async (name: string, cadence: string) => {
    setAgentsByName((prev) => {
      const next = { ...prev, [name]: { ...(prev[name] || { name, enabled: true, last_run_at: null, last_result: "never" }), cadence } };
      write(LS_AGENTS_KEY, next); return next;
    });
    try {
      const h = await getAuthHeader();
      await fetch(`/api/admin/agents/${encodeURIComponent(name)}`, { method: "PATCH", headers: { ...h, "Content-Type": "application/json" }, body: JSON.stringify({ cadence }) });
    } catch (e) { setLastError(e instanceof Error ? e.message : String(e)); }
  }, []);

  const runAgentNow = useCallback(async (name: string) => {
    const now = new Date();
    const optimisticRow: ActivityRow = { when: `${now.toLocaleDateString("en-US")}, ${now.toLocaleTimeString("en-US")}`, agent: name, status: "ok", duration: "...", summary: "Manual run by Joshua. Firing…" };
    setActivity((prev) => { const next = [optimisticRow, ...prev].slice(0, 200); write(LS_ACTIVITY_KEY, next); return next; });

    try {
      const h = await getAuthHeader();
      const r = await fetch(`/api/admin/agents/${encodeURIComponent(name)}/run`, { method: "POST", headers: { ...h, "Content-Type": "application/json" } });
      const j = await r.json() as { ok: boolean; status?: string; summary?: string; duration_ms?: number; error?: string };
      if (!j.ok) throw new Error(j.error || "Run failed");
      // replace optimistic row with real result
      setActivity((prev) => {
        const next = prev.map((row, i) => i === 0 ? { ...row, status: (j.status as ActivityRow["status"]) || "ok", duration: ((j.duration_ms || 0) / 1000).toFixed(1) + "s", summary: j.summary || row.summary } : row);
        write(LS_ACTIVITY_KEY, next); return next;
      });
      // bump last_run_at locally so the agent table updates instantly
      setAgentsByName((prev) => { const next = { ...prev, [name]: { ...(prev[name] || { name, enabled: true, cadence: null }), last_run_at: now.toISOString(), last_result: (j.status as DbAgent["last_result"]) || "ok" } }; write(LS_AGENTS_KEY, next); return next; });
    } catch (e) {
      setLastError(e instanceof Error ? e.message : String(e));
      setActivity((prev) => prev.map((row, i) => i === 0 ? { ...row, status: "error", duration: "0.0s", summary: `Manual run failed — ${e instanceof Error ? e.message : String(e)}` } : row));
    }
  }, []);

  const updateCarrierPref = useCallback(async (dot: string, patch: Partial<CarrierPref>) => {
    setCarrierPrefs((prev) => { const next = prev.map((c) => c.dot === dot ? { ...c, ...patch } : c); write(LS_PREFS_KEY, next); return next; });
    try {
      const h = await getAuthHeader();
      await fetch(`/api/admin/carrier-prefs?dot=${encodeURIComponent(dot)}`, { method: "PATCH", headers: { ...h, "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    } catch (e) { setLastError(e instanceof Error ? e.message : String(e)); }
  }, []);

  const resetEverything = useCallback(() => {
    setAgentsByName({}); setCarrierPrefs(CARRIER_PREFS); setActivity(ACTIVITY_LOG);
    if (typeof window !== "undefined") {
      localStorage.removeItem(LS_AGENTS_KEY); localStorage.removeItem(LS_PREFS_KEY); localStorage.removeItem(LS_ACTIVITY_KEY);
    }
  }, []);

  return { scheduledAgents, onDemandAgents, carrierPrefs, activity, runs24h, runsOk, runsErr, toggleAgent, editAgent, runAgentNow, updateCarrierPref, resetEverything, hydrated, usingApi, lastError };
}
