import StubPage from "@/components/StubPage";

export default function Page() {
  return (
    <StubPage
      title="Training"
      crumbs="TRAINING BRAIN · 49 CFR PART 380"
      cfr="Part 380"
      icon="🎓"
      desc="ELDT theory + behind-the-wheel, supervisor D&A awareness, defensive driving, pre-trip, cargo securement, hazmat. Expiry tracking on every course."
      features={[
        { name: "ELDT compliance", detail: "Part 380.609 theory + BTW with TPR registry flag. Grandfather logic for pre-2022 CDL holders." },
        { name: "Recurring training schedule", detail: "Defensive driving, supervisor D&A, hazmat refresher — auto-due-date math." },
        { name: "TPR-verified providers", detail: "Direct integration with the FMCSA Training Provider Registry. No manual checks." },
        { name: "Cert library per driver", detail: "Every completion certificate stored, indexed, audit-ready by export." },
      ]}
    />
  );
}
