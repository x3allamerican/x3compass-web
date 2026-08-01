"use client";

/* ============================================================
   AppTopbar · centered title + scrolling subtitle in topbar
   ------------------------------------------------------------
   Layout:
                     DASHBOARD                          🔔  JK  Joshua Kovarik
       ***LIVE*** · XPO Logistics · DOT #X · …→             Founder ▾
   ============================================================ */

import { useTenant } from "./TenantThemeProvider";

type Props = {
  /** Page name (used only for accessibility · VISUAL topbar title is the brand banner "AI SAFETY DIRECTOR" per Joshua). */
  title: string;
  userEmail?: string | null;
  userName?: string | null;
  userRole?: string | null;
  live?: boolean;
  stats?: { drivers?: number; vehicles?: number; dotStatus?: string | null };
  notificationCount?: number;
};

/** The topbar always shows the BRAND banner · not the per-page name. Joshua wants
 *  "AI SAFETY DIRECTOR" everywhere so we never see double-Drivers / double-Vehicles
 *  with the page-level <h1>. */
const TOPBAR_BANNER = "AI SAFETY DIRECTOR";

export default function AppTopbar({
  title,
  userEmail,
  userName,
  userRole,
  live = true,
  stats,
  notificationCount = 0,
}: Props) {
  const tenant = useTenant();
  const displayName = userName || userEmail || "Signed in";
  const initials = (() => {
    const src = userName || userEmail || "";
    const parts = src.replace(/@.*$/, "").split(/[.\s_-]+/).filter(Boolean);
    return (parts[0]?.[0] || "U").concat(parts[1]?.[0] || "").toUpperCase();
  })();

  // Subtitle uses the Apex Logistics demo values until a real tenant is wired.
  // Per Joshua: LIVE shows in GREEN; the rest of the subtitle is all cyan.
  // Suppress lint on unused incoming props · the demo values override them.
  void tenant; void stats;
  const parts: string[] = [
    ...(live ? ["***LIVE***"] : []),
    "Apex Logistics",
    "DOT#123456",
    "Drivers 36",
    "Vehicles 21",
    "Satisfactory",
  ];

  return (
    <header
      className="x3-topbar"
      style={{
        background: "var(--bg)",
        borderBottom: "2px solid rgba(255, 255, 255, 0.55)",
        position: "sticky",
        top: 0,
        zIndex: 31,
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        alignItems: "center",
        gap: 24,
        padding: "6px 28px",
        minHeight: 88,
      }}
    >
      {/* LEFT spacer · keeps the title TRULY centered across the topbar */}
      <div aria-hidden="true" />

      {/* CENTER stack · title + scrolling subtitle.
       *  Tightened (May 2026) — pulled the title up to ~88px topbar height
       *  so the visible content sits higher and the page below gets ~50px
       *  more real estate. */}
      <div style={{ minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, textAlign: "center", paddingTop: 0 }}>
        <h1
          aria-label={title}
          style={{
            fontSize: 34,
            fontWeight: 800,
            letterSpacing: 4,
            color: "var(--accent)",
            margin: 0,
            textTransform: "uppercase",
            textShadow: "0 0 24px rgba(22, 199, 255, 0.55)",
            lineHeight: 1,
            whiteSpace: "nowrap",
          }}
        >
          {TOPBAR_BANNER}
        </h1>
        <div
          role="status"
          aria-label="Tenant context"
          style={{
            width: "100%",
            maxWidth: 560,
            fontSize: 12.5,
            color: "var(--accent)",
            letterSpacing: 0.3,
            whiteSpace: "nowrap",
            overflow: "hidden",
            marginTop: 0,
            maskImage: "linear-gradient(to right, transparent, #000 10%, #000 90%, transparent)",
            WebkitMaskImage: "linear-gradient(to right, transparent, #000 10%, #000 90%, transparent)",
          }}
        >
          <span
            className="x3-tagline-track"
            style={{
              display: "inline-block",
              animation: "x3-marquee 42s linear infinite",
              paddingLeft: "100%",
              fontWeight: 500,
            }}
          >
            <TaglineSegments parts={parts} />
            <span style={{ display: "inline-block", width: 560 }} aria-hidden="true" />
            <TaglineSegments parts={parts} />
          </span>
        </div>
      </div>

      {/* RIGHT · bell + user widget (pinned to right edge) */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 14, flexShrink: 0 }}>
        <button
          aria-label={`Notifications${notificationCount ? `, ${notificationCount} unread` : ""}`}
          style={{
            position: "relative", width: 36, height: 36, borderRadius: 999, border: "none",
            background: "transparent", color: "var(--warning)", fontSize: 18, cursor: "pointer",
            display: "grid", placeItems: "center",
          }}
        >
          🔔
          {notificationCount > 0 && (
            <span style={{ position: "absolute", top: 3, right: 3, background: "#F87171", color: "#000", fontSize: 9, fontWeight: 800, padding: "1px 5px", borderRadius: 999, minWidth: 14, textAlign: "center" }}>
              {notificationCount > 99 ? "99+" : notificationCount}
            </span>
          )}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            aria-hidden="true"
            style={{
              width: 36, height: 36, borderRadius: 999,
              background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
              color: "var(--accent-fg)", fontWeight: 800, fontSize: 13,
              display: "grid", placeItems: "center", letterSpacing: 0.5,
            }}
          >
            {initials}
          </div>
          <div style={{ lineHeight: 1.15, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--fg)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 200 }}>
              {displayName}
            </div>
            {userRole && <div style={{ fontSize: 11, color: "var(--fg-muted)" }}>{userRole}</div>}
          </div>
          <span aria-hidden="true" style={{ color: "var(--fg-muted)", fontSize: 11, marginLeft: 2 }}>▾</span>
        </div>
      </div>

      <style>{`
        @keyframes x3-marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .x3-tagline-track:hover { animation-play-state: paused; }
      `}</style>
    </header>
  );
}

function TaglineSegments({ parts }: { parts: string[] }) {
  return (
    <>
      {parts.map((p, i) => {
        const isLive = p === "***LIVE***";
        return (
          <span key={i}>
            {i > 0 && <span style={{ color: "var(--accent)", opacity: 0.65, padding: "0 10px" }} aria-hidden="true">·</span>}
            <span style={{
              // LIVE in green, everything else cyan (per Joshua).
              color: isLive ? "#34D399" : "var(--accent)",
              fontWeight: isLive ? 800 : 600,
              letterSpacing: isLive ? 1.8 : 0.3,
            }}>
              {p}
            </span>
          </span>
        );
      })}
    </>
  );
}
