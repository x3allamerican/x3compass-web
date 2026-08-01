import Link from "next/link";
import SiteShell from "@/components/SiteShell";

const FAQS = [
  {
    section: "GENERAL",
    items: [
      { q: "What is X3 Compass?", a: "X3 Compass is the AI Safety Director for motor carriers running 1–100 power units. Twelve specialized brains (DQ Files, MVR, HOS, D&A, CSA, Training, Hazmat, etc.), backed by a 67,000-document CFR knowledge base — every answer grounded in the actual CFR." },
      { q: "Who is it for?", a: "Owner-operators, small fleets, and mid-size carriers who can't justify a full-time $100K/yr Safety Director. One plan, graduated per-driver: $50/driver for your first 50, then $40, $30 and $25 per driver as the fleet grows. Every product is included at every size." },
      { q: "How is this different from X3 Fleet Safety?", a: "X3 Fleet Safety is the human-led compliance service · a real safety advisor working your account. X3 Compass is the AI platform that powers it, now shipping as one plan with every product included. Same DOT expertise. Different delivery model." },
      { q: "Is this a real product or vaporware?", a: "Real. Twelve brains live, dashboard built, and a 67,000-document CFR knowledge base behind every answer — with our skills library published on GitHub (github.com/x3fleetsafety/skills). You can start a 7-day trial right now." },
    ],
  },
  {
    section: "PRICING & BILLING",
    items: [
      { q: "How much does it cost?", a: "One graduated plan: $50/driver/mo for drivers 1–50, $40 for 51–75, $30 for 76–100, and $25 for 101+. Each rate applies only to the drivers in that band, so a 100-driver fleet pays $4,250/mo — not 100 × $30. $100/mo minimum. Every X3 product is included. Hazmat add-on is +$99/month." },
      { q: "Is there a free trial?", a: "Yes · 7 days, no credit card required. Every brain, the full knowledge base, and the Hazmat add-on are included in the trial. After 7 days you pick a plan or cancel." },
      { q: "Do I lose features at the lower rates?", a: "No. Every X3 product is included at every fleet size. The rate per driver falls as you grow; the product never changes." },
      { q: "What if I have more than 100 drivers?", a: "That's Enterprise. Call us. Volume pricing, dedicated advisor team, white-label dashboard for partners, SSO, custom CFR skills." },
    ],
  },
  {
    section: "DATA & INTEGRATIONS",
    items: [
      { q: "How does my fleet data get into X3 Compass?", a: "Three ways: (1) Upload our CSV templates · one row per driver, one per vehicle, one per inspection. (2) Enter manually via the in-app forms · every field is CFR-labeled. (3) Send data via API · endpoint URL and key are in Settings, full docs available." },
      { q: "Do you integrate with my ELD provider?", a: "Not yet, but the API supports any ELD vendor that can webhook out (Motive, Samsara, Geotab, etc.). On the roadmap: direct OAuth connectors. For now, CSV import works for batch updates." },
      { q: "FMCSA Clearinghouse?", a: "We track every query you owe and remind you before the deadline (§ 382.701(b) annual queries, § 382.701(a) pre-employment). When you run a query through the FMCSA portal, you log the result in X3 Compass and we file it with the driver's DQ packet." },
      { q: "Background checks and MVR?", a: "Order pre-employment background checks and annual MVR pulls directly from the app · we wrap Checkr and SambaSafety. Cost is per-package and rolled into your monthly invoice. No separate vendor account." },
    ],
  },
  {
    section: "COMPLIANCE & AUDIT",
    items: [
      { q: "What if I get a DOT audit?", a: "Click 'Audit Export' in the sidebar. We generate a single PDF bundle: every § 391.51 DQ file, every accident, every inspection, every D&A test, every training cert · 3-year retention complete, indexed, watermarked. You walk into the audit with a USB drive." },
      { q: "Are answers really CFR-cited?", a: "Yes. Every Compass response shows the regulation it's grounded in (e.g., '§ 395.3 · 14-hour rule'). If we don't have a high-confidence answer rooted in CFR, we tell you and escalate to an X3 safety advisor or recommend you call FMCSA directly." },
      { q: "Does Compass make legal recommendations?", a: "Compass cites regulation and best practices. It's not a substitute for an attorney or for FMCSA's own published interpretations. For litigation, hire counsel. For interpretation rulings, ask FMCSA. For everything else · that's what Compass is for." },
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
      <div className="bg-[#000000] text-white">
        {/* HERO */}
        <section className="max-w-4xl mx-auto px-6 pt-16 pb-12 text-center relative">
          <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[#16C7FF] mb-4">
            FREQUENTLY ASKED QUESTIONS
          </div>
          <h1 className="text-[44px] sm:text-[60px] font-extrabold text-white tracking-tight leading-[1.05] mb-4">
            Short answers.{" "}
            <span className="serif-italic" style={{ color: "#16C7FF" }}>Real ones.</span>
          </h1>
          <p className="text-[17px] text-white/65">
            Can&apos;t find what you need? <Link href="mailto:joshua@x3compass.com" className="text-[#16C7FF] font-bold">Email us</Link> or{" "}
            <Link href="/app/ask" className="text-[#16C7FF] font-bold">ask Compass directly</Link>.
          </p>
        </section>

        {/* FAQ sections */}
        <div className="max-w-4xl mx-auto px-6 pb-24 space-y-16">
          {FAQS.map((sec) => (
            <section key={sec.section}>
              <div className="flex items-center gap-3 mb-6">
                <span className="text-[11px] tracking-[.18em] uppercase font-bold text-[#16C7FF]">{sec.section}</span>
                <span className="flex-1 h-px bg-[#1E3556]" />
              </div>
              <div className="space-y-3">
                {sec.items.map((f, i) => (
                  <details
                    key={i}
                    className="group bg-[#000000] border border-[#1E3556] rounded-xl hover:border-[#16C7FF]/40 transition-colors"
                  >
                    <summary className="px-5 py-4 cursor-pointer list-none flex items-center justify-between gap-4">
                      <span className="text-[15px] font-bold text-white">{f.q}</span>
                      <span
                        className="w-7 h-7 rounded-full grid place-items-center text-[14px] text-[#000000] font-black flex-shrink-0 group-open:rotate-45 transition-transform"
                        style={{ background: "linear-gradient(135deg, #16C7FF, #16C7FF)" }}
                      >
                        +
                      </span>
                    </summary>
                    <div className="px-5 pb-5 text-[14px] text-white/75 leading-relaxed">
                      {f.a}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Final CTA */}
        <section className="relative py-16 overflow-hidden border-t border-[#1E3556] bg-[#091525]">
          <div className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(800px 500px at 25% 100%, rgba(2, 6, 12, 0.45), transparent 60%), radial-gradient(700px 400px at 85% 0%, rgba(139, 92, 246, 0.18), transparent 60%)",
            }}
          />
          <div className="max-w-3xl mx-auto px-6 text-center relative">
            <h2 className="text-[32px] sm:text-[40px] font-extrabold text-white mb-4 leading-tight">
              Still have questions?{" "}
              <span className="serif-italic" style={{ color: "#16C7FF" }}>Ask Compass.</span>
            </h2>
            <p className="text-[16px] text-white/65 mb-6">
              No signup needed. Try the demo brain · answers in seconds, cited to the CFR.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href="/app/ask" className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[15px] text-[#000000]"
                style={{ background: "linear-gradient(135deg, #16C7FF, #16C7FF)", boxShadow: "0 6px 18px rgba(2, 6, 12, 0.45)" }}
              >
                ★ Ask Compass →
              </Link>
              <Link href="/signup" className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[15px] text-white border border-white/25 hover:bg-white/5">
                Start 7-day trial
              </Link>
            </div>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
