import Link from "next/link";
import SiteShell from "@/components/SiteShell";

export const metadata = {
  title: "Your Privacy Choices — X3 Compass",
  description: "CCPA / CPRA-mandated disclosure of X3 Compass privacy practices and how to exercise your rights.",
};

export default function YourPrivacyChoices() {
  return (
    <SiteShell>
      <div className="bg-[#000000] text-white">
        {/* HERO */}
        <section className="max-w-4xl mx-auto px-6 pt-16 pb-10 text-center">
          <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[#16C7FF] mb-4">
            LEGAL · YOUR PRIVACY CHOICES
          </div>
          <h1 className="text-[40px] sm:text-[54px] font-extrabold text-white tracking-tight leading-[1.05] mb-4">
            Your privacy <span className="serif-italic" style={{ color: "#16C7FF" }}>choices.</span>
          </h1>
          <p className="text-[14px] text-white/55">
            Last updated: June 3, 2026
          </p>
        </section>

        <article className="max-w-4xl mx-auto px-6 pb-24 text-[15px] text-white/75 leading-relaxed">
          <h2 className="text-[22px] sm:text-[26px] font-extrabold text-white mb-4">
            We do not sell or share your personal information
          </h2>
          <p className="mb-6">
            X3 Compass does <strong className="text-white">not</strong> sell or share personal information as those terms are defined under the California Consumer Privacy Act (CCPA), the California Privacy Rights Act (CPRA), or similar state privacy laws including the Colorado Privacy Act, Connecticut Data Privacy Act, Virginia Consumer Data Protection Act, Texas Data Privacy and Security Act, and Florida Digital Bill of Rights.
          </p>
          <p className="mb-8">
            We do not run advertising trackers, behavioral profiling pixels, or cross-context behavioral advertising. We do share information with service providers (such as Supabase, Stripe, Resend, Cloudflare, Sentry, and our compliance partners like Checkr) strictly to operate the X3 Compass service for you — this is not &quot;selling&quot; or &quot;sharing&quot; under CCPA/CPRA.
          </p>

          <h2 className="text-[22px] sm:text-[26px] font-extrabold text-white mb-4">Other privacy rights</h2>
          <p className="mb-3">You may have rights to:</p>
          <ul className="list-disc pl-6 space-y-2 mb-8">
            <li><strong className="text-white">Access</strong> — request a copy of the personal information we hold about you</li>
            <li><strong className="text-white">Correct</strong> — request correction of inaccurate information</li>
            <li><strong className="text-white">Delete</strong> — request deletion (subject to DOT regulatory retention obligations under 49 CFR § 391.51, § 382.401, and others)</li>
            <li><strong className="text-white">Portability</strong> — request your information in a portable format</li>
            <li><strong className="text-white">Opt out of automated decision-making</strong> — request a human review of AI-assisted decisions</li>
          </ul>

          <h2 className="text-[22px] sm:text-[26px] font-extrabold text-white mb-4">How to exercise your rights</h2>
          <p className="mb-6">
            Email{" "}
            <a href="mailto:joshua@x3compass.com" className="text-[#16C7FF] hover:underline">joshua@x3compass.com</a>{" "}
            from the email address associated with your X3 Compass account or carrier record. We will respond within 45 days (subject to up to one 45-day extension for complex requests).
          </p>
          <p className="mb-8">
            You may also authorize an agent to make a request on your behalf. The agent must provide a signed authorization or power of attorney.
          </p>

          <h2 className="text-[22px] sm:text-[26px] font-extrabold text-white mb-4">Global Privacy Control</h2>
          <p className="mb-8">
            Our site honors the{" "}
            <a href="https://globalprivacycontrol.org/" target="_blank" rel="noopener noreferrer" className="text-[#16C7FF] hover:underline">
              Global Privacy Control (GPC)
            </a>{" "}
            signal. When enabled, we automatically apply opt-out preferences across our site.
          </p>

          <h2 className="text-[22px] sm:text-[26px] font-extrabold text-white mb-4">Verification</h2>
          <p className="mb-8">
            To protect your information, we verify each request by matching the email used to make the request against the email on the account or carrier record. For sensitive requests (deletion) we may also ask for a recent invoice number or DOT number.
          </p>

          <div className="border-t border-[#1E3556] mt-12 pt-6 text-[12px] text-white/45 flex flex-wrap justify-between gap-3">
            <span>© 2026 X3 Fleet Safety, LLC · operating X3 Compass</span>
            <span>
              <Link href="/privacy" className="hover:text-white">Privacy Policy</Link> ·{" "}
              <Link href="/legal" className="hover:text-white">Legal Index</Link>
            </span>
          </div>
        </article>
      </div>
    </SiteShell>
  );
}
