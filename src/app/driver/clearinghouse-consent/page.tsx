"use client";

/* ============================================================
   X3 COMPASS · DRIVER CONSENT LANDING
   ------------------------------------------------------------
   Lives at: /driver/clearinghouse-consent?cid=<consent_id>
   The email link sent by /api/clearinghouse/send-consent points here.

   Public page · no carrier auth required. The consent_id (UUID v4)
   IS the bearer · same model as Checkr's disclosure embed.

   Flow:
     1. Page mounts → GET /api/clearinghouse/consent-info?cid=...
     2. Render the consent context (who's asking, what query type)
     3. Driver types their full legal name as signature
     4. Driver checks "I agree" + clicks Sign
     5. POST /api/clearinghouse/accept-consent
     6. Render success screen with what happens next

   Edge cases handled:
     - Missing/invalid cid → ?error state
     - Already signed → "Already signed" state
     - Revoked → "Consent revoked, contact carrier" state
     - Past 24-hour deadline → still accept (federal allows it) but
       mark the response with late=true and warn

   See: /clearinghouse-vertical-memo.md · 49 CFR §382.701(a)
   ============================================================ */

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

type ConsentInfo = {
  id: string;
  consent_type: "pre_employment" | "triggered_24hr";
  consent_requested_at: string;
  consent_deadline_at: string | null;
  consent_received_at: string | null;
  carrier_name: string;
  driver_name: string;
};

function fmtDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

function ConsentPage() {
  const sp = useSearchParams();
  const cid = sp?.get("cid") || "";

  const [info, setInfo]     = useState<ConsentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [typedName, setTypedName] = useState("");
  const [agreed, setAgreed]       = useState(false);
  const [busy, setBusy]           = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [signedAt, setSignedAt]   = useState<string | null>(null);
  const [late, setLate]           = useState(false);

  useEffect(() => {
    if (!cid) {
      setLookupError("This consent link is missing the required identifier. Use the link your carrier emailed you.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/clearinghouse/consent-info?cid=${encodeURIComponent(cid)}`);
        const data = await r.json() as { ok: boolean; consent?: ConsentInfo; error?: string };
        if (cancelled) return;
        if (!data.ok || !data.consent) {
          setLookupError(data.error || "Consent not found");
        } else {
          setInfo(data.consent);
          if (data.consent.consent_received_at) {
            setSignedAt(data.consent.consent_received_at);
          }
        }
      } catch (e) {
        if (!cancelled) setLookupError(e instanceof Error ? e.message : "Network error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [cid]);

  const deadlinePast = useMemo(() => {
    if (!info?.consent_deadline_at) return false;
    return new Date(info.consent_deadline_at).getTime() < Date.now();
  }, [info]);

  const hoursLeft = useMemo(() => {
    if (!info?.consent_deadline_at) return null;
    const ms = new Date(info.consent_deadline_at).getTime() - Date.now();
    if (ms <= 0) return 0;
    return Math.max(1, Math.floor(ms / 3_600_000));
  }, [info]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!typedName.trim()) {
      setSubmitError("Type your full legal name to sign.");
      return;
    }
    if (!agreed) {
      setSubmitError("Check the agreement box to continue.");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/clearinghouse/accept-consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consent_id: cid, typed_name: typedName, agree: true }),
      });
      const data = await r.json() as { ok: boolean; error?: string; received_at?: string; late?: boolean };
      if (!data.ok) throw new Error(data.error || "Submission failed");
      setSignedAt(data.received_at || new Date().toISOString());
      setLate(!!data.late);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setBusy(false);
    }
  }

  /* ============================================================
     Render — uses the marketing-site theme tokens (not the app
     shell), so the page reads as customer-facing not internal.
     ============================================================ */

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, var(--bg) 0%, var(--bg-2) 100%)",
        color: "var(--fg)",
        padding: "32px 20px",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: 560 }}>

        {/* X3 brand header */}
        <header style={{ marginBottom: 28, textAlign: "center" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            color: "var(--accent)",
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "1.6px",
            textTransform: "uppercase",
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          }}>
            <span>X3 Compass</span> · <span>FMCSA Clearinghouse</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 900, margin: "10px 0 0", letterSpacing: "-0.5px" }}>
            Driver consent
          </h1>
        </header>

        {/* CARD */}
        <section
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: 28,
            boxShadow: "var(--card-shadow)",
          }}
        >
          {loading ? (
            <div style={{ textAlign: "center", color: "var(--fg-muted)", padding: "40px 0" }}>
              Loading consent details…
            </div>
          ) : lookupError ? (
            <ErrorState title="We couldn't load this consent" body={lookupError} />
          ) : signedAt ? (
            <SuccessState info={info!} signedAt={signedAt} late={late} />
          ) : info ? (
            <ConsentForm
              info={info}
              typedName={typedName} setTypedName={setTypedName}
              agreed={agreed} setAgreed={setAgreed}
              busy={busy}
              submitError={submitError}
              deadlinePast={deadlinePast}
              hoursLeft={hoursLeft}
              onSubmit={handleSubmit}
            />
          ) : null}
        </section>

        <footer style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: "var(--fg-faint)" }}>
          You can review your own FMCSA Clearinghouse record (free) at{" "}
          <a href="https://clearinghouse.fmcsa.dot.gov" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>
            clearinghouse.fmcsa.dot.gov
          </a>
        </footer>
      </div>
    </main>
  );
}

