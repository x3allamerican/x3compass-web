"use client";

/**
 * DriverDQGrid — the visual driver qualification file view.
 *
 * Shows the 12-document grid from 49 CFR § 391.51 (plus D&A from Part 382)
 * as colored status tiles. Each tile shows the requirement, CFR citation,
 * and a status pill: green=valid · amber=expiring ≤30d · red=missing/expired
 * · gray=not yet collected.
 *
 * This is the "pull up a driver and see all the boxes light up" view.
 */

import { useMemo } from "react";

type Doc = {
  id: string;
  driver_id: string;
  doc_type: string;
  label?: string | null;
  url?: string | null;
  expires_on?: string | null;
};

type DriverLike = {
  id: string;
  first_name?: string;
  last_name?: string;
  hire_date?: string | null;
  cdl_expires_on?: string | null;
  medical_card_expires_on?: string | null;
  last_mvr_pulled_on?: string | null;
  last_drug_test_on?: string | null;
  clearinghouse_full_query_on?: string | null;
};

type Status = "valid" | "expiring" | "expired" | "missing" | "na";

type Requirement = {
  id: string;
  label: string;
  cfr: string;
  hint: string;
  // Doc types that satisfy this requirement
  doc_types: string[];
  // Optional driver-table field that ALSO satisfies (e.g. medical_card_expires_on)
  driver_date_field?: keyof DriverLike;
  // If true, this requirement has an expiration (red when past). Otherwise just presence/absence.
  expires?: boolean;
  // Window in days before expiration to show amber
  warn_window_days?: number;
};

const REQUIREMENTS: Requirement[] = [
  { id: "application",        label: "Driver's application", cfr: "§ 391.21",      hint: "Signed employment application on file.",
    doc_types: ["application"] },
  { id: "mvr_initial",        label: "MVR — initial",        cfr: "§ 391.23(a)",   hint: "Initial MVR within 30 days of hire from every state held in last 3 years.",
    doc_types: ["mvr", "mvr_initial"] },
  { id: "mvr_annual",         label: "MVR — annual",         cfr: "§ 391.25",      hint: "Annual MVR + written review note. The note is part of the requirement.",
    doc_types: ["mvr_annual", "mvr_review"], driver_date_field: "last_mvr_pulled_on", expires: true, warn_window_days: 60 },
  { id: "road_test",          label: "Road test or CDL copy", cfr: "§ 391.31–33",  hint: "Signed road test cert, or a copy of the CDL (which substitutes).",
    doc_types: ["road_test_certificate", "cdl_copy"] },
  { id: "medical_card",       label: "Medical examiner's cert", cfr: "§ 391.43",   hint: "Issued by an examiner on the FMCSA National Registry. ≤24 mo.",
    doc_types: ["medical_card"], driver_date_field: "medical_card_expires_on", expires: true, warn_window_days: 30 },
  { id: "natl_registry",      label: "Nat'l Registry verification", cfr: "§ 391.43", hint: "Screenshot/printout from nationalregistry.fmcsa.dot.gov.",
    doc_types: ["national_registry_verification", "registry_verification"] },
  { id: "clearinghouse_full", label: "Clearinghouse — full query", cfr: "§ 382.701(a)", hint: "Pre-employment full query, driver consent on file.",
    doc_types: ["clearinghouse_query", "clearinghouse_full"], driver_date_field: "clearinghouse_full_query_on" },
  { id: "prior_employer",     label: "Prior-employer inquiry", cfr: "§ 391.23(d)", hint: "Safety performance history covering past 3 years.",
    doc_types: ["prior_employer_inquiry", "psp"] },
  { id: "psp",                label: "PSP report (recommended)", cfr: "§ 385.105", hint: "Pre-Employment Screening Program record — not required but standard.",
    doc_types: ["psp", "psp_report"] },
  { id: "drug_test_pre",      label: "Pre-employment drug test", cfr: "§ 382.301", hint: "Negative result before driver performs safety-sensitive duties.",
    doc_types: ["drug_test_result", "pre_employment_drug_test"], driver_date_field: "last_drug_test_on" },
  { id: "disclosure_consent", label: "FCRA disclosure & consent", cfr: "15 USC § 1681b", hint: "Stand-alone disclosure + signed consent for background screening.",
    doc_types: ["disclosure_consent"] },
  { id: "eldt",               label: "ELDT cert (post-Feb 2022)", cfr: "Part 380, Subpart F", hint: "Required for new CDL applicants since Feb 7, 2022. CDL upgrades + endorsements.",
    doc_types: ["eldt_certificate", "eldt"] },
];

