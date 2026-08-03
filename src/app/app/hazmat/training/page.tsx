/* X3 COMPASS · HAZMAT · TRAINING TRACKER (native, no iframe) */
import HazmatSubPageShell from "../HazmatSubPageShell";

export default function TrainingPage() {
  return (
    <HazmatSubPageShell
      activeId="hazmat-training"
      pageTitle="TRAINING TRACKER"
      eduSurface="Training Tracker"
      eduSubtitle="49 CFR § 172.704 · what every hazmat employee must complete and document"
      conciergeHref="/app/ask?context=hazmat-training"
      eduAudiences={[
        {
          label: "For Drivers",
          subtitle: "HAZMAT-ENDORSED CDL HOLDERS",
          body: "Your training cycle is a 3-year clock. Miss the cycle and the H endorsement is at risk — and you can't legally drive a placarded load.",
          bullets: [
            "General awareness module — familiarization with the HMR",
            "Function-specific module — what you actually do (driving)",
            "Safety module — emergency response basics",
            "Security awareness module — recognize and report threats",
            "In-depth security (if you carry Table 1 substances)",
          ],
          cta: "Start your training →",
          href: "/app/training",
          tone: "cyan",
          icon: "🎓",
        },
        {
          label: "For Employers",
          subtitle: "CARRIERS · OFFERORS",
          body: "You retain training records for 3 years from the latest training event per employee (§172.704(d)). The record has to name the employee, the modules, the date, the trainer, and a copy of the test.",
          bullets: [
            "3-year retention from the latest training event",
            "Records include: name, modules, date, trainer, test copy",
            "Re-train every 3 years OR when an employee changes function",
            "Initial training within 90 days of hire — supervise placarded work until trained",
          ],
          cta: "Open employer playbook →",
          href: "/app/hazmat/audit",
          tone: "amber",
        },
        {
          label: "For Compliance Officers",
          subtitle: "SAFETY DIRECTORS · DESIGNATED EMPLOYER REPS",
          body: "Training currency is one of the four scored audit areas. 100% sample — every hazmat employee on the roster — every 3 years. The tracker exists so nobody slips through.",
          bullets: [
            "100% roster currency audit — every hazmat employee",
            "Re-training trigger on function change (§172.704(c)(2))",
            "Test scores documented and kept with the record",
            "Trainer qualifications on file (§172.704(a))",
          ],
          cta: "Open audit checklist →",
          href: "/app/hazmat/audit",
          tone: "violet",
        },
      ]}
    >
      <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 22 }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 22, color: "#F8FAFC" }}>Roster currency</h2>
        <p style={{ color: "#94A3B8", margin: "0 0 18px", fontSize: 14 }}>
          Live training-roster view connects to your driver list. Lights up red on anyone within 90 days of expiration.
        </p>
        <p style={{ color: "#64748B", margin: 0, fontSize: 12 }}>
          Wiring this into compass_drivers + compass_training as part of Hazmat Phase 3.
        </p>
      </section>
    </HazmatSubPageShell>
  );
}
