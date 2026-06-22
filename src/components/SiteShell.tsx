import Link from "next/link";
import TopNav from "@/components/TopNav";
import BrandMark from "@/components/BrandMark";

export default function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#0A1929] text-white">
      <TopNav />
      <main className="flex-1">{children}</main>

      <footer className="bg-[#091525] border-t border-[#1E3556] text-white/65 px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="mb-4">
                <BrandMark variant="compass" size="md" />
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
                <li><Link href="/#skills" className="hover:text-white">67,750+ skills</Link></li>
                <li><Link href="/hazmat" className="hover:text-white">Hazmat Center</Link></li>
                <li><Link href="/#pricing" className="hover:text-white">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white text-[12px] font-bold tracking-widest uppercase mb-3">Resources</h4>
              <ul className="space-y-2 text-[14px]">
                <li><Link href="/faq" className="hover:text-white">FAQ</Link></li>
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
