"use client";

/* ============================================================
   X3 COMPASS · EDUCATION HUB MODAL
   ------------------------------------------------------------
   Companion to ConciergeModal. Centered modal that shows the
   3 audience cards (For Drivers / For Employers / For
   Compliance Officers). Opened by dispatching:

     window.dispatchEvent(new CustomEvent('x3:open-education-hub', {
       detail: { surface, subtitle, audiences, conciergeHref }
     }));

   Used on pages where the inline Education Hub takes too much
   space (e.g., Placard Wizard) so the page surfaces just a
   small "Education Hub" pill that opens this modal on click.
   ============================================================ */

import { useEffect, useState } from "react";
import type { Audience, AudienceTone } from "./EducationHubCard";

type OpenDetail = {
  surface: string;
  subtitle?: string;
  audiences: Audience[];
  conciergeHref?: string;
};

const TONE_STRIPE: Record<AudienceTone, string> = {
  cyan: "linear-gradient(90deg, #16C7FF, #16C7FF)",
  violet: "linear-gradient(90deg, #A78BFA, #8B5CF6)",
  amber: "linear-gradient(90deg, #FBBF24, #F59E0B)",
  emerald: "linear-gradient(90deg, #34D399, #10B981)",
};

export default function EducationHubModal() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<OpenDetail | null>(null);

  useEffect(() => {
    function onOpen(e: Event) {
      const detail = (e as CustomEvent<OpenDetail>).detail;
      if (!detail) return;
      setData(detail);
      setOpen(true);
    }
    window.addEventListener("x3:open-education-hub", onOpen as EventListener);
    return () => window.removeEventListener("x3:open-education-hub", onOpen as EventListener);
  }, []);

  // Body-scroll lock + ESC
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!open || !data) return null;

  function askConcierge() {
    if (!data) return;
    setOpen(false);
    let context: string | undefined;
    try {
      const url = new URL(data.conciergeHref || "/app/ask", "https://x3compass.com");
      context = url.searchParams.get("context") || undefined;
    } catch { /* no-op */ }
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("x3:open-concierge", { detail: { context } }));
    }, 80);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${data.surface} Education Hub`}
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.78)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "min(1080px, 100%)",
          maxHeight: "min(800px, calc(100vh - 48px))",
          background: "#000000",
          border: "1px solid rgba(22, 199, 255, 0.35)",
          borderRadius: 16,
          boxShadow: "0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(22, 199, 255, 0.08)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 22px",
            borderBottom: "1px solid rgba(22, 199, 255, 0.18)",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
            <span aria-hidden style={{ fontSize: 18 }}>🛡</span>
            <h2 style={{ margin: 0, color: "#16C7FF", fontSize: 13, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase" }}>
              {data.surface} · Education Hub
            </h2>
            {data.subtitle && (
              <span style={{ fontSize: 12, color: "#94A3B8" }}>{data.subtitle}</span>
            )}
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              type="button"
              onClick={askConcierge}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 18px",
                borderRadius: 999,
                background: "linear-gradient(135deg, #16C7FF, #16C7FF)",
                border: 0,
                color: "#000000",
                fontWeight: 800,
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <span aria-hidden style={{ fontSize: 15 }}>🤖</span> Ask AI Concierge
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close education hub"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#CBD5E1",
                borderRadius: 8,
                width: 32,
                height: 32,
                cursor: "pointer",
                fontSize: 16,
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>
        </header>

        {/* Body — 3 audience cards */}
        <div style={{ flex: 1, overflowY: "auto", padding: 22 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {data.audiences.map((a) => (
              <AudienceColumn key={a.label} a={a} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AudienceColumn({ a }: { a: Audience }) {
  const stripe = TONE_STRIPE[a.tone || "cyan"];
  return (
    <article
      style={{
        position: "relative",
        background: "#0F1F35",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 12,
        padding: "18px 18px 14px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <span
        aria-hidden
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: stripe }}
      />
      <header style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {a.icon && <span aria-hidden style={{ fontSize: 14 }}>{a.icon}</span>}
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#F8FAFC" }}>{a.label}</div>
          {a.subtitle && (
            <div style={{ fontSize: 9.5, fontWeight: 700, color: "#94A3B8", letterSpacing: 1.2, textTransform: "uppercase", marginTop: 2 }}>
              {a.subtitle}
            </div>
          )}
        </div>
      </header>
      <p style={{ fontSize: 12.5, color: "#CBD5E1", lineHeight: 1.55, margin: 0 }}>{a.body}</p>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
        {a.bullets.map((b, i) => (
          <li key={i} style={{ display: "flex", gap: 8, color: "#CBD5E1", fontSize: 12 }}>
            <span aria-hidden style={{ color: "#16C7FF" }}>•</span> {b}
          </li>
        ))}
      </ul>
      {/* Primary CTA — opens the headline PDF for this audience. */}
      <a
        href={a.href}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          marginTop: 4,
          display: "block",
          textAlign: "center",
          padding: "9px 12px",
          borderRadius: 8,
          background: "rgba(22, 199, 255, 0.12)",
          border: "1px solid rgba(22, 199, 255, 0.30)",
          color: "#16C7FF",
          fontSize: 11.5,
          fontWeight: 700,
          textDecoration: "none",
        }}
      >
        {a.cta}
      </a>

      {/* Additional PDFs · stacked list of related resources. The 60-PDF
       *  task #262 library means each audience can ship 4-6 links of real
       *  branded reference material instead of a single CTA. */}
      {a.pdfs && a.pdfs.length > 0 && (
        <div
          style={{
            marginTop: 8,
            paddingTop: 10,
            borderTop: "1px dashed rgba(255,255,255,0.10)",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <div
            style={{
              fontSize: 9.5,
              fontWeight: 700,
              color: "#94A3B8",
              letterSpacing: 1.2,
              textTransform: "uppercase",
            }}
          >
            More resources
          </div>
          {a.pdfs.map((p) => (
            <a
              key={p.href}
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 11.5,
                color: "#CBD5E1",
                textDecoration: "none",
                padding: "5px 4px",
                borderRadius: 6,
              }}
            >
              <span aria-hidden style={{ fontSize: 13 }}>📄</span>
              <span style={{ flex: 1 }}>{p.label}</span>
              <span aria-hidden style={{ color: "#16C7FF", fontWeight: 700 }}>→</span>
            </a>
          ))}
        </div>
      )}
    </article>
  );
}
