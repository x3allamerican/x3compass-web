/* X3 COMPASS · HAZMAT · SHIPPING PAPERS BUILDER (native, no iframe) */
import HazmatSubPageShell from "../HazmatSubPageShell";

export default function ShippingPapersPage() {
  return (
    <HazmatSubPageShell
      activeId="hazmat-shipping-papers"
      pageTitle="SHIPPING PAPERS"
      eduSurface="Shipping Papers"
      eduSubtitle="49 CFR § 172.202 · the line-order rule every audit checks"
      conciergeHref="/app/ask?context=hazmat-shipping-papers"
      eduAudiences={[
        {
          label: "For Drivers",
          subtitle: "HAZMAT-ENDORSED CDL HOLDERS",
          body: "Shipping papers ride in the cab, on the driver's seat or within reach — Subpart C. The emergency response info is either on the paper or in the ERG within reach. No paper = no roll.",
          bullets: [
            "Papers within reach (§172.602(b)(2)) — driver's seat, door pocket, or holder",
            "ERG or §172.602 emergency response info in the cab",
            "24-hour emergency contact must be staffed (§172.604)",
            "Verify the BOL line order matches the cargo on the trailer",
          ],
          cta: "Open driver paper guide →",
          href: "/app/hazmat/training",
          tone: "cyan",
          icon: "📋",
        },
        {
          label: "For Employers",
          subtitle: "OFFERORS · CARRIERS",
          body: "The §172.202(a) sequence is bright-line: UN ID · proper shipping name · hazard class · packing group · total quantity by weight or volume. Get the order wrong, the entire shipment is non-conforming.",
          bullets: [
            "§172.202(a) sequence — UN # · PSN · class · PG · total qty",
            "Subsidiary hazard class in parentheses where required",
            "Shipper's certification language (§172.204)",
            "Emergency response phone number (§172.604) and contract on file with the provider",
          ],
          cta: "Open employer playbook →",
          href: "/app/hazmat/audit",
          tone: "amber",
        },
        {
          label: "For Compliance Officers",
          subtitle: "SAFETY DIRECTORS · DESIGNATED EMPLOYER REPS",
          body: "Shipping paper findings are the second most common PHMSA citation. Sample 20 papers a quarter, verify the §172.202(a) order plus the §172.604 emergency contact, and you've defended the surface.",
          bullets: [
            "Quarterly: 20-shipping-paper §172.202(a) sequence audit",
            "Verify the §172.604 emergency contact for every paper",
            "Confirm shipper certification per §172.204(a)",
            "Hazardous waste manifests (§172.205) — EPA F 8700-22 sequence",
          ],
          cta: "Open audit checklist →",
          href: "/app/hazmat/audit",
          tone: "violet",
        },
      ]}
    >
      <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 22 }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 22, color: "#F8FAFC" }}>§172.202(a) line builder</h2>
        <p style={{ color: "#94A3B8", margin: "0 0 18px", fontSize: 14 }}>
          Type a UN number, get the BOL line in the regulation's exact sequence.
        </p>
        <code style={{ display: "block", background: "#000", border: "1px solid rgba(22, 199, 255,0.25)", borderRadius: 8, padding: 14, color: "#16C7FF", fontFamily: "var(--mono)", fontSize: 13 }}>
          UN1203, Gasoline, 3, II, 200 L · ERG 128 · 1-800-424-9300
        </code>
        <p style={{ color: "#64748B", margin: "12px 0 0", fontSize: 12 }}>
          Live builder connects to the §172.101 HMT — wiring up as part of Hazmat Phase 3.
        </p>
      </section>
    </HazmatSubPageShell>
  );
}
