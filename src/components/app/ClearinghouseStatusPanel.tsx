"use client";
import { FormEvent, useCallback, useMemo, useState, useEffect } from "react";
import { getSupabase } from "@/lib/supabase";

type AnnualStatus = "current" | "due" | "overdue" | "missing_evidence";
type DriverStatus = {
  driverId: string; driverName: string; driverStatus: string; annualStatus: AnnualStatus; annualDueOn: string | null;
  lastCompletedQueryOn: string | null; lastCompletedQueryType: string | null; preEmploymentFull: "recorded" | "missing_evidence";
  consentStatus: string; prohibitedStatusRecorded: boolean;
};
type Summary = { totalDrivers: number; current: number; due: number; overdue: number; missingEvidence: number; prohibitedStatusRecorded: number };
type Payload = { drivers: DriverStatus[]; summary: Summary; guardrail: string; citations: string[] };
const EMPTY: Summary = { totalDrivers: 0, current: 0, due: 0, overdue: 0, missingEvidence: 0, prohibitedStatusRecorded: 0 };
const STATUS_LABEL: Record<AnnualStatus, string> = { current: "Current", due: "Due within 30 days", overdue: "Overdue", missing_evidence: "Missing evidence" };
const STATUS_STYLE: Record<AnnualStatus, string> = { current: "text-emerald-400", due: "text-amber-400", overdue: "text-rose-400", missing_evidence: "text-slate-400" };

