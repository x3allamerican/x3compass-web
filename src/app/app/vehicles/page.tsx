import StubPage from "@/components/StubPage";

export default function Page() {
  return (
    <StubPage
      title="Vehicles & PM"
      crumbs="VEHICLES BRAIN · 49 CFR § 396.3 / § 396.17"
      cfr="49 CFR § 396"
      icon="🚛"
      desc="Power-unit inventory, annual DOT inspections, preventive-maintenance schedule. Every truck and trailer in your fleet, every PM cycle, every annual due date."
      features={[
        { name: "Power-unit roster", detail: "VIN, plate, GVWR, OOS flags. Search by unit number, year, make, status." },
        { name: "Annual DOT inspection tracker", detail: "§ 396.17 12-month cycle. Due-date alerts at 30/14/7 days." },
        { name: "PM schedule generator", detail: "Build a § 396.3 PM template from your unit list. Mileage- or time-triggered." },
        { name: "DVIR log", detail: "§ 396.11 daily vehicle inspection reports. Defects tracked to resolution." },
      ]}
    />
  );
}
