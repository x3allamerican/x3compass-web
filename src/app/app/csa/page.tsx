"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { getSupabase } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";
import { buildCsaScorecards } from "@/lib/csaScorecards.mjs";

type Snapshot = {
  taken_at: string;
  unsafe_driving: number | null;
  crash_indicator: number | null;
  hos_compliance: number | null;
  vehicle_maint: number | null;
  hazmat: number | null;
  driver_fitness: number | null;
  ctrl_substances: number | null;
  source: string;
};

type Card = ReturnType<typeof buildCsaScorecards>[number];

const STATE = {
  alert: { label: "At intervention threshold", color: "#F87171", bg: "rgba(248,113,113,.10)" },
  watch: { label: "Watch", color: "#FBBF24", bg: "rgba(251,191,36,.10)" },
  below: { label: "Below threshold", color: "#4ADE80", bg: "rgba(74,222,128,.08)" },
  unknown: { label: "Not reported", color: "#94A3B8", bg: "rgba(148,163,184,.08)" },
} as const;

function Trend({ card }: { card: Card }) {
  if (card.history.length < 2) return <span className="text-[11px] text-[var(--fg-faint)]">Trend needs 2 snapshots</span>;
  return (
    <div className="flex items-end gap-1 h-10" aria-label={`${card.label} history: ${card.history.join(", ")}`}>
      {card.history.slice(-12).map((value: number, index: number) => (
        <span key={`${value}-${index}`} className="w-2 rounded-sm bg-[var(--accent)]/60" style={{ height: `${Math.max(3, value * .36)}px` }} title={`${value.toFixed(1)} percentile`} />
      ))}
    </div>
  );
}

function BasicCard({ card }: { card: Card }) {
  const tone = STATE[card.state as keyof typeof STATE];
  return (
    <article className="rounded-2xl border border-[var(--border)] p-5" style={{ background: tone.bg }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-extrabold text-[15px] text-[var(--fg)]">{card.label}</h2>
          <div className="mt-1 text-[11px] font-bold" style={{ color: tone.color }}>{tone.label}</div>
        </div>
        <div className="text-right">
          <div className="text-[28px] leading-none font-black tabular-nums text-[var(--fg)]">{card.value == null ? "—" : card.value.toFixed(1)}</div>
          <div className="text-[10px] text-[var(--fg-faint)] mt-1">threshold {card.threshold}</div>
        </div>
      </div>
      <div className="relative h-2 rounded-full bg-black/30 mt-5 overflow-hidden" aria-hidden>
        <div className="h-full rounded-full" style={{ width: `${card.value ?? 0}%`, background: tone.color }} />
        <div className="absolute inset-y-0 w-px bg-white" style={{ left: `${card.threshold}%` }} />
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <Trend card={card} />
        <span className="text-[11px] font-bold whitespace-nowrap" style={{ color: card.direction === "worsening" ? "#F87171" : card.direction === "improving" ? "#4ADE80" : "var(--fg-faint)" }}>
          {card.delta == null ? "No comparison" : `${card.delta > 0 ? "+" : ""}${card.delta.toFixed(1)} · ${card.direction}`}
        </span>
      </div>
    </article>
  );
}

export default function CsaScoresPage() {
  const { carrier } = useUser();
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!carrier) return;
    let current = true;
    (async () => {
      setLoading(true); setError(null);
      const { data: { session } } = await getSupabase().auth.getSession();
      if (!session?.access_token) { if (current) { setError("Your session could not be verified."); setLoading(false); } return; }
      try {
        const response = await fetch("/api/csa/snapshots", { headers: { Authorization: `Bearer ${session.access_token}` } });
        const data = await response.json() as { ok?: boolean; snapshots?: Snapshot[] };
        if (!response.ok || !data.ok) throw new Error("CSA snapshots are temporarily unavailable.");
        if (current) setSnapshots(data.snapshots || []);
      } catch (requestError) {
        if (current) setError(requestError instanceof Error ? requestError.message : "CSA snapshots are temporarily unavailable.");
      } finally { if (current) setLoading(false); }
    })();
    return () => { current = false; };
  }, [carrier]);

  const cards = useMemo(() => buildCsaScorecards(snapshots), [snapshots]);
  const latest = snapshots[0];

  return (
    <AppShell title="CSA Scorecards" crumbs="FMCSA SMS · 7 BASIC percentiles · decision support">
      <div className="p-6 space-y-6 max-w-[1500px] mx-auto">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-[19px] font-black text-[var(--fg)]">{carrier?.name || "Your fleet"} · CSA trend</h1>
            <p className="text-[12px] text-[var(--fg-muted)] mt-1">Percentiles indicate relative safety performance. Higher is worse. Review source SMS data before making a compliance or employment decision.</p>
          </div>
          {latest && <div className="text-right text-[11px] text-[var(--fg-faint)]"><div>Latest snapshot</div><div className="font-bold text-[var(--fg)]">{new Date(latest.taken_at).toLocaleDateString()}</div><div>{latest.source}</div></div>}
        </section>

        {loading ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-10 text-center text-[13px] text-[var(--fg-muted)]">Loading carrier CSA snapshots…</div>
        ) : error ? (
          <div role="alert" className="rounded-2xl border border-red-500/40 bg-red-500/10 p-6 text-[13px] text-red-200">{error}</div>
        ) : cards.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-12 text-center">
            <div className="text-[17px] font-extrabold text-[var(--fg)]">No CSA snapshots yet</div>
            <p className="mt-2 text-[13px] text-[var(--fg-muted)]">CSA data populates once your USDOT is monitored. Until the first snapshot arrives, X3 Compass will not estimate or fabricate percentiles.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {cards.map((card: Card) => <BasicCard key={card.key} card={card} />)}
          </div>
        )}

        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-[12px] text-[var(--fg-muted)]">
          <strong className="text-[var(--fg)]">Threshold note:</strong> this view uses the platform's established 65th-percentile thresholds for Unsafe Driving, Crash Indicator, and HOS Compliance, and 80th-percentile thresholds for Vehicle Maintenance, Hazardous Materials, Driver Fitness, and Controlled Substances. Carrier type and FMCSA program rules can change intervention treatment; this screen is decision support, not an FMCSA determination.
        </section>
      </div>
    </AppShell>
  );
}
