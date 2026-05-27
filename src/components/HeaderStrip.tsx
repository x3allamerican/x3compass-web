"use client";

/* ============================================================
   HeaderStrip — tenant context bar above the topbar
   ------------------------------------------------------------
   Mirrors the static Manus design:
     *** LIVE *** · Apex Logistics · DOT #123456 · Drivers: 36 ·
     Vehicles: 21 · DOT Status: Satisfactory
   ------------------------------------------------------------
   Pulls tenant identity from TenantThemeProvider.
   Stats can be passed in OR fetched from Supabase by the
   consuming surface — kept stateless for now.
   ============================================================ */

import { useTenant } from "./TenantThemeProvider";

type HeaderStats = {
  drivers?: number;
  vehicles?: number;
  /** "Satisfactory" / "Conditional" / "Unsatisfactory" / null */
  dotStatus?: string | null;
};

type Props = {
  /** Show the pulsing red LIVE badge. Defaults to true. */
  live?: boolean;
  stats?: HeaderStats;
};

export default function HeaderStrip({ live = true, stats }: Props) {
  const tenant = useTenant();

  return (
    <div
      role="status"
      aria-label="Tenant context bar"
      className="x3-header-strip"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 0,
        flexWrap: "wrap",
        rowGap: 6,
        padding: "8px 24px",
        background: "var(--bg-3)",
        borderBottom: "1px solid var(--hairline)",
        fontSize: 12.5,
        color: "var(--fg-muted)",
        letterSpacing: 0.2,
      }}
    >
      {live && (
        <span
          aria-label="System status: live"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "2px 8px",
            background: "rgba(248, 113, 113, 0.12)",
            color: "#FCA5A5",
            borderRadius: 999,
            fontWeight: 700,
            fontSize: 10.5,
            letterSpacing: 1.2,
            marginRight: 12,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              background: "#F87171",
              boxShadow: "0 0 0 0 rgba(248, 113, 113, 0.6)",
              animation: "x3-pulse 2s ease-out infinite",
            }}
          />
          LIVE
        </span>
      )}

      <Segment value={tenant.name} bold />
      {tenant.dotNumber && <Segment value={`DOT #${tenant.dotNumber}`} />}
      {typeof stats?.drivers === "number" && <Segment value={`Drivers: ${stats.drivers}`} />}
      {typeof stats?.vehicles === "number" && <Segment value={`Vehicles: ${stats.vehicles}`} />}
      {stats?.dotStatus && <Segment value={`DOT Status: ${stats.dotStatus}`} />}

      <style>{`
        @keyframes x3-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(248, 113, 113, 0.55); }
          70%  { box-shadow: 0 0 0 6px rgba(248, 113, 113, 0); }
          100% { box-shadow: 0 0 0 0 rgba(248, 113, 113, 0); }
        }
      `}</style>
    </div>
  );
}

function Segment({ value, bold }: { value: string; bold?: boolean }) {
  return (
    <>
      <span
        style={{
          opacity: 0.5,
          margin: "0 10px",
          fontSize: 11,
        }}
        aria-hidden="true"
      >
        ·
      </span>
      <span style={{ fontWeight: bold ? 600 : 500, color: bold ? "var(--fg)" : "var(--fg-muted)" }}>
        {value}
      </span>
    </>
  );
}
