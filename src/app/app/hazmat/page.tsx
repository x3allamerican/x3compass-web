/* ============================================================
   X3 COMPASS · HAZMAT CENTER (in-app)
   ------------------------------------------------------------
   SERVER COMPONENT · prerenders statically (output: "export").
   Mirrors app.x3compass.com/hazmat-center.html 1:1, using the
   verbatim static CSS at /public/hazmat-center.css for parity.

   The only interactive island is <HazmatPlacardDemo />, a
   small client component for the live UN→placard demo.

   Sections (in order):
     1. Hero v3 · placard wall + tanker photo + instrument cluster
     2. Credibility strip · 4 stats
     3. Stakes · "PHMSA doesn't negotiate." · 3 cards
     4. Demo · "Try it before you talk to anyone."
     5. Flagship trio · Placard Wizard / Concierge / Audit Vault
     6. Included · "Seven more tools. Same $99." · 7-card grid
     7. Proof · Marcus Halloran quote
     8. FAQ · 5 questions
     9. Final CTA
   ============================================================ */

import HazmatAppShell from "./HazmatAppShell";
// HazmatPlacardDemo + the inline /placard-render.js script were causing
// the Overview page to freeze on scroll (sub-pages, which don't use them,
// work fine). Stripped from Overview while we debug. The full Placard
// Wizard lives at /app/hazmat/placard-wizard and isn't affected.
// import HazmatPlacardDemo from "./HazmatPlacardDemo";
import EducationHubCard from "@/components/EducationHubCard";

const PLACARD_WALL = [
  "class-3.svg", "class-2.1.svg", "class-8.svg",
  "class-6.1.svg", "class-7.svg", "class-5.1.svg", "class-1.1.svg",
];

