"use client";

/**
 * SidebarV2 — FleetRabbit-pattern sidebar adopted by X3 Compass.
 *
 * Behaviour:
 *  - Sticky/fixed: stays put while the main content scrolls
 *  - Collapsible groups via native <details> (no JS state needed)
 *  - Chevron rotates on [open] via CSS
 *  - Colored dots next to every sub-item (Compass's vibrant palette: emerald/cyan/amber/rose/violet/slate)
 *  - "What's new" footer card sticky at the bottom
 *  - Counter pills inline on group titles (e.g. "9 AI" on Finance Team)
 *
 * Enabled via the ?sidebar=v2 query string flag — AppShell branches on this.
 * Falls back to the existing flat-section sidebar when the flag isn't set.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";

type Dot = "emerald" | "cyan" | "amber" | "rose" | "violet" | "slate";
type Leaf = { kind?: "leaf"; href: string; label: string; icon: string; dot?: Dot; pill?: { label: string; color: Dot } };
type Group = { kind: "group"; title: string; icon: string; defaultOpen?: boolean; pill?: { label: string; color: Dot }; items: Leaf[] };
type Item = Leaf | Group;

const DOT_BG: Record<Dot, string> = {
  emerald: "bg-emerald-600 dark:bg-emerald-400",
  cyan:    "bg-cyan-700    dark:bg-cyan-400",
  amber:   "bg-amber-600   dark:bg-amber-400",
  rose:    "bg-rose-700    dark:bg-rose-400",
  violet:  "bg-violet-700  dark:bg-violet-400",
  slate:   "bg-slate-600   dark:bg-slate-400",
};

const PILL_CLS: Record<Dot, string> = {
  emerald: "bg-emerald-100 dark:bg-emerald-500/40 text-emerald-900 dark:text-emerald-50 border-emerald-700 dark:border-emerald-300/80",
  cyan:    "bg-cyan-100    dark:bg-cyan-500/40    text-cyan-900    dark:text-cyan-50    border-cyan-700    dark:border-cyan-300/80",
  amber:   "bg-amber-100   dark:bg-amber-500/40   text-amber-900   dark:text-amber-50   border-amber-700   dark:border-amber-300/80",
  rose:    "bg-rose-100    dark:bg-rose-500/40    text-rose-900    dark:text-rose-50    border-rose-700    dark:border-rose-300/80",
  violet:  "bg-violet-100  dark:bg-violet-500/40  text-violet-900  dark:text-violet-50  border-violet-700  dark:border-violet-300/80",
  slate:   "bg-slate-200   dark:bg-slate-500/40   text-slate-900   dark:text-slate-50   border-slate-600   dark:border-slate-300/80",
};

const NAV: Item[] = [
  { kind: "leaf", href: "/app", label: "Dashboard", icon: "▦" },

  { kind: "group", title: "Driver Brain", icon: "👤", defaultOpen: true, items: [
    { href: "/app/drivers",         label: "Drivers",          icon: "👤", dot: "emerald" },
    { href: "/app/dq-files",        label: "DQ Files",         icon: "📁", dot: "cyan" },
    { href: "/app/mvr",             label: "MVR Tracker",      icon: "🪪", dot: "emerald" },
    { href: "/app/drug-alcohol",    label: "Drug & Alcohol",   icon: "🧪", dot: "violet" },
    { href: "/app/da-concierge",    label: "D&A Concierge",    icon: "🧬", dot: "violet" },
    { href: "/app/training",        label: "Training",         icon: "🎓", dot: "cyan" },
    { href: "/app/background-checks", label: "Background Tracker", icon: "🛡", dot: "amber" },
    { href: "/app/driver-invites",  label: "Driver Invites",   icon: "✉", dot: "slate" },
  ]},

  { kind: "group", title: "Vehicle Brain", icon: "🚛", items: [
    { href: "/app/vehicles",    label: "Vehicles",    icon: "🚛", dot: "cyan" },
    { href: "/app/inspections", label: "Inspections", icon: "🔎", dot: "amber" },
    { href: "/app/accidents",   label: "Accidents",   icon: "🚨", dot: "rose" },
  ]},

  { kind: "group", title: "Ops Brain", icon: "⚙", items: [
    { href: "/app/hos",         label: "Hours of Service", icon: "⏱", dot: "cyan" },
    { href: "/app/ifta",        label: "IFTA Concierge",   icon: "⛽", dot: "emerald" },
    { href: "/app/scorecards",  label: "Safety Scorecards", icon: "🏆", dot: "violet" },
    { href: "/app/csa",         label: "CSA Scores",       icon: "📊", dot: "amber" },
  ]},

  { kind: "group", title: "Audit & Reports", icon: "📋", items: [
    { href: "/app/audit-export",    label: "Audit Export",   icon: "📄", dot: "emerald" },
    { href: "/app/audit-log",       label: "Audit Log",      icon: "📜", dot: "slate" },
    { href: "/app/notifications",   label: "Notifications",  icon: "🔔", dot: "amber" },
    { href: "/app/document-lookup", label: "Document Lookup", icon: "🔍", dot: "slate" },
    { href: "/app/forms",           label: "Forms",          icon: "📋", dot: "cyan" },
  ]},

  { kind: "group", title: "Finance", icon: "💰", pill: { label: "9 AI", color: "emerald" }, items: [
    { href: "/app/finance",       label: "Finance Dashboard", icon: "💵", dot: "emerald" },
    { href: "/app/finance-team",  label: "AI Finance Team",   icon: "🤖", dot: "violet" },
    { href: "/app/marketing",     label: "Marketing",         icon: "📣", dot: "cyan" },
    { href: "/app/prospects",     label: "FMCSA Prospects",   icon: "🎯", dot: "amber" },
  ]},

  { kind: "group", title: "Integrations", icon: "🔌", items: [
    { href: "/app/integrations",                label: "All Integrations", icon: "🔌", dot: "slate" },
    { href: "/app/integrations?vendor=checkr",   label: "Checkr",          icon: "🛡", dot: "emerald" },
    { href: "/app/integrations?vendor=samsara",  label: "Samsara",         icon: "📡", dot: "cyan" },
    { href: "/app/integrations?vendor=fleetrabbit", label: "FleetRabbit",   icon: "🐰", dot: "amber" },
  ]},

  { kind: "leaf", href: "/app/ask", label: "Ask Compass", icon: "∞", pill: { label: "AI", color: "violet" } },
  { kind: "leaf", href: "/hazmat",   label: "Hazmat Center", icon: "⚠️" },
  { kind: "leaf", href: "/app/import", label: "Bulk Import", icon: "⤴" },

  { kind: "group", title: "Settings", icon: "⚙", items: [
    { href: "/app/settings",         label: "Profile",  icon: "👤", dot: "slate" },
    { href: "/app/settings/team",    label: "Team",     icon: "👥", dot: "cyan" },
    { href: "/app/settings/billing", label: "Billing",  icon: "💳", dot: "emerald" },
  ]},
];

const SUPER_ADMIN_GROUP: Group = {
  kind: "group", title: "X3 Admin", icon: "⚡", items: [
    { href: "/app/control-center",  label: "Control Center", icon: "🎛", dot: "amber" },
    { href: "/app/admin/partners",  label: "Partners",       icon: "🤝", dot: "violet" },
    { href: "/app/admin/checkr-smoke", label: "Checkr Smoke", icon: "💨", dot: "cyan" },
  ],
};

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  const cleanHref = href.split("?")[0];
  if (pathname === cleanHref) return true;
  return cleanHref !== "/app" && pathname.startsWith(cleanHref);
}

export default function SidebarV2({ isSuperAdmin = false }: { isSuperAdmin?: boolean }) {
  const pathname = usePathname();
  const sections: Item[] = isSuperAdmin ? [...NAV, SUPER_ADMIN_GROUP] : NAV;

  return (
    <aside
      className="border-r border-[var(--border)] bg-[var(--surface)] sticky top-16 h-[calc(100vh-64px)] overflow-y-auto flex flex-col"
      aria-label="Primary navigation"
    >
      {/* Brand strip */}
      <div className="px-3 pt-4 pb-3 border-b border-[var(--border)] flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg grid place-items-center font-black text-[14px] text-[var(--bg)]" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>X3</div>
        <div className="min-w-0">
          <div className="font-extrabold text-[14px] text-[var(--fg)] leading-tight">Compass</div>
          <div className="text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)] mt-0.5">Compliance Brain</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-1">
        {sections.map((sec, idx) => {
          if (sec.kind !== "group") {
            const leaf = sec as Leaf;
            const active = isActive(pathname, leaf.href);
            return (
              <Link
                key={leaf.href}
                href={leaf.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13.5px] font-semibold transition-colors ${
                  active
                    ? "bg-[var(--accent)]/15 text-[var(--fg)] border-l-2 border-[var(--accent)] pl-[10px]"
                    : "text-[var(--fg-muted)] hover:bg-[var(--bg-3)] hover:text-[var(--fg)]"
                }`}
              >
                <span className="text-[17px] w-6 text-center" aria-hidden="true">{leaf.icon}</span>
                <span className="flex-1 truncate">{leaf.label}</span>
                {leaf.pill && (
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${PILL_CLS[leaf.pill.color]}`}>{leaf.pill.label}</span>
                )}
              </Link>
            );
          }

          // Group with collapsible children
          const group = sec as Group;
          const anyChildActive = group.items.some((it) => isActive(pathname, it.href));
          const startOpen = group.defaultOpen ?? anyChildActive;

          return (
            <details key={`g-${idx}-${group.title}`} className="group" open={startOpen}>
              <summary
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13.5px] font-semibold text-[var(--fg-muted)] hover:bg-[var(--bg-3)] hover:text-[var(--fg)] cursor-pointer list-none [&::-webkit-details-marker]:hidden transition-colors"
              >
                <span className="text-[17px] w-6 text-center" aria-hidden="true">{group.icon}</span>
                <span className="flex-1 truncate">{group.title}</span>
                {group.pill && (
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${PILL_CLS[group.pill.color]}`}>{group.pill.label}</span>
                )}
                <span className="text-[var(--fg-faint)] text-[12px] transition-transform group-open:rotate-180" aria-hidden="true">▾</span>
              </summary>
              <div className="pl-3 pr-1 py-1 space-y-0.5">
                {group.items.map((it) => {
                  const active = isActive(pathname, it.href);
                  return (
                    <Link
                      key={it.href}
                      href={it.href}
                      className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md text-[12.5px] transition-colors ${
                        active
                          ? "bg-[var(--accent)]/15 text-[var(--fg)] font-semibold"
                          : "text-[var(--fg-muted)] hover:bg-[var(--bg-3)] hover:text-[var(--fg)]"
                      }`}
                    >
                      {it.dot && <span className={`w-1.5 h-1.5 rounded-full ${DOT_BG[it.dot]}`} aria-hidden="true" />}
                      <span className="flex-1 truncate">{it.label}</span>
                    </Link>
                  );
                })}
              </div>
            </details>
          );
        })}
      </nav>

      {/* What's new footer card */}
      <div className="mx-2 mb-3 mt-1 px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-3)] flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-md grid place-items-center text-[15px] text-[var(--bg)] flex-shrink-0" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>
          <span aria-hidden="true">🎉</span>
        </div>
        <div className="min-w-0">
          <div className="text-[11.5px] font-bold text-[var(--fg)] leading-tight">What's new</div>
          <div className="text-[10px] text-[var(--fg-muted)] mt-0.5 truncate">v1.5.0 · MVR continuous + Samsara OAuth</div>
        </div>
      </div>
    </aside>
  );
}
