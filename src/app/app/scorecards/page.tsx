"use client";
import AppShell from "@/components/AppShell";

const SCORECARDS = [
  { name: "Margaret Rodriguez", tier: "A+", score: 98, miles: 24_800, crashes: 0, violations: 0, hard_brakes: 1, hos_clean_pct: 100 },
  { name: "Anthony Green",       tier: "A",  score: 94, miles: 22_400, crashes: 0, violations: 1, hard_brakes: 3, hos_clean_pct:  98 },
  { name: "Kevin Hernandez",     tier: "A",  score: 92, miles: 21_900, crashes: 0, violations: 1, hard_brakes: 2, hos_clean_pct:  97 },
  { name: "Jerry Long",          tier: "B+", score: 87, miles: 19_200, crashes: 0, violations: 2, hard_brakes: 5, hos_clean_pct:  95 },
  { name: "Eric Martinez",       tier: "B+", score: 86, miles: 18_750, crashes: 0, violations: 2, hard_brakes: 4, hos_clean_pct:  94 },
  { name: "Joshua Lee",          tier: "B",  score: 78, miles: 17_800, crashes: 1, violations: 3, hard_brakes: 8, hos_clean_pct:  92 },
  { name: "Ronald Watson",       tier: "C+", score: 71, miles: 15_400, crashes: 1, violations: 5, hard_brakes:11, hos_clean_pct:  88 },
  { name: "Edward Alvarez",      tier: "C",  score: 65, miles: 14_200, crashes: 1, violations: 7, hard_brakes:14, hos_clean_pct:  84 },
  { name: "Lawrence Sanchez",    tier: "C",  score: 62, miles: 13_900, crashes: 2, violations: 6, hard_brakes:15, hos_clean_pct:  82 },
];
const TIER_COLOR: Record<string, string> = { "A+": "var(--success)", "A": "var(--success)", "B+": "var(--accent)", "B": "var(--accent)", "C+": "var(--warning)", "C": "var(--warning)", "D": "var(--danger)" };

export default function ScorecardsPage() {
  return (
    <AppShell title="Safety Scorecards" crumbs="Drivers · Performance ranking">
      <div className="px-6 py-6 space-y-6 bg-[var(--bg)] min-h-screen">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="x3-card p-4"><div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)]">Fleet avg score</div><div className="text-[28px] font-black text-[var(--fg)]">82</div><div className="text-[11px] text-[var(--success)] font-semibold">↑ 3 vs last month</div></div>
          <div className="x3-card p-4"><div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)]">A-tier drivers</div><div className="text-[28px] font-black text-[var(--success)]">3</div><div className="text-[11px] text-[var(--fg-muted)]">qualify for bonus</div></div>
          <div className="x3-card p-4"><div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)]">Watchlist (D/F)</div><div className="text-[28px] font-black text-[var(--danger)]">0</div><div className="text-[11px] text-[var(--fg-muted)]">coaching required</div></div>
          <div className="x3-card p-4"><div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)]">% with crash 24mo</div><div className="text-[28px] font-black text-[var(--fg)]">5.6%</div><div className="text-[11px] text-[var(--fg-muted)]">below avg</div></div>
        </div>
        <div className="x3-card overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--border)] flex items-center justify-between">
            <div className="text-[15px] font-extrabold text-[var(--fg)]">Top 9 drivers · last 90 days</div>
            <div className="text-[11px] text-[var(--fg-muted)]">Composite: crashes · violations · HOS · telematics</div>
          </div>
          <table className="w-full text-[13px]">
            <thead className="bg-[var(--surface-2)] text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)]">
              <tr><th className="text-left px-4 py-2 font-bold">Driver</th><th className="text-left px-4 py-2 font-bold">Tier</th><th className="text-right px-4 py-2 font-bold">Score</th><th className="text-right px-4 py-2 font-bold">Miles</th><th className="text-right px-4 py-2 font-bold">Crashes</th><th className="text-right px-4 py-2 font-bold">Violations</th><th className="text-right px-4 py-2 font-bold">Hard brakes</th><th className="text-right px-4 py-2 font-bold">HOS clean</th></tr>
            </thead>
            <tbody>{SCORECARDS.map((s, i) => (
              <tr key={i} className="border-t border-[var(--border)]">
                <td className="px-4 py-2.5 text-[var(--fg)] font-semibold">{s.name}</td>
                <td className="px-4 py-2.5"><span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold" style={{ background: `${TIER_COLOR[s.tier]}22`, color: TIER_COLOR[s.tier] }}>{s.tier}</span></td>
                <td className="px-4 py-2.5 text-right tabular-nums text-[var(--fg)] font-bold">{s.score}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-[var(--fg-muted)]">{s.miles.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-[var(--fg-muted)]">{s.crashes}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-[var(--fg-muted)]">{s.violations}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-[var(--fg-muted)]">{s.hard_brakes}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-[var(--fg-muted)]">{s.hos_clean_pct}%</td>
              </tr>))}</tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
