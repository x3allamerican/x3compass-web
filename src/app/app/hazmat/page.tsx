"use client";

/* ============================================================
   X3 COMPASS — HAZMAT CENTER (Bugatti tier)
   ------------------------------------------------------------
   In-app version of site/centers/hazmat.html. Same visual
   language: oversized headline + gradient, $89K fines banner,
   placard demo strip, 10-tile service stack, trust block.
   No more "migration note" — this IS the destination.
   ============================================================ */

import Link from "next/link";
import AppShell from "@/components/AppShell";

/* Hazmat amber palette — pulled from /assets/hazmat.css.
   Kept inline so this page is self-contained and doesn't fight
   the global cyan theme that AppShell sets. */
const HM = {
  amber:     "#FCA311",
  amberSoft: "rgba(252,163,17,0.12)",
  amberLine: "rgba(252,163,17,0.35)",
  red:       "rgba(252,165,165,0.6)",
  bg:        "#0A1117",
  surface:   "#0F1F35",
  surface2:  "#0A1628",
  fg:        "#F8FAFC",
  mist:      "#B8C5D6",
  fog:       "#94A3B8",
  border:    "rgba(255,255,255,0.08)",
  cyan:      "#00B2FD",
  cyanText:  "#67E8F9",
};

/* ----------- Sub-tools / service tiles ----------- */
const SERVICES = [
  { slug: "/app/hazmat/placard-wizard",    icon: "🪧", name: "Placard Wizard",       desc: "UN number in, correct placards + shipping paper entries out, in 10 seconds.", cfr: "49 CFR § 172.504" },
  { slug: "/app/hazmat/substances",        icon: "🔎", name: "Substance Lookup",     desc: "2,863 substances from the § 172.101 HMT. Search by UN ID or shipping name.",   cfr: "49 CFR § 172.101" },
  { slug: "/app/hazmat/lithium",           icon: "🔋", name: "Lithium Decision Tree", desc: "UN 3480/3481/3090/3091. 5-step wizard → packaging + Section II eligibility.",  cfr: "49 CFR § 173.185" },
  { slug: "/app/hazmat/exemptions",        icon: "💰", name: "Exemption Checker",    desc: "Limited Quantity, Excepted Quantity, ORM-D, Materials of Trade, Special Permits.", cfr: "49 CFR §§ 173.150-156" },
  { slug: "/app/hazmat/audit",             icon: "✅", name: "Audit Readiness",      desc: "53-point self-audit. Real-time score + grade. Export to PDF for the inspector.", cfr: "PHMSA + FMCSA audit" },
  { slug: "/app/hazmat/training",          icon: "🎓", name: "Training Tracker",     desc: "Initial + 3-year recurrent per driver. All 5 required elements tracked.",       cfr: "49 CFR § 172.704" },
  { slug: "/app/hazmat/shipping-papers",   icon: "📋", name: "Shipping Papers Builder", desc: "Live BOL preview. Embedded placard. CHEMTREC ER phone. Shipper certification.", cfr: "49 CFR § 172.200" },
  { slug: "/app/hazmat/emergency-response",icon: "🚨", name: "Emergency Response",   desc: "ERG quick-reference. Evacuation, fire, first-aid, isolation. CHEMTREC integrated.", cfr: "49 CFR § 172.602" },
  { slug: "/app/hazmat/security-plan",     icon: "🛡️", name: "Security Plan Builder", desc: "Applicability check per § 172.800. 3-component plan generator.",               cfr: "49 CFR Part 172 Subpart I" },
  { slug: "/app/ask?context=hazmat",       icon: "∞",  name: "AI Hazmat Concierge",  desc: "Ask anything about placarding, segregation, exemptions, training, lithium.",    cfr: "49 CFR Parts 171-180" },
];

