import Link from "next/link";
import SiteShell from "@/components/SiteShell";

export const metadata = {
  title: "Trust & Transparency — X3 Compass",
  description: "Every claim on this site is verifiable. Our open-source skills, attorney-reviewed legal docs, security posture, and the carrier that built Compass — all in one place.",
};

export default function TrustPage() {
  return (
    <SiteShell>
      <div className="bg-[var(--bg)] text-[var(--fg)]">
        {/* HERO */}
        <section className="relative overflow-hidden border-b border-[var(--border)]">
          <div className="absolute inset-0 -z-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/photos/trust-warehouse.jpg" alt="" aria-hidden="true" className="w-full h-full object-cover opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg)]/90 via-[var(--bg)]/95 to-[var(--bg)]" />
          </div>
          <div className="max-w-5xl mx-auto px-6 py-20 text-center relative">
            <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[var(--accent)] mb-4">
              Trust & Transparency
            </div>
            <h1 className="font-extrabold tracking-tight leading-[1.05] text-[40px] sm:text-[56px] md:text-[64px] mb-5">
              Every claim. <span className="serif-italic" style={{ color: "#22D3EE" }}>Verifiable.</span>
            </h1>
            <p className="text-[18px] text-[var(--fg-muted)] max-w-3xl mx-auto leading-relaxed">
              We&apos;re a new product. We don&apos;t have a logo wall of pretend customers. What we have instead
              is open-source code you can inspect, an MC-authorized carrier that uses Compass every day,
              and legal docs your attorney can audit. Everything below is checkable.
            </p>
          </div>
        </section>

        {/* SIX VERIFIABLE TILES */}
        <section className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">

            <a href="https://github.com/x3fleetsafety/skills" target="_blank" rel="noreferrer" className="x3-card x3-card-hover p-6 block">
              <div className="flex items-center gap-3 mb-3">
                <svg className="w-8 h-8 text-[var(--fg-muted)]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.4 3-.405 1.02.005 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                </svg>
                <div className="text-[15px] font-bold text-[var(--fg)]">Open-source skills repo</div>
              </div>
              <p className="text-[13px] text-[var(--fg-muted)] leading-relaxed mb-3">
                Every one of the 100+ published Compass skills lives on GitHub under MIT. Read the prompts. Read the CFR
                citations. Read the git history. If a competitor copied these tomorrow, it would still take them a year to
                catch up because the eval harness + retrieval-grounding stack stays private.
              </p>
              <div className="text-[12px] font-bold text-[var(--accent)]">github.com/x3fleetsafety/skills →</div>
            </a>

            <a href="https://safer.fmcsa.dot.gov/CompanySnapshot.aspx" target="_blank" rel="noreferrer" className="x3-card x3-card-hover p-6 block">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 grid place-items-center font-black text-[12px] text-[var(--accent-fg)] bg-[var(--accent)] rounded">DOT</div>
                <div className="text-[15px] font-bold text-[var(--fg)]">MC-authorized carrier</div>
              </div>
              <p className="text-[13px] text-[var(--fg-muted)] leading-relaxed mb-3">
                X3 Fleet Safety LLC, the company that builds Compass, is an MC-authorized for-hire motor carrier. Look us
                up on FMCSA SAFER. We&apos;re the kind of operator we built this for, and we run our own carrier on this
                exact platform.
              </p>
              <div className="text-[12px] font-bold text-[var(--accent)]">safer.fmcsa.dot.gov →</div>
            </a>

            <div className="x3-card p-6">
              <div className="flex items-center gap-3 mb-3">
                <svg className="w-8 h-8 text-[var(--accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
                <div className="text-[15px] font-bold text-[var(--fg)]">Attorney-reviewed legal</div>
              </div>
              <p className="text-[13px] text-[var(--fg-muted)] leading-relaxed mb-3">
                Our Terms of Service, Privacy Policy, Data Processing Addendum, and Reseller Agreement were drafted using
                our Legal Operating System — three independent review passes targeting 95% confidence. Plus a sit-down with
                a transportation attorney before public launch.
              </p>
              <div className="text-[12px] text-[var(--fg-faint)]">
                <Link href="/legal/terms" className="text-[var(--accent)] hover:underline">Terms</Link> ·{" "}
                <Link href="/legal/privacy" className="text-[var(--accent)] hover:underline">Privacy</Link> ·{" "}
                <Link href="/legal/dpa" className="text-[var(--accent)] hover:underline">DPA</Link>
              </div>
            </div>

            <div className="x3-card p-6">
              <div className="flex items-center gap-3 mb-3">
                <svg className="w-8 h-8 text-[var(--accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <div className="text-[15px] font-bold text-[var(--fg)]">Security posture</div>
              </div>
              <ul className="text-[13px] text-[var(--fg-muted)] leading-relaxed space-y-1">
                <li>• Supabase Postgres with Row-Level Security on every tenant table</li>
                <li>• Cloudflare WAF + DDoS protection in front of every endpoint</li>
                <li>• TLS 1.3 + HSTS · auth tokens never in URLs</li>
                <li>• Stripe handles all payment data — we never see card numbers</li>
                <li>• Per-carrier data isolation enforced at the database, not the API</li>
                <li>• SOC 2 — preparation underway, expected Q4 2026</li>
              </ul>
            </div>

            <div className="x3-card p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 grid place-items-center font-black text-[18px] text-[var(--accent)] bg-[var(--accent)]/10 rounded">§</div>
                <div className="text-[15px] font-bold text-[var(--fg)]">CFR-cited every answer</div>
              </div>
              <p className="text-[13px] text-[var(--fg-muted)] leading-relaxed mb-3">
                Every answer Compass gives cites the exact CFR section. Each citation is round-tripped against the live
                <span className="font-mono"> ecfr.gov </span> registry. If a section is unverified, we tell you — not bury it.
                The eval harness is 60 questions today, growing to 200.
              </p>
              <div className="text-[12px] font-bold text-[var(--accent)]">Baseline accuracy: 85.0% (claude-sonnet-4-6, May 2026)</div>
            </div>

            <div className="x3-card p-6">
              <div className="flex items-center gap-3 mb-3">
                <svg className="w-8 h-8 text-[var(--accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
                <div className="text-[15px] font-bold text-[var(--fg)]">Self-healing platform</div>
              </div>
              <p className="text-[13px] text-[var(--fg-muted)] leading-relaxed mb-3">
                Production has 8 monitors running 24/7: synthetic journeys every 15 min, Cloudflare deploy watcher,
                Stripe webhook health, Supabase advisor, client-error spike detection. When something breaks, an
                autonomous doctor agent diagnoses + auto-resolves before a human sees it.
              </p>
              <div className="text-[12px] text-[var(--fg-faint)]">14 known incident patterns · auto-resolution rate &gt; 80%</div>
            </div>

          </div>
        </section>

        {/* INTEGRATIONS */}
        <section className="border-y border-[var(--border)] bg-[var(--bg-2)] py-12">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[var(--accent)] mb-3 text-center">
              Wired into the tools you already trust
            </div>
            <div className="text-center text-[18px] text-[var(--fg)] font-semibold mb-6">
              Integrations are real OAuth + API connections, not screenshots
            </div>
            <div className="flex flex-wrap justify-center items-center gap-x-10 gap-y-4 text-[16px] font-semibold text-[var(--fg-muted)]">
              <span>Stripe</span><span className="opacity-30">·</span>
              <span>Checkr</span><span className="opacity-30">·</span>
              <span>Anthropic</span><span className="opacity-30">·</span>
              <span>Supabase</span><span className="opacity-30">·</span>
              <span>Cloudflare</span><span className="opacity-30">·</span>
              <span>Resend</span><span className="opacity-30">·</span>
              <span>Twilio</span>
            </div>
          </div>
        </section>

        {/* WHAT WE DON'T DO */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[var(--accent)] mb-3">
            What we don&apos;t do
          </div>
          <h2 className="text-[28px] sm:text-[36px] font-extrabold text-[var(--fg)] mb-5">
            The wedge cuts both ways.
          </h2>
          <ul className="space-y-4 text-[15px] text-[var(--fg)] leading-relaxed">
            <li className="flex gap-3">
              <span className="text-[var(--danger)] font-black mt-0.5">✗</span>
              <span>
                <strong>We don&apos;t practice law.</strong> Every legal-flavored answer Compass gives
                ends with &quot;verify with a transportation attorney for audit-grade interpretation.&quot;
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-[var(--danger)] font-black mt-0.5">✗</span>
              <span>
                <strong>We don&apos;t sell your data.</strong> Carrier compliance data lives in your tenant.
                We don&apos;t aggregate it, sell it to insurance carriers, or train models on it. Period.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-[var(--danger)] font-black mt-0.5">✗</span>
              <span>
                <strong>We don&apos;t lock you in.</strong> One-click full-data export to CSV, anytime.
                You own your data; Compass is the lens.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-[var(--danger)] font-black mt-0.5">✗</span>
              <span>
                <strong>We don&apos;t fake reviews.</strong> No purchased testimonials, no AI-generated &quot;quotes.&quot;
                When real customer testimonials show up here, they&apos;ll have names, photos, and a way to verify the story.
              </span>
            </li>
          </ul>
        </section>

        {/* CTA */}
        <section className="border-t border-[var(--border)] bg-[var(--bg-3)] py-16">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-[28px] sm:text-[36px] font-extrabold text-[var(--fg)] mb-3">
              See the real product.
            </h2>
            <p className="text-[15px] text-[var(--fg-muted)] mb-6">
              7-day free trial. No card. Cancel anytime. Your data exports as CSV on day 8 if it&apos;s not for you.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[15px] text-[var(--accent-fg)] bg-[var(--accent)] hover:bg-[var(--accent-2)]"
            >
              ★ Start free trial →
            </Link>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
