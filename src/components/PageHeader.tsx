"use client";

/* ============================================================
   PageHeader · centered title + LIVE/tenant subtitle
   ------------------------------------------------------------
   Renders at the very top of each page's main content area:

              ┌──────────────────────────────────────┐
              │              DASHBOARD               │
              │  ***LIVE*** · XPO Logistics Freight  │
              │  · DOT #241829 · Drivers: 30 ·       │
              │  Vehicles: 21 · DOT Status: Satis... │
              └──────────────────────────────────────┘

   Title is the surface name. Subtitle pulls tenant context
   from TenantThemeProvider + per-page stats.
   ============================================================ */

import { useTenant } from "./TenantThemeProvider";

type Props = {
  title: string;
  live?: boolean;
  stats?: { drivers?: number; vehicles?: number; dotStatus?: string | null };
};

export default function PageHeader({ title, live = true, stats }: Props) {
  const tenant = useTenant();

  return (
    <div
      style={{
        padding: "28px 24px 18px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
      }}
    >
      <h1
        style={{
          fontSize: 32,
          fontWeight: 800,
          letterSpacing: 4.5,
          color: "var(--accent)",
          margin: 0,
          textTransform: "uppercase",
          textShadow: "0 0 22px rgba(22, 199, 255, 0.35)",
          lineHeight: 1.1,
        }}
      >
        {title}
      </h1>
      <div
        role="status"
        aria-label="Tenant context"
        style={{
          fontSize: 13,
          color: "var(--fg-muted)",
          letterSpacing: 0.3,
          display: "flex",
          alignItems: "center",
          gap: 0,
          flexWrap: "wrap",
          justifyContent: "center",
          maxWidth: "100%",
        }}
      >
        {live && (
          <>
            <span style={{
              color: "#FCA5A5",
              fontWeight: 800,
              letterSpacing: 1.5,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}>
              <span aria-hidden="true" style={{
                width: 7, height: 7, borderRadius: 999, background: "#F87171",
                animation: "x3-pulse 2s ease-out infinite",
              }} />
              ***LIVE***
            </span>
            <Sep />
          </>
        )}
        <span style={{ fontWeight: 700, color: "var(--fg)" }}>{tenant.name}</span>
        {tenant.dotNumber && (<><Sep /><span style={{ color: "var(--accent)", fontWeight: 600 }}>DOT #{tenant.dotNumber}</span></>)}
        {typeof stats?.drivers === "number" && (<><Sep /><span>Drivers: <strong style={{ color: "var(--fg)" }}>{stats.drivers}</strong></span></>)}
        {typeof stats?.vehicles === "number" && (<><Sep /><span>Vehicles: <strong style={{ color: "var(--fg)" }}>{stats.vehicles}</strong></span></>)}
        {stats?.dotStatus && (<><Sep /><span>DOT Status: <strong style={{ color: "var(--success)" }}>{stats.dotStatus}</strong></span></>)}
      </div>
      <style>{`
        @keyframes x3-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(248, 113, 113, 0.55); }
          70%  { box-shadow: 0 0 0 7px rgba(248, 113, 113, 0); }
          100% { box-shadow: 0 0 0 0 rgba(248, 113, 113, 0); }
        }
      `}</style>
    </div>
  );
}

function Sep() {
  return <span aria-hidden="true" style={{ margin: "0 10px", opacity: 0.5 }}>·</span>;
}
