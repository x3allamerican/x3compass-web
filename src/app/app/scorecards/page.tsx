"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { SkeletonShell } from "@/components/Skeleton";
import { useUser } from "@/lib/useUser";

type Scorecard = {
  driver_id: string;
  name: string;
  tier: "A+" | "A" | "B+" | "B" | "C+" | "C" | "D";
  score: number;
  miles?: number;
  crashes: number;
  violations: number;
  hard_brakes: number;
  hos_clean_pct: number;
};

type ApiPayload = {
  ok: boolean;
  demo?: boolean;
  fleet?: { avg_score: number; a_tier_count: number; watchlist_count: number; pct_crash_24mo: number; total_drivers: number };
  scorecards?: Scorecard[];
  window_days?: number;
};

const DEMO_SCORECARDS: Scorecard[] = [
  { driver_id: "d1", name: "Margaret Rodriguez", tier: "A+", score: 98, miles: 24_800, crashes: 0, violations: 0, hard_brakes: 1, hos_clean_pct: 100 },
  { driver_id: "d2", name: "Anthony Green",      tier: "A",  score: 94, miles: 22_400, crashes: 0, violations: 1, hard_brakes: 3, hos_clean_pct:  98 },
  { driver_id: "d3", name: "Kevin Hernandez",    tier: "A",  score: 92, miles: 21_900, crashes: 0, violations: 1, hard_brakes: 2, hos_clean_pct:  97 },
  { driver_id: "d4", name: "Jerry Long",         tier: "B+", score: 87, miles: 19_200, crashes: 0, violations: 2, hard_brakes: 5, hos_clean_pct:  95 },
  { driver_id: "d5", name: "Eric Martinez",      tier: "B+", score: 86, miles: 18_750, crashes: 0, violations: 2, hard_brakes: 4, hos_clean_pct:  94 },
  { driver_id: "d6", name: "Joshua Lee",         tier: "B",  score: 78, miles: 17_800, crashes: 1, violations: 3, hard_brakes: 8, hos_clean_pct:  92 },
  { driver_id: "d7", name: "Ronald Watson",      tier: "C+", score: 71, miles: 15_400, crashes: 1, violations: 5, hard_brakes:11, hos_clean_pct:  88 },
  { driver_id: "d8", name: "Edward Alvarez",     tier: "C",  score: 65, miles: 14_200, crashes: 1, violations: 7, hard_brakes:14, hos_clean_pct:  84 },
  { driver_id: "d9", name: "Lawrence Sanchez",   tier: "C",  score: 62, miles: 13_900, crashes: 2, violations: 6, hard_brakes:15, hos_clean_pct:  82 },
];
const DEMO_FLEET = { avg_score: 82, a_tier_count: 3, watchlist_count: 0, pct_crash_24mo: 5.6, total_drivers: 9 };

// Theme-aware tier color tokens · bright in dark, readable in light, matching accidents/inspections palette
const TIER_STYLE: Record<string, string> = {
  "A+": "bg-emerald-100 dark:bg-emerald-500/45 text-emerald-900 dark:text-emerald-50 border-emerald-700 dark:border-emerald-300/80",
  "A":  "bg-emerald-100 dark:bg-emerald-500/45 text-emerald-900 dark:text-emerald-50 border-emerald-700 dark:border-emerald-300/80",
  "B+": "bg-cyan-100    dark:bg-cyan-500/45    text-cyan-900    dark:text-cyan-50    border-cyan-700    dark:border-cyan-300/80",
  "B":  "bg-cyan-100    dark:bg-cyan-500/45    text-cyan-900    dark:text-cyan-50    border-cyan-700    dark:border-cyan-300/80",
  "C+": "bg-amber-100   dark:bg-amber-500/45   text-amber-900   dark:text-amber-50   border-amber-700   dark:border-amber-300/80",
  "C":  "bg-amber-100   dark:bg-amber-500/45   text-amber-900   dark:text-amber-50   border-amber-700   dark:border-amber-300/80",
  "D":  "bg-rose-100    dark:bg-rose-500/45    text-rose-900    dark:text-rose-50    border-rose-700    dark:border-rose-300/80",
};

