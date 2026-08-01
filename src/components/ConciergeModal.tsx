"use client";

/* ============================================================
   X3 COMPASS · AI CONCIERGE MODAL (centered)
   ------------------------------------------------------------
   Mirrors the static reference: centered modal (~560 wide,
   ~720 tall, scrollable), dark navy background, two sections
   of cyan-outlined pill buttons, context-keyword line, input
   + bright cyan Send. Body scroll locks while open.

   Pages opt in by mounting <ConciergeModal /> once. Trigger
   from any button via:
     window.dispatchEvent(new CustomEvent('x3:open-concierge', {
       detail: { context: 'hazmat-placards' }
     }));
   ============================================================ */

import { FormEvent, useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };
type OpenDetail = { context?: string; q?: string };

type ContextConfig = {
  label: string;
  keywords: string;
  commonActions: string[];
  topFaq: string[];
  placeholder: string;
};

const CONTEXTS: Record<string, ContextConfig> = {
  "hazmat-placards": {
    label: "Placard Wizard",
    keywords: "placards, UN numbers, mixed-load DANGEROUS, specialty markings, segregation",
    commonActions: [
      "How do I placard a UN 1203 bulk shipment?",
      "When can I use a DANGEROUS placard?",
      "What size do placards have to be per § 172.519?",
      "How do I handle a mixed Class 3 + Class 8 load?",
      "What's the residue placard rule (Table 2)?",
      "Do I need an orange UN plate for this shipment?",
    ],
    topFaq: [
      "What's a Table 1 vs Table 2 substance?",
      "What's the 1,001 lbs placarding threshold?",
      "What's an inhalation hazard zone?",
      "What are subsidiary hazard placards?",
      "What's a fumigation marking?",
      "What's the difference between a placard and a label?",
    ],
    placeholder: "Ask the Concierge anything about placards, UN numbers, or segregation…",
  },
  "hazmat-substances": {
    label: "Substance Lookup",
    keywords: "UN/NA numbers, HMT § 172.101, proper shipping names, packing groups, special provisions",
    commonActions: [
      "How do I look up UN 3480 lithium batteries?",
      "What's the proper shipping name for gasoline?",
      "How do I find a substance by class?",
      "How do I read Column 7 special provisions?",
      "How do I find authorized packaging for a substance?",
      "How do I export a substance lookup for the BOL?",
    ],
    topFaq: [
      "What is the § 172.101 HMT?",
      "What's a packing group?",
      "What's the difference between PSN and technical name?",
      "What's a marine pollutant?",
      "What's an elevated-temperature material?",
      "What's a forbidden substance?",
    ],
    placeholder: "Ask the Concierge anything about UN numbers, HMT entries, or packing groups…",
  },
  "hazmat-lithium": {
    label: "Lithium Decision Tree",
    keywords: "UN 3480, 3481, 3090, 3091, Section II, watt-hours, packed-with vs in-equipment",
    commonActions: [
      "Walk me through Section II for UN 3480",
      "What's the watt-hour cap for Section II?",
      "What's the difference between UN 3480 and UN 3481?",
      "How do I ship damaged/defective batteries?",
      "What mark does a Section II package need?",
      "When does Section II flip to full Class 9?",
    ],
    topFaq: [
      "What's the difference between lithium-ion and lithium-metal?",
      "What's a Section IB shipment?",
      "What's the 30 kg gross cap?",
      "What's DDR (damaged/defective/recalled)?",
      "What goes on the outer package mark?",
      "What's the IATA Section II equivalent?",
    ],
    placeholder: "Ask the Concierge anything about lithium battery shipping…",
  },
  "hazmat-exemptions": {
    label: "Exemption Checker",
    keywords: "Limited Quantity, Materials of Trade, Special Permits, Excepted Quantity",
    commonActions: [
      "Can I ship this as Limited Quantity?",
      "What's the gross-weight cap for Limited Quantity?",
      "Do I qualify for Materials of Trade?",
      "How do I apply for a Special Permit?",
      "What's the carry-on-board rule for DOT-SP?",
      "What does an Excepted Quantity look like?",
    ],
    topFaq: [
      "What's the difference between LQ and MoT?",
      "What's the 200 kg MoT aggregate limit?",
      "What's the LTD QTY mark?",
      "What's Special Permit DOT-SP?",
      "What's an Excepted Quantity (EQ)?",
      "Why did ORM-D go away?",
    ],
    placeholder: "Ask the Concierge anything about Limited Quantity, MoT, or Special Permits…",
  },
  "hazmat-audit": {
    label: "Audit Checklist",
    keywords: "classification, shipping papers, placard correctness, training currency, record retention",
    commonActions: [
      "Walk me through the four FMCSA audit areas",
      "How big should my BOL audit sample be?",
      "How do I document a placard audit?",
      "What's the 3-year retention rule?",
      "How do I run a training currency audit?",
      "How do I prepare for a Compliance Review?",
    ],
    topFaq: [
      "What's a Compliance Review?",
      "What's a Conditional rating?",
      "What's § 172.201(e) retention?",
      "What's § 172.704 training currency?",
      "What's a placard correctness finding?",
      "What's a § 172.101 classification finding?",
    ],
    placeholder: "Ask the Concierge anything about FMCSA audits, sampling, or records…",
  },
  "hazmat-shipping-papers": {
    label: "Shipping Papers",
    keywords: "§ 172.202 sequence, shipper's certification, § 172.604 emergency contact, hazardous waste manifest",
    commonActions: [
      "Build me a BOL line for UN 1203",
      "What's the § 172.202(a) sequence?",
      "What's the shipper's certification language?",
      "Do I need a § 172.604 phone number?",
      "What's required on a hazardous waste manifest?",
      "What's a subsidiary hazard class entry?",
    ],
    topFaq: [
      "What's a proper shipping name?",
      "What's the § 172.202 column order?",
      "Why does CHEMTREC have to be 24/7?",
      "What's an EPA 8700-22 form?",
      "What's a § 172.204 shipper's cert?",
      "What's the difference between Subpart C papers and a BOL?",
    ],
    placeholder: "Ask the Concierge anything about shipping papers, BOLs, or § 172.202…",
  },
  "hazmat-emergency": {
    label: "Emergency Response",
    keywords: "ERG, CHEMTREC, § 172.600 Subpart G, DOT-F-5800.1 incident report",
    commonActions: [
      "What's the current ERG edition?",
      "What's the § 172.604 phone rule?",
      "How do I file DOT-F-5800.1?",
      "What goes in the cab under Subpart G?",
      "What's the § 171.15 immediate-notice rule?",
      "How do I read an ERG guide page?",
    ],
    topFaq: [
      "What's the ERG?",
      "What's CHEMTREC?",
      "What's § 172.602?",
      "What's § 171.15?",
      "What's § 171.16?",
      "What's an isolation distance?",
    ],
    placeholder: "Ask the Concierge anything about emergency response, ERG, or incident reporting…",
  },
  "hazmat-training": {
    label: "Training Tracker",
    keywords: "§ 172.704 training, 3-year cycle, in-depth security, retention",
    commonActions: [
      "What's the § 172.704 cycle?",
      "Who needs in-depth security training?",
      "How long do I keep training records?",
      "When does a function change trigger retraining?",
      "What modules does every hazmat employee need?",
      "What records prove training currency?",
    ],
    topFaq: [
      "What's general awareness training?",
      "What's function-specific training?",
      "What's safety training?",
      "What's security-awareness training?",
      "What's in-depth security training?",
      "What's § 172.704(d) retention?",
    ],
    placeholder: "Ask the Concierge anything about hazmat training, modules, or retention…",
  },
  "hazmat-security": {
    label: "Security Plan",
    keywords: "§ 172.800 plan, Table 1 substances, personnel/unauthorized-access/en-route components",
    commonActions: [
      "Do I need a § 172.800 security plan?",
      "What are the three required plan components?",
      "How often do I review the plan?",
      "Who needs in-depth security training?",
      "What's the officer sign-off rule?",
      "Do I need to share the plan with PHMSA?",
    ],
    topFaq: [
      "What's a Table 1 substance?",
      "What's a security plan?",
      "What's personnel security?",
      "What's unauthorized-access security?",
      "What's en-route security?",
      "What's a TSA STA?",
    ],
    placeholder: "Ask the Concierge anything about § 172.800 security plans…",
  },
  default: {
    label: "Compass",
    keywords: "CFR, FMCSA, hazmat, drug & alcohol, hours of service, DQ files",
    commonActions: [
      "What does Compass cover?",
      "What's an FMCSA Compliance Review?",
      "What's CSA?",
      "What's the difference between MVR, PSP, and DAC?",
      "What's a DataQ challenge?",
      "What's the § 172.704 hazmat training rule?",
    ],
    topFaq: [
      "What's a DOT number?",
      "What's CSA / BASIC?",
      "What's an FMCSA Compliance Review?",
      "What's the Drug & Alcohol Clearinghouse?",
      "What's a DQ file?",
      "What's hazmat security?",
    ],
    placeholder: "Ask the Concierge anything about CFR, FMCSA, or compliance…",
  },
};

