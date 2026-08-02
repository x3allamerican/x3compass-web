/* X3 COMPASS · HAZMAT · EMERGENCY RESPONSE INFO (native, no iframe) */
import HazmatSubPageShell from "../HazmatSubPageShell";

export default function EmergencyResponsePage() {
  return (
    <HazmatSubPageShell
      activeId="hazmat-emergency-response"
      pageTitle="EMERGENCY RESPONSE"
      eduSurface="Emergency Response"
      eduSubtitle="49 CFR Subpart G · what has to be in the cab and what has to answer the phone"
      conciergeHref="/app/ask?context=hazmat-emergency"
      eduAudiences={[
        {
          label: "For Drivers",
          subtitle: "HAZMAT-ENDORSED CDL HOLDERS",
          body: "ERG within reach. The §172.604 phone number is on the paper. If something spills, the first call goes to the offeror's number — they relay to CHEMTREC.",
          bullets: [
            "ERG 2024 in the cab, current edition",
            "Read the ERG guide number off the shipping paper, not the placard",
            "First 30 minutes: isolate, deny entry, notify (§171.15 immediate notice)",
            "DOT-F-5800.1 incident report within 30 days for any release",
          ],
          cta: "Open driver response guide →",
          href: "/app/hazmat/training",
          tone: "cyan",
          icon: "🚨",
        },
        {
          label: "For Employers",
          subtitle: "OFFERORS · CARRIERS",
          body: "The emergency contact has to actually answer — and the person on the line has to have the response info. PHMSA tests this with cold calls. If the line rings out or the agent can't read the response sheet, that's a finding.",
          bullets: [
            "24/7 phone coverage for the §172.604 number",
            "Response info accessible to whoever picks up — not buried in a binder",
            "CHEMTREC (1-800-424-9300) contract if you don't run your own desk",
            "Immediate notice to NRC (§171.15) for any qualifying release",
          ],
          cta: "Open employer playbook →",
          href: "/app/hazmat/audit",
          tone: "amber",
        },
        {
          label: "For Compliance Officers",
          subtitle: "SAFETY DIRECTORS · DESIGNATED EMPLOYER REPS",
          body: "Test the §172.604 line monthly. Document the call, the responder, and the response info pulled. That's the audit trail.",
          bullets: [
            "Monthly: cold-call the §172.604 number, verify response info access",
            "Inventory ERGs in every cab — current edition",
            "Incident reporting SOP — §171.15 immediate + §171.16 DOT-F-5800.1",
            "CHEMTREC contract on file with current account number",
          ],
          cta: "Open audit checklist →",
          href: "/app/hazmat/audit",
          tone: "violet",
        },
      ]}
    >
      <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 22 }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 22, color: "#F8FAFC" }}>The cab kit</h2>
        <p style={{ color: "#94A3B8", margin: "0 0 18px", fontSize: 14 }}>
          Three things have to be in reach of the driver's seat:
        </p>
        <ul style={{ color: "#CBD5E1", fontSize: 14, lineHeight: 1.7, paddingLeft: 20, margin: 0 }}>
          <li>Current ERG (2024 edition)</li>
          <li>Shipping paper with the §172.604 emergency response phone number</li>
          <li>Response information per §172.602 — guide number, isolation distances, first-aid</li>
        </ul>
      </section>
    </HazmatSubPageShell>
  );
}
