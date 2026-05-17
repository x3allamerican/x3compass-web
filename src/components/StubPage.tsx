import Link from "next/link";
import AppShell from "@/components/AppShell";

export default function StubPage({
  title,
  crumbs,
  cfr,
  icon,
  desc,
  features,
}: {
  title: string;
  crumbs: string;
  cfr: string;
  icon: string;
  desc: string;
  features: { name: string; detail: string }[];
}) {
  return (
    <AppShell title={title} crumbs={crumbs}>
      <div className="px-6 py-10 max-w-4xl mx-auto space-y-6">
        <div
          className="rounded-2xl p-8 border border-[var(--border)] relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, var(--surface) 0%, var(--surface-3) 100%)" }}
        >
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full blur-3xl pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(34, 211, 238, 0.18), transparent 70%)" }}
          />
          <div className="relative">
            <div className="flex items-center gap-4 mb-4">
              <div className="text-[44px]">{icon}</div>
              <div>
                <h2 className="text-[26px] font-extrabold text-[var(--fg)]">{title}</h2>
                <div className="text-[12px] font-mono text-[var(--accent)] mt-1">{cfr}</div>
              </div>
            </div>
            <p className="text-[15px] text-[var(--fg)] leading-relaxed mb-6 max-w-2xl">{desc}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              {features.map((f, i) => (
                <div key={i} className="rounded-xl p-4 bg-[var(--bg)]/60 border border-[var(--border)]">
                  <div className="text-[var(--accent)] font-bold text-[14px] mb-1">✓ {f.name}</div>
                  <div className="text-[12px] text-[var(--fg-muted)] leading-relaxed">{f.detail}</div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 flex-wrap">
              <Link href="/app/ask" className="px-4 py-2 rounded-full text-[13px] font-bold text-[var(--bg)]"
                style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
              >
                ★ Ask Compass about {title} →
              </Link>
              <button className="px-4 py-2 rounded-full text-[13px] font-bold text-[var(--fg)] border border-white/20 hover:bg-white/5">
                ⬆ Import CSV template
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-5 border border-[var(--border)] flex items-start gap-4"
          style={{ background: "linear-gradient(180deg, var(--surface) 0%, var(--surface-3) 100%)" }}
        >
          <div className="text-[20px]">🚧</div>
          <div className="flex-1">
            <div className="text-[var(--fg)] font-bold text-[14px] mb-1">This page is in active build</div>
            <div className="text-[13px] text-[var(--fg-muted)]">
              The brain is live and answering questions on{" "}
              <Link href="/app/ask" className="text-[var(--accent)] font-bold hover:underline">Ask Compass</Link>.
              The dedicated screen — table view, detail drawers, CSV/manual/API import — ships next sprint.
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
