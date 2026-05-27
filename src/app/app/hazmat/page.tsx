"use client";

/* ============================================================
   X3 COMPASS — HAZMAT CENTER
   ------------------------------------------------------------
   Cyan-themed in-app landing page. Mirrors the live
   app.x3compass.com/hazmat-center look (UI cyan, NOT the
   amber rebuild that diverged from the reference).

   Placard demo strip uses the REAL SVG library at
   /public/hazmat/placards/ (33 standard class placards +
   21 specialty placards) — no more CSS recreations.

   Theme tokens come from AppShell's [data-x3-shell="app"]
   scope (var(--accent), var(--surface), var(--border), …)
   so dark/light toggle still works.
   ============================================================ */

import Link from "next/link";
import AppShell from "@/components/AppShell";
import EducationHubCard from "@/components/EducationHubCard";

/* ----------- Sub-tools / service tiles ----------- */
const SERVICES = [
  { slug: "/app/hazmat/placard-wizard",     icon: "🪧", name: "Placard Wizard",         desc: "UN number in, correct placards + shipping paper entries out, in 10 seconds.",   cfr: "49 CFR § 172.504" },
  { slug: "/app/hazmat/substances",         icon: "🔎", name: "Substance Lookup",       desc: "2,863 substances from the § 172.101 HMT. Search by UN ID or shipping name.",     cfr: "49 CFR § 172.101" },
  { slug: "/app/hazmat/lithium",            icon: "🔋", name: "Lithium Decision Tree",  desc: "UN 3480/3481/3090/3091. 5-step wizard → packaging + Section II eligibility.",   cfr: "49 CFR § 173.185" },
  { slug: "/app/hazmat/exemptions",         icon: "💰", name: "Exemption Checker",      desc: "Limited Qty, Excepted Qty, ORM-D, Materials of Trade, Special Permits.",        cfr: "49 CFR §§ 173.150-156" },
  { slug: "/app/hazmat/audit",              icon: "✅", name: "Audit Readiness",        desc: "53-point self-audit. Real-time score + grade. Export to PDF for the inspector.", cfr: "PHMSA + FMCSA audit" },
  { slug: "/app/hazmat/training",           icon: "🎓", name: "Training Tracker",       desc: "Initial + 3-year recurrent per driver. All 5 required elements tracked.",        cfr: "49 CFR § 172.704" },
  { slug: "/app/hazmat/shipping-papers",    icon: "📋", name: "Shipping Papers Builder", desc: "Live BOL preview. Embedded placard. CHEMTREC ER phone. Shipper certification.", cfr: "49 CFR § 172.200" },
  { slug: "/app/hazmat/emergency-response", icon: "🚨", name: "Emergency Response",     desc: "ERG quick-reference. Evacuation, fire, first-aid, isolation. CHEMTREC integrated.", cfr: "49 CFR § 172.602" },
  { slug: "/app/hazmat/security-plan",      icon: "🛡️", name: "Security Plan Builder",  desc: "Applicability check per § 172.800. 3-component plan generator.",                cfr: "49 CFR Part 172 Subpart I" },
  { slug: "/app/ask?context=hazmat",        icon: "🤖", name: "AI Hazmat Concierge",    desc: "Ask anything about placarding, segregation, exemptions, training, lithium.",     cfr: "49 CFR Parts 171-180" },
];

/* The 9 hazard classes — wired to the REAL SVG files in /public/hazmat/placards/.
   Each entry points to a file that already exists (verified May 27, 2026). */
const PLACARDS = [
  { cls: "1", file: "class-1.1.svg", name: "Explosives" },
  { cls: "2", file: "class-2.1.svg", name: "Flammable Gas" },
  { cls: "3", file: "class-3.svg",   name: "Flammable Liquids" },
  { cls: "4", file: "class-4.1.svg", name: "Flammable Solids" },
  { cls: "5", file: "class-5.1.svg", name: "Oxidizers" },
  { cls: "6", file: "class-6.1.svg", name: "Toxic / Infectious" },
  { cls: "7", file: "class-7.svg",   name: "Radioactive" },
  { cls: "8", file: "class-8.svg",   name: "Corrosive" },
  { cls: "9", file: "class-9.svg",   name: "Miscellaneous" },
];

