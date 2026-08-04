"use client";
import { ReactNode } from "react";

type Tone = "navy" | "green" | "red" | "amber";

/**
 * X3AdminHero · Hero banner for X3 internal admin pages (notifications, settings,
 * audit-log, prospects, etc.). Dark gradient, eyebrow + title + intro, with optional
 * collapsible "Data Source" disclosure block.
 */
export function X3AdminHero({
  eyebrow,
  title,
  intro,
  dataSource,
}: {
  eyebrow: string;
  title: ReactNode;
  intro: ReactNode;
  dataSource?: { items: ReactNode[]; footnote?: ReactNode };
}) {
  return (
    <section className="rounded-xl overflow-hidden border border-[var(--border)] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="px-6 py-7 text-white">
        <div className="text-[11px] font-bold uppercase tracking-widest text-cyan-300 mb-2">{eyebrow}</div>
        <h1 className="text-2xl md:text-3xl font-black leading-tight mb-3 text-white">{title}</h1>
        <div className="text-[14px] leading-relaxed text-slate-200 max-w-3xl">{intro}</div>
      </div>
      {dataSource && dataSource.items?.length > 0 && (
        <details className="bg-slate-950/60 border-t border-slate-700/50 group">
          <summary className="cursor-pointer px-6 py-3 text-[12px] font-bold text-slate-300 hover:text-white flex items-center gap-2 select-none">
            <span className="transition-transform group-open:rotate-90">▶</span>
            Data Source &amp; Methodology
          </summary>
          <ul className="px-6 pb-5 pt-1 space-y-2 text-[12.5px] text-slate-300 leading-relaxed">
            {dataSource.items.map((item, i) => (
              <li key={i} className="pl-4 border-l-2 border-cyan-500/40">{item}</li>
            ))}
          </ul>
          {dataSource.footnote && (
            <div className="px-6 pb-5 text-[11.5px] text-slate-400 leading-relaxed">
              {dataSource.footnote}
            </div>
          )}
        </details>
      )}
    </section>
  );
}

/**
 * X3KPITile · Single KPI card. Used in 6-up KPI grids on admin pages.
 */
export function X3KPITile({
  label,
  value,
  sub,
  tone = "navy",
}: {
  label: string;
  value: string | number;
  sub?: string;
  tone?: Tone;
}) {
  const toneClasses: Record<Tone, string> = {
    navy:  "bg-slate-100  dark:bg-slate-500/30  text-slate-900  dark:text-slate-50  border-slate-700  dark:border-slate-300/80",
    green: "bg-emerald-100 dark:bg-emerald-500/30 text-emerald-900 dark:text-emerald-50 border-emerald-700 dark:border-emerald-300/80",
    red:   "bg-rose-100    dark:bg-rose-500/30    text-rose-900    dark:text-rose-50    border-rose-700    dark:border-rose-300/80",
    amber: "bg-amber-100   dark:bg-amber-500/30   text-amber-900   dark:text-amber-50   border-amber-700   dark:border-amber-300/80",
  };
  return (
    <div className={`rounded-xl border p-3 ${toneClasses[tone]}`}>
      <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">{label}</div>
      <div className="text-2xl font-black mt-1 leading-none">{value}</div>
      {sub && <div className="text-[11px] mt-1 opacity-75 leading-tight">{sub}</div>}
    </div>
  );
}

/**
 * X3AdminTabs · Horizontal tab bar for admin sub-views. Active tab gets accent color.
 */
export function X3AdminTabs<K extends string = string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: K; label: ReactNode }[];
  active: K;
  onChange: (k: K) => void;
}) {
  return (
    <div className="flex items-center gap-1 flex-wrap border-b border-[var(--border)]">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`px-4 py-2 text-[13px] font-bold rounded-t-lg transition-colors -mb-px border-b-2 ${
            active === t.key
              ? "text-[var(--accent)] border-[var(--accent)] bg-[var(--surface-2)]"
              : "text-[var(--muted)] border-transparent hover:text-[var(--fg)] hover:bg-[var(--surface-2)]"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
