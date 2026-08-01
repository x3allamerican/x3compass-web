/* X3 COMPASS · HAZMAT · AUDIT CHECKLIST (native, no iframe) */
import HazmatSubPageShell from "../HazmatSubPageShell";

export default function AuditPage() {
  return (
    <HazmatSubPageShell
      activeId="hazmat-audit"
      pageTitle="AUDIT CHECKLIST"
      eyebrow="X3 Compass · Hazmat Center · Audit Checklist"
      heading={<>The four audit areas FMCSA actually scores.</>}
      sub="Classification accuracy · Shipping paper sequence · Placard correctness · Training currency. Walk every CR with the same playbook the inspector uses."
      regs="49 CFR §§ 172.101 · 172.202 · 172.504 · 172.704"
      eduSurface="Audit Checklist"
      eduSubtitle="49 CFR Part 172 · the four areas that drive every Compliance Review finding"
      conciergeHref="/app/ask?context=hazmat-audit"
      eduAudiences={[
        {
          label: "For Drivers",
          subtitle: "HAZMAT-ENDORSED CDL HOLDERS",
          body: "On the audit day the inspector will pull your last 6 months of shipping papers, your training certificate, and your pre-trip records. If any one piece is missing, that's a finding against your employer — and against you next time you renew the H endorsement.",
          bullets: [
            "Keep your hazmat training cert current — 3-year cycle, no grace period",
            "Pre-trip documentation for every hazmat shipment — placards, papers, security",
            "Driver-side incident reporting within the §171.16 window",
            "TSA STA on file, not expired (§1572)",
          ],
          cta: "Open driver audit guide →",
          href: "/app/hazmat/training",
          tone: "cyan",
          icon: "✅",
        },
        {
          label: "For Employers",
          subtitle: "CARRIERS · OFFERORS",
          body: "PHMSA reviews the last 3 years of records on demand. Build the audit trail in the system as work happens — not the night before the CR — and you'll never see a §172.201(e) record-retention finding.",
          bullets: [
            "3-year retention for shipping papers (§172.201(e))",
            "3-year retention for training records (§172.704(d))",
            "Incident reports DOT-F-5800.1 (§171.16) filed within 30 days",
            "Hazmat registration current (§107.601–620)",
          ],
          cta: "Open employer playbook →",
          href: "/app/hazmat/training",
          tone: "amber",
        },
        {
          label: "For Compliance Officers",
          subtitle: "SAFETY DIRECTORS · DESIGNATED EMPLOYER REPS",
          body: "Run the four-area checklist quarterly. Document the sample size, the findings, and the remediation. That trail is what turns a Conditional rating into Satisfactory — every time.",
          bullets: [
            "Classification audit (20 BOL sample) — §172.101 cross-check",
            "Shipping paper sequence audit — §172.202(a) order",
            "Placard correctness audit — §172.504 table 1 vs 2 vs DANGEROUS",
            "Training currency audit — §172.704 recurrent every 3 years per employee",
          ],
          cta: "Open audit playbook →",
          href: "/app/hazmat/training",
          tone: "violet",
        },
      ]}
    >
      <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 22 }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 22, color: "#F8FAFC" }}>The four areas, every quarter</h2>
        <p style={{ color: "#94A3B8", margin: "0 0 18px", fontSize: 14 }}>
          Sample size, scoring rubric, and remediation steps for each area.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
          {[
            { area: "Classification", sample: "20 BOLs / quarter", reg: "§ 172.101" },
            { area: "Shipping papers", sample: "20 BOLs / quarter", reg: "§ 172.202" },
            { area: "Placards", sample: "20 equipment checks / quarter", reg: "§ 172.504" },
            { area: "Training", sample: "100% of hazmat employees / 3 years", reg: "§ 172.704" },
          ].map((s, i) => (
            <div key={i} style={{ background: "rgba(22, 199, 255, 0.06)", border: "1px solid rgba(22, 199, 255, 0.18)", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ color: "#F8FAFC", fontWeight: 700, fontSize: 15 }}>{s.area}</div>
              <div style={{ color: "#CBD5E1", fontSize: 13, marginTop: 4 }}>{s.sample}</div>
              <div style={{ color: "#16C7FF", fontFamily: "var(--mono)", fontSize: 12, marginTop: 4 }}>{s.reg}</div>
            </div>
          ))}
        </div>
      </section>
    </HazmatSubPageShell>
  );
}
