/* ============================================================
   X3 COMPASS · HAZMAT · EXEMPTION & PERMIT CHECKER (native)
   ------------------------------------------------------------ */

import HazmatSubPageShell from "../HazmatSubPageShell";

export default function ExemptionsPage() {
  return (
    <HazmatSubPageShell
      activeId="hazmat-exemptions"
      pageTitle="EXEMPTION CHECKER"
      eduSurface="Exemption Checker"
      eduSubtitle="49 CFR §§ 173.150–156 + Part 107 · the rules that let you ship without full placards"
      conciergeHref="/ask?context=hazmat-exemptions"
      eduAudiences={[
        {
          label: "For Drivers",
          subtitle: "HAZMAT-ENDORSED CDL HOLDERS",
          body:
            "Limited Quantity packages still need the LTD QTY mark and a shipping paper, but no placards. Materials of Trade need to be in non-bulk packaging, total ≤200 kg, and a written notice in the cab.",
          bullets: [
            "Recognize the Limited Quantity mark (white diamond, black triangles top/bottom)",
            "ORM-D is gone for highway as of 2021 — anything still marked ORM-D needs requalifying",
            "Materials of Trade — total ≤200 kg gross, individual package limits, no Class 7 / 1 / 5.2",
            "Special Permit (DOT-SP) carry-on-board requirement — copy in the cab (§107.601)",
          ],
          cta: "Open driver exception guide →",
          href: "/hazmat/training",
          tone: "cyan",
          icon: "📜",
        },
        {
          label: "For Employers",
          subtitle: "SHIPPERS · CARRIERS · OFFERORS",
          body:
            "The exceptions save money and friction — when they apply. Misclaiming Limited Quantity is the single most-cited PHMSA finding in retail/wholesale shipments. The checker forces the right answer.",
          bullets: [
            "Limited Quantity inner-packaging limits per §173.150–155 by division",
            "Outer-package gross weight cap (30 kg / 66 lb) for combination packaging",
            "Materials of Trade: who qualifies (§173.6(a)) and the 200 kg aggregate limit",
            "Special Permit applications and renewals (PHMSA F 5800.2)",
          ],
          cta: "Open employer playbook →",
          href: "/hazmat/audit",
          tone: "amber",
        },
        {
          label: "For Compliance Officers",
          subtitle: "SAFETY DIRECTORS · DESIGNATED EMPLOYER REPS",
          body:
            "Exemption misuse is the easiest PHMSA finding to defend against — because the rules are bright lines. Sample 15 Limited Quantity shipments a quarter, run the checker, document the trail.",
          bullets: [
            "Quarterly: 15-shipment Limited Quantity audit",
            "Verify Limited Quantity mark on every outer package",
            "Inventory active Special Permits and renewal calendar",
            "Materials of Trade SOP for service techs and field crews",
          ],
          cta: "Open audit checklist →",
          href: "/hazmat/audit",
          tone: "violet",
        },
      ]}
    >
      <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 22 }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 22, color: "#F8FAFC" }}>Four-path checker</h2>
        <p style={{ color: "#94A3B8", margin: "0 0 18px", fontSize: 14 }}>
          Pick the exception you want to claim, the tool tells you whether your packaging configuration qualifies
          and what marks/papers you still owe.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          {[
            { name: "Limited Quantity", reg: "§§ 173.150–156" },
            { name: "Materials of Trade", reg: "§ 173.6" },
            { name: "Special Permit (DOT-SP)", reg: "Part 107" },
            { name: "Excepted Quantity", reg: "§ 173.4a" },
          ].map((s, i) => (
            <div key={i} style={{ background: "rgba(22, 199, 255, 0.06)", border: "1px solid rgba(22, 199, 255, 0.18)", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ color: "#F8FAFC", fontWeight: 700, fontSize: 15 }}>{s.name}</div>
              <div style={{ color: "#16C7FF", fontFamily: "var(--mono)", fontSize: 12, marginTop: 4 }}>{s.reg}</div>
            </div>
          ))}
        </div>
      </section>
    </HazmatSubPageShell>
  );
}
