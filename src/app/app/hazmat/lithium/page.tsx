/* ============================================================
   X3 COMPASS · HAZMAT · LITHIUM BATTERY DECISION TREE (native)
   ------------------------------------------------------------
   Native Next.js page (replaces iframe stub). HazmatAppShell +
   Section II/IB decision tree + EducationHubCard.
   ============================================================ */

import HazmatSubPageShell from "../HazmatSubPageShell";

export default function LithiumPage() {
  return (
    <HazmatSubPageShell
      activeId="hazmat-lithium"
      pageTitle="LITHIUM DECISION TREE"
      eyebrow="X3 Compass · Hazmat Center · Lithium Decision Tree"
      heading={<>Lithium · classified right or it's a fire on board.</>}
      sub="UN 3480 / 3481 / 3090 / 3091 — five answers and you know whether your shipment is full-reg Class 9, Section IB excepted, or Section II excepted. Built off §173.185 with every reg change since 2022."
      regs="49 CFR § 173.185 · IATA PI 965–970 · IMDG SP 188 · ICAO TI"
      eduSurface="Lithium Decision Tree"
      eduSubtitle="49 CFR § 173.185 · ion vs metal, watt-hours, packed vs in-equipment, Section II vs IB"
      conciergeHref="/app/ask?context=hazmat-lithium"
      eduAudiences={[
        {
          label: "For Drivers",
          subtitle: "HAZMAT-ENDORSED CDL HOLDERS",
          body:
            "Section II shipments still need the lithium battery mark on the outer package. If the mark isn't there, the offeror got it wrong — and you're stuck with a placardable load you didn't sign on for.",
          bullets: [
            "Recognize the lithium battery mark (square red border, battery icon, UN number)",
            "Section II markings vs full-reg Class 9 placards — what to expect on each",
            "Damaged / defective / recalled (DDR) batteries — when you can't accept the load (§173.185(f))",
            "Fire response basics: dry chemical, lots of water for cooling, lithium-specific blanket if equipped",
          ],
          cta: "Open driver lithium guide →",
          href: "/app/hazmat/training",
          tone: "cyan",
          icon: "🔋",
        },
        {
          label: "For Employers",
          subtitle: "SHIPPERS · CARRIERS · OFFERORS",
          body:
            "The Section II exception is generous — but exceeding 30 kg gross per package, mixing chemistries, or shipping damaged units flips the whole consignment back to full Class 9. The tree forces the right answer in five questions.",
          bullets: [
            "Watt-hour rating per cell (≤20 Wh / >20 Wh) and per battery (≤100 Wh / >100 Wh)",
            "Packed with vs contained in equipment vs standalone — different exception paths",
            "30 kg gross per package limit for Section II — the most-missed cap",
            "DDR shipping requirements (§173.185(f)) — special packaging + Class 9 always",
          ],
          cta: "Open employer playbook →",
          href: "/app/hazmat/audit",
          tone: "amber",
        },
        {
          label: "For Compliance Officers",
          subtitle: "SAFETY DIRECTORS · DESIGNATED EMPLOYER REPS",
          body:
            "Lithium misclassification is one of the top three PHMSA penalty drivers. Sample 10 outbound lithium shipments a quarter, run the decision tree, and document the answer key — that's the SOP that survives an audit.",
          bullets: [
            "Quarterly: 10-shipment lithium classification audit",
            "Cross-check Section II markings on outbound packages with photos",
            "Verify driver training on damaged battery recognition",
            "Confirm any DDR shipments routed through PHMSA Special Permit DOT-SP",
          ],
          cta: "Open audit checklist →",
          href: "/app/hazmat/audit",
          tone: "violet",
        },
      ]}
    >
      <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 22 }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 22, color: "#F8FAFC" }}>5-question decision tree</h2>
        <p style={{ color: "#94A3B8", margin: "0 0 18px", fontSize: 14 }}>
          The tree runs you through chemistry, watt-hours, configuration (standalone / packed with / contained in
          equipment), package gross weight, and damaged-status to drop out at the right §173.185 outcome.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
          {[
            { q: "Q1 · Ion or metal?", desc: "UN 3480/3481 (ion) vs UN 3090/3091 (metal)" },
            { q: "Q2 · Watt-hour rating?", desc: "≤20 Wh cell · ≤100 Wh battery → Section II eligible" },
            { q: "Q3 · Standalone, packed-with, or in-equipment?", desc: "Different mark + packaging paths" },
            { q: "Q4 · Gross weight per package?", desc: "Section II caps at 30 kg gross" },
            { q: "Q5 · Damaged / defective / recalled?", desc: "DDR → Class 9 + Special Permit always" },
          ].map((s, i) => (
            <div key={i} style={{ background: "rgba(22, 199, 255, 0.06)", border: "1px solid rgba(22, 199, 255, 0.18)", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ color: "#16C7FF", fontWeight: 700, fontSize: 13 }}>{s.q}</div>
              <div style={{ color: "#CBD5E1", fontSize: 13, marginTop: 4 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>
    </HazmatSubPageShell>
  );
}