export default function HazmatCenterPage() {
  return (
    <HazmatAppShell activeId="hazmat-center" pageTitle="HAZMAT CENTER">
      {/* placard-render.js script removed along with HazmatPlacardDemo —
          the live demo is the only thing that needed window.renderPlacardSvg. */}

      {/* ============== HERO v3 ============== */}
      <section className="hz-hero-v3" aria-labelledby="hero-h1">
          {/* Placard wall removed — 7 SVGs sitting above-the-fold combined
              with the rest of the page's paint cost was tipping over Mac
              mini-class GPUs on scroll. Wire it back behind a feature flag
              once the page is profiled. */}

          <div className="hz-hero-v2-eyebrow">X3 COMPASS · HAZMAT CENTER · $99/MO</div>
          <h1 id="hero-h1">
            One bad placard ends <em>your authority.</em>
          </h1>
          <p className="hz-hero-v2-sub">
            Every 49 CFR Parts 171&ndash;180 obligation &mdash; classified, documented, audit-ready &mdash; for hazmat carriers running 1 to 100 power units. 14-day trial. No sales call.
          </p>

          <div className="hz-hero-cluster">
            <div className="hz-hero-cluster-item">
              <div className="hz-hero-cluster-num">2,863</div>
              <div className="hz-hero-cluster-label">UN Substances</div>
            </div>
            <div className="hz-hero-cluster-item">
              <div className="hz-hero-cluster-num">52</div>
              <div className="hz-hero-cluster-label">DOT Placards</div>
            </div>
            <div className="hz-hero-cluster-item">
              <div className="hz-hero-cluster-num">7d</div>
              <div className="hz-hero-cluster-label">Last Reg Sync</div>
            </div>
          </div>

          <div className="hz-hero-v2-ctas">
            <a
              className="hz-cta-primary"
              href="/app/settings?tab=billing&addon=hazmat"
              style={{ textDecoration: "none", display: "inline-block" }}
            >
              Start 14-Day Trial
            </a>
            <a className="hz-cta-secondary" href="#hz-demo">
              Try the Placard Wizard <span aria-hidden="true">↓</span>
            </a>
          </div>

          <figure className="hz-placard-photo" aria-label="DOT DANGEROUS placard mounted on a truck trailer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/photos/placard-hero.jpg"
              alt="A DOT DANGEROUS placard mounted on a US truck trailer — required marking for mixed-load hazmat shipments under 49 CFR § 172.504"
              loading="eager"
              width={1000}
              height={800}
            />
          </figure>
          <div className="hz-placard-photo-tag" aria-hidden="true">
            <a href="https://commons.wikimedia.org/wiki/File:Late_1970s_%27Dangerous%27_truck-trailer_placard.jpg" target="_blank" rel="noopener noreferrer nofollow">
              Photo &middot; CC0
            </a>
          </div>
        </section>

        {/* ============== CREDIBILITY STRIP ============== */}
        <section className="hz-cred-strip" aria-label="What's covered">
          <div className="hz-cred-item">
            <span className="hz-cred-label">Regulatory Scope</span>
            <span className="hz-cred-val">49 CFR §§ 171&ndash;180</span>
          </div>
          <div className="hz-cred-item">
            <span className="hz-cred-label">HMT Coverage</span>
            <span className="hz-cred-val">2,863 substances</span>
          </div>
          <div className="hz-cred-item">
            <span className="hz-cred-label">Placard Library</span>
            <span className="hz-cred-val">52 real DOT placards</span>
          </div>
          <div className="hz-cred-item">
            <span className="hz-cred-label">Update Cadence</span>
            <span className="hz-cred-val">Federal Register · weekly</span>
          </div>
        </section>

        {/* ============== STAKES ============== */}
        <section aria-labelledby="stakes-h">
          <div className="hz-section-head">
            <h2 id="stakes-h">PHMSA doesn&apos;t negotiate.</h2>
            <p>A roadside inspector with one finding can write a violation that costs more than your tractor.</p>
          </div>
          <div className="hz-stakes-grid">
            <div className="hz-stakes-card">
              <div className="hz-stakes-icon" aria-hidden="true">💸</div>
              <div className="hz-stakes-title">Per-Day Civil Penalty</div>
              <div className="hz-stakes-stat">$96,624</div>
              <div className="hz-stakes-body">Maximum civil penalty per knowing violation under 49 USC §5123. Death or serious injury raises it to $225,455. Each day continues as a separate offense.</div>
            </div>
            <div className="hz-stakes-card">
              <div className="hz-stakes-icon" aria-hidden="true">🛑</div>
              <div className="hz-stakes-title">Out-of-Service Order</div>
              <div className="hz-stakes-stat">100%</div>
              <div className="hz-stakes-body">A single §397.5 attendance violation or wrong placard under §172.504 puts the unit OOS at the scale. The driver waits. The load doesn&apos;t move. The shipper finds another carrier.</div>
            </div>
            <div className="hz-stakes-card">
              <div className="hz-stakes-icon" aria-hidden="true">📉</div>
              <div className="hz-stakes-title">SMS Hazmat BASIC Hit</div>
              <div className="hz-stakes-stat">10×</div>
              <div className="hz-stakes-body">Hazmat violations carry the highest CSA severity weights. Three placarding errors in 24 months trigger an FMCSA Compliance Review &mdash; the kind that ends in a Conditional rating.</div>
            </div>
          </div>
        </section>

        {/* ============== DEMO section · routes to the full Wizard ============== */}
        {/* HazmatPlacardDemo (live UN→placard widget) was stripped while we
            debug the Overview freeze. Visitors land on the full Placard
            Wizard page instead, which works fine and is what the demo CTA
            led to anyway. */}
        <section className="hz-demo" id="hz-demo" aria-labelledby="demo-h">
          <div className="hz-demo-head">
            <div>
              <h2 id="demo-h">Try it before you talk to anyone.</h2>
              <p>Enter a UN number. Get the §172.504 placard, the §172.202 shipping paper entries, and the §177.848 segregation table &mdash; in under 10 seconds.</p>
            </div>
            <span className="hz-demo-live-tag">LIVE</span>
          </div>
          <div className="hz-demo-footer" style={{ textAlign: "center", padding: "20px 0" }}>
            <a className="hz-cta-primary" href="/app/hazmat/placard-wizard" style={{ textDecoration: "none", display: "inline-block" }}>
              Open the Placard Wizard →
            </a>
          </div>
        </section>

        {/* ============== FLAGSHIP TRIO ============== */}
        <section aria-labelledby="flagship-h">
          <div className="hz-section-head">
            <h2 id="flagship-h">Three tools you&apos;ll use every day.</h2>
            <p>The rest of the catalog matters &mdash; but these are the ones that make the difference at the scale and during the audit.</p>
          </div>
          <div className="hz-flagship-grid">
            <a className="hz-flagship" href="/app/hazmat/placard-wizard">
              <div className="hz-flagship-icon" aria-hidden="true">🪧</div>
              <h3>Placard Wizard</h3>
              <p className="hz-flagship-val">UN number in. Correct placards and shipping paper entries out. Ten seconds.</p>
              <span className="hz-flagship-cite">49 CFR §§ 172.504, 172.202, 172.301</span>
              <span className="hz-flagship-cta">See it run</span>
            </a>
            <a className="hz-flagship" href="/app/ask?context=hazmat">
              <div className="hz-flagship-icon" aria-hidden="true">🧠</div>
              <h3>AI Hazmat Concierge</h3>
              <p className="hz-flagship-val">Ask a CFR question in plain English, get the cite and the answer. No competitor has this.</p>
              <span className="hz-flagship-cite">49 CFR Parts 171&ndash;180 · HMR §171.8 definitions</span>
              <span className="hz-flagship-cta">Ask a question</span>
            </a>
            <a className="hz-flagship" href="/app/hazmat/audit">
              <div className="hz-flagship-icon" aria-hidden="true">✅</div>
              <h3>Audit Readiness Vault</h3>
              <p className="hz-flagship-val">Every shipment, training record, and security plan &mdash; indexed for the inspector.</p>
              <span className="hz-flagship-cite">49 CFR §§ 172.201(e), 172.704(d), 172.802</span>
              <span className="hz-flagship-cta">See the audit view</span>
            </a>
          </div>
        </section>

        {/* ============== EDUCATION HUB · 49 CFR Parts 171–180 ============== */}
        <EducationHubCard
          surface="Hazmat Center"
          subtitle="49 CFR Parts 171–180 · the rules every hazmat carrier lives under"
          conciergeHref="/app/ask?context=hazmat&q=Walk%20me%20through%20what%20a%20hazmat%20carrier%20must%20do%20under%2049%20CFR%20Parts%20171%E2%80%93180"
          audiences={[
            {
              label: "For Drivers",
              subtitle: "HAZMAT-ENDORSED CDL HOLDERS",
              body:
                "If you carry an H endorsement and you move anything classified in §172.101 — flammable liquids, lithium batteries, corrosives, gases, even some lithium-powered tools — every shipping paper, placard, and emergency response document is on you, on the road, in real time.",
              bullets: [
                "TSA security threat assessment before the H endorsement (49 CFR Part 1572)",
                "Hazmat training every 3 years · general, function-specific, security, in-depth security if Table 1 substance (§172.704)",
                "Pre-trip: verify shipping papers match the load and the placards match the papers (§172.201, §172.504)",
                "Emergency response info within reach in the cab — Subpart G (§172.600–604)",
              ],
              cta: "Open driver hazmat guide →",
              href: "/app/hazmat/training",
              tone: "cyan",
              icon: "🚛",
            },
            {
              label: "For Employers",
              subtitle: "MOTOR CARRIERS SHIPPING HAZMAT",
              body:
                "You're the offeror or carrier under §171.8 — meaning PHMSA can fine you up to $96,624 per knowing violation per day (49 USC §5123). The Hazmat Center is the audit-ready record that proves you classified, packaged, marked, placarded, and trained the way the regulations say.",
              bullets: [
                "PHMSA registration if you offer or transport in placardable quantities (§107.601–620)",
                "Hazmat security plan if you move Table 1 substances (§172.800–802)",
                "Audit-ready file: training records, shipping papers, incident reports for 3 years (§172.201(e), §172.704(d))",
                "DOT incident report DOT-F-5800.1 within 30 days for any hazmat release (§171.16)",
              ],
              cta: "Open employer playbook →",
              href: "/app/hazmat/audit",
              tone: "amber",
            },
            {
              label: "For Compliance Officers",
              subtitle: "SAFETY DIRECTORS / DESIGNATED EMPLOYER REPS",
              body:
                "You build the program. The Hazmat Center surfaces the four audit areas inspectors actually score — classification accuracy, shipping paper sequence, placard correctness, and training currency — and lets you remediate driver-by-driver before the next FMCSA Compliance Review.",
              bullets: [
                "Classification + UN/NA assignment audit — does §172.101 HMT line up with what's on the BOL?",
                "Shipping paper sequence audit — proper shipping name, hazard class, UN/NA, packing group, in §172.202(a) order",
                "Placard correctness audit — §172.504 table 1 vs table 2 vs DANGEROUS aggregation rules",
                "Training currency audit — §172.704 recurrent every 3 years, documented per employee",
              ],
              cta: "Open audit checklist →",
              href: "/app/hazmat/audit",
              tone: "violet",
            },
          ]}
        />

        {/* ============== INCLUDED · 7 MORE TOOLS ============== */}
        <section aria-labelledby="included-h">
          <div className="hz-section-head">
            <h2 id="included-h">Seven more tools. Same $99.</h2>
            <p>No usage tiers, no per-seat fees, no upcharges for the things you actually need at 4 a.m. on a Tuesday.</p>
          </div>
          <div className="hz-included-grid">
            <a className="hz-included-item" href="/app/hazmat/substances">
              <div className="hz-included-head">
                <div className="hz-included-name">Substance Lookup</div>
                <div className="hz-included-icon" aria-hidden="true">🔎</div>
              </div>
              <div className="hz-included-desc">Search 2,863 entries in the §172.101 HMT by UN ID, proper shipping name, or packing group.</div>
              <span className="hz-included-cite">49 CFR § 172.101</span>
            </a>
            <a className="hz-included-item" href="/app/hazmat/lithium">
              <div className="hz-included-head">
                <div className="hz-included-name">Lithium Battery Decision Tree</div>
                <div className="hz-included-icon" aria-hidden="true">🔋</div>
              </div>
              <div className="hz-included-desc">Walk Section II, IB, or fully regulated in five questions &mdash; UN 3480, 3481, 3090, 3091.</div>
              <span className="hz-included-cite">49 CFR § 173.185</span>
            </a>
            <a className="hz-included-item" href="/app/hazmat/exemptions">
              <div className="hz-included-head">
                <div className="hz-included-name">Exemption &amp; Permit Checker</div>
                <div className="hz-included-icon" aria-hidden="true">💰</div>
              </div>
              <div className="hz-included-desc">Verify Limited Quantity, ORM-D, Materials of Trade, and active DOT Special Permits before you ship.</div>
              <span className="hz-included-cite">49 CFR §§ 173.150&ndash;156, Part 107</span>
            </a>
            <a className="hz-included-item" href="/app/hazmat/training">
              <div className="hz-included-head">
                <div className="hz-included-name">Hazmat Employee Training</div>
                <div className="hz-included-icon" aria-hidden="true">🎓</div>
              </div>
              <div className="hz-included-desc">Initial, recurrent (every 3 years), function-specific, and security awareness &mdash; with certificates on file.</div>
              <span className="hz-included-cite">49 CFR § 172.704</span>
            </a>
            <a className="hz-included-item" href="/app/hazmat/shipping-papers">
              <div className="hz-included-head">
                <div className="hz-included-name">Shipping Papers Builder</div>
                <div className="hz-included-icon" aria-hidden="true">📋</div>
              </div>
              <div className="hz-included-desc">Generate compliant bills of lading with the basic description in §172.202(a) sequence.</div>
              <span className="hz-included-cite">49 CFR §§ 172.200&ndash;172.205</span>
            </a>
            <a className="hz-included-item" href="/app/hazmat/emergency-response">
              <div className="hz-included-head">
                <div className="hz-included-name">Emergency Response Info</div>
                <div className="hz-included-icon" aria-hidden="true">🚨</div>
              </div>
              <div className="hz-included-desc">ERG-aligned response sheets and a 24-hour contact number meeting §172.604.</div>
              <span className="hz-included-cite">49 CFR §§ 172.600&ndash;172.606</span>
            </a>
            <a className="hz-included-item" href="/app/hazmat/security-plan">
              <div className="hz-included-head">
                <div className="hz-included-name">Security Plan Builder</div>
                <div className="hz-included-icon" aria-hidden="true">🛡️</div>
              </div>
              <div className="hz-included-desc">Written plan for materials on the §172.800 list &mdash; personnel, en-route, and unauthorized-access measures.</div>
              <span className="hz-included-cite">49 CFR §§ 172.800&ndash;172.804</span>
            </a>
          </div>
        </section>

        {/* ============== PROOF ============== */}
        <section aria-labelledby="proof-h">
          <div className="hz-section-head">
            <h2 id="proof-h">Run by Safety Directors who&apos;ve sat through the audit.</h2>
            <p>Built with carriers hauling flammables, corrosives, and lithium &mdash; not by a SaaS company that read the regs once.</p>
          </div>
          <figure className="hz-proof">
            <blockquote className="hz-proof-quote">
              We failed a Compliance Review in 2022 over §172.704 training gaps and a §172.802 security plan that hadn&apos;t been updated since the previous Safety Director left. X3 Compass rebuilt both in a weekend. Inspector came back six months later, looked at the audit log, and signed off in 40 minutes.
            </blockquote>
            <figcaption className="hz-proof-cite">
              <strong>Marcus Halloran</strong> · Director of Safety, Cordell Tank Lines · 28 tractors · UN 1203, UN 1830
            </figcaption>
          </figure>
        </section>

        {/* ============== FAQ ============== */}
        <section aria-labelledby="faq-h">
          <div className="hz-section-head">
            <h2 id="faq-h">Common questions.</h2>
            <p>Plain answers. No marketing.</p>
          </div>
          <div className="hz-faq">
            <details className="hz-faq-item">
              <summary className="hz-faq-q">Is there a free trial?</summary>
              <div className="hz-faq-a">Yes. 14 days, full access to every tool in the Hazmat Center, no credit card required to start. You hit the paywall on day 15, not before. Cancel inside the app &mdash; no email, no retention call.</div>
            </details>
            <details className="hz-faq-item">
              <summary className="hz-faq-q">Do I need an existing X3 Compass subscription?</summary>
              <div className="hz-faq-a">Yes. The Hazmat Center is a $99/mo add-on to your base X3 Compass plan, which handles DQ files, HOS, drug &amp; alcohol consortium, MVRs, and the rest of Parts 380&ndash;399. If you don&apos;t have Compass yet, start there &mdash; Hazmat installs in one click after.</div>
            </details>
            <details className="hz-faq-item">
              <summary className="hz-faq-q">Does this replace my SDS / Tier II / EPA reporting?</summary>
              <div className="hz-faq-a">No. X3 Compass Hazmat Center covers DOT/PHMSA <em>ground transportation</em> under 49 CFR Parts 171&ndash;180 only. It does not cover OSHA HazCom SDS authoring (29 CFR 1910.1200), EPA RCRA hazardous waste manifests (40 CFR Part 262), Tier II SARA reporting (EPCRA §312), IATA/ICAO air, or IMDG ocean. For multi-modal, use Labelmaster DGIS or a freight forwarder. For SDS, use VelocityEHS or Sphera.</div>
            </details>
            <details className="hz-faq-item">
              <summary className="hz-faq-q">How current is the regulatory data?</summary>
              <div className="hz-faq-a">The §172.101 HMT and Parts 171&ndash;180 text sync to the Federal Register weekly. HM rulemakings (e.g., HM-215, HM-219, HM-265) are tracked from NPRM through final rule with the effective date and a plain-English diff. Last sync timestamp shows in the footer of every page.</div>
            </details>
            <details className="hz-faq-item">
              <summary className="hz-faq-q">What happens to my data if I cancel?</summary>
              <div className="hz-faq-a">You get 90 days of read-only access plus a one-click export of every shipping paper, training certificate, and audit log as PDF and CSV. After 90 days, records are deleted under our SOC 2 retention policy. The §172.201(e) two-year retention obligation is yours to maintain &mdash; we make the export, you keep the file.</div>
            </details>
          </div>
        </section>

        {/* ============== FINAL CTA ============== */}
        <section className="hz-final-cta" aria-labelledby="final-cta-h">
          <h2 id="final-cta-h">Stop hoping the inspector skips you.</h2>
          <p>14 days free. $99/mo after. No sales call, no demo gating, no annual contract.</p>
          <a
            className="hz-cta-primary"
            href="/app/settings?tab=billing&addon=hazmat"
            style={{ textDecoration: "none", display: "inline-block" }}
          >
            Start 14-Day Trial
          </a>
        </section>
    </HazmatAppShell>
  );
}
