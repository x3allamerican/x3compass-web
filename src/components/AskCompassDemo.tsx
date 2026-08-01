"use client";

/**
 * Homepage AI Concierge demo · inline working box.
 * Mirrors the in-app Concierge: preset action pills, textarea,
 * cyan Send button, answer display below.
 *
 * Wired to /api/ask Pages Function. Falls back to graceful error
 * message if the endpoint is rate-limited or unavailable.
 */

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

const PRESETS = [
  "What's the random drug-test rate for 2025 under § 382.305?",
  "When does a driver need to be in the Clearinghouse?",
  "What documents go in a § 391.51 DQ file?",
  "Can I use a UN 1203 placard for residue under § 172.514?",
  "What's the post-accident drug test trigger under § 382.303?",
  "How long do I retain a roadside inspection under § 396.9?",
];

type Source = { id: string; name: string; cfr: string };

type AnswerState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "answer"; text: string; citations: string[]; sources: Source[] }
  | { status: "error"; message: string };

// Extract any "§ 123.45" or "§ 123.45(a)(1)" patterns Compass returns so we can
// render them as the green ✓ citation chips at the bottom of the answer panel.
function extractCfrCitations(text: string): string[] {
  const matches = text.match(/§\s*\d{2,3}\.\d{1,3}(?:\([a-z0-9]+\))*/gi) || [];
  // Dedupe while preserving order.
  const seen = new Set<string>();
  return matches.filter((c) => {
    const k = c.replace(/\s+/g, " ").trim();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export default function AskCompassDemo() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<AnswerState>({ status: "idle" });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset everything back to the empty preset+textarea state.
  // Used by the ✕ close button and the "Ask another question" CTA.
  function reset(focus = true) {
    setAnswer({ status: "idle" });
    setQuestion("");
    if (focus) {
      // Defer until after render so the textarea is mounted.
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  }

  const ask = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setAnswer({ status: "loading" });
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // /api/ask contract: { messages: [{role,content}], context? }
        // → returns { ok: true, content: string } | { ok: false, error: string }
        body: JSON.stringify({
          messages: [{ role: "user", content: q.trim() }],
        }),
      });

      // Try to parse JSON regardless of status so we can surface the real error.
      let data: { ok?: boolean; content?: string; sources?: Source[]; error?: string } = {};
      try { data = await res.json(); } catch { /* non-JSON body */ }

      if (!res.ok || data.ok === false) {
        const msg =
          res.status === 429
            ? "You've used your 5 free questions for this 6-hour window. Start a free trial to keep going."
            : data.error
            ? `Concierge: ${data.error}`
            : `Couldn't reach the Concierge right now (${res.status}). Try again in a moment.`;
        setAnswer({ status: "error", message: msg });
        return;
      }

      const text: string = (data.content ?? "").trim() || "No answer returned.";
      const sources: Source[] = Array.isArray(data.sources) ? data.sources : [];
      setAnswer({
        status: "answer",
        text,
        citations: extractCfrCitations(text),
        sources,
      });
    } catch {
      setAnswer({
        status: "error",
        message: "Network hiccup. Try one of the preset questions or refresh the page.",
      });
    }
  }, []);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    ask(question);
  }

  function onPreset(q: string) {
    setQuestion(q);
    ask(q);
  }

  // Pre-fill + auto-submit on mount from either:
  //   - URL param `?q=<question>` (from /skills card navigation)
  //   - Custom DOM event "ask-compass:submit" with detail.q (from same-page skill cards)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const urlQ = params.get("q");
    if (urlQ && urlQ.trim()) {
      setQuestion(urlQ);
      ask(urlQ);
      // Clean the URL so a refresh doesn't re-fire the question.
      const clean = window.location.pathname + window.location.hash;
      window.history.replaceState(null, "", clean);
    }

    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ q?: string }>;
      const q = ce.detail?.q;
      if (q && q.trim()) {
        setQuestion(q);
        ask(q);
      }
    };
    window.addEventListener("ask-compass:submit", handler);
    return () => window.removeEventListener("ask-compass:submit", handler);
  }, [ask]);

  return (
    <div
      id="ask-compass-demo"
      className="relative rounded-2xl border border-[#1E3556] overflow-hidden scroll-mt-24 bg-black"
    >
      {/* Top accent stripe · matches Brain card style */}
      <div
        aria-hidden="true"
        className="absolute left-0 right-0 top-0 h-[3px]"
        style={{
          background:
            "linear-gradient(90deg, #16C7FF 0%, #16C7FF 50%, #5EE5FF 100%)",
        }}
      />

      <div className="p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-[15px] font-black"
            style={{
              background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
              color: "var(--bg)",
            }}
            aria-hidden="true"
          >
            AI
          </div>
          <div className="text-left">
            <div className="text-[15px] font-bold text-[var(--fg)]">AI Concierge</div>
            <div className="text-[12px] text-[var(--fg-faint)]">
              Live · powered by 300 CFR-cited skills
            </div>
          </div>
        </div>

        {/* Preset action pills */}
        <div className="mb-5">
          <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[var(--accent)] mb-2 text-left">
            Common questions
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((q, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onPreset(q)}
                className="text-left text-[13px] px-3 py-2 rounded-full border border-[#16C7FF]/40 bg-[#16C7FF]/5 text-[var(--fg)] hover:bg-[#16C7FF]/15 hover:border-[#16C7FF]/70 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input + Send */}
        <form onSubmit={onSubmit} className="relative">
          <textarea
            ref={textareaRef}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask any FMCSA compliance question…"
            rows={3}
            className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--fg)] placeholder:text-[var(--fg-faint)] p-4 pr-32 text-[15px] focus:outline-none focus:border-[#16C7FF]/60"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                ask(question);
              }
            }}
          />
          <button
            type="submit"
            disabled={answer.status === "loading" || !question.trim()}
            className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full font-bold text-[14px] text-[var(--bg)] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background:
                "linear-gradient(135deg, var(--accent), var(--accent-2))",
              boxShadow: "0 4px 14px rgba(22,199,255,0.35)",
            }}
          >
            {answer.status === "loading" ? "Asking…" : "Send →"}
          </button>
        </form>

        {/* Hint line */}
        <div className="mt-3 text-[11px] tracking-[.14em] uppercase font-bold text-[var(--fg-faint)] text-left">
          Press Enter to send · Shift+Enter for a new line · 5 free questions per 6 hours
        </div>

        {/* Answer panel */}
        {answer.status !== "idle" && (
          <div className="mt-6 border-t border-[var(--border)] pt-6">
            {answer.status === "loading" && (
              <div className="flex items-center gap-3 text-[14px] text-[var(--fg-muted)]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#16C7FF] animate-pulse" />
                Looking it up in 49 CFR…
              </div>
            )}

            {answer.status === "error" && (
              <div className="relative rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4 text-[14px] text-[var(--fg-muted)]">
                <button
                  type="button"
                  onClick={() => reset()}
                  aria-label="Clear error and ask another question"
                  className="absolute top-2 right-2 w-7 h-7 inline-flex items-center justify-center rounded-full text-[var(--fg-faint)] hover:text-[var(--fg)] hover:bg-[var(--bg-3)] transition-colors"
                  title="Clear"
                >
                  ✕
                </button>
                <div className="pr-8">{answer.message}</div>
                <button
                  type="button"
                  onClick={() => reset()}
                  className="mt-3 text-[13px] font-bold text-[#16C7FF] hover:underline"
                >
                  Try another question →
                </button>
              </div>
            )}

            {answer.status === "answer" && (
              <div className="relative rounded-xl border border-[#16C7FF]/30 bg-[var(--bg)] p-5">
                <button
                  type="button"
                  onClick={() => reset()}
                  aria-label="Clear answer and start over"
                  className="absolute top-3 right-3 w-8 h-8 inline-flex items-center justify-center rounded-full text-[var(--fg-faint)] hover:text-[var(--fg)] hover:bg-[var(--bg-3)] transition-colors text-[15px]"
                  title="Clear answer"
                >
                  ✕
                </button>
                <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[var(--accent)] mb-3 pr-10">
                  Concierge answer
                </div>
                <div className="text-[15px] text-[var(--fg)] leading-relaxed whitespace-pre-wrap">
                  {answer.text}
                </div>
                {answer.citations.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[var(--border)] flex flex-wrap gap-2">
                    {answer.citations.map((c, i) => (
                      <span
                        key={i}
                        className="text-[11px] font-bold font-mono text-[#16C7FF] bg-[#16C7FF]/10 border border-[#16C7FF]/30 px-2 py-1 rounded-full"
                      >
                        ✓ {c}
                      </span>
                    ))}
                  </div>
                )}
                {answer.sources.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[var(--border)]">
                    <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[var(--fg-faint)] mb-2">
                      Grounded in {answer.sources.length} X3 Compass {answer.sources.length === 1 ? "skill" : "skills"}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {answer.sources.map((s) => (
                        <span
                          key={s.id}
                          title={`${s.name} · ${s.cfr}`}
                          className="text-[12px] font-medium text-[var(--fg)] bg-[var(--bg-3)] border border-[var(--border)] px-2.5 py-1 rounded-md"
                        >
                          {s.name}
                          <span className="ml-2 font-mono text-[10px] text-[#16C7FF]">{s.cfr}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reset CTA · returns user to the empty preset+textarea state */}
                <div className="mt-5 pt-5 border-t border-[var(--border)] flex items-center justify-between gap-3">
                  <div className="text-[12px] text-[var(--fg-faint)]">
                    Was this helpful? Ask a follow-up or start fresh.
                  </div>
                  <button
                    type="button"
                    onClick={() => reset()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold border border-[#16C7FF]/40 bg-[#16C7FF]/5 text-[#16C7FF] hover:bg-[#16C7FF]/15 hover:border-[#16C7FF]/70 transition-colors"
                  >
                    ↻ Ask another question
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
