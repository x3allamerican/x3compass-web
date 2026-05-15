import Link from "next/link";
import SiteShell from "@/components/SiteShell";
import Placard, { HazardClass } from "@/components/Placard";
import PlacardWizardLive from "@/components/PlacardWizardLive";

const PLACARD_GRID: { cls: HazardClass; lbl: string }[] = [
  { cls: "1.1", lbl: "Class 1 · Explosives" },
  { cls: "2.1", lbl: "Class 2.1 · Flammable Gas" },
  { cls: "2.2", lbl: "Class 2.2 · Non-Flam Gas" },
  { cls: "2.3", lbl: "Class 2.3 · Toxic Gas" },
  { cls: "3",   lbl: "Class 3 · Flammable Liquid" },
  { cls: "4.1", lbl: "Class 4.1 · Flammable Solid" },
  { cls: "5.1", lbl: "Class 5.1 · Oxidizer" },
  { cls: "5.2", lbl: "Class 5.2 · Organic Peroxide" },
  { cls: "6.1", lbl: "Class 6 · Toxic" },
  { cls: "7",   lbl: "Class 7 · Radioactive" },
  { cls: "8",   lbl: "Class 8 · Corrosive" },
  { cls: "9",   lbl: "Class 9 · Misc" },
];

const HAZMAT_BRAINS = [
  { icon: "🚛", title: "Placarding",        cfr: "§ 172.504",    desc: "When to placard, what to placard, where to put them. Handles aggregate weight rules + table 1 / table 2 splits." },
  { icon: "🔀", title: "Segregation",       cfr: "§ 177.848",    desc: "Class compatibility table on demand. Tells you which classes can't ride together and why." },
  { icon: "🪪", title: "TSA-H Endorsement", cfr: "49 CFR 1572",  desc: "Renewal clock per driver. Background-check status, expiry alerts, application fee tracking." },
  { icon: "📄", title: "Shipping Papers",   cfr: "§ 172.200",    desc: "Validate every shipping paper: proper shipping name, UN number, hazard class, packing group, quantity." },
  { icon: "🛡", title: "Security Plans",    cfr: "§ 172.800",    desc: "Personnel security, unauthorized access, en-route security. Builds your plan and updates it annually." },
  { icon: "🚨", title: "Emergency Response", cfr: "ERG 2024",     desc: "ERG guide lookup by UN number. Initial isolation, protective action distances, evacuation perimeters." },
];

const HAZMAT_SKILLS = [
  { cfr: "Part 172",     name: "Hazmat Placarding",        q: "4,000 lbs of UN1203 — what placards?" },
  { cfr: "§ 177.848",    name: "Segregation Tables",       q: "Class 3 + Class 8 together?" },
  { cfr: "49 CFR 1572",  name: "TSA H Endorsement",        q: "How long is H valid?" },
  { cfr: "§ 172.504",    name: "Placarding Math",          q: "When does aggregate weight kick in?" },
  { cfr: "§ 172.704",    name: "Hazmat Training",          q: "Refresher training cycle?" },
  { cfr: "§ 172.800",    name: "Security Plan",            q: "Do I need one for Class 3?" },
  { cfr: "§ 173.150",    name: "Packing Group Lookup",     q: "UN1203 packing group?" },
  { cfr: "§ 172.604",    name: "Emergency Response",       q: "ERG guide for UN1230?" },
  { cfr: "§ 397.5",      name: "Route Planning",           q: "Which states ban Class 7?" },
  { cfr: "§ 172.604",    name: "Telephone Number",         q: "24-hour ER number required?" },
  { cfr: "§ 173.22",     name: "Shipper Responsibilities", q: "Am I shipper or carrier?" },
  { cfr: "§ 397.67",     name: "Class 7 Routing",          q: "Pre-trip Class 7 procedures?" },
];

const cardDark = "bg-[#15233D] border border-[#1E3556] rounded-2xl hover:border-[#22D3EE]/40 transition-colors";
const ctaCyan = { background: "linear-gradient(135deg, #22D3EE, #06B6D4)", boxShadow: "0 6px 18px rgba(34, 211, 238, 0.32)" };

