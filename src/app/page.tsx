import Link from "next/link";
import SiteShell from "@/components/SiteShell";
import BrainGrid from "@/components/BrainGrid";
import SkillsExplorer from "@/components/SkillsExplorer";
import DashboardPreview from "@/components/DashboardPreview";
import HazmatPreview from "@/components/HazmatPreview";
import TrustStrip from "@/components/TrustStrip";
import FounderNote from "@/components/FounderNote";
import AskCompassDemo from "@/components/AskCompassDemo";
import WhoWeAreButton from "@/components/WhoWeAreButton";
import NumberCounter from "@/components/NumberCounter";
import { BANDS, COMPASS_COPY, PLAN, MONTHLY_MINIMUM, monthlyFor, effectiveRate, usd } from "@/lib/pricing";


const NIGHTMARES = [
  {
    price: "$14,000+",
    title: "New Entrant Safety Audit — failed",
    body: "A 3-truck carrier in Ohio showed up to their New Entrant Audit with 4 of 12 required DQ file elements missing. FMCSA placed them out-of-service and revoked their operating authority. Reinstatement took 6 months, $14,000 in legal fees, and rebuilding every driver file from scratch.",
    tag: "DRIVER QUALIFICATION · 49 CFR 391",
  },
  {
    price: "$6,000",
    title: "Missed Clearinghouse pre-employment query",
    body: "A Texas carrier hired a CDL driver without running the pre-employment Clearinghouse query required under 49 CFR 382.701. That driver had a prior positive test with an incomplete SAP follow-up. FMCSA issued a $6,000 civil penalty — more than the driver earned in a month behind the wheel.",
    tag: "DRUG & ALCOHOL · 49 CFR 382",
  },
  {
    price: "$78,500",
    title: "HOS pattern — rating downgraded",
    body: "A 12-truck Michigan carrier walked into a compliance review with 847 unresolved ELD edits and 31 falsified log entries over 6 months. FMCSA cited $78,500 in HOS violations and downgraded the carrier's safety rating to Conditional. Insurance non-renewed 90 days later — they lost their primary contract the following quarter.",
    tag: "HOURS OF SERVICE · 49 CFR 395",
  },
  {
    price: "$58,000",
    title: "Missed random drug & alcohol draws",
    body: "A 5-truck Florida carrier enrolled in a D&A consortium never had a random selection completed for 14 months. Discovered during a post-accident rapid audit. Eight drivers overdue for testing, $58,000 in civil penalties, and exposure in the wrongful-death lawsuit that followed the crash.",
    tag: "CONTROLLED SUBSTANCES · 49 CFR 382.305",
  },
];

const cardDark = "bg-black border border-[#1E3556] rounded-2xl hover:border-[#16C7FF]/60 transition-colors";
const ctaCyan = { background: "linear-gradient(135deg, var(--accent), var(--accent-2))", boxShadow: "0 6px 18px rgba(2, 6, 12, 0.45)" };

