/* ============================================================
   X3 COMPASS · HAZMAT · SUBSTANCE LOOKUP (native)
   ------------------------------------------------------------
   Replaces the iframe stub with a native Next.js page that
   renders inside HazmatAppShell, includes a UN-number search
   island (placeholder until the full HMT database connects),
   and a real EducationHubCard.
   ============================================================ */

import HazmatSubPageShell from "../HazmatSubPageShell";

export default function SubstancesPage() {
  return (
    <HazmatSubPageShell
      activeId="hazmat-substances"
      pageTitle="SUBSTANCE LOOKUP"
      eduSurface="Substance Lookup"
      eduSubtitle="49 CFR § 172.101 · the Hazardous Materials Table that grades every BOL"
      conciergeHref="/ask?context=hazmat-substances"
      eduAudiences={[
        {
          label: "For Drivers",
          subtitle: "HAZMAT-ENDORSED CDL HOLDERS",
          body:
            "Every line on your shipping paper has to trace back to the HMT. If the proper shipping name on the BOL doesn't match the §172.101 entry for that UN number, the offeror got it wrong — and you're the one at the scale answering for it.",
          bullets: [
            "Cross-check the proper shipping name against §172.101 column 2",
            "Confirm the hazard class and packing group match the BOL",
            "Watch for inhalation-hazard substances (Special Provision codes 1, 2, 3, or 4)",
            "Recognize marine pollutants and elevated-temperature shipments at a glance",
          ],
          cta: "Open driver substance guide →",
          href: "/hazmat/training",
          tone: "cyan",
          icon: "🚛",
        },
        {
          label: "For Employers",
          subtitle: "OFFERORS · CARRIERS · SHIPPERS",
          body:
            "Classification under §172.101 is the foundation. Get the hazard class wrong and every downstream artifact — placards, shipping papers, packaging, training — inherits the error. The lookup is what gets that classification right the first time.",
          bullets: [
            "Use Column 1 (Symbols) to spot domestic-only, IMDG-only, or forbidden entries",
            "Pick the correct packing group (I, II, or III) — that drives the packaging spec",
            "Apply the Special Provisions in Column 7 — the modifiers that change the rules",
            "Authorized packaging per Column 8 — bulk vs non-bulk vs exception",
          ],
          cta: "Open employer playbook →",
          href: "/hazmat/exemptions",
          tone: "amber",
        },
        {
          label: "For Compliance Officers",
          subtitle: "SAFETY DIRECTORS · DESIGNATED EMPLOYER REPS",
          body:
            "Classification audits are the first thing PHMSA looks at. Pull 20 shipments a quarter, run them through the lookup, and you have a documented sample that proves your offeror process tracks §172.101 — the single most-cited finding in CR results.",
          bullets: [
            "Quarterly: 20-shipment HMT cross-check sample",
            "Document Column 7 Special Provision applications per shipment",
            "Track marine pollutants (§171.4) and elevated-temperature shipments separately",
            "Flag forbidden shipments before they ever reach the dock (§173.21)",
          ],
          cta: "Open audit checklist →",
          href: "/hazmat/audit",
          tone: "violet",
        },
      ]}
    >
      {/* ============== SEARCH ISLAND (placeholder until DB wired) ============== */}
      <section
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          padding: 22,
        }}
      >
        <h2 style={{ margin: "0 0 6px", fontSize: 22, color: "#F8FAFC" }}>
          Search the §172.101 Hazardous Materials Table
        </h2>
        <p style={{ color: "#94A3B8", margin: "0 0 18px", fontSize: 14 }}>
          UN/NA number, proper shipping name, or packing group. Returns all 12 HMT columns plus
          authorized packaging and Special Provisions.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 10,
            maxWidth: 720,
          }}
        >
          <input
            type="search"
            placeholder="UN 1203 · gasoline · packing group II..."
            disabled
            style={{
              padding: "12px 14px",
              background: "#000000",
              border: "1px solid rgba(22, 199, 255, 0.25)",
              borderRadius: 10,
              color: "#F8FAFC",
              fontSize: 15,
            }}
          />
          <button
            disabled
            style={{
              padding: "12px 20px",
              background: "linear-gradient(135deg, #16C7FF, #16C7FF)",
              color: "#000000",
              border: 0,
              borderRadius: 10,
              fontWeight: 600,
              opacity: 0.7,
              cursor: "not-allowed",
            }}
          >
            Search HMT
          </button>
        </div>
        <p style={{ color: "#64748B", margin: "12px 0 0", fontSize: 12 }}>
          Live database connection wiring up — search will go live as part of Hazmat Phase 3.
        </p>
      </section>

      {/* ============== QUICK-LINK GRID ============== */}
      <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 22 }}>
        <h3 style={{ margin: "0 0 14px", fontSize: 16, color: "#F8FAFC" }}>Frequent lookups</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
          }}
        >
          {[
            { un: "UN 1203", name: "Gasoline (Class 3, PG II)" },
            { un: "UN 1830", name: "Sulfuric acid (Class 8, PG II)" },
            { un: "UN 1993", name: "Flammable liquid n.o.s. (Class 3)" },
            { un: "UN 3480", name: "Lithium-ion batteries (Class 9)" },
            { un: "UN 1075", name: "Petroleum gases, liquefied (Class 2.1)" },
            { un: "UN 1075", name: "Propane (Class 2.1, PG —)" },
          ].map((s) => (
            <div
              key={s.un + s.name}
              style={{
                background: "rgba(22, 199, 255, 0.06)",
                border: "1px solid rgba(22, 199, 255, 0.18)",
                borderRadius: 10,
                padding: "12px 14px",
              }}
            >
              <div style={{ color: "#16C7FF", fontFamily: "var(--mono)", fontWeight: 700, fontSize: 13 }}>{s.un}</div>
              <div style={{ color: "#CBD5E1", fontSize: 13, marginTop: 2 }}>{s.name}</div>
            </div>
          ))}
        </div>
      </section>
    </HazmatSubPageShell>
  );
}
