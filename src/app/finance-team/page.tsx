"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { X3AdminHero, X3KPITile } from "@/components/X3AdminHero";
import { useIsSuperAdmin } from "@/lib/superAdmin";
import { getSupabase } from "@/lib/supabase";

// ---------------- Types ----------------
type AgentDef = {
  role: string;
  agent: string;
  schedule: string;
  desc: string;
  icon: string;
  status: "live" | "proposed";
  outputs: string[];
  rationale?: string; // why we added it (for PROPOSED only)
};

type LastRun = { status: string; started_at: string; duration_ms: number | null; summary: string | null };
type Health  = { success: number; failed: number; running: number; total: number };

// ---------------- The 9 agents ----------------
const AGENTS: AgentDef[] = [
  // ── 5 LIVE (Sprint #16-20) ──────────────────────────────────────────────
  {
    role: "FP&A Manager", agent: "agent-fpa-manager", schedule: "Mondays 07:00 UTC", icon: "📊",
    desc: "Forecasts MRR, tracks variance vs plan, builds the runway model.",
    outputs: ["MRR forecast", "Variance to plan", "Runway months"],
    status: "live",
  },
  {
    role: "Control Manager", agent: "agent-control-manager", schedule: "Daily 02:15 UTC", icon: "📒",
    desc: "Owns the books · reconciliation, period close, audit trail.",
    outputs: ["Reconciliation report", "Journal entries", "Period close"],
    status: "live",
  },
  {
    role: "Reporting Manager", agent: "agent-reporting-manager", schedule: "Monthly on the 1st", icon: "📈",
    desc: "Generates P&L, Balance Sheet, Cash Flow + tax-ready exports.",
    outputs: ["P&L statement", "Balance sheet", "Cash flow statement"],
    status: "live",
  },
  {
    role: "Workflow Coordinator", agent: "agent-finance-workflow", schedule: "Daily 03:00 UTC", icon: "🎯",
    desc: "Orchestrates the other agents and enforces the close calendar.",
    outputs: ["Daily close checklist", "Agent dispatch", "Calendar enforcement"],
    status: "live",
  },
  {
    role: "Revenue Manager", agent: "agent-revenue-manager", schedule: "Every 30 minutes", icon: "💰",
    desc: "Stripe sync · dunning v2 · trial conversion · churn signal.",
    outputs: ["Stripe sync delta", "Dunning queue", "Trial→paid conversion"],
    status: "live",
  },

  // ── 4 PROPOSED (Sprint #21+) · reasons specific to X3's business ────────
  {
    role: "Partner Settlement Manager", agent: "agent-partner-settlement", schedule: "Monthly on the 5th", icon: "🤝",
    desc: "Computes monthly 30% rev-share per partner, generates payout report, queues Stripe payouts.",
    outputs: ["Partner payout report", "Per-partner ledger", "Queued Stripe transfers"],
    status: "proposed",
    rationale: "Your Reseller Agreement promises monthly partner payouts but nobody calculates them today. Without this, you either pay manually (error-prone) or partners aren't paid (legal breach).",
  },
  {
    role: "AP Manager", agent: "agent-ap-manager", schedule: "Daily 04:00 UTC", icon: "📥",
    desc: "Ingests vendor invoices (Anthropic, Cloudflare, Supabase, Twilio, Resend, Checkr), reconciles paid vs unpaid, flags overdue.",
    outputs: ["Vendor invoice queue", "Paid/unpaid reconciliation", "Overdue alerts"],
    status: "proposed",
    rationale: "Currently lumped into Control Manager but AP is its own discipline: vendor portals, statement reconciliation, dispute handling. With 6+ recurring SaaS vendors plus Checkr pass-throughs, manual AP doesn't scale.",
  },
  {
    role: "Tax Manager", agent: "agent-tax-manager", schedule: "Quarterly + monthly", icon: "🧾",
    desc: "Computes estimated tax payments, tracks 1099-NEC candidates, alerts before Q1/Q2/Q3/Q4 deadlines, hands off to CPA.",
    outputs: ["Quarterly est tax calc", "1099-NEC candidate list", "Deadline alerts", "CPA handoff packet"],
    status: "proposed",
    rationale: "Reporting Manager generates tax-ready exports but doesn't actively manage tax obligations. Missing a quarterly estimated payment = IRS penalty. 1099-NEC issuance has a January 31 deadline · needs an agent watching this.",
  },
  {
    role: "Pricing & Margin Manager", agent: "agent-pricing-margin", schedule: "Weekly Sundays", icon: "⚖️",
    desc: "Watches per-tier unit economics. Flags carriers whose tier doesn't cover their COGS. Recommends pricing changes.",
    outputs: ["Per-tier margin report", "Money-losing carrier list", "Quarterly pricing recommendation"],
    status: "proposed",
    rationale: "A low-driver-count carrier burning $40 of Claude API is bleeding you. Anthropic + Twilio + Resend prices drift over time. Without an agent watching per-carrier COGS vs plan price, unit economics quietly invert.",
  },
];