/* ============================================================
   ConsentForm · the actual signing UI
   ============================================================ */
function ConsentForm({
  info, typedName, setTypedName, agreed, setAgreed, busy, submitError, deadlinePast, hoursLeft, onSubmit,
}: {
  info: ConsentInfo;
  typedName: string; setTypedName: (v: string) => void;
  agreed: boolean; setAgreed: (v: boolean) => void;
  busy: boolean;
  submitError: string | null;
  deadlinePast: boolean;
  hoursLeft: number | null;
  onSubmit: (e: FormEvent) => void;
}) {
  const isTriggered = info.consent_type === "triggered_24hr";
  return (
    <form onSubmit={onSubmit}>
      {/* WHO'S ASKING */}
      <div style={{ fontSize: 13, color: "var(--fg-muted)", marginBottom: 4 }}>Requested by</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: "var(--fg)", marginBottom: 16 }}>{info.carrier_name}</div>

      {/* WHAT THIS IS */}
      {isTriggered ? (
        <div style={{
          background: deadlinePast ? "rgba(248,113,113,0.10)" : "rgba(251,191,36,0.10)",
          border: `1px solid ${deadlinePast ? "rgba(248,113,113,0.40)" : "rgba(251,191,36,0.40)"}`,
          borderRadius: 10,
          padding: "12px 14px",
          marginBottom: 18,
        }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: deadlinePast ? "var(--danger)" : "var(--warning)", marginBottom: 4 }}>
            {deadlinePast ? "Deadline passed" : `${hoursLeft}h until deadline`}
          </div>
          <div style={{ fontSize: 13, color: "var(--fg)", lineHeight: 1.5 }}>
            An annual limited query returned <strong>information</strong> on your FMCSA Clearinghouse record. Federal regulation <a href="https://www.ecfr.gov/current/title-49/section-382.701" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>49 CFR §382.701(a)(2)</a> requires your consent within 24 hours so the carrier can review the full record.
          </div>
          {deadlinePast && (
            <div style={{ fontSize: 12, color: "var(--fg-muted)", marginTop: 8 }}>
              You can still sign — the carrier will record your consent as late. Without consent, federal regulation requires the carrier to remove you from safety-sensitive functions until the query is completed.
            </div>
          )}
        </div>
      ) : (
        <div style={{
          background: "rgba(22, 199, 255,0.08)",
          border: "1px solid rgba(22, 199, 255,0.30)",
          borderRadius: 10,
          padding: "12px 14px",
          marginBottom: 18,
        }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--accent)", marginBottom: 4 }}>
            Pre-employment query
          </div>
          <div style={{ fontSize: 13, color: "var(--fg)", lineHeight: 1.5 }}>
            {info.carrier_name} would like to run an FMCSA Clearinghouse pre-employment full query as part of your hiring process. Federal regulation <a href="https://www.ecfr.gov/current/title-49/section-382.701" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>49 CFR §382.701(a)</a> requires your electronic consent.
          </div>
        </div>
      )}

      {/* WHAT WILL BE QUERIED */}
      <div style={{ fontSize: 13, color: "var(--fg-muted)", marginBottom: 12, lineHeight: 1.55 }}>
        Signing below authorizes a one-time query of your FMCSA Clearinghouse record. The query will return any positive drug or alcohol test results, refusals to test, return-to-duty status, and follow-up testing data on file. <strong>This consent applies to this query only.</strong>
      </div>

      {/* SIGNATURE INPUT */}
      <label style={{ display: "block", marginBottom: 14 }}>
        <div style={{ fontSize: 10, letterSpacing: 1.4, textTransform: "uppercase", color: "var(--fg-muted)", fontWeight: 800, marginBottom: 6 }}>
          Your full legal name (typed signature)
        </div>
        <input
          value={typedName}
          onChange={(e) => setTypedName(e.target.value)}
          placeholder={info.driver_name}
          autoComplete="name"
          disabled={busy}
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: 10,
            background: "var(--bg)",
            border: "1px solid var(--border)",
            color: "var(--fg)",
            fontSize: 15,
            fontFamily: "'Caveat', 'Brush Script MT', cursive",
            letterSpacing: "0.5px",
          }}
        />
        <div style={{ fontSize: 11, color: "var(--fg-faint)", marginTop: 4 }}>
          Must match the name on file: <strong>{info.driver_name}</strong>
        </div>
      </label>

      {/* AGREEMENT */}
      <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 18, cursor: "pointer" }}>
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          disabled={busy}
          style={{ marginTop: 2, accentColor: "var(--accent)", width: 16, height: 16 }}
        />
        <span style={{ fontSize: 13, color: "var(--fg)", lineHeight: 1.5 }}>
          I am <strong>{info.driver_name}</strong>. I consent to {info.carrier_name} running this FMCSA Clearinghouse query and understand my typed name above acts as my electronic signature.
        </span>
      </label>

      {submitError && (
        <div style={{
          background: "rgba(248,113,113,0.10)",
          border: "1px solid rgba(248,113,113,0.40)",
          color: "var(--danger)",
          borderRadius: 8,
          padding: "10px 12px",
          fontSize: 12,
          marginBottom: 14,
        }}>
          {submitError}
        </div>
      )}

      <button
        type="submit"
        disabled={busy || !agreed || !typedName.trim()}
        style={{
          width: "100%",
          padding: "14px 20px",
          borderRadius: 12,
          background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
          color: "var(--accent-fg, #001019)",
          border: 0,
          fontWeight: 800,
          fontSize: 15,
          cursor: busy ? "wait" : "pointer",
          opacity: busy || !agreed || !typedName.trim() ? 0.55 : 1,
          boxShadow: "0 8px 22px rgba(2, 6, 12, 0.55)",
        }}
      >
        {busy ? "Signing…" : "Sign + submit consent →"}
      </button>

      <div style={{ fontSize: 11, color: "var(--fg-faint)", textAlign: "center", marginTop: 12, lineHeight: 1.4 }}>
        Audit log includes signature timestamp, IP address, and browser fingerprint per 49 CFR §382.711.
      </div>
    </form>
  );
}

