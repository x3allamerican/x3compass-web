"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { getSupabase } from "@/lib/supabase";

function SignInInner() {
  const router = useRouter();
  const params = useSearchParams();
  const returnTo = params?.get("return_to") || "/app";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [magicSent, setMagicSent] = useState(false);

  async function handlePasswordSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true); setError(null);
    try {
      const { error } = await getSupabase().auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push(returnTo.startsWith("/") ? returnTo : "/app");
    } catch (err) { setError(err instanceof Error ? err.message : "Sign-in failed"); }
    finally { setLoading(false); }
  }
  async function handleMagicSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true); setError(null);
    try {
      const { error } = await getSupabase().auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?return_to=${encodeURIComponent(returnTo)}` },
      });
      if (error) throw error;
      setMagicSent(true);
    } catch (err) { setError(err instanceof Error ? err.message : "Magic-link send failed"); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)] grid place-items-center px-6 py-12 relative overflow-hidden">
      {/* decorative wash removed for production design pass */}
      <div className="w-full max-w-md relative">
        <Link href="/" className="text-[12px] text-[var(--fg-muted)] hover:text-[var(--fg)] inline-flex items-center gap-2 mb-6">← Back to home</Link>
        <div className="rounded-2xl p-9 border border-[var(--border)]" style={{ background: "linear-gradient(180deg, #15233D 0%, #0F1C32 100%)", boxShadow: "0 24px 60px rgba(0, 0, 0, 0.45)" }}>
          <div className="flex items-center gap-3 mb-7">
            <div className="w-11 h-11 grid place-items-center text-[var(--bg)] font-black text-base rounded-lg" style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)" }}>X3</div>
            <div><div className="text-[var(--fg)] font-extrabold text-[16px]">X3 COMPASS</div><div className="text-[10px] tracking-[.18em] text-[#22D3EE] font-bold uppercase">AI Safety Director</div></div>
          </div>
          <div className="flex gap-1 mb-6 p-1 rounded-lg bg-[var(--bg)] border border-[var(--border)]">
            <button className="flex-1 py-2.5 rounded-md font-bold text-[13px] text-[var(--bg)]" style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)" }}>Sign In</button>
            <Link href="/signup" className="flex-1 py-2.5 rounded-md font-bold text-[13px] text-[var(--fg-muted)] hover:text-[var(--fg)] text-center">Sign Up</Link>
          </div>
          {magicSent ? (
            <div className="text-center py-8">
              <div className="text-3xl mb-3">📩</div>
              <h3 className="text-[var(--fg)] text-lg font-bold mb-2">Check your email</h3>
              <p className="text-[var(--fg-muted)] text-sm">We sent a sign-in link to <strong className="text-[var(--fg)]">{email}</strong>.</p>
            </div>
          ) : (
            <>
              <form onSubmit={mode === "password" ? handlePasswordSubmit : handleMagicSubmit} className="space-y-4">
                <div>
                  <label className="text-[11px] tracking-[.14em] uppercase text-[var(--fg-muted)] font-bold mb-1.5 block">Email</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@yourfleet.com" className="w-full px-4 py-3 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)] text-[14px] focus:outline-none focus:border-[#22D3EE]" />
                </div>
                {mode === "password" && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] tracking-[.14em] uppercase text-[var(--fg-muted)] font-bold">Password</label>
                      <Link href="/forgot-password" className="text-[11px] text-[#22D3EE] hover:underline">Forgot?</Link>
                    </div>
                    <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-4 py-3 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)] text-[14px] focus:outline-none focus:border-[#22D3EE]" />
                  </div>
                )}
                {error && <div className="text-[12px] text-red-300 bg-red-900/20 border border-red-900/40 rounded-lg px-3 py-2">{error}</div>}
                <button type="submit" disabled={loading} className="w-full py-3 rounded-lg font-extrabold text-[14px] text-[var(--bg)] disabled:opacity-60" style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)" }}>
                  {loading ? "…" : mode === "password" ? "Sign in" : "Send magic link"}
                </button>
              </form>
              <div className="mt-6 text-center">
                <button onClick={() => setMode(mode === "password" ? "magic" : "password")} className="text-[12px] text-[var(--fg-muted)] hover:text-[#22D3EE]">
                  {mode === "password" ? "Or sign in with a magic link →" : "← Back to password sign-in"}
                </button>
              </div>
              <div className="mt-8 pt-6 border-t border-[var(--border)] text-center">
                <p className="text-[12px] text-[var(--fg-muted)]">New to X3 Compass? <Link href="/signup" className="text-[#22D3EE] font-bold">Start your free trial →</Link></p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
export default function SignInPage() {
  return (<Suspense fallback={<div className="min-h-screen bg-[var(--bg)]" />}><SignInInner /></Suspense>);
}
