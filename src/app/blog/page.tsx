import Link from "next/link";
import SiteShell from "@/components/SiteShell";

export const metadata = {
  title: "Notes from the Compass — X3 Compass blog",
  description: "Building an FMCSA compliance product in public. Eval baselines, prompt engineering, monitoring stack lessons, hazmat deep-dives.",
};

type Post = {
  slug: string;
  date: string;
  title: string;
  blurb: string;
  tag: "engineering" | "compliance" | "build-in-public";
  read: string;
};

const TAG_STYLES: Record<Post["tag"], { label: string; cls: string }> = {
  engineering:        { label: "ENGINEERING",      cls: "text-[var(--accent)]  bg-[var(--accent)]/10  border-[var(--accent)]/30" },
  compliance:         { label: "COMPLIANCE",       cls: "text-[var(--success)] bg-[var(--success)]/10 border-[var(--success)]/30" },
  "build-in-public":  { label: "BUILD IN PUBLIC",  cls: "text-[var(--warning)] bg-[var(--warning)]/10 border-[var(--warning)]/30" },
};

const POSTS: Post[] = [
  {
    slug: "cfr-accuracy-baseline",
    date: "May 17, 2026",
    title: "How we got to 85% citation accuracy on a 60-question FMCSA eval",
    blurb:
      "Before any AI compliance product is honest with you, the team needs a baseline. We built a 60-question eval set across 15 categories, ran vanilla claude-sonnet-4-6 against it with a minimal system prompt, and got 51/60 = 85%. Here's where the failures were, why the eCFR round-trip catches the rest, and what the 95% architecture looks like.",
    tag: "engineering",
    read: "8 min read",
  },
];

export default function BlogIndex() {
  return (
    <SiteShell>
      <div className="bg-[var(--bg)] text-[var(--fg)]">

        {/* HERO */}
        <section className="border-b border-[var(--border)]">
          <div className="max-w-5xl mx-auto px-6 py-20">
            <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[var(--accent)] mb-3">
              Notes from the Compass
            </div>
            <h1 className="text-[44px] sm:text-[56px] md:text-[64px] font-extrabold tracking-tight leading-[1.05] mb-4">
              We build it. <span className="serif-italic" style={{ color: "#22D3EE" }}>Then we write about it.</span>
            </h1>
            <p className="text-[18px] text-[var(--fg-muted)] max-w-3xl">
              FMCSA compliance is hard, AI hallucinates, and we&apos;re building both at once. Below is the inside view —
              eval baselines, prompt engineering, monitoring lessons. The same kind of post we wish other vendors wrote.
            </p>
          </div>
        </section>

        {/* POSTS */}
        <section className="max-w-5xl mx-auto px-6 py-12 space-y-6">
          {POSTS.map((p) => {
            const tag = TAG_STYLES[p.tag];
            return (
              <Link key={p.slug} href={`/blog/${p.slug}`} className="x3-card x3-card-hover p-7 block">
                <div className="flex items-center gap-3 mb-4">
                  <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full border ${tag.cls}`}>
                    {tag.label}
                  </span>
                  <span className="text-[12px] text-[var(--fg-faint)]">{p.date}</span>
                  <span className="text-[12px] text-[var(--fg-faint)]">·</span>
                  <span className="text-[12px] text-[var(--fg-faint)]">{p.read}</span>
                </div>
                <h2 className="text-[22px] font-bold text-[var(--fg)] mb-2 leading-snug group-hover:text-[var(--accent)]">
                  {p.title}
                </h2>
                <p className="text-[14px] text-[var(--fg-muted)] leading-relaxed">
                  {p.blurb}
                </p>
                <div className="mt-4 text-[12px] font-bold text-[var(--accent)]">
                  Read the post →
                </div>
              </Link>
            );
          })}
        </section>

        {/* CTA */}
        <section className="border-t border-[var(--border)] bg-[var(--bg-3)] py-14">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-[24px] sm:text-[30px] font-extrabold text-[var(--fg)] mb-3">
              See what we&apos;re writing about — actually working
            </h2>
            <p className="text-[15px] text-[var(--fg-muted)] mb-6">
              Try the Ask Compass demo on the homepage. Real CFR citations, real eCFR verification.
            </p>
            <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[15px] text-[var(--accent-fg)] bg-[var(--accent)] hover:bg-[var(--accent-2)]">
              ★ Try the live demo →
            </Link>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
