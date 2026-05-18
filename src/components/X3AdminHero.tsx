"use client";
import React from "react";

/**
 * Dark navy hero + amber "Where this data comes from" callout — shared across
 * every X3 Admin page (Finance, Notifications, Audit Log, FMCSA Prospects, Marketing).
 * Mirrors app.x3fleetsafety.com/admin styling: navy hero with gold eyebrow label,
 * yellow-amber rules-of-the-road box right below.
 */
export function X3AdminHero({
  eyebrow, title, intro, dataSource,
}: {
  eyebrow: string;
  title: React.ReactNode;
  intro?: React.ReactNode;
  dataSource?: { items: React.ReactNode[]; footnote?: React.ReactNode };
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl p-6 sm:p-8 border border-[#1E3556]" style={{ background: "linear-gradient(180deg, #0F2438 0%, #0B1B2E 100%)" }}>
        <div className="text-[11px] tracking-[.18em] uppercase font-extrabold text-[#FACC15] mb-3">{eyebrow}</div>
        <h2 className="text-[24px] sm:text-[30px] font-extrabold tracking-tight leading-[1.15] text-white mb-2">{title}</h2>
        {intro && <div className="text-[14px] text-white/80 leading-relaxed max-w-4xl">{intro}</div>}
      </div>
      {dataSource && (
        <div className="rounded-xl border border-[#FACC15]/40 p-4" style={{ background: "rgba(250, 204, 21, 0.06)" }}>
          <div className="text-[12px] font-bold text-[#FACC15] mb-2">📍 Where this data comes from</div>
          <ul className="text-[13px] text-[var(--fg-muted)] space-y-1.5 leading-relaxed">
            {dataSource.items.map((it, i) => <li key={i}>• {it}</li>)}
          </ul>
          {dataSource.footnote && <div className="text-[12px] text-[var(--fg-faint)] italic mt-3">{dataSource.footnote}</div>}
        </div>
      )}
    </div>
  );
}

export function X3KPITile({
  label, value, sub, tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: "default" | "green" | "red" | "navy" | "amber";
}) {
  const valueColor = tone === "green" ? "var(--success)" : tone === "red" ? "var(--danger)" : tone === "amber" ? "#B45309" : tone === "navy" ? "var(--fg)" : "var(--fg)";
  return (
    <div className="x3-card p-4">
      <div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)] mb-2 flex items-center gap-1.5">
        {label}
      </div>
      <div className="text-[26px] font-black leading-none" style={{ color: valueColor }}>{value}</div>
      {sub && <div className="text-[11px] text-[var(--fg-muted)] mt-2">{sub}</div>}
    </div>
  );
}

export function X3AdminTabs({ tabs, active, onChange }: { tabs: { key: string; label: React.ReactNode }[]; active: string; onChange: (key: string) => void }) {
  return (
    <div className="border-b border-[var(--border)] flex gap-1 overflow-x-auto">
      {tabs.map((t) => (
        <button key={t.key} onClick={() => onChange(t.key)} className={`px-4 py-2.5 text-[13px] font-bold whitespace-nowrap border-b-2 -mb-px transition-colors ${active === t.key ? "border-[#FACC15] text-[var(--fg)]" : "border-transparent text-[var(--fg-muted)] hover:text-[var(--fg)]"}`}>
          {t.label}
        </button>
      ))}
    </div>
  );
}
