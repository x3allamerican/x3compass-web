import Link from "next/link";
import SiteShell from "@/components/SiteShell";
import BrainGrid from "@/components/BrainGrid";

const SKILLS = [
  { cat: "dqf",       cfr: "§ 391.51",    name: "Driver Qualification File", q: "What's missing from this DQF?" },
  { cat: "dqf",       cfr: "§ 391.41",    name: "Medical Certification",     q: "Driver's med card expired — can he drive?" },
  { cat: "dqf",       cfr: "FCRA",        name: "Adverse Action Prep",       q: "How do I write the FCRA denial letter?" },
  { cat: "hos",       cfr: "Part 395",    name: "Hours of Service",          q: "Walk me through the 14-hour rule" },
  { cat: "hos",       cfr: "§ 395.20",    name: "ELD Compliance",            q: "My ELD says malfunction — what now?" },
  { cat: "hos",       cfr: "§ 395.1(g)",  name: "Split-Sleeper Berth",       q: "Explain the 7/3 split" },
  { cat: "da",        cfr: "Part 382",    name: "Drug & Alcohol Testing",    q: "What's my random rate this year?" },
  { cat: "da",        cfr: "§ 382.701",   name: "Clearinghouse Queries",     q: "When is a full query required?" },
  { cat: "da",        cfr: "§ 382.303",   name: "Post-Accident Testing",     q: "Driver had a crash. Now what?" },
  { cat: "csa",       cfr: "Part 385",    name: "CSA / BASIC Scoring",       q: "Why did my HOS BASIC spike?" },
  { cat: "csa",       cfr: "Part 386",    name: "DataQ Disputes ⭐",         q: "Is this inspection contestable?" },
  { cat: "csa",       cfr: "§ 385.6",     name: "Intervention Thresholds",   q: "What triggers a CR notice?" },
  { cat: "vehicles",  cfr: "Part 396",    name: "Maintenance Program",       q: "Build me a 396 PM schedule" },
  { cat: "vehicles",  cfr: "§ 396.17",    name: "Annual DOT Inspection",     q: "What's checked in the annual?" },
  { cat: "vehicles",  cfr: "§ 396.11",    name: "DVIR Records",              q: "Are DVIRs required if no defects?" },
  { cat: "hazmat",    cfr: "Part 172",    name: "Hazmat Placarding",         q: "4,000 lbs of UN1203 — placards?" },
  { cat: "hazmat",    cfr: "§ 177.848",   name: "Segregation Tables",        q: "Class 3 + Class 8 together?" },
  { cat: "hazmat",    cfr: "49 CFR 1572", name: "TSA H Endorsement",         q: "How long is H valid?" },
];

const PRICING = [
  {
    tier: "DIY", subtitle: "Compass AI",
    headline: "$25", unit: "per driver / mo",
    desc: "You drive the dashboard. AI does most of the work.",
    bullets: ["All 12 brains, all 300 skills", "CSV import + manual entry", "Daily compliance digest", "One-click audit export", "Unlimited team seats", "Up to 100 drivers"],
    cta: "Start free trial",
    popular: false,
  },
  {
    tier: "DFY", subtitle: "Compass Concierge",
    headline: "$50", unit: "per driver / mo",
    desc: "We drive the dashboard for you.",
    bullets: ["Everything in DIY", "Dedicated X3 safety advisor", "Live monitoring + intervention", "Quarterly compliance review calls", "Audit prep support", "Up to 100 drivers"],
    cta: "Start free trial",
    popular: true,
  },
  {
    tier: "Enterprise", subtitle: "For 100+ trucks",
    headline: "Call us", unit: "custom pricing",
    desc: "For fleets over 100 trucks.",
    bullets: ["Everything in DFY", "White-label partner dashboard", "SSO + dedicated advisor team", "Custom CFR skills", "Volume pricing"],
    cta: "Talk to sales",
    popular: false,
  },
];

const STEPS = [
  { n: 1, title: "Sign up & import drivers",       desc: "Import via CSV (we provide the template) or add drivers one at a time. We auto-seed every § 391 DQ slot." },
  { n: 2, title: "Upload what you have",            desc: "Drop in med certs, CDL copies, prior-employer inquiries, Clearinghouse queries. Missing slots light up red." },
  { n: 3, title: "Log events as they happen",       desc: "Roadside inspection this morning? Random D&A Tuesday? Two-minute entries thread into CSA and the audit picture automatically." },
  { n: 4, title: "Read the morning digest",         desc: "7am email tells you what expires in the next 30 days. Handle today's items. Tomorrow you do it again. That's it." },
];

