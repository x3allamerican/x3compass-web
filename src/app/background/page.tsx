"use client";

/* ============================================================
   /background · redirect to /background-checks
   ------------------------------------------------------------
   This route was an early static mockup with hard-coded screening
   rows and no Checkr integration. The wired Background Tracker
   lives at /background-checks (real Checkr NewInvitation +
   ReportsOverview embeds, Supabase vendor_orders, FCRA adverse-
   action workflow, Education Hub).

   The sidebar already points to /background-checks, but if
   anything still links to /background · older marketing
   pages, deep links, search results · bounce them to the wired
   page so users never see the dead mock again.

   Joshua: "Please remember Background Check or Tracker is
   supposed to have the Checkr embeds and the API integration."
   ============================================================ */

import { useEffect } from "react";
import Link from "next/link";

export default function BackgroundLegacyRedirect() {
  useEffect(() => {
    // Replace history entry so back button doesn't trap users here.
    window.location.replace("/background-checks");
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "var(--bg)",
        color: "var(--fg)",
        padding: "32px",
        textAlign: "center",
      }}
    >
      <div>
        <div style={{
          color: "var(--accent)",
          fontSize: 11,
          letterSpacing: "1.6px",
          fontWeight: 800,
          textTransform: "uppercase",
          marginBottom: 12,
        }}>
          Background Tracker has moved
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 900, margin: "0 0 12px" }}>
          Redirecting to the live Checkr-powered tracker…
        </h1>
        <p style={{ color: "var(--fg-muted)", margin: "0 0 24px", fontSize: 14 }}>
          If the page does not redirect automatically, click below.
        </p>
        <Link
          href="/background-checks"
          style={{
            display: "inline-block",
            padding: "12px 24px",
            borderRadius: 10,
            background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
            color: "var(--accent-fg, #001019)",
            fontWeight: 800,
            fontSize: 14,
            textDecoration: "none",
            boxShadow: "0 6px 20px rgba(2, 6, 12, 0.45)",
          }}
        >
          Open Background Tracker →
        </Link>
      </div>
    </main>
  );
}