/* ============================================================
   SuccessState · shown after signature submitted (or if the
   consent was already signed when the page loaded).
   ============================================================ */
function SuccessState({ info, signedAt, late }: { info: ConsentInfo; signedAt: string; late: boolean }) {
  return (
    <div style={{ textAlign: "center", padding: "8px 0" }}>
      <div style={{
        width: 56, height: 56, borderRadius: 999, margin: "0 auto 16px",
        display: "grid", placeItems: "center",
        background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
        color: "var(--accent-fg, #001019)",
        fontSize: 28, fontWeight: 900,
      }}>
        ✓
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 8px" }}>Consent signed</h2>
      <p style={{ fontSize: 14, color: "var(--fg-muted)", margin: "0 0 16px", lineHeight: 1.5 }}>
        Thanks, <strong>{info.driver_name}</strong>. {info.carrier_name} has been notified that your consent was received at {fmtDateTime(signedAt)}.
      </p>
      {late && (
        <div style={{
          background: "rgba(251,191,36,0.10)",
          border: "1px solid rgba(251,191,36,0.40)",
          color: "var(--warning)",
          borderRadius: 10,
          padding: "10px 12px",
          fontSize: 12,
          textAlign: "left",
          marginBottom: 16,
        }}>
          <strong>Heads up:</strong> Your consent came in after the 24-hour deadline. Federal regulation may have required your carrier to temporarily restrict your driving until they received this. They can now proceed with the full query.
        </div>
      )}
      <div style={{
        background: "var(--bg)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: "14px 16px",
        textAlign: "left",
        fontSize: 13,
        color: "var(--fg-muted)",
        lineHeight: 1.55,
      }}>
        <strong style={{ color: "var(--fg)" }}>What happens next</strong>
        <ol style={{ margin: "8px 0 0 18px", padding: 0 }}>
          <li style={{ marginBottom: 6 }}>{info.carrier_name} runs the full query through the FMCSA Clearinghouse.</li>
          <li style={{ marginBottom: 6 }}>If your record is clean, no further action is needed.</li>
          <li>If there&apos;s information on file, {info.carrier_name} will follow up with you directly.</li>
        </ol>
      </div>
      <p style={{ fontSize: 12, color: "var(--fg-faint)", marginTop: 14 }}>
        You can close this tab. We&apos;ve emailed you a copy of this signed consent for your records.
      </p>
    </div>
  );
}

/* ============================================================
   ErrorState · 404 / 410 / network problems
   ============================================================ */
function ErrorState({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ textAlign: "center", padding: "8px 0" }}>
      <div style={{
        width: 56, height: 56, borderRadius: 999, margin: "0 auto 16px",
        display: "grid", placeItems: "center",
        background: "rgba(248,113,113,0.16)",
        color: "var(--danger)",
        fontSize: 28, fontWeight: 900,
      }}>
        !
      </div>
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 8px" }}>{title}</h2>
      <p style={{ fontSize: 14, color: "var(--fg-muted)", margin: 0, lineHeight: 1.55 }}>{body}</p>
      <p style={{ fontSize: 12, color: "var(--fg-faint)", marginTop: 18 }}>
        If this is unexpected, contact the carrier who sent you the link, or email{" "}
        <a href="mailto:support@x3compass.com" style={{ color: "var(--accent)" }}>support@x3compass.com</a>.
      </p>
    </div>
  );
}

/* ============================================================
   Default export · wrapped in Suspense because useSearchParams
   needs to suspend during initial render in Next 16 App Router.
   ============================================================ */
export default function ClearinghouseConsentLanding() {
  return (
    <Suspense fallback={<main style={{ minHeight: "100vh", background: "var(--bg)" }} />}>
      <ConsentPage />
    </Suspense>
  );
}
