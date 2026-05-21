"use client";
import { ReactNode } from "react";

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-6" onClick={onClose}>
      <div className="bg-[var(--surface-3)] border border-[var(--border)] rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e)=>e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between sticky top-0 bg-[var(--surface-3)] z-10">
          <h2 className="text-[var(--fg)] font-extrabold text-lg">{title}</h2>
          <button onClick={onClose} className="text-[var(--fg-muted)] hover:text-[var(--fg)] text-xl">×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
      <style jsx global>{`
        .x3i { width: 100%; padding: 8px 12px; border-radius: 8px; background: var(--bg); border: 1px solid var(--border); color: var(--fg); font-size: 14px; }
        .x3i:focus { outline: none; border-color: #22D3EE; }
      `}</style>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><div className="text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)] font-bold mb-1">{label}</div>{children}</label>;
}

export function Err({ msg }: { msg: string }) {
  return <div className="text-[12px] text-red-700 dark:text-red-300 bg-red-900/20 border border-red-900/40 rounded-lg px-3 py-2">{msg}</div>;
}

export function ModalActions({ onClose, busy, submitLabel = "Save" }: { onClose: () => void; busy: boolean; submitLabel?: string }) {
  return (
    <div className="flex justify-end gap-3 pt-2">
      <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-[var(--fg-muted)] hover:text-[var(--fg)] text-sm border border-[var(--border)]">Cancel</button>
      <button type="submit" disabled={busy} className="px-5 py-2 rounded-lg font-extrabold text-sm text-[var(--bg)]" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>{busy ? "Saving…" : submitLabel}</button>
    </div>
  );
}
