import Link from "next/link";
import SiteShell from "@/components/SiteShell";

const BRAINS = [
  { icon: "📁", title: "DQ Files Brain",        cfr: "49 CFR § 391.51",       desc: "All 12 driver-qualification documents per driver — application, MVR, med cert, road test, ELDT, Clearinghouse query. Missing slots glow red." },
  { icon: "🧪", title: "Drug & Alcohol Brain",  cfr: "49 CFR Part 382",       desc: "Pre-employment, random, post-accident, RTD. Random-rate progress bars vs § 382.305. Clearinghouse queries on the calendar." },
  { icon: "🪪", title: "MVR Brain",             cfr: "49 CFR § 391.25",       desc: "Annual MVR review log per driver, per state. Overdue drivers surface automatically. Continuous-monitoring upgrade in one click." },
  { icon: "🎓", title: "Training Brain",        cfr: "49 CFR Part 380",       desc: "ELDT theory + BTW with TPR registry flag, supervisor D&A, defensive driving, pre-trip, cargo, hazmat. Expiry tracking on every course." },
  { icon: "🚛", title: "Vehicles & PM Brain",   cfr: "49 CFR § 396.3 / 396.17", desc: "Power-unit inventory, annual DOT inspection tracker, PM schedule. VIN, plate, GVWR, OOS flags. 396 PM template on demand." },
  { icon: "🚨", title: "Incidents Brain",       cfr: "49 CFR § 390.15",       desc: "DOT-recordable crash register with 3-year retention. Severity, preventability, post-accident test triggers. Audit-ready by export." },
  { icon: "🔎", title: "Inspections Brain",     cfr: "49 CFR § 396.9",        desc: "Roadside inspections + internal DVIRs. Level I–VI tracked. Clean-inspection rate surfaced live with DataQ dispute suggestions." },
  { icon: "📊", title: "CSA · DataQ Brain",     cfr: "49 CFR Part 385",       desc: "Live SMS percentile by BASIC. DataQ dispute drafter for contestable violations. 21 win-pattern templates. Avg win: $300." },
  { icon: "⚠️", title: "Hazmat Brain",          cfr: "49 CFR Part 172",       desc: "Placarding wizard, segregation tables, TSA H-endorsement clock, shipping-paper validator. 100 hazmat-only skills." },
  { icon: "⚖️", title: "Legal · Litigation",    cfr: "FMCSR + Tort",          desc: "Subpoena response checklist, litigation-hold protocol, retention map, adverse-action letter with FCRA-compliant timing." },
  { icon: "💰", title: "Finance · IFTA Brain",  cfr: "IFTA · § 367 UCR",      desc: "Cost-per-mile modeling, IFTA quarterly filing, UCR registration windows, fuel-tax reconciliation across all jurisdictions." },
  { icon: "📧", title: "Daily Digest Brain",    cfr: "Branded email",         desc: "7am every morning: expiring DQ docs, CDLs, med certs, PM-due vehicles. Never start the day wondering what's about to blow up." },
];

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

