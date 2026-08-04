"use client";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { uploadDataqEvidence } from "@/lib/dataqUpload.mjs";

type Inspection = { id: string; inspection_date: string; report_number: string | null; state: string | null };
type Evidence = { id: string; label: string; file_name: string; content_type: string; size_bytes: number };
type Challenge = {
  id: string; target_type: "inspection" | "crash"; target_id: string; issue_summary: string; requested_correction: string;
  status: "submitted" | "under_review" | "approved" | "denied"; tracking_number: string | null; submitted_on: string;
  agency_response_on: string | null; agency_response_notes: string | null; version: number; evidence: Evidence[];
};
type UpdateDraft = { challenge: Challenge; status: "under_review" | "approved" | "denied"; tracking_number: string; agency_response_on: string; agency_response_notes: string };

const STATUS_LABEL = { submitted: "Submitted", under_review: "Under review", approved: "Approved", denied: "Denied" };
const nextStatuses = (status: Challenge["status"]): UpdateDraft["status"][] => status === "submitted" ? ["under_review", "approved", "denied"] : status === "under_review" ? ["approved", "denied"] : [];

async function sessionToken() {
  return (await getSupabase().auth.getSession()).data.session?.access_token || "";
}

export function DataqChallengePanel({ inspections, initialInspectionId = "" }: { inspections: Inspection[]; initialInspectionId?: string }) {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [targetId, setTargetId] = useState(initialInspectionId);
  const [issueSummary, setIssueSummary] = useState("");
  const [requestedCorrection, setRequestedCorrection] = useState("");
  const [submittedOn, setSubmittedOn] = useState(new Date().toISOString().slice(0, 10));
  const [trackingNumber, setTrackingNumber] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<UpdateDraft | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const token = await sessionToken();
      if (!token) throw new Error("Your session expired. Sign in and try again.");
      const response = await fetch("/api/dataq/challenges", { headers: { Authorization: `Bearer ${token}` } });
      const body = await response.json().catch(() => ({})) as { challenges?: Challenge[] };
      if (!response.ok) throw new Error(`Could not load DataQ challenges (${response.status}).`);
      setChallenges(body.challenges || []);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not load DataQ challenges."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (initialInspectionId) setTargetId(initialInspectionId); }, [initialInspectionId]);

  const inspectionsById = useMemo(() => new Map(inspections.map((inspection) => [inspection.id, inspection])), [inspections]);

  async function createChallenge(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(null);
    try {
      const token = await sessionToken();
      if (!token) throw new Error("Your session expired. Sign in and try again.");
      const evidence = [];
      if (file) {
        const uploaded = await uploadDataqEvidence(file, token);
        if (!uploaded.ok) throw new Error(uploaded.error);
        evidence.push(uploaded.evidence);
      }
      const response = await fetch("/api/dataq/challenges", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ target_type: "inspection", target_id: targetId, issue_summary: issueSummary, requested_correction: requestedCorrection, submitted_on: submittedOn, tracking_number: trackingNumber || null, evidence }),
      });
      if (!response.ok) throw new Error(`Could not record the challenge (${response.status}).`);
      setIssueSummary(""); setRequestedCorrection(""); setTrackingNumber(""); setFile(null);
      await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not record the challenge."); }
    finally { setBusy(false); }
  }

  async function updateChallenge(event: FormEvent) {
    event.preventDefault();
    if (!updating) return;
    setBusy(true); setError(null);
    try {
      const token = await sessionToken();
      if (!token) throw new Error("Your session expired. Sign in and try again.");
      const response = await fetch("/api/dataq/challenges", {
        method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: updating.challenge.id, version: updating.challenge.version, status: updating.status, tracking_number: updating.tracking_number || null, agency_response_on: updating.agency_response_on || null, agency_response_notes: updating.agency_response_notes || null }),
      });
      if (!response.ok) throw new Error(`Could not update the agency-reported status (${response.status}).`);
      setUpdating(null); await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not update the challenge."); }
    finally { setBusy(false); }
  }

  return (
    <section className="x3-card p-5 mb-5" aria-labelledby="dataq-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><div className="text-[10px] tracking-[.16em] uppercase text-[var(--accent)] font-extrabold">Request for Data Review</div><h2 id="dataq-heading" className="text-lg font-extrabold text-[var(--fg)]">DataQ challenge workspace</h2></div>
        <div className="text-[11px] text-[var(--fg-muted)] max-w-xl"><strong>Decision support only.</strong> Compass records your submission and agency-reported response. It does not file with DataQs or determine whether a record is contestable.</div>
      </div>

      <form onSubmit={createChallenge} className="mt-4 grid gap-3 lg:grid-cols-2">
        <label className="text-[11px] font-bold text-[var(--fg-muted)]">Inspection *<select required className="x3i mt-1" value={targetId} onChange={(event) => setTargetId(event.target.value)}><option value="">Select an inspection</option>{inspections.map((inspection) => <option key={inspection.id} value={inspection.id}>{inspection.inspection_date} · {inspection.report_number || "No report number"} · {inspection.state || "State not documented"}</option>)}</select></label>
        <label className="text-[11px] font-bold text-[var(--fg-muted)]">Submitted date *<input required type="date" className="x3i mt-1" value={submittedOn} onChange={(event) => setSubmittedOn(event.target.value)} /></label>
        <label className="text-[11px] font-bold text-[var(--fg-muted)] lg:col-span-2">Issue summary *<textarea required maxLength={4000} className="x3i mt-1 min-h-24" value={issueSummary} onChange={(event) => setIssueSummary(event.target.value)} placeholder="State the specific record error and the facts supporting your request." /></label>
        <label className="text-[11px] font-bold text-[var(--fg-muted)] lg:col-span-2">Requested correction *<textarea required maxLength={2000} className="x3i mt-1 min-h-20" value={requestedCorrection} onChange={(event) => setRequestedCorrection(event.target.value)} placeholder="State the exact correction requested from the reviewing agency." /></label>
        <label className="text-[11px] font-bold text-[var(--fg-muted)]">DataQs tracking number<input maxLength={120} className="x3i mt-1" value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} placeholder="Optional until assigned" /></label>
        <label className="text-[11px] font-bold text-[var(--fg-muted)]">Supporting evidence (optional, 25 MB max)<input type="file" className="x3i mt-1" onChange={(event) => setFile(event.target.files?.[0] || null)} /></label>
        <div className="lg:col-span-2"><button disabled={busy || !targetId} className="rounded-lg px-4 py-2.5 text-[12px] font-extrabold text-[var(--bg)] disabled:opacity-40" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>{busy ? "Recording…" : "Record submitted challenge"}</button></div>
      </form>

      {error && <p role="alert" className="mt-3 text-sm font-bold text-rose-500">{error}</p>}

      <div className="mt-6 space-y-3">
        {loading ? <p className="text-sm text-[var(--fg-muted)]">Loading challenges…</p> : challenges.length === 0 ? <div className="rounded-lg border border-dashed border-[var(--border)] p-5 text-sm text-[var(--fg-muted)]">No DataQ challenges recorded for this carrier.</div> : challenges.map((challenge) => {
          const inspection = inspectionsById.get(challenge.target_id);
          const next = nextStatuses(challenge.status);
          return <article key={challenge.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface-3)] p-4">
            <div className="flex flex-wrap justify-between gap-3"><div><div className="font-extrabold text-[var(--fg)]">{inspection?.report_number || `Inspection ${challenge.target_id.slice(0, 8)}`}</div><div className="text-[11px] text-[var(--fg-muted)]">Submitted {challenge.submitted_on} · {challenge.tracking_number || "Tracking number not recorded"}</div></div><span className="rounded-full border border-[var(--border)] px-3 py-1 text-[10px] font-extrabold uppercase text-[var(--fg)]">{STATUS_LABEL[challenge.status]}</span></div>
            <p className="mt-3 text-sm text-[var(--fg)]"><strong>Issue:</strong> {challenge.issue_summary}</p><p className="mt-1 text-sm text-[var(--fg-muted)]"><strong className="text-[var(--fg)]">Requested correction:</strong> {challenge.requested_correction}</p>
            <div className="mt-2 text-[11px] text-[var(--fg-muted)]">Evidence: {challenge.evidence.length ? challenge.evidence.map((item) => item.label).join(", ") : "None recorded"}</div>
            {challenge.agency_response_notes && <p className="mt-2 text-[11px] text-[var(--fg-muted)]"><strong className="text-[var(--fg)]">Agency response ({challenge.agency_response_on}):</strong> {challenge.agency_response_notes}</p>}
            {next.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{next.map((status) => <button key={status} type="button" onClick={() => setUpdating({ challenge, status, tracking_number: challenge.tracking_number || "", agency_response_on: new Date().toISOString().slice(0, 10), agency_response_notes: "" })} className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-[11px] font-bold text-[var(--fg)] hover:bg-[var(--surface-2)]">Mark {STATUS_LABEL[status].toLowerCase()}</button>)}</div>}
          </article>;
        })}
      </div>

      {updating && <form onSubmit={updateChallenge} className="mt-4 rounded-xl border-2 border-[var(--accent)] bg-[var(--surface-3)] p-4 space-y-3">
        <h3 className="font-extrabold text-[var(--fg)]">Record agency-reported status: {STATUS_LABEL[updating.status]}</h3>
        <label className="block text-[11px] font-bold text-[var(--fg-muted)]">Tracking number<input className="x3i mt-1" value={updating.tracking_number} onChange={(event) => setUpdating({ ...updating, tracking_number: event.target.value })} /></label>
        {updating.status !== "under_review" && <><label className="block text-[11px] font-bold text-[var(--fg-muted)]">Agency response date *<input required type="date" className="x3i mt-1" value={updating.agency_response_on} onChange={(event) => setUpdating({ ...updating, agency_response_on: event.target.value })} /></label><label className="block text-[11px] font-bold text-[var(--fg-muted)]">Agency response notes *<textarea required name="agency_response_notes" className="x3i mt-1 min-h-20" value={updating.agency_response_notes} onChange={(event) => setUpdating({ ...updating, agency_response_notes: event.target.value })} /></label></>}
        <div className="flex gap-2"><button disabled={busy} className="rounded-lg bg-[var(--accent)] px-4 py-2 text-[12px] font-extrabold text-[var(--bg)] disabled:opacity-40">Save status</button><button type="button" onClick={() => setUpdating(null)} className="rounded-lg border border-[var(--border)] px-4 py-2 text-[12px] font-bold text-[var(--fg)]">Cancel</button></div>
      </form>}
    </section>
  );
}
