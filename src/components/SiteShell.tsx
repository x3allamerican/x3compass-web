import Link from "next/link";
import TopNav from "@/components/TopNav";

export default function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--fg)]">
      <TopNav />
      <main className="flex-1">{children}</main>

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
                <li><Link href="#" className="hover:text-[var(--fg)]">About</Link></li>
                <li><Link href="#" className="hover:text-[var(--fg)]">Partners</Link></li>
                <li><Link href="#" className="hover:text-[var(--fg)]">Security</Link></li>
                <li><a href="mailto:joshua@x3compass.com" className="hover:text-[var(--fg)]">Contact</a></li>
              </ul>
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