function statusFor(req: Requirement, driver: DriverLike, docs: Doc[]): { status: Status; detail: string; expiresOn?: string } {
  const today = new Date().toISOString().slice(0, 10);
  const matchingDocs = docs.filter(d => req.doc_types.includes(d.doc_type));
  const driverField = req.driver_date_field ? (driver[req.driver_date_field] as string | null | undefined) : null;

  // Find latest expiration across doc rows + driver field
  let latestExpires: string | undefined;
  for (const d of matchingDocs) {
    if (d.expires_on && (!latestExpires || d.expires_on > latestExpires)) latestExpires = d.expires_on;
  }
  if (driverField && (!latestExpires || driverField > latestExpires)) latestExpires = driverField;

  if (matchingDocs.length === 0 && !driverField) {
    return { status: "missing", detail: "Not on file" };
  }

  if (req.expires) {
    if (!latestExpires) return { status: "valid", detail: matchingDocs.length ? `${matchingDocs.length} doc${matchingDocs.length>1?"s":""} · no expiration` : "On file" };
    if (latestExpires < today) return { status: "expired", detail: `Expired ${latestExpires}`, expiresOn: latestExpires };
    const warn = req.warn_window_days || 30;
    const warnLine = new Date(Date.now() + warn * 86_400_000).toISOString().slice(0, 10);
    if (latestExpires <= warnLine) return { status: "expiring", detail: `Expires ${latestExpires}`, expiresOn: latestExpires };
    return { status: "valid", detail: `Valid through ${latestExpires}`, expiresOn: latestExpires };
  }

  // Non-expiring requirements: just need presence
  return { status: "valid", detail: matchingDocs.length ? `${matchingDocs.length} doc${matchingDocs.length>1?"s":""} on file` : "On file" };
}

