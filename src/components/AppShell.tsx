"use client";
import { useEffect, useRef, useState, Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import TopNav from "@/components/TopNav";
import SidebarV2 from "@/components/SidebarV2";
import TenantThemeProvider, { DEFAULT_TENANT, TenantConfig } from "@/components/TenantThemeProvider";
import AppTopbar from "@/components/AppTopbar";
import PageHeader from "@/components/PageHeader";
import { useUser } from "@/lib/useUser";
import { useIsSuperAdmin } from "@/lib/superAdmin";
import ConciergeModal from "@/components/ConciergeModal";
import EducationHubModal from "@/components/EducationHubModal";
import { getSupabase } from "@/lib/supabase";

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
    { href: "/app/calendar",           label: "Compliance Calendar", icon: "🗓" },
    { href: "/app/mvr",                label: "MVR Tracker",        icon: "🪪" },
    { href: "/app/da-concierge",       label: "D&A Concierge",      icon: "🧬" },
    { href: "/app/clearinghouse",      label: "Clearinghouse",      icon: "⚖" },
    { href: "/app/background-checks",  label: "Background Tracker", icon: "🛡" },
    { href: "/app/ifta",               label: "IFTA Concierge",     icon: "⛽" },
  ]},
  { title: "Advanced", items: [
    { href: "/app/scorecards",      label: "Safety Scorecards", icon: "🏆" },
    { href: "/app/csa",             label: "CSA Scores",        icon: "📊" },
    { href: "/app/document-lookup", label: "Document Lookup",   icon: "🔍" },
    { href: "/app/ask",             label: "Ask Compass",       icon: "∞" },
    { href: "/app/hazmat",          label: "Hazmat Center",     icon: "⚠️" },
    { href: "/app/audit-export",    label: "Audit Export",      icon: "📄" },
  ]},
  { title: "Client Admin", items: [
    { href: "/app/settings",       label: "Settings",       icon: "⚙" },
    { href: "/app/driver-invites", label: "Driver Invites", icon: "✉" },
    { href: "/app/forms",          label: "Forms",          icon: "📋" },
    { href: "/app/import",         label: "Bulk Import",    icon: "⤴" },
  ]},
];
// X3 Admin section · only rendered for super-admins. Mirrors app.x3fleetsafety.com/admin.
const SUPER_ADMIN_SECTION: SectionDef = { title: "X3 Admin", superAdminOnly: true, items: [
  { href: "/app/control-center", label: "Control Center",  icon: "🎛" },
  { href: "/app/finance-team",   label: "AI Finance Team", icon: "💰" },
  { href: "/app/finance",        label: "Finance",         icon: "💵" },
  { href: "/app/marketing",      label: "Marketing",       icon: "📣" },
  { href: "/app/notifications",  label: "Notifications",   icon: "🔔" },
  { href: "/app/audit-log",      label: "Audit Log",       icon: "📜" },
  { href: "/app/prospects",      label: "FMCSA Prospects", icon: "🎯" },
  { href: "/app/integrations",   label: "Integrations",    icon: "🔌" },
]};

// Next.js 16 static-export requires components using useSearchParams() to be
// wrapped in a Suspense boundary. The exported default wraps AppShellInner.
type AppShellProps = { children: React.ReactNode; title?: string; crumbs?: string; actions?: React.ReactNode };

export default function AppShell(props: AppShellProps) {
  return (
    <Suspense fallback={null}>
      <AppShellInner {...props} />
    </Suspense>
  );
}

