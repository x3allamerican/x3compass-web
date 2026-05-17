"use client";
import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { useUser } from "@/lib/useUser";

type Msg = { role: "user" | "assistant"; content: string; ts: number };
const STARTERS = [
  "What's required for pre-employment drug testing under § 382.301?",
  "When does a CDL get federally disqualified for life?",
  "What's the difference between a Level 1 and Level 2 roadside inspection?",
  "How do I file a DataQ challenge for a non-preventable accident?",
  "What goes in a Driver Qualification File under § 391.51?",
  "What placards do I need for a UN1993 Class 3 PG II shipment?",
];

export default function AskCompassPage() {
  const { user, carrier } = useUser();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, busy]);

  async function send(text: string) {
    if (!text.trim() || busy) return;
    const userMsg: Msg = { role: "user", content: text.trim(), ts: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setBusy(true);
    // Placeholder response — wired LLM endpoint comes next iteration
    setTimeout(() => {
      setMessages((prev) => [...prev, {
        role: "assistant",
        ts: Date.now(),
        content: `**${text}**\n\nI'd answer this with a CFR-cited response from the X3 Compass skills library here. The LLM backend (Claude API via /api/ask) ships in the next sprint — until then, browse the live [skills catalog](https://github.com/x3fleetsafety/skills) for the answer to "${text}".\n\nFor compliance-grade answers right now: visit the [Skills catalog](/skills) or reply to this email thread for human help — *joshua@x3compass.com*`,
      }]);
      setBusy(false);
    }, 600);
  }
  function handleSubmit(e: FormEvent) { e.preventDefault(); send(input); }

  return (
    <AppShell crumbs="ASK COMPASS" title="Ask Compass">
      <div className="p-6 max-w-4xl mx-auto">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full grid place-items-center text-[#0A1929] font-black text-2xl mx-auto mb-5" style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)" }}>∞</div>
            <h1 className="text-2xl font-extrabold mb-2">{user ? `Hi${(user.email||"").split("@")[0] ? ", " + (user.email||"").split("@")[0] : ""} — ask me anything FMCSA-related.` : "Ask me anything FMCSA-related."}</h1>
            <p className="text-white/55 mb-8">{carrier?.name && `On behalf of ${carrier.name}. `}300+ CFR-cited skills.</p>
            <div className="grid md:grid-cols-2 gap-2 max-w-2xl mx-auto">
              {STARTERS.map((s) => (
                <button key={s} onClick={() => send(s)} className="text-left p-3 rounded-lg bg-[#0F1C32] border border-[#1E3556] hover:border-[#22D3EE] text-[13px] text-white/85">{s}</button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
                {m.role === "assistant" && <div className="w-8 h-8 rounded-full grid place-items-center font-black text-sm flex-shrink-0 text-[#0A1929]" style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)" }}>∞</div>}
                <div className={`rounded-2xl px-4 py-3 max-w-[80%] ${m.role === "user" ? "bg-[#22D3EE]/15 border border-[#22D3EE]/30 text-white" : "bg-[#0F1C32] border border-[#1E3556] text-white/85"}`}>
                  <div className="whitespace-pre-wrap text-[14px]" dangerouslySetInnerHTML={{ __html: m.content.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-[#22D3EE] underline" target="_blank" rel="noopener noreferrer">$1</a>') }} />
                </div>
              </div>
            ))}
            {busy && <div className="flex gap-3"><div className="w-8 h-8 rounded-full grid place-items-center font-black text-sm text-[#0A1929]" style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)" }}>∞</div><div className="rounded-2xl px-4 py-3 bg-[#0F1C32] border border-[#1E3556] text-white/55 text-sm">Thinking…</div></div>}
            <div ref={endRef} />
          </div>
        )}
        <form onSubmit={handleSubmit} className="sticky bottom-6">
          <div className="flex gap-2 rounded-2xl border border-[#1E3556] bg-[#0F1C32] p-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask a FMCSA / DOT question…" className="flex-1 bg-transparent px-3 py-2 text-white outline-none text-sm" />
            <button type="submit" disabled={busy || !input.trim()} className="px-4 py-2 rounded-lg font-extrabold text-[13px] text-[#0A1929] disabled:opacity-50" style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)" }}>Send →</button>
          </div>
          <p className="text-[10px] text-white/35 mt-2 text-center">Answers cite the CFR. For audit-grade confirmation, also consult <Link href="/skills" className="text-[#22D3EE] underline">the skills catalog</Link>.</p>
        </form>
      </div>
    </AppShell>
  );
}
