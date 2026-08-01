"use client";

/* ============================================================
   ProcomDisclosureModal
   ------------------------------------------------------------
   Shown when a carrier clicks "Pick Procom →" in the
   CTPAPickerCard. Renders the full disclosure (pricing,
   enrollment requirements, 8-step process, ongoing support,
   contact info) and requires an affirmative checkbox before
   the Enroll button enables. Submits with disclosure_acked=true
   so /api/carrier/set-ctpa can persist ack-timestamp.

   Also supports read-only "reference" mode for post-enrollment
   viewing — no checkbox, no enroll button, just a Close.

   Escape key + backdrop click close the modal.
   ============================================================ */

import { useEffect, useState } from "react";
import { ProcomDisclosure, PROCOM_VERSION_TAG } from "@/lib/procomDisclosure";

type Props = {
  open: boolean;
  /** When true, hide the consent checkbox + enroll button.
   *  Used for the post-enrollment reference card. */
  readOnly?: boolean;
  /** Disable the enroll button while the API call is in flight. */
  busy?: boolean;
  onClose: () => void;
  /** Called when the carrier ticks the box + clicks Enroll.
   *  Receives the disclosure version they ack'd. */
  onConfirm?: (versionTag: string) => void;
};

export default function ProcomDisclosureModal({ open, readOnly, busy, onClose, onConfirm }: Props) {
  const [acked, setAcked] = useState(false);

  // ESC closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Reset checkbox each open
  useEffect(() => { if (open) setAcked(false); }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Procom program details"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(2, 6, 12, 0.65)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6"
        style={{ boxShadow: "0 24px 60px rgba(2, 6, 12, 0.55)" }}
      >
        {/* Header */}
        <header className="flex items-start justify-between gap-4 mb-5 pb-4 border-b border-[var(--border)]">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] tracking-[.16em] uppercase text-[var(--accent)] font-extrabold mb-1">
              {readOnly ? "Procom · program reference" : "Before you enroll · review Procom's program"}
            </div>
            <h2 className="text-[18px] font-extrabold text-[var(--fg)] m-0">
              {readOnly ? "Your Procom consortium · program details" : "Confirm you've read Procom's terms"}
            </h2>
            <p className="text-[12px] text-[var(--fg-muted)] mt-1 leading-relaxed">
              {readOnly
                ? "Reference copy of what you agreed to when enrolling. Procom — not X3 — is your C/TPA of record. Pricing and process below come directly from Procom."
                : "X3 refers you to Procom; Procom contracts directly with your company. The details below come from Procom (Martin Sena). Please review before locking it in."}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 text-[var(--fg-muted)] hover:text-[var(--fg)] text-[20px] leading-none"
          >
            ✕
          </button>
        </header>

        {/* Body · shared disclosure block */}
        <ProcomDisclosure />

        {/* Footer · either consent block or just a Close */}
        {readOnly ? (
          <footer className="mt-6 pt-4 border-t border-[var(--border)] flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-[12px] font-extrabold text-[var(--bg)]"
              style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
            >
              Close
            </button>
          </footer>
        ) : (
          <footer className="mt-6 pt-4 border-t border-[var(--border)] space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acked}
                onChange={(e) => setAcked(e.target.checked)}
                className="mt-1 w-4 h-4 accent-[var(--accent)] cursor-pointer"
              />
              <span className="text-[12.5px] text-[var(--fg)] leading-relaxed">
                I&apos;ve reviewed Procom&apos;s program details — pricing tiers, enrollment requirements, the 8-step enrollment process, and the FMCSA Clearinghouse C/TPA designation I&apos;ll complete myself. I understand <strong>Procom — not X3 Compass — is my C/TPA of record</strong> and will contract directly with my company.
              </span>
            </label>
            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                disabled={busy}
                className="px-4 py-2 rounded-lg text-[12px] font-bold text-[var(--fg)] border border-[var(--border)] hover:border-[var(--accent)] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                disabled={!acked || busy}
                onClick={() => onConfirm?.(PROCOM_VERSION_TAG)}
                className="px-4 py-2 rounded-lg text-[12px] font-extrabold text-[var(--bg)] disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
              >
                {busy ? "Enrolling…" : "Enroll with Procom →"}
              </button>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}
