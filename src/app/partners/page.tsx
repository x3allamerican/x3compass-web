import Link from "next/link";
import SiteShell from "@/components/SiteShell";

const COMPONENTS = [
  { n: "01", title: "White-label dashboard", badge: "YOUR BRAND",
    desc: "Your logo, your domain, your colors. Carrier clients log into your platform — never see X3 Compass branding. Powered by Compass behind the scenes.",
    retail: "~$3,500 custom build" },
  { n: "02", title: "Unlimited carrier client seats", badge: "NO CAPS",
    desc: "$499/mo base + $10/driver wholesale. Add 1 carrier or 200 — same flat base. Charge your carriers retail ($25-50/driver), pocket the spread.",
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
    desc: "60-minute monthly call with Joshua Kovarik + the product team. Roadmap preview, Q&A, feature requests heard directly. Partners' #1 referenced reason for upgrading from Direct.",
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
    a: "$499/month flat base + $10/driver/month wholesale across all your carrier clients. No carrier-count cap, no driver cap, no minimums. You charge your carriers retail (typical: $25-50/driver/mo) and keep the spread.",
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
    q: "Do you offer revenue share / referral fees?",
    a: "Not in the standard Partner program — Partners profit from the spread between wholesale ($10/driver) and retail ($25-50/driver) they charge their own carriers. We do have a separate Referral program for non-consulting referrals; ask in your interview.",
  },
  {
    q: "What's the approval process?",
    a: "Submit the application form below. We schedule a 30-minute interview to confirm fit (current consulting business, # of clients, experience, why X3). We approve ~60-70% of qualified applicants. From application to live Partner: typically 5-10 business days.",
  },
];

const cardDark = "bg-[#15233D] border border-[#1E3556] rounded-2xl hover:border-[#22D3EE]/40 transition-colors";
const ctaCyan = { background: "linear-gradient(135deg, #22D3EE, #06B6D4)", boxShadow: "0 6px 18px rgba(34, 211, 238, 0.32)" };

