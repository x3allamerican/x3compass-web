import Link from "next/link";
import SiteShell from "@/components/SiteShell";

export const metadata = {
  title: "Legal — X3 Compass",
  description: "X3 Compass legal documents — Terms, Privacy, Cookies, Accessibility, Your Privacy Choices.",
};

const DOCS = [
  {
    icon: "📄",
    title: "Terms of Service",
    desc: "The master contract between you and X3 Compass.",
    href: "/terms",
  },
  {
    icon: "🔒",
    title: "Privacy Policy",
    desc: "What data we collect, how we use it, and your rights.",
    href: "/privacy",
  },
  {
    icon: "🍪",
    title: "Cookie Policy",
    desc: "What cookies we set and how to manage them.",
    href: "/cookies",
  },
  {
    icon: "♿",
    title: "Accessibility Statement",
    desc: "Our WCAG 2.1 AA commitment and how to request accommodations.",
    href: "/accessibility",
  },
  {
    icon: "🛡️",
    title: "Your Privacy Choices",
    desc: "CPRA-mandated disclosure of your privacy rights.",
    href: "/your-privacy-choices",
  },
];

export default function LegalIndex() {
  return (
    <SiteShell>
      <div className="bg-[#000000] text-white">
        {/* HERO */}
        <section className="max-w-4xl mx-auto px-6 pt-16 pb-12 text-center">
          <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[#16C7FF] mb-4">
            LEGAL
          </div>
          <h1 className="text-[44px] sm:text-[60px] font-extrabold text-white tracking-tight leading-[1.05] mb-4">
            Everything you need.{" "}
            <span className="serif-italic" style={{ color: "#16C7FF" }}>One place.</span>
          </h1>
          <p className="text-[17px] text-white/65">
            These documents govern your use of x3compass.com, app.x3compass.com, and the X3 Compass service.
          </p>
        </section>

        {/* DOC GRID */}
        <section className="max-w-4xl mx-auto px-6 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {DOCS.map((d) => (
              <Link
                key={d.href}
                href={d.href}
                className="group block bg-[#000000] border border-[#1E3556] rounded-xl p-5 hover:border-[#16C7FF]/40 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <span className="text-[28px] leading-none flex-shrink-0">{d.icon}</span>
                  <div>
                    <h3 className="text-[16px] font-bold text-white mb-1 group-hover:text-[#16C7FF] transition-colors">
                      {d.title}
                    </h3>
                    <p className="text-[14px] text-white/65 leading-relaxed">{d.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* PAYING CARRIERS */}
        <section className="max-w-4xl mx-auto px-6 pb-12">
          <div className="bg-[#000000] border border-[#1E3556] rounded-xl p-6">
            <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[#16C7FF] mb-3">
              FOR PAYING CARRIERS
            </div>
            <p className="text-[15px] text-white/75 leading-relaxed mb-2">
              When you subscribe, you also sign the Master Subscription Agreement, which includes a Data Processing Addendum, Order Form, Service Level Agreement, and Security Exhibit. Active customers can access these from inside the app at{" "}
              <Link href="/app" className="text-[#16C7FF] font-bold hover:underline">app.x3compass.com</Link>.
            </p>
          </div>
        </section>

        {/* DOT RETENTION */}
        <section className="max-w-4xl mx-auto px-6 pb-12">
          <div className="bg-[#000000] border border-[#1E3556] rounded-xl p-6">
            <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[#16C7FF] mb-3">
              DOT DATA RETENTION
            </div>
            <p className="text-[15px] text-white/75 leading-relaxed">
              X3 Compass retains regulated DOT records per federal regulation — 49 CFR §§ 391.51, 382.401, 395.8, 396.3, and the IFTA Articles of Agreement. See the{" "}
              <Link href="/privacy#retention" className="text-[#16C7FF] font-bold hover:underline">Data Retention section</Link>{" "}
              of the Privacy Policy.
            </p>
          </div>
        </section>

        {/* QUESTIONS */}
        <section className="max-w-4xl mx-auto px-6 pb-24">
          <div className="bg-[#000000] border border-[#1E3556] rounded-xl p-6 text-center">
            <h2 className="text-[20px] font-extrabold text-white mb-2">Questions?</h2>
            <p className="text-[15px] text-white/65">
              Email <a href="mailto:joshua@x3compass.com" className="text-[#16C7FF] font-bold hover:underline">joshua@x3compass.com</a>
              {" "}or call <a href="tel:+17342193836" className="text-[#16C7FF] font-bold hover:underline">(734) 219-3836</a>.
            </p>
            <p className="text-[12px] text-white/45 mt-4 italic">
              This index page is informational. The linked documents are the binding instruments. Last updated June 3, 2026.
            </p>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
