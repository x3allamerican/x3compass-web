import Link from "next/link";
import SiteShell from "@/components/SiteShell";

export const metadata = {
  title: "Accessibility Statement — X3 Compass",
  description: "X3 Compass accessibility commitment, WCAG 2.1 AA conformance, and how to request accommodations.",
};

export default function Accessibility() {
  return (
    <SiteShell>
      <div className="bg-[#000000] text-white">
        {/* HERO */}
        <section className="max-w-4xl mx-auto px-6 pt-16 pb-10 text-center">
          <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[#16C7FF] mb-4">
            LEGAL · ACCESSIBILITY
          </div>
          <h1 className="text-[40px] sm:text-[54px] font-extrabold text-white tracking-tight leading-[1.05] mb-4">
            Accessibility <span className="serif-italic" style={{ color: "#16C7FF" }}>Statement</span>
          </h1>
          <p className="text-[14px] text-white/55">
            Last updated: June 3, 2026
          </p>
        </section>

        <article className="max-w-4xl mx-auto px-6 pb-24 text-[15px] text-white/75 leading-relaxed">
          <h2 className="text-[22px] sm:text-[26px] font-extrabold text-white mb-4">Our commitment</h2>
          <p className="mb-8">
            X3 Compass is committed to making our website and software accessible to people with disabilities, including those who use assistive technologies such as screen readers, screen magnification, and voice recognition. We aim to conform to the{" "}
            <a href="https://www.w3.org/WAI/standards-guidelines/wcag/" target="_blank" rel="noopener noreferrer" className="text-[#16C7FF] hover:underline">
              Web Content Accessibility Guidelines (WCAG) 2.1, Level AA
            </a>.
          </p>

          <h2 className="text-[22px] sm:text-[26px] font-extrabold text-white mb-4">What we have done</h2>
          <ul className="list-disc pl-6 space-y-2 mb-8">
            <li>Semantic HTML and ARIA labeling across navigation, forms, and interactive elements</li>
            <li>Keyboard navigation support on all primary user flows</li>
            <li>Color contrast tested against WCAG 2.1 AA at 4.5:1 for body text</li>
            <li>Alt text on all informational images</li>
            <li>Form labels and error messages tied to inputs via <code className="text-[#16C7FF] font-mono text-[13px]">for</code> and <code className="text-[#16C7FF] font-mono text-[13px]">aria-describedby</code></li>
            <li>Skip-to-main-content link on every page for keyboard users</li>
            <li>Continuous axe-core accessibility scans gated in CI to block critical regressions</li>
          </ul>

          <h2 className="text-[22px] sm:text-[26px] font-extrabold text-white mb-4">Known limitations</h2>
          <p className="mb-8">
            Some legacy PDF documents (e.g., archived FMCSA enforcement memos in our Resources section) may not yet meet WCAG 2.1 AA. We are working through these. If you encounter content you cannot access, please let us know — we will provide an alternative format within 5 business days.
          </p>

          <h2 className="text-[22px] sm:text-[26px] font-extrabold text-white mb-4">Feedback and contact</h2>
          <p className="mb-3">
            If you experience an accessibility barrier on x3compass.com or app.x3compass.com, please contact us:
          </p>
          <ul className="list-disc pl-6 space-y-2 mb-8">
            <li>Email: <a href="mailto:joshua@x3compass.com" className="text-[#16C7FF] hover:underline">joshua@x3compass.com</a></li>
            <li>Phone: <a href="tel:+17342193836" className="text-[#16C7FF] hover:underline">(734) 219-3836</a></li>
            <li>Mail: X3 Fleet Safety, LLC · Howell, Michigan</li>
          </ul>
          <p className="mb-8">
            We will respond within 2 business days and aim to resolve verified barriers within 30 days.
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
