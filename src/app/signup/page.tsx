"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { getSupabase } from "@/lib/supabase";

function SignUpInner() {
  const router = useRouter();
  const params = useSearchParams();
  const returnTo = params?.get("return_to") || "/onboarding";
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
          data: { carrier_name: carrierName, usdot_number: usdot, intended_plan: "compass" },
        },
      });
      if (error) throw error;
      if (typeof window !== "undefined") {
        sessionStorage.setItem("x3-signup-stash", JSON.stringify({ carrier_name: carrierName, usdot_number: usdot }));
      }
      if (!data.session) { setStep("verify"); return; }
      await fetch("/api/auth/post-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session.access_token}` },
        body: JSON.stringify({ carrier_name: carrierName, usdot_number: usdot }),
      });
      router.push(returnTo.startsWith("/") ? returnTo : "/onboarding");
    } catch (err) { setError(err instanceof Error ? err.message : "Sign-up failed"); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)] grid place-items-center px-6 py-12 relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/photos/highway-night.jpg" alt="" aria-hidden="true" width="2400" height="1600" loading="lazy" decoding="async" className="w-full h-full object-cover opacity-15" />
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--bg)] via-[var(--bg)]/95 to-[var(--bg)]" />
      </div>
      <div className="w-full max-w-md relative">
        <Link href="/" className="text-[12px] text-[var(--fg-muted)] hover:text-[var(--fg)] inline-flex items-center gap-2 mb-6">← Back to home</Link>
        <div className="rounded-2xl p-9 border border-[var(--border)]" style={{ background: "linear-gradient(180deg, var(--surface) 0%, var(--surface-3) 100%)" }}>
          <div className="flex items-center gap-3 mb-7">
            <div className="w-11 h-11 grid place-items-center text-[var(--bg)] font-black text-base rounded-lg" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>X3</div>
            <div><div className="text-[var(--fg)] font-extrabold text-[16px]">X3 COMPASS</div><div className="text-[10px] tracking-[.18em] text-[var(--accent)] font-bold uppercase">AI Safety Director</div></div>
          </div>
          <div className="flex gap-1 mb-6 p-1 rounded-lg bg-[var(--bg)] border border-[var(--border)]">
            <Link href="/signin" className="flex-1 py-2.5 rounded-md font-bold text-[13px] text-[var(--fg-muted)] hover:text-[var(--fg)] text-center">Sign In</Link>
            <button className="flex-1 py-2.5 rounded-md font-bold text-[13px] text-[var(--bg)]" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>Sign Up</button>
          </div>
          {step === "verify" ? (
            <div className="text-center py-8">
              <div className="text-3xl mb-3">📩</div>
              <h3 className="text-[var(--fg)] text-lg font-bold mb-2">Check your email</h3>
              <p className="text-[var(--fg-muted)] text-sm mb-4">We sent a verification link to <strong className="text-[var(--fg)]">{email}</strong>.</p>
              <p className="text-[11px] text-[var(--fg-faint)]">Once verified, you&apos;ll continue to onboarding automatically.</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-[22px] font-extrabold mb-1">Start your 7-day free trial</h2>
                <p className="text-[12px] text-[var(--fg-muted)]">No card required. One plan · every X3 product included.</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div><label className="text-[11px] tracking-[.14em] uppercase text-[var(--fg-muted)] font-bold mb-1.5 block">Company name</label>
                  <input type="text" required value={carrierName} onChange={(e) => setCarrierName(e.target.value)} placeholder="Acme Trucking LLC" className="w-full px-4 py-3 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)] text-[14px] focus:outline-none focus:border-[var(--accent)]" /></div>
                <div><label className="text-[11px] tracking-[.14em] uppercase text-[var(--fg-muted)] font-bold mb-1.5 block">USDOT # (optional)</label>
                  <input type="text" value={usdot} onChange={(e) => setUsdot(e.target.value)} placeholder="1234567" className="w-full px-4 py-3 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)] text-[14px] focus:outline-none focus:border-[var(--accent)]" /></div>
                <div><label className="text-[11px] tracking-[.14em] uppercase text-[var(--fg-muted)] font-bold mb-1.5 block">Work email</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@yourfleet.com" className="w-full px-4 py-3 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)] text-[14px] focus:outline-none focus:border-[var(--accent)]" /></div>
                <div><label className="text-[11px] tracking-[.14em] uppercase text-[var(--fg-muted)] font-bold mb-1.5 block">Password</label>
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" minLength={8} className="w-full px-4 py-3 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)] text-[14px] focus:outline-none focus:border-[var(--accent)]" /></div>
                {error && <div className="text-[12px] text-red-700 dark:text-red-300 bg-red-900/20 border border-red-900/40 rounded-lg px-3 py-2">{error}</div>}
                <button type="submit" disabled={loading} className="w-full py-3 rounded-lg font-extrabold text-[14px] text-[var(--bg)] disabled:opacity-60" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>
                  {loading ? "Creating account…" : "Start free trial →"}
                </button>
                <p className="text-[11px] text-[var(--fg-faint)] text-center">By signing up you agree to our <Link href="https://x3compass.com/faq" className="text-[var(--accent)] hover:underline">Terms</Link>.</p>
              </form>
              <div className="mt-8 pt-6 border-t border-[var(--border)] text-center">
                <p className="text-[12px] text-[var(--fg-muted)]">Already have an account? <Link href="/signin" className="text-[var(--accent)] font-bold">Sign in →</Link></p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
export default function SignUpPage() {
  return (<Suspense fallback={<div className="min-h-screen bg-[var(--bg)]" />}><SignUpInner /></Suspense>);
}
