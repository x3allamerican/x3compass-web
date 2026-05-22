import Link from "next/link";
import SiteShell from "@/components/SiteShell";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Partners — 30% rev-share white-label reseller program",
  description: "DOT compliance consultants: white-label X3 Compass under your brand. Keep 60-70% of carrier subscriptions. Done-for-you consultant website + Legal-OS-drafted client contracts.",
  openGraph: {
    title: "X3 Compass Partners — 30% white-label reseller",
    description: "Your brand, your domain, your colors. We power the compliance brain. Keep 60-70% of every carrier you sign.",
    type: "website",
  },
};
const COMPONENTS = [
  { n: "01", title: "White-label dashboard", badge: "YOUR BRAND",
    desc: "Your logo, your domain, your colors. Carrier clients log into your platform — never see X3 Compass branding. Powered by Compass behind the scenes.",
    retail: "~$3,500 custom build" },
  { n: "02", title: "Unlimited carrier client seats", badge: "NO CAPS",
    desc: "30% of whatever you charge your carriers, $10/driver floor. Add 1 carrier or 200 — same simple split. You set retail; you keep 60-70%.",
    retail: "Competitors charge $99-200/seat" },
  { n: "03", title: "Done-for-you consultant website", badge: "DEPLOY IN 1 DAY",
    desc: "Polished one-page website with your photo, bio, services. Lead capture + Calendly built in. Most safety consultants have no site or a 2008-era one — yours is live tomorrow.",
    retail: "$2,500-5,000 custom" },
  { n: "04", title: "Client contracts + proposals", badge: "LEGAL OS DRAFTED",
    desc: "Master Services Agreement, Scope of Work templates per service tier, engagement letter, proposal generator. Drafted using X3's three-pass Legal OS — citation-disciplined.",
    retail: "$1,500-2,500 from small-business attorney" },
  { n: "05", title: '"First Carrier in 60 Days" sprint', badge: "LIVE · WEEKLY",
    desc: "8-week live cohort with new Partners. Positioning, pricing, prospecting, cold outreach, discovery, proposal close, onboarding. From zero to first paying carrier in 60 days.",
    retail: "$2,000-5,000 similar programs" },
  { n: "06", title: "Dedicated success manager", badge: "EMAIL ACCESS",
    desc: "An X3 success manager handles escalations, helps with first-carrier onboardings, surfaces product-roadmap requests. Email-first; calls on request.",
    retail: "Most platforms make you wait in support queues" },
  { n: "07", title: "Priority compute + 10× quota", badge: "NO WAITING",
    desc: "Your Compass Ask queries run at higher priority than Direct customers. 10× the daily quota. Live audit prep with your client doesn't slow down.",
    retail: "Built into the program" },
  { n: "08", title: "Reseller commercial license", badge: "UNLIMITED",
    desc: "Full commercial license to resell Compass as a service to motor carriers. White-label, co-brand, publish carrier-facing marketing referencing Compass. Sublicensing to your carriers included.",
    retail: "Not offered by competitors" },
  { n: "09", title: "Operator-only community", badge: "PEER-TO-PEER",
    desc: "Partner-only Slack/Discord. Deal swaps. Best-practice sharing. Quarterly in-person meetup (optional).",
    retail: "Industry peer groups charge $2K-5K/yr" },
  { n: "10", title: "Monthly office hours with founder", badge: "FOUNDER ACCESS",
    desc: "60-minute monthly call with X3 Compass Team + the product team. Roadmap preview, Q&A, feature requests heard directly. Partners' #1 referenced reason for upgrading from Direct.",
    retail: "Founder access at scale ≈ priceless" },
  { n: "11", title: "Carrier outreach toolkit", badge: "SCRIPTS+SEQUENCES",
    desc: "Cold-email templates, LinkedIn sequences, carrier-discovery scripts, proposal frameworks. Pre-built for the safety-consultant-to-motor-carrier sale.",
    retail: "$500-1,500 from agencies" },
  { n: "12", title: "Plus everything Direct gets", badge: "FULL PRODUCT",
    desc: "All 12 brains, 300 skills, vendor integrations, audit export, hazmat add-on at wholesale, continuous updates. Partners are first-in-line for new features.",
    retail: "$25/driver Direct retail" },
];

