import Link from "next/link";
import DocsLayout, { H2, H3, Code, Pre } from "@/components/DocsLayout";

export const metadata = {
  title: "Getting started — X3 Compass Docs",
  description: "Sign up, import your fleet, run your first compliance check in under 10 minutes.",
};

const TOC = [
  { href: "#sign-up",   label: "1 · Sign up" },
  { href: "#import",    label: "2 · Import drivers + vehicles" },
  { href: "#first-ask", label: "3 · Ask Compass your first question" },
  { href: "#digest",    label: "4 · Turn on the daily digest" },
  { href: "#audit",     label: "5 · Run a sample audit export" },
  { href: "#next",      label: "Where next" },
];

export default function GettingStartedPage() {
  return (
    <DocsLayout title="Getting started" eyebrow="Documentation · Get started" toc={TOC}>
      <p className="text-[17px]">
        From signup to your first audit-ready compliance check in under 10 minutes. No credit card. No data lock-in.
        Every step below is concrete and works against your real fleet from minute one.
      </p>

      <H2 id="sign-up">1 · Sign up</H2>
      <p>
        Head to <Link href="/signup" className="text-[var(--accent)] hover:underline">/signup</Link>. Email + password or a
        magic link — pick whichever your team uses. No credit card required for the 7-day trial; the Hazmat add-on is included
        in the trial period.
      </p>
      <p>
        After signup you&apos;ll see the onboarding wizard at <Code>/app/onboarding</Code>. Three quick steps:
      </p>
      <ul className="list-disc list-inside ml-2 space-y-1">
        <li>Carrier basics — legal name, USDOT, MC (we&apos;ll auto-populate from FMCSA SAFER if you paste your USDOT)</li>
        <li>Power-unit + driver count — drives the per-driver pricing</li>
        <li>Operating profile — interstate / intrastate, hazmat yes/no, primary cargo type</li>
      </ul>
      <p>That&apos;s the only data we require to start. Everything else can be added incrementally as you use the product.</p>

      <H2 id="import">2 · Import drivers + vehicles</H2>
      <p>Three paths, pick whichever fits your data shape today:</p>

      <H3 id="csv">CSV import (fastest for fleets &gt; 10 drivers)</H3>
      <p>From <Code>/app/drivers</Code> click <strong>Import CSV</strong>. We provide the template — the columns map 1:1 to
      the § 391.51 DQ file slots. Required fields are CDL number, state, expires-on, medical-card-expires-on. Everything else is
      progressively enriched as you log activity.</p>
      <Pre lang="CSV columns">
{`first_name,last_name,email,phone,cdl_number,cdl_state,cdl_expires_on,medical_card_expires_on,hire_date,status
John,Doe,john@example.com,5555550100,K12345678,MI,2027-04-15,2026-09-30,2024-01-15,active
...`}
      </Pre>

      <H3 id="manual">Manual entry (best for 1-10 drivers, mixed data quality)</H3>
      <p>From <Code>/app/drivers</Code> click <strong>+ Add driver</strong>. Every input field has the CFR section it satisfies
      labeled inline. Missing fields glow red — the DQ Files Brain at <Link href="/app/dq-files" className="text-[var(--accent)] hover:underline">/app/dq-files</Link>
      tracks completion per driver against the 12-slot § 391.51 checklist.</p>

      <H3 id="api">API ingest (best for ELD + TMS integrations)</H3>
      <p>If you already have driver/vehicle data in Motive, Samsara, Geotab, or your own TMS, push it via our API. See
      <Link href="/docs/api" className="text-[var(--accent)] hover:underline"> /docs/api</Link>. The same auth + RLS rules that
      protect the UI protect the API.</p>

      <H2 id="first-ask">3 · Ask Compass your first question</H2>
      <p>From any /app/ page the Ask Compass widget sits in the lower right (and the full-screen version is at
      <Link href="/app/ask" className="text-[var(--accent)] hover:underline"> /app/ask</Link>). Type a question. Every CFR
      citation in the answer is round-tripped against the live eCFR.gov registry — verified citations get a green ✓ chip, unverified
      get an amber ⚠.</p>
      <p>Try these to see the surface area:</p>
      <ul className="list-disc list-inside ml-2 space-y-1">
        <li>&quot;What&apos;s our random rate target for 2026?&quot;</li>
        <li>&quot;How long do I keep DQ files after a driver leaves?&quot;</li>
        <li>&quot;4,000 lbs of UN1203 — do I need placards?&quot;</li>
        <li>&quot;Annual MVR review — is once-a-year per state enough?&quot;</li>
      </ul>
      <p>If you want to test before signup, the same demo is on the homepage at <Link href="/" className="text-[var(--accent)] hover:underline">x3compass.com</Link> — 5 free questions per IP per 6 hours, no auth needed.</p>

      <H2 id="digest">4 · Turn on the daily digest</H2>
      <p>From <Code>/app/settings</Code> → <strong>Notifications</strong>. Pick a delivery time and the channel (email + optional
      SMS). The digest fires at 07:00 in your local tz with:</p>
      <ul className="list-disc list-inside ml-2 space-y-1">
        <li>Drivers with CDLs / medical cards expiring in 60 days</li>
        <li>Vehicles with DOT inspections due in 60 days</li>
        <li>MVR pulls overdue this month</li>
        <li>Random-rate progress vs. § 382.305 minimum</li>
        <li>Open DataQ disputes + status</li>
      </ul>
      <p>This is the single feature that prevents 80% of compliance fires — you see what&apos;s about to expire before it does.</p>

      <H2 id="audit">5 · Run a sample audit export</H2>
      <p>From <Code>/app/audit-export</Code> click <strong>Generate packet</strong>. Compass builds a ZIP with 10 sub-folders
      organized exactly the way an FMCSA inspector requests them — DQ files, D&A records, Clearinghouse log, MVR history,
      training records, accident register, inspection history, vehicle records, hours-of-service, financial responsibility — plus
      a README that maps each file to the CFR section it satisfies.</p>
      <p>Even with an empty carrier this works on day 1; you&apos;ll see the structure and a sample README. As you add data,
      every export picks up your real records.</p>
      <p className="text-[13px] text-[var(--fg-faint)]">
        Want the full audit story? Read the <Link href="/case-studies/sample" className="text-[var(--accent)] hover:underline">sample audit walkthrough</Link>
        — a synthetic 47-truck carrier going through a Compliance Review day-by-day using Compass.
      </p>

      <H2 id="next">Where next</H2>
      <ul className="list-disc list-inside ml-2 space-y-1">
        <li><Link href="/docs/api" className="text-[var(--accent)] hover:underline">/docs/api</Link> — REST + webhook reference</li>
        <li><Link href="/docs/integrations" className="text-[var(--accent)] hover:underline">/docs/integrations</Link> — wire up Stripe, Checkr, your ELD</li>
        <li><Link href="/skills" className="text-[var(--accent)] hover:underline">/skills</Link> — all 300+ FMCSA skills with their CFR citations</li>
        <li><Link href="/security" className="text-[var(--accent)] hover:underline">/security</Link> — for the SOC 2 / DPA / threat-model crowd</li>
        <li><Link href="/help" className="text-[var(--accent)] hover:underline">/help</Link> — the 12 most-asked support questions</li>
      </ul>
    </DocsLayout>
  );
}
