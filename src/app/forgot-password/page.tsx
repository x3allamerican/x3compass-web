"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { getSupabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true); setError(null);
    try {
      const { error } = await getSupabase().auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
    } catch (err) { setError(err instanceof Error ? err.message : "Send failed"); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)] grid place-items-center px-6 py-12">
      <div className="w-full max-w-md">
        <Link href="/signin" className="text-[12px] text-[var(--fg-muted)] hover:text-[var(--fg)] inline-flex items-center gap-2 mb-6">← Back to sign in</Link>
        <div className="rounded-2xl p-9 border border-[var(--border)]" style={{ background: "linear-gradient(180deg, #15233D 0%, #0F1C32 100%)" }}>
          <h2 className="text-[22px] font-extrabold mb-1">Reset password</h2>
          <p className="text-[12px] text-[var(--fg-muted)] mb-6">We&apos;ll email you a link to set a new password.</p>
          {sent ? (
            <div className="text-center py-6">
              <div className="text-3xl mb-3">📩</div>
              <p className="text-[var(--fg-muted)] text-sm">If an account exists for <strong className="text-[var(--fg)]">{email}</strong>, we sent reset instructions.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@yourfleet.com" className="w-full px-4 py-3 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)] text-[14px] focus:outline-none focus:border-[#22D3EE]" />
              {error && <div className="text-[12px] text-red-300 bg-red-900/20 border border-red-900/40 rounded-lg px-3 py-2">{error}</div>}
              <button type="submit" disabled={loading} className="w-full py-3 rounded-lg font-extrabold text-[14px] text-[var(--bg)] disabled:opacity-60" style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)" }}>{loading ? "Sending…" : "Send reset link"}</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