// ---------------- Theme-aware pills ----------------
const STATUS_PILL: Record<string, string> = {
  live:     "bg-emerald-100 dark:bg-emerald-500/45 text-emerald-900 dark:text-emerald-50 border-emerald-700 dark:border-emerald-300/80",
  proposed: "bg-violet-100  dark:bg-violet-500/45  text-violet-900  dark:text-violet-50  border-violet-700  dark:border-violet-300/80",
};
function StatusBadge({ status }: { status: "live" | "proposed" }) {
  const label = status === "live" ? "LIVE" : "PROPOSED";
  return (
    <span className={`inline-block min-w-[80px] px-2 py-0.5 rounded-full text-[10px] font-extrabold border whitespace-nowrap text-center tracking-wider uppercase ${STATUS_PILL[status]}`}>
      {label}
    </span>
  );
}

const RUN_PILL: Record<string, string> = {
  succeeded: "bg-emerald-100 dark:bg-emerald-500/45 text-emerald-900 dark:text-emerald-50 border-emerald-700 dark:border-emerald-300/80",
  success:   "bg-emerald-100 dark:bg-emerald-500/45 text-emerald-900 dark:text-emerald-50 border-emerald-700 dark:border-emerald-300/80",
  ok:        "bg-emerald-100 dark:bg-emerald-500/45 text-emerald-900 dark:text-emerald-50 border-emerald-700 dark:border-emerald-300/80",
  running:   "bg-cyan-100    dark:bg-cyan-500/45    text-cyan-900    dark:text-cyan-50    border-cyan-700    dark:border-cyan-300/80",
  started:   "bg-cyan-100    dark:bg-cyan-500/45    text-cyan-900    dark:text-cyan-50    border-cyan-700    dark:border-cyan-300/80",
  failed:    "bg-rose-100    dark:bg-rose-500/45    text-rose-900    dark:text-rose-50    border-rose-700    dark:border-rose-300/80",
  error:     "bg-rose-100    dark:bg-rose-500/45    text-rose-900    dark:text-rose-50    border-rose-700    dark:border-rose-300/80",
};
function RunStatusPill({ status }: { status: string }) {
  const cls = RUN_PILL[status.toLowerCase()] || RUN_PILL.failed;
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold border whitespace-nowrap text-center tracking-wider uppercase ${cls}`}>
      {status.toUpperCase()}
    </span>
  );
}

// ---------------- Helpers ----------------
function relTime(iso: string | null): string {
  if (!iso) return "never";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000)    return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}
function fmtDuration(ms: number | null): string {
  if (!ms || ms <= 0) return "—";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60_000)}m ${Math.floor((ms % 60_000) / 1000)}s`;
}

