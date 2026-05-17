import Link from "next/link";
import SiteShell from "@/components/SiteShell";

type TocItem = { href: string; label: string; active?: boolean };

const DOCS_NAV: { section: string; items: { href: string; label: string }[] }[] = [
  {
    section: "Get started",
    items: [
      { href: "/docs/getting-started", label: "Getting started" },
    ],
  },
  {
    section: "Reference",
    items: [
      { href: "/docs/api",          label: "API reference" },
      { href: "/docs/integrations", label: "Integrations" },
      { href: "/skills",            label: "Skill library" },
    ],
  },
  {
    section: "Operational",
    items: [
      { href: "/security",  label: "Security" },
      { href: "/trust",     label: "Trust" },
      { href: "/changelog", label: "Changelog" },
    ],
  },
];

export default function DocsLayout({
  title, eyebrow = "Documentation", children, toc = [],
}: {
  title: string; eyebrow?: string; children: React.ReactNode; toc?: TocItem[];
}) {
  return (
    <SiteShell>
      <div className="bg-[var(--bg)] text-[var(--fg)]">
        <div className="max-w-7xl mx-auto px-6 py-10 grid lg:grid-cols-[220px_1fr_220px] gap-8">

          {/* Left nav */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-7">
              {DOCS_NAV.map((sec) => (
                <div key={sec.section}>
                  <div className="text-[10px] tracking-[.18em] uppercase font-bold text-[var(--fg-muted)] mb-2">{sec.section}</div>
                  <ul className="space-y-1">
                    {sec.items.map((it) => (
                      <li key={it.href}>
                        <Link href={it.href} className="text-[13px] text-[var(--fg-muted)] hover:text-[var(--accent)] block py-1">{it.label}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </aside>

          {/* Main */}
          <main>
            <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[var(--accent)] mb-3">{eyebrow}</div>
            <h1 className="text-[36px] sm:text-[44px] font-extrabold tracking-tight leading-[1.1] mb-8">{title}</h1>
            <div className="space-y-6 text-[15px] text-[var(--fg-muted)] leading-relaxed max-w-prose">{children}</div>
          </main>

          {/* Right TOC */}
          <aside className="hidden lg:block">
            {toc.length > 0 && (
              <div className="sticky top-24">
                <div className="text-[10px] tracking-[.18em] uppercase font-bold text-[var(--fg-muted)] mb-3">On this page</div>
                <ul className="space-y-1">
                  {toc.map((it) => (
                    <li key={it.href}>
                      <a href={it.href} className={`text-[12px] block py-1 ${it.active ? "text-[var(--accent)] font-bold" : "text-[var(--fg-muted)] hover:text-[var(--accent)]"}`}>{it.label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </div>
    </SiteShell>
  );
}

// Shared sub-components for prose-style docs
export function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return <h2 id={id} className="text-[24px] sm:text-[28px] font-extrabold text-[var(--fg)] mt-10 mb-3 leading-snug scroll-mt-24">{children}</h2>;
}
export function H3({ id, children }: { id: string; children: React.ReactNode }) {
  return <h3 id={id} className="text-[18px] font-bold text-[var(--fg)] mt-6 mb-2 leading-snug scroll-mt-24">{children}</h3>;
}
export function Code({ children }: { children: React.ReactNode }) {
  return <code className="font-mono text-[13px] text-[var(--accent)] bg-[var(--surface)] border border-[var(--border)] rounded px-1.5 py-0.5">{children}</code>;
}
export function Pre({ children, lang }: { children: React.ReactNode; lang?: string }) {
  return (
    <pre className="font-mono text-[13px] bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4 overflow-x-auto leading-relaxed">
      {lang && <div className="text-[10px] uppercase tracking-wider text-[var(--fg-faint)] mb-2">{lang}</div>}
      <code className="text-[var(--fg)]">{children}</code>
    </pre>
  );
}
