"use client";

/**
 * Skeleton · theme-aware loading placeholders with a soft pulse.
 *
 * Use INSTEAD of "Loading…" text for any deferred content. Three flavors:
 *
 *   <Skeleton />                    // a single line
 *   <Skeleton w={200} h={20} />     // explicit dimensions in px
 *   <Skeleton className="..." />    // any Tailwind sizing
 *
 *   <SkeletonRow cols={5} />        // a table row with N cells
 *   <SkeletonCard h={120} />        // a card-shaped placeholder
 *   <SkeletonKpi />                 // an X3KPITile-shaped placeholder
 *
 * Light mode: slate-200 base, slate-300 highlight.
 * Dark mode:  surface-2 base, white/10 highlight.
 * Pulse opacity 60% → 100% → 60% over 1.4s · fast enough to feel responsive,
 * slow enough not to feel anxious.
 */
import React from "react";

const BASE = "bg-slate-200 dark:bg-[var(--surface-2)] rounded animate-x3-pulse";

export function Skeleton({ w, h, className }: { w?: number | string; h?: number | string; className?: string }) {
  const style: React.CSSProperties = {};
  if (w !== undefined) style.width = typeof w === "number" ? `${w}px` : w;
  if (h !== undefined) style.height = typeof h === "number" ? `${h}px` : h;
  return <div className={`${BASE} ${className || "h-4 w-full"}`} style={style} aria-hidden="true" />;
}

export function SkeletonRow({ cols = 5, withCheckbox = false }: { cols?: number; withCheckbox?: boolean }) {
  return (
    <tr className="border-t border-[var(--border)]" aria-hidden="true">
      {withCheckbox && <td className="px-3 py-3 w-8"><Skeleton w={14} h={14} /></td>}
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-3 py-3"><Skeleton h={14} w={i === 0 ? "60%" : i === cols - 1 ? "40%" : "80%"} /></td>
      ))}
    </tr>
  );
}

export function SkeletonCard({ h = 120, className }: { h?: number; className?: string }) {
  return <div className={`x3-card p-4 ${className || ""}`} style={{ minHeight: h }} aria-hidden="true">
    <Skeleton h={12} w="40%" className="mb-3" />
    <Skeleton h={28} w="65%" className="mb-2" />
    <Skeleton h={11} w="50%" />
  </div>;
}

export function SkeletonKpi() {
  return <SkeletonCard h={92} />;
}

export function SkeletonChart({ h = 180 }: { h?: number }) {
  return (
    <div className="x3-card p-5" aria-hidden="true">
      <Skeleton h={14} w="35%" className="mb-4" />
      <div className="flex gap-2 items-end" style={{ height: h }}>
        {[55, 80, 40, 70, 90, 60, 75, 50, 85, 45, 65, 88].map((pct, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className={`w-full rounded-t ${BASE}`} style={{ height: `${pct}%`, minHeight: 6 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * SkeletonShell · the dashboard / page-level placeholder.
 * Renders the same row-rhythm as the real content so the layout doesn't shift.
 */
export function SkeletonShell({ kpis = 4, rows = 6 }: { kpis?: number; rows?: number }) {
  return (
    <div className="space-y-6">
      {/* Hero block */}
      <div className="x3-card p-6" aria-hidden="true">
        <Skeleton h={10} w="20%" className="mb-2" />
        <Skeleton h={22} w="55%" className="mb-3" />
        <Skeleton h={12} w="80%" className="mb-1" />
        <Skeleton h={12} w="70%" />
      </div>
      {/* KPI strip */}
      <div className={`grid grid-cols-2 sm:grid-cols-${Math.min(kpis, 4)} lg:grid-cols-${kpis} gap-3`}>
        {Array.from({ length: kpis }).map((_, i) => <SkeletonKpi key={i} />)}
      </div>
      {/* Table */}
      <div className="x3-card overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border)]"><Skeleton h={14} w="30%" /></div>
        <table className="w-full text-[12px]">
          <tbody>{Array.from({ length: rows }).map((_, i) => <SkeletonRow key={i} cols={5} />)}</tbody>
        </table>
      </div>
    </div>
  );
}
