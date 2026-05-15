import StubPage from "@/components/StubPage";

export default function Page() {
  return (
    <StubPage
      title="Audit Export"
      crumbs="ADVANCED · ONE-CLICK DOT BUNDLE"
      cfr="FMCSR audit-ready"
      icon="📄"
      desc="Walk into your DOT compliance review with a single PDF bundle: every driver's full DQ file, every accident report, every inspection, every D&A test, every training cert."
      features={[
        { name: "Per-driver packet", detail: "All 12 § 391.51 documents, plus med-cert history, MVR history, training certs." },
        { name: "Fleet packet", detail: "Accidents, inspections, vehicle PM records, D&A pool history — 3-year retention complete." },
        { name: "Filtered exports", detail: "Just the drivers the auditor asked for. Just the inspections in the audit window." },
        { name: "Watermarked + indexed", detail: "Every page numbered, indexed by section, with a cover sheet listing what's inside." },
      ]}
    />
  );
}
