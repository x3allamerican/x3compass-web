/**
 * Inline marketing-page preview of the X3 Compass app dashboard.
 * Static, non-interactive, no auth required — gives a visitor an
 * accurate read on what lives inside the paid product.
 */
export default function DashboardPreview() {
  return (
    <div className="rounded-2xl overflow-hidden border border-[var(--border)] shadow-[0_24px_72px_rgba(0,0,0,0.55)]" style={{ background: "var(--bg)" }}>
      {/* Faux browser chrome */}
      <div className="flex items-center gap-2 px-4 py-3 bg-[var(--bg-3)] border-b border-[var(--border)]">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
        </div>
        <div className="flex-1 mx-3 px-3 py-1 rounded-md bg-[var(--bg)] border border-[var(--border)] text-[10px] text-[var(--fg-faint)] font-mono truncate">
          x3compass.com/app
        </div>
      </div>

      {/* App body */}
      <div className="grid grid-cols-[180px_1fr] max-md:grid-cols-1">
        {/* Sidebar */}
        <aside className="bg-[var(--surface)] border-r border-[var(--border)] p-3 max-md:hidden">
          <div className="text-[8px] tracking-[.16em] uppercase font-extrabold text-[var(--accent)] px-2 mb-2">
            Workspace
          </div>
          <div className="space-y-0.5">
            {[
              { i: "▦", t: "Dashboard", active: true },
              { i: "👤", t: "Drivers" },
              { i: "🚛", t: "Vehicles" },
              { i: "📁", t: "DQ Files" },
              { i: "🚨", t: "Accidents" },
              { i: "🔎", t: "Inspections" },
              { i: "🧪", t: "Drug & Alcohol" },
              { i: "⏱", t: "HOS / ELD" },
              { i: "🎓", t: "Training" },
            ].map((n, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 px-2 py-1.5 rounded text-[11px] font-semibold ${
                  n.active
                    ? "bg-[var(--accent)]/15 text-[var(--fg)] border-l-2 border-[var(--accent)]"
                    : "text-[var(--fg-muted)]"
                }`}
              >
                <span className="text-[11px] w-4 text-center">{n.i}</span>
                <span>{n.t}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* Main */}
        <div className="min-w-0">
          {/* Page header */}
          <header className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="text-[8px] tracking-[.14em] uppercase font-extrabold text-[var(--accent)] mb-0.5">
                DASHBOARD · APEX LOGISTICS · 38 TRUCKS · 72 DRIVERS
              </div>
              <h3 className="text-[var(--fg)] font-extrabold text-[15px]">Good morning, Joshua</h3>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 rounded-full">
              ● All systems green
            </span>
          </header>

          {/* Body */}
          <div className="p-4 space-y-4">
            {/* KPI strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { l: "CSA · Unsafe", v: "62", sub: "% percentile", c: "#22D3EE", arrow: "▼ 4" },
                { l: "CSA · HOS", v: "78", sub: "% percentile", c: "#FBBF24", arrow: "▲ 2" },
                { l: "Expirations · 30d", v: "5", sub: "items due", c: "#A78BFA", arrow: "" },
                { l: "OOS rate", v: "2.4%", sub: "vs 4.1% peer", c: "#10B981", arrow: "▼" },
              ].map((k, i) => (
                <div key={i} className="rounded-xl p-3 border border-[var(--border)]" style={{ background: "linear-gradient(180deg, var(--surface) 0%, var(--surface-3) 100%)" }}>
                  <div className="text-[8.5px] tracking-[.14em] uppercase font-bold text-[var(--fg-faint)] mb-0.5">{k.l}</div>
                  <div className="flex items-baseline gap-1.5">
                    <div className="text-[20px] font-black leading-none" style={{ color: k.c }}>{k.v}</div>
                    {k.arrow && <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-300">{k.arrow}</span>}
                  </div>
                  <div className="text-[8.5px] text-[var(--fg-faint)] mt-0.5">{k.sub}</div>
                </div>
              ))}
            </div>

            {/* Compass nudge */}
            <div
              className="rounded-xl p-3 border flex items-start gap-2.5"
              style={{
                background: "linear-gradient(135deg, rgba(34, 211, 238, 0.10), rgba(15, 28, 50, 0.5))",
                borderColor: "rgba(34, 211, 238, 0.30)",
              }}
            >
              <div
                className="w-6 h-6 rounded-full grid place-items-center text-[var(--bg)] font-black text-[11px] flex-shrink-0"
                style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
              >
                ∞
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[var(--fg)] text-[11px] font-bold mb-0.5">
                  Compass · today&apos;s priority
                </div>
                <div className="text-[10.5px] text-[var(--fg)] leading-relaxed">
                  Ricardo&apos;s medical cert expires <strong className="text-amber-700 dark:text-amber-300">in 9 days</strong>. I drafted a reminder + scheduled it for tomorrow 7am.
                </div>
              </div>
              <button className="text-[10px] font-bold text-[var(--accent)] whitespace-nowrap">Approve →</button>
            </div>

            {/* Driver activity row */}
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--fg-muted)] mb-2">
                Driver status · live
              </div>
              <div className="space-y-1.5">
                {[
                  { i: "JM", n: "Jared Martinez", s: "Driving · I-40 OK · 5.5h left", c: "#10B981" },
                  { i: "RT", n: "Ricardo Torres", s: "★ approaching 14h · break in 12 min", c: "#F87171" },
                  { i: "EP", n: "Emma Park", s: "Sleeper · TX · split 7+3", c: "#A78BFA" },
                  { i: "DR", n: "Diego Ramirez", s: "Driving · I-95 FL · 7.5h available", c: "#10B981" },
                ].map((d, i) => (
                  <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-[var(--border)] text-[10.5px]" style={{ background: "var(--surface-3)" }}>
                    <div className="w-6 h-6 rounded-full grid place-items-center font-extrabold text-[9px] text-[var(--bg)] flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${d.c}, #22D3EE)` }}>
                      {d.i}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[var(--fg)] font-bold truncate">{d.n}</div>
                      <div className="text-[var(--fg-muted)] truncate">{d.s}</div>
                    </div>
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: d.c, boxShadow: `0 0 6px ${d.c}` }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
