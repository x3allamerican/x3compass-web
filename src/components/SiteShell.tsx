import Link from "next/link";
import TopNav from "@/components/TopNav";
import BrandMark from "@/components/BrandMark";

export default function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#000000] text-white">
      <TopNav />
      {/* Spacer: header is fixed (h-24 = 96px), so pad content so it doesn't slide under it */}
      <div className="flex-1 pt-24">{children}</div>

      <footer className="bg-[#091525] border-t border-[#1E3556] text-white/65 px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="mb-4">
                <BrandMark variant="compass" size="md" />
              </div>
              <p className="text-[13px] text-white/55 max-w-xs mb-3">
                The AI Safety Director for motor carriers running 1–100 power units. CFR-grounded answers, audit-ready files, daily compliance digest.
              </p>
              <p className="text-[12px] text-white/40">
                X3 Fleet Safety, LLC<br />
                <a href="mailto:joshua@x3fleetsafety.com" className="hover:text-white">joshua@x3fleetsafety.com</a><br />
                <a href="mailto:mike@x3fleetsafety.com" className="hover:text-white">mike@x3fleetsafety.com</a>
              </p>
            </div>
            <div>
              <h4 className="text-white text-[12px] font-bold tracking-widest uppercase mb-3">Product</h4>
              <ul className="space-y-2 text-[14px]">
                <li><Link href="/" className="hover:text-white">Home</Link></li>
                <li><Link href="/#services" className="hover:text-white">Services</Link></li>
                <li><Link href="/#skills" className="hover:text-white">Skills</Link></li>
                <li><Link href="/#pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/#hazmat" className="hover:text-white">Hazmat</Link></li>
                <li><Link href="/#faqs" className="hover:text-white">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white text-[12px] font-bold tracking-widest uppercase mb-3">Resources</h4>
              <ul className="space-y-2 text-[14px]">
                <li><Link href="/app/ask" className="hover:text-white">AI Concierge</Link></li>
                <li>
                  <a href="https://github.com/x3fleetsafety/skills" target="_blank" rel="noopener" className="hover:text-white">
                    Skills on GitHub
                  </a>
                </li>
                <li><Link href="/partners" className="hover:text-white">Partner Program</Link></li>
                <li><Link href="https://app.x3compass.com/signin" className="hover:text-white">Sign In</Link></li>
                <li><a href="mailto:joshua@x3fleetsafety.com" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white text-[12px] font-bold tracking-widest uppercase mb-3">Legal</h4>
              <ul className="space-y-2 text-[14px]">
                <li><Link href="/legal" className="hover:text-white">Legal Index</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/cookies" className="hover:text-white">Cookie Policy</Link></li>
                <li><Link href="/accessibility" className="hover:text-white">Accessibility</Link></li>
                <li><Link href="/your-privacy-choices" className="hover:text-white">Your Privacy Choices</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[#1E3556] pt-6 flex flex-wrap justify-between gap-3 text-[12px] text-white/45">
            <span>© 2026 X3 Fleet Safety, LLC · A Michigan limited liability company · operating X3 Compass. All rights reserved.</span>
            <span>Built for fleets too small for a full-time Safety Director.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
