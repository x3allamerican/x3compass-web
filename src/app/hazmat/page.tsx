import Link from "next/link";
import SiteShell from "@/components/SiteShell";
import Related from "@/components/Related";
import PlacardWizardLive from "@/components/PlacardWizardLive";

import "./hazmat.css";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "X3 Compass Hazmat Center · The hazmat compliance brain",
  description:
    "Hazmat compliance, codified. One missed placard is a $25,000 fine. We make sure that's not you. $99/month add-on. Built on 100 open-source hazmat skills covering 49 CFR 171-180, PHMSA, TSA, IATA, IMDG.",
  openGraph: {
    title: "X3 Compass Hazmat Center",
    description:
      "Hazmat compliance brain — placards, shipping papers, ERG, segregation, training, cargo tank specs, route restrictions. $99/mo.",
    type: "website",
  },
};

/* ============================================================
   Mirrors /site/centers/hazmat.html · canonical reference.
   Amber/flame visual identity. 8 sections in this order:
     1. Hero
     2. Fines banner
     3. Placards demo strip + stat tiles
     4. Free-tool CTA (Placard Wizard inline)
     5. 12 hazmat brains
     6. Real scenarios · what goes wrong
     7. Corpus credibility · 100 open-source skills
     8. Pricing card · $99/mo
     9. FAQ
    10. Final CTA
   ============================================================ */

const TWELVE_BRAINS = [
  { tag: "01 · PLACARDS", title: "Placard Verifier", body: "Driver photographs all 4 sides before departure. AI verifies: placard present, correct class for the load, ID number panel readable, condition acceptable. Fails the check → driver gets specific fix instructions before rolling." },
  { tag: "02 · PAPERWORK", title: "Shipping Paper Validator", body: "Upload the BOL. AI checks every required element per 49 CFR 172.200 — UN number, proper shipping name, hazard class, packing group, total quantity, emergency response telephone. Missing field → flagged before driver leaves the dock." },
  { tag: "03 · LOOKUP", title: "ERG Instant Lookup", body: "Type a UN number. Get the Emergency Response Guide page with isolation distances, protection distances, fire response, spill response, first aid. 3,500+ UN numbers. Driver-app friendly for roadside use." },
  { tag: "04 · COMPATIBILITY", title: "Segregation Checker", body: "Add 2+ materials to the load. Instantly see if they're compatible per 49 CFR 177.848. Class 3 + Class 5.1 oxidizer = blocked with explanation. Saves the load from becoming a roadside violation." },
  { tag: "05 · CREDENTIALS", title: "H Endorsement + TSA Tracker", body: "Every hazmat driver tracked: CDL H endorsement expiration, TSA Hazmat Threat Assessment renewal (5-year cycle), state-specific re-tests. Reminders at 90/60/30/14 days. Lapse → driver auto-removed from hazmat dispatch." },
  { tag: "06 · TRAINING", title: "HM-126 Training Manager", body: "49 CFR 172.700 requires hazmat training every 3 years. Per driver: initial date, recurring date, certificate file, training topics. Auto-reminder 90 days before lapse. Audit-ready records." },
  { tag: "07 · REGISTRATION", title: "PHMSA Registration Tracker", body: "Annual hazmat registration (July 1 – June 30 cycle). Compass tracks your tier, fee paid, certificate, renewal deadline. Auto-renew reminders. Certificate downloads to your driver app for in-vehicle compliance." },
  { tag: "08 · TANKS", title: "Cargo Tank Scheduler", body: "Per tank: spec (DOT-406/407/412/MC-330/331), inspection cycle (annual visual, 1-5 year hydrostatic), certifications. Compass schedules tests, generates reminder, holds vehicle from dispatch if test lapsed." },
  { tag: "09 · ROUTES", title: "Hazmat Route Planner", body: "Avoids tunnels (Holland, Lincoln, Big Dig), follows state-designated routes (CA, NY, NJ, IL), handles Class 7 highway-route-controlled radioactive. Driver app shows compliant turn-by-turn. State permits surfaced." },
  { tag: "10 · SECURITY", title: "Hazmat Security Plan", body: "For carriers transporting security-sensitive hazmat (per 49 CFR 172.800): personnel security, unauthorized access prevention, en-route security, training. Annual review reminders. Compass-drafted template." },
  { tag: "11 · INCIDENTS", title: "Form 5800.1 Incident Assistant", body: "Hazmat incident happens? Compass walks the driver through the immediate-notification call (1-800-424-8802), then drafts Form 5800.1 within the 30-day window. Auto-pulls load + driver + carrier details." },
  { tag: "12 · DEFENSE", title: "Hazmat DataQ Scanner", body: "Hazmat violations have higher CSA weight + bigger fines. Compass scans every roadside hazmat inspection for contestable patterns — wrong placard code, improperly assigned subsidiary hazard, expired-but-actually-current cargo tank certs. Drafts DataQ challenges." },
];

