import Link from "next/link";
import SiteShell from "@/components/SiteShell";
import Related from "@/components/Related";
import Placard, { HazardClass } from "@/components/Placard";
import PlacardWizardLive from "@/components/PlacardWizardLive";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hazmat — Placard wizard + 100 hazmat-specific skills",
  description: "Interactive placard wizard, 100+ hazmat skills covering Parts 100-180. UN number lookups, segregation tables, shipping paper templates, security plan builder, ERG emergency response.",
  openGraph: {
    title: "X3 Compass Hazmat — Placard wizard + 100 skills",
    description: "Placarding, segregation, shipping papers, security plans — every hazmat skill an interstate carrier needs, with live CFR cites.",
    type: "website",
  },
};
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

const DOT_PLACARDS = [
  { id: "1-1", file: "class-1-1.svg", label: "1.1 Explosives" },
  { id: "1-2", file: "class-1-2.svg", label: "1.2 Explosives" },
  { id: "1-3", file: "class-1-3.svg", label: "1.3 Explosives" },
  { id: "1-4", file: "class-1-4.svg", label: "1.4 Explosives" },
  { id: "1-5", file: "class-1-5.svg", label: "1.5 Blasting Agent" },
  { id: "1-6", file: "class-1-6.svg", label: "1.6 Extremely Insensitive" },
  { id: "2-1", file: "class-2-1.svg", label: "2.1 Flammable Gas" },
  { id: "2-2", file: "class-2-2.svg", label: "2.2 Non-Flammable Gas" },
  { id: "2-3", file: "class-2-3.svg", label: "2.3 Poison Gas" },
  { id: "3",   file: "class-3.svg",   label: "3 Flammable Liquid" },
  { id: "4-1", file: "class-4-1.svg", label: "4.1 Flammable Solid" },
  { id: "4-2", file: "class-4-2.svg", label: "4.2 Spontan. Combustible" },
  { id: "4-3", file: "class-4-3.svg", label: "4.3 Dangerous When Wet" },
  { id: "5-1", file: "class-5-1.svg", label: "5.1 Oxidizer" },
  { id: "5-2", file: "class-5-2.svg", label: "5.2 Organic Peroxide" },
  { id: "6-1", file: "class-6-1.svg", label: "6.1 Toxic / Poison" },
  { id: "6-2", file: "class-6-2.svg", label: "6.2 Infectious" },
  { id: "7",   file: "class-7.svg",   label: "7 Radioactive" },
  { id: "8",   file: "class-8.svg",   label: "8 Corrosive" },
  { id: "9",   file: "class-9.svg",   label: "9 Miscellaneous" },
  { id: "fuel-oil", file: "fuel-oil.svg", label: "Fuel Oil" },
  { id: "oxygen",   file: "oxygen.svg",   label: "Oxygen" },
  { id: "gasoline", file: "gasoline.svg", label: "Gasoline" },
  { id: "inh-2",    file: "inhalation-hazard-class-2.svg", label: "Inhalation (Cl. 2)" },
  { id: "inh-6",    file: "inhalation-hazard-class-6.svg", label: "Inhalation (Cl. 6)" },
  { id: "inh-lbl",  file: "inhalation-hazard-label.svg",   label: "Inhalation Label" },
  { id: "dangerous",file: "dangerous.svg", label: "DANGEROUS" },
];

const RAM_LABELS = [
  { id: "ram-1", file: "radioactive-1.svg", label: "Radioactive I" },
  { id: "ram-2", file: "radioactive-2.svg", label: "Radioactive II" },
  { id: "ram-3", file: "radioactive-3.svg", label: "Radioactive III" },
];

const GHS_PICTOGRAMS = [
  { id: "ghs01", file: "ghs-explosive.svg",     label: "Explosive" },
  { id: "ghs02", file: "ghs-flammable.svg",     label: "Flammable" },
  { id: "ghs03", file: "ghs-oxidizer.svg",      label: "Oxidizer" },
  { id: "ghs04", file: "ghs-gas-cylinder.svg",  label: "Gas Pressure" },
  { id: "ghs05", file: "ghs-corrosive.svg",     label: "Corrosive" },
  { id: "ghs06", file: "ghs-toxic.svg",         label: "Acute Toxic" },
  { id: "ghs07", file: "ghs-irritant.svg",      label: "Irritant" },
  { id: "ghs08", file: "ghs-health-hazard.svg", label: "Health Hazard" },
  { id: "ghs09", file: "ghs-environmental.svg", label: "Environment" },
];

