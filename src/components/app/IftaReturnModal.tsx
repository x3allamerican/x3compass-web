"use client";
import { useState } from "react";
import { Modal, Field, Err, ModalActions } from "@/components/app/Modal";
import { getSupabase } from "@/lib/supabase";

function recentQuarters(n = 8): string[] {
  const out: string[] = []; const now = new Date();
  let y = now.getUTCFullYear(); let q = Math.floor(now.getUTCMonth() / 3) + 1;
  for (let i = 0; i < n; i++) { out.push(`Q${q} ${y}`); q -= 1; if (q < 1) { q = 4; y -= 1; } }
  return out;
}
const STATUSES = ["Awaiting data", "Ready to submit", "Filed", "Overdue"];

export function IftaReturnModal({ carrierId, onClose, onSaved }: { carrierId: string; onClose: () => void; onSaved: () => void }) {
  const quarters = recentQuarters();
  const [quarter, setQuarter] = useState(quarters[1] || quarters[0]);
  const [status, setStatus] = useState("Ready to submit");
  const [dueDate, setDueDate] = useState("");
  const [filedDate, setFiledDate] = useState("");
  const [taxOwed, setTaxOwed] = useState("");
  const [refund, setRefund] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true); setError(null);
    try {
      const token = (await getSupabase().auth.getSession()).data.session?.access_token;
      if (!token) throw new Error("Authentication required");
      const r = await fetch("/api/ifta-returns/create", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ carrier_id: carrierId, quarter, status, due_date: dueDate, filed_date: filedDate, tax_owed: taxOwed, refund }),
      });
      const b = await r.json() as { ok?: boolean; error?: string };
      if (!r.ok || !b.ok) { setError(b.error || `Server error ${r.status}`); return; }
      onSaved();
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); } finally { setBusy(false); }
  }

  return (
    <Modal title="Record an IFTA return" onClose={onClose}>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Quarter">
            <select className="x3i w-full" value={quarter} onChange={(e) => setQuarter(e.target.value)}>
              {quarters.map((q) => <option key={q} value={q}>{q}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select className="x3i w-full" value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Due date (optional)"><input type="date" className="x3i w-full" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></Field>
          <Field label="Filed date (optional)"><input type="date" className="x3i w-full" value={filedDate} onChange={(e) => setFiledDate(e.target.value)} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Tax owed ($, optional)"><input className="x3i w-full" inputMode="decimal" value={taxOwed} onChange={(e) => setTaxOwed(e.target.value)} placeholder="0.00" /></Field>
          <Field label="Refund ($, optional)"><input className="x3i w-full" inputMode="decimal" value={refund} onChange={(e) => setRefund(e.target.value)} placeholder="0.00" /></Field>
        </div>
        {error && <Err msg={error} />}
        <ModalActions onClose={onClose} busy={busy} submitLabel="Save return" />
      </form>
    </Modal>
  );
}
