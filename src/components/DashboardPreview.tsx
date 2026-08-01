/**
 * Inline marketing-page preview of the X3 Compass app dashboard.
 * Real screenshot captured from app.x3compass.com (Sprint #427).
 * Personal name masked → "Demo Account / Fleet Manager".
 * Sidebar groups collapsed for a clean read.
 */
export default function DashboardPreview() {
  return (
    <div
      className="rounded-2xl overflow-hidden border border-[var(--border)] shadow-[0_24px_72px_rgba(0,0,0,0.55)]"
      style={{ background: "var(--bg)" }}
    >
      {/* Faux browser chrome */}
      <div className="flex items-center gap-2 px-4 py-3 bg-[var(--bg-3)] border-b border-[var(--border)]">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
        </div>
        <div className="flex-1 mx-3 px-3 py-1 rounded-md bg-[var(--bg)] border border-[var(--border)] text-[10px] text-[var(--fg-faint)] font-mono truncate">
          app.x3compass.com/dashboard
        </div>
      </div>

      {/* Live dashboard screenshot · 1920×928 native */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/x3-compass-dashboard-v2.png"
        alt="X3 Compass dashboard · Compliance Health, Active Drivers, Open Alerts, DQ Score, Compliance Overview, Action Items, CSA Scores"
        width={1920}
        height={928}
        decoding="async"
        className="w-full h-auto block"
      />
    </div>
  );
}
