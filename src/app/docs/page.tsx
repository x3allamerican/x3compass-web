import Link from "next/link";
import SiteShell from "@/components/SiteShell";

export const metadata = {
  title: "Documentation — X3 Compass",
  description: "Developer + integrator docs for X3 Compass. Getting started, API reference, integration guides, CFR-to-skill mapping.",
};

const SECTIONS = [
  {
    title: "Getting started",
    desc: "Sign up, import your fleet, run your first compliance check in under 10 minutes.",
    href: "/docs/getting-started",
    icon: "▶",
  },
  {
    title: "API reference",
    desc: "Endpoints for Ask Compass, audit export, driver/vehicle/inspection CRUD, webhooks.",
    href: "/docs/api",
    icon: "{ }",
  },
  {
    title: "Integrations",
    desc: "Stripe billing, Checkr background checks, Anthropic AI, Supabase auth — how each is wired and what carriers see.",
    href: "/docs/integrations",
    icon: "⚡",
  },
  {
    title: "Skill library",
    desc: "All 300+ FMCSA skills mapped to their CFR sections. Click any skill to see its prompt + sample answer.",
    href: "/skills",
    icon: "§",
  },
];

export default function DocsPage() {
  return (
    <SiteShell>
      <div className="bg-[var(--bg)] text-[var(--fg)]">

        <section className="border-b border-[var(--border)]">
          <div className="max-w-5xl mx-auto px-6 py-16">
            <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[var(--accent)] mb-3">Documentation</div>
            <h1 className="text-[40px] sm:text-[48px] md:text-[56px] font-extrabold tracking-tight leading-[1.05] mb-4">
              Docs.{" "}
              <span className="serif-italic" style={{ color: "#22D3EE" }}>Built like the product.</span>
            </h1>
            <p className="text-[17px] text-[var(--fg-muted)] max-w-3xl">
              Practical, terse, CFR-cited. We don&apos;t pad docs with onboarding stories — get to the API, get to the integration, get back to work.
            </p>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-2 gap-5">
            {SECTIONS.map((s) => (
              <Link key={s.href} href={s.href} className="x3-card x3-card-hover p-7 block group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl grid place-items-center text-[20px] font-black text-[var(--accent-fg)] bg-[var(--accent)] flex-shrink-0">
                    {s.icon}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-[18px] font-bold text-[var(--fg)] mb-1 group-hover:text-[var(--accent)] transition-colors">{s.title} →</h2>
                    <p className="text-[14px] text-[var(--fg-muted)] leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-12 x3-card p-6">
            <div className="text-[10px] tracking-[.18em] uppercase font-bold text-[var(--fg-muted)] mb-3">For developers</div>
            <p className="text-[14px] text-[var(--fg-muted)] mb-4 leading-relaxed">
              The 100 published skills live on <a href="https://github.com/x3fleetsafety/skills" className="text-[var(--accent)] hover:underline" target="_blank" rel="noreferrer">github.com/x3fleetsafety/skills</a> under MIT.
              Read the prompts, copy the patterns, send PRs. Compass itself is closed-source for now, but the regulatory knowledge layer is open and version-controlled.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="https://github.com/x3fleetsafety/skills" target="_blank" rel="noreferrer" className="text-[12px] font-bold text-[var(--accent)] hover:underline">GitHub: x3fleetsafety/skills →</a>
              <Link href="/blog/cfr-accuracy-baseline" className="text-[12px] font-bold text-[var(--accent)] hover:underline">Read the 85% accuracy baseline post →</Link>
            </div>
          </div>
        </section>

        <section className="border-t border-[var(--border)] bg-[var(--bg-3)] py-12">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-[24px] font-extrabold text-[var(--fg)] mb-3">Documentation gap? Tell us.</h2>
            <p className="text-[14px] text-[var(--fg-muted)] mb-5">
              If you needed to know something and the docs didn&apos;t have it — that&apos;s a P0 for us.
            </p>
            <a href="mailto:joshua@x3compass.com?subject=Docs%20gap" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-[13px] text-[var(--accent-fg)] bg-[var(--accent)] hover:bg-[var(--accent-2)]">Email joshua@x3compass.com →</a>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
