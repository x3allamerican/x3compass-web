"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import TopNav from "@/components/TopNav";
import { useUser } from "@/lib/useUser";
import { useIsSuperAdmin } from "@/lib/superAdmin";

type NavItem = { href: string; label: string; icon: string };

type SectionDef = { title: string; superAdminOnly?: boolean; items: NavItem[] };
const PUBLIC_SECTIONS: SectionDef[] = [
  { title: "Main", items: [
    { href: "/app",                label: "Dashboard",       icon: "▦" },
    { href: "/app/drivers",        label: "Drivers",         icon: "👤" },
    { href: "/app/vehicles",       label: "Vehicles",        icon: "🚛" },
    { href: "/app/dq-files",       label: "DQ Files",        icon: "📁" },
    { href: "/app/accidents",      label: "Accidents",       icon: "🚨" },
    { href: "/app/inspections",    label: "Inspections",     icon: "🔎" },
    { href: "/app/drug-alcohol",   label: "Drug & Alcohol",  icon: "🧪" },
    { href: "/app/hos",            label: "HOS / ELD",       icon: "⏱" },
    { href: "/app/training",       label: "Training",        icon: "🎓" },
  ]},
  { title: "Compliance Trackers", items: [
    { href: "/app/mvr",                label: "MVR Tracker",        icon: "🪪" },
    { href: "/app/da-concierge",       label: "D&A Concierge",      icon: "🧬" },
    { href: "/app/background-checks",  label: "Background Tracker", icon: "🛡" },
    { href: "/app/ifta",               label: "IFTA Concierge",     icon: "⛽" },
  ]},
  { title: "Advanced", items: [
    { href: "/app/scorecards",      label: "Safety Scorecards", icon: "🏆" },
    { href: "/app/csa",             label: "CSA Scores",        icon: "📊" },
    { href: "/app/document-lookup", label: "Document Lookup",   icon: "🔍" },
    { href: "/app/ask",             label: "Ask Compass",       icon: "∞" },
    { href: "/hazmat",              label: "Hazmat Center",     icon: "⚠️" },
    { href: "/app/audit-export",    label: "Audit Export",      icon: "📄" },
  ]},
  { title: "Client Admin", items: [
    { href: "/app/settings",       label: "Settings",       icon: "⚙" },
    { href: "/app/driver-invites", label: "Driver Invites", icon: "✉" },
    { href: "/app/forms",          label: "Forms",          icon: "📋" },
    { href: "/app/import",         label: "Bulk Import",    icon: "⤴" },
  ]},
];
// X3 Admin section — only rendered for super-admins. Mirrors app.x3fleetsafety.com/admin.
const SUPER_ADMIN_SECTION: SectionDef = { title: "X3 Admin", superAdminOnly: true, items: [
  { href: "/app/control-center", label: "Control Center",  icon: "🎛" },
  { href: "/app/finance",        label: "Finance",         icon: "💵" },
  { href: "/app/marketing",      label: "Marketing",       icon: "📣" },
  { href: "/app/notifications",  label: "Notifications",   icon: "🔔" },
  { href: "/app/audit-log",      label: "Audit Log",       icon: "📜" },
  { href: "/app/prospects",      label: "FMCSA Prospects", icon: "🎯" },
  { href: "/app/integrations",   label: "Integrations",    icon: "🔌" },
]};

