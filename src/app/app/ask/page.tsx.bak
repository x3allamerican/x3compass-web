import Link from "next/link";
import AppShell from "@/components/AppShell";

const SKILL_CHIPS = [
  { cfr: "§ 391.51",  name: "What's missing from this DQF?" },
  { cfr: "Part 395",  name: "Walk me through the 14-hour rule" },
  { cfr: "Part 386",  name: "Is this inspection contestable?" },
  { cfr: "§ 382.701", name: "When is a full Clearinghouse query required?" },
  { cfr: "§ 396.17",  name: "Build me a 396 PM schedule" },
  { cfr: "Part 172",  name: "4,000 lbs of UN1203 — what placards?" },
  { cfr: "§ 390.15",  name: "First 24 hours after a crash?" },
  { cfr: "IFTA",       name: "How do I file IFTA quarterly?" },
];

const PAST_THREADS = [
  { title: "DataQ dispute · Ricardo Torres TX Level II",  when: "2 min ago",  status: "draft" },
  { title: "ELDT grandfather check · Ricardo Torres",     when: "12 min ago", status: "answered" },
  { title: "Random rate Q1 — was I 50% or 25%?",          when: "Yesterday",  status: "answered" },
  { title: "Hazmat segregation · Class 3 + Class 8",      when: "2 days ago", status: "answered" },
  { title: "Audit-ready export for Sarah Johnson",        when: "Mar 22",     status: "answered" },
];

