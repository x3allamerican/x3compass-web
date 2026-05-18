"use client";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { CSA_BASICS, DEMO_FLEET } from "@/lib/demoData";

export default function CSAPage() {
  return (
    <AppShell title="CSA Scores" crumbs="Compliance · BASIC measures">
      <div className="px-6 py-6 space-y-6 bg-[var(--bg)] min-h-screen">
        <div className="x3-card p-5">
          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <div>
              <div className="text-[15px] font-extrabold text-[var(--fg)]">FMCSA CSA / SMS · BASIC percentile measures</div>
              <div className="text-[12px] text-[var(--fg-muted)]">All seven BASICs. Lower is better. Source: CarrierOk (Live · pending Enterprise upgrade) + SAFER.</div>
            </div>
            <Link href="https://ai.fmcsa.dot.gov/SMS" target="_blank" rel="noopener" className="text-[12px] text-[var(--accent)] font-bold hover:underline">Open SMS →</Link>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {CSA_BASICS.map((c) => {
            const tone = c.status === "alert" ? "var(--danger)" : c.status === "warn" ? "var(--warning)" : "var(--success)";
            return (
              <div key={c.name} className="x3-card p-5">
                <div className="text-[11px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)] mb-2">{c.name}</div>
                <div className="text-[40px] font-black leading-none" style={{ color: tone }}>{c.msr}</div>
                <div className="text-[11px] text-[var(--fg-muted)] mt-2">MSR percentile</div>
                <div className="text-[11px] text-[var(--fg-muted)]">Threshold {c.threshold}%</div>
                <div className="h-1.5 rounded-full bg-[var(--surface-2)] mt-3 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, (c.msr / c.threshold) * 100)}%`, background: tone }} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="x3-card p-5">
          <div className="text-[15px] font-extrabold text-[var(--fg)] mb-3">Why each BASIC matters</div>
          <ul className="text-[13px] text-[var(--fg-muted)] space-y-2 leading-relaxed">
            <li><strong className="text-[var(--fg)]">Unsafe Driving</strong> — speeding, reckless driving, improper lane change. 49 CFR Parts 392, 397.</li>
            <li><strong className="text-[var(--fg)]">Crash Indicator</strong> — frequency + severity of crashes. State-reported.</li>
            <li><strong className="text-[var(--fg)]">HOS Compliance</strong> — log violations + driver fatigue. 49 CFR Part 395.</li>
            <li><strong className="text-[var(--fg)]">Vehicle Maintenance</strong> — mechanical defects from roadside inspections. 49 CFR Parts 393, 396.</li>
            <li><strong className="text-[var(--fg)]">Hazmat Compliance</strong> — placarding, packaging, paperwork. 49 CFR Parts 171–180.</li>
            <li><strong className="text-[var(--fg)]">Driver Fitness</strong> — medical, CDL, training, qualification. 49 CFR Parts 383, 391.</li>
            <li><strong className="text-[var(--fg)]">Controlled Substances / Alcohol</strong> — drug + alcohol use in operations. 49 CFR Part 382.</li>
          </ul>
        </div>
      </div>
    </AppShell>
  );
}
