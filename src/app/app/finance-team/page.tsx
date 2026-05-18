"use client";

import { useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import AdminGuard from "@/components/AdminGuard";
import { useAgentState } from "@/lib/useAgentState";
import { AgentLogsModal, AgentRunNowModal, Toast } from "@/components/AdminModals";

/**
 * AI Finance Team — Sprint #20
 *
 * Five role-defined agents replacing QuickBooks + a human bookkeeper. Each
 * "pod" below corresponds to one agent in compass_agents. Clicking a pod
 * opens its run log; the Run-Now button forces an immediate execution.
 *
 *   FP&A Manager        ─┐
 *   Control Manager      │
 *   Reporting Manager   ─┼─ Workflow Coordinator (orchestrates)
 *   Revenue Manager     ─┘
 */

interface PodSpec {
  agent: string;       // matches compass_agents.name
  role: string;        // short title shown on the pod
  description: string; // what this agent does
  responsibilities: string[];
  schedule: string;
  position: "fpa" | "control" | "reporting" | "workflow" | "revenue";
}

const PODS: PodSpec[] = [
  {
    agent: "agent-fpa-manager",
    role: "FP&A Manager",
    description: "Forecasts MRR, tracks variance vs plan, builds the runway model",
    responsibilities: [
      "Weekly MRR snapshot + 3/6/12-month forecast",
      "Cohort retention analysis",
      "Unit economics + runway calculation",
      "Variance vs budget commentary",
    ],
    schedule: "Mondays 07:00 UTC",
    position: "fpa",
  },
  {
    agent: "agent-control-manager",
    role: "Control Manager",
    description: "Owns the books — reconciliation, period close, audit trail",
    responsibilities: [
      "Pull bank + credit-card transactions via Plaid",
      "Auto-match against journal entries by amount + date",
      "Verify journal balance integrity (debits = credits)",
      "Lock periods after close, flag anomalies",
    ],
    schedule: "Daily 02:15 UTC",
    position: "control",
  },
  {
    agent: "agent-reporting-manager",
    role: "Reporting Manager",
    description: "Generates P&L, Balance Sheet, Cash Flow + tax-ready exports",
    responsibilities: [
      "Monthly P&L from journal lines on the 1st",
      "Balance Sheet + Cash Flow Statement",
      "1099-NEC export at year-end",
      "Emails statement summary to Joshua",
    ],
    schedule: "Monthly on the 1st @ 06:00 UTC",
    position: "reporting",
  },
  {
    agent: "agent-finance-workflow",
    role: "Workflow Coordinator",
    description: "Orchestrates the other 4 agents and enforces the close calendar",
    responsibilities: [
      "Runs Revenue + Control daily",
      "Triggers Reporting on the 1st of every month",
      "Triggers FP&A every Monday",
      "Escalates errors to Joshua via email",
    ],
    schedule: "Daily 03:00 UTC",
    position: "workflow",
  },
  {
    agent: "agent-revenue-manager",
    role: "Revenue Manager",
    description: "Stripe sync, dunning, trial conversion, churn signal",
    responsibilities: [
      "Stripe charges → balanced journal entries (gross / fees / net)",
      "Dunning v2 sequence on failed charges (T+1/3/7/14)",
      "Trial conversion nudges (T-3/T-1/T0)",
      "Churn risk scoring per carrier",
    ],
    schedule: "Every 30 minutes",
    position: "revenue",
  },
];

function StatusDot({ result }: { result: string }) {
  const map: Record<string, string> = {
    ok:      "#10B981",
    partial: "#F59E0B",
    error:   "#EF4444",
    skipped: "#94A3B8",
    never:   "#E5E7EB",
  };
  return <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: map[result] || "#E5E7EB" }} />;
}

