"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string; icon: string };

const SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: "Main",
    items: [
      { href: "/app",             label: "Dashboard",       icon: "▦" },
      { href: "/app/drivers",     label: "Drivers",         icon: "👤" },
      { href: "/app/vehicles",    label: "Vehicles",        icon: "🚛" },
      { href: "/app/dq-files",    label: "DQ Files",        icon: "📁" },
      { href: "/app/accidents",   label: "Accidents",       icon: "🚨" },
      { href: "/app/inspections", label: "Inspections",     icon: "🔎" },
      { href: "/app/drug-alcohol",label: "Drug & Alcohol",  icon: "🧪" },
      { href: "/app/hos",         label: "HOS / ELD",       icon: "⏱" },
      { href: "/app/training",    label: "Training",        icon: "🎓" },
    ],
  },
  {
    title: "Compliance Trackers",
    items: [
      { href: "/app/mvr",          label: "MVR Tracker",         icon: "🪪" },
      { href: "/app/da-concierge", label: "D&A Concierge",       icon: "🧬" },
      { href: "/app/background",   label: "Background Tracker",  icon: "🛡" },
      { href: "/app/ifta",         label: "IFTA Concierge",      icon: "⛽" },
    ],
  },
  {
    title: "Advanced",
    items: [
      { href: "/app/ask",         label: "Ask Compass",   icon: "∞" },
      { href: "/hazmat",          label: "Hazmat Center", icon: "⚠️" },
      { href: "/app/audit-export",label: "Audit Export",  icon: "📄" },
      { href: "/app/settings",    label: "Settings",      icon: "⚙" },
    ],
  },
];

export default function AppShell({
  children,
  title,
  crumbs,
  actions,
}: {
  children: React.ReactNode;
  title?: string;
  crumbs?: string;
  actions?: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="bg-[#0A1929] min-h-screen text-white grid grid-cols-[240px_1fr] max-md:grid-cols-[64px_1fr]">
      {/* SIDEBAR */}
      <aside className="border-r border-[#1E3556] bg-[#091525] sticky top-0 h-screen overflow-y-auto flex flex-col">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 px-4 pt-5 pb-5 border-b border-[#1E3556]">
          <div
            className="w-9 h-9 grid place-items-center font-black text-[15px] rounded-md flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #22D3EE, #06B6D4)",
              color: "#0A1929",
              boxShadow: "0 4px 12px rgba(34, 211, 238, 0.3)",
            }}
          >
            X3
          </div>
          <div className="leading-tight max-md:hidden">
            <div className="text-white font-extrabold text-[14px] tracking-tight">X3 COMPASS</div>
            <div className="text-[9px] tracking-[.18em] text-[#22D3EE] font-bold uppercase">AI Safety Director</div>
          </div>
        </Link>

        {/* Sections */}
        <nav className="flex-1 px-2 py-3 space-y-4">
          {SECTIONS.map((sec) => (
            <div key={sec.title}>
              <div className="px-3 pt-2 pb-1.5 text-[9px] tracking-[.16em] uppercase font-bold text-[#22D3EE]/60 max-md:hidden">
                {sec.title}
              </div>
              <div className="space-y-0.5">
                {sec.items.map((it) => {
                  const active = pathname === it.href || (it.href !== "/app" && pathname?.startsWith(it.href));
                  return (
                    <Link
                      key={it.href}
                      href={it.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-semibold transition-colors ${
                        active
                          ? "bg-[#22D3EE]/10 text-white border-l-2 border-[#22D3EE] pl-[10px]"
                          : "text-white/65 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <span className="text-[15px] w-5 text-center">{it.icon}</span>
                      <span className="max-md:hidden">{it.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User pill at bottom */}
        <div className="px-3 py-3 border-t border-[#1E3556] flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full grid place-items-center font-black text-[12px] flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #22D3EE, #06B6D4)",
              color: "#0A1929",
            }}
          >
            JK
          </div>
          <div className="leading-tight min-w-0 flex-1 max-md:hidden">
            <div className="text-white text-[13px] font-bold truncate">Joshua Kovarik</div>
            <div className="text-white/45 text-[11px]">Apex Logistics · owner</div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-[#0A1929]/85 backdrop-blur-md border-b border-[#1E3556]">
          <div className="px-6 h-16 flex items-center justify-between gap-4">
            <div className="min-w-0">
              {crumbs && (
                <div className="text-[11px] tracking-[.14em] uppercase font-bold text-[#22D3EE]/70 mb-0.5">
                  {crumbs}
                </div>
              )}
              <h1 className="text-white font-extrabold text-[17px] truncate">{title ?? ""}</h1>
            </div>
            <div className="flex items-center gap-2">
              {actions}
              <button className="w-9 h-9 rounded-full grid place-items-center text-white/60 hover:text-white hover:bg-white/5">
                🔔
              </button>
              <button className="w-9 h-9 rounded-full grid place-items-center text-white/60 hover:text-white hover:bg-white/5">
                ⚙
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>

      {/* Floating Compass bubble */}
      <Link
        href="/app/ask"
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full grid place-items-center font-black text-[22px] z-40 text-[#0A1929]"
        style={{
          background: "linear-gradient(135deg, #22D3EE, #06B6D4)",
          boxShadow: "0 0 0 4px rgba(34, 211, 238, 0.15), 0 12px 32px rgba(34, 211, 238, 0.4)",
        }}
        aria-label="Ask Compass"
      >
        ∞
      </Link>
    </div>
  );
}
