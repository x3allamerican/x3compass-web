"use client";

/* ============================================================
   EducationHubCard · universal pattern across every X3 surface
   ------------------------------------------------------------
   Matches static app.x3compass.com background-tracker layout:

   ┌──────────────────────────────────────────────────────────┐
   │ 🛡 SURFACE NAME · EDUCATION HUB   <subtitle>   [Ask AI →] │
   ├────────────────┬────────────────┬────────────────────────┤
   │ FOR DRIVERS    │ FOR EMPLOYERS  │ FOR C/TPAs             │
   │ <subtitle>     │ <subtitle>     │ <subtitle>             │
   │ <body>         │ <body>         │ <body>                 │
   │ • bullet 1     │ • bullet 1     │ • bullet 1             │
   │ • bullet 2     │ • bullet 2     │ • bullet 2             │
   │ [Open guide →] │ [Open guide →] │ [Open guide →]         │
   └────────────────┴────────────────┴────────────────────────┘

   Each page passes its own audience copy. The visual frame is
   identical so the system feels coherent across surfaces.
   ============================================================ */

import Link from "next/link";
import { ReactNode } from "react";

/* Ask AI Concierge button — opens the in-page chat overlay
 * (ConciergeModal) instead of navigating to /app/ask. Modal
 * is mounted by the page shell and listens for this event. */
