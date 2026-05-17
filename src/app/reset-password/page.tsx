"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true); setError(null);
    try {
      if (password.length < 8) throw new Error("At least 8 characters");
      const { error } = await getSupabase().auth.updateUser({ password });
      if (error) throw error;
      router.push("/app");
    } catch (err) { setError(err instanceof Error ? err.message : "Reset failed"); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)] grid place-items-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl p-9 border border-[var(--border)]" style={{ background: "linear-gradient(180deg, #15233D 0%, #0F1C32 100%)" }}>
          <h2 className="text-[22px] font-extrabold mb-1">Set a new password</h2>
          <p className="text-[12px] text-[var(--fg-muted)] mb-6">At least 8 characters.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" className="w-full px-4 py-3 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)] text-[14px] focus:outline-none focus:border-[#22D3EE]" />
            {error && <div className="text-[12px] text-red-300 bg-red-900/20 border border-red-900/40 rounded-lg px-3 py-2">{error}</div>}
            <button type="submit" disabled={loading} className="w-full py-3 rounded-lg font-extrabold text-[14px] text-[var(--bg)] disabled:opacity-60" style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)" }}>{loading ? "Saving…" : "Save new password"}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