function renderMd(s: string): string {
  return s
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, '<code style="color:#16C7FF;background:#000;padding:1px 6px;border-radius:3px;font-family:monospace;">$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#16C7FF;text-decoration:underline;" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\n/g, "<br/>");
}

export default function ConciergeModal() {
  const [open, setOpen] = useState(false);
  const [contextKey, setContextKey] = useState<string>("default");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Listen for the global open event
  useEffect(() => {
    function onOpen(e: Event) {
      const detail = (e as CustomEvent<OpenDetail>).detail || {};
      setContextKey(detail.context && CONTEXTS[detail.context] ? detail.context : "default");
      setOpen(true);
      if (detail.q) setTimeout(() => send(detail.q!), 50);
      else setTimeout(() => inputRef.current?.focus(), 50);
    }
    window.addEventListener("x3:open-concierge", onOpen as EventListener);
    return () => window.removeEventListener("x3:open-concierge", onOpen as EventListener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Body-scroll lock while open + ESC to close
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function send(text: string) {
    if (!text.trim() || busy) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    const turns: Msg[] = [...messages, userMsg];
    setMessages(turns);
    setInput("");
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: turns, context: contextKey !== "default" ? contextKey : undefined }),
      });
      // Read as text first. If /api/ask isn't deployed on this domain (e.g.
      // app.x3compass.com without the Pages Function), the response is HTML
      // — calling res.json() throws "Unexpected end of JSON input" with no
      // useful information for the user. Parse defensively and surface the
      // real status code + a helpful message instead.
      const raw = await res.text();
      let data: { ok?: boolean; content?: string; error?: string } = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        throw new Error(
          `Compass returned HTTP ${res.status} (not JSON). The Ask Compass API may not be deployed on this domain. Try /app/ask directly, or reload.`
        );
      }
      if (!res.ok || !data.ok || !data.content) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setMessages([...turns, { role: "assistant", content: data.content }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: FormEvent) { e.preventDefault(); send(input); }

  if (!open) return null;
  const ctx = CONTEXTS[contextKey] || CONTEXTS.default;
  const hasMessages = messages.length > 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="AI Concierge"
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.78)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "min(620px, 100%)",
          maxHeight: "min(800px, calc(100vh - 48px))",
          background: "#000000",
          border: "1px solid rgba(22, 199, 255, 0.35)",
          borderRadius: 16,
          boxShadow: "0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(22, 199, 255, 0.08)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 22px",
            borderBottom: "1px solid rgba(22, 199, 255, 0.18)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 16, fontWeight: 700, color: "#F8FAFC" }}>
            <span aria-hidden style={{ fontSize: 20 }}>🤖</span>
            <span>AI Concierge — {ctx.label}</span>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close concierge"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#CBD5E1",
              borderRadius: 8,
              width: 32,
              height: 32,
              cursor: "pointer",
              fontSize: 16,
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </header>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px" }}>
          {!hasMessages && (
            <>
              {/* COMMON ACTIONS */}
              <div style={{ marginBottom: 22 }}>
                <div
                  style={{
                    color: "#FBBF24",
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    marginBottom: 10,
                  }}
                >
                  ⚡ Common actions — how do I…
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {ctx.commonActions.map((q) => (
                    <PillButton key={q} text={q} onClick={() => send(q)} disabled={busy} />
                  ))}
                </div>
              </div>

              {/* TOP FAQ */}
              <div style={{ marginBottom: 22 }}>
                <div
                  style={{
                    color: "#16C7FF",
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    marginBottom: 10,
                  }}
                >
                  🧠 Top FAQ — what is / what about…
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {ctx.topFaq.map((q) => (
                    <PillButton key={q} text={q} onClick={() => send(q)} disabled={busy} />
                  ))}
                </div>
              </div>

              {/* Keyword line */}
              <div style={{ textAlign: "center", color: "#CBD5E1", fontSize: 13, lineHeight: 1.55, padding: "8px 0" }}>
                Ask anything about{" "}
                <span style={{ color: "#16C7FF", fontWeight: 700 }}>{ctx.keywords}</span>.
                <br />
                <span style={{ color: "#94A3B8", fontSize: 12 }}>
                  Click a question above or type your own below.
                </span>
              </div>
            </>
          )}

          {hasMessages && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {messages.map((m, i) => (
                <div
                  key={i}
                  style={{
                    alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                    maxWidth: "92%",
                    background: m.role === "user" ? "rgba(22, 199, 255, 0.18)" : "#0F1F35",
                    border: m.role === "user" ? "1px solid rgba(22, 199, 255, 0.4)" : "1px solid rgba(255,255,255,0.06)",
                    color: "#F8FAFC",
                    padding: "10px 14px",
                    borderRadius: 12,
                    fontSize: 14,
                    lineHeight: 1.55,
                  }}
                  dangerouslySetInnerHTML={{ __html: renderMd(m.content) }}
                />
              ))}
              {busy && (
                <div style={{ alignSelf: "flex-start", color: "#94A3B8", fontSize: 13, fontStyle: "italic", padding: "8px 14px" }}>
                  Compass is thinking…
                </div>
              )}
              {error && (
                <div role="alert" style={{ color: "#FCA5A5", background: "rgba(220, 38, 38, 0.12)", border: "1px solid rgba(220, 38, 38, 0.35)", padding: "10px 14px", borderRadius: 8, fontSize: 13 }}>
                  {error}
                </div>
              )}
              <div ref={endRef} />
            </div>
          )}
        </div>

        {/* Composer */}
        <form
          onSubmit={onSubmit}
          style={{
            display: "flex",
            gap: 10,
            padding: "14px 18px",
            borderTop: "1px solid rgba(22, 199, 255, 0.18)",
            alignItems: "flex-end",
          }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder={ctx.placeholder}
            disabled={busy}
            rows={2}
            style={{
              flex: 1,
              resize: "none",
              background: "#000",
              border: "1px solid rgba(22, 199, 255, 0.25)",
              borderRadius: 10,
              padding: "10px 12px",
              color: "#F8FAFC",
              fontSize: 14,
              lineHeight: 1.45,
              fontFamily: "inherit",
              minHeight: 56,
            }}
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            style={{
              background: input.trim() && !busy ? "#16C7FF" : "#1F2937",
              color: input.trim() && !busy ? "#000000" : "#94A3B8",
              border: 0,
              borderRadius: 10,
              padding: "0 22px",
              height: 56,
              fontWeight: 800,
              fontSize: 15,
              cursor: input.trim() && !busy ? "pointer" : "not-allowed",
            }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

function PillButton({ text, onClick, disabled }: { text: string; onClick: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        background: "rgba(22, 199, 255, 0.06)",
        border: "1px solid rgba(22, 199, 255, 0.55)",
        color: "#16C7FF",
        padding: "8px 14px",
        borderRadius: 999,
        fontSize: 12.5,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        whiteSpace: "nowrap",
        fontFamily: "inherit",
        transition: "background 120ms",
      }}
    >
      {text}
    </button>
  );
}
