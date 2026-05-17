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
    return <div className="rounded-xl border border-[#1E3556] bg-[#0F1C32] p-12 text-center text-white/55 text-sm">Loading…</div>;
  }
  if (!rows.length) {
    return (
      <div className="rounded-xl border border-[#1E3556] bg-[#0F1C32] p-12 text-center">
        <div className="text-2xl mb-3">📋</div>
        <h3 className="text-white font-bold text-lg mb-2">{emptyTitle || "Nothing here yet"}</h3>
        <p className="text-white/55 text-sm mb-5 max-w-md mx-auto">{emptyDesc || "Add your first record to get started."}</p>
        {emptyAction}
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-[#1E3556] bg-[#0F1C32] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1E3556] bg-[#0A1929]/40">
              {columns.map((c) => (
                <th key={String(c.key)} className={`px-4 py-3 text-left text-[11px] tracking-[.14em] uppercase text-white/55 font-bold ${c.hideOnMobile ? "max-md:hidden" : ""}`} style={c.width ? { width: c.width } : undefined}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} onClick={() => onRowClick?.(row)} className={`border-b border-[#1E3556]/60 hover:bg-[#0A1929]/40 ${onRowClick ? "cursor-pointer" : ""}`}>
                {columns.map((c) => (
                  <td key={String(c.key)} className={`px-4 py-3 text-white/85 ${c.hideOnMobile ? "max-md:hidden" : ""}`}>
                    {c.render ? c.render(row) : ((row as unknown as Record<string, unknown>)[c.key as string] as ReactNode) ?? <span className="text-white/35">—</span>}
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

export function Badge({ children, color = "cyan" }: { children: ReactNode; color?: "cyan" | "green" | "amber" | "red" | "gray" | "violet" }) {
  const palette = {
    cyan:   { bg: "rgba(34,211,238,0.14)",  text: "#22D3EE", border: "rgba(34,211,238,0.30)" },
    green:  { bg: "rgba(52,211,153,0.14)",  text: "#34D399", border: "rgba(52,211,153,0.30)" },
    amber:  { bg: "rgba(250,204,21,0.14)",  text: "#FACC15", border: "rgba(250,204,21,0.30)" },
    red:    { bg: "rgba(248,113,113,0.14)", text: "#F87171", border: "rgba(248,113,113,0.30)" },
    gray:   { bg: "rgba(148,163,184,0.14)", text: "#94A3B8", border: "rgba(148,163,184,0.30)" },
    violet: { bg: "rgba(167,139,250,0.14)", text: "#A78BFA", border: "rgba(167,139,250,0.30)" },
  }[color];
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-[.12em] uppercase border" style={{ background: palette.bg, color: palette.text, borderColor: palette.border }}>{children}</span>;
}

export function StatCard({ label, value, sub, accent = "#22D3EE" }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div className="rounded-xl border border-[#1E3556] bg-[#0F1C32] p-5">
      <div className="text-[10px] tracking-[.16em] uppercase text-white/55 font-bold mb-2">{label}</div>
      <div className="text-3xl font-extrabold mb-1" style={{ color: accent }}>{value}</div>
      {sub && <div className="text-[11px] text-white/55">{sub}</div>}
    </div>
  );
}

export function fmtDate(s: string | null | undefined) {
  if (!s) return null;
  try { return new Date(s).toLocaleDateString(); } catch { return s; }
}
