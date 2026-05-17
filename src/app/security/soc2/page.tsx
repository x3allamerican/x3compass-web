import Link from "next/link";
import SiteShell from "@/components/SiteShell";
import Related from "@/components/Related";

export const metadata = {
  title: "SOC 2 Type II status — X3 Compass",
  description:
    "Where we are in SOC 2 Type II preparation, what's already in place, the monthly milestones to attestation, and how to get the latest controls coverage for your security review.",
};

const MILESTONES: { quarter: string; date: string; item: string; status: "done" | "doing" | "todo" }[] = [
  { quarter: "Q2 2026", date: "May 2026",  item: "Trust Services Criteria gap analysis (Security TSC, 32 CC controls)",                              status: "done" },
  { quarter: "Q2 2026", date: "May 2026",  item: "Controls matrix published internally (compliance/soc2/CONTROLS.md)",                              status: "done" },
  { quarter: "Q2 2026", date: "May 2026",  item: "Risk register published internally (compliance/soc2/RISK_REGISTER.md)",                           status: "done" },
  { quarter: "Q2 2026", date: "May 2026",  item: "Access Control / Vendor Management / Incident Response policies signed",                          status: "done" },
  { quarter: "Q2 2026", date: "Jun 2026",  item: "Auditor selection (Big-Four-adjacent vs. boutique CPA firm) — shortlist + intro calls",            status: "doing" },
  { quarter: "Q3 2026", date: "Jul 2026",  item: "Engagement letter signed; readiness assessment begins (Type I review of design effectiveness)",    status: "todo" },
  { quarter: "Q3 2026", date: "Jul 2026",  item: "Quarterly access review #1 completed and filed; vendor sub-processor list snapshot",              status: "todo" },
  { quarter: "Q3 2026", date: "Aug 2026",  item: "First incident-response tabletop drill (scenario: leaked Supabase service-role key)",              status: "todo" },
  { quarter: "Q3 2026", date: "Sep 2026",  item: "Type I letter received; observation period begins (minimum 3 months for Type II)",                status: "todo" },
  { quarter: "Q4 2026", date: "Oct 2026",  item: "Monthly Fort Knox + access-review evidence collection rolling forward",                            status: "todo" },
  { quarter: "Q4 2026", date: "Nov 2026",  item: "Second incident-response drill (scenario: vendor outage with data-exposure ambiguity)",            status: "todo" },
  { quarter: "Q4 2026", date: "Dec 2026",  item: "SOC 2 Type II report issued (Security TSC, 3-month observation window)",                          status: "todo" },
];

const IN_PLACE: { area: string; what: string }[] = [
  { area: "Access control",   what: "MFA required on every admin account; 1Password for credentials; no shared logins; quarterly access review policy in force." },
  { area: "Tenant isolation", what: "Row-Level Security on every compass_* table. The same policy ships on every new table at creation time." },
  { area: "Encryption",       what: "AES-256 at rest (Supabase + R2). TLS 1.3 + HSTS in flight. We never store payment card data — Stripe handles all of it." },
  { area: "Vendor management",what: "Sub-processor list published. DPAs on file with every Critical and Important vendor. Status pages polled by Fort Knox." },
  { area: "Incident response",what: "Severity tiers P1 to P4. Doctor agent drives the first 15 minutes of every alert. 72-hour customer notification SLA under our DPA." },
  { area: "Monitoring",       what: "Fort Knox v4 — uptime probes, journey probes, deploy watcher, vendor pollers, client-error aggregator, eCFR citation verifier." },
  { area: "Change management",what: "Every production change ships through GitHub + Cloudflare Pages with automatic preview deploy + journey-probe gate." },
  { area: "Source-code audit",what: "All infrastructure-as-code and Pages Functions are reviewable in github.com/x3fleetsafety. No secrets in source — pre-commit gitleaks planned Q3." },
];