export default function AppShell({ children, title, crumbs, actions }: { children: React.ReactNode; title?: string; crumbs?: string; actions?: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, carrier, loading, signOut } = useUser();
  const isSuperAdmin = useIsSuperAdmin();
  const asideRef = useRef<HTMLElement>(null);

  // Persist sidebar scroll position across page navigations.
  // The sidebar re-mounts on every /app/* route change because AppShell is rendered
  // per-page (not yet a shared layout). sessionStorage gives us scroll-position
  // continuity until we lift AppShell into app/app/layout.tsx.
  useEffect(() => {
    const aside = asideRef.current;
    if (!aside) return;
    const saved = sessionStorage.getItem("x3-sidebar-scroll");
    if (saved) aside.scrollTop = parseInt(saved, 10) || 0;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        try { sessionStorage.setItem("x3-sidebar-scroll", String(aside.scrollTop)); } catch {}
      });
    };
    aside.addEventListener("scroll", onScroll, { passive: true });
    return () => { aside.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      const here = pathname && pathname !== "/" ? `?return_to=${encodeURIComponent(pathname)}` : "";
      router.replace(`/signin${here}`);
    }
  }, [user, loading, pathname, router]);

  if (loading || !user) {
    return (
      <div className="bg-[var(--bg)] min-h-screen text-[var(--fg)] flex flex-col">
        <TopNav />
        <div className="flex-1 grid place-items-center">
          <div className="text-center px-6">
            <div className="w-14 h-14 rounded-full grid place-items-center text-[var(--bg)] font-black text-[22px] mx-auto mb-4" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>∞</div>
            <div className="text-[14px] text-[var(--fg-muted)] font-semibold mb-2">Checking your session…</div>
            <div className="text-[12px] text-[var(--fg-faint)]">If this takes more than a moment, you&apos;ll be redirected to sign in.</div>
          </div>
        </div>
      </div>
    );
  }

  const initials = (() => {
    const name = (user.user_metadata?.full_name as string) || user.email || "";
    const parts = name.replace(/@.*$/, "").split(/[.\s_-]+/).filter(Boolean);
    return (parts[0]?.[0] || "U").concat(parts[1]?.[0] || "").toUpperCase();
  })();
  const userLabel = (user.user_metadata?.full_name as string) || user.email || "Signed in";
  const carrierLabel = carrier ? `${carrier.name}${carrier.subscription_status === "trialing" ? " · trial" : ""}` : "No carrier";

  return (
    <div className="bg-[var(--bg)] min-h-screen text-[var(--fg)] flex flex-col">
      <TopNav />
      {carrier?.subscription_status === "trialing" && carrier.trial_ends_at && (
        <div className="bg-cyan-900/40 border-b border-cyan-700/30 px-6 py-2 text-[12px] text-cyan-100 flex items-center justify-between">
          <span>✨ Free trial — ends <strong>{new Date(carrier.trial_ends_at).toLocaleDateString()}</strong>.</span>
          <Link href="/app/settings/billing" className="text-[var(--accent)] font-bold hover:underline">Add payment →</Link>
        </div>
      )}
      {carrier?.subscription_status === "past_due" && (
        <div className="bg-orange-900/40 border-b border-orange-700/30 px-6 py-2 text-[12px] text-orange-100 flex items-center justify-between">
          <span>⚠ Last payment failed. Update your card to keep access.</span>
          <Link href="/app/settings/billing" className="text-orange-300 font-bold hover:underline">Update card →</Link>
        </div>
      )}
      <div className="grid grid-cols-[260px_1fr] max-md:grid-cols-[72px_1fr] flex-1">
        <aside ref={asideRef} className="border-r border-[var(--border)] bg-[var(--surface)] sticky top-16 h-[calc(100vh-64px)] overflow-y-auto flex flex-col">
          <div className="px-3 pt-4 pb-3 border-b border-[var(--border)]">
            <div className="text-[11px] tracking-[.16em] uppercase font-extrabold text-[var(--accent)] px-2">Workspace</div>
          </div>
          <nav className="flex-1 px-2 py-3 space-y-5">
            {[...PUBLIC_SECTIONS, ...(isSuperAdmin ? [SUPER_ADMIN_SECTION] : [])].map((sec) => (
              <div key={sec.title}>
                <div className={`px-3 pt-1 pb-2 text-[10px] tracking-[.16em] uppercase font-extrabold max-md:hidden ${sec.title === "X3 Admin" ? "text-[#FACC15]" : "text-[var(--accent)]/90"}`}>{sec.title}</div>
                <div className="space-y-1">
                  {sec.items.map((it) => {
                    const active = pathname === it.href || (it.href !== "/app" && pathname?.startsWith(it.href));
                    return (
                      <Link key={it.href} href={it.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-semibold transition-colors ${active ? "bg-[var(--accent)]/15 text-[var(--fg)] border-l-2 border-[var(--accent)] pl-[10px]" : "text-[var(--fg-muted)] hover:bg-white/10 hover:text-[var(--fg)]"}`}>
                        <span className="text-[17px] w-6 text-center">{it.icon}</span>
                        <span className="max-md:hidden">{it.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
          {isSuperAdmin && (
            <div className="px-3 py-3 mx-3 mb-2 mt-1 rounded-lg border border-[#FACC15]/40 bg-[#FACC15]/10 max-md:hidden">
              <div className="text-[10px] tracking-[.14em] uppercase font-extrabold text-[#FACC15] mb-1">⚡ X3 Admin</div>
              <div className="text-[10px] text-[var(--fg-muted)] mb-1">Viewing:</div>
              <div className="text-[11px] text-[var(--fg)] font-mono truncate">{carrier?.name ?? "All carriers"}{carrier?.usdot_number ? ` · DOT ${carrier.usdot_number}` : ""}</div>
            </div>
          )}
          <div className="px-3 py-4 border-t border-[var(--border)]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full grid place-items-center font-black text-[13px] flex-shrink-0" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))", color: "var(--accent-fg)" }}>{initials}</div>
              <div className="leading-tight min-w-0 flex-1 max-md:hidden">
                <div className="text-[var(--fg)] text-[13px] font-bold truncate">{userLabel}</div>
                <div className="text-[var(--fg-muted)] text-[11px] truncate">{carrierLabel}</div>
              </div>
            </div>
            <button onClick={signOut} className="w-full text-[11px] text-[var(--fg-muted)] hover:text-[var(--fg)] px-2 py-1.5 rounded max-md:hidden text-left">Sign out →</button>
          </div>
        </aside>
        <div className="min-w-0 flex flex-col">
          <header className="sticky top-16 z-20 bg-[var(--bg)]/85 backdrop-blur-md border-b border-[var(--border)]">
            <div className="px-6 h-16 flex items-center justify-between gap-4">
              <div className="min-w-0">
                {crumbs && <div className="text-[11px] tracking-[.14em] uppercase font-extrabold text-[var(--accent)] mb-1">{crumbs}</div>}
                <h1 className="text-[var(--fg)] font-extrabold text-[19px] truncate">{title ?? ""}</h1>
              </div>
              <div className="flex items-center gap-2">{actions}<button className="w-9 h-9 rounded-full grid place-items-center text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-white/5" aria-label="Notifications">🔔</button></div>
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </div>
      <Link href="/app/ask" className="fixed bottom-6 right-6 w-14 h-14 rounded-full grid place-items-center font-black text-[22px] z-40 text-[var(--bg)]" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))", boxShadow: "0 0 0 4px rgba(34, 211, 238, 0.15), 0 12px 32px rgba(34, 211, 238, 0.4)" }} aria-label="Ask Compass">∞</Link>
    </div>
  );
}