export default function PartnersPage() {
  return (
    <SiteShell>
      <div className="bg-[#0A1929] text-white">
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(900px 500px at 20% 0%, rgba(34, 211, 238, 0.18), transparent 60%), radial-gradient(700px 400px at 80% 100%, rgba(139, 92, 246, 0.18), transparent 60%)",
            }}
          />
          <div className="max-w-7xl mx-auto px-6 pt-20 pb-20 relative">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-block text-[11px] tracking-[.18em] uppercase font-bold text-[#22D3EE] mb-6">
                COMPASS PARTNER · WHITE-LABEL RESELLER PROGRAM
              </div>
              <h1 className="font-extrabold text-white tracking-tight leading-[1.05] text-[44px] sm:text-[56px] md:text-[64px] mb-6">
                You run the carriers.
                <br />
                <span className="serif-italic" style={{ color: "#22D3EE" }}>We run the platform.</span>
              </h1>
              <p className="text-[18px] text-white/75 max-w-2xl mx-auto mb-8 leading-relaxed">
                A white-label AI compliance platform for independent safety consultants. Your brand on the dashboard. Your carriers log into <em>your</em> tool. Powered by 300 published FMCSA skills + 12 specialized brains, sitting invisibly behind your business.
              </p>
              <div className="flex gap-3 justify-center flex-wrap mb-4">
                <Link href="#apply" className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[15px] text-[#0A1929]" style={ctaCyan}>
                  ★ Apply to become a Partner →
                </Link>
                <Link href="#components" className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[15px] text-white border border-white/25 hover:bg-white/5">
                  See what&apos;s included
                </Link>
              </div>
              <div className="text-[12px] tracking-[.18em] uppercase font-bold text-white/45">
                $499/MO BASE · $10/DRIVER WHOLESALE · NO CAPS · WHITE-LABELED · 90-DAY MONTH-TO-MONTH START
              </div>
            </div>
          </div>
        </section>

        {/* STAT BAND */}
        <section className="border-y border-[#1E3556] bg-[#091525]">
          <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { n: "$499", desc: "Monthly base · unlimited carrier accounts · all 12 components included" },
              { n: "$10", desc: "Per-driver wholesale across your carrier book — 60% margin retail" },
              { n: "60 days", desc: "From sign-up to your first paying carrier (median across beta Partners)" },
            ].map((s, i) => (
              <div key={i} className="text-center md:text-left">
                <div className="text-[64px] sm:text-[72px] font-black leading-none" style={{ color: "#22D3EE" }}>{s.n}</div>
                <div className="serif-italic text-white/85 text-[17px] mt-2 leading-snug">{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* WHO IT'S FOR */}
        <section className="max-w-7xl mx-auto px-6 py-24">
          <div className="inline-flex gap-1 mb-3">
            <span className="w-7 h-[3px] bg-[#22D3EE]" />
            <span className="w-7 h-[3px] bg-white/30" />
          </div>
          <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[#22D3EE] mb-2">01 · WHO COMPASS PARTNER IS FOR</div>
          <h2 className="text-[40px] sm:text-[48px] font-extrabold tracking-tight text-white mb-3 leading-tight">
            If you advise carriers,{" "}
            <span className="serif-italic" style={{ color: "#22D3EE" }}>Compass becomes your stack.</span>
          </h2>
          <p className="text-[17px] text-white/65 max-w-3xl mb-12">
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
                <h3 className="text-[16px] font-extrabold text-white mb-2">{p.t}</h3>
                <p className="text-[13.5px] text-white/65 leading-relaxed">{p.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 12 COMPONENTS */}
        <section id="components" className="bg-[#091525] border-y border-[#1E3556] py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="inline-flex gap-1 mb-3">
              <span className="w-7 h-[3px] bg-[#22D3EE]" />
              <span className="w-7 h-[3px] bg-white/30" />
            </div>
            <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[#22D3EE] mb-2">02 · WHAT&apos;S INSIDE COMPASS PARTNER</div>
            <h2 className="text-[40px] sm:text-[48px] font-extrabold tracking-tight text-white mb-3 leading-tight">
              12 components.{" "}
              <span className="serif-italic" style={{ color: "#22D3EE" }}>One subscription.</span>
            </h2>
            <p className="text-[17px] text-white/65 max-w-3xl mb-12">
              Each component, valued at retail what an independent consultant would pay to acquire it separately — combined retail value ~$15K initial + $1-2K/mo recurring. Compass Partner delivers all 12 for $499/mo base.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {COMPONENTS.map((c) => (
                <div key={c.n} className={`${cardDark} p-6`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[28px] font-black" style={{ color: "#22D3EE" }}>{c.n}</div>
                    <span className="text-[9.5px] font-extrabold tracking-wider text-[#0A1929] bg-[#22D3EE] px-2 py-1 rounded-full">{c.badge}</span>
                  </div>
                  <h3 className="text-[17px] font-bold text-white mb-2 leading-snug">{c.title}</h3>
                  <p className="text-[13px] text-white/65 leading-relaxed mb-3">{c.desc}</p>
                  <div className="text-[10.5px] text-white/45 pt-3 border-t border-[#1E3556]">
                    Retail: <span className="text-white/65">{c.retail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ECONOMICS */}
        <section className="max-w-7xl mx-auto px-6 py-24">
          <div className="inline-flex gap-1 mb-3">
            <span className="w-7 h-[3px] bg-[#22D3EE]" />
            <span className="w-7 h-[3px] bg-white/30" />
          </div>
          <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[#22D3EE] mb-2">03 · YOUR ECONOMICS</div>
          <h2 className="text-[40px] sm:text-[48px] font-extrabold tracking-tight text-white mb-3 leading-tight">
            The math.{" "}
            <span className="serif-italic" style={{ color: "#22D3EE" }}>Plain and honest.</span>
          </h2>
          <p className="text-[17px] text-white/65 max-w-3xl mb-12">
            What a typical Year-1 vs Year-3 Partner looks like financially. No fluff.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`${cardDark} p-6`}>
              <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[#22D3EE] mb-2">YEAR 1 — Getting started</div>
              <h3 className="text-[22px] font-extrabold text-white mb-4">Solo consultant · 4 carriers signed</h3>
              <table className="w-full text-[13px] mb-4">
                <tbody>
                  <tr className="border-b border-[#1E3556]"><td className="py-2 text-white/65">Carriers signed by Month 12</td><td className="py-2 text-right font-bold text-white">4</td></tr>
                  <tr className="border-b border-[#1E3556]"><td className="py-2 text-white/65">Average drivers per carrier</td><td className="py-2 text-right font-bold text-white">22</td></tr>
                  <tr className="border-b border-[#1E3556]"><td className="py-2 text-white/65">Total drivers under management</td><td className="py-2 text-right font-bold text-white">88</td></tr>
                  <tr className="border-b border-[#1E3556]"><td className="py-2 text-white/65">Annual revenue (you bill carriers)</td><td className="py-2 text-right font-bold text-[#22D3EE]">~$52K</td></tr>
                  <tr className="border-b border-[#1E3556]"><td className="py-2 text-white/65">Annual X3 cost</td><td className="py-2 text-right text-rose-300">-$16.5K</td></tr>
                  <tr><td className="py-2 text-white font-bold">Your net Year 1</td><td className="py-2 text-right font-black text-emerald-300">~$35.5K</td></tr>
                </tbody>
              </table>
              <p className="text-[12px] text-white/55 italic leading-relaxed">
                Math: 88 drivers × $50/driver/mo retail × 12 months = $52,800. Less ($499/mo base × 12) + (88 × $10 × 12) = $5,988 + $10,560 = $16,548 in X3 fees.
              </p>
            </div>
            <div className={`${cardDark} p-6 border-[#22D3EE]/60`}>
              <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[#22D3EE] mb-2">YEAR 3 — Mature Partner</div>
              <h3 className="text-[22px] font-extrabold text-white mb-4">15 carriers · 375 drivers</h3>
              <table className="w-full text-[13px] mb-4">
                <tbody>
                  <tr className="border-b border-[#1E3556]"><td className="py-2 text-white/65">Carriers under management</td><td className="py-2 text-right font-bold text-white">15</td></tr>
                  <tr className="border-b border-[#1E3556]"><td className="py-2 text-white/65">Average drivers per carrier</td><td className="py-2 text-right font-bold text-white">25</td></tr>
                  <tr className="border-b border-[#1E3556]"><td className="py-2 text-white/65">Total drivers under management</td><td className="py-2 text-right font-bold text-white">375</td></tr>
                  <tr className="border-b border-[#1E3556]"><td className="py-2 text-white/65">Annual revenue (you bill carriers)</td><td className="py-2 text-right font-bold text-[#22D3EE]">$225K</td></tr>
                  <tr className="border-b border-[#1E3556]"><td className="py-2 text-white/65">Annual X3 cost</td><td className="py-2 text-right text-rose-300">-$51K</td></tr>
                  <tr><td className="py-2 text-white font-bold">Your net Year 3</td><td className="py-2 text-right font-black text-emerald-300">~$174K</td></tr>
                </tbody>
              </table>
              <p className="text-[12px] text-white/55 italic leading-relaxed">
                Same consultant operating without Compass Partner would invoice ~$75-150K/yr at lower-margin custom service work. Compass Partner roughly <strong className="text-white">doubles your income with less per-client effort.</strong>
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-[#091525] border-y border-[#1E3556] py-24">
          <div className="max-w-4xl mx-auto px-6">
            <div className="inline-flex gap-1 mb-3">
              <span className="w-7 h-[3px] bg-[#22D3EE]" />
              <span className="w-7 h-[3px] bg-white/30" />
            </div>
            <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[#22D3EE] mb-2">04 · FAQ</div>
            <h2 className="text-[36px] sm:text-[42px] font-extrabold tracking-tight text-white mb-10 leading-tight">
              Questions Partners ask.
            </h2>
            <div className="space-y-4">
              {FAQ.map((f, i) => (
                <div key={i} className={`${cardDark} p-5`}>
                  <h3 className="text-[15px] font-extrabold text-white mb-2">{f.q}</h3>
                  <p className="text-[14px] text-white/75 leading-relaxed">{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* APPLY */}
        <section id="apply" className="relative py-24 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(900px 500px at 25% 100%, rgba(34, 211, 238, 0.20), transparent 60%), radial-gradient(700px 400px at 85% 0%, rgba(139, 92, 246, 0.22), transparent 60%)",
            }}
          />
          <div className="max-w-3xl mx-auto px-6 text-center relative">
            <div className="inline-block text-[11px] tracking-[.18em] uppercase font-bold text-[#22D3EE] mb-3">
              05 · APPLY TO BECOME A PARTNER
            </div>
            <h2 className="text-[40px] sm:text-[48px] font-extrabold tracking-tight text-white mb-4 leading-tight">
              Ready to white-label{" "}
              <span className="serif-italic" style={{ color: "#22D3EE" }}>your safety consultancy?</span>
            </h2>
            <p className="text-[17px] text-white/75 mb-8">
              Submit your application. We&apos;ll review within 3 business days and schedule a 30-minute interview to confirm fit. Live Partner accounts typically activated within 5-10 business days of application.
            </p>
            <Link
              href="/partners/apply"
              className="inline-flex items-center gap-2 px-7 py-4 rounded-full font-bold text-[16px] text-[#0A1929]"
              style={ctaCyan}
            >
              ★ Start your application →
            </Link>
            <div className="mt-6 text-[12px] text-white/45">
              Or email <a href="mailto:partners@x3compass.com" className="text-[#22D3EE] hover:underline">partners@x3compass.com</a> with questions before applying.
            </div>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
