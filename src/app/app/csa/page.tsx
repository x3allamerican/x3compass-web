/* ============================================================
   X3 COMPASS · CSA SCORES (in-app)
   ------------------------------------------------------------
   The CSA tracker lives at app.x3compass.com/csa-scores.html
   as a native static page — same pattern as the 9 hazmat
   sub-pages. Full-screen iframe avoids a dual-shell bug and
   ships pixel-identical to the canonical static reference.
   When the native React port lands, swap this iframe for a
   server-component page that pulls from compass_csa_scores.
   ============================================================ */

const TARGET = "https://app.x3compass.com/csa-scores.html";

export default function CsaScoresPage() {
  return (
    <iframe
      src={TARGET}
      title="CSA Scores"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        border: 0,
        display: "block",
        background: "#000000",
        zIndex: 100,
      }}
      loading="eager"
      allow="clipboard-read; clipboard-write"
    />
  );
}
