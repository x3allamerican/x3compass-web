"use client";

import { useState } from "react";
import { Modal, Field, Err, ModalActions } from "@/components/app/Modal";
import { useDrivers, driverLabel } from "@/components/app/useDrivers";
import { getSupabase } from "@/lib/supabase";

const TEST_TYPES = ["Pre-employment", "Random", "Post-accident", "Reasonable suspicion", "Return-to-duty", "Follow-up"];
const RESULTS = ["Pending", "Negative", "Negative-dilute", "Positive", "Refusal"];

export function DATestModal({ carrierId, onClose, onSaved }: { carrierId: string; onClose: () => void; onSaved: () => void }) {
  const drivers = useDrivers(carrierId);
  const [driverId, setDriverId] = useState("");
  const [collectedOn, setCollectedOn] = useState(new Date().toISOString().slice(0, 10));
  const [testType, setTestType] = useState("Random");
  const [result, setResult] = useState("Pending");
  const [lab, setLab] = useState("");
  const [mroNotes, setMroNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!driverId) { setError("Pick a driver."); return; }
    setBusy(true); setError(null);
    try {
      const token = (await getSupabase().auth.getSession()).data.session?.access_token;
      if (!token) throw new Error("Authentication required");
      const r = await fetch("/api/da-tests/create", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ carrier_id: carrierId, driver_id: driverId, collected_on: collectedOn, test_type: testType, result, lab, mro_notes: mroNotes }),
      });
      const b = await r.json() as { ok?: boolean; error?: string };
      if (!r.ok || !b.ok) { setError(b.error || `Server error ${r.status}`); return; }
      onSaved();
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); } finally { setBusy(false); }
  }

  return (
    <Modal title="Log a drug/alcohol test · 49 CFR Part 382" onClose={onClose}>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
        <Field label="Driver">
          <select className="x3i w-full" value={driverId} onChange={(e) => setDriverId(e.target.value)}>
            <option value="">Select a driver…</option>
            {drivers.map((d) => <option key={d.id} value={d.id}>{driverLabel(d)}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Collected on"><input type="date" className="x3i w-full" value={collectedOn} onChange={(e) => setCollectedOn(e.target.value)} /></Field>
          <Field label="Test type">
            <select className="x3i w-full" value={testType} onChange={(e) => setTestType(e.target.value)}>{TEST_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Result">
            <select className="x3i w-full" value={result} onChange={(e) => setResult(e.target.value)}>{RESULTS.map((t) => <option key={t} value={t}>{t}</option>)}</select>
          </Field>
          <Field label="Lab / collection site"><input className="x3i w-full" value={lab} onChange={(e) => setLab(e.target.value)} placeholder="e.g. Health Street" /></Field>
        </div>
        <Field label="MRO notes (optional)"><input className="x3i w-full" value={mroNotes} onChange={(e) => setMroNotes(e.target.value)} placeholder="Medical Review Officer notes" /></Field>
        {error && <Err msg={error} />}
        <ModalActions onClose={onClose} busy={busy} submitLabel="Log test" />
      </form>
    </Modal>
  );
}
