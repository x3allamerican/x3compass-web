"use client";
import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import Link from "next/link";
import { useUser } from "@/lib/useUser";
import { getSupabase } from "@/lib/supabase";

type CheckrEmbed = { render: (selector: string) => void; modal: (opts?: { width?: string }) => void; destroy?: () => void; };
type CheckrEmbedConstructor = new (opts: Record<string, unknown>) => CheckrEmbed;
declare global { interface Window { Checkr?: { Embeds: { NewInvitation: CheckrEmbedConstructor; ReportsOverview: CheckrEmbedConstructor; DisclosureConsent: CheckrEmbedConstructor; SignUpFlow: CheckrEmbedConstructor; } } } }

const SDK_URL = "https://cdn.jsdelivr.net/npm/@checkr/web-sdk/dist/web-sdk.umd.js";

export default function BackgroundChecksPage() {
  const { user, carrier, loading } = useUser();
  const [sdkReady, setSdkReady] = useState(false);
  const [lastInvitation, setLastInvitation] = useState<Record<string, unknown> | null>(null);
  const newInviteRef = useRef<HTMLDivElement>(null);
  const reportsRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (!loading && !user) window.location.href = "/signin?return_to=/app/background-checks"; }, [user, loading]);

  const [tokenPath, setTokenPath] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    async function compute() {
      if (!user) return;
      const sb = getSupabase();
      const { data: { session } } = await sb.auth.getSession();
      if (cancelled) return;
      if (!session?.access_token) return;
      setTokenPath(`/api/checkr/session-token?token=${encodeURIComponent(session.access_token)}`);
    }
    compute();
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    if (!sdkReady || !tokenPath || !window.Checkr) return;
    if (!newInviteRef.current || !reportsRef.current) return;
    const newInvite = new window.Checkr.Embeds.NewInvitation({
      sessionTokenPath: tokenPath,
      onInvitationSuccess: (response: Record<string, unknown>) => { setLastInvitation(response); },
      onInvitationError: (err: unknown) => console.error("[checkr-embed] invitation failed", err),
    });
    newInvite.render("#x3-checkr-new-invitation");
    const reports = new window.Checkr.Embeds.ReportsOverview({ sessionTokenPath: tokenPath });
    reports.render("#x3-checkr-reports-overview");
    return () => { newInvite.destroy?.(); reports.destroy?.(); };
  }, [sdkReady, tokenPath]);

  if (loading || !user) return <div className="min-h-screen bg-[#0A1929] grid place-items-center text-white/55">Loading…</div>;

  return (
    <div style={{ minHeight: "100vh", background: "#0A1929", color: "white" }}>
      <Script src={SDK_URL} strategy="afterInteractive" onLoad={() => setSdkReady(true)} onError={() => console.error("[checkr-sdk] failed to load")} />
      <div style={{ background: "#091525", borderBottom: "1px solid #1E3556", padding: "18px 24px" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Background Checks</h1>
            <p style={{ fontSize: 12, color: "#94A3B8", margin: "4px 0 0 0" }}>FCRA-compliant driver screening · {carrier?.name || "your carrier"} · powered by Checkr</p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ fontSize: 11, color: sdkReady ? "#34D399" : "#FACC15", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>{sdkReady ? "✓ SDK ready" : "Loading SDK…"}</div>
            <Link href="/app" style={{ padding: "6px 12px", borderRadius: 6, background: "#0F2438", color: "#94A3B8", border: "1px solid #1E3556", fontSize: 12 }}>Dashboard</Link>
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px", display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.5fr)", gap: 20 }}>
        <div>
          <div style={{ fontSize: 11, color: "#22D3EE", fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Order a new check</div>
          <p style={{ color: "#94A3B8", fontSize: 13, marginBottom: 16 }}>Enter the driver&apos;s name + email. Checkr emails them a secure link to provide SSN, DOB, consent — you never touch PII.</p>
          <div style={{ background: "white", borderRadius: 12, minHeight: 480, padding: 4, overflow: "hidden" }}>
            <div id="x3-checkr-new-invitation" ref={newInviteRef} />
            {!sdkReady && <div style={{ minHeight: 400, display: "grid", placeItems: "center", color: "#94A3B8", fontSize: 13 }}>Loading Checkr NewInvitation…</div>}
          </div>
          {lastInvitation && (
            <div style={{ marginTop: 14, padding: 12, background: "#0F2438", border: "1px solid #34D399", borderRadius: 8, fontSize: 12 }}>
              <strong style={{ color: "#34D399" }}>✓ Invitation sent</strong>
              <pre style={{ color: "#94A3B8", fontSize: 11, marginTop: 6, overflow: "auto" }}>{JSON.stringify(lastInvitation, null, 2)}</pre>
            </div>
          )}
        </div>
        <div>
          <div style={{ fontSize: 11, color: "#22D3EE", fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>All reports</div>
          <p style={{ color: "#94A3B8", fontSize: 13, marginBottom: 16 }}>Every screening status with adverse-action timing, dispute status, Assess outcomes.</p>
          <div style={{ background: "white", borderRadius: 12, minHeight: 560, padding: 4, overflow: "hidden" }}>
            <div id="x3-checkr-reports-overview" ref={reportsRef} />
            {!sdkReady && <div style={{ minHeight: 400, display: "grid", placeItems: "center", color: "#94A3B8", fontSize: 13 }}>Loading ReportsOverview…</div>}
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 24px 40px" }}>
        <div style={{ background: "#091525", border: "1px solid #1E3556", borderRadius: 12, padding: 16, fontSize: 12, color: "#94A3B8", lineHeight: 1.6 }}>
          <strong style={{ color: "white" }}>FCRA reminder:</strong> Before ordering a consumer report, provide the candidate a clear/conspicuous disclosure + obtain written authorization. The Checkr embed handles both. Follow pre-adverse + post-adverse procedures on &quot;consider&quot; results. See <a href="/faq" style={{ color: "#22D3EE" }}>FAQ</a> and 15 U.S.C. § 1681b.
        </div>
      </div>
    </div>
  );
}
