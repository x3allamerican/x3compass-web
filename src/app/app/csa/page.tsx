"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { useUser } from "@/lib/useUser";
import { getSupabase } from "@/lib/supabase";

// FMCSA SMS intervention thresholds (general carrier rules)
const THRESHOLDS: Record<string, number> = {
  unsafe_driving:  65,
  crash_indicator: 65,
  hos_compliance:  65,
  vehicle_maint:   80,
  hazmat:          80,
  driver_fitness:  80,
  ctrl_substances: 80,
};

const LABELS: Record<string, { name: string; cfr: string; blurb: string }> = {
  unsafe_driving:  { name: "Unsafe Driving",                cfr: "49 CFR Parts 392, 397", blurb: "Speeding, reckless driving, improper lane change." },
  crash_indicator: { name: "Crash Indicator",               cfr: "—",                     blurb: "Frequency + severity of crashes. State-reported." },
  hos_compliance:  { name: "HOS Compliance",                cfr: "49 CFR Part 395",       blurb: "Log violations + driver fatigue." },
  vehicle_maint:   { name: "Vehicle Maintenance",           cfr: "49 CFR Parts 393, 396", blurb: "Mechanical defects from roadside inspections." },
  hazmat:          { name: "Hazmat Compliance",             cfr: "49 CFR Parts 171–180",  blurb: "Placarding, packaging, paperwork." },
  driver_fitness:  { name: "Driver Fitness",                cfr: "49 CFR Parts 383, 391", blurb: "Medical, CDL, training, qualification." },
  ctrl_substances: { name: "Controlled Substances / Alcohol", cfr: "49 CFR Part 382",      blurb: "Drug + alcohol use in operations." },
};

