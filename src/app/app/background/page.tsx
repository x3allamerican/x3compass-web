import StubPage from "@/components/StubPage";

export default function Page() {
  return (
    <StubPage
      title="Background Tracker"
      crumbs="COMPLIANCE TRACKERS · BACKGROUND CHECKS"
      cfr="FCRA · § 391.21"
      icon="🛡"
      desc="Pre-employment background checks via Checkr. Criminal, MVR, prior-employer verification, drug screen — all in one workflow with FCRA-compliant timing."
      features={[
        { name: "Driver basic plus", detail: "Standard fleet package: county + national criminal, MVR, SSN trace, sex-offender." },
        { name: "PSP report integration", detail: "FMCSA Pre-Employment Screening Program report ordered + analyzed for hire decisions." },
        { name: "Adverse action engine", detail: "Pre-adverse letter, 5-day clock, final adverse letter — all generated on the driver's timeline." },
        { name: "Cost passthrough", detail: "Per-package pricing rolled into your monthly invoice. No separate Checkr account needed." },
      ]}
    />
  );
}
