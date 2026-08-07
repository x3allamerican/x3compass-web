"use client";

/* ============================================================
   Procom · Option 3 program disclosure (X3-recommended C/TPA)
   ------------------------------------------------------------
   Single source of truth for the 'what happens when you pick
   Procom' content. Rendered identically in two places:

     1. ProcomDisclosureModal · shown BEFORE the carrier locks
        in Procom · affirmative ack required
     2. ProcomProgramReferenceCard · shown on /drug-alcohol
        AFTER enrollment · persistent reference

   When Martin sends an updated email, bump VERSION_TAG · the
   modal will auto-reprompt carriers to re-acknowledge.

   Source: Martin Sena email 2026-05-27 · Option 3 Direct-to-
   Carrier · drugtestingconsortium.com / procomtesting.com
   ============================================================ */

import { ReactNode } from "react";

export const PROCOM_VERSION_TAG = "procom-2026-05-v1";

export type PriceTier = { range: string; fee: string };

export const PROCOM_PRICING: {
  annual_membership: PriceTier[];
  testing_fees: { drug: string; bat: string };
  proration_note: string;
  next_membership_due: string;
} = {
  annual_membership: [
    { range: "1 – 4 drivers",   fee: "$60 per driver annually" },
    { range: "5 – 24 drivers",  fee: "$250 company annual fee" },
    { range: "25+ drivers",     fee: "$0 annual fee" },
  ],
  testing_fees: {
    drug: "$75 per DOT drug test",
    bat:  "$50 per breath alcohol test",
  },
  proration_note: "The annual membership fee is not prorated.",
  next_membership_due: "December 2026",
};

export const PROCOM_ENROLLMENT_REQUIREMENTS: string[] = [
  "Proof of current consortium enrollment within the last 30 days, OR",
  "A negative DOT drug test result within the last 30 days, OR",
  "If neither is available, a pre-employment DOT drug test will be required before enrollment.",
];

export const PROCOM_ENROLLMENT_STEPS: { n: number; title: string; detail: string }[] = [
  {
    n: 1,
    title: "Company / Driver Info & Payment",
    detail: "Procom collects: driver's legal first + last name, driver's license number + issuing state, company mailing address, and credit card or ACH payment information.",
  },
  {
    n: 2,
    title: "Test Authorization",
    detail: "Procom emails a test authorization form with the testing location.",
  },
  {
    n: 3,
    title: "Testing Instructions",
    detail: "Drivers must bring the printed or emailed test authorization and a valid photo ID to the collection site.",
  },
  {
    n: 4,
    title: "Result Turnaround",
    detail: "Negative results typically 1–2 business days. Non-negative results: confirmatory testing and MRO review may take up to one week.",
  },
  {
    n: 5,
    title: "Certificate of Enrollment",
    detail: "Once a negative result is received, Procom issues the Certificate of Enrollment required for DOT compliance.",
  },
  {
    n: 6,
    title: "Consortium Enrollment",
    detail: "Drivers are officially enrolled in the DOT random testing consortium and become subject to quarterly random selections.",
  },
  {
    n: 7,
    title: "Pre-Employment Testing",
    detail: "Procom can provide pre-employment testing anytime needed.",
  },
  {
    n: 8,
    title: "FMCSA Clearinghouse · designation YOU complete",
    detail: "You must designate PROCOM (no LLC), 1805 Fortino Blvd, Pueblo, CO 81008 as your C/TPA at clearinghouse.fmcsa.dot.gov. Procom cannot complete this on your behalf. X3 Compass walks you through the designation at /clearinghouse. FMCSA support: 202-366-4000.",
  },
];

export const PROCOM_ONGOING_SUPPORT: string = "Procom conducts quarterly random selections. Approximately 10 days before each quarter begins, they will request an updated roster. Once selections are complete, they notify you whether drivers were selected.";

export const PROCOM_CONTACT = {
  org_name: "PROCOM",
  org_brand: "American Drug Testing Consortium (ADTC)",
  primary_contact: "Martin Sena · VP of Operations",
  primary_phone: "719-295-1911 x1 (Pueblo Office)",
  after_hours_phone: "719-671-5251 (24/7 post-accident + after-hours)",
  primary_email: "admin@procomtesting.com",
  results_email: "results@procomtesting.com",
  mailing_address: "1805 Fortino Blvd, Pueblo, CO 81008",
  website: "https://drugtestingconsortium.com",
  fmcsa_clearinghouse_name: "PROCOM",
  after_hours_fee: "$175 per occurrence · Mon-Fri 5:00 PM – 8:00 AM MT and all-day Sat/Sun/Holiday",
  reasonable_suspicion_training: "$50 per participant · Certificate provided · quarterly two-hour sessions at procomtesting.com/training-registration/",
};

export const PROCOM_X3_ROLE: string = "X3 Compass refers you to Procom. Procom contracts directly with your company, holds the TPA insurance, manages results and the random pool, and bills you directly (credit card or ACH). X3 Compass surfaces your program info, prompts you for the Clearinghouse C/TPA designation, and ingests positives + refusals into your audit ledger. Procom — not X3 — is your TPA of record.";

/* ============================================================
   ProcomDisclosure · the actual JSX block
   ============================================================ */