function Pill({ tier, size = "md" }: { tier: string; size?: "sm" | "md" }) {
  const sizing = size === "sm" ? "min-w-[60px] px-2 py-0.5 text-[10px]" : "min-w-[80px] px-3 py-1 text-[11px]";
  return (
    <span className={`inline-block ${sizing} rounded-full font-extrabold border whitespace-nowrap text-center tracking-wider uppercase ${TIER_STYLE[tier] || TIER_STYLE.D}`}>
      {tier}
    </span>
  );
}

function DefinitionsCard() {
  const items: { tier: string; range: string; meaning: string }[] = [
    { tier: "A+", range: "95-100", meaning: "Exceptional · zero crashes, zero violations, perfect HOS. Bonus-eligible." },
    { tier: "A",  range: "90-94",  meaning: "Strong · minor violations only, no OOS events, clean HOS." },
    { tier: "B+", range: "85-89",  meaning: "Good · a few violations or 1 non-preventable accident. No coaching needed." },
    { tier: "B",  range: "80-84",  meaning: "Acceptable · multiple violations or 1 preventable accident. Watch trend." },
    { tier: "C+", range: "70-79",  meaning: "Below standard · recurring violations or HOS issues. Coaching recommended." },
    { tier: "C",  range: "60-69",  meaning: "Concerning · pattern of violations + accidents. Mandatory coaching." },
    { tier: "D",  range: "0-59",   meaning: "High risk · preventable crashes or OOS-D events. Suspension review." },
  ];
  return (
    <div className="x3-card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[15px] font-extrabold text-[var(--fg)]">Tier definitions</div>
        <div className="text-[10px] tracking-[.14em] uppercase font-mono text-[var(--fg-muted)]">Composite over 90 days</div>
      </div>
      <div className="space-y-3">
        {items.map(it => (
          <div key={it.tier} className="grid grid-cols-[100px_70px_1fr] items-start gap-3">
            <div className="pt-0.5"><Pill tier={it.tier} /></div>
            <div className="text-[11px] font-mono text-[var(--fg-muted)] pt-1.5 tabular-nums">{it.range}</div>
            <div className="text-[12px] text-[var(--fg)] pt-0.5">{it.meaning}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-[var(--border)] text-[11px] text-[var(--fg-muted)]">
        <strong className="text-[var(--fg)]">Formula:</strong> 100 − 20×preventable_crashes (cap 60) − 2×violations (cap 30) − 15 if OOS-D − 10 if any HOS violation. Floor 0.
      </div>
    </div>
  );
}

export default function ScorecardsPage() {
  const { carrier, loading: userLoading } = useUser();
  const carrierId = carrier?.id;
  const [api, setApi] = useState<ApiPayload | null>(null);
  const [tierFilter, setTierFilter] = useState<string>("ALL");

  useEffect(() => {
    if (!carrierId) return;
    fetch(`/api/scorecards?carrier_id=${carrierId}`, { cache: "no-store" })
      .then(r => r.json())
      .then((b: ApiPayload) => setApi(b))
      .catch(() => setApi(null));
  }, [carrierId]);

  // Demo data is preview-only; a signed-in carrier sees real values / honest zeros.
  const allowDemo = !carrier;
  const ZERO_FLEET = { avg_score: 0, a_tier_count: 0, watchlist_count: 0, pct_crash_24mo: 0, total_drivers: 0 };
  const scorecards = useMemo(() => {
    const live = api?.scorecards;
    const data = live && live.length > 0 ? live : (allowDemo ? DEMO_SCORECARDS : []);
    return tierFilter === "ALL" ? data : data.filter(s => s.tier === tierFilter);
  }, [api, tierFilter, allowDemo]);

  const fleet = api?.fleet ? { ...(allowDemo ? DEMO_FLEET : ZERO_FLEET), ...api.fleet } : (allowDemo ? DEMO_FLEET : ZERO_FLEET);
  const isDemo = allowDemo && (!api?.scorecards || api.scorecards.length === 0);

  if (userLoading) {
    return <AppShell title="Safety Scorecards" crumbs="Drivers · Performance ranking"><div className="p-6"><SkeletonShell kpis={4} rows={6} /></div></AppShell>;
  }

  return (
    <AppShell title="Safety Scorecards" crumbs="Drivers · Performance ranking">
      <div className="px-6 py-6 space-y-6 bg-[var(--bg)] min-h-screen">

        {/* KPI cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="x3-card p-4">
            <div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)]">Fleet avg score</div>
            <div className="text-[28px] font-black text-[var(--fg)] tabular-nums">{fleet.avg_score}</div>
            <div className="text-[11px] text-[var(--fg-muted)]">{fleet.total_drivers} active drivers</div>
          </div>
          <div className="x3-card p-4">
            <div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)]">A-tier drivers</div>
            <div className="text-[28px] font-black text-emerald-600 dark:text-emerald-300 tabular-nums">{fleet.a_tier_count}</div>
            <div className="text-[11px] text-[var(--fg-muted)]">qualify for bonus</div>
          </div>
          <div className="x3-card p-4">
            <div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)]">Watchlist (D)</div>
            <div className={`text-[28px] font-black tabular-nums ${fleet.watchlist_count > 0 ? "text-rose-600 dark:text-rose-300" : "text-[var(--fg)]"}`}>{fleet.watchlist_count}</div>
            <div className="text-[11px] text-[var(--fg-muted)]">coaching required</div>
          </div>
          <div className="x3-card p-4">
            <div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)]">% w/ crash 24mo</div>
            <div className="text-[28px] font-black text-[var(--fg)] tabular-nums">{fleet.pct_crash_24mo}%</div>
            <div className="text-[11px] text-[var(--fg-muted)]">{fleet.pct_crash_24mo < 8 ? "below avg" : "above avg"}</div>
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)] mr-1">Filter:</div>
          {["ALL", "A+", "A", "B+", "B", "C+", "C", "D"].map(t => (
            <button
              key={t}
              onClick={() => setTierFilter(t)}
              className={`px-3 py-1 rounded-full text-[11px] font-extrabold border transition-colors ${
                tierFilter === t
                  ? "bg-[var(--accent)] text-[var(--bg)] border-[var(--accent)]"
                  : "bg-[var(--surface-2)] text-[var(--fg-muted)] border-[var(--border)] hover:text-[var(--fg)]"
              }`}
            >
              {t}
            </button>
          ))}
          {isDemo && (
            <span className="ml-auto text-[11px] text-amber-700 dark:text-amber-300 font-bold bg-amber-100 dark:bg-amber-500/20 border border-amber-500/40 rounded-full px-3 py-1">
              Demo data · seed inspections + HOS + accidents to see live scores
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">

          {/* Table */}
          <div className="x3-card overflow-hidden">
            <div className="px-5 py-3 border-b border-[var(--border)] flex items-center justify-between">
              <div className="text-[15px] font-extrabold text-[var(--fg)]">{scorecards.length} drivers · last 90 days</div>
              <div className="text-[11px] text-[var(--fg-muted)]">Composite: crashes · violations · HOS · telematics</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead className="bg-[var(--surface-2)] text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)]">
                  <tr>
                    <th className="text-left px-4 py-2 font-bold">Driver</th>
                    <th className="text-left px-4 py-2 font-bold">Tier</th>
                    <th className="text-right px-4 py-2 font-bold">Score</th>
                    <th className="text-right px-4 py-2 font-bold">Crashes</th>
                    <th className="text-right px-4 py-2 font-bold">Violations</th>
                    <th className="text-right px-4 py-2 font-bold">Hard brakes</th>
                    <th className="text-right px-4 py-2 font-bold">HOS clean</th>
                  </tr>
                </thead>
                <tbody>
                  {scorecards.map(s => (
                    <tr key={s.driver_id} className="border-t border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors">
                      <td className="px-4 py-2.5 text-[var(--fg)] font-semibold">{s.name}</td>
                      <td className="px-4 py-2.5"><Pill tier={s.tier} size="sm" /></td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-[var(--fg)] font-extrabold">{s.score}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-[var(--fg-muted)]">{s.crashes}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-[var(--fg-muted)]">{s.violations}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-[var(--fg-muted)]">{s.hard_brakes}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-[var(--fg-muted)]">{s.hos_clean_pct}%</td>
                    </tr>
                  ))}
                  {scorecards.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-[var(--fg-muted)] text-[12px]">No drivers in this tier.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Definitions */}
          <DefinitionsCard />
        </div>

      </div>
    </AppShell>
  );
}
