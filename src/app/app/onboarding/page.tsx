"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/lib/useUser";
import { apiFetch } from "@/lib/api";
import { getSupabase } from "@/lib/supabase";

type Step = 1 | 2 | 3;

export default function OnboardingPage() {
  const router = useRouter();
  const { user, carrier, loading, refresh } = useUser();
  const [step, setStep] = useState<Step>(1);
  const [carrierName, setCarrierName] = useState("");
  const [usdot, setUsdot] = useState("");
  const [powerUnits, setPowerUnits] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [driverFirst, setDriverFirst] = useState("");
  const [driverLast, setDriverLast] = useState("");
  const [driverEmail, setDriverEmail] = useState("");
  const [driverCdlState, setDriverCdlState] = useState("");
  const [driverCdlNumber, setDriverCdlNumber] = useState("");
  const [plan, setPlan] = useState<"diy" | "dfy">("diy");
  const [hazmat, setHazmat] = useState(false);
  const [drivers, setDrivers] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (!loading && !user) router.replace("/signin?return_to=/app/onboarding"); }, [user, loading, router]);
  useEffect(() => { if (carrier) { setCarrierName(carrier.name); setUsdot(carrier.usdot_number || ""); } }, [carrier]);

  if (loading || !user) return <div className="min-h-screen bg-[var(--bg)] grid place-items-center text-[var(--fg-muted)]">Loading…</div>;

  async function saveCarrier() {
    setBusy(true); setError(null);
    try {
      if (!carrier) throw new Error("No carrier — refresh and try again");
      const sb = getSupabase();
      const { error } = await sb.from("compass_carriers").update({
        name: carrierName.trim(),
        usdot_number: usdot.trim() || null,
        power_units_count: powerUnits ? Number(powerUnits) : null,
        city: city.trim() || null, state: state.trim() || null,
      }).eq("id", carrier.id);
      if (error) throw error;
      await refresh(); setStep(2);
    } catch (err) { setError(err instanceof Error ? err.message : "Save failed"); }
    finally { setBusy(false); }
  }
  async function saveDriver() {
    setBusy(true); setError(null);
    try {
      if (!carrier) throw new Error("No carrier");
      if (!driverFirst.trim() && !driverLast.trim()) { setStep(3); return; }
      const sb = getSupabase();
      const { error } = await sb.from("compass_drivers").insert({
        carrier_id: carrier.id, first_name: driverFirst.trim(), last_name: driverLast.trim() || "—",
        email: driverEmail.trim() || null, cdl_state: driverCdlState.trim() || null, cdl_number: driverCdlNumber.trim() || null,
        status: "pending_hire",
      });
      if (error) throw error;
      setStep(3);
    } catch (err) { setError(err instanceof Error ? err.message : "Save failed"); }
    finally { setBusy(false); }
  }
  async function startCheckout() {
    setBusy(true); setError(null);
    try {
      const data = await apiFetch<{ ok: boolean; url?: string; error?: string }>("/api/stripe/create-checkout-session", {
        method: "POST", body: JSON.stringify({ plan, drivers, hazmat }),
      });
      if (!data.ok || !data.url) throw new Error(data.error || "Checkout failed");
      window.location.href = data.url;
    } catch (err) { setError(err instanceof Error ? err.message : "Checkout failed"); }
    finally { setBusy(false); }
  }
  function skipToApp() { router.push("/app"); }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold mb-2">Welcome to X3 Compass</h1>
          <p className="text-[var(--fg-muted)]">Three quick steps and you&apos;re live.</p>
        </div>
        <div className="flex justify-center gap-2 mb-10">
          {[1,2,3].map((n) => (<div key={n} className={`h-1.5 w-20 rounded-full ${step >= n ? "bg-[#22D3EE]" : "bg-[var(--border)]"}`} />))}
        </div>
        <div className="rounded-2xl p-9 border border-[var(--border)]" style={{ background: "linear-gradient(180deg, #15233D 0%, #0F1C32 100%)" }}>
          {step === 1 && (<>
            <h2 className="text-xl font-extrabold mb-4">1 · Confirm your company info</h2>
            <div className="space-y-4">
              <Field label="Company name"><input className="x3-input" value={carrierName} onChange={(e) => setCarrierName(e.target.value)} /></Field>
              <Field label="USDOT number"><input className="x3-input" value={usdot} onChange={(e) => setUsdot(e.target.value)} placeholder="1234567" /></Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Power units"><input className="x3-input" type="number" value={powerUnits} onChange={(e) => setPowerUnits(e.target.value)} placeholder="5" /></Field>
                <Field label="State"><input className="x3-input" value={state} onChange={(e) => setState(e.target.value)} placeholder="TX" maxLength={2} /></Field>
              </div>
              <Field label="City"><input className="x3-input" value={city} onChange={(e) => setCity(e.target.value)} /></Field>
              {error && <Err msg={error} />}
              <button disabled={busy || !carrierName} onClick={saveCarrier} className="x3-btn-primary">{busy ? "Saving…" : "Continue →"}</button>
            </div>
          </>)}
          {step === 2 && (<>
            <h2 className="text-xl font-extrabold mb-1">2 · Add your first driver</h2>
            <p className="text-[12px] text-[var(--fg-muted)] mb-6">Optional — you can skip.</p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="First"><input className="x3-input" value={driverFirst} onChange={(e) => setDriverFirst(e.target.value)} /></Field>
                <Field label="Last"><input className="x3-input" value={driverLast} onChange={(e) => setDriverLast(e.target.value)} /></Field>
              </div>
              <Field label="Email"><input type="email" className="x3-input" value={driverEmail} onChange={(e) => setDriverEmail(e.target.value)} /></Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="CDL state"><input className="x3-input" value={driverCdlState} onChange={(e) => setDriverCdlState(e.target.value)} maxLength={2} placeholder="TX" /></Field>
                <Field label="CDL number"><input className="x3-input" value={driverCdlNumber} onChange={(e) => setDriverCdlNumber(e.target.value)} /></Field>
              </div>
              {error && <Err msg={error} />}
              <div className="flex gap-3">
                <button disabled={busy} onClick={() => setStep(3)} className="x3-btn-secondary">Skip</button>
                <button disabled={busy} onClick={saveDriver} className="x3-btn-primary flex-1">{busy ? "Saving…" : "Add driver →"}</button>
              </div>
            </div>
          </>)}
          {step === 3 && (<>
            <h2 className="text-xl font-extrabold mb-1">3 · Pick your plan</h2>
            <p className="text-[12px] text-[var(--fg-muted)] mb-6">7-day free trial active. Card optional today.</p>
            <div className="space-y-3 mb-6">
              <PlanCard active={plan === "diy"} onClick={() => setPlan("diy")} title="DIY" price="$25" sub="/driver/mo" desc="AI Safety Director + skills — you operate it." />
              <PlanCard active={plan === "dfy"} onClick={() => setPlan("dfy")} title="DFY" price="$50" sub="/driver/mo" desc="We operate Compass for you. Concierge included." />
            </div>
            <div className="space-y-3 mb-6">
              <Field label="Number of drivers"><input className="x3-input" type="number" min={1} value={drivers} onChange={(e) => setDrivers(Math.max(1, Number(e.target.value)))} /></Field>
              <label className="flex items-center gap-3 cursor-pointer px-4 py-3 rounded-lg bg-[var(--bg)] border border-[var(--border)] hover:border-[#22D3EE]">
                <input type="checkbox" checked={hazmat} onChange={(e) => setHazmat(e.target.checked)} />
                <div className="flex-1">
                  <div className="text-sm font-bold">+ Hazmat add-on</div>
                  <div className="text-[11px] text-[var(--fg-muted)]">Placard wizard, hazmat skills · $99/mo flat</div>
                </div>
              </label>
            </div>
            {error && <Err msg={error} />}
            <div className="flex gap-3">
              <button onClick={skipToApp} className="x3-btn-secondary">Stay on trial</button>
              <button disabled={busy} onClick={startCheckout} className="x3-btn-primary flex-1">{busy ? "Opening checkout…" : "Continue to billing →"}</button>
            </div>
          </>)}
        </div>
        <p className="text-center mt-6 text-[12px] text-white/35">Want to talk first? <Link href="/faq" className="text-[#22D3EE]">FAQ →</Link></p>
      </div>
      <style jsx global>{`
        .x3-input { width: 100%; padding: 12px 14px; border-radius: 8px; background: #0A1929; border: 1px solid #1E3556; color: white; font-size: 14px; }
        .x3-input:focus { outline: none; border-color: #22D3EE; }
        .x3-btn-primary { width: 100%; padding: 12px 16px; border-radius: 8px; font-weight: 800; font-size: 14px; color: #0A1929; background: linear-gradient(135deg, #22D3EE, #06B6D4); border: 0; cursor: pointer; }
        .x3-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .x3-btn-secondary { padding: 12px 16px; border-radius: 8px; font-weight: 700; font-size: 14px; color: white; background: transparent; border: 1px solid #1E3556; cursor: pointer; }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (<div><label className="text-[11px] tracking-[.14em] uppercase text-[var(--fg-muted)] font-bold mb-1.5 block">{label}</label>{children}</div>);
}
function Err({ msg }: { msg: string }) {
  return <div className="text-[12px] text-red-300 bg-red-900/20 border border-red-900/40 rounded-lg px-3 py-2">{msg}</div>;
}
function PlanCard({ active, onClick, title, price, sub, desc }: { active: boolean; onClick: () => void; title: string; price: string; sub: string; desc: string }) {
  return (
    <button onClick={onClick} className={`w-full text-left p-4 rounded-lg border ${active ? "border-[#22D3EE] bg-[#0F2438]" : "border-[var(--border)] bg-[var(--bg)]"}`}>
      <div className="flex items-baseline justify-between mb-1">
        <div className="font-extrabold text-base">{title}</div>
        <div><span className="font-extrabold text-lg">{price}</span><span className="text-[12px] text-[var(--fg-muted)]">{sub}</span></div>
      </div>
      <div className="text-[12px] text-[var(--fg-muted)]">{desc}</div>
    </button>
  );
}
