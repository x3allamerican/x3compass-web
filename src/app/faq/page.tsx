import Link from "next/link";
import SiteShell from "@/components/SiteShell";

const FAQS = [
  {
    section: "GENERAL",
    items: [
      { q: "What is X3 Compass?", a: "X3 Compass is the AI Safety Director for motor carriers running 1–100 power units. Twelve specialized brains (DQ Files, MVR, HOS, D&A, CSA, Training, Hazmat, etc.), 300 published FMCSA skills, all answers grounded in the actual CFR." },
      { q: "Who is it for?", a: "Owner-operators, small fleets, and mid-size carriers who can't justify a full-time $100K/yr Safety Director. Two flavors: DIY at $25/driver if you want to drive the dashboard yourself, or DFY at $50/driver if you want a real X3 safety advisor managing it for you." },
      { q: "How is this different from X3 Fleet Safety?", a: "X3 Fleet Safety is the human-led compliance service — a real safety advisor working your account, billed at $50/driver. X3 Compass is the AI platform that powers it (and that you can run yourself at $25/driver). Same DOT expertise. Different delivery model." },
      { q: "Is this a real product or vaporware?", a: "Real. Twelve brains live, dashboard built, 100 skills published on GitHub (github.com/x3fleetsafety/skills) with the other 200 in the pipeline. You can start a 7-day trial right now." },
    ],
  },
  {
    section: "PRICING & BILLING",
    items: [
      { q: "How much does it cost?", a: "DIY (Compass AI) is $25 per driver per month. DFY (Compass Concierge) is $50 per driver per month. Enterprise (100+ trucks) is custom pricing — call us. Hazmat add-on is +$99/month on any tier." },
      { q: "Is there a free trial?", a: "Yes — 7 days, no credit card required. Every brain, all 300 skills, and the Hazmat add-on are included in the trial. After 7 days you pick a plan or cancel." },
      { q: "Can I switch between DIY and DFY?", a: "Yes, any time. Upgrade to DFY when you want a human in the loop, downgrade back to DIY when you're confident running it yourself. We pro-rate the change." },
      { q: "Annual discount?", a: "Yes — pay annually and get 2 months free (16% off). Toggle on the pricing page." },
      { q: "What if I have more than 100 drivers?", a: "That's Enterprise. Call us. Volume pricing, dedicated advisor team, white-label dashboard for partners, SSO, custom CFR skills." },
    ],
  },
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
      { q: "What if I get a DOT audit?", a: "Click 'Audit Export' in the sidebar. We generate a single PDF bundle: every § 391.51 DQ file, every accident, every inspection, every D&A test, every training cert — 3-year retention complete, indexed, watermarked. You walk into the audit with a USB drive." },
      { q: "Are answers really CFR-cited?", a: "Yes. Every Compass response shows the regulation it's grounded in (e.g., '§ 395.3 — 14-hour rule'). If we don't have a high-confidence answer rooted in CFR, we tell you and escalate to an X3 safety advisor (DFY plans) or recommend you call FMCSA directly." },
      { q: "Does Compass make legal recommendations?", a: "Compass cites regulation and best practices. It's not a substitute for an attorney or for FMCSA's own published interpretations. For litigation, hire counsel. For interpretation rulings, ask FMCSA. For everything else — that's what Compass is for." },
    ],
  },
  {
    section: "ACCOUNT & SECURITY",
    items: [
      { q: "How do team seats work?", a: "Every tier includes unlimited team seats. Roles: owner, admin, dispatcher, safety, billing. Invite people from Settings. They each get their own login, audit trail, and notification preferences." },
      { q: "How secure is my data?", a: "Encrypted in transit (TLS 1.3) and at rest (AES-256). Hosted on Cloudflare + Supabase. SOC 2 Type II inheritance via our infrastructure providers. Dedicated security page coming with our own attestation." },
      { q: "Can I export my data and leave?", a: "Yes, any time. Export every CSV, every PDF, every audit bundle. No lock-in. We charge for the brain, not for keeping your files hostage." },
    ],
  },
];

export default function FAQ() {
  return (
    <SiteShell>
      <div className="bg-[var(--bg)] text-[var(--fg)]">
        {/* HERO with real driver-thinking photo */}
        <section className="relative overflow-hidden border-b border-[var(--border)]">
          <div className="absolute inset-0 -z-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/photos/faq-driver-thinking.jpg" alt="" aria-hidden="true" className="w-full h-full object-cover opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg)]/85 via-[var(--bg)]/95 to-[var(--bg)]" />
          </div>
          <div className="max-w-4xl mx-auto px-6 pt-20 pb-14 text-center relative">
          <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[#22D3EE] mb-4">
            FREQUENTLY ASKED QUESTIONS
          </div>
          <h1 className="text-[44px] sm:text-[60px] font-extrabold text-[var(--fg)] tracking-tight leading-[1.05] mb-4">
            Short answers.{" "}
            <span className="serif-italic" style={{ color: "#22D3EE" }}>Real ones.</span>
          </h1>
          <p className="text-[17px] text-[var(--fg-muted)]">
            Can&apos;t find what you need? <Link href="mailto:joshua@x3compass.com" className="text-[#22D3EE] font-bold">Email us</Link> or{" "}
            <Link href="/app/ask" className="text-[#22D3EE] font-bold">ask Compass directly</Link>.
          </p>
        </section>

        {/* FAQ sections */}
        <div className="max-w-4xl mx-auto px-6 pb-24 space-y-16">
          {FAQS.map((sec) => (
            <section key={sec.section}>
              <div className="flex items-center gap-3 mb-6">
                <span className="text-[11px] tracking-[.18em] uppercase font-bold text-[#22D3EE]">{sec.section}</span>
                <span className="flex-1 h-px bg-[var(--border)]" />
              </div>
              <div className="space-y-3">
                {sec.items.map((f, i) => (
                  <details
                    key={i}
                    className="group bg-[var(--surface)] border border-[var(--border)] rounded-xl hover:border-[#22D3EE]/40 transition-colors"
                  >
                    <summary className="px-5 py-4 cursor-pointer list-none flex items-center justify-between gap-4">
                      <span className="text-[15px] font-bold text-[var(--fg)]">{f.q}</span>
                      <span
                        className="w-7 h-7 rounded-full grid place-items-center text-[14px] text-[var(--bg)] font-black flex-shrink-0 group-open:rotate-45 transition-transform"
                        style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)" }}
                      >
                        +
                      </span>
                    </summary>
                    <div className="px-5 pb-5 text-[14px] text-[var(--fg-muted)] leading-relaxed">
                      {f.a}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Final CTA */}
        <section className="relative py-16 overflow-hidden border-t border-[var(--border)] bg-[var(--bg-3)]">
          {/* decorative wash removed for production design pass */}
          <div className="max-w-3xl mx-auto px-6 text-center relative">
            <h2 className="text-[32px] sm:text-[40px] font-extrabold text-[var(--fg)] mb-4 leading-tight">
              Still have questions?{" "}
              <span className="serif-italic" style={{ color: "#22D3EE" }}>Ask Compass.</span>
            </h2>
            <p className="text-[16px] text-[var(--fg-muted)] mb-6">
              No signup needed. Try the demo brain — answers in seconds, cited to the CFR.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href="/app/ask" className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[15px] text-[var(--bg)]"
                style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)", boxShadow: "0 6px 18px rgba(34, 211, 238, 0.32)" }}
              >
                ★ Ask Compass →
              </Link>
              <Link href="/signup" className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[15px] text-[var(--fg)] border border-white/25 hover:bg-white/5">
                Start 7-day trial
              </Link>
            </div>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
