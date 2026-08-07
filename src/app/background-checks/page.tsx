"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Script from "next/script";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import EducationHubCard from "@/components/EducationHubCard";
import { X3KPITile } from "@/components/X3AdminHero";
import { SkeletonShell, SkeletonRow } from "@/components/Skeleton";
import { useUser } from "@/lib/useUser";
import { getSupabase } from "@/lib/supabase";

type CheckrEmbed = { render: (selector: string) => void; modal: (opts?: { width?: string }) => void; destroy?: () => void };
type CheckrEmbedConstructor = new (opts: Record<string, unknown>) => CheckrEmbed;
declare global {
  interface Window {
    Checkr?: {
      Embeds: {
        NewInvitation: CheckrEmbedConstructor;
        ReportsOverview: CheckrEmbedConstructor;
        DisclosureConsent: CheckrEmbedConstructor;
        SignUpFlow: CheckrEmbedConstructor;
      };
    };
  }
}
const SDK_URL = "https://cdn.jsdelivr.net/npm/@checkr/web-sdk/dist/web-sdk.umd.js";

// ---- Theme-aware status pill (same family as the rest of Sprint #21) ----
const STATUS_PILL: Record<string, string> = {
  invited:               "bg-cyan-100    dark:bg-cyan-500/45    text-cyan-900    dark:text-cyan-50    border-cyan-700    dark:border-cyan-300/80",
  in_progress:           "bg-amber-100   dark:bg-amber-500/45   text-amber-900   dark:text-amber-50   border-amber-700   dark:border-amber-300/80",
  completed:             "bg-emerald-100 dark:bg-emerald-500/45 text-emerald-900 dark:text-emerald-50 border-emerald-700 dark:border-emerald-300/80",
  awaiting_driver:       "bg-violet-100  dark:bg-violet-500/45  text-violet-900  dark:text-violet-50  border-violet-700  dark:border-violet-300/80",
  invitation_expired:    "bg-amber-100   dark:bg-amber-500/45   text-amber-900   dark:text-amber-50   border-amber-700   dark:border-amber-300/80",
  invitation_canceled:   "bg-slate-100   dark:bg-slate-500/45   text-slate-900   dark:text-slate-50   border-slate-600   dark:border-slate-300/80",
  failed:                "bg-rose-100    dark:bg-rose-500/45    text-rose-900    dark:text-rose-50    border-rose-700    dark:border-rose-300/80",
  canceled:              "bg-slate-100   dark:bg-slate-500/45   text-slate-900   dark:text-slate-50   border-slate-600   dark:border-slate-300/80",
  pre_adverse_action:    "bg-amber-100   dark:bg-amber-500/45   text-amber-900   dark:text-amber-50   border-amber-700   dark:border-amber-300/80",
  post_adverse_action:   "bg-rose-100    dark:bg-rose-500/45    text-rose-900    dark:text-rose-50    border-rose-700    dark:border-rose-300/80",
  suspended:             "bg-amber-100   dark:bg-amber-500/45   text-amber-900   dark:text-amber-50   border-amber-700   dark:border-amber-300/80",
  disputed:              "bg-violet-100  dark:bg-violet-500/45  text-violet-900  dark:text-violet-50  border-violet-700  dark:border-violet-300/80",
  engaged:               "bg-cyan-100    dark:bg-cyan-500/45    text-cyan-900    dark:text-cyan-50    border-cyan-700    dark:border-cyan-300/80",
};
function StatusPill({ status }: { status: string }) {
  const cls = STATUS_PILL[status] || STATUS_PILL.canceled;
  return (
    <span role="status" aria-label={`Background-check status: ${status}`} className={`inline-block min-w-[130px] px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border whitespace-nowrap text-center tracking-wider uppercase ${cls}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

type OrderRow = {
  id: string;
  status: string;
  package: string | null;
  work_state: string | null;
  checkr_candidate_id: string | null;
  report_id: string | null;
  checkr_result: string | null;
  checkr_assessment: string | null;
  effective_status: string | null;
  ordered_at: string | null;
  completed_at: string | null;
  last_event_at: string | null;
  adverse_action_at: string | null;
  eta_completion_at: string | null;
  invitation_url: string | null;
  vendor_ref_id: string | null;
};

function isAdverseAction(status: string): boolean {
  return status === "pre_adverse_action" || status === "post_adverse_action";
}

function reportStatus(order: OrderRow): string {
  return order.effective_status || order.checkr_assessment || order.checkr_result || "Pending";
}

function adverseActionLabel(order: OrderRow): string {
  if (order.status === "pre_adverse_action") return "Pre-adverse action · FCRA review window";
  if (order.status === "post_adverse_action") return "Final adverse action";
  return "—";
}

function relTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(iso).toLocaleDateString();
}

export default function BackgroundChecksPage() {
  const { user, carrier, loading: userLoading } = useUser();
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkFailed, setSdkFailed] = useState(false);
  const [lastInvitation, setLastInvitation] = useState<Record<string, unknown> | null>(null);
  const newInviteRef = useRef<HTMLDivElement>(null);
  const reportsRef = useRef<HTMLDivElement>(null);
  const [tokenPath, setTokenPath] = useState<string | null>(null);
  const [reportsError, setReportsError] = useState<string | null>(null);

  // X3 Compass view · vendor_orders rows for this carrier
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Auth redirect
  useEffect(() => {
    if (!userLoading && !user) window.location.href = "/signin?return_to=/background-checks";
  }, [user, userLoading]);

  // Session-token for Checkr embeds · per-embed scope path
  // NewInvitation needs ["order","disclosure"]; ReportsOverview needs ["report"]
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) return;
      const { data: { session } } = await getSupabase().auth.getSession();
      if (cancelled || !session?.access_token) return;
      setTokenPath(`/api/checkr/session-token?token=${encodeURIComponent(session.access_token)}`);
    })();
    return () => { cancelled = true; };
  }, [user]);

  // Render Checkr embeds · each gets a scope-specific token path
  useEffect(() => {
    if (!sdkReady || !tokenPath || !window.Checkr) return;
    if (!newInviteRef.current || !reportsRef.current) return;

    // Scope-specific paths. The Checkr SDK POSTs to this URL when it needs a token;
    // our endpoint reads the `scopes` query string and forwards to Checkr.
    const invitationTokenPath = `${tokenPath}&scopes=order,disclosure`;
    const reportsTokenPath = `${tokenPath}&scopes=report`;

    const newInvite = new window.Checkr.Embeds.NewInvitation({
      sessionTokenPath: invitationTokenPath,
      onInvitationSuccess: (resp: Record<string, unknown>) => {
        setLastInvitation(resp);
        // refresh the X3 view immediately so the user sees the new row
        fetchOrders();
      },
      onInvitationError: (err: unknown) => console.error("[checkr-embed] invitation failed", err),
    });
    newInvite.render("#x3-checkr-new-invitation");

    const reports = new window.Checkr.Embeds.ReportsOverview({
      sessionTokenPath: reportsTokenPath,
      onError: (err: unknown) => {
        console.error("[checkr-embed] ReportsOverview failed", err);
        setReportsError(err instanceof Error ? err.message : JSON.stringify(err));
      },
    });
    reports.render("#x3-checkr-reports-overview");
    return () => { newInvite.destroy?.(); reports.destroy?.(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sdkReady, tokenPath]);

  async function fetchOrders() {
    if (!carrier?.id) return;
    setOrdersLoading(true);
    try {
      const { data } = await getSupabase()
        .from("vendor_orders")
        .select("id,status,package,work_state,checkr_candidate_id,report_id,checkr_result,checkr_assessment,effective_status,ordered_at,completed_at,last_event_at,adverse_action_at,eta_completion_at,invitation_url,vendor_ref_id")
        .eq("vendor", "checkr")
        .eq("carrier_id", carrier.id)
        .order("last_event_at", { ascending: false, nullsFirst: false });
      setOrders((data as OrderRow[]) || []);
    } catch (e) {
      console.error("[bg-checks] orders fetch failed", e);
    } finally {
      setOrdersLoading(false);
    }
  }
  useEffect(() => { fetchOrders(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [carrier?.id]);

  // KPIs
  const stats = useMemo(() => {
    const total = orders.length;
    const completed = orders.filter(o => o.status === "completed").length;
    const inFlight = orders.filter(o => ["invited", "in_progress", "awaiting_driver"].includes(o.status)).length;
    const consider = orders.filter(o => o.checkr_assessment === "consider" || o.checkr_result === "consider" || o.status === "pre_adverse_action" || o.status === "post_adverse_action").length;
    return { total, completed, inFlight, consider };
  }, [orders]);

  // Filtered list
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter(o =>
      (statusFilter === "all" || o.status === statusFilter) &&
      (q === "" ||
        (o.checkr_candidate_id || "").toLowerCase().includes(q) ||
        (o.report_id || "").toLowerCase().includes(q) ||
        (o.package || "").toLowerCase().includes(q))
    );
  }, [orders, statusFilter, search]);

  if (userLoading || !user) {
    return <AppShell title="Background Checks"><div className="p-6"><SkeletonShell kpis={4} rows={6} /></div></AppShell>;
  }

  return (
    <AppShell title="Background Checks" crumbs={`FCRA-compliant driver screening · ${carrier?.name || "your carrier"} · powered by Checkr`}>
      <Script src={SDK_URL} strategy="afterInteractive" onLoad={() => setSdkReady(true)} onError={() => { setSdkFailed(true); console.error("[checkr-sdk] failed to load"); }} />

      <div className="px-6 py-6 space-y-6 bg-[var(--bg)] min-h-screen">

        {/* Hero section removed per Joshua's request. Stats live in the
            X3KPITile strip lower on the page, which is wired to live
            vendor_orders counts and works whether or not the Checkr
            SDK loads. The Education Hub serves as the page intro. */}

        {/* ============================================================
            EDUCATION HUB · universal pattern across every X3 surface
            (matches app.x3compass.com/background-tracker design)
            ============================================================ */}
        <EducationHubCard
          surface="Background Tracker"
          subtitle="Pre-employment background screening, FCRA compliance, ongoing rechecks, and adverse action procedures · per 49 CFR 391.23 + FCRA."
          audiences={[
            {
              label: "For Drivers",
              subtitle: "Job applicants + hires",
              tone: "cyan",
              icon: "👤",
              body: "Your background check matters · but it's not a guarantee of disqualification. Know what's checked, what to dispute, how to explain a past, and your FCRA rights through the process.",
              bullets: [
                "What's checked (MVR, criminal, employment, D&A)",
                "FCRA rights + consent",
                "Disputing inaccurate findings",
                "Explaining past records",
                "Adverse action notice rights",
                "State-specific protections",
                "Re-check at annual or change",
              ],
              cta: "Open Driver guide →",
              href: "/ask?topic=background-checks-drivers",
            },
            {
              label: "For Employers",
              subtitle: "HR / Safety / Compliance",
              tone: "violet",
              icon: "🏢",
              body: "Build a defensible screening program: FCRA-compliant authorization, consistent application of standards, documented decision-making, adverse action procedures, retention. Inconsistent application = discrimination risk. Documentation = defense.",
              bullets: [
                "FCRA compliance + authorization",
                "Pre-hire screening matrix",
                "Adverse action procedure",
                "Hiring decision documentation",
                "Criminal screening + EEOC",
                "Annual re-screening",
                "State-specific (FCRA, ban-the-box)",
                "Retention SOP",
              ],
              cta: "Open Employer guide →",
              href: "/ask?topic=background-checks-employers",
            },
            {
              label: "For C/TPAs",
              subtitle: "Screening service providers",
              tone: "amber",
              icon: "🛡",
              body: "Background screening as a service. Multi-client FCRA compliance. Adverse action coordination. Per-state nuance management. Compliance reporting.",
              bullets: [
                "Multi-client FCRA workflow",
                "Adverse action coordination",
                "Per-state nuance management",
                "Reporting per client",
                "Pre-employment + ongoing",
              ],
              cta: "Open C/TPA guide →",
              href: "/ask?topic=background-checks-ctpa",
            },
          ]}
        />

        {/* ============================================================
            PRICING · pass-through Checkr price list (7 packages)
            Matches reference table at app.x3compass.com/background-tracker.html
            ============================================================ */}
        <section className="x3-card overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border)]">
            <div className="text-[10px] tracking-[.16em] uppercase font-extrabold text-[var(--accent)] mb-1">Price list</div>
            <h2 className="text-[18px] font-extrabold text-[var(--fg)] m-0">Pass-through Checkr pricing · no X3 markup.</h2>
            <p className="text-[12px] text-[var(--fg-muted)] mt-1 mb-0">All prices include FCRA-compliant adverse-action workflow.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-[var(--surface-2)] text-[10px] tracking-[.14em] uppercase font-extrabold text-[var(--fg-muted)]">
                <tr>
                  <th className="text-left px-4 py-3">Package</th>
                  <th className="text-left px-4 py-3">Includes</th>
                  <th className="text-right px-4 py-3" style={{ width: 140 }}>Price</th>
                  <th className="px-4 py-3" style={{ width: 130 }}></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {[
                  { key: "driver_basic_plus", name: "Driver Basic Plus",       tag: { text: "Most Popular",  tone: "popular" }, includes: "SSN trace · Sex offender · Global watchlist · Multi-state criminal · MVR (1 state)", price: "$54.99", strike: null as string | null },
                  { key: "mvr",               name: "Pre-Employment MVR",     tag: { text: "FMCSA Required", tone: "required" }, includes: "Motor Vehicle Record from every state of CDL holding in past 3 years",                price: "$14.99", strike: "$22.00" },
                  { key: "annual_mvr",        name: "Annual MVR",             tag: null,                                       includes: "Single-state MVR for the driver's anniversary · auto-pull via Compass Tracker",        price: "$12.99", strike: null },
                  { key: "da_pre",            name: "DOT Drug & Alcohol (Pre-Employment)", tag: { text: "FMCSA Required", tone: "required" }, includes: "5-panel urinalysis · DOT-certified lab · 24-hr TAT · MRO review", price: "$58.00", strike: null },
                  { key: "psp",               name: "PSP (Pre-Employment Screening Program)", tag: { text: "FMCSA", tone: "required" }, includes: "5-yr crash history + 3-yr roadside inspection report · FMCSA data direct", price: "$10.00", strike: null },
                  { key: "clearinghouse",     name: "FMCSA Clearinghouse Query", tag: { text: "Annual", tone: "required" },     includes: "Limited query (annual) · Full query (pre-employment) · drug & alcohol violations · $24,500/yr unlimited plan available",     price: "$1.25", strike: null },
                  { key: "hme_verify",        name: "Hazmat HME Endorsement Verification", tag: { text: "Hazmat Add-on", tone: "hazmat" }, includes: "Verify driver's active HME (Hazardous Materials Endorsement) via state DMV",        price: "$8.99",  strike: null },
                ].map((p) => {
                  const tagBg =
                    p.tag?.tone === "popular"  ? "rgba(22, 199, 255,0.16)"  :
                    p.tag?.tone === "required" ? "rgba(251,191,36,0.18)"  :
                    p.tag?.tone === "hazmat"   ? "rgba(248,113,113,0.18)" : "transparent";
                  const tagFg =
                    p.tag?.tone === "popular"  ? "var(--accent)"  :
                    p.tag?.tone === "required" ? "var(--warning)" :
                    p.tag?.tone === "hazmat"   ? "var(--danger)"  : "var(--fg)";
                  return (
                    <tr key={p.key} className="hover:bg-[var(--surface-2)]/40">
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[var(--fg)] font-extrabold text-[13.5px]">{p.name}</span>
                          {p.tag && (
                            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", padding: "2px 8px", borderRadius: 4, background: tagBg, color: tagFg, whiteSpace: "nowrap" }}>
                              {p.tag.text}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[var(--fg-muted)] align-top">{p.includes}</td>
                      <td className="px-4 py-3 text-right align-top whitespace-nowrap">
                        <span className="text-[var(--fg)] font-extrabold tabular-nums">{p.price}</span>
                        {p.strike && <span className="ml-2 text-[11px] line-through text-[var(--fg-faint)] tabular-nums">{p.strike}</span>}
                      </td>
                      <td className="px-4 py-3 text-right align-top">
                        <button
                          onClick={() => { newInviteRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
                          className="px-3 py-1.5 rounded-lg font-bold text-[12px] text-[var(--accent)] border border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--surface-2)] whitespace-nowrap"
                        >
                          Order →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-[var(--border)] text-[12px] text-[var(--fg-muted)]">
            <strong className="text-[var(--fg)]">Volume discounts:</strong> 10+ orders/month auto-tier to 10% off pass-through pricing.
            Enterprise pricing for fleets over 100 power units · contact{" "}
            <a href="mailto:partners@x3compass.com" style={{ color: "var(--accent)" }}>partners@x3compass.com</a>.
            Prices last synced from Checkr partner agreement on 2026-05-19.
          </div>
        </section>

        {/* Status bar */}
        <div className="flex items-center justify-between flex-wrap gap-3 bg-[var(--surface-3)] border border-[var(--border)] rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[.14em] font-bold">
            <span className="text-[var(--fg-muted)]">Checkr SDK:</span>
            {sdkFailed ? (
              <span className="text-rose-700 dark:text-rose-300 font-extrabold">✗ Failed to load (showing X3 fallback view below)</span>
            ) : sdkReady ? (
              <span className="text-emerald-700 dark:text-emerald-300 font-extrabold">✓ Ready</span>
            ) : (
              <span className="text-amber-700 dark:text-amber-300 font-extrabold">⏳ Loading…</span>
            )}
          </div>
          <div className="flex gap-2">
            <Link href="/admin/checkr-smoke" className="px-3 py-1.5 rounded-lg font-bold text-[12px] text-[var(--fg)] border border-[var(--border)] hover:bg-[var(--surface-2)]">🔬 Smoke tester</Link>
            <button onClick={fetchOrders} disabled={ordersLoading} className="px-3 py-1.5 rounded-lg font-bold text-[12px] text-[var(--fg)] border border-[var(--border)] hover:bg-[var(--surface-2)] disabled:opacity-50">↻ Refresh</button>
          </div>
        </div>

        {/* KPI strip · pulled from vendor_orders (works whether or not the embed loads) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <X3KPITile label="Total orders"        value={stats.total}     sub="this carrier"                  tone="navy" />
          <X3KPITile label="In flight"           value={stats.inFlight}  sub="invited + in-progress"         tone="navy" />
          <X3KPITile label="Completed"           value={stats.completed} sub="clear or eligible results"     tone="green" />
          <X3KPITile label="Consider / adverse"  value={stats.consider}  sub="FCRA 5-day timer applies"      tone={stats.consider > 0 ? "red" : "navy"} />
        </div>

        {/* Checkr embeds */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] gap-5">
          <div className="x3-card overflow-hidden">
            <div className="px-5 py-3 border-b border-[var(--border)]">
              <div className="text-[10px] tracking-[.16em] uppercase font-extrabold text-[var(--accent)] mb-1">Order a new check</div>
              <p className="text-[12px] text-[var(--fg-muted)]">Driver name + email. Checkr emails them a secure link to provide SSN/DOB/consent · you never touch PII.</p>
            </div>
            <div className="p-3 bg-white" style={{ minHeight: 480 }}>
              <div id="x3-checkr-new-invitation" ref={newInviteRef} />
              {!sdkReady && !sdkFailed && <div className="min-h-[400px] grid place-items-center text-[var(--fg-muted)] text-[13px]">Loading Checkr NewInvitation…</div>}
              {sdkFailed && <div className="min-h-[400px] grid place-items-center text-rose-700 text-[13px] p-6 text-center">Checkr SDK failed to load. Refresh the page or use the X3 fallback below to view existing orders.</div>}
            </div>
            {lastInvitation && (
              <div className="m-3 p-3 rounded-lg border border-emerald-500/40 bg-emerald-100 dark:bg-emerald-500/15 text-[12px] text-emerald-900 dark:text-emerald-100">
                <strong>✓ Invitation sent</strong> · refresh below to see it in the X3 view.
                <pre className="text-[11px] text-emerald-800 dark:text-emerald-200 mt-1 overflow-auto">{JSON.stringify(lastInvitation, null, 2)}</pre>
              </div>
            )}
          </div>

          <div className="x3-card overflow-hidden">
            <div className="px-5 py-3 border-b border-[var(--border)]">
              <div className="text-[10px] tracking-[.16em] uppercase font-extrabold text-[var(--accent)] mb-1">Checkr ReportsOverview</div>
              <p className="text-[12px] text-[var(--fg-muted)]">The native Checkr embed (PII safe). When this fails to load, the X3 fallback below still works.</p>
            </div>
            <div className="p-3 bg-white" style={{ minHeight: 560 }}>
              <div id="x3-checkr-reports-overview" ref={reportsRef} />
              {!sdkReady && !sdkFailed && <div className="min-h-[400px] grid place-items-center text-[var(--fg-muted)] text-[13px]">Loading ReportsOverview…</div>}
              {sdkFailed && <div className="min-h-[400px] grid place-items-center text-rose-700 text-[13px] p-6 text-center">Embed unavailable. Scroll down for the X3 view of all orders.</div>}
              {reportsError && (
                <div className="m-3 p-3 rounded-lg border border-rose-500/40 bg-rose-100 dark:bg-rose-500/15 text-[12px] text-rose-900 dark:text-rose-100">
                  <strong>ReportsOverview error.</strong> Falling back to the X3 view below · all your orders are still visible there.
                  <details className="mt-2"><summary className="cursor-pointer text-[11px]">Show details</summary><pre className="text-[11px] text-rose-800 dark:text-rose-200 mt-1 overflow-auto whitespace-pre-wrap">{reportsError}</pre></details>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* X3 view of vendor_orders · works even if Checkr embed fails */}
        <div className="x3-card overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--border)] flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="text-[10px] tracking-[.16em] uppercase font-extrabold text-[var(--accent)] mb-1">X3 Compass view</div>
              <div className="text-[15px] font-extrabold text-[var(--fg)]">All background checks for this carrier</div>
              <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">Mirrored from <code className="font-mono">vendor_orders</code> via the Checkr webhook. Independent of the iframe embeds above.</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔎 candidate / report / package" className="px-3 py-1.5 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)] text-[12px] min-w-[200px]" />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-2 py-1.5 rounded bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)] text-[12px]">
                <option value="all">All statuses</option>
                <option value="invited">Invited</option>
                <option value="awaiting_driver">Awaiting driver</option>
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
                <option value="pre_adverse_action">Pre-adverse</option>
                <option value="post_adverse_action">Post-adverse</option>
                <option value="canceled">Canceled</option>
                <option value="failed">Failed</option>
              </select>
              <span className="text-[11px] text-[var(--fg-muted)]">{filtered.length} of {orders.length}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead className="bg-[var(--surface-2)] text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)]">
                <tr>
                  <th className="text-left px-3 py-2 font-bold whitespace-nowrap">Ordered</th>
                  <th className="text-left px-3 py-2 font-bold">Candidate</th>
                  <th className="text-left px-3 py-2 font-bold">Package</th>
                  <th className="text-left px-3 py-2 font-bold">Status</th>
                  <th className="text-left px-3 py-2 font-bold">Report status</th>
                  <th className="text-left px-3 py-2 font-bold">Estimated completion</th>
                  <th className="text-left px-3 py-2 font-bold">Last event</th>
                  <th className="text-left px-3 py-2 font-bold">Adverse-action</th>
                  <th className="text-right px-3 py-2 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ordersLoading ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={9} />)
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={9} className="px-3 py-8 text-center text-[var(--fg-muted)]">{orders.length === 0 ? "No background checks ordered yet. Use the form above to send the first secure invitation." : "No orders match these filters."}</td></tr>
                ) : filtered.map(o => (
                  <tr
                    key={o.id}
                    data-adverse-action={isAdverseAction(o.status) ? o.status : undefined}
                    className={`border-t transition-colors ${isAdverseAction(o.status) ? "border-amber-500/60 bg-amber-100/70 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/15" : "border-[var(--border)] hover:bg-[var(--surface-2)]"}`}
                  >
                    <td className="px-3 py-2.5 text-[var(--fg-muted)] tabular-nums whitespace-nowrap">{o.ordered_at ? new Date(o.ordered_at).toLocaleDateString() : "—"}</td>
                    <td className="px-3 py-2.5">
                      <div className="font-mono text-[10px] text-[var(--accent)]" title={o.checkr_candidate_id || ""}>{o.checkr_candidate_id ? `${o.checkr_candidate_id.slice(0, 14)}…` : "—"}</div>
                      {o.report_id && <div className="font-mono text-[9px] text-[var(--fg-faint)]" title={o.report_id}>report {o.report_id.slice(0, 14)}…</div>}
                    </td>
                    <td className="px-3 py-2.5 text-[var(--fg)]">{o.package || "—"}{o.work_state && <span className="text-[10px] text-[var(--fg-muted)]"> · {o.work_state}</span>}</td>
                    <td className="px-3 py-2.5"><StatusPill status={o.status} /></td>
                    <td className="px-3 py-2.5">
                      <span className={`font-extrabold uppercase ${["clear", "eligible"].includes(reportStatus(o).toLowerCase()) ? "text-emerald-700 dark:text-emerald-300" : reportStatus(o).toLowerCase() === "pending" ? "text-[var(--fg-faint)]" : "text-amber-700 dark:text-amber-300"}`}>
                        {reportStatus(o)}
                      </span>
                      {o.checkr_result && o.checkr_assessment && <div className="text-[9px] text-[var(--fg-muted)]">result {o.checkr_result} · assessment {o.checkr_assessment}</div>}
                    </td>
                    <td className="px-3 py-2.5 text-[var(--fg-muted)] whitespace-nowrap">
                      {o.eta_completion_at ? new Date(o.eta_completion_at).toLocaleString() : "Not provided"}
                    </td>
                    <td className="px-3 py-2.5 text-[var(--fg-muted)] whitespace-nowrap">{relTime(o.last_event_at)}</td>
                    <td className="px-3 py-2.5">
                      {isAdverseAction(o.status)
                        ? <div className={o.status === "post_adverse_action" ? "text-rose-700 dark:text-rose-300 font-extrabold" : "text-amber-800 dark:text-amber-200 font-extrabold"}>
                            {adverseActionLabel(o)}
                            {o.adverse_action_at && <div className="text-[10px] font-medium whitespace-nowrap">{new Date(o.adverse_action_at).toLocaleDateString()}</div>}
                          </div>
                        : <span className="text-[var(--fg-faint)]">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      <Link href={`/admin/checkr-smoke?order_id=${o.id}`} className="text-[11px] text-[var(--accent)] hover:underline font-bold">View timeline →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FCRA reminder */}
        <div className="x3-card p-4 text-[12px] text-[var(--fg-muted)] leading-relaxed">
          <strong className="text-[var(--fg)]">FCRA reminder:</strong> Before ordering a consumer report, provide the candidate a clear/conspicuous disclosure + obtain written authorization. The Checkr embed handles both. Follow pre-adverse + post-adverse procedures on &quot;consider&quot; results (5-business-day window before final adverse action). See <Link href="https://x3compass.com/faq" className="text-[var(--accent)] hover:underline">FAQ</Link> and 15 U.S.C. § 1681b.
        </div>
      </div>
    </AppShell>
  );
}

/* BgHeroKpi helper removed along with the hero section (per Joshua). */
