import Link from "next/link";
import SiteShell from "@/components/SiteShell";
import Related from "@/components/Related";

export const metadata = {
  title: "Security — X3 Compass",
  description: "Cloud architecture, threat model, RLS, encryption, incident response. The deeper read for enterprise and partner prospects.",
};

export default function SecurityPage() {
  return (
    <SiteShell>
      <div className="bg-[var(--bg)] text-[var(--fg)]">

        {/* HERO */}
        <section className="border-b border-[var(--border)]">
          <div className="max-w-5xl mx-auto px-6 py-20">
            <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[var(--accent)] mb-3">
              Security at X3 Compass
            </div>
            <h1 className="text-[44px] sm:text-[56px] md:text-[64px] font-extrabold tracking-tight leading-[1.05] mb-4">
              Defense in depth.{" "}
              <span className="serif-italic" style={{ color: "#22D3EE" }}>Transparency in everything.</span>
            </h1>
            <p className="text-[18px] text-[var(--fg-muted)] max-w-3xl">
              This is the deeper read. The summary version lives on the <Link href="/trust" className="text-[var(--accent)] font-bold hover:underline">Trust page</Link>.
              Below: cloud architecture, threat model, RLS isolation, encryption story, incident response, compliance roadmap.
            </p>
          </div>
        </section>

        {/* QUICK FACTS */}
        <section className="max-w-5xl mx-auto px-6 py-12">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { k: "Encryption at rest",  v: "AES-256 (Supabase + R2)" },
              { k: "Encryption in flight",v: "TLS 1.3 + HSTS" },
              { k: "Tenant isolation",    v: "Postgres RLS on every table" },
              { k: "Payment processing",  v: "Stripe (we never see card data)" },
            ].map((t) => (
              <div key={t.k} className="x3-card p-5">
                <div className="text-[10px] tracking-[.18em] uppercase font-bold text-[var(--fg-muted)] mb-2">{t.k}</div>
                <div className="text-[15px] font-semibold text-[var(--fg)]">{t.v}</div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTIONS */}
        <section className="max-w-5xl mx-auto px-6 pb-16 space-y-12">

          <Block title="01 · Cloud architecture">
            <p>X3 Compass runs on a small, audited stack:</p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
              <li><strong>Cloudflare Pages</strong> — static marketing + Pages Functions for the API. Cloudflare WAF + DDoS in front of every request.</li>
              <li><strong>Supabase (Postgres + Auth)</strong> — per-carrier tenant data, JWT-based authentication, every row protected by Row-Level Security policies.</li>
              <li><strong>Cloudflare R2</strong> — customer document storage. Object-level access requires a signed token issued by an authenticated Pages Function.</li>
              <li><strong>Stripe</strong> — all subscription and payment data. We never store card numbers; we hold only a Stripe customer ID per carrier.</li>
              <li><strong>Anthropic API</strong> — Claude inference for the AI brains. No carrier data is sent except what the user explicitly types into Ask Compass.</li>
              <li><strong>Resend</strong> — transactional email only (auth links, daily digest). No marketing list, no third-party trackers in transactional mail.</li>
            </ul>
          </Block>

          <Block title="02 · Tenant isolation (the part most carriers ask about)">
            <p>
              Every customer-data row in our database carries a <code className="font-mono text-[var(--accent)]">carrier_id</code> column.
              Postgres Row-Level Security policies enforce that <em>at the database layer</em>, not at the API layer.
              Even if a future Pages Function had a bug that forgot to filter by carrier, the database would still refuse the read.
            </p>
            <p className="mt-2">
              The policy on <code className="font-mono">compass_drivers</code> for example reads:
              <span className="block mt-2 font-mono text-[13px] bg-[var(--surface)] border border-[var(--border)] rounded p-3 text-[var(--fg-muted)]">
                carrier_id IN (SELECT carrier_id FROM compass_carrier_users WHERE user_id = auth.uid())
              </span>
              The same shape exists on all 14 compass_* tables that hold customer data.
            </p>
          </Block>

          <Block title="03 · Authentication">
            <p>
              Supabase Auth handles password + magic-link sign-in. Sessions are JWTs stored in HTTP-only cookies — never in localStorage, never in URL parameters.
              The <Link href="/app/ask" className="text-[var(--accent)]">Ask Compass</Link> endpoint and every other authed function verifies the JWT signature on every request via the Supabase service role.
            </p>
            <p className="mt-2">
              Password policy: minimum 8 characters, bcrypt-hashed. Forgot-password flows expire links in 1 hour and consume on first use.
            </p>
          </Block>

          <Block title="04 · Threat model — what we plan against">
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Cross-tenant read.</strong> Mitigated by Postgres RLS at the database tier; the failure-closed default is &quot;return zero rows.&quot;</li>
              <li><strong>Stripe webhook spoofing.</strong> Every webhook event signature is verified using HMAC-SHA256 against STRIPE_WEBHOOK_SECRET before any state change.</li>
              <li><strong>Prompt injection in Ask Compass.</strong> Carrier data isn&apos;t sent to the LLM unless the user explicitly types it. CFR citations in answers are round-tripped against eCFR — fabricated section numbers fail the verification and surface a warning chip.</li>
              <li><strong>Credential leakage in client bundle.</strong> No service-role keys or third-party API keys are ever in client code. The build pipeline fails if a non-NEXT_PUBLIC env var appears in a client bundle.</li>
              <li><strong>Brute-force on sign-in.</strong> Per-IP rate-limit on /api/auth/* via the same in-edge rate-limit infra as /api/ask. Lockout escalates with attempt count.</li>
              <li><strong>Insider risk.</strong> Only Joshua has Supabase project-owner rights today; service-role keys rotated quarterly. As we hire, every employee gets least-privilege access via Supabase &amp; Cloudflare role policies.</li>
            </ul>
          </Block>

          <Block title="05 · Incident response">
            <p>
              We run an autonomous SRE stack we call <strong>Fort Knox</strong>:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
              <li>Synthetic journey probes every 15 min against production user flows</li>
              <li>Cloudflare deploy-failure watcher every 10 min — catches silent build failures</li>
              <li>Stripe webhook health poller every 30 min</li>
              <li>Supabase advisor scan every 30 min — catches RLS misconfig and slow-query regressions</li>
              <li>Client-error spike aggregator every 15 min over the <code className="font-mono">compass_client_errors</code> table</li>
            </ul>
            <p className="mt-3">
              When something trips, a <strong>doctor agent</strong> diagnoses against a 14-pattern playbook and auto-resolves where safe (e.g. Cloudflare deploy-swap 522s, transient 403s).
              When the doctor can&apos;t self-resolve, the on-call human is paged with the diagnosis attached. SLAs target: detect &lt; 10 min, customer-impact-resolve &lt; 60 min.
            </p>
            <p className="mt-2">
              We will publish a public status page when we cross 50 paying customers. Until then, transparency is via the <Link href="/changelog" className="text-[var(--accent)] hover:underline">/changelog</Link> + open GitHub.
            </p>
          </Block>

          <Block title="06 · Data residency + export">
            <p>
              Customer data lives in Supabase us-east-1 by default. Enterprise customers needing other regions (EU, FedRAMP-equivalent) can be moved on request as part of an MSA.
            </p>
            <p className="mt-2">
              Full data export is one click from <code className="font-mono">/app/audit-export</code> — every compass_* table for your carrier, CSV format. We don&apos;t lock you in.
            </p>
          </Block>

          <Block title="07 · Compliance roadmap">
            <table className="w-full text-[14px] mt-2">
              <thead>
                <tr className="text-left text-[10px] tracking-[.16em] uppercase text-[var(--fg-muted)]">
                  <th className="pb-2">Framework</th><th className="pb-2">Status</th><th className="pb-2">Target</th>
                </tr>
              </thead>
              <tbody className="text-[var(--fg-muted)]">
                <tr className="border-t border-[var(--border)]"><td className="py-2"><Link href="/security/soc2" className="text-[var(--accent)] font-bold hover:underline">SOC 2 Type II →</Link></td><td>Preparation</td><td>Q4 2026 · <Link href="/security/soc2" className="text-[var(--accent)] hover:underline">milestones</Link></td></tr>
                <tr className="border-t border-[var(--border)]"><td className="py-2">FCRA-compliant background checks</td><td className="text-[var(--success)]">In production</td><td>Live via Checkr</td></tr>
                <tr className="border-t border-[var(--border)]"><td className="py-2">DPA (GDPR / CCPA)</td><td className="text-[var(--success)]">Available</td><td>On request</td></tr>
                <tr className="border-t border-[var(--border)]"><td className="py-2">HIPAA BAA</td><td>Not pursuing (no PHI processed)</td><td>—</td></tr>
                <tr className="border-t border-[var(--border)]"><td className="py-2">ISO 27001</td><td>Considering post-SOC 2</td><td>Q2 2027 if customer demand</td></tr>
              </tbody>
            </table>
          </Block>

          <Block title="08 · Reporting a vulnerability">
            <p>
              We don&apos;t have a bug bounty yet but we take security reports seriously. Email <a href="mailto:security@x3compass.com" className="text-[var(--accent)] font-bold hover:underline">security@x3compass.com</a>.
              Initial reply within 24 hours, validated reports get a fix timeline within 72 hours. Coordinated disclosure: 90 days standard.
            </p>
          </Block>
        </section>

        {/* CTA */}
        <section className="border-t border-[var(--border)] bg-[var(--bg-3)] py-16">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-[28px] sm:text-[36px] font-extrabold text-[var(--fg)] mb-3">
              Enterprise security questionnaire?
            </h2>
            <p className="text-[15px] text-[var(--fg-muted)] mb-6">
              Send it to <a href="mailto:joshua@x3compass.com" className="text-[var(--accent)] font-bold">joshua@x3compass.com</a>. Most one-page CAIQ/SIG-Lite filled within 48 hours.
            </p>
            <Link href="/trust" className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[15px] text-[var(--fg)] border border-[var(--border)] hover:border-[var(--accent)]">
              ← Back to Trust overview
            </Link>
          </div>
        </section>
        <Related links={[{"href": "/trust", "title": "Trust overview", "desc": "The summary version — verifiable proof tiles."}, {"href": "/case-studies/sample", "title": "Sample audit walkthrough", "desc": "How the security posture shows up in a real audit."}, {"href": "/help", "title": "Help & Support", "desc": "Send your security questionnaire to security@x3compass.com."}]} />
      </div>
    </SiteShell>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="x3-card p-7">
      <h2 className="text-[18px] font-bold text-[var(--fg)] mb-3">{title}</h2>
      <div className="text-[14px] text-[var(--fg-muted)] leading-relaxed">{children}</div>
    </div>
  );
}
