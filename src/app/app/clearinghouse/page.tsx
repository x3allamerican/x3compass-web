"use client";

/* ============================================================
   X3 COMPASS · FMCSA CLEARINGHOUSE · Phase 1 MVP
   ------------------------------------------------------------
   Drug & Alcohol Clearinghouse query orchestration per 49 CFR
   Part 382 Subpart G. Reads/writes:
     - compass_clearinghouse_queries
     - compass_clearinghouse_violations
     - compass_clearinghouse_consents

   Memo: /clearinghouse-vertical-memo.md
   Task: #240

   Phase 1 scope (this file):
     - Education Hub (3 audiences · Drivers / Employers / C-TPAs)
     - 4-KPI strip
     - 24-hour consent watchlist
     - Driver queue table (due for annual limited)
     - Audit ledger of all queries
     - Right side panel: active violations + SAP follow-up
   ============================================================ */

import { FormEvent, useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import EducationHubCard from "@/components/EducationHubCard";
import { useUser } from "@/lib/useUser";
import { getSupabase } from "@/lib/supabase";
import {
  DEMO_CLEARINGHOUSE_QUERIES,
  DEMO_CLEARINGHOUSE_VIOLATIONS,
  DEMO_CLEARINGHOUSE_CONSENTS,
  withDemoFallback,
  type DemoClearinghouseQuery,
  type DemoClearinghouseViolation,
  type DemoClearinghouseConsent,
} from "@/lib/demoFallback";

type Query = DemoClearinghouseQuery;
type Violation = DemoClearinghouseViolation;
type Consent = DemoClearinghouseConsent;

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtRelative(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(iso).toLocaleDateString();
}

function hoursUntil(iso: string | null): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.floor(ms / 3_600_000));
}

const QUERY_TYPE_LABEL: Record<Query["query_type"], string> = {
  pre_employment_full: "Pre-Employment Full",
  annual_limited: "Annual Limited",
  triggered_full: "Triggered Full",
};

const RESULT_PILL: Record<Query["result"], { bg: string; text: string; label: string }> = {
  no_information: { bg: "rgba(74,222,128,0.18)",  text: "var(--success)",            label: "No Information" },
  information:    { bg: "rgba(251,191,36,0.18)",  text: "var(--warning)",            label: "Information" },
  pending:        { bg: "rgba(34,211,238,0.16)",  text: "var(--accent)",             label: "Pending" },
  error:          { bg: "rgba(248,113,113,0.18)", text: "var(--danger)",             label: "Error" },
};

const VIOLATION_LABEL: Record<Violation["violation_type"], string> = {
  positive_drug_test:     "Positive Drug Test",
  positive_alcohol_test:  "Positive Alcohol Test",
  test_refusal:           "Test Refusal",
  actual_knowledge:       "Actual Knowledge",
  pre_employment_positive: "Pre-Employment Positive",
};