export default function AskCompassPage() {
  return (
    <AppShell
      title="Ask Compass"
      crumbs="ADVANCED · YOUR AI SAFETY DIRECTOR · 300 SKILLS"
      actions={
        <button className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-full text-[12px] font-semibold text-white border border-white/15 hover:bg-white/5">
          + New chat
        </button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-0 min-h-[calc(100vh-64px)]">
        {/* Past threads sidebar */}
        <aside className="border-r border-[#1E3556] bg-[#0C1A30] py-5 px-3 hidden lg:block">
          <div className="text-[10px] tracking-[.14em] uppercase font-bold text-[#22D3EE]/60 px-2 mb-3">
            Recent · 47
          </div>
          <div className="space-y-1">
            {PAST_THREADS.map((t, i) => (
              <button
                key={i}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                  i === 0
                    ? "bg-[#22D3EE]/10 border border-[#22D3EE]/30"
                    : "hover:bg-white/5 border border-transparent"
                }`}
              >
                <div className="text-[12px] font-semibold text-white leading-snug mb-0.5 line-clamp-2">{t.title}</div>
                <div className="text-[10px] text-white/45">
                  {t.when}
                  {t.status === "draft" && <span className="ml-2 text-amber-300 font-bold">· DRAFT</span>}
                </div>
              </button>
            ))}
          </div>
          <div className="mt-4 px-2 py-2 text-[10px] text-white/35">+ 42 more conversations</div>
        </aside>

        {/* Chat pane */}
        <section className="flex flex-col">
          {/* Skill chips strip */}
          <div className="border-b border-[#1E3556] px-6 py-4 bg-[#0C1A30]/50">
            <div className="text-[10px] tracking-[.14em] uppercase font-bold text-[#22D3EE]/60 mb-2">
              ★ Start with a skill
            </div>
            <div className="flex gap-2 flex-wrap">
              {SKILL_CHIPS.map((s, i) => (
                <button
                  key={i}
                  className="px-3 py-2 rounded-full text-[12px] text-white/80 border border-[#1E3556] hover:border-[#22D3EE]/50 hover:bg-[#22D3EE]/5 inline-flex items-center gap-2"
                >
                  <span className="text-[#22D3EE] font-mono text-[10px] font-bold">{s.cfr}</span>
                  <span>{s.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6">
            {/* User message */}
            <div className="max-w-3xl ml-auto">
              <div className="flex gap-3 items-start justify-end">
                <div className="rounded-2xl rounded-tr-md p-4 bg-[#22D3EE]/15 border border-[#22D3EE]/30 max-w-[80%]">
                  <div className="text-[14px] text-white leading-relaxed">
                    Ricardo Torres got a Level II inspection in Texas on May 12 — 2 violations, both HOS. Is it worth filing a DataQ dispute?
                  </div>
                </div>
                <div
                  className="w-9 h-9 rounded-full grid place-items-center font-extrabold text-[11px] text-[#0A1929] flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)" }}
                >
                  JK
                </div>
              </div>
              <div className="text-[10px] text-white/40 text-right mt-1 mr-12">2:38 PM</div>
            </div>

            {/* Compass response */}
            <div className="max-w-3xl mr-auto">
              <div className="flex gap-3 items-start">
                <div
                  className="w-9 h-9 rounded-full grid place-items-center font-black text-[16px] text-[#0A1929] flex-shrink-0"
                  style={{
                    background: "linear-gradient(135deg, #22D3EE, #06B6D4)",
                    boxShadow: "0 0 16px rgba(34, 211, 238, 0.4)",
                  }}
                >
                  ∞
                </div>
                <div className="rounded-2xl rounded-tl-md p-5 max-w-[88%] border" style={{
                  background: "linear-gradient(180deg, #15233D 0%, #0F1C32 100%)",
                  borderColor: "rgba(34, 211, 238, 0.25)",
                }}>
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className="font-extrabold text-white text-[14px]">Compass</span>
                    <span className="text-[10px] font-mono text-[#22D3EE] bg-[#22D3EE]/10 border border-[#22D3EE]/25 px-2 py-1 rounded-full">
                      DataQ Disputes · 49 CFR Part 386
                    </span>
                  </div>
                  <div className="text-[14px] text-white/90 leading-relaxed space-y-3">
                    <p>
                      <strong className="text-[#22D3EE]">Yes — both look contestable. Win probability: 80%.</strong>
                    </p>
                    <p>
                      I pulled INS-4291 from FMCSA SAFER and cross-referenced against Ricardo&apos;s ELD log:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 ml-2">
                      <li>
                        <strong className="text-white">Violation 1 · § 395.8(a) “Driver did not have ELD”</strong> — the inspecting officer logged this at <code className="text-[#22D3EE] bg-[#22D3EE]/10 px-1.5 py-0.5 rounded font-mono text-[12px]">14:22 CDT</code>, but Ricardo&apos;s ELD shows continuous engine-on duty status from <code className="text-[#22D3EE] bg-[#22D3EE]/10 px-1.5 py-0.5 rounded font-mono text-[12px]">13:55 to 15:10 CDT</code>. Translation: the device was operating. This is a documented officer error — high-win pattern #4.
                      </li>
                      <li>
                        <strong className="text-white">Violation 2 · § 395.3(a)(2) “14-hour rule”</strong> — the citation says he was at hour 15.2 of the work day. ELD shows hour 13.8 with a 30-min break properly logged. The officer appears to have missed the break log. Officer-side miscalculation — high-win pattern #7.
                      </li>
                    </ol>
                    <p>
                      Both violations carry SMS weight in the HOS Compliance BASIC. Reversing them drops your percentile from 78 to roughly 64. Avg avoided premium impact across both:{" "}
                      <strong className="text-emerald-300">$600 over 24 months</strong>.
                    </p>
                    <p>I&apos;ve drafted the DataQ submission. Want to review it?</p>
                  </div>
                  <div className="flex gap-2 flex-wrap mt-4 pt-4 border-t border-[#1E3556]">
                    <button className="px-3 py-2 rounded-full text-[12px] font-bold text-[#0A1929]"
                      style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)" }}
                    >
                      Open the draft dispute →
                    </button>
                    <button className="px-3 py-2 rounded-full text-[12px] font-bold text-white border border-white/20 hover:bg-white/5">
                      Show me the ELD log
                    </button>
                    <button className="px-3 py-2 rounded-full text-[12px] font-bold text-white border border-white/20 hover:bg-white/5">
                      Read § 395.3 text
                    </button>
                    <button className="px-3 py-2 rounded-full text-[12px] font-bold text-white border border-white/20 hover:bg-white/5">
                      Export as PDF
                    </button>
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-white/40 ml-12 mt-1">2:38 PM · Grounded in 49 CFR §§ 386, 395 · 21 worked examples</div>
            </div>
          </div>

          {/* Input bar */}
          <div className="border-t border-[#1E3556] px-6 py-5 bg-[#0C1A30]/50">
            <div className="rounded-2xl border border-[#1E3556] bg-[#15233D] flex items-end gap-2 p-3 max-w-4xl mx-auto focus-within:border-[#22D3EE]/50">
              <button className="text-white/45 hover:text-white p-2" aria-label="Attach">📎</button>
              <textarea
                rows={1}
                placeholder="Ask anything about FMCSA compliance — CFR-cited answer in seconds."
                className="flex-1 bg-transparent text-[14px] text-white placeholder:text-white/40 resize-none outline-none py-2"
              />
              <button
                className="px-4 py-2 rounded-full text-[13px] font-bold text-[#0A1929] flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)", boxShadow: "0 4px 12px rgba(34, 211, 238, 0.32)" }}
              >
                Ask Compass →
              </button>
            </div>
            <div className="max-w-4xl mx-auto mt-2 text-[10px] text-white/40 flex items-center justify-between flex-wrap gap-2">
              <span>Every answer cites the CFR it&apos;s grounded in. Compass never invents regulations.</span>
              <span>300 published skills · ⌘K to switch skill</span>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
