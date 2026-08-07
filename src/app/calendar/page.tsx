"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { buildComplianceCalendar } from "@/lib/complianceCalendar.mjs";
import { getSupabase } from "@/lib/supabase";

type Status = "overdue" | "due" | "current" | "confirm_applicability" | "evidence_missing";
type CalendarItem = {
  id: string; rule: string; title: string; subject: string; citation: string;
  dueDate: string | null; status: Status; evidence: string[]; guardrail: string;
};
type CalendarResult = { items: CalendarItem[]; counts: Record<Status | "total", number> };
type ApiPayload = { ok: boolean; evidence?: Record<string, unknown>; code?: string };

const FILTERS: Array<{ key: "all" | Status; label: string }> = [
  { key: "all", label: "All" },
  { key: "overdue", label: "Overdue" },
  { key: "due", label: "Due in 30 days" },
  { key: "evidence_missing", label: "Evidence missing" },
  { key: "confirm_applicability", label: "Confirm applicability" },
  { key: "current", label: "Current" },
];

const STATUS_STYLE: Record<Status, string> = {
  overdue: "border-rose-500/50 bg-rose-500/15 text-rose-200",
  due: "border-amber-500/50 bg-amber-500/15 text-amber-200",
  current: "border-emerald-500/50 bg-emerald-500/15 text-emerald-200",
  confirm_applicability: "border-violet-500/50 bg-violet-500/15 text-violet-200",
  evidence_missing: "border-slate-500/60 bg-slate-500/20 text-slate-200",
};

function label(status: Status) {
  return status.replaceAll("_", " ");
}

function formatDate(value: string | null) {
  if (!value) return "No date inferred";
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", year: "numeric", month: "short", day: "numeric" })
    .format(new Date(`${value}T00:00:00Z`));
}

export default function ComplianceCalendarPage() {
  const [result, setResult] = useState<CalendarResult | null>(null);
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data: { session } } = await getSupabase().auth.getSession();
        if (!session?.access_token) throw new Error("missing session");
        const response = await fetch("/api/compliance-calendar", {
          cache: "no-store",
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const payload = await response.json() as ApiPayload;
        if (!response.ok || !payload.ok || !payload.evidence) throw new Error(payload.code || "evidence unavailable");
        const calendar = buildComplianceCalendar({
          ...payload.evidence,
          asOf: new Date().toISOString().slice(0, 10),
        }) as CalendarResult;
        if (active) { setResult(calendar); setState("ready"); }
      } catch {
        if (active) setState("error");
      }
    })();
    return () => { active = false; };
  }, []);

  const visible = useMemo(() => result?.items.filter((entry) => filter === "all" || entry.status === filter) || [], [filter, result]);

  return (
    <AppShell title="Compliance Calendar" crumbs="Evidence-backed planning · FMCSA + IFTA">
      <div className="min-h-screen bg-[var(--bg)] px-6 py-6 space-y-5">
        <section className="x3-card p-5 border-l-4 border-l-[var(--accent)]">
          <h2 className="text-[18px] font-extrabold text-[var(--fg)]">One calendar, grounded in your records</h2>
          <p className="mt-1 max-w-4xl text-[13px] leading-relaxed text-[var(--fg-muted)]">
            Dates are calculated only when the required source evidence exists. Missing evidence and unresolved applicability stay visible instead of becoming invented deadlines. Decision support only—confirm actions with a qualified reviewer.
          </p>
        </section>

        {state === "loading" && <div className="x3-card p-8 text-[13px] text-[var(--fg-muted)]">Loading carrier evidence…</div>}
        {state === "error" && (
          <div role="alert" className="x3-card p-8 border border-rose-500/40 text-[13px] text-rose-200">
            Calendar evidence is unavailable right now. No substitute or sample deadlines were shown.
          </div>
        )}

        {state === "ready" && result && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {FILTERS.slice(1).map(({ key, label: title }) => (
                <button key={key} type="button" onClick={() => setFilter(key as Status)} className="x3-card p-4 text-left hover:border-[var(--accent)] transition-colors">
                  <div className="text-[10px] tracking-[.12em] uppercase font-bold text-[var(--fg-muted)]">{title}</div>
                  <div className="mt-1 text-[28px] font-black text-[var(--fg)] tabular-nums">{result.counts[key as Status]}</div>
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2" aria-label="Calendar status filters">
              {FILTERS.map(({ key, label: title }) => (
                <button key={key} type="button" onClick={() => setFilter(key)} aria-pressed={filter === key}
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-bold ${filter === key ? "border-[var(--accent)] bg-[var(--accent)] text-black" : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--fg-muted)]"}`}>
                  {title}{key === "all" ? ` · ${result.counts.total}` : ""}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {visible.map((entry) => (
                <article key={entry.id} className="x3-card p-5 grid gap-4 md:grid-cols-[170px_1fr]">
                  <div>
                    <div className="text-[20px] font-black text-[var(--fg)] tabular-nums">{formatDate(entry.dueDate)}</div>
                    <span className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[.08em] ${STATUS_STYLE[entry.status]}`}>
                      {label(entry.status)}
                    </span>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="text-[16px] font-extrabold text-[var(--fg)]">{entry.title}</h3>
                        <div className="text-[12px] text-[var(--fg-muted)]">{entry.subject} · <span className="font-mono text-[var(--accent)]">{entry.citation}</span></div>
                      </div>
                    </div>
                    <ul className="mt-3 space-y-1 text-[12px] text-[var(--fg-muted)]">
                      {entry.evidence.map((fact) => <li key={fact}>Evidence: {fact}</li>)}
                    </ul>
                    <p className="mt-3 text-[11px] leading-relaxed text-[var(--fg-faint)]">{entry.guardrail}</p>
                  </div>
                </article>
              ))}
              {visible.length === 0 && <div className="x3-card p-8 text-center text-[13px] text-[var(--fg-muted)]">No calendar items match this status.</div>}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
