import Link from "next/link";
import SiteShell from "@/components/SiteShell";
import BrainGrid from "@/components/BrainGrid";
import SkillsExplorer from "@/components/SkillsExplorer";
import DashboardPreview from "@/components/DashboardPreview";
import HazmatPreview from "@/components/HazmatPreview";
import TrustStrip from "@/components/TrustStrip";
import FounderNote from "@/components/FounderNote";
import AskCompassDemo from "@/components/AskCompassDemo";
import NumberCounter from "@/components/NumberCounter";

const PRICING = [
  {
    tier: "DIY", subtitle: "Compass AI",
    headline: "$25", unit: "per driver / mo",
    desc: "You drive the dashboard. AI does most of the work.",
    bullets: [
      "All 12 brains, all 300 skills",
      "★ Vendor integrations included — Motive, Samsara, Geotab, Tenstreet, Quest, Checkr, WEX, SambaSafety + more",
      "CSV import + manual entry on every tracker",
      "Daily compliance digest",
      "One-click audit export",
      "Unlimited team seats",
      "Up to 100 drivers",
    ],
    cta: "Start free trial",
    popular: false,
  },
  {
    tier: "DFY", subtitle: "Compass Concierge",
    headline: "$50", unit: "per driver / mo",
    desc: "We drive the dashboard for you.",
    bullets: [
      "Everything in DIY",
      "★ We set up your vendor integrations (Motive, Samsara, Quest, Checkr…)",
      "Dedicated X3 safety advisor",
      "Live monitoring + intervention",
      "Quarterly compliance review calls",
      "Audit prep support",
      "Up to 100 drivers",
    ],
    cta: "Start free trial",
    popular: true,
  },
  {
    tier: "Enterprise", subtitle: "For 100+ trucks",
    headline: "Call us", unit: "custom pricing",
    desc: "For fleets over 100 trucks.",
    bullets: [
      "Everything in DFY",
      "★ Custom vendor integrations we build for you",
      "White-label partner dashboard",
      "SSO + dedicated advisor team",
      "Custom CFR skills",
      "Volume pricing",
    ],
    cta: "Talk to sales",
    popular: false,
  },
];

const STEPS = [
  { n: 1, title: "Integrate your vendors (optional)", desc: "Already use Motive, Samsara, Tenstreet, Quest, Checkr, WEX, SambaSafety? One-click OAuth pulls your data in real-time. No vendor? CSV import + manual entry work just as well — no integration required." },
  { n: 2, title: "Sign up & import drivers",         desc: "Import via CSV (we provide the template) or add drivers one at a time. We auto-seed every § 391 DQ slot." },
  { n: 3, title: "Upload what you have",              desc: "Drop in med certs, CDL copies, prior-employer inquiries, Clearinghouse queries. Missing slots light up red." },
  { n: 4, title: "Log events as they happen",         desc: "Roadside inspection this morning? Random D&A Tuesday? Two-minute entries thread into CSA and the audit picture automatically." },
  { n: 5, title: "Read the morning digest",           desc: "7am email tells you what expires in the next 30 days. Handle today's items. Tomorrow you do it again. That's it." },
];

const cardDark = "bg-[var(--surface)] border border-[var(--border)] rounded-2xl hover:border-[#22D3EE]/40 transition-colors";
const ctaCyan = { background: "linear-gradient(135deg, #22D3EE, #06B6D4)", boxShadow: "0 6px 18px rgba(34, 211, 238, 0.32)" };

