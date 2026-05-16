"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { getSupabase } from "@/lib/supabase";

function SignUpInner() {
  const router = useRouter();
  const params = useSearchParams();
  const returnTo = params?.get("return_to") || "/app/onboarding";
  const planParam = params?.get("plan") || "diy";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [carrierName, setCarrierName] = useState("");
  const [usdot, setUsdot] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"form" | "verify">("form");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true); setError(null);
    try {
      if (password.length < 8) throw new Error("Password must be at least 8 characters");
      if (!carrierName.trim()) throw new Error("Please enter your company name");
      const { data, error } = await getSupabase().auth.signUp({
        email, password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?return_to=${encodeURIComponent(returnTo)}`,
          data: { carrier_name: carrierName, usdot_number: usdot, intended_plan: planParam },
        },
      });
      if (error) throw error;
      if (typeof window !== "undefined") {
        sessionStorage.setItem("x3-signup-stash", JSON.stringify({ carrier_name: carrierName, usdot_number: usdot, plan: planParam }));
      }
      if (!data.session) { setStep("verify"); return; }
      await fetch("/api/auth/post-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session.access_token}` },
        body: JSON.stringify({ carrier_name: carrierName, usdot_number: usdot, plan: planParam }),
      });
      router.push(returnTo.startsWith("/") ? returnTo : "/app/onboarding");
    } catch (err) { setError(err instanceof Error ? err.message : "Sign-up failed"); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-[#0A1929] text-white grid place-items-center px-6 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="text-[12px] text-white/55 hover:text-white inline-flex items-center gap-2 mb-6">← Back to home</Link>
        <div className="rounded-2xl p-9 border border-[#1E3556]" style={{ background: "linear-gradient(180deg, #15233D 0%, #0F1C32 100%)" }}>
          <div className="flex items-center gap-3 mb-7">
            <div className="w-11 h-11 grid place-items-center text-[#0A1929] font-black text-base rounded-lg" style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)" }}>X3</div>
            <div><div className="text-white font-extrabold text-[16px]">X3 COMPASS</div><div className="text-[10px] tracking-[.18em] text-[#22D3EE] font-bold uppercase">AI Safety Director</div></div>
          </div>
          <div className="flex gap-1 mb-6 p-1 rounded-lg bg-[#0A1929] border border-[#1E3556]">
            <Link href="/signin" className="flex-1 py-2.5 rounded-md font-bold text-[13px] text-white/65 hover:text-white text-center">Sign In</Link>
            <button className="flex-1 py-2.5 rounded-md font-bold text-[13px] text-[#0A1929]" style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)" }}>Sign Up</button>
          </div>
          {step === "verify" ? (
            <div className="text-center py-8">
              <div className="text-3xl mb-3">📩</div>
              <h3 className="text-white text-lg font-bold mb-2">Check your email</h3>
              <p className="text-white/65 text-sm mb-4">We sent a verification link to <strong className="text-white">{email}</strong>.</p>
              <p className="text-[11px] text-white/45">Once verified, you&apos;ll continue to onboarding automatically.</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-[22px] font-extrabold mb-1">Start your 7-day free trial</h2>
                <p className="text-[12px] text-white/55">No card required. Plan: <strong className="text-[#22D3EE] uppercase">{planParam}</strong></p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div><label className="text-[11px] tracking-[.14em] uppercase text-white/55 font-bold mb-1.5 block">Company name</label>
                  <input type="text" required value={carrierName} onChange={(e) => setCarrierName(e.target.value)} placeholder="Acme Trucking LLC" className="w-full px-4 py-3 rounded-lg bg-[#0A1929] border border-[#1E3556] text-white text-[14px] focus:outline-none focus:border-[#22D3EE]" /></div>
                <div><label className="text-[11px] tracking-[.14em] uppercase text-white/55 font-bold mb-1.5 block">USDOT # (optional)</label>
                  <input type="text" value={usdot} onChange={(e) => setUsdot(e.target.value)} placeholder="1234567" className="w-full px-4 py-3 rounded-lg bg-[#0A1929] border border-[#1E3556] text-white text-[14px] focus:outline-none focus:border-[#22D3EE]" /></div>
                <div><label className="text-[11px] tracking-[.14em] uppercase text-white/55 font-bold mb-1.5 block">Work email</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@yourfleet.com" className="w-full px-4 py-3 rounded-lg bg-[#0A1929] border border-[#1E3556] text-white text-[14px] focus:outline-none focus:border-[#22D3EE]" /></div>
                <div><label className="text-[11px] tracking-[.14em] uppercase text-white/55 font-bold mb-1.5 block">Password</label>
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" minLength={8} className="w-full px-4 py-3 rounded-lg bg-[#0A1929] border border-[#1E3556] text-white text-[14px] focus:outline-none focus:border-[#22D3EE]" /></div>
                {error && <div className="text-[12px] text-red-300 bg-red-900/20 border border-red-900/40 rounded-lg px-3 py-2">{error}</div>}
                <button type="submit" disabled={loading} className="w-full py-3 rounded-lg font-extrabold text-[14px] text-[#0A1929] disabled:opacity-60" style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)" }}>
                  {loading ? "Creating account…" : "Start free trial →"}
                </button>
                <p className="text-[11px] text-white/45 text-center">By signing up you agree to our <Link href="/faq" className="text-[#22D3EE] hover:underline">Terms</Link>.</p>
              </form>
              <div className="mt-8 pt-6 border-t border-[#1E3556] text-center">
                <p className="text-[12px] text-white/55">Already have an account? <Link href="/signin" className="text-[#22D3EE] font-bold">Sign in →</Link></p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
export default function SignUpPage() {
  return (<Suspense fallback={<div className="min-h-screen bg-[#0A1929]" />}><SignUpInner /></Suspense>);
}