type Snapshot = {
  id: string;
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

function statusFor(msr: number | null, threshold: number): "ok" | "warn" | "alert" {
  if (msr == null) return "ok";
  const ratio = msr / threshold;
  if (ratio >= 1) return "alert";
  if (ratio >= 0.85) return "warn";
  return "ok";
}

export default function CSAPage() {
  const { carrier } = useUser();
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [history,  setHistory]  = useState<Snapshot[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!carrier?.id) return;
    getSupabase().from("compass_csa_snapshots")
      .select("*")
      .eq("carrier_id", carrier.id)
      .order("taken_at", { ascending: false })
      .limit(12)
      .then(({ data }) => {
        const rows = (data as Snapshot[] | null) || [];
        setSnapshot(rows[0] || null);
        setHistory(rows);
        setLoading(false);
      });
  }, [carrier]);

  return (
    <AppShell title="CSA Scores" crumbs="Compliance · BASIC measures">
      <div className="px-6 py-6 space-y-6 bg-[var(--bg)] min-h-screen">
        {/* Header card */}
        <div className="x3-card p-5 flex items-baseline justify-between flex-wrap gap-2">
          <div>
            <div className="text-[15px] font-extrabold text-[var(--fg)]">FMCSA CSA / SMS · BASIC percentile measures</div>
            <div className="text-[12px] text-[var(--fg-muted)]">
              All seven BASICs. Lower is better. {snapshot ? `Last snapshot: ${new Date(snapshot.taken_at).toLocaleDateString()} · source: ${snapshot.source}` : "No snapshot yet — agent-csa-baseline runs nightly."}
            </div>
          </div>
          <Link href="https://ai.fmcsa.dot.gov/SMS" target="_blank" rel="noopener" className="text-[12px] text-[var(--accent)] font-bold hover:underline">Open SMS →</Link>
        </div>

        {/* Empty state */}
        {!loading && !snapshot ? (
          <div className="x3-card p-8 text-center">
            <div className="text-[22px] font-extrabold text-[var(--fg)] mb-2">No CSA snapshot yet</div>
            <p className="text-[14px] text-[var(--fg-muted)] max-w-lg mx-auto mb-4">
              The <code className="text-[var(--accent)] font-mono text-[12px]">agent-csa-baseline</code> agent runs nightly and computes your BASIC measures from inspections, accidents, HOS logs, and Clearinghouse data. Once it runs for your account, your scores will appear here.
            </p>
            <Link href="/app/control-center" className="inline-block px-4 py-2 rounded-lg font-extrabold text-[13px] text-[var(--accent-fg)]" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>Run agent now →</Link>
          </div>
        ) : null}

        {/* BASIC tiles — real data */}
        {snapshot ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries(LABELS).map(([key, meta]) => {
              const msr = (snapshot as unknown as Record<string, number | null>)[key];
              const threshold = THRESHOLDS[key];
              const status = statusFor(msr, threshold);
              const tone = status === "alert" ? "var(--danger)" : status === "warn" ? "var(--warning)" : "var(--success)";
              return (
                <div key={key} className="x3-card p-5">
                  <div className="text-[11px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)] mb-2">{meta.name}</div>
                  <div className="text-[40px] font-black leading-none" style={{ color: tone }}>
                    {msr != null ? msr.toFixed(0) : "—"}
                  </div>
                  <div className="text-[11px] text-[var(--fg-muted)] mt-2">MSR percentile</div>
                  <div className="text-[11px] text-[var(--fg-muted)]">Threshold {threshold}%</div>
                  {msr != null ? (
                    <div className="h-1.5 rounded-full bg-[var(--surface-2)] mt-3 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(100, (msr / threshold) * 100)}%`, background: tone }} />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}

        {/* Recent history table */}
        {history.length > 1 ? (
          <div className="x3-card overflow-hidden">
            <div className="px-5 py-3 border-b border-[var(--border)] flex items-center justify-between">
              <div className="text-[13px] font-extrabold text-[var(--fg)]">Snapshot history</div>
              <div className="text-[11px] text-[var(--fg-muted)]">Last {history.length}</div>
            </div>
            <table className="w-full text-[12px]">
              <thead className="bg-[var(--surface-2)] text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)]">
                <tr>
                  <th className="text-left px-4 py-2 font-bold">Taken</th>
                  <th className="text-right px-2 py-2 font-bold">Unsafe</th>
                  <th className="text-right px-2 py-2 font-bold">Crash</th>
                  <th className="text-right px-2 py-2 font-bold">HOS</th>
                  <th className="text-right px-2 py-2 font-bold">Maint</th>
                  <th className="text-right px-2 py-2 font-bold">Hazmat</th>
                  <th className="text-right px-2 py-2 font-bold">Fitness</th>
                  <th className="text-right px-2 py-2 font-bold">Ctrl Sub</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className="border-t border-[var(--border)]">
                    <td className="px-4 py-2 text-[var(--fg-muted)] tabular-nums">{new Date(h.taken_at).toLocaleDateString()}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{h.unsafe_driving?.toFixed(0) ?? "—"}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{h.crash_indicator?.toFixed(0) ?? "—"}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{h.hos_compliance?.toFixed(0) ?? "—"}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{h.vehicle_maint?.toFixed(0) ?? "—"}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{h.hazmat?.toFixed(0) ?? "—"}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{h.driver_fitness?.toFixed(0) ?? "—"}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{h.ctrl_substances?.toFixed(0) ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {/* BASIC reference card */}
        <div className="x3-card p-5">
          <div className="text-[15px] font-extrabold text-[var(--fg)] mb-3">Why each BASIC matters</div>
          <ul className="text-[13px] text-[var(--fg-muted)] space-y-2 leading-relaxed">
            {Object.values(LABELS).map((m) => (
              <li key={m.name}><strong className="text-[var(--fg)]">{m.name}</strong> — {m.blurb} <span className="text-[11px] text-[var(--fg-faint)]">{m.cfr}</span></li>
            ))}
          </ul>
        </div>
      </div>
    </AppShell>
  );
}
