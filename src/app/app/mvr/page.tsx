import StubPage from "@/components/StubPage";

export default function Page() {
  return (
    <StubPage
      title="MVR Tracker"
      crumbs="MVR BRAIN · 49 CFR § 391.25"
      cfr="§ 391.25"
      icon="🪪"
      desc="Annual MVR review log per driver, per state. Overdue drivers surface automatically. State-by-state license status, points, and violations in one place."
      features={[
        { name: "Annual review log", detail: "§ 391.25 annual review per driver. Auto-due-date 12 months after last review." },
        { name: "State-by-state status", detail: "Run an MVR pull in any state with one click. Cost rolled into your bill." },
        { name: "Continuous monitoring upgrade", detail: "Optional — alert the moment a state DMV updates the record. No more annual blind spots." },
        { name: "Adverse action flow", detail: "FCRA-compliant pre-adverse + adverse-action letters generated automatically." },
      ]}
    />
  );
}
