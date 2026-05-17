import Link from "next/link";

type RelatedLink = { href: string; title: string; desc: string };

export default function Related({ title = "Related", links }: { title?: string; links: RelatedLink[] }) {
  return (
    <section className="border-t border-[var(--border)] bg-[var(--bg-3)] py-12">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-[10px] tracking-[.18em] uppercase font-bold text-[var(--fg-muted)] mb-5">{title}</div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="x3-card x3-card-hover p-5 block group">
              <div className="text-[15px] font-bold text-[var(--fg)] mb-1 group-hover:text-[var(--accent)] transition-colors">{l.title} →</div>
              <div className="text-[12px] text-[var(--fg-muted)] leading-relaxed">{l.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