function AppShellInner({ children, title, crumbs, actions }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, carrier, loading, signOut } = useUser();
  const isSuperAdmin = useIsSuperAdmin();
  const asideRef = useRef<HTMLElement>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  useEffect(() => {
    if (!carrier) { setNotificationCount(0); return; }
    let active = true;
    void getSupabase().auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.access_token) return;
      const response = await fetch(`/api/notifications?carrier_id=${carrier.id}`, { cache: "no-store", headers: { Authorization: `Bearer ${session.access_token}` } });
      if (!response.ok || !active) return;
      const payload = await response.json() as { unread_count?:number };
      if (active) setNotificationCount(payload.unread_count || 0);
    }).catch(()=>{});
    return () => { active = false; };
  }, [carrier]);

  // Sidebar v2 is the default as of Sprint 1 (Phase B). The Manus group
  // structure (Driver Brain, Vehicle Brain, Ops Brain, Audit & Reports,
  // Finance, Integrations, Hazmat Center PRO) is the only sidebar shipped.
  // Legacy flat sidebar branch below is dead code, retained briefly for
  // diff review and will be removed in Sprint 2.
  const useV2 = true;
  // Suppress unused-var lint on searchParams until we re-wire query handling.
  void searchParams;

  // FORCE DARK MODE inside the app shell. The static Manus design is always
  // dark (true black + cyan). Light mode on /app/* renders washed-out gray
  // which Joshua flagged as off-brand. The marketing site keeps the toggle.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const html = document.documentElement;
    const wasLight = html.classList.contains("light");
    html.classList.remove("light");
    return () => {
      // When AppShell unmounts (user navigates back to marketing), restore
      // their previous theme preference so the marketing site doesn't get
      // surprise-darkened.
      if (wasLight) html.classList.add("light");
    };
  }, []);

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
      // Static export + router.replace can be flaky. window.location.href
      // is reliable and works identically from a UX standpoint here since
      // we're leaving the app shell anyway.
      if (typeof window !== "undefined") {
        window.location.href = `/signin${here}`;
      }
    }
  }, [user, loading, pathname, router]);

  // SAFETY NET REMOVED. The 3s timeout was kicking authenticated users
  // back to /signin on slow refreshes (Supabase session validation can
  // take longer than 3s on slower connections, but the user IS signed in).
  // The try/catch in useUser already guarantees loading: false fires on
  // any error, which triggers the natural redirect above. No timeout needed.

  if (loading || !user) {
    // Auth gate: minimal spinner ONLY, no misleading "Sign in" button.
    // The useEffect above redirects to /signin if !loading && !user.
    // The safety-net effect (4s timeout) force-redirects if loading hangs.
    // Showing a Sign in button here trapped users in a UX loop where they
    // thought they had to sign in even when already authenticated.
    return (
      <TenantThemeProvider>
        <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "var(--bg)", color: "var(--fg)" }}>
          <div className="w-12 h-12 rounded-full grid place-items-center mb-4" style={{ border: "3px solid var(--surface-2)", borderTopColor: "var(--accent)", animation: "x3-spin 0.9s linear infinite" }} aria-label="Loading" />
          <div className="text-[12px]" style={{ color: "var(--fg-faint)" }}>Loading X3 Compass…</div>
          <style>{`@keyframes x3-spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </TenantThemeProvider>
    );
  }

  const initials = (() => {
    const name = (user.user_metadata?.full_name as string) || user.email || "";
    const parts = name.replace(/@.*$/, "").split(/[.\s_-]+/).filter(Boolean);
    return (parts[0]?.[0] || "U").concat(parts[1]?.[0] || "").toUpperCase();
  })();
  const userLabel = (user.user_metadata?.full_name as string) || user.email || "Signed in";
  const carrierLabel = carrier ? `${carrier.name}${carrier.subscription_status === "trialing" ? " · trial" : ""}` : "No carrier";

  // Build a TenantConfig from the loaded carrier. In Sprint 3 this will read
  // per-tenant logo + token overrides from a carriers.tenant_theme column.
  const tenant: TenantConfig = carrier
    ? { id: String(carrier.id ?? carrier.usdot_number ?? "carrier"),
        name: carrier.name ?? "Your fleet",
        dotNumber: carrier.usdot_number ?? undefined,
        productName: "X3 Compass" }
    : DEFAULT_TENANT;

  return (
    <TenantThemeProvider tenant={tenant}>
    {/* No TopNav inside the app shell · AppTopbar is the top bar, sidebar owns navigation.
        Eliminates the empty marketing-style header that was bleeding into the app. */}
    <div className="min-h-screen text-[var(--fg)] grid" style={{ gridTemplateColumns: "240px 1fr", gridTemplateRows: "auto 1fr", background: "var(--bg)" }}>

      {/* TOP-LEFT BOX · X3 Compass logo. STICKY so the whole top row stays
          locked while content scrolls. Same minHeight as the AppTopbar on the
          right so the two cells stay flush. Joshua: top row is now locked
          across every /app/* surface; no per-page logo overrides allowed. */}
      <Link
        href="/app"
        aria-label="X3 Compass · Home"
        className="x3-logo-box"
        style={{
          gridColumn: 1,
          gridRow: 1,
          background: "var(--bg)",
          borderRight: "2px solid rgba(255, 255, 255, 0.55)",
          borderBottom: "2px solid rgba(255, 255, 255, 0.55)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "4px 10px",
          textDecoration: "none",
          minHeight: 88,
          position: "sticky",
          top: 0,
          zIndex: 31,
        }}
      >
        {/* Logo: real X3 COMPASS artwork from the brand PNG, retinted to
            var(--accent) via CSS mask. The PNG provides the EXACT shape (X3
            mark + COMPASS wordmark as designed); --accent provides the live
            color so it ALWAYS matches the topbar banner / sidebar icons /
            KPI cyan. Tenant white-label automatically recolors the logo. */}
        <span
          role="img"
          aria-label="X3 Compass"
          style={{
            display: "block",
            height: 78,
            width: 200,
            maxWidth: "100%",
            backgroundColor: "var(--accent)",
            WebkitMaskImage: 'url("/x3-compass-logo-alpha.png")',
            maskImage: 'url("/x3-compass-logo-alpha.png")',
            WebkitMaskSize: "contain",
            maskSize: "contain",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            maskPosition: "center",
          }}
        />
      </Link>

      {/* TOP-RIGHT BOX · topbar with title + subtitle + user widgets */}
      <div style={{ gridColumn: 2, gridRow: 1 }}>
        <AppTopbar
          title={title || "Dashboard"}
          userEmail={user.email ?? null}
          userName={(user.user_metadata?.full_name as string) || null}
          userRole={isSuperAdmin ? "Founder" : "Fleet Manager"}
          live
          notificationCount={notificationCount}
        />
      </div>

      {/* Past-due banner spans both columns of the bottom row */}
      {carrier?.subscription_status === "past_due" && (
        <div style={{ gridColumn: "1 / -1" }} className="bg-orange-900/40 border-b border-orange-700/30 px-6 py-2 text-[12px] text-orange-100 flex items-center justify-between">
          <span>⚠ Last payment failed. Update your card to keep access.</span>
          <Link href="/app/settings/billing" className="text-orange-700 dark:text-orange-300 font-bold hover:underline">Update card →</Link>
        </div>
      )}

      {/* BOTTOM ROW · sidebar + main content as two more boxes */}
      <div className="contents max-md:grid-cols-[72px_1fr]" style={{ display: "contents" }}>
        {useV2 ? (
          <SidebarV2 isSuperAdmin={isSuperAdmin} />
        ) : (
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
        )}
        <div className="min-w-0 flex flex-col">
          {/* Per-page sub-header · only renders when title/crumbs/actions are provided.
              The AppTopbar above already shows "AI SAFETY DIRECTOR" + tenant context,
              so most pages skip this. Surface-specific pages can still pass title/actions. */}
          {(title || crumbs || actions) && (
            <header className="sticky top-[88px] z-20" style={{ background: "color-mix(in srgb, var(--bg) 85%, transparent)", backdropFilter: "blur(8px)", borderBottom: "1px solid var(--border)" }}>
              <div className="px-6 h-14 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  {crumbs && <div className="text-[11px] tracking-[.14em] uppercase font-extrabold text-[var(--accent)] mb-0.5">{crumbs}</div>}
                  {title && <h1 className="text-[var(--fg)] font-extrabold text-[28px] leading-tight truncate">{title}</h1>}
                </div>
                {actions && <div className="flex items-center gap-2">{actions}</div>}
              </div>
            </header>
          )}
          <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-3 focus:left-3 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-[#16C7FF] focus:text-black focus:font-bold">Skip to main content</a>
          <main id="main-content" className="flex-1">{children}</main>
        </div>
      </div>
      {/* SIGNATURE: the floating Ask Compass button is the ONE element in
          the app permitted to keep a cyan halo. Joshua: "AI Concierge as
          star of the show." Every other cyan-glow shadow site got swapped
          to the tinted-bg shadow per ANTI_SLOP rule #2. */}
      <Link href="/app/ask" className="fixed bottom-6 right-6 w-14 h-14 rounded-full grid place-items-center font-black text-[22px] z-40 text-[var(--bg)]" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))", boxShadow: "0 0 0 4px rgba(22, 199, 255, 0.15), 0 12px 32px rgba(22, 199, 255, 0.40)" }} aria-label="Ask Compass">∞</Link>
      {/* Site-wide in-page overlays — any page can open either by dispatching
       *  the x3:open-education-hub / x3:open-concierge events. The
       *  EducationHubCard's two pills already wire both events. */}
      <ConciergeModal />
      <EducationHubModal />
    </div>
    </TenantThemeProvider>
  );
}