const FAQ = [
  {
    q: "What does Compass Partner cost?",
    a: "30% of whatever you charge your carriers, with a $10/driver/month floor. No base subscription, no carrier-count cap, no minimums. You set retail (typical: $25-50/driver) and keep 60-70% on every driver. Example: you charge a carrier $50/driver — X3 takes $15, you keep $35.",
  },
  {
    q: "Who is Compass Partner for?",
    a: "Independent safety consultants, fractional safety directors, DOT compliance consultants, retired FMCSA / state DOT inspectors who hung a shingle, insurance loss-control reps who expanded into consulting, and boutique consulting firms (1-15 people) serving motor carriers.",
  },
  {
    q: "How is this different from JJ Keller, Foley, or Motive partner programs?",
    a: "Three differences: (1) we white-label fully — your brand on the dashboard, your domain, your colors. JJ Keller and Foley do not. (2) Flat-base pricing — you don't pay per seat. (3) Our skill corpus is open-source on GitHub — you can audit every CFR citation Compass makes.",
  },
  {
    q: "What if I'm a 1-person consultant just starting out?",
    a: "You're the ideal Partner. The First-Carrier-in-60-Days sprint is designed for exactly your situation. We've structured the program so you can break even after your second carrier signed.",
  },
  {
    q: "Can I keep using my existing tools (e.g., Foley, JJ Keller)?",
    a: "Yes — Compass Partner doesn't require exclusivity. Many Partners use Compass for AI-native compliance research + their existing vendor for one specific function (e.g., Foley for DQ files only). Over time, most converge to Compass-only.",
  },
  {
    q: "What's the contract term?",
    a: "First 90 days month-to-month (you can leave anytime). After that, annual commitment with monthly billing.",
  },
  {
    q: "Do you offer referral bonuses?",
    a: "Yes — refer another safety consultant who becomes an approved Partner AND closes their first paying carrier, and you earn $500 cash OR 2 months of fee waiver (your choice), capped at 5 referrals per year. We don't run a multi-level / sub-partner program — every Partner contracts directly with X3.",
  },
  {
    q: "What's the approval process?",
    a: "Submit the application form below. We schedule a 30-minute interview to confirm fit (current consulting business, # of clients, experience, why X3). We approve ~60-70% of qualified applicants. From application to live Partner: typically 5-10 business days.",
  },
];

const cardDark = "bg-[var(--surface)] border border-[var(--border)] rounded-2xl hover:border-[var(--accent)]/40 transition-colors";
const ctaCyan = { background: "linear-gradient(135deg, var(--accent), var(--accent-2))", boxShadow: "0 6px 18px rgba(34, 211, 238, 0.32)" };

