import type { Metadata } from "next";
import Link from "next/link";
import SiteShell from "@/components/SiteShell";

export const metadata: Metadata = {
  title: "Trust & Security · X3 Compass",
  description:
    "How X3 Compass keeps your fleet's compliance data isolated, encrypted, and grounded in the actual CFR — plus our subprocessors, retention, and honest boundaries.",
  alternates: { canonical: "https://x3compass.com/trust/" },
};

const PILLARS: { title: string; body: string }[] = [
  {
    title: "Your data is isolated to your carrier",
    body: "Every record — drivers, documents, inspections, tests — is scoped to your carrier and enforced at the database layer with row-level security. A signed-in user can only ever read or write the carrier they belong to. There is no shared tenant table you could be accidentally shown.",
  },
  {
    title: "Encrypted in transit and at rest",
    body: "All traffic runs over TLS. Uploaded documents are stored in object storage encrypted at rest, behind short-lived, carrier-scoped signed URLs — a link to one carrier's file can't be reused for another's.",
  },
  {
    title: "Grounded in the real CFR",
    body: "Compass answers cite the regulation they're based on, round-tripped against the eCFR text rather than paraphrased from memory. When there isn't a high-confidence, CFR-rooted answer, Compass says so and points you to an X3 advisor or to FMCSA directly.",
  },
  {
    title: "You can leave with your data",
    body: "Your source records live in your database, not locked inside a report. Audit Export produces a single indexed bundle of your DQ files, inspections, accidents, D&A tests, and training certs whenever you want it.",
  },
];

const SUBPROCESSORS: { name: string; purpose: string }[] = [
  { name: "Cloudflare", purpose: "Edge hosting, WAF, and encrypted object storage (R2)" },
  { name: "Supabase", purpose: "Application database and authentication (row-level security enforced)" },
  { name: "Stripe", purpose: "Subscription billing (we never see or store full card numbers)" },
  { name: "Checkr", purpose: "Background checks, when you order them" },
  { name: "SambaSafety", purpose: "Motor vehicle record (MVR) pulls, when you order them" },
  { name: "Resend", purpose: "Transactional and compliance-reminder email" },
  { name: "Twilio", purpose: "SMS alerts, where enabled" },
  { name: "Anthropic", purpose: "The AI model behind Compass answers" },
];

export default function TrustPage() {
  return (
    <SiteShell>
      <div className="bg-[#000000] text-white">
        <section className="max-w-4xl mx-auto px-6 pt-16 pb-12 text-center">
          <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[#16C7FF] mb-4">TRUST &amp; SECURITY</div>
          <h1 className="text-[44px] sm:text-[60px] font-extrabold tracking-tight leading-[1.05] mb-4">
            Your compliance data,{" "}
            <span className="serif-italic" style={{ color: "#16C7FF" }}>handled straight.</span>
          </h1>
          <p className="text-[17px] text-white/65 max-w-2xl mx-auto">
            You&apos;re trusting us with driver records, medical certificates, and test results. Here is exactly how that data is isolated, protected, and grounded — in plain language.
          </p>
        </section>

        <div className="max-w-4xl mx-auto px-6 pb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {PILLARS.map((p) => (
            <section key={p.title} className="rounded-2xl border border-[#1E3556] bg-[#0C1A30] p-6">
              <h2 className="text-[17px] font-extrabold text-white mb-2">{p.title}</h2>
              <p className="text-[14px] text-white/70 leading-relaxed">{p.body}</p>
            </section>
          ))}
        </div>

        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-[11px] tracking-[.18em] uppercase font-bold text-[#16C7FF]">SUBPROCESSORS</span>
            <span className="flex-1 h-px bg-[#1E3556]" />
          </div>
          <p className="text-[14px] text-white/60 mb-6 max-w-2xl">
            The third parties we rely on to run the service. We share only what each one needs to do its job, and never sell your data.
          </p>
          <div className="rounded-2xl border border-[#1E3556] overflow-hidden">
            {SUBPROCESSORS.map((s, i) => (
              <div key={s.name} className={`flex items-start gap-4 px-5 py-4 ${i % 2 ? "bg-[#0C1A30]" : "bg-[#091525]"}`}>
                <div className="w-40 flex-shrink-0 text-[14px] font-bold text-white">{s.name}</div>
                <div className="text-[13px] text-white/65 leading-relaxed">{s.purpose}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-[11px] tracking-[.18em] uppercase font-bold text-[#16C7FF]">HONEST BOUNDARIES</span>
            <span className="flex-1 h-px bg-[#1E3556]" />
          </div>
          <div className="rounded-2xl border border-[#1E3556] bg-[#0C1A30] p-6 space-y-3 text-[14px] text-white/70 leading-relaxed">
            <p>Compass cites regulation and surfaces best practices. It is decision support — <strong className="text-white">not legal advice</strong> and not a substitute for an attorney or for FMCSA&apos;s own published interpretations.</p>
            <p>We tell you when an answer isn&apos;t confidently rooted in the CFR rather than guessing. Final compliance decisions — and the driver, vehicle, and audit records behind them — remain yours.</p>
            <p>Found a security concern? Email{" "}
              <a href="mailto:joshua@x3fleetsafety.com" className="text-[#16C7FF] font-bold">joshua@x3fleetsafety.com</a>{" "}
              and we&apos;ll respond quickly.</p>
          </div>
        </div>

        <section className="max-w-4xl mx-auto px-6 pb-24 text-center">
          <p className="text-[15px] text-white/70">
            Read our <Link href="/privacy" className="text-[#16C7FF] font-bold">Privacy Policy</Link> and{" "}
            <Link href="/terms" className="text-[#16C7FF] font-bold">Terms</Link>, or{" "}
            <Link href="/faq" className="text-[#16C7FF] font-bold">see the FAQ</Link>.
          </p>
        </section>
      </div>
    </SiteShell>
  );
}