const STATUS_COLOR: Record<Status, { bg: string; border: string; text: string; pill: string; symbol: string }> = {
  valid:    { bg: "bg-emerald-500/10", border: "border-emerald-500/40", text: "text-emerald-300", pill: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40", symbol: "✓" },
  expiring: { bg: "bg-amber-500/10",   border: "border-amber-500/40",   text: "text-amber-300",   pill: "bg-amber-500/20 text-amber-300 border-amber-500/40",     symbol: "⚠" },
  expired:  { bg: "bg-rose-500/10",    border: "border-rose-500/40",    text: "text-rose-300",    pill: "bg-rose-500/20 text-rose-300 border-rose-500/40",         symbol: "✗" },
  missing:  { bg: "bg-rose-500/10",    border: "border-rose-500/40",    text: "text-rose-300",    pill: "bg-rose-500/20 text-rose-300 border-rose-500/40",         symbol: "○" },
  na:       { bg: "bg-[var(--surface-3)]", border: "border-[var(--border)]", text: "text-[var(--fg-muted)]", pill: "bg-[var(--surface-3)] text-[var(--fg-muted)] border-[var(--border)]", symbol: "–" },
};

export function DriverDQGrid({
  driver,
  docs,
  onUpload,
}: {
  driver: DriverLike;
  docs: Doc[];
  onUpload?: (docType: string) => void;
}) {
  const driverDocs = useMemo(() => docs.filter(d => d.driver_id === driver.id), [docs, driver.id]);
  const evaluated = useMemo(() => REQUIREMENTS.map(req => ({ req, ...statusFor(req, driver, driverDocs) })), [driver, driverDocs]);

  // Roll-up stats
  const summary = useMemo(() => {
    let valid = 0, expiring = 0, expired = 0, missing = 0;
    for (const e of evaluated) {
      if (e.status === "valid") valid++;
      else if (e.status === "expiring") expiring++;
      else if (e.status === "expired") expired++;
      else if (e.status === "missing") missing++;
    }
    const pct = Math.round((valid / REQUIREMENTS.length) * 100);
    return { valid, expiring, expired, missing, pct };
  }, [evaluated]);

  return (
    <div className="space-y-5">
      {/* Header card — driver identity + DQ completion bar */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-3)] p-5">
        <div className="flex items-end justify-between gap-4 mb-3 flex-wrap">
          <div>
            <div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)] mb-1">Driver Qualification File · 49 CFR § 391</div>
            <div className="text-[22px] font-extrabold text-[var(--fg)]">
              {driver.last_name || ""}, {driver.first_name || ""}
            </div>
            {driver.hire_date && <div className="text-[11px] text-[var(--fg-faint)]">Hired {driver.hire_date}</div>}
          </div>
          <div className="text-right">
            <div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)] mb-1">DQ Completion</div>
            <div className="text-[36px] font-black leading-none text-[var(--fg)]">{summary.pct}%</div>
            <div className="text-[11px] text-[var(--fg-muted)] mt-1">
              <span className="text-emerald-400 font-bold">{summary.valid} valid</span>
              {summary.expiring > 0 && <> · <span className="text-amber-400 font-bold">{summary.expiring} expiring</span></>}
              {summary.expired > 0 && <> · <span className="text-rose-400 font-bold">{summary.expired} expired</span></>}
              {summary.missing > 0 && <> · <span className="text-rose-400 font-bold">{summary.missing} missing</span></>}
            </div>
          </div>
        </div>
        <div className="h-2 rounded-full bg-[var(--bg)] overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${summary.pct}%`,
              background: summary.pct >= 95 ? "linear-gradient(90deg, #10B981, #22D3EE)" : summary.pct >= 75 ? "linear-gradient(90deg, #FBBF24, #F59E0B)" : "linear-gradient(90deg, #F87171, #EF4444)",
            }}
          />
        </div>
      </div>

      {/* The 12 status tiles — the "boxes in different colors" Joshua loved */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {evaluated.map(({ req, status, detail, expiresOn }) => {
          const c = STATUS_COLOR[status];
          return (
            <div
              key={req.id}
              className={`rounded-xl border ${c.border} ${c.bg} p-4 cursor-pointer transition-transform hover:scale-[1.02]`}
              onClick={() => onUpload?.(req.doc_types[0])}
              title={req.hint}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-extrabold text-[var(--fg)] leading-tight">{req.label}</div>
                  <div className="text-[10px] font-mono text-[var(--fg-muted)] mt-0.5">{req.cfr}</div>
                </div>
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${c.pill} flex-shrink-0`}>
                  {c.symbol} {status === "valid" ? "OK" : status === "expiring" ? "EXP SOON" : status === "expired" ? "EXPIRED" : status === "missing" ? "MISSING" : "N/A"}
                </span>
              </div>
              <div className={`text-[11px] ${c.text} font-semibold mt-2`}>{detail}</div>
              {expiresOn && status === "expiring" && (
                <div className="text-[10px] text-[var(--fg-muted)] mt-1">
                  {Math.ceil((new Date(expiresOn).getTime() - Date.now()) / 86_400_000)} days remaining
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-[11px] text-[var(--fg-faint)] flex flex-wrap gap-x-4">
        <span><span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1"></span> Valid / on file</span>
        <span><span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1"></span> Expiring within window</span>
        <span><span className="inline-block w-2 h-2 rounded-full bg-rose-500 mr-1"></span> Expired or missing</span>
        <span className="ml-auto text-[var(--fg-muted)]">Click any tile to upload the corresponding document.</span>
      </div>
    </div>
  );
}
