"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/lib/useUser";
import { apiFetch } from "@/lib/api";

function BillingInner() {
  const { user, carrier, loading } = useUser();
  const params = useSearchParams();
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const checkoutResult = params?.get("checkout");

  useEffect(() => { if (!loading && !user) window.location.href = "/signin?return_to=/app/settings/billing"; }, [user, loading]);

  async function openPortal() {
    setPortalLoading(true); setError(null);
    try {
      const r = await apiFetch<{ ok: boolean; url?: string; error?: string }>("/api/stripe/portal-session", { method: "POST" });
      if (!r.ok || !r.url) throw new Error(r.error || "Portal session failed");
      window.location.href = r.url;
    } catch (err) { setError(err instanceof Error ? err.message : "Portal failed"); }
    finally { setPortalLoading(false); }
  }

  if (loading) return <div className="min-h-screen bg-[var(--bg)] grid place-items-center text-[var(--fg-muted)]">Loading…</div>;
  if (!carrier) return <div className="min-h-screen bg-[var(--bg)] grid place-items-center text-[var(--fg-muted)]">No carrier linked yet — refresh.</div>;

  const isTrial = carrier.subscription_status === "trialing";
  const isActive = carrier.subscription_status === "active";
  const isPastDue = carrier.subscription_status === "past_due";

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/app/settings" className="text-[12px] text-[var(--fg-muted)] hover:text-[var(--fg)] inline-flex items-center gap-2 mb-6">← Back to settings</Link>
        <h1 className="text-3xl font-extrabold mb-2">Billing</h1>
        <p className="text-[var(--fg-muted)] mb-8">Manage subscription, payment method, invoices, and tax info.</p>
        {checkoutResult === "success" && <Banner kind="success">✓ Payment method saved. Subscription is active.</Banner>}
        {checkoutResult === "cancel" && <Banner kind="info">Checkout canceled. You can restart anytime.</Banner>}
        {isPastDue && <Banner kind="warn">⚠ Last payment failed. Update your card to avoid losing access.</Banner>}
        <div className="rounded-2xl p-6 mb-6 bg-[#0F1C32] border border-[var(--border)]">
          <div className="text-[11px] tracking-[.18em] uppercase text-[var(--fg-muted)] font-bold mb-3">Plan</div>
          <div className="flex items-center justify-between mb-1">
            <div className="text-xl font-extrabold">{(carrier.service_tier || "diy").toUpperCase()} {carrier.hazmat_addon ? "+ Hazmat" : ""}</div>
            <div className={`text-[12px] font-bold uppercase tracking-[.14em] ${isActive ? "text-green-400" : isTrial ? "text-[#22D3EE]" : isPastDue ? "text-orange-400" : "text-[var(--fg-muted)]"}`}>{carrier.subscription_status}</div>
          </div>
          {isTrial && carrier.trial_ends_at && <div className="text-[12px] text-[var(--fg-muted)]">Trial ends {new Date(carrier.trial_ends_at).toLocaleDateString()}</div>}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <button onClick={openPortal} disabled={portalLoading} className="rounded-2xl p-6 bg-[#0F1C32] border border-[var(--border)] hover:border-[#22D3EE] text-left">
            <div className="text-xl font-extrabold mb-1">Manage subscription</div>
            <div className="text-[12px] text-[var(--fg-muted)]">Update card · cancel · invoices · change plan</div>
            {portalLoading && <div className="text-[11px] text-[#22D3EE] mt-3">Opening Stripe portal…</div>}
          </button>
          <Link href="/pricing" className="rounded-2xl p-6 bg-[#0F1C32] border border-[var(--border)] hover:border-[#22D3EE] block">
            <div className="text-xl font-extrabold mb-1">Switch plan</div>
            <div className="text-[12px] text-[var(--fg-muted)]">Compare DIY vs DFY vs Enterprise</div>
          </Link>
        </div>
        {error && <div className="mt-6 text-[12px] text-red-300 bg-red-900/20 border border-red-900/40 rounded-lg px-3 py-2">{error}</div>}
      </div>
    </div>
  );
}

function Banner({ kind, children }: { kind: "success" | "info" | "warn"; children: React.ReactNode }) {
  const map = {
    success: { bg: "bg-emerald-900/30", border: "border-emerald-700/40", text: "text-emerald-200" },
    info: { bg: "bg-cyan-900/30", border: "border-cyan-700/40", text: "text-cyan-200" },
    warn: { bg: "bg-orange-900/30", border: "border-orange-700/40", text: "text-orange-200" },
  }[kind];
  return <div className={`rounded-lg px-4 py-3 text-[13px] mb-6 ${map.bg} border ${map.border} ${map.text}`}>{children}</div>;
}

export default function BillingPage() {
  return (<Suspense fallback={<div className="min-h-screen bg-[var(--bg)]" />}><BillingInner /></Suspense>);
}
