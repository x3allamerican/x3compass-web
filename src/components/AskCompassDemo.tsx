"use client";

import { useState } from "react";

const PROMPTS = [
  "4,000 lbs of UN1203 — do I need a placard?",
  "When does a CDL holder have to notify their employer of a license suspension?",
  "What's the post-accident drug-test window?",
  "How long must I keep DQ files after a driver leaves?",
];

type Response = {
  content: string;
  cited_sections: string[];
  unverified_citations: string[];
  citation_quality_score: number | null;
};

export default function AskCompassDemo() {
  const [prompt, setPrompt] = useState("");
  const [resp, setResp] = useState<Response | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function ask(q: string) {
    setLoading(true); setErr(null); setResp(null);
    try {
      const r = await fetch("/api/ask-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: q }),
      });
      const d = await r.json();
      if (!r.ok || !d.ok) {
        setErr(d.error || `Error ${r.status}`);
      } else {
        setResp(d);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Network error");
    } finally { setLoading(false); }
  }

  const verifiedCount = resp ? resp.cited_sections.length - resp.unverified_citations.length : 0;
  const isVerified = (sec: string) => resp ? !resp.unverified_citations.includes(sec) : true;

  return (
    <div className="x3-card overflow-hidden">
      {/* Input row */}
      <div className="p-5 border-b border-[var(--border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-8 h-8 rounded-full grid place-items-center font-black text-[14px] text-[var(--accent-fg)] bg-[var(--accent)]">∞</span>
          <div className="text-[15px] font-bold text-[var(--fg)]">Ask Compass — live demo</div>
          <div className="ml-auto text-[10px] tracking-wider uppercase font-bold text-[var(--fg-faint)]">No signup · 5 free questions / 6 hours</div>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); if (prompt.trim()) ask(prompt.trim()); }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask any FMCSA compliance question…"
            disabled={loading}
            maxLength={800}
            className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-lg px-4 py-3 text-[14px] text-[var(--fg)] placeholder:text-[var(--fg-faint)] focus:outline-none focus:border-[var(--accent)] disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="px-5 py-3 rounded-lg font-bold text-[14px] text-[var(--accent-fg)] bg-[var(--accent)] hover:bg-[var(--accent-2)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {loading ? "…" : "Ask →"}
          </button>
        </form>
        {/* Quick-pick prompts */}
        <div className="mt-3 flex flex-wrap gap-2">
          {PROMPTS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => { setPrompt(p); ask(p); }}
              disabled={loading}
              className="text-[11px] text-[var(--fg-muted)] border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] px-2.5 py-1 rounded-full transition-colors disabled:opacity-40"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Response area */}
      <div className="p-5 min-h-[180px]">
        {!resp && !loading && !err && (
          <div className="text-[var(--fg-faint)] text-[14px] py-6">
            Ask a question above, or click a quick-pick. The answer will appear here with every CFR citation
            checked against the live <span className="font-mono text-[var(--fg-muted)]">ecfr.gov</span>{" "}
            registry. Verified citations get a ✓ chip.
          </div>
        )}

        {loading && (
          <div className="text-[var(--fg-muted)] text-[14px] py-6 flex items-center gap-3">
            <span className="w-4 h-4 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
            Thinking… (checking each cited section against eCFR live)
          </div>
        )}

        {err && (
          <div className="text-[13px] text-[var(--danger)] py-4">
            {err}{" "}
            <a href="/signup" className="ml-2 underline font-bold">Sign up for unlimited access →</a>
          </div>
        )}

        {resp && (
          <div className="space-y-4">
            {/* Quality chip */}
            <div className="flex flex-wrap items-center gap-2">
              {resp.cited_sections.length === 0 ? (
                <span className="text-[11px] text-[var(--fg-muted)]">No CFR citations in this answer</span>
              ) : resp.citation_quality_score === 1.0 ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[var(--success)] bg-[var(--success)]/10 border border-[var(--success)]/30 px-2 py-1 rounded-full">
                  <span>✓</span> {verifiedCount} of {resp.cited_sections.length} CFR citations verified against eCFR
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[var(--warning)] bg-[var(--warning)]/10 border border-[var(--warning)]/30 px-2 py-1 rounded-full">
                  <span>⚠</span> {verifiedCount}/{resp.cited_sections.length} verified — {resp.unverified_citations.length} could not be confirmed
                </span>
              )}
              {resp.cited_sections.map((sec) => (
                <span
                  key={sec}
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    isVerified(sec)
                      ? "text-[var(--success)] bg-[var(--success)]/10 border border-[var(--success)]/30"
                      : "text-[var(--warning)] bg-[var(--warning)]/10 border border-[var(--warning)]/30"
                  }`}
                >
                  {isVerified(sec) ? "✓ " : "⚠ "}{sec}
                </span>
              ))}
            </div>

            {/* The answer */}
            <div className="prose prose-invert max-w-none text-[14px] text-[var(--fg)] leading-relaxed whitespace-pre-wrap font-sans">
              {resp.content}
            </div>

            {/* Trust footer */}
            <div className="text-[11px] text-[var(--fg-faint)] pt-3 border-t border-[var(--border)]">
              This is one of 300+ skills inside Compass. Citation verification, multi-turn conversations, document
              upload, and your own carrier&apos;s data all unlock at $25/driver.{" "}
              <a href="/signup" className="text-[var(--accent)] font-bold hover:underline">Start your 7-day trial →</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
