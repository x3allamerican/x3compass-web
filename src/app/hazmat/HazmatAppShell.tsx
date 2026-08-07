/* ============================================================
   HazmatAppShell · Server Component
   ------------------------------------------------------------
   Mirrors the static app.x3compass.com topbar + sidebar
   exactly — same DOM, same class names, same markup. The
   static stylesheets (/x3-static-styles.css + /hazmat-center.css)
   own all the styling; this component is the structural twin
   of what app.js renders into <#topbar> and <#sidebar>.

   Used ONLY by /hazmat/page.tsx (in-app Hazmat Center).
   Other surfaces continue to use the global <AppShell />.
   ============================================================ */

/* Server Component on purpose — the `<link rel="stylesheet">` tags below
 * must be rendered server-side so first paint has the static x3-static-styles
 * and hazmat-center stylesheets. Marking this file "use client" deferred
 * those link tags to hydration and produced an unstyled FOUC.
 *
 * Client-side concerns (useUser for the topbar identity widget + sessionStorage
 * for sidebar scroll persistence) live in tiny client-island components
 * imported below. */
import type { ReactNode } from "react";
import HazmatUserWidget from "./HazmatUserWidget";
import HazmatSidebarScroll from "./HazmatSidebarScroll";

type Dot = "emerald" | "cyan" | "amber" | "rose" | "violet" | "slate";

type Leaf = { kind: "leaf"; id: string; label: string; icon: string; href: string; pill?: { label: string; color: Dot } };
type Group = { kind: "group"; id: string; title: string; icon: string; items: { id: string; label: string; href: string; dot?: Dot }[]; pill?: { label: string; color: Dot }; defaultOpen?: boolean };
type Node = Leaf | Group;