const SCENARIOS = [
  { strong: "Driver leaves dock with 3 placards instead of 4.", detail: "Level 1 inspection on I-80. Single placarding violation = $5,300 fine, vehicle OOS, missed delivery, customer relationship damaged.", fix: "Compass: photo-verifies all 4 sides before driver leaves dock." },
  { strong: "Shipping paper missing the emergency response telephone number.", detail: "Roadside inspector finds the gap. $1,500-$8,000 violation. Carrier OOS until corrected.", fix: "Compass: validates shipping paper before vehicle leaves shipper." },
  { strong: "Class 3 flammable liquid loaded next to Class 5.1 oxidizer in the same trailer.", detail: "Segregation violation per 49 CFR 177.848. Inspector finds at scale. Fine + load returned for re-loading + cargo damage.", fix: "Compass: blocks the load assignment before dispatch." },
  { strong: "Driver's HM-126 training expired 2 weeks ago.", detail: "Audit catches it. Carrier cited for transporting hazmat without trained driver. Driver disqualified pending training.", fix: "Compass: auto-removed driver from hazmat dispatch 14 days before lapse." },
  { strong: "Cargo tank annual inspection 31 days overdue.", detail: "Roadside inspector finds in DOT records. Vehicle OOS. Tank cannot move until inspected + certified. Driver stranded.", fix: "Compass: held the unit from dispatch starting at the lapse date." },
  { strong: "Driver enters Holland Tunnel with hazmat load.", detail: "PANYNJ catches at tunnel approach. Fine + reroute mandate. Delivery now 2 hours late.", fix: "Compass: turn-by-turn rejected Holland Tunnel route, suggested compliant alternative." },
];

const PRICE_FEATURES = [
  "Placard verifier",
  "Shipping paper validator",
  "ERG instant lookup (3,500+ UN#)",
  "Segregation checker",
  "H endorsement tracker",
  "TSA Threat Assessment tracker",
  "HM-126 training manager",
  "PHMSA registration tracker",
  "Cargo tank scheduler",
  "Hazmat route planner",
  "Security plan generator",
  "Form 5800.1 incident assistant",
  "Hazmat DataQ scanner",
  "52-week hazmat safety meetings",
];

const FAQS = [
  { q: "Do I need a hazmat endorsement to add Hazmat Center?", a: "You don't — but your drivers do, if you transport placard-required hazmat. Hazmat Center actually helps you track which drivers have valid H endorsements + TSA Threat Assessments, so you don't dispatch them on hazmat loads when expired." },
  { q: "What if I only haul hazmat occasionally?", a: "Hazmat Center auto-pauses if no hazmat loads are logged for 60 days. You're not charged when you're not using it. When you book a hazmat load again, it reactivates." },
  { q: "Is this legal advice?", a: "No. Hazmat Center is operational compliance guidance — like having a senior hazmat compliance person on your team. For court / criminal / litigation, we'll tell you to call a transportation attorney. Every regulatory answer cites 49 CFR so you can verify." },
  { q: "How accurate is the AI?", a: "Every answer is grounded on the 100-skill open-source hazmat corpus (Apache 2.0, public on GitHub). Every CFR citation is verifiable. We use Claude (Anthropic) — among the most accurate AI models — and the corpus is reviewed by senior FMCSA + PHMSA compliance veterans." },
  { q: "What about IATA (air) and IMDG (ocean) hazmat?", a: "Hazmat Center includes IATA DGR and IMDG Code coverage. If you ship hazmat multimodally (truck to air to ocean), Compass handles the harmonization. Note: IATA-certified air-shipment personnel are still required by law for air; Compass supports but doesn't replace them." },
  { q: "Can I cancel anytime?", a: "Yes. Self-serve cancel. No friction. 30-day money-back guarantee on top." },
  { q: "What about Canada cross-border (TDG)?", a: "TDG (Canada's hazmat regs) is covered. We handle the harmonization with US 49 CFR. Coming Q1: Cross-Border Center as a separate add-on for full Canada + Mexico operations." },
  { q: "Does this work for the smallest carriers (1-5 trucks)?", a: "Yes. Hazmat Center is the same price ($99/mo) regardless of fleet size. A 1-truck owner-op hauling hazmat gets the same coverage as a 50-truck fleet." },
];

