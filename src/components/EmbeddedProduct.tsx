"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { getSupabase } from "@/lib/supabase";

/** Frames a standalone X3 product's /app dashboard inside Compass. Mints a one-time SSO ticket
 *  from the current Compass session so the embedded product loads already authenticated. */
export default function EmbeddedProduct({ title, crumbs, src }: { title: string; crumbs: string; src: string }) {
  const [frameSrc, setFrameSrc] = useState(src);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const host = new URL(src).hostname;
        const token = (await getSupabase().auth.getSession()).data.session?.access_token;
        if (!token) return;
        const r = await fetch(`/api/sso-issue?to=${encodeURIComponent(host)}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
        const b = await r.json() as { ok?: boolean; url?: string };
        if (!cancelled && b?.url) setFrameSrc(b.url);
      } catch { /* fall back to direct src (product's own login) */ }
    })();
    return () => { cancelled = true; };
  }, [src]);

  return (
    <AppShell title={title} crumbs={crumbs}>
      <div className="w-full" style={{ height: "calc(100vh - 128px)", minHeight: 640 }}>
        <iframe
          src={frameSrc}
          title={title}
          className="w-full h-full border-0 rounded-xl bg-white"
          allow="clipboard-read; clipboard-write; fullscreen"
          referrerPolicy="origin"
        />
      </div>
    </AppShell>
  );
}
