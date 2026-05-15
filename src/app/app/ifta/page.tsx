import StubPage from "@/components/StubPage";

export default function Page() {
  return (
    <StubPage
      title="IFTA Concierge"
      crumbs="COMPLIANCE TRACKERS · FUEL TAX"
      cfr="IFTA · § 367 UCR"
      icon="⛽"
      desc="Cost-per-mile modeling, IFTA quarterly filing, UCR registration windows, fuel-tax reconciliation. The boring numbers, done right, on time, every quarter."
      features={[
        { name: "Mileage by jurisdiction", detail: "Auto-segments your trip log by state crossings. ELD or manual entry both work." },
        { name: "Quarterly filing prep", detail: "Pre-fills your IFTA return for every jurisdiction. You review and submit." },
        { name: "UCR registration", detail: "Auto-renewal in October for the next calendar year. Fee rolled into your invoice." },
        { name: "Cost-per-mile dashboard", detail: "Fuel, maintenance, driver pay, insurance — true CPM per truck per quarter." },
      ]}
    />
  );
}