function StatusPill({ result }: { result: string }) {
  const map: Record<string, string> = {
    ok:      "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    partial: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    error:   "bg-red-500/15 text-red-300 border-red-500/30",
    skipped: "bg-slate-500/15 text-slate-300 border-slate-500/30",
    never:   "bg-slate-500/10 text-slate-400 border-slate-500/20",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${map[result] || map.never}`}>
      {result === "never" ? "not run yet" : result}
    </span>
  );
}

function Pod({ pod, agent, onLogs, onRun }: {
  pod: PodSpec;
  agent: { last_run: string; result: string; enabled: boolean } | null;
  onLogs: () => void;
  onRun: () => void;
}) {
  const result = agent?.result || "never";
  const lastRun = agent?.last_run || "never";

  return (
    <div className="bg-[var(--bg-elev-1)] border border-[var(--border)] rounded-xl p-4 transition-shadow hover:shadow-lg">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-[var(--accent)]/15 border border-[var(--accent)]/30 flex items-center justify-center flex-shrink-0">
            <span className="text-lg">🤖</span>
          </div>
          <div className="min-w-0">
            <div className="font-bold text-[14px] leading-tight truncate">{pod.role}</div>
            <div className="text-[11px] text-[var(--fg-muted)] truncate">{pod.schedule}</div>
          </div>
        </div>
        <StatusPill result={result} />
      </div>

      <p className="text-[12px] text-[var(--fg-muted)] mb-3 leading-snug">{pod.description}</p>

      <ul className="text-[11px] text-[var(--fg)] space-y-1 mb-3">
        {pod.responsibilities.map((r) => (
          <li key={r} className="flex gap-1.5 items-start">
            <span className="text-[var(--accent)] mt-[2px] flex-shrink-0">▸</span>
            <span className="leading-snug">{r}</span>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
        <div className="flex items-center gap-1.5 text-[11px] text-[var(--fg-muted)]">
          <StatusDot result={result} />
          <span className="tabular-nums">last: {lastRun}</span>
        </div>
        <div className="flex gap-1">
          <button onClick={onLogs} className="px-2 py-1 text-[11px] rounded border border-[var(--border)] hover:bg-[var(--bg-elev-2)]">Logs</button>
          <button onClick={onRun} className="px-2 py-1 text-[11px] rounded bg-[var(--accent)] text-black font-medium">Run now</button>
        </div>
      </div>
    </div>
  );
}

export default function FinanceTeamPage() {
  const { scheduledAgents, runAgentNow } = useAgentState();
  const [logsFor, setLogsFor] = useState<string | null>(null);
  const [runFor, setRunFor] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Index scheduled agents by name for fast lookup
  const byName = useMemo(() => {
    const m: Record<string, { last_run: string; result: string; enabled: boolean }> = {};
    for (const a of scheduledAgents) m[a.name] = a;
    return m;
  }, [scheduledAgents]);

  const handleRun = async (agent: string) => {
    setRunFor(null);
    try {
      await runAgentNow(agent);
      setToast(`${agent} queued`);
    } catch (e) {
      setToast(`Failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  // Calculate team-level health
  const teamHealth = useMemo(() => {
    const found = PODS.map((p) => byName[p.agent]).filter(Boolean);
    const okCount = found.filter((a) => a.result === "ok").length;
    const errCount = found.filter((a) => a.result === "error").length;
    const status = errCount > 0 ? "needs attention" : okCount === PODS.length ? "all green" : found.length === 0 ? "not run yet" : "partial";
    return { okCount, errCount, total: PODS.length, status };
  }, [byName]);

  return (
    <AppShell>
      <AdminGuard>
        <div className="px-6 lg:px-10 py-6 max-w-[1400px] mx-auto">
          {/* Header */}
          <div className="flex items-end justify-between flex-wrap gap-3 mb-6">
            <div>
              <div className="text-[11px] uppercase tracking-[.15em] font-bold text-[var(--accent)]">X3 Admin · Sprint #20</div>
              <h1 className="text-3xl font-extrabold tracking-tight mt-1">AI Finance Team</h1>
              <p className="text-[14px] text-[var(--fg-muted)] mt-1 max-w-2xl">
                Five role-defined agents replacing QuickBooks + a bookkeeper. They own the chart of accounts, the double-entry journal, the bank reconciliation, and the monthly close — and they all coordinate through the Workflow Manager.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[11px] uppercase tracking-wider text-[var(--fg-muted)]">Team Status</div>
                <div className="font-bold text-[15px]">{teamHealth.okCount}/{teamHealth.total} green</div>
              </div>
              <div className={`w-3 h-3 rounded-full ${teamHealth.errCount > 0 ? "bg-red-500" : teamHealth.okCount === teamHealth.total ? "bg-emerald-500" : "bg-amber-500"}`} />
            </div>
          </div>

          {/* Pod grid — 5 pods arranged in a hub-and-spoke around the Workflow Coordinator */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
            {/* Top row: FP&A | (gap) | Control */}
            <Pod pod={PODS[0]} agent={byName[PODS[0].agent]} onLogs={() => setLogsFor(PODS[0].agent)} onRun={() => setRunFor(PODS[0].agent)} />
            <div className="hidden lg:flex items-center justify-center">
              <div className="text-center">
                <div className="text-[10px] uppercase tracking-[.15em] text-[var(--fg-muted)] mb-2">Orchestrated by</div>
                <div className="w-16 h-16 mx-auto rounded-full bg-[var(--accent)]/20 border-2 border-[var(--accent)] flex items-center justify-center mb-2">
                  <span className="text-2xl">⚙️</span>
                </div>
              </div>
            </div>
            <Pod pod={PODS[1]} agent={byName[PODS[1].agent]} onLogs={() => setLogsFor(PODS[1].agent)} onRun={() => setRunFor(PODS[1].agent)} />

            {/* Middle row: Reporting | Workflow Coordinator | Revenue */}
            <Pod pod={PODS[2]} agent={byName[PODS[2].agent]} onLogs={() => setLogsFor(PODS[2].agent)} onRun={() => setRunFor(PODS[2].agent)} />
            <Pod pod={PODS[3]} agent={byName[PODS[3].agent]} onLogs={() => setLogsFor(PODS[3].agent)} onRun={() => setRunFor(PODS[3].agent)} />
            <Pod pod={PODS[4]} agent={byName[PODS[4].agent]} onLogs={() => setLogsFor(PODS[4].agent)} onRun={() => setRunFor(PODS[4].agent)} />
          </div>

          {/* What the team produces */}
          <div className="bg-[var(--bg-elev-1)] border border-[var(--border)] rounded-xl p-5 mb-6">
            <h2 className="font-bold text-[16px] mb-3">What this team produces</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[13px]">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[var(--fg-muted)] mb-1">Daily</div>
                <ul className="space-y-1">
                  <li>• Bank reconciliation</li>
                  <li>• Stripe sync to journal</li>
                  <li>• Anomaly flags</li>
                </ul>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[var(--fg-muted)] mb-1">Weekly</div>
                <ul className="space-y-1">
                  <li>• MRR forecast</li>
                  <li>• Cohort retention</li>
                  <li>• Variance vs plan</li>
                </ul>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[var(--fg-muted)] mb-1">Monthly</div>
                <ul className="space-y-1">
                  <li>• Profit &amp; Loss</li>
                  <li>• Balance Sheet</li>
                  <li>• Cash Flow Statement</li>
                  <li>• Period close lock</li>
                </ul>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[var(--fg-muted)] mb-1">Year-end</div>
                <ul className="space-y-1">
                  <li>• 1099-NEC export</li>
                  <li>• Tax-prep packet for CPA</li>
                  <li>• Depreciation schedule</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Replaces what */}
          <div className="bg-[var(--bg-elev-1)] border border-[var(--border)] rounded-xl p-5">
            <h2 className="font-bold text-[16px] mb-3">What this replaces</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[13px]">
              <div className="border border-[var(--border)] rounded p-3">
                <div className="font-bold text-[12px] mb-1">QuickBooks Online</div>
                <div className="text-[var(--fg-muted)] text-[11px]">$60/mo + setup time. Compass owns the chart of accounts and journal directly.</div>
              </div>
              <div className="border border-[var(--border)] rounded p-3">
                <div className="font-bold text-[12px] mb-1">Monthly bookkeeper (Bench / Pilot)</div>
                <div className="text-[var(--fg-muted)] text-[11px]">$249–499/mo. The Control Manager handles reconciliation; Reporting Manager closes the books.</div>
              </div>
              <div className="border border-[var(--border)] rounded p-3">
                <div className="font-bold text-[12px] mb-1">FP&amp;A spreadsheet sprawl</div>
                <div className="text-[var(--fg-muted)] text-[11px]">FP&amp;A Manager runs MRR forecast + cohort + variance from live data, no manual Excel.</div>
              </div>
            </div>
            <p className="text-[12px] text-[var(--fg-muted)] mt-4">
              <strong>What still needs a human:</strong> a tax CPA at year-end to file federal/state returns from the tax-ready packet the team produces.
            </p>
          </div>
        </div>

        {/* Modals */}
        <AgentLogsModal open={!!logsFor} agentName={logsFor || ""} onClose={() => setLogsFor(null)} />
        <AgentRunNowModal open={!!runFor} agentName={runFor || ""} onClose={() => setRunFor(null)} onConfirm={() => runFor && handleRun(runFor)} />
        {toast ? <Toast message={toast} onDismiss={() => setToast(null)} /> : null}
      </AdminGuard>
    </AppShell>
  );
}