/* Verbatim from app.js (lines 8-95) so the sidebar order + dots + pills match the static page. */
const SIDEBAR: Node[] = [
  { kind: "leaf",  id: "dashboard", label: "Dashboard", icon: "dashboard", href: "/" },
  { kind: "group", id: "driver-brain", title: "Driver Brain", icon: "user", items: [
    { id: "drivers",            label: "Drivers",            href: "/drivers",           dot: "emerald" },
    { id: "dq-files",           label: "DQ Files",           href: "/dq-files",          dot: "cyan"    },
    { id: "drug-alcohol",       label: "Drug & Alcohol",     href: "/drug-alcohol",      dot: "violet"  },
    { id: "hos-eld",            label: "Hours of Service",   href: "/hos",               dot: "cyan"    },
    { id: "safety-scorecards",  label: "Safety Scorecards",  href: "/scorecards",        dot: "violet"  },
    { id: "training",           label: "Training",           href: "/training",          dot: "cyan"    },
  ]},
  { kind: "group", id: "vehicle-brain", title: "Vehicle Brain", icon: "truck", items: [
    { id: "vehicles",     label: "Vehicles",     href: "/vehicles",     dot: "cyan"  },
    { id: "inspections",  label: "Inspections",  href: "/inspections",  dot: "amber" },
    { id: "accidents",    label: "Accidents",    href: "/accidents",    dot: "rose"  },
  ]},
  { kind: "group", id: "ops-brain", title: "Ops Brain", icon: "ops", items: [
    { id: "background-tracker", label: "Background Tracker", href: "/background-checks", dot: "amber"   },
    { id: "csa-scores",         label: "CSA Scores",         href: "/scorecards",        dot: "amber"   },
    { id: "da-concierge",       label: "D&A Concierge",      href: "/da-concierge",      dot: "violet"  },
    { id: "ifta-concierge",     label: "IFTA Concierge",     href: "/ifta",              dot: "emerald" },
    { id: "mvr-tracker",        label: "MVR Tracker",        href: "/mvr",               dot: "emerald" },
  ]},
  { kind: "group", id: "audit-reports", title: "Audit & Reports", icon: "clipboard", items: [
    { id: "audit-export",     label: "Audit Export",    href: "/audit-export",  dot: "emerald" },
    { id: "audit-log",        label: "Audit Log",       href: "/audit-log",     dot: "slate"   },
    { id: "notifications",    label: "Notifications",   href: "/notifications", dot: "amber"   },
  ]},
  { kind: "group", id: "finance", title: "Finance", icon: "money", pill: { label: "9 AI", color: "emerald" }, items: [
    { id: "finance-dashboard", label: "Finance Dashboard", href: "/finance",      dot: "emerald" },
    { id: "finance-team",      label: "AI Finance Team",   href: "/finance-team", dot: "violet"  },
    { id: "marketing",         label: "Marketing",         href: "/marketing",    dot: "cyan"    },
    { id: "prospects",         label: "FMCSA Prospects",   href: "/prospects",    dot: "amber"   },
  ]},
  { kind: "group", id: "integrations", title: "Integrations", icon: "plug", items: [
    { id: "all-integrations", label: "All Integrations", href: "/integrations", dot: "slate" },
  ]},
  { kind: "leaf",  id: "ask-compass",  label: "Ask Compass",   icon: "infinity", href: "/ask", pill: { label: "AI", color: "violet" } },
  { kind: "group", id: "hazmat-center-group", title: "Hazmat Center", icon: "hazmat", defaultOpen: true,
    pill: { label: "PRO · $99", color: "amber" }, items: [
    { id: "hazmat-center",             label: "Overview",              href: "/hazmat",                   dot: "cyan"    },
    { id: "hazmat-placard-wizard",     label: "Placard Wizard",        href: "/hazmat/placard-wizard",    dot: "amber"   },
    { id: "hazmat-substances",         label: "Substance Lookup",      href: "/hazmat/substances",        dot: "cyan"    },
    { id: "hazmat-lithium",            label: "Lithium Decision Tree", href: "/hazmat/lithium",           dot: "amber"   },
    { id: "hazmat-exemptions",         label: "Exemption Checker",     href: "/hazmat/exemptions",        dot: "emerald" },
    { id: "hazmat-audit",              label: "Audit Checklist",       href: "/hazmat/audit",             dot: "cyan"    },
    { id: "hazmat-shipping-papers",    label: "Shipping Papers",       href: "/hazmat/shipping-papers",   dot: "violet"  },
    { id: "hazmat-emergency-response", label: "Emergency Response",    href: "/hazmat/emergency-response",dot: "rose"    },
    { id: "hazmat-training",           label: "Training Tracker",      href: "/hazmat/training",          dot: "cyan"    },
    { id: "hazmat-security-plan",      label: "Security Plan",         href: "/hazmat/security-plan",     dot: "emerald" },
  ]},
  { kind: "group", id: "settings-group", title: "Settings", icon: "gear", items: [
    { id: "settings", label: "Profile", href: "/settings", dot: "slate" },
  ]},
];

/* Lucide-style line icons (verbatim from app.js — keeps the sidebar visually identical) */
const ICONS: Record<string, string> = {
  dashboard:  '<svg viewBox="0 0 24 24"><path d="M3 13a9 9 0 0 1 18 0M12 13V5M8.5 17l7-7M3 19h18"/><circle cx="12" cy="13" r="1.5" fill="currentColor"/></svg>',
  user:       '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
  truck:      '<svg viewBox="0 0 24 24"><rect x="2" y="7" width="13" height="10" rx="1"/><path d="M15 10h4l3 3v4h-7"/><circle cx="6.5" cy="18.5" r="2"/><circle cx="17.5" cy="18.5" r="2"/></svg>',
  ops:        '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 3v4M12 17v4M21 12h-4M7 12H3M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8M18.4 18.4l-2.8-2.8M8.4 8.4 5.6 5.6"/></svg>',
  clipboard:  '<svg viewBox="0 0 24 24"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9zM8 11h8M8 15h8"/></svg>',
  money:      '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M14.5 9.5C13.5 8.5 11 8 10 9.5c-1 1.5 1.5 2 4 2.5s5 1 4 2.5C17 16 14.5 16 13.5 15M12 7v2M12 15v2"/></svg>',
  plug:       '<svg viewBox="0 0 24 24"><path d="M9 2v6M15 2v6M7 8h10v4a5 5 0 0 1-10 0zM12 17v5"/></svg>',
  infinity:   '<svg viewBox="0 0 24 24"><path d="M5 12c0-3 2-5 5-5s5 5 8 5 5-2 5-5"/><path d="M5 12c0 3 2 5 5 5s5-5 8-5"/></svg>',
  hazmat:     '<svg viewBox="0 0 24 24"><path d="M12 2 2 20h20z"/><circle cx="12" cy="14" r="1.5" fill="currentColor"/><path d="M12 8v3"/></svg>',
  gear:       '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3 1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8 1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
};

