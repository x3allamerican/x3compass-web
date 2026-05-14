import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["italic", "normal"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "X3 Compass — AI Safety Director for fleets",
  description:
    "An AI Safety Director, or a real one. Both work. 12 specialized brains, 300 FMCSA skills, CFR-cited answers. DIY at $25/driver or done-for-you at $50/driver.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen flex flex-col">
        <Topbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

function Topbar() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[color:var(--cream)]/85 border-b border-[color:var(--hairline)]">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 grid place-items-center bg-[color:var(--red)] text-white font-black text-base rounded-md">
            X3
          </div>
          <div className="leading-tight">
            <div className="text-[color:var(--navy)] font-extrabold text-[15px] tracking-tight">
              X3 COMPASS
            </div>
            <div className="text-[10px] tracking-[.18em] text-[color:var(--red)] font-bold uppercase">
              AI Safety Director
            </div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-[14px] font-semibold text-[color:var(--ink-soft)]">
          <Link href="/" className="hover:text-[color:var(--navy)]">Home</Link>
          <Link href="/#services" className="hover:text-[color:var(--navy)]">Services</Link>
          <Link href="/app" className="hover:text-[color:var(--navy)]">Dashboard</Link>
          <Link href="/#skills" className="hover:text-[color:var(--navy)]">Skills</Link>
          <Link href="/#pricing" className="hover:text-[color:var(--navy)]">Pricing</Link>
          <Link href="/#faqs" className="hover:text-[color:var(--navy)]">FAQs</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/app"
            className="text-[14px] font-semibold text-[color:var(--ink-soft)] hover:text-[color:var(--navy)] hidden sm:block"
          >
            Sign in
          </Link>
          <Link href="/app" className="btn-red text-[14px] py-2 px-4">
            ★ Start free →
          </Link>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="bg-[color:var(--navy)] text-white/70 px-6 py-12">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 grid place-items-center bg-[color:var(--red)] text-white font-black text-base rounded-md">
                X3
              </div>
              <div className="text-white font-extrabold tracking-tight">
                X3 COMPASS
              </div>
            </div>
            <p className="text-[13px] text-white/60 max-w-xs">
              The AI Safety Director for motor carriers running 1–100 power
              units. CFR-grounded answers, audit-ready files, daily compliance
              digest.
            </p>
          </div>
          <div>
            <h4 className="text-white text-[12px] font-bold tracking-widest uppercase mb-3">
              Product
            </h4>
            <ul className="space-y-2 text-[14px]">
              <li><Link href="/#services" className="hover:text-white">Twelve brains</Link></li>
              <li><Link href="/app" className="hover:text-white">Dashboard</Link></li>
              <li><Link href="/#skills" className="hover:text-white">300 skills</Link></li>
              <li><Link href="/hazmat" className="hover:text-white">Hazmat Center</Link></li>
              <li><Link href="/#pricing" className="hover:text-white">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white text-[12px] font-bold tracking-widest uppercase mb-3">
              Resources
            </h4>
            <ul className="space-y-2 text-[14px]">
              <li><Link href="/#faqs" className="hover:text-white">FAQ</Link></li>
              <li><Link href="/#how" className="hover:text-white">How it works</Link></li>
              <li>
                <a
                  href="https://github.com/x3fleetsafety/skills"
                  target="_blank"
                  rel="noopener"
                  className="hover:text-white"
                >
                  Skills on GitHub
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white text-[12px] font-bold tracking-widest uppercase mb-3">
              Company
            </h4>
            <ul className="space-y-2 text-[14px]">
              <li><Link href="#" className="hover:text-white">About</Link></li>
              <li><Link href="#" className="hover:text-white">Partners</Link></li>
              <li><Link href="#" className="hover:text-white">Security</Link></li>
              <li><a href="mailto:joshua@x3compass.com" className="hover:text-white">Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 pt-6 flex flex-wrap justify-between gap-3 text-[12px] text-white/50">
          <span>© 2026 X3 Fleet Safety LLC. All rights reserved.</span>
          <span>Built for fleets too small for a full-time Safety Director.</span>
        </div>
      </div>
    </footer>
  );
}