const HERO_BULLETS = [
  "49 CFR cited every answer",
  "All 9 hazard classes covered",
  "PHMSA registration tracking",
  "TSA H endorsement tracking",
  "Cargo tank scheduler",
  "ERG lookup + segregation",
];

export default function Hazmat() {
  return (
    <SiteShell>
      <div className="hm-page">
        {/* ─── HERO ─── */}
        <section className="hm-hero">
          <div className="hm-pill">
            <span style={{ fontSize: 18 }}>⚠️</span> 49 CFR 171-180 · PHMSA · TSA · IATA · IMDG · Apache 2.0 corpus
          </div>
          <h1>
            One missed placard.<br />
            <s style={{ color: "rgba(252,165,165,0.6)", textDecorationColor: "rgba(252,165,165,0.4)" }}>$25,000 fine.</s>
            <br />
            <span className="hm-gradient-text">We make sure that&apos;s not you.</span>
          </h1>
          <p className="hm-hero-lede">
            The hazmat compliance brain for motor carriers hauling regulated freight. Every placard verified. Every shipping paper validated. Every UN number indexed. Every CFR section cited.
          </p>
          <p className="hm-hero-sub">
            Built on{" "}
            <a href="https://github.com/x3fleetsafety/hazmat-skills" target="_blank" rel="noreferrer" style={{ color: "var(--hm-amber)" }}>
              <strong>100 open-source hazmat skills</strong>
            </a>{" "}
            — Apache 2.0, fully public, auditable.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 32, flexWrap: "wrap" }}>
            <Link href="#apply" className="hm-cta-large">Add Hazmat Center · $99/mo →</Link>
            <Link href="#features" className="hm-ghost">See features</Link>
          </div>
          <div className="hm-hero-bullets">
            {HERO_BULLETS.map((b) => (
              <div key={b}>
                <span style={{ color: "var(--hm-amber)" }}>✓</span> {b}
              </div>
            ))}
          </div>
        </section>

        {/* ─── FINES BANNER ─── */}
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 60px" }}>
          <div className="hm-fine-banner">
            <div>
              <div className="hm-fine-num">$89,678</div>
              <div className="hm-fine-label">Maximum civil fine per knowing violation</div>
              <div className="hm-fine-cite">49 USC §5123</div>
            </div>
            <div>
              <div className="hm-fine-num">$209,249</div>
              <div className="hm-fine-label">Maximum if death, injury, or major release</div>
              <div className="hm-fine-cite">49 USC §5123(a)(2)</div>
            </div>
            <div>
              <div className="hm-fine-num">5 yrs</div>
              <div className="hm-fine-label">Prison + $500K individual penalty for willful</div>
              <div className="hm-fine-cite">49 USC §5124</div>
            </div>
          </div>
          <p style={{ textAlign: "center", marginTop: 24, color: "var(--hm-mist)", fontSize: 14 }}>
            These are real, federally-codified fines. Hazmat compliance is the highest-stakes corner of motor-carrier regulation. Hazmat Center is $99/month.
          </p>
        </section>

        {/* ─── PLACARDS DEMO STRIP ─── */}
        <section className="hm-section-band">
          <div className="hm-section-inner" style={{ textAlign: "center" }}>
            <div className="hm-eyebrow">WHAT WE HANDLE</div>
            <h2 style={{ fontSize: "clamp(32px, 4vw, 48px)", margin: "0 0 16px", color: "var(--hm-paper)", fontWeight: 900, letterSpacing: "-0.02em" }}>
              All 9 hazard classes. <span className="hm-gradient-text">All 4 modes.</span>
            </h2>
            <p style={{ color: "var(--hm-fog)", maxWidth: 680, margin: "0 auto 48px", fontSize: 16, lineHeight: 1.55 }}>
              Compass Hazmat Center covers the full regulatory surface — highway, rail, air, ocean. Every class. Every division. Every CFR section.
            </p>
            <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 8 }}>
              {[
                { cls: "1", label: "1\nEXPL" },
                { cls: "2", label: "2\nGAS" },
                { cls: "3", label: "3\nFLAM" },
                { cls: "2", label: "4\nSOLD" },
                { cls: "2", label: "5\nOXID" },
                { cls: "6", label: "6\nPOIS" },
                { cls: "7", label: "7\nRAD" },
                { cls: "8", label: "8\nCORR" },
                { cls: "9", label: "9\nMISC" },
              ].map((p, i) => (
                <div key={i} className={`hm-placard hm-placard-class-${p.cls}`}>
                  <div className="hm-placard-inner" style={{ whiteSpace: "pre-line" }}>
                    {p.label}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 48, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, maxWidth: 900, marginLeft: "auto", marginRight: "auto" }}>
              <div className="hm-stat-tile">
                <div className="hm-stat-num">100+</div>
                <div className="hm-stat-label">Open-source hazmat skills</div>
              </div>
              <div className="hm-stat-tile">
                <div className="hm-stat-num">49 CFR</div>
                <div className="hm-stat-label">Parts 171-180 fully indexed</div>
              </div>
              <div className="hm-stat-tile">
                <div className="hm-stat-num">3,500+</div>
                <div className="hm-stat-label">UN numbers in the database</div>
              </div>
              <div className="hm-stat-tile">
                <div className="hm-stat-num">99.9%</div>
                <div className="hm-stat-label">Citation accuracy on regulatory answers</div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── FREE TOOL CTA · INLINE PLACARD WIZARD ─── */}
        <section style={{ padding: "60px 24px 40px" }}>
          <div className="hm-free-tool">
            <div>
              <div className="hm-free-tool-tag">FREE TOOL · NO SIGNUP</div>
              <h3>
                Try the <span className="hm-gradient-text">Placard Wizard</span> right now.
              </h3>
              <p>Enter your material + weight. Get the exact placards you need, with placement diagram and CFR citation. 4-step wizard. No card.</p>
            </div>
            <Link href="#wizard" className="hm-cta-large" style={{ whiteSpace: "nowrap" }}>
              Open Wizard →
            </Link>
          </div>
          <div id="wizard" style={{ maxWidth: 1100, margin: "40px auto 0" }}>
            <PlacardWizardLive />
          </div>
        </section>

        {/* ─── 12 FEATURES ─── */}
        <section id="features" className="hm-section" style={{ textAlign: "center" }}>
          <div className="hm-eyebrow">WHAT&apos;S INSIDE</div>
          <h2>
            Twelve hazmat brains. <span className="hm-gradient-text">One subscription.</span>
          </h2>
          <p className="hm-section-sub">Add to any Compass tier. Auto-activates when your fleet logs its first hazmat load.</p>
          <div className="hm-twelve" style={{ textAlign: "left" }}>
            {TWELVE_BRAINS.map((b) => (
              <div key={b.tag} className="hm-feature">
                <div className="hm-feature-tag">{b.tag}</div>
                <h3>{b.title}</h3>
                <p>{b.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── REAL SCENARIOS ─── */}
        <section className="hm-section" style={{ textAlign: "center" }}>
          <div className="hm-eyebrow">REAL SCENARIOS</div>
          <h2>What goes wrong without it.</h2>
          <p className="hm-section-sub">The hazmat violations that ruin a Friday — and how Compass catches them first.</p>
          <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "left" }}>
            {SCENARIOS.map((s, i) => (
              <div key={i} className="hm-warning-row">
                <div className="hm-warning-icon">⚠️</div>
                <div className="hm-warning-content">
                  <strong>{s.strong}</strong>
                  <br />
                  {s.detail} <em>{s.fix}</em>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── CORPUS CREDIBILITY ─── */}
        <section className="hm-section">
          <div className="hm-corpus-card">
            <div className="hm-corpus-badge">
              <div className="hm-corpus-num">100</div>
              <div className="hm-corpus-label">Open-source<br />hazmat skills</div>
            </div>
            <div>
              <div className="hm-corpus-eyebrow">Apache 2.0 · Public on GitHub · Built BEFORE the product</div>
              <h3>The hazmat corpus is published before the product ships.</h3>
              <p>
                X3 publishes 100 open-source compliance skills per vertical <em>before</em> launching the product on top. Hazmat is the first vertical Center. The <strong>100-skill corpus</strong> is public on GitHub right now — read every CFR citation, audit every regulatory claim, contribute corrections. The product reasons over this corpus.
              </p>
              <div className="hm-corpus-bullets">
                <span style={{ color: "var(--hm-amber)" }}>✓</span> 49 CFR Parts 171-180 (PHMSA hazmat regulations)<br />
                <span style={{ color: "var(--hm-amber)" }}>✓</span> 49 CFR Part 397 (motor carrier safety, hazmat-specific)<br />
                <span style={{ color: "var(--hm-amber)" }}>✓</span> TSA, IATA DGR, IMDG Code, TDG (Canada cross-border)<br />
                <span style={{ color: "var(--hm-amber)" }}>✓</span> All 9 hazard classes + every division
              </div>
              <a href="https://github.com/x3fleetsafety/hazmat-skills" target="_blank" rel="noreferrer" className="hm-cta" style={{ marginTop: 20 }}>
                View 100 hazmat skills on GitHub →
              </a>
            </div>
          </div>
        </section>

        {/* ─── PRICING ─── */}
        <section id="apply" className="hm-section" style={{ textAlign: "center" }}>
          <div className="hm-eyebrow">ADD TO ANY TIER</div>
          <h2 style={{ marginBottom: 40 }}>
            Hazmat Center · <span className="hm-gradient-text">$99/month</span>
          </h2>
          <div className="hm-price-card">
            <div className="hm-price-eyebrow">Compass Hazmat Center · Monthly</div>
            <div className="hm-price-num">
              $99<small>/mo</small>
            </div>
            <div className="hm-price-sub">Add-on to any Compass tier · Cancel anytime · Auto-activates when fleet logs first hazmat load</div>
            <div className="hm-price-features">
              {PRICE_FEATURES.map((f) => (
                <div key={f}>
                  <span style={{ color: "var(--hm-amber)" }}>✓</span> {f}
                </div>
              ))}
            </div>
            <Link href="/app/signup?tier=pro&center=hazmat" className="hm-cta-large" style={{ display: "block", width: "100%", textAlign: "center" }}>
              Add Hazmat Center to my account →
            </Link>
            <div className="hm-price-disclaimer">$99 charged month-to-month · Cancel any time · Auto-pause if no hazmat loads logged for 60 days · 30-day money-back</div>
          </div>
          <div style={{ textAlign: "center", marginTop: 48 }}>
            <Link href="/app/dashboard?demo=hazmat" className="hm-ghost">
              Try Hazmat Center demo →
            </Link>
          </div>
        </section>

        {/* ─── FAQ ─── */}
        <section className="hm-section" style={{ textAlign: "center" }}>
          <div className="hm-eyebrow">QUESTIONS</div>
          <h2>Common questions about Hazmat Center.</h2>
          <p className="hm-section-sub">Common-sense answers without the legal hedge. Every CFR is verifiable.</p>
          <div className="hm-faq-grid">
            {FAQS.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ─── FINAL CTA ─── */}
        <section className="hm-final-cta">
          <h2>
            Hazmat is the most heavily regulated freight in trucking.
            <br />
            <span className="hm-gradient-text">Don&apos;t operate blind.</span>
          </h2>
          <p>$99/month. Cancel anytime. No card for the 14-day trial.</p>
          <div className="hm-final-cta-buttons">
            <Link href="/app/signup?tier=pro&center=hazmat" className="hm-cta-large">
              Add Hazmat Center →
            </Link>
            <a href="https://github.com/x3fleetsafety/hazmat-skills" target="_blank" rel="noreferrer" className="hm-ghost">
              Read 100 hazmat skills
            </a>
          </div>
        </section>

        <Related
          links={[
            { href: "/case-studies/sample", title: "Sample audit walkthrough", desc: "See where hazmat preparation lands in a 6-day compliance review." },
            { href: "/skills", title: "All 67,750+ skills", desc: "100+ hazmat-only skills mapped to 49 CFR Parts 100-180." },
            { href: "/pricing", title: "Pricing + ROI", desc: "Hazmat add-on +$99/mo flat on any tier." },
          ]}
        />
      </div>
    </SiteShell>
  );
}