export default function Home() {
  return (
    <SiteShell>
      <div className="bg-[var(--bg)] text-[var(--fg)]">
        {/* HERO — real highway photo, not a gradient wash */}
        <section className="relative overflow-hidden">
          {/* Background: real photo */}
          <div className="absolute inset-0 -z-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/photos/hero-truck-highway.jpg" alt="" aria-hidden="true"
                 className="w-full h-full object-cover" />
            {/* Dark overlay — keeps text readable, gives the hero its mood */}
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg)]/85 via-[var(--bg)]/75 to-[var(--bg)]" />
          </div>
          <div className="max-w-7xl mx-auto px-6 pt-20 pb-24 relative">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-block text-[11px] tracking-[.18em] uppercase font-bold text-[#22D3EE] mb-6">
                EST. 2025 · 300 SKILLS · 12 BRAINS · BUILT BY FLEET OPERATORS
              </div>
              <h1 className="font-extrabold text-[var(--fg)] tracking-tight leading-[1.05] text-[44px] sm:text-[60px] md:text-[72px] mb-6">
                An AI Safety Director.
                <br />
                <span className="serif-italic" style={{ color: "#22D3EE" }}>Or a real one.</span>{" "}
                Both work.
              </h1>
              <p className="text-[20px] text-[var(--fg-muted)] max-w-2xl mx-auto mb-3 leading-relaxed">
                Every FMCSA compliance task — DQ files, MVRs, D&A, CSA, hazmat — answered with the exact CFR section.
              </p>
              <p className="text-[16px] text-[var(--fg-faint)] max-w-2xl mx-auto mb-8">
                <strong className="text-[var(--fg)]">$25/driver</strong> DIY · <strong className="text-[var(--fg)]">$50/driver</strong> done-for-you · 7-day free trial, no card
              </p>
              <div className="flex gap-3 justify-center flex-wrap mb-4">
                <Link href="/app" className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[15px] text-[var(--bg)]" style={ctaCyan}>
                  ★ Start free trial →
                </Link>
                <Link href="/app" className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[15px] text-[var(--fg)] border border-white/25 hover:bg-white/5">
                  See the dashboard
                </Link>
              </div>
              <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[var(--fg-faint)]">
                Trained on 49 CFR Parts 380–399 · 100 published skills on GitHub · 7-day trial, no card
              </div>
            </div>
          </div>
        </section>

        {/* STAT BAND */}
        <section className="border-y border-[var(--border)] bg-[var(--bg-3)]">
          <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { count: 300, prefix: "",  suffix: "", desc: "FMCSA skills, every one CFR-cited",        key: "skills" },
              { count: 12,  prefix: "",  suffix: "", desc: "Specialized brains, one per compliance domain", key: "brains" },
              { count: 25,  prefix: "$", suffix: "", desc: "per driver, DIY · or $50 done-for-you",      key: "price" },
            ].map((s, i) => (
              <div key={i} className="text-center md:text-left">
                <div className="text-[64px] sm:text-[80px] font-black leading-none" style={{ color: "#22D3EE" }}>
                  <NumberCounter to={s.count} prefix={s.prefix} suffix={s.suffix} sessionKey={s.key} />
                </div>
                <div className="serif-italic text-[var(--fg-muted)] text-[18px] mt-2">{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        <TrustStrip />

        {/* 01 · TWELVE BRAINS */}
        <section id="services" className="max-w-7xl mx-auto px-6 py-24">
          <div className="inline-flex gap-1 mb-3">
            <span className="w-7 h-[3px] bg-[#22D3EE]" />
            <span className="w-7 h-[3px] bg-white/30" />
          </div>
          <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[#22D3EE] mb-2">01 · TWELVE BRAINS</div>
          <h2 className="text-[40px] sm:text-[48px] font-extrabold tracking-tight text-[var(--fg)] mb-3 leading-tight">
            Twelve brains. <span className="serif-italic" style={{ color: "#22D3EE" }}>One subscription.</span>
          </h2>
          <p className="text-[17px] text-[var(--fg-muted)] max-w-2xl mb-12">
            One brain per regulation. Open the actual CFR part — not a generic vault that makes you learn a new filing system.
          </p>
          <BrainGrid />
        </section>

        {/* 02 · DASHBOARD */}
        <section className="bg-[var(--bg-3)] border-y border-[var(--border)] py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-10">
              <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[#22D3EE] mb-2">02 · THE DASHBOARD</div>
              <h2 className="font-extrabold tracking-tight text-[var(--fg)] mb-3 leading-[1.1] text-[28px] sm:text-[34px] md:text-[40px] lg:text-[44px] whitespace-normal lg:whitespace-nowrap">
                The screen you live in.{" "}
                <span className="serif-italic" style={{ color: "#22D3EE" }}>Every signal, one page.</span>
              </h2>
              <p className="text-[17px] text-[var(--fg-muted)] max-w-3xl mx-auto mb-8">
                Sidebar of drivers. KPI strip up top. CSA BASICs, expirations, inspections — all on one screen. Your AI Safety Director sits in the lower right and tells you exactly what to do next.
              </p>
            </div>

            {/* The actual screenshot-style preview */}
            <div className="max-w-5xl mx-auto mb-8">
              <DashboardPreview />
            </div>

            <div className="text-center">
              <Link href="/app" className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[15px] text-[var(--bg)]" style={ctaCyan}>
                Open the live dashboard →
              </Link>
              <div className="mt-3 text-[12px] text-[var(--fg-faint)]">Free trial · no card required · see your real fleet on this screen in under 10 minutes</div>
            </div>
          </div>
        </section>

        {/* ASK COMPASS DEMO — live, no signup, real eCFR verification */}
        <section className="border-y border-[var(--border)] bg-[var(--bg)] py-20">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-8">
              <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[var(--accent)] mb-2">02.5 · TASTE THE PRODUCT</div>
              <h2 className="font-extrabold tracking-tight text-[var(--fg)] mb-3 leading-[1.1] text-[32px] sm:text-[40px] md:text-[48px]">
                Ask one. <span className="serif-italic" style={{ color: "#22D3EE" }}>See the answer.</span>
              </h2>
              <p className="text-[16px] text-[var(--fg-muted)] max-w-2xl mx-auto">
                Type any FMCSA compliance question. Every CFR citation in the answer is checked against the live eCFR.gov
                registry — verified citations get a green ✓ chip. No signup. 5 free questions per IP per 6 hours.
              </p>
            </div>
            <AskCompassDemo />
          </div>
        </section>

        <FounderNote />

        {/* 03 · 300 SKILLS */}
        <section id="skills" className="max-w-7xl mx-auto px-6 py-24">
          <div className="inline-flex gap-1 mb-3">
            <span className="w-7 h-[3px] bg-[#22D3EE]" />
            <span className="w-7 h-[3px] bg-white/30" />
          </div>
          <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[#22D3EE] mb-2">03 · 300 PUBLISHED SKILLS</div>
          <h2 className="text-[40px] sm:text-[48px] font-extrabold tracking-tight text-[var(--fg)] mb-3 leading-tight">
            Ask any FMCSA question.{" "}
            <span className="serif-italic" style={{ color: "#22D3EE" }}>Get a CFR-cited answer.</span>
          </h2>
          <p className="text-[17px] text-[var(--fg-muted)] max-w-2xl mb-12">
            Every skill is a published, version-controlled prompt. <strong className="text-[var(--fg)]">Click any skill to see a real CFR-cited sample answer</strong> — no signup needed for the preview.
          </p>
          <SkillsExplorer />
          <div className="text-center mt-10 space-y-4">
            <div>
              <Link
                href="/skills"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[15px] text-white border border-[#22D3EE]/50 hover:bg-[#22D3EE]/10 hover:border-[#22D3EE]"
              >
                ★ Browse all 300 skills · filter & search →
              </Link>
            </div>
            <div className="text-[13px] text-[var(--fg-muted)]">
              The full library unlocks inside Compass —{" "}
              <Link href="/signup" className="text-[#22D3EE] font-bold">Start your 7-day free trial →</Link>
            </div>
          </div>
        </section>

        {/* 04 · HAZMAT */}
        <section className="relative py-20 overflow-hidden border-y border-[var(--border)] bg-[var(--bg-3)]">
          {/* Decorative wash removed — let the content carry the section */}
          <div className="max-w-7xl mx-auto px-6 relative">
            <div className="text-center mb-10">
              <div className="inline-block text-[11px] tracking-[.18em] uppercase font-bold text-[#22D3EE] mb-3">
                04 · HAZMAT CENTER
              </div>
              <h2 className="text-[36px] sm:text-[44px] lg:text-[48px] font-extrabold tracking-tight text-[var(--fg)] mb-3 leading-tight">
                100 hazmat skills.{" "}
                <span className="serif-italic" style={{ color: "#22D3EE" }}>One Placard Wizard.</span>
              </h2>
              <p className="text-[17px] text-[var(--fg-muted)] max-w-2xl mx-auto mb-8">
                Class 1 explosives through Class 9 miscellaneous. Plus security plans, segregation, and the TSA-H clock.
              </p>
            </div>

            {/* The actual hazmat tool preview */}
            <div className="max-w-5xl mx-auto mb-8">
              <HazmatPreview />
            </div>

            <div className="text-center">
              <Link href="/hazmat" className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[15px] text-[var(--bg)]" style={ctaCyan}>
                Open the Hazmat Center →
              </Link>
              <div className="mt-3 text-[12px] text-[var(--fg-faint)]">$99/mo add-on · works with any Compass tier · 7-day trial includes hazmat</div>
            </div>
          </div>
        </section>

        {/* 05 · HOW IT WORKS */}
        <section id="how" className="max-w-7xl mx-auto px-6 py-24">
          <div className="inline-flex gap-1 mb-3">
            <span className="w-7 h-[3px] bg-[#22D3EE]" />
            <span className="w-7 h-[3px] bg-white/30" />
          </div>
          <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[#22D3EE] mb-2">05 · HOW IT WORKS</div>
          <h2 className="text-[40px] sm:text-[48px] font-extrabold tracking-tight text-[var(--fg)] mb-3 leading-tight">
            Live in the next <span className="serif-italic" style={{ color: "#22D3EE" }}>lunch break.</span>
          </h2>
          <p className="text-[17px] text-[var(--fg-muted)] max-w-2xl mb-12">
            Connect what you already have, import what you don&apos;t, log events as they happen, read the morning digest. That&apos;s the whole job.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {STEPS.map((s) => (
              <div key={s.n} className={`${cardDark} p-6`}>
                <div
                  className="w-9 h-9 rounded-full grid place-items-center text-[var(--bg)] font-black mb-3"
                  style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)", boxShadow: "0 4px 12px rgba(34, 211, 238, 0.32)" }}
                >
                  {s.n}
                </div>
                <h3 className="text-[16px] font-bold text-[var(--fg)] mb-2">{s.title}</h3>
                <p className="text-[13.5px] text-[var(--fg-muted)] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          {/* Honest callout: what we DON'T do */}
          <div
            className="mt-10 rounded-2xl border p-5 flex items-start gap-4"
            style={{
              background: "linear-gradient(135deg, rgba(251, 191, 36, 0.08), rgba(15, 28, 50, 0.5))",
              borderColor: "rgba(251, 191, 36, 0.30)",
            }}
          >
            <div className="text-[22px] flex-shrink-0">ⓘ</div>
            <div className="flex-1">
              <div className="text-[var(--fg)] font-extrabold text-[14px] mb-1.5">
                Honest call-out: we do <span className="text-amber-300">not</span> have a direct real-time relay to your CSA scores.
              </div>
              <div className="text-[13px] text-[var(--fg-muted)] leading-relaxed">
                FMCSA publishes CSA / SMS data <strong className="text-[var(--fg)]">monthly</strong> via SAFER — that&apos;s the only public source, and there is no live API anyone can use. Compass auto-pulls your SAFER snapshot every time FMCSA refreshes (~the 15th of each month) and shows you the delta. If a vendor claims real-time CSA data, they&apos;re reading the same monthly SAFER feed you can.
              </div>
            </div>
          </div>
        </section>

        {/* 06 · PRICING */}
        <section id="pricing" className="bg-[var(--bg-3)] border-y border-[var(--border)] py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="inline-flex gap-1 mb-3">
              <span className="w-7 h-[3px] bg-[#22D3EE]" />
              <span className="w-7 h-[3px] bg-white/30" />
            </div>
            <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[#22D3EE] mb-2">06 · PRICING</div>
            <h2 className="text-[40px] sm:text-[48px] font-extrabold tracking-tight text-[var(--fg)] mb-3 leading-tight">
              Drive it yourself.{" "}
              <span className="serif-italic" style={{ color: "#22D3EE" }}>Or let us drive it for you.</span>
            </h2>
            <p className="text-[17px] text-[var(--fg-muted)] max-w-2xl mb-3">
              Every tier includes all 12 brains and all 300 skills. The only difference is who&apos;s holding the wheel.
            </p>
            <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[var(--fg)] mb-12">
              ★ TRY EVERY BRAIN — PLUS HAZMAT — FREE FOR 7 DAYS. NO CARD REQUIRED.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
              {PRICING.map((p, i) => (
                <div
                  key={i}
                  className={`relative flex flex-col rounded-2xl p-7 ${
                    p.popular
                      ? "border-[#22D3EE]/60 shadow-[0_18px_50px_rgba(34,211,238,0.18)]"
                      : "border-[var(--border)]"
                  } border`}
                  style={{ background: "linear-gradient(180deg, #15233D 0%, #0F1C32 100%)" }}
                >
                  {p.popular && (
                    <span
                      className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[.06em] text-[var(--bg)]"
                      style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)" }}
                    >
                      Most Popular
                    </span>
                  )}
                  <div className="text-[11px] tracking-wider uppercase font-bold text-[var(--fg-muted)] mb-1">
                    {p.tier}
                  </div>
                  <div className="text-[15px] font-bold text-[var(--fg)] mb-3">{p.subtitle}</div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-[42px] font-black text-[var(--fg)] leading-none">{p.headline}</span>
                  </div>
                  <div className="text-[13px] text-[var(--fg-muted)] mb-3">{p.unit}</div>
                  <p className="text-[14px] text-[var(--fg-muted)] italic mb-4">&ldquo;{p.desc}&rdquo;</p>
                  <ul className="space-y-2 mb-6 flex-1">
                    {p.bullets.map((b, j) => (
                      <li key={j} className="text-[14px] text-[var(--fg-muted)] flex gap-2">
                        <span className="text-[#22D3EE] font-bold flex-shrink-0">✓</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/app"
                    className={`block text-center px-4 py-3 rounded-full font-bold text-[14px] ${
                      p.popular ? "text-[var(--bg)]" : "text-white border border-white/20 hover:bg-white/5"
                    }`}
                    style={p.popular ? ctaCyan : undefined}
                  >
                    {p.cta}
                  </Link>
                </div>
              ))}
            </div>
            <div className={`${cardDark} p-5 flex items-center justify-between gap-6 flex-wrap`}>
              <div>
                <div className="text-[11px] tracking-wider uppercase font-bold text-[#22D3EE] mb-1">★ ADD-ON</div>
                <div className="text-[18px] font-extrabold text-[var(--fg)]">
                  Hazmat Center · <span style={{ color: "#22D3EE" }}>+$99/mo</span>
                </div>
                <p className="text-[14px] text-[var(--fg-muted)] mt-1">
                  Placard Wizard, 100 hazmat-only skills, segregation engine, ERG lookup, TSA-H clock. Pairs with any tier.
                </p>
              </div>
              <Link href="/hazmat" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-[13px] text-[var(--fg)] border border-white/20 hover:bg-white/5">
                See Hazmat Center →
              </Link>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="relative py-20 overflow-hidden">
          {/* Decorative wash removed */}
          <div className="max-w-3xl mx-auto px-6 text-center relative">
            <h2 className="text-[40px] sm:text-[48px] font-extrabold tracking-tight text-[var(--fg)] mb-4 leading-tight">
              Stop running compliance from a{" "}
              <span className="serif-italic" style={{ color: "#22D3EE" }}>spreadsheet.</span>
            </h2>
            <p className="text-[17px] text-[var(--fg-muted)] mb-8">
              Twelve brains. Three hundred skills. One subscription. 7-day free trial, no credit card.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href="/app" className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[15px] text-[var(--bg)]" style={ctaCyan}>
                ★ Start free trial →
              </Link>
              <Link href="/#faqs" className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[15px] text-[var(--fg)] border border-white/25 hover:bg-white/5">
                Read the FAQ
              </Link>
            </div>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
