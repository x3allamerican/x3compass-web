"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";

type Source = { kind: string; score: number; citation?: string; title?: string; text?: string };

export default function DocumentLookupPage() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [err, setErr] = useState<string | null>(null);

  async function run(e?: React.FormEvent) {
    e?.preventDefault();
    if (!q.trim()) return;
    setLoading(true); setErr(null); setAnswer(null); setSources([]);
    try {
      const r = await fetch(`https://api.x3api.com/ask?q=${encodeURIComponent(q)}&k=8&synth=1`);
      const d = await r.json();
      setAnswer(d.answer || null);
      setSources(Array.isArray(d.sources) ? d.sources : []);
    } catch {
      setErr("The brain is unavailable right now. Try again in a moment.");
    } finally { setLoading(false); }
  }

  return (
    <AppShell title="Document Lookup" crumbs="X3 COMPASS · COMPLIANCE LIBRARY">
      <div className="px-6 py-8 max-w-4xl mx-auto">
        <h2 className="text-[22px] font-extrabold text-white mb-1">Ask the X3 Compliance Brain</h2>
        <p className="text-[13px] text-white/60 mb-5">One search across 70,000+ CFR documents and 120,000+ decomposed obligations — every answer cited to the section it came from.</p>
        <form onSubmit={run} className="flex gap-2 mb-6">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. What goes in a driver qualification file? · 391.51 · IFTA decals · pre-adverse action"
            className="flex-1 rounded-lg px-4 py-3 bg-[#0F1C32] border border-[#1E3556] text-white text-[14px] outline-none focus:border-[#16C7FF]" />
          <button type="submit" disabled={loading}
            className="rounded-lg px-5 py-3 bg-[#16C7FF] text-black font-bold text-[14px] disabled:opacity-50">{loading ? "Searching…" : "Search"}</button>
        </form>
        {err && <div className="text-rose-300 text-[13px] mb-4">{err}</div>}
        {answer && (
          <div className="rounded-xl p-5 mb-6 border border-[#1E3556] bg-[#0B1626]">
            <div className="text-[11px] font-mono text-[#16C7FF] mb-2">GROUNDED ANSWER</div>
            <div className="text-[14px] text-white/90 whitespace-pre-wrap leading-relaxed">{answer}</div>
          </div>
        )}
        {sources.length > 0 && (
          <div className="space-y-2">
            <div className="text-[11px] font-mono text-white/40 mb-1">SOURCES ({sources.length})</div>
            {sources.map((s, i) => (
              <div key={i} className="rounded-lg p-3 border border-[#16233B] bg-[#0A1322]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#16C7FF]/15 text-[#16C7FF] font-mono">{s.kind}</span>
                  <span className="text-[12px] font-mono text-emerald-300">{s.citation || "—"}</span>
                  <span className="text-[10px] text-white/30 ml-auto">{(s.score * 100).toFixed(0)}% match</span>
                </div>
                <div className="text-[13px] text-white/80">{s.text || s.title}</div>
              </div>
            ))}
          </div>
        )}
        {!answer && !sources.length && !loading && !err && (
          <div className="text-[13px] text-white/40">Type a plain-English question, a CFR citation, or a form code and the brain returns the answer with its sources.</div>
        )}
      </div>
    </AppShell>
  );
}
