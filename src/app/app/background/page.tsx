"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";

export default function BackgroundRedirectPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/app/background-checks"); }, [router]);
  return (
    <AppShell title="Background Checks">
      <div className="p-6 text-white/55">Redirecting to Background Checks…</div>
    </AppShell>
  );
}
