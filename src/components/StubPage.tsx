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
          className="rounded-2xl p-8 border border-[#1E3556] relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #000000 0%, #0F1C32 100%)" }}
        >
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full blur-3xl pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(2, 6, 12, 0.45), transparent 70%)" }}
          />
          <div className="relative">
            <div className="flex items-center gap-4 mb-4">
              <div className="text-[44px]">{icon}</div>
              <div>
                <h2 className="text-[26px] font-extrabold text-white">{title}</h2>
                <div className="text-[12px] font-mono text-[#16C7FF] mt-1">{cfr}</div>
              </div>
            </div>
            <p className="text-[15px] text-white/80 leading-relaxed mb-6 max-w-2xl">{desc}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              {features.map((f, i) => (
                <div key={i} className="rounded-xl p-4 bg-[#000000]/60 border border-[#1E3556]">
                  <div className="text-[#16C7FF] font-bold text-[14px] mb-1">✓ {f.name}</div>
                  <div className="text-[12px] text-white/70 leading-relaxed">{f.detail}</div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 flex-wrap">
              <Link href="/ask" className="px-4 py-2 rounded-full text-[13px] font-bold text-[#000000]"
                style={{ background: "linear-gradient(135deg, #16C7FF, #16C7FF)" }}
              >
                ★ Ask Compass about {title} →
              </Link>
              <button className="px-4 py-2 rounded-full text-[13px] font-bold text-white border border-white/20 hover:bg-white/5">
                ⬆ Import CSV template
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-5 border border-[#1E3556] flex items-start gap-4"
          style={{ background: "linear-gradient(180deg, #000000 0%, #0F1C32 100%)" }}
        >
          <div className="text-[20px]">🚧</div>
          <div className="flex-1">
            <div className="text-white font-bold text-[14px] mb-1">This page is in active build</div>
            <div className="text-[13px] text-white/70">
              The brain is live and answering questions on{" "}
              <Link href="/ask" className="text-[#16C7FF] font-bold hover:underline">Ask Compass</Link>.
              The dedicated screen · table view, detail drawers, CSV/manual/API import · ships next sprint.
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
