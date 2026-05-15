import StubPage from "@/components/StubPage";

export default function Page() {
  return (
    <StubPage
      title="Drug & Alcohol"
      crumbs="D&A BRAIN · 49 CFR PART 382"
      cfr="Part 382"
      icon="🧪"
      desc="Pre-employment, random, post-accident, return-to-duty, and follow-up testing. Random rate tracked vs § 382.305. Clearinghouse-owed queue surfaced live."
      features={[
        { name: "Random pool & rate tracker", detail: "Live percentage vs § 382.305. Quarterly selections logged. Refusals flagged." },
        { name: "Post-accident testing", detail: "§ 382.303 trigger checks on every recordable accident. Test timer in real time." },
        { name: "Clearinghouse queries", detail: "Pre-employment limited queries (§ 382.701(a)) + annual queries (§ 382.701(b))." },
        { name: "Return-to-duty workflow", detail: "Driver in violation? Track SAP evaluation, follow-up test schedule, RTD test." },
      ]}
    />
  );
}