// ---------------- Page ----------------
export default function FinanceTeamPage() {
  const isSuperAdmin = useIsSuperAdmin();
  const [lastRun, setLastRun] = useState<Record<string, LastRun>>({});
  const [health,  setHealth]  = useState<Record<string, Health>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Pull most-recent run per LIVE agent + 30-day health directly from Supabase
        // (avoids the GitHub-suspension blocker on Pages Function deploys)
        const sb = getSupabase();
        const liveNames = AGENTS.filter(a => a.status === "live").map(a => a.agent);
        const { data: runs } = await sb.from("compass_agent_runs")
          .select("agent_name,status,started_at,duration_ms,summary")
          .in("agent_name", liveNames)
          .order("started_at", { ascending: false })
          .limit(200);
        const byAgent: Record<string, LastRun> = {};
        const healthByAgent: Record<string, Health> = {};
        for (const a of liveNames) healthByAgent[a] = { success: 0, failed: 0, running: 0, total: 0 };
        const cutoff = Date.now() - 30 * 86_400_000;
        for (const r of (runs as Array<{ agent_name: string; status: string; started_at: string; duration_ms: number | null; summary: string | null }> || [])) {
          if (!byAgent[r.agent_name]) byAgent[r.agent_name] = { status: r.status, started_at: r.started_at, duration_ms: r.duration_ms, summary: r.summary };
          if (new Date(r.started_at).getTime() >= cutoff) {
            const h = healthByAgent[r.agent_name];
            if (!h) continue;
            h.total++;
            const s = r.status.toLowerCase();
            if (s === "succeeded" || s === "success" || s === "ok") h.success++;
            else if (s === "failed" || s === "error") h.failed++;
            else if (s === "running" || s === "started") h.running++;
          }
        }
        setLastRun(byAgent); setHealth(healthByAgent);
      } catch { /* no-op · page works with empty state */ }
      finally { setLoading(false); }
    })();
  }, []);

  if (!isSuperAdmin) {
    return (
      <AppShell title="AI Finance Team">
        <div className="p-10 max-w-md mx-auto text-center bg-[var(--bg)] min-h-screen">
          <div className="text-5xl mb-3">🔒</div>
          <h1 className="text-2xl font-bold mb-2 text-[var(--fg)]">Restricted</h1>
          <p className="text-[var(--fg-muted)] mb-4">This page is for X3 super-admins only.</p>
          <Link href="/" className="text-[var(--accent)] hover:underline font-bold">← Back to dashboard</Link>
        </div>
      </AppShell>
    );
  }

  const live = AGENTS.filter(a => a.status === "live");
  const proposed = AGENTS.filter(a => a.status === "proposed");
  const totalRuns30d = Object.values(health).reduce((s, h) => s + h.total, 0);
  const failed30d    = Object.values(health).reduce((s, h) => s + h.failed, 0);
  const successRate  = totalRuns30d > 0 ? Math.round(((totalRuns30d - failed30d) / totalRuns30d) * 100) : null;

  return (
    <AppShell title="AI Finance Team" crumbs="X3 Admin · 9-agent virtual CFO">
      <div className="px-6 py-6 space-y-6 bg-[var(--bg)] min-h-screen">

        <X3AdminHero
          eyebrow="AI Finance Team"
          title={<>The 9-agent virtual CFO. <span className="text-amber-700 dark:text-amber-400">Replaces QuickBooks + a bookkeeper.</span></>}
          intro={<>
            5 agents are live in production today. <strong className="text-white">4 more are proposed</strong> to cover gaps specific to X3&apos;s actual business: Reseller 30% rev-share, vendor AP, active tax management, and per-tier unit-economics. Together they form a real virtual finance department · not a chatbot wrapper.
          </>}
          dataSource={{
            items: [
              <span key="ft1"><strong className="text-[var(--fg)]">Agent runs</strong> log to <code className="font-mono text-[var(--accent)]">compass_agent_runs</code> with started_at, duration_ms, status, summary. This page shows last-run + 30-day health per agent.</span>,
              <span key="ft2"><strong className="text-[var(--fg)]">Outputs</strong> land in <code className="font-mono text-[var(--accent)]">compass_journal_entries</code> + <code className="font-mono text-[var(--accent)]">compass_journal_lines</code> (double-entry) · see <Link href="/finance" className="text-[var(--accent)] underline">/finance</Link> for the ledger.</span>,
              <span key="ft3"><strong className="text-[var(--fg)]">Why 9 not 5?</strong> Vanilla SaaS finance has 5 surface areas. X3 has 3 more: <em>Reseller payouts</em>, <em>vendor AP</em> (you spend $X/mo across 6+ SaaS vendors), and <em>active tax management</em> (1099-NEC, quarterly est).</span>,
              <span key="ft4"><strong className="text-[var(--fg)]">Pricing &amp; Margin Manager</strong> is the unique safety net · flags any carrier whose Claude API spend exceeds their tier revenue. Without it, unit economics quietly invert.</span>,
            ],
          }}
        />

        {/* KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <X3KPITile label="Live agents"        value={live.length}                         sub="firing on schedule"                                tone="green" />
          <X3KPITile label="Proposed"           value={proposed.length}                     sub="approve to implement"                              tone="navy" />
          <X3KPITile label="Runs (last 30 days)"value={totalRuns30d}                        sub={loading ? "loading…" : "across all live agents"}   tone="navy" />
          <X3KPITile label="Success rate"       value={successRate != null ? `${successRate}%` : "—"} sub={`${failed30d} failures · 30 days`}        tone={successRate != null && successRate >= 95 ? "green" : (successRate != null && successRate < 90 ? "red" : "navy")} />
        </div>

        {/* LIVE AGENTS */}
        <section>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="text-[16px] font-extrabold text-[var(--fg)]">✅ Live agents <span className="text-[12px] font-normal text-[var(--fg-muted)]">— in production today</span></h2>
            <Link href="/control-center" className="text-[12px] text-[var(--accent)] hover:underline font-bold">Control Center →</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {live.map(a => {
              const lr = lastRun[a.agent];
              const h = health[a.agent];
              return (
                <div key={a.agent} className="x3-card p-4 hover:border-[var(--accent)]/40 transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-700/40 dark:border-emerald-300/40 flex items-center justify-center text-[16px] shrink-0">{a.icon}</div>
                      <div className="min-w-0">
                        <div className="font-extrabold text-[14px] text-[var(--fg)] truncate">{a.role}</div>
                        <div className="text-[10px] text-[var(--fg-muted)] font-mono">{a.schedule}</div>
                      </div>
                    </div>
                    <StatusBadge status="live" />
                  </div>
                  <p className="text-[12px] text-[var(--fg-muted)] mb-3 leading-relaxed">{a.desc}</p>
                  <div className="space-y-1 mb-3">
                    {a.outputs.map(o => (
                      <div key={o} className="text-[10px] text-[var(--fg-muted)] flex items-center gap-1.5"><span className="text-[var(--accent)]">▸</span>{o}</div>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between gap-2 flex-wrap">
                    <div className="text-[10px] text-[var(--fg-muted)] font-mono">{a.agent}</div>
                    <div className="flex items-center gap-2">
                      {lr ? (
                        <>
                          <RunStatusPill status={lr.status} />
                          <span className="text-[10px] text-[var(--fg-muted)]">{relTime(lr.started_at)} · {fmtDuration(lr.duration_ms)}</span>
                        </>
                      ) : (
                        <span className="text-[10px] text-[var(--fg-faint)]">{loading ? "loading…" : "no runs yet"}</span>
                      )}
                    </div>
                  </div>
                  {h && h.total > 0 && (
                    <div className="mt-2 text-[10px] text-[var(--fg-muted)]">
                      30d: <span className="text-emerald-700 dark:text-emerald-300 font-bold">{h.success}✓</span> · {h.failed > 0 && <span className="text-rose-700 dark:text-rose-300 font-bold">{h.failed}✗ · </span>}{h.total} total
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* PROPOSED AGENTS */}
        <section>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="text-[16px] font-extrabold text-[var(--fg)]">💡 Proposed additions <span className="text-[12px] font-normal text-[var(--fg-muted)]">— specific to X3&apos;s business surface</span></h2>
            <div className="text-[11px] text-[var(--fg-muted)]">Approve to implement in the next batch</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {proposed.map(a => (
              <div key={a.agent} className="x3-card p-5 border-violet-700/40 dark:border-violet-300/40">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-500/20 border border-violet-700/40 dark:border-violet-300/40 flex items-center justify-center text-[18px] shrink-0">{a.icon}</div>
                    <div className="min-w-0">
                      <div className="font-extrabold text-[15px] text-[var(--fg)]">{a.role}</div>
                      <div className="text-[10px] text-[var(--fg-muted)] font-mono">{a.schedule}</div>
                    </div>
                  </div>
                  <StatusBadge status="proposed" />
                </div>
                <p className="text-[13px] text-[var(--fg)] mb-3 leading-relaxed">{a.desc}</p>
                {a.rationale && (
                  <div className="rounded-lg bg-amber-100 dark:bg-amber-500/15 border border-amber-700/40 dark:border-amber-300/40 px-3 py-2 mb-3">
                    <div className="text-[10px] font-extrabold text-amber-800 dark:text-amber-200 uppercase tracking-wider mb-1">Why X3 needs this</div>
                    <p className="text-[12px] text-amber-900 dark:text-amber-100 leading-snug">{a.rationale}</p>
                  </div>
                )}
                <div>
                  <div className="text-[10px] uppercase tracking-wider font-bold text-[var(--fg-muted)] mb-1.5">Outputs</div>
                  <div className="space-y-1">
                    {a.outputs.map(o => (
                      <div key={o} className="text-[11px] text-[var(--fg)] flex items-center gap-1.5"><span className="text-[var(--accent)]">▸</span>{o}</div>
                    ))}
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-[var(--border)] text-[10px] text-[var(--fg-muted)] font-mono">{a.agent}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Architecture explainer */}
        <div className="x3-card p-5">
          <h2 className="text-[15px] font-extrabold text-[var(--fg)] mb-2">🏛️ Architecture</h2>
          <p className="text-[12px] text-[var(--fg-muted)] leading-relaxed mb-3">
            Each agent runs on a scheduled GitHub Action that calls an Anthropic-backed Pages Function. Runs log to <code className="font-mono text-[var(--accent)]">compass_agent_runs</code>. Outputs (journal entries, reports, alerts) write to the appropriate <code className="font-mono">compass_*</code> table. Workflow Coordinator (#4) is the brain of the brain · it dispatches the others and enforces the close calendar.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
            <div className="rounded-lg bg-[var(--surface-2)] p-3">
              <div className="font-bold text-[var(--fg)] mb-1">📊 Source of truth</div>
              <div className="text-[var(--fg-muted)]"><code className="font-mono">compass_journal_entries</code> + <code className="font-mono">compass_journal_lines</code> · double-entry ledger, validates debits = credits before insert.</div>
            </div>
            <div className="rounded-lg bg-[var(--surface-2)] p-3">
              <div className="font-bold text-[var(--fg)] mb-1">📒 Chart of accounts</div>
              <div className="text-[var(--fg-muted)]">40+ accounts pre-loaded matching Schedule C / 1040 lines for end-of-year tax handoff.</div>
            </div>
            <div className="rounded-lg bg-[var(--surface-2)] p-3">
              <div className="font-bold text-[var(--fg)] mb-1">🤖 Telemetry</div>
              <div className="text-[var(--fg-muted)]"><code className="font-mono">compass_usage_events</code> tracks per-carrier Claude/Twilio/Resend token spend → feeds Pricing &amp; Margin Manager once approved.</div>
            </div>
          </div>
        </div>

      </div>
    </AppShell>
  );
}
