"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Log for diagnostics; the digest correlates to the server log without exposing detail.
    console.error("[app error]", error?.digest || "", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#000000] text-white px-6">
      <div className="max-w-md text-center">
        <div className="text-3xl mb-3" aria-hidden>⚠️</div>
        <h1 className="text-[22px] font-extrabold mb-2">Something went wrong</h1>
        <p className="text-[14px] text-white/60 mb-6">
          A problem interrupted this page. Your data is safe. Try again, or head back to your dashboard.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => reset()} className="px-5 py-2.5 rounded-lg font-extrabold text-[13px] text-black" style={{ background: "linear-gradient(135deg, #16C7FF, #16C7FF)" }}>Try again</button>
          <Link href="/" className="px-5 py-2.5 rounded-lg font-bold text-[13px] text-white border border-white/20 hover:bg-white/5">Go to dashboard</Link>
        </div>
        {error?.digest && <p className="mt-6 text-[11px] text-white/30">Reference: {error.digest}</p>}
      </div>
    </div>
  );
}
