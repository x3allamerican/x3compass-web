"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

function AuthCallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [message, setMessage] = useState("Completing sign-in…");

  useEffect(() => {
    async function run() {
      try {
        const supabase = getSupabase();
        const code = params?.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("No session after callback");
        const stash = typeof window !== "undefined" ? sessionStorage.getItem("x3-signup-stash") : null;
        if (stash) {
          try {
            await fetch("/api/auth/post-signup", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
              body: stash,
            });
            sessionStorage.removeItem("x3-signup-stash");
          } catch { /* non-fatal */ }
        }
        const returnTo = params?.get("return_to") || "/app";
        router.replace(returnTo.startsWith("/") ? returnTo : "/app");
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Sign-in failed");
      }
    }
    run();
  }, [params, router]);

  return (
    <div className="min-h-screen bg-[#0A1929] text-white grid place-items-center px-6">
      <div className="text-center max-w-md">
        <div className="text-3xl mb-4">🔑</div>
        <h1 className="text-xl font-bold mb-2">{message}</h1>
        <p className="text-[12px] text-white/55">If this takes more than a few seconds, <a href="/signin" className="text-[#22D3EE]">sign in manually</a>.</p>
      </div>
    </div>
  );
}
export default function AuthCallbackPage() {
  return (<Suspense fallback={<div className="min-h-screen bg-[#0A1929]" />}><AuthCallbackInner /></Suspense>);
}
