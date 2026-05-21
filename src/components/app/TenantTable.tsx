"use client";
import { ReactNode } from "react";

export type Column<T> = {
  key: keyof T | string;
  label: string;
  width?: string;
  render?: (row: T) => ReactNode;
  hideOnMobile?: boolean;
};

export function TenantTable<T extends { id: string }>({
  rows, columns, emptyTitle, emptyDesc, emptyAction, onRowClick, loading,
}: {
  rows: T[];
  columns: Column<T>[];
  emptyTitle?: string;
  emptyDesc?: string;
  emptyAction?: ReactNode;
  onRowClick?: (row: T) => void;
  loading?: boolean;
}) {
  if (loading) {
    return <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-3)] p-12 text-center text-[var(--fg-muted)] text-sm">Loading…</div>;
  }
  if (!rows.length) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-3)] p-12 text-center">
        <div className="text-2xl mb-3">📋</div>
        <h3 className="text-[var(--fg)] font-bold text-lg mb-2">{emptyTitle || "Nothing here yet"}</h3>
        <p className="text-[var(--fg-muted)] text-sm mb-5 max-w-md mx-auto">{emptyDesc || "Add your first record to get started."}</p>
        {emptyAction}
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-3)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--bg)]/40">
              {columns.map((c) => (
                <th key={String(c.key)} className={`px-4 py-3 text-left text-[11px] tracking-[.14em] uppercase text-[var(--fg-muted)] font-bold ${c.hideOnMobile ? "max-md:hidden" : ""}`} style={c.width ? { width: c.width } : undefined}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} onClick={() => onRowClick?.(row)} className={`border-b border-[var(--border)]/60 hover:bg-[var(--bg)]/40 ${onRowClick ? "cursor-pointer" : ""}`}>
                {columns.map((c) => (
                  <td key={String(c.key)} className={`px-4 py-3 text-[var(--fg-muted)] ${c.hideOnMobile ? "max-md:hidden" : ""}`}>
                    {c.render ? c.render(row) : ((row as unknown as Record<string, unknown>)[c.key as string] as ReactNode) ?? <span className="text-[var(--fg-faint)]">—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Vibrant theme-aware pills — matches the StatusPill pattern used on /app/inspections.
// Light mode: solid {color}-700 bg + white text + {color}-800 border (high contrast, vibrant)
// Dark mode:  {color}-500/45 bg + {color}-50 text + {color}-300/80 border (saturated, glow-y)
const BADGE_CLASSES: Record<"cyan" | "green" | "amber" | "red" | "gray" | "violet", string> = {
  cyan:   "bg-cyan-700 text-white border-cyan-800 dark:bg-cyan-500/45 dark:text-cyan-50 dark:border-cyan-300/80",
  green:  "bg-green-700 text-white border-green-800 dark:bg-emerald-500/45 dark:text-emerald-50 dark:border-emerald-300/80",
  amber:  "bg-amber-600 text-white border-amber-700 dark:bg-amber-500/45 dark:text-amber-50 dark:border-amber-300/80",
  red:    "bg-red-700 text-white border-red-800 dark:bg-rose-500/45 dark:text-rose-50 dark:border-rose-300/80",
  gray:   "bg-slate-600 text-white border-slate-700 dark:bg-slate-500/45 dark:text-slate-50 dark:border-slate-300/80",
  violet: "bg-violet-700 text-white border-violet-800 dark:bg-violet-500/45 dark:text-violet-50 dark:border-violet-300/80",
};

export function Badge({ children, color = "cyan" }: { children: ReactNode; color?: keyof typeof BADGE_CLASSES }) {
  return (
    <span
      role="status"
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-[.12em] uppercase border ${BADGE_CLASSES[color]}`}
    >
      {children}
    </span>
  );
}

export function StatCard({ label, value, sub, accent = "#22D3EE" }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-3)] p-5">
      <div className="text-[10px] tracking-[.16em] uppercase text-[var(--fg-muted)] font-bold mb-2">{label}</div>
      <div className="text-3xl font-extrabold mb-1" style={{ color: accent }}>{value}</div>
      {sub && <div className="text-[11px] text-[var(--fg-muted)]">{sub}</div>}
    </div>
  );
}

export function fmtDate(s: string | null | undefined) {
  if (!s) return null;
  try { return new Date(s).toLocaleDateString(); } catch { return s; }
}
