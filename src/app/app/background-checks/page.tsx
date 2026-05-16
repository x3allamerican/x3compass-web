"use client";

/**
 * /app/background-checks — Compass Background Checks page powered by Checkr Embeds.
 *
 * Uses Checkr's NewInvitation + ReportsOverview embeds (Web SDK v1) so we
 * don't have to build a candidate form, an invitation form, or a report
 * list view ourselves. Per Checkr API Integration Guidance v3.0:
 *
 *   "For customers implementing the full suite of Checkr Embeds, including
 *    the NewInvitation Embed and ReportsOverview Embed, the only section
 *    relevant to your integration is the 'Report Adjudication' section.
 *    Since Checkr Embeds already include both report initiation and
 *    monitoring functionality, these solutions meet the certification
 *    requirements as-is."
 *
 * Auth flow:
 *   - Embed makes POST to sessionTokenPath (/api/checkr/session-token?key=X)
 *   - Our Pages Function exchanges Compass's Secret API key for a short-lived
 *     Checkr SessionToken
 *   - Embed uses the token, refreshes automatically when expired
 *
 * NOTE: The current ADMIN_KEY gate is a v1 stopgap. When Compass v4 auth
 * (Supabase) ships, sessionTokenPath will switch to /api/checkr/session-token
 * with the user's JWT in the Authorization header and the server will verify
 * the user has permission to order checks for the carrier they're acting on.
 */

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

type CheckrEmbed = {
  render: (selector: string) => void;
  modal: (opts?: { width?: string }) => void;
  destroy?: () => void;
};

type CheckrEmbedConstructor = new (opts: Record<string, unknown>) => CheckrEmbed;

declare global {
  interface Window {
    Checkr?: {
      Embeds: {
        NewInvitation: CheckrEmbedConstructor;
        ReportsOverview: CheckrEmbedConstructor;
        DisclosureConsent: CheckrEmbedConstructor;
        SignUpFlow: CheckrEmbedConstructor;
      };
    };
  }
}

const SDK_URL = "https://cdn.jsdelivr.net/npm/@checkr/web-sdk/dist/web-sdk.umd.js";