export default function Hazmat() {
  return (
    <SiteShell>
      <div className="bg-[#0A1929] text-white">
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(900px 500px at 20% 0%, rgba(34, 211, 238, 0.16), transparent 60%), radial-gradient(700px 400px at 85% 100%, rgba(139, 92, 246, 0.16), transparent 60%)",
            }}
          />
          <div className="max-w-7xl mx-auto px-6 pt-20 pb-20 relative">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-block text-[11px] tracking-[.18em] uppercase font-bold text-[#22D3EE] mb-6">
                THE HAZMAT CENTER · 100 CFR-CITED SKILLS · 1 PLACARD WIZARD
              </div>
              <h1 className="font-extrabold text-white tracking-tight leading-[1.05] text-[44px] sm:text-[56px] md:text-[68px] mb-6">
                Hazmat compliance,
                <br />
                <span className="serif-italic" style={{ color: "#22D3EE" }}>grounded in 49 CFR.</span>
              </h1>
              <p className="text-[18px] text-white/75 max-w-2xl mx-auto mb-8 leading-relaxed">
                Classes 1 through 9. Placard math, segregation tables, TSA-H clock, shipping-paper validator. Built by people who&apos;ve actually shipped a Class 3 load and had to call the IC at 2am.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Link href="#wizard" className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[15px] text-[#0A1929]" style={ctaCyan}>
                  ★ Open the Placard Wizard →
                </Link>
                <Link href="#skills" className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[15px] text-white border border-white/25 hover:bg-white/5">
                  Browse 100 hazmat skills →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* PLACARD GRID — DOT-compliant SVG generators (downloadable) */}
        <section className="max-w-7xl mx-auto px-6 py-12">
          <div className={`${cardDark} p-6`}>
            <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[#22D3EE] mb-2">DOT-COMPLIANT PLACARDS · 49 CFR § 172.519</div>
            <h3 className="text-[20px] font-extrabold text-white mb-2">
              All 12 placard classes Compass generates.
            </h3>
            <p className="text-[13px] text-white/65 mb-6">
              Scalable SVG — pixel-perfect at any size. Right-click any placard below to save it, or use the Placard Wizard to generate one with a specific UN number.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {PLACARD_GRID.map((p) => (
                <figure key={p.cls} className="flex flex-col items-center text-center bg-[#0F1C32] rounded-xl p-3 border border-[#1E3556]">
                  <Placard hazardClass={p.cls} size={120} />
                  <figcaption className="text-[10.5px] font-bold text-white mt-2 leading-tight">{p.lbl}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* PLACARD WIZARD PREVIEW */}
        <section id="wizard" className="relative py-20 overflow-hidden border-y border-[#1E3556] bg-[#091525]">
          <div className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(800px 500px at 15% 100%, rgba(34, 211, 238, 0.18), transparent 60%), radial-gradient(700px 400px at 90% 0%, rgba(139, 92, 246, 0.18), transparent 60%)",
            }}
          />
          <div className="max-w-4xl mx-auto px-6 text-center relative">
            <div className="inline-block text-[11px] tracking-[.18em] uppercase font-bold text-[#22D3EE] mb-3">
              01 · PLACARD WIZARD
            </div>
            <h2 className="text-[36px] sm:text-[44px] font-extrabold tracking-tight text-white mb-3 leading-tight">
              Tell us what you&apos;re hauling.
              <br />
              <span className="serif-italic" style={{ color: "#22D3EE" }}>We&apos;ll tell you what to placard.</span>
            </h2>
            <p className="text-[17px] text-white/65 max-w-2xl mx-auto mb-8">
              Type a UN number or substance name. Compass looks it up against 80+ common hazmat substances, renders the actual DOT placard, and computes placarding (§ 172.504), segregation (§ 177.848), and ERG guide on the fly.
            </p>

            <PlacardWizardLive />

            <div className="mt-6 text-[12px] text-white/55 text-center">
              💡 Try: <button type="button" className="text-[#22D3EE] hover:underline">UN1203 (gasoline)</button>, <button type="button" className="text-[#22D3EE] hover:underline">UN1830 (sulfuric acid)</button>, <button type="button" className="text-[#22D3EE] hover:underline">UN1075 (LPG)</button>, or <button type="button" className="text-[#22D3EE] hover:underline">UN3480 (lithium batteries)</button>.
            </div>
          </div>
        </section>

        {/* HAZMAT BRAINS */}
        <section className="max-w-7xl mx-auto px-6 py-24">
          <div className="inline-flex gap-1 mb-3">
            <span className="w-7 h-[3px] bg-[#22D3EE]" />
            <span className="w-7 h-[3px] bg-white/30" />
          </div>
          <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[#22D3EE] mb-2">02 · HAZMAT BRAINS</div>
          <h2 className="text-[36px] sm:text-[44px] font-extrabold tracking-tight text-white mb-3 leading-tight">
            Six brains. <span className="serif-italic" style={{ color: "#22D3EE" }}>One hazmat shipment.</span>
          </h2>
          <p className="text-[17px] text-white/65 max-w-2xl mb-12">
            Every brain reads from the actual regulation. No interpretive shortcuts.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {HAZMAT_BRAINS.map((b, i) => (
              <Link key={i} href="/app/ask" className={`${cardDark} block p-6`}>
                <div className="text-[28px] mb-3">{b.icon}</div>
                <h3 className="text-[18px] font-bold text-white mb-2">{b.title}</h3>
                <div className="inline-block text-[11px] font-bold tracking-wider text-[#22D3EE] bg-[#22D3EE]/10 border border-[#22D3EE]/25 px-2 py-1 rounded-full font-mono mb-3">
                  {b.cfr}
                </div>
                <p className="text-[14px] text-white/65 leading-relaxed">{b.desc}</p>
                <div className="mt-4 text-[13px] font-bold text-[#22D3EE]">Open {b.title} →</div>
              </Link>
            ))}
          </div>
        </section>

        {/* HAZMAT SKILLS */}
        <section id="skills" className="bg-[#091525] border-y border-[#1E3556] py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="inline-flex gap-1 mb-3">
              <span className="w-7 h-[3px] bg-[#22D3EE]" />
              <span className="w-7 h-[3px] bg-white/30" />
            </div>
            <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[#22D3EE] mb-2">03 · 100 HAZMAT-ONLY SKILLS</div>
            <h2 className="text-[36px] sm:text-[44px] font-extrabold tracking-tight text-white mb-3 leading-tight">
              Every hazmat question.{" "}
              <span className="serif-italic" style={{ color: "#22D3EE" }}>One CFR away.</span>
            </h2>
            <p className="text-[17px] text-white/65 max-w-2xl mb-12">
              Tap any chip to converse with the brain that owns it. Twelve representative skills shown — full list available in-app.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {HAZMAT_SKILLS.map((s, i) => (
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
          </div>
        </section>

        {/* PRICING TIE-IN */}
        <section className="relative py-16 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(700px 400px at 25% 100%, rgba(34, 211, 238, 0.18), transparent 60%), radial-gradient(600px 400px at 85% 0%, rgba(139, 92, 246, 0.16), transparent 60%)",
            }}
          />
          <div className="max-w-3xl mx-auto px-6 text-center relative">
            <h2 className="text-[28px] sm:text-[36px] font-extrabold text-white mb-3 leading-tight">
              Hazmat add-on:{" "}
              <span className="serif-italic" style={{ color: "#22D3EE" }}>+$99/mo.</span>
            </h2>
            <p className="text-[16px] text-white/65 mb-6">
              Pairs with any tier. Placard Wizard, 100 hazmat-only skills, segregation engine, ERG, TSA-H clock.
            </p>
            <Link href="/#pricing" className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[15px] text-[#0A1929]" style={ctaCyan}>
              See pricing →
            </Link>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
