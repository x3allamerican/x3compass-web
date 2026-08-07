/* X3 COMPASS · HAZMAT · SECURITY PLAN BUILDER (native, no iframe) */
import HazmatSubPageShell from "../HazmatSubPageShell";

export default function SecurityPlanPage() {
  return (
    <HazmatSubPageShell
      activeId="hazmat-security-plan"
      pageTitle="SECURITY PLAN"
      eduSurface="Security Plan"
      eduSubtitle="49 CFR § 172.800 · who needs a plan, what it contains, who signs it"
      conciergeHref="/ask?context=hazmat-security"
      eduAudiences={[
        {
          label: "For Drivers",
          subtitle: "HAZMAT-ENDORSED CDL HOLDERS",
          body: "If you carry a Table 1 substance, your in-depth security training (§172.704(a)(5)) is in addition to general security awareness. You should know your security plan's en-route protocols cold.",
          bullets: [
            "In-depth security training every 3 years (§172.704(a)(5))",
            "En-route protocols — communication checks, route deviations, stop policy",
            "Recognize and report suspicious behavior",
            "TSA STA cross-check (§1572) and reciprocity with TWIC",
          ],
          cta: "Open driver security guide →",
          href: "/hazmat/training",
          tone: "cyan",
          icon: "🛡️",
        },
        {
          label: "For Employers",
          subtitle: "TABLE 1 SHIPPERS · CARRIERS",
          body: "Three required components per §172.802(a): personnel security, unauthorized access, en-route security. Plan in writing, reviewed annually, signed by an officer, available for PHMSA on request.",
          bullets: [
            "Personnel security: background checks, STA, ongoing screening",
            "Unauthorized access: facility, equipment, en-route safeguards",
            "En-route: communication, routing, escort, stops",
            "Annual review + officer signature + on-demand availability",
          ],
          cta: "Open employer playbook →",
          href: "/hazmat/audit",
          tone: "amber",
        },
        {
          label: "For Compliance Officers",
          subtitle: "SAFETY DIRECTORS · DESIGNATED EMPLOYER REPS",
          body: "If you ship Table 1, the security plan is non-negotiable. Annual review must be documented. In-depth security training must be tracked separately from general security awareness.",
          bullets: [
            "Annual review with officer sign-off — calendar reminder",
            "In-depth security training roster (§172.704(a)(5))",
            "Table 1 inventory list (§172.800 applicability)",
            "Coordination with TSA, CISA, and FMCSA on advisories",
          ],
          cta: "Open audit checklist →",
          href: "/hazmat/audit",
          tone: "violet",
        },
      ]}
    >
      <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 22 }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 22, color: "#F8FAFC" }}>Plan template</h2>
        <p style={{ color: "#94A3B8", margin: "0 0 18px", fontSize: 14 }}>
          Three required components per §172.802(a):
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
          {[
            { name: "Personnel security", desc: "Background checks · STA · ongoing screening" },
            { name: "Unauthorized access", desc: "Facility · equipment · en-route safeguards" },
            { name: "En-route security", desc: "Comms · routing · escort · stops" },
          ].map((s, i) => (
            <div key={i} style={{ background: "rgba(22, 199, 255, 0.06)", border: "1px solid rgba(22, 199, 255, 0.18)", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ color: "#F8FAFC", fontWeight: 700, fontSize: 15 }}>{s.name}</div>
              <div style={{ color: "#CBD5E1", fontSize: 13, marginTop: 4 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>
    </HazmatSubPageShell>
  );
}
