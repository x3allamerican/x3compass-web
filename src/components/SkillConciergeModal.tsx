"use client";

/**
 * SkillConciergeModal — overlay launched from the marketing-site skill cards
 * (homepage SkillsExplorer + /skills catalog).
 *
 * Opens in-place when a user clicks any skill: no navigation, no page jump.
 * Fires the skill's question against /api/ask + the 300-skill corpus and
 * renders the streaming answer with CFR citation highlighting.
 *
 * Separate from web/src/components/ConciergeModal.tsx (that one is for the
 * /app surfaces and uses a custom-event interface).
 *
 * Contract: pass `question` (null = closed, string = open + auto-fire).
 * Parent owns the open state and resets via onClose.
 */

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Source = { id: string; name: string; cfr: string };

type AnswerState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "answer"; text: string; citations: string[]; sources: Source[] }
  | { status: "error"; message: string };

function extractCfrCitations(text: string): string[] {
  const matches = text.match(/§\s*\d{2,3}\.\d{1,3}(?:\([a-z0-9]+\))*/gi) || [];
  const seen = new Set<string>();
  return matches.filter((c) => {
    const k = c.replace(/\s+/g, " ").trim();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function renderInline(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
    .replace(
      /(§\s?\d+\.\d+(?:\([a-z0-9]+\))?(?:\([a-z0-9]+\))?|49 CFR (?:§\s?)?\d+(?:\.\d+)?|Part \d+|15 U\.S\.C\.\s?§\s?\d+(?:\([a-z0-9]+\))?(?:\([a-z0-9]+\))?|UN\d{4}|MCSA-\d+|FMVSS|FCRA)/g,
      '<span class="text-[#16C7FF] font-mono">$1</span>'
    );
}

function renderAnswer(answer: string) {
  const lines = answer.split("\n");
  const blocks: React.ReactNode[] = [];
  let listBuf: string[] = [];

  const flushList = () => {
    if (listBuf.length) {
      blocks.push(
        <ul key={`l${blocks.length}`} className="list-disc pl-5 space-y-1.5 my-2.5 text-white/85">
          {listBuf.map((li, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: renderInline(li) }} />
          ))}
        </ul>
      );
      listBuf = [];
    }
  };

  for (const raw of lines) {
    const t = raw.trim();
    if (!t) {
      flushList();
      continue;
    }
    if (/^[•\-\d]+[.)]?\s/.test(t)) {
      listBuf.push(t.replace(/^[•\-\d]+[.)]?\s/, ""));
    } else {
      flushList();
      blocks.push(
        <p
          key={`p${blocks.length}`}
          className="text-[14px] text-white/85 leading-relaxed my-2"
          dangerouslySetInnerHTML={{ __html: renderInline(t) }}
        />
      );
    }
  }
  flushList();
  return blocks;
}