export default function ClearinghousePage() {
  const { carrier } = useUser();
  const [queries, setQueries] = useState<Query[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [consents, setConsents] = useState<Consent[]>([]);
  const [carrierCtpa, setCarrierCtpa] = useState<{ legal_name: string; fmcsa_clearinghouse_name: string; mode: string | null; custom_name: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!carrier) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const sb = getSupabase();
      // All three queries hit the new tables. If they don't exist yet (migration
      // not applied), error rows return as empty and demo fallback fills the gap.
      const [q, v, c, ctpaRow] = await Promise.all([
        sb.from("compass_clearinghouse_queries").select("id,driver_id,query_type,query_run_at,result,consent_received_at,cost_cents,fmcsa_query_id").eq("carrier_id", carrier.id).order("query_run_at", { ascending: false }).limit(50),
        sb.from("compass_clearinghouse_violations").select("id,driver_id,violation_type,violation_date,reported_by,prohibited_status_active,sap_evaluation_complete,return_to_duty_complete,notes").eq("carrier_id", carrier.id),
        sb.from("compass_clearinghouse_consents").select("id,driver_id,consent_type,consent_requested_at,consent_deadline_at,consent_received_at").eq("carrier_id", carrier.id).is("consent_revoked_at", null),
        // Carrier's chosen C/TPA · drives the FMCSA Clearinghouse designation prompt below.
        // Joins compass_ctpas if migration 20260527c has been applied; safe NULL fallback otherwise.
        sb.from("carriers").select("ctpa_mode, ctpa_custom_name, ctpa:compass_ctpas(legal_name,fmcsa_clearinghouse_name)").eq("id", carrier.id).maybeSingle(),
      ]);
      if (cancelled) return;
      // Resolve the carrier's C/TPA into a flat shape for the callout below.
      const ctpaData = (ctpaRow.data as { ctpa_mode: string | null; ctpa_custom_name: string | null; ctpa: { legal_name: string; fmcsa_clearinghouse_name: string } | null } | null) || null;
      if (ctpaData?.ctpa) {
        setCarrierCtpa({
          legal_name: ctpaData.ctpa.legal_name,
          fmcsa_clearinghouse_name: ctpaData.ctpa.fmcsa_clearinghouse_name,
          mode: ctpaData.ctpa_mode,
          custom_name: ctpaData.ctpa_custom_name,
        });
      } else {
        setCarrierCtpa(null);
      }
      // Real Supabase rows lack driver_name — Phase 1 just uses demo or returns empty.
      // V1 will join compass_drivers for real labels.
      setQueries((q.data as Query[]) || []);
      setViolations((v.data as Violation[]) || []);
      setConsents((c.data as Consent[]) || []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [carrier]);

  const effQueries    = useMemo(() => withDemoFallback(queries,    DEMO_CLEARINGHOUSE_QUERIES),    [queries]);
  const effViolations = useMemo(() => withDemoFallback(violations, DEMO_CLEARINGHOUSE_VIOLATIONS), [violations]);
  const effConsents   = useMemo(() => withDemoFallback(consents,   DEMO_CLEARINGHOUSE_CONSENTS),   [consents]);
  const isDemo = queries.length === 0;

  // Consent modal state — drives both "Resend" and "+ New pre-employment".
  const [consentModal, setConsentModal] = useState<null | {
    mode: "resend" | "new_pre_employment";
    consent_id?: string;
    driver_id?: string;
    driver_name: string;
    driver_email: string;
    consent_type: "pre_employment" | "triggered_24hr";
  }>(null);

  // Per-row action state for Run / Revoke buttons
  const [actionBusy, setActionBusy]     = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function runQuery(query_id: string) {
    setActionBusy(query_id); setActionNotice(null);
    if (isDemo) {
      // Demo short-circuit
      await new Promise(r => setTimeout(r, 500));
      setActionNotice({ kind: "ok", text: `Demo mode · would have called FMCSA Clearinghouse API for query ${query_id.slice(0, 8)}. Apply the migration to run for real.` });
      setActionBusy(null); return;
    }
    try {
      const sb = getSupabase();
      const { data: { session } } = await sb.auth.getSession();
      const res = await fetch("/api/clearinghouse/run-query", {
        method: "POST",
        headers: { Authorization: `Bearer ${session?.access_token || ""}`, "Content-Type": "application/json" },
        body: JSON.stringify({ query_id }),
      });
      const data = await res.json() as { ok: boolean; error?: string; result?: string; triggered_followup?: boolean };
      if (!data.ok) throw new Error(data.error || "Run failed");
      setActionNotice({ kind: "ok", text: `Query complete · result: ${data.result}${data.triggered_followup ? " · 24-hr triggered consent created" : ""}` });
      // Refresh queries + consents
      if (carrier) {
        const sb2 = getSupabase();
        const [q, c] = await Promise.all([
          sb2.from("compass_clearinghouse_queries").select("id,driver_id,query_type,query_run_at,result,consent_received_at,cost_cents,fmcsa_query_id").eq("carrier_id", carrier.id).order("query_run_at", { ascending: false }).limit(50),
          sb2.from("compass_clearinghouse_consents").select("id,driver_id,consent_type,consent_requested_at,consent_deadline_at,consent_received_at").eq("carrier_id", carrier.id).is("consent_revoked_at", null),
        ]);
        setQueries((q.data as Query[]) || []);
        setConsents((c.data as Consent[]) || []);
      }
    } catch (err) {
      setActionNotice({ kind: "err", text: err instanceof Error ? err.message : "Run failed" });
    } finally {
      setActionBusy(null);
    }
  }

  async function revokeConsent(consent_id: string) {
    if (!confirm("Revoke this consent? The driver's link will stop working. This action is logged for audit.")) return;
    setActionBusy(consent_id); setActionNotice(null);
    if (isDemo) {
      await new Promise(r => setTimeout(r, 300));
      setActionNotice({ kind: "ok", text: `Demo mode · would have revoked consent ${consent_id.slice(0, 8)}.` });
      setActionBusy(null); return;
    }
    try {
      const sb = getSupabase();
      const { data: { session } } = await sb.auth.getSession();
      const res = await fetch("/api/clearinghouse/revoke-consent", {
        method: "POST",
        headers: { Authorization: `Bearer ${session?.access_token || ""}`, "Content-Type": "application/json" },
        body: JSON.stringify({ consent_id }),
      });
      const data = await res.json() as { ok: boolean; error?: string };
      if (!data.ok) throw new Error(data.error || "Revoke failed");
      setActionNotice({ kind: "ok", text: "Consent revoked." });
      // Drop from local state
      setConsents(prev => prev.filter(c => c.id !== consent_id));
    } catch (err) {
      setActionNotice({ kind: "err", text: err instanceof Error ? err.message : "Revoke failed" });
    } finally {
      setActionBusy(null);
    }
  }

  /* KPI counters */
  const kpis = useMemo(() => {
    const now = Date.now();
    const oneYearAgo = now - 365 * 86_400_000;
    const thisMonth = now - 30 * 86_400_000;

    const preEmploymentThisMonth = effQueries.filter(q =>
      q.query_type === "pre_employment_full" &&
      new Date(q.query_run_at).getTime() >= thisMonth
    ).length;

    // Annual coverage: how many distinct drivers had a limited query in last 365d
    const driversWithLimitedLast365 = new Set(
      effQueries
        .filter(q => q.query_type === "annual_limited" && new Date(q.query_run_at).getTime() >= oneYearAgo)
        .map(q => q.driver_id)
    );

    const pendingConsents = effConsents.filter(c => !c.consent_received_at).length;

    return {
      preEmploymentThisMonth,
      annualCoverage: driversWithLimitedLast365.size,
      pendingConsents,
      activeViolations: effViolations.filter(v => v.prohibited_status_active).length,
    };
  }, [effQueries, effViolations, effConsents]);

  const totalCostThisMonthDollars = useMemo(() => {
    const thisMonth = Date.now() - 30 * 86_400_000;
    const cents = effQueries
      .filter(q => new Date(q.query_run_at).getTime() >= thisMonth)
      .reduce((s, q) => s + (q.cost_cents || 0), 0);
    return (cents / 100).toFixed(2);
  }, [effQueries]);

  return (
    <AppShell
      title="Clearinghouse"
      crumbs="FMCSA DRUG & ALCOHOL CLEARINGHOUSE · 49 CFR PART 382 SUBPART G"
      actions={
        <>
          <button className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-bold text-[var(--fg)] border border-[var(--border)] hover:bg-[var(--surface-3)]">
            ⤓ Export audit log
          </button>
          <button className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-bold text-[var(--fg)] border border-[var(--border)] hover:bg-[var(--surface-3)]">
            ⚡ Run annual batch
          </button>
          <button
            onClick={() => setConsentModal({
              mode: "new_pre_employment",
              driver_name: "",
              driver_email: "",
              consent_type: "pre_employment",
            })}
            className="px-4 py-2 rounded-lg font-extrabold text-[12px] text-[var(--bg)]"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
          >
            + New pre-employment query
          </button>
        </>
      }
    >
      <div className="px-6 py-6 space-y-5 bg-[var(--bg)] min-h-screen">

        {/* ============================================================
            EDUCATION HUB · same pattern as every X3 surface
            ============================================================ */}
        <EducationHubCard
          surface="Clearinghouse"
          subtitle="Pre-employment + annual queries, 24-hour limited→full conversion, violation reporting, return-to-duty + SAP follow-up · per 49 CFR Part 382 Subpart G."
          audiences={[
            {
              label: "For Drivers",
              subtitle: "CDL holders + applicants",
              tone: "cyan",
              icon: "🧑‍✈️",
              body: "Your Clearinghouse record follows you between carriers. Know what's reported, who reports it, your right to dispute, and the return-to-duty path if a violation lands on your record.",
              bullets: [
                "What's reported (positive D/A, refusals, return-to-duty)",
                "How to view your own record (free at clearinghouse.fmcsa.dot.gov)",
                "Your right to dispute inaccurate information",
                "The return-to-duty + SAP evaluation path",
                "Follow-up testing schedule (typically 6 tests in 12 months)",
                "Driver consent rights (pre-employment + 24-hr triggered)",
              ],
              cta: "Open Driver guide →",
              href: "/app/ask?context=clearinghouse-drivers",
            },
            {
              label: "For Employers",
              subtitle: "Motor carriers · safety + HR",
              tone: "violet",
              icon: "🏢",
              body: "Pre-employment query before every hire. Annual limited query on every employed CDL driver. 24-hour deadline if limited returns information. Report your own violations within 3 days. Keep records 3 years.",
              bullets: [
                "Pre-employment full query SOP (consent → query → file)",
                "Annual limited query batching strategy",
                "24-hour limited→full conversion checklist",
                "Carrier-reported violation workflow (3-day deadline)",
                "Return-to-duty process (SAP referral → evaluation → RTD test)",
                "Follow-up testing tracker (49 CFR §40 Subpart O)",
                "Record retention (3 years · §382.711)",
                "Penalties: up to $2,750/day for operating prohibited driver",
              ],
              cta: "Open Employer guide →",
              href: "/app/ask?context=clearinghouse-employers",
            },
            {
              label: "For C/TPAs",
              subtitle: "Consortia / third-party admins",
              tone: "amber",
              icon: "🛡",
              body: "Clearinghouse-Designated Employer Representative (C-DER) service at scale. Multi-tenant query orchestration. Consortium reporting. Aggregate audit-readiness across client carriers.",
              bullets: [
                "Multi-carrier query orchestration",
                "Per-client query batching + cost tracking",
                "Consortium drug-test pool integration",
                "Cross-client violation coordination",
                "White-label C-DER service offering",
                "Aggregate compliance reporting",
              ],
              cta: "Open C/TPA guide →",
              href: "/app/ask?context=clearinghouse-ctpa",
            },
          ]}
        />

        {/* ============================================================
            C/TPA DESIGNATION CALLOUT
            ------------------------------------------------------------
            Per §382.705(c), employers may designate a C/TPA in the FMCSA
            Clearinghouse to file queries and report violations on their
            behalf. We pre-fill the EXACT legal name to search at
            clearinghouse.fmcsa.dot.gov · differs per carrier based on
            who they picked at /app/drug-alcohol.
              · If no C/TPA picked yet · prompt them to choose one
              · If Procom picked · prompt to designate PROCOM
              · If BYO picked  · prompt to designate <their TPA's
                                  fmcsa_clearinghouse_name>
            ============================================================ */}
        <section
          className="rounded-xl border p-5 flex items-start gap-4"
          style={{
            background: "linear-gradient(135deg, rgba(22,199,255,0.08), rgba(14,165,233,0.04))",
            borderColor: "rgba(22,199,255,0.30)",
            boxShadow: "var(--card-shadow)",
          }}
          aria-label="C/TPA designation prompt"
        >
          <span aria-hidden style={{ fontSize: 26, lineHeight: 1 }}>📝</span>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] tracking-[.16em] uppercase text-[var(--accent)] font-extrabold mb-1">
              Step · Designate your C/TPA in the FMCSA Clearinghouse
            </div>
            {carrierCtpa ? (
              <>
                <p className="text-[13px] text-[var(--fg)] m-0 leading-relaxed">
                  Your C/TPA is <strong>{carrierCtpa.custom_name || carrierCtpa.legal_name}</strong>. Designate them at clearinghouse.fmcsa.dot.gov so they can {carrierCtpa.mode === "byo_manual" ? "report violations on your behalf" : "conduct queries + report violations on your behalf"}. Search for the exact name when prompted: <code className="text-[11.5px] bg-[var(--surface-3)] px-1.5 py-0.5 rounded font-bold">{carrierCtpa.fmcsa_clearinghouse_name}</code>
                </p>
                <p className="text-[11px] text-[var(--fg-muted)] mt-1.5 m-0">
                  Per §382.711(b)(3) · any C/TPA designation change must be updated in the Clearinghouse within 10 days.
                </p>
              </>
            ) : (
              <>
                <p className="text-[13px] text-[var(--fg)] m-0 leading-relaxed">
                  You haven&apos;t picked a C/TPA yet. Choose one at <Link href="/app/drug-alcohol" className="text-[var(--accent)] font-bold hover:underline">Drug &amp; Alcohol →</Link> and we&apos;ll surface the exact name to designate at clearinghouse.fmcsa.dot.gov. Procom is the X3-recommended default · BYO is fully supported.
                </p>
              </>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href="https://clearinghouse.fmcsa.dot.gov"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-lg text-[12px] font-extrabold text-[var(--bg)]"
                style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
              >
                Open FMCSA Clearinghouse ↗
              </a>
              <Link
                href="/app/drug-alcohol"
                className="px-3.5 py-2 rounded-lg text-[12px] font-bold text-[var(--fg)] border border-[var(--border)] hover:border-[var(--accent)]"
              >
                {carrierCtpa ? "Change C/TPA" : "Pick a C/TPA"}
              </Link>
            </div>
          </div>
        </section>

        {/* ============================================================
            KPI STRIP — 4 mini KPIs
            ============================================================ */}
        {isDemo && (
          <div className="text-[11px] uppercase tracking-[.14em] font-bold text-[var(--accent)]/80">
            ★ Demo data · showing Apex Logistics sample queries until your first query runs
          </div>
        )}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard
            label="Pre-employment queries"
            value={String(kpis.preEmploymentThisMonth)}
            sub="this month · $1.25 each"
            tone="info"
          />
          <KpiCard
            label="Annual coverage"
            value={`${kpis.annualCoverage} drivers`}
            sub="limited query in last 365 days"
            tone={kpis.annualCoverage > 0 ? "ok" : "warn"}
          />
          <KpiCard
            label="Pending consents"
            value={String(kpis.pendingConsents)}
            sub={kpis.pendingConsents > 0 ? "⚠ awaiting driver signature" : "all clear"}
            tone={kpis.pendingConsents > 0 ? "warn" : "ok"}
          />
          <KpiCard
            label="Active violations"
            value={String(kpis.activeViolations)}
            sub={kpis.activeViolations > 0 ? "drivers in prohibited status" : "no prohibited drivers"}
            tone={kpis.activeViolations > 0 ? "danger" : "ok"}
          />
        </div>

        {/* ============================================================
            MAIN GRID — audit ledger left, side panel right
            ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-5">

          {/* ============================================================
              24-HOUR CONSENT WATCHLIST + AUDIT LEDGER (left column)
              ============================================================ */}
          <div className="flex flex-col gap-5">

            {/* 24-Hour Consent Watchlist — only render if there are pending consents */}
            {effConsents.some(c => c.consent_type === "triggered_24hr" && !c.consent_received_at) && (
              <div className="rounded-xl border-2 border-[var(--warning)]/40 bg-[var(--warning)]/5 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[13px] font-extrabold text-[var(--fg)]">
                    <span style={{ color: "var(--warning)" }}>⏱</span> 24-hour consent watchlist
                  </div>
                  <span className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--warning)]">49 CFR §382.701(a)(2)</span>
                </div>
                <div className="text-[12px] text-[var(--fg-muted)] mb-3">
                  Limited query returned <strong>information</strong>. Driver consent + full query must complete within 24 hours of the limited query result.
                </div>
                <div className="flex flex-col gap-2.5">
                  {effConsents
                    .filter(c => c.consent_type === "triggered_24hr" && !c.consent_received_at)
                    .map(c => {
                      const hrs = hoursUntil(c.consent_deadline_at);
                      const urgent = hrs !== null && hrs < 6;
                      return (
                        <div key={c.id} className="flex items-center justify-between bg-[var(--surface)] rounded-lg p-3 border border-[var(--border)]">
                          <div>
                            <div className="text-[13px] font-semibold text-[var(--fg)]">{c.driver_name}</div>
                            <div className="text-[11px] text-[var(--fg-muted)]">
                              Requested {fmtRelative(c.consent_requested_at)} · deadline {fmtDate(c.consent_deadline_at)}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span
                              className="text-[11px] font-extrabold tabular-nums px-2 py-1 rounded"
                              style={{
                                color: urgent ? "var(--danger)" : "var(--warning)",
                                background: urgent ? "rgba(248,113,113,0.18)" : "rgba(251,191,36,0.18)",
                              }}
                            >
                              {hrs}h left
                            </span>
                            <button
                              onClick={() => setConsentModal({
                                mode: "resend",
                                consent_id: c.id,
                                driver_id: c.driver_id,
                                driver_name: c.driver_name,
                                driver_email: "",  // user re-enters / confirms
                                consent_type: "triggered_24hr",
                              })}
                              className="px-3 py-1.5 rounded text-[11px] font-bold text-[var(--bg)]"
                              style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
                            >
                              Resend consent
                            </button>
                            <button
                              onClick={() => revokeConsent(c.id)}
                              disabled={actionBusy === c.id}
                              className="px-3 py-1.5 rounded text-[11px] font-bold text-[var(--fg-muted)] border border-[var(--border)] hover:text-[var(--danger)] hover:border-[var(--danger)]/40 disabled:opacity-50"
                            >
                              {actionBusy === c.id ? "…" : "Revoke"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* AUDIT LEDGER */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-3)] overflow-hidden">
              <div className="px-5 py-3 border-b border-[var(--border)] flex items-center justify-between">
                <div>
                  <div className="text-[10px] tracking-[.16em] uppercase font-extrabold text-[var(--accent)] mb-0.5">Query ledger</div>
                  <div className="text-[15px] font-extrabold text-[var(--fg)]">Audit-ready query history</div>
                </div>
                <div className="text-[12px] text-[var(--fg-muted)]">
                  {effQueries.length} {effQueries.length === 1 ? "query" : "queries"} · ${totalCostThisMonthDollars} this month
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead className="bg-[var(--surface-2)] text-[10px] tracking-[.14em] uppercase font-extrabold text-[var(--fg-muted)]">
                    <tr>
                      <th className="text-left px-4 py-3">Driver</th>
                      <th className="text-left px-4 py-3">Query type</th>
                      <th className="text-left px-4 py-3 hidden md:table-cell">Run at</th>
                      <th className="text-left px-4 py-3">Result</th>
                      <th className="text-left px-4 py-3 hidden lg:table-cell">FMCSA ID</th>
                      <th className="text-right px-4 py-3">Cost</th>
                      <th className="text-right px-4 py-3 w-[90px]"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {loading ? (
                      <tr><td colSpan={7} className="px-4 py-8 text-center text-[var(--fg-muted)]">Loading…</td></tr>
                    ) : effQueries.length === 0 ? (
                      <tr><td colSpan={7} className="px-4 py-10 text-center">
                        <div className="text-2xl mb-2">📋</div>
                        <div className="text-[var(--fg)] font-bold mb-1">No queries yet</div>
                        <div className="text-[var(--fg-muted)] text-sm">Pre-employment queries appear here once you start screening CDL drivers.</div>
                      </td></tr>
                    ) : effQueries.map(q => {
                      const pill = RESULT_PILL[q.result];
                      const isPending = q.result === "pending";
                      return (
                        <tr key={q.id} className="hover:bg-[var(--surface-2)]/40">
                          <td className="px-4 py-3 text-[var(--fg)] font-semibold">{q.driver_name}</td>
                          <td className="px-4 py-3 text-[var(--fg-muted)]">{QUERY_TYPE_LABEL[q.query_type]}</td>
                          <td className="px-4 py-3 text-[var(--fg-muted)] tabular-nums hidden md:table-cell">{fmtDate(q.query_run_at)}</td>
                          <td className="px-4 py-3">
                            <span style={{ background: pill.bg, color: pill.text, padding: "3px 10px", borderRadius: 999, fontSize: 10, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase" }}>
                              {pill.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[11px] text-[var(--fg-faint)] font-mono hidden lg:table-cell">{q.fmcsa_query_id || "—"}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-[var(--fg)]">${((q.cost_cents || 0) / 100).toFixed(2)}</td>
                          <td className="px-4 py-3 text-right">
                            {isPending ? (
                              <button
                                onClick={() => runQuery(q.id)}
                                disabled={actionBusy === q.id}
                                className="px-2.5 py-1 rounded text-[10.5px] font-extrabold text-[var(--bg)] disabled:opacity-50"
                                style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
                              >
                                {actionBusy === q.id ? "Running…" : "Run query →"}
                              </button>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ============================================================
              SIDE PANEL — Active Violations + RTD/SAP Follow-up
              ============================================================ */}
          <aside className="flex flex-col gap-4">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-3)] p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[13px] font-extrabold text-[var(--fg)]">
                  <span style={{ color: "var(--danger)" }}>⚠</span> Active violations
                </div>
                <span className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-faint)]">§382.601</span>
              </div>
              {effViolations.filter(v => v.prohibited_status_active).length === 0 ? (
                <div className="text-[12px] text-[var(--fg-muted)]">No drivers in prohibited status. ✓</div>
              ) : (
                <div className="flex flex-col gap-3">
                  {effViolations.filter(v => v.prohibited_status_active).map(v => (
                    <div key={v.id} className="border-l-2 pl-3" style={{ borderColor: "var(--danger)" }}>
                      <div className="text-[13px] font-semibold text-[var(--fg)]">{v.driver_name}</div>
                      <div className="text-[11px] text-[var(--fg-muted)] mt-0.5">
                        {VIOLATION_LABEL[v.violation_type]} · {fmtDate(v.violation_date)}
                      </div>
                      <div className="text-[11px] text-[var(--fg-faint)] mt-1.5 leading-snug">{v.notes}</div>
                      <button className="mt-2 text-[11px] text-[var(--accent)] hover:underline font-bold">
                        Open RTD workflow →
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-3)] p-5">
              <div className="text-[13px] font-extrabold text-[var(--fg)] mb-3">RTD + SAP follow-up</div>
              {effViolations.filter(v => v.sap_evaluation_complete && !v.prohibited_status_active).length === 0 ? (
                <div className="text-[12px] text-[var(--fg-muted)]">No drivers in active follow-up testing.</div>
              ) : (
                <div className="flex flex-col gap-3">
                  {effViolations.filter(v => v.sap_evaluation_complete && !v.prohibited_status_active).map(v => (
                    <div key={v.id}>
                      <div className="text-[13px] font-semibold text-[var(--fg)]">{v.driver_name}</div>
                      <div className="text-[11px] text-[var(--fg-muted)] mt-0.5">{v.notes}</div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3 pt-3 border-t border-[var(--border)] text-[11px] text-[var(--fg-faint)]">
                49 CFR §40 Subpart O · typically 6 tests in 12 months, can extend to 5 years per SAP plan.
              </div>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <div className="text-[10px] tracking-[.16em] uppercase font-extrabold text-[var(--accent)] mb-1">Pricing</div>
              <div className="text-[13px] text-[var(--fg)] font-semibold mb-2">$1.25 per query · no X3 markup</div>
              <div className="text-[11px] text-[var(--fg-muted)] leading-relaxed">
                Pass-through FMCSA pricing. Limited or full · same fee. Annual unlimited plan ($24,500/yr) available for fleets running 18,000+ queries/year.
              </div>
              <div className="mt-3 text-[11px] text-[var(--fg-faint)]">
                This month: <strong className="text-[var(--fg)]">${totalCostThisMonthDollars}</strong>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ============================================================
          SEND CONSENT MODAL · drives both Resend and New Pre-Employment
          POSTs to /api/clearinghouse/send-consent
          ============================================================ */}
      {consentModal && (
        <SendConsentModal
          state={consentModal}
          isDemo={isDemo}
          onClose={() => setConsentModal(null)}
          onSent={() => {
            setConsentModal(null);
            // Soft-refresh: re-fetch consents to update the watchlist
            if (carrier) {
              getSupabase()
                .from("compass_clearinghouse_consents")
                .select("id,driver_id,consent_type,consent_requested_at,consent_deadline_at,consent_received_at")
                .eq("carrier_id", carrier.id)
                .is("consent_revoked_at", null)
                .then(({ data }) => setConsents((data as Consent[]) || []));
            }
          }}
        />
      )}
    </AppShell>
  );
}

/* ============================================================
   SendConsentModal · two-mode dialog
   - mode='resend':              prefilled driver_name + consent_id; user
                                 just confirms the email address and submits.
   - mode='new_pre_employment':  blank slate; user picks driver + types
                                 email + submits. Server creates a new
                                 compass_clearinghouse_consents row.
   ============================================================ */
function SendConsentModal({
  state,
  isDemo,
  onClose,
  onSent,
}: {
  state: { mode: "resend" | "new_pre_employment"; consent_id?: string; driver_id?: string; driver_name: string; driver_email: string; consent_type: "pre_employment" | "triggered_24hr" };
  isDemo: boolean;
  onClose: () => void;
  onSent: () => void;
}) {
  const [driverName, setDriverName]   = useState(state.driver_name);
  const [driverEmail, setDriverEmail] = useState(state.driver_email);
  const [busy, setBusy]               = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [success, setSuccess]         = useState<string | null>(null);

  const title = state.mode === "resend"
    ? `Resend consent · ${driverName || "driver"}`
    : "New pre-employment query · request driver consent";

  const intro = state.consent_type === "triggered_24hr"
    ? "Sending the 24-hour triggered consent reminder. FMCSA requires the driver to consent within 24 hours of the limited query result · 49 CFR §382.701(a)(2)."
    : "Sending the pre-employment consent request. FMCSA requires driver electronic consent before the full query can be run · 49 CFR §382.701(a).";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!driverName.trim() || !driverEmail.trim()) {
      setError("Driver name and email are both required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(driverEmail)) {
      setError("Driver email looks invalid.");
      return;
    }

    setBusy(true);

    if (isDemo) {
      // Demo mode · no real send. Show what would have happened.
      await new Promise(r => setTimeout(r, 400));
      setSuccess(`Demo mode · would have emailed ${driverEmail} with the ${state.consent_type === "triggered_24hr" ? "24-hour triggered" : "pre-employment"} consent template. Apply the migration + connect Resend + Supabase to send for real.`);
      setBusy(false);
      return;
    }

    try {
      const sb = getSupabase();
      const { data: { session } } = await sb.auth.getSession();
      if (!session?.access_token) throw new Error("Sign in required");

      const res = await fetch("/api/clearinghouse/send-consent", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          consent_id: state.consent_id,
          driver_id: state.driver_id,
          driver_name: driverName,
          driver_email: driverEmail,
          consent_type: state.consent_type,
        }),
      });
      const data = await res.json() as { ok: boolean; error?: string; sent_at?: string; deadline_at?: string; email?: { delivered: boolean; error?: string } };
      if (!data.ok) throw new Error(data.error || "Send failed");

      const msg = data.email?.delivered
        ? `Consent request emailed to ${driverEmail}. ${data.deadline_at ? `Deadline: ${new Date(data.deadline_at).toLocaleString()}.` : ""}`
        : `Consent recorded but email failed: ${data.email?.error || "unknown"}. You can resend.`;
      setSuccess(msg);
      setTimeout(onSent, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-6" onClick={onClose}>
      <div className="bg-[var(--surface-3)] border border-[var(--border)] rounded-2xl max-w-lg w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-[var(--fg)] font-extrabold text-[15px]">{title}</h2>
          <button onClick={onClose} className="text-[var(--fg-muted)] hover:text-[var(--fg)] text-xl" aria-label="Close">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-[12px] text-[var(--fg-muted)] leading-relaxed">{intro}</p>

          {isDemo && (
            <div className="rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/8 px-3 py-2 text-[11px] text-[var(--accent)]">
              ★ Demo mode · this will simulate the email without actually sending. Apply the SQL migration + connect Resend API key to enable real sends.
            </div>
          )}

          <label className="block">
            <div className="text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)] font-bold mb-1">Driver name</div>
            <input
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              placeholder="e.g. Marcus Reyes"
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)] text-sm focus:outline-none focus:border-[var(--accent)]"
              required
              disabled={busy}
            />
          </label>

          <label className="block">
            <div className="text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)] font-bold mb-1">Driver email</div>
            <input
              type="email"
              value={driverEmail}
              onChange={(e) => setDriverEmail(e.target.value)}
              placeholder="driver@example.com"
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)] text-sm focus:outline-none focus:border-[var(--accent)]"
              required
              disabled={busy}
            />
            <div className="text-[10.5px] text-[var(--fg-faint)] mt-1">The driver will receive a one-click consent link.</div>
          </label>

          {error && (
            <div className="rounded-lg border border-[var(--danger)]/40 bg-[var(--danger)]/8 px-3 py-2 text-[12px] text-[var(--danger)]">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg border border-[var(--success)]/40 bg-[var(--success)]/8 px-3 py-2 text-[12px] text-[var(--success)]">
              ✓ {success}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="px-4 py-2 rounded-lg text-[12px] font-bold text-[var(--fg-muted)] border border-[var(--border)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy || !!success}
              className="px-5 py-2 rounded-lg text-[12px] font-extrabold text-[var(--bg)] disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
            >
              {busy ? "Sending…" : success ? "Sent ✓" : (state.mode === "resend" ? "Resend consent" : "Send consent request")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ============================================================
   KPI helper · matches the pattern used in other /app pages
   ============================================================ */
function KpiCard({ label, value, sub, tone = "ok" }: { label: string; value: string | number; sub?: string; tone?: "ok" | "warn" | "info" | "muted" | "danger" }) {
  const color =
    tone === "warn"   ? "var(--warning)" :
    tone === "danger" ? "var(--danger)"  :
    tone === "info"   ? "var(--accent)"  :
    tone === "muted"  ? "var(--fg-muted)": "var(--accent)";
  const showAccent = (tone === "warn" || tone === "danger") && typeof value === "string" && value !== "0";
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-3)] p-4">
      <div className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)] mb-1">{label}</div>
      <div className="text-[28px] font-black leading-none text-[var(--fg)]" style={{ color: showAccent ? color : undefined }}>
        {value}
      </div>
      {sub && <div className="text-[11px] text-[var(--fg-muted)] mt-1">{sub}</div>}
    </div>
  );
}
