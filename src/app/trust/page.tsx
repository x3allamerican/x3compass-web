import type { Metadata } from "next";
import Link from "next/link";
import SiteShell from "@/components/SiteShell";

export const metadata: Metadata = {
  title: "Trust & Security — X3 Compass",
  description:
    "How X3 Compass protects carrier data, operates its infrastructure, grounds AI output, and handles responsible security disclosure.",
  alternates: { canonical: "/trust" },
  openGraph: {
    title: "Trust & Security — X3 Compass",
    description: "Data protection, infrastructure, grounded AI, reliability, and responsible disclosure at X3 Compass.",
    type: "website",
    url: "/trust",
  },
};

const safeguards = [
  ["Encryption in transit", "All traffic is served over HTTPS/TLS."],
  ["Encryption at rest", "Stored data is encrypted by our infrastructure providers."],
  ["Access controls", "Least-privilege access; your data is scoped to your account and carrier."],
  ["Tenant isolation", "Carrier records are tenant-scoped so one carrier cannot access another carrier’s records."],
] as const;

export default function TrustPage() {
  return (
    <SiteShell>
      <div className="bg-[var(--bg)] text-[var(--fg)]">
        <section className="relative overflow-hidden border-b border-[var(--border)]">
          <div className="absolute inset-0 -z-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/photos/trust-fleet-yard.jpg"
              alt=""
              aria-hidden="true"
              width="2400"
              height="1600"
              className="h-full w-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg)]/75 via-[var(--bg)]/90 to-[var(--bg)]" />
          </div>
          <div className="mx-auto max-w-5xl px-6 py-20 text-center">
            <div className="mb-5 text-[11px] font-bold uppercase tracking-[.18em] text-[var(--accent)]">
              X3 COMPASS · TRUST CENTER
            </div>
            <h1 className="mb-5 text-[44px] font-extrabold leading-[1.05] tracking-tight sm:text-[58px]">
              Trust &amp; Security
            </h1>
            <p className="mx-auto max-w-2xl text-[17px] leading-relaxed text-[var(--fg-muted)]">
              Trust is the product. X3 Compass handles compliance-critical data for motor carriers,
              and X3 Fleet Safety, LLC is committed to protecting it.
            </p>
            <p className="mt-4 text-[12px] text-[var(--fg-faint)]">
              Effective July 18, 2026 · Operated by X3 Fleet Safety, LLC
            </p>
          </div>
        </section>

        <article className="mx-auto max-w-4xl px-6 py-16">
          <section className="mb-12" aria-labelledby="data-protection">
            <h2 id="data-protection" className="mb-5 text-[26px] font-extrabold">Data protection</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {safeguards.map(([title, detail]) => (
                <div key={title} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                  <h3 className="mb-2 text-[15px] font-extrabold text-[var(--fg)]">{title}</h3>
                  <p className="text-[14px] leading-relaxed text-[var(--fg-muted)]">{detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-12" aria-labelledby="infrastructure">
            <h2 id="infrastructure" className="mb-4 text-[26px] font-extrabold">Infrastructure</h2>
            <p className="text-[15px] leading-relaxed text-[var(--fg-muted)]">
              The Service uses Cloudflare for edge hosting and network protection, managed database
              providers for application records, Stripe for payment processing, and Anthropic for AI
              processing. X3 Compass does not store payment-card numbers itself. Service providers
              receive only the information needed to perform their contracted function.
            </p>
          </section>

          <section className="mb-12" aria-labelledby="ai-honestly">
            <h2 id="ai-honestly" className="mb-4 text-[26px] font-extrabold">AI, honestly</h2>
            <p className="text-[15px] leading-relaxed text-[var(--fg-muted)]">
              Compass grounds compliance answers in published regulations and a curated corpus and
              includes controlling citations so an operator can verify the source. AI output is
              decision support—not legal advice or a regulatory determination. X3 never guarantees an
              audit rating, DataQ removal, enforcement result, or agency determination.
            </p>
          </section>

          <section className="mb-12" aria-labelledby="reliability">
            <h2 id="reliability" className="mb-4 text-[26px] font-extrabold">Reliability</h2>
            <p className="text-[15px] leading-relaxed text-[var(--fg-muted)]">
              X3 Compass uses distributed edge infrastructure, automated service checks, controlled
              releases, audit logging, security headers, and rate limits on sensitive endpoints. We
              investigate service exceptions and security events through documented response procedures.
            </p>
          </section>

          <section className="mb-12" aria-labelledby="data-control">
            <h2 id="data-control" className="mb-4 text-[26px] font-extrabold">Your data, your control</h2>
            <p className="text-[15px] leading-relaxed text-[var(--fg-muted)]">
              Carriers retain ownership of the documents and records they upload. Access, export,
              correction, retention, and deletion requests are handled subject to applicable DOT and
              legal retention requirements. See the{" "}
              <Link href="/privacy" className="font-semibold text-[var(--accent)] hover:underline">Privacy Policy</Link>
              {" "}and{" "}
              <Link href="/terms" className="font-semibold text-[var(--accent)] hover:underline">Terms of Service</Link>.
            </p>
          </section>

          <section className="mb-12" aria-labelledby="disclosure">
            <h2 id="disclosure" className="mb-4 text-[26px] font-extrabold">Responsible disclosure</h2>
            <p className="text-[15px] leading-relaxed text-[var(--fg-muted)]">
              If you believe you found a security issue, email{" "}
              <a href="mailto:security@x3compass.com" className="font-semibold text-[var(--accent)] hover:underline">
                security@x3compass.com
              </a>
              {" "}with the affected surface, reproduction steps, and potential impact. Please avoid
              accessing customer data and allow us a reasonable opportunity to investigate before public disclosure.
            </p>
          </section>

          <aside className="rounded-2xl border border-amber-400/40 bg-amber-400/5 p-6 text-[14px] leading-relaxed text-amber-100">
            <strong className="text-amber-300">Not legal advice · Not an FMCSA determination.</strong>{" "}
            X3 Compass is compliance decision-support software provided by X3 Fleet Safety, LLC. It is
            not a law firm, does not provide legal advice, and is not affiliated with FMCSA, USDOT, or
            any government agency. Always verify against the current controlling regulation.
          </aside>
        </article>
      </div>
    </SiteShell>
  );
}