export default function Home() {
  return (
    <SiteShell>
      <div className="bg-[var(--bg)] text-[var(--fg)]">
        {/* HERO · two-column · headlines left, 12-Brains device right · no glow, image blends */}
        <section className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 pt-20 pb-24 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-6 items-center">

              {/* LEFT · copy stack · col-span-5 to give the image more room */}
              <div className="lg:col-span-5 text-center lg:text-left">
                <div className="inline-block text-[11px] tracking-[.18em] uppercase font-bold text-[var(--accent)] mb-6">
                  EST. 2026 · 67,000-DOC KNOWLEDGE BASE · 12 BRAINS · BUILT BY FLEET OPERATORS
                </div>
                <h1 className="font-extrabold text-[var(--fg)] tracking-tight leading-[1.05] text-[44px] sm:text-[60px] lg:text-[48px] xl:text-[60px] mb-6">
                  Stop running compliance
                  <br />
                  <span style={{ color: "var(--accent)" }}>from a spreadsheet.</span>
                </h1>
                <p className="text-[18px] text-[var(--fg-muted)] max-w-xl mx-auto lg:mx-0 mb-6 leading-relaxed">
                  12 AI brains, backed by a 67,000-document CFR knowledge base. <strong className="text-[var(--fg)]">Every citation verified live against eCFR.gov</strong> — green ✓ chip on every answer.
                </p>
                <p className="text-[14px] text-[var(--fg-faint)] max-w-xl mx-auto lg:mx-0 mb-6">
                  From <strong className="text-[var(--fg)]">$50/driver</strong> · graduated down to <strong className="text-[var(--fg)]">$25/driver</strong> as you grow · every X3 product included · 7-day free trial, no card
                </p>
                <div className="flex gap-3 justify-center lg:justify-start flex-wrap mb-4">
                  <Link href="/audit" className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[15px] text-[var(--bg)]" style={ctaCyan}>
                    ★ Take the 15-min audit →
                  </Link>
                  <WhoWeAreButton />
                </div>
                <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[var(--fg-faint)]">
                  67,000-doc CFR knowledge base · CFR-verified live · Audit-ready in 90 days or full refund · 7-day trial, no card
                </div>
              </div>

              {/* RIGHT · 12-Brains device · no glow, just the image at full size
                  col-span-7 + negative right margin pushes it visually larger and
                  lets the black edges blend into the body bg */}
              <div className="lg:col-span-7 relative lg:-mr-6 xl:-mr-12">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/x3-compass-12brains-hero-v6.png"
                  alt="X3 Compass · 12 AI Brains connected via circuit traces"
                  width="1446"
                  height="770"
                  fetchPriority="high"
                  decoding="async"
                  className="w-full h-auto object-contain"
                />
              </div>

            </div>
          </div>
        </section>

        {/* STAT BAND */}
        <section className="border-y border-[var(--border)] bg-[var(--bg-3)]">
          <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { count: 67000, prefix: "",  suffix: "", desc: "CFR-cited compliance documents in the knowledge base", key: "docs" },
              { count: 12,  prefix: "",  suffix: "", desc: "Specialized AI brains, one per domain",  key: "brains" },
              { count: 50,  prefix: "$", suffix: "", desc: "per driver / month · graduated down to $25", key: "price" },
            ].map((s, i) => (
              <div key={i} className="text-center md:text-left">
                <div className="text-[64px] sm:text-[80px] font-black leading-none" style={{ color: "var(--accent)" }}>
                  {s.prefix}{s.count.toLocaleString()}{s.suffix}
                </div>
                <div className="serif-italic text-[var(--fg-muted)] text-[18px] mt-2">{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* COMPLIANCE TICKER · what we cover, on infinite loop */}
        <section className="border-b border-[var(--border)] bg-[var(--bg)] py-8 overflow-hidden">
          <div className="text-center text-[11px] tracking-[.18em] uppercase font-bold text-[var(--accent)] mb-5">
            EVERY FMCSA · DOT · PHMSA COMPLIANCE DOMAIN, ONE PLATFORM
          </div>
          <div className="relative">
            {/* Fade edges so items dissolve into the bg as they enter/exit */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-32 z-10"
                 style={{ background: "linear-gradient(to right, var(--bg), transparent)" }} />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-32 z-10"
                 style={{ background: "linear-gradient(to left, var(--bg), transparent)" }} />
            <div className="overflow-hidden">
              <div className="x3-marquee-track text-[18px] font-semibold text-[var(--fg-muted)] whitespace-nowrap">
                {(() => {
                  const items = [
                    "FMCSA",
                    "HOS Violations",
                    "CSA Scores",
                    "DOT Audits",
                    "PHMSA",
                    "Hazmat",
                    "DQ Files",
                    "Drug & Alcohol",
                    "MVR Monitoring",
                    "IFTA Filing",
                    "Background Checks",
                    "Vehicle Inspections",
                    "Accidents & Crashes",
                    "ELDT Training",
                    "FMCSA Clearinghouse",
                    "Roadside Inspections",
                    "ELD Compliance",
                    "Driver Qualification",
                    "Permits & Registrations",
                    "Audit Prep",
                    "DataQ Challenges",
                    "Safety Scorecards",
                    "Carrier Onboarding",
                    "Annual Reviews",
                  ];
                  // Duplicate the list so the -50% translate creates a seamless loop.
                  const loop = [...items, ...items];
                  return loop.flatMap((label, i) => [
                    <span key={`l${i}`} className="flex-shrink-0">{label}</span>,
                    <span key={`d${i}`} className="flex-shrink-0 text-[var(--accent)] text-[10px]" aria-hidden="true">●</span>,
                  ]);
                })()}
              </div>
            </div>
          </div>
        </section>

        {/* 01 · TWELVE BRAINS */}
        <section id="services" className="max-w-7xl mx-auto px-6 py-24">
          <div className="inline-flex gap-1 mb-3">
            <span className="w-7 h-[3px] bg-[var(--accent)]" />
            <span className="w-7 h-[3px] bg-white/30" />
          </div>
          <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[var(--accent)] mb-2">01 · TWELVE BRAINS</div>
          <h2 className="text-[40px] sm:text-[48px] font-extrabold tracking-tight text-[var(--fg)] mb-3 leading-tight">
            Twelve brains. <span className="serif-italic" style={{ color: "var(--accent)" }}>One subscription.</span>
          </h2>
          <p className="text-[17px] text-[var(--fg-muted)] max-w-2xl mb-12">
            One brain per regulation. Open the actual CFR part · not a generic vault that makes you learn a new filing system.
          </p>
          <BrainGrid />
        </section>

        {/* 02 · ASK COMPASS DEMO · live, no signup, real eCFR verification ·
            promoted above the dashboard so visitors taste the AI before the
            screenshot. CRO #3: demo above static preview lifts mid-funnel
            engagement (people remember actions, not screenshots). */}
        <section className="border-y border-[var(--border)] bg-[var(--bg)] py-20">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-8">
              <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[var(--accent)] mb-2">02 · TASTE THE PRODUCT</div>
              <h2 className="font-extrabold tracking-tight text-[var(--fg)] mb-3 leading-[1.1] text-[32px] sm:text-[40px] md:text-[48px]">
                Ask one. <span className="serif-italic" style={{ color: "var(--accent)" }}>See the answer.</span>
              </h2>
              <p className="text-[16px] text-[var(--fg-muted)] max-w-2xl mx-auto">
                Type any FMCSA compliance question. Every CFR citation in the answer is checked against the live eCFR.gov
                registry · verified citations get a green ✓ chip. No signup. 5 free questions per IP per 6 hours.
              </p>
            </div>
            <AskCompassDemo />
          </div>
        </section>

        {/* 03 · DASHBOARD */}
        <section className="bg-[var(--bg-3)] border-y border-[var(--border)] py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-10">
              <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[var(--accent)] mb-2">03 · THE DASHBOARD</div>
              <h2 className="font-extrabold tracking-tight text-[var(--fg)] mb-3 leading-[1.1] text-[28px] sm:text-[34px] md:text-[40px] lg:text-[44px] whitespace-normal lg:whitespace-nowrap">
                The screen you live in.{" "}
                <span className="serif-italic" style={{ color: "var(--accent)" }}>Every signal, one page.</span>
              </h2>
              <p className="text-[17px] text-[var(--fg-muted)] max-w-3xl mx-auto mb-8">
                Sidebar of drivers. KPI strip up top. CSA BASICs, expirations, inspections · all on one screen. Your AI Safety Director sits in the lower right and tells you exactly what to do next.
              </p>
            </div>

            {/* The actual screenshot-style preview */}
            <div className="max-w-5xl mx-auto mb-8">
              <DashboardPreview />
            </div>

            <div className="text-center">
              <Link href="/signup" className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[15px] text-[var(--bg)]" style={ctaCyan}>
                Open the live dashboard →
              </Link>
              <div className="mt-3 text-[12px] text-[var(--fg-faint)]">Free trial · no card required · see your real fleet on this screen in under 10 minutes</div>
            </div>
          </div>
        </section>

        {/* Thin separator (replaces the previous FounderNote block) */}
        <div className="max-w-7xl mx-auto px-6">
          <div
            aria-hidden="true"
            className="h-px w-full"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(22,199,255,0.35) 50%, transparent 100%)",
            }}
          />
        </div>

        {/* 03 · KNOWLEDGE BASE */}
        <section id="skills" className="max-w-7xl mx-auto px-6 py-24">
          <div className="inline-flex gap-1 mb-3">
            <span className="w-7 h-[3px] bg-[var(--accent)]" />
            <span className="w-7 h-[3px] bg-white/30" />
          </div>
          <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[var(--accent)] mb-2">03 · 67,000-DOC KNOWLEDGE BASE</div>
          <h2 className="text-[40px] sm:text-[48px] font-extrabold tracking-tight text-[var(--fg)] mb-3 leading-tight">
            Ask any FMCSA question.{" "}
            <span className="serif-italic" style={{ color: "var(--accent)" }}>Get a CFR-cited answer.</span>
          </h2>
          <p className="text-[17px] text-[var(--fg-muted)] max-w-2xl mb-12">
            Every skill is a published, version-controlled prompt. <strong className="text-[var(--fg)]">Click any skill to see a real CFR-cited sample answer</strong> · no signup needed for the preview.
          </p>
          <SkillsExplorer />
          <div className="text-center mt-10 space-y-4">
            <div>
              <Link
                href="/skills"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[15px] text-[var(--fg)] border border-[var(--accent)]/50 hover:bg-[var(--accent)]/10 hover:border-[var(--accent)]"
              >
                ★ Browse the skills library · filter & search →
              </Link>
            </div>
            <div className="text-[13px] text-[var(--fg-muted)]">
              The full library unlocks inside Compass —{" "}
              <Link href="/signup" className="text-[var(--accent)] font-bold">Start your 7-day free trial →</Link>
            </div>
          </div>
        </section>

        {/* Thin cyan separator between 03 and 04 — edge-to-edge */}
        <div
          aria-hidden="true"
          className="h-px w-full"
          style={{ backgroundColor: "rgba(22, 199, 255, 0.35)" }}
        />

        {/* 04 · THE REAL COST OF FALLING BEHIND */}
        <section id="how" className="max-w-7xl mx-auto px-6 py-24">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[var(--accent)] mb-3">
              04 · THE REAL COST OF FALLING BEHIND
            </div>
            <h2 className="text-[40px] sm:text-[48px] font-extrabold tracking-tight text-[var(--fg)] mb-4 leading-tight">
              Compliance nightmares small carriers{" "}
              <span className="serif-italic" style={{ color: "var(--accent)" }}>live every week.</span>
            </h2>
            <p className="text-[17px] text-[var(--fg-muted)]">
              These aren&apos;t worst-case scenarios — they&apos;re the everyday enforcement patterns FMCSA publishes in their penalty database. One missed step is often the difference between a clean audit and a shutdown.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {NIGHTMARES.map((n, i) => (
              <div
                key={i}
                className="relative bg-black border border-[#1E3556] rounded-2xl p-7 hover:border-[var(--accent)]/60 transition-colors overflow-hidden"
              >
                {/* Top gradient stripe — 100waystosay pattern */}
                <div
                  className="absolute top-0 left-0 right-0 h-[3px]"
                  style={{ background: "linear-gradient(90deg, transparent 0%, rgba(22, 199, 255, 0.6) 50%, transparent 100%)" }}
                />
                <div className="text-[34px] sm:text-[40px] font-black leading-none mb-3" style={{ color: "#FF5C5C" }}>
                  {n.price}
                </div>
                <h3 className="text-[19px] font-bold text-white mb-4 leading-snug">
                  {n.title}
                </h3>
                <p className="text-[14px] text-white/70 leading-relaxed mb-6">
                  {n.body}
                </p>
                <span className="inline-block text-[10px] tracking-[.12em] uppercase font-bold text-[var(--accent)] bg-[#0B1A2E] border border-[#1E3556] rounded-md px-3 py-1.5">
                  {n.tag}
                </span>
              </div>
            ))}
          </div>

          <p className="text-center text-[13px] text-[var(--fg-muted)] italic mt-10 max-w-3xl mx-auto">
            Illustrative composites drawn from published FMCSA enforcement actions. Every one of these is preventable with a competent compliance program in place.
          </p>
        </section>

        {/* 05 · PRICING */}
        <section id="pricing" className="bg-[var(--bg-3)] border-y border-[var(--border)] py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="inline-flex gap-1 mb-3">
              <span className="w-7 h-[3px] bg-[var(--accent)]" />
              <span className="w-7 h-[3px] bg-white/30" />
            </div>
            <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[var(--accent)] mb-2">05 · PRICING</div>
            <h2 className="text-[40px] sm:text-[48px] font-extrabold tracking-tight text-[var(--fg)] mb-3 leading-tight">
              One plan.{" "}
              <span className="serif-italic" style={{ color: "var(--accent)" }}>Every Compass capability.</span>
            </h2>
            <p className="text-[17px] text-[var(--fg-muted)] max-w-2xl mb-3">
              The Compass plan includes all 12 brains and the full 67,000-document knowledge base. Need a human-led service instead? X3 Fleet Safety is contracted separately.
            </p>
            <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[var(--fg)] mb-8">
              ★ TRY EVERY BRAIN · PLUS HAZMAT · FREE FOR 7 DAYS. NO CARD REQUIRED.
            </div>

            {/* CRO #2 · Risk-reversal guarantee band. Sits ABOVE the pricing
                grid so the promise is read before the price. Two anchors:
                outcome ("audit-ready in 90 days") + reversibility ("full
                refund, cancel anytime, export your data"). Bugatti styling:
                pure black card, cyan border, gradient top stripe. */}
            <div
              className="relative rounded-2xl p-7 mb-10 border bg-black"
              style={{
                borderColor: "rgba(22,199,255,0.5)",
                boxShadow:
                  "0 18px 50px rgba(22,199,255,0.12), 0 0 0 1px rgba(22,199,255,0.18) inset",
              }}
            >
              <div
                aria-hidden="true"
                className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
                style={{
                  background:
                    "linear-gradient(90deg, transparent 0%, rgba(22,199,255,0.95) 50%, transparent 100%)",
                }}
              />
              <div className="grid grid-cols-1 md:grid-cols-[auto,1fr,auto] gap-6 items-center">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-[28px] font-black text-[var(--bg)] flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
                  aria-hidden="true"
                >
                  ✓
                </div>
                <div>
                  <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[var(--accent)] mb-2">
                    THE X3 COMPASS GUARANTEE
                  </div>
                  <h3 className="text-[22px] sm:text-[26px] font-extrabold text-[var(--fg)] leading-tight mb-2">
                    Audit-ready in 90 days <span className="serif-italic" style={{ color: "var(--accent)" }}>or your subscription is refunded.</span>
                  </h3>
                  <p className="text-[16px] text-white leading-relaxed">
                    Run a new-entrant or compliance review audit at day 90. If our checklist of the FMCSA-required artifacts isn&apos;t fully populated and citation-clean, we refund every dollar you&apos;ve paid. Cancel anytime — your data exports as CSV, PDFs of every document, and a full audit log you keep forever.
                  </p>
                </div>
                <div className="flex md:flex-col gap-3 md:items-end">
                  <span className="text-[12px] tracking-wider uppercase font-bold text-white border border-[var(--accent)]/40 rounded-full px-3 py-1.5">
                    No card required
                  </span>
                  <span className="text-[12px] tracking-wider uppercase font-bold text-white border border-[var(--accent)]/40 rounded-full px-3 py-1.5">
                    7-day full trial
                  </span>
                </div>
              </div>
            </div>

            {/* ONE plan · graduated ladder. Canon lives in @/lib/pricing —
                do not hardcode rates here again. */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-6 items-start">
              {/* the plan */}
              <div className="lg:col-span-2 relative flex flex-col rounded-2xl bg-black p-10 border border-[#16C7FF] shadow-[0_24px_70px_rgba(22,199,255,0.18),0_0_0_1px_rgba(22,199,255,0.35)]">
                <div className="text-[11px] tracking-wider uppercase font-bold text-[var(--fg-muted)] mb-1">
                  {PLAN.name}
                </div>
                <div className="text-[15px] font-bold text-[var(--fg)] mb-3">{PLAN.tagline}</div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-[42px] font-black text-[var(--fg)] leading-none">${BANDS[0].rate}</span>
                  <span className="text-[13px] text-[var(--fg-muted)]">per driver / mo</span>
                </div>
                <div className="text-[13px] text-[var(--fg-muted)] mb-4">
                  starting rate · falls to ${BANDS[BANDS.length - 1].rate}/driver as you grow · {usd(MONTHLY_MINIMUM)}/mo minimum
                </div>
                <ul className="space-y-2 mb-6 flex-1">
                  {[
                    "Every X3 product — no tier gates, no upsell",
                    "All 12 brains + the full 67,000-doc knowledge base",
                    "\u2605 Vendor integrations included \u00b7 Motive, Samsara, Geotab, Tenstreet, Quest, Checkr, WEX, SambaSafety + more",
                    "Dedicated X3 safety advisor",
                    "\u2605 Audit-ready in 90 days or your subscription is refunded",
                    "One-click audit export — your files stay yours, cancel anytime",
                    "Unlimited team seats",
                  ].map((b, j) => (
                    <li key={j} className="text-[14px] text-[var(--fg-muted)] flex gap-2">
                      <span className="text-[var(--accent)] font-bold flex-shrink-0">\u2713</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/app" className="block text-center px-4 py-3 rounded-full font-bold text-[14px] text-[var(--bg)]" style={ctaCyan}>
                  Take the 15-min audit
                </Link>
              </div>

              {/* the ladder */}
              <div className="lg:col-span-3 flex flex-col rounded-2xl bg-black p-7 border border-[#1E3556]">
                <div className="text-[11px] tracking-wider uppercase font-bold text-[var(--accent)] mb-2">
                  How it&rsquo;s calculated
                </div>
                <p className="text-[14px] text-[var(--fg-muted)] mb-5">
                  Graduated, like tax brackets. Each rate applies only to the drivers inside that
                  band — your 51st driver doesn&rsquo;t reprice the first 50.
                </p>

                <div className="rounded-xl border border-[#1E3556] overflow-hidden mb-5">
                  <table className="w-full text-[14px]">
                    <thead>
                      <tr className="text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)] bg-white/[0.03]">
                        <th className="text-left font-bold px-4 py-2.5">Band</th>
                        <th className="text-right font-bold px-4 py-2.5">Per driver / mo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {BANDS.map((b) => (
                        <tr key={b.label} className="border-t border-[#1E3556]">
                          <td className="px-4 py-2.5 text-[var(--fg-muted)]">{b.label}</td>
                          <td className="px-4 py-2.5 text-right font-extrabold text-[var(--fg)] tabular-nums">${b.rate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="rounded-xl border border-[#1E3556] overflow-hidden">
                  <table className="w-full text-[14px]">
                    <thead>
                      <tr className="text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)] bg-white/[0.03]">
                        <th className="text-left font-bold px-4 py-2.5">Fleet</th>
                        <th className="text-right font-bold px-4 py-2.5">Monthly</th>
                        <th className="text-right font-bold px-4 py-2.5">Effective</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[10, 25, 50, 75, 100, 150].map((n) => (
                        <tr key={n} className="border-t border-[#1E3556]">
                          <td className="px-4 py-2.5 text-[var(--fg-muted)]">{n} drivers</td>
                          <td className="px-4 py-2.5 text-right font-extrabold text-[var(--fg)] tabular-nums">{usd(monthlyFor(n))}</td>
                          <td className="px-4 py-2.5 text-right text-[var(--fg-muted)] tabular-nums">${effectiveRate(n).toFixed(2)}/drv</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="text-[12px] text-[var(--fg-muted)] mt-4">
                  Example · 100 drivers = 50&times;$50 + 25&times;$40 + 25&times;$30 = <strong className="text-[var(--fg)]">{usd(monthlyFor(100))}/mo</strong>.
                  Running 250+, or need multi-yard, SSO and a custom SLA?{" "}
                  <Link href="/partners" className="text-[var(--accent)] font-bold hover:underline">Talk to us &rarr;</Link>
                </p>
              </div>
            </div>

            {/* Hazmat band — included in the plan, no upcharge. Sits under the
                ladder so the "no add-on" point lands during price comparison. */}
            <div className={`${cardDark} p-5 flex items-center justify-between gap-6 flex-wrap`}>
              <div>
                <div className="text-[11px] tracking-wider uppercase font-bold text-[var(--accent)] mb-1">★ INCLUDED</div>
                <div className="text-[18px] font-extrabold text-[var(--fg)]">
                  Hazmat Center · <span style={{ color: "var(--accent)" }}>no extra charge</span>
                </div>
                <p className="text-[14px] text-[var(--fg-muted)] mt-1">
                  Placard Wizard, 100 hazmat-only skills, segregation engine, ERG lookup, Hazmat endorsement. In every plan, at every fleet size — most competitors bill this separately.
                </p>
              </div>
              <Link href="/signup" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-[13px] text-[var(--bg)] whitespace-nowrap" style={ctaCyan}>
                ★ Start free trial →
              </Link>
            </div>
          </div>
        </section>

        {/* CRO #4 · OBJECTION / COUNTER-OBJECTION (O/CO) cards. Three highest-
            weight objections from sales calls and competitor SERP scrape, each
            named explicitly with the reframe right next to it. Sits AFTER
            pricing because that's where the doubt actually fires. */}
        <section id="objections" className="bg-[var(--bg)] py-20 border-y border-[var(--border)]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[var(--accent)] mb-2">
                05.5 · WHAT YOU&apos;RE PROBABLY THINKING
              </div>
              <h2 className="text-[32px] sm:text-[40px] font-extrabold tracking-tight text-[var(--fg)] mb-3 leading-tight">
                Three doubts. <span className="serif-italic" style={{ color: "var(--accent)" }}>Three honest answers.</span>
              </h2>
              <p className="text-[16px] text-[var(--fg-muted)] max-w-2xl mx-auto">
                Most sales pages dodge the hard part. We&apos;d rather just put it on the page.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                {
                  doubt: "I only run 8 trucks. Isn't this for big fleets?",
                  reframe: "Built for 1–500 PUs. Small carriers actually get audited more (new entrant + safety reviews), so the brain pays back faster.",
                  proof: "Pricing scales per-driver from day one · no minimum",
                  num: "01",
                },
                {
                  doubt: "What if it doesn't work? Am I locked in?",
                  reframe: "Cancel anytime in Settings → one click. You keep every PDF, every CSV, every log. The data is yours, not ours.",
                  proof: "One-click export · no penalty · no win-back call",
                  num: "02",
                },
                {
                  doubt: "AI hallucinates. What if it makes up a CFR cite?",
                  reframe: "Every CFR citation hits eCFR.gov live and shows a green ✓ chip. Citations that don't verify never leave the brain.",
                  proof: "Try the demo above · see the green chips yourself",
                  num: "03",
                },
              ].map((oco, i) => (
                <div
                  key={i}
                  className="relative rounded-2xl bg-black border border-[#1E3556] p-7 hover:border-[#16C7FF]/60 transition-colors"
                >
                  <div
                    aria-hidden="true"
                    className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl opacity-60"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent 0%, rgba(22,199,255,0.7) 50%, transparent 100%)",
                    }}
                  />
                  <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[var(--accent)] mb-3">
                    {oco.num} · THE DOUBT
                  </div>
                  <p className="text-[18px] font-bold text-[var(--fg)] leading-snug mb-5">
                    &ldquo;{oco.doubt}&rdquo;
                  </p>
                  <div className="text-[12px] tracking-[.18em] uppercase font-bold text-white mb-2">
                    OUR ANSWER
                  </div>
                  <p className="text-[15px] text-white leading-relaxed mb-4">
                    {oco.reframe}
                  </p>
                  <div className="pt-4 border-t border-[var(--border)]">
                    <div className="text-[14px] text-[var(--accent)] font-bold flex items-start gap-2">
                      <span className="flex-shrink-0">→</span>
                      <span>{oco.proof}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 06 · HAZMAT · included in the plan. Sits below pricing because it
            is only relevant to the ~15% of carriers hauling placarded loads,
            not because it costs extra — it does not. */}
        <section id="hazmat" className="relative py-20 overflow-hidden border-y border-[var(--border)] bg-[var(--bg-3)] scroll-mt-24">
          <div className="max-w-7xl mx-auto px-6 relative">
            <div className="text-center mb-10">
              <div className="inline-block text-[11px] tracking-[.18em] uppercase font-bold text-[var(--accent)] mb-3">
                06 · HAZMAT CENTER · INCLUDED
              </div>
              <h2 className="text-[32px] sm:text-[40px] lg:text-[44px] font-extrabold tracking-tight text-[var(--fg)] mb-3 leading-tight">
                Hauling placarded loads?{" "}
                <span className="serif-italic" style={{ color: "var(--accent)" }}>It&apos;s already in your plan.</span>
              </h2>
              <p className="text-[16px] text-[var(--fg-muted)] max-w-2xl mx-auto mb-2">
                For the ~15% of carriers running hazmat. 100 hazmat-only skills,
                the Placard Wizard, segregation engine, ERG lookup, and the Hazmat endorsement.
              </p>
              <p className="text-[13px] text-[var(--fg-faint)] max-w-2xl mx-auto mb-8">
                Included at every fleet size — no add-on, no upcharge. Ignore it if you don&apos;t haul hazmat.
              </p>
            </div>

            <div className="max-w-5xl mx-auto mb-8">
              <HazmatPreview />
            </div>

            <div className="text-center">
              <Link href="/signup" className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[15px] text-[var(--bg)]" style={ctaCyan}>
                ★ Start free trial →
              </Link>
            </div>
          </div>
        </section>


        {/* Thin cyan separator between the Hazmat section and section 08 (FAQs) */}
        <div className="max-w-7xl mx-auto px-6">
          <div
            aria-hidden="true"
            className="h-px w-full"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(22,199,255,0.35) 50%, transparent 100%)",
            }}
          />
        </div>

        {/* 08 · FAQS · full set inline, grouped by section, 2 columns on md+ */}
        <section id="faqs" className="relative py-20 scroll-mt-24">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <div className="inline-block text-[11px] tracking-[.18em] uppercase font-bold text-[var(--accent)] mb-3">
                08 · FAQS
              </div>
              <h2 className="text-[40px] sm:text-[48px] font-extrabold tracking-tight text-[var(--fg)] mb-3 leading-tight">
                Short answers.{" "}
                <span className="serif-italic" style={{ color: "var(--accent)" }}>Real ones.</span>
              </h2>
              <p className="text-[16px] text-[var(--fg-muted)]">
                Every question fleets ask before signing up. Click any to expand.
              </p>
            </div>

            {/* Manual split into 2 columns — General + Pricing left, Data + Compliance + Account right. Stacks on mobile. */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-10">
              {([
                // Column 1
                [
                  {
                    section: "GENERAL",
                    items: [
                      { q: "What is X3 Compass?", a: "X3 Compass is the AI Safety Director for motor carriers running 1–100 power units. The X3 compliance corpus powers DQ Files, MVR, HOS, D&A, CSA, Training, Hazmat, and the rest of the integrated product family — every answer grounded in the actual CFR." },
                      { q: "Who is it for?", a: "Owner-operators, small fleets, and mid-size carriers who can't justify a full-time $100K/yr Safety Director. One plan, graduated per-driver: $50/driver for your first 50, then $40, $30 and $25 per driver as the fleet grows. Every product is included at every size." },
                      { q: "How is this different from X3 Fleet Safety?", a: COMPASS_COPY.delivery },
                      { q: "Is this a real product or vaporware?", a: "Real. Twelve brains live, dashboard built, and a 67,000-document CFR knowledge base behind every answer — with our skills library published on GitHub (github.com/x3fleetsafety/skills). You can start a 7-day trial right now." },
                    ],
                  },
                  {
                    section: "PRICING & BILLING",
                    items: [
                      { q: "How much does it cost?", a: COMPASS_COPY.pricing },
                      { q: "Is there a free trial?", a: COMPASS_COPY.trial },
                      { q: "Do I lose features at the lower rates?", a: COMPASS_COPY.included },
                      { q: "What if I have more than 100 drivers?", a: "That's Enterprise. Call us. Volume pricing, dedicated advisor team, white-label dashboard for partners, SSO, custom CFR skills." },
                    ],
                  },
                ],
                // Column 2
                [
                  {
                    section: "DATA & INTEGRATIONS",
                    items: [
                      { q: "How does my fleet data get into X3 Compass?", a: "Three ways: (1) Upload our CSV templates — one row per driver, one per vehicle, one per inspection. (2) Enter manually via the in-app forms — every field is CFR-labeled. (3) Send data via API — endpoint URL and key are in Settings, full docs available." },
                      { q: "Do you integrate with my ELD provider?", a: "Not yet, but the API supports any ELD vendor that can webhook out (Motive, Samsara, Geotab, etc.). On the roadmap: direct OAuth connectors. For now, CSV import works for batch updates." },
                      { q: "FMCSA Clearinghouse?", a: "We track every query you owe and remind you before the deadline (§ 382.701(b) annual queries, § 382.701(a) pre-employment). When you run a query through the FMCSA portal, you log the result in X3 Compass and we file it with the driver's DQ packet." },
                      { q: "Background checks and MVR?", a: "Order pre-employment background checks and annual MVR pulls directly from the app — we wrap Checkr and SambaSafety. Cost is per-package and rolled into your monthly invoice. No separate vendor account." },
                    ],
                  },
                  {
                    section: "COMPLIANCE & AUDIT",
                    items: [
                      { q: "What if I get a DOT audit?", a: "Click “Audit Export” in the sidebar. We generate a single PDF bundle: every § 391.51 DQ file, every accident, every inspection, every D&A test, every training cert — 3-year retention complete, indexed, watermarked. You walk into the audit with a USB drive." },
                      { q: "Are answers really CFR-cited?", a: "Yes. Every Compass response shows the regulation it's grounded in (e.g., '§ 395.3 · 14-hour rule'). If we don't have a high-confidence answer rooted in CFR, we tell you and escalate to an X3 safety advisor or recommend you call FMCSA directly." },
                      { q: "Does Compass make legal recommendations?", a: "Compass cites regulation and best practices. It's not a substitute for an attorney or for FMCSA's own published interpretations. For litigation, hire counsel. For interpretation rulings, ask FMCSA. For everything else — that's what Compass is for." },
                    ],
                  },
                  {
                    section: "ACCOUNT & SECURITY",
                    items: [
                      { q: "How do team seats work?", a: "The Compass plan includes unlimited team seats. Roles: owner, admin, dispatcher, safety, billing. Invite people from Settings. They each get their own login, audit trail, and notification preferences." },
                      { q: "How secure is my data?", a: "Encrypted in transit (TLS 1.3) and at rest (AES-256). Hosted on Cloudflare + Supabase. SOC 2 Type II inheritance via our infrastructure providers. Dedicated security page coming with our own attestation." },
                      { q: "Can I export my data and leave?", a: "Yes, any time. Export every CSV, every PDF, every audit bundle. No lock-in. We charge for the brain, not for keeping your files hostage." },
                    ],
                  },
                ],
              ] as Array<Array<{ section: string; items: Array<{ q: string; a: string }> }>>).map((column, ci) => (
                <div key={ci} className="space-y-8">
                  {column.map((sec) => {
                    // Same 6-variant gradient stripe set used on the homepage
                    // skill tiles + /skills catalog (Sprint #434), cycled per item.
                    const FAQ_STRIPES = [
                      "linear-gradient(90deg, #16C7FF 0%, #16C7FF 50%, #16C7FF 100%)",
                      "linear-gradient(90deg, #16C7FF 0%, #16C7FF 50%, #5EE5FF 100%)",
                      "linear-gradient(90deg, #5EE5FF 0%, #16C7FF 50%, #16C7FF 100%)",
                      "linear-gradient(90deg, #16C7FF 0%, #5EE5FF 50%, #16C7FF 100%)",
                      "linear-gradient(90deg, #16C7FF 0%, #5EE5FF 50%, #16C7FF 100%)",
                      "linear-gradient(90deg, #5EE5FF 0%, #16C7FF 50%, #16C7FF 100%)",
                    ];
                    return (
                      <div key={sec.section}>
                        <div className="text-[10.5px] tracking-[.20em] uppercase font-extrabold text-[#16C7FF]/80 mb-3 pl-1">
                          {sec.section}
                        </div>
                        <div className="space-y-3">
                          {sec.items.map((item, ii) => (
                            <details
                              key={ii}
                              className="group rounded-2xl border border-[#1E3556] bg-black relative overflow-hidden hover:border-[#16C7FF]/50 hover:shadow-[0_0_28px_rgba(22,199,255,0.18)] transition-all"
                            >
                              {/* Top gradient stripe · matches the skill tiles */}
                              <span
                                aria-hidden="true"
                                className="absolute left-0 right-0 top-0 h-[3px]"
                                style={{ background: FAQ_STRIPES[ii % FAQ_STRIPES.length] }}
                              />
                              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none px-5 pt-6 pb-5 [&::-webkit-details-marker]:hidden">
                                <h3 className="text-[15px] sm:text-[16px] font-bold text-white leading-snug">
                                  {item.q}
                                </h3>
                                <svg
                                  aria-hidden="true"
                                  className="w-5 h-5 flex-shrink-0 text-[#16C7FF] transition-transform duration-200 group-open:rotate-180"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M6 9l6 6 6-6" />
                                </svg>
                              </summary>
                              <p className="px-5 pb-5 text-[14px] text-white/75 leading-relaxed">
                                {item.a}
                              </p>
                            </details>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