/* The 9 hazard classes — for the placard demo strip. */
const PLACARDS = [
  { cls: "1", name: "Explosives",            color: "#F97316", fg: "#FFFFFF" },
  { cls: "2", name: "Gases",                 color: "#22C55E", fg: "#FFFFFF" },
  { cls: "3", name: "Flammable Liquids",     color: "#EF4444", fg: "#FFFFFF" },
  { cls: "4", name: "Flammable Solids",      color: "#FFFFFF", fg: "#000000", stripes: true },
  { cls: "5", name: "Oxidizers / Peroxides", color: "#FBBF24", fg: "#000000" },
  { cls: "6", name: "Toxic / Infectious",    color: "#FFFFFF", fg: "#000000" },
  { cls: "7", name: "Radioactive",           color: "#FFFFFF", fg: "#000000", radio: true },
  { cls: "8", name: "Corrosive",             color: "#FFFFFF", fg: "#000000", split: true },
  { cls: "9", name: "Miscellaneous",         color: "#FFFFFF", fg: "#000000", striped9: true },
];

export default function HazmatCenterPage() {
  return (
    <AppShell title="Hazmat Center" crumbs="Compliance · Premium add-on">
      <main style={{ background: HM.bg, padding: "0", color: HM.fg, minHeight: "calc(100vh - 110px)" }}>

        {/* ============================================================
            HERO — oversized, amber accent, "$25K fine" stakes
            ============================================================ */}
        <section style={{ padding: "60px 32px 48px", textAlign: "center", maxWidth: 1100, margin: "0 auto" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: HM.amberSoft, border: `1px solid ${HM.amberLine}`,
            color: HM.amber, fontSize: 12, fontWeight: 700, letterSpacing: "1.2px",
            textTransform: "uppercase", padding: "6px 14px", borderRadius: 999,
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            marginBottom: 22,
          }}>
            <span style={{ fontSize: 16 }}>⚠️</span> 49 CFR 171-180 · PHMSA · TSA · IATA · IMDG
          </div>

          <h1 style={{
            fontSize: "clamp(40px, 6vw, 76px)", fontWeight: 900,
            letterSpacing: "-2px", lineHeight: 1.05, margin: "0 0 20px",
            color: HM.fg,
          }}>
            One missed placard.<br />
            <s style={{ color: HM.red, textDecorationColor: "rgba(252,165,165,0.4)" }}>$25,000 fine.</s><br />
            <span style={{
              background: `linear-gradient(120deg, ${HM.amber} 30%, #FBBF24 70%)`,
              WebkitBackgroundClip: "text", backgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>We make sure that&apos;s not you.</span>
          </h1>

          <p style={{ fontSize: 17, color: HM.mist, lineHeight: 1.55, maxWidth: 720, margin: "0 auto 12px" }}>
            The hazmat compliance brain for motor carriers hauling regulated freight. Every placard verified.
            Every shipping paper validated. Every UN number indexed. Every CFR section cited.
          </p>
          <p style={{ fontSize: 14, color: HM.fog, margin: "0 0 32px" }}>
            Built on <a href="https://github.com/x3fleetsafety/hazmat-skills" target="_blank" rel="noopener noreferrer" style={{ color: HM.amber, fontWeight: 700, textDecoration: "none" }}>100 open-source hazmat skills</a> — Apache 2.0, fully public, auditable.
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
            <button id="hz-activate-btn" type="button" style={{
              background: `linear-gradient(135deg, ${HM.amber}, #F59E0B)`,
              color: "#1F1B0A", fontWeight: 800, fontSize: 15,
              padding: "14px 28px", borderRadius: 10, border: 0, cursor: "pointer",
              boxShadow: "0 8px 24px rgba(252,163,17,0.35)",
              textTransform: "none", letterSpacing: 0,
            }}>
              Add Hazmat Center · $99/mo →
            </button>
            <a href="#features" style={{
              background: "transparent", color: HM.fg, fontWeight: 700, fontSize: 14,
              padding: "13px 24px", borderRadius: 10, border: `1px solid ${HM.border}`,
              textDecoration: "none",
            }}>
              See features
            </a>
          </div>

          {/* 6 trust checkmarks */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12, marginTop: 48, maxWidth: 900,
            marginLeft: "auto", marginRight: "auto",
            fontSize: 13, color: HM.fog, textAlign: "left",
          }}>
            <div><span style={{ color: HM.amber, fontWeight: 800, marginRight: 6 }}>✓</span> 49 CFR cited every answer</div>
            <div><span style={{ color: HM.amber, fontWeight: 800, marginRight: 6 }}>✓</span> All 9 hazard classes covered</div>
            <div><span style={{ color: HM.amber, fontWeight: 800, marginRight: 6 }}>✓</span> PHMSA registration tracking</div>
            <div><span style={{ color: HM.amber, fontWeight: 800, marginRight: 6 }}>✓</span> TSA H endorsement tracking</div>
            <div><span style={{ color: HM.amber, fontWeight: 800, marginRight: 6 }}>✓</span> Cargo tank scheduler</div>
            <div><span style={{ color: HM.amber, fontWeight: 800, marginRight: 6 }}>✓</span> ERG lookup + segregation</div>
          </div>
        </section>

        {/* ============================================================
            FINES BANNER — $89,678 / $209,249 / 5 yrs prison
            ============================================================ */}
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 32px 60px" }}>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 0,
            background: "linear-gradient(135deg, rgba(239,68,68,0.06), rgba(252,163,17,0.06))",
            border: "1px solid rgba(239,68,68,0.28)", borderRadius: 14,
            padding: "32px 24px",
          }}>
            <FineBlock num="$89,678"  label="Maximum civil fine per knowing violation"   cite="49 USC §5123" />
            <FineBlock num="$209,249" label="Maximum if death, injury, or major release"  cite="49 USC §5123(a)(2)" />
            <FineBlock num="5 yrs"    label="Prison + $500K individual penalty for willful" cite="49 USC §5124" />
          </div>
          <p style={{ textAlign: "center", marginTop: 22, color: HM.mist, fontSize: 14 }}>
            These are real, federally-codified fines. Hazmat compliance is the highest-stakes corner of motor-carrier regulation. Hazmat Center is <strong style={{ color: HM.amber }}>$99/month.</strong>
          </p>
        </section>

        {/* ============================================================
            PLACARD DEMO STRIP — all 9 hazard classes
            ============================================================ */}
        <section style={{
          background: "rgba(15, 37, 64, 0.4)",
          borderTop: `1px solid ${HM.border}`, borderBottom: `1px solid ${HM.border}`,
          padding: "60px 32px",
        }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div style={{ color: HM.amber, fontSize: 11, letterSpacing: "2px", fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>All 9 hazard classes</div>
              <h2 style={{ fontSize: 28, fontWeight: 800, color: HM.fg, margin: 0 }}>Every placard. Every UN number. Cited and audit-ready.</h2>
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
              gap: 14,
            }}>
              {PLACARDS.map((p) => (
                <div key={p.cls} style={{
                  background: HM.surface, border: `1px solid ${HM.border}`,
                  borderRadius: 8, padding: 12, textAlign: "center",
                }}>
                  <PlacardDiamond {...p} />
                  <div style={{ marginTop: 10, fontSize: 11, fontWeight: 700, color: HM.fg, letterSpacing: "0.4px" }}>
                    Class {p.cls}
                  </div>
                  <div style={{ fontSize: 10.5, color: HM.fog, marginTop: 2 }}>{p.name}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================
            10 SERVICE TILES — the full hazmat ops stack
            ============================================================ */}
        <section id="features" style={{ maxWidth: 1200, margin: "0 auto", padding: "72px 32px 40px" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ color: HM.amber, fontSize: 11, letterSpacing: "2px", fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>The full stack</div>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: HM.fg, margin: 0, letterSpacing: "-0.5px" }}>10 tools. One subscription. Every CFR section cited.</h2>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 16,
          }}>
            {SERVICES.map((s) => (
              <Link key={s.slug} href={s.slug} style={{
                background: HM.surface, border: `1px solid rgba(252,163,17,0.22)`,
                borderRadius: 12, padding: "22px 24px",
                textDecoration: "none", display: "block", color: "inherit",
                transition: "border-color 140ms, transform 140ms",
              }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{s.icon}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: HM.fg, marginBottom: 6 }}>{s.name}</div>
                <div style={{ fontSize: 13, color: HM.mist, lineHeight: 1.5, marginBottom: 12, minHeight: 38 }}>{s.desc}</div>
                <span style={{
                  display: "inline-block",
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: 10.5, fontWeight: 700,
                  color: HM.amber, background: HM.amberSoft,
                  border: `1px solid ${HM.amberLine}`,
                  padding: "3px 10px", borderRadius: 4,
                  letterSpacing: "0.4px",
                }}>{s.cfr}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ============================================================
            TRUST BLOCK — 100 open-source skills
            ============================================================ */}
        <section style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 32px 80px" }}>
          <div style={{
            background: `linear-gradient(135deg, ${HM.surface2}, ${HM.surface})`,
            border: `1px solid ${HM.amberLine}`,
            borderRadius: 16, padding: "36px 40px",
            display: "grid", gridTemplateColumns: "1fr auto", gap: 32, alignItems: "center",
          }}>
            <div>
              <div style={{ color: HM.amber, fontSize: 11, letterSpacing: "2px", fontWeight: 700, textTransform: "uppercase", marginBottom: 10 }}>Open source</div>
              <h3 style={{ fontSize: 24, fontWeight: 800, color: HM.fg, margin: "0 0 10px" }}>100 hazmat skills. Public. Auditable. Apache 2.0.</h3>
              <p style={{ fontSize: 14, color: HM.mist, lineHeight: 1.55, margin: 0, maxWidth: 580 }}>
                Every reasoning module behind the Hazmat Center is published on GitHub. CFR-cited, peer-reviewable, free to fork. The price is for the run-time — orchestration, identity, audit trail, support, updates.
              </p>
            </div>
            <a href="https://github.com/x3fleetsafety/hazmat-skills" target="_blank" rel="noopener noreferrer" style={{
              background: HM.amber, color: "#1F1B0A", fontWeight: 800, fontSize: 14,
              padding: "12px 22px", borderRadius: 8, textDecoration: "none",
              whiteSpace: "nowrap",
            }}>
              View on GitHub →
            </a>
          </div>
        </section>

      </main>
    </AppShell>
  );
}

/* ----------- bits ----------- */

function FineBlock({ num, label, cite }: { num: string; label: string; cite: string }) {
  return (
    <div style={{ textAlign: "center", padding: "8px 16px" }}>
      <div style={{ fontSize: 36, fontWeight: 900, color: "#FCA311", letterSpacing: "-0.5px", lineHeight: 1.1 }}>{num}</div>
      <div style={{ fontSize: 13, color: "#B8C5D6", marginTop: 8, lineHeight: 1.4, maxWidth: 220, marginLeft: "auto", marginRight: "auto" }}>{label}</div>
      <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 6, fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>{cite}</div>
    </div>
  );
}

function PlacardDiamond({ cls, color, fg, stripes, radio, split, striped9 }: {
  cls: string; color: string; fg: string;
  stripes?: boolean; radio?: boolean; split?: boolean; striped9?: boolean;
}) {
  return (
    <div style={{
      width: 80, height: 80, margin: "0 auto",
      transform: "rotate(45deg)",
      background: split
        ? `linear-gradient(to bottom, ${color} 50%, #000000 50%)`
        : striped9
          ? `repeating-linear-gradient(0deg, ${color}, ${color} 4px, #000000 4px, #000000 8px)`
          : stripes
            ? `repeating-linear-gradient(0deg, ${color}, ${color} 4px, #EF4444 4px, #EF4444 8px)`
            : color,
      border: "2px solid #000000",
      display: "grid", placeItems: "center",
      color: fg, fontWeight: 900, fontSize: 24,
      borderRadius: 4,
      position: "relative",
    }}>
      <span style={{ transform: "rotate(-45deg)" }}>
        {radio ? "☢" : cls}
      </span>
    </div>
  );
}
