import StubPage from "@/components/StubPage";

export default function Page() {
  return (
    <StubPage
      title="Settings"
      crumbs="ACCOUNT · WORKSPACE & TEAM"
      cfr="Account configuration"
      icon="⚙"
      desc="Carrier profile, team seats, notification rules, integrations, billing, plan changes. Workspace settings live here."
      features={[
        { name: "Carrier profile", detail: "DOT #, MC #, USDOT decal info, principal place of business, EIN, fleet size." },
        { name: "Team & roles", detail: "Invite team members. Owner / admin / dispatcher / safety / billing roles." },
        { name: "Notifications", detail: "Per-rule control — email, SMS, in-app. Daily digest recipient list. Quiet hours." },
        { name: "API & integrations", detail: "API key, webhook destinations, CSV template downloads, ELD provider connections." },
      ]}
    />
  );
}
