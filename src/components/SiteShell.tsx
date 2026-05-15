import Link from "next/link";

export default function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#0A1929] text-white">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0A1929]/85 border-b border-[#1E3556]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div
              className="w-9 h-9 grid place-items-center font-black text-base rounded-md text-[#0A1929]"
              style={{
                background: "linear-gradient(135deg, #22D3EE, #06B6D4)",
                boxShadow: "0 4px 12px rgba(34, 211, 238, 0.32)",
              }}
            >
              X3
            </div>
            <div className="leading-tight">
              <div className="text-white font-extrabold text-[15px] tracking-tight">X3 COMPASS</div>
              <div className="text-[10px] tracking-[.18em] text-[#22D3EE] font-bold uppercase">
                AI Safety Director
              </div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-[14px] font-semibold text-white/65">
            <Link href="/" className="hover:text-white">Home</Link>
            <Link href="/#services" className="hover:text-white">Services</Link>
            <Link href="/app" className="hover:text-white">App</Link>
            <Link href="/#skills" className="hover:text-white">Skills</Link>
            <Link href="/#pricing" className="hover:text-white">Pricing</Link>
            <Link href="/hazmat" className="hover:text-white">Hazmat</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/app" className="text-[14px] font-semibold text-white/65 hover:text-white hidden sm:block">
              Sign in
            </Link>
            <Link
              href="/app"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-bold text-[#0A1929]"
              style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)", boxShadow: "0 4px 12px rgba(34, 211, 238, 0.32)" }}
            >
              ★ Start free →
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-[#091525] border-t border-[#1E3556] text-white/65 px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-9 h-9 grid place-items-center font-black text-base rounded-md text-[#0A1929]"
                  style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)" }}
                >
                  X3
                </div>
                <div className="text-white font-extrabold tracking-tight">X3 COMPASS</div>
              </div>
              <p className="text-[13px] text-white/55 max-w-xs">
                The AI Safety Director for motor carriers running 1–100 power units. CFR-grounded answers, audit-ready files, daily compliance digest.
              </p>
            </div>
            <div>
              <h4 className="text-white text-[12px] font-bold tracking-widest uppercase mb-3">Product</h4>
              <ul className="space-y-2 text-[14px]">
                <li><Link href="/#services" className="hover:text-white">Twelve brains</Link></li>
                <li><Link href="/app" className="hover:text-white">App / Dashboard</Link></li>
                <li><Link href="/#skills" className="hover:text-white">300 skills</Link></li>
                <li><Link href="/hazmat" className="hover:text-white">Hazmat Center</Link></li>
                <li><Link href="/#pricing" className="hover:text-white">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white text-[12px] font-bold tracking-widest uppercase mb-3">Resources</h4>
              <ul className="space-y-2 text-[14px]">
                <li><Link href="/#faqs" className="hover:text-white">FAQ</Link></li>
                <li><Link href="/#how" className="hover:text-white">How it works</Link></li>
                <li>
                  <a href="https://github.com/x3fleetsafety/skills" target="_blank" rel="noopener" className="hover:text-white">
                    Skills on GitHub
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white text-[12px] font-bold tracking-widest uppercase mb-3">Company</h4>
              <ul className="space-y-2 text-[14px]">
                <li><Link href="#" className="hover:text-white">About</Link></li>
                <li><Link href="#" className="hover:text-white">Partners</Link></li>
                <li><Link href="#" className="hover:text-white">Security</Link></li>
                <li><a href="mailto:joshua@x3compass.com" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[#1E3556] pt-6 flex flex-wrap justify-between gap-3 text-[12px] text-white/45">
            <span>© 2026 X3 Fleet Safety LLC. All rights reserved.</span>
            <span>Built for fleets too small for a full-time Safety Director.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
