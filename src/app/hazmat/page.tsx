import Link from "next/link";
import SiteShell from "@/components/SiteShell";

const PLACARDS = [
  { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Late_1970s_Flammable_truck-trailer_placard.jpg/1280px-Late_1970s_Flammable_truck-trailer_placard.jpg", lbl: "Class 3 · Flammable" },
  { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Late_1970s_Flammable_Gas_truck-trailer_placard.jpg/1280px-Late_1970s_Flammable_Gas_truck-trailer_placard.jpg", lbl: "Class 2.1 · Flam Gas" },
  { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Late_1970s_Corrosive_truck-trailer_placard.jpg/1280px-Late_1970s_Corrosive_truck-trailer_placard.jpg", lbl: "Class 8 · Corrosive" },
  { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Late_1970s_Non-Flammable_Gas_truck-trailer_placard.jpg/1280px-Late_1970s_Non-Flammable_Gas_truck-trailer_placard.jpg", lbl: "Class 2.2 · NF Gas" },
  { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Late_1970s_Poison_truck-trailer_placard.jpg/1280px-Late_1970s_Poison_truck-trailer_placard.jpg", lbl: "Class 6 · Poison" },
  { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Late_1970s_Radioactive_truck-trailer_placard.jpg/1280px-Late_1970s_Radioactive_truck-trailer_placard.jpg", lbl: "Class 7 · Radioactive" },
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

        {/* PLACARD PHOTOS */}
        <section className="max-w-7xl mx-auto px-6 py-12">
          <div className={`${cardDark} p-6`}>
            <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[#22D3EE] mb-2">REAL PLACARDS · NO AI GRAPHICS</div>
            <h3 className="text-[20px] font-extrabold text-white mb-6">
              Six of nine hazard classes you&apos;ll actually haul.
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {PLACARDS.map((p, i) => (
                <figure key={i} className="text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.src}
                    alt={p.lbl}
                    className="w-full aspect-square object-cover rounded-lg border border-[#1E3556]"
                  />
                  <figcaption className="text-[11px] font-bold text-white mt-2">{p.lbl}</figcaption>
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
              UN number, quantity, packaging group. We compute placarding per § 172.504, segregation per § 177.848, and emergency response per ERG.
            </p>

            <div className="bg-[#15233D] border border-[#1E3556] rounded-2xl p-6 mb-8 text-left max-w-2xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-3 mb-4">
                <div>
                  <label className="text-[10px] tracking-[.14em] uppercase font-bold text-white/55 block mb-1">UN number</label>
                  <div className="bg-[#0A1929] border border-[#1E3556] rounded-lg px-4 py-3 text-white font-mono text-[16px]">UN1203</div>
                </div>
                <div>
                  <label className="text-[10px] tracking-[.14em] uppercase font-bold text-white/55 block mb-1">Quantity</label>
                  <div className="bg-[#0A1929] border border-[#1E3556] rounded-lg px-4 py-3 text-white font-mono text-[16px]">4,000 lbs</div>
                </div>
                <div>
                  <label className="text-[10px] tracking-[.14em] uppercase font-bold text-white/55 block mb-1">Packing group</label>
                  <div className="bg-[#0A1929] border border-[#1E3556] rounded-lg px-4 py-3 text-white font-mono text-[16px]">PG II</div>
                </div>
                <div className="flex items-end">
                  <button className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg font-bold text-[14px] text-[#0A1929]" style={ctaCyan}>
                    Compute →
                  </button>
                </div>
              </div>

              <div className="bg-[#22D3EE]/8 border border-[#22D3EE]/30 rounded-xl p-4 text-white">
                <div className="text-[11px] tracking-[.14em] uppercase font-bold text-[#22D3EE] mb-2">
                  ⚡ Compass · Result
                </div>
                <p className="text-[14px] leading-relaxed">
                  <strong>UN1203 · 4,000 lbs · PG II</strong> → Class 3{" "}
                  <strong className="text-[#0A1929] bg-[#22D3EE] px-2 py-0.5 rounded">FLAMMABLE</strong>{" "}
                  placard required on <strong>all 4 sides</strong>. Segregate from{" "}
                  <span className="font-mono text-[#22D3EE]">Class 5.1</span> and{" "}
                  <span className="font-mono text-[#22D3EE]">Class 8</span>. ERG Guide{" "}
                  <span className="font-mono">128</span>. 24-hour ER number required per § 172.604.
                </p>
              </div>
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
