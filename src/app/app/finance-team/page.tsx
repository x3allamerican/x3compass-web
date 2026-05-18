"use client";

import AppShell from "@/components/AppShell";

/**
 * AI Finance Team — Sprint #20 UI (minimal first ship)
 * Will be enhanced once we confirm the route deploys cleanly.
 */
export default function FinanceTeamPage() {
  return (
    <AppShell title="AI Finance Team" crumbs="X3 Admin · Sprint #20">
      <div className="px-6 lg:px-10 py-6 max-w-[1400px] mx-auto">
        <div className="mb-6">
          <div className="text-[11px] uppercase tracking-[.15em] font-bold text-[var(--accent)]">X3 Admin · Sprint #20</div>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">AI Finance Team</h1>
          <p className="text-[14px] text-[var(--fg-muted)] mt-1 max-w-2xl">
            Five role-defined agents replacing QuickBooks + a bookkeeper. The backend is live; this dashboard surfaces what each agent is producing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { role: "FP&A Manager",        agent: "agent-fpa-manager",        schedule: "Mondays 07:00 UTC",        desc: "Forecasts MRR, tracks variance, builds the runway model" },
            { role: "Control Manager",     agent: "agent-control-manager",    schedule: "Daily 02:15 UTC",          desc: "Owns the books — reconciliation, period close, audit trail" },
            { role: "Reporting Manager",   agent: "agent-reporting-manager",  schedule: "Monthly on the 1st",       desc: "Generates P&L, Balance Sheet, Cash Flow + tax-ready exports" },
            { role: "Workflow Coordinator",agent: "agent-finance-workflow",   schedule: "Daily 03:00 UTC",          desc: "Orchestrates the other 4 agents and enforces the close calendar" },
            { role: "Revenue Manager",     agent: "agent-revenue-manager",    schedule: "Every 30 minutes",         desc: "Stripe sync · dunning v2 · trial conversion · churn signal" },
          ].map((p) => (
            <div key={p.agent} className="bg-[var(--bg-elev-1)] border border-[var(--border)] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 rounded-lg bg-[var(--accent)]/15 border border-[var(--accent)]/30 flex items-center justify-center text-lg">🤖</div>
                <div>
                  <div className="font-bold text-[14px]">{p.role}</div>
                  <div className="text-[11px] text-[var(--fg-muted)]">{p.schedule}</div>
                </div>
              </div>
              <p className="text-[12px] text-[var(--fg-muted)] mb-2 leading-snug">{p.desc}</p>
              <div className="text-[10px] font-mono text-[var(--fg-muted)] truncate">{p.agent}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-[var(--bg-elev-1)] border border-[var(--border)] rounded-xl p-5">
          <h2 className="font-bold text-[16px] mb-3">Status</h2>
          <p className="text-[13px] text-[var(--fg-muted)]">
            All 5 agents are live in production and firing on schedule. They write to <code>compass_journal_entries</code>,{" "}
            <code>compass_journal_lines</code>, and <code>compass_period_closes</code>. Full operational dashboard with per-pod live status, run logs, and Run-Now controls coming next.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