function ConciergeButton({ conciergeHref }: { conciergeHref: string }) {
  // Derive a context tag from the conciergeHref query string, e.g.
  // /app/ask?context=hazmat-placards → "hazmat-placards"
  let context: string | undefined;
  try {
    const url = new URL(conciergeHref, "https://x3compass.com");
    context = url.searchParams.get("context") || undefined;
  } catch {
    /* no-op */
  }
  function onClick() {
    window.dispatchEvent(
      new CustomEvent("x3:open-concierge", { detail: { context } })
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Ask AI Concierge"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "12px 22px",
        borderRadius: 999,
        background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
        border: "1px solid transparent",
        color: "var(--accent-fg, #000)",
        fontSize: 14,
        fontWeight: 800,
        whiteSpace: "nowrap",
        boxShadow:
          "0 8px 22px rgba(2, 6, 12, 0.55), 0 1px 0 rgba(255,255,255,0.20) inset",
        letterSpacing: 0.2,
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      <span aria-hidden="true" style={{ fontSize: 16 }}>🤖</span>
      <span>Ask AI Concierge</span>
    </button>
  );
}

export type AudienceTone = "cyan" | "violet" | "amber" | "emerald";

export type Audience = {
  /** "For Drivers" / "For Employers" / "For C/TPAs" */
  label: string;
  /** Small subtitle under label, e.g., "JOB APPLICANTS + HIRES" */
  subtitle?: string;
  /** Body copy paragraph */
  body: string;
  /** Bullet list */
  bullets: string[];
  /** CTA text · "Open Driver guide →" */
  cta: string;
  /** CTA target (route or anchor) */
  href: string;
  /** Card stripe color along the top edge */
  tone?: AudienceTone;
  /** Icon emoji shown next to the label */
  icon?: string;
  /** Optional list of additional PDF resources rendered under the main CTA. */
  pdfs?: Array<{ label: string; href: string }>;
};

type Props = {
  /** Surface name shown in the header · "Background Tracker", "Hazmat Center" */
  surface: string;
  /** One-line subtitle next to the header */
  subtitle?: string;
  /** Optional anchor href for the AI Concierge button */
  conciergeHref?: string;
  /** 3 audience columns */
  audiences: Audience[];
};

const TONE_STRIPE: Record<AudienceTone, string> = {
  cyan:    "linear-gradient(90deg, #16C7FF, #16C7FF)",
  violet:  "linear-gradient(90deg, #A78BFA, #8B5CF6)",
  amber:   "linear-gradient(90deg, #FBBF24, #F59E0B)",
  emerald: "linear-gradient(90deg, #34D399, #10B981)",
};

export default function EducationHubCard({ surface, subtitle, conciergeHref = "/app/ask", audiences }: Props) {
  /* Compact two-pill bar — Education Hub + Ask AI Concierge.
   *  Both open as centered modals (EducationHubModal + ConciergeModal,
   *  mounted globally by AppShell). Replaces the previous big inline
   *  card so every /app/* page reclaims ~400px of vertical space. */
  function openEduHub() {
    window.dispatchEvent(
      new CustomEvent("x3:open-education-hub", {
        detail: { surface, subtitle, audiences, conciergeHref },
      })
    );
  }
  function openConcierge() {
    let context: string | undefined;
    try {
      const url = new URL(conciergeHref, "https://x3compass.com");
      context = url.searchParams.get("context") || undefined;
    } catch { /* no-op */ }
    window.dispatchEvent(new CustomEvent("x3:open-concierge", { detail: { context } }));
  }
  return (
    <div
      aria-label={`${surface} education hub`}
      style={{
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      <button
        type="button"
        onClick={openEduHub}
        aria-label={`${surface} Education Hub`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 18px",
          borderRadius: 999,
          background: "rgba(22, 199, 255, 0.06)",
          border: "1px solid rgba(22, 199, 255, 0.45)",
          color: "#16C7FF",
          fontSize: 13,
          fontWeight: 700,
          whiteSpace: "nowrap",
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        <span aria-hidden style={{ fontSize: 15 }}>📚</span> Education Hub
      </button>
      <button
        type="button"
        onClick={openConcierge}
        aria-label="Ask AI Concierge"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 18px",
          borderRadius: 999,
          background: "linear-gradient(135deg, #16C7FF, #16C7FF)",
          border: 0,
          color: "#000000",
          fontSize: 13,
          fontWeight: 800,
          whiteSpace: "nowrap",
          cursor: "pointer",
          boxShadow: "0 8px 22px rgba(2, 6, 12, 0.55), 0 1px 0 rgba(255,255,255,0.20) inset",
          letterSpacing: 0.2,
          fontFamily: "inherit",
        }}
      >
        <span aria-hidden style={{ fontSize: 15 }}>🤖</span> Ask AI Concierge
      </button>
    </div>
  );
}

function AudienceColumn({ a }: { a: Audience }) {
  const stripe = TONE_STRIPE[a.tone || "cyan"];
  return (
    <article
      style={{
        position: "relative",
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "18px 18px 14px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {/* top stripe */}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: stripe,
        }}
      />

      <header style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {a.icon && <span aria-hidden="true" style={{ fontSize: 14 }}>{a.icon}</span>}
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "var(--fg)" }}>{a.label}</div>
          {a.subtitle && (
            <div style={{ fontSize: 9.5, fontWeight: 700, color: "var(--fg-faint)", letterSpacing: 1.2, textTransform: "uppercase", marginTop: 2 }}>
              {a.subtitle}
            </div>
          )}
        </div>
      </header>

      <p style={{ fontSize: 12, color: "var(--fg-muted)", lineHeight: 1.5, margin: 0 }}>{a.body}</p>

      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
        {a.bullets.map((b, i) => (
          <li
            key={i}
            style={{
              fontSize: 11.5,
              color: "var(--fg-muted)",
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              lineHeight: 1.4,
            }}
          >
            <span aria-hidden="true" style={{ color: "var(--accent)", flexShrink: 0, marginTop: 2 }}>•</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>

      <Link
        href={a.href}
        style={{
          marginTop: "auto",
          display: "block",
          textAlign: "center",
          padding: "9px 12px",
          borderRadius: 8,
          background: "color-mix(in srgb, var(--accent) 12%, transparent)",
          border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)",
          color: "var(--accent)",
          fontSize: 11.5,
          fontWeight: 700,
        }}
      >
        {a.cta}
      </Link>
    </article>
  );
}

/* ============================================================
   Reusable simple-KPI card · matches background-tracker hero row
   ------------------------------------------------------------
   ACTIVE ORDERS · 6
   AVG TURNAROUND · 3.2 days · Industry: 5-7d
   CLEAR RATE YTD · 94%
   ADVERSE ACTIONS · 2 · FCRA sent
   ============================================================ */
export function SimpleKpi({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <article
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "18px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        minHeight: 110,
        boxShadow: "var(--card-shadow)",
      }}
    >
      <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 1.6, textTransform: "uppercase", color: "var(--fg-faint)" }}>
        {label}
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.05, color: "var(--fg)", fontVariantNumeric: "tabular-nums" }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: "var(--fg-muted)" }}>{sub}</div>}
    </article>
  );
}