export default function PartnersPage() {
  return (
    <SiteShell>
      <div className="bg-[var(--bg)] text-[var(--fg)]">
        {/* HERO with real handshake photo */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/photos/partners-handshake.jpg" alt="" aria-hidden="true" width="2400" height="1600" loading="lazy" decoding="async" className="w-full h-full object-cover opacity-25" />
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg)]/80 via-[var(--bg)]/90 to-[var(--bg)]" />
          </div>
          <div className="max-w-7xl mx-auto px-6 pt-20 pb-20 relative">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-block text-[11px] tracking-[.18em] uppercase font-bold text-[var(--accent)] mb-6">
                COMPASS PARTNER · WHITE-LABEL RESELLER PROGRAM
              </div>
              <h1 className="font-extrabold text-[var(--fg)] tracking-tight leading-[1.05] text-[44px] sm:text-[56px] md:text-[64px] mb-6">
                You run the carriers.
                <br />
                <span className="serif-italic" style={{ color: "var(--accent)" }}>We run the platform.</span>
              </h1>
              <p className="text-[18px] text-[var(--fg-muted)] max-w-2xl mx-auto mb-8 leading-relaxed">
                A white-label AI compliance platform for independent safety consultants. Your brand on the dashboard. Your carriers log into <em>your</em> tool. Powered by 300 published FMCSA skills + 12 specialized brains, sitting invisibly behind your business.
              </p>
              <div className="flex gap-3 justify-center flex-wrap mb-4">
                <Link href="#apply" className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[15px] text-[var(--bg)]" style={ctaCyan}>
                  ★ Apply to become a Partner →
                </Link>
                <Link href="#components" className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[15px] text-[var(--fg)] border border-white/25 hover:bg-white/5">
                  See what&apos;s included
                </Link>
              </div>
              <div className="text-[12px] tracking-[.18em] uppercase font-bold text-[var(--fg-faint)]">
                30% OF RETAIL · $10/DRIVER FLOOR · NO BASE FEE · NO CAPS · 90-DAY MONTH-TO-MONTH START
              </div>
            </div>
          </div>
        </section>

        {/* STAT BAND */}
        <section className="border-y border-[var(--border)] bg-[var(--bg-3)]">
          <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { n: "30%", desc: "Of whatever you charge your carriers — you keep 60-70% on every driver" },
              { n: "$10", desc: "Per-driver floor — protects X3 economics on low-retail-tier carriers" },
              { n: "60 days", desc: "From sign-up to your first paying carrier (median across beta Partners)" },
            ].map((s, i) => (
              <div key={i} className="text-center md:text-left">
                <div className="text-[64px] sm:text-[72px] font-black leading-none" style={{ color: "var(--accent)" }}>{s.n}</div>
                <div className="serif-italic text-[var(--fg-muted)] text-[17px] mt-2 leading-snug">{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* WHO IT'S FOR */}
        <section className="max-w-7xl mx-auto px-6 py-24">
          <div className="inline-flex gap-1 mb-3">
            <span className="w-7 h-[3px] bg-[var(--accent)]" />
            <span className="w-7 h-[3px] bg-white/30" />
          </div>
          <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[var(--accent)] mb-2">01 · WHO COMPASS PARTNER IS FOR</div>
          <h2 className="text-[40px] sm:text-[48px] font-extrabold tracking-tight text-[var(--fg)] mb-3 leading-tight">
            If you advise carriers,{" "}
            <span className="serif-italic" style={{ color: "var(--accent)" }}>Compass becomes your stack.</span>
          </h2>
          <p className="text-[17px] text-[var(--fg-muted)] max-w-3xl mb-12">
            We built Compass Partner for the consultants who already do the work — and need a platform that doesn&apos;t have a competitor&apos;s name plastered across it.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { t: "Independent safety consultants", d: "You serve 3-30 motor carriers and bill $500-3,000/mo per carrier. Compass replaces your spreadsheet stack." },
              { t: "Retired FMCSA / state DOT inspectors", d: "You hung a shingle after retiring. You need a platform that signals professionalism without years of build." },
              { t: "Fractional safety directors", d: "You're embedded part-time at 4-10 fleets. Compass gives every fleet the same dashboard — yours." },
              { t: "Insurance loss-control reps moonlighting as consultants", d: "Your day job pays the bills; consulting is the upside. Compass lets you serve 5x more side clients with less time." },
            ].map((p, i) => (
              <div key={i} className={`${cardDark} p-6`}>
                <h3 className="text-[16px] font-extrabold text-[var(--fg)] mb-2">{p.t}</h3>
                <p className="text-[13.5px] text-[var(--fg-muted)] leading-relaxed">{p.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 12 COMPONENTS */}
        <section id="components" className="bg-[var(--bg-3)] border-y border-[var(--border)] py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="inline-flex gap-1 mb-3">
              <span className="w-7 h-[3px] bg-[var(--accent)]" />
              <span className="w-7 h-[3px] bg-white/30" />
            </div>
            <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[var(--accent)] mb-2">02 · WHAT&apos;S INSIDE COMPASS PARTNER</div>
            <h2 className="text-[40px] sm:text-[48px] font-extrabold tracking-tight text-[var(--fg)] mb-3 leading-tight">
              12 components.{" "}
              <span className="serif-italic" style={{ color: "var(--accent)" }}>One subscription.</span>
            </h2>
            <p className="text-[17px] text-[var(--fg-muted)] max-w-3xl mb-12">
              Each component, valued at retail what an independent consultant would pay to acquire it separately — combined retail value ~$15K initial + $1-2K/mo recurring. Compass Partner delivers all 12 for a single 30% revenue share (no base fee, no minimum, no caps).
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {COMPONENTS.map((c) => (
                <div key={c.n} className={`${cardDark} p-6`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[28px] font-black" style={{ color: "var(--accent)" }}>{c.n}</div>
                    <span className="text-[9.5px] font-extrabold tracking-wider text-[var(--bg)] bg-[var(--accent)] px-2 py-1 rounded-full">{c.badge}</span>
                  </div>
                  <h3 className="text-[17px] font-bold text-[var(--fg)] mb-2 leading-snug">{c.title}</h3>
                  <p className="text-[13px] text-[var(--fg-muted)] leading-relaxed mb-3">{c.desc}</p>
                  <div className="text-[10.5px] text-[var(--fg-faint)] pt-3 border-t border-[var(--border)]">
                    Retail: <span className="text-[var(--fg-muted)]">{c.retail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ECONOMICS */}
        <section className="max-w-7xl mx-auto px-6 py-24">
          <div className="inline-flex gap-1 mb-3">
            <span className="w-7 h-[3px] bg-[var(--accent)]" />
            <span className="w-7 h-[3px] bg-white/30" />
          </div>
          <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[var(--accent)] mb-2">03 · YOUR ECONOMICS</div>
          <h2 className="text-[40px] sm:text-[48px] font-extrabold tracking-tight text-[var(--fg)] mb-3 leading-tight">
            The math.{" "}
            <span className="serif-italic" style={{ color: "var(--accent)" }}>Plain and honest.</span>
          </h2>
          <p className="text-[17px] text-[var(--fg-muted)] max-w-3xl mb-12">
            What a typical Year-1 vs Year-3 Partner looks like financially. No fluff.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`${cardDark} p-6`}>
              <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[var(--accent)] mb-2">YEAR 1 — Getting started</div>
              <h3 className="text-[22px] font-extrabold text-[var(--fg)] mb-4">Solo consultant · 4 carriers signed</h3>
              <table className="w-full text-[13px] mb-4">
                <tbody>
                  <tr className="border-b border-[var(--border)]"><td className="py-2 text-[var(--fg-muted)]">Carriers signed by Month 12</td><td className="py-2 text-right font-bold text-[var(--fg)]">4</td></tr>
                  <tr className="border-b border-[var(--border)]"><td className="py-2 text-[var(--fg-muted)]">Average drivers per carrier</td><td className="py-2 text-right font-bold text-[var(--fg)]">22</td></tr>
                  <tr className="border-b border-[var(--border)]"><td className="py-2 text-[var(--fg-muted)]">Total drivers under management</td><td className="py-2 text-right font-bold text-[var(--fg)]">88</td></tr>
                  <tr className="border-b border-[var(--border)]"><td className="py-2 text-[var(--fg-muted)]">Annual revenue (you charge carriers @ $50)</td><td className="py-2 text-right font-bold text-[var(--accent)]">$52,800</td></tr>
                  <tr className="border-b border-[var(--border)]"><td className="py-2 text-[var(--fg-muted)]">Annual X3 fee (30%)</td><td className="py-2 text-right text-rose-700 dark:text-rose-300">-$15,840</td></tr>
                  <tr><td className="py-2 text-[var(--fg)] font-bold">Your net Year 1</td><td className="py-2 text-right font-black text-emerald-700 dark:text-emerald-300">~$36,960</td></tr>
                </tbody>
              </table>
              <p className="text-[12px] text-[var(--fg-muted)] italic leading-relaxed">
                Math: 88 drivers × $50/driver/mo × 12 = $52,800. X3 fee = 30% × $52,800 = $15,840 (floor of $10,560 doesn&apos;t apply at $50 retail).
              </p>
            </div>
            <div className={`${cardDark} p-6 border-[var(--accent)]/60`}>
              <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[var(--accent)] mb-2">YEAR 3 — Mature Partner</div>
              <h3 className="text-[22px] font-extrabold text-[var(--fg)] mb-4">15 carriers · 375 drivers</h3>
              <table className="w-full text-[13px] mb-4">
                <tbody>
                  <tr className="border-b border-[var(--border)]"><td className="py-2 text-[var(--fg-muted)]">Carriers under management</td><td className="py-2 text-right font-bold text-[var(--fg)]">15</td></tr>
                  <tr className="border-b border-[var(--border)]"><td className="py-2 text-[var(--fg-muted)]">Average drivers per carrier</td><td className="py-2 text-right font-bold text-[var(--fg)]">25</td></tr>
                  <tr className="border-b border-[var(--border)]"><td className="py-2 text-[var(--fg-muted)]">Total drivers under management</td><td className="py-2 text-right font-bold text-[var(--fg)]">375</td></tr>
                  <tr className="border-b border-[var(--border)]"><td className="py-2 text-[var(--fg-muted)]">Annual revenue (@ $50/driver retail)</td><td className="py-2 text-right font-bold text-[var(--accent)]">$225,000</td></tr>
                  <tr className="border-b border-[var(--border)]"><td className="py-2 text-[var(--fg-muted)]">Annual X3 fee (30%)</td><td className="py-2 text-right text-rose-700 dark:text-rose-300">-$67,500</td></tr>
                  <tr><td className="py-2 text-[var(--fg)] font-bold">Your net Year 3</td><td className="py-2 text-right font-black text-emerald-700 dark:text-emerald-300">~$157,500</td></tr>
                </tbody>
              </table>
              <p className="text-[12px] text-[var(--fg-muted)] italic leading-relaxed">
                Same consultant operating without Compass Partner would invoice ~$75-150K/yr at lower-margin custom service work. Compass Partner roughly <strong className="text-[var(--fg)]">doubles your income with less per-client effort.</strong>
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-[var(--bg-3)] border-y border-[var(--border)] py-24">
          <div className="max-w-4xl mx-auto px-6">
            <div className="inline-flex gap-1 mb-3">
              <span className="w-7 h-[3px] bg-[var(--accent)]" />
              <span className="w-7 h-[3px] bg-white/30" />
            </div>
            <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[var(--accent)] mb-2">04 · FAQ</div>
            <h2 className="text-[36px] sm:text-[42px] font-extrabold tracking-tight text-[var(--fg)] mb-10 leading-tight">
              Questions Partners ask.
            </h2>
            <div className="space-y-4">
              {FAQ.map((f, i) => (
                <div key={i} className={`${cardDark} p-5`}>
                  <h3 className="text-[15px] font-extrabold text-[var(--fg)] mb-2">{f.q}</h3>
                  <p className="text-[14px] text-[var(--fg-muted)] leading-relaxed">{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* APPLY */}
        <section id="apply" className="relative py-24 overflow-hidden">
          {/* decorative wash removed for production design pass */}
          <div className="max-w-3xl mx-auto px-6 text-center relative">
            <div className="inline-block text-[11px] tracking-[.18em] uppercase font-bold text-[var(--accent)] mb-3">
              05 · APPLY TO BECOME A PARTNER
            </div>
            <h2 className="text-[40px] sm:text-[48px] font-extrabold tracking-tight text-[var(--fg)] mb-4 leading-tight">
              Ready to white-label{" "}
              <span className="serif-italic" style={{ color: "var(--accent)" }}>your safety consultancy?</span>
            </h2>
            <p className="text-[17px] text-[var(--fg-muted)] mb-8">
              Submit your application. We&apos;ll review within 3 business days and schedule a 30-minute interview to confirm fit. Live Partner accounts typically activated within 5-10 business days of application.
            </p>
            <Link
              href="/partners/apply"
              className="inline-flex items-center gap-2 px-7 py-4 rounded-full font-bold text-[16px] text-[var(--bg)]"
              style={ctaCyan}
            >
              ★ Start your application →
            </Link>
            <div className="mt-6 text-[12px] text-[var(--fg-faint)]">
              Or email <a href="mailto:partners@x3compass.com" className="text-[var(--accent)] hover:underline">partners@x3compass.com</a> with questions before applying.
            </div>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
