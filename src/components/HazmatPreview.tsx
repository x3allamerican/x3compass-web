/**
 * Inline marketing-page preview of the X3 Compass Hazmat Center.
 * Real screenshot captured from app.x3compass.com/hazmat (Sprint #441).
 *
 * Replaces the hand-built React mockup (placard + segregation cards) with
 * a single screenshot of the Hazmat Center Overview hero — "One bad placard
 * ends your authority." Matches the DashboardPreview pattern: faux browser
 * chrome wrapper, full-bleed image inside.
 */
export default function HazmatPreview() {
  return (
    <div
      className="rounded-2xl overflow-hidden border border-[var(--border)] shadow-[0_24px_72px_rgba(0,0,0,0.55)]"
      style={{ background: "var(--bg)" }}
    >
      {/* Faux browser chrome — matches DashboardPreview */}
      <div className="flex items-center gap-2 px-4 py-3 bg-[var(--bg-3)] border-b border-[var(--border)]">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
        </div>
        <div className="flex-1 mx-3 px-3 py-1 rounded-md bg-[var(--bg)] border border-[var(--border)] text-[10px] text-[var(--fg-faint)] font-mono truncate">
          app.x3compass.com/hazmat
        </div>
      </div>

      {/* Live Hazmat Center Overview screenshot */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/x3-hazmat-center-overview.png"
        alt="X3 Compass Hazmat Center · One bad placard ends your authority · 2,863 UN substances, 52 DOT placards, 7-day last reg sync, Start 14-Day Trial CTA"
        width={1920}
        height={928}
        decoding="async"
        className="w-full h-auto block"
      />
    </div>
  );
}