export default function SkillConciergeModal({
  question,
  cfr,
  name,
  onClose,
}: {
  question: string | null;
  cfr?: string;
  name?: string;
  onClose: () => void;
}) {
  const [answer, setAnswer] = useState<AnswerState>({ status: "idle" });
  const lastQuestion = useRef<string | null>(null);

  // Fire /api/ask when a new question is set.
  useEffect(() => {
    if (!question) {
      setAnswer({ status: "idle" });
      lastQuestion.current = null;
      return;
    }
    if (lastQuestion.current === question) return; // dedupe
    lastQuestion.current = question;

    let cancelled = false;
    (async () => {
      setAnswer({ status: "loading" });
      try {
        const res = await fetch("/api/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [{ role: "user", content: question }] }),
        });
        let data: { ok?: boolean; content?: string; sources?: Source[]; error?: string } = {};
        try { data = await res.json(); } catch { /* non-JSON */ }

        if (cancelled) return;

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
        if (!cancelled) {
          setAnswer({
            status: "error",
            message: "Network hiccup. Close this and try again.",
          });
        }
      }
    })();

    return () => { cancelled = true; };
  }, [question]);

  // ESC closes the modal.
  useEffect(() => {
    if (!question) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [question, onClose]);

  // Lock body scroll while open.
  useEffect(() => {
    if (!question) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = original; };
  }, [question]);

  if (!question) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="AI Concierge answer"
    >
      <div
        className="w-full max-w-3xl rounded-2xl border border-[#1E3556] my-8 overflow-hidden relative"
        style={{ background: "linear-gradient(180deg, #0F1C32 0%, #000000 100%)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top accent stripe */}
        <div
          aria-hidden="true"
          className="absolute left-0 right-0 top-0 h-[3px]"
          style={{
            background: "linear-gradient(90deg, #16C7FF 0%, #16C7FF 50%, #5EE5FF 100%)",
          }}
        />

        {/* Header */}
        <div className="px-6 pt-7 pb-5 border-b border-[#1E3556]">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              {cfr && (
                <span className="text-[11px] font-extrabold tracking-wider text-[#16C7FF] bg-[#16C7FF]/10 border border-[#16C7FF]/25 px-2.5 py-1 rounded-full font-mono">
                  {cfr}
                </span>
              )}
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/45">
                Live AI Concierge · grounded in 300 skills
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-white/55 hover:text-white text-[22px] leading-none -mt-1"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          {name && (
            <h3 className="text-[20px] sm:text-[22px] font-extrabold text-white mb-3 leading-tight">
              {name}
            </h3>
          )}
          <div className="rounded-lg bg-[#000000] border border-[#1E3556] px-4 py-3 text-[14px] text-white/85 italic">
            &ldquo;{question}&rdquo;
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 min-h-[180px]">
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-7 h-7 rounded-full grid place-items-center text-[#000000] font-black text-[14px]"
              style={{ background: "linear-gradient(135deg, #16C7FF, #16C7FF)" }}
              aria-hidden="true"
            >
              ∞
            </div>
            <div className="text-[12px] font-extrabold text-white">Compass · live answer</div>
          </div>

          {answer.status === "loading" && (
            <div className="flex items-center gap-3 py-6">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full bg-[#16C7FF] animate-pulse"
                aria-hidden="true"
              />
              <span className="text-[14px] text-white/65">Searching CFR + 300 skills…</span>
            </div>
          )}

          {answer.status === "error" && (
            <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-[13.5px] text-rose-100/90">
              {answer.message}
            </div>
          )}

          {answer.status === "answer" && (
            <>
              <div className="space-y-1">{renderAnswer(answer.text)}</div>

              {answer.sources.length > 0 && (
                <div className="mt-5 pt-4 border-t border-[#1E3556]">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-white/45 mb-2">
                    Grounded in {answer.sources.length} skill
                    {answer.sources.length === 1 ? "" : "s"}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {answer.sources.slice(0, 8).map((s) => (
                      <span
                        key={s.id}
                        className="text-[10.5px] font-semibold text-[#16C7FF] bg-[#16C7FF]/8 border border-[#16C7FF]/20 px-2 py-0.5 rounded-full"
                      >
                        {s.cfr ? `${s.cfr} · ${s.name}` : s.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer CTAs */}
        <div className="px-6 py-5 border-t border-[#1E3556] bg-[#000000]/60">
          <div className="text-[13px] text-white/70 mb-3">
            This answer ran against the live X3 Compass corpus. With a real fleet,
            it would also cite your specific drivers, vehicles, and violations.
          </div>
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="text-[11px] text-white/45">
              Press{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-[#1E3556] text-white/70 font-mono text-[10px]">
                Esc
              </kbd>{" "}
              to close
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={onClose}
                className="text-[12.5px] font-semibold text-white/70 hover:text-white px-4 py-2 rounded-full border border-white/20 hover:bg-white/5"
              >
                Browse more skills
              </button>
              <Link
                href="/signup"
                className="text-[12.5px] font-bold text-[#000000] px-5 py-2 rounded-full whitespace-nowrap"
                style={{
                  background: "linear-gradient(135deg, #16C7FF, #16C7FF)",
                  boxShadow: "0 4px 12px rgba(2, 6, 12, 0.45)",
                }}
              >
                Ask this with my fleet → Start free trial
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
