import Link from "next/link";
import SiteShell from "@/components/SiteShell";
import Related from "@/components/Related";

export const metadata = {
  title: "Sample audit walkthrough — X3 Compass",
  description: "A synthetic 47-truck carrier walks through a DOT compliance audit using Compass. Real CFR citations, real DataQ disputes, real placards.",
};

export default function SampleCaseStudyPage() {
  return (
    <SiteShell>
      <div className="bg-[var(--bg)] text-[var(--fg)]">

        {/* HERO */}
        <section className="relative overflow-hidden border-b border-[var(--border)]">
          <div className="absolute inset-0 -z-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/photos/trust-fleet-yard.jpg" alt="" aria-hidden="true" width="2400" height="1600" loading="lazy" decoding="async" className="w-full h-full object-cover opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg)]/90 via-[var(--bg)]/95 to-[var(--bg)]" />
          </div>
          <div className="max-w-5xl mx-auto px-6 pt-20 pb-14 relative">
            <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[var(--accent)] mb-3">
              Sample audit walkthrough · Synthetic carrier
            </div>
            <h1 className="text-[44px] sm:text-[56px] md:text-[60px] font-extrabold tracking-tight leading-[1.05] mb-5">
              47 trucks. <span className="serif-italic" style={{ color: "var(--accent)" }}>One audit.</span> Six days.
            </h1>
            <p className="text-[18px] text-[var(--fg-muted)] max-w-3xl leading-relaxed mb-3">
              We don&apos;t have customer case studies yet — we&apos;re pre-revenue. But the product is real, and the work
              it does is concrete. Below is exactly what an FMCSA audit looks like inside Compass for &quot;Hawthorn Logistics LLC,&quot;
              a synthetic carrier we built to walk prospects through the system.
            </p>
            <p className="text-[14px] text-[var(--fg-faint)] max-w-3xl">
              All CFR citations are real. The DataQ template is the template we use. The placards are the same real DOT placards
              from <Link href="/hazmat" className="text-[var(--accent)] hover:underline">/hazmat</Link>. The numbers are
              representative of a 47-truck small fleet running mixed dry-van + occasional Class 3 hazmat.
            </p>
          </div>
        </section>

        {/* CARRIER PROFILE */}
        <section className="max-w-5xl mx-auto px-6 py-14">
          <div className="x3-card p-7">
            <div className="text-[10px] tracking-[.18em] uppercase font-bold text-[var(--fg-muted)] mb-3">The carrier (synthetic)</div>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 text-[14px]">
              <div><div className="text-[11px] uppercase tracking-wider text-[var(--fg-faint)] mb-1">Name</div><div className="text-[var(--fg)] font-bold">Hawthorn Logistics LLC</div></div>
              <div><div className="text-[11px] uppercase tracking-wider text-[var(--fg-faint)] mb-1">USDOT</div><div className="text-[var(--fg)] font-mono">3,547,219 (synthetic)</div></div>
              <div><div className="text-[11px] uppercase tracking-wider text-[var(--fg-faint)] mb-1">Power units</div><div className="text-[var(--fg)] font-bold">47</div></div>
              <div><div className="text-[11px] uppercase tracking-wider text-[var(--fg-faint)] mb-1">Drivers</div><div className="text-[var(--fg)] font-bold">52</div></div>
              <div><div className="text-[11px] uppercase tracking-wider text-[var(--fg-faint)] mb-1">Operation</div><div className="text-[var(--fg)] font-bold">Interstate, regional</div></div>
              <div><div className="text-[11px] uppercase tracking-wider text-[var(--fg-faint)] mb-1">Commodity</div><div className="text-[var(--fg)] font-bold">Dry van + ad-hoc Class 3</div></div>
              <div><div className="text-[11px] uppercase tracking-wider text-[var(--fg-faint)] mb-1">Audit type</div><div className="text-[var(--fg)] font-bold">Compliance Review</div></div>
              <div><div className="text-[11px] uppercase tracking-wider text-[var(--fg-faint)] mb-1">Trigger</div><div className="text-[var(--fg)] font-bold">SMS Driver Fitness BASIC &gt; 80%</div></div>
            </div>
          </div>
        </section>

        {/* THE SIX DAYS */}
        <section className="max-w-5xl mx-auto px-6 pb-14">
          <h2 className="text-[24px] sm:text-[30px] font-extrabold text-[var(--fg)] mb-8">
            What happened, day by day
          </h2>

          <ol className="relative border-l-2 border-[var(--border)] ml-3 space-y-6">
            <Day n="1" title="FMCSA opens the inquiry">
              <p>Email arrives Monday 7:14am: &quot;Compliance Review scheduled, on-site Friday.&quot; The morning Compass digest already showed Driver Fitness BASIC at 82% (high alert). Triggers don&apos;t surprise carriers that have a daily digest reading the CSA score.</p>
              <p className="mt-2 text-[12px] text-[var(--fg-faint)]"><strong>Compass action:</strong> Daily Digest Brain auto-surfaces the Driver Fitness BASIC trend a week before this email. <strong>49 CFR § 385</strong> (Safety Fitness Procedures) is the underlying authority. <strong>SMS percentiles from CarrierOk feed</strong>.</p>
            </Day>

            <Day n="2" title="DQ file sweep across 52 drivers">
              <p>Compass DQ Files Brain shows 7 drivers with at least one missing § 391.51 artifact. Six of them are simply missing the prior-employer inquiry response within the 30-day window. One driver is missing an MVR from a state they held a license in 14 months ago.</p>
              <p className="mt-2 text-[12px] text-[var(--fg-faint)]"><strong>Compass action:</strong> auto-generated request letters to the 6 prior employers under <strong>49 CFR § 391.23</strong>; auto-pulled the missing MVR via the MVR Brain (state-specific lookup). Cost so far: $14 in MVR fees.</p>
            </Day>

            <Day n="3" title="D&A + Clearinghouse reconciliation">
              <p>Random-rate progress for the year is at 22% controlled-substances and 8% alcohol — both <em>below</em> the FMCSA-set minimums for 2026. The Drug & Alcohol Brain auto-suggests pulling 6 additional CS tests in the remaining 3 weeks to hit the 50% threshold by year-end.</p>
              <p>Clearinghouse: all 52 drivers queried within the last 12 months ✓. 3 drivers had a positive return-to-duty test completed under SAP supervision; their follow-up plans tracked on the calendar.</p>
              <p className="mt-2 text-[12px] text-[var(--fg-faint)]"><strong>Compass action:</strong> Random rate progress bar vs. <strong>49 CFR § 382.305</strong>. Clearinghouse queries logged with response codes. Auto-creates 6 tasks for the C/TPA to schedule.</p>
            </Day>

            <Day n="4" title="DataQ — the most valuable hour">
              <p>The Inspections Brain shows 11 OOS violations in the last 24 months. Compass flags 3 as <strong>contestable</strong> using the 21 pattern-matched dispute templates. Carrier opens the DataQ Dispute Drafter for each one — a tire-tread-depth violation that the photo evidence shows was below the OOS threshold but officer mis-coded it, and two missing-paperwork citations where Compass has the timestamped record.</p>
              <p className="mt-2 text-[12px] text-[var(--fg-faint)]"><strong>Compass action:</strong> DataQ Dispute Drafter generates the formal challenge letter, cites <strong>FMCSA DataQ Methodology v3.0.5</strong> and the specific § 393 standard. Average win on a contested OOS: $300 fine reduction + percentile lift. Filed via <a href="https://dataqs.fmcsa.dot.gov" target="_blank" rel="noreferrer" className="text-[var(--accent)] hover:underline">dataqs.fmcsa.dot.gov</a>.</p>
            </Day>

            <Day n="5" title="Hazmat preparation (just in case)">
              <p>Hawthorn occasionally hauls Class 3 flammable liquids. The Hazmat Brain shows H-endorsements current on 4 drivers, training within 3-year window for all, placards in stock and segregation rules cached on driver phones.</p>
              <p>Compass auto-generates the audit-ready Hazmat Security Plan per <strong>49 CFR § 172.800</strong> — Hawthorn would have failed this without the plan because they handled UN1203 above the placard threshold 14 times in the trailing 24 months.</p>
              <p className="mt-2 text-[12px] text-[var(--fg-faint)]"><strong>Compass action:</strong> Real placards from the <Link href="/hazmat" className="text-[var(--accent)] hover:underline">/hazmat library</Link> auto-attached to the audit packet. TSA H-endorsement clock per driver. Segregation table for Class 3 + Class 8 cached.</p>
            </Day>

            <Day n="6" title="The audit packet ships">
              <p>One-click export from <code className="font-mono text-[var(--accent)]">/app/audit-export</code>: 10 zipped sub-folders matching the FMCSA inspector&apos;s likely request list (DQ files, D&A records, Clearinghouse, MVR log, training records, accident register, inspection history, vehicle records, hours-of-service, financial responsibility). Plus the README that maps each file to the CFR section it satisfies.</p>
              <p className="mt-2 text-[12px] text-[var(--fg-faint)]"><strong>Compass action:</strong> ZIP includes all <strong>compass_*</strong> table dumps for Hawthorn&apos;s carrier_id, with a generated README + manifest. Inspector arrives Friday with the packet pre-read.</p>
            </Day>
          </ol>
        </section>

        {/* OUTCOME */}
        <section className="border-y border-[var(--border)] bg-[var(--bg-3)] py-12">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[var(--accent)] mb-3">Synthetic outcome</div>
            <h2 className="text-[28px] sm:text-[36px] font-extrabold text-[var(--fg)] mb-6">
              Conditional rating — held.
            </h2>
            <div className="grid md:grid-cols-3 gap-5">
              <Stat n="$0" label="In violations from the 3 contested DataQ items (was: $900 if unfought)" />
              <Stat n="6.2 days" label="Total operator time spent across the week (vs. typical 3-4 weeks pre-Compass)" />
              <Stat n="22%" label="Driver Fitness BASIC drop after disputes were accepted (82% → 60%)" />
            </div>
            <p className="text-[13px] text-[var(--fg-faint)] mt-6 max-w-3xl">
              This is a <strong>representative</strong> outcome built from the patterns we see in our parent carrier (X3 Fleet Safety LLC) and from public DataQ win-rate data.
              Real customer case studies — with names, USDOTs, and on-record results — will replace this page when the first carriers cross 90 days.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-[28px] sm:text-[36px] font-extrabold text-[var(--fg)] mb-3">
              Run this on your own fleet.
            </h2>
            <p className="text-[15px] text-[var(--fg-muted)] mb-6">
              7-day free trial. No card. Your real CSA score, your real DQ files, your real inspection history in under 10 minutes.
            </p>
            <Link href="/signup" className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[15px] text-[var(--accent-fg)] bg-[var(--accent)] hover:bg-[var(--accent-2)]">
              ★ Start free trial →
            </Link>
          </div>
        </section>
        <Related links={[{"href": "/hazmat", "title": "Hazmat Center", "desc": "Real DOT placards + the segregation engine used in day 5."}, {"href": "/trust", "title": "Trust & transparency", "desc": "The verifiable signals carriers ask about."}, {"href": "/pricing", "title": "Pricing + ROI calculator", "desc": "Estimate what Compass would cost your fleet."}]} />
      </div>
    </SiteShell>
  );
}

function Day({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <li className="ml-8 relative">
      <span className="absolute -left-[2.4rem] top-3 w-9 h-9 rounded-full border-2 border-[var(--bg)] bg-[var(--accent)] grid place-items-center text-[12px] font-black text-[var(--accent-fg)]">
        {n}
      </span>
      <div className="x3-card p-6">
        <div className="text-[10px] tracking-[.18em] uppercase font-bold text-[var(--accent)] mb-2">Day {n}</div>
        <h3 className="text-[18px] font-bold text-[var(--fg)] mb-3 leading-snug">{title}</h3>
        <div className="text-[14px] text-[var(--fg-muted)] leading-relaxed">{children}</div>
      </div>
    </li>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div className="x3-card p-5 text-center">
      <div className="text-[40px] font-extrabold text-[var(--accent)] mb-2 leading-none">{n}</div>
      <div className="text-[12px] text-[var(--fg-muted)] leading-snug">{label}</div>
    </div>
  );
}