const PILL_COLOR: Record<Dot, { bg: string; fg: string; bd: string }> = {
  emerald: { bg: "rgba(16,185,129,0.22)", fg: "#6EE7B7", bd: "rgba(110,231,183,0.45)" },
  cyan:    { bg: "rgba(22, 199, 255,0.22)", fg: "#16C7FF", bd: "rgba(22, 199, 255,0.45)"  },
  amber:   { bg: "rgba(251,191,36,0.22)", fg: "#FCD34D", bd: "rgba(251,191,36,0.45)"  },
  rose:    { bg: "rgba(251,113,133,0.22)",fg: "#FDA4AF", bd: "rgba(251,113,133,0.45)" },
  violet:  { bg: "rgba(139,92,246,0.22)", fg: "#C4B5FD", bd: "rgba(196,181,253,0.45)" },
  slate:   { bg: "rgba(148,163,184,0.22)",fg: "#CBD5E1", bd: "rgba(148,163,184,0.45)" },
};

function pillStyle(color: Dot) {
  const c = PILL_COLOR[color] || PILL_COLOR.cyan;
  return `background:${c.bg};color:${c.fg};border-color:${c.bd}`;
}

function Icon({ name }: { name: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <span className="sb2-ico" dangerouslySetInnerHTML={{ __html: ICONS[name] || "" }} />;
}

function SidebarLeaf({ leaf, activeId }: { leaf: Leaf; activeId: string }) {
  const active = leaf.id === activeId ? " active" : "";
  return (
    <a href={leaf.href} className={`sb2-leaf${active}`}>
      <Icon name={leaf.icon} />
      <span className="sb2-label">{leaf.label}</span>
      {leaf.pill && (
        <span className="sb2-pill" style={cssToObj(pillStyle(leaf.pill.color))}>{leaf.pill.label}</span>
      )}
    </a>
  );
}

function SidebarGroup({ group, activeId }: { group: Group; activeId: string }) {
  const anyChildActive = group.items.some((it) => it.id === activeId);
  const startOpen = group.defaultOpen || anyChildActive;
  return (
    <details className="sb2-group" open={startOpen}>
      <summary className="sb2-group-head">
        <Icon name={group.icon} />
        <span className="sb2-label">{group.title}</span>
        {group.pill && (
          <span className="sb2-pill" style={cssToObj(pillStyle(group.pill.color))}>{group.pill.label}</span>
        )}
        <span className="sb2-chev">▾</span>
      </summary>
      <div className="sb2-group-body">
        {group.items.map((it) => {
          const active = it.id === activeId ? " active" : "";
          return (
            <a key={it.id} href={it.href} className={`sb2-subitem${active}`}>
              <span className={`sb2-dot dot-${it.dot || "slate"}`}></span>
              <span>{it.label}</span>
            </a>
          );
        })}
      </div>
    </details>
  );
}

/* React doesn't like inline "background:rgba(...)" strings — split into a style object */
function cssToObj(s: string): React.CSSProperties {
  const out: Record<string, string> = {};
  s.split(";").forEach((kv) => {
    const [k, v] = kv.split(":").map((p) => p?.trim());
    if (!k || !v) return;
    const camel = k.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    out[camel] = v;
  });
  return out as React.CSSProperties;
}

export default function HazmatAppShell({
  activeId,
  pageTitle,
  children,
}: {
  activeId: string;       // matches a sidebar item id, e.g. "hazmat-center"
  pageTitle: string;      // shows in the topbar title slot
  children: ReactNode;
}) {
  const tickerItem = (
    <span>
      <span className="ticker-live">*** LIVE ***</span>
      <span className="ticker-sep">·</span>Apex Logistics
      <span className="ticker-sep">·</span>DOT #123456
      <span className="ticker-sep">·</span>Drivers: 36
      <span className="ticker-sep">·</span>Vehicles: 21
      <span className="ticker-sep">·</span>DOT Status: Satisfactory
    </span>
  );

  return (
    <>
      {/* Static stylesheets · own everything visual.
          Cache-bust query bumped when stylesheets change. */}
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="/x3-static-styles.css?v=20260528b" />
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="/hazmat-center.css?v=20260528b" />

      {/* Client island — wires sessionStorage scroll persistence onto .sidebar */}
      <HazmatSidebarScroll />

      {/* Set body[data-page="hazmat-center"] synchronously BEFORE first paint so
          every `body[data-page^="hazmat-"]` selector in hazmat-center.css fires
          on the initial render. Removed when component unmounts (client nav). */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            "(function(){document.body.dataset.page='hazmat-center';document.body.dataset.title='Hazmat Center';})();",
        }}
      />

      {/*  ┌─ brand ─┬─ topbar ─┐  Mirror of body grid in styles.css line 808.
           ├─ side ─┼─ main ──┤  .app-shell { display:contents } promotes its
           └─────────┴─────────┘  children (sidebar, main) into THIS grid. */}
      <div className="hz-app-frame" data-page="hazmat-center" data-title="Hazmat Center">
        {/* brand-box · grid-area: brand */}
        <a className="brand-box" href="/" aria-label="X3 Compass · Home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="brand-x3" src="/x3-mark-banner.png" alt="X3" />
          <div className="brand-word">Compass</div>
        </a>

        {/* topbar · grid-area: topbar */}
        <header className="topbar" id="topbar">
          <div className="topbar-title-wrap">
            <div className="topbar-title" id="topbar-title">{pageTitle}</div>
            <div className="topbar-ticker">
              <div className="topbar-ticker-track">
                {tickerItem}
                {tickerItem}
              </div>
            </div>
          </div>
          <div className="topbar-right">
            <div className="topbar-bell" title="Notifications">
              <span>🔔</span><span className="dot"></span>
            </div>
            {/* Client island · reads useUser, renders the avatar/name/role */}
            <HazmatUserWidget />
          </div>
        </header>

        {/* app-shell · display:contents · its sidebar+main promote into the wrapper grid */}
        <div className="app-shell">
          <aside className="sidebar" id="sidebar">
            {/* sb2-brand kept for compat but hidden by styles.css line 887 (display:none !important) */}
            <nav className="sb2-nav">
              {SIDEBAR.map((node) => {
                if (node.kind === "leaf")  return <SidebarLeaf  key={node.id} leaf={node}  activeId={activeId} />;
                if (node.kind === "group") return <SidebarGroup key={node.id} group={node} activeId={activeId} />;
                return null;
              })}
            </nav>
            <div className="sb2-newcard">
              <div className="sb2-newicon">🎉</div>
              <div>
                <div className="sb2-newtitle">What&apos;s new</div>
                <div className="sb2-newsub">v1.5.0 · MVR continuous + Samsara OAuth</div>
              </div>
            </div>
          </aside>

          <main className="main" id="main-content">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