const GAPS: { gap: string; close_by: string }[] = [
  { gap: "Formal evidence-collection schedule (which evidence, when, by whom)",        close_by: "Jul 2026 — part of readiness assessment" },
  { gap: "Annual penetration test by an outside firm",                                  close_by: "Q3 2026 — booked after auditor selection" },
  { gap: "Bus-factor mitigation (single founder is the highest-rated risk in the register)", close_by: "Ongoing — staged via documented runbooks + Fort Knox automation; first hire decision Q3 2026" },
  { gap: "Vulnerability disclosure program with a bug bounty payout",                   close_by: "Q4 2026 — security@x3compass.com is live and triaged today" },
  { gap: "Customer-facing audit-log retention beyond Cloudflare's default windows",     close_by: "Q3 2026 — Supabase audit table + R2 archive" },
];

export default function SOC2StatusPage() {
  return (
    <SiteShell>
      <div className="bg-[var(--bg)] text-[var(--fg)]">

        {/* HERO */}
        <section className="border-b border-[var(--border)]">
          <div className="max-w-5xl mx-auto px-6 py-20">
            <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[var(--accent)] mb-3">
              Compliance → SOC 2 Type II
            </div>
            <h1 className="text-[44px] sm:text-[56px] md:text-[64px] font-extrabold tracking-tight leading-[1.05] mb-4">
              SOC 2 Type II.{" "}
              <span className="serif-italic" style={{ color: "#22D3EE" }}>Honest progress.</span>
            </h1>
            <p className="text-[18px] text-[var(--fg-muted)] max-w-3xl">
              We are in active preparation for a SOC 2 Type II attestation against the Security Trust Services Criteria.
              The plan is below — done, doing, and to-do, dated by month. Target attestation: <strong className="text-[var(--fg)]">Q4 2026</strong>.
            </p>
            <p className="text-[14px] text-[var(--fg-muted)] mt-4 max-w-3xl">
              For the underlying security architecture, see <Link href="/security" className="text-[var(--accent)] font-bold hover:underline">/security</Link>.
              For the customer-trust summary, see <Link href="/trust" className="text-[var(--accent)] font-bold hover:underline">/trust</Link>.
            </p>
          </div>
        </section>

        {/* STATUS STRIP */}
        <section className="max-w-5xl mx-auto px-6 py-12">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="x3-card p-5">
              <div className="text-[10px] tracking-[.18em] uppercase font-bold text-[var(--fg-muted)] mb-2">Scope (Phase 1)</div>
              <div className="text-[15px] font-semibold text-[var(--fg)]">Security TSC only</div>
            </div>
            <div className="x3-card p-5">
              <div className="text-[10px] tracking-[.18em] uppercase font-bold text-[var(--fg-muted)] mb-2">Controls in matrix</div>
              <div className="text-[15px] font-semibold text-[var(--fg)]">32 (CC1 to CC9)</div>
            </div>
            <div className="x3-card p-5">
              <div className="text-[10px] tracking-[.18em] uppercase font-bold text-[var(--fg-muted)] mb-2">In place today</div>
              <div className="text-[15px] font-semibold text-[var(--success)]">26 of 32 · 81%</div>
            </div>
            <div className="x3-card p-5">
              <div className="text-[10px] tracking-[.18em] uppercase font-bold text-[var(--fg-muted)] mb-2">Target attestation</div>
              <div className="text-[15px] font-semibold text-[var(--fg)]">Q4 2026</div>
            </div>
          </div>
          <p className="text-[12px] text-[var(--fg-muted)] mt-4">
            Phase 2 (Availability + Confidentiality TSC) follows attestation. ISO 27001 is on the roadmap post-SOC 2 if customer demand is there.
          </p>
        </section>

        {/* WHAT'S IN PLACE */}
        <section className="max-w-5xl mx-auto px-6 pb-12">
          <h2 className="text-[24px] sm:text-[28px] font-extrabold tracking-tight mb-6">What&apos;s already in place</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {IN_PLACE.map((row) => (
              <div key={row.area} className="x3-card p-5">
                <div className="text-[10px] tracking-[.18em] uppercase font-bold text-[var(--accent)] mb-2">{row.area}</div>
                <div className="text-[14px] text-[var(--fg-muted)] leading-relaxed">{row.what}</div>
              </div>
            ))}
          </div>
        </section>

        {/* MONTHLY MILESTONES */}
        <section className="max-w-5xl mx-auto px-6 pb-12">
          <h2 className="text-[24px] sm:text-[28px] font-extrabold tracking-tight mb-2">Monthly milestones to attestation</h2>
          <p className="text-[13px] text-[var(--fg-muted)] mb-6">
            We update this table on the first business day of every month. If a milestone slips, the new date is published here with the reason — we will not retroactively edit past dates.
          </p>
          <div className="x3-card overflow-x-auto">
            <table className="w-full text-[14px]">
              <thead className="bg-[var(--surface-2)]">
                <tr className="text-left text-[10px] tracking-[.16em] uppercase text-[var(--fg-muted)]">
                  <th className="px-4 py-3 font-bold">Quarter</th>
                  <th className="px-4 py-3 font-bold">When</th>
                  <th className="px-4 py-3 font-bold">Milestone</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="text-[var(--fg-muted)]">
                {MILESTONES.map((m, i) => (
                  <tr key={i} className="border-t border-[var(--border)] align-top">
                    <td className="px-4 py-3 whitespace-nowrap text-[var(--fg)] font-semibold">{m.quarter}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{m.date}</td>
                    <td className="px-4 py-3 text-[var(--fg)]">{m.item}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {m.status === "done"  && <span className="text-[var(--success)] font-bold">✓ Done</span>}
                      {m.status === "doing" && <span className="text-[var(--accent)] font-bold">→ In progress</span>}
                      {m.status === "todo"  && <span className="text-[var(--fg-muted)]">Scheduled</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* GAPS */}
        <section className="max-w-5xl mx-auto px-6 pb-12">
          <h2 className="text-[24px] sm:text-[28px] font-extrabold tracking-tight mb-2">Open gaps before the observation period</h2>
          <p className="text-[13px] text-[var(--fg-muted)] mb-6">
            Honest list. Each gap has a planned close date. If we miss one, we update this table the month it slips.
          </p>
          <div className="x3-card overflow-x-auto">
            <table className="w-full text-[14px]">
              <thead className="bg-[var(--surface-2)]">
                <tr className="text-left text-[10px] tracking-[.16em] uppercase text-[var(--fg-muted)]">
                  <th className="px-4 py-3 font-bold">Gap</th>
                  <th className="px-4 py-3 font-bold">Closing by</th>
                </tr>
              </thead>
              <tbody className="text-[var(--fg-muted)]">
                {GAPS.map((g, i) => (
                  <tr key={i} className="border-t border-[var(--border)] align-top">
                    <td className="px-4 py-3 text-[var(--fg)]">{g.gap}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{g.close_by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* HOW TO REQUEST DOCS */}
        <section className="border-t border-[var(--border)] bg-[var(--bg-3)] py-16">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-[28px] sm:text-[36px] font-extrabold tracking-tight mb-4">Need the controls coverage today?</h2>
            <p className="text-[15px] text-[var(--fg-muted)] mb-2">
              If your security review needs the controls matrix, sub-processor list, DPA, or a written response to a SIG / CAIQ questionnaire before our Type II report is issued, email{" "}
              <a href="mailto:security@x3compass.com" className="text-[var(--accent)] font-bold hover:underline">security@x3compass.com</a>.
            </p>
            <p className="text-[15px] text-[var(--fg-muted)]">
              Initial reply within 24 hours. We answer enterprise security questionnaires directly — no portal, no gatekeeping.
            </p>
          </div>
        </section>

        <Related
          title="Related"
          links={[
            { href: "/security",           title: "Security architecture",      desc: "Cloud architecture, RLS, encryption, incident response — the deeper read." },
            { href: "/trust",              title: "Trust summary",              desc: "Customer-trust overview: who we are, what we promise, what we don't." },
            { href: "/changelog",          title: "Changelog",                  desc: "Public log of shipped changes and any customer-visible incidents." },
          ]}
        />
      </div>
    </SiteShell>
  );
}
