"use client";

/* ============================================================
   X3 COMPASS · HAZMAT PILL BAR
   ------------------------------------------------------------
   Compact 2-pill bar shown at the top of pages that already
   have a lot of content (like Placard Wizard). Both pills open
   centered modals:
     · 📚 Education Hub  → EducationHubModal (audience cards)
     · 🤖 Ask AI Concierge → ConciergeModal (chat)
   ============================================================ */

import type { Audience } from "@/components/EducationHubCard";

type Props = {
  surface: string;
  subtitle?: string;
  audiences: Audience[];
  conciergeHref?: string;
};

export default function HazmatPillBar({ surface, subtitle, audiences, conciergeHref = "/ask?context=hazmat" }: Props) {
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
      style={{
        display: "flex",
        gap: 10,
        marginBottom: 18,
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      <button type="button" onClick={openEduHub} aria-label={`${surface} Education Hub`} style={pillStyle("ghost")}>
        <span aria-hidden style={{ fontSize: 15 }}>📚</span>
        <span>Education Hub</span>
      </button>
      <button type="button" onClick={openConcierge} aria-label="Ask AI Concierge" style={pillStyle("solid")}>
        <span aria-hidden style={{ fontSize: 15 }}>🤖</span>
        <span>Ask AI Concierge</span>
      </button>
    </div>
  );
}

function pillStyle(variant: "ghost" | "solid"): React.CSSProperties {
  if (variant === "solid") {
    return {
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
    };
  }
  return {
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
  };
}