export function ClearinghouseStatusPanel() {
  const [payload, setPayload] = useState<Payload>({ drivers: [], summary: EMPTY, guardrail: "", citations: [] });
  const [filter, setFilter] = useState<"all" | AnnualStatus>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRecord, setShowRecord] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ driver_id: "", query_type: "annual_limited", requested_on: new Date().toISOString().slice(0, 10), query_run_on: new Date().toISOString().slice(0, 10), result: "no_information", consent_received_on: "", fmcsa_query_id: "" });

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const token = (await getSupabase().auth.getSession()).data.session?.access_token;
      if (!token) throw new Error("Your session expired. Sign in and try again.");
      const response = await fetch("/api/clearinghouse/status", { headers: { Authorization: `Bearer ${token}` } });
      const body = await response.json().catch(() => ({})) as Partial<Payload>;
      if (!response.ok) throw new Error(`Could not load Clearinghouse status (${response.status}).`);
      setPayload({ drivers: body.drivers || [], summary: body.summary || EMPTY, guardrail: body.guardrail || "", citations: body.citations || [] });
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not load Clearinghouse status."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const visible = useMemo(() => payload.drivers.filter((driver) => filter === "all" || driver.annualStatus === filter), [payload.drivers, filter]);

  async function record(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(null);
    try {
      const token = (await getSupabase().auth.getSession()).data.session?.access_token;
      if (!token) throw new Error("Your session expired. Sign in and try again.");
      const response = await fetch("/api/clearinghouse/status", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          driver_id: form.driver_id, query_type: form.query_type, result: form.result,
          requested_at: `${form.requested_on}T12:00:00Z`,
          query_run_at: form.query_run_on ? `${form.query_run_on}T12:00:00Z` : null,
          consent_received_at: form.consent_received_on ? `${form.consent_received_on}T12:00:00Z` : null,
          fmcsa_query_id: form.fmcsa_query_id || null,
        }),
      });
      if (!response.ok) throw new Error(`Could not record query evidence (${response.status}).`);
      setShowRecord(false); await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not record query evidence."); }
    finally { setBusy(false); }
  }

  return <section className="rounded-xl border border-[#1E3556] bg-[#0C1A30] p-5" aria-labelledby="clearinghouse-status-heading">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#16C7FF]">49 CFR 382.701</div><h2 id="clearinghouse-status-heading" className="text-lg font-extrabold text-white">Clearinghouse query status</h2></div><button type="button" onClick={() => setShowRecord((value) => !value)} className="rounded-lg border border-[#1E3556] px-3 py-2 text-[12px] font-extrabold text-white hover:bg-white/5">{showRecord ? "Close form" : "Record query evidence"}</button></div>
    <p className="mt-1 text-[11px] text-white/55"><strong>Decision support only.</strong> Missing or recorded evidence requires human review before safety-sensitive duty decisions.</p>

    <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-6">{[
      ["Drivers", payload.summary.totalDrivers], ["Current", payload.summary.current], ["Due", payload.summary.due], ["Overdue", payload.summary.overdue], ["Missing", payload.summary.missingEvidence], ["Prohibited flag", payload.summary.prohibitedStatusRecorded],
    ].map(([label, value]) => <div key={String(label)} className="rounded-lg border border-[#1E3556] bg-[#091525] p-3"><div className="text-[9px] uppercase tracking-wider text-white/45">{label}</div><div className="text-xl font-black text-white">{value}</div></div>)}</div>

    {showRecord && <form onSubmit={record} className="mt-4 grid gap-3 rounded-lg border border-[#1E3556] bg-[#091525] p-4 md:grid-cols-3">
      <label className="text-[11px] font-bold text-white/60">Driver *<select required className="x3i mt-1" value={form.driver_id} onChange={(event) => setForm({ ...form, driver_id: event.target.value })}><option value="">Select a driver</option>{payload.drivers.map((driver) => <option key={driver.driverId} value={driver.driverId}>{driver.driverName}</option>)}</select></label>
      <label className="text-[11px] font-bold text-white/60">Query type *<select required className="x3i mt-1" value={form.query_type} onChange={(event) => setForm({ ...form, query_type: event.target.value })}><option value="annual_limited">Annual limited</option><option value="pre_employment_full">Pre-employment full</option><option value="triggered_full">Triggered full</option></select></label>
      <label className="text-[11px] font-bold text-white/60">Result *<select required className="x3i mt-1" value={form.result} onChange={(event) => setForm({ ...form, result: event.target.value })}><option value="no_information">No information</option><option value="information">Information returned</option><option value="pending">Pending</option><option value="error">Error</option></select></label>
      <label className="text-[11px] font-bold text-white/60">Requested date *<input required type="date" className="x3i mt-1" value={form.requested_on} onChange={(event) => setForm({ ...form, requested_on: event.target.value })} /></label>
      <label className="text-[11px] font-bold text-white/60">Query run date<input type="date" className="x3i mt-1" value={form.query_run_on} onChange={(event) => setForm({ ...form, query_run_on: event.target.value })} /></label>
      <label className="text-[11px] font-bold text-white/60">Consent received date<input type="date" className="x3i mt-1" value={form.consent_received_on} onChange={(event) => setForm({ ...form, consent_received_on: event.target.value })} /></label>
      <label className="text-[11px] font-bold text-white/60 md:col-span-2">FMCSA query ID<input maxLength={160} className="x3i mt-1" value={form.fmcsa_query_id} onChange={(event) => setForm({ ...form, fmcsa_query_id: event.target.value })} placeholder="Optional; never generated by X3" /></label>
      <div className="self-end"><button disabled={busy || !form.driver_id} className="rounded-lg bg-[#16C7FF] px-4 py-2.5 text-[12px] font-extrabold text-black disabled:opacity-40">{busy ? "Recording…" : "Record evidence"}</button></div>
    </form>}

    {error && <p role="alert" className="mt-3 text-sm font-bold text-rose-400">{error}</p>}
    <div className="mt-4 flex flex-wrap gap-2">{(["all", "current", "due", "overdue", "missing_evidence"] as const).map((value) => <button type="button" key={value} onClick={() => setFilter(value)} className={`rounded-full border px-3 py-1 text-[10px] font-bold ${filter === value ? "border-[#16C7FF] text-[#16C7FF]" : "border-[#1E3556] text-white/60"}`}>{value === "all" ? "All" : STATUS_LABEL[value]}</button>)}</div>

    <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-[12px]"><thead className="text-[9px] uppercase tracking-wider text-white/40"><tr><th className="px-2 py-2">Driver</th><th className="px-2 py-2">Annual query</th><th className="px-2 py-2">Due</th><th className="px-2 py-2">Pre-employment full</th><th className="px-2 py-2">Consent</th><th className="px-2 py-2">Violation evidence</th></tr></thead><tbody>
      {loading ? <tr><td colSpan={6} className="px-2 py-5 text-white/50">Loading Clearinghouse evidence…</td></tr> : visible.length === 0 ? <tr><td colSpan={6} className="px-2 py-5 text-white/50">No drivers match this evidence filter.</td></tr> : visible.map((driver) => <tr key={driver.driverId} className="border-t border-[#1E3556]"><td className="px-2 py-3 font-bold text-white">{driver.driverName}</td><td className={`px-2 py-3 font-bold ${STATUS_STYLE[driver.annualStatus]}`}>{STATUS_LABEL[driver.annualStatus]}</td><td className="px-2 py-3 text-white/65">{driver.annualDueOn || "Not derivable"}</td><td className="px-2 py-3 text-white/65">{driver.preEmploymentFull === "recorded" ? "Recorded" : "Missing evidence"}</td><td className="px-2 py-3 text-white/65">{driver.consentStatus.replaceAll("_", " ")}</td><td className="px-2 py-3 text-white/65">{driver.prohibitedStatusRecorded ? "Prohibited status recorded — review" : "None recorded"}</td></tr>)}
    </tbody></table></div>
  </section>;
}