const cardDark = "bg-[#15233D] border border-[#1E3556] rounded-2xl hover:border-[#22D3EE]/40 transition-colors";
const ctaCyan = { background: "linear-gradient(135deg, #22D3EE, #06B6D4)", boxShadow: "0 6px 18px rgba(34, 211, 238, 0.32)" };

export default function Home() {
  return (
    <SiteShell>
      <div className="bg-[#0A1929] text-white">
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(900px 500px at 20% 0%, rgba(34, 211, 238, 0.18), transparent 60%), radial-gradient(700px 400px at 80% 100%, rgba(139, 92, 246, 0.14), transparent 60%)",
            }}
          />
          <div className="max-w-7xl mx-auto px-6 pt-20 pb-24 relative">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-block text-[11px] tracking-[.18em] uppercase font-bold text-[#22D3EE] mb-6">
                EST. 2025 · 300 SKILLS · 12 BRAINS · BUILT BY FLEET OPERATORS
              </div>
              <h1 className="font-extrabold text-white tracking-tight leading-[1.05] text-[44px] sm:text-[60px] md:text-[72px] mb-6">
                An AI Safety Director.
                <br />
                <span className="serif-italic" style={{ color: "#22D3EE" }}>Or a real one.</span>{" "}
                Both work.
              </h1>
              <p className="text-[18px] text-white/75 max-w-2xl mx-auto mb-8 leading-relaxed">
                Driver qualification files, MVRs, drug & alcohol, Clearinghouse, CSA scores, training, hazmat — every FMCSA artifact, every CFR-cited answer.{" "}
                <strong className="text-white">DIY at $25/driver</strong> or <strong className="text-white">done-for-you at $50/driver</strong>.
              </p>
              <div className="flex gap-3 justify-center flex-wrap mb-4">
                <Link href="/app" className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[15px] text-[#0A1929]" style={ctaCyan}>
                  ★ Start free trial →
                </Link>
                <Link href="/app" className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[15px] text-white border border-white/25 hover:bg-white/5">
                  See the dashboard
                </Link>
              </div>
              <div className="text-[11px] tracking-[.18em] uppercase font-bold text-white/45">
                Trained on 49 CFR Parts 380–399 · 100 published skills on GitHub · 7-day trial, no card
              </div>
            </div>
          </div>
        </section>

        {/* STAT BAND */}
        <section className="border-y border-[#1E3556] bg-[#091525]">
          <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { n: "300", desc: "FMCSA skills, every one CFR-cited" },
              { n: "12",  desc: "Specialized brains, one per compliance domain" },
              { n: "$25", desc: "per driver, DIY · or $50 done-for-you" },
            ].map((s, i) => (
              <div key={i} className="text-center md:text-left">
                <div className="text-[64px] sm:text-[80px] font-black leading-none" style={{ color: "#22D3EE" }}>{s.n}</div>
                <div className="serif-italic text-white/85 text-[18px] mt-2">{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 01 · TWELVE BRAINS */}
        <section id="services" className="max-w-7xl mx-auto px-6 py-24">
          <div className="inline-flex gap-1 mb-3">
            <span className="w-7 h-[3px] bg-[#22D3EE]" />
            <span className="w-7 h-[3px] bg-white/30" />
          </div>
          <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[#22D3EE] mb-2">01 · TWELVE BRAINS</div>
          <h2 className="text-[40px] sm:text-[48px] font-extrabold tracking-tight text-white mb-3 leading-tight">
            Twelve brains. <span className="serif-italic" style={{ color: "#22D3EE" }}>One subscription.</span>
          </h2>
          <p className="text-[17px] text-white/65 max-w-2xl mb-12">
            Each brain is built around the actual regulation — not a generic vault that forces you to learn a new filing system. Sign in to open any brain directly in the app.
          </p>
          <BrainGrid />
        </section>

        {/* 02 · DASHBOARD */}
        <section className="bg-[#091525] border-y border-[#1E3556] py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[#22D3EE] mb-2">02 · THE DASHBOARD</div>
              <h2 className="text-[40px] sm:text-[48px] font-extrabold tracking-tight text-white mb-3 leading-tight">
                The screen you live in.{" "}
                <span className="serif-italic" style={{ color: "#22D3EE" }}>Every signal, one page.</span>
              </h2>
              <p className="text-[17px] text-white/65 mb-8">
                Sidebar of drivers. KPI strip up top. CSA BASICs, expirations, inspections — all on one screen. Your AI Safety Director sits in the lower right and tells you exactly what to do next.
              </p>
              <Link href="/app" className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[15px] text-[#0A1929]" style={ctaCyan}>
                Open the live dashboard →
              </Link>
            </div>
          </div>
        </section>

        {/* 03 · 300 SKILLS */}
        <section id="skills" className="max-w-7xl mx-auto px-6 py-24">
          <div className="inline-flex gap-1 mb-3">
            <span className="w-7 h-[3px] bg-[#22D3EE]" />
            <span className="w-7 h-[3px] bg-white/30" />
          </div>
          <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[#22D3EE] mb-2">03 · 300 PUBLISHED SKILLS</div>
          <h2 className="text-[40px] sm:text-[48px] font-extrabold tracking-tight text-white mb-3 leading-tight">
            Ask any FMCSA question.{" "}
            <span className="serif-italic" style={{ color: "#22D3EE" }}>Get a CFR-cited answer.</span>
          </h2>
          <p className="text-[17px] text-white/65 max-w-2xl mb-12">
            Every skill is a published, version-controlled prompt. Click a chip to start a conversation with the brain that owns it.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SKILLS.map((s, i) => (
              <Link key={i} href="/app/ask" className={`${cardDark} relative pr-10 block p-5`}>
                <div className="inline-block text-[10px] font-bold tracking-wider text-[#22D3EE] bg-[#22D3EE]/10 border border-[#22D3EE]/25 px-2 py-1 rounded-full font-mono mb-2">
                  {s.cfr}
                </div>
                <div className="text-[15px] font-bold text-white mb-1">{s.name}</div>
                <div className="text-[13px] italic text-white/55">&ldquo;{s.q}&rdquo;</div>
                <div className="absolute right-5 top-5 text-[#22D3EE] font-bold">→</div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-10 text-[14px] text-white/55">
            Want the full list?{" "}
            <Link href="/app/ask" className="text-[#22D3EE] font-bold">Browse all 300 skills →</Link>
          </div>
        </section>

        {/* 04 · HAZMAT */}
        <section className="relative py-20 overflow-hidden border-y border-[#1E3556] bg-[#091525]">
          <div className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(700px 400px at 15% 100%, rgba(34, 211, 238, 0.16), transparent 60%), radial-gradient(700px 400px at 90% 0%, rgba(139, 92, 246, 0.16), transparent 60%)",
            }}
          />
          <div className="max-w-7xl mx-auto px-6 text-center relative">
            <div className="inline-block text-[11px] tracking-[.18em] uppercase font-bold text-[#22D3EE] mb-3">
              04 · HAZMAT CENTER
            </div>
            <h2 className="text-[40px] sm:text-[48px] font-extrabold tracking-tight text-white mb-3 leading-tight">
              100 hazmat skills.{" "}
              <span className="serif-italic" style={{ color: "#22D3EE" }}>One Placard Wizard.</span>
            </h2>
            <p className="text-[17px] text-white/65 max-w-2xl mx-auto mb-8">
              Class 1 explosives through Class 9 miscellaneous. Plus security plans, segregation, and the TSA-H clock.
            </p>
            <Link href="/hazmat" className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[15px] text-[#0A1929]" style={ctaCyan}>
              Open the Hazmat Center →
            </Link>
          </div>
        </section>

        {/* 05 · HOW IT WORKS */}
        <section id="how" className="max-w-7xl mx-auto px-6 py-24">
          <div className="inline-flex gap-1 mb-3">
            <span className="w-7 h-[3px] bg-[#22D3EE]" />
            <span className="w-7 h-[3px] bg-white/30" />
          </div>
          <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[#22D3EE] mb-2">05 · HOW IT WORKS</div>
          <h2 className="text-[40px] sm:text-[48px] font-extrabold tracking-tight text-white mb-3 leading-tight">
            Live in the next <span className="serif-italic" style={{ color: "#22D3EE" }}>lunch break.</span>
          </h2>
          <p className="text-[17px] text-white/65 max-w-2xl mb-12">
            Import drivers, upload what you have, log events as they happen, read the morning digest. That&apos;s the whole job.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map((s) => (
              <div key={s.n} className={`${cardDark} p-6`}>
                <div
                  className="w-9 h-9 rounded-full grid place-items-center text-[#0A1929] font-black mb-3"
                  style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)", boxShadow: "0 4px 12px rgba(34, 211, 238, 0.32)" }}
                >
                  {s.n}
                </div>
                <h3 className="text-[16px] font-bold text-white mb-2">{s.title}</h3>
                <p className="text-[14px] text-white/65 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 06 · PRICING */}
        <section id="pricing" className="bg-[#091525] border-y border-[#1E3556] py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="inline-flex gap-1 mb-3">
              <span className="w-7 h-[3px] bg-[#22D3EE]" />
              <span className="w-7 h-[3px] bg-white/30" />
            </div>
            <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[#22D3EE] mb-2">06 · PRICING</div>
            <h2 className="text-[40px] sm:text-[48px] font-extrabold tracking-tight text-white mb-3 leading-tight">
              Drive it yourself.{" "}
              <span className="serif-italic" style={{ color: "#22D3EE" }}>Or let us drive it for you.</span>
            </h2>
            <p className="text-[17px] text-white/65 max-w-2xl mb-3">
              Every tier includes all 12 brains and all 300 skills. The only difference is who&apos;s holding the wheel.
            </p>
            <div className="text-[11px] tracking-[.18em] uppercase font-bold text-white mb-12">
              ★ TRY EVERY BRAIN — PLUS HAZMAT — FREE FOR 7 DAYS. NO CARD REQUIRED.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
              {PRICING.map((p, i) => (
                <div
                  key={i}
                  className={`relative flex flex-col rounded-2xl p-7 ${
                    p.popular
                      ? "border-[#22D3EE]/60 shadow-[0_18px_50px_rgba(34,211,238,0.18)]"
                      : "border-[#1E3556]"
                  } border`}
                  style={{ background: "linear-gradient(180deg, #15233D 0%, #0F1C32 100%)" }}
                >
                  {p.popular && (
                    <span
                      className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[.06em] text-[#0A1929]"
                      style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)" }}
                    >
                      Most Popular
                    </span>
                  )}
                  <div className="text-[11px] tracking-wider uppercase font-bold text-white/55 mb-1">
                    {p.tier}
                  </div>
                  <div className="text-[15px] font-bold text-white mb-3">{p.subtitle}</div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-[42px] font-black text-white leading-none">{p.headline}</span>
                  </div>
                  <div className="text-[13px] text-white/55 mb-3">{p.unit}</div>
                  <p className="text-[14px] text-white/65 italic mb-4">&ldquo;{p.desc}&rdquo;</p>
                  <ul className="space-y-2 mb-6 flex-1">
                    {p.bullets.map((b, j) => (
                      <li key={j} className="text-[14px] text-white/85 flex gap-2">
                        <span className="text-[#22D3EE] font-bold flex-shrink-0">✓</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/app"
                    className={`block text-center px-4 py-3 rounded-full font-bold text-[14px] ${
                      p.popular ? "text-[#0A1929]" : "text-white border border-white/20 hover:bg-white/5"
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
                <div className="text-[18px] font-extrabold text-white">
                  Hazmat Center · <span style={{ color: "#22D3EE" }}>+$99/mo</span>
                </div>
                <p className="text-[14px] text-white/65 mt-1">
                  Placard Wizard, 100 hazmat-only skills, segregation engine, ERG lookup, TSA-H clock. Pairs with any tier.
                </p>
              </div>
              <Link href="/hazmat" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-[13px] text-white border border-white/20 hover:bg-white/5">
                See Hazmat Center →
              </Link>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(900px 500px at 25% 100%, rgba(34, 211, 238, 0.20), transparent 60%), radial-gradient(700px 400px at 85% 0%, rgba(139, 92, 246, 0.22), transparent 60%)",
            }}
          />
          <div className="max-w-3xl mx-auto px-6 text-center relative">
            <h2 className="text-[40px] sm:text-[48px] font-extrabold tracking-tight text-white mb-4 leading-tight">
              Stop running compliance from a{" "}
              <span className="serif-italic" style={{ color: "#22D3EE" }}>spreadsheet.</span>
            </h2>
            <p className="text-[17px] text-white/75 mb-8">
              Twelve brains. Three hundred skills. One subscription. 7-day free trial, no credit card.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href="/app" className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[15px] text-[#0A1929]" style={ctaCyan}>
                ★ Start free trial →
              </Link>
              <Link href="/#faqs" className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[15px] text-white border border-white/25 hover:bg-white/5">
                Read the FAQ
              </Link>
            </div>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
