import Link from "next/link";
import AppShell from "@/components/AppShell";
import PageGuide from "@/components/PageGuide";

const SERVICE_ITEMS = [
  { icon: "🎲", title: "Run quarterly random selection",         status: "✓ Completed Apr 12 · 18 drivers selected", action: "View selection" },
  { icon: "📧", title: "Notify selected drivers + dispatch",      status: "✓ Completed Apr 12 · all confirmed",         action: "Resend reminder" },
  { icon: "🧪", title: "Schedule collection appointments",        status: "✓ 17 of 18 complete · 1 pending", action: "Open pending" },
  { icon: "🔬", title: "Coordinate lab + MRO verification",       status: "✓ All results back · 1 dilute retest scheduled", action: "View results" },
  { icon: "📁", title: "File results into driver DQ packets",     status: "✓ Auto-filed", action: "Open packets" },
  { icon: "⚠️", title: "Refusal & positive-result investigations", status: "★ 1 active investigation · Emma Cooper", action: "Open case" },
  { icon: "📞", title: "FMCSA Clearinghouse violation reporting", status: "★ 1 owed · Emma Cooper · 90d overdue", action: "Submit report" },
  { icon: "🩺", title: "SAP coordination + return-to-duty flow",   status: "Standby · 0 active",       action: "Workflow ready" },
  { icon: "📅", title: "Annual Clearinghouse queries",            status: "4 due this quarter · auto-scheduled", action: "Review schedule" },
  { icon: "📊", title: "Quarterly compliance review call",         status: "Next: Jun 14, 2026 · 10am CST",       action: "Reschedule" },
];

const ADVISOR_TIMELINE = [
  { when: "Today · 9:14am", actor: "X3 Advisor", msg: "Confirmed Emma Park's Q2 random selection collection completed at Concentra El Paso. Results expected within 48 hr." },
  { when: "Yesterday · 4:38pm", actor: "Compass", msg: "Flagged Emma Cooper Clearinghouse violation report as 90 days overdue. Draft report ready for review." },
  { when: "May 9 · 11:20am", actor: "X3 Advisor", msg: "Mailed Emma Cooper's adverse-action packet · certified mail tracking 9405 5036 9930 0114 8821 30." },
  { when: "May 8 · 7:45am", actor: "Compass", msg: "Random selection executed for Q2 · 18 drivers, 50% of CDL roster. List sent to dispatch." },
  { when: "May 1 · 2:10pm", actor: "X3 Advisor", msg: "Quarterly review call complete with Joshua. Action items: clear Q1 backlog, enroll all drivers in continuous MVR." },
];

