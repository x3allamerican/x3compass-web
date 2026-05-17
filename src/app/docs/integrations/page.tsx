import Link from "next/link";
import DocsLayout, { H2, H3, Code } from "@/components/DocsLayout";

export const metadata = {
  title: "Integrations — X3 Compass Docs",
  description: "How Compass wires into Stripe, Checkr, Anthropic, Supabase, Cloudflare, Resend, Twilio. Data flow, consent, and customer-facing surfaces.",
};

const TOC = [
  { href: "#philosophy", label: "Integration philosophy" },
  { href: "#stripe",     label: "Stripe — billing" },
  { href: "#checkr",     label: "Checkr — background checks" },
  { href: "#anthropic",  label: "Anthropic — AI brain" },
  { href: "#supabase",   label: "Supabase — data + auth" },
  { href: "#cloudflare", label: "Cloudflare — hosting + WAF" },
  { href: "#resend",     label: "Resend — transactional email" },
  { href: "#twilio",     label: "Twilio — SMS notifications" },
  { href: "#roadmap",    label: "Integration roadmap" },
];

export default function IntegrationsDocsPage() {
  return (
    <DocsLayout title="Integrations" eyebrow="Documentation · Reference" toc={TOC}>
      <p className="text-[17px]">
        Compass runs on a deliberately small stack. Every integration below is wired today — not "coming soon."
        For each one: what data flows, what consent is required, what the customer-facing surface looks like.
      </p>

      <H2 id="philosophy">Integration philosophy</H2>
      <p>Three rules drive how we choose + wire vendors:</p>
      <ul className="list-disc list-inside ml-2 space-y-1">
        <li><strong>Customer data stays in our tenant.</strong> Vendors get the minimum they need to do their job and no more. Stripe sees payment data; it never sees driver compliance records.</li>
        <li><strong>Webhook signatures are verified.</strong> Every inbound webhook checks HMAC before any state change. Spoofed events are rejected with HTTP 401 and logged.</li>
        <li><strong>One-click revocation.</strong> Removing a vendor doesn&apos;t require an engineer. The integrations page in /app/settings handles disconnect + data cleanup.</li>
      </ul>

      <H2 id="stripe">Stripe — billing</H2>
      <p><strong>What flows:</strong> Subscription state, payment method (Stripe holds it; we hold a Customer ID), invoices, payment events.<br/>
      <strong>What we never see:</strong> Card numbers, full bank details, CVV. Stripe Checkout + Customer Portal handle every PCI-scope surface.</p>
      <H3 id="stripe-setup">Setup</H3>
      <p>Nothing for the carrier to do. Stripe Checkout fires when you pick a plan during signup. Update payment method any time from <Code>/app/settings/billing</Code>.</p>
      <H3 id="stripe-webhook">Webhook</H3>
      <p>Stripe sends events to <Code>/api/stripe/webhook</Code> (HMAC-SHA256 verified with <Code>STRIPE_WEBHOOK_SECRET</Code>). Handlers idempotent on event ID. State changes go to the <Code>compass_carriers</Code> table.</p>

      <H2 id="checkr">Checkr — background checks</H2>
      <p><strong>What flows:</strong> Candidate name + DOB + SSN go from your driver to Checkr (never through Compass — the Checkr Embeds widget POSTs directly to Checkr). Compass receives the resulting <Code>candidate_id</Code> and <Code>report_id</Code> for status tracking.<br/>
      <strong>What we never see:</strong> SSN, full report contents. We display the Checkr-hosted report viewer inside Compass via their embed.</p>
      <H3 id="checkr-fcra">FCRA compliance</H3>
      <p>The disclosure + consent surface is the Checkr-audited Embed. Adverse-action timing is built into our workflow (7-day pre-adverse window, mailed notice to driver, then final-adverse) — see <Link href="/security#fcra" className="text-[var(--accent)] hover:underline">/security</Link>.</p>
      <H3 id="checkr-flow">Flow</H3>
      <ol className="list-decimal list-inside ml-2 space-y-1">
        <li>Carrier orders a check from <Code>/app/background-checks</Code> → driver receives invite email</li>
        <li>Driver completes disclosure + consent + identity in the Checkr Embed</li>
        <li>Checkr returns webhook updates as the report progresses</li>
        <li>Carrier reviews completed report via the embedded ReportsOverview widget</li>
        <li>If adverse — workflow surfaces the pre-adverse letter template + 7-day timer</li>
      </ol>

      <H2 id="anthropic">Anthropic — the AI brain</H2>
      <p><strong>What flows:</strong> The literal text the user types into Ask Compass. Plus the system prompt (which contains the
      X3 Compass voice, the CFR-citation rules, and zero customer data). That&apos;s it — no carrier records, no driver names, no PHI.<br/>
      <strong>What we never share:</strong> Anything from the compass_* tables unless the user pastes it into the prompt themselves.</p>
      <p>Per Anthropic&apos;s API terms, API traffic is not used to train models. We log every call to <Code>compass_prompt_eval</Code> for our own quality measurement — that data stays in our Supabase tenant.</p>
      <p>Citation verification: every CFR section in a Claude response is round-tripped against <Code>ecfr.gov</Code> live before the response returns to the customer. Read the methodology in the <Link href="/blog/cfr-accuracy-baseline" className="text-[var(--accent)] hover:underline">CFR accuracy baseline post</Link>.</p>

      <H2 id="supabase">Supabase — data + auth</H2>
      <p><strong>What flows:</strong> All carrier compliance data — drivers, vehicles, inspections, D&A tests, MVRs, training records, accidents, DQ documents.<br/>
      <strong>Tenant isolation:</strong> Postgres Row-Level Security on every <Code>compass_*</Code> table. The policy looks like this:</p>
      <p>(See <Link href="/security#03-tenant-isolation-the-part-most-carriers-ask-about" className="text-[var(--accent)] hover:underline">/security § 02</Link> for the exact policy text.)</p>
      <H3 id="supabase-auth">Authentication</H3>
      <p>Supabase Auth handles password + magic link sign-in. JWT stored in HTTP-only cookies. Service-role keys never leave server-side env vars.</p>
      <H3 id="supabase-storage">Storage</H3>
      <p>Documents (med certs, CDL copies, MVRs) go to Supabase Storage with the same RLS policy as the metadata tables. Signed URLs expire in 15 minutes by default.</p>

      <H2 id="cloudflare">Cloudflare — hosting + WAF</H2>
      <p><strong>What runs here:</strong> Static marketing site, Pages Functions (the /api/*  endpoints), R2 object storage for audit-export ZIPs, the WAF, and DDoS protection on every request.<br/>
      <strong>What we never store on CF:</strong> Customer credentials or payment data.</p>
      <H3 id="cf-r2">R2 audit ZIPs</H3>
      <p>Generated audit ZIPs land in R2 at <Code>r2://x3compass-uploads/audits/{`{carrier_id}`}/{`{timestamp}`}.zip</Code>. URLs are signed with a 24-hour expiry. The R2 binding never appears in client code — only the Pages Function that generates the ZIP can write to the bucket.</p>

      <H2 id="resend">Resend — transactional email</H2>
      <p><strong>What flows:</strong> Sign-up confirmation, magic-link emails, password resets, the daily compliance digest, FCRA adverse-action notices.<br/>
      <strong>What we never send:</strong> Marketing emails. No newsletter. No tracking pixels in transactional mail.</p>
      <p>Outbound from <Code>no-reply@x3compass.com</Code> for system mail, <Code>joshua@x3compass.com</Code> for founder reply-able mail. DKIM + SPF + DMARC configured on the x3compass.com zone.</p>

      <H2 id="twilio">Twilio — SMS notifications</H2>
      <p><strong>What flows:</strong> Daily-digest SMS (opt-in), driver-side OTP for sign-in, FCRA-required SMS notices to drivers during background checks.<br/>
      <strong>STOP handling:</strong> Driver replies STOP → Twilio updates opt-out → next outbound is blocked at the Twilio side AND we mark the row in <Code>compass_drivers.sms_opt_in = false</Code>.</p>

      <H2 id="roadmap">Integration roadmap</H2>
      <ul className="list-disc list-inside ml-2 space-y-1">
        <li><strong>Motive, Samsara, Geotab</strong> — ELD ingest for hours-of-service real-time. Target Q3 2026.</li>
        <li><strong>SambaSafety</strong> — continuous MVR monitoring (today: annual one-shot pulls). Target Q3 2026.</li>
        <li><strong>Quest Diagnostics</strong> — D&A test ordering + result ingest. Target Q4 2026.</li>
        <li><strong>CarrierOk</strong> — live CSA / SMS percentile feed. Decision pending; <Link href="/case-studies/sample" className="text-[var(--accent)] hover:underline">sample audit</Link> assumes this is wired.</li>
        <li><strong>FMCSA Clearinghouse</strong> — direct query API (today: manual logging). Awaiting FMCSA-published API.</li>
      </ul>
      <p>Need an integration that&apos;s not on this list? Email <a href="mailto:joshua@x3compass.com" className="text-[var(--accent)] hover:underline">joshua@x3compass.com</a> — customer demand drives priority.</p>
    </DocsLayout>
  );
}
