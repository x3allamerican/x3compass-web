import Link from "next/link";
import SiteShell from "@/components/SiteShell";

export const metadata = {
  title: "Lost? — X3 Compass",
};

export default function NotFound() {
  return (
    <SiteShell>
      <div className="bg-[var(--bg)] text-[var(--fg)] min-h-[70vh] grid place-items-center">
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <div className="text-[120px] sm:text-[160px] font-black leading-none text-[var(--accent)] tabular-nums">404</div>
          <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[var(--fg-muted)] mb-3 mt-4">
            Off route
          </div>
          <h1 className="text-[32px] sm:text-[44px] font-extrabold tracking-tight leading-tight mb-4">
            We took a wrong turn.{" "}
            <span className="serif-italic" style={{ color: "var(--accent)" }}>You didn&apos;t.</span>
          </h1>
          <p className="text-[16px] text-[var(--fg-muted)] mb-8">
            The page you&apos;re looking for either moved or never existed. Here are the routes most carriers
            land on. If you got here from a link in our docs, <a href="mailto:joshua@x3compass.com" className="text-[var(--accent)] hover:underline">tell us</a>.
          </p>
          <div className="grid sm:grid-cols-2 gap-3 max-w-md mx-auto mb-8">
            <Link href="/" className="x3-card x3-card-hover p-4 text-left">
              <div className="text-[12px] font-bold text-[var(--accent)] mb-1">Home →</div>
              <div className="text-[12px] text-[var(--fg-muted)]">Try the live Ask Compass demo</div>
            </Link>
            <Link href="/pricing" className="x3-card x3-card-hover p-4 text-left">
              <div className="text-[12px] font-bold text-[var(--accent)] mb-1">Pricing →</div>
              <div className="text-[12px] text-[var(--fg-muted)]">$25 DIY · $50 DFY · 7-day trial</div>
            </Link>
            <Link href="/hazmat" className="x3-card x3-card-hover p-4 text-left">
              <div className="text-[12px] font-bold text-[var(--accent)] mb-1">Hazmat Center →</div>
              <div className="text-[12px] text-[var(--fg-muted)]">Real DOT placards + interactive wizard</div>
            </Link>
            <Link href="/blog/cfr-accuracy-baseline" className="x3-card x3-card-hover p-4 text-left">
              <div className="text-[12px] font-bold text-[var(--accent)] mb-1">Latest blog →</div>
              <div className="text-[12px] text-[var(--fg-muted)]">How we got to 85% CFR accuracy</div>
            </Link>
          </div>
          <div className="text-[13px] text-[var(--fg-faint)]">
            <Link href="/" className="text-[var(--accent)] font-bold hover:underline">← Back to safety (home)</Link>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