export default function DAConciergePage() {
  return (
    <AppShell
      title="D&A Concierge"
      crumbs="COMPLIANCE TRACKERS · X3-STAFF-MANAGED · 49 CFR PART 382"
      actions={
        <>
          <Link href="/app/ask" className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-full text-[12px] font-semibold text-white border border-white/15 hover:bg-white/5">
            📞 Call your advisor
          </Link>
          <Link href="/app/ask" className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold text-[#000000]"
            style={{ background: "linear-gradient(135deg, #16C7FF, #16C7FF)", boxShadow: "0 4px 12px rgba(2, 6, 12, 0.45)" }}
          >
            ★ Message Brad
          </Link>
        </>
      }
    >
      <div className="px-6 py-8 space-y-6">
        {/* HOW THIS PAGE WORKS */}
        <PageGuide
          cfr="49 CFR Part 382 + 49 CFR Part 40"
          what="Done-for-you D&A program management · X3 safety advisor handles your random pool, Clearinghouse reporting, MRO coordination, and incident response."
          who="Carriers who want a human handling their D&A program. Best for fleets of 5-100 trucks who don't want to run it themselves."
          howTo={[
            { n: 1, title: "Meet your X3 safety advisor", detail: "You get a dedicated advisor (Brad Reynolds · 22 years FMCSA). They take over the random pool, Clearinghouse, and MRO communications." },
            { n: 2, title: "Forward all D&A communications to your advisor", detail: "Lab results, MRO reports, refusals, positive notifications · all routed to your advisor. They handle the workflow and you get a summary." },
            { n: 3, title: "Review the advisor's activity log weekly", detail: "Compass D&A Concierge shows every action taken on your behalf: random selections sent, lab orders placed, MRO consultations completed." },
          ]}
          weeklyHabits={["Review the advisor's weekly summary · what tests ran, what came back, what's pending", "Approve any non-routine decisions the advisor flags (e.g., refusal escalations)"]}
          auditTraps={["Advisor's recommendations not implemented · carrier still responsible if you ignore the advisor", "Test results not reaching the advisor (e.g., still going to a generic inbox)"]}
          askCompassLinks={[{ label: "What does the X3 safety advisor handle for me?", query: "What does the X3 safety advisor handle" }, { label: "What's included in the D&A concierge?", query: "What is included in the D&A concierge" }]}
        />

        {/* Advisor card */}
        <div className="rounded-2xl p-6 border border-[#16C7FF]/30 flex items-center gap-6 flex-wrap"
          style={{ background: "linear-gradient(135deg, rgba(2, 6, 12, 0.45), rgba(15, 28, 50, 0.6))" }}
        >
          <div
            className="w-16 h-16 rounded-full grid place-items-center font-black text-[20px] text-[#000000] flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #16C7FF, #16C7FF)",
              boxShadow: "0 0 28px rgba(2, 6, 12, 0.45)",
            }}
          >
            BR
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] tracking-[.14em] uppercase font-extrabold text-[#16C7FF] mb-1">
              YOUR DEDICATED X3 SAFETY ADVISOR
            </div>
            <h2 className="text-[22px] font-extrabold text-white tracking-tight">Brad Reynolds</h2>
            <div className="text-[13px] text-white/65 mt-0.5">22 years FMCSA experience · DOT auditor certification · brad@x3compass.com · (281) 555-0142</div>
          </div>
          <div className="text-right">
            <div className="text-[11px] tracking-wider uppercase text-white/55 mb-1">This month</div>
            <div className="text-[22px] font-black text-white">24 hrs</div>
            <div className="text-[12px] text-white/65">of work logged</div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { l: "Random pool size",           v: "72 CDL", c: "#16C7FF" },
            { l: "Current period rate",         v: "50%",   c: "#10B981" },
            { l: "Active investigations",       v: "1",     c: "#FBBF24" },
            { l: "Clearinghouse owed",          v: "1",     c: "#F87171" },
            { l: "Days since last positive",    v: "94",    c: "#10B981" },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl p-4 border border-[#1E3556]" style={{ background: "linear-gradient(180deg, #000000 0%, #0F1C32 100%)" }}>
              <div className="text-[11px] tracking-[.14em] uppercase font-extrabold text-white/65 mb-1">{s.l}</div>
              <div className="text-[26px] font-black leading-none" style={{ color: s.c }}>{s.v}</div>
            </div>
          ))}
        </div>

        {/* Service items checklist */}
        <div className="rounded-2xl border border-[#1E3556] overflow-hidden" style={{ background: "linear-gradient(180deg, #000000 0%, #0F1C32 100%)" }}>
          <div className="px-5 py-4 border-b border-[#1E3556]">
            <h3 className="text-[16px] font-extrabold text-white">What X3 staff is handling for you</h3>
            <p className="text-[13px] text-white/65 mt-0.5">The full Part 382 lifecycle · your only job is to read the morning digest.</p>
          </div>
          <div className="divide-y divide-[#1E3556]">
            {SERVICE_ITEMS.map((s, i) => {
              const isAction = s.status.startsWith("★");
              return (
                <div key={i} className="px-5 py-4 flex items-center gap-4 hover:bg-[#16C7FF]/5">
                  <div className="text-[24px] flex-shrink-0">{s.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-bold">{s.title}</div>
                    <div className={`text-[13px] mt-0.5 ${isAction ? "text-amber-300 font-bold" : "text-white/70"}`}>{s.status}</div>
                  </div>
                  <button className={`text-[13px] font-bold whitespace-nowrap ${isAction ? "text-[#000000] px-4 py-2 rounded-full" : "text-[#16C7FF] hover:text-[#16C7FF]"}`}
                    style={isAction ? { background: "linear-gradient(135deg, #16C7FF, #16C7FF)" } : undefined}
                  >
                    {s.action} →
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Advisor activity log */}
        <div className="rounded-2xl border border-[#1E3556] overflow-hidden" style={{ background: "linear-gradient(180deg, #000000 0%, #0F1C32 100%)" }}>
          <div className="px-5 py-4 border-b border-[#1E3556]">
            <h3 className="text-[16px] font-extrabold text-white">Recent activity log</h3>
            <p className="text-[13px] text-white/65 mt-0.5">Every action Brad and Compass have taken on your account.</p>
          </div>
          <div className="divide-y divide-[#1E3556]">
            {ADVISOR_TIMELINE.map((t, i) => (
              <div key={i} className="px-5 py-4 flex gap-4 items-start">
                <div className={`w-9 h-9 rounded-full grid place-items-center font-bold text-[11px] flex-shrink-0 ${
                  t.actor === "X3 Advisor"
                    ? "bg-[#16C7FF]/15 text-[#16C7FF] border border-[#16C7FF]/30"
                    : "text-[#000000]"
                }`}
                  style={t.actor === "Compass" ? { background: "linear-gradient(135deg, #16C7FF, #16C7FF)" } : undefined}
                >
                  {t.actor === "X3 Advisor" ? "BR" : "∞"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-white font-bold text-[13.5px]">{t.actor}</span>
                    <span className="text-[12px] text-white/55">· {t.when}</span>
                  </div>
                  <div className="text-[14px] text-white/85 leading-relaxed">{t.msg}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
