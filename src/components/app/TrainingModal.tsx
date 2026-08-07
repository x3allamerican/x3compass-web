"use client";
import { useState } from "react";
import { Modal, Field, Err, ModalActions } from "@/components/app/Modal";
import { useDrivers, driverLabel } from "@/components/app/useDrivers";
import { getSupabase } from "@/lib/supabase";

const COURSES = ["ELDT · Theory", "ELDT · Behind the Wheel", "Hazmat awareness", "Hazmat function-specific", "Defensive driving", "Cargo securement", "Pre-trip inspection", "Hours of Service", "Drug & Alcohol awareness"];

export function TrainingModal({ carrierId, onClose, onSaved }: { carrierId: string; onClose: () => void; onSaved: () => void }) {
  const drivers = useDrivers(carrierId);
  const [driverId, setDriverId] = useState("");
  const [courseName, setCourseName] = useState("");
  const [category, setCategory] = useState("");
  const [provider, setProvider] = useState("");
  const [completedOn, setCompletedOn] = useState(new Date().toISOString().slice(0, 10));
  const [expiresOn, setExpiresOn] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!driverId) { setError("Pick a driver."); return; }
    if (!courseName.trim()) { setError("Enter a course."); return; }
    setBusy(true); setError(null);
    try {
      const token = (await getSupabase().auth.getSession()).data.session?.access_token;
      if (!token) throw new Error("Authentication required");
      const r = await fetch("/api/training-records/create", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ carrier_id: carrierId, driver_id: driverId, course_name: courseName, course_category: category, provider, completed_on: completedOn, expires_on: expiresOn }),
      });
      const b = await r.json() as { ok?: boolean; error?: string };
      if (!r.ok || !b.ok) { setError(b.error || `Server error ${r.status}`); return; }
      onSaved();
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); } finally { setBusy(false); }
  }

  return (
    <Modal title="Log a training completion" onClose={onClose}>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
        <Field label="Driver">
          <select className="x3i w-full" value={driverId} onChange={(e) => setDriverId(e.target.value)}>
            <option value="">Select a driver…</option>
            {drivers.map((d) => <option key={d.id} value={d.id}>{driverLabel(d)}</option>)}
          </select>
        </Field>
        <Field label="Course">
          <input className="x3i w-full" list="x3-courses" value={courseName} onChange={(e) => setCourseName(e.target.value)} placeholder="e.g. ELDT · Theory" />
          <datalist id="x3-courses">{COURSES.map((c) => <option key={c} value={c} />)}</datalist>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="CFR / category (optional)"><input className="x3i w-full" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Part 380.609" /></Field>
          <Field label="Provider (optional)"><input className="x3i w-full" value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="e.g. CarriersEdge" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Completed on"><input type="date" className="x3i w-full" value={completedOn} onChange={(e) => setCompletedOn(e.target.value)} /></Field>
          <Field label="Expires on (optional)"><input type="date" className="x3i w-full" value={expiresOn} onChange={(e) => setExpiresOn(e.target.value)} /></Field>
        </div>
        {error && <Err msg={error} />}
        <ModalActions onClose={onClose} busy={busy} submitLabel="Log training" />
      </form>
    </Modal>
  );
}
