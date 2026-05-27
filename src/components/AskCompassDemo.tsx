"use client";
export default function AskCompassDemo() {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center">
      <div className="text-sm font-bold text-[var(--accent)] mb-2">Ask Compass</div>
      <p className="text-[14px] text-[var(--muted)]">Try the AI compliance assistant · visit <a href="/app/ask" className="text-[var(--accent)] font-bold hover:underline">app/ask</a> to start a conversation.</p>
    </div>
  );
}
