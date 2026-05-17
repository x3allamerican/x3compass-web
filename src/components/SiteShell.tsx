import Link from "next/link";
import TopNav from "@/components/TopNav";

export default function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--fg)]">
      <a href="#main-content"
         className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-[var(--accent)] focus:text-[var(--accent-fg)] focus:font-bold focus:text-[13px] focus:shadow-lg">
        Skip to main content
      </a>
      <TopNav />
      <main id="main-content" className="flex-1">{children}</main>

      <footer className="bg-[var(--bg-3)] border-t border-[var(--border)] text-[var(--fg-muted)] px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-9 h-9 grid place-items-center font-black text-base rounded-md text-[var(--bg)]"
                  style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)" }}
                >
                  X3
                </div>
                <div className="text-[var(--fg)] font-extrabold tracking-tight">X3 COMPASS</div>
              </div>
              <p className="text-[13px] text-[var(--fg-muted)] max-w-xs">
                The AI Safety Director for motor carriers running 1–100 power units. CFR-grounded answers, audit-ready files, daily compliance digest.
              </p>
            </div>
            <div>
              <h4 className="text-[var(--fg)] text-[12px] font-bold tracking-widest uppercase mb-3">Product</h4>
              <ul className="space-y-2 text-[14px]">
                <li><Link href="/#services" className="hover:text-[var(--fg)]">Twelve brains</Link></li>
                <li><Link href="/app" className="hover:text-[var(--fg)]">App / Dashboard</Link></li>
                <li><Link href="/#skills" className="hover:text-[var(--fg)]">300 skills</Link></li>
                <li><Link href="/hazmat" className="hover:text-[var(--fg)]">Hazmat Center</Link></li>
                <li><Link href="/#pricing" className="hover:text-[var(--fg)]">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[var(--fg)] text-[12px] font-bold tracking-widest uppercase mb-3">Resources</h4>
              <ul className="space-y-2 text-[14px]">
                <li><Link href="/faq" className="hover:text-[var(--fg)]">FAQ</Link></li>
                <li><Link href="/trust" className="hover:text-[var(--fg)]">Trust & Transparency</Link></li>
                <li><Link href="/case-studies/sample" className="hover:text-[var(--fg)]">Sample audit walkthrough</Link></li>
                <li><Link href="/blog" className="hover:text-[var(--fg)]">Blog</Link></li>
                <li><Link href="/changelog" className="hover:text-[var(--fg)]">Changelog</Link></li>
                <li><Link href="/#how" className="hover:text-[var(--fg)]">How it works</Link></li>
                <li>
                  <a href="https://github.com/x3fleetsafety/skills" target="_blank" rel="noopener" className="hover:text-[var(--fg)]">
                    Skills on GitHub
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-[var(--fg)] text-[12px] font-bold tracking-widest uppercase mb-3">Company</h4>
              <ul className="space-y-2 text-[14px]">
                <li><Link href="/partners" className="hover:text-[var(--fg)]">Partner Program</Link></li>
                <li><Link href="/security" className="hover:text-[var(--fg)]">Security deep-dive</Link></li>
                <li><Link href="/trust" className="hover:text-[var(--fg)]">Security &amp; Privacy</Link></li>
                <li><a href="https://github.com/x3fleetsafety" target="_blank" rel="noreferrer" className="hover:text-[var(--fg)]">GitHub</a></li>
                <li><a href="mailto:joshua@x3compass.com" className="hover:text-[var(--fg)]">Contact</a></li>
              </ul>
            </div>
          </div>
          {/* Integration + trust row */}
          <div className="border-t border-[var(--border)] pt-8 pb-6">
            <div className="text-[10px] tracking-[.18em] uppercase font-bold text-[var(--fg-faint)] mb-4">
              Stack we built on
            </div>
            <div className="flex flex-wrap items-center gap-x-7 gap-y-3 mb-6">
              {[
                { name: "Stripe",     file: "stripe.svg",     w: 56 },
                { name: "Anthropic",  file: "anthropic.svg",  w: 32 },
                { name: "Supabase",   file: "supabase.svg",   w: 32 },
                { name: "Cloudflare", file: "cloudflare.svg", w: 48 },
                { name: "Resend",     file: "resend.svg",     w: 32 },
                { name: "Twilio",     file: "twilio.svg",     w: 64 },
                { name: "Checkr",     file: "checkr.svg",     w: 64 },
              ].map((p) => (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img key={p.name} src={`/logos/${p.file}`} alt={p.name} className="h-6 opacity-45 hover:opacity-90 transition-opacity"
                     style={{ width: p.w + "px", filter: "saturate(0)" }} />
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] text-[var(--fg-faint)]">
              <span>★ MC-authorized motor carrier owns Compass</span>
              <span className="opacity-30">·</span>
              <span>★ Attorney-reviewed TOS · DPA · Reseller</span>
              <span className="opacity-30">·</span>
              <span>★ 100+ skills open-source MIT</span>
              <span className="opacity-30">·</span>
              <span>★ TLS 1.3 · Supabase RLS · Cloudflare WAF</span>
            </div>
          </div>

          <div className="border-t border-[var(--border)] pt-6 flex flex-wrap justify-between gap-3 text-[12px] text-[var(--fg-faint)]">
            <span>© 2026 X3 Fleet Safety LLC. All rights reserved.</span>
            <span>Built for fleets too small for a full-time Safety Director.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
