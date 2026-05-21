"use client";

import { useState } from "react";

export type PageGuideStep = {
  /** Step number shown in the circular badge (e.g., 1, 2, 3) */
  n: number;
  /** Short imperative title */
  title: string;
  /** 1-2 sentence detail */
  detail: string;
};

export type PageGuideConfig = {
  /** "What this page does" — single sentence shown at the top of the panel */
  what: string;
  /** "Who needs it" — 1-2 sentences explaining when this matters and which carriers need it */
  who: string;
  /** Primary CFR citation backing this page's compliance scope */
  cfr: string;
  /** "How to get started" — 3-5 ordered steps */
  howTo: PageGuideStep[];
  /** "What to do here every week" — short bullets */
  weeklyHabits?: string[];
  /** Common audit-day pitfalls related to this page */
  auditTraps?: string[];
  /** Link to related skills/playbooks in Compass Ask */
  askCompassLinks?: { label: string; query: string }[];
};

export default function PageGuide(config: PageGuideConfig) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="rounded-2xl border border-[var(--border)] overflow-hidden"
      style={{ background: "linear-gradient(180deg, var(--surface) 0%, var(--surface-3) 100%)" }}
    >
      {/* COLLAPSED HEADER (always visible) */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-start gap-3 px-5 py-4 text-left hover:bg-white/3 transition-colors"
      >
        <div
          className="w-9 h-9 rounded-full grid place-items-center font-black text-[var(--bg)] flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
            boxShadow: "0 4px 12px rgba(34, 211, 238, 0.32)",
          }}
        >
          ?
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] tracking-[.16em] uppercase font-extrabold text-[var(--accent)]/80 mb-1">
            How this page works · <span className="font-mono">{config.cfr}</span>
          </div>
          <div className="text-[var(--fg)] text-[14px] font-bold leading-snug">
            {config.what}
          </div>
        </div>
        <div className="text-[12px] font-semibold text-[var(--accent)] flex-shrink-0 mt-1">
          {open ? "Hide guide ↑" : "Show me how ↓"}
        </div>
      </button>

      {/* EXPANDED CONTENT */}
      {open && (
        <div className="px-5 pb-5 pt-1 border-t border-[var(--border)] grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
          {/* Left column — how-to steps */}
          <div className="space-y-5">
            {/* Who needs it */}
            <div>
              <div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)] mb-1.5">
                Who needs this page
              </div>
              <p className="text-[13px] text-[var(--fg)] leading-relaxed">{config.who}</p>
            </div>

            {/* How-to steps */}
            <div>
              <div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)] mb-3">
                How to get started · 3 paths
              </div>
              <ol className="space-y-3">
                {config.howTo.map((s) => (
                  <li key={s.n} className="flex gap-3">
                    <div
                      className="w-6 h-6 rounded-full grid place-items-center font-black text-[11px] text-[var(--bg)] flex-shrink-0 mt-0.5"
                      style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
                    >
                      {s.n}
                    </div>
                    <div className="flex-1">
                      <div className="text-[var(--fg)] text-[13px] font-bold mb-0.5">{s.title}</div>
                      <div className="text-[12.5px] text-[var(--fg-muted)] leading-relaxed">{s.detail}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Weekly habits */}
            {config.weeklyHabits && config.weeklyHabits.length > 0 && (
              <div>
                <div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)] mb-2">
                  Once you&apos;re set up — weekly habit
                </div>
                <ul className="space-y-1.5">
                  {config.weeklyHabits.map((h, i) => (
                    <li key={i} className="text-[12.5px] text-[var(--fg)] leading-relaxed pl-5 relative">
                      <span className="absolute left-0 top-1 text-[var(--accent)] font-bold">✓</span>
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right column — audit traps + Ask Compass */}
          <div className="space-y-5">
            {config.auditTraps && config.auditTraps.length > 0 && (
              <div
                className="rounded-xl p-4 border"
                style={{
                  background: "linear-gradient(135deg, rgba(251, 191, 36, 0.08), rgba(15, 28, 50, 0.5))",
                  borderColor: "rgba(251, 191, 36, 0.30)",
                }}
              >
                <div className="text-[10px] tracking-[.14em] uppercase font-extrabold text-amber-700 dark:text-amber-300 mb-2">
                  ⚠ Common audit-day pitfalls
                </div>
                <ul className="space-y-1.5">
                  {config.auditTraps.map((t, i) => (
                    <li key={i} className="text-[12px] text-[var(--fg-muted)] leading-relaxed pl-4 relative">
                      <span className="absolute left-0 top-0 text-amber-700 dark:text-amber-300">•</span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {config.askCompassLinks && config.askCompassLinks.length > 0 && (
              <div className="rounded-xl p-4 border border-[var(--accent)]/30" style={{ background: "rgba(34, 211, 238, 0.05)" }}>
                <div className="text-[10px] tracking-[.14em] uppercase font-extrabold text-[var(--accent)] mb-3">
                  ∞ Ask Compass about this
                </div>
                <div className="space-y-1.5">
                  {config.askCompassLinks.map((l, i) => (
                    <a
                      key={i}
                      href={`/app/ask?q=${encodeURIComponent(l.query)}`}
                      className="block text-[12px] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-white/5 rounded px-2 py-1.5 leading-snug transition-colors"
                    >
                      <span className="text-[var(--accent)] font-bold">→</span> {l.label}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