export function ProcomDisclosure({ compact = false }: { compact?: boolean }): ReactNode {
  return (
    <div className="space-y-5 text-[var(--fg)]">
      {/* X3's role · sets expectations on who's who */}
      <Section title="Your relationship with Procom and X3" icon="🤝">
        <p className="text-[12.5px] leading-relaxed text-[var(--fg-muted)] m-0">{PROCOM_X3_ROLE}</p>
      </Section>

      {/* Pricing */}
      <Section title="Annual membership + testing fees" icon="💵">
        <ul className="list-none p-0 m-0 space-y-1.5">
          {PROCOM_PRICING.annual_membership.map((p, i) => (
            <li key={i} className="flex justify-between text-[12.5px] border-b border-[var(--border)] last:border-b-0 py-1.5">
              <span className="text-[var(--fg-muted)]">{p.range}</span>
              <strong className="text-[var(--fg)]">{p.fee}</strong>
            </li>
          ))}
        </ul>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Pill label="Drug test" value={PROCOM_PRICING.testing_fees.drug} />
          <Pill label="BAT (alcohol)" value={PROCOM_PRICING.testing_fees.bat} />
        </div>
        <p className="text-[11px] text-[var(--fg-faint)] mt-2 m-0">
          {PROCOM_PRICING.proration_note} Next annual membership fee due {PROCOM_PRICING.next_membership_due}.
        </p>
        <p className="text-[11px] text-[var(--fg-faint)] mt-1 m-0">
          After-hours support {PROCOM_CONTACT.after_hours_fee} · reasonable-suspicion training {PROCOM_CONTACT.reasonable_suspicion_training}
        </p>
      </Section>

      {/* Enrollment prerequisites */}
      <Section title="To enroll, each driver must provide one of" icon="📋">
        <ul className="list-disc pl-5 space-y-1 text-[12.5px] text-[var(--fg-muted)] leading-relaxed">
          {PROCOM_ENROLLMENT_REQUIREMENTS.map((r, i) => <li key={i}>{r}</li>)}
        </ul>
      </Section>

      {/* 8-step enrollment process */}
      {!compact && (
        <Section title="What happens after you enroll · 8 steps" icon="🗺">
          <ol className="list-none p-0 m-0 space-y-2">
            {PROCOM_ENROLLMENT_STEPS.map((s) => (
              <li key={s.n} className="flex gap-3 items-start">
                <span
                  aria-hidden
                  className="shrink-0 inline-flex items-center justify-center text-[11px] font-extrabold rounded-full text-[var(--bg)]"
                  style={{ width: 22, height: 22, background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
                >
                  {s.n}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-bold text-[var(--fg)] leading-tight">{s.title}</div>
                  <div className="text-[11.5px] text-[var(--fg-muted)] mt-0.5 leading-relaxed">{s.detail}</div>
                </div>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {/* Ongoing */}
      <Section title="Ongoing support" icon="🔁">
        <p className="text-[12.5px] leading-relaxed text-[var(--fg-muted)] m-0">{PROCOM_ONGOING_SUPPORT}</p>
      </Section>

      {/* Contact */}
      <Section title="Your Procom contact" icon="📞">
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5 text-[12px] m-0">
          <Field k="Org" v={`${PROCOM_CONTACT.org_name} · ${PROCOM_CONTACT.org_brand}`} />
          <Field k="Primary" v={PROCOM_CONTACT.primary_contact} />
          <Field k="Office line" v={PROCOM_CONTACT.primary_phone} />
          <Field k="24/7 / post-accident" v={PROCOM_CONTACT.after_hours_phone} />
          <Field k="Email" v={<a href={`mailto:${PROCOM_CONTACT.primary_email}`} className="text-[var(--accent)] hover:underline">{PROCOM_CONTACT.primary_email}</a>} />
          <Field k="Results from" v={PROCOM_CONTACT.results_email} />
          <Field k="Mailing" v={PROCOM_CONTACT.mailing_address} />
          <Field k="Website" v={<a href={PROCOM_CONTACT.website} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">{PROCOM_CONTACT.website.replace(/^https?:\/\//, "")} ↗</a>} />
        </dl>
      </Section>

      <p className="text-[10.5px] text-[var(--fg-faint)] m-0 leading-relaxed pt-2 border-t border-[var(--border)]">
        Disclosure version: <code className="text-[10.5px] bg-[var(--surface-3)] px-1.5 rounded">{PROCOM_VERSION_TAG}</code> · Source: Martin Sena email, 2026-05-27. Pricing and process are set by Procom and may change — we&apos;ll reprompt you to re-acknowledge when terms update.
      </p>
    </div>
  );
}

/* ----------------- internal helpers ----------------- */

function Section({ title, icon, children }: { title: string; icon: string; children: ReactNode }) {
  return (
    <section>
      <header className="flex items-center gap-2 mb-2">
        <span aria-hidden className="text-[15px]">{icon}</span>
        <h4 className="text-[11px] tracking-[.14em] uppercase font-extrabold text-[var(--accent)] m-0">{title}</h4>
      </header>
      {children}
    </section>
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
      <div className="text-[9.5px] tracking-[1.2px] uppercase font-bold text-[var(--fg-faint)]">{label}</div>
      <div className="text-[13px] font-extrabold text-[var(--fg)] mt-0.5">{value}</div>
    </div>
  );
}

function Field({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="flex gap-2 min-w-0">
      <dt className="text-[var(--fg-muted)] w-[110px] shrink-0">{k}</dt>
      <dd className="text-[var(--fg)] m-0 min-w-0 break-words">{v}</dd>
    </div>
  );
}
