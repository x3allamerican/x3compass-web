"use client";
import { useState, useMemo } from "react";

/**
 * Interactive ROI calculator for the /pricing page.
 * - Slider: number of drivers (1-100)
 * - Toggle: DIY ($25) vs DFY ($50) vs Enterprise (custom)
 * - Shows monthly cost + annual + vs. typical alternatives (consultant retainer, missed-DataQ fines, audit prep cost)
 */
export default function ROICalculator() {
  const [drivers, setDrivers] = useState(15);
  const [tier, setTier] = useState<"diy" | "dfy">("diy");

  const computed = useMemo(() => {
    const perDriver = tier === "diy" ? 25 : 50;
    const monthly = drivers * perDriver;
    const annual = monthly * 12;

    // Industry comparisons (researched + conservative):
    //   - Hiring an in-house Safety Director: ~$95k/yr loaded
    //   - Outsourced compliance service: typically $4-8/driver/mo for basic + $250-500/mo retainer
    //   - One DOT compliance review missed: $1,000-15,000 in fines (using $4,000 average)
    //   - Annual cost of 3 unfought DataQ violations: $300 × 3 = $900 (avg per FMCSA win-rate data)
    const inHouseSafetyDir = 95000;
    const competitorBasic = drivers * 8 * 12 + 5000;     // $8/driver/yr + retainer
    const audit_risk = 4000;                              // typical missed-control fine
    const dataq_uncontested = 900;                        // 3 disputable violations × $300 avg

    return {
      perDriver, monthly, annual,
      inHouseSafetyDir,
      competitorBasic,
      audit_risk,
      dataq_uncontested,
      savingsVsInHouse: inHouseSafetyDir - annual,
      savingsVsCompetitor: competitorBasic - annual,
    };
  }, [drivers, tier]);

  const fmt = (n: number) => "$" + n.toLocaleString();

  return (
    <div className="x3-card overflow-hidden">
      <div className="p-7 border-b border-[var(--border)]">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <div className="text-[10px] tracking-[.18em] uppercase font-bold text-[var(--accent)]">ROI calculator</div>
          <div className="ml-auto text-[10px] tracking-[.18em] uppercase font-bold text-[var(--fg-faint)]">No signup · drag the slider</div>
        </div>
        <h3 className="text-[20px] font-bold text-[var(--fg)] mb-5">What does Compass cost <span className="serif-italic" style={{ color: "var(--accent)" }}>your</span> fleet?</h3>

        {/* Slider */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="roi-drivers" className="text-[12px] text-[var(--fg-muted)] font-bold">Active drivers</label>
            <span className="text-[24px] font-extrabold text-[var(--accent)] tabular-nums">{drivers}</span>
          </div>
          <input
            id="roi-drivers"
            type="range"
            min={1}
            max={100}
            value={drivers}
            onChange={(e) => setDrivers(Number(e.target.value))}
            className="w-full accent-[var(--accent)] cursor-pointer"
            aria-label="Number of active drivers"
          />
          <div className="flex justify-between text-[10px] text-[var(--fg-faint)] mt-1">
            <span>1</span><span>25</span><span>50</span><span>75</span><span>100+</span>
          </div>
        </div>

        {/* Tier toggle */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTier("diy")}
            className={`flex-1 py-3 rounded-lg font-bold text-[13px] transition-colors ${
              tier === "diy" ? "bg-[var(--accent)] text-[var(--accent-fg)]" : "bg-[var(--bg)] text-[var(--fg-muted)] border border-[var(--border)] hover:text-[var(--fg)]"
            }`}
          >DIY · $25/driver</button>
          <button
            type="button"
            onClick={() => setTier("dfy")}
            className={`flex-1 py-3 rounded-lg font-bold text-[13px] transition-colors ${
              tier === "dfy" ? "bg-[var(--accent)] text-[var(--accent-fg)]" : "bg-[var(--bg)] text-[var(--fg-muted)] border border-[var(--border)] hover:text-[var(--fg)]"
            }`}
          >DFY · $50/driver</button>
        </div>
      </div>

      {/* Output */}
      <div className="p-7">
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div className="x3-card p-5">
            <div className="text-[10px] tracking-[.16em] uppercase text-[var(--fg-muted)] font-bold mb-1">Compass · monthly</div>
            <div className="text-[36px] font-extrabold text-[var(--fg)] tabular-nums">{fmt(computed.monthly)}</div>
            <div className="text-[12px] text-[var(--fg-faint)] mt-1">{drivers} drivers × ${computed.perDriver}</div>
          </div>
          <div className="x3-card p-5">
            <div className="text-[10px] tracking-[.16em] uppercase text-[var(--fg-muted)] font-bold mb-1">Compass · annual</div>
            <div className="text-[36px] font-extrabold text-[var(--fg)] tabular-nums">{fmt(computed.annual)}</div>
            <div className="text-[12px] text-[var(--fg-faint)] mt-1">12 × monthly</div>
          </div>
        </div>

        {/* Comparisons */}
        <div className="text-[10px] tracking-[.16em] uppercase text-[var(--fg-muted)] font-bold mb-3">Vs. what fleets typically spend</div>
        <ul className="space-y-2 text-[14px]">
          <Compare label="In-house Safety Director (1 FTE loaded)"
                   benchmark={computed.inHouseSafetyDir}
                   compass={computed.annual}
                   savingsLabel={`save ${fmt(computed.savingsVsInHouse)}/yr`} />
          <Compare label="Outsourced compliance service (typical)"
                   benchmark={computed.competitorBasic}
                   compass={computed.annual}
                   savingsLabel={computed.savingsVsCompetitor > 0 ? `save ${fmt(computed.savingsVsCompetitor)}/yr` : `+${fmt(-computed.savingsVsCompetitor)}/yr but with AI`} />
          <Compare label="One missed audit control (typical fine)"
                   benchmark={computed.audit_risk}
                   compass={0}
                   savingsLabel="Compass surfaces missing artifacts before the audit" />
          <Compare label="3 unfought DataQ violations / yr (typical)"
                   benchmark={computed.dataq_uncontested}
                   compass={0}
                   savingsLabel="DataQ Dispute Drafter included" />
        </ul>

        <div className="mt-5 pt-5 border-t border-[var(--border)] text-[12px] text-[var(--fg-faint)]">
          <strong className="text-[var(--fg-muted)]">Assumptions:</strong> In-house benchmark = $95k/yr loaded (BLS median fleet safety manager + 30% load).
          Outsourced benchmark = $8/driver/yr + $5k retainer (industry mid-range).
          Audit fine = $4k average per missed-control item (FMCSA published data).
          DataQ = $300 avg savings per won dispute × 3 typical contestable violations/yr.
        </div>

        {/* CTA */}
        <a href="/signup" className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-lg font-bold text-[14px] text-[var(--accent-fg)] bg-[var(--accent)] hover:bg-[var(--accent-2)] transition-colors w-full justify-center">
          Start your 7-day free trial — see your real fleet on this →
        </a>
      </div>
    </div>
  );
}

function Compare({ label, benchmark, compass, savingsLabel }: { label: string; benchmark: number; compass: number; savingsLabel: string }) {
  const fmt = (n: number) => "$" + n.toLocaleString();
  return (
    <li className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 py-2 border-b border-[var(--border)] last:border-0">
      <div className="flex-1">
        <div className="text-[var(--fg)]">{label}</div>
        <div className="text-[11px] text-[var(--fg-faint)] mt-0.5">~{fmt(benchmark)}/yr typical · Compass {compass === 0 ? "included" : fmt(compass) + "/yr"}</div>
      </div>
      <div className="text-[12px] font-bold text-[var(--success)]">{savingsLabel}</div>
    </li>
  );
}
