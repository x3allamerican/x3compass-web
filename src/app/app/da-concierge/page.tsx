import StubPage from "@/components/StubPage";

export default function Page() {
  return (
    <StubPage
      title="D&A Concierge"
      crumbs="COMPLIANCE TRACKERS · DRUG & ALCOHOL"
      cfr="Part 382"
      icon="🧬"
      desc="Premium concierge service. X3 staff manages your random pool, vendor scheduling, refusal investigations, and Clearinghouse queries on your behalf."
      features={[
        { name: "Random selections", detail: "We run the quarterly selection and notify each driver. You confirm test completion." },
        { name: "Refusal investigations", detail: "Driver refuses or no-shows? We investigate, document, and report per § 382.601." },
        { name: "Clearinghouse on autopilot", detail: "All employer queries, designated-rep duties, and consent management handled." },
        { name: "Audit packet", detail: "When the DOT auditor asks for D&A records, we hand them an audit-ready bundle." },
      ]}
    />
  );
}
