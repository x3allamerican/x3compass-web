import Link from "next/link";
import SiteShell from "@/components/SiteShell";

export const metadata = {
  title: "Cookie Policy — X3 Compass",
  description: "What cookies X3 Compass sets on x3compass.com and app.x3compass.com and how to control them.",
};

const COOKIES = [
  { name: "__cf_bm", purpose: "Cloudflare bot management — protects against automated abuse", tier: "Strictly necessary" },
  { name: "sb-access-token, sb-refresh-token", purpose: "Supabase Auth — keeps you signed in", tier: "Strictly necessary" },
  { name: "x3-cookie-consent", purpose: "Remembers your cookie banner choice", tier: "Strictly necessary" },
  { name: "x3-session-*", purpose: "Session state for the AI Compliance Assistant", tier: "Strictly necessary" },
  { name: "x3-theme", purpose: "Remembers your dark/light theme preference", tier: "Strictly necessary" },
];

export default function Cookies() {
  return (
    <SiteShell>
      <div className="bg-[#000000] text-white">
        {/* HERO */}
        <section className="max-w-4xl mx-auto px-6 pt-16 pb-10 text-center">
          <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[#16C7FF] mb-4">
            LEGAL · COOKIE POLICY
          </div>
          <h1 className="text-[40px] sm:text-[54px] font-extrabold text-white tracking-tight leading-[1.05] mb-4">
            Cookie <span className="serif-italic" style={{ color: "#16C7FF" }}>Policy</span>
          </h1>
          <p className="text-[14px] text-white/55">
            Last updated: June 3, 2026
          </p>
        </section>

        <article className="max-w-4xl mx-auto px-6 pb-24 text-[15px] text-white/75 leading-relaxed">
          <p className="mb-8">
            This page describes what cookies and similar technologies X3 Compass uses on x3compass.com and app.x3compass.com, and how to control them.
          </p>

          <h2 className="text-[22px] sm:text-[26px] font-extrabold text-white mb-4">What cookies we set</h2>

          <div className="overflow-x-auto mb-6">
            <table className="w-full text-[14px] border border-[#1E3556] rounded-lg overflow-hidden">
              <thead className="bg-[#000000]">
                <tr>
                  <th className="text-left p-3 text-white border-b border-[#1E3556]">Cookie</th>
                  <th className="text-left p-3 text-white border-b border-[#1E3556]">Purpose</th>
                  <th className="text-left p-3 text-white border-b border-[#1E3556]">Tier</th>
                </tr>
              </thead>
              <tbody>
                {COOKIES.map((c) => (
                  <tr key={c.name} className="border-b border-[#1E3556] last:border-0">
                    <td className="p-3 text-white/75 font-mono text-[13px]">{c.name}</td>
                    <td className="p-3 text-white/75">{c.purpose}</td>
                    <td className="p-3 text-white/75">{c.tier}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mb-8">
            X3 Compass does <strong className="text-white">not</strong> use third-party advertising cookies, ad tracking pixels, or cross-site behavioral tracking. We do not &quot;sell&quot; or &quot;share&quot; personal information as those terms are defined under the California Consumer Privacy Act.
          </p>

          <h2 className="text-[22px] sm:text-[26px] font-extrabold text-white mb-4">Managing cookies</h2>
          <p className="mb-8">
            You can clear cookies any time via your browser settings. You can also clear your X3 banner choice by deleting the <code className="text-[#16C7FF] font-mono text-[13px]">x3-cookie-consent</code> cookie or local storage entry. Note that clearing the auth cookies signs you out of the app.
          </p>

          <h2 className="text-[22px] sm:text-[26px] font-extrabold text-white mb-4">Global Privacy Control</h2>
          <p className="mb-8">
            Our site honors the{" "}
            <a href="https://globalprivacycontrol.org/" target="_blank" rel="noopener noreferrer" className="text-[#16C7FF] hover:underline">
              Global Privacy Control (GPC)
            </a>{" "}
            signal. When GPC is enabled on your browser, we automatically apply the &quot;essential only&quot; cookie setting.
          </p>

          <h2 className="text-[22px] sm:text-[26px] font-extrabold text-white mb-4">Questions</h2>
          <p className="mb-8">
            Email{" "}
            <a href="mailto:joshua@x3compass.com" className="text-[#16C7FF] hover:underline">joshua@x3compass.com</a>.
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