export default function Home() {
  return (
    <SiteShell>
    <div className="bg-[color:var(--cream)]">
      {/* HERO */}
      <section className="relative sparkle-wash overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-24 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="eyebrow mb-6">
              EST. 2025 · 300 SKILLS · 12 BRAINS · BUILT BY FLEET OPERATORS
            </div>
            <h1 className="font-extrabold text-[color:var(--navy)] tracking-tight leading-[1.05] text-[44px] sm:text-[60px] md:text-[72px] mb-6">
              An AI Safety Director.
              <br />
              <span className="serif-italic text-[color:var(--red)]">Or a real one.</span>{" "}
              Both work.
            </h1>
            <p className="text-[18px] text-[color:var(--ink-soft)] max-w-2xl mx-auto mb-8 leading-relaxed">
              Driver qualification files, MVRs, drug & alcohol, Clearinghouse, CSA scores, training, hazmat — every FMCSA artifact, every CFR-cited answer.{" "}
              <strong className="text-[color:var(--navy)]">DIY at $25/driver</strong> or{" "}
              <strong className="text-[color:var(--navy)]">done-for-you at $50/driver</strong>.
            </p>
            <div className="flex gap-3 justify-center flex-wrap mb-3">
              <Link href="/app" className="btn-red">★ Start free trial →</Link>
              <Link href="/app" className="btn-outline">See the dashboard</Link>
            </div>
            <div className="eyebrow mt-3 text-[color:var(--ink-muted)]">
              Trained on 49 CFR Parts 380–399 · 100 published skills on GitHub · 7-day trial, no credit card
            </div>
          </div>
        </div>
      </section>

      {/* STAT BAND */}
      <section className="border-y border-[color:var(--hairline)] bg-[color:var(--cream-2)]">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { n: "300", desc: "FMCSA skills, every one CFR-cited" },
            { n: "12",  desc: "Specialized brains, one per compliance domain" },
            { n: "$25", desc: "per driver, DIY · or $50 done-for-you" },
          ].map((s, i) => (
            <div key={i} className="text-center md:text-left">
              <div className="text-[64px] sm:text-[80px] font-black text-[color:var(--red)] leading-none">{s.n}</div>
              <div className="serif-italic text-[color:var(--navy)] text-[18px] mt-2">{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 01 · TWELVE BRAINS */}
      <section id="services" className="max-w-7xl mx-auto px-6 py-24">
        <div className="section-tick"><span /><span /></div>
        <div className="eyebrow mb-2">01 · TWELVE BRAINS</div>
        <h2 className="text-[40px] sm:text-[48px] font-extrabold tracking-tight text-[color:var(--navy)] mb-3 leading-tight">
          Twelve brains. <span className="serif-italic text-[color:var(--red)]">One subscription.</span>
        </h2>
        <p className="text-[17px] text-[color:var(--ink-soft)] max-w-2xl mb-12">
          Each brain is built around the actual regulation — not a generic vault that forces you to learn a new filing system. Tap a card to converse with the brain that owns it.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {BRAINS.map((b, i) => (
            <Link key={i} href="/app" className="card-hairline block">
              <div className="text-[28px] mb-3">{b.icon}</div>
              <h3 className="text-[18px] font-bold text-[color:var(--navy)] mb-2">{b.title}</h3>
              <div className="inline-block text-[11px] font-bold tracking-wider text-[color:var(--red)] bg-[color:var(--red)]/8 px-2 py-1 rounded-full font-mono mb-3">
                {b.cfr}
              </div>
              <p className="text-[14px] text-[color:var(--ink-soft)] leading-relaxed">{b.desc}</p>
              <div className="mt-4 text-[13px] font-bold text-[color:var(--red)]">Open {b.title.replace(" Brain", "")} →</div>
            </Link>
          ))}
        </div>
      </section>

      {/* 02 · DASHBOARD */}
      <section className="bg-[color:var(--cream-2)] border-y border-[color:var(--hairline)] py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="eyebrow mb-2">02 · THE DASHBOARD</div>
            <h2 className="text-[40px] sm:text-[48px] font-extrabold tracking-tight text-[color:var(--navy)] mb-3 leading-tight">
              The screen you live in.{" "}
              <span className="serif-italic text-[color:var(--red)]">Every signal, one page.</span>
            </h2>
            <p className="text-[17px] text-[color:var(--ink-soft)] mb-8">
              Sidebar of drivers. KPI strip up top. CSA BASICs, expirations, inspections — all on one screen. Your AI Safety Director sits in the lower right and tells you exactly what to do next.
            </p>
            <Link href="/app" className="btn-red">Open the live dashboard →</Link>
          </div>
        </div>
      </section>

      {/* 03 · 300 SKILLS */}
      <section id="skills" className="max-w-7xl mx-auto px-6 py-24">
        <div className="section-tick"><span /><span /></div>
        <div className="eyebrow mb-2">03 · 300 PUBLISHED SKILLS</div>
        <h2 className="text-[40px] sm:text-[48px] font-extrabold tracking-tight text-[color:var(--navy)] mb-3 leading-tight">
          Ask any FMCSA question.{" "}
          <span className="serif-italic text-[color:var(--red)]">Get a CFR-cited answer.</span>
        </h2>
        <p className="text-[17px] text-[color:var(--ink-soft)] max-w-2xl mb-12">
          Every skill is a published, version-controlled prompt. Click a chip to start a conversation with the brain that owns it.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SKILLS.map((s, i) => (
            <Link key={i} href="/app" className="card-hairline relative pr-10 block">
              <div className="inline-block text-[10px] font-bold tracking-wider text-[color:var(--red)] bg-[color:var(--red)]/8 px-2 py-1 rounded-full font-mono mb-2">
                {s.cfr}
              </div>
              <div className="text-[15px] font-bold text-[color:var(--navy)] mb-1">{s.name}</div>
              <div className="text-[13px] italic text-[color:var(--ink-muted)]">&ldquo;{s.q}&rdquo;</div>
              <div className="absolute right-5 top-5 text-[color:var(--red)] font-bold">→</div>
            </Link>
          ))}
        </div>
        <div className="text-center mt-10 text-[14px] text-[color:var(--ink-soft)]">
          Want the full list?{" "}
          <Link href="/app" className="text-[color:var(--red)] font-bold">Browse all 300 skills →</Link>
        </div>
      </section>

      {/* 04 · HAZMAT */}
      <section className="navy-strip py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-block text-[11px] tracking-[.18em] uppercase font-bold text-[color:var(--gold)] mb-3">
            04 · HAZMAT CENTER
          </div>
          <h2 className="text-[40px] sm:text-[48px] font-extrabold tracking-tight text-white mb-3 leading-tight">
            100 hazmat skills.{" "}
            <span className="serif-italic text-[color:var(--gold)]">One Placard Wizard.</span>
          </h2>
          <p className="text-[17px] text-white/75 max-w-2xl mx-auto mb-8">
            Class 1 explosives through Class 9 miscellaneous. Plus security plans, segregation, and the TSA-H clock.
          </p>
          <Link href="/hazmat" className="btn-red">Open the Hazmat Center →</Link>
        </div>
      </section>

      {/* 05 · HOW IT WORKS */}
      <section id="how" className="max-w-7xl mx-auto px-6 py-24">
        <div className="section-tick"><span /><span /></div>
        <div className="eyebrow mb-2">05 · HOW IT WORKS</div>
        <h2 className="text-[40px] sm:text-[48px] font-extrabold tracking-tight text-[color:var(--navy)] mb-3 leading-tight">
          Live in the next <span className="serif-italic text-[color:var(--red)]">lunch break.</span>
        </h2>
        <p className="text-[17px] text-[color:var(--ink-soft)] max-w-2xl mb-12">
          Import drivers, upload what you have, log events as they happen, read the morning digest. That&apos;s the whole job.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {STEPS.map((s) => (
            <div key={s.n} className="card-hairline">
              <div className="w-9 h-9 rounded-full grid place-items-center bg-[color:var(--red)] text-white font-black mb-3">
                {s.n}
              </div>
              <h3 className="text-[16px] font-bold text-[color:var(--navy)] mb-2">{s.title}</h3>
              <p className="text-[14px] text-[color:var(--ink-soft)] leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 06 · PRICING */}
      <section id="pricing" className="bg-[color:var(--cream-2)] border-y border-[color:var(--hairline)] py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="section-tick"><span /><span /></div>
          <div className="eyebrow mb-2">06 · PRICING</div>
          <h2 className="text-[40px] sm:text-[48px] font-extrabold tracking-tight text-[color:var(--navy)] mb-3 leading-tight">
            Drive it yourself.{" "}
            <span className="serif-italic text-[color:var(--red)]">Or let us drive it for you.</span>
          </h2>
          <p className="text-[17px] text-[color:var(--ink-soft)] max-w-2xl mb-3">
            Every tier includes all 12 brains and all 300 skills. The only difference is who&apos;s holding the wheel.
          </p>
          <div className="eyebrow mb-12 text-[color:var(--navy)]">
            ★ TRY EVERY BRAIN — PLUS HAZMAT — FREE FOR 7 DAYS. NO CARD REQUIRED.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            {PRICING.map((p, i) => (
              <div
                key={i}
                className={`card-hairline relative flex flex-col ${
                  p.popular ? "border-[color:var(--red)] shadow-[0_18px_40px_rgba(220,38,38,0.18)]" : ""
                }`}
              >
                {p.popular && <span className="popular-ribbon">Most Popular</span>}
                <div className="text-[11px] tracking-wider uppercase font-bold text-[color:var(--ink-muted)] mb-1">
                  {p.tier}
                </div>
                <div className="text-[15px] font-bold text-[color:var(--navy)] mb-3">{p.subtitle}</div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-[42px] font-black text-[color:var(--navy)] leading-none">
                    {p.headline}
                  </span>
                </div>
                <div className="text-[13px] text-[color:var(--ink-muted)] mb-3">{p.unit}</div>
                <p className="text-[14px] text-[color:var(--ink-soft)] italic mb-4">&ldquo;{p.desc}&rdquo;</p>
                <ul className="space-y-2 mb-6 flex-1">
                  {p.bullets.map((b, j) => (
                    <li key={j} className="text-[14px] text-[color:var(--navy)] flex gap-2">
                      <span className="text-[color:var(--red)] font-bold flex-shrink-0">✓</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/app"
                  className={p.popular ? "btn-red w-full justify-center" : "btn-outline w-full justify-center"}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
          <div className="card-hairline flex items-center justify-between gap-6 flex-wrap">
            <div>
              <div className="text-[11px] tracking-wider uppercase font-bold text-[color:var(--red)] mb-1">
                ★ ADD-ON
              </div>
              <div className="text-[18px] font-extrabold text-[color:var(--navy)]">
                Hazmat Center · <span className="text-[color:var(--red)]">+$99/mo</span>
              </div>
              <p className="text-[14px] text-[color:var(--ink-soft)] mt-1">
                Placard Wizard, 100 hazmat-only skills, segregation engine, ERG lookup, TSA-H clock. Pairs with any tier.
              </p>
            </div>
            <Link href="/hazmat" className="btn-outline">See Hazmat Center →</Link>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="navy-strip py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-[40px] sm:text-[48px] font-extrabold tracking-tight text-white mb-4 leading-tight">
            Stop running compliance from a{" "}
            <span className="serif-italic text-[color:var(--gold)]">spreadsheet.</span>
          </h2>
          <p className="text-[17px] text-white/75 mb-8">
            Twelve brains. Three hundred skills. One subscription. 7-day free trial, no credit card.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/app" className="btn-red">★ Start free trial →</Link>
            <Link
              href="/#faqs"
              className="btn-outline bg-transparent border-white text-white hover:bg-white hover:text-[color:var(--navy)]"
            >
              Read the FAQ
            </Link>
          </div>
        </div>
      </section>
    </div>
    </SiteShell>
  );
}