export default function BackgroundChecksPage() {
  const [sdkReady, setSdkReady] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [lastInvitation, setLastInvitation] = useState<Record<string, unknown> | null>(null);

  const newInviteRef = useRef<HTMLDivElement>(null);
  const reportsRef = useRef<HTMLDivElement>(null);

  // Persist admin key locally
  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("x3_admin_key") : null;
    if (stored) {
      setAdminKey(stored);
      setUnlocked(true);
    }
  }, []);

  // Mount embeds once SDK is loaded + we have a key
  useEffect(() => {
    if (!sdkReady || !unlocked || !window.Checkr) return;
    if (!newInviteRef.current || !reportsRef.current) return;

    const sessionTokenPath = `/api/checkr/session-token?key=${encodeURIComponent(adminKey)}`;

    // 1) NewInvitation embed (inline, for admin / safety manager to order a check)
    const newInvite = new window.Checkr.Embeds.NewInvitation({
      sessionTokenPath,
      onInvitationSuccess: (response: Record<string, unknown>) => {
        console.log("[checkr-embed] invitation created", response);
        setLastInvitation(response);
        // Optional: persist to our vendor_orders table by hitting our /api/screenings/order
        // (skipped here because Checkr webhooks will write the row when invitation.created fires)
      },
      onInvitationError: (err: unknown) => {
        console.error("[checkr-embed] invitation failed", err);
      },
    });
    newInvite.render("#x3-checkr-new-invitation");

    // 2) ReportsOverview embed (inline, for everyone to see report status)
    const reports = new window.Checkr.Embeds.ReportsOverview({
      sessionTokenPath: `/api/checkr/session-token?key=${encodeURIComponent(adminKey)}`,
    });
    reports.render("#x3-checkr-reports-overview");

    return () => {
      newInvite.destroy?.();
      reports.destroy?.();
    };
  }, [sdkReady, unlocked, adminKey]);

  if (!unlocked) {
    return (
      <div style={{ minHeight: "100vh", background: "#0A1929", color: "white", display: "grid", placeItems: "center", padding: 24 }}>
        <div style={{ maxWidth: 420, width: "100%" }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Background Checks</h1>
          <p style={{ color: "#94A3B8", fontSize: 14, marginBottom: 24 }}>
            Powered by Checkr Embeds. Admin key required during the v1 staging window.
          </p>
          <input
            type="password"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && adminKey && unlock()}
            placeholder="Admin key"
            style={{ width: "100%", padding: "12px 14px", borderRadius: 8, background: "#0F2438", border: "1px solid #1E3556", color: "white", fontSize: 14, marginBottom: 12 }}
          />
          <button
            onClick={unlock}
            disabled={!adminKey}
            style={{ width: "100%", padding: "12px 14px", borderRadius: 8, background: "linear-gradient(135deg, #22D3EE, #06B6D4)", color: "#0A1929", fontWeight: 700, border: 0, cursor: adminKey ? "pointer" : "not-allowed", opacity: adminKey ? 1 : 0.6 }}
          >
            Unlock
          </button>
        </div>
      </div>
    );

    function unlock() {
      if (!adminKey) return;
      localStorage.setItem("x3_admin_key", adminKey);
      setUnlocked(true);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0A1929", color: "white" }}>
      <Script
        src={SDK_URL}
        strategy="afterInteractive"
        onLoad={() => setSdkReady(true)}
        onError={() => console.error("[checkr-sdk] failed to load")}
      />

      {/* Header */}
      <div style={{ background: "#091525", borderBottom: "1px solid #1E3556", padding: "18px 24px" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Background Checks</h1>
            <p style={{ fontSize: 12, color: "#94A3B8", margin: "4px 0 0 0" }}>
              FCRA-compliant driver screening · powered by Checkr
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ fontSize: 11, color: sdkReady ? "#34D399" : "#FACC15", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>
              {sdkReady ? "✓ SDK ready" : "Loading SDK…"}
            </div>
            <button
              onClick={() => { localStorage.removeItem("x3_admin_key"); setUnlocked(false); }}
              style={{ padding: "6px 12px", borderRadius: 6, background: "#0F2438", color: "#94A3B8", border: "1px solid #1E3556", fontSize: 12, cursor: "pointer" }}
            >
              Lock
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px", display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.5fr)", gap: 20 }}>
        {/* Left — Order a new check */}
        <div>
          <SectionHeading title="Order a new check" />
          <p style={{ color: "#94A3B8", fontSize: 13, marginBottom: 16 }}>
            Enter the driver&apos;s name + email. Checkr will email them a secure link to provide SSN, DOB, and consent — you never touch their PII.
          </p>
          <div style={{ background: "white", borderRadius: 12, minHeight: 480, padding: 4, overflow: "hidden" }}>
            <div id="x3-checkr-new-invitation" ref={newInviteRef} />
            {!sdkReady && <LoadingPlaceholder label="Loading Checkr NewInvitation Embed…" />}
          </div>
          {lastInvitation && (
            <div style={{ marginTop: 14, padding: 12, background: "#0F2438", border: "1px solid #34D399", borderRadius: 8, fontSize: 12 }}>
              <strong style={{ color: "#34D399" }}>✓ Invitation sent</strong>
              <pre style={{ color: "#94A3B8", fontSize: 11, marginTop: 6, overflow: "auto" }}>
                {JSON.stringify(lastInvitation, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Right — Reports overview */}
        <div>
          <SectionHeading title="All reports" />
          <p style={{ color: "#94A3B8", fontSize: 13, marginBottom: 16 }}>
            Status of every screening you&apos;ve ever ordered, with adverse-action timing, dispute status, and Assess outcomes.
          </p>
          <div style={{ background: "white", borderRadius: 12, minHeight: 560, padding: 4, overflow: "hidden" }}>
            <div id="x3-checkr-reports-overview" ref={reportsRef} />
            {!sdkReady && <LoadingPlaceholder label="Loading Checkr ReportsOverview Embed…" />}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 24px 40px" }}>
        <FCRAFooter />
      </div>
    </div>
  );
}

function SectionHeading({ title }: { title: string }) {
  return (
    <div style={{ fontSize: 11, color: "#22D3EE", fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
      {title}
    </div>
  );
}

function LoadingPlaceholder({ label }: { label: string }) {
  return (
    <div style={{ minHeight: 400, display: "grid", placeItems: "center", color: "#94A3B8", fontSize: 13 }}>
      {label}
    </div>
  );
}

function FCRAFooter() {
  return (
    <div style={{ background: "#091525", border: "1px solid #1E3556", borderRadius: 12, padding: 16, fontSize: 12, color: "#94A3B8", lineHeight: 1.6 }}>
      <strong style={{ color: "white" }}>FCRA reminder:</strong> Before ordering a consumer report on any candidate, you must (a) provide the candidate a clear and conspicuous disclosure in a standalone document, and (b) obtain written authorization. The Checkr embed above handles both via the candidate-facing flow — you do not collect this paperwork yourself. If you receive a &quot;consider&quot; result, you must follow the FCRA pre-adverse-action and post-adverse-action procedures before refusing to hire. See <a href="https://x3compass.com/legal/privacy" style={{ color: "#22D3EE" }}>our Privacy Policy</a> and 15 U.S.C. § 1681b.
    </div>
  );
}