const cardDark = "bg-[var(--surface)] border border-[var(--border)] rounded-2xl hover:border-[var(--accent)]/40 transition-colors";
const ctaCyan = { background: "linear-gradient(135deg, var(--accent), var(--accent-2))", boxShadow: "0 6px 18px rgba(2, 6, 12, 0.45)" };

export default function Hazmat() {
  return (
    <SiteShell>
      <div className="bg-[var(--bg)] text-[var(--fg)]">
        {/* HERO */}
        <section className="relative overflow-hidden">
          {/* decorative wash removed for production design pass */}
          <div className="max-w-7xl mx-auto px-6 pt-20 pb-20 relative">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-block text-[11px] tracking-[.18em] uppercase font-bold text-[var(--accent)] mb-6">
                THE HAZMAT CENTER · 100 CFR-CITED SKILLS · 1 PLACARD WIZARD
              </div>
              <h1 className="font-extrabold text-[var(--fg)] tracking-tight leading-[1.05] text-[44px] sm:text-[56px] md:text-[68px] mb-6">
                Hazmat compliance,
                <br />
                <span className="serif-italic" style={{ color: "var(--accent)" }}>grounded in 49 CFR.</span>
              </h1>
              <p className="text-[18px] text-[var(--fg-muted)] max-w-2xl mx-auto mb-8 leading-relaxed">
                Classes 1 through 9. Placard math, segregation tables, TSA-H clock, shipping-paper validator. Built by people who&apos;ve actually shipped a Class 3 load and had to call the IC at 2am.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Link href="#wizard" className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[15px] text-[var(--bg)]" style={ctaCyan}>
                  ★ Open the Placard Wizard →
                </Link>
                <Link href="#skills" className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[15px] text-[var(--fg)] border border-white/25 hover:bg-white/5">
                  Browse 100 hazmat skills →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* PLACARD GRID — DOT-compliant SVG generators (downloadable) */}
        <section className="max-w-7xl mx-auto px-6 py-12">
          <div className={`${cardDark} p-6`}>
            <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[var(--accent)] mb-2">DOT-COMPLIANT PLACARDS · 49 CFR § 172.519</div>
            <h3 className="text-[20px] font-extrabold text-[var(--fg)] mb-2">
              All 12 placard classes Compass generates.
            </h3>
            <p className="text-[13px] text-[var(--fg-muted)] mb-6">
              Scalable SVG — pixel-perfect at any size. Right-click any placard below to save it, or use the Placard Wizard to generate one with a specific UN number.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {PLACARD_GRID.map((p) => (
                <figure key={p.cls} className="flex flex-col items-center text-center bg-[var(--surface-3)] rounded-xl p-3 border border-[var(--border)]">
                  <Placard hazardClass={p.cls} size={120} />
                  <figcaption className="text-[10.5px] font-bold text-[var(--fg)] mt-2 leading-tight">{p.lbl}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* PLACARD WIZARD PREVIEW */}
        <section id="wizard" className="relative py-20 overflow-hidden border-y border-[var(--border)] bg-[var(--bg-3)]">
          {/* decorative wash removed for production design pass */}
          <div className="max-w-4xl mx-auto px-6 text-center relative">
            <div className="inline-block text-[11px] tracking-[.18em] uppercase font-bold text-[var(--accent)] mb-3">
              01 · PLACARD WIZARD
            </div>
            <h2 className="text-[36px] sm:text-[44px] font-extrabold tracking-tight text-[var(--fg)] mb-3 leading-tight">
              Tell us what you&apos;re hauling.
              <br />
              <span className="serif-italic" style={{ color: "var(--accent)" }}>We&apos;ll tell you what to placard.</span>
            </h2>
            <p className="text-[17px] text-[var(--fg-muted)] max-w-2xl mx-auto mb-8">
              Type a UN number or substance name. Compass looks it up against 80+ common hazmat substances, renders the actual DOT placard, and computes placarding (§ 172.504), segregation (§ 177.848), and ERG guide on the fly.
            </p>

            <PlacardWizardLive />

            <div className="mt-6 text-[12px] text-[var(--fg-muted)] text-center">
              💡 Try: <button type="button" className="text-[var(--accent)] hover:underline">UN1203 (gasoline)</button>, <button type="button" className="text-[var(--accent)] hover:underline">UN1830 (sulfuric acid)</button>, <button type="button" className="text-[var(--accent)] hover:underline">UN1075 (LPG)</button>, or <button type="button" className="text-[var(--accent)] hover:underline">UN3480 (lithium batteries)</button>.
            </div>
          </div>
        </section>

        {/* HAZMAT BRAINS */}
        <section className="max-w-7xl mx-auto px-6 py-24">
          <div className="inline-flex gap-1 mb-3">
            <span className="w-7 h-[3px] bg-[var(--accent)]" />
            <span className="w-7 h-[3px] bg-white/30" />
          </div>
          <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[var(--accent)] mb-2">02 · HAZMAT BRAINS</div>
          <h2 className="text-[36px] sm:text-[44px] font-extrabold tracking-tight text-[var(--fg)] mb-3 leading-tight">
            Six brains. <span className="serif-italic" style={{ color: "var(--accent)" }}>One hazmat shipment.</span>
          </h2>
          <p className="text-[17px] text-[var(--fg-muted)] max-w-2xl mb-12">
            Every brain reads from the actual regulation. No interpretive shortcuts.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {HAZMAT_BRAINS.map((b, i) => (
              <Link key={i} href="/app/ask" className={`${cardDark} block p-6`}>
                <div className="text-[28px] mb-3">{b.icon}</div>
                <h3 className="text-[18px] font-bold text-[var(--fg)] mb-2">{b.title}</h3>
                <div className="inline-block text-[11px] font-bold tracking-wider text-[var(--accent)] bg-[var(--accent)]/10 border border-[var(--accent)]/25 px-2 py-1 rounded-full font-mono mb-3">
                  {b.cfr}
                </div>
                <p className="text-[14px] text-[var(--fg-muted)] leading-relaxed">{b.desc}</p>
                <div className="mt-4 text-[13px] font-bold text-[var(--accent)]">Open {b.title} →</div>
              </Link>
            ))}
          </div>
        </section>

        {/* HAZMAT SKILLS */}
        <section id="skills" className="bg-[var(--bg-3)] border-y border-[var(--border)] py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="inline-flex gap-1 mb-3">
              <span className="w-7 h-[3px] bg-[var(--accent)]" />
              <span className="w-7 h-[3px] bg-white/30" />
            </div>
            <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[var(--accent)] mb-2">03 · 100 HAZMAT-ONLY SKILLS</div>
            <h2 className="text-[36px] sm:text-[44px] font-extrabold tracking-tight text-[var(--fg)] mb-3 leading-tight">
              Every hazmat question.{" "}
              <span className="serif-italic" style={{ color: "var(--accent)" }}>One CFR away.</span>
            </h2>
            <p className="text-[17px] text-[var(--fg-muted)] max-w-2xl mb-12">
              Tap any chip to converse with the brain that owns it. Twelve representative skills shown — full list available in-app.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {HAZMAT_SKILLS.map((s, i) => (
                <Link key={i} href="/app/ask" className={`${cardDark} relative pr-10 block p-5`}>
                  <div className="inline-block text-[10px] font-bold tracking-wider text-[var(--accent)] bg-[var(--accent)]/10 border border-[var(--accent)]/25 px-2 py-1 rounded-full font-mono mb-2">
                    {s.cfr}
                  </div>
                  <div className="text-[15px] font-bold text-[var(--fg)] mb-1">{s.name}</div>
                  <div className="text-[13px] italic text-[var(--fg-muted)]">&ldquo;{s.q}&rdquo;</div>
                  <div className="absolute right-5 top-5 text-[var(--accent)] font-bold">→</div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* PLACARD LIBRARY — real Wikimedia-sourced placards */}
        <section className="relative py-20 overflow-hidden border-y border-[var(--border)] bg-[var(--bg-2)]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[var(--accent)] mb-2">03 · PLACARD LIBRARY</div>
            <h2 className="text-[28px] sm:text-[40px] font-extrabold text-[var(--fg)] mb-2 leading-tight">
              Every <span className="serif-italic" style={{ color: "var(--accent)" }}>real placard.</span>
            </h2>
            <p className="text-[15px] text-[var(--fg-muted)] max-w-2xl mb-10">
              40 authentic placard images — every DOT hazard class, every GHS pictogram, the NFPA 704 diamond. Sourced from Wikimedia Commons (public-domain U.S. government works under 49 CFR § 172).
            </p>

            {/* DOT placards */}
            <div className="mb-12">
              <div className="text-[10px] tracking-[.18em] uppercase font-bold text-[var(--fg-muted)] mb-4">DOT Hazardous Materials Placards · 49 CFR § 172.504</div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-5">
                {DOT_PLACARDS.map((p) => (
                  <figure key={p.id} className="flex flex-col items-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/placards/${p.file}`} alt={p.label} width={110} height={110} className="block" draggable={false} />
                    <figcaption className="text-[10px] text-[var(--fg-muted)] mt-2 text-center font-mono leading-tight">{p.label}</figcaption>
                  </figure>
                ))}
              </div>
            </div>

            {/* Radioactive labels */}
            <div className="mb-12">
              <div className="text-[10px] tracking-[.18em] uppercase font-bold text-[var(--fg-muted)] mb-4">Class 7 Radioactive Labels · 49 CFR § 172.403</div>
              <div className="grid grid-cols-3 gap-5 max-w-md">
                {RAM_LABELS.map((p) => (
                  <figure key={p.id} className="flex flex-col items-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/placards/${p.file}`} alt={p.label} width={110} height={110} className="block" draggable={false} />
                    <figcaption className="text-[10px] text-[var(--fg-muted)] mt-2 text-center font-mono leading-tight">{p.label}</figcaption>
                  </figure>
                ))}
              </div>
            </div>

            {/* GHS pictograms */}
            <div className="mb-12">
              <div className="text-[10px] tracking-[.18em] uppercase font-bold text-[var(--fg-muted)] mb-4">UN GHS Pictograms · OSHA HazCom 2012</div>
              <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-5">
                {GHS_PICTOGRAMS.map((p) => (
                  <figure key={p.id} className="flex flex-col items-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/placards/${p.file}`} alt={p.label} width={84} height={84} className="block" draggable={false} />
                    <figcaption className="text-[10px] text-[var(--fg-muted)] mt-2 text-center font-mono leading-tight">{p.label}</figcaption>
                  </figure>
                ))}
              </div>
            </div>

            {/* NFPA 704 + attribution */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              <div>
                <div className="text-[10px] tracking-[.18em] uppercase font-bold text-[var(--fg-muted)] mb-4">NFPA 704 Fire Diamond</div>
                <figure className="flex flex-col items-start">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/placards/nfpa-704-template.svg" alt="NFPA 704 Diamond template" width={140} height={140} draggable={false} />
                  <figcaption className="text-[10px] text-[var(--fg-muted)] mt-2 font-mono">Fixed-facility hazard rating</figcaption>
                </figure>
              </div>
              <div className="md:col-span-2 text-[12px] text-[var(--fg-muted)] leading-relaxed">
                <div className="text-[10px] tracking-[.18em] uppercase font-bold text-[var(--fg-muted)] mb-3">Attribution + License</div>
                <p className="mb-2">All 40 placard images sourced from <a href="https://commons.wikimedia.org/wiki/Category:Dangerous_goods_placards" target="_blank" rel="noreferrer" className="text-[var(--accent)] hover:underline">Wikimedia Commons</a>.</p>
                <p className="mb-2"><strong className="text-[var(--fg-muted)]">DOT placards:</strong> US Government works — public domain per 17 USC § 105.</p>
                <p className="mb-2"><strong className="text-[var(--fg-muted)]">GHS + NFPA 704:</strong> released as PD-self by their Wikimedia authors.</p>
                <p className="mt-3"><a href="/placards/manifest.json" className="text-[var(--accent)] hover:underline">View manifest.json</a> &middot; <a href="/placards/LICENSES.md" className="text-[var(--accent)] hover:underline">License details</a></p>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING TIE-IN */}
        <section className="relative py-16 overflow-hidden">
          {/* decorative wash removed for production design pass */}
          <div className="max-w-3xl mx-auto px-6 text-center relative">
            <h2 className="text-[28px] sm:text-[36px] font-extrabold text-[var(--fg)] mb-3 leading-tight">
              Hazmat add-on:{" "}
              <span className="serif-italic" style={{ color: "var(--accent)" }}>+$99/mo.</span>
            </h2>
            <p className="text-[16px] text-[var(--fg-muted)] mb-6">
              Pairs with any tier. Placard Wizard, 100 hazmat-only skills, segregation engine, ERG, TSA-H clock.
            </p>
            <Link href="/#pricing" className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[15px] text-[var(--bg)]" style={ctaCyan}>
              See pricing →
            </Link>
          </div>
        </section>
        <Related links={[{"href": "/case-studies/sample", "title": "Sample audit walkthrough", "desc": "See where hazmat preparation lands in a 6-day compliance review."}, {"href": "/skills", "title": "All 300 skills", "desc": "100+ hazmat-only skills mapped to 49 CFR Parts 100-180."}, {"href": "/pricing", "title": "Pricing + ROI", "desc": "Hazmat add-on +$99/mo flat on any tier."}]} />
      </div>
    </SiteShell>
  );
}
