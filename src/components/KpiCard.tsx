"use client";

/* ============================================================
   KpiCard — hero KPI tile (Bugatti standard)
   ------------------------------------------------------------
   Used in the Compliance Command Center hero row and replicated
   across every tracker surface. Mirrors the Manus design from
   app.x3compass.com:

     ┌────────────────────────────────────┐
     │ COMPLIANCE HEALTH            ⓘ     │   ← label + info tip
     │ 85%                                 │   ← value (display size)
     │ Good                                │   ← qualitative tag
     │ Up 8% ↑  vs last 30 days            │   ← delta + context
     └────────────────────────────────────┘
   ============================================================ */

import { ReactNode } from "react";

export type KpiTone = "neutral" | "success" | "warning" | "danger";
export type KpiDelta = {
  /** Numeric or % change ("8%", "+3", "-2") */
  value: string;
  /** "up" raises the green arrow, "down" the red, "flat" hides */
  direction: "up" | "down" | "flat";
  /** Trailing context ("vs last 30 days") */
  context?: string;
};

type Props = {
  label: string;
  value: ReactNode;
  /** Qualitative tag under the value: "Good" / "Fair" / "Poor" */
  qualifier?: string;
  qualifierTone?: KpiTone;
  delta?: KpiDelta;
  /** Optional small icon shown next to the label */
  icon?: ReactNode;
  /** Optional info-tooltip text shown via title attribute on the ⓘ */
  hint?: string;
  /** Right-aligned secondary content (e.g., "12 Inactive" pill) */
  meta?: ReactNode;
};

const TONE_COLORS: Record<KpiTone, string> = {
  neutral: "var(--fg-muted)",
  success: "#34D399",
  warning: "#FBBF24",
  danger:  "#F87171",
};

export default function KpiCard({
  label,
  value,
  qualifier,
  qualifierTone = "neutral",
  delta,
  icon,
  hint,
  meta,
}: Props) {
  return (
    <article
      className="x3-kpi-card"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--shell-radius, 14px)",
        padding: "20px 22px",
        boxShadow: "var(--card-shadow)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        minHeight: 156,
      }}
    >
      {/* HEADER ROW: label + info hint + right meta */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {icon && <span aria-hidden="true" style={{ opacity: 0.85 }}>{icon}</span>}
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1.6,
              color: "var(--fg-faint)",
              textTransform: "uppercase",
            }}
          >
            {label}
          </span>
          {hint && (
            <span
              title={hint}
              aria-label={hint}
              tabIndex={0}
              role="note"
              style={{
                width: 16,
                height: 16,
                borderRadius: 999,
                background: "rgba(255,255,255,0.06)",
                color: "var(--fg-faint)",
                fontSize: 10,
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "help",
              }}
            >
              ⓘ
            </span>
          )}
        </div>
        {meta}
      </header>

      {/* VALUE — display size */}
      <div
        style={{
          fontSize: 38,
          lineHeight: 1.05,
          fontWeight: 700,
          letterSpacing: -0.5,
          color: "var(--fg)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>

      {/* QUALIFIER (Good / Fair / Poor) */}
      {qualifier && (
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: TONE_COLORS[qualifierTone],
          }}
        >
          {qualifier}
        </div>
      )}

      {/* DELTA + CONTEXT */}
      {delta && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            color: "var(--fg-muted)",
          }}
        >
          <span
            style={{
              color:
                delta.direction === "up"   ? TONE_COLORS.success
              : delta.direction === "down" ? TONE_COLORS.danger
              : TONE_COLORS.neutral,
              fontWeight: 600,
            }}
          >
            {delta.value}
          </span>
          <span
            aria-hidden="true"
            style={{
              color:
                delta.direction === "up"   ? TONE_COLORS.success
              : delta.direction === "down" ? TONE_COLORS.danger
              : "transparent",
              fontSize: 14,
              lineHeight: 1,
            }}
          >
            {delta.direction === "up" ? "↑" : delta.direction === "down" ? "↓" : ""}
          </span>
          {delta.context && <span>{delta.context}</span>}
        </div>
      )}
    </article>
  );
}