export default function HazmatCenterPage() {
  return (
    <AppShell title="Hazmat Center" crumbs="HAZMAT CENTER · 49 CFR Parts 171-180 · PHMSA · TSA · IATA · IMDG">
      <main style={{ background: "var(--bg)", color: "var(--fg)", minHeight: "calc(100vh - 134px)", padding: 0 }}>

        {/* ============================================================
            HERO — cyan theme, $25K fine stakes, 6 trust checks
            ============================================================ */}
        <section style={{ padding: "60px 32px 48px", textAlign: "center", maxWidth: 1100, margin: "0 auto" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "color-mix(in srgb, var(--accent) 12%, transparent)",
            border: "1px solid color-mix(in srgb, var(--accent) 38%, transparent)",
            color: "var(--accent)", fontSize: 12, fontWeight: 700, letterSpacing: "1.2px",
            textTransform: "uppercase", padding: "6px 14px", borderRadius: 999,
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            marginBottom: 22,
          }}>
            <span style={{ fontSize: 16 }}>⚠️</span> 49 CFR 171-180 · PHMSA · TSA · IATA · IMDG
          </div>

          <h1 style={{
            fontSize: "clamp(40px, 6vw, 76px)", fontWeight: 900,
            letterSpacing: "-2px", lineHeight: 1.05, margin: "0 0 20px",
            color: "var(--fg)",
          }}>
            One missed placard.<br />
            <s style={{ color: "#FCA5A5", textDecorationColor: "rgba(252,165,165,0.4)" }}>$25,000 fine.</s><br />
            <span style={{
              background: "linear-gradient(120deg, var(--accent) 30%, var(--accent-2) 70%)",
              WebkitBackgroundClip: "text", backgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>We make sure that&apos;s not you.</span>
          </h1>

          <p style={{ fontSize: 17, color: "var(--fg-muted)", lineHeight: 1.55, maxWidth: 720, margin: "0 auto 12px" }}>
            The hazmat compliance brain for motor carriers hauling regulated freight. Every placard verified.
            Every shipping paper validated. Every UN number indexed. Every CFR section cited.
          </p>
          <p style={{ fontSize: 14, color: "var(--fg-faint)", margin: "0 0 32px" }}>
            Built on{" "}
            <a href="https://gitlab.com/joshuakovarik/hazmat-skills" target="_blank" rel="noopener noreferrer"
               style={{ color: "var(--accent)", fontWeight: 700, textDecoration: "none" }}>
              100 open-source hazmat skills
            </a>{" "}
            — Apache 2.0, fully public, auditable.
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
            <Link href="/app/settings?tab=billing&addon=hazmat" style={{
              background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
              color: "var(--accent-fg, #001019)", fontWeight: 800, fontSize: 15,
              padding: "14px 28px", borderRadius: 10, border: 0, cursor: "pointer",
              /* ANTI_SLOP rule #2: tinted shadow on bg hue (not cyan glow). */
              boxShadow: "0 10px 28px rgba(2, 6, 12, 0.55), 0 1px 0 rgba(255,255,255,0.18) inset",
              letterSpacing: 0, textDecoration: "none",
            }}>
              Add Hazmat Center · $99/mo →
            </Link>
            <a href="#features" style={{
              background: "transparent", color: "var(--fg)", fontWeight: 700, fontSize: 14,
              padding: "13px 24px", borderRadius: 10, border: "1px solid var(--border)",
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
            fontSize: 13, color: "var(--fg-muted)", textAlign: "left",
          }}>
            <div><span style={{ color: "var(--accent)", fontWeight: 800, marginRight: 6 }}>✓</span> 49 CFR cited every answer</div>
            <div><span style={{ color: "var(--accent)", fontWeight: 800, marginRight: 6 }}>✓</span> All 9 hazard classes covered</div>
            <div><span style={{ color: "var(--accent)", fontWeight: 800, marginRight: 6 }}>✓</span> PHMSA registration tracking</div>
            <div><span style={{ color: "var(--accent)", fontWeight: 800, marginRight: 6 }}>✓</span> TSA H endorsement tracking</div>
            <div><span style={{ color: "var(--accent)", fontWeight: 800, marginRight: 6 }}>✓</span> Cargo tank scheduler</div>
            <div><span style={{ color: "var(--accent)", fontWeight: 800, marginRight: 6 }}>✓</span> ERG lookup + segregation</div>
          </div>
        </section>

        {/* ============================================================
            FINES BANNER — federal penalty stack
            ============================================================ */}
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 32px 60px" }}>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 0,
            background: "linear-gradient(135deg, rgba(239,68,68,0.06), color-mix(in srgb, var(--accent) 8%, transparent))",
            border: "1px solid rgba(239,68,68,0.28)", borderRadius: 14,
            padding: "32px 24px",
          }}>
            <FineBlock num="$89,678"  label="Maximum civil fine per knowing violation"   cite="49 USC §5123" />
            <FineBlock num="$209,249" label="Maximum if death, injury, or major release"  cite="49 USC §5123(a)(2)" />
            <FineBlock num="5 yrs"    label="Prison + $500K individual penalty for willful" cite="49 USC §5124" />
          </div>
          <p style={{ textAlign: "center", marginTop: 22, color: "var(--fg-muted)", fontSize: 14 }}>
            These are real, federally-codified fines. Hazmat compliance is the highest-stakes corner of motor-carrier regulation. Hazmat Center is{" "}
            <strong style={{ color: "var(--accent)" }}>$99/month.</strong>
          </p>
        </section>

        {/* ============================================================
            PLACARD STRIP — RENDERS THE REAL SVG FILES
            ------------------------------------------------------------
            No more CSS-recreated diamonds. These are the official DOT
            placard SVGs in /public/hazmat/placards/.
            ============================================================ */}
        <section style={{
          background: "var(--surface)",
          borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)",
          padding: "60px 32px",
        }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div style={{
                color: "var(--accent)", fontSize: 11, letterSpacing: "2px",
                fontWeight: 700, textTransform: "uppercase", marginBottom: 8,
              }}>
                All 9 hazard classes · real DOT artwork
              </div>
              <h2 style={{ fontSize: 28, fontWeight: 800, color: "var(--fg)", margin: 0 }}>
                Every placard. Every UN number. Cited and audit-ready.
              </h2>
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
              gap: 14,
            }}>
              {PLACARDS.map((p) => (
                <Link
                  key={p.cls}
                  href={`/app/hazmat/placard-wizard?class=${p.cls}`}
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    borderRadius: 8, padding: 12, textAlign: "center",
                    textDecoration: "none", color: "inherit",
                    transition: "border-color 140ms, transform 140ms, box-shadow 140ms",
                  }}
                >
                  <div style={{ width: 96, height: 96, margin: "0 auto", display: "grid", placeItems: "center" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/hazmat/placards/${p.file}`}
                      alt={`DOT Class ${p.cls} ${p.name} placard`}
                      width={96}
                      height={96}
                      style={{ display: "block", width: 96, height: 96, objectFit: "contain" }}
                    />
                  </div>
                  <div style={{ marginTop: 10, fontSize: 11, fontWeight: 700, color: "var(--fg)", letterSpacing: "0.4px" }}>
                    Class {p.cls}
                  </div>
                  <div style={{ fontSize: 10.5, color: "var(--fg-muted)", marginTop: 2 }}>{p.name}</div>
                </Link>
              ))}
            </div>
            <div style={{ textAlign: "center", marginTop: 24 }}>
              <Link href="/app/hazmat/placard-wizard" style={{
                color: "var(--accent)", fontWeight: 700, fontSize: 13,
                textDecoration: "none",
              }}>
                Open Placard Wizard → choose by UN number, get the exact placard set
              </Link>
            </div>
          </div>
        </section>

        {/* ============================================================
            10 SERVICE TILES — the full hazmat ops stack
            ============================================================ */}
        <section id="features" style={{ maxWidth: 1200, margin: "0 auto", padding: "72px 32px 40px" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{
              color: "var(--accent)", fontSize: 11, letterSpacing: "2px",
              fontWeight: 700, textTransform: "uppercase", marginBottom: 8,
            }}>
              The full stack
            </div>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: "var(--fg)", margin: 0, letterSpacing: "-0.5px" }}>
              10 tools. One subscription. Every CFR section cited.
            </h2>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 16,
          }}>
            {SERVICES.map((s) => (
              <Link key={s.slug} href={s.slug} style={{
                background: "var(--surface)",
                border: "1px solid color-mix(in srgb, var(--accent) 22%, var(--border))",
                borderRadius: 12, padding: "22px 24px",
                textDecoration: "none", display: "block", color: "inherit",
                transition: "border-color 140ms, transform 140ms",
              }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{s.icon}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--fg)", marginBottom: 6 }}>{s.name}</div>
                <div style={{ fontSize: 13, color: "var(--fg-muted)", lineHeight: 1.5, marginBottom: 12, minHeight: 38 }}>{s.desc}</div>
                <span style={{
                  display: "inline-block",
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: 10.5, fontWeight: 700,
                  color: "var(--accent)",
                  background: "color-mix(in srgb, var(--accent) 10%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--accent) 32%, transparent)",
                  padding: "3px 10px", borderRadius: 4,
                  letterSpacing: "0.4px",
                }}>{s.cfr}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ============================================================
            EDUCATION HUB — same audience triad as every other surface
            ============================================================ */}
        <section style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 32px 40px" }}>
          <EducationHubCard
            surface="Hazmat"
            subtitle="49 CFR Parts 171-180 — placarding, packaging, shipping papers, training, security, emergency response. Penalties up to $89,678 per knowing violation."
            audiences={[
              {
                label: "For Drivers", subtitle: "CDL / CLP HOLDERS WITH H ENDORSEMENT", tone: "cyan", icon: "🧑‍✈️",
                body: "If you haul placarded loads, you carry the regulator on your right-hand side. Know what your shipping papers should look like, where they live in the cab, and what your duty to report is.",
                bullets: [
                  "Where the shipping paper lives (172.201, 172.205)",
                  "Reportable incidents (171.15, 171.16)",
                  "Emergency Response Guidebook lookup",
                  "Segregation table — what cannot ride together",
                  "Smoking, brake-check, and route restrictions",
                  "TSA-H endorsement maintenance",
                ],
                cta: "Open Driver guide →", href: "/app/hazmat/emergency-response",
              },
              {
                label: "For Employers", subtitle: "HAZMAT CARRIERS · SAFETY · DISPATCH", tone: "violet", icon: "🏢",
                body: "Hazmat fines are the single largest civil-penalty exposure in our industry. Build a defensible program: registered with PHMSA, current on training, security plan in place, every shipment paper-trail intact.",
                bullets: [
                  "PHMSA registration + DOT-PHMSA fee schedule",
                  "Function-specific training program (§ 172.704)",
                  "Security plan applicability + content (§ 172.800)",
                  "Recurring 3-year retraining tracker",
                  "Cargo tank inspection scheduler",
                  "Shipping paper retention (§ 177.817)",
                ],
                cta: "Open Employer guide →", href: "/app/hazmat/audit",
              },
              {
                label: "For C/TPAs", subtitle: "CONSORTIA / THIRD-PARTY ADMINISTRATORS", tone: "amber", icon: "🛡",
                body: "If you administer hazmat compliance for multiple carriers, the Hazmat Center scales horizontally — every carrier rolls up under your dashboard with PHMSA registration tracking, training compliance, and audit-readiness scores.",
                bullets: [
                  "Multi-tenant training tracker",
                  "Per-carrier PHMSA registration status",
                  "Aggregate audit-readiness scoring",
                  "Cross-client incident reporting workflow",
                  "Annual recurrent training rollups",
                  "White-label reseller pricing",
                ],
                cta: "Open C/TPA guide →", href: "/app/ask?context=ctpa-hazmat",
              },
            ]}
            conciergeHref="/app/ask?context=hazmat"
          />
        </section>

        {/* ============================================================
            TRUST BLOCK — 100 open-source skills
            ============================================================ */}
        <section style={{ maxWidth: 1000, margin: "0 auto", padding: "16px 32px 80px" }}>
          <div style={{
            background: "linear-gradient(135deg, var(--surface-2), var(--surface))",
            border: "1px solid color-mix(in srgb, var(--accent) 32%, var(--border))",
            borderRadius: 16, padding: "36px 40px",
            display: "grid", gridTemplateColumns: "1fr auto", gap: 32, alignItems: "center",
          }}>
            <div>
              <div style={{
                color: "var(--accent)", fontSize: 11, letterSpacing: "2px",
                fontWeight: 700, textTransform: "uppercase", marginBottom: 10,
              }}>
                Open source
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 800, color: "var(--fg)", margin: "0 0 10px" }}>
                100 hazmat skills. Public. Auditable. Apache 2.0.
              </h3>
              <p style={{ fontSize: 14, color: "var(--fg-muted)", lineHeight: 1.55, margin: 0, maxWidth: 580 }}>
                Every reasoning module behind the Hazmat Center is published on GitLab. CFR-cited, peer-reviewable, free to fork. The price is for the run-time — orchestration, identity, audit trail, support, updates.
              </p>
            </div>
            <a
              href="https://gitlab.com/joshuakovarik/hazmat-skills"
              target="_blank" rel="noopener noreferrer"
              style={{
                background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
                color: "var(--accent-fg, #001019)", fontWeight: 800, fontSize: 14,
                padding: "12px 22px", borderRadius: 8, textDecoration: "none",
                whiteSpace: "nowrap",
                /* ANTI_SLOP rule #2: shadow tinted on bg hue, not cyan glow. */
                boxShadow: "0 8px 20px rgba(2, 6, 12, 0.45)",
              }}
            >
              View on GitLab →
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
      <div style={{
        fontSize: 36, fontWeight: 900, color: "#FCA5A5",
        letterSpacing: "-0.5px", lineHeight: 1.1,
      }}>{num}</div>
      <div style={{
        fontSize: 13, color: "var(--fg-muted)", marginTop: 8, lineHeight: 1.4,
        maxWidth: 220, marginLeft: "auto", marginRight: "auto",
      }}>{label}</div>
      <div style={{
        fontSize: 11, color: "var(--fg-faint)", marginTop: 6,
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
      }}>{cite}</div>
    </div>
  );
}
