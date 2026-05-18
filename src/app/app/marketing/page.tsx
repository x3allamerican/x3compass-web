"use client";
import AppShell from "@/components/AppShell";

export default function MarketingPage() {
  return (
    <AppShell title="Marketing" crumbs="Compass marketing & referral surface for your carrier">
      <div className="px-6 py-6 space-y-6 bg-[var(--bg)] min-h-screen">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="x3-card p-4"><div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)]">Referrals YTD</div><div className="text-[28px] font-black text-[var(--fg)]">3</div></div>
          <div className="x3-card p-4"><div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)]">Referral credits earned</div><div className="text-[28px] font-black text-[var(--success)]">$540</div></div>
          <div className="x3-card p-4"><div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)]">Recruiting page views</div><div className="text-[28px] font-black text-[var(--fg)]">412</div><div className="text-[11px] text-[var(--fg-muted)]">last 30 days</div></div>
          <div className="x3-card p-4"><div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)]">Applicants started</div><div className="text-[28px] font-black text-[var(--fg)]">28</div><div className="text-[11px] text-[var(--fg-muted)]">last 30 days</div></div>
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="x3-card p-5">
            <div className="text-[15px] font-extrabold text-[var(--fg)] mb-3">Recruiting landing page</div>
            <p className="text-[13px] text-[var(--fg-muted)] leading-relaxed mb-3">Public recruiting page with your DOT number, safety rating, equipment list, pay range, benefits, and your X3 Compass attorney-reviewed app. Branded with your colors.</p>
            <div className="rounded-lg border border-[var(--border)] p-3 bg-[var(--surface-2)]">
              <div className="text-[11px] text-[var(--fg-muted)]">Your public URL</div>
              <div className="text-[13px] text-[var(--accent)] font-mono mt-1">x3compass.com/c/x3-fleet-safety</div>
            </div>
          </div>
          <div className="x3-card p-5">
            <div className="text-[15px] font-extrabold text-[var(--fg)] mb-3">Referral program</div>
            <p className="text-[13px] text-[var(--fg-muted)] leading-relaxed mb-3">Refer another carrier. They get a 30-day trial; you get $200 in account credit after their first invoice clears.</p>
            <div className="rounded-lg border border-[var(--border)] p-3 bg-[var(--surface-2)]">
              <div className="text-[11px] text-[var(--fg-muted)]">Your referral link</div>
              <div className="text-[13px] text-[var(--accent)] font-mono mt-1">x3compass.com/r/x3-fleet</div>
            </div>
          </div>
          <div className="x3-card p-5">
            <div className="text-[15px] font-extrabold text-[var(--fg)] mb-3">Email templates</div>
            <ul className="text-[13px] text-[var(--fg-muted)] space-y-2 leading-relaxed">
              <li>• Driver hiring announcement</li>
              <li>• Annual safety reminder to drivers</li>
              <li>• Insurance renewal — what to send your broker</li>
              <li>• Customer trust packet — pre-bid</li>
            </ul>
          </div>
          <div className="x3-card p-5">
            <div className="text-[15px] font-extrabold text-[var(--fg)] mb-3">Customer trust packet</div>
            <p className="text-[13px] text-[var(--fg-muted)] leading-relaxed mb-3">One-click PDF for shippers / brokers / direct customers: your safety rating, BIPD coverage, 24-mo crash record, OOS rates vs. national average. Pulled live from FMCSA.</p>
            <button className="px-4 py-2 rounded-lg font-extrabold text-[13px] text-[var(--accent-fg)]" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>Generate trust packet →</button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
