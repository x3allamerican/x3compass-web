import Link from "next/link";

const PLACARDS = [
  { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Late_1970s_Flammable_truck-trailer_placard.jpg/1280px-Late_1970s_Flammable_truck-trailer_placard.jpg", lbl: "Class 3 · Flammable" },
  { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Late_1970s_Flammable_Gas_truck-trailer_placard.jpg/1280px-Late_1970s_Flammable_Gas_truck-trailer_placard.jpg", lbl: "Class 2.1 · Flam Gas" },
  { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Late_1970s_Corrosive_truck-trailer_placard.jpg/1280px-Late_1970s_Corrosive_truck-trailer_placard.jpg", lbl: "Class 8 · Corrosive" },
  { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Late_1970s_Non-Flammable_Gas_truck-trailer_placard.jpg/1280px-Late_1970s_Non-Flammable_Gas_truck-trailer_placard.jpg", lbl: "Class 2.2 · NF Gas" },
  { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Late_1970s_Poison_truck-trailer_placard.jpg/1280px-Late_1970s_Poison_truck-trailer_placard.jpg", lbl: "Class 6 · Poison" },
  { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Late_1970s_Radioactive_truck-trailer_placard.jpg/1280px-Late_1970s_Radioactive_truck-trailer_placard.jpg", lbl: "Class 7 · Radioactive" },
];

const HAZMAT_BRAINS = [
  { icon: "🚛", title: "Placarding",      cfr: "§ 172.504", desc: "When to placard, what to placard, where to put them. Handles aggregate weight rules + table 1 / table 2 splits." },
  { icon: "🔀", title: "Segregation",     cfr: "§ 177.848", desc: "Class compatibility table on demand. Tells you which classes can't ride together and why." },
  { icon: "🪪", title: "TSA-H Endorsement", cfr: "49 CFR 1572", desc: "Renewal clock per driver. Background-check status, expiry alerts, application fee tracking." },
  { icon: "📄", title: "Shipping Papers", cfr: "§ 172.200", desc: "Validate every shipping paper: proper shipping name, UN number, hazard class, packing group, quantity." },
  { icon: "🛡", title: "Security Plans",  cfr: "§ 172.800", desc: "Personnel security, unauthorized access, en-route security. Builds your plan and updates it annually." },
  { icon: "🚨", title: "Emergency Response", cfr: "ERG 2024", desc: "ERG guide lookup by UN number. Initial isolation, protective action distances, evacuation perimeters." },
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

export default function Hazmat() {
  return (
    <div className="bg-[color:var(--cream)]">
      {/* HERO */}
      <section className="relative sparkle-wash overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-20 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="eyebrow mb-6">
              THE HAZMAT CENTER · 100 CFR-CITED SKILLS · 1 PLACARD WIZARD
            </div>
            <h1 className="font-extrabold text-[color:var(--navy)] tracking-tight leading-[1.05] text-[44px] sm:text-[56px] md:text-[68px] mb-6">
              Hazmat compliance,
              <br />
              <span className="serif-italic text-[color:var(--red)]">grounded in 49 CFR.</span>
            </h1>
            <p className="text-[18px] text-[color:var(--ink-soft)] max-w-2xl mx-auto mb-8 leading-relaxed">
              Classes 1 through 9. Placard math, segregation tables, TSA-H clock, shipping-paper validator. Built by people who&apos;ve actually shipped a Class 3 load and had to call the IC at 2am.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href="#wizard" className="btn-red">★ Open the Placard Wizard →</Link>
              <Link href="#skills" className="btn-outline">Browse 100 hazmat skills →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* PLACARD PHOTOS */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="card-hairline">
          <div className="eyebrow mb-2">REAL PLACARDS · NO AI GRAPHICS</div>
          <h3 className="text-[20px] font-extrabold text-[color:var(--navy)] mb-6">
            Six of nine hazard classes you&apos;ll actually haul.
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {PLACARDS.map((p, i) => (
              <figure key={i} className="text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.src}
                  alt={p.lbl}
                  className="w-full aspect-square object-cover rounded-lg border border-[color:var(--hairline)]"
                />
                <figcaption className="text-[11px] font-bold text-[color:var(--navy)] mt-2">{p.lbl}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* PLACARD WIZARD PREVIEW */}
      <section id="wizard" className="navy-strip py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-block text-[11px] tracking-[.18em] uppercase font-bold text-[color:var(--gold)] mb-3">
            01 · PLACARD WIZARD
          </div>
          <h2 className="text-[36px] sm:text-[44px] font-extrabold tracking-tight text-white mb-3 leading-tight">
            Tell us what you&apos;re hauling.
            <br />
            <span className="serif-italic text-[color:var(--gold)]">We&apos;ll tell you what to placard.</span>
          </h2>
          <p className="text-[17px] text-white/75 max-w-2xl mx-auto mb-8">
            UN number, quantity, packaging group. We compute placarding per § 172.504, segregation per § 177.848, and emergency response per ERG.
          </p>

          {/* Wizard input mockup */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 mb-8 text-left max-w-2xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-3 mb-4">
              <div>
                <label className="text-[10px] tracking-[.14em] uppercase font-bold text-white/60 block mb-1">UN number</label>
                <div className="bg-[color:var(--navy)] border border-white/20 rounded-lg px-4 py-3 text-white font-mono text-[16px]">UN1203</div>
              </div>
              <div>
                <label className="text-[10px] tracking-[.14em] uppercase font-bold text-white/60 block mb-1">Quantity</label>
                <div className="bg-[color:var(--navy)] border border-white/20 rounded-lg px-4 py-3 text-white font-mono text-[16px]">4,000 lbs</div>
              </div>
              <div>
                <label className="text-[10px] tracking-[.14em] uppercase font-bold text-white/60 block mb-1">Packing group</label>
                <div className="bg-[color:var(--navy)] border border-white/20 rounded-lg px-4 py-3 text-white font-mono text-[16px]">PG II</div>
              </div>
              <div className="flex items-end">
                <button className="btn-red w-full justify-center">Compute →</button>
              </div>
            </div>

            {/* Sample output */}
            <div className="bg-[color:var(--gold)]/10 border border-[color:var(--gold)]/40 rounded-xl p-4 text-white">
              <div className="text-[11px] tracking-[.14em] uppercase font-bold text-[color:var(--gold)] mb-2">
                ⚡ Compass · Result
              </div>
              <p className="text-[14px] leading-relaxed">
                <strong>UN1203 · 4,000 lbs · PG II</strong> → Class 3{" "}
                <strong className="text-[color:var(--red)] bg-white px-2 py-0.5 rounded">FLAMMABLE</strong>{" "}
                placard required on <strong>all 4 sides</strong>. Segregate from{" "}
                <span className="font-mono text-[color:var(--gold)]">Class 5.1</span> and{" "}
                <span className="font-mono text-[color:var(--gold)]">Class 8</span>. ERG Guide{" "}
                <span className="font-mono">128</span>. 24-hour ER number required on shipping papers per § 172.604.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HAZMAT BRAINS */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="section-tick"><span /><span /></div>
        <div className="eyebrow mb-2">02 · HAZMAT BRAINS</div>
        <h2 className="text-[36px] sm:text-[44px] font-extrabold tracking-tight text-[color:var(--navy)] mb-3 leading-tight">
          Six brains. <span className="serif-italic text-[color:var(--red)]">One hazmat shipment.</span>
        </h2>
        <p className="text-[17px] text-[color:var(--ink-soft)] max-w-2xl mb-12">
          Every brain reads from the actual regulation. No interpretive shortcuts.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {HAZMAT_BRAINS.map((b, i) => (
            <Link key={i} href="/app" className="card-hairline block">
              <div className="text-[28px] mb-3">{b.icon}</div>
              <h3 className="text-[18px] font-bold text-[color:var(--navy)] mb-2">{b.title}</h3>
              <div className="inline-block text-[11px] font-bold tracking-wider text-[color:var(--red)] bg-[color:var(--red)]/8 px-2 py-1 rounded-full font-mono mb-3">
                {b.cfr}
              </div>
              <p className="text-[14px] text-[color:var(--ink-soft)] leading-relaxed">{b.desc}</p>
              <div className="mt-4 text-[13px] font-bold text-[color:var(--red)]">Open {b.title} →</div>
            </Link>
          ))}
        </div>
      </section>

      {/* 100 HAZMAT SKILLS */}
      <section id="skills" className="bg-[color:var(--cream-2)] border-y border-[color:var(--hairline)] py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="section-tick"><span /><span /></div>
          <div className="eyebrow mb-2">03 · 100 HAZMAT-ONLY SKILLS</div>
          <h2 className="text-[36px] sm:text-[44px] font-extrabold tracking-tight text-[color:var(--navy)] mb-3 leading-tight">
            Every hazmat question.{" "}
            <span className="serif-italic text-[color:var(--red)]">One CFR away.</span>
          </h2>
          <p className="text-[17px] text-[color:var(--ink-soft)] max-w-2xl mb-12">
            Tap any chip to converse with the brain that owns it. Twelve representative skills shown — full list available in-app.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {HAZMAT_SKILLS.map((s, i) => (
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
        </div>
      </section>

      {/* PRICING TIE-IN */}
      <section className="navy-strip py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-[28px] sm:text-[36px] font-extrabold text-white mb-3 leading-tight">
            Hazmat add-on:{" "}
            <span className="serif-italic text-[color:var(--gold)]">+$99/mo.</span>
          </h2>
          <p className="text-[16px] text-white/75 mb-6">
            Pairs with any tier. Placard Wizard, 100 hazmat-only skills, segregation engine, ERG, TSA-H clock.
          </p>
          <Link href="/#pricing" className="btn-red">See pricing →</Link>
        </div>
      </section>
    </div>
  );
}
